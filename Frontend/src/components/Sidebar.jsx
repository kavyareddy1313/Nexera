import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { 
  LayoutGrid, 
  Layout, 
  MessageSquare, 
  Users, 
  Video, 
  PenTool, 
  Folder, 
  GraduationCap, 
  Settings, 
  Plus 
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-logo-box">
          <LayoutGrid size={28} color="#5840D8" fill="#5840D8" />
        </div>
        
        <Link to="/dashboard" className={`nav-item ${path === '/dashboard' ? 'active' : ''}`}>
          <Layout size={22} />
        </Link>
        
        <Link to="/chat" className={`nav-item ${path === '/chat' ? 'active' : ''}`}>
          <MessageSquare size={22} />
        </Link>
        
        <div className="nav-item">
          <Users size={22} />
        </div>
        
        <div className="nav-item">
          <Video size={22} />
        </div>
        
        <div className="nav-item">
          <PenTool size={22} />
        </div>
        
        <div className="nav-item">
          <Folder size={22} />
        </div>

        <div className="nav-item">
          <GraduationCap size={22} />
        </div>
      </div>

      <div className="sidebar-bottom">
        <div className="nav-item">
          <Settings size={22} />
        </div>
        <button className="btn-add-sidebar">
          <Plus size={20} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
