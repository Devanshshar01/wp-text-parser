'use client';

import React, { useState, useRef, useEffect, UIEvent } from 'react';
import { Calendar, ChevronDown, RefreshCw } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import MessageBubble from './MessageBubble';
import { formatDateHeader } from '@/lib/utils/formatters';

const CHUNK_SIZE = 100;

export default function ChatMessagesList() {
  const { chat, selfParticipant, searchResults, currentSearchIndex, wallpaper } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number>(CHUNK_SIZE);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [selectedJumpDate, setSelectedJumpDate] = useState<string>('');

  // Initial scroll to bottom on chat load
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat]);

  // Jump to search match (expand visible messages if match is beyond limit)
  useEffect(() => {
    if (searchResults.length > 0 && searchResults[currentSearchIndex] && chat) {
      const matchMsg = searchResults[currentSearchIndex];
      const matchIdx = chat.messages.findIndex((m) => m.id === matchMsg.id);
      if (matchIdx !== -1) {
        const neededFromEnd = chat.messages.length - matchIdx;
        setTimeout(() => {
          setVisibleCount((prev) => (neededFromEnd > prev ? neededFromEnd + 20 : prev));
          const elem = document.getElementById(matchMsg.id);
          if (elem) {
            elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 50);
      }
    }
  }, [searchResults, currentSearchIndex, chat]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isFarFromBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight > 300;
    setShowJumpToBottom(isFarFromBottom);

    // Auto-load older messages when user scrolls near top
    if (target.scrollTop < 150 && chat && visibleCount < chat.messages.length) {
      const oldScrollHeight = target.scrollHeight;
      setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, chat.messages.length));
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight - oldScrollHeight;
        }
      }, 0);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const handleJumpToDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetDateStr = e.target.value; // "YYYY-MM-DD"
    setSelectedJumpDate(targetDateStr);
    if (!chat || !targetDateStr) return;

    const parts = targetDateStr.split('-').map((p) => parseInt(p, 10));
    if (parts.length !== 3) return;

    const targetYear = parts[0];
    const targetMonth = parts[1] - 1; // 0-indexed month
    const targetDay = parts[2];

    const targetTime = new Date(targetYear, targetMonth, targetDay).getTime();

    // Find exact or closest message on or after the target date
    let targetIdx = chat.messages.findIndex((m) => {
      const d = m.timestamp;
      return (
        d.getFullYear() === targetYear &&
        d.getMonth() === targetMonth &&
        d.getDate() === targetDay
      );
    });

    if (targetIdx === -1) {
      targetIdx = chat.messages.findIndex((m) => m.timestamp.getTime() >= targetTime);
    }

    if (targetIdx !== -1) {
      const neededFromEnd = chat.messages.length - targetIdx;
      setVisibleCount((prev) => Math.max(prev, neededFromEnd + 20));

      const targetMsg = chat.messages[targetIdx];
      requestAnimationFrame(() => {
        setTimeout(() => {
          const elem = document.getElementById(targetMsg.id);
          if (elem) {
            elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      });
    }
  };

  const loadMoreOlderMessages = () => {
    if (chat && visibleCount < chat.messages.length) {
      setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, chat.messages.length));
    }
  };

  if (!chat) return null;

  // Windowed slicing from the end of messages array to optimize mobile rendering
  const totalMessagesCount = chat.messages.length;
  const startIndex = Math.max(0, totalMessagesCount - visibleCount);
  const visibleMessages = chat.messages.slice(startIndex);
  const hasMoreOlder = startIndex > 0;

  // Group visible messages by date
  const messageGroups: { dateHeader: string; messages: typeof chat.messages }[] = [];
  let currentDateHeader = '';

  for (const msg of visibleMessages) {
    const dateHeader = formatDateHeader(msg.timestamp);
    if (dateHeader !== currentDateHeader) {
      currentDateHeader = dateHeader;
      messageGroups.push({
        dateHeader,
        messages: [msg],
      });
    } else {
      messageGroups[messageGroups.length - 1].messages.push(msg);
    }
  }

  const activeSearchMsgId = searchResults[currentSearchIndex]?.id;

  // Custom wallpaper style evaluation
  const containerStyle: React.CSSProperties = {};
  if (wallpaper.startsWith('http') || wallpaper.startsWith('data:') || wallpaper.startsWith('blob:')) {
    containerStyle.backgroundImage = `url("${wallpaper}")`;
    containerStyle.backgroundSize = 'cover';
    containerStyle.backgroundPosition = 'center';
  } else if (wallpaper.startsWith('#') || wallpaper.startsWith('rgb')) {
    containerStyle.backgroundColor = wallpaper;
  }

  return (
    <div
      style={containerStyle}
      className={`relative flex-1 flex flex-col h-full overflow-hidden transition-colors ${
        wallpaper === 'doodle' ? 'bg-[#efeae2] dark:bg-[#0b141a]' : ''
      }`}
    >
      {/* Date Jump Navigation bar */}
      <div className="bg-white/95 dark:bg-[#111b21] border-b border-slate-200 dark:border-slate-800 px-4 py-1.5 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200 z-10 shadow-xs">
        <div className="flex items-center gap-1.5 font-medium">
          <Calendar className="w-3.5 h-3.5 text-[#00a884]" />
          <span>Jump to date:</span>
        </div>
        <input
          type="date"
          value={selectedJumpDate}
          onChange={handleJumpToDate}
          className="bg-slate-100 dark:bg-[#202c33] border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#00a884]"
        />
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3"
      >
        {/* Load older messages button if chat is large */}
        {hasMoreOlder && (
          <div className="flex justify-center my-2">
            <button
              type="button"
              onClick={loadMoreOlderMessages}
              className="inline-flex items-center gap-1.5 bg-white/90 dark:bg-[#202c33] text-[#00a884] dark:text-[#00a884] hover:bg-slate-100 dark:hover:bg-[#2a3942] border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Load older messages ({startIndex} remaining)
            </button>
          </div>
        )}

        {messageGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            <div className="flex justify-center my-2 sticky top-2 z-10">
              <span className="bg-white/90 dark:bg-[#182229] border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-lg text-[11px] font-semibold tracking-wider shadow-2xs">
                {group.dateHeader}
              </span>
            </div>

            {group.messages.map((message) => {
              const isOutgoing = selfParticipant
                ? message.sender === selfParticipant
                : message.sender === chat.participants[0];

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOutgoing={isOutgoing}
                  showSenderName={chat.isGroup}
                  isHighlighted={message.id === activeSearchMsgId}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Jump to Latest Floating Button */}
      {showJumpToBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          title="Jump to latest message"
          className="absolute bottom-4 right-4 z-20 bg-white dark:bg-[#202c33] text-slate-700 dark:text-slate-100 p-2.5 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#2a3942] transition-all flex items-center justify-center"
        >
          <ChevronDown className="w-5 h-5 text-[#00a884]" />
        </button>
      )}
    </div>
  );
}
