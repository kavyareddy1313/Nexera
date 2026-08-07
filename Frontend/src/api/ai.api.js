import api from './axios.js';

export const aiApi = {
  /**
   * Upload and ingest a document into the AI knowledge base
   */
  async uploadDocument(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    if (options.workspaceId) formData.append('workspaceId', options.workspaceId);
    if (options.strategy) formData.append('strategy', options.strategy);
    if (options.chunkSize) formData.append('chunkSize', options.chunkSize);
    if (options.chunkOverlap) formData.append('chunkOverlap', options.chunkOverlap);

    const response = await api.post('/ai/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: options.onProgress,
    });
    return response.data;
  },

  /**
   * Ingest a raw text note or snippet
   */
  async ingestText({ title, text, workspaceId, strategy }) {
    const response = await api.post('/ai/ingest-text', {
      title,
      text,
      workspaceId,
      strategy,
    });
    return response.data;
  },

  /**
   * Send regular non-streaming chat request
   */
  async chat({ question, sessionId, workspaceId, filter }) {
    const response = await api.post('/ai/chat', {
      question,
      sessionId,
      workspaceId,
      filter,
    });
    return response.data;
  },

  /**
   * Real-time Server-Sent Events (SSE) chat stream
   */
  async streamChat({
    question,
    sessionId,
    workspaceId,
    filter,
    onCitations,
    onToken,
    onDone,
    onError,
  }) {
    const token = localStorage.getItem('accessToken');
    const baseUrl = api.defaults.baseURL || 'http://localhost:4000/api/v1';

    try {
      const response = await fetch(`${baseUrl}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ question, sessionId, workspaceId, filter }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || `HTTP ${response.status}: Stream request failed`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawData = line.replace('data: ', '').trim();
            if (!rawData) continue;

            try {
              const parsed = JSON.parse(rawData);
              if (parsed.type === 'citations' && onCitations) {
                onCitations(parsed.data);
              } else if (parsed.type === 'token' && onToken) {
                onToken(parsed.data);
              } else if (parsed.type === 'done' && onDone) {
                onDone();
              } else if (parsed.type === 'error' && onError) {
                onError(new Error(parsed.error));
              }
            } catch (parseErr) {
              console.warn('SSE JSON parse error:', parseErr);
            }
          }
        }
      }

      if (onDone) onDone();
    } catch (err) {
      if (onError) onError(err);
      else throw err;
    }
  },

  /**
   * Search knowledge base
   */
  async search({ query, k = 5, workspaceId }) {
    const response = await api.post('/ai/search', { query, k, workspaceId });
    return response.data;
  },

  /**
   * Summarize meeting or chat transcript
   */
  async summarize(transcript) {
    const response = await api.post('/ai/summarize', { transcript });
    return response.data;
  },

  /**
   * List indexed documents for current user
   */
  async getDocuments() {
    const response = await api.get('/ai/documents');
    return response.data;
  },

  /**
   * Delete indexed document by filename
   */
  async deleteDocument(fileName) {
    const response = await api.delete(`/ai/documents/${encodeURIComponent(fileName)}`);
    return response.data;
  },
};
