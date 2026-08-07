import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Edit2,
  Link as LinkIcon,
  UserPlus,
  Clock,
  Trash2,
  LogOut,
  ChevronRight,
  User as UserIcon,
} from "lucide-react";

const MOCK_MEMBERS = [
  { id: "1", name: "You", role: "admin" },
  {
    id: "2",
    name: "Priya Sharma",
    avatar: "https://i.pravatar.cc/150?u=priya",
    role: "admin",
    lastSeen: "Today at 10:45 AM",
  },
  { id: "3", name: "Arjun Gupta", role: "member", lastSeen: "Yesterday" },
  {
    id: "4",
    name: "Rahul Desai",
    avatar: "https://i.pravatar.cc/150?u=rahul",
    role: "member",
    lastSeen: "Today at 9:00 AM",
  },
];

export function GroupInfoDrawer({
  isOpen,
  onClose,
  groupId,
  groupName: initialName,
  groupAvatar,
  isAdmin,
}) {
  const [groupName, setGroupName] = useState(initialName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [description, setDescription] = useState(
    "Welcome to our project group! Please keep discussions focused.",
  );
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [disappearingState, setDisappearingState] = useState("off");

  const [activeMenu, setActiveMenu] = useState(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="absolute top-0 right-0 bottom-0 w-full sm:w-[380px] bg-white dark:bg-[#111b21] z-40 border-l border-gray-200 dark:border-gray-800 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="h-16 px-4 flex items-center gap-4 bg-gray-50 dark:bg-[#202c33] border-b border-gray-200 dark:border-gray-800 shrink-0">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-600 dark:text-gray-300"
          >
            <X size={20} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Group info
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-8">
          {/* Main Info */}
          <div className="bg-white dark:bg-[#111b21] flex flex-col items-center py-6 px-4 border-b border-gray-200 dark:border-gray-800">
            <div className="w-40 h-40 rounded-full bg-gray-200 dark:bg-gray-700 mb-4 overflow-hidden group cursor-pointer relative">
              {groupAvatar ? (
                <img
                  src={groupAvatar}
                  alt="group"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
                  <UserIcon size={64} />
                </div>
              )}
              {isAdmin && (
                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white text-sm font-semibold transition-all">
                  CHANGE ICON
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full justify-center group">
              {isEditingName ? (
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && setIsEditingName(false)
                  }
                  autoFocus
                  className="text-xl font-semibold text-center bg-transparent border-b-2 border-indigo-500 focus:outline-none text-gray-900 dark:text-white"
                />
              ) : (
                <>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white text-center truncate px-2">
                    {groupName}
                  </h1>
                  {isAdmin && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-gray-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                </>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Group • {MOCK_MEMBERS.length} members
            </p>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-[#111b21] py-4 px-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-500">
                Description
              </span>
              {isAdmin && !isEditingDesc && (
                <button
                  onClick={() => setIsEditingDesc(true)}
                  className="text-indigo-500 text-sm font-medium"
                >
                  Edit
                </button>
              )}
            </div>
            {isEditingDesc ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-gray-800 rounded p-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[80px]"
                />

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingDesc(false)}
                    className="text-sm text-gray-500 px-3 py-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setIsEditingDesc(false)}
                    className="text-sm bg-indigo-500 text-white rounded px-3 py-1"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-900 dark:text-gray-100 text-sm">
                {description}
              </p>
            )}
          </div>

          {/* Media Links Docs */}
          <div className="bg-white dark:bg-[#111b21] py-4 px-6 border-b border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Media, links, and docs
              </span>
              <span className="text-xs text-gray-500">124</span>
            </div>
            <ChevronRight className="text-gray-400" size={20} />
          </div>

          {/* Disappearing Messages */}
          <div className="bg-white dark:bg-[#111b21] py-4 px-6 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors flex items-center gap-4">
            <Clock className="text-gray-500" size={24} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Disappearing messages
              </h3>
              <p className="text-xs text-gray-500">
                {disappearingState === "off"
                  ? "Off"
                  : `On • ${disappearingState}`}
              </p>
            </div>
            <div className="flex gap-1 text-xs font-semibold">
              <button
                onClick={() => setDisappearingState("off")}
                className={`px-2 py-1 rounded ${disappearingState === "off" ? "bg-indigo-100 text-indigo-700" : "text-gray-500"}`}
              >
                Off
              </button>
              <button
                onClick={() => setDisappearingState("24h")}
                className={`px-2 py-1 rounded ${disappearingState === "24h" ? "bg-indigo-100 text-indigo-700" : "text-gray-500"}`}
              >
                24h
              </button>
            </div>
          </div>

          {/* Invite Link */}
          {isAdmin && (
            <div className="bg-white dark:bg-[#111b21] py-4 px-6 border-b border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <LinkIcon size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Invite via link
                </h3>
              </div>
            </div>
          )}

          {/* Members */}
          <div className="bg-white dark:bg-[#111b21] py-2 mt-2">
            <div className="px-6 py-2 text-sm font-semibold text-gray-500">
              {MOCK_MEMBERS.length} participants
            </div>

            {isAdmin && (
              <div className="px-6 py-3 hover:bg-gray-50 dark:hover:bg-[#202c33] cursor-pointer transition-colors flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                  <UserPlus size={20} />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Add members
                </span>
              </div>
            )}

            {MOCK_MEMBERS.map((member) => (
              <div key={member.id} className="relative group">
                <div
                  className="px-6 py-3 hover:bg-gray-50 dark:hover:bg-[#202c33] cursor-pointer transition-colors flex items-center gap-4"
                  onClick={() =>
                    activeMenu === member.id
                      ? setActiveMenu(null)
                      : setActiveMenu(member.id)
                  }
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-bold text-gray-500">
                        {member.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {member.name}
                      </span>
                      {member.role === "admin" && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-indigo-200 text-indigo-600 dark:border-indigo-800 dark:text-indigo-400">
                          Group Admin
                        </span>
                      )}
                    </div>
                    {member.lastSeen && (
                      <p className="text-xs text-gray-500 truncate">
                        {member.lastSeen}
                      </p>
                    )}
                  </div>
                </div>

                {/* Member Context Menu (Simulated on click instead of long press for ease of desktop use) */}
                {activeMenu === member.id && member.id !== "1" && isAdmin && (
                  <div className="absolute top-12 right-6 z-10 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                      Message {member.name}
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                      View contact
                    </button>
                    {member.role !== "admin" && (
                      <button className="w-full text-left px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700">
                        Make group admin
                      </button>
                    )}
                    <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                      Remove from group
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Danger Zone */}
          <div className="mt-4 bg-white dark:bg-[#111b21] border-y border-gray-200 dark:border-gray-800">
            <button className="w-full px-6 py-4 flex items-center gap-4 text-red-500 hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors">
              <LogOut size={20} />
              <span className="text-sm font-semibold">Exit group</span>
            </button>
            <button className="w-full px-6 py-4 flex items-center gap-4 text-red-500 hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors">
              <Trash2 size={20} />
              <span className="text-sm font-semibold">Delete group</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
