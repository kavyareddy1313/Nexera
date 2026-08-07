import React, { useState } from 'react';
import { X, Calendar, Clock, Video, Monitor, LayoutDashboard } from 'lucide-react';

export function ScheduleClassModal({ isOpen, onClose }) {
  const [duration, setDuration] = useState('60m');
  const [platform, setPlatform] = useState('nexera');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-[600px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-extrabold text-gray-900">Schedule Class</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
          {/* Class Title */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 tracking-widest uppercase mb-2">
              Class Title
            </label>
            <input 
              type="text" 
              placeholder="e.g. Advanced UX Patterns"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Course Alignment */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 tracking-widest uppercase mb-2">
              Course Alignment
            </label>
            <div className="relative">
              <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-gray-500">
                <option value="">Select an active course...</option>
                <option value="ui">UI/UX Masterclass</option>
                <option value="react">Advanced React</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
          </div>

          {/* Scheduling Details */}
          <div className="bg-[#f8f9fc] rounded-2xl p-5 border border-gray-100">
            <h3 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-4">Scheduling Details</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date</label>
                <div className="relative">
                  <input 
                    type="date" 
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Time</label>
                <div className="relative">
                  <input 
                    type="time" 
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-700"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Duration</label>
                <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1">
                  {['30m', '60m', '90m', '120m'].map(dur => (
                    <button
                      key={dur}
                      onClick={() => setDuration(dur)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${duration === dur ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Max Students</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </div>
                  <input 
                    type="number" 
                    placeholder="e.g. 25"
                    className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-9 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Meeting Platform */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 tracking-widest uppercase mb-3">
              Meeting Platform
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setPlatform('nexera')}
                className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all ${platform === 'nexera' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'}`}
              >
                <Monitor size={20} className={platform === 'nexera' ? 'text-indigo-600' : 'text-gray-400'} />
                <span className="text-xs font-bold">Nexera Live</span>
              </button>
              
              <button 
                onClick={() => setPlatform('zoom')}
                className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all ${platform === 'zoom' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'}`}
              >
                <Video size={20} className={platform === 'zoom' ? 'text-blue-500' : 'text-gray-400'} />
                <span className="text-xs font-bold">Zoom</span>
              </button>
              
              <button 
                onClick={() => setPlatform('meet')}
                className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all ${platform === 'meet' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'}`}
              >
                <Video size={20} className={platform === 'meet' ? 'text-emerald-500' : 'text-gray-400'} />
                <span className="text-xs font-bold">Google Meet</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 tracking-widest uppercase mb-2">
              Description (Optional)
            </label>
            <textarea 
              placeholder="Briefly describe what will be covered..."
              rows={3}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            ></textarea>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onClose}
            className="flex items-center gap-2 bg-[#5c4ce3] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Calendar size={16} />
            Schedule
          </button>
        </div>

      </div>
    </div>
  );
}
