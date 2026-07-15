import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users,
  BarChart2,
  Settings, 
  Video,
  Star,
  Banknote,
  Award,
  Bell,
  Calendar
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function InstructorSidebar() {
  const location = useLocation();
  const path = location.pathname;
  
  const menuItems = [
    { name: 'Overview', icon: LayoutDashboard, path: '/instructor/dashboard' },
    { name: 'My Courses', icon: BookOpen, path: '/instructor/courses' },
    { name: 'Students', icon: Users, path: '/instructor/students' },
    { name: 'Reviews', icon: Star, path: '/instructor/reviews' },
    { name: 'Live Classes', icon: Video, path: '/instructor/live-classes' },
    { name: 'Calendar', icon: Calendar, path: '/instructor/calendar' },
    { name: 'Analytics', icon: BarChart2, path: '/instructor/analytics' },
    { name: 'Revenue', icon: Banknote, path: '/instructor/revenue' },
    { name: 'Certificates', icon: Award, path: '/instructor/certificates' },
    { name: 'Notifications', icon: Bell, path: '/instructor/notifications', badge: 12 },
    { name: 'Settings', icon: Settings, path: '/instructor/settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      <div className="p-6">
        <Link to="/instructor/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#5c4ce3] rounded-xl flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
          </div>
          <div>
            <h1 className="font-extrabold text-[17px] text-gray-900 leading-tight">Nexera Academy</h1>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Instructor Portal</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = path === item.path || path.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-700 font-bold' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-semibold'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon 
                  size={20} 
                  className={isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600 transition-colors'} 
                />
                <span className="text-[14px]">{item.name}</span>
              </div>
              {item.badge && (
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {item.badge}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6">
        <Link 
          to="/instructor/courses/create"
          className="w-full bg-[#5c4ce3] text-white font-bold py-3.5 px-4 rounded-full flex justify-center hover:bg-indigo-700 transition-colors shadow-sm text-sm"
        >
          Create Course
        </Link>
      </div>
    </aside>
  );
}
