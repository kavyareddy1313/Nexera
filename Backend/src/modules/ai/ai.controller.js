import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { loadDocument } from '../../services/ai/loaders/index.js';
import { SplitterService } from '../../services/ai/splitters/splitterService.js';
import { getVectorStore } from '../../services/ai/vectorstores/supabaseVectorStore.js';
import { RetrieverService } from '../../services/ai/retrievers/retrieverService.js';
import { RagChainService } from '../../services/ai/chains/ragChain.js';
import { SummarizerChainService } from '../../services/ai/chains/summarizerChain.js';
import { MemoryService } from '../../services/ai/memory/memoryService.js';
import { supabaseAdmin } from '../../config/supabaseClient.js';
import fs from 'fs';
import path from 'path';
import AiDocument from '../../models/AiDocument.js';

export class AiController {
  /**
   * Upload and ingest file (PDF, DOCX, TXT, MD, CSV, JSON) into vector knowledge base
   */
  static uploadAndIngest = asyncHandler(async (req, res) => {
    if (!req.file) {
      throw ApiError.badRequest('No file uploaded. Please attach a file.');
    }

    const { workspaceId, strategy, chunkSize, chunkOverlap } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      throw ApiError.unauthorized('User must be logged in to upload AI documents');
    }

    // 1. Save metadata into PostgreSQL (AiDocuments table)
    const fileUrl = `/uploads/ai-docs/${req.file.filename}`;
    const aiDoc = await AiDocument.create({
      userId,
      filename: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      fileUrl: fileUrl,
      workspaceId: workspaceId || null
    });

    // 2. Load document via format-specific loader
    const fileBuffer = fs.readFileSync(req.file.path);
    const loadedDocs = await loadDocument({
      source: fileBuffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      metadata: {
        userId,
        workspaceId: workspaceId || null,
        fileSize: req.file.size,
        documentId: aiDoc.id
      },
    });

    // 3. Chunk document
    const chunks = await SplitterService.splitDocuments(loadedDocs, {
      strategy,
      chunkSize: chunkSize ? parseInt(chunkSize, 10) : undefined,
      chunkOverlap: chunkOverlap ? parseInt(chunkOverlap, 10) : undefined,
    });

    if (chunks.length === 0) {
      throw ApiError.badRequest('Document resulted in 0 indexable text chunks.');
    }

    // 4. Embed & store into Supabase pgvector
    const vectorStore = getVectorStore();
    await vectorStore.addDocuments(chunks, { userId, workspaceId });

    res.status(201).json(
      ApiResponse.created(
        {
          id: aiDoc.id,
          fileName: aiDoc.filename,
          fileType: aiDoc.fileType,
          fileUrl: aiDoc.fileUrl,
          totalChunks: chunks.length,
          totalChars: loadedDocs.reduce((acc, doc) => acc + (doc.pageContent?.length || 0), 0),
          userId,
        },
        'Document successfully parsed, chunked, embedded, and indexed.'
      )
    );
  });

  /**
   * Ingest raw text or note content
   */
  static ingestRawText = asyncHandler(async (req, res) => {
    const { title, text, workspaceId, strategy } = req.body;
    if (!text || typeof text !== 'string') {
      throw ApiError.badRequest('Text content is required.');
    }

    const userId = req.user?.id || 'anonymous_user';
    const fileName = title || `note_${Date.now()}.txt`;

    const chunks = await SplitterService.splitText(
      text,
      { fileName, userId, workspaceId: workspaceId || null, fileType: 'txt' },
      { strategy }
    );

    const vectorStore = getVectorStore();
    await vectorStore.addDocuments(chunks, { userId, workspaceId });

    res.status(201).json(
      ApiResponse.created(
        {
          fileName,
          totalChunks: chunks.length,
          totalChars: text.length,
        },
        'Text note successfully indexed into AI knowledge base.'
      )
    );
  });

  /**
   * Real-time SSE streaming RAG query
   */
  static chatStream = asyncHandler(async (req, res) => {
    const { question, sessionId, workspaceId, filter = {} } = req.body;
    if (!question) {
      throw ApiError.badRequest('Question string is required.');
    }

    const userId = req.user?.id || 'anonymous_user';
    const effectiveSessionId = sessionId || `session_${userId}`;

    // Set Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const mergedFilter = {
      ...(userId ? { userId } : {}),
      ...(workspaceId ? { workspaceId } : {}),
      ...filter,
    };

    let accumulatedAnswer = '';

    try {
      const history = await MemoryService.getHistory(effectiveSessionId, 8);

      const stream = RagChainService.stream({
        question,
        chatHistory: history,
        filter: mergedFilter,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'token') {
          accumulatedAnswer += chunk.data;
        }
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      // Save turn in conversational memory
      if (accumulatedAnswer) {
        await MemoryService.addTurn(effectiveSessionId, question, accumulatedAnswer);
      }

      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    }
  });

  /**
   * Standard JSON RAG chat endpoint
   */
  static chat = asyncHandler(async (req, res) => {
    const { question, sessionId, workspaceId, filter = {} } = req.body;
    if (!question) {
      throw ApiError.badRequest('Question string is required.');
    }

    const userId = req.user?.id || 'anonymous_user';
    const effectiveSessionId = sessionId || `session_${userId}`;

    const mergedFilter = {
      ...(userId ? { userId } : {}),
      ...(workspaceId ? { workspaceId } : {}),
      ...filter,
    };

    const history = await MemoryService.getHistory(effectiveSessionId, 8);

    const result = await RagChainService.execute({
      question,
      chatHistory: history,
      filter: mergedFilter,
    });

    if (result.answer) {
      await MemoryService.addTurn(effectiveSessionId, question, result.answer);
    }

    res.json(ApiResponse.ok(result, 'AI response generated successfully.'));
  });

  /**
   * Hybrid Vector + Keyword search
   */
  static search = asyncHandler(async (req, res) => {
    const { query, k = 5, workspaceId } = req.body;
    if (!query) {
      throw ApiError.badRequest('Search query is required.');
    }

    const userId = req.user?.id;
    const filter = userId ? { userId } : {};
    if (workspaceId) filter.workspaceId = workspaceId;

    const results = await RetrieverService.hybridSearch(query, {
      k: parseInt(k, 10) || 5,
      filter,
    });

    const formatted = results.map((doc) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
    }));

    res.json(ApiResponse.ok({ results: formatted, count: formatted.length }));
  });

  /**
   * Summarize meeting or chat transcript
   */
  static summarize = asyncHandler(async (req, res) => {
    const { transcript } = req.body;
    if (!transcript) {
      throw ApiError.badRequest('Transcript text is required.');
    }

    const summary = await SummarizerChainService.summarizeTranscript(transcript);
    res.json(ApiResponse.ok({ summary }, 'Transcript summarized successfully.'));
  });

  /**
   * Pre-defined prompt actions for documents (e.g. flashcards, mcqs, summary, explain)
   */
  static documentAction = asyncHandler(async (req, res) => {
    const { documentId, action } = req.body;
    const userId = req.user?.id;

    if (!documentId || !action) {
      throw ApiError.badRequest('documentId and action are required.');
    }

    const actionPrompts = {
      summarize: 'Please provide a comprehensive summary of this document.',
      explain_beginner: 'Explain the core concepts of this document as if I am a beginner or a 10 year old.',
      explain_expert: 'Explain the core concepts of this document at an expert level.',
      key_points: 'Extract the top 10 most important key points from this document.',
      flashcards: 'Generate 10 flashcards (Question and Answer format) from this document to help me study.',
      mcq: 'Generate 5 multiple-choice questions based on this document. Include the correct answer and a brief explanation for each.',
      interview: 'Generate 5 realistic interview questions based on the concepts in this document.',
    };

    const question = actionPrompts[action] || actionPrompts.summarize;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const stream = RagChainService.stream({
        question,
        filter: { documentId, userId }
      });

      for await (const chunk of stream) {
        if (chunk.type === 'token') {
          res.write(`data: ${JSON.stringify({ type: 'token', content: chunk.data })}\n\n`);
        } else if (chunk.type === 'citations') {
          res.write(`data: ${JSON.stringify({ type: 'citations', citations: chunk.data })}\n\n`);
        } else if (chunk.type === 'done') {
          res.write(`data: [DONE]\n\n`);
        }
      }
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    }
  });

  /**
   * List indexed documents for user
   */
  static listUserDocuments = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.json(ApiResponse.ok({ documents: [] }));
    }

    try {
      const documents = await AiDocument.findAll({
        where: { userId },
        order: [['created_at', 'DESC']]
      });

      res.json(ApiResponse.ok({ documents }));
    } catch (error) {
      res.json(ApiResponse.ok({ documents: [] }));
    }
  });

  /**
   * Delete indexed document by documentId
   */
  static deleteDocument = asyncHandler(async (req, res) => {
    const { documentId } = req.params;
    const userId = req.user?.id;

    if (!documentId) {
      throw ApiError.badRequest('documentId parameter is required.');
    }

    const aiDoc = await AiDocument.findOne({ where: { id: documentId, userId } });
    if (!aiDoc) {
      throw ApiError.notFound('Document not found');
    }

    // 1. Delete physical file if it exists locally
    if (aiDoc.fileUrl) {
      const localPath = path.join(process.cwd(), aiDoc.fileUrl);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }

    // 2. Delete from AiDocuments table
    await aiDoc.destroy();

    // 3. Delete from vector store
    const vectorStore = getVectorStore();
    await vectorStore.deleteDocuments({ documentId, userId });

    res.json(ApiResponse.ok(null, `Document "${aiDoc.filename}" deleted successfully.`));
  });
}
