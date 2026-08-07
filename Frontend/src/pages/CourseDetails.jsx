import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, Users, PlayCircle, FileText, CheckCircle2, ChevronLeft, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import { GlobalNavRail } from '../components/layout/GlobalNavRail';
import { DashboardTopNav } from '../components/dashboard/DashboardTopNav';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';

export default function CourseDetails() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load Razorpay script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleEnroll = async () => {
    setIsProcessing(true);
    try {
      const res = await loadRazorpayScript();
      if (!res) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        setIsProcessing(false);
        return;
      }

      // 1. Create order on backend
      const orderRes = await api.post(`/courses/${course.id}/create-order`);
      const { orderId, amount, currency } = orderRes.data.data;

      // 2. Open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SJb1Khp4Xsxh2j',
        amount: amount.toString(),
        currency: currency,
        name: 'Nexera Platform',
        description: `Enrollment for ${course.title}`,
        image: 'https://cdn-icons-png.flaticon.com/512/5556/5556468.png', // placeholder logo
        order_id: orderId,
        handler: async function (response) {
          try {
            toast.loading('Verifying payment...', { id: 'verify' });
            
            // 3. Verify on backend
            const verifyRes = await api.post('/courses/verify-payment', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              course_id: course.id
            });

            toast.success('Successfully enrolled! Joining community...', { id: 'verify' });
            
            // 4. Redirect to chat to see the new group
            setTimeout(() => {
              navigate('/chat');
            }, 1500);

          } catch (error) {
            toast.error(error.response?.data?.message || 'Payment verification failed', { id: 'verify' });
          }
        },
        prefill: {
          name: user?.fullName || 'Student',
          email: user?.email || 'student@example.com',
        },
        theme: {
          color: '#4F46E5', // Indigo 600
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response) {
        toast.error(response.error.description);
      });
      paymentObject.open();

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await api.get(`/courses/${id}`);
        setCourse(response.data.data);
      } catch (error) {
        toast.error("Failed to load course details");
        navigate('/courses');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourse();
  }, [id, navigate]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-[#F4F5F7]"><div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>;
  }

  if (!course) return null;

  return (
    <div className="flex h-screen bg-[#F4F5F7] overflow-hidden font-sans">
      <GlobalNavRail activeRoute="/courses" />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <DashboardTopNav user={user} />
        
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          
          {/* Hero Banner */}
          <div className="bg-[#0B0E14] text-white pt-10 pb-32 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-[-50%] right-[-10%] w-[80%] h-[150%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-[#0B0E14] to-[#0B0E14]"></div>
            </div>
            
            <div className="max-w-6xl mx-auto px-10 relative z-10">
              <button 
                onClick={() => navigate('/courses')}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors text-sm font-bold"
              >
                <ChevronLeft size={16} /> Back to Courses
              </button>
              
              <div className="flex items-center gap-3 mb-6 text-sm font-bold">
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/20">{course.category}</span>
                <span className="flex items-center gap-1 text-amber-400"><Star size={16} fill="currentColor" /> {course.rating} (2.1k ratings)</span>
                <span className="flex items-center gap-1 text-gray-400"><Users size={16} /> {course.studentsEnrolled?.toLocaleString()} students</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 max-w-3xl leading-tight">
                {course.title}
              </h1>
              
              <p className="text-xl text-gray-400 mb-8 max-w-2xl leading-relaxed">
                {course.description}
              </p>
              
              <div className="flex items-center gap-4">
                <img src={course.instructor?.avatarUrl || `https://i.pravatar.cc/150?u=${course.instructor?.id}`} alt="Instructor" className="w-12 h-12 rounded-full border-2 border-white/10" />
                <div>
                  <p className="text-sm text-gray-400">Created by</p>
                  <p className="font-bold">{course.instructor?.fullName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content & Sidebar Layout */}
          <div className="max-w-6xl mx-auto px-10 relative -mt-20 pb-20 flex flex-col lg:flex-row gap-10">
            
            {/* Left Content */}
            <div className="flex-1 space-y-10">
              
              {/* What you'll learn */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">What you'll learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Build scalable fullstack applications from scratch",
                    "Master React, Zustand, and Tailwind CSS",
                    "Implement secure JWT authentication and WebSockets",
                    "Deploy production-ready applications to the cloud"
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                      <span className="text-gray-600 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Curriculum */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Curriculum</h2>
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                  {[
                    { title: "Introduction & Setup", lessons: 4, duration: "45m" },
                    { title: "Frontend Architecture", lessons: 8, duration: "2h 15m" },
                    { title: "Backend API Design", lessons: 10, duration: "3h 30m" },
                    { title: "Real-time WebSockets", lessons: 6, duration: "1h 45m" }
                  ].map((module, i) => (
                    <div key={i} className="border-b border-gray-100 last:border-0">
                      <div className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                            {i+1}
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">{module.title}</h3>
                        </div>
                        <div className="flex items-center gap-6 text-sm font-semibold text-gray-500">
                          <span className="flex items-center gap-2"><FileText size={16}/> {module.lessons} lessons</span>
                          <span className="flex items-center gap-2"><Clock size={16}/> {module.duration}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar (Sticky) */}
            <div className="w-full lg:w-[400px]">
              <div className="sticky top-10 bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
                <div className="relative w-full h-56 rounded-2xl overflow-hidden mb-6 group cursor-pointer">
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                    <PlayCircle size={64} className="text-white drop-shadow-lg" />
                  </div>
                  <div className="absolute bottom-4 left-0 w-full text-center">
                    <span className="font-bold text-white tracking-wide drop-shadow-md">Preview Course</span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-4xl font-extrabold text-gray-900 mb-2">
                    ${Number(course.price).toFixed(2)}
                  </div>
                  <p className="text-sm font-medium text-gray-500 line-through">${(Number(course.price) * 1.5).toFixed(2)}</p>
                </div>

                <div className="space-y-3 mb-6">
                  <button 
                    disabled={isProcessing}
                    onClick={handleEnroll}
                    className="w-full py-4 bg-[#5A40DA] hover:bg-[#4830C0] text-white rounded-xl font-bold text-base transition-all shadow-md shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Enroll Now'}
                  </button>
                  <button className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-bold text-base transition-all">
                    Add to Wishlist
                  </button>
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <p className="font-bold text-gray-900 mb-2">This course includes:</p>
                  {[
                    { icon: PlayCircle, text: `${course.duration} on-demand video` },
                    { icon: FileText, text: "Access to private course community" },
                    { icon: Users, text: "Live weekly Q&A sessions" },
                    { icon: ShieldCheck, text: "Certificate of completion" }
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm font-medium text-gray-600">
                      <feature.icon size={18} className="text-gray-400" />
                      {feature.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
