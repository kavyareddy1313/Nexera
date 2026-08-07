import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      set({ user, isAuthenticated: true, loading: false });
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Login failed', 
        loading: false 
      });
      return false;
    }
  },

  register: async (fullName, username, email, password, role) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/register', { fullName, username, email, password, role });
      set({ loading: false });
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Registration failed', 
        loading: false 
      });
      return false;
    }
  },

  updateProfile: async (profileData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put('/auth/profile', profileData);
      const updatedUser = response.data.data;
      
      // Update local storage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update state
      set({ user: updatedUser, loading: false });
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Profile update failed', 
        loading: false 
      });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false });
    }
  },

  forgotPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/forgot-password', { email });
      set({ loading: false });
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || error.response?.data?.error?.message || 'Failed to send reset link', 
        loading: false 
      });
      return false;
    }
  },

  resetPassword: async (token, newPassword) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      set({ loading: false });
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || error.response?.data?.error?.message || 'Failed to reset password', 
        loading: false 
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
