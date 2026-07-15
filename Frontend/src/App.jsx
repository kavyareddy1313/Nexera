import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import ChatShell from './pages/ChatShell';
import CoursesExplore from './pages/CoursesExplore';
import CourseDetails from './pages/CourseDetails';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorCoursesPage from './pages/InstructorCoursesPage';
import CreateCoursePage from './pages/CreateCoursePage';
import CourseContentManager from './pages/CourseContentManager';
import InstructorStudentsPage from './pages/InstructorStudentsPage';
import InstructorReviewsPage from './pages/InstructorReviewsPage';
import InstructorAnalyticsPage from './pages/InstructorAnalyticsPage';
import InstructorRevenuePage from './pages/InstructorRevenuePage';
import InstructorCertificatesPage from './pages/InstructorCertificatesPage';
import InstructorNotificationsPage from './pages/InstructorNotificationsPage';
import InstructorLiveClassesPage from './pages/InstructorLiveClassesPage';
import InstructorCalendarPage from './pages/InstructorCalendarPage';
import InstructorSettingsPage from './pages/InstructorSettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

const DashboardRouter = () => {
  const { user } = useAuth();
  
  const userRole = user?.role || 'student';

  if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (userRole === 'instructor') return <Navigate to="/instructor/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/instructor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <InstructorDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/instructor/courses"
            element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <InstructorCoursesPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/instructor/courses/create"
            element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <CreateCoursePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor/courses/:id/manage"
            element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <CourseContentManager />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor/students"
            element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <InstructorStudentsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor/reviews"
            element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <InstructorReviewsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor/analytics"
            element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <InstructorAnalyticsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor/revenue"
            element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <InstructorRevenuePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor/certificates"
            element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <InstructorCertificatesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor/notifications"
            element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <InstructorNotificationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor/live-classes"
            element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <InstructorLiveClassesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor/calendar"
            element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <InstructorCalendarPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/instructor/settings"
            element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <InstructorSettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatShell />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <CoursesExplore />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:id"
            element={
              <ProtectedRoute>
                <CourseDetails />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
