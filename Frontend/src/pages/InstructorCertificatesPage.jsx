import React from 'react';
import { InstructorSidebar } from '../components/instructor/InstructorSidebar';
import { InstructorCertificates } from '../components/instructor/InstructorCertificates';

export default function InstructorCertificatesPage() {
  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      <InstructorSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <InstructorCertificates />
      </div>
    </div>
  );
}
