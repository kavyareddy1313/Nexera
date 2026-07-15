import React from 'react';
import { InstructorSidebar } from '../components/instructor/InstructorSidebar';
import { InstructorRevenue } from '../components/instructor/InstructorRevenue';

export default function InstructorRevenuePage() {
  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      <InstructorSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <InstructorRevenue />
      </div>
    </div>
  );
}
