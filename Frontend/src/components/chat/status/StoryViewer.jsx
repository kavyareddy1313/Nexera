import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, MoreVertical, Send } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

export function StoryViewer({ stories, initialStoryIndex, onClose }) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const currentStory = stories[currentStoryIndex];
  const currentSlide = currentStory.slides[currentSlideIndex];
  const progressRef = useRef(0);
  const animationRef = useRef();
  const lastTimeRef = useRef();

  useEffect(() => {
    progressRef.current = 0;
    setProgress(0);
    lastTimeRef.current = undefined;

    const animate = (time) => {
      if (isPaused) {
        lastTimeRef.current = time;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      if (lastTimeRef.current !== undefined) {
        const delta = time - lastTimeRef.current;
        progressRef.current += (delta / currentSlide.duration) * 100;
        if (progressRef.current >= 100) {
          handleNext();
          return;
        } else {
          setProgress(progressRef.current);
        }
      }
      lastTimeRef.current = time;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [currentStoryIndex, currentSlideIndex, isPaused, currentSlide.duration]);

  const handleNext = () => {
    if (currentSlideIndex < currentStory.slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    } else if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
      setCurrentSlideIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    } else if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
      setCurrentSlideIndex(stories[currentStoryIndex - 1].slides.length - 1);
    }
  };

  const handleTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
      >
        <div className="w-full h-full max-w-md relative flex flex-col bg-black overflow-hidden shadow-2xl">
          {/* Progress Bars */}
          <div className="absolute top-0 inset-x-0 pt-3 px-2 flex gap-1 z-20">
            {currentStory.slides.map((slide, idx) => (
              <div
                key={slide.id}
                className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-none"
                  style={{
                    width: `${idx < currentSlideIndex ? 100 : idx === currentSlideIndex ? progress : 0}%`,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-6 inset-x-0 px-4 flex items-center justify-between z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-1 text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="w-10 h-10 rounded-full bg-gray-500 overflow-hidden flex items-center justify-center">
                {currentStory.userAvatar ? (
                  <img
                    src={currentStory.userAvatar}
                    alt={currentStory.userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold">
                    {currentStory.userName.charAt(0)}
                  </span>
                )}
              </div>
              <div className="text-white drop-shadow-md">
                <h3 className="font-semibold">{currentStory.userName}</h3>
                <p className="text-xs text-white/80">
                  {formatDistanceToNowStrict(new Date(currentStory.timestamp))}{" "}
                  ago
                </p>
              </div>
            </div>
            <button className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>

          {/* Slide Content */}
          <motion.div
            key={`${currentStoryIndex}-${currentSlideIndex}`}
            initial={{ opacity: 0.8, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="flex-1 relative w-full h-full flex items-center justify-center"
            onClick={handleTap}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = offset.x;
              if (swipe < -50)
                handleNext(); // swipe left -> next user
              else if (swipe > 50) handlePrev(); // swipe right -> prev user
            }}
          >
            {currentSlide.type === "image" && currentSlide.url && (
              <img
                src={currentSlide.url}
                alt="Status"
                className="w-full h-full object-contain"
              />
            )}
            {currentSlide.type === "text" && (
              <div
                className="w-full h-full flex items-center justify-center p-8 text-center"
                style={{ backgroundColor: currentSlide.backgroundColor }}
              >
                <p className="text-white text-3xl font-bold break-words">
                  {currentSlide.text}
                </p>
              </div>
            )}
            {/* Visual gradient at top/bottom for text readability */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          </motion.div>

          {/* Reply Bar */}
          <div className="absolute bottom-0 inset-x-0 p-4 z-20">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Reply..."
                className="flex-1 bg-white/20 text-white placeholder-white/70 border border-white/30 rounded-full px-5 py-3 focus:outline-none focus:bg-white/30 backdrop-blur-md transition-all"
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
              />

              <button className="p-3 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors">
                <Send size={20} className="ml-1" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
