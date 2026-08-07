import React from "react";
import { Phone, Video, MoreVertical, Pin, Search } from "lucide-react";
import { TypingIndicator } from "../input/TypingIndicator";

export function ChatHeader({
  user,
  isGroup = false,
  memberCount = 0,
  onlineStatus = "last seen recently",
  pinnedMessage,
  conversationId = "",
  currentUserId = "",
  onSearchClick,
  onPinClick,
  onVideoCallClick,
}) {
  const isOnline = !isGroup && (onlineStatus === "online" || onlineStatus === "Active Now");

  return (
    <header className="flex flex-col border-b border-slate-200/80 bg-white z-20 shadow-xs select-none">
      <div className="flex items-center justify-between px-6 py-3.5">
        {/* Left Side: Avatar & Contact Info */}
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover shadow-xs border border-slate-100"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-xs"
                style={{ backgroundColor: user?.color || "#5840D8" }}
              >
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
            )}
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <h2 className="text-sm font-bold text-slate-900 truncate">
              {user?.name || "Select a conversation"}
            </h2>
            <div className="flex items-center gap-2">
              <TypingIndicator
                conversationId={conversationId}
                currentUserId={currentUserId}
              />
              <p className="text-xs font-medium flex items-center gap-1.5 text-slate-500">
                {isGroup ? (
                  `${memberCount} members`
                ) : isOnline ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active now
                  </span>
                ) : (
                  onlineStatus
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex items-center gap-1.5 text-slate-600">
          <button
            onClick={onSearchClick}
            className="p-2 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all hidden sm:flex items-center justify-center"
            title="Search in chat"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            className="p-2 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all hidden sm:flex items-center justify-center"
            title="Start voice call"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVideoCallClick?.();
            }}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#5840D8] border border-indigo-200/80 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold shadow-xs active:scale-95"
            title="Start interactive live class or video call"
          >
            <Video className="w-4 h-4" />
            <span className="hidden sm:inline-block">Live Class</span>
          </button>
          <button
            className="p-2 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all flex items-center justify-center"
            title="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pinned Message Banner */}
      {pinnedMessage && (
        <div
          onClick={onPinClick}
          className="flex items-center gap-3 px-6 py-2 bg-amber-50/90 border-t border-amber-100 cursor-pointer hover:bg-amber-100/80 transition-colors"
        >
          <div className="flex-shrink-0 text-amber-600">
            <Pin className="w-3.5 h-3.5 fill-current" />
          </div>
          <div className="flex-1 min-w-0 border-l-2 border-amber-400 pl-2">
            <p className="text-[11px] font-bold text-amber-900">Pinned Message</p>
            <p className="text-xs text-amber-800 truncate">{pinnedMessage}</p>
          </div>
        </div>
      )}
    </header>
  );
}
