import React from 'react';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, ChevronDown } from 'lucide-react';
import { WizardSidebar } from './WizardSidebar';

export function Step1BasicInfo({ courseData = {}, updateCourseData = () => {} }) {
  return (
    <div className="flex h-full w-full bg-[#f8f9fc]">
      <WizardSidebar currentStep={1} setStep={() => {}} />
      
      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Basic Information</h2>
            <p className="text-gray-500 font-medium">Set the foundation for your new course.</p>
          </div>

          <div className="space-y-6">
            {/* Title and Subtitle Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold text-gray-500 tracking-widest uppercase">Course Title</label>
                  <span className="text-xs font-medium text-gray-400">{(courseData.title || '').length}/80</span>
                </div>
                <input 
                  type="text" 
                  placeholder="e.g. Master Web Design with Figma" 
                  value={courseData.title || ''}
                  onChange={(e) => updateCourseData({ title: e.target.value.slice(0, 80) })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold text-gray-500 tracking-widest uppercase">Subtitle</label>
                  <span className="text-xs font-medium text-gray-400">{(courseData.subtitle || '').length}/120</span>
                </div>
                <input 
                  type="text" 
                  placeholder="A brief overview of what students will learn" 
                  value={courseData.subtitle || ''}
                  onChange={(e) => updateCourseData({ subtitle: e.target.value.slice(0, 120) })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <label className="block text-xs font-bold text-gray-500 tracking-widest uppercase mb-4">Description</label>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Rich Text Toolbar */}
                <div className="bg-[#f8f9fc] border-b border-gray-200 px-4 py-3 flex items-center gap-4">
                  <button className="text-gray-500 hover:text-gray-900"><Bold size={16} strokeWidth={2.5} /></button>
                  <button className="text-gray-500 hover:text-gray-900"><Italic size={16} /></button>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <button className="text-gray-500 hover:text-gray-900"><List size={18} /></button>
                  <button className="text-gray-500 hover:text-gray-900"><ListOrdered size={18} /></button>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <button className="text-gray-500 hover:text-gray-900"><LinkIcon size={16} /></button>
                </div>
                {/* Text Area */}
                <textarea 
                  rows={8}
                  placeholder="Describe what makes this course special..."
                  value={courseData.description || ''}
                  onChange={(e) => updateCourseData({ description: e.target.value })}
                  className="w-full p-5 text-sm font-medium text-gray-900 focus:outline-none resize-none"
                ></textarea>
                <div className="flex justify-end p-1">
                  <div className="w-3 h-3 border-r-2 border-b-2 border-gray-300 mr-1 mb-1 opacity-50 cursor-se-resize"></div>
                </div>
              </div>
            </div>

            {/* Category and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#f8f9fc] rounded-3xl p-8 shadow-sm border border-gray-100">
                <label className="block text-xs font-bold text-gray-500 tracking-widest uppercase mb-4">Category</label>
                <div className="relative">
                  <select 
                    value={courseData.category || 'Development'}
                    onChange={(e) => updateCourseData({ category: e.target.value })}
                    className="w-full appearance-none bg-white border border-transparent rounded-xl px-4 py-3.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm cursor-pointer"
                  >
                    <option value="Development">Development</option>
                    <option value="Design">UI/UX Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Architecture">Architecture</option>
                    <option value="Business">Business</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              
              <div className="bg-[#f8f9fc] rounded-3xl p-8 shadow-sm border border-gray-100">
                <label className="block text-xs font-bold text-gray-500 tracking-widest uppercase mb-4">Course Duration</label>
                <input 
                  type="text"
                  placeholder="e.g. 20 Hours"
                  value={courseData.duration || ''}
                  onChange={(e) => updateCourseData({ duration: e.target.value })}
                  className="w-full bg-white border border-transparent rounded-xl px-4 py-3.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
