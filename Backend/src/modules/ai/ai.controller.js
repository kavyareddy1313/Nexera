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

export class AiController {
  /**
   * Upload and ingest file (PDF, DOCX, TXT, MD, CSV, JSON) into vector knowledge base
   */
  static uploadAndIngest = asyncHandler(async (req, res) => {
    if (!req.file) {
      throw ApiError.badRequest('No file uploaded. Please attach a file.');
    }

    const { workspaceId, strategy, chunkSize, chunkOverlap } = req.body;
    const userId = req.user?.id || req.body.userId || 'anonymous_user';

    // 1. Load document via format-specific loader
    const loadedDocs = await loadDocument({
      source: req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      metadata: {
        userId,
        workspaceId: workspaceId || null,
        fileSize: req.file.size,
      },
    });

    // 2. Chunk document
    const chunks = await SplitterService.splitDocuments(loadedDocs, {
      strategy,
      chunkSize: chunkSize ? parseInt(chunkSize, 10) : undefined,
      chunkOverlap: chunkOverlap ? parseInt(chunkOverlap, 10) : undefined,
    });

    if (chunks.length === 0) {
      throw ApiError.badRequest('Document resulted in 0 indexable text chunks.');
    }

    // 3. Embed & store into Supabase pgvector
    const vectorStore = getVectorStore();
    await vectorStore.addDocuments(chunks, { userId, workspaceId });

    res.status(201).json(
      ApiResponse.created(
        {
          fileName: req.file.originalname,
          fileType: loadedDocs[0]?.metadata?.fileType,
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
   * List indexed documents for user
   */
  static listUserDocuments = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId || !supabaseAdmin) {
      return res.json(ApiResponse.ok({ documents: [] }));
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('documents')
        .select('metadata, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data) {
        return res.json(ApiResponse.ok({ documents: [] }));
      }

      // Group distinct documents by fileName
      const docMap = new Map();
      data.forEach((row) => {
        const meta = row.metadata || {};
        const fileName = meta.fileName || 'Untitled Document';
        if (!docMap.has(fileName)) {
          docMap.set(fileName, {
            fileName,
            fileType: meta.fileType || 'unknown',
            totalChunks: meta.totalChunks || 1,
            indexedAt: meta.indexedAt || row.created_at,
          });
        }
      });

      res.json(ApiResponse.ok({ documents: Array.from(docMap.values()) }));
    } catch (error) {
      res.json(ApiResponse.ok({ documents: [] }));
    }
  });

  /**
   * Delete indexed document by fileName
   */
  static deleteDocument = asyncHandler(async (req, res) => {
    const { fileName } = req.params;
    const userId = req.user?.id;

    if (!fileName) {
      throw ApiError.badRequest('fileName parameter is required.');
    }

    const vectorStore = getVectorStore();
    await vectorStore.deleteDocuments({ fileName, userId });

    res.json(ApiResponse.ok(null, `Document "${fileName}" deleted from AI knowledge base.`));
  });
}
