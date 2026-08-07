import React from "react";
import { useConversationStore } from "../../store/useConversationStore";
import { MessageSquare } from "lucide-react";
import { MessageThreadView } from "./thread/MessageThreadView";

export function ActiveConversation() {
  const { activeConversationId, conversations } = useConversationStore();

  const activeConvo = activeConversationId
    ? conversations.get(activeConversationId)
    : null;

  if (!activeConvo) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50 border-l border-gray-200">
        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-6 text-indigo-500">
          <MessageSquare size={40} strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-light text-gray-800 mb-2">Nexera Web</h2>
        <p className="text-gray-500">
          Select a conversation to start messaging.
        </p>
      </div>
    );
  }

  // Render our new complex MessageThreadView
  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative">
      <MessageThreadView />
    </div>
  );
}
