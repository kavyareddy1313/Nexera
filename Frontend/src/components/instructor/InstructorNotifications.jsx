import React, { useState } from 'react';
import { 
  Search,
  Radio,
  CheckCheck,
  Settings,
  UserPlus,
  CreditCard,
  Star,
  Video
} from 'lucide-react';

export function InstructorNotifications() {
  const [activeTab, setActiveTab] = useState('All');
  const tabs = ['All', 'New enrollment', 'Course purchased', 'Review added', 'Quiz completed', 'Live class reminder'];

  const todayNotifications = [
    {
      id: 1,
      type: 'enrollment',
      icon: <UserPlus size={20} />,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      title: <><span className="font-bold text-gray-900">Riya Sharma</span> enrolled in <span className="font-bold text-gray-900">React Masterclass</span></>,
      subtext: 'New student joined from India. Total enrollments: 1,432.',
      time: '2 mins ago',
      unread: true,
    },
    {
      id: 2,
      type: 'purchase',
      icon: <CreditCard size={20} />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      title: <span className="font-bold text-gray-900">New purchase: Advanced Figma UI</span>,
      subtext: 'Payment of $99.00 processed successfully via Stripe.',
      time: '1 hour ago',
      unread: true,
    }
  ];

  const yesterdayNotifications = [
    {
      id: 3,
      type: 'review',
      icon: <Star size={20} />,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      title: <span className="font-bold text-gray-900">5-Star Review on Python for Beginners</span>,
      subtext: '"This course completely changed my career path. The explanations are incredibly clear..."',
      time: 'Yesterday, 4:30 PM',
      unread: false,
    },
    {
      id: 4,
      type: 'live',
      icon: <Video size={20} />,
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
      title: <span className="font-bold text-gray-900">Live Q&A Session completed</span>,
      subtext: 'Recording is now processing and will be available to students in 2 hours.',
      time: 'Yesterday, 2:00 PM',
      unread: false,
    }
  ];

  return (
    <div className="flex flex-1 overflow-hidden bg-[#f8f9fc]">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        

        <div className="flex-1 overflow-y-auto px-10 pt-10 pb-20 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Notifications</h1>
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded">12 unread</span>
                </div>
                <p className="text-[15px] font-medium text-gray-500">Stay updated on your courses, students, and account activity.</p>
              </div>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 text-indigo-700 font-bold text-sm hover:text-indigo-800 transition-colors">
                  <CheckCheck size={18} />
                  Mark all read
                </button>
                <button className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 shadow-sm transition-colors">
                  <Settings size={18} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-8 flex gap-8">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 text-sm font-bold transition-colors relative ${
                    activeTab === tab ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="space-y-8">
              
              {/* Today Group */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-4">Today</h3>
                <div className="space-y-3">
                  {todayNotifications.map((notif) => (
                    <div key={notif.id} className="bg-white rounded-[1.5rem] p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] border border-gray-100 flex items-start gap-5 transition-shadow hover:shadow-md cursor-pointer">
                      <div className={`w-12 h-12 shrink-0 rounded-full ${notif.iconBg} ${notif.iconColor} flex items-center justify-center`}>
                        {notif.icon}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-[15px] text-gray-700">{notif.title}</h4>
                          <div className="flex items-center gap-2 shrink-0 ml-4">
                            <span className="text-xs font-bold text-indigo-600">{notif.time}</span>
                            {notif.unread && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-500">{notif.subtext}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Yesterday Group */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-4">Yesterday</h3>
                <div className="space-y-3">
                  {yesterdayNotifications.map((notif) => (
                    <div key={notif.id} className="bg-white rounded-[1.5rem] p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] border border-gray-100 flex items-start gap-5 transition-shadow hover:shadow-md cursor-pointer">
                      <div className={`w-12 h-12 shrink-0 rounded-full ${notif.iconBg} ${notif.iconColor} flex items-center justify-center`}>
                        {notif.icon}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-[15px] text-gray-700">{notif.title}</h4>
                          <div className="flex items-center gap-2 shrink-0 ml-4">
                            <span className="text-xs font-semibold text-gray-400">{notif.time}</span>
                            {notif.unread && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-500">{notif.subtext}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
