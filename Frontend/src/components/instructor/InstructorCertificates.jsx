import React, { useState } from 'react';
import { 
  PlusCircle, 
  Award,
  Calendar,
  TriangleAlert,
  Star,
  Trash2,
  GraduationCap,
  Plus
} from 'lucide-react';

export function InstructorCertificates() {
  const [activeTab, setActiveTab] = useState('Certificate templates');
  const tabs = ['Certificate templates', 'Issued certificates', 'Verify certificate'];

  return (
    <div className="flex flex-1 overflow-hidden bg-[#f8f9fc]">
      <div className="flex-1 overflow-y-auto px-10 py-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          
          {/* Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Certificates</h1>
              <p className="text-[15px] font-medium text-gray-500">Issue and manage completion certificates</p>
            </div>
            <div>
              <button className="flex items-center gap-2 bg-[#5c4ce3] text-white px-6 py-3 rounded-full text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors">
                <PlusCircle size={18} />
                Create template
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex justify-between items-start">
              <div>
                <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-3">Total Issued</h3>
                <div className="text-4xl font-bold text-blue-600 tracking-tight">12,450</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Award size={24} />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex justify-between items-start">
              <div>
                <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-3">This Month</h3>
                <div className="text-4xl font-bold text-[#5c4ce3] tracking-tight">342</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-[#5c4ce3]">
                <Calendar size={24} />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex justify-between items-start border-l-4 border-l-amber-500">
              <div>
                <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-3">Expiring Soon</h3>
                <div className="text-4xl font-bold text-amber-500 tracking-tight">89</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                <TriangleAlert size={24} />
              </div>
            </div>

          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8 flex gap-8">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-bold transition-colors relative ${
                  activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Standard Developer */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="bg-[#f0f0fa] rounded-2xl p-4 mb-5 aspect-[4/3] flex flex-col items-center justify-center relative border border-gray-200/50">
                {/* Certificate Preview Frame */}
                <div className="w-full h-full bg-[#f8f9fc] border border-blue-200/60 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-6 shadow-[inset_0_0_20px_rgba(0,0,0,0.02)]">
                  <div className="w-12 h-12 rounded-full bg-[#e0e0ff] text-indigo-700 flex items-center justify-center mb-4">
                    <GraduationCap size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">Certificate of Completion</h4>
                  <div className="text-[10px] font-medium text-gray-500 mb-4">Student Name</div>
                  <div className="text-[9px] font-bold text-blue-700 tracking-widest uppercase">Advanced React Patterns</div>
                  
                  {/* QR Code placeholder */}
                  <div className="absolute bottom-4 right-4 bg-white w-6 h-6 rounded border border-gray-100 flex flex-wrap p-0.5 gap-px">
                    <div className="w-1.5 h-1.5 bg-gray-400"></div><div className="w-1.5 h-1.5 bg-gray-800"></div><div className="w-1.5 h-1.5 bg-gray-600"></div>
                    <div className="w-1.5 h-1.5 bg-gray-700"></div><div className="w-1.5 h-1.5 bg-gray-300"></div><div className="w-1.5 h-1.5 bg-gray-800"></div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center px-1">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Standard Developer</h3>
                  <p className="text-xs font-medium text-gray-500">Used in 12 courses</p>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <button className="hover:text-amber-400 transition-colors"><Star size={18} /></button>
                  <button className="hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>

            {/* Premium Design */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="bg-[#f0f0fa] rounded-2xl p-4 mb-5 aspect-[4/3] flex flex-col items-center justify-center relative border border-gray-200/50">
                {/* Certificate Preview Frame */}
                <div className="w-full h-full bg-[#f8f9fc] border border-gray-200 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-6 pt-8">
                  {/* Purple Top Border */}
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-purple-600"></div>
                  
                  <h4 className="text-lg font-bold text-gray-900 mb-1">Professional Certificate</h4>
                  <div className="text-[9px] font-medium text-gray-500 italic mb-4">Awarded to Student Name</div>
                  <div className="text-[9px] font-bold text-purple-700 tracking-widest uppercase">UI/UX MASTERCLASS</div>
                  
                  {/* Gold Seal Placeholder */}
                  <div className="absolute bottom-4 left-4 w-8 h-8 rounded-full bg-amber-300 border-[3px] border-amber-200 flex items-center justify-center">
                    <div className="w-4 h-4 text-amber-600 opacity-60"><Award size={16} strokeWidth={3}/></div>
                  </div>

                  {/* QR Code placeholder */}
                  <div className="absolute bottom-4 right-4 bg-white w-6 h-6 rounded border border-gray-100 flex flex-wrap p-0.5 gap-px">
                    <div className="w-1.5 h-1.5 bg-gray-400"></div><div className="w-1.5 h-1.5 bg-gray-800"></div><div className="w-1.5 h-1.5 bg-gray-600"></div>
                    <div className="w-1.5 h-1.5 bg-gray-700"></div><div className="w-1.5 h-1.5 bg-gray-300"></div><div className="w-1.5 h-1.5 bg-gray-800"></div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center px-1">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Premium Design</h3>
                  <p className="text-xs font-medium text-gray-500">Used in 3 courses</p>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <button className="hover:text-amber-400 transition-colors"><Star size={18} /></button>
                  <button className="hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>

            {/* Create New Placeholder */}
            <div className="rounded-3xl p-6 border-2 border-dashed border-gray-300 hover:border-indigo-400 bg-gray-50/50 hover:bg-indigo-50/20 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-[#e0e0ff] text-indigo-700 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <Plus size={32} />
              </div>
              <div className="text-sm font-bold text-gray-700">Create new template</div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
