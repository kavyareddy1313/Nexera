import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import Room from '../../models/Room.js';
import Message from '../../models/Message.js';
import User from '../../models/User.js';
import RoomMember from '../../models/RoomMember.js';
import { Op, literal } from 'sequelize';

const router = Router();
router.use(authMiddleware);

// Get all rooms the logged-in user is a member of
router.get('/rooms', asyncHandler(async (req, res) => {
  const memberships = await RoomMember.findAll({
    where: { user_id: req.user.id },
    include: [{
      model: Room,
      include: [{
        model: RoomMember,
        include: [{ model: User, attributes: ['id', 'fullName', 'username', 'avatarUrl', 'isOnline'] }]
      }]
    }]
  });

  const rooms = memberships.map(m => {
    const room = m.Room.toJSON();
    // For DM rooms, use the other person's name/avatar
    if (room.type === 'direct') {
      const other = room.RoomMembers?.find(rm => rm.user_id !== req.user.id);
      if (other?.User) {
        room.displayName = other.User.fullName;
        room.displayUsername = other.User.username;
        room.displayAvatar = other.User.avatarUrl || `https://ui-avatars.com/api/?name=${other.User.fullName}&background=6366f1&color=fff`;
        room.otherUserId = other.User.id;
        room.otherUserOnline = other.User.isOnline;
      }
    } else {
      room.displayName = room.name;
      room.displayAvatar = room.avatar_url || `https://ui-avatars.com/api/?name=${room.name}&background=6366f1&color=fff`;
    }
    return room;
  });

  res.json(ApiResponse.ok(rooms));
}));

// Create or open a Direct Message room with another user
router.post('/rooms/dm', asyncHandler(async (req, res) => {
  const { targetUserId } = req.body;
  if (!targetUserId) throw ApiError.badRequest('targetUserId is required');

  const targetUser = await User.findByPk(targetUserId);
  if (!targetUser) throw ApiError.notFound('User not found');

  // Check if DM room already exists between the two users
  const existing = await RoomMember.findAll({
    where: { user_id: req.user.id },
    include: [{
      model: Room,
      where: { type: 'direct' },
      include: [{
        model: RoomMember,
        where: { user_id: targetUserId }
      }]
    }]
  });

  if (existing.length > 0) {
    const existingRoom = existing[0].Room;
    return res.json(ApiResponse.ok({
      id: existingRoom.id,
      type: 'direct',
      displayName: targetUser.fullName,
      displayUsername: targetUser.username,
      displayAvatar: targetUser.avatarUrl || `https://ui-avatars.com/api/?name=${targetUser.fullName}&background=6366f1&color=fff`,
      otherUserId: targetUser.id,
      otherUserOnline: targetUser.isOnline,
      last_message: existingRoom.last_message,
      last_message_at: existingRoom.last_message_at,
    }));
  }

  // Create new DM room
  const room = await Room.create({
    name: `dm-${req.user.id}-${targetUserId}`,
    type: 'direct',
  });

  await RoomMember.bulkCreate([
    { room_id: room.id, user_id: req.user.id },
    { room_id: room.id, user_id: targetUserId },
  ]);

  res.status(201).json(ApiResponse.created({
    id: room.id,
    type: 'direct',
    displayName: targetUser.fullName,
    displayUsername: targetUser.username,
    displayAvatar: targetUser.avatarUrl || `https://ui-avatars.com/api/?name=${targetUser.fullName}&background=6366f1&color=fff`,
    otherUserId: targetUser.id,
    otherUserOnline: targetUser.isOnline,
    last_message: null,
    last_message_at: null,
  }, 'DM room created'));
}));

// Get messages for a room
router.get('/rooms/:roomId/messages', asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  // Verify membership
  const member = await RoomMember.findOne({ where: { room_id: roomId, user_id: req.user.id } });
  if (!member) throw ApiError.forbidden('You are not a member of this room');

  const messages = await Message.findAll({
    where: { room_id: roomId },
    include: [{ model: User, as: 'sender', attributes: ['id', 'fullName', 'username', 'avatarUrl'] }],
    order: [['created_at', 'ASC']],
    limit: 100,
  });
  res.json(ApiResponse.ok(messages));
}));

// Send a message via REST (fallback)
router.post('/rooms/:roomId/messages', asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { content, type = 'text' } = req.body;

  const member = await RoomMember.findOne({ where: { room_id: roomId, user_id: req.user.id } });
  if (!member) throw ApiError.forbidden('You are not a member of this room');

  const message = await Message.create({
    content,
    type,
    room_id: roomId,
    sender_id: req.user.id
  });

  await Room.update(
    { last_message: content, last_message_at: new Date() },
    { where: { id: roomId } }
  );

  const full = await Message.findByPk(message.id, {
    include: [{ model: User, as: 'sender', attributes: ['id', 'fullName', 'username', 'avatarUrl'] }]
  });

  res.status(201).json(ApiResponse.created(full, 'Message sent'));
}));

// Create a group channel
router.post('/rooms/group', asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) throw ApiError.badRequest('Channel name is required');

  const cleanName = name.trim().toLowerCase().replace(/\s+/g, '-');
  const existing = await Room.findOne({ where: { name: cleanName, type: 'group' } });
  if (existing) throw ApiError.conflict('Channel with this name already exists');

  const room = await Room.create({ name: cleanName, type: 'group' });
  await RoomMember.create({ room_id: room.id, user_id: req.user.id });

  res.status(201).json(ApiResponse.created({
    id: room.id,
    name: room.name,
    type: 'group',
    displayName: room.name,
  }, 'Channel created'));
}));

export default router;
