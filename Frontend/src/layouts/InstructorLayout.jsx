import React from 'react';
import { Outlet } from 'react-router-dom';
import { InstructorSidebar } from '../components/instructor/InstructorSidebar';
import { InstructorTopNav } from '../components/instructor/InstructorTopNav';

export default function InstructorLayout() {
  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      <InstructorSidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <InstructorTopNav />
        <div className="flex-1 overflow-auto bg-[#f8f9fc] flex flex-col">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
