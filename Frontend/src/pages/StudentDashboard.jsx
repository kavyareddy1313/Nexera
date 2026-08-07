import React from 'react';
import useAuthStore from '../store/useAuthStore';
import { GlobalNavRail } from '../components/layout/GlobalNavRail';
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar';
import { DashboardTopNav } from '../components/dashboard/DashboardTopNav';
import { DashboardWorkspace } from '../components/dashboard/DashboardWorkspace';

export default function StudentDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="flex h-screen bg-[#f8f9fc] overflow-hidden font-sans">
      <GlobalNavRail activeRoute="/dashboard" />
      <div className="flex flex-col flex-1 h-full min-w-0">
        <DashboardTopNav user={user} />
        <div className="flex flex-1 h-full overflow-hidden">
          <div className="hidden lg:flex h-full">
            <DashboardSidebar />
          </div>
          <DashboardWorkspace />
        </div>
      </div>
    </div>
  );
}
