import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  UploadCloud,
  FileText,
  Trash2,
  X,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  MessageSquare,
  Wand2,
  RefreshCw,
  Layers,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { aiApi } from '../../api/ai.api';

function SafeMarkdown({ content }) {
  if (!content) return null;
  try {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        className="prose prose-invert prose-sm max-w-none break-words text-slate-100"
      >
        {content}
      </ReactMarkdown>
    );
  } catch (err) {
    return <div className="whitespace-pre-wrap font-sans text-sm text-slate-100">{content}</div>;
  }
}

export default function NexeraAiPanel({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'knowledge' | 'tools'
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am **Nexera AI**, your workspace assistant. I can answer questions grounded in your uploaded documents, summarize meetings, and help you brainstorm.',
      citations: [],
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transcriptInput, setTranscriptInput] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState('');
  const [expandedCitation, setExpandedCitation] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming, isOpen, activeTab]);

  // Fetch documents when switching to knowledge tab
  useEffect(() => {
    if (activeTab === 'knowledge' && isOpen) {
      loadDocuments();
    }
  }, [activeTab, isOpen]);

  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const response = await aiApi.getDocuments();
      setDocuments(response.data?.documents || []);
    } catch (err) {
      toast.error('Failed to load indexed documents');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Dropzone file upload handler
  const onDrop = async (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const result = await aiApi.uploadDocument(file, {
        onProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      toast.success(
        `"${file.name}" indexed successfully (${result.data?.totalChunks || 1} chunks)`
      );
      loadDocuments();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
    },
  });

  const handleDeleteDocument = async (fileName) => {
    if (!window.confirm(`Delete "${fileName}" from your AI knowledge base?`)) return;
    try {
      await aiApi.deleteDocument(fileName);
      toast.success(`Deleted "${fileName}"`);
      setDocuments((prev) => prev.filter((d) => d.fileName !== fileName));
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  // Send RAG chat message with SSE streaming
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const query = inputQuery.trim();
    if (!query || isStreaming) return;

    setInputQuery('');
    const userMsg = { role: 'user', content: query };
    const initialAssistantMsg = { role: 'assistant', content: '', citations: [] };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setIsStreaming(true);

    try {
      await aiApi.streamChat({
        question: query,
        onCitations: (citations) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last) last.citations = citations;
            return updated;
          });
        },
        onToken: (token) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last) last.content += token;
            return updated;
          });
        },
        onDone: () => {
          setIsStreaming(false);
        },
        onError: (err) => {
          setIsStreaming(false);
          toast.error(err.message || 'Streaming failed');
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && !last.content) {
              last.content = '⚠️ *Sorry, I encountered an issue generating an answer. Please check your backend connection.*';
            }
            return updated;
          });
        },
      });
    } catch (err) {
      setIsStreaming(false);
      toast.error('Failed to connect to AI service');
    }
  };

  const handleSummarize = async () => {
    if (!transcriptInput.trim() || isSummarizing) return;
    setIsSummarizing(true);
    setSummaryResult('');
    try {
      const response = await aiApi.summarize(transcriptInput);
      setSummaryResult(response.data?.summary || 'No summary produced.');
      toast.success('Summary generated!');
    } catch (err) {
      toast.error(err.message || 'Summarization failed');
    } finally {
      setIsSummarizing(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] pointer-events-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col text-slate-100 font-sans z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-lg shadow-indigo-500/30 text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-base tracking-wide text-white">Nexera AI</h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                  RAG Online
                </span>
              </div>
              <p className="text-xs text-slate-400">Context-grounded workspace assistant</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close AI Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'chat'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat & RAG
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'knowledge'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Knowledge Base
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'tools'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            Summarizer
          </button>
        </div>

        {/* TAB 1: Chat & RAG */}
        {activeTab === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  } space-y-1.5`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                        : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <SafeMarkdown content={msg.content} />

                    {/* Copy Button */}
                    {msg.role === 'assistant' && msg.content && (
                      <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-end">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(msg.content, idx)}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Citations Card Drawer */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="max-w-[90%] w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-indigo-400 font-medium">
                        <Layers className="w-3.5 h-3.5" />
                        <span>{msg.citations.length} Grounded Source(s) Cited</span>
                      </div>

                      <div className="space-y-1.5">
                        {msg.citations.map((cit, cIdx) => (
                          <div
                            key={cIdx}
                            className="bg-slate-900 border border-slate-800 rounded-lg p-2 transition-all hover:border-slate-700"
                          >
                            <div
                              onClick={() =>
                                setExpandedCitation(expandedCitation === cIdx ? null : cIdx)
                              }
                              className="flex items-center justify-between cursor-pointer text-slate-300"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span className="font-medium truncate">{cit.fileName}</span>
                                <span className="text-[10px] text-slate-500">
                                  (Chunk {cit.chunkIndex + 1})
                                </span>
                              </div>
                              {expandedCitation === cIdx ? (
                                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>

                            {expandedCitation === cIdx && (
                              <div className="mt-2 pt-2 border-t border-slate-800 text-slate-400 text-[11px] font-mono leading-relaxed bg-slate-950 p-1.5 rounded">
                                {cit.preview}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isStreaming && (
                <div className="flex items-center gap-2 text-xs text-indigo-400 italic">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Nexera AI is reasoning...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick suggestions */}
            <div className="px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar border-t border-slate-800/60 bg-slate-950/40">
              <button
                type="button"
                onClick={() => setInputQuery('Summarize all key points from my uploaded documents.')}
                className="text-[11px] whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 transition-colors cursor-pointer"
              >
                📄 Summarize files
              </button>
              <button
                type="button"
                onClick={() => setInputQuery('What are the main architectural decisions in this project?')}
                className="text-[11px] whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 transition-colors cursor-pointer"
              >
                🏗️ Project architecture
              </button>
              <button
                type="button"
                onClick={() => setInputQuery('Extract all action items and next steps.')}
                className="text-[11px] whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 transition-colors cursor-pointer"
              >
                ✅ Action items
              </button>
            </div>

            {/* Input Box */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask anything about your documents or workspace..."
                  disabled={isStreaming}
                  className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isStreaming}
                  className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-colors flex-shrink-0 cursor-pointer"
                >
                  {isStreaming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        {/* TAB 2: Knowledge Base */}
        {activeTab === 'knowledge' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Upload Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-950/40'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  {isDragActive ? 'Drop file here...' : 'Click or drag documents to index'}
                </div>
                <p className="text-[11px] text-slate-500">
                  Supports PDF, Word (.docx), TXT, Markdown (.md), CSV, JSON (Max 25MB)
                </p>
              </div>
            </div>

            {isUploading && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Processing & Vectorizing Document...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Indexed Documents List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
                <span>Indexed Documents ({documents.length})</span>
                <button
                  type="button"
                  onClick={loadDocuments}
                  className="hover:text-slate-200 transition-colors p-1 cursor-pointer"
                  title="Refresh document list"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {isLoadingDocs ? (
                <div className="flex items-center justify-center p-8 text-slate-500 text-xs gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading index...</span>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center p-8 border border-slate-800 rounded-2xl bg-slate-950/30 text-slate-500 text-xs">
                  No documents uploaded yet. Drag and drop files above to ground your AI assistant!
                </div>
              ) : (
                documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="p-2 rounded-lg bg-slate-800 text-indigo-400 flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-medium text-slate-200 truncate">
                          {doc.fileName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {doc.totalChunks} chunks • {doc.fileType?.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.fileName)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10 cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Tools & Summarizer */}
        {activeTab === 'tools' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-300">
                Meeting & Transcript Summarizer
              </h3>
              <p className="text-[11px] text-slate-400">
                Paste meeting notes, chat logs, or audio transcripts to generate executive summaries, key decisions, and action items.
              </p>
              <textarea
                value={transcriptInput}
                onChange={(e) => setTranscriptInput(e.target.value)}
                placeholder="Paste conversation or transcript text here..."
                rows={6}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all resize-none"
              />
              <button
                type="button"
                onClick={handleSummarize}
                disabled={!transcriptInput.trim() || isSummarizing}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSummarizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating Summary...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Executive Summary</span>
                  </>
                )}
              </button>
            </div>

            {summaryResult && (
              <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between text-indigo-400 font-medium">
                  <span>Summary Output</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(summaryResult, 'summary')}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <SafeMarkdown content={summaryResult} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
