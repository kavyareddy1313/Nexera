import React from "react";
import { X, Reply, Edit2 } from "lucide-react";

export function ReplyBanner({ mode, message, onClose }) {
  if (!message) return null;

  return (
    <div
      className={`flex flex-col relative ${mode === "EDIT" ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/50" : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"} border-t px-4 py-2 text-sm z-10`}
    >
      <div className="flex items-center justify-between mb-1">
        <div
          className={`flex items-center gap-1.5 font-semibold ${mode === "EDIT" ? "text-yellow-700 dark:text-yellow-500" : "text-indigo-600 dark:text-indigo-400"}`}
        >
          {mode === "EDIT" ? (
            <Edit2 className="w-3.5 h-3.5" />
          ) : (
            <Reply className="w-3.5 h-3.5" />
          )}
          <span>
            {mode === "EDIT"
              ? "Editing message"
              : `Replying to ${message.sender?.name || "You"}`}
          </span>
        </div>
        <button
          onClick={onClose}
          className={`p-1 rounded-full transition-colors ${mode === "EDIT" ? "text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/50" : "text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-stretch gap-2 bg-black/5 dark:bg-white/5 rounded px-2 py-1.5 overflow-hidden">
        {/* Color bar */}
        <div
          className={`w-1 rounded-full ${mode === "EDIT" ? "bg-yellow-500" : "bg-indigo-500"}`}
        ></div>

        {/* Content truncate */}
        <div className="flex-1 min-w-0 flex items-center">
          <p className="text-gray-600 dark:text-gray-300 truncate w-full">
            {message.type === "TEXT"
              ? message.content
              : message.type === "IMAGE"
                ? "📷 Image"
                : message.type === "VOICE"
                  ? "🎤 Voice message"
                  : "Message"}
          </p>
        </div>

        {/* Optional Thumbnail */}
        {message.type === "IMAGE" && message.thumbnailUrl && (
          <div className="w-8 h-8 rounded shrink-0 overflow-hidden ml-2">
            <img
              src={message.thumbnailUrl}
              alt="thumb"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}
