import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Clock, Users, ChevronRight, PlayCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { GlobalNavRail } from '../components/layout/GlobalNavRail';
import { DashboardTopNav } from '../components/dashboard/DashboardTopNav';
import useAuthStore from '../store/useAuthStore';

export default function CoursesExplore() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/courses');
        setCourses(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const categories = ["All", "Development", "Design", "Architecture", "Data Science", "Marketing", "Business"];

  const filteredCourses = courses.filter(course => {
    const matchesCategory = selectedCategory === 'All' || 
      (course.category || '').toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = (course.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (course.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (course.instructor?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-[#F4F5F7] overflow-hidden font-sans">
      <GlobalNavRail activeRoute="/courses" />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <DashboardTopNav user={user} />
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
          
          {/* Header & Search */}
          <div className="max-w-6xl mx-auto mb-12">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 tracking-wider uppercase mb-2">
              <Sparkles size={16} />
              <span>Nexera Academy</span>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Explore Courses</h1>
            <p className="text-lg text-gray-500 mb-8">Master new skills with industry experts and join active student community groups.</p>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="What do you want to learn? (e.g. React, UI/UX, Architecture...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 text-base font-medium"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="max-w-6xl mx-auto mb-10 flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {categories.map((cat) => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                    ? 'bg-gray-900 text-white shadow-md' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm border border-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Course Grid */}
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
            {isLoading ? (
              // Skeletons
              [...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-4 shadow-sm animate-pulse border border-gray-100">
                  <div className="w-full h-48 bg-gray-200 rounded-2xl mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-8 bg-gray-200 rounded-full w-20"></div>
                    <div className="h-10 bg-gray-200 rounded-xl w-28"></div>
                  </div>
                </div>
              ))
            ) : filteredCourses.length === 0 ? (
              <div className="col-span-full py-16 text-center">
                <p className="text-gray-400 font-semibold text-lg">No courses found matching your criteria.</p>
              </div>
            ) : (
              filteredCourses.map(course => (
                <div 
                  key={course.id} 
                  className="group bg-white rounded-3xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 cursor-pointer flex flex-col"
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-5 bg-indigo-50">
                    <img 
                      src={course.thumbnailUrl || course.thumbnail_url} 
                      alt={course.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <PlayCircle size={48} className="text-white drop-shadow-md" />
                    </div>
                    <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-bold text-gray-900">
                      {course.category}
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col px-2">
                    <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-500">
                      <span className="flex items-center gap-1 text-amber-500">
                        <Star size={16} fill="currentColor" /> {course.rating}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users size={16} /> {(Number(course.studentsEnrolled) || Number(course.students_enrolled) || 0).toLocaleString()}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    
                    <p className="text-sm text-gray-500 mb-6 line-clamp-2">
                      {course.description}
                    </p>
                    
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-3">
                        <img 
                          src={course.instructor?.avatarUrl || `https://i.pravatar.cc/150?u=${course.instructor?.id}`} 
                          alt="Instructor" 
                          className="w-8 h-8 rounded-full object-cover border border-gray-200" 
                        />
                        <span className="text-sm font-bold text-gray-700">{course.instructor?.fullName || 'Instructor'}</span>
                      </div>
                      <span className="text-lg font-extrabold text-gray-900">
                        {Number(course.price) === 0 ? 'Free' : `₹${Number(course.price).toFixed(0)}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
