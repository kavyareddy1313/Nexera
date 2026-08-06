import React, { useState } from 'react';
import { 
  Search, 
  Video, 
  MoreVertical, 
  Phone,
  Plus, 
  Smile, 
  Send,
  Pin
} from 'lucide-react';

export function InstructorMessages() {
  const [activeTab, setActiveTab] = useState('All');
  const [inputText, setInputText] = useState('');
  
  const [chats, setChats] = useState([
    { 
      id: 1, 
      name: 'Priya Sharma', 
      initials: 'PS', 
      color: 'bg-indigo-100 text-indigo-600',
      course: 'React Masterclass',
      time: '2m', 
      unread: 2, 
      lastMsg: 'Can you explain useEffect...', 
      status: 'online', // online, away, offline
      pinned: true,
      messages: [
        { id: 1, sender: 'student', text: 'Hello Professor! I was going through the latest lecture on Hooks. Could you please clarify when exactly useEffect runs in relation to the render cycle?', time: '10:42 AM' },
        { id: 2, sender: 'instructor', text: 'Hi Priya! Great question. useEffect runs after the browser has painted the screen. It is specifically designed to handle "side effects" that don\'t block the UI rendering process.', time: '10:45 AM' },
        { id: 3, sender: 'student', text: 'That makes sense! So if I have an empty dependency array, it only runs once after the initial paint? Can you explain the cleanup function as well?', time: '10:48 AM' }
      ]
    },
    { 
      id: 2, 
      name: 'Arjun Mehta', 
      initials: 'AM',
      color: 'bg-purple-100 text-purple-600',
      course: 'Node.js Bootcamp',
      time: '1h', 
      unread: 0, 
      lastMsg: 'Assignment submitted!', 
      status: 'away',
      pinned: true,
      messages: []
    },
    { 
      id: 3, 
      name: 'Sara Wilson', 
      initials: 'SW',
      color: 'bg-pink-100 text-pink-600',
      course: 'UI/UX Design Pro',
      time: 'Yesterday', 
      unread: 0, 
      lastMsg: 'Thanks for the feedback!', 
      status: 'offline',
      pinned: false,
      messages: []
    },
    { 
      id: 4, 
      name: 'Rahul Dev', 
      initials: 'RD',
      color: 'bg-blue-100 text-blue-600',
      course: 'Python Data Science',
      time: 'Mon', 
      unread: 1, 
      lastMsg: 'Can we schedule a call?', 
      status: 'online',
      pinned: false,
      messages: []
    },
    { 
      id: 5, 
      name: 'Nina Chen', 
      initials: 'NC',
      color: 'bg-purple-100 text-purple-600',
      course: 'Full-Stack Web Dev',
      time: 'Mon', 
      unread: 0, 
      lastMsg: 'Project is almost ready', 
      status: 'online',
      pinned: false,
      messages: []
    },
  ]);

  const [activeChatId, setActiveChatId] = useState(1);

  const activeChat = chats.find(c => c.id === activeChatId);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: 'instructor',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMsg: newMessage.text,
          time: 'Just now'
        };
      }
      return chat;
    }));

    setInputText('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'online': return 'bg-emerald-500';
      case 'away': return 'bg-amber-500';
      default: return 'bg-gray-300';
    }
  };

  const pinnedChats = chats.filter(c => c.pinned);
  const recentChats = chats.filter(c => !c.pinned);

  return (
    <div className="flex flex-1 h-full bg-white overflow-hidden">
      
      {/* Left Column - Chat List */}
      <div className="w-[320px] bg-[#fafbfc] border-r border-gray-100 flex flex-col shrink-0 h-full">
        <div className="p-5 space-y-5 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search students..." 
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm"
            />
          </div>
          
          <div className="flex gap-2">
            {['All', 'Unread', 'Active', 'Archived'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-full transition-colors ${
                  activeTab === tab ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          
          {pinnedChats.length > 0 && (
            <div className="mb-4">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-5 mb-2">Pinned ({pinnedChats.length})</h3>
              <div>
                {pinnedChats.map(chat => (
                  <ChatListItem 
                    key={chat.id} 
                    chat={chat} 
                    isActive={activeChatId === chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-5 mb-2">Recent</h3>
            <div>
              {recentChats.map(chat => (
                <ChatListItem 
                  key={chat.id} 
                  chat={chat} 
                  isActive={activeChatId === chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          </div>

        </div>

        <div className="p-4 border-t border-gray-100 text-center shrink-0">
          <p className="text-[10px] font-medium text-gray-400">
            Showing 6 of 248 students · <button className="text-indigo-600 font-bold hover:underline">Filter to see more</button>
          </p>
        </div>
      </div>

      {/* Right Column - Chat Thread */}
      <div className="flex-1 flex flex-col bg-white min-w-0 h-full relative">
        
        {activeChat ? (
          <>
            {/* Thread Header */}
            <div className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0 w-full">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[15px] ${activeChat.color}`}>
                  {activeChat.initials}
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-gray-900 leading-tight mb-0.5">{activeChat.name}</h2>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(activeChat.status)}`}></div>
                    {activeChat.status.charAt(0).toUpperCase() + activeChat.status.slice(1)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <button className="text-gray-500 hover:text-gray-700 transition-colors">
                  <Video size={20} />
                </button>
                <button className="text-gray-500 hover:text-gray-700 transition-colors">
                  <Phone size={20} />
                </button>
                <button className="text-gray-500 hover:text-gray-700 transition-colors ml-2">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar flex flex-col">
              {activeChat.messages.map(msg => (
                <div key={msg.id} className={`flex flex-col max-w-[70%] ${msg.sender === 'instructor' ? 'self-end' : 'self-start'}`}>
                  <div className={`p-4 text-[14px] leading-relaxed shadow-sm ${
                    msg.sender === 'instructor' 
                      ? 'bg-[#5c4ce3] text-white rounded-2xl rounded-tr-sm' 
                      : 'bg-[#f3f4f6] text-gray-800 rounded-2xl rounded-tl-sm'
                  }`}>
                    {msg.text}
                  </div>
                  <div className={`text-[10px] font-medium text-gray-400 mt-1.5 px-1 ${msg.sender === 'instructor' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white shrink-0 w-full border-t border-gray-50">
              <div className="bg-[#f8f9fc] rounded-[2rem] p-2 flex items-center focus-within:ring-2 focus-within:ring-indigo-100 transition-all border border-gray-100">
                <button className="p-2.5 text-gray-400 hover:text-gray-600 transition-colors ml-1">
                  <Plus size={22} />
                </button>
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..." 
                  className="flex-1 bg-transparent border-none px-3 py-2 text-[14px] font-medium text-gray-800 focus:outline-none"
                />
                <button className="p-2.5 text-gray-400 hover:text-gray-600 transition-colors mr-2">
                  <Smile size={22} />
                </button>
                <button 
                  onClick={handleSendMessage}
                  className="w-10 h-10 rounded-full bg-[#5c4ce3] flex items-center justify-center text-white shadow-sm hover:bg-indigo-700 transition-colors shrink-0"
                >
                  <Send size={18} className="ml-0.5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 font-medium">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}

function ChatListItem({ chat, isActive, onClick, getStatusColor }) {
  return (
    <div 
      onClick={onClick}
      className={`relative px-5 py-3 cursor-pointer transition-colors ${
        isActive ? 'bg-indigo-50/50' : 'hover:bg-gray-50'
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#5c4ce3]"></div>
      )}
      <div className="flex gap-3">
        <div className="relative shrink-0 mt-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] ${chat.color}`}>
            {chat.initials}
          </div>
          <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${getStatusColor(chat.status)}`}></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-0.5">
            <h3 className="text-[14px] font-bold text-gray-900 truncate pr-2">{chat.name}</h3>
            <span className="text-[10px] font-semibold text-gray-400 shrink-0 mt-0.5">{chat.time}</span>
          </div>
          <div className="text-[11px] font-semibold text-indigo-600 truncate mb-1">
            {chat.course}
          </div>
          <div className="flex justify-between items-center">
            <p className={`text-[12px] truncate pr-4 ${chat.unread > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-500'}`}>
              {chat.lastMsg}
            </p>
            {chat.unread > 0 && (
              <div className="w-4 h-4 rounded-full bg-[#5c4ce3] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                {chat.unread}
              </div>
            )}
            {chat.pinned && chat.unread === 0 && (
              <Pin size={12} className="text-gray-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
