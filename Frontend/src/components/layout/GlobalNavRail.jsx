import React from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Activity,
  Settings,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import logoUrl from "../../assets/logo.png";

export function GlobalNavRail({ activeRoute = "/chat" }) {
  const navItems = [
    { route: "/dashboard", icon: LayoutDashboard },
    { route: "/chat", icon: MessageSquare },
    { route: "/courses", icon: BookOpen },
    { route: "/activity", icon: Activity },
  ];

  return (
    <div className="w-[72px] h-full bg-[#f3f4f6] flex flex-col items-center py-4 z-20 shrink-0">
      <div className="w-10 h-10 mb-8 flex items-center justify-center">
        <img src={logoUrl} alt="Nexera Logo" className="w-full h-full object-contain" />
      </div>

      <div className="flex flex-col gap-6 flex-1">
        {navItems.map(({ route, icon: Icon }) => {
          const isActive = activeRoute === route;
          return (
            <div key={route} className="relative p-2 flex justify-center">
              {isActive && (
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full"></div>
              )}
              {route === "/dashboard" || route === "/chat" || route === "/courses" ? (
                <Link to={route}>
                  <button
                    className={`transition-colors flex items-center justify-center ${
                      isActive
                        ? "text-indigo-600"
                        : "text-gray-400 hover:text-indigo-600"
                    }`}
                  >
                    <Icon
                      size={22}
                      strokeWidth={2.5}
                      fill={isActive && route === "/chat" ? "currentColor" : "none"}
                    />
                  </button>
                </Link>
              ) : (
                <button
                  onClick={() => toast(`Navigating to ${route}... (Coming soon)`, { icon: '🚀' })}
                  className={`transition-colors flex items-center justify-center ${
                    isActive
                      ? "text-indigo-600"
                      : "text-gray-400 hover:text-indigo-600"
                  }`}
                >
                  <Icon
                    size={22}
                    strokeWidth={2.5}
                    fill={isActive && route === "/chat" ? "currentColor" : "none"}
                  />
                </button>
              )}
            </div>
          );
        })}

        <div className="relative p-2 mt-auto mb-4 flex justify-center">
          <button
            onClick={() => toast('Opening Settings... (Coming soon)', { icon: '⚙️' })}
            className={`transition-colors flex items-center justify-center ${
              activeRoute === "/settings"
                ? "text-indigo-600"
                : "text-gray-400 hover:text-indigo-600"
            }`}
          >
            <Settings size={22} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <button 
        onClick={() => toast('Creating new item...', { icon: '✨' })}
        className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all"
      >
        <Plus size={20} strokeWidth={3} />
      </button>
    </div>
  );
}
