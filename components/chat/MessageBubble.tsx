'use client';

import React from 'react';
import { Message } from '@/types';
import { formatMessageTime } from '@/lib/utils/formatters';
import { FormattedText } from './FormattedText';
import MediaAttachment from '../media/MediaAttachment';

interface MessageBubbleProps {
  message: Message;
  isOutgoing: boolean;
  showSenderName: boolean;
  highlightText?: string;
  isHighlighted?: boolean;
}

export default function MessageBubble({
  message,
  isOutgoing,
  showSenderName,
  isHighlighted,
}: MessageBubbleProps) {
  if (message.isSystem) {
    return (
      <div className="flex justify-center my-2 px-4">
        <div className="bg-amber-100/90 dark:bg-slate-800/90 text-amber-900 dark:text-amber-200 border border-amber-200/60 dark:border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-center max-w-md shadow-2xs font-medium">
          <FormattedText text={message.text} />
        </div>
      </div>
    );
  }

  return (
    <div
      id={message.id}
      className={`flex flex-col my-1 px-2 ${
        isOutgoing ? 'items-end' : 'items-start'
      }`}
    >
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 shadow-2xs text-xs sm:text-sm transition-colors ${
          isHighlighted ? 'ring-2 ring-amber-400 dark:ring-amber-500' : ''
        } ${
          isOutgoing
            ? 'bg-emerald-100 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-50 rounded-tr-xs border border-emerald-200/50 dark:border-emerald-800/50'
            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-xs border border-slate-200/80 dark:border-slate-700/80'
        }`}
      >
        {!isOutgoing && showSenderName && message.sender && (
          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-0.5 truncate">
            {message.sender}
          </div>
        )}

        {message.type !== 'text' && (
          <div className="mb-1">
            <MediaAttachment message={message} />
          </div>
        )}

        {message.text && (
          <div className="leading-relaxed">
            <FormattedText text={message.text} />
          </div>
        )}

        <div
          className={`text-[10px] text-right mt-1 font-mono tracking-tight ${
            isOutgoing
              ? 'text-emerald-800/70 dark:text-emerald-300/70'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {formatMessageTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
