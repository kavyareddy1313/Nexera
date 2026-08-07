import React, { useState, useRef, useEffect } from "react";
import { Bell, HelpCircle, LogOut, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import toast from "react-hot-toast";
import { UserProfileModal } from "../profile/UserProfileModal";

export function DashboardTopNav({ user }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const showComingSoon = (feature) => {
    toast(`Navigating to ${feature}... (Feature coming soon)`, { icon: '🚀' });
  };

  return (
    <div className="w-full flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 z-30 shrink-0">
      <div className="flex items-center gap-12">
        <h1 className="text-xl font-bold text-indigo-600 tracking-tight cursor-pointer" onClick={() => navigate('/dashboard')}>
          Nexera
        </h1>
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-500">
          <button onClick={() => showComingSoon("Platform")} className="text-indigo-600 hover:opacity-80 transition-opacity">Platform</button>
          <button onClick={() => showComingSoon("Solutions")} className="hover:text-indigo-600 transition-colors">Solutions</button>
          <button onClick={() => showComingSoon("Enterprise")} className="hover:text-indigo-600 transition-colors">Enterprise</button>
          <button onClick={() => showComingSoon("Pricing")} className="hover:text-indigo-600 transition-colors">Pricing</button>
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <button onClick={() => showComingSoon("Notifications")} className="relative text-gray-400 hover:text-indigo-600 transition-colors">
          <Bell size={20} strokeWidth={2.5} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <button onClick={() => showComingSoon("Help Center")} className="text-gray-400 hover:text-indigo-600 transition-colors">
          <HelpCircle size={20} strokeWidth={2.5} />
        </button>
        
        {/* Profile Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-8 h-8 rounded-full overflow-hidden border-2 border-transparent hover:border-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="User avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                {user?.fullName?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 animate-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-gray-50">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">@{user?.username || 'username'}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <UserIcon size={16} />
                  View Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
}
