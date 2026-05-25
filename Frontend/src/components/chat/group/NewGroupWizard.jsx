import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Camera, Check, ArrowRight } from "lucide-react";
import { useConversationStore } from "../../../store/useConversationStore";
import api from "../../../api/axios";

export function NewGroupWizard({ isOpen, onClose }) {
  const { contacts, setActiveConversationId, conversations, setConversations } =
    useConversationStore();
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredContacts = contacts.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    setLoading(true);
    try {
      const response = await api.post("/chat/conversations/group", {
        name: groupName.trim(),
        members: Array.from(selectedIds),
      });
      if (response.data?.conversation) {
        const convo = response.data.conversation;
        // Prepend new conversation to store
        const currentConvos = Array.from(conversations.values());
        setConversations([convo, ...currentConvos], contacts);
        setActiveConversationId(convo.id);
      }
      onClose();
      setStep(1);
      setSelectedIds(new Set());
      setGroupName("");
    } catch (error) {
      console.error("Failed to create group:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-[#111b21] rounded-xl shadow-2xl w-full max-w-sm h-[600px] max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-indigo-600 px-4 py-4 flex items-center gap-4 text-white">
            <button
              onClick={() => (step === 1 ? onClose() : setStep(1))}
              className="hover:bg-indigo-700 p-2 rounded-full transition-colors -ml-2"
            >
              <X size={24} />
            </button>
            <div>
              <h2 className="font-semibold text-lg">
                {step === 1 ? "Add group members" : "New group"}
              </h2>
              <p className="text-xs text-indigo-100">
                {step === 1 ? "Select participants" : "Provide a group subject"}
              </p>
            </div>
          </div>

          {step === 1 && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Selected Chips */}
              {selectedIds.size > 0 && (
                <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0 bg-gray-50 dark:bg-[#202c33]">
                  {Array.from(selectedIds).map((id) => {
                    const contact = contacts.find((c) => c.id === id);
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full pr-3 pl-1 py-1 whitespace-nowrap"
                      >
                        <div
                          className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold text-white"
                          style={{
                            backgroundColor:
                              contact?.avatar_color_bg || "#6366f1",
                          }}
                        >
                          {contact?.avatar_url ? (
                            <img src={contact.avatar_url} alt="" />
                          ) : (
                            contact?.initials ||
                            contact?.full_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                          {contact?.full_name.split(" ")[0]}
                        </span>
                        <button
                          onClick={() => toggleSelect(id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Search */}
              <div className="p-3">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search name"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Contact List */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Contacts on Nexera
                </div>
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-[#202c33] cursor-pointer"
                    onClick={() => toggleSelect(contact.id)}
                  >
                    <div className="relative">
                      {contact.avatar_url ? (
                        <img
                          src={contact.avatar_url}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                          style={{
                            backgroundColor:
                              contact.avatar_color_bg || "#6366f1",
                            color: contact.avatar_color_text || "#fff",
                          }}
                        >
                          {contact.initials ||
                            contact.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {selectedIds.has(contact.id) && (
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-indigo-500 border-2 border-white dark:border-[#111b21] rounded-full flex items-center justify-center text-white">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {contact.full_name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {contact.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Next Button */}
              {selectedIds.size > 0 && (
                <div className="p-4 bg-white dark:bg-[#111b21] border-t border-gray-200 dark:border-gray-800 flex justify-end shrink-0">
                  <button
                    onClick={() => setStep(2)}
                    className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-indigo-700 transition-transform hover:scale-105"
                  >
                    <ArrowRight size={24} />
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col flex-1 p-6 items-center">
              <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mb-8 border border-dashed border-gray-300 dark:border-gray-700">
                <Camera size={32} className="mb-2" />
                <span className="text-xs uppercase font-medium">
                  Add Group Icon
                </span>
              </div>

              <input
                type="text"
                placeholder="Group subject"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                autoFocus
                className="w-full bg-transparent border-b-2 border-indigo-500 text-xl font-medium text-gray-900 dark:text-white px-2 py-2 focus:outline-none placeholder-gray-400 mb-2"
              />

              <p className="text-xs text-gray-500 self-start px-2 mb-8">
                Provide a group subject and optional group icon
              </p>

              <div className="mt-auto self-end">
                <button
                  onClick={handleCreate}
                  disabled={!groupName.trim() || loading}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${
                    groupName.trim() && !loading
                      ? "bg-indigo-600 hover:bg-indigo-700 hover:scale-105"
                      : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                  }`}
                >
                  <Check size={24} strokeWidth={3} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
