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
      <div className="fixed bottom-6 right-6 z-[99990]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white rounded-full shadow-2xl shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer select-none"
          aria-label="Toggle Nexera AI Assistant"
        >
          {/* Animated pulse ring */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 opacity-40 group-hover:opacity-80 blur-sm transition duration-300 animate-pulse" />

          <div className="relative flex items-center gap-2 font-medium text-xs tracking-wide">
            {isOpen ? (
              <>
                <X className="w-4 h-4" />
                <span>Close AI</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
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
