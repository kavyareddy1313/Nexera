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
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#FAFAFA] text-center p-8 select-none">
        <div className="w-16 h-16 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex items-center justify-center mb-4 text-[#5840D8]">
          <MessageSquare size={28} strokeWidth={2} />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Nexera Messenger</h2>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          Select a conversation from the left to start messaging, or search for a colleague by their @username.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative">
      <MessageThreadView />
    </div>
  );
}
