import React from "react";
import { MessageCircle, CircleDashed, Phone } from "lucide-react";

export function SidebarTabs({ activeTab, setActiveTab, onChange }) {
  const handleTabChange = setActiveTab || onChange || (() => {});
  const tabs = [
    { id: "chats", label: "Chats", icon: MessageCircle },
    { id: "status", label: "Status", icon: CircleDashed },
    { id: "calls", label: "Calls", icon: Phone },
  ];

  return (
    <div className="flex items-center justify-around bg-slate-200/70 p-1 rounded-xl border border-slate-300/60 mb-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center py-2 px-3 gap-1.5 rounded-lg text-xs font-semibold transition-all ${
              isActive
                ? "bg-white text-indigo-600 shadow-xs ring-1 ring-black/5"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
