import React from 'react';
import { InstructorSidebar } from '../components/instructor/InstructorSidebar';
import { InstructorTopNav } from '../components/instructor/InstructorTopNav';
import { InstructorWorkspace } from '../components/instructor/InstructorWorkspace';

export default function InstructorDashboard() {
  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      <InstructorSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <InstructorTopNav />
        <InstructorWorkspace />
      </div>
    </div>
  );
}
