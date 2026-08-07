import { create } from 'zustand';
import api from '../api/axios';

const useDashboardStore = create((set) => ({
  stats: {
    activeUsers: 0,
    totalMeetings: 0,
    activeBoards: 0,
    storageUsed: 0,
  },
  activities: [],
  schedule: [],
  recentBoards: [],
  pinnedMessage: null,
  loading: false,

  fetchDashboardData: async () => {
    set({ loading: true });
    try {
      // In a real app, these would be separate calls or one aggregate call
      const [meetingsRes, boardsRes] = await Promise.all([
        api.get('/meetings'),
        api.get('/whiteboard/boards'),
      ]);

      set({
        schedule: meetingsRes.data.data,
        recentBoards: boardsRes.data.data,
        loading: false,
      });
    } catch (error) {
      console.error('Fetch dashboard error:', error);
      set({ loading: false });
    }
  },

  // Mock data for things not yet fully in DB but needed for UI
  fetchMockActivities: () => {
    set({
      activities: [
        { id: 1, user: 'Ethan Vance', action: 'uploaded a new design', time: '2m ago', type: 'upload' },
        { id: 2, user: 'Sarah Drasner', action: 'joined the meeting', time: '15m ago', type: 'meeting' },
        { id: 3, user: 'AI Assistant', action: 'summarized the chat history', time: '1h ago', type: 'ai' },
      ],
      stats: {
        activeUsers: 124,
        totalMeetings: 12,
        activeBoards: 4,
        storageUsed: 85,
      },
      pinnedMessage: {
        user: 'Julian Rossi',
        content: 'Remember to update the design tokens by Friday! 🚀',
        time: 'Oct 24',
      }
    });
  }
}));

export default useDashboardStore;
