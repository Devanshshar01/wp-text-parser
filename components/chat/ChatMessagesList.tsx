'use client';

import React, { useState, useRef, useEffect, UIEvent } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import MessageBubble from './MessageBubble';
import { formatDateHeader } from '@/lib/utils/formatters';

export default function ChatMessagesList() {
  const { chat, selfParticipant, searchResults, currentSearchIndex } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [selectedJumpDate, setSelectedJumpDate] = useState<string>('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat]);

  useEffect(() => {
    if (searchResults.length > 0 && searchResults[currentSearchIndex]) {
      const matchMsg = searchResults[currentSearchIndex];
      const elem = document.getElementById(matchMsg.id);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [searchResults, currentSearchIndex]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isFarFromBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight > 300;
    setShowJumpToBottom(isFarFromBottom);
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
    const targetDateStr = e.target.value;
    setSelectedJumpDate(targetDateStr);
    if (!chat || !targetDateStr) return;

    const targetDate = new Date(targetDateStr);
    const targetMsg = chat.messages.find(
      (m) =>
        m.timestamp.getFullYear() === targetDate.getFullYear() &&
        m.timestamp.getMonth() === targetDate.getMonth() &&
        m.timestamp.getDate() === targetDate.getDate()
    );

    if (targetMsg) {
      const elem = document.getElementById(targetMsg.id);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  if (!chat) return null;

  const messageGroups: { dateHeader: string; dateObj: Date; messages: typeof chat.messages }[] = [];
  let currentDateHeader = '';

  for (const msg of chat.messages) {
    const dateHeader = formatDateHeader(msg.timestamp);
    if (dateHeader !== currentDateHeader) {
      currentDateHeader = dateHeader;
      messageGroups.push({
        dateHeader,
        dateObj: msg.timestamp,
        messages: [msg],
      });
    } else {
      messageGroups[messageGroups.length - 1].messages.push(msg);
    }
  }

  const activeSearchMsgId = searchResults[currentSearchIndex]?.id;

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden bg-[#efeae2] dark:bg-slate-950">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border-b border-slate-200/60 dark:border-slate-800/60 px-4 py-1.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 z-10">
        <div className="flex items-center gap-1.5 font-medium">
          <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Jump to date:</span>
        </div>
        <input
          type="date"
          value={selectedJumpDate}
          onChange={handleJumpToDate}
          className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4"
      >
        {messageGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            <div className="flex justify-center my-3 sticky top-2 z-10">
              <span className="bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-lg text-[11px] font-semibold tracking-wider shadow-2xs">
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

      {showJumpToBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          title="Jump to latest message"
          className="absolute bottom-4 right-4 z-20 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 p-2.5 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center"
        >
          <ChevronDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </button>
      )}
    </div>
  );
}
