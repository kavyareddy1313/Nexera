import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize, Minimize } from 'lucide-react';
import toast from 'react-hot-toast';

export function LiveClassModal({ isOpen, onClose, roomName, user }) {
  const containerRef = useRef(null);
  const [api, setApi] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      if (api) {
        api.dispose();
        setApi(null);
      }
      return;
    }

    const loadJitsi = () => {
      const domain = 'meet.jit.si';
      const options = {
        roomName: `Nexera_LiveClass_${roomName.replace(/[^a-zA-Z0-9]/g, '_')}`,
        parentNode: containerRef.current,
        userInfo: {
          displayName: user?.fullName || user?.username || 'Student',
          email: user?.email || '',
        },
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: true,
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'shortcuts', 'tileview'
          ],
        },
      };

      const jitsiApi = new window.JitsiMeetExternalAPI(domain, options);
      
      jitsiApi.addEventListener('videoConferenceLeft', () => {
        toast.success("You left the live class.");
        onClose();
      });

      setApi(jitsiApi);
    };

    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = loadJitsi;
      document.body.appendChild(script);
    } else {
      loadJitsi();
    }

    return () => {
      if (api) {
        api.dispose();
      }
    };
  }, [isOpen, roomName, user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all p-4 ${isFullscreen ? 'p-0' : 'p-4 sm:p-10'}`}>
      <div className={`bg-[#1E1E1E] rounded-2xl overflow-hidden flex flex-col shadow-2xl relative transition-all ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[80vh]'}`}>
        
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#111111] border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 text-white">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
            <span className="font-bold text-sm tracking-wide">LIVE CLASS: {roomName}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
            <button 
              onClick={() => {
                if (api) api.executeCommand('hangup');
                else onClose();
              }}
              className="p-2 hover:bg-red-500/20 rounded-full text-gray-400 hover:text-red-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Jitsi Container */}
        <div ref={containerRef} className="flex-1 w-full h-full bg-black relative">
          {!api && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-4">
              <div className="w-10 h-10 border-4 border-gray-600 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="font-medium text-sm animate-pulse">Connecting to secure WebRTC bridge...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
