import React, { useState, useRef, useEffect } from "react";
import { Search, Bell, Settings, LogOut, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import toast from "react-hot-toast";

export function InstructorTopNav() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  return (
    <div className="w-full h-[80px] flex items-center justify-between px-10 bg-[#f8f9fc] shrink-0">
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search courses, students..." 
          className="w-full bg-white border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-indigo-600 shadow-sm transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-indigo-600 shadow-sm transition-colors">
          <Settings size={18} />
        </button>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-transparent hover:border-indigo-200 transition-all focus:outline-none"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              user?.fullName?.[0]?.toUpperCase() || 'U'
            )}
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-gray-50">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.fullName || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">@{user?.username || 'username'}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-semibold"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
