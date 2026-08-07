import React from "react";
import clsx from "clsx";
import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { MessageContent } from "./MessageContent";

export function MessageBubble({
  message,
  showAvatar = true,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
  onContextMenu,
  onReactionClick,
}) {
  if (message.type === "SYSTEM") {
    return (
      <div className="flex justify-center my-4 w-full">
        <div className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-4 py-1.5 rounded-full text-center">
          {message.content}
        </div>
      </div>
    );
  }

  const isOwn = message.isOwn;
  const isDeleted = message.type === "DELETED";
  const hasReactions = message.reactions && message.reactions.length > 0;

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (!isSelectionMode && onContextMenu) {
      onContextMenu(e, message);
    }
  };

  const handleLongPress = (e) => {
    // For mobile long press (simplified handling here, normally use a hook)
    e.preventDefault();
    if (!isSelectionMode && onContextMenu) {
      // Create a synthetic event or pass clientX/Y
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      onContextMenu({ clientX, clientY, preventDefault: () => {} }, message);
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={clsx(
        "flex w-full mb-1 px-4 relative group",
        isOwn ? "justify-end" : "justify-start",
        isSelectionMode ? "cursor-pointer" : "",
      )}
      onClick={() => isSelectionMode && onSelect && onSelect(message.id)}
      onContextMenu={handleContextMenu}
    >
      {/* Multi-select Checkbox overlay */}
      {isSelectionMode && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-900 rounded-full">
          <div
            className={clsx(
              "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
              isSelected
                ? "bg-indigo-500 border-indigo-500"
                : "border-gray-300 dark:border-gray-600",
            )}
          >
            {isSelected && (
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            )}
          </div>
        </div>
      )}

      <div
        className={clsx(
          "flex max-w-[85%] sm:max-w-[70%]",
          isSelectionMode && "pl-8 opacity-90",
        )}
      >
        {/* Avatar for other user */}
        {!isOwn && (
          <div className="w-8 flex-shrink-0 mr-2 flex flex-col justify-end">
            {showAvatar ? (
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                {message.sender?.avatar ? (
                  <img
                    src={message.sender.avatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-indigo-500">
                    {message.sender?.name?.charAt(0) || "U"}
                  </span>
                )}
              </div>
            ) : (
              <div className="w-8 h-8" />
            )}
          </div>
        )}

        <div
          className={clsx(
            "relative flex flex-col",
            isOwn ? "items-end" : "items-start",
          )}
        >
          {/* Sender Name for groups (if not own) */}
          {!isOwn && showAvatar && message.sender?.name && (
            <span
              className="text-xs font-medium mb-1 ml-1"
              style={{ color: message.sender.color || "#6366f1" }}
            >
              {message.sender.name}
            </span>
          )}

          {/* Bubble Background */}
          <div
            className={clsx(
              "relative rounded-2xl px-4 py-3 min-w-[80px] text-[15px] shadow-sm",
              isDeleted
                ? "bg-transparent border border-gray-200 italic text-gray-400"
                : message.type === "STICKER"
                  ? "bg-transparent shadow-none p-0"
                  : isOwn
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-white text-gray-800 rounded-bl-sm border border-gray-100",
              hasReactions && "mb-3", // Make room for reactions pill
            )}
          >
            {/* Content rendering based on type */}
            <MessageContent message={message} />

            {/* Timestamp and Status for OWN message (inside bubble) */}
            {message.type !== "STICKER" && isOwn && (
              <div className="flex items-center justify-end gap-1 mt-2 shrink-0 text-[10px] text-indigo-200">
                {message.type === "TEXT" && message.isEdited && (
                  <span className="mr-1">Edited</span>
                )}
                <span>{formatTime(message.timestamp)}</span>
                <span className="ml-0.5">
                  {message.status === "sending" && (
                    <Clock className="w-3 h-3" />
                  )}
                  {message.status === "sent" && (
                    <Check className="w-3 h-3 text-indigo-200" />
                  )}
                  {message.status === "delivered" && (
                    <CheckCheck className="w-3 h-3 text-indigo-200" />
                  )}
                  {message.status === "read" && (
                    <CheckCheck className="w-3 h-3 text-white" />
                  )}
                  {message.status === "failed" && (
                    <AlertCircle className="w-3 h-3 text-red-300" />
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Timestamp for OTHER user (outside bubble) */}
          {message.type !== "STICKER" && !isOwn && (
            <div className="flex items-center justify-start gap-1 mt-1.5 ml-1 text-[10px] text-gray-500 font-medium">
              <span>{formatTime(message.timestamp)}</span>
            </div>
          )}

          {/* Reactions Pill (overlaps bubble bottom) */}
          {hasReactions && (
            <div
              className={clsx(
                "absolute -bottom-3 z-10 flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-1.5 py-0.5 shadow-sm text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                isOwn ? "right-2" : "left-2",
              )}
            >
              {message.reactions?.map((r) => (
                <span
                  key={r.emoji}
                  className="flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReactionClick?.(r.emoji);
                  }}
                >
                  <span>{r.emoji}</span>
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    {r.count > 1 ? r.count : ""}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
