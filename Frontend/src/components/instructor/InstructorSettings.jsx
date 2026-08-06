import React, { useState } from 'react';
import { 
  Search,
  Bell,
  HelpCircle,
  Building2,
  Plus,
} from 'lucide-react';

export function InstructorSettings() {
  const [activeTab, setActiveTab] = useState('Account Security');

  const tabs = [
    { name: 'Profile', color: 'text-gray-600' },
    { name: 'Account Security', color: 'text-indigo-600' },
    { name: 'Notifications', color: 'text-gray-600' },
    { name: 'Privacy', color: 'text-gray-600' },
    { name: 'Appearance', color: 'text-gray-600' },
    { name: 'Payout Settings', color: 'text-gray-600' },
    { name: 'Danger Zone', color: 'text-red-500' },
  ];

  return (
    <div className="flex flex-1 overflow-hidden bg-[#f8f9fc]">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-10 pt-10 pb-20 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            
            <div className="mb-10">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Settings</h1>
              <p className="text-[15px] font-medium text-gray-500">Manage your account preferences, security, and payouts.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-12">
              
              {/* Left Inner Menu */}
              <div className="w-64 shrink-0">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.name}
                      onClick={() => setActiveTab(tab.name)}
                      className={`w-full flex items-center px-5 py-3 text-sm font-bold transition-all relative ${
                        activeTab === tab.name 
                          ? 'bg-white rounded-xl shadow-sm text-indigo-600' 
                          : `${tab.color} hover:bg-gray-100 rounded-xl`
                      }`}
                    >
                      {activeTab === tab.name && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-600 rounded-r-full"></div>
                      )}
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Right Content Area */}
              <div className="flex-1 space-y-12">
                
                {/* Security Section */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Security</h2>
                  
                  <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                    {/* Top Purple Accent Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#5c4ce3]"></div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Change Password</h3>
                    <p className="text-sm font-medium text-gray-500 mb-8">Ensure your account is using a long, random password to stay secure.</p>
                    
                    <div className="space-y-6 max-w-lg">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Current Password</label>
                        <input 
                          type="password" 
                          defaultValue="password123"
                          className="w-full bg-[#f3f4f8] border-none rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">New Password</label>
                        <input 
                          type="password" 
                          className="w-full bg-[#f3f4f8] border-none rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 mb-3"
                        />
                        <div className="flex gap-1.5 mb-2">
                          <div className="h-1 flex-1 bg-gray-200 rounded-full"></div>
                          <div className="h-1 flex-1 bg-gray-200 rounded-full"></div>
                          <div className="h-1 flex-1 bg-gray-200 rounded-full"></div>
                          <div className="h-1 flex-1 bg-gray-200 rounded-full"></div>
                        </div>
                        <p className="text-[11px] font-medium text-gray-500">Use 8 or more characters with a mix of letters, numbers & symbols.</p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Confirm Password</label>
                        <input 
                          type="password" 
                          className="w-full bg-[#f3f4f8] border-none rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      <button className="bg-[#5c4ce3] text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors mt-2">
                        Update password
                      </button>
                    </div>
                  </div>
                </div>

                {/* Payout Settings Section */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Payout Settings</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Direct Deposit Card */}
                    <div className="bg-[#f8f9fc] rounded-3xl p-6 border-2 border-indigo-50 relative cursor-pointer group hover:border-indigo-100 transition-colors">
                      <div className="absolute top-6 right-6">
                        <div className="w-5 h-5 rounded-full border-4 border-indigo-600 bg-white"></div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-16">
                        <Building2 size={20} />
                      </div>
                      <h4 className="text-[15px] font-bold text-gray-900 mb-1">Direct Deposit</h4>
                      <p className="text-sm font-medium text-gray-500">Bank ending in 4093</p>
                    </div>

                    {/* Add Payment Method Card */}
                    <div className="bg-white rounded-3xl p-6 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors min-h-[200px]">
                      <div className="w-8 h-8 rounded-full border-2 border-gray-400 text-gray-400 flex items-center justify-center mb-3 group-hover:text-gray-600 group-hover:border-gray-600 transition-colors">
                        <Plus size={16} />
                      </div>
                      <span className="text-sm font-bold text-gray-500 group-hover:text-gray-700 transition-colors">Add payment method</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
