import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/useAuthStore';

export function InstructorCourses() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchInstructorCourses = async () => {
      try {
        const response = await api.get('/courses/instructor/my-courses');
        setCourses(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch instructor courses:", error);
        // Fallback: fetch all courses if user is admin or general instructor
        try {
          const allRes = await api.get('/courses');
          setCourses(allRes.data.data || []);
        } catch (_) {}
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstructorCourses();
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = (course.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (course.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalCount = courses.length;
  const publishedCount = courses.filter(c => Number(c.price) >= 0).length;

  return (
    <div className="flex-1 bg-[#f8f9fc] p-10 overflow-y-auto custom-scrollbar flex flex-col">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">My Courses</h1>
          <p className="text-sm font-medium text-gray-500">Manage and track your published courses and community groups</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 bg-white border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm"
            />
          </div>
          
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
          <span className="text-xl font-extrabold text-gray-900">{totalCount}</span>
          <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">Total</span>
        </div>
        <div className="w-px h-6 bg-gray-200"></div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-extrabold text-indigo-600">{publishedCount}</span>
          <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">Published</span>
        </div>
        <div className="w-px h-6 bg-gray-200"></div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-extrabold text-emerald-600">
            {courses.reduce((acc, c) => acc + (Number(c.studentsEnrolled) || Number(c.students_enrolled) || 0), 0).toLocaleString()}
          </span>
          <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">Students</span>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredCourses.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-md mx-auto my-12">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <Sparkles size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No courses found</h3>
          <p className="text-sm text-gray-500 mb-6">Create your first course to start teaching and build your student community.</p>
          <Link 
            to="/instructor/courses/create"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} /> Create Course
          </Link>
        </div>
      )}

      {/* Course Grid */}
      {!isLoading && filteredCourses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredCourses.map((course) => {
            const studentCount = Number(course.studentsEnrolled) || Number(course.students_enrolled) || 0;
            const price = Number(course.price) || 0;
            const convoId = course.conversationId || course.conversation_id;

            return (
              <div key={course.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col group hover:shadow-md transition-shadow">
                {/* Image section */}
                <div className="w-full h-48 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 relative overflow-hidden">
                  {course.thumbnailUrl || course.thumbnail_url ? (
                    <img 
                      src={course.thumbnailUrl || course.thumbnail_url} 
                      alt={course.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <ImageIcon size={32} className="text-indigo-400" />
                  )}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-600">
                      PUBLISHED
                    </span>
                  </div>
                </div>

                {/* Content section */}
                <div className="flex-1 flex flex-col px-2">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-block bg-indigo-50 text-indigo-700 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-md">
                      {course.category || 'General'}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">{course.duration || 'Flexible'}</span>
                  </div>
                  
                  <h3 className="text-base font-bold text-gray-900 leading-snug mb-3 line-clamp-2">
                    {course.title}
                  </h3>

                  <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold text-gray-700">{course.rating || '4.8'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Users size={14} />
                      <span className="text-sm font-medium">{studentCount.toLocaleString()} students</span>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-5 border-b border-gray-100 pb-4">
                    {price === 0 ? (
                      <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1 rounded-md">
                        Free
                      </span>
                    ) : (
                      <>
                        <span className="text-xl font-extrabold text-gray-900">₹{price.toFixed(0)}</span>
                        <span className="text-sm font-medium text-gray-400 line-through">₹{(price * 1.5).toFixed(0)}</span>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex items-center gap-2">
                      {convoId ? (
                        <button
                          onClick={() => navigate(`/chat?convo=${convoId}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors"
                          title="Open Course Community Group"
                        >
                          <MessageSquare size={13} />
                          Class Group
                        </button>
                      ) : null}
                      
                      <button
                        onClick={() => navigate(`/courses/${course.id}`)}
                        className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                        title="Preview Public Sales Page"
                      >
                        <Eye size={14} />
                      </button>
                    </div>

                    <Link 
                      to={`/instructor/courses/${course.id}/manage`}
                      className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                      title="Manage Course"
                    >
                      <Edit2 size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
