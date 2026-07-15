import React, { useState } from 'react';
import { PlayCircle, Download, Infinity, Award, Image as ImageIcon } from 'lucide-react';

export function Step3Pricing() {
  const [isPaid, setIsPaid] = useState(true);
  const [hasLimit, setHasLimit] = useState(true);

  return (
    <div className="flex-1 flex overflow-y-auto bg-[#f8f9fc] p-12 custom-scrollbar justify-center">
      <div className="max-w-[900px] w-full flex flex-col md:flex-row gap-16">
        
        {/* Left Column - Form */}
        <div className="flex-1 max-w-md">
          {/* Header */}
          <div className="mb-10">
            <h2 className="text-[15px] font-bold text-gray-900 mb-1">New Course</h2>
            <p className="text-sm font-medium text-gray-500">Configure pricing options for your students.</p>
          </div>

          <div className="space-y-8">
            {/* Type Toggle */}
            <div className="bg-[#f3f4f9] p-1.5 rounded-xl flex items-center mb-6">
              <button 
                onClick={() => setIsPaid(false)}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${!isPaid ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Free
              </button>
              <button 
                onClick={() => setIsPaid(true)}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${isPaid ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Paid
              </button>
            </div>

            {isPaid && (
              <>
                {/* Price */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 tracking-widest uppercase mb-3">Price ($USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                    <input 
                      type="text" 
                      defaultValue="149"
                      className="w-full border border-gray-300 rounded-xl pl-8 pr-4 py-3.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 tracking-widest uppercase mb-3">Discount Price (Optional)</label>
                  <div className="relative mb-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                    <input 
                      type="text" 
                      defaultValue="99"
                      className="w-full border border-gray-300 rounded-xl pl-8 pr-4 py-3.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <p className="text-[11px] font-medium text-gray-400">Displays as a slashed price on the sales page.</p>
                </div>
              </>
            )}

            {/* Enrollment Limit */}
            <div className="bg-[#f0f1f8] rounded-2xl p-6 border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-0.5">Enrollment Limit</h3>
                  <p className="text-xs font-medium text-gray-500">Cap the number of students who can join.</p>
                </div>
                {/* Toggle Switch */}
                <button 
                  onClick={() => setHasLimit(!hasLimit)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors relative flex items-center ${hasLimit ? 'bg-indigo-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${hasLimit ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
              </div>

              {hasLimit && (
                <input 
                  type="text" 
                  defaultValue="50"
                  className="w-24 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              )}
            </div>

          </div>
        </div>

        {/* Right Column - Preview Card */}
        <div className="w-[380px] shrink-0">
          <label className="block text-xs font-bold text-gray-500 tracking-widest uppercase mb-4 text-center md:text-left">Student Preview</label>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            {/* Video Placeholder */}
            <div className="w-full h-[200px] bg-gradient-to-br from-indigo-100 to-gray-400 rounded-2xl flex items-center justify-center relative mb-6 overflow-hidden">
               <ImageIcon size={32} className="text-indigo-500/50 absolute" />
               <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                 <PlayCircle size={14} />
                 <span className="text-[11px] font-bold">Course Preview</span>
               </div>
            </div>

            {/* Price Info */}
            <div className="text-center mb-6">
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-2xl font-extrabold text-gray-900">$99</span>
                <span className="text-sm font-semibold text-gray-400 line-through">$149</span>
              </div>
              <span className="inline-block bg-purple-50 text-purple-600 text-[11px] font-bold tracking-wide px-3 py-1 rounded-full">
                Special Offer
              </span>
            </div>

            <button className="w-full bg-[#5c4ce3] text-white font-bold py-3.5 rounded-full hover:bg-indigo-700 transition-colors shadow-sm text-sm mb-8">
              Enroll Now
            </button>

            {/* Course Includes */}
            <div>
              <h4 className="text-[11px] font-bold text-gray-500 tracking-widest uppercase mb-4">This course includes:</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <PlayCircle size={16} className="text-indigo-600" />
                  12 hours of on-demand video
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <Download size={16} className="text-indigo-600" />
                  24 downloadable resources
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <Infinity size={16} className="text-indigo-600" />
                  Full lifetime access
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <Award size={16} className="text-indigo-600" />
                  Certificate of completion
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
