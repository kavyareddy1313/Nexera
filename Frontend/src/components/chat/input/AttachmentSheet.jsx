import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import {
  Camera,
  Image as ImageIcon,
  FileText,
  User as UserIcon,
  MapPin,
  Sticker,
  BarChart2,
  X,
} from "lucide-react";

export function AttachmentSheet({ isOpen, onClose, onMediaSelect }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      const items = acceptedFiles.map((file) => {
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");
        const type = isVideo ? "video" : isImage ? "image" : "document";
        return {
          id: Math.random().toString(36).substr(2, 9),
          file,
          previewUrl: URL.createObjectURL(file),
          type,
          caption: "",
        };
      });
      onMediaSelect(items);
    },
    [onMediaSelect],
  );

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
      "video/*": [],
      "application/pdf": [],
      "application/msword": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [],
      "text/plain": [],
    },
    noClick: true,
    noKeyboard: true,
  });

  const OPTIONS = [
    {
      id: "camera",
      icon: <Camera className="w-6 h-6 text-white" />,
      label: "Camera",
      color: "bg-red-500",
      action: () => {
        console.log("Open camera");
        onClose();
      },
    },
    {
      id: "gallery",
      icon: <ImageIcon className="w-6 h-6 text-white" />,
      label: "Gallery",
      color: "bg-purple-500",
      action: () => {
        open();
      },
    },
    {
      id: "document",
      icon: <FileText className="w-6 h-6 text-white" />,
      label: "Document",
      color: "bg-indigo-500",
      action: () => {
        open();
      },
    },
    {
      id: "contact",
      icon: <UserIcon className="w-6 h-6 text-white" />,
      label: "Contact",
      color: "bg-blue-500",
      action: () => {
        console.log("Open contact picker");
        onClose();
      },
    },
    {
      id: "location",
      icon: <MapPin className="w-6 h-6 text-white" />,
      label: "Location",
      color: "bg-green-500",
      action: () => {
        console.log("Open location picker");
        onClose();
      },
    },
    {
      id: "sticker",
      icon: <Sticker className="w-6 h-6 text-white" />,
      label: "Sticker",
      color: "bg-pink-500",
      action: () => {
        console.log("Open sticker picker");
        onClose();
      },
    },
    {
      id: "poll",
      icon: <BarChart2 className="w-6 h-6 text-white" />,
      label: "Poll",
      color: "bg-yellow-500",
      action: () => {
        console.log("Open poll creator");
        onClose();
      },
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
          >
            <div className="absolute top-3 right-3">
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Share Attachment
            </h3>

            <div
              {...getRootProps()}
              className="grid grid-cols-4 gap-y-6 gap-x-2 place-items-center"
            >
              <input {...getInputProps()} />
              {OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  className="flex flex-col items-center gap-2 cursor-pointer group"
                  onClick={opt.action}
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all ${opt.color}`}
                  >
                    {opt.icon}
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {opt.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
