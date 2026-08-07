import { create } from 'zustand';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { useConversationStore } from './useConversationStore';

const useChatStore = create((set, get) => ({
  rooms: [],
  activeRoom: null,
  messages: [],
  socket: null,
  loading: false,
  allUsers: [],
  searchResults: [],
  typingUsers: {},      // { roomId: { userId: { username, timeout } } }
  onlineUsers: new Set(),
  uploadingFile: false,
  messagesCache: {},

  // ── Socket ────────────────────────────────────────────────────────────────

  initSocket: (token) => {
    if (get().socket) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', {
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected');
      // Re-join all conversations on reconnect (server handles this on connection, but this ensures re-connections work)
    });

    socket.on('connect_error', (e) => console.error('Socket error:', e.message));

    socket.on('message:new', (message) => {
      const { activeConversationId } = useConversationStore.getState();
      const { messages } = get();

      // Ensure this message belongs to the current conversation
      if (activeConversationId && message.conversation_id === activeConversationId) {
        // If message has tempId, it means we sent it and it's echoing back
        if (message.tempId) {
          set({
            messages: messages.map(m =>
              m.id === message.tempId
                ? {
                    ...m,
                    id: message.id, // Replace temp UUID with real DB UUID
                    status: 'sent',
                    timestamp: message.created_at || new Date().toISOString()
                  }
                : m
            )
          });
        } else {
          // It's a brand new message from someone else, or a normal broadcast
          // Prevent duplicates
          const exists = messages.some(m => m.id === message.id);
          if (!exists) {
            const meta = typeof message.metadata === 'string' ? JSON.parse(message.metadata) : (message.metadata || {});
            const sender = {
              name: message.senderName,
              avatar: message.senderAvatar,
              color: message.senderColorBg,
              initials: message.senderInitials
            };
            const newMessages = [...messages, {
              id: message.id,
              type: message.type || 'TEXT',
              senderId: message.sender_id,
              content: message.content,
              timestamp: message.created_at || new Date().toISOString(),
              isOwn: false,
              status: 'delivered',
              sender,
              ...meta // Spread metadata properties directly
            }];
            
            set(state => ({
              messages: newMessages,
              messagesCache: {
                ...state.messagesCache,
                [message.conversation_id]: newMessages
              }
            }));
            
            // Mark as delivered for the sender automatically
            socket.emit('message:delivered', message.id);
          }
        }
      }

      // Update room's last message preview in useConversationStore
      useConversationStore.getState().updateConversation(message.conversation_id, {
        last_message: message.content,
        last_message_at: message.created_at
      });
    });

    socket.on('message:status', ({ messageId, status }) => {
      const { messages } = get();
      set({
        messages: messages.map(m =>
          m.id === messageId
            ? { ...m, status }
            : m
        )
      });
    });

    socket.on('typing:update', ({ userId, username, isTyping, roomId }) => {
      const { typingUsers } = get();
      if (!roomId) return;
      const roomTyping = { ...(typingUsers[roomId] || {}) };
      if (isTyping) {
        // Clear old timeout
        if (roomTyping[userId]?.timeout) clearTimeout(roomTyping[userId].timeout);
        const timeout = setTimeout(() => {
          const { typingUsers: current } = get();
          const updated = { ...current };
          if (updated[roomId]) {
            delete updated[roomId][userId];
            set({ typingUsers: updated });
          }
        }, 3000);
        roomTyping[userId] = { username, timeout };
      } else {
        if (roomTyping[userId]?.timeout) clearTimeout(roomTyping[userId].timeout);
        delete roomTyping[userId];
      }
      set({ typingUsers: { ...typingUsers, [roomId]: roomTyping } });
    });

    socket.on('user:online', ({ userId, isOnline }) => {
      const onlineUsers = new Set(get().onlineUsers);
      if (isOnline) onlineUsers.add(userId);
      else onlineUsers.delete(userId);
      // Also update in room list
      const rooms = get().rooms.map(r =>
        r.otherUserId === userId ? { ...r, otherUserOnline: isOnline } : r
      );

      // Update in useConversationStore!
      const convStore = useConversationStore.getState();
      const updatedConvs = new Map(convStore.conversations);
      let changed = false;
      for (const [id, c] of updatedConvs.entries()) {
        if (c.otherUserId === userId) {
          updatedConvs.set(id, { ...c, otherUserOnline: isOnline });
          changed = true;
        }
      }
      if (changed) {
        useConversationStore.setState({ conversations: updatedConvs });
      }

      set({ onlineUsers, rooms });
    });

    socket.on('error', (msg) => console.error('Socket error event:', msg));

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  // ── Rooms ─────────────────────────────────────────────────────────────────

  fetchRooms: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/chat/rooms');
      const rooms = response.data.data || [];
      set({ rooms, loading: false });

      // Join all rooms via socket so we receive real-time messages
      const { socket } = get();
      if (socket?.connected) {
        rooms.forEach(r => socket.emit('room:join', r.id));
      }
    } catch (error) {
      console.error('Fetch rooms error:', error);
      set({ loading: false });
    }
  },

  setActiveRoom: (room) => {
    const { socket, activeRoom } = get();
    // Ensure we're joined to this room
    socket?.emit('room:join', room.id);
    set({ activeRoom: room, messages: [] });
    get().fetchMessages(room.id);
  },

  // Start or open a DM with a user
  openDM: async (targetUser) => {
    try {
      const response = await api.post('/chat/rooms/dm', { targetUserId: targetUser.id });
      const room = response.data.data;
      // Add to rooms list if not already there
      const { rooms, socket } = get();
      const exists = rooms.find(r => r.id === room.id);
      if (!exists) {
        set({ rooms: [room, ...rooms] });
      }
      // Join the new room via socket
      socket?.emit('room:join', room.id);
      get().setActiveRoom(room);
      return room;
    } catch (error) {
      console.error('Open DM error:', error);
    }
  },

  // ── Messages ──────────────────────────────────────────────────────────────

  fetchMessages: async (conversationId) => {
    const { messagesCache } = get();
    
    // Instantly load from cache if available to prevent loading spinners
    if (messagesCache[conversationId]) {
      set({ messages: messagesCache[conversationId], loading: false });
    } else {
      set({ loading: true, messages: [] });
    }

    try {
      const { socket } = get();
      if (socket) {
        socket.emit('join:conversation', conversationId);
      }
      const response = await api.get(`/chat/conversations/${conversationId}/messages`);
      const fetchedMessages = response.data.data || [];
      
      set(state => ({ 
        messages: fetchedMessages, 
        loading: false,
        messagesCache: {
          ...state.messagesCache,
          [conversationId]: fetchedMessages
        }
      }));
    } catch (error) {
      console.error('Fetch messages error:', error);
      set({ loading: false });
    }
  },

  uploadFile: async (file) => {
    set({ uploadingFile: true });
    try {
      // 1. Get signature from backend
      const { data } = await api.post('/media/signature', { folder: 'nexera/chat' });
      const { signature, timestamp, cloudName, apiKey, folder } = data.data;

      // 2. Upload to Cloudinary using their REST API directly
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('api_key', apiKey);
      formData.append('folder', folder);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
      });
      const cloudData = await res.json();
      set({ uploadingFile: false });
      return cloudData.secure_url;
    } catch (error) {
      console.error('Upload file error:', error);
      set({ uploadingFile: false });
      return null;
    }
  },

  sendMessage: async (content, type = 'TEXT', attachments = null) => {
      const { socket, messages, uploadFile } = get();
      const { activeConversationId } = useConversationStore.getState();
      
      if (!socket || !activeConversationId) return;

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 1. Handle VOICE type
      if (type === 'VOICE' && attachments?.blob) {
        const file = new File([attachments.blob], `voice-${Date.now()}.mp3`, { type: 'audio/mp3' });
        const url = await uploadFile(file);
        if (!url) return;

        const voiceMsg = {
          id: tempId,
          type: 'VOICE',
          senderId: user.id,
          content: 'Voice message',
          timestamp: new Date().toISOString(),
          isOwn: true,
          status: 'sending',
          duration: attachments.duration || 0,
          peaks: attachments.peaks || []
        };
        set({ messages: [...get().messages, voiceMsg] });

        socket.emit('message:send', {
          conversationId: activeConversationId,
          content: 'Voice message',
          type: 'VOICE',
          tempId,
          metadata: {
            url,
            duration: attachments.duration || 0,
            peaks: attachments.peaks || []
          }
        });
        return;
      }

      // 2. Handle MEDIA / attachments type
      if (type === 'MEDIA' && attachments?.items?.length > 0) {
        for (const item of attachments.items) {
          const url = await uploadFile(item.file);
          if (!url) continue;

          const isImage = item.type === 'image';
          const msgType = isImage ? 'IMAGE' : 'DOCUMENT';

          const optimisticMsg = {
            id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: msgType,
            senderId: user.id,
            content: url,
            timestamp: new Date().toISOString(),
            isOwn: true,
            status: 'sending',
            caption: item.caption,
            thumbnailUrl: url,
            fileName: item.file.name,
            mimeType: item.file.type,
            fileSize: item.file.size
          };

          set({ messages: [...get().messages, optimisticMsg] });

          socket.emit('message:send', {
            conversationId: activeConversationId,
            content: url,
            type: msgType,
            tempId: optimisticMsg.id,
            metadata: {
              caption: item.caption,
              thumbnailUrl: url,
              fileName: item.file.name,
              mimeType: item.file.type,
              fileSize: item.file.size
            }
          });
        }
        return;
      }

      // 3. Normal TEXT or REPLY
      if (content.trim()) {
        const optimisticMessage = {
          id: tempId,
          type,
          senderId: user.id,
          content: content.trim(),
          timestamp: new Date().toISOString(),
          isOwn: true,
          status: 'sending'
        };

        const newMessages = [...messages, optimisticMessage];
        set(state => ({ 
          messages: newMessages,
          messagesCache: {
            ...state.messagesCache,
            [activeConversationId]: newMessages
          }
        }));

        // Emit via socket
        socket.emit('message:send', {
          conversationId: activeConversationId,
          content: content.trim(),
          type,
          tempId
        });
      }
  },

  // ── Users ─────────────────────────────────────────────────────────────────

  fetchUsers: async () => {
    try {
      const response = await api.get('/auth/users');
      set({ allUsers: response.data.data || [] });
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  },

  searchUsers: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    try {
      const response = await api.get(`/auth/users/search?q=${encodeURIComponent(query)}`);
      set({ searchResults: response.data.data || [] });
    } catch (error) {
      console.error('Search users error:', error);
    }
  },

  clearSearch: () => set({ searchResults: [] }),

  // ── Typing ────────────────────────────────────────────────────────────────

  emitTypingStart: () => {
    const { socket } = get();
    const { activeConversationId } = useConversationStore.getState();
    if (socket && activeConversationId) socket.emit('typing:start', activeConversationId);
  },

  emitTypingStop: () => {
    const { socket } = get();
    const { activeConversationId } = useConversationStore.getState();
    if (socket && activeConversationId) socket.emit('typing:stop', activeConversationId);
  },
}));

export default useChatStore;
