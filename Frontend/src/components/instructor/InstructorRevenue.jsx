import React from 'react';
import { 
  Search,
  Calendar,
  Wallet,
  TrendingUp,
  Info,
  ChevronDown
} from 'lucide-react';

export function InstructorRevenue() {
  const courses = [
    { name: 'Advanced UI/UX Design Masterclass', enrollments: 245, revenue: 2450, percent: 45, img: 'bg-indigo-100' },
    { name: 'Figma Auto-Layout Secrets', enrollments: 180, revenue: 1280, percent: 28, img: 'bg-blue-100' },
  ];

  return (
    <div className="flex flex-1 overflow-hidden bg-[#f8f9fc]">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search transactions, courses..." 
              className="w-full bg-[#f8f9fc] border border-transparent rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
          <div className="flex items-center gap-6">
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </button>
            <button className="hover:text-gray-900 text-gray-500"><div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">?</div></button>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold text-sm overflow-hidden border border-gray-200">
              <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-10 pt-10 pb-20 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Revenue</h1>
                <p className="text-[15px] font-medium text-gray-500">Track your earnings and payouts</p>
              </div>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-3 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:border-gray-300 transition-colors">
                  <Calendar size={16} className="text-gray-400" />
                  This Month: Oct 1 - Oct 31
                  <ChevronDown size={16} className="text-gray-400 ml-2" />
                </button>
                <button className="flex items-center gap-2 bg-[#5c4ce3] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors">
                  <Wallet size={16} />
                  Request withdrawal
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              
              <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100">
                <h3 className="text-[11px] font-bold text-gray-500 tracking-widest uppercase mb-4">Today's Revenue</h3>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl font-extrabold text-gray-900">$124</span>
                  <span className="bg-emerald-50 text-emerald-600 text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                    <TrendingUp size={12} />
                    +$24
                  </span>
                </div>
                <div className="text-[13px] font-medium text-gray-400">vs yesterday</div>
              </div>

              <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100">
                <h3 className="text-[11px] font-bold text-gray-500 tracking-widest uppercase mb-3">This Month</h3>
                <div className="text-4xl font-extrabold text-[#5c4ce3] tracking-tight mb-3">$4,280</div>
                <div className="flex justify-between items-center text-[11px] font-bold text-gray-500 mb-2 uppercase">
                  <span>70% to goal</span>
                  <span>Goal: $6,000</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#5c4ce3] rounded-full" style={{ width: '70%' }}></div>
                </div>
              </div>

              <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100">
                <h3 className="text-[11px] font-bold text-gray-500 tracking-widest uppercase mb-4">Total Earnings</h3>
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">$28,450</div>
                <div className="text-[13px] font-medium text-gray-400">All time net earnings</div>
              </div>

              <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-bold text-gray-500 tracking-widest uppercase">Pending</h3>
                  <span className="bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Available</span>
                </div>
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">$1,200</div>
                <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-400">
                  <Info size={14} />
                  Available to withdraw
                </div>
              </div>

            </div>

            {/* Earnings Overview */}
            <div className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-gray-100 mb-8 min-h-[300px] flex flex-col">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-lg font-bold text-gray-900">Earnings Overview</h2>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#5c4ce3]"></div>
                    Gross Earnings
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400"><circle cx="12" cy="12" r="10" strokeDasharray="4 4"></circle></svg>
                    Platform Fees
                  </div>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center text-sm font-medium text-gray-400">
                Loading visualizer...
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Top Selling Courses */}
              <div className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-8">Top Selling Courses</h2>
                <div className="space-y-6">
                  {courses.map((course, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-gray-400 w-4">{idx + 1}</span>
                        <div className={`w-12 h-10 rounded-lg ${course.img} flex items-center justify-center overflow-hidden`}>
                          <img src={`https://placehold.co/100x80/eef2ff/4f46e5?text=Course+${idx+1}`} alt={course.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{course.name}</h4>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mt-0.5">
                            <Users size={12} />
                            {course.enrollments} enrollments
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="text-sm font-bold text-gray-900">${course.revenue.toLocaleString()}</div>
                        <div className="text-[11px] font-semibold text-gray-500 mb-1">{course.percent}% of rev</div>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#5c4ce3] rounded-full" style={{ width: `${course.percent}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-8">Revenue Breakdown</h2>
                
                <div className="flex justify-center mt-4">
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      {/* Platform Fee Arc */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                      {/* Fees Arc (Orange) */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="188.4" />
                      {/* Net Revenue Arc (Purple) */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#5c4ce3" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="50.24" />
                    </svg>
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Net</span>
                      <span className="text-2xl font-extrabold text-gray-900">$3,940</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
