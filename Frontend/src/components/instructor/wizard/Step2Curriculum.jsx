import React from 'react';
import { 
  GripVertical, 
  ChevronDown, 
  Plus, 
  PlayCircle, 
  FileText, 
  AlignLeft, 
  HelpCircle,
  Eye,
  Trash2,
  UploadCloud
} from 'lucide-react';

export function Step2Curriculum() {
  return (
    <div className="flex h-full w-full bg-[#f3f4f9]">
      {/* Curriculum Sidebar */}
      <aside className="w-[320px] bg-[#f8f9fc] border-r border-gray-100 flex flex-col h-full shrink-0">
        <div className="p-6 flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold text-gray-900 tracking-tight">Curriculum Structure</h2>
          <button className="text-gray-400 hover:text-gray-700">
            <ChevronDown size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-4">
          
          {/* Module 1 */}
          <div>
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 border border-gray-100 mb-2 relative z-10">
              <GripVertical size={16} className="text-gray-300 cursor-grab" />
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-xs">
                M1
              </div>
              <span className="font-bold text-sm text-gray-900">Introduction to Design</span>
            </div>
            
            {/* Lessons for M1 */}
            <div className="pl-6 border-l-2 border-indigo-100 ml-6 space-y-2 relative -mt-4 pt-6">
              
              {/* Active Lesson */}
              <div className="bg-indigo-50/50 rounded-xl p-3 flex items-center justify-between border border-indigo-100 relative group cursor-pointer">
                {/* Active Indicator Line */}
                <div className="absolute left-[-2px] top-2 bottom-2 w-1 bg-indigo-600 rounded-r-md"></div>
                <div className="flex items-center gap-3 pl-2">
                  <PlayCircle size={14} className="text-indigo-600" />
                  <span className="text-sm font-semibold text-indigo-700">What is UX?</span>
                </div>
                <span className="bg-white px-2 py-0.5 rounded-md text-[11px] font-bold text-gray-500 shadow-sm">
                  4:20
                </span>
              </div>

              {/* Inactive Lesson */}
              <div className="rounded-xl p-3 flex items-center justify-between hover:bg-gray-50 transition-colors group cursor-pointer border border-transparent">
                <div className="flex items-center gap-3 pl-2">
                  <AlignLeft size={14} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">History of UI Patterns</span>
                </div>
              </div>

              {/* Quiz */}
              <div className="rounded-xl p-3 flex items-center justify-between hover:bg-gray-50 transition-colors group cursor-pointer border border-transparent">
                <div className="flex items-center gap-3 pl-2">
                  <HelpCircle size={14} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Module 1 Knowledge Check</span>
                </div>
              </div>

              {/* Add Lesson Button */}
              <button className="flex items-center gap-2 pl-5 pt-2 pb-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                <Plus size={14} strokeWidth={3} />
                Add Lesson
              </button>
            </div>
          </div>

          {/* Module 2 */}
          <div>
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 border border-gray-100 mb-2 relative z-10">
              <GripVertical size={16} className="text-gray-300 cursor-grab" />
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-xs">
                M2
              </div>
              <span className="font-bold text-sm text-gray-900">Core Principles</span>
            </div>
            <div className="pl-6 border-l-2 border-gray-100 ml-6 relative -mt-4 pt-6">
              <button className="flex items-center gap-2 pl-5 pt-2 pb-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                <Plus size={14} strokeWidth={3} />
                Add Lesson
              </button>
            </div>
          </div>

        </div>

        {/* Add New Module */}
        <div className="p-6">
          <button className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-4 text-sm font-bold text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-all">
            <Plus size={18} strokeWidth={2.5} />
            Add New Module
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-3xl mx-auto bg-white rounded-[2rem] p-10 shadow-sm border border-gray-100">
          
          {/* Lesson Title Header */}
          <div className="flex justify-between items-start mb-10">
            <div>
              <label className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-3 block">Lesson Title</label>
              <h2 className="text-xl font-bold text-gray-900">What is UX?</h2>
            </div>
            <div className="flex items-center gap-4 text-gray-500">
              <button className="hover:text-gray-900 transition-colors"><Eye size={20} /></button>
              <button className="hover:text-gray-900 transition-colors"><Trash2 size={20} /></button>
            </div>
          </div>

          {/* Content Type Selector */}
          <div className="mb-10">
            <label className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-4 block">Content Type</label>
            <div className="flex items-center bg-[#f8f9fc] rounded-xl p-1.5 w-max border border-gray-100">
              <button className="flex items-center gap-2 bg-white text-indigo-700 px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm">
                <PlayCircle size={16} />
                Video
              </button>
              <button className="flex items-center gap-2 text-gray-500 hover:text-gray-900 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                <FileText size={16} />
                PDF
              </button>
              <button className="flex items-center gap-2 text-gray-500 hover:text-gray-900 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                <AlignLeft size={16} />
                Article
              </button>
              <button className="flex items-center gap-2 text-gray-500 hover:text-gray-900 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                <HelpCircle size={16} />
                Quiz
              </button>
            </div>
          </div>

          {/* Main Content Upload */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <label className="text-xs font-bold text-gray-500 tracking-widest uppercase">Main Content</label>
              <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800">Select from library</button>
            </div>
            
            <div className="bg-[#f8f9fc] border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all hover:bg-gray-50">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <UploadCloud size={28} className="text-indigo-600" />
              </div>
              <h3 className="text-[15px] font-bold text-gray-900 mb-1">Drag & drop video file here</h3>
              <p className="text-sm font-medium text-gray-500 mb-6">MP4, WebM up to 2GB</p>
              
              <button className="bg-white border border-gray-200 px-6 py-2.5 rounded-full text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                Browse Files
              </button>
            </div>
          </div>

          {/* Lesson Description */}
          <div>
            <label className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-4 block">Lesson Description</label>
            <textarea 
              rows={4}
              placeholder="Add a brief description or notes for the students..."
              className="w-full bg-[#f8f9fc] border border-transparent rounded-2xl p-5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            ></textarea>
            {/* Visual resize handle */}
            <div className="flex justify-end p-1 -mt-4 mr-2 relative pointer-events-none">
              <div className="w-3 h-3 border-r-2 border-b-2 border-gray-300 opacity-50"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
