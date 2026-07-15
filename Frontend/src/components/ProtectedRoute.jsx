import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role || 'student'; // Fallback to student for old sessions

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(userRole)) {
    console.warn(`403 Forbidden: User role is ${userRole}, but allowed roles are ${allowedRoles.join(', ')}`);
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
