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
  Edit3
} from "lucide-react";
import { formatDistanceToNowStrict, isToday, format } from "date-fns";
import { useConversationStore } from "../../store/useConversationStore";
import { cn } from "../../lib/utils";
import { SidebarTabs } from "./sidebar/SidebarTabs";
import { StatusTab } from "./sidebar/StatusTab";
import { StoryViewer } from "./status/StoryViewer";
import { NewGroupWizard } from "./group/NewGroupWizard";

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
    contacts,
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
    addConversation,
  } = useConversationStore();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loadingContactId, setLoadingContactId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [activeTab, setActiveTab] = useState("chats");
  const [storyViewer, setStoryViewer] = useState({
    isOpen: false,
    stories: [],
    startIndex: 0,
  });
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);

  const parentRef = useRef(null);

  const allConvos = Array.from(conversations.values());

  const searchableContacts = useMemo(
    () =>
      contacts.map((c) => ({
        isContact: true,
        id: c.id,
        type: "contact",
        displayName: c.full_name,
        avatarUrl: c.avatar_url,
        avatarColorBg: c.avatar_color_bg,
        avatarColorText: c.avatar_color_text,
        initials: c.initials,
        otherUserOnline: c.status === "online",
      })),
    [contacts],
  );

  const unchattedContacts = useMemo(() => {
    const dmUserIds = new Set(
      allConvos.filter((c) => c.type === "dm").map((c) => c.otherUserId),
    );
    return searchableContacts.filter((c) => !dmUserIds.has(c.id));
  }, [allConvos, searchableContacts]);

  const searchSource = useMemo(
    () => [...allConvos, ...unchattedContacts],
    [allConvos, unchattedContacts],
  );

  // Search logic
  const fuse = useMemo(
    () =>
      new Fuse(searchSource, {
        keys: ["displayName", "last_message"],
        threshold: 0.3,
      }),
    [searchSource],
  );

  const filteredItems = useMemo(() => {
    if (!searchQuery) return searchSource;
    return fuse.search(searchQuery).map((r) => r.item);
  }, [searchQuery, searchSource, fuse]);

  // Organizing the list
  const displayList = useMemo(() => {
    const pinned = [];
    const archived = [];
    const regular = [];
    const contactsFound = [];

    filteredItems.forEach((c) => {
      if (c.isContact) {
        contactsFound.push(c);
      } else if (archivedIds.includes(c.id)) {
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

    return { pinned, regular, archived, contacts: contactsFound };
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

    // Contacts section (below conversations)
    if (displayList.contacts.length > 0) {
      items.push({ type: "section-header", title: "Contacts" });
      displayList.contacts.forEach((c) =>
        items.push({ type: "contact", data: c }),
      );
    }

    return items;
  }, [displayList, showArchived]);

  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const type = flatItems[index].type;
      if (type === "archive-toggle" || type === "section-header") return 48;
      return 72;
    },
  });

  const [contextMenu, setContextMenu] = useState(null);

  const handleContextMenu = (e, id, isContact) => {
    if (isContact) return; // No context menu for contacts
    e.preventDefault();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  };

  const handleItemClick = async (item) => {
    if (item.type === "contact") {
      try {
        setLoadingContactId(item.data.id);
        const token = localStorage.getItem("accessToken");
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1"}/chat/conversations/dm`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ otherUserId: item.data.id }),
          },
        );
        const data = await res.json();
        if (data.conversation?.id) {
          addConversation(data.conversation);
          setActiveConversationId(data.conversation.id);
          setSearchQuery("");
        }
      } catch (e) {
        console.error("Failed to create DM:", e);
      } finally {
        setLoadingContactId(null);
      }
    } else {
      setActiveConversationId(item.data.id);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent px-4 pt-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
        <button
          onClick={() => setIsNewGroupOpen(true)}
          className="text-gray-500 hover:text-gray-800 transition-colors"
          title="New Message"
        >
          <Edit3 size={20} strokeWidth={2.5} />
        </button>
      </div>

      {activeTab === "chats" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Search Bar */}
          <div className="mb-6 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-10 py-3 border border-gray-100 rounded-full bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            />

            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Conversation List */}
          <div
            ref={parentRef}
            className="flex-1 overflow-y-auto overflow-x-hidden relative"
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

                if (item.type === "archive-toggle") {
                  return (
                    <div
                      key={virtualRow.index}
                      className="absolute top-0 left-0 w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      onClick={() => setShowArchived(!showArchived)}
                    >
                      <div className="flex items-center gap-3 text-gray-500">
                        <Archive size={18} />
                        <span className="text-sm font-medium">Archived</span>
                      </div>
                      <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                        {item.count}
                      </span>
                    </div>
                  );
                }

                if (item.type === "section-header") {
                  return (
                    <div
                      key={virtualRow.index}
                      className="absolute top-0 left-0 w-full flex items-center px-4 py-2 bg-gray-50 border-b border-gray-100"
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {item.title}
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
                      "absolute w-full flex items-center px-4 py-3 cursor-pointer transition-all group rounded-xl",
                      isActive ? "bg-white shadow-sm" : "hover:bg-gray-100/50",
                      isPinned && !isActive && "bg-indigo-50/30",
                    )}
                    style={{
                      height: `${virtualRow.size - 8}px`,
                      top: `${virtualRow.start + 4}px`,
                    }}
                    onClick={() => handleItemClick(item)}
                    onContextMenu={(e) =>
                      handleContextMenu(e, convo.id, item.type === "contact")
                    }
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0 mr-3">
                      {convo.avatarUrl ? (
                        <img
                          src={convo.avatarUrl}
                          alt={convo.displayName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                          style={{
                            backgroundColor: convo.avatarColorBg || "#6366f1",
                            color: convo.avatarColorText || "#fff",
                          }}
                        >
                          {convo.initials ||
                            (convo.type === "group" ? (
                              <Users size={20} />
                            ) : (
                              getInitials(convo.displayName)
                            ))}
                        </div>
                      )}
                      {convo.otherUserOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate pr-2">
                          {convo.displayName}
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTime(convo.last_message_at)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500 truncate pr-2 flex items-center gap-1">
                          {convo.last_message?.startsWith("http") ? (
                            <>
                              <ImageIcon size={14} /> Photo
                            </>
                          ) : (
                            convo.last_message
                          )}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {loadingContactId === convo.id && (
                            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                          )}
                          {isMuted && (
                            <BellOff size={14} className="text-gray-400" />
                          )}
                          {isPinned && (
                            <Pin size={14} className="text-gray-400" />
                          )}
                          {!!convo.unreadCount && convo.unreadCount > 0 && (
                            <div className="bg-indigo-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
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

          {/* Context Menu Backdrop */}
          {contextMenu && (
            <div
              className="fixed inset-0 z-50"
              onClick={(e) => {
                e.stopPropagation();
                setContextMenu(null);
              }}
            >
              <div
                className="absolute bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-48 text-sm text-gray-700"
                style={{ top: contextMenu.y, left: contextMenu.x }}
              >
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-50"
                  onClick={() => {
                    togglePin(contextMenu.id);
                    setContextMenu(null);
                  }}
                >
                  {pinnedIds.includes(contextMenu.id) ? "Unpin" : "Pin"} chat
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-50"
                  onClick={() => {
                    toggleMute(contextMenu.id);
                    setContextMenu(null);
                  }}
                >
                  {mutedIds.includes(contextMenu.id) ? "Unmute" : "Mute"}{" "}
                  notifications
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-50"
                  onClick={() => {
                    markAsRead(contextMenu.id);
                    setContextMenu(null);
                  }}
                >
                  Mark as unread
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-50"
                  onClick={() => {
                    toggleArchive(contextMenu.id);
                    setContextMenu(null);
                  }}
                >
                  {archivedIds.includes(contextMenu.id)
                    ? "Unarchive"
                    : "Archive"}{" "}
                  chat
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600"
                  onClick={() => {
                    deleteConversation(contextMenu.id);
                    setContextMenu(null);
                  }}
                >
                  Delete chat
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
          <p>No recent calls</p>
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

      <NewGroupWizard
        isOpen={isNewGroupOpen}
        onClose={() => setIsNewGroupOpen(false)}
      />
    </div>
  );
}
