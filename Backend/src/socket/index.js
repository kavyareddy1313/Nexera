import { Server } from 'socket.io';
import { env } from '../config/env.js';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';
import { logger } from '../middleware/requestLogger.js';
import { handleChatSocketEvents } from './chat.js';

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map();

// Ensure a "general" channel exists and add user to it
const ensureGeneralChannel = async (userId) => {
  try {
    let generalRoom = await Room.findOne({ where: { name: 'general', type: 'group' } });

    if (!generalRoom) {
      generalRoom = await Room.create({
        name: 'general',
        type: 'group',
      });
      logger.info('✅ Created #general channel');
    }

    // Check if user is already a member
    const existing = await RoomMember.findOne({
      where: { room_id: generalRoom.id, user_id: userId },
    });

    if (!existing) {
      await RoomMember.create({ room_id: generalRoom.id, user_id: userId });
      logger.info(`Added user ${userId} to #general`);
    }

    return generalRoom;
  } catch (err) {
    logger.error(`ensureGeneralChannel error: ${err.message}`);
    return null;
  }
};

export const createSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: [env.FRONTEND_URL, 'http://localhost:5173'],
      credentials: true,
    },
  });

  // Auth middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication token required'));

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
      await client.connect();
      const res = await client.query('SELECT id, full_name as "fullName", username, avatar_url as "avatarUrl" FROM public."Users" WHERE id = $1', [decoded.id]);
      await client.end();
      
      const user = res.rows[0];
      if (!user) return next(new Error('User not found'));

      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.data.user;
    const nameToLog = user.fullName || user.username || user.id;
    logger.info(`🟢 Socket connected: ${nameToLog} (${user.id})`);

    // Track online status
    const isNewConnection = !onlineUsers.has(user.id) || onlineUsers.get(user.id).size === 0;
    if (!onlineUsers.has(user.id)) onlineUsers.set(user.id, new Set());
    onlineUsers.get(user.id).add(socket.id);

    // Update online status
    try {
      const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
      await client.connect();
      await client.query("UPDATE public.profiles SET status = 'online' WHERE id = $1", [user.id]);
      
      const memberships = await client.query('SELECT conversation_id FROM public.conversation_members WHERE user_id = $1', [user.id]);
      for (const m of memberships.rows) {
        socket.join(`conv:${m.conversation_id}`);
      }
      logger.info(`${user.id} auto-joined ${memberships.rows.length} conv(s)`);
      await client.end();

      if (isNewConnection) {
        io.emit('user:online', { userId: user.id, isOnline: true });
        io.emit('presence', { userId: user.id, status: 'online' });
      }
    } catch (err) {
      logger.error(`Auto-join error: ${err.message}`);
    }

    // ─── Room Events ─────────────────────────────────────────────────────────

    socket.on('room:join', async (roomId) => {
      socket.join(`conv:${roomId}`);
      logger.info(`${user.id} joined conv:${roomId}`);
    });

    socket.on('room:leave', (roomId) => {
      socket.leave(`conv:${roomId}`);
    });

    // ─── Message Events ───────────────────────────────────────────────────────

    socket.on('message:send', async ({ conversationId, content, type = 'TEXT', tempId, metadata = null, replyToId = null }) => {
      try {
        if (!content?.trim()) return;

        const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
        await client.connect();
        
        // Verify membership
        const memberRes = await client.query('SELECT * FROM public.conversation_members WHERE conversation_id = $1 AND user_id = $2', [conversationId, user.id]);
        if (memberRes.rows.length === 0) {
          await client.end();
          socket.emit('error', 'Not a member of this conv');
          return;
        }

        // Dynamically auto-join members to the room conv:${conversationId} in real-time
        const membersRes = await client.query('SELECT user_id FROM public.conversation_members WHERE conversation_id = $1', [conversationId]);
        for (const row of membersRes.rows) {
          const sockets = onlineUsers.get(row.user_id);
          if (sockets) {
            for (const socketId of sockets) {
              const memberSocket = io.sockets.sockets.get(socketId);
              if (memberSocket) {
                memberSocket.join(`conv:${conversationId}`);
              }
            }
          }
        }

        // Persist message
        const insertRes = await client.query(`
          INSERT INTO public.messages (conversation_id, sender_id, type, content, metadata, reply_to_id)
          VALUES ($1, $2, LOWER($3), $4, $5, $6) RETURNING *
        `, [conversationId, user.id, type, content.trim(), metadata ? JSON.stringify(metadata) : null, replyToId]);
        
        const rawMessage = insertRes.rows[0];

        // Update conversation last activity
        await client.query(`
          UPDATE public.conversations 
          SET last_message_id = $1, last_activity_at = NOW()
          WHERE id = $2
        `, [rawMessage.id, conversationId]);

        // Get full message with sender profile info
        const msgRes = await client.query(`
          SELECT 
            m.*,
            p.full_name as "senderName",
            p.avatar_url as "senderAvatar",
            p.avatar_color_bg as "senderColorBg",
            p.initials as "senderInitials"
          FROM public.messages m
          LEFT JOIN public.profiles p ON p.id = m.sender_id
          WHERE m.id = $1
        `, [rawMessage.id]);
        
        const message = msgRes.rows[0];
        if (message.type) message.type = message.type.toUpperCase();

        await client.end();

        // Broadcast to everyone in the room (including sender so they get the DB id)
        io.to(`conv:${conversationId}`).emit('message:new', { ...message, tempId });
      } catch (err) {
        logger.error(`Message send error: ${err.message}`);
        socket.emit('error', 'Failed to send message');
      }
    });

    // ─── Typing Events ────────────────────────────────────────────────────────

    socket.on('typing:start', (conversationId) => {
      socket.to(`conv:${conversationId}`).emit('typing:update', {
        roomId: conversationId,
        userId: user.id,
        username: user.fullName || user.username || 'User',
        isTyping: true,
      });
    });

    socket.on('typing:stop', (conversationId) => {
      socket.to(`conv:${conversationId}`).emit('typing:update', {
        roomId: conversationId,
        userId: user.id,
        username: user.fullName || user.username || 'User',
        isTyping: false,
      });
    });

    // ─── Disconnect ───────────────────────────────────────────────────────────

    socket.on('disconnect', async () => {
      const sockets = onlineUsers.get(user.id);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(user.id);
          try {
            const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
            await client.connect();
            await client.query("UPDATE public.profiles SET status = 'offline', updated_at = NOW() WHERE id = $1", [user.id]);
            await client.end();
          } catch(e) {}
          io.emit('user:online', { userId: user.id, isOnline: false });
          io.emit('presence', { userId: user.id, status: 'offline' });
        }
      }
    });

    // Handle the new WhatsApp-parity chat events
    handleChatSocketEvents(io, socket, user);
  });

  return io;
};
