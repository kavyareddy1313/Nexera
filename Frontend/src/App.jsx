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
import InstructorMessagesPage from './pages/InstructorMessagesPage';
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
import InstructorLayout from './layouts/InstructorLayout';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import AiFloatingButton from './components/ai/AiFloatingButton';

import AiDocumentsPage from './pages/AiDocumentsPage';
import AiWorkspaceViewer from './pages/AiWorkspaceViewer';
import CourseGeneratorWizard from './pages/CourseGeneratorWizard';

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
            path="/instructor"
            element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <InstructorLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<InstructorDashboard />} />
            <Route path="messages" element={<InstructorMessagesPage />} />
            <Route path="courses" element={<InstructorCoursesPage />} />
            <Route path="courses/create" element={<CreateCoursePage />} />
            <Route path="course-generator" element={<CourseGeneratorWizard />} />
            <Route path="courses/:id/manage" element={<CourseContentManager />} />
            <Route path="students" element={<InstructorStudentsPage />} />
            <Route path="reviews" element={<InstructorReviewsPage />} />
            <Route path="analytics" element={<InstructorAnalyticsPage />} />
            <Route path="revenue" element={<InstructorRevenuePage />} />
            <Route path="certificates" element={<InstructorCertificatesPage />} />
            <Route path="notifications" element={<InstructorNotificationsPage />} />
            <Route path="live-classes" element={<InstructorLiveClassesPage />} />
            <Route path="calendar" element={<InstructorCalendarPage />} />
            <Route path="settings" element={<InstructorSettingsPage />} />
          </Route>

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

          {/* AI Module 1 Routes */}
          <Route
            path="/ai/documents"
            element={
              <ProtectedRoute>
                <AiDocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai/workspace/:id"
            element={
              <ProtectedRoute>
                <AiWorkspaceViewer />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <AiFloatingButton />
      </Router>
    </AuthProvider>
  );
}

export default App;
