import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Eye, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  PlayCircle, 
  FileText, 
  HelpCircle, 
  Plus, 
  Play,
  MonitorPlay
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CourseContentManager() {
  const [activeTab, setActiveTab] = useState('video');
  const [allowPreview, setAllowPreview] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-[#f8f9fc] font-sans">
      
      {/* Top Header */}
      <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/instructor/courses" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-[17px] font-bold text-indigo-700">Advanced UI Design Mastery</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-gray-500">Saved 2 min ago</span>
          <button className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-indigo-100 transition-colors">
            <Eye size={18} />
            Preview course
          </button>
          <button className="bg-gray-100 text-gray-400 px-6 py-2.5 rounded-full text-sm font-bold cursor-not-allowed">
            Save changes
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar */}
        <aside className="w-[320px] bg-[#f8f9fc] border-r border-gray-200 flex flex-col h-full shrink-0">
          <div className="p-6 pb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Curriculum</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search lessons..." 
                className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 custom-scrollbar pb-6 space-y-2">
            
            {/* Module 1 */}
            <div>
              <div className="flex items-center justify-between px-2 py-3 cursor-pointer group">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Module 1: Introduction</h3>
                  <p className="text-[11px] font-medium text-gray-500">3 lessons</p>
                </div>
                <ChevronDown size={18} className="text-gray-400" />
              </div>
              
              <div className="space-y-1 mt-1">
                {/* Active Lesson */}
                <div className="bg-white rounded-xl p-3 flex items-start gap-3 border border-gray-200 shadow-sm relative overflow-hidden cursor-pointer">
                  {/* Left purple border */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600"></div>
                  
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                    <MonitorPlay size={14} className="text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-700 mb-0.5">What is UI Design?</h4>
                    <span className="text-[11px] font-bold text-gray-400">12:34</span>
                  </div>
                </div>

                {/* Lesson 2 */}
                <div className="rounded-xl p-3 flex items-start gap-3 hover:bg-white border border-transparent hover:border-gray-100 transition-all cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText size={14} className="text-pink-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-0.5">Design Principles</h4>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reading</span>
                  </div>
                </div>

                {/* Lesson 3 */}
                <div className="rounded-xl p-3 flex items-start gap-3 hover:bg-white border border-transparent hover:border-gray-100 transition-all cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                    <HelpCircle size={14} className="text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-0.5">Module 1 Knowledge Check</h4>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">5 Questions</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Module 2 */}
            <div className="mt-4">
              <div className="flex items-center justify-between px-2 py-3 cursor-pointer group hover:bg-white rounded-xl transition-colors">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Module 2: Color Theory</h3>
                  <p className="text-[11px] font-medium text-gray-500">4 lessons</p>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>
            </div>

            {/* Add new module */}
            <div className="pt-4">
              <button className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-3.5 text-sm font-bold text-gray-500 hover:border-gray-300 hover:bg-white hover:shadow-sm transition-all">
                <Plus size={16} strokeWidth={2.5} />
                Add new module
              </button>
            </div>
            
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-white relative">
          <div className="max-w-4xl mx-auto p-10 pb-32">
            
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm font-semibold mb-6">
              <span className="text-gray-500">Module 1: Introduction</span>
              <ChevronRight size={14} className="text-gray-400" />
              <span className="text-indigo-600">Lesson 1</span>
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-8">What is UI Design?</h2>

            {/* Content Type Tabs */}
            <div className="flex items-center bg-[#f8f9fc] rounded-2xl p-1.5 w-max mb-8 border border-gray-100 shadow-sm">
              <button 
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'video' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <MonitorPlay size={18} />
                Video
              </button>
              <button 
                onClick={() => setActiveTab('article')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'article' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FileText size={18} />
                Article
              </button>
              <button 
                onClick={() => setActiveTab('pdf')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'pdf' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FileText size={18} />
                PDF
              </button>
              <button 
                onClick={() => setActiveTab('quiz')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'quiz' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <HelpCircle size={18} />
                Quiz
              </button>
            </div>

            {/* Video Source Card */}
            {activeTab === 'video' && (
              <div className="bg-[#f8f9fc] rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[17px] font-bold text-gray-900">Video Source</h3>
                  <span className="bg-gray-200/60 text-gray-600 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full">
                    Duration: 12:34
                  </span>
                </div>

                {/* Video Player Placeholder */}
                <div className="w-full aspect-video bg-[#1a1b2e] rounded-2xl flex items-center justify-center shadow-inner relative mb-8 overflow-hidden group cursor-pointer">
                  <div className="w-16 h-16 bg-indigo-500/20 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Play size={24} className="text-white fill-white ml-1" />
                    </div>
                  </div>
                </div>

                {/* Allow Free Preview */}
                <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                  <div>
                    <h4 className="text-[15px] font-bold text-gray-900 mb-1">Allow Free Preview</h4>
                    <p className="text-sm font-medium text-gray-500">Enable this lesson to be viewed by anyone without enrolling.</p>
                  </div>
                  <button 
                    onClick={() => setAllowPreview(!allowPreview)}
                    className={`w-12 h-7 rounded-full p-1 transition-colors relative flex items-center shrink-0 ${allowPreview ? 'bg-indigo-600' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${allowPreview ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </button>
                </div>
                
              </div>
            )}

          </div>

          {/* Sticky Bottom Bar (Discard / Save) */}
          <div className="absolute bottom-0 left-0 right-0 h-[88px] bg-white border-t border-gray-100 flex items-center justify-end px-10 gap-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
            <button className="text-gray-500 hover:text-gray-900 font-bold text-sm transition-colors px-4">
              Discard Changes
            </button>
            <button className="bg-[#5c4ce3] text-white font-bold px-8 py-3 rounded-full hover:bg-indigo-700 transition-colors shadow-sm text-sm">
              Save Changes
            </button>
          </div>

        </main>

      </div>
    </div>
  );
}
