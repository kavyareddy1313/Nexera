import React, { useRef, useEffect, useState, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MessageBubble } from "./MessageBubble";
import { ChevronDown, MessageSquarePlus } from "lucide-react";
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
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  // Compute date separators and unread line positions
  const itemsWithMeta = useMemo(() => {
    const result = {};
    let lastDateStr = "";
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
    <div className="relative flex-1 overflow-hidden bg-[#F8FAFC]">
      {messages.length === 0 && !isFetchingNextPage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 z-10">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-indigo-600 mb-3">
            <MessageSquarePlus size={28} strokeWidth={2} />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Start a conversation</h3>
          <p className="text-xs text-slate-400 text-center max-w-xs">
            Send a message, share code or files to begin collaborating.
          </p>
        </div>
      )}

      {/* List Container */}
      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto custom-scrollbar px-4 sm:px-8 pt-4 pb-4"
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
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : message ? (
                  <>
                    {/* Date Separator */}
                    {meta.dateStr && (
                      <div className="flex justify-center my-4 w-full relative">
                        <div className="bg-slate-200/80 text-slate-600 text-[11px] font-semibold px-3 py-1 rounded-full shadow-2xs">
                          {meta.dateStr}
                        </div>
                      </div>
                    )}

                    {/* Unread Line */}
                    {meta.isUnreadLine && (
                      <div className="flex items-center justify-center my-4 relative w-full">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-indigo-200"></div>
                        </div>
                        <div className="relative bg-indigo-50 text-indigo-600 text-[11px] font-bold px-3 py-0.5 rounded-full border border-indigo-200 shadow-2xs z-10">
                          {unreadCount} UNREAD MESSAGE{unreadCount > 1 ? "S" : ""}
                        </div>
                      </div>
                    )}

                    <MessageBubble
                      message={message}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedIds.has(message.id)}
                      onSelect={onSelect}
                      onContextMenu={onContextMenu}
                      showAvatar={true}
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
          "absolute bottom-6 right-6 transition-all duration-200 z-20",
          showScrollBottom
            ? "translate-y-0 opacity-100"
            : "translate-y-10 opacity-0 pointer-events-none",
        )}
      >
        <button
          onClick={scrollToBottom}
          className="relative bg-white text-slate-600 p-2.5 rounded-full shadow-md border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-[#5840D8] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
              {unreadCount}
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
