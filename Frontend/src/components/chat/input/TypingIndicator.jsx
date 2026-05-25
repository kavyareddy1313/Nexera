import React from "react";
import useChatStore from "../../../store/useChatStore";

export function TypingIndicator({ conversationId, currentUserId }) {
  // Read typing state from the Socket.io-driven chat store
  const typingUsers = useChatStore((s) => s.typingUsers);
  const roomTyping = typingUsers?.[conversationId] || {};

  // Filter out self and collect usernames
  const usersArray = Object.entries(roomTyping)
    .filter(([userId]) => userId !== currentUserId)
    .map(([, data]) => data.username || "Someone");

  if (usersArray.length === 0) return null;

  let text = "";
  if (usersArray.length === 1) {
    text = `${usersArray[0]} is typing...`;
  } else if (usersArray.length === 2) {
    text = `${usersArray[0]} and ${usersArray[1]} are typing...`;
  } else {
    text = `${usersArray.length} people are typing...`;
  }

  return (
    <span className="text-indigo-500 font-medium animate-pulse text-xs">
      {text}
    </span>
  );
}
