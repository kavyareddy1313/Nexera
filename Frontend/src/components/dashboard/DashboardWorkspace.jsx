import React, { useState, useEffect } from "react";
import { Pin, Plus, Box, Layers, PenTool, BookOpen, PlayCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export function DashboardWorkspace() {
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/courses/my-enrollments');
        setEnrolledCourses(response.data.data);
      } catch (error) {
        console.error("Failed to fetch enrollments", error);
      }
    };
    fetchCourses();
  }, []);
  const schedule = [
    {
      id: 1,
      time: "09:00 - 10:30 AM",
      title: "Design System Sync",
      desc: "Reviewing the ethereal light palette and glass components for the v2.0 release.",
      color: "border-indigo-600 text-indigo-600",
      dotColor: "border-indigo-600",
      avatars: [
        "https://i.pravatar.cc/150?u=a1",
        "https://i.pravatar.cc/150?u=a2",
      ],
      extra: "+3",
    },
    {
      id: 2,
      time: "11:00 - 12:00 PM",
      title: "Product Roadmap Refresh",
      desc: "Quarterly planning with stakeholders for Nexera Core features.",
      color: "border-purple-400 text-purple-400",
      dotColor: "border-purple-400",
    },
    {
      id: 3,
      time: "02:30 - 04:00 PM",
      title: "Developer Q&A Session",
      desc: "Technical deep-dive into the new real-time collaboration engine.",
      color: "border-pink-600 text-pink-600",
      dotColor: "border-pink-600",
    },
  ];

  const whiteboards = [
    {
      id: 1,
      title: "Mobile IA v2",
      bgClass: "bg-gradient-to-br from-indigo-100 to-indigo-50",
      icon: <Layers size={14} className="text-indigo-600" />,
      iconBg: "bg-indigo-200/50",
    },
    {
      id: 2,
      title: "Brand Palette",
      bgClass: "bg-gradient-to-br from-purple-100 to-purple-50",
      icon: <Box size={14} className="text-purple-600" />,
      iconBg: "bg-purple-200/50",
    },
    {
      id: 3,
      title: "Copy Drafts",
      bgClass: "bg-white border border-gray-100",
      icon: <PenTool size={14} className="text-pink-500" />,
      iconBg: "bg-pink-100",
    },
  ];

  return (
    <div className="flex-1 bg-[#f8f9fc] p-10 overflow-y-auto custom-scrollbar flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            Ethereal Workspace
          </h1>
          <p className="text-gray-500 text-lg">
            Focus is your only metric. Let's create today.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => toast.success('Report exported successfully!')}
            className="px-6 py-2.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-sm hover:bg-indigo-100 transition-colors"
          >
            Export Report
          </button>
          <button 
            onClick={() => toast('Creating new project...', { icon: '✨' })}
            className="px-6 py-2.5 rounded-full bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
          >
            New Project
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Column: Schedule */}
        <div className="flex-1 max-w-xl">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-bold text-gray-900">Today's Schedule</h2>
            <button 
              onClick={() => toast('Opening full calendar...', { icon: '📅' })}
              className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
            >
              View Calendar
            </button>
          </div>

          <div className="relative pl-4 border-l border-gray-200 flex flex-col gap-8">
            {schedule.map((item) => (
              <div key={item.id} className="relative">
                {/* Timeline Dot */}
                <div
                  className={`absolute -left-[21px] top-4 w-2.5 h-2.5 bg-[#f8f9fc] rounded-full border-2 ${item.dotColor}`}
                ></div>

                {/* Card */}
                <div
                  onClick={() => toast(`Joining ${item.title}...`, { icon: '🔗' })}
                  className={`bg-white rounded-2xl p-6 shadow-sm border-l-[3px] ${item.color.split(" ")[0]} border-t border-r border-b border-gray-100 cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`text-[10px] font-bold tracking-widest uppercase ${item.color.split(" ")[1]}`}
                    >
                      {item.time}
                    </span>
                    {item.avatars && (
                      <div className="flex -space-x-2">
                        {item.avatars.map((src, idx) => (
                          <img
                            key={idx}
                            src={src}
                            alt="avatar"
                            className="w-6 h-6 rounded-full border-2 border-white object-cover"
                          />
                        ))}
                        {item.extra && (
                          <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500">
                            {item.extra}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Pinned Message & Whiteboards */}
        <div className="w-full lg:w-[340px] flex flex-col gap-10">
          {/* Pinned Message */}
          <div 
            onClick={() => toast('Opening pinned message in chat...', { icon: '💬' })}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-2 mb-4">
              <Pin size={18} className="text-indigo-600" />
              <h2 className="text-sm font-bold text-indigo-700">
                Pinned Message
              </h2>
            </div>
            <div className="bg-gray-50 rounded-xl p-5">
              <p className="text-sm text-gray-500 italic mb-4 leading-relaxed">
                "Remember to update the accessibility tokens for the hover states before Thursday's client demo."
              </p>
              <div className="flex items-center gap-2">
                <img
                  src="https://i.pravatar.cc/150?u=marcie"
                  alt="Marcie"
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-xs font-bold text-gray-900">
                  Marcie J. <span className="text-gray-400 font-normal mx-1">•</span> 4h ago
                </span>
              </div>
            </div>
          </div>

          {/* Enrolled Courses */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BookOpen size={20} className="text-indigo-600" /> My Courses
            </h2>
            
            {enrolledCourses.length === 0 ? (
              <div 
                onClick={() => navigate('/courses')}
                className="bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-2xl p-6 text-center cursor-pointer hover:bg-indigo-50 transition-colors"
              >
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">No courses yet</h3>
                <p className="text-xs text-gray-500 font-medium">Click here to explore the catalog and start learning.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {enrolledCourses.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => navigate(`/courses/${course.id}`)}
                    className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm border border-gray-100 cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all group"
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 relative">
                      <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <PlayCircle size={24} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        Instructor: {course.instructor?.fullName || 'Nexera'}
                      </p>
                      <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-[15%]"></div>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold mt-1 text-right">15% Complete</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Spacer to push footer down if needed */}
      <div className="flex-1 min-h-[60px]"></div>

      {/* Footer */}
      <div className="pt-10 mt-auto flex flex-col md:flex-row items-center justify-between text-xs font-bold text-gray-400 tracking-wider uppercase border-t border-gray-200/50">
        <span className="text-indigo-600 mb-4 md:mb-0">Nexera</span>
        <span className="mb-4 md:mb-0">© 2024 NEXERA. THE ETHEREAL WORKSPACE.</span>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Status</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Contact</a>
        </div>
      </div>
    </div>
  );
}
