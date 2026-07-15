import React from 'react';
import { InstructorSidebar } from '../components/instructor/InstructorSidebar';
import { InstructorReviews } from '../components/instructor/InstructorReviews';

export default function InstructorReviewsPage() {
  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      <InstructorSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <InstructorReviews />
      </div>
    </div>
  );
}
