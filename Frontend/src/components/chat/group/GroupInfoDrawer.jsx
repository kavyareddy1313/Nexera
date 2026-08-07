import React, { useState, useEffect } from "react";
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
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Check,
  Copy
} from "lucide-react";
import api from "../../../api/axios";
import toast from "react-hot-toast";
import { useConversationStore } from "../../../store/useConversationStore";

export function GroupInfoDrawer({
  isOpen,
  onClose,
  conversation,
  currentUserId,
  isAdmin: propIsAdmin,
}) {
  const [groupName, setGroupName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [description, setDescription] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isSavingDesc, setIsSavingDesc] = useState(false);
  const [disappearingState, setDisappearingState] = useState("off");
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const { updateConversation } = useConversationStore();

  // Determine if current user is admin
  const isAdmin = propIsAdmin || conversation?.isAdmin || conversation?.createdBy === currentUserId;

  // Initialize and fetch real conversation details
  useEffect(() => {
    if (!conversation) return;

    setGroupName(conversation.displayName || conversation.name || "Course Community");
    setDescription(
      conversation.description ||
        `Official community group for "${conversation.displayName || conversation.name || "Course"}". Chat with your instructor and fellow enrolled students, share resources, and join live classes.`
    );

    // If conversation already has members
    if (conversation.members && Array.isArray(conversation.members) && conversation.members.length > 0) {
      processMembers(conversation.members);
    } else if (conversation.id) {
      // Fetch details from backend
      setLoadingMembers(true);
      api
        .get(`/conversations/${conversation.id}`)
        .then((res) => {
          const data = res.data.data || res.data;
          if (data.members) {
            processMembers(data.members);
          }
          if (data.description) {
            setDescription(data.description);
          }
        })
        .catch((err) => {
          console.error("Failed to load conversation details:", err);
        })
        .finally(() => {
          setLoadingMembers(false);
        });
    }
  }, [conversation]);

  const processMembers = (rawMembers) => {
    const formatted = rawMembers.map((m) => {
      const p = m.profile || {};
      const uid = m.user_id || m.userId || p.id;
      const isMe = uid === currentUserId;
      const isGroupAdmin = m.role === "admin" || uid === conversation?.createdBy;

      return {
        id: uid,
        isMe,
        name: isMe ? "You" : p.full_name || p.username || "Student",
        fullName: p.full_name || p.username || (isMe ? "You" : "Student"),
        avatar: p.avatar_url || null,
        initials: p.initials || (p.full_name ? p.full_name.slice(0, 2).toUpperCase() : "ST"),
        colorBg: p.avatar_color_bg || "#6366f1",
        colorText: p.avatar_color_text || "#ffffff",
        role: isGroupAdmin ? "admin" : "member",
        isOnline: p.status === "online",
        lastSeen: p.last_seen_at
          ? new Date(p.last_seen_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : p.status === "online"
          ? "Online"
          : "Recently active",
      };
    });

    // Sort: Group Admins first, then "You", then other students alphabetically
    formatted.sort((a, b) => {
      if (a.role === "admin" && b.role !== "admin") return -1;
      if (b.role === "admin" && a.role !== "admin") return 1;
      if (a.isMe) return -1;
      if (b.isMe) return 1;
      return a.name.localeCompare(b.name);
    });

    setMembers(formatted);
  };

  const handleSaveDescription = async () => {
    if (!description.trim() || !conversation?.id) return;
    setIsSavingDesc(true);
    try {
      await api.patch(`/conversations/${conversation.id}`, { description });
      toast.success("Group description updated");
      setIsEditingDesc(false);
      if (updateConversation) {
        updateConversation(conversation.id, { description });
      }
    } catch (err) {
      toast.error("Failed to update description");
    } finally {
      setIsSavingDesc(false);
    }
  };

  const handleSaveName = async () => {
    if (!groupName.trim() || !conversation?.id) {
      setIsEditingName(false);
      return;
    }
    try {
      await api.patch(`/conversations/${conversation.id}`, { name: groupName });
      toast.success("Group name updated");
      setIsEditingName(false);
      if (updateConversation) {
        updateConversation(conversation.id, { displayName: groupName, name: groupName });
      }
    } catch (err) {
      toast.error("Failed to update group name");
    }
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/chat?join=${conversation?.id}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    toast.success("Invite link copied to clipboard");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", bounce: 0, duration: 0.35 }}
        className="absolute top-0 right-0 bottom-0 w-full sm:w-[390px] bg-white dark:bg-[#111b21] z-40 border-l border-gray-200 dark:border-gray-800 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="h-16 px-4 flex items-center justify-between bg-gray-50 dark:bg-[#202c33] border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-600 dark:text-gray-300"
            >
              <X size={20} />
            </button>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Group Info
            </h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 flex items-center gap-1">
            <Sparkles size={12} />
            Course Group
          </span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-8">
          {/* Main Group Header Profile */}
          <div className="bg-white dark:bg-[#111b21] flex flex-col items-center py-6 px-4 border-b border-gray-200 dark:border-gray-800">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 mb-4 overflow-hidden group relative flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800">
              {conversation?.avatarUrl ? (
                <img
                  src={conversation.avatarUrl}
                  alt="group"
                  className="w-full h-full object-cover"
                />
              ) : (
                <GraduationCap className="text-white w-14 h-14" />
              )}
            </div>

            <div className="flex items-center gap-2 w-full justify-center group px-4">
              {isEditingName ? (
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  autoFocus
                  className="text-lg font-bold text-center bg-transparent border-b-2 border-indigo-500 focus:outline-none text-gray-900 dark:text-white w-full"
                />
              ) : (
                <div className="flex items-center justify-center gap-1.5 max-w-full">
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white text-center line-clamp-2">
                    {groupName}
                  </h1>
                  {isAdmin && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-gray-400 hover:text-indigo-500 shrink-0 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Edit group name"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mt-1">
              Group • {members.length} {members.length === 1 ? "member" : "members"}
            </p>
          </div>

          {/* Description Section */}
          <div className="bg-white dark:bg-[#111b21] py-4 px-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Description
              </span>
              {isAdmin && !isEditingDesc && (
                <button
                  onClick={() => setIsEditingDesc(true)}
                  className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 text-xs font-bold flex items-center gap-1"
                >
                  <Edit2 size={12} /> Edit
                </button>
              )}
            </div>
            {isEditingDesc ? (
              <div className="flex flex-col gap-2.5">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 text-xs text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none leading-relaxed"
                />

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingDesc(false)}
                    className="text-xs text-gray-500 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDescription}
                    disabled={isSavingDesc}
                    className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3.5 py-1.5 shadow-sm transition-all"
                  >
                    {isSavingDesc ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Invite Link (Admin Only) */}
          {isAdmin && (
            <div
              onClick={handleCopyInviteLink}
              className="bg-white dark:bg-[#111b21] py-3.5 px-6 border-b border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors flex items-center gap-3.5 group"
            >
              <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                {copiedLink ? <Check size={18} className="text-emerald-500" /> : <LinkIcon size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                  {copiedLink ? "Link Copied!" : "Invite via link"}
                </h3>
                <p className="text-[11px] text-gray-500 truncate">
                  Share invite link with enrolled students
                </p>
              </div>
              <Copy size={16} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
            </div>
          )}

          {/* Members Section */}
          <div className="bg-white dark:bg-[#111b21] py-3 mt-1">
            <div className="px-6 py-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {members.length} {members.length === 1 ? "Participant" : "Participants"}
              </span>
              <span className="text-[11px] text-gray-400">
                {members.filter((m) => m.isOnline).length} Online
              </span>
            </div>

            {loadingMembers && members.length === 0 ? (
              <div className="px-6 py-4 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="relative group">
                  <div
                    className="px-6 py-3 hover:bg-gray-50 dark:hover:bg-[#202c33] cursor-pointer transition-colors flex items-center gap-3.5"
                    onClick={() =>
                      activeMenu === member.id ? setActiveMenu(null) : setActiveMenu(member.id)
                    }
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden font-bold text-xs shadow-xs"
                        style={{
                          backgroundColor: member.avatar ? "transparent" : member.colorBg,
                          color: member.colorText,
                        }}
                      >
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{member.initials}</span>
                        )}
                      </div>
                      {member.isOnline && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#111b21] rounded-full shadow-xs" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {member.isMe ? "You" : member.fullName}
                        </span>
                        {member.role === "admin" ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0 flex items-center gap-1">
                            <ShieldCheck size={10} />
                            Instructor / Admin
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 shrink-0 flex items-center gap-1">
                            <GraduationCap size={10} />
                            Student
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {member.isOnline ? "Online" : member.lastSeen}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Danger Zone */}
          <div className="mt-3 bg-white dark:bg-[#111b21] border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={() => {
                toast.info("Course community groups remain active for your enrolled courses.");
              }}
              className="w-full px-6 py-3.5 flex items-center gap-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
            >
              <LogOut size={18} />
              <span className="text-xs font-bold">Exit Course Community</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
