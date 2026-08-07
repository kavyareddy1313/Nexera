import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Sidebar } from "../components/chat/Sidebar";
import { ActiveConversation } from "../components/chat/ActiveConversation";
import { useConversationStore } from "../store/useConversationStore";
import useChatStore from "../store/useChatStore";
import api from "../api/axios";
import { cn } from "../lib/utils";
import { GlobalNavRail } from "../components/layout/GlobalNavRail";

export default function ChatShell() {
  const { activeConversationId, setConversations, setActiveConversationId } = useConversationStore();
  const { initSocket, disconnectSocket } = useChatStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      initSocket(token);
    }
    return () => disconnectSocket();
  }, [initSocket, disconnectSocket]);

  // Fetch conversations and contacts
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get("/chat/conversations");
        const { conversations = [], contacts = [] } = response.data;
        setConversations(conversations, contacts);

        // If ?convo=<id> query param is present, auto-open that conversation
        const targetConvoId = searchParams.get("convo");
        if (targetConvoId) {
          // Small delay to let conversations hydrate in the store
          setTimeout(() => {
            setActiveConversationId(targetConvoId);
          }, 300);
          // Clear the query param to avoid re-triggering
          setSearchParams({}, { replace: true });
        }
      } catch (error) {
        console.error("Fetch conversations error:", error);
      }
    };

    fetchConversations();
  }, [setConversations, searchParams, setActiveConversationId, setSearchParams]);

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden font-sans antialiased select-none">
      {/* 1. Global Navigation Rail */}
      <GlobalNavRail activeRoute="/chat" />

      {/* 2. Workspace Body */}
      <main className="flex flex-1 h-full overflow-hidden bg-white">
        {/* Left Panel: Conversation List / Contacts */}
        <section
          className={cn(
            activeConversationId ? "hidden md:flex" : "flex",
            "w-full md:w-[360px] lg:w-[390px] flex-shrink-0 h-full relative z-10 bg-[#F8FAFC] border-r border-slate-200/90 flex-col",
          )}
        >
          <Sidebar />
        </section>

        {/* Right Panel: Active Chat Thread Canvas */}
        <section
          className={cn(
            !activeConversationId ? "hidden md:flex" : "flex",
            "flex-1 h-full relative bg-white flex flex-col min-w-0",
          )}
        >
          <ActiveConversation />
        </section>
      </main>
    </div>
  );
}
