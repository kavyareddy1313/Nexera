import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Reply,
  SmilePlus,
  Forward,
  Copy,
  Star,
  Pin,
  Edit2,
  Info,
  Trash2,
  X,
} from "lucide-react";

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export function MessageContextMenu({
  message,
  isOpen,
  position,
  onClose,
  onAction,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !message || !position) return null;

  // Determine which actions are available based on message type and ownership
  const isOwn = message.isOwn;
  const isText = message.type === "TEXT";
  const isDeleted = message.type === "DELETED";
  const isSystem = message.type === "SYSTEM";

  if (isDeleted || isSystem) return null;

  // Within 15 mins? Mock check
  const isEditable = isOwn && isText;
  // Within 60s? Mock check
  const isDeletableForEveryone = isOwn;

  const handleAction = (action) => {
    onAction(action, message);
    onClose();
  };

  // Adjust position to not overflow screen (basic clamping for desktop)
  const safeX = Math.min(position.x, window.innerWidth - 260);
  const safeY = Math.min(position.y, window.innerHeight - 350);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 sm:bg-transparent bg-black/20"
      >
        <div
          ref={menuRef}
          style={{
            left: window.innerWidth < 640 ? 0 : safeX,
            top: window.innerWidth < 640 ? "auto" : safeY,
            bottom: window.innerWidth < 640 ? 0 : "auto",
          }}
          className="absolute sm:w-64 w-full bg-white dark:bg-gray-800 sm:rounded-xl rounded-t-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
        >
          {/* Mobile Handle & Close */}
          <div className="sm:hidden flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto absolute left-1/2 -translate-x-1/2"></div>
            <span className="font-medium text-sm text-gray-500 ml-2">
              Message Actions
            </span>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Emoji Reactions Row */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleAction(`react_${emoji}`)}
                className="text-2xl hover:scale-125 transition-transform origin-center"
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => handleAction("react_custom")}
              className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <SmilePlus className="w-5 h-5" />
            </button>
          </div>

          <div className="py-2 flex flex-col text-sm text-gray-700 dark:text-gray-200">
            <MenuButton
              icon={<Reply className="w-4 h-4" />}
              label="Reply"
              onClick={() => handleAction("reply")}
            />
            <MenuButton
              icon={<Forward className="w-4 h-4" />}
              label="Forward"
              onClick={() => handleAction("forward")}
            />

            {isText && (
              <MenuButton
                icon={<Copy className="w-4 h-4" />}
                label="Copy text"
                onClick={() => handleAction("copy")}
              />
            )}

            <MenuButton
              icon={<Star className="w-4 h-4" />}
              label={message.id.endsWith("starred") ? "Unstar" : "Star"}
              onClick={() => handleAction("star")}
            />

            <MenuButton
              icon={<Pin className="w-4 h-4" />}
              label={message.isPinned ? "Unpin" : "Pin"}
              onClick={() => handleAction("pin")}
            />

            {isEditable && (
              <MenuButton
                icon={<Edit2 className="w-4 h-4" />}
                label="Edit"
                onClick={() => handleAction("edit")}
              />
            )}

            {isOwn && (
              <MenuButton
                icon={<Info className="w-4 h-4" />}
                label="Info"
                onClick={() => handleAction("info")}
              />
            )}

            <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>

            {isDeletableForEveryone ? (
              <>
                <MenuButton
                  icon={<Trash2 className="w-4 h-4" />}
                  label="Delete for me"
                  danger
                  onClick={() => handleAction("delete_for_me")}
                />
                <MenuButton
                  icon={<Trash2 className="w-4 h-4" />}
                  label="Delete for everyone"
                  danger
                  onClick={() => handleAction("delete_for_everyone")}
                />
              </>
            ) : (
              <MenuButton
                icon={<Trash2 className="w-4 h-4" />}
                label="Delete for me"
                danger
                onClick={() => handleAction("delete_for_me")}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function MenuButton({ icon, label, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors ${
        danger ? "text-red-600 dark:text-red-400" : ""
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
