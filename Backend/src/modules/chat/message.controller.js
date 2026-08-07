import { Client } from 'pg';
import 'dotenv/config';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { getCache, setCache, deleteCache } from '../../config/redis.js';

const getClient = () => new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// GET /api/conversations/:id/messages
export const getMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cursor, limit = 30 } = req.query;

  const cacheKey = `messages:${id}:initial`;
  // Only use cache for the initial load (no cursor)
  if (!cursor) {
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ data: cached });
    }
  }

  const client = getClient();
  try {
    await client.connect();

    // Verify membership
    const memberCheck = await client.query(
      'SELECT 1 FROM public.conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (memberCheck.rows.length === 0) {
      throw new ApiError(403, 'Not a member of this conversation');
    }

    let query = `
      SELECT 
        m.id, m.conversation_id, m.sender_id, m.type, m.content, 
        m.metadata, m.reply_to_id, m.is_edited, m.edited_at,
        m.forwarded_from, m.created_at, m.deleted_at, m.deleted_for,
        p.full_name as sender_name, p.avatar_url as sender_avatar,
        p.avatar_color_bg as sender_color_bg, p.initials as sender_initials
      FROM public.messages m
      LEFT JOIN public.profiles p ON p.id = m.sender_id
      WHERE m.conversation_id = $1
    `;
    const params = [id];

    if (cursor) {
      query += ` AND m.created_at < $2`;
      params.push(cursor);
    }

    query += ` ORDER BY m.created_at ASC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit, 10));

    const { rows } = await client.query(query, params);

    // Format messages to match frontend Message type
    const messages = rows.map(m => {
      let meta = {};
      if (m.metadata) {
        try {
          meta = typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata;
        } catch (e) {
          console.error('Failed to parse metadata JSON:', e);
        }
      }
      return {
        id: m.id,
        type: (m.type || 'TEXT').toUpperCase(),
        senderId: m.sender_id,
        content: m.content,
        timestamp: m.created_at,
        isOwn: m.sender_id === req.user.id,
        status: 'delivered', // Messages fetched from DB are at least delivered
        isEdited: m.is_edited || false,
        sender: {
          name: m.sender_name,
          avatar: m.sender_avatar,
          color: m.sender_color_bg,
          initials: m.sender_initials,
        },
        replyTo: m.reply_to_id ? { id: m.reply_to_id } : undefined,
        metadata: m.metadata,
        ...meta // Spread metadata properties directly
      };
    });

    if (!cursor) {
      await setCache(cacheKey, messages, 60); // Cache for 60 seconds
    }

    res.json({ data: messages });
  } finally {
    await client.end();
  }
});

// POST /api/conversations/:id/messages (REST fallback, socket is primary)
export const sendMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type = 'TEXT', content, metadata, reply_to_id, temp_id } = req.body;

  const client = getClient();
  try {
    await client.connect();

    const insertRes = await client.query(`
      INSERT INTO public.messages (conversation_id, sender_id, type, content, metadata, reply_to_id)
      VALUES ($1, $2, LOWER($3), $4, $5, $6) RETURNING *
    `, [id, req.user.id, type, content?.trim() || '', metadata ? JSON.stringify(metadata) : null, reply_to_id || null]);

    const message = insertRes.rows[0];

    await client.query(`
      UPDATE public.conversations 
      SET last_message_id = $1, last_activity_at = NOW()
      WHERE id = $2
    `, [message.id, id]);

    // Invalidate message cache
    await deleteCache(`messages:${id}:initial`);
    
    // Also invalidate conversation list for members so they see the new last_message
    const memRes = await client.query('SELECT user_id FROM public.conversation_members WHERE conversation_id = $1', [id]);
    for (const m of memRes.rows) {
      await deleteCache(`conversations:${m.user_id}`);
    }

    res.status(201).json({ message: { ...message, temp_id } });
  } finally {
    await client.end();
  }
});

// PATCH /api/messages/:id
export const editMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  const client = getClient();
  try {
    await client.connect();

    const msgRes = await client.query(
      'SELECT created_at, sender_id FROM public.messages WHERE id = $1', [id]
    );
    const msg = msgRes.rows[0];
    if (!msg || msg.sender_id !== req.user.id) throw new ApiError(403, 'Cannot edit this message');
    
    const ageMins = (Date.now() - new Date(msg.created_at).getTime()) / 60000;
    if (ageMins > 15) throw new ApiError(400, 'Message is too old to edit');

    await client.query(
      'UPDATE public.messages SET content = $1, is_edited = true, edited_at = NOW() WHERE id = $2',
      [content, id]
    );

    const updated = await client.query('SELECT * FROM public.messages WHERE id = $1', [id]);
    
    // Invalidate message cache for this conversation
    const conversationId = msg.conversation_id || updated.rows[0].conversation_id;
    if (conversationId) {
      await deleteCache(`messages:${conversationId}:initial`);
    }

    res.json({ message: updated.rows[0] });
  } finally {
    await client.end();
  }
});

// DELETE /api/messages/:id
export const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { scope } = req.body; // 'me' | 'everyone'

  const client = getClient();
  try {
    await client.connect();

    if (scope === 'everyone') {
      const msgRes = await client.query(
        'SELECT sender_id FROM public.messages WHERE id = $1', [id]
      );
      if (!msgRes.rows[0] || msgRes.rows[0].sender_id !== req.user.id) {
        throw new ApiError(403, 'Not allowed');
      }
      await client.query(
        "UPDATE public.messages SET deleted_at = NOW(), deleted_for = 'everyone', type = 'deleted', content = NULL WHERE id = $1",
        [id]
      );
    } else {
      await client.query(
        "UPDATE public.messages SET deleted_for = 'me' WHERE id = $1", [id]
      );
    }

    // Attempt to invalidate cache if we can find conversation_id
    const msgInfo = await client.query('SELECT conversation_id FROM public.messages WHERE id = $1', [id]);
    if (msgInfo.rows[0]) {
      await deleteCache(`messages:${msgInfo.rows[0].conversation_id}:initial`);
    }

    res.json({ success: true });
  } finally {
    await client.end();
  }
});

// POST /api/messages/:id/forward
export const forwardMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { conversation_ids } = req.body;

  const client = getClient();
  try {
    await client.connect();

    const origRes = await client.query('SELECT * FROM public.messages WHERE id = $1', [id]);
    if (!origRes.rows[0]) throw new ApiError(404, 'Message not found');
    const original = origRes.rows[0];

    const results = [];
    for (const cid of conversation_ids) {
      const insertRes = await client.query(`
        INSERT INTO public.messages (conversation_id, sender_id, type, content, metadata, forwarded_from)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
      `, [cid, req.user.id, original.type, original.content, original.metadata, id]);
      results.push(insertRes.rows[0]);
      
      await deleteCache(`messages:${cid}:initial`);
      
      const memRes = await client.query('SELECT user_id FROM public.conversation_members WHERE conversation_id = $1', [cid]);
      for (const m of memRes.rows) {
        await deleteCache(`conversations:${m.user_id}`);
      }
    }

    res.json({ messages: results });
  } finally {
    await client.end();
  }
});

// POST /api/messages/:id/star
export const toggleStar = asyncHandler(async (req, res) => {
  res.json({ success: true });
});

// GET /api/conversations/:id/messages/search
export const searchMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { q } = req.query;

  const client = getClient();
  try {
    await client.connect();

    const { rows } = await client.query(
      `SELECT * FROM public.messages 
       WHERE conversation_id = $1 AND content ILIKE $2
       ORDER BY created_at DESC`,
      [id, `%${q}%`]
    );
    
    res.json({ messages: rows });
  } finally {
    await client.end();
  }
});
