import { useState, useEffect } from 'react';
import { MessageSquare, Video, PenTool, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-z0-9_]+$/, 'Username must be lowercase letters, numbers, or underscores'),
  role: z.enum(['student', 'instructor', 'admin']),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    username: '',
    role: 'student',
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const { login, register, isLoading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    return () => clearError();
  }, [isAuthenticated, navigate, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});
    setSuccessMessage('');
    clearError();

    if (isLogin) {
      const parsed = loginSchema.safeParse({ email: formData.email, password: formData.password });
      if (!parsed.success) {
        const errors = {};
        parsed.error.issues.forEach(issue => {
          errors[issue.path[0]] = issue.message;
        });
        setValidationErrors(errors);
        return;
      }

      const success = await login(formData.email, formData.password);
      if (success) navigate('/dashboard');
    } else {
      const parsed = registerSchema.safeParse(formData);
      if (!parsed.success) {
        const errors = {};
        parsed.error.issues.forEach(issue => {
          errors[issue.path[0]] = issue.message;
        });
        setValidationErrors(errors);
        return;
      }

      const success = await register(
        formData.fullName, 
        formData.username, 
        formData.email, 
        formData.password, 
        formData.role
      );
      
      if (success) {
        setSuccessMessage('Account created successfully! Please login.');
        setIsLogin(true);
        setFormData(prev => ({ ...prev, password: '' })); // Clear password
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (validationErrors[e.target.name]) {
      setValidationErrors({ ...validationErrors, [e.target.name]: null });
    }
    if (error) clearError();
    if (successMessage) setSuccessMessage('');
  };

  const handleQuickLogin = async (index) => {
    const email = `test${index}@example.com`;
    const password = 'password123';
    const username = `testuser${index}`;
    const fullName = `Test User ${index}`;
    const role = index % 3 === 0 ? 'admin' : (index % 2 === 0 ? 'instructor' : 'student');

    const loginSuccess = await login(email, password);
    if (loginSuccess) {
      navigate('/dashboard');
      return;
    }

    const regSuccess = await register(fullName, username, email, password, role);
    if (regSuccess) {
      const success = await login(email, password);
      if (success) navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side - Dark Theme Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0B0E14] text-white p-16 flex-col justify-between relative overflow-hidden">
        {/* Subtle background abstract shapes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1f2335] via-[#0B0E14] to-[#0B0E14]"></div>
          <div className="absolute top-[20%] left-[-20%] w-[140%] h-[100%] rounded-[100%] border-t-[0.5px] border-white/5 opacity-50 transform -rotate-12"></div>
          <div className="absolute top-[22%] left-[-20%] w-[140%] h-[100%] rounded-[100%] border-t-[1px] border-white/5 opacity-30 transform -rotate-12"></div>
          <div className="absolute top-[25%] left-[-20%] w-[140%] h-[100%] rounded-[100%] border-t-[2px] border-white/5 opacity-20 transform -rotate-12"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-32">
            <div className="w-8 h-8 grid grid-cols-3 grid-rows-3 gap-[2px]">
               {[...Array(9)].map((_, i) => (
                 <div key={i} className={`rounded-full ${i === 4 ? 'bg-indigo-500' : 'bg-indigo-400/50'}`} />
               ))}
            </div>
            <span className="text-2xl font-bold tracking-tight">Nexera</span>
          </div>

          <h1 className="text-2xl font-bold mb-12 tracking-wide text-gray-100">
            Elevate your team's digital synergy.
          </h1>

          <div className="space-y-10">
            <div className="flex gap-5 items-start">
              <div className="p-3.5 bg-[#171A21] rounded-xl text-indigo-400 shadow-sm border border-white/5">
                <MessageSquare size={24} />
              </div>
              <div className="mt-1">
                <h3 className="font-bold text-lg mb-1.5 tracking-wide">Unified Messaging</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-md font-medium">
                  Contextual threads and AI-driven summaries keep your conversations actionable.
                </p>
              </div>
            </div>

            <div className="flex gap-5 items-start">
              <div className="p-3.5 bg-[#171A21] rounded-xl text-indigo-400 shadow-sm border border-white/5">
                <Video size={24} />
              </div>
              <div className="mt-1">
                <h3 className="font-bold text-lg mb-1.5 tracking-wide">Video Meetings</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-md font-medium">
                  Crystal clear 4K collaboration with real-time transcription and spatial audio.
                </p>
              </div>
            </div>

            <div className="flex gap-5 items-start">
              <div className="p-3.5 bg-[#171A21] rounded-xl text-indigo-400 shadow-sm border border-white/5">
                <PenTool size={24} />
              </div>
              <div className="mt-1">
                <h3 className="font-bold text-lg mb-1.5 tracking-wide">Infinite Whiteboard</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-md font-medium">
                  Visualize complex ideas instantly with our responsive, high-fidelity canvas.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs font-bold text-gray-500/80 uppercase tracking-widest mt-12">
          BUILT FOR TEAMS THAT MOVE FAST.
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#F4F5F7]">
        <div className="w-full max-w-md">
          <div className="flex mx-auto w-fit bg-gray-100 p-1 rounded-full mb-12 shadow-sm border border-gray-200/50">
            <button 
              onClick={() => { setIsLogin(true); clearError(); setValidationErrors({}); setSuccessMessage(''); }}
              className={`px-8 py-2.5 rounded-full transition-all text-sm font-bold ${isLogin ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Login
            </button>
            <button 
              onClick={() => { setIsLogin(false); clearError(); setValidationErrors({}); }}
              className={`px-8 py-2.5 rounded-full transition-all text-sm font-bold ${!isLogin ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Register
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-[1.4rem] font-bold text-gray-900 mb-2">{isLogin ? 'Welcome back' : 'Create an account'}</h2>
            <p className="text-gray-500 text-[0.95rem] font-medium">{isLogin ? 'Please enter your details to sign in.' : 'Get started with your collaborative workspace.'}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-semibold rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 text-sm font-semibold rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              {successMessage}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2.5">FULL NAME</label>
                  <input 
                    type="text" 
                    name="fullName"
                    placeholder="John Doe" 
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3.5 rounded-xl border ${validationErrors.fullName ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-indigo-500'} focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-gray-400 text-sm bg-white font-medium shadow-sm`}
                  />
                  {validationErrors.fullName && <p className="text-xs text-red-500 mt-1.5 font-medium">{validationErrors.fullName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2.5">USERNAME</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">@</span>
                    <input 
                      type="text" 
                      name="username"
                      placeholder="johndoe" 
                      value={formData.username}
                      onChange={handleChange}
                      className={`w-full pl-8 pr-4 py-3.5 rounded-xl border ${validationErrors.username ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-indigo-500'} focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-gray-400 text-sm bg-white font-medium shadow-sm`}
                    />
                  </div>
                  {validationErrors.username ? (
                    <p className="text-xs text-red-500 mt-1.5 font-medium">{validationErrors.username}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1.5 font-medium">Lowercase letters, numbers, and underscores only</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2.5">ROLE</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm bg-white font-medium shadow-sm"
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2.5">EMAIL</label>
              <input 
                type="email" 
                name="email"
                placeholder="name@company.com" 
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3.5 rounded-xl border ${validationErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-indigo-500'} focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-gray-400 text-sm bg-white font-medium shadow-sm`}
              />
              {validationErrors.email && <p className="text-xs text-red-500 mt-1.5 font-medium">{validationErrors.email}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest">PASSWORD</label>
                {isLogin && <Link to="/forgot-password" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">Forgot password?</Link>}
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  placeholder="••••••••" 
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3.5 rounded-xl border ${validationErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-indigo-500'} focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-gray-400 text-sm bg-white font-medium shadow-sm`}
                />
                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {validationErrors.password && <p className="text-xs text-red-500 mt-1.5 font-medium">{validationErrors.password}</p>}
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-[#5A40DA] hover:bg-[#4830C0] disabled:bg-indigo-300 text-white rounded-xl font-bold text-sm text-center transition-all shadow-md shadow-indigo-500/20 mt-4 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              {isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">OR</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <button className="w-full py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3">
            Continue with Google
          </button>

          {/* Quick Developer Login */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center mb-4">Quick Developer Login</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickLogin(num)}
                  className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Test {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
