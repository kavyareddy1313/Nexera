import React, { useState } from "react";
import { Plus } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

const MOCK_STORIES = [
  {
    id: "s1",
    userId: "u1",
    userName: "Priya Sharma",
    userAvatar: "https://i.pravatar.cc/150?u=priya",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    isViewed: false,
    slides: [
      {
        id: "sl1",
        type: "image",
        url: "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=800&auto=format&fit=crop",
        duration: 5000,
        isViewed: false,
      },
      {
        id: "sl2",
        type: "text",
        text: "Beautiful day!",
        backgroundColor: "#10b981",
        duration: 5000,
        isViewed: false,
      },
    ],
  },
  {
    id: "s2",
    userId: "u2",
    userName: "Arjun Gupta",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    isViewed: true,
    slides: [
      {
        id: "sl3",
        type: "text",
        text: "Back to work 💼",
        backgroundColor: "#6366f1",
        duration: 5000,
        isViewed: true,
      },
    ],
  },
];

export function StatusTab({ onOpenStory }) {
  const [stories, setStories] = useState(MOCK_STORIES);

  const viewedStories = stories.filter((s) => s.isViewed);
  const recentStories = stories.filter((s) => !s.isViewed);

  const handleStatusClick = (story) => {
    const index = stories.findIndex((s) => s.id === story.id);
    onOpenStory(stories, index);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-[#111b21] h-full custom-scrollbar">
      {/* My Status */}
      <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#202c33] cursor-pointer transition-colors flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
            <span className="text-gray-500 font-bold">ME</span>
          </div>
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-indigo-500 border-2 border-white dark:border-[#111b21] rounded-full flex items-center justify-center text-white">
            <Plus size={12} strokeWidth={3} />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            My status
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tap to add status update
          </p>
        </div>
      </div>

      <div className="px-4 py-2 bg-gray-50 dark:bg-[#111b21] text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
        Recent updates
      </div>

      {recentStories.map((story) => (
        <div
          key={story.id}
          onClick={() => handleStatusClick(story)}
          className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#202c33] cursor-pointer transition-colors flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-green-400 to-indigo-500">
            <div className="w-full h-full rounded-full border-2 border-white dark:border-[#111b21] overflow-hidden bg-gray-200 flex items-center justify-center">
              {story.userAvatar ? (
                <img
                  src={story.userAvatar}
                  alt={story.userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500 font-bold">
                  {story.userName.charAt(0)}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {story.userName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDistanceToNowStrict(new Date(story.timestamp))} ago
            </p>
          </div>
        </div>
      ))}

      {viewedStories.length > 0 && (
        <>
          <div className="px-4 py-2 bg-gray-50 dark:bg-[#111b21] text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mt-2">
            Viewed updates
          </div>
          {viewedStories.map((story) => (
            <div
              key={story.id}
              onClick={() => handleStatusClick(story)}
              className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#202c33] cursor-pointer transition-colors flex items-center gap-4 opacity-75"
            >
              <div className="w-14 h-14 rounded-full p-[2px] bg-gray-300 dark:bg-gray-600">
                <div className="w-full h-full rounded-full border-2 border-white dark:border-[#111b21] overflow-hidden bg-gray-200 flex items-center justify-center">
                  {story.userAvatar ? (
                    <img
                      src={story.userAvatar}
                      alt={story.userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 font-bold">
                      {story.userName.charAt(0)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {story.userName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDistanceToNowStrict(new Date(story.timestamp))} ago
                </p>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
