import { Search, Phone, Video, MoreVertical, Pin } from "lucide-react";
import { TypingIndicator } from "../input/TypingIndicator";

export function ChatHeader({
  user,
  isGroup = false,
  memberCount = 0,
  onlineStatus = "last seen 2h ago",
  pinnedMessage,
  conversationId = "",
  currentUserId = "",
  onSearchClick,
  onPinClick,
  onVideoCallClick,
}) {
  return (
    <div className="flex flex-col border-b border-gray-200/80 bg-white z-20 shadow-xs">
      <div className="flex items-center justify-between px-6 py-3.5">
        {/* Left Side: Avatar & Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
          <div className="relative flex-shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: user?.color || '#6366f1', color: '#fff' }}>
                {user?.name?.charAt(0) || "G"}
              </div>
            )}
            {!isGroup && onlineStatus === "online" && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
            )}
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user?.name || "Unknown User"}
            </h2>
            <div className="flex items-center gap-2">
              <TypingIndicator
                conversationId={conversationId}
                currentUserId={currentUserId}
              />
              <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mt-0.5">
                {isGroup ? `${memberCount} members` : (onlineStatus === 'online' ? 'Active Now' : onlineStatus)}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2 sm:gap-4 text-gray-500">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
            <Phone className="w-5 h-5" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onVideoCallClick(); }}
            className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-full transition-colors flex items-center gap-1 sm:px-3 sm:py-2"
          >
            <Video className="w-5 h-5" />
            <span className="hidden sm:inline-block text-xs font-bold">LIVE CLASS</span>
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Pinned Message Bar */}
      {pinnedMessage && (
        <div
          onClick={onPinClick}
          className="flex items-center gap-3 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
        >
          <div className="flex-shrink-0 text-yellow-600 dark:text-yellow-500">
            <Pin className="w-4 h-4 fill-current" />
          </div>
          <div className="flex-1 min-w-0 border-l-2 border-yellow-400 pl-2">
            <p className="text-xs font-medium text-yellow-800 dark:text-yellow-600">
              Pinned Message
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
              {pinnedMessage.length > 40
                ? `${pinnedMessage.substring(0, 40)}...`
                : pinnedMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
