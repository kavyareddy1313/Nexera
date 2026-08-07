import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Camera, Check, ArrowRight, Loader2, Users } from "lucide-react";
import { useConversationStore } from "../../../store/useConversationStore";
import api from "../../../api/axios";

export function NewGroupWizard({ isOpen, onClose }) {
  const { contacts, setActiveConversationId, conversations, setConversations } =
    useConversationStore();
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [userList, setUserList] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState(new Map()); // id -> user object
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSearch("");
      setSelectedUsers(new Map());
      setGroupName("");
      return;
    }

    const fetchUsers = async () => {
      setIsSearching(true);
      try {
        const trimmed = search.trim();
        const res = await api.get(
          `/chat/users/search${trimmed ? `?q=${encodeURIComponent(trimmed)}` : ""}`,
        );
        setUserList(res.data?.users || []);
      } catch (err) {
        console.error("Failed to load users for group creation:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(fetchUsers, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [search, isOpen]);

  const toggleSelect = (user) => {
    setSelectedUsers((prev) => {
      const next = new Map(prev);
      if (next.has(user.id)) next.delete(user.id);
      else next.set(user.id, user);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    setLoading(true);
    try {
      const response = await api.post("/chat/conversations/group", {
        name: groupName.trim(),
        members: Array.from(selectedUsers.keys()),
      });
      if (response.data?.conversation) {
        const convo = response.data.conversation;
        const currentConvos = Array.from(conversations.values());
        setConversations([convo, ...currentConvos], contacts);
        setActiveConversationId(convo.id);
      }
      onClose();
    } catch (error) {
      console.error("Failed to create group:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md h-[600px] max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5840D8] to-[#6d55eb] px-5 py-4 flex items-center gap-3 text-white">
            <button
              onClick={() => (step === 1 ? onClose() : setStep(1))}
              className="hover:bg-white/20 p-2 rounded-full transition-colors -ml-2 text-white"
            >
              <X size={20} />
            </button>
            <div>
              <h2 className="font-bold text-base">
                {step === 1 ? "Add Group Members" : "New Group Details"}
              </h2>
              <p className="text-xs text-indigo-100">
                {step === 1
                  ? `${selectedUsers.size} member${selectedUsers.size === 1 ? "" : "s"} selected`
                  : "Provide a group name"}
              </p>
            </div>
          </div>

          {step === 1 && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Selected Chips */}
              {selectedUsers.size > 0 && (
                <div className="p-3 border-b border-gray-100 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0 bg-indigo-50/50">
                  {Array.from(selectedUsers.values()).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-1.5 bg-white border border-indigo-200 rounded-full pr-2.5 pl-1 py-0.5 whitespace-nowrap shadow-xs"
                    >
                      <div
                        className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-[9px] font-bold text-white"
                        style={{
                          backgroundColor: user.avatarColorBg || "#5840D8",
                          color: user.avatarColorText || "#ffffff",
                        }}
                      >
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          user.initials || user.fullName?.charAt(0).toUpperCase() || "U"
                        )}
                      </div>
                      <span className="text-xs font-semibold text-gray-800">
                        {user.fullName?.split(" ")[0]}
                      </span>
                      <button
                        onClick={() => toggleSelect(user)}
                        className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search */}
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search by @username or name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-gray-50 text-gray-900 rounded-xl pl-9 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Contact List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {isSearching ? (
                  <div className="flex items-center justify-center h-32 gap-2 text-gray-400">
                    <Loader2 size={20} className="animate-spin text-[#5840D8]" />
                    <span className="text-xs">Finding users...</span>
                  </div>
                ) : userList.length > 0 ? (
                  userList.map((user) => {
                    const isSelected = selectedUsers.has(user.id);
                    return (
                      <div
                        key={user.id}
                        className={`px-3 py-2.5 my-0.5 rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? "bg-indigo-50 border border-indigo-200/80"
                            : "hover:bg-gray-50 border border-transparent"
                        }`}
                        onClick={() => toggleSelect(user)}
                      >
                        <div className="relative">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover shadow-xs"
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs"
                              style={{
                                backgroundColor: user.avatarColorBg || "#5840D8",
                                color: user.avatarColorText || "#fff",
                              }}
                            >
                              {user.initials || user.fullName?.charAt(0).toUpperCase() || "U"}
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#5840D8] border-2 border-white rounded-full flex items-center justify-center text-white shadow-xs">
                              <Check size={10} strokeWidth={3.5} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 truncate">
                            {user.fullName}
                          </h4>
                          <span className="text-[11px] font-medium text-[#5840D8]">
                            @{user.username || "user"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-xs">
                    No users found for "{search}"
                  </div>
                )}
              </div>

              {/* Next Button */}
              {selectedUsers.size > 0 && (
                <div className="p-3 bg-white border-t border-gray-100 flex justify-between items-center shrink-0 px-4">
                  <span className="text-xs text-gray-500 font-medium">
                    {selectedUsers.size} participant{selectedUsers.size === 1 ? "" : "s"} selected
                  </span>
                  <button
                    onClick={() => setStep(2)}
                    className="w-10 h-10 bg-[#5840D8] hover:bg-[#4830c0] rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-105"
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col flex-1 p-6 items-center">
              <div className="w-24 h-24 rounded-full bg-indigo-50 flex flex-col items-center justify-center text-[#5840D8] mb-6 border border-dashed border-indigo-200 shadow-inner">
                <Users size={32} />
              </div>

              <input
                type="text"
                placeholder="Group subject..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                autoFocus
                className="w-full bg-transparent border-b-2 border-[#5840D8] text-lg font-bold text-gray-900 px-2 py-2 focus:outline-none placeholder-gray-400 mb-2 text-center"
              />

              <p className="text-xs text-gray-400 text-center mb-8">
                Creating group with {selectedUsers.size} member{selectedUsers.size === 1 ? "" : "s"}
              </p>

              <div className="mt-auto self-end">
                <button
                  onClick={handleCreate}
                  disabled={!groupName.trim() || loading}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${
                    groupName.trim() && !loading
                      ? "bg-[#5840D8] hover:bg-[#4830c0] hover:scale-105"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Check size={22} strokeWidth={3} />}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
