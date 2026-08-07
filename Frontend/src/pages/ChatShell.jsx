import React, { useEffect } from "react";
import { Sidebar } from "../components/chat/Sidebar";
import { ActiveConversation } from "../components/chat/ActiveConversation";
import { useConversationStore } from "../store/useConversationStore";
import useChatStore from "../store/useChatStore";
import api from "../api/axios";
import { cn } from "../lib/utils";
import { LayoutDashboard, MessageSquare, Briefcase, Activity, Settings, Plus } from "lucide-react";
import { GlobalNavRail } from "../components/layout/GlobalNavRail";

export default function ChatShell() {
  const { activeConversationId, setConversations } = useConversationStore();
  const { initSocket, disconnectSocket } = useChatStore();

  // Initialize socket
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      initSocket(token);
    }
    return () => disconnectSocket();
  }, [initSocket, disconnectSocket]);

  // Fetch conversations directly from the new nested endpoint
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get("/chat/conversations");
        const { conversations = [], contacts = [] } = response.data;
        setConversations(conversations, contacts);
      } catch (error) {
        console.error("Fetch conversations error:", error);
      }
    };

    fetchConversations();
  }, [setConversations]);

  return (
    <div className="flex h-screen w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-fuchsia-50 to-blue-50 overflow-hidden font-sans">
      <GlobalNavRail activeRoute="/chat" />

      <div className="flex flex-1 h-[calc(100vh-2rem)] my-4 mr-4 rounded-[2rem] overflow-hidden shadow-2xl border border-gray-300/80 bg-white">
        {/* Left Panel (Users / Conversations List) - Rich Distinct Slate-Tinted Background */}
        <div
          className={cn(
            activeConversationId ? "hidden md:flex" : "flex",
            "w-full md:w-[380px] lg:w-[410px] flex-shrink-0 h-full relative z-10 bg-[#EAEEF6] border-r border-[#CBD5E1] shadow-[4px_0_24px_rgba(0,0,0,0.06)]",
          )}
        >
          <Sidebar />
        </div>

        {/* Right Panel (Chatting Area) - Crisp Pure White Canvas */}
        <div
          className={cn(
            !activeConversationId ? "hidden md:flex" : "flex",
            "flex-1 h-full relative bg-white",
          )}
        >
          <ActiveConversation />
        </div>
      </div>
    </div>
  );
}
