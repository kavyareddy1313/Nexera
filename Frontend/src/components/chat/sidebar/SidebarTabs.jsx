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
    <div className="flex items-center justify-around bg-slate-200/80 p-1 rounded-2xl border border-slate-300/80 mb-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center py-2 px-3 gap-1.5 rounded-xl text-xs font-bold transition-all ${
              isActive
                ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Icon size={16} strokeWidth={isActive ? 2.4 : 1.8} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
