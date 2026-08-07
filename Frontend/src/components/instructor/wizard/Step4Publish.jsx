import React from 'react';
import { Image as ImageIcon, Save, Rocket, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export function Step4Publish() {
  return (
    <div className="flex-1 flex overflow-y-auto bg-[#f8f9fc] p-12 custom-scrollbar justify-center">
      <div className="max-w-[1000px] w-full">
        
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-[17px] font-bold text-gray-900 mb-2">Review and Publish</h2>
          <p className="text-[15px] font-medium text-gray-500 max-w-2xl leading-relaxed">
            Review your course details one last time before making it available to the world. You can always save it as a draft and come back later.
          </p>
        </div>

        {/* 3 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Course Preview */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <div className="h-[200px] bg-indigo-100 flex items-center justify-center">
              <ImageIcon size={32} className="text-indigo-500" />
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Mastering Design Systems</h3>
              <div className="flex items-center gap-2 text-gray-500 mb-8">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                <span className="text-[11px] font-bold tracking-widest uppercase">12 Lessons</span>
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-5">
                <span className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">Price</span>
                <span className="text-lg font-extrabold text-indigo-700">$149</span>
              </div>
            </div>
          </div>

          {/* Card 2: Save as Draft */}
          <div className="bg-[#f8f9fc] rounded-[2rem] p-8 flex flex-col border border-gray-100">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
              <Save size={20} className="text-gray-700" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-3">Save as Draft</h3>
            <p className="text-sm font-medium text-gray-500 leading-relaxed mb-8">
              Your course is safe and can be published later. All your progress is securely stored in your workspace.
            </p>
            <button className="mt-auto flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors w-max">
              Save and exit
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Card 3: Publish Now */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col">
            {/* Top Red border highlight */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Rocket size={20} />
              </div>
              <span className="bg-rose-50 text-rose-700 text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full">
                Needs Attention
              </span>
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-2">Publish Now</h3>
            <p className="text-[13px] font-medium text-gray-500 leading-relaxed mb-6">
              You are almost ready to go live. Please complete the missing requirements before publishing.
            </p>

            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">Title & Basic Info</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">Curriculum Content</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">Pricing Settings</span>
              </div>
              <div className="flex items-center gap-3 bg-rose-50 p-3 rounded-xl border border-rose-100 mt-2">
                <XCircle size={18} className="text-rose-500 shrink-0" />
                <span className="text-sm font-bold text-rose-700 flex-1">Missing Description</span>
                <button className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Fix</button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
