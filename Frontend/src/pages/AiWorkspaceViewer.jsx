import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, Loader2, Bot, User, Maximize2, Minimize2 } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function AiWorkspaceViewer() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Try to get document from router state, otherwise we'd fetch it (simplified here)
  const document = location.state?.document;

  const [isFullscreenDoc, setIsFullscreenDoc] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hello! I'm ready to help you analyze **${document?.filename || 'this document'}**. You can ask me to summarize it, explain concepts, or generate flashcards!` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!document) {
      toast.error("Document not found in state");
      navigate('/ai/documents');
    }
  }, [document, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const fetchStreamWithAuth = async (url, options = {}) => {
    let token = localStorage.getItem('accessToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    let response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      try {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        const refreshRes = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newToken = refreshData?.data?.accessToken;
          const newRefreshToken = refreshData?.data?.refreshToken;
          if (newToken) {
            localStorage.setItem('accessToken', newToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
            headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(url, { ...options, headers });
          }
        }
      } catch (err) {
        console.error('Refresh token failed:', err);
      }
    }

    return response;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }, { role: 'assistant', content: '' }]);
    setIsTyping(true);

    try {
      const response = await fetchStreamWithAuth(`${import.meta.env.VITE_API_URL}/ai/chat/stream`, {
        method: 'POST',
        body: JSON.stringify({
          question: userMsg,
          filter: { 
            documentId: id,
            fileUrl: document?.fileUrl,
            fileName: document?.filename,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let streamedContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') break;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'token') {
                const tokenText = data.data ?? data.content ?? data.token ?? '';
                streamedContent += tokenText;
                setMessages(prev => {
                  const updated = [...prev];
                  if (updated.length > 0) {
                    updated[updated.length - 1] = { role: 'assistant', content: streamedContent };
                  }
                  return updated;
                });
              } else if (data.type === 'error') {
                toast.error(data.message || 'Generation error');
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      toast.error('Failed to get response');
    } finally {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant' && !last.content.trim()) {
          return prev.slice(0, -1);
        }
        return prev;
      });
      setIsTyping(false);
    }
  };

  const executeAction = async (actionStr) => {
    setIsTyping(true);
    setMessages(prev => [...prev, { role: 'user', content: `Please ${actionStr.replace('_', ' ')}` }, { role: 'assistant', content: '' }]);
    
    try {
      const response = await fetchStreamWithAuth(`${import.meta.env.VITE_API_URL}/ai/document/action`, {
        method: 'POST',
        body: JSON.stringify({
          documentId: id,
          fileUrl: document?.fileUrl,
          fileName: document?.filename,
          action: actionStr
        })
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let streamedContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') break;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'token') {
                const tokenText = data.data ?? data.content ?? data.token ?? '';
                streamedContent += tokenText;
                setMessages(prev => {
                  const updated = [...prev];
                  if (updated.length > 0) {
                    updated[updated.length - 1] = { role: 'assistant', content: streamedContent };
                  }
                  return updated;
                });
              } else if (data.type === 'error') {
                toast.error(data.message || 'Generation error');
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      toast.error('Failed to execute action');
    } finally {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant' && !last.content.trim()) {
          return prev.slice(0, -1);
        }
        return prev;
      });
      setIsTyping(false);
    }
  };

  if (!document) return null;

  const baseUrl = (import.meta.env.VITE_API_URL || '').replace('/api/v1', '');
  const fileUrl = document.fileUrl?.startsWith('http') ? document.fileUrl : `${baseUrl}${document.fileUrl}`;
  const isPdf = document.filename?.toLowerCase().endsWith('.pdf');

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-[#0b1120]">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/ai/documents')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-500" />
              {document.filename}
            </h1>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => executeAction('summarize')}
            className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            Summarize
          </button>
          <button 
            onClick={() => executeAction('flashcards')}
            className="text-xs font-semibold px-3 py-1.5 bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/50 transition-colors"
          >
            Flashcards
          </button>
          <button 
            onClick={() => executeAction('mcq')}
            className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
          >
            Generate Quiz
          </button>
        </div>
      </div>

      {/* Main Workspace (Split Screen) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Document Viewer */}
        <div className={`transition-all duration-300 border-r border-gray-200 dark:border-gray-800 relative bg-gray-100 dark:bg-gray-900 flex flex-col ${isFullscreenDoc ? 'w-full' : 'w-1/2'}`}>
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button 
              onClick={() => setIsFullscreenDoc(!isFullscreenDoc)}
              className="p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors"
            >
              {isFullscreenDoc ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
          
          <div className="flex-1 w-full h-full overflow-hidden">
            {isPdf ? (
              <iframe 
                src={`${fileUrl}#toolbar=0`} 
                className="w-full h-full border-none"
                title="PDF Viewer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                Preview not available for this file type.
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: AI Chat */}
        {!isFullscreenDoc && (
          <div className="w-1/2 flex flex-col bg-white dark:bg-[#111827]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 sm:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                  }`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={18} />}
                  </div>
                  <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200/50 dark:border-gray-700/50 whitespace-pre-wrap'
                    }`}>
                      {msg.content || (isTyping && idx === messages.length - 1 ? (
                        <div className="flex items-center gap-1 h-5">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      ) : '')}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white dark:bg-[#111827] border-t border-gray-200 dark:border-gray-800 shrink-0">
              <form onSubmit={handleSend} className="relative flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Ask a question about this document..."
                  className="w-full bg-gray-100 dark:bg-gray-800/80 border-0 rounded-2xl pl-4 pr-12 py-3.5 focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 dark:text-white resize-none h-12 max-h-32 custom-scrollbar"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 bottom-1.5 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center shadow-sm"
                >
                  <Send size={16} className={isTyping ? "opacity-0" : ""} />
                  {isTyping && <Loader2 size={16} className="absolute animate-spin" />}
                </button>
              </form>
              <div className="text-center mt-2">
                <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">
                  AI can make mistakes. Check important info.
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
