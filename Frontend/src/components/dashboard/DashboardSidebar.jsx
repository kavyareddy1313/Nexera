import React from "react";
import { MessageSquare, Calendar, Share2, Sparkles } from "lucide-react";
import { ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export function DashboardSidebar() {
  const stats = [
    {
      title: "ACTIVE CHATS",
      value: "12",
      icon: MessageSquare,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "MEETINGS TODAY",
      value: "4",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "FILES SHARED",
      value: "28",
      icon: Share2,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
  ];

  const activities = [
    {
      id: 1,
      user: "Alex Morgan",
      action: 'updated the "Nexus Branding" whiteboard',
      time: "12 MINUTES AGO",
      avatar: "https://i.pravatar.cc/150?u=alex",
      isAI: false,
    },
    {
      id: 2,
      user: "Sarah Chen",
      action: 'invited you to "Q3 Roadmap Strategy"',
      time: "1 HOUR AGO",
      avatar: "https://i.pravatar.cc/150?u=sarahchen",
      isAI: false,
    },
    {
      id: 3,
      user: "Nexera AI",
      action: 'generated a summary for your missed "Sprint Planning" meeting',
      time: "3 HOURS AGO",
      isAI: true,
    },
  ];

  return (
    <div className="w-[320px] h-full bg-[#f3f4f6] flex flex-col p-8 border-r border-gray-200 shrink-0 overflow-y-auto custom-scrollbar">
      <div className="mb-8">
        <h2 className="text-sm font-bold text-gray-900 tracking-tight mb-1">
          Activity Feed
        </h2>
        <p className="text-sm text-gray-500">Your team's latest updates</p>
      </div>

      <div className="flex flex-col gap-4 mb-10">
        {stats.map((stat, i) => (
          <div
            key={i}
            onClick={() => toast(`Opening ${stat.title} details...`, { icon: '📊' })}
            className="bg-white rounded-xl p-4 flex items-center justify-between cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all group shadow-sm border border-transparent hover:border-indigo-100"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bgColor} ${stat.color}`}
              >
                <stat.icon size={20} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">
                  {stat.title}
                </span>
                <span className="text-xl font-extrabold text-gray-900">
                  {stat.value}
                </span>
              </div>
            </div>
            <ChevronRight
              size={20}
              className="text-gray-300 group-hover:text-gray-500 transition-colors"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        {activities.map((activity) => (
          <div key={activity.id} 
            onClick={() => toast(`Viewing activity: ${activity.user}'s action`, { icon: '👀' })}
            className="flex gap-4 items-start cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded-xl transition-colors"
          >
            {activity.isAI ? (
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex flex-shrink-0 items-center justify-center text-white shadow-sm mt-1">
                <Sparkles size={20} />
              </div>
            ) : (
              <img
                src={activity.avatar}
                alt={activity.user}
                className="w-10 h-10 rounded-full object-cover shadow-sm mt-1 flex-shrink-0"
              />
            )}
            <div className="flex flex-col">
              <p className="text-sm text-gray-600 leading-snug">
                <span className="font-bold text-gray-900">{activity.user}</span>{" "}
                {activity.action}
              </p>
              <span className="text-[10px] font-bold text-gray-400 tracking-wider mt-1.5 uppercase">
                {activity.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
