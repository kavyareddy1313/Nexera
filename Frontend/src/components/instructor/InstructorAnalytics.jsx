import React from 'react';
import { 
  Calendar,
  Download,
  TrendingUp,
  Banknote,
  Users,
  Timer,
  ArrowUp,
  ArrowDown,
  MoreHorizontal
} from 'lucide-react';

export function InstructorAnalytics() {
  const stats = [
    {
      title: 'STUDENT GROWTH',
      value: '+12.4%',
      change: '+4.2%',
      isPositive: true,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'REVENUE',
      value: '$4,280',
      change: '+8.1%',
      isPositive: true,
      icon: Banknote,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'TOTAL ENROLLMENTS',
      value: '1,492',
      change: '+12%',
      isPositive: true,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'AVG WATCH TIME',
      value: '38m',
      change: '-1.2%',
      isPositive: false,
      icon: Timer,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    }
  ];

  const courses = [
    { name: 'Advanced UI Design', students: 420, percent: 90 },
    { name: 'Design Systems 101', students: 380, percent: 80 },
    { name: 'Figma Mastery', students: 290, percent: 60 },
    { name: 'UX Research Basics', students: 210, percent: 40 },
    { name: 'Prototyping', students: 192, percent: 35 },
  ];

  return (
    <div className="flex flex-1 overflow-hidden bg-[#f8f9fc]">
      <div className="flex-1 overflow-y-auto px-10 py-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          
          {/* Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Analytics</h1>
              <p className="text-[15px] font-medium text-gray-500">Detailed performance metrics across all your courses.</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-3 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:border-gray-300 transition-colors">
                Last 30 days
                <Calendar size={16} className="text-gray-400" />
              </button>
              <button className="flex items-center gap-2 bg-white text-indigo-700 border border-indigo-100 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-50 transition-colors">
                <Download size={16} />
                Export Report
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white rounded-[1.5rem] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">{stat.title}</h3>
                  <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon size={20} className={stat.color} />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-gray-900 mb-3">{stat.value}</div>
                <div className={`flex items-center gap-1 text-[13px] font-bold ${stat.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stat.isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  {stat.change} <span className="text-gray-400 font-medium ml-1">vs last month</span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Chart */}
            <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-lg font-bold text-gray-900">Student Growth</h2>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal size={20} />
                </button>
              </div>
              
              <div className="flex-1 relative min-h-[250px] w-full mt-auto">
                {/* SVG Chart Placeholder */}
                <svg viewBox="0 0 800 300" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5c4ce3" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#5c4ce3" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  <g className="text-gray-100" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4">
                    <line x1="0" y1="50" x2="800" y2="50" />
                    <line x1="0" y1="150" x2="800" y2="150" />
                    <line x1="0" y1="250" x2="800" y2="250" />
                  </g>
                  {/* Area Fill */}
                  <path 
                    d="M 0 200 C 100 200, 150 240, 250 220 C 350 200, 350 100, 450 150 C 550 200, 550 260, 650 150 C 700 80, 750 20, 800 50 L 800 300 L 0 300 Z" 
                    fill="url(#chartGradient)"
                  />
                  {/* Line */}
                  <path 
                    d="M 0 200 C 100 200, 150 240, 250 220 C 350 200, 350 100, 450 150 C 550 200, 550 260, 650 150 C 700 80, 750 20, 800 50" 
                    fill="none" 
                    stroke="#5c4ce3" 
                    strokeWidth="6" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Enrollments List */}
            <div className="bg-white rounded-[2rem] p-8 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-8">Enrollments by Course</h2>
              <div className="space-y-6">
                {courses.map((course, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">{course.name}</span>
                      <span className="text-sm font-bold text-gray-500">{course.students}</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full" 
                        style={{ width: `${course.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
