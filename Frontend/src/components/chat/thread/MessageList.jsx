import React, { useRef, useEffect, useState, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MessageBubble } from "./MessageBubble";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import { format, isToday, isYesterday } from "date-fns";
import logoUrl from "../../../assets/logo.png";

export function MessageList({
  messages,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isSelectionMode,
  selectedIds,
  onSelect,
  onContextMenu,
  unreadCount = 0,
}) {
  const parentRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // We assume messages are passed oldest to newest (standard).
  // For react-virtual to work well, we just render them normally.
  const virtualizer = useVirtualizer({
    count: hasNextPage ? messages.length + 1 : messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Scroll to bottom on initial load if we have messages
  useEffect(() => {
    if (messages.length > 0 && parentRef.current) {
      // Small timeout to allow DOM to render
      setTimeout(() => {
        parentRef.current?.scrollTo({ top: parentRef.current.scrollHeight });
      }, 50);
    }
  }, []);

  // Infinite scroll detection
  useEffect(() => {
    const [firstItem] = virtualItems;
    if (!firstItem) return;

    if (firstItem.index === 0 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [virtualItems, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Scroll position tracking for FAB
  const handleScroll = (e) => {
    const target = e.currentTarget;
    // If scrolled up more than 200px from bottom, show FAB
    const isScrolledUp =
      target.scrollHeight - target.scrollTop - target.clientHeight > 200;
    setShowScrollBottom(isScrolledUp);
  };

  const scrollToBottom = () => {
    if (parentRef.current) {
      parentRef.current.scrollTo({
        top: parentRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // Helper to format date separators
  const getDateSeparator = (dateStr) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, "'TODAY,' MMMM d").toUpperCase();
    if (isYesterday(date)) return format(date, "'YESTERDAY,' MMMM d").toUpperCase();
    return format(date, "MMMM d, yyyy").toUpperCase();
  };

  // Compute date separators and unread line positions
  // We'll just render them inline inside the virtual item if the item is the first of that day
  const itemsWithMeta = useMemo(() => {
    const result = {};
    let lastDateStr = "";
    // Naive unread line calculation (assume unreadCount is from the bottom)
    const unreadLineIndex = messages.length - unreadCount;

    messages.forEach((msg, index) => {
      const msgDateStr = new Date(msg.timestamp).toDateString();
      if (msgDateStr !== lastDateStr) {
        if (!result[index]) result[index] = {};
        result[index].dateStr = getDateSeparator(msg.timestamp);
        lastDateStr = msgDateStr;
      }
      if (index === unreadLineIndex && unreadCount > 0) {
        if (!result[index]) result[index] = {};
        result[index].isUnreadLine = true;
      }
    });
    return result;
  }, [messages, unreadCount]);

  return (
    <div 
      className="relative flex-1 overflow-hidden bg-[#fafafa]"
      style={{ backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)", backgroundSize: "20px 20px" }}
    >
      {messages.length === 0 && !isFetchingNextPage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 z-10">
          <div className="w-24 h-24 mb-6 drop-shadow-md">
            <img src={logoUrl} alt="Nexera Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Nexera Web</h2>
          <p className="text-sm text-gray-400">No messages here yet. Say hi!</p>
        </div>
      )}

      {/* List Container */}
      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto custom-scrollbar pt-4 pb-4"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((virtualRow) => {
            const isLoaderRow = virtualRow.index === 0 && hasNextPage;
            const messageIndex = hasNextPage
              ? virtualRow.index - 1
              : virtualRow.index;
            const message = messages[messageIndex];
            const meta = itemsWithMeta[messageIndex] || {};

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="flex flex-col"
              >
                {isLoaderRow ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : message ? (
                  <>
                    {/* Date Separator */}
                    {meta.dateStr && (
                      <div className="flex justify-center my-6 w-full relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-100"></div>
                        </div>
                        <div className="relative bg-white text-gray-400 text-[10px] font-bold tracking-widest uppercase px-4 py-1 z-10">
                          {meta.dateStr}
                        </div>
                      </div>
                    )}

                    {/* Unread Line */}
                    {meta.isUnreadLine && (
                      <div className="flex items-center justify-center my-4 relative w-full">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-indigo-500/50"></div>
                        </div>
                        <div className="relative bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold px-2 py-0.5 rounded-full z-10">
                          {unreadCount} UNREAD MESSAGE
                          {unreadCount > 1 ? "S" : ""}
                        </div>
                      </div>
                    )}

                    <MessageBubble
                      message={message}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedIds.has(message.id)}
                      onSelect={onSelect}
                      onContextMenu={onContextMenu}
                      showAvatar={true} // Add logic to group sequential messages from same sender if desired
                    />
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scroll to Bottom FAB */}
      <div
        className={clsx(
          "absolute bottom-6 right-6 transition-all duration-300 z-20",
          showScrollBottom
            ? "translate-y-0 opacity-100"
            : "translate-y-12 opacity-0 pointer-events-none",
        )}
      >
        <button
          onClick={scrollToBottom}
          className="relative bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 p-3 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronDown className="w-5 h-5" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
              {unreadCount}
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
