import React from 'react';
import { InstructorSidebar } from '../components/instructor/InstructorSidebar';
import { InstructorCalendar } from '../components/instructor/InstructorCalendar';

export default function InstructorCalendarPage() {
  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      <InstructorSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <InstructorCalendar />
      </div>
    </div>
  );
}
