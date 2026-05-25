import { Client } from 'pg';
import { logger } from '../middleware/requestLogger.js';
import { env } from '../config/env.js';

const getClient = () => new Client({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export const handleChatSocketEvents = (io, socket, user) => {
  // Join a conversation room
  socket.on('join:conversation', (conversationId) => {
    socket.join(`conv:${conversationId}`);
    logger.info(`${user.id} joined conv:${conversationId}`);
  });

  // Leave a conversation room
  socket.on('leave:conversation', (conversationId) => {
    socket.leave(`conv:${conversationId}`);
    logger.info(`${user.id} left conv:${conversationId}`);
  });

  // Typing indicators
  socket.on('typing:start', (conversationId) => {
    socket.to(`conv:${conversationId}`).emit('typing', {
      conversationId,
      userId: user.id,
      displayName: user.fullName || user.id
    });
  });

  socket.on('typing:stop', (conversationId) => {
    socket.to(`conv:${conversationId}`).emit('typing', {
      conversationId,
      userId: user.id,
      isTyping: false
    });
  });

  // Message delivered acknowledgment
  socket.on('message:delivered', async (messageId) => {
    const client = getClient();
    try {
      await client.connect();

      // Upsert status
      await client.query(`
        INSERT INTO public.message_status (message_id, user_id, status)
        VALUES ($1, $2, 'delivered')
        ON CONFLICT (message_id, user_id) 
        DO UPDATE SET status = 'delivered', updated_at = NOW()
      `, [messageId, user.id]);
      
      // Get conversation_id for the message
      const msgRes = await client.query(
        'SELECT conversation_id FROM public.messages WHERE id = $1', [messageId]
      );
      
      if (msgRes.rows[0]) {
        io.to(`conv:${msgRes.rows[0].conversation_id}`).emit('message:status', {
          messageId,
          userId: user.id,
          status: 'delivered'
        });
      }
    } catch (err) {
      logger.error('Error handling message:delivered ' + err.message);
    } finally {
      await client.end();
    }
  });

  // Message read acknowledgment
  socket.on('message:read', async ({ conversationId, upToMessageId }) => {
    const client = getClient();
    try {
      await client.connect();

      await client.query(`
        INSERT INTO public.message_status (message_id, user_id, status)
        VALUES ($1, $2, 'read')
        ON CONFLICT (message_id, user_id) 
        DO UPDATE SET status = 'read', updated_at = NOW()
      `, [upToMessageId, user.id]);

      await client.query(`
        UPDATE public.conversation_members 
        SET unread_count = 0, last_read_at = NOW()
        WHERE conversation_id = $1 AND user_id = $2
      `, [conversationId, user.id]);

      io.to(`conv:${conversationId}`).emit('message:status', {
        messageId: upToMessageId,
        userId: user.id,
        status: 'read'
      });
    } catch (err) {
      logger.error('Error handling message:read ' + err.message);
    } finally {
      await client.end();
    }
  });
};
