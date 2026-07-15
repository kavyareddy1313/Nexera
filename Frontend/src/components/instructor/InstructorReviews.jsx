import React, { useState } from 'react';
import { 
  Search, 
  MessageCircle, 
  Mail, 
  Star,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  CornerDownRight,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export function InstructorReviews() {
  const [reviews, setReviews] = useState([
    {
      id: 1,
      author: 'Alex Sterling',
      timeAgo: '2 days ago',
      avatarColor: 'bg-indigo-100',
      initials: 'AS',
      course: 'UI/UX Masterclass',
      rating: 5,
      content: "This course exceeded my expectations! The modules on design systems were particularly helpful. I've already applied these principles to my team's workflow and saw immediate improvements in consistency.",
      replied: true,
      replyText: "Thank you Alex! Glad you enjoyed the systems module. Keep up the great work applying it to your team's workflow!",
      replyTime: "Yesterday",
      helpful: 12
    },
    {
      id: 2,
      author: 'Elena Koshka',
      timeAgo: '3 hours ago',
      avatarColor: 'bg-indigo-100',
      initials: 'EK',
      course: 'Advanced React',
      rating: 4,
      content: "Great content, but would love more examples of server actions. The pacing is a bit fast in chapter 4, but otherwise a very solid overview of modern React patterns.",
      replied: false,
      replyText: "",
      replyTime: "",
      helpful: 4
    }
  ]);

  const [replyInput, setReplyInput] = useState({});

  const handlePostReply = (id) => {
    if (!replyInput[id] || replyInput[id].trim() === '') return;
    
    setReviews(reviews.map(review => {
      if (review.id === id) {
        return {
          ...review,
          replied: true,
          replyText: replyInput[id],
          replyTime: "Just now"
        };
      }
      return review;
    }));
  };

  const handleReplyChange = (id, text) => {
    setReplyInput({
      ...replyInput,
      [id]: text
    });
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-[#f8f9fc]">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search reviews, students, or courses..." 
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-6">
            <button className="text-gray-400 hover:text-gray-600 transition-colors relative">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </button>
            <button className="hover:text-gray-900 text-gray-500"><div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">?</div></button>
            <button className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              New Announcement
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold text-sm">
              SJ
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-10 pt-10 pb-20 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Reviews</h1>
              <p className="text-[15px] font-medium text-gray-500">Manage and respond to student feedback across your courses.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-indigo-50/50">
                  <Star size={120} fill="currentColor" />
                </div>
                <h3 className="text-[11px] font-bold text-gray-500 tracking-widest uppercase mb-4 relative z-10">Avg Rating (This Month)</h3>
                <div className="flex items-baseline gap-3 mb-2 relative z-10">
                  <span className="text-3xl font-extrabold text-gray-900">4.8</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} size={14} className="text-amber-400" fill="currentColor" />)}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 relative z-10">
                  <TrendingUp size={16} />
                  +0.2 from last month
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-indigo-50/50">
                  <MessageCircle size={120} fill="currentColor" />
                </div>
                <h3 className="text-[11px] font-bold text-gray-500 tracking-widest uppercase mb-4 relative z-10">Total Reviews (This Month)</h3>
                <div className="text-3xl font-extrabold text-gray-900 mb-2 relative z-10">142</div>
                <div className="text-sm font-medium text-gray-500 relative z-10">
                  Across 4 active courses
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden border-l-4 border-l-amber-400">
                <div className="absolute -right-4 -top-4 text-amber-50/50">
                  <Mail size={120} />
                </div>
                <h3 className="text-[11px] font-bold text-gray-500 tracking-widest uppercase mb-4 relative z-10">Needs Reply</h3>
                <div className="flex items-center gap-3 mb-2 relative z-10">
                  <span className="text-3xl font-extrabold text-gray-900">12</span>
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-md">Action Needed</span>
                </div>
                <div className="text-sm font-medium text-gray-500 relative z-10">
                  Aim to reply within 48 hours
                </div>
              </div>

            </div>

            {/* Rating Distribution */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 mb-8 flex items-center justify-between">
              <div className="text-center px-12 border-r border-gray-100 shrink-0">
                <div className="text-5xl font-extrabold text-gray-900 mb-3">4.7</div>
                <div className="flex gap-1 justify-center mb-3">
                  {[1,2,3,4,5].map((i, idx) => <Star key={i} size={20} className={idx < 4 ? "text-amber-400" : "text-amber-400/30"} fill={idx < 4 ? "currentColor" : "none"} />)}
                </div>
                <div className="text-sm font-medium text-gray-500">Based on 2,841 ratings</div>
              </div>
              
              <div className="flex-1 px-12 space-y-3">
                {[
                  { star: 5, pct: 72, width: '72%' },
                  { star: 4, pct: 18, width: '18%' },
                  { star: 3, pct: 6, width: '6%' },
                  { star: 2, pct: 2, width: '2%' },
                  { star: 1, pct: 1, width: '1%' },
                ].map((row) => (
                  <div key={row.star} className="flex items-center gap-4">
                    <div className="flex items-center gap-1 w-8 text-sm font-bold text-gray-600">
                      {row.star} <Star size={12} className="text-amber-400" fill="currentColor" />
                    </div>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: row.width }}></div>
                    </div>
                    <div className="w-10 text-right text-sm font-medium text-gray-500">{row.pct}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button className="flex items-center justify-between w-48 bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:border-gray-300 transition-colors shadow-sm">
                  All Courses
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
                <button className="flex items-center justify-between w-36 bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:border-gray-300 transition-colors shadow-sm">
                  All Ratings
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500">Sort by:</span>
                <button className="flex items-center gap-2 bg-[#f0f0ff] border border-[#e0e0ff] text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors">
                  Most Recent
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className={`bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 ${!review.replied ? 'border-l-4 border-l-amber-400' : ''}`}>
                  
                  {/* Review Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-indigo-700 font-bold ${review.avatarColor}`}>
                        {review.initials}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-0.5">{review.author}</h3>
                        <p className="text-xs font-medium text-gray-400">{review.timeAgo}</p>
                      </div>
                    </div>
                    <div className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
                      {review.course}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={16} className={i <= review.rating ? "text-amber-400" : "text-gray-200"} fill={i <= review.rating ? "currentColor" : "none"} />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-[15px] font-medium text-gray-700 leading-relaxed mb-6 max-w-4xl">
                    "{review.content}"
                  </p>

                  {/* Reply Section */}
                  {review.replied ? (
                    <div className="bg-[#f8f9fc] rounded-2xl p-6 border-l-4 border-l-emerald-400 mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs tracking-widest uppercase">
                          <CornerDownRight size={14} />
                          Your Reply
                        </div>
                        <span className="text-xs font-medium text-gray-400">{review.replyTime}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-700">{review.replyText}</p>
                    </div>
                  ) : (
                    <div className="bg-[#f8f9fc] rounded-2xl p-6 mb-6 border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 font-bold text-xs tracking-widest uppercase mb-4">
                        <CornerDownRight size={14} />
                        Reply to this review
                      </div>
                      <textarea 
                        value={replyInput[review.id] || ''}
                        onChange={(e) => handleReplyChange(review.id, e.target.value)}
                        placeholder="Type your response..."
                        rows={3}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none mb-4"
                      ></textarea>
                      <div className="flex justify-end">
                        <button 
                          onClick={() => handlePostReply(review.id)}
                          className="bg-[#5c4ce3] text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                          Post Reply
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-400 pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-4">
                      <span>Was this helpful?</span>
                      <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                        <ThumbsUp size={14} /> {review.helpful}
                      </button>
                      <button className="flex items-center gap-1.5 hover:text-rose-600 transition-colors">
                        <ThumbsDown size={14} />
                      </button>
                    </div>
                    <button className="hover:text-gray-600 transition-colors">Report</button>
                  </div>

                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-2 mt-10">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm shadow-sm">
                1
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 font-semibold text-sm transition-colors">
                2
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 font-semibold text-sm transition-colors">
                3
              </button>
              <span className="text-gray-400 px-1">...</span>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 font-semibold text-sm transition-colors">
                12
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
