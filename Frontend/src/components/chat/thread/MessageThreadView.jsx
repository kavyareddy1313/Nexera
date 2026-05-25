import React, { useState, useCallback } from "react";
import { ChatHeader } from "./ChatHeader";
import { SearchPanel } from "./SearchPanel";
import { MessageList } from "./MessageList";
import { MessageContextMenu } from "./MessageContextMenu";
import { MessageInputBar } from "../input/MessageInputBar";
import { GroupInfoDrawer } from "../group/GroupInfoDrawer";
import { LiveClassModal } from "./LiveClassModal";
import { X, Forward, Star, Trash2, Copy } from "lucide-react";
import useChatStore from "../../../store/useChatStore";
import { useConversationStore } from "../../../store/useConversationStore";

const MOCK_USER = {
  id: "u2",
  name: "Priya Sharma",
  avatar: "https://i.pravatar.cc/150?u=priya",
  color: "#e11d48",
};

export function MessageThreadView() {
  // --- STATE ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    message: null,
    position: null,
  });

  const [replyMessage, setReplyMessage] = useState(null);
  const [editMessage, setEditMessage] = useState(null);

  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isLiveClassOpen, setIsLiveClassOpen] = useState(false);

  const { messages, loading, fetchMessages, sendMessage } = useChatStore();
  const { activeConversationId, conversations } = useConversationStore();

  const activeConversation = activeConversationId
    ? conversations.get(activeConversationId)
    : null;

  // Fetch messages when conversation changes
  React.useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    }
  }, [activeConversationId, fetchMessages]);

  const hasNextPage = false;
  const isFetchingNextPage = false;
  const fetchNextPage = () => {};

  // Flatten the pages into a single array of messages (no longer needed, messages is flat)

  // --- HANDLERS ---
  const handleContextMenu = useCallback((e, message) => {
    setContextMenu({
      isOpen: true,
      message,
      position: { x: e.clientX, y: e.clientY },
    });
  }, []);

  const handleAction = useCallback((action, message) => {
    if (action === "forward") {
      setIsSelectionMode(true);
      setSelectedIds(new Set([message.id]));
    } else if (action === "reply") {
      setReplyMessage(message);
      setEditMessage(null);
    } else if (action === "edit") {
      setEditMessage(message);
      setReplyMessage(null);
    } else {
      console.log(`Action ${action} on message ${message.id}`);
    }
  }, []);

  const toggleSelection = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) setIsSelectionMode(false);
      return next;
    });
  }, []);

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      
      {/* Header */}
      {!isSelectionMode ? (
        <div
          className="cursor-pointer"
          onClick={() => setIsGroupInfoOpen(true)}
        >
          <ChatHeader
            user={{
              id: activeConversation?.otherUserId || "",
              name: activeConversation?.displayName || "",
              avatar: activeConversation?.avatarUrl || "",
              color: activeConversation?.avatarColorBg || "#6366f1",
            }}
            isGroup={activeConversation?.type === "group"}
            memberCount={activeConversation?.type === "group" ? 2 : 1}
            conversationId={activeConversationId || ""}
            currentUserId={
              JSON.parse(localStorage.getItem("user") || "{}").id || ""
            }
            pinnedMessage=""
            onSearchClick={() => setIsSearchOpen(true)}
            onPinClick={() => console.log("Scroll to pinned")}
            onVideoCallClick={() => setIsLiveClassOpen(true)}
          />
        </div>
      ) : (
        /* Multi-Select Context Header */
        <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 border-b border-indigo-100 dark:border-indigo-900 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={exitSelectionMode}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-gray-600 dark:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {selectedIds.size} selected
            </span>
          </div>
          <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
            <button className="hover:text-indigo-600 transition-colors">
              <Star className="w-5 h-5" />
            </button>
            <button className="hover:text-red-500 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
            <button className="hover:text-indigo-600 transition-colors">
              <Copy className="w-5 h-5" />
            </button>
            <button className="hover:text-indigo-600 transition-colors">
              <Forward className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Search Panel */}
      <SearchPanel
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          setSearchTerm("");
        }}
        onSearch={setSearchTerm}
        matchCount={0} // To be implemented
        currentMatch={0}
        onNext={() => {}}
        onPrev={() => {}}
      />

      {loading ? (
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <MessageList
          messages={messages}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          isSelectionMode={isSelectionMode}
          selectedIds={selectedIds}
          onSelect={toggleSelection}
          onContextMenu={handleContextMenu}
          unreadCount={activeConversation?.unreadCount || 0}
        />
      )}

      {/* Context Menu Overlay */}
      <MessageContextMenu
        isOpen={contextMenu.isOpen}
        message={contextMenu.message}
        position={contextMenu.position}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        onAction={handleAction}
      />

      {/* Input Area */}
      {!isSelectionMode && (
        <MessageInputBar
          onSendMessage={(content, type, attachments) => {
            sendMessage(content, type, attachments);
            const store = useChatStore.getState();
            store.emitTypingStop();
          }}
          onEditMessage={(id, content) => console.log("Edit:", id, content)}
          replyToMessage={replyMessage}
          editMessage={editMessage}
          onCancelReplyOrEdit={() => {
            setReplyMessage(null);
            setEditMessage(null);
          }}
          emitTyping={() => {
            const store = useChatStore.getState();
            // In a real app we'd throttle this, but for now we just emit
            store.emitTypingStart();
          }}
        />
      )}

      {/* Group Info Drawer Overlay */}
      {isGroupInfoOpen && activeConversation?.type === "group" && (
        <GroupInfoDrawer
          isOpen={isGroupInfoOpen}
          onClose={() => setIsGroupInfoOpen(false)}
          groupId={activeConversation.id}
          groupName={activeConversation.displayName}
          isAdmin={true}
        />
      )}

      {/* WebRTC Live Class Modal */}
      {isLiveClassOpen && (
        <LiveClassModal 
          isOpen={isLiveClassOpen}
          onClose={() => setIsLiveClassOpen(false)}
          roomName={activeConversation?.displayName || "Course_Room"}
          user={JSON.parse(localStorage.getItem("user") || "{}")}
        />
      )}
    </div>
  );
}
