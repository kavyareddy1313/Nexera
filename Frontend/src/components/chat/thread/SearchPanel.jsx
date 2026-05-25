import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronUp, ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SearchPanel({
  isOpen,
  onClose,
  onSearch,
  matchCount,
  currentMatch,
  onNext,
  onPrev,
}) {
  const [term, setTerm] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setTerm(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 absolute top-0 left-0 right-0 z-30 shadow-md"
        >
          <div className="flex items-center gap-2 px-4 py-2">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={term}
              onChange={handleChange}
              placeholder="Search in chat..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-500"
            />

            {term && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mr-2">
                <span>{matchCount > 0 ? currentMatch : 0}</span>
                <span>of</span>
                <span>{matchCount}</span>
              </div>
            )}
            <div className="flex items-center gap-1 border-l border-gray-300 dark:border-gray-700 pl-2">
              <button
                onClick={onPrev}
                disabled={matchCount === 0}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={onNext}
                disabled={matchCount === 0}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 ml-1 text-gray-500 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
