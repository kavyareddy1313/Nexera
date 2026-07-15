import React from 'react';
import useAuthStore from '../store/useAuthStore';
import Sidebar from '../components/Sidebar';
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar';
import { DashboardTopNav } from '../components/dashboard/DashboardTopNav';
import { DashboardWorkspace } from '../components/dashboard/DashboardWorkspace';

export default function StudentDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      <Sidebar />
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopNav user={user} />
        <DashboardWorkspace />
      </div>
    </div>
  );
}
