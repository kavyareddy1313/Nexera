import React from 'react';
import { InstructorSidebar } from '../components/instructor/InstructorSidebar';
import { InstructorStudents } from '../components/instructor/InstructorStudents';

export default function InstructorStudentsPage() {
  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      <InstructorSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <InstructorStudents />
      </div>
    </div>
  );
}
