import React, { useState } from 'react';
import { 
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock
} from 'lucide-react';

export function InstructorCalendar() {
  const [view, setView] = useState('Month');
  
  const days = [
    { day: 'SUN', date: 27, isCurrentMonth: false, events: [] },
    { day: 'MON', date: 28, isCurrentMonth: false, events: [] },
    { day: 'TUE', date: 29, isCurrentMonth: false, events: [] },
    { day: 'WED', date: 30, isCurrentMonth: false, events: [] },
    { day: 'THU', date: 1, isCurrentMonth: true, events: [{ id: 1, title: 'UX Fundamentals: Layouts', type: 'blue' }] },
    { day: 'FRI', date: 2, isCurrentMonth: true, events: [{ id: 2, title: 'Project Review', type: 'red' }] },
    { day: 'SAT', date: 3, isCurrentMonth: true, events: [] },
  ];

  return (
    <div className="flex flex-1 overflow-hidden bg-[#f8f9fc]">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="h-[88px] bg-[#f8f9fc] flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Calendar</h1>
            <div className="flex items-center bg-gray-100 rounded-full px-2 py-1.5 ml-4">
              <button className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <span className="text-[15px] font-semibold text-gray-900 px-6">May 2025</span>
              <button className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="bg-gray-100 p-1 rounded-2xl flex items-center">
              {['Month', 'Week', 'Day'].map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                    view === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 bg-[#5c4ce3] text-white px-6 py-3 rounded-full text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors">
              <Plus size={18} />
              Add event
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-10 pb-10 custom-scrollbar flex gap-8">
          
          {/* Main Calendar Grid Area */}
          <div className="flex-1 bg-[#f3f4f8] rounded-[2rem] p-6 flex flex-col min-h-0">
            <div className="grid grid-cols-7 gap-4 flex-1">
              {days.map((d, idx) => (
                <div key={idx} className="flex flex-col h-full">
                  <div className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                    {d.day}
                  </div>
                  <div className="bg-white rounded-2xl p-4 flex-1 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] min-h-[400px]">
                    <div className={`text-base font-bold mb-4 ${d.isCurrentMonth ? 'text-gray-900' : 'text-gray-300'}`}>
                      {d.date}
                    </div>
                    <div className="space-y-2">
                      {d.events.map(event => (
                        <div 
                          key={event.id} 
                          className={`w-full py-1.5 px-3 rounded-md text-xs font-bold truncate cursor-pointer ${
                            event.type === 'blue' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {event.title.substring(0, 1)}...
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar Area */}
          <div className="w-[320px] shrink-0 space-y-6">
            
            {/* Mini Calendar Widget */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[15px] font-bold text-gray-900">May 2025</h3>
                <div className="flex gap-1">
                  <button className="text-gray-400 hover:text-gray-600"><ChevronLeft size={16} /></button>
                  <button className="text-gray-400 hover:text-gray-600"><ChevronRight size={16} /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-y-4 gap-x-1 text-center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                  <div key={d} className="text-[11px] font-bold text-gray-400">{d}</div>
                ))}
                <div className="text-xs text-gray-300">27</div>
                <div className="text-xs text-gray-300">28</div>
                <div className="text-xs text-gray-300">29</div>
                <div className="text-xs text-gray-300">30</div>
                <div className="text-xs font-bold text-gray-900">1</div>
                <div className="text-xs font-bold text-gray-900">2</div>
                <div className="text-xs font-bold text-gray-900">3</div>
              </div>
            </div>

            {/* Upcoming Section */}
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-4 px-2">Upcoming</h3>
              
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                {/* Left Blue Accent Line */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
                
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] tracking-widest uppercase mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                  Live Class
                </div>
                
                <h4 className="text-[15px] font-bold text-gray-900 mb-3 pr-4">
                  UX Fundamentals: Layouts
                </h4>
                
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 mb-5">
                  <Clock size={16} />
                  10:00 AM - 11:30 AM
                </div>
                
                <button className="w-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-sm py-3 rounded-xl transition-colors">
                  Join Session
                </button>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
