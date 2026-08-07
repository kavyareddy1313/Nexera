import React from 'react';
import { Image as ImageIcon, Save, Rocket, CheckCircle2, ArrowRight, MessageSquare, Users } from 'lucide-react';

export function Step4Publish({ courseData = {}, isPublishing = false }) {
  const hasTitle = !!courseData.title?.trim();
  const hasDescription = !!courseData.description?.trim();
  const hasPrice = Number(courseData.price) > 0;
  const allReady = hasTitle && hasDescription;

  return (
    <div className="flex-1 flex overflow-y-auto bg-[#f8f9fc] p-12 custom-scrollbar justify-center">
      <div className="max-w-[1000px] w-full">
        
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-[17px] font-bold text-gray-900 mb-2">Review and Publish</h2>
          <p className="text-[15px] font-medium text-gray-500 max-w-2xl leading-relaxed">
            Review your course details one last time before making it available to the world. 
            A <strong>community group chat</strong> will be automatically created for this course.
          </p>
        </div>

        {/* 3 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Course Preview */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <div className="h-[200px] bg-indigo-100 flex items-center justify-center">
              {courseData.thumbnailUrl ? (
                <img src={courseData.thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={32} className="text-indigo-500" />
              )}
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-sm font-bold text-gray-900 mb-1">{courseData.title || 'Untitled Course'}</h3>
              <div className="flex items-center gap-2 text-gray-500 mb-4">
                <span className="text-[11px] font-bold tracking-widest uppercase">{courseData.category || 'Uncategorized'}</span>
              </div>
              <p className="text-xs text-gray-400 line-clamp-2 mb-4">
                {courseData.description || courseData.subtitle || 'No description yet'}
              </p>
              <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-5">
                <span className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">Price</span>
                <span className="text-lg font-extrabold text-indigo-700">
                  {hasPrice ? `₹${Number(courseData.price).toFixed(0)}` : 'Free'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Community Group Info */}
          <div className="bg-gradient-to-b from-indigo-50 to-white rounded-[2rem] p-8 flex flex-col border border-indigo-100/50">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
              <MessageSquare size={20} className="text-indigo-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-3">Auto-Created Group</h3>
            <p className="text-sm font-medium text-gray-500 leading-relaxed mb-4">
              A <strong>WhatsApp-style community group</strong> will be created automatically.
            </p>
            <div className="space-y-2.5 text-xs text-gray-500 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500" />
                You'll be the group admin
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500" />
                Enrolled students join automatically
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500" />
                Chat, files, live classes in one place
              </div>
            </div>
            <div className="mt-auto pt-4">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-600">
                <Users size={16} />
                {courseData.title ? `"${courseData.title} Community"` : 'Course Community'}
              </div>
            </div>
          </div>

          {/* Card 3: Publish Readiness */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col">
            {/* Top highlight */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${allReady ? 'bg-green-500' : 'bg-amber-500'}`}></div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Rocket size={20} />
              </div>
              <span className={`text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full ${
                allReady 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-amber-50 text-amber-700'
              }`}>
                {allReady ? 'Ready to Publish' : 'Needs Attention'}
              </span>
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-2">
              {allReady ? 'Publish Now' : 'Almost Ready'}
            </h3>
            <p className="text-[13px] font-medium text-gray-500 leading-relaxed mb-6">
              {allReady 
                ? 'Everything looks good! Click "Publish Course" in the footer to go live.' 
                : 'Please complete the missing requirements before publishing.'}
            </p>

            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className={hasTitle ? "text-green-500" : "text-gray-300"} />
                <span className="text-sm font-medium text-gray-700">Title & Basic Info</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-green-500" />
                <span className="text-sm font-medium text-gray-700">Curriculum Content</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className={hasPrice ? "text-green-500" : "text-gray-300"} />
                <span className="text-sm font-medium text-gray-700">Pricing Settings</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className={hasDescription ? "text-green-500" : "text-gray-300"} />
                <span className="text-sm font-medium text-gray-700">Course Description</span>
              </div>
            </div>

            {isPublishing && (
              <div className="mt-6 flex items-center gap-3 bg-indigo-50 p-4 rounded-xl">
                <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <span className="text-sm font-bold text-indigo-700">Publishing course & creating group...</span>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
