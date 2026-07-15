import React from 'react';
import { InstructorSidebar } from '../components/instructor/InstructorSidebar';
import { InstructorNotifications } from '../components/instructor/InstructorNotifications';

export default function InstructorNotificationsPage() {
  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      <InstructorSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <InstructorNotifications />
      </div>
    </div>
  );
}
