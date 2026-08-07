import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useConversationStore = create()(
  persist(
    (set, get) => ({
      conversations: new Map(),
      activeConversationId: null,
      searchQuery: "",
      filter: "all",
      pinnedIds: [],
      mutedIds: [],
      archivedIds: [],
      contacts: [],

      setConversations: (conversationsArr, contactsArr = []) => {
        const newMap = new Map();
        conversationsArr.forEach((c) => newMap.set(c.id, c));
        set({ conversations: newMap, contacts: contactsArr });
      },

      addConversation: (conversation) => {
        set((state) => {
          const newMap = new Map(state.conversations);
          newMap.set(conversation.id, conversation);
          return { conversations: newMap };
        });
      },

      updateConversation: (id, updates) => {
        set((state) => {
          const newMap = new Map(state.conversations);
          const current = newMap.get(id);
          if (current) {
            newMap.set(id, { ...current, ...updates });
          }
          return { conversations: newMap };
        });
      },

      setActiveConversationId: (id) => set({ activeConversationId: id }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilter: (filter) => set({ filter }),

      togglePin: (id) =>
        set((state) => {
          const pinned = state.pinnedIds.includes(id)
            ? state.pinnedIds.filter((pid) => pid !== id)
            : [...state.pinnedIds, id].slice(0, 3); // Max 3 pinned
          return { pinnedIds: pinned };
        }),

      toggleMute: (id) =>
        set((state) => {
          const muted = state.mutedIds.includes(id)
            ? state.mutedIds.filter((mid) => mid !== id)
            : [...state.mutedIds, id];
          return { mutedIds: muted };
        }),

      toggleArchive: (id) =>
        set((state) => {
          const archived = state.archivedIds.includes(id)
            ? state.archivedIds.filter((aid) => aid !== id)
            : [...state.archivedIds, id];
          return { archivedIds: archived };
        }),

      markAsRead: (id) => get().updateConversation(id, { unreadCount: 0 }),
      deleteConversation: (id) =>
        set((state) => {
          const newMap = new Map(state.conversations);
          newMap.delete(id);
          const newState = { conversations: newMap };
          if (state.activeConversationId === id)
            newState.activeConversationId = null;
          return newState;
        }),
    }),
    {
      name: "nexera-conversations",
      partialize: (state) => ({
        pinnedIds: state.pinnedIds,
        mutedIds: state.mutedIds,
        archivedIds: state.archivedIds,
      }),
    },
  ),
);
