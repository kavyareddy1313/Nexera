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
import useAuthStore from "../../../store/useAuthStore";

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

  const { user } = useAuthStore();
  const currentUserId = user?.id || JSON.parse(localStorage.getItem("user") || "{}").id || "";

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

  // --- HANDLERS ---
  const handleContextMenu = useCallback((e, message) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      message,
      position: { x: e.clientX, y: e.clientY },
    });
  }, []);

  const handleAction = (action, message) => {
    if (action === "reply") {
      setReplyMessage(message);
    } else if (action === "edit") {
      setEditMessage(message);
    } else if (action === "select") {
      setIsSelectionMode(true);
      setSelectedIds(new Set([message.id]));
    }
  };

  const toggleSelection = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  return (
    <div className="flex flex-col h-full w-full bg-white relative overflow-hidden">
      {/* Header */}
      {!isSelectionMode ? (
        <div
          className="cursor-pointer"
          onClick={() => activeConversation?.type === "group" && setIsGroupInfoOpen(true)}
        >
          <ChatHeader
            user={{
              id: activeConversation?.otherUserId || "",
              name: activeConversation?.displayName || "",
              avatar: activeConversation?.avatarUrl || "",
              color: activeConversation?.avatarColorBg || "#5840D8",
            }}
            isGroup={activeConversation?.type === "group"}
            memberCount={activeConversation?.members?.length || 1}
            onlineStatus={activeConversation?.otherUserOnline ? "online" : "last seen recently"}
            conversationId={activeConversationId || ""}
            currentUserId={currentUserId}
            pinnedMessage=""
            onSearchClick={() => setIsSearchOpen(true)}
            onPinClick={() => console.log("Scroll to pinned")}
            onVideoCallClick={() => setIsLiveClassOpen(true)}
          />
        </div>
      ) : (
        /* Multi-Select Context Header */
        <div className="flex items-center justify-between px-6 py-3 bg-indigo-50 border-b border-indigo-100 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={exitSelectionMode}
              className="p-1 hover:bg-slate-200/60 rounded-full text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="font-semibold text-slate-900 text-sm">
              {selectedIds.size} selected
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <button className="p-1.5 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors">
              <Star className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:text-red-500 hover:bg-white rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors">
              <Copy className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors">
              <Forward className="w-4 h-4" />
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
        matchCount={0}
        currentMatch={0}
        onNext={() => {}}
        onPrev={() => {}}
      />

      {loading ? (
        <div className="flex-1 flex items-center justify-center bg-[#F8FAFC]">
          <div className="w-8 h-8 border-3 border-[#5840D8] border-t-transparent rounded-full animate-spin"></div>
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
            store.emitTypingStart();
          }}
        />
      )}

      {/* Group Info Drawer Overlay */}
      {isGroupInfoOpen && activeConversation?.type === "group" && (
        <GroupInfoDrawer
          isOpen={isGroupInfoOpen}
          onClose={() => setIsGroupInfoOpen(false)}
          conversation={activeConversation}
          currentUserId={currentUserId}
          isAdmin={activeConversation?.isAdmin || activeConversation?.createdBy === currentUserId}
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
