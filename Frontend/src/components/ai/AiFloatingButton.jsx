import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import NexeraAiPanel from './NexeraAiPanel';
import { useAuth } from '../../context/AuthContext';

export default function AiFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  // Only render floating button when user is authenticated
  if (!user) return null;

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-5 right-5 z-[99990]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          className="group relative flex items-center gap-2 px-3.5 py-2 bg-slate-900/95 hover:bg-slate-800 text-white rounded-full shadow-lg shadow-slate-900/20 border border-slate-700/60 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer select-none backdrop-blur-md"
          aria-label="Toggle Nexera AI Assistant"
        >
          <div className="relative flex items-center gap-2 font-semibold text-xs tracking-wide">
            {isOpen ? (
              <>
                <X className="w-3.5 h-3.5 text-slate-300" />
                <span>Close AI</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Nexera AI</span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Slide-over Drawer / Panel */}
      <NexeraAiPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
