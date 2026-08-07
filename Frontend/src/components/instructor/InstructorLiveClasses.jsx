import React, { useState } from 'react';
import { MoreVertical, Calendar, Users, Edit2, Plus } from 'lucide-react';
import { ScheduleClassModal } from './ScheduleClassModal';

export function InstructorLiveClasses() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const classes = [
    {
      id: 1,
      status: 'STARTING SOON',
      statusColor: 'bg-indigo-50 text-indigo-700',
      category: 'UX DESIGN',
      title: 'Advanced Prototyping Workshop',
      description: 'Deep dive into interactive states and micro-animations for high-fidelity prototypes.',
      date: 'Today, 2:00 PM EST',
      registered: 42,
    },
    {
      id: 2,
      status: 'SCHEDULED',
      statusColor: 'bg-gray-100 text-gray-600',
      category: 'BUSINESS',
      title: 'Freelance Pricing Strategies',
      description: 'How to value your work, negotiate contracts, and secure retainers.',
      date: 'Nov 15, 3:00 PM EST',
      registered: 85,
    },
    {
      id: 3,
      status: 'SCHEDULED',
      statusColor: 'bg-gray-100 text-gray-600',
      category: 'DEV',
      title: 'React State Management Patterns',
      description: 'Exploring Context API, Redux Toolkit, and Zustand for scaling applications.',
      date: 'Tomorrow, 10:00 AM EST',
      registered: 128,
    }
  ];

  return (
    <div className="flex flex-1 overflow-hidden bg-white">
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        

        <div className="flex-1 overflow-y-auto px-10 pb-10 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            
            {/* Page Header */}
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Live classes</h1>
                <p className="text-[15px] font-medium text-gray-500">Schedule and manage your live sessions</p>
              </div>
              
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-[#5c4ce3] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors"
              >
                <Plus size={18} />
                Schedule Class
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-gray-100 mb-8">
              <button 
                onClick={() => setActiveTab('upcoming')}
                className={`pb-4 text-[15px] font-bold transition-colors relative ${activeTab === 'upcoming' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Upcoming
                {activeTab === 'upcoming' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('live')}
                className={`pb-4 text-[15px] font-bold transition-colors relative ${activeTab === 'live' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Live now
                {activeTab === 'live' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('past')}
                className={`pb-4 text-[15px] font-bold transition-colors relative ${activeTab === 'past' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Past sessions
                {activeTab === 'past' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
                )}
              </button>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {classes.map((cls) => (
                <div key={cls.id} className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all flex flex-col group relative">
                  
                  {/* Subtle gradient overlay mimicking the screenshot */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] pointer-events-none"></div>

                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-md ${cls.statusColor}`}>
                        {cls.status}
                      </span>
                      <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-md bg-gray-100 text-gray-500">
                        {cls.category}
                      </span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <MoreVertical size={20} />
                    </button>
                  </div>

                  <div className="relative z-10 mb-6">
                    <h3 className="text-xl font-extrabold text-gray-900 mb-3">{cls.title}</h3>
                    <p className="text-[14px] font-medium text-gray-500 leading-relaxed max-w-sm">
                      {cls.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 mt-auto mb-8 relative z-10">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                      <Calendar size={16} className="text-gray-400" />
                      {cls.date}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                      <Users size={16} className="text-gray-400" />
                      {cls.registered} Registered
                    </div>
                  </div>

                  <button className="w-full bg-[#f8f9fc] text-indigo-600 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors text-xs tracking-wide uppercase relative z-10">
                    <Edit2 size={16} />
                    Edit Session
                  </button>

                </div>
              ))}

            </div>

          </div>
        </div>
      </div>

      <ScheduleClassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

    </div>
  );
}
