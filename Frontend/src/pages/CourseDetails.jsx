import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, Users, PlayCircle, FileText, CheckCircle2, ChevronLeft, ShieldCheck, X, CreditCard, Smartphone, Zap, ArrowRight, MessageSquare, Sparkles } from 'lucide-react';
import api from '../api/axios';
import { GlobalNavRail } from '../components/layout/GlobalNavRail';
import { DashboardTopNav } from '../components/dashboard/DashboardTopNav';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────
// Checkout Modal Component
// ─────────────────────────────────────────────────────────
function CheckoutModal({ course, user, onClose, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState('checkout'); // checkout | processing | success

  const price = Number(course.price);
  const originalPrice = price * 1.5;
  const discount = originalPrice - price;

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setStep('processing');

    try {
      // 1. Create order on backend
      const orderRes = await api.post(`/courses/${course.id}/create-order`);
      const { orderId, amount, currency, keyId, isMock } = orderRes.data.data;

      if (isMock) {
        // Development mock — skip Razorpay UI, go straight to verify
        const verifyRes = await api.post('/courses/verify-payment', {
          razorpay_payment_id: `mock_pay_${Date.now()}`,
          razorpay_order_id: orderId,
          razorpay_signature: 'mock_signature',
          course_id: course.id
        });

        setStep('success');
        setTimeout(() => {
          onSuccess(verifyRes.data.data.conversationId);
        }, 2000);
        return;
      }

      // 2. Load Razorpay SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Payment gateway failed to load. Please check your connection.');
        setStep('checkout');
        setIsProcessing(false);
        return;
      }

      // 3. Open Razorpay checkout
      const options = {
        key: keyId,
        amount: amount.toString(),
        currency: currency,
        name: 'Nexera Platform',
        description: `Enrollment: ${course.title}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            const verifyRes = await api.post('/courses/verify-payment', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              course_id: course.id
            });

            setStep('success');
            setTimeout(() => {
              onSuccess(verifyRes.data.data.conversationId);
            }, 2000);
          } catch (error) {
            toast.error(error.response?.data?.message || 'Payment verification failed');
            setStep('checkout');
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user?.fullName || 'Student',
          email: user?.email || '',
        },
        theme: { color: '#4F46E5' },
        modal: {
          ondismiss: () => {
            setStep('checkout');
            setIsProcessing(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response) {
        toast.error(response.error.description || 'Payment failed');
        setStep('checkout');
        setIsProcessing(false);
      });
      paymentObject.open();

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
      setStep('checkout');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && step !== 'processing' && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close button */}
        {step !== 'processing' && (
          <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 z-10 transition-colors">
            <X size={16} />
          </button>
        )}

        {/* ── SUCCESS STATE ── */}
        {step === 'success' && (
          <div className="p-10 flex flex-col items-center justify-center text-center min-h-[400px]">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Enrollment Successful! 🎉</h2>
            <p className="text-gray-500 font-medium mb-2">You're now enrolled in</p>
            <p className="text-lg font-bold text-indigo-600 mb-6">"{course.title}"</p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MessageSquare size={16} />
              <span>Redirecting to your course community group...</span>
            </div>
          </div>
        )}

        {/* ── PROCESSING STATE ── */}
        {step === 'processing' && (
          <div className="p-10 flex flex-col items-center justify-center text-center min-h-[400px]">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Payment</h2>
            <p className="text-gray-500 font-medium">Please wait while we verify your transaction...</p>
          </div>
        )}

        {/* ── CHECKOUT STATE ── */}
        {step === 'checkout' && (
          <>
            {/* Header */}
            <div className="p-8 pb-0">
              <h2 className="text-xl font-extrabold text-gray-900 mb-1">Complete Your Enrollment</h2>
              <p className="text-sm text-gray-500 font-medium">Secure checkout for course access</p>
            </div>

            {/* Course Summary Card */}
            <div className="mx-8 mt-6 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100/50 flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 truncate">{course.title}</h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">by {course.instructor?.fullName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-amber-500 font-bold flex items-center gap-0.5"><Star size={10} fill="currentColor" /> {course.rating}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400">{course.duration}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="px-8 mt-6">
              <p className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-3">Payment Method</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'card', label: 'Card', icon: CreditCard },
                  { id: 'upi', label: 'UPI', icon: Smartphone },
                  { id: 'instant', label: 'Instant', icon: Zap },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setPaymentMethod(id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-semibold text-sm ${
                      paymentMethod === id 
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    <Icon size={20} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="px-8 mt-6">
              <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Course Price</span>
                  <span className="text-gray-500 line-through">₹{originalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-semibold">Discount</span>
                  <span className="text-green-600 font-semibold">-₹{discount.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-extrabold text-gray-900">₹{price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* What You Get */}
            <div className="px-8 mt-5">
              <div className="flex items-center gap-6 text-xs text-gray-400 font-medium">
                <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" /> Lifetime access</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" /> Course community</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" /> Certificate</span>
              </div>
            </div>

            {/* Pay Button */}
            <div className="p-8 pt-6">
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-bold text-base transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShieldCheck size={18} />
                {isProcessing ? 'Processing...' : `Pay ₹${price.toFixed(2)} & Enroll`}
              </button>
              <p className="text-center text-xs text-gray-400 mt-3 font-medium">
                🔒 Payments secured by Razorpay. Your data is encrypted.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main CourseDetails Page
// ─────────────────────────────────────────────────────────
export default function CourseDetails() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentConvoId, setEnrollmentConvoId] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await api.get(`/courses/${id}`);
        const data = response.data.data;
        setCourse(data);
        setIsEnrolled(data.isEnrolled || false);
        setEnrollmentConvoId(data.enrollmentConversationId || null);
      } catch (error) {
        toast.error("Failed to load course details");
        navigate('/courses');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourse();
  }, [id, navigate]);

  const handleEnrollClick = () => {
    if (isEnrolled) {
      // Already enrolled, go to chat group
      if (enrollmentConvoId) {
        navigate(`/chat?convo=${enrollmentConvoId}`);
      } else {
        navigate('/chat');
      }
      return;
    }
    setShowCheckout(true);
  };

  const handlePaymentSuccess = (conversationId) => {
    setIsEnrolled(true);
    setEnrollmentConvoId(conversationId);
    setShowCheckout(false);
    toast.success('Welcome to the course! Redirecting to your community...');
    setTimeout(() => {
      navigate(`/chat?convo=${conversationId}`);
    }, 1000);
  };

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
              
              <div className="flex items-center gap-3 mb-6 text-sm font-bold flex-wrap">
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/20">{course.category}</span>
                <span className="flex items-center gap-1 text-amber-400"><Star size={16} fill="currentColor" /> {course.rating} (2.1k ratings)</span>
                <span className="flex items-center gap-1 text-gray-400"><Users size={16} /> {course.studentsEnrolled?.toLocaleString()} students</span>
                {isEnrolled && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-lg border border-green-500/20 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Enrolled
                  </span>
                )}
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
                    ₹{Number(course.price).toFixed(2)}
                  </div>
                  <p className="text-sm font-medium text-gray-500 line-through">₹{(Number(course.price) * 1.5).toFixed(2)}</p>
                </div>

                <div className="space-y-3 mb-6">
                  {isEnrolled ? (
                    <>
                      <button 
                        onClick={() => enrollmentConvoId ? navigate(`/chat?convo=${enrollmentConvoId}`) : navigate('/chat')}
                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold text-base transition-all shadow-md shadow-green-500/20 flex items-center justify-center gap-2"
                      >
                        <MessageSquare size={18} />
                        Go to Class Group
                      </button>
                      <div className="flex items-center justify-center gap-2 py-2 text-sm text-green-600 font-semibold">
                        <CheckCircle2 size={16} />
                        Already Enrolled
                      </div>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={handleEnrollClick}
                        className="w-full py-4 bg-[#5A40DA] hover:bg-[#4830C0] text-white rounded-xl font-bold text-base transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
                      >
                        <Sparkles size={18} />
                        Enroll Now
                      </button>
                      <button className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-bold text-base transition-all">
                        Add to Wishlist
                      </button>
                    </>
                  )}
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <p className="font-bold text-gray-900 mb-2">This course includes:</p>
                  {[
                    { icon: PlayCircle, text: `${course.duration} on-demand video` },
                    { icon: MessageSquare, text: "Access to private course community" },
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

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          course={course}
          user={user}
          onClose={() => setShowCheckout(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
