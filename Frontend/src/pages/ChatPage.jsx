import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ChatPage.css';
import useChatStore from '../store/useChatStore';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Search, Send, X, Hash, Plus, Paperclip, Smile, LayoutDashboard, LogOut, MessageSquare, Users, ChevronDown, FileText, Download, Image as ImageIcon } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';

const formatTime = (date) => {
  if (!date) return '';
  try { return format(new Date(date), 'h:mm a'); } catch { return ''; }
};

const formatDivider = (date) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMMM d, yyyy');
  } catch {
    return '';
  }
};

const formatLastTime = (date) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    if (isToday(d)) return format(d, 'h:mm a');
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d');
  } catch {
    return '';
  }
};

const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

function stringToColor(str = '') {
  const colors = ['6366f1', '8b5cf6', 'ec4899', 'f59e0b', '10b981', '06b6d4', 'ef4444', '14b8a6', 'f97316', 'a855f7'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ── User Search Modal ─────────────────────────────────────────────────────────
const UserSearchModal = ({ onClose, onSelectUser }) => {
  const { searchResults, searchUsers, clearSearch, allUsers } = useChatStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleChange = (e) => { setQuery(e.target.value); searchUsers(e.target.value); };
  const handleSelect = (user) => { clearSearch(); onSelectUser(user); onClose(); };
  const displayList = query.trim() ? searchResults : allUsers;

  return (
    <div className="ns-overlay" onClick={onClose}>
      <div className="ns-modal" onClick={e => e.stopPropagation()}>
        <div className="ns-search-bar">
          <Search size={16} className="ns-icon" />
          <input ref={inputRef} type="text" value={query} onChange={handleChange} placeholder="Search users by name or @username..." />
          <button className="ns-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="ns-results">
          {displayList.length === 0 && (
            <p className="ns-hint">{query ? `No users found for "${query}"` : 'Start typing to find people'}</p>
          )}
          {displayList.map(user => (
            <div key={user.id} className="ns-result-item" onClick={() => handleSelect(user)}>
              <div className="ns-av" style={{ background: `#${stringToColor(user.fullName)}` }}>
                {getInitials(user.fullName)}
              </div>
              <div>
                <div className="ns-name">{user.fullName}</div>
                <div className="ns-username">@{user.username}</div>
              </div>
              <span className={`ns-dot ${user.isOnline ? 'on' : ''}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Main ChatPage ─────────────────────────────────────────────────────────────
const ChatPage = () => {
  const { user, logout } = useAuthStore();
  const {
    rooms, activeRoom, messages, typingUsers, uploadingFile,
    fetchRooms, fetchUsers, setActiveRoom, sendMessage, uploadFile,
    openDM, initSocket, disconnectSocket, emitTypingStart, emitTypingStop,
  } = useChatStore();

  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) { initSocket(token); fetchRooms(); fetchUsers(); }
    return () => disconnectSocket();
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, uploadingFile]);

  // Focus input when active room changes
  useEffect(() => { 
    if (activeRoom) {
      inputRef.current?.focus(); 
      setShowEmojiPicker(false);
    }
  }, [activeRoom]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target) && !e.target.closest('.cp-emoji-btn')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = useCallback((e) => {
    e?.preventDefault();
    if (!input.trim() || !activeRoom) return;
    sendMessage(input); 
    setInput(''); 
    setShowEmojiPicker(false);
    emitTypingStop();
    if (typingTimeout) clearTimeout(typingTimeout);
  }, [input, activeRoom, sendMessage, emitTypingStop, typingTimeout]);

  const handleInputChange = (e) => {
    setInput(e.target.value); emitTypingStart();
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => emitTypingStop(), 2000));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const onEmojiClick = (emojiObject) => {
    setInput(prev => prev + emojiObject.emoji);
    inputRef.current?.focus();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoom) return;
    
    // Reset input
    e.target.value = '';

    const isImage = file.type.startsWith('image/');
    const type = isImage ? 'image' : 'file';
    
    const url = await uploadFile(file);
    if (url) {
      sendMessage(url, type);
    }
  };

  const handleSelectUser = async (targetUser) => { await openDM(targetUser); };

  const handleLogout = async () => {
    disconnectSocket();
    await logout();
    navigate('/login');
  };

  const typingText = (() => {
    if (!activeRoom) return null;
    const names = Object.values(typingUsers[activeRoom.id] || {}).map(t => t.username);
    if (!names.length) return null;
    if (names.length === 1) return `${names[0]} is typing...`;
    return 'Several people are typing...';
  })();

  const channels = rooms.filter(r => r.type === 'group');
  const dms = rooms.filter(r => r.type === 'direct');
  const roomName = activeRoom?.displayName || activeRoom?.name || '';

  const renderMessageContent = (msg, isMe) => {
    if (msg.type === 'image') {
      return (
        <a href={msg.content} target="_blank" rel="noopener noreferrer" className="msg-img-link">
          <img src={msg.content} alt="Uploaded" className="msg-img" />
        </a>
      );
    } else if (msg.type === 'file') {
      const fileName = msg.content.split('/').pop() || 'Document';
      return (
        <a href={msg.content} target="_blank" rel="noopener noreferrer" className={`msg-file-link ${isMe ? 'me' : ''}`}>
          <div className="msg-file-icon"><FileText size={20} /></div>
          <div className="msg-file-info">
            <span className="msg-file-name">View Document</span>
            <span className="msg-file-click"><Download size={12} /> Click to download</span>
          </div>
        </a>
      );
    }
    return msg.content;
  };

  const renderMessages = () => {
    const els = []; let lastDate = null;
    messages.forEach((msg, idx) => {
      const d = formatDivider(msg.created_at);
      if (d && d !== lastDate) {
        els.push(<div key={`div-${idx}`} className="msg-date-divider"><span>{d}</span></div>);
        lastDate = d;
      }
      const isMe = msg.sender_id === user?.id;
      const sname = msg.sender?.fullName || 'User';
      
      const isMedia = msg.type === 'image' || msg.type === 'file';
      
      els.push(
        <div key={msg.id || idx} className={`msg-row ${isMe ? 'me' : ''}`}>
          {!isMe && (
            <div className="msg-av" style={{ background: `#${stringToColor(sname)}` }}>
              {getInitials(sname)}
            </div>
          )}
          <div className="msg-body">
            {!isMe && <div className="msg-meta"><span className="msg-sender">{sname}</span><span className="msg-time">{formatTime(msg.created_at)}</span></div>}
            <div className={`msg-bubble ${isMe ? 'bubble-me' : 'bubble-other'} ${isMedia ? 'bubble-media' : ''}`}>
              {renderMessageContent(msg, isMe)}
            </div>
            {isMe && <div className="msg-time-right">{formatTime(msg.created_at)}</div>}
          </div>
        </div>
      );
    });
    return els;
  };

  return (
    <div className="cp-container">
      {/* ── SIDEBAR ── */}
      <aside className={`cp-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="cp-ws-header">
          <div className="cp-ws-title-row">
            <span className="cp-ws-name">Nexera</span>
            <ChevronDown size={14} className="cp-ws-chevron" />
          </div>
          <button className="cp-new-msg-btn" onClick={() => setShowSearch(true)} title="New message">
            <Plus size={16} />
          </button>
        </div>

        <div className="cp-section-label">
          <span><Hash size={12} style={{ marginRight: 4, verticalAlign: -1 }} />Channels</span>
        </div>

        {channels.map(room => (
          <div
            key={room.id}
            className={`cp-ch-item ${activeRoom?.id === room.id ? 'active' : ''}`}
            onClick={() => setActiveRoom(room)}
          >
            <Hash size={15} className="cp-ch-hash" />
            <div className="cp-ch-info">
              <span className="cp-ch-name">{room.displayName || room.name}</span>
              {room.last_message && (
                <span className="cp-ch-preview">
                  {room.last_message.startsWith('http') ? 'Sent an attachment' : room.last_message.substring(0, 30)}
                  {room.last_message.length > 30 && !room.last_message.startsWith('http') ? '…' : ''}
                </span>
              )}
            </div>
            {room.last_message_at && <span className="cp-ch-time">{formatLastTime(room.last_message_at)}</span>}
          </div>
        ))}

        <div className="cp-section-label" style={{ marginTop: 8 }}>
          <span><MessageSquare size={12} style={{ marginRight: 4, verticalAlign: -1 }} />Direct Messages</span>
          <button className="cp-add-btn" onClick={() => setShowSearch(true)} title="Find Users"><Plus size={14} /></button>
        </div>

        {dms.map(room => (
          <div
            key={room.id}
            className={`cp-dm-item ${activeRoom?.id === room.id ? 'active' : ''}`}
            onClick={() => setActiveRoom(room)}
          >
            <div className="cp-dm-av" style={{ background: `#${stringToColor(room.displayName)}` }}>
              {getInitials(room.displayName)}
              <span className={`cp-dm-dot ${room.otherUserOnline ? 'on' : ''}`} />
            </div>
            <div className="cp-dm-info">
              <span className="cp-dm-name">{room.displayName}</span>
              {room.last_message && (
                <span className="cp-dm-preview">
                  {room.last_message.startsWith('http') ? 'Sent an attachment' : room.last_message.substring(0, 28)}
                  {room.last_message.length > 28 && !room.last_message.startsWith('http') ? '…' : ''}
                </span>
              )}
            </div>
            {room.last_message_at && <span className="cp-dm-time">{formatLastTime(room.last_message_at)}</span>}
          </div>
        ))}

        {/* Bottom user strip */}
        <div className="cp-user-strip">
          <div className="cp-user-av" style={{ background: `#${stringToColor(user?.fullName)}` }}>
            {getInitials(user?.fullName)}
            <span className="cp-dm-dot on" />
          </div>
          <div className="cp-user-info">
            <span className="cp-user-name">{user?.fullName}</span>
            <span className="cp-user-role">Online</span>
          </div>
          <button className="cp-logout-btn" onClick={handleLogout} title="Logout"><LogOut size={15} /></button>
        </div>
      </aside>

      {/* ── MAIN CHAT ── */}
      <main className="cp-main">
        {activeRoom ? (
          <>
            {/* Header */}
            <div className="cp-chat-header">
              <div className="cp-chat-title">
                {activeRoom.type === 'group'
                  ? <><Hash size={18} className="cp-chat-title-icon" /><span>{roomName}</span></>
                  : <>
                      <div className="cp-hd-av" style={{ background: `#${stringToColor(roomName)}` }}>
                        {getInitials(roomName)}
                        {activeRoom.otherUserOnline && <span className="cp-hd-online" />}
                      </div>
                      <div className="cp-hd-info">
                        <span>{roomName}</span>
                        {activeRoom.otherUserOnline !== undefined && (
                          <span className="cp-hd-status">{activeRoom.otherUserOnline ? 'Online' : 'Offline'}</span>
                        )}
                      </div>
                    </>
                }
              </div>
              <div className="cp-header-actions">
                <button className="cp-hbtn" onClick={() => setShowSearch(true)}><Users size={15} /></button>
                <button className="cp-hbtn primary" onClick={() => navigate('/dashboard')}><LayoutDashboard size={15} /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="cp-messages">
              {messages.length === 0 ? (
                <div className="cp-empty">
                  <div className="cp-empty-av" style={{ background: `#${stringToColor(roomName)}` }}>
                    {activeRoom.type === 'group' ? <Hash size={28} /> : getInitials(roomName)}
                  </div>
                  <h3>{activeRoom.type === 'group' ? `# ${roomName}` : roomName}</h3>
                  <p>{activeRoom.type === 'direct'
                    ? `This is the beginning of your conversation with ${roomName}. Say hello! 👋`
                    : `Welcome to #${roomName}! This is the start of the channel.`
                  }</p>
                </div>
              ) : renderMessages()}
              
              {uploadingFile && (
                <div className="cp-uploading-indicator">
                  <div className="cp-spinner"></div>
                  <span>Uploading file...</span>
                </div>
              )}
              
              {typingText && (
                <div className="cp-typing">
                  <span className="cp-typing-dots"><span/><span/><span/></span>
                  <span>{typingText}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="cp-input-wrap">
              <div className="cp-input-bar">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <button className="cp-icon-btn" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}>
                  <Plus size={18} />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${activeRoom.type === 'direct' ? '' : '#'}${roomName}`}
                  autoComplete="off"
                  disabled={uploadingFile}
                />
                
                {showEmojiPicker && (
                  <div className="cp-emoji-picker-container" ref={emojiPickerRef}>
                    <EmojiPicker onEmojiClick={onEmojiClick} theme="light" />
                  </div>
                )}
                
                <div className="cp-input-actions">
                  <button className="cp-icon-btn" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}>
                    <Paperclip size={17} />
                  </button>
                  <button className="cp-icon-btn cp-emoji-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    <Smile size={17} />
                  </button>
                  <button
                    className={`cp-send-btn ${input.trim() ? 'ready' : ''}`}
                    onClick={handleSend}
                    disabled={!input.trim() || uploadingFile}
                  ><Send size={15} /></button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="cp-no-chat">
            <div className="cp-no-chat-graphic">
              <MessageSquare size={56} strokeWidth={1.2} />
            </div>
            <h2>Welcome to Nexera Chat</h2>
            <p>Select a channel or direct message from the sidebar, or start a new conversation.</p>
            <button className="cp-hbtn primary" onClick={() => setShowSearch(true)}><Search size={15} /> Find People</button>
          </div>
        )}
      </main>

      {/* Search Modal */}
      {showSearch && <UserSearchModal onClose={() => setShowSearch(false)} onSelectUser={handleSelectUser} />}
    </div>
  );
};

export default ChatPage;
