import { Router } from 'express';
import { 
  getConversations, 
  createDM, 
  createGroup, 
  getConversationDetails,
  updateConversation,
  leaveGroup,
  addMembers,
  removeMember,
  updateMembership,
  resetInviteLink,
  joinViaInvite
} from './chat.controller.js';

import {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  forwardMessage,
  toggleStar,
  searchMessages
} from './message.controller.js';

import {
  toggleReaction,
  pinMessage,
  unpinMessage,
  markAllAsRead,
  votePoll,
  getPollResults
} from './interaction.controller.js';

import {
  getStatuses,
  createStatus,
  markStatusViewed,
  deleteStatus
} from './status.controller.js';

import { uploadMedia } from './media.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// =======================
// CONVERSATIONS
// =======================
router.get('/conversations', getConversations);
router.post('/conversations/dm', createDM);
router.post('/conversations/group', createGroup);
router.get('/conversations/:id', getConversationDetails);
router.patch('/conversations/:id', updateConversation);
router.delete('/conversations/:id/leave', leaveGroup);
router.post('/conversations/:id/members', addMembers);
router.delete('/conversations/:id/members/:userId', removeMember);
router.patch('/conversations/:id/members/me', updateMembership);
router.post('/conversations/:id/invite-link/reset', resetInviteLink);
router.post('/conversations/join/:inviteLink', joinViaInvite);

// =======================
// MESSAGES
// =======================
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages', sendMessage);
router.patch('/messages/:id', editMessage);
router.delete('/messages/:id', deleteMessage);
router.post('/messages/:id/forward', forwardMessage);
router.post('/messages/:id/star', toggleStar);
router.get('/conversations/:id/messages/search', searchMessages);

// =======================
// REACTIONS & PINS & POLLS
// =======================
router.post('/messages/:id/reactions', toggleReaction); // Add/remove logic inside
router.delete('/messages/:id/reactions/:emoji', toggleReaction); // Remove specific
router.get('/conversations/:id/pins', (req, res) => res.json([])); // List pins (optional)
router.post('/conversations/:id/pins', pinMessage);
router.delete('/conversations/:id/pins/:messageId', unpinMessage);

router.post('/conversations/:id/read', markAllAsRead);

router.post('/polls/:id/vote', votePoll);
router.get('/polls/:id/results', getPollResults);

// =======================
// STATUS / STORIES
// =======================
router.get('/status', getStatuses);
router.post('/status', createStatus);
router.post('/status/:id/view', markStatusViewed);
router.delete('/status/:id', deleteStatus);

// =======================
// MEDIA UPLOAD
// =======================
// multer is handled inside the controller or as middleware before the controller
router.post('/upload', uploadMedia);

export default router;
