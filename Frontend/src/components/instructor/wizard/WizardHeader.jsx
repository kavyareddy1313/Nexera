import React from 'react';
import { Bell, Settings } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';

export function WizardHeader({ currentStep }) {
  const { user } = useAuthStore();

  const steps = [
    { num: 1, label: 'COURSE INFO' },
    { num: 2, label: 'CURRICULUM' },
    { num: 3, label: 'PRICING' },
    { num: 4, label: 'PUBLISH' },
  ];

  return (
    <div className="w-full h-[80px] flex items-center justify-between px-8 bg-[#f8f9fc] shrink-0 border-b border-gray-100 z-30">
      <div className="flex items-center gap-4 w-1/4">
        <h1 className="text-xl font-bold text-indigo-700 tracking-tight">NexeraLMS</h1>
        <span className="text-sm font-medium text-gray-500">Curriculum Wizard</span>
      </div>

      <div className="flex-1 flex justify-center items-center">
        <div className="flex items-center">
          {steps.map((step, idx) => {
            const isActive = step.num === currentStep;
            const isCompleted = step.num < currentStep;

            return (
              <React.Fragment key={step.num}>
                {/* Step Item */}
                <div className="flex flex-col items-center relative">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-colors z-10
                      ${isActive ? 'bg-indigo-700 text-white' : 
                        isCompleted ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'}`}
                  >
                    {isCompleted ? '✓' : step.num}
                  </div>
                  <span 
                    className={`absolute top-10 text-[10px] font-bold tracking-widest uppercase whitespace-nowrap
                      ${isActive ? 'text-indigo-700' : 'text-gray-400'}`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connecting Line */}
                {idx < steps.length - 1 && (
                  <div className="w-24 h-[2px] mx-2 flex-shrink-0 bg-gray-200 relative mb-4">
                     <div 
                        className={`absolute left-0 top-0 h-full transition-all duration-300 ${isActive || isCompleted ? 'bg-indigo-700' : ''}`}
                        style={{ width: isCompleted ? '100%' : '0%' }}
                     ></div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 w-1/4">
        <button className="text-gray-400 hover:text-indigo-600 transition-colors">
          <Bell size={18} />
        </button>
        <button className="text-gray-400 hover:text-indigo-600 transition-colors">
          <Settings size={18} />
        </button>
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden border border-indigo-200">
           {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.fullName?.[0]?.toUpperCase() || 'U'
            )}
        </div>
      </div>
    </div>
  );
}
