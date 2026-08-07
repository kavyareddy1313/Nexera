import React, { useState } from "react";
import Linkify from "linkify-react";
import { Play, Pause, File, Download, MapPin, UserPlus } from "lucide-react";
import clsx from "clsx";

// Simple mocked waveform component
function WaveformVisualizer({ peaks, progress }) {
  return (
    <div className="flex items-end gap-[2px] h-8 w-32 shrink-0">
      {peaks.map((peak, i) => {
        const isPlayed = i / peaks.length <= progress;
        return (
          <div
            key={i}
            className={clsx(
              "w-1 rounded-full transition-colors",
              isPlayed
                ? "bg-indigo-500"
                : "bg-indigo-200 dark:bg-indigo-800/50",
            )}
            style={{ height: `${Math.max(10, peak * 100)}%` }}
          />
        );
      })}
    </div>
  );
}

export function MessageContent({ message }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  switch (message.type) {
    case "TEXT":
      return (
        <div className="text-[15px] whitespace-pre-wrap break-words leading-relaxed">
          <Linkify
            options={{
              className: "text-blue-500 hover:underline",
              target: "_blank",
            }}
          >
            {message.content}
          </Linkify>
        </div>
      );

    case "REPLY":
      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-stretch bg-black/5 dark:bg-white/5 rounded pl-1 overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-400"></div>
            <div className="p-2 flex-1 min-w-0">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                {message.replyTo.senderName}
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                {message.replyTo.content}
              </p>
            </div>
            {message.replyTo.thumbnail && (
              <img
                src={message.replyTo.thumbnail}
                alt="thumb"
                className="w-10 h-10 object-cover"
              />
            )}
          </div>
          <div className="text-[15px] whitespace-pre-wrap break-words leading-relaxed">
            <Linkify
              options={{
                className: "text-blue-500 hover:underline",
                target: "_blank",
              }}
            >
              {message.content}
            </Linkify>
          </div>
        </div>
      );

    case "IMAGE":
    case "VIDEO":
      return (
        <div className="flex flex-col gap-1 -mx-2 -mt-1 group/media cursor-pointer">
          <div className="relative rounded-lg overflow-hidden w-64 h-64 bg-gray-100 dark:bg-gray-800">
            {/* Lazy, LQIP blur-up is simulated by CSS filter if we had a small base64, 
                 here we just use the thumbnail directly */}
            <img
              src={message.thumbnailUrl}
              alt="media"
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover/media:scale-105"
            />

            {message.type === "VIDEO" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-white fill-current ml-1" />
                </div>
                {message.duration && (
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                    {Math.floor(message.duration / 60)}:
                    {(message.duration % 60).toString().padStart(2, "0")}
                  </div>
                )}
              </div>
            )}
            <div className="absolute top-2 right-2 opacity-0 group-hover/media:opacity-100 transition-opacity">
              <button className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          {message.caption && (
            <p className="text-sm px-2 mt-1">{message.caption}</p>
          )}
        </div>
      );

    case "VOICE": {
      const togglePlay = () => setIsPlaying(!isPlaying);
      const toggleSpeed = () =>
        setPlaybackSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1));
      return (
        <div className="flex items-center gap-3 w-64">
          {isPlaying && (
            <div className="relative flex-shrink-0">
              <img
                src={message.sender?.avatar || "https://i.pravatar.cc/100"}
                alt="avatar"
                className="w-10 h-10 rounded-full object-cover animate-pulse"
              />
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
            </div>
          )}
          <button
            onClick={togglePlay}
            className="w-10 h-10 flex-shrink-0 bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-200 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <div className="flex flex-col flex-1">
            <WaveformVisualizer
              peaks={message.peaks}
              progress={isPlaying ? 0.4 : 0}
            />
            <div className="flex items-center justify-between mt-1 text-[10px] text-gray-500 font-medium">
              <span>
                {isPlaying ? "0:04" : "0:00"} / 0:
                {message.duration.toString().padStart(2, "0")}
              </span>
            </div>
          </div>

          <button
            onClick={toggleSpeed}
            className="text-[10px] font-bold bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded self-start mt-1"
          >
            {playbackSpeed}x
          </button>
        </div>
      );
    }

    case "DOCUMENT":
      return (
        <div className="flex items-center gap-3 w-64 bg-black/5 dark:bg-white/5 p-2 rounded-lg cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors group/doc">
          <div className="w-10 h-10 flex-shrink-0 bg-red-100 text-red-500 rounded-lg flex items-center justify-center">
            <File className="w-6 h-6" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium truncate">
              {message.fileName}
            </span>
            <span className="text-xs text-gray-500 uppercase">
              {message.mimeType.split("/")[1] || "FILE"} •{" "}
              {(message.fileSize / 1024).toFixed(1)} KB
            </span>
          </div>
          <button className="text-gray-400 group-hover/doc:text-indigo-500 transition-colors p-1">
            <Download className="w-5 h-5" />
          </button>
        </div>
      );

    case "STICKER":
      return (
        <div className="w-40 h-40">
          <img
            src={message.stickerUrl}
            alt="sticker"
            className="w-full h-full object-contain drop-shadow-md"
          />
        </div>
      );

    case "LOCATION":
      return (
        <div className="flex flex-col w-64 rounded-lg overflow-hidden">
          <img
            src={message.mapThumbnailUrl}
            alt="map"
            className="w-full h-32 object-cover"
          />
          <a
            href={`https://maps.google.com/?q=${message.latitude},${message.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-2 hover:bg-black/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Location</span>
              <span className="text-xs text-blue-500 hover:underline">
                View in Maps
              </span>
            </div>
          </a>
        </div>
      );

    case "CONTACT":
      return (
        <div className="flex flex-col w-64 bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden">
          <div className="flex items-center gap-3 p-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
              {message.contactAvatar ? (
                <img
                  src={message.contactAvatar}
                  alt="contact"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-medium text-gray-500">
                  {message.contactName.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">
                {message.contactName}
              </span>
              <span className="text-xs text-gray-500">
                {message.contactPhone}
              </span>
            </div>
          </div>
          <div className="flex border-t border-gray-200 dark:border-gray-700 divide-x divide-gray-200 dark:divide-gray-700">
            <button className="flex-1 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-black/5 transition-colors">
              Message
            </button>
            <button className="flex-1 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-black/5 flex items-center justify-center gap-1 transition-colors">
              <UserPlus className="w-3 h-3" /> Add
            </button>
          </div>
        </div>
      );

    case "DELETED":
      return <div className="text-sm">This message was deleted</div>;

    default:
      return <div className="text-sm">Unsupported message type</div>;
  }
}
