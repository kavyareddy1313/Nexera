import React from 'react';
import { Info, Layers, DollarSign, Settings, Rocket } from 'lucide-react';

export function WizardSidebar({ currentStep, setStep }) {
  const menuItems = [
    { num: 1, name: 'Course Info', icon: Info },
    { num: 2, name: 'Curriculum', icon: Layers },
    { num: 3, name: 'Pricing', icon: DollarSign },
    { num: 4, name: 'Publish', icon: Rocket },
    // Settings isn't a step in the top header, but it's in the sidebar. Let's just make it visual.
    { num: 5, name: 'Settings', icon: Settings }, 
  ];

  return (
    <aside className="w-[260px] bg-[#f8f9fc] border-r border-gray-100 flex flex-col h-full shrink-0">
      <div className="p-8 pb-4">
        <h2 className="text-lg font-bold text-gray-900 leading-tight">New Course</h2>
        <p className="text-sm font-medium text-gray-500 mt-0.5">Draft Mode</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-4">
        {menuItems.map((item) => {
          const isActive = currentStep === item.num;
          
          return (
            <button
              key={item.num}
              onClick={() => item.num <= 4 && setStep(item.num)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[13px] font-bold tracking-wide transition-all ${
                isActive 
                  ? 'bg-white text-indigo-700 shadow-sm border border-gray-100' 
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className={isActive ? 'text-indigo-600' : 'text-gray-400'}>
                {isActive ? (
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-indigo-100 rounded-full scale-150"></div>
                    <item.icon size={18} strokeWidth={2.5} className="relative z-10" />
                  </div>
                ) : (
                  <item.icon size={20} strokeWidth={2} />
                )}
              </div>
              <span className={isActive ? 'ml-1' : ''}>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-8">
        <button className="text-indigo-600 hover:text-indigo-800 font-bold text-sm transition-colors">
          Save Draft
        </button>
      </div>
    </aside>
  );
}
