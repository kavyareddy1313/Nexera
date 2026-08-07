import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { supabaseAdmin } from '../../../config/supabaseClient.js';

/**
 * MemoryService
 * Manages conversational session memory with token budget sliding windows
 * and persistence in Supabase / Postgres.
 */
export class MemoryService {
  static localMemoryCache = new Map();

  /**
   * Get formatted chat history for a session
   * @param {string} sessionId - Conversation/session ID
   * @param {number} [maxMessages=10] - Max recent messages to retain in window
   * @returns {Promise<Array<HumanMessage|AIMessage>>}
   */
  static async getHistory(sessionId, maxMessages = 10) {
    if (!sessionId) return [];

    // Check local in-memory cache first
    let messages = this.localMemoryCache.get(sessionId) || [];

    // If empty, attempt to load from Supabase if table exists
    if (messages.length === 0 && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('ai_chat_messages')
          .select('role, content, created_at')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })
          .limit(maxMessages * 2);

        if (!error && data && data.length > 0) {
          messages = data.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));
          this.localMemoryCache.set(sessionId, messages);
        }
      } catch (err) {
        // Fallback to local memory cache on DB error
      }
    }

    // Slice to most recent window
    const recent = messages.slice(-maxMessages);

    return recent.map((msg) => {
      if (msg.role === 'user' || msg.role === 'human') {
        return new HumanMessage(msg.content);
      }
      return new AIMessage(msg.content);
    });
  }

  /**
   * Append a new turn (human question + AI answer) to session memory
   * @param {string} sessionId
   * @param {string} userQuestion
   * @param {string} aiResponse
   * @param {Object} [metadata={}]
   */
  static async addTurn(sessionId, userQuestion, aiResponse, metadata = {}) {
    if (!sessionId) return;

    const current = this.localMemoryCache.get(sessionId) || [];
    current.push(
      { role: 'user', content: userQuestion, timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }
    );

    // Keep last 30 messages in RAM
    if (current.length > 30) {
      current.splice(0, current.length - 30);
    }
    this.localMemoryCache.set(sessionId, current);

    // Asynchronously save to Supabase
    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('ai_chat_messages').insert([
          {
            session_id: sessionId,
            role: 'user',
            content: userQuestion,
            metadata,
          },
          {
            session_id: sessionId,
            role: 'assistant',
            content: aiResponse,
            metadata,
          },
        ]);
      } catch (err) {
        // Non-blocking persistence error
      }
    }
  }

  /**
   * Clear session history
   * @param {string} sessionId
   */
  static async clearSession(sessionId) {
    if (!sessionId) return;
    this.localMemoryCache.delete(sessionId);
    if (supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('ai_chat_messages')
          .delete()
          .eq('session_id', sessionId);
      } catch (err) {
        // Non-blocking
      }
    }
  }
}
