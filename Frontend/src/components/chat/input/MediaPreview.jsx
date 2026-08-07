import React, { useState } from "react";
import { X, Crop, RotateCw, Plus, Send, File } from "lucide-react";
import { motion } from "framer-motion";

export function MediaPreview({ items: initialItems, onSend, onCancel }) {
  const [items, setItems] = useState(initialItems);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeItem = items[activeIndex];

  const updateCaption = (text) => {
    const newItems = [...items];
    newItems[activeIndex].caption = text;
    setItems(newItems);
  };

  const removeItem = (index) => {
    const newItems = [...items];
    URL.revokeObjectURL(newItems[index].previewUrl); // Cleanup
    newItems.splice(index, 1);
    if (newItems.length === 0) {
      onCancel();
    } else {
      setItems(newItems);
      setActiveIndex(Math.min(activeIndex, newItems.length - 1));
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="absolute inset-0 z-40 bg-black flex flex-col w-full h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent absolute top-0 w-full z-10 text-white">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Crop className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <RotateCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black/90">
        <motion.div
          key={activeItem.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="w-full h-full flex items-center justify-center p-4"
        >
          {activeItem.type === "video" ? (
            <video
              src={activeItem.previewUrl}
              controls
              className="max-w-full max-h-full object-contain"
            />
          ) : activeItem.type === "document" ? (
            <div className="flex flex-col items-center justify-center text-white bg-gray-800 p-8 rounded-2xl shadow-xl w-64 border border-gray-700">
              <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mb-4">
                <File className="w-8 h-8 text-white" />
              </div>
              <span className="font-medium text-center truncate w-full">
                {activeItem.file.name}
              </span>
              <span className="text-xs text-gray-400 mt-1 uppercase">
                {(activeItem.file.size / 1024).toFixed(1)} KB
              </span>
            </div>
          ) : (
            <img
              src={activeItem.previewUrl}
              alt="preview"
              className="max-w-full max-h-full object-contain drop-shadow-2xl"
            />
          )}
        </motion.div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-gray-900 pb-safe">
        {/* Caption Input */}
        <div className="p-4 flex items-center gap-4">
          <input
            type="text"
            placeholder="Add a caption..."
            value={activeItem.caption}
            onChange={(e) => updateCaption(e.target.value)}
            className="flex-1 bg-gray-800 text-white border-none rounded-full px-5 py-3 focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
          />

          <button
            onClick={() => onSend(items)}
            className="w-12 h-12 flex-shrink-0 bg-indigo-500 text-white rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/30 relative group"
          >
            <Send className="w-5 h-5 ml-1" />
            {items.length > 1 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-gray-900 group-hover:scale-110 transition-transform">
                {items.length}
              </span>
            )}
          </button>
        </div>

        {/* Carousel / Add more */}
        <div className="flex items-center gap-2 p-4 pt-0 overflow-x-auto custom-scrollbar">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={`w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer relative border-2 transition-all ${idx === activeIndex ? "border-indigo-500 scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}
              onClick={() => setActiveIndex(idx)}
            >
              {item.type === "video" ? (
                <video
                  src={item.previewUrl}
                  className="w-full h-full object-cover"
                />
              ) : item.type === "document" ? (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-red-400">
                  <File size={24} />
                </div>
              ) : (
                <img
                  src={item.previewUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ))}
          <button className="w-14 h-14 flex-shrink-0 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-400 hover:bg-gray-800 transition-colors ml-2">
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
