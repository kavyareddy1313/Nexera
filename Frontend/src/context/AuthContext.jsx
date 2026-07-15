import { createContext, useContext, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const store = useAuthStore();

  // On mount, if we don't have user data but we are authenticated, we might want to fetch /me
  // But for this phase, we rely on the store's initial state (from localStorage)
  
  return (
    <AuthContext.Provider value={{
      user: store.user,
      isAuthenticated: store.isAuthenticated,
      isLoading: store.loading,
      error: store.error,
      login: store.login,
      register: store.register,
      logout: store.logout,
      forgotPassword: store.forgotPassword,
      resetPassword: store.resetPassword,
      clearError: store.clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
