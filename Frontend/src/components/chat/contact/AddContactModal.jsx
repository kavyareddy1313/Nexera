import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Search, 
  UserPlus, 
  MessageSquare, 
  Check, 
  Sparkles, 
  Loader2, 
  AtSign,
  ArrowRight
} from "lucide-react";
import api from "../../../api/axios";
import { useConversationStore } from "../../../store/useConversationStore";

export function AddContactModal({ isOpen, onClose, initialQuery = "" }) {
  const { setActiveConversationId, addConversation } = useConversationStore();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectingUserId, setConnectingUserId] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState(new Set());
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery(initialQuery);
      fetchUsers(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
      setResults([]);
      setConnectingUserId(null);
    }
  }, [isOpen, initialQuery]);

  const fetchUsers = async (query) => {
    setIsLoading(true);
    try {
      const trimmed = query.trim();
      const res = await api.get(`/chat/users/search${trimmed ? `?q=${encodeURIComponent(trimmed)}` : ""}`);
      setResults(res.data?.users || []);
    } catch (err) {
      console.error("Failed to search users:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search on typing
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchUsers(searchQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  const handleConnect = async (user) => {
    if (connectingUserId) return;
    setConnectingUserId(user.id);

    try {
      const res = await api.post("/chat/conversations/dm", { otherUserId: user.id });
      const conversation = res.data?.conversation;

      if (conversation?.id) {
        addConversation(conversation);
        setActiveConversationId(conversation.id);
        setConnectedUsers((prev) => new Set(prev).add(user.id));
        onClose();
      }
    } catch (err) {
      console.error("Failed to connect with user:", err);
    } finally {
      setConnectingUserId(null);
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

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg h-[620px] max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#5840D8] via-[#6B51E8] to-[#7B62F9] px-6 py-6 text-white relative flex-shrink-0">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3.5 mb-1">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <UserPlus size={22} strokeWidth={2.4} />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Connect with People</h2>
                <p className="text-xs text-indigo-100 font-medium">
                  Search teammates and friends by @username or full name
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar Input */}
          <div className="p-4 pb-3 border-b border-gray-100 bg-gray-50/70">
            <div className="relative flex items-center">
              <div className="absolute left-4 pointer-events-none text-indigo-500">
                <Search size={18} />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search @username (e.g. @sarah) or full name..."
                className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 w-6 h-6 rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-3">
                <Loader2 size={28} className="animate-spin text-[#5840D8]" />
                <span className="text-sm font-medium">Searching Nexera users...</span>
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="px-2 py-1 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                  <span>{searchQuery ? "Search Results" : "People on Nexera"}</span>
                  <span className="text-[11px] font-medium text-gray-400 lowercase">{results.length} found</span>
                </div>

                {results.map((user) => {
                  const isUserConnected = user.isConnected || connectedUsers.has(user.id);
                  const isConnecting = connectingUserId === user.id;

                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-indigo-50/50 border border-gray-100 hover:border-indigo-200/70 transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.fullName}
                              className="w-12 h-12 rounded-full object-cover shadow-xs"
                            />
                          ) : (
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs"
                              style={{
                                backgroundColor: user.avatarColorBg || "#5840D8",
                                color: user.avatarColorText || "#ffffff",
                              }}
                            >
                              {user.initials || user.fullName?.slice(0, 2).toUpperCase() || "U"}
                            </div>
                          )}
                          <div
                            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                              user.status === "online" ? "bg-emerald-500" : "bg-gray-300"
                            }`}
                          />
                        </div>

                        {/* Name & Username */}
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 truncate">
                            {user.fullName}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-semibold text-[#5840D8] bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                              @{user.username || "user"}
                            </span>
                            {user.email && (
                              <span className="text-xs text-gray-400 truncate hidden sm:inline">
                                {user.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleConnect(user)}
                        disabled={isConnecting}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex-shrink-0 ${
                          isUserConnected
                            ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            : "bg-[#5840D8] hover:bg-[#4830C0] text-white hover:scale-[1.02] active:scale-95 shadow-indigo-200"
                        }`}
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Connecting...</span>
                          </>
                        ) : isUserConnected ? (
                          <>
                            <MessageSquare size={14} />
                            <span>Message</span>
                          </>
                        ) : (
                          <>
                            <UserPlus size={14} strokeWidth={2.4} />
                            <span>Connect & Chat</span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-56 text-center px-4">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                  <AtSign size={24} />
                </div>
                <h4 className="text-sm font-bold text-gray-800 mb-1">
                  No users found for "{searchQuery}"
                </h4>
                <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                  Try searching with a different username or full name.
                </p>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 px-6">
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#5840D8]" />
              Connected users appear directly in your active conversations list
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
