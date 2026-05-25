import React from 'react';
import useAuthStore from '../store/useAuthStore';
import { GlobalNavRail } from '../components/layout/GlobalNavRail';
import { DashboardTopNav } from '../components/dashboard/DashboardTopNav';
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar';
import { DashboardWorkspace } from '../components/dashboard/DashboardWorkspace';

const DashboardPage = () => {
  const { user } = useAuthStore();

  return (
    <div className="flex h-screen w-full bg-[#f8f9fc] overflow-hidden font-sans">
      {/* 1. Shared Global Navigation Rail */}
      <GlobalNavRail activeRoute="/dashboard" />

      <div className="flex flex-col flex-1 h-full min-w-0">
        {/* 2. Top Navigation Bar */}
        <DashboardTopNav user={user} />

        {/* 3. Main Dashboard Layout (Split View) */}
        <div className="flex flex-1 h-full overflow-hidden">
          {/* Left: Activity Sidebar */}
          <div className="hidden lg:flex h-full">
            <DashboardSidebar />
          </div>

          {/* Right: Main Workspace */}
          <DashboardWorkspace />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
