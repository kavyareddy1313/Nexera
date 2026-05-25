import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Trash2,
  Send,
  Lock,
  ChevronLeft,
  Play,
  Pause,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function VoiceRecorder({ onComplete, onCancel }) {
  const [duration, setDuration] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [peaks, setPeaks] = useState(Array(30).fill(0.1));
  const [recordingState, setRecordingState] = useState("recording");
  const [isPlaying, setIsPlaying] = useState(false);

  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioChunksRef = useRef([]);
  const blobRef = useRef(null);

  // Initialize recording
  useEffect(() => {
    let stream = null;

    const startRecording = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Setup MediaRecorder
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, {
            type: "audio/webm;codecs=opus",
          });
          blobRef.current = blob;
        };

        recorder.start(100);

        // Setup Analyser
        const audioCtx = new (
          window.AudioContext || window.webkitAudioContext
        )();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updatePeaks = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          // Get a few sample points
          const newPeak = Math.max(...Array.from(dataArray.slice(0, 10))) / 255;
          setPeaks((prev) => {
            const next = [...prev.slice(1), Math.max(0.05, newPeak)];
            return next;
          });
          animationFrameRef.current = requestAnimationFrame(updatePeaks);
        };
        updatePeaks();

        // Start timer
        timerRef.current = setInterval(() => {
          setDuration((d) => d + 1);
        }, 1000);
      } catch (err) {
        console.error("Microphone access denied or error:", err);
        onCancel();
      }
    };

    startRecording();

    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [onCancel]);

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (animationFrameRef.current)
      cancelAnimationFrame(animationFrameRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingState("preview");
  };

  const handleSend = () => {
    // If still recording, stop it first
    if (recordingState === "recording") {
      stopRecording();
      // Delay send slightly to allow blob to be created in onstop
      setTimeout(() => {
        onComplete(blobRef.current, duration, peaks);
      }, 50);
    } else {
      onComplete(blobRef.current, duration, peaks);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center w-full h-14 px-3 bg-white dark:bg-[#0b141a] z-30 select-none relative overflow-hidden">
      {recordingState === "recording" ? (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center w-full justify-between"
          >
            {/* Left: Timer and Cancel Swipe */}
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-gray-900 dark:text-white font-mono">
                  {formatTime(duration)}
                </span>
              </div>

              {!isLocked && (
                <div
                  className="flex items-center text-gray-400 gap-1 opacity-70 cursor-pointer"
                  onClick={handleCancel}
                >
                  <ChevronLeft className="w-4 h-4 animate-bounce-x" />
                  <span className="text-sm">Slide to cancel</span>
                </div>
              )}
            </div>

            {/* Center: Waveform */}
            <div className="flex items-end gap-[2px] h-8 w-24 sm:w-32 mx-4 opacity-50">
              {peaks.map((peak, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-indigo-500 transition-all duration-75"
                  style={{ height: `${peak * 100}%` }}
                />
              ))}
            </div>

            {/* Right: Lock or Send */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isLocked ? (
                <div className="flex flex-col items-center justify-center h-full mr-2">
                  <Lock className="w-4 h-4 text-gray-400 mb-1" />
                  <button
                    onClick={() => setIsLocked(true)}
                    className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={handleCancel} className="p-2 text-red-500">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={stopRecording}
                    className="p-2 text-indigo-500 font-medium text-sm mr-2"
                  >
                    STOP
                  </button>
                  <button
                    onClick={handleSend}
                    className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white"
                  >
                    <Send className="w-5 h-5 ml-1" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        /* Preview State */
        <div className="flex items-center w-full justify-between">
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-red-500"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <div className="flex items-center flex-1 mx-4 gap-3 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-1.5">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-indigo-600 dark:text-indigo-400"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
            <div className="flex items-end gap-[2px] h-6 flex-1 opacity-50 overflow-hidden">
              {peaks.map((peak, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-indigo-500"
                  style={{ height: `${peak * 100}%` }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 font-mono">
              {formatTime(duration)}
            </span>
          </div>

          <button
            onClick={handleSend}
            className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shrink-0"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </div>
      )}

      <style>{`
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-25%); }
        }
        .animate-bounce-x {
          animation: bounce-x 1s infinite;
        }
      `}</style>
    </div>
  );
}
