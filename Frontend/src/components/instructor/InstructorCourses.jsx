import React from 'react';
import { 
  Search, 
  ChevronDown, 
  Plus, 
  Image as ImageIcon, 
  PenTool, 
  MoreVertical,
  Star,
  Users,
  Edit2,
  Eye,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { Link } from 'react-router-dom';

export function InstructorCourses() {
  const courses = [
    {
      id: 1,
      status: 'PUBLISHED',
      statusColor: 'text-emerald-600',
      statusDot: 'bg-emerald-500',
      imagePlaceholderBg: 'bg-indigo-100',
      imageIcon: <ImageIcon size={32} className="text-indigo-500" />,
      category: 'WEB DEVELOPMENT',
      title: 'Advanced React Patterns & Performance Optimization',
      rating: '4.8',
      students: '1,240',
      price: '$89',
      oldPrice: '$120',
      progressText: '8 of 12 lessons',
      progressPercent: '66%',
      progressColor: 'bg-indigo-600',
      actions: ['edit', 'preview', 'duplicate', 'delete']
    },
    {
      id: 2,
      status: 'DRAFT',
      statusColor: 'text-amber-600',
      statusDot: 'bg-amber-500',
      imagePlaceholderBg: 'bg-gray-100',
      imageIcon: <PenTool size={32} className="text-gray-400" />,
      category: 'UI/UX DESIGN',
      title: 'Mastering Figma: From Wireframe to Prototype',
      rating: '--',
      students: '0',
      price: 'Free',
      progressText: 'Setup Progress',
      progressTextRight: '3 of 12 steps',
      progressPercent: '25%',
      progressColor: 'bg-indigo-600',
      actions: ['edit']
    }
  ];

  return (
    <div className="flex-1 bg-[#f8f9fc] p-10 overflow-y-auto custom-scrollbar flex flex-col">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">My Courses</h1>
          <p className="text-sm font-medium text-gray-500">Manage and track your published content</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search courses..." 
              className="w-64 bg-white border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm"
            />
          </div>
          
          <button className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
            All Statuses
            <ChevronDown size={16} className="text-gray-400" />
          </button>
          
          <Link 
            to="/instructor/courses/create"
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            Create Course
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="bg-gray-100/70 rounded-2xl p-4 flex items-center justify-start gap-8 mb-8 border border-gray-100 max-w-fit">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-extrabold text-gray-900">12</span>
          <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">Total</span>
        </div>
        <div className="w-px h-6 bg-gray-200"></div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-extrabold text-indigo-600">8</span>
          <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">Published</span>
        </div>
        <div className="w-px h-6 bg-gray-200"></div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-extrabold text-purple-600">3</span>
          <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">Draft</span>
        </div>
        <div className="w-px h-6 bg-gray-200"></div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-extrabold text-gray-500">1</span>
          <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">Archived</span>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col group hover:shadow-md transition-shadow">
            {/* Image section */}
            <div className={`w-full h-48 rounded-2xl ${course.imagePlaceholderBg} flex items-center justify-center mb-6 relative`}>
              <div className="absolute top-4 left-4 bg-white px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                <div className={`w-1.5 h-1.5 rounded-full ${course.statusDot}`}></div>
                <span className={`text-[10px] font-bold tracking-widest uppercase ${course.statusColor}`}>
                  {course.status}
                </span>
              </div>
              {course.imageIcon}
            </div>

            {/* Content section */}
            <div className="flex-1 flex flex-col px-2">
              <span className="inline-block bg-indigo-50 text-indigo-700 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-md w-max mb-4">
                {course.category}
              </span>
              
              <h3 className="text-lg font-bold text-gray-900 leading-snug mb-4">
                {course.title}
              </h3>

              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-1.5">
                  <Star size={14} className={course.rating !== '--' ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                  <span className="text-sm font-semibold text-gray-700">{course.rating}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Users size={14} />
                  <span className="text-sm font-medium">{course.students} students</span>
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-6 border-b border-gray-100 pb-6">
                {course.price === 'Free' ? (
                  <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1 rounded-md">
                    Free
                  </span>
                ) : (
                  <>
                    <span className="text-xl font-extrabold text-gray-900">{course.price}</span>
                    <span className="text-sm font-medium text-gray-400 line-through">{course.oldPrice}</span>
                  </>
                )}
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-500">{course.progressText}</span>
                  <span className="text-xs font-semibold text-gray-500">
                    {course.progressTextRight || course.progressText}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${course.progressColor} rounded-full`} style={{ width: course.progressPercent }}></div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto pt-2">
                <div className="flex items-center gap-2">
                  <Link 
                    to={`/instructor/courses/${course.id}/manage`}
                    className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                  >
                    <Edit2 size={14} />
                  </Link>
                  {course.actions.includes('preview') && (
                    <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                      <Eye size={14} />
                    </button>
                  )}
                  {course.actions.includes('duplicate') && (
                    <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                      <Copy size={14} />
                    </button>
                  )}
                  {course.actions.includes('delete') && (
                    <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <button className="text-gray-400 hover:text-gray-600 p-1">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 mt-auto">
        <button className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 shadow-sm transition-colors">
          <ChevronLeft size={18} />
        </button>
        <button className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
          1
        </button>
        <button className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-gray-600 font-bold hover:bg-gray-100 transition-colors">
          2
        </button>
        <button className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-gray-600 font-bold hover:bg-gray-100 transition-colors">
          3
        </button>
        <button className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50 shadow-sm transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
