'use client';

import React from 'react';
import { Message } from '@/types';
import { formatMessageTime } from '@/lib/utils/formatters';
import { FormattedText } from './FormattedText';
import MediaAttachment from '../media/MediaAttachment';
import { CheckCheck } from 'lucide-react';

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
        <div className="bg-[#ffeebd] dark:bg-[#182229] text-[#54656f] dark:text-[#8696a0] rounded-lg px-3 py-1 text-[11px] text-center max-w-md shadow-2xs font-medium border border-black/5 dark:border-white/5">
          <FormattedText text={message.text} />
        </div>
      </div>
    );
  }

  return (
    <div
      id={message.id}
      className={`flex flex-col my-0.5 px-2 ${
        isOutgoing ? 'items-end' : 'items-start'
      }`}
    >
      <div
        className={`relative max-w-[85%] sm:max-w-[65%] rounded-lg px-2.5 py-1.5 shadow-2xs text-xs sm:text-sm transition-all ${
          isHighlighted ? 'ring-2 ring-amber-400' : ''
        } ${
          isOutgoing
            ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-none'
            : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-none'
        }`}
      >
        {!isOutgoing && showSenderName && message.sender && (
          <div className="text-[11px] font-bold text-[#128c7e] dark:text-[#00a884] mb-0.5 truncate">
            {message.sender}
          </div>
        )}

        {message.type !== 'text' && (
          <div className="mb-1">
            <MediaAttachment message={message} />
          </div>
        )}

        {message.text && (
          <div className="leading-snug">
            <FormattedText text={message.text} />
          </div>
        )}

        <div
          className={`flex items-center justify-end gap-1 text-[10px] mt-0.5 font-sans ${
            isOutgoing
              ? 'text-[#667781] dark:text-[#8696a0]'
              : 'text-[#667781] dark:text-[#8696a0]'
          }`}
        >
          <span>{formatMessageTime(message.timestamp)}</span>
          {isOutgoing && (
            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] dark:text-[#53bdeb] inline-block -mr-0.5" />
          )}
        </div>
      </div>
    </div>
  );
}
