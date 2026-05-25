import React from "react";
import { MessageCircle, CircleDashed, Phone } from "lucide-react";

export function SidebarTabs({ activeTab, onChange }) {
  const tabs = [
    { id: "chats", label: "Chats", icon: MessageCircle },
    { id: "status", label: "Status", icon: CircleDashed },
    { id: "calls", label: "Calls", icon: Phone },
  ];

  return (
    <div className="flex items-center justify-around bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pt-2 px-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-col items-center justify-center py-2 px-4 gap-1 relative ${
              isActive
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            } transition-colors`}
          >
            <Icon size={20} className={isActive ? "fill-indigo-600/20" : ""} />
            <span className="text-[11px] font-semibold">{tab.label}</span>
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
