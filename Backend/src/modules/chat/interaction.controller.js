import { Client } from 'pg';
import 'dotenv/config';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';

const getClient = () => new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// POST /api/messages/:id/reactions
export const toggleReaction = asyncHandler(async (req, res) => {
  const { id: messageId } = req.params;
  const emoji = req.body.emoji || req.params.emoji;
  const userId = req.user.id;

  if (!emoji) throw new ApiError(400, 'Emoji is required');

  const client = getClient();
  try {
    await client.connect();

    // Check if reaction already exists
    const checkRes = await client.query(
      'SELECT 1 FROM public.message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
      [messageId, userId, emoji]
    );

    if (checkRes.rows.length > 0) {
      // Delete
      await client.query(
        'DELETE FROM public.message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
        [messageId, userId, emoji]
      );
    } else {
      // Insert
      await client.query(
        'INSERT INTO public.message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)',
        [messageId, userId, emoji]
      );
    }

    // Return the updated reactions for this message
    const reactionsRes = await client.query(
      `SELECT emoji, count(*)::int as count, array_agg(user_id) as users 
       FROM public.message_reactions 
       WHERE message_id = $1 
       GROUP BY emoji`,
      [messageId]
    );

    res.json({ success: true, reactions: reactionsRes.rows });
  } finally {
    await client.end();
  }
});

// POST /api/conversations/:id/pins
export const pinMessage = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const { messageId } = req.body;
  const userId = req.user.id;

  const client = getClient();
  try {
    await client.connect();

    await client.query(
      `INSERT INTO public.pinned_messages (conversation_id, message_id, pinned_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (conversation_id, message_id) DO NOTHING`,
      [conversationId, messageId, userId]
    );

    res.json({ success: true });
  } finally {
    await client.end();
  }
});

// DELETE /api/conversations/:id/pins/:messageId
export const unpinMessage = asyncHandler(async (req, res) => {
  const { id: conversationId, messageId } = req.params;

  const client = getClient();
  try {
    await client.connect();

    await client.query(
      `DELETE FROM public.pinned_messages 
       WHERE conversation_id = $1 AND message_id = $2`,
      [conversationId, messageId]
    );

    res.json({ success: true });
  } finally {
    await client.end();
  }
});

// POST /api/conversations/:id/read
export const markAllAsRead = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.params;
  const userId = req.user.id;

  const client = getClient();
  try {
    await client.connect();

    await client.query(
      `UPDATE public.conversation_members 
       SET unread_count = 0, last_read_at = NOW()
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );

    const messagesRes = await client.query(
      `SELECT id FROM public.messages 
       WHERE conversation_id = $1 AND sender_id != $2`,
      [conversationId, userId]
    );

    for (const msg of messagesRes.rows) {
      await client.query(
        `INSERT INTO public.message_status (message_id, user_id, status)
         VALUES ($1, $2, 'read')
         ON CONFLICT (message_id, user_id) 
         DO UPDATE SET status = 'read', updated_at = NOW()`,
        [msg.id, userId]
      );
    }

    res.json({ success: true });
  } finally {
    await client.end();
  }
});

// POST /api/polls/:id/vote
export const votePoll = asyncHandler(async (req, res) => {
  const { id: pollId } = req.params;
  const { optionId } = req.body;
  const userId = req.user.id;

  const client = getClient();
  try {
    await client.connect();

    const pollCheck = await client.query(
      `SELECT allow_multiple FROM public.polls WHERE id = $1`, [pollId]
    );
    
    if (pollCheck.rows.length > 0) {
      if (!pollCheck.rows[0].allow_multiple) {
        await client.query(
          `DELETE FROM public.poll_votes pv
           USING public.poll_options po
           WHERE pv.option_id = po.id AND po.poll_id = $1 AND pv.user_id = $2`,
          [pollId, userId]
        );
      }
    }

    await client.query(
      `INSERT INTO public.poll_votes (option_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (option_id, user_id) DO NOTHING`,
      [optionId, userId]
    );

    res.json({ success: true });
  } finally {
    await client.end();
  }
});

// GET /api/polls/:id/results
export const getPollResults = asyncHandler(async (req, res) => {
  const { id: pollId } = req.params;

  const client = getClient();
  try {
    await client.connect();

    const results = await client.query(
      `SELECT po.id as "optionId", po.text, count(pv.user_id)::int as votes, array_agg(pv.user_id) as voters
       FROM public.poll_options po
       LEFT JOIN public.poll_votes pv ON pv.option_id = po.id
       WHERE po.poll_id = $1
       GROUP BY po.id, po.text`,
      [pollId]
    );

    res.json({ results: results.rows });
  } finally {
    await client.end();
  }
});
