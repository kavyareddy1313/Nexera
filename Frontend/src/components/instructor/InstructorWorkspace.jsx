import React from 'react';
import { 
  GraduationCap, 
  Users, 
  Banknote, 
  PlayCircle, 
  Star, 
  CheckCircle,
  PlusCircle,
  FilePlus,
  Users2,
  CalendarDays,
  UserPlus,
  Star as StarIcon,
  CheckSquare
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

export function InstructorWorkspace() {
  const { user } = useAuthStore();

  const stats = [
    { title: 'TOTAL COURSES', value: '12', sub: '4 published', icon: GraduationCap, color: 'text-indigo-600', subColor: 'text-indigo-600' },
    { title: 'TOTAL STUDENTS', value: '1,450', sub: '+12 this week', icon: Users, color: 'text-purple-600', subColor: 'text-green-500' },
    { title: 'TOTAL REVENUE', value: '$12,480', sub: 'this month', icon: Banknote, color: 'text-pink-600', subColor: 'text-gray-500' },
    { title: 'ACTIVE COURSES', value: '8', sub: 'running currently', icon: PlayCircle, color: 'text-blue-600', subColor: 'text-gray-500' },
    { title: 'AVERAGE RATING', value: '4.9', sub: 'across all courses', icon: Star, color: 'text-yellow-500', subColor: 'text-gray-500' },
    { title: 'COURSE COMPLETION', value: '85%', sub: 'average rate', icon: CheckCircle, color: 'text-red-500', subColor: 'text-gray-500' },
  ];

  const enrollments = [
    { name: 'Sarah Jenkins', init: 'S', course: 'Advanced UI Architecture', date: 'Oct 28', amount: '$149' },
    { name: 'Michael Chang', init: 'M', course: 'React Mastery', date: 'Oct 27', amount: '$129' },
    { name: 'Emma Larson', init: 'EL', course: 'Systems Design', date: 'Oct 26', amount: '$199' },
    { name: 'Judith Black', init: 'J', course: 'Advanced UI Architecture', date: 'Oct 25', amount: '$149' },
    { name: 'Robert Jones', init: 'RJ', course: 'React Mastery', date: 'Oct 25', amount: '$129' },
  ];

  const quickActions = [
    { name: 'Create Course', icon: PlusCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: 'Add Lesson', icon: FilePlus, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'View Students', icon: Users2, color: 'text-pink-600', bg: 'bg-pink-50' },
    { name: 'Schedule Class', icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  const upcomingClasses = [
    { title: 'Advanced UI Architecture', students: 42, time: 'Today, 2:00 PM' },
    { title: 'Systems Design', students: 28, time: 'Tomorrow, 10:00 AM' },
    { title: 'React Mastery', students: 56, time: 'Wed, 1:00 PM' },
  ];

  const activities = [
    { title: 'New Enrollment', desc: 'David L. joined Systems Design.', time: '2m ago', icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'Review Added', desc: '5 stars for React Mastery.', time: '1h ago', icon: StarIcon, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { title: 'Assignment', desc: '12 students submitted Project 1.', time: '3h ago', icon: CheckSquare, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Course Purchased', desc: 'Advanced UI was purchased.', time: '5h ago', icon: Banknote, color: 'text-pink-600', bg: 'bg-pink-100' },
  ];

  const chartData = [
    { month: 'May', value: 40 },
    { month: 'Jun', value: 55 },
    { month: 'Jul', value: 45 },
    { month: 'Aug', value: 75 },
    { month: 'Sep', value: 65 },
    { month: 'Oct', value: 90 },
  ];

  return (
    <div className="flex-1 bg-[#f8f9fc] p-10 overflow-y-auto custom-scrollbar flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
          Good morning, {user?.fullName || 'Dr. Alexander'}
        </h1>
        <p className="text-sm font-semibold text-gray-500">
          Monday, Oct 28, 2024
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">{stat.title}</span>
              <stat.icon size={18} className={stat.color} />
            </div>
            <div className="mt-auto">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-1">{stat.value}</h2>
              <span className={`text-xs font-bold ${stat.subColor}`}>{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 flex flex-col gap-8 min-w-0">
          {/* Recent Enrollments */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Recent Enrollments</h3>
              <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                  <tr>
                    <th className="pb-4 font-bold">STUDENT</th>
                    <th className="pb-4 font-bold">COURSE</th>
                    <th className="pb-4 font-bold">DATE</th>
                    <th className="pb-4 font-bold text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {enrollments.map((env, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                          {env.init}
                        </div>
                        <span className="font-bold text-gray-900">{env.name}</span>
                      </td>
                      <td className="py-4 text-gray-500 font-medium">{env.course}</td>
                      <td className="py-4 text-gray-500 font-medium">{env.date}</td>
                      <td className="py-4 text-right font-extrabold text-gray-900">{env.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Revenue Overview */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Revenue Overview</h3>
              <select className="bg-gray-50 border border-gray-100 text-gray-700 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none">
                <option>Last 6 Months</option>
              </select>
            </div>
            
            <div className="h-64 flex items-end justify-between pt-4 relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pb-6 text-[10px] font-bold text-gray-400">
                <div className="flex gap-4 items-center w-full"><span className="w-6 text-right">$4k</span><div className="flex-1 border-t border-gray-100 border-dashed"></div></div>
                <div className="flex gap-4 items-center w-full"><span className="w-6 text-right">$3k</span><div className="flex-1 border-t border-gray-100 border-dashed"></div></div>
                <div className="flex gap-4 items-center w-full"><span className="w-6 text-right">$2k</span><div className="flex-1 border-t border-gray-100 border-dashed"></div></div>
                <div className="flex gap-4 items-center w-full"><span className="w-6 text-right">$1k</span><div className="flex-1 border-t border-gray-100 border-dashed"></div></div>
                <div className="flex gap-4 items-center w-full"><span className="w-6 text-right">$0</span><div className="flex-1 border-t border-gray-100 border-dashed"></div></div>
              </div>
              
              {/* Bars */}
              <div className="relative z-10 flex justify-between items-end w-full pl-10 pr-2 pb-6 h-full">
                {chartData.map((data, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 group w-[10%]">
                    <div 
                      className="w-full bg-[#8c9eff] rounded-t flex-1 max-h-full min-h-[10%] relative overflow-hidden" 
                      style={{ height: `${data.value}%` }}
                    >
                      {/* Gradient overlay for active (last) month */}
                      {i === chartData.length - 1 && (
                        <div className="absolute inset-0 bg-indigo-600"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* X axis labels */}
              <div className="absolute bottom-0 left-10 right-2 flex justify-between items-center text-[10px] font-bold text-gray-400">
                {chartData.map((data, i) => (
                  <div key={i} className={`w-[10%] text-center ${i === chartData.length - 1 ? 'text-indigo-600' : ''}`}>{data.month}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-[320px] flex flex-col gap-8 shrink-0">
          
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, i) => (
              <button key={i} className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-3 shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                  <action.icon size={20} />
                </div>
                <span className="text-xs font-bold text-gray-900">{action.name}</span>
              </button>
            ))}
          </div>

          {/* Upcoming Live Classes */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Upcoming Live Classes</h3>
            <div className="flex flex-col gap-5">
              {upcomingClasses.map((cls, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">{cls.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      <Users size={12} />
                      <span>{cls.students} students • {cls.time}</span>
                    </div>
                  </div>
                  <button className="px-4 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full hover:bg-indigo-600 hover:text-white transition-colors">
                    Start
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h3>
            
            <div className="relative pl-4 border-l-2 border-gray-100 flex flex-col gap-8 pb-4">
              {activities.map((act, i) => (
                <div key={i} className="relative">
                  <div className={`absolute -left-[29px] top-0 w-6 h-6 rounded-full flex items-center justify-center border-4 border-white ${act.bg} ${act.color}`}>
                    <act.icon size={10} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="text-sm font-bold text-gray-900">{act.title}</h4>
                      <span className="text-[10px] font-bold text-gray-400">{act.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">{act.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      
      {/* Spacer to push footer down if needed */}
      <div className="flex-1 min-h-[40px]"></div>
    </div>
  );
}
