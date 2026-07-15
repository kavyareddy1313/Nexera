import React from 'react';
import { InstructorSidebar } from '../components/instructor/InstructorSidebar';
import { InstructorLiveClasses } from '../components/instructor/InstructorLiveClasses';

export default function InstructorLiveClassesPage() {
  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      <InstructorSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <InstructorLiveClasses />
      </div>
    </div>
  );
}
