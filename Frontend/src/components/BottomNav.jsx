import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Video, Folder, Settings, Plus } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.06)] px-8 sm:px-10 py-5 flex justify-between items-center z-50">
      
      <Link to="/dashboard" className={`${path === '/dashboard' || path === '/' ? 'text-[#5641ED]' : 'text-[#9CA3AF] hover:text-gray-600'} transition-colors`}>
        <Home size={24} className="fill-current" />
      </Link>
      
      <Link to="/chat" className={`${path === '/chat' ? 'text-[#5641ED]' : 'text-[#9CA3AF] hover:text-gray-600'} transition-colors relative`}>
        <MessageSquare size={24} className="fill-current" />
      </Link>
      
      <div className="relative">
        <button className="absolute bottom-[-22px] left-1/2 -translate-x-1/2 w-[3.5rem] h-[3.5rem] bg-[#5641ED] rounded-full flex items-center justify-center text-white shadow-[0_8px_25px_rgba(86,65,237,0.4)] hover:bg-indigo-700 transition-transform hover:scale-105">
          <Plus size={26} strokeWidth={3} />
        </button>
      </div>

      <button className="text-[#9CA3AF] hover:text-gray-600 transition-colors pl-8">
        <Video size={24} className="fill-current" />
      </button>
      <button className="text-[#9CA3AF] hover:text-gray-600 transition-colors">
        <Folder size={24} className="fill-current" />
      </button>
      <button className="text-[#9CA3AF] hover:text-gray-600 transition-colors">
        <Settings size={24} className="fill-current" />
      </button>
    </div>
  );
}
