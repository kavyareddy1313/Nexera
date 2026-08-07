import React, { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import Fuse from "fuse.js";
import {
  MoreVertical,
  Edit,
  Search,
  X,
  Pin,
  BellOff,
  Archive,
  Image as ImageIcon,
  Users,
  Phone,
  Edit3,
  UserPlus,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { formatDistanceToNowStrict, isToday, format } from "date-fns";
import { useConversationStore } from "../../store/useConversationStore";
import { cn } from "../../lib/utils";
import { SidebarTabs } from "./sidebar/SidebarTabs";
import { StatusTab } from "./sidebar/StatusTab";
import { StoryViewer } from "./status/StoryViewer";
import { NewGroupWizard } from "./group/NewGroupWizard";
import { AddContactModal } from "./contact/AddContactModal";

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isToday(d)) return format(d, "h:mm a");
    const diffDays = (new Date().getTime() - d.getTime()) / (1000 * 3600 * 24);
    if (diffDays < 7) return formatDistanceToNowStrict(d) + " ago";
    return format(d, "M/d");
  } catch {
    return "";
  }
};

export function Sidebar() {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    searchQuery,
    setSearchQuery,
    pinnedIds,
    mutedIds,
    archivedIds,
    togglePin,
    toggleMute,
    toggleArchive,
    markAsRead,
    deleteConversation,
  } = useConversationStore();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [activeTab, setActiveTab] = useState("chats");
  const [storyViewer, setStoryViewer] = useState({
    isOpen: false,
    stories: [],
    startIndex: 0,
  });
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [searchModalQuery, setSearchModalQuery] = useState("");

  const parentRef = useRef(null);

  const allConvos = Array.from(conversations.values());

  // Search logic - only search connected/active conversations
  const fuse = useMemo(
    () =>
      new Fuse(allConvos, {
        keys: ["displayName", "last_message"],
        threshold: 0.3,
      }),
    [allConvos],
  );

  const filteredItems = useMemo(() => {
    if (!searchQuery) return allConvos;
    return fuse.search(searchQuery).map((r) => r.item);
  }, [searchQuery, allConvos, fuse]);

  // Organizing the list
  const displayList = useMemo(() => {
    const pinned = [];
    const archived = [];
    const regular = [];

    filteredItems.forEach((c) => {
      if (archivedIds.includes(c.id)) {
        archived.push(c);
      } else if (pinnedIds.includes(c.id)) {
        pinned.push(c);
      } else {
        regular.push(c);
      }
    });

    // Sort by last_message_at descending
    const sortByDate = (a, b) => {
      const dateA = a.last_message_at
        ? new Date(a.last_message_at).getTime()
        : 0;
      const dateB = b.last_message_at
        ? new Date(b.last_message_at).getTime()
        : 0;
      return dateB - dateA;
    };

    pinned.sort(sortByDate);
    regular.sort(sortByDate);
    archived.sort(sortByDate);

    return { pinned, regular, archived };
  }, [filteredItems, pinnedIds, archivedIds]);

  // Flatten for virtualizer
  const flatItems = useMemo(() => {
    const items = [];
    // Pinned
    if (displayList.pinned.length > 0) {
      displayList.pinned.forEach((c) =>
        items.push({ type: "convo", data: c, isPinned: true }),
      );
    }

    // Regular
    displayList.regular.forEach((c) => items.push({ type: "convo", data: c }));

    // Archived toggle
    if (displayList.archived.length > 0) {
      items.push({
        type: "archive-toggle",
        count: displayList.archived.length,
      });
      if (showArchived) {
        displayList.archived.forEach((c) =>
          items.push({ type: "convo", data: c }),
        );
      }
    }

    return items;
  }, [displayList, showArchived]);

  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const type = flatItems[index]?.type;
      if (type === "archive-toggle") return 48;
      return 76;
    },
  });

  const [contextMenu, setContextMenu] = useState(null);

  const handleContextMenu = (e, id) => {
    e.preventDefault();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  };

  const handleItemClick = (item) => {
    setActiveConversationId(item.data.id);
  };

  const openAddContactModal = (initialText = "") => {
    setSearchModalQuery(initialText);
    setIsAddContactOpen(true);
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent px-4 pt-5 pb-2">
      {/* Top Header */}
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Messages</span>
          {allConvos.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200/80 text-slate-600 rounded-full">
              {allConvos.length}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-1.5">
          {/* Add Contact / Search Username Button */}
          <button
            onClick={() => openAddContactModal("")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200/80 rounded-xl transition-all font-semibold text-xs shadow-xs hover:shadow-sm active:scale-95"
            title="Search by @username or add new friend"
          >
            <UserPlus size={14} strokeWidth={2.4} />
            <span>Add Friend</span>
          </button>

          {/* New Group Button */}
          <button
            onClick={() => setIsNewGroupOpen(true)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-all"
            title="Create New Group"
          >
            <Users size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      <SidebarTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "chats" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Search Bar */}
          <div className="my-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={15} className="text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-9 py-2 border border-slate-200 rounded-xl bg-white text-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all shadow-xs"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            />

            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Global User Search Suggestion Banner */}
          {searchQuery.trim() && (
            <button
              onClick={() => openAddContactModal(searchQuery)}
              className="w-full mb-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/80 rounded-xl text-left flex items-center justify-between transition-all group shadow-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-md bg-[#5840D8] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <UserPlus size={12} strokeWidth={2.5} />
                </div>
                <span className="text-xs font-semibold text-indigo-950 truncate">
                  Find on Nexera: <span className="text-[#5840D8] font-bold">"{searchQuery}"</span>
                </span>
              </div>
              <ArrowRight size={13} className="text-indigo-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-1" />
            </button>
          )}
          {/* Empty States */}
          {flatItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-dashed border-slate-200 my-2 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-[#5840D8] mb-3">
                <UserPlus size={22} strokeWidth={2.2} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                {searchQuery ? "No chats found" : "No conversations yet"}
              </h3>
              <p className="text-xs text-slate-500 max-w-[220px] mb-3 leading-relaxed">
                {searchQuery
                  ? `No active conversation matches "${searchQuery}". Connect with them to start chatting!`
                  : "Find teammates by searching their @username to start messaging!"}
              </p>
              <button
                onClick={() => openAddContactModal(searchQuery)}
                className="px-3.5 py-2 bg-[#5840D8] hover:bg-[#4830c0] text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <UserPlus size={14} />
                <span>{searchQuery ? `Search for "${searchQuery}"` : "Find Friends"}</span>
              </button>
            </div>
          ) : (
            /* Virtualized Conversation List */
            <div
              ref={parentRef}
              className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar pr-0.5"
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const item = flatItems[virtualRow.index];
                  if (!item) return null;

                  if (item.type === "archive-toggle") {
                    return (
                      <div
                        key={virtualRow.index}
                        className="absolute top-0 left-0 w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-200/70 rounded-xl transition-colors border-b border-slate-200"
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        onClick={() => setShowArchived(!showArchived)}
                      >
                        <div className="flex items-center gap-3 text-slate-600">
                          <Archive size={18} />
                          <span className="text-sm font-medium">Archived</span>
                        </div>
                        <span className="text-xs font-semibold bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                          {item.count}
                        </span>
                      </div>
                    );
                  }

                  const convo = item.data;
                  const isPinned = item.isPinned;
                  const isMuted = mutedIds.includes(convo.id);
                  const isActive = activeConversationId === convo.id;

                  return (
                    <div
                      key={virtualRow.index}
                      className={cn(
                        "absolute w-full flex items-center px-3.5 py-3 cursor-pointer transition-all group rounded-xl border",
                        isActive
                          ? "bg-indigo-50/90 border-indigo-200/90 shadow-xs ring-1 ring-indigo-500/15"
                          : "bg-white hover:bg-slate-50/90 border-slate-200/70 hover:border-slate-300 shadow-xs",
                        isPinned && !isActive && "bg-slate-50/60 border-slate-200/80",
                      )}
                      style={{
                        height: `${virtualRow.size - 6}px`,
                        top: `${virtualRow.start + 3}px`,
                      }}
                      onClick={() => handleItemClick(item)}
                      onContextMenu={(e) => handleContextMenu(e, convo.id)}
                    >
                      {/* Active Indicator Bar */}
                      {isActive && (
                        <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#5840D8] rounded-r-full" />
                      )}

                      {/* Avatar */}
                      <div className="relative flex-shrink-0 mr-3">
                        {convo.avatarUrl ? (
                          <img
                            src={convo.avatarUrl}
                            alt={convo.displayName}
                            className="w-11 h-11 rounded-full object-cover shadow-xs border border-slate-100"
                          />
                        ) : (
                          <div
                            className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shadow-xs text-white"
                            style={{
                              backgroundColor: convo.avatarColorBg || "#5840D8",
                              color: convo.avatarColorText || "#fff",
                            }}
                          >
                            {convo.initials ||
                              (convo.type === "group" ? (
                                <Users size={18} />
                              ) : (
                                getInitials(convo.displayName)
                              ))}
                          </div>
                        )}
                        {convo.otherUserOnline && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs"></div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className={cn(
                            "text-sm truncate pr-2 font-semibold",
                            isActive ? "text-slate-950 font-bold" : "text-slate-900"
                          )}>
                            {convo.displayName}
                          </h3>
                          <span className={cn(
                            "text-[11px] whitespace-nowrap font-medium",
                            isActive ? "text-indigo-600 font-semibold" : "text-slate-400"
                          )}>
                            {formatTime(convo.last_message_at)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className={cn(
                            "text-xs truncate pr-2 flex items-center gap-1 font-medium",
                            isActive ? "text-slate-700 font-medium" : "text-slate-500"
                          )}>
                            {convo.last_message?.startsWith("http") ? (
                              <>
                                <ImageIcon size={13} /> Photo
                              </>
                            ) : (
                              convo.last_message || (
                                <span className="italic text-slate-400">
                                  No messages yet
                                </span>
                              )
                            )}
                          </p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isMuted && (
                              <BellOff size={13} className="text-slate-400" />
                            )}
                            {isPinned && (
                              <Pin size={13} className="text-slate-400" />
                            )}
                            {!!convo.unreadCount && convo.unreadCount > 0 && (
                              <div className="text-[11px] font-bold min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full shadow-xs bg-[#5840D8] text-white">
                                {convo.unreadCount > 99
                                  ? "99+"
                                  : convo.unreadCount}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Context Menu */}
          {contextMenu && (
            <div
              className="fixed inset-0 z-50"
              onClick={(e) => {
                e.stopPropagation();
                setContextMenu(null);
              }}
            >
              <div
                className="absolute bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 w-48 text-sm text-gray-700 font-medium"
                style={{ top: contextMenu.y, left: contextMenu.x }}
              >
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    togglePin(contextMenu.id);
                    setContextMenu(null);
                  }}
                >
                  <Pin size={15} />
                  <span>{pinnedIds.includes(contextMenu.id) ? "Unpin" : "Pin"} chat</span>
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    toggleMute(contextMenu.id);
                    setContextMenu(null);
                  }}
                >
                  <BellOff size={15} />
                  <span>{mutedIds.includes(contextMenu.id) ? "Unmute" : "Mute"}</span>
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    markAsRead(contextMenu.id);
                    setContextMenu(null);
                  }}
                >
                  <span>Mark as read</span>
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    toggleArchive(contextMenu.id);
                    setContextMenu(null);
                  }}
                >
                  <Archive size={15} />
                  <span>{archivedIds.includes(contextMenu.id) ? "Unarchive" : "Archive"}</span>
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium"
                  onClick={() => {
                    deleteConversation(contextMenu.id);
                    setContextMenu(null);
                  }}
                >
                  <span>Delete chat</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "status" && (
        <StatusTab
          onOpenStory={(stories, startIndex) =>
            setStoryViewer({ isOpen: true, stories, startIndex })
          }
        />
      )}

      {activeTab === "calls" && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <Phone className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm font-medium">No recent calls</p>
        </div>
      )}

      {storyViewer.isOpen && (
        <StoryViewer
          stories={storyViewer.stories}
          initialStoryIndex={storyViewer.startIndex}
          onClose={() =>
            setStoryViewer({ isOpen: false, stories: [], startIndex: 0 })
          }
        />
      )}

      {/* New Group Wizard Modal */}
      <NewGroupWizard
        isOpen={isNewGroupOpen}
        onClose={() => setIsNewGroupOpen(false)}
      />

      {/* Add Contact / Search Username Modal */}
      <AddContactModal
        isOpen={isAddContactOpen}
        initialQuery={searchModalQuery}
        onClose={() => setIsAddContactOpen(false)}
      />
    </div>
  );
}
