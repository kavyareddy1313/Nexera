import React, { useState } from 'react';
import { 
  Search, 
  Download, 
  ChevronDown, 
  MoreVertical, 
  Eye, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight,
  X,
  Users
} from 'lucide-react';

export function InstructorStudents() {
  const [selectedStudent, setSelectedStudent] = useState(null);

  const students = [
    {
      id: 1,
      name: 'Elena Koshka',
      email: 'elena.k@example.com',
      initials: 'EK',
      avatarColor: 'bg-indigo-500',
      course: 'UI/UX Masterclass',
      courseColor: 'bg-purple-100 text-purple-700',
      progress: 75,
      progressColor: 'bg-indigo-600',
      status: 'In progress',
      statusDot: 'bg-indigo-600',
      lastActive: '2 hrs ago',
      joined: 'Oct 12, 2023',
      totalSpent: '$178.00',
      courses: [
        { name: 'UI/UX Masterclass', progress: 75, status: 'In progress' },
        { name: 'Figma Pro', progress: 0, status: 'Not started' }
      ]
    },
    {
      id: 2,
      name: 'Marcus Chen',
      email: 'm.chen@example.com',
      initials: 'MC',
      avatarColor: 'bg-indigo-200',
      course: 'Advanced React',
      courseColor: 'bg-indigo-100 text-indigo-700',
      progress: 100,
      progressColor: 'bg-emerald-500',
      status: 'Completed',
      statusDot: 'bg-emerald-500',
      lastActive: 'Yesterday',
      joined: 'Sep 05, 2023',
      totalSpent: '$249.00',
      courses: [
        { name: 'Advanced React', progress: 100, status: 'Completed' }
      ]
    }
  ];

  return (
    <div className="flex flex-1 overflow-hidden bg-[#f8f9fc]">
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header - mimicking the app header since it's embedded */}
        <header className="h-[72px] bg-white/50 border-b border-gray-100 flex items-center justify-end px-8 shrink-0">
          <div className="flex items-center gap-6 text-gray-500">
            <button className="hover:text-gray-900"><div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">?</div></button>
            <span className="text-sm font-semibold hover:text-gray-900 cursor-pointer">Support</span>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Students</h1>
                <p className="text-sm font-medium text-gray-500">248 enrolled</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search students..." 
                    className="w-72 bg-white border border-transparent rounded-full py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm"
                  />
                </div>
                
                <button className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm hover:bg-indigo-100 transition-colors">
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button className="flex items-center justify-between w-40 bg-gray-50 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">
                  All courses
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
                
                <div className="flex items-center bg-gray-50 p-1 rounded-xl">
                  <button className="px-4 py-1.5 rounded-lg text-sm font-bold bg-white text-indigo-700 shadow-sm">All</button>
                  <button className="px-4 py-1.5 rounded-lg text-sm font-semibold text-gray-500 hover:text-gray-700">Active</button>
                  <button className="px-4 py-1.5 rounded-lg text-sm font-semibold text-gray-500 hover:text-gray-700">Completed</button>
                </div>
              </div>
              <button className="text-sm font-semibold text-gray-400 hover:text-gray-600 px-4">
                Clear filters
              </button>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-4 pl-6 pr-2 w-12"><input type="checkbox" className="rounded text-indigo-600 border-gray-300 focus:ring-indigo-500" /></th>
                    <th className="py-4 px-4 text-[11px] font-bold text-gray-400 tracking-widest uppercase">Student</th>
                    <th className="py-4 px-4 text-[11px] font-bold text-gray-400 tracking-widest uppercase">Course</th>
                    <th className="py-4 px-4 text-[11px] font-bold text-gray-400 tracking-widest uppercase">Progress</th>
                    <th className="py-4 px-4 text-[11px] font-bold text-gray-400 tracking-widest uppercase">Status</th>
                    <th className="py-4 px-4 text-[11px] font-bold text-gray-400 tracking-widest uppercase">Last Active</th>
                    <th className="py-4 pr-6 pl-4 text-[11px] font-bold text-gray-400 tracking-widest uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="py-5 pl-6 pr-2"><input type="checkbox" className="rounded text-indigo-600 border-gray-300 focus:ring-indigo-500" /></td>
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${student.avatarColor}`}>
                            {student.initials}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{student.name}</div>
                            <div className="text-[13px] font-medium text-gray-500">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold ${student.courseColor} whitespace-nowrap`}>
                          {student.course}
                        </span>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-3 w-32">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${student.progressColor}`} style={{ width: `${student.progress}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-8">{student.progress}%</span>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${student.statusDot}`}></div>
                          <span className="text-sm font-semibold text-gray-700">{student.status}</span>
                        </div>
                      </td>
                      <td className="py-5 px-4 text-sm font-medium text-gray-500">
                        {student.lastActive}
                      </td>
                      <td className="py-5 pr-6 pl-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setSelectedStudent(student)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Eye size={18} />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <MessageSquare size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="border-t border-gray-100 p-4 px-6 flex items-center justify-between text-sm font-medium text-gray-500">
                <span>Showing 1-2 of 248</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    Rows: 
                    <button className="flex items-center gap-1 font-semibold text-gray-700">
                      20 <ChevronDown size={14} className="text-gray-400" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1 hover:bg-gray-100 rounded transition-colors"><ChevronLeft size={16} /></button>
                    <button className="p-1 hover:bg-gray-100 rounded transition-colors"><ChevronRight size={16} /></button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Right Slide-over Panel (Student Details) */}
      {selectedStudent && (
        <div className="w-[400px] bg-white border-l border-gray-100 h-full shrink-0 flex flex-col shadow-xl z-20 transition-transform transform translate-x-0">
          
          {/* Header */}
          <div className="p-6 pb-0 relative">
            <button 
              onClick={() => setSelectedStudent(null)}
              className="absolute top-6 right-6 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
            
            <div className="flex flex-col items-center mt-4">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-sm ${selectedStudent.avatarColor}`}>
                {selectedStudent.initials}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedStudent.name}</h2>
              <p className="text-sm font-medium text-gray-500 mb-6">{selectedStudent.email}</p>
              
              <div className="flex items-center gap-3 mb-8 w-full justify-center">
                <button className="bg-indigo-50 text-indigo-700 px-6 py-2 rounded-full text-sm font-bold hover:bg-indigo-100 transition-colors">
                  Message
                </button>
                <button className="bg-gray-100 text-gray-700 px-6 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors">
                  Edit
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-8 border-b border-gray-100 flex items-center gap-6">
            <button className="pb-3 text-sm font-bold text-indigo-600 border-b-2 border-indigo-600">Overview</button>
            <button className="pb-3 text-sm font-semibold text-gray-500 hover:text-gray-700">Progress</button>
            <button className="pb-3 text-sm font-semibold text-gray-500 hover:text-gray-700">Activity</button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
            
            {/* Details Card */}
            <div>
              <h3 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-4">Student Details</h3>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-500">Joined</span>
                  <span className="font-semibold text-gray-900">{selectedStudent.joined}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-500">Last Login</span>
                  <span className="font-semibold text-gray-900">{selectedStudent.lastActive}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-500">Total Spent</span>
                  <span className="font-semibold text-gray-900">{selectedStudent.totalSpent}</span>
                </div>
              </div>
            </div>

            {/* Enrolled Courses */}
            <div>
              <h3 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-4">Enrolled Courses ({selectedStudent.courses.length})</h3>
              <div className="space-y-3">
                {selectedStudent.courses.map((course, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700`}>
                        {course.name}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">{course.status}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${course.progress > 0 ? 'bg-indigo-600' : ''}`} style={{ width: `${course.progress}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-gray-700">{course.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
