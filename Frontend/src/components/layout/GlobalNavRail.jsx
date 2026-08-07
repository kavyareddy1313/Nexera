import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Activity,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import logoUrl from "../../assets/logo.png";

export function GlobalNavRail({ activeRoute = "/chat" }) {
  const location = useLocation();
  const currentPath = location.pathname || activeRoute;

  const navItems = [
    { route: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { route: "/chat", label: "Messages", icon: MessageSquare },
    { route: "/courses", label: "Courses", icon: BookOpen },
    { route: "/activity", label: "Activity", icon: Activity },
  ];

  return (
    <aside className="w-[72px] h-full bg-[#0F172A] text-slate-400 flex flex-col items-center py-5 z-30 shrink-0 select-none border-r border-slate-800">
      {/* Brand Logo */}
      <Link to="/dashboard" className="w-10 h-10 mb-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 transition-all p-1.5 group">
        <img src={logoUrl} alt="Nexera" className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
      </Link>

      {/* Main Navigation Links */}
      <nav className="flex flex-col gap-3 flex-1 w-full px-3">
        {navItems.map(({ route, label, icon: Icon }) => {
          const isActive = currentPath.startsWith(route);
          return (
            <div key={route} className="relative group flex justify-center">
              <Link
                to={route === "/activity" ? "#" : route}
                onClick={route === "/activity" ? (e) => { e.preventDefault(); toast("Activity view coming soon!", { icon: "📊" }); } : undefined}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-[#5840D8] text-white shadow-lg shadow-indigo-500/25"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                }`}
                title={label}
              >
                <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
              </Link>

              {/* Tooltip on hover */}
              <div className="absolute left-[68px] top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-xl border border-slate-800">
                {label}
              </div>
            </div>
          );
        })}

        {/* Nexera AI Assistant Direct Rail Trigger */}
        <div className="relative group flex justify-center mt-1">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-nexera-ai'))}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-indigo-400 hover:text-white hover:bg-indigo-600/30 transition-all shadow-xs"
            title="Nexera AI Assistant"
          >
            <Sparkles size={20} strokeWidth={2.2} />
          </button>
          <div className="absolute left-[68px] top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-xl border border-slate-800">
            Nexera AI
          </div>
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-3 items-center w-full px-3 pt-4 border-t border-slate-800/80">
        <button
          onClick={() => toast("Settings coming soon!", { icon: "⚙️" })}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
          title="Settings"
        >
          <Settings size={20} strokeWidth={2} />
        </button>

        <Link
          to="/dashboard"
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-md hover:ring-2 hover:ring-indigo-400 transition-all"
          title="My Profile"
        >
          <User size={18} />
        </Link>
      </div>
    </aside>
  );
}
