'use client';

import React from 'react';
import { Message } from '@/types';
import { formatMessageTime } from '@/lib/utils/formatters';
import { FormattedText } from './FormattedText';
import MediaAttachment from '../media/MediaAttachment';
import { CornerUpLeft, Image as ImageIcon, Video, Music, FileText } from 'lucide-react';

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

  const handleReplyClick = () => {
    if (message.replyTo?.targetMessageId) {
      const el = document.getElementById(message.replyTo.targetMessageId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const event = new CustomEvent('highlight-message', { detail: { id: message.replyTo.targetMessageId } });
        window.dispatchEvent(event);
      }
    }
  };

  const reply = message.replyTo;

  // Determine if message text is purely a media attachment marker (e.g. "image.jpg (file attached)")
  let displayText = message.text || '';
  if (message.type !== 'text' && message.mediaFilename) {
    const fn = message.mediaFilename.trim();
    const isPureMediaMarker =
      displayText.trim() === `${fn} (file attached)` ||
      displayText.trim() === `<attached: ${fn}>` ||
      displayText.trim() === fn ||
      displayText.trim().startsWith('<Media omitted>') ||
      displayText.trim().startsWith('<medien ausgeschlossen>');

    if (isPureMediaMarker) {
      displayText = '';
    }
  }

  return (
    <div
      id={message.id}
      className={`flex flex-col my-0.5 px-2 transition-all duration-300 ${
        isOutgoing ? 'items-end' : 'items-start'
      }`}
    >
      <div
        className={`relative max-w-[85%] sm:max-w-[65%] rounded-lg px-2.5 py-1.5 shadow-2xs text-xs sm:text-sm transition-all duration-300 ${
          isHighlighted ? 'ring-2 ring-emerald-500 bg-emerald-100 dark:bg-emerald-950/80 scale-[1.01]' : ''
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

        {/* Quoted Reply Block */}
        {reply && (
          <div
            onClick={handleReplyClick}
            className={`mb-1.5 p-2 rounded-md border-l-4 border-[#00a884] bg-black/5 dark:bg-white/5 text-xs cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex flex-col gap-0.5 ${
              reply.targetMessageId ? 'hover:underline' : ''
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-[#00a884]">
              <span className="truncate">{reply.quotedSender || 'Reply'}</span>
              <CornerUpLeft className="w-3 h-3 text-slate-400 shrink-0" />
            </div>
            {reply.quotedText && (
              <p className="text-slate-600 dark:text-slate-300 line-clamp-2 text-[11px] italic">
                {reply.quotedText}
              </p>
            )}
            {reply.quotedMediaType && reply.quotedMediaType !== 'text' && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                {reply.quotedMediaType === 'image' && <ImageIcon className="w-3 h-3" />}
                {reply.quotedMediaType === 'video' && <Video className="w-3 h-3" />}
                {reply.quotedMediaType === 'audio' && <Music className="w-3 h-3" />}
                {reply.quotedMediaType === 'document' && <FileText className="w-3 h-3" />}
                <span className="capitalize">{reply.quotedMediaType}</span>
              </div>
            )}
          </div>
        )}

        {message.type !== 'text' && (
          <div className="mb-1">
            <MediaAttachment message={message} />
          </div>
        )}

        {displayText.length > 0 && (
          <div className="leading-snug">
            <FormattedText text={displayText} />
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
        </div>
      </div>
    </div>
  );
}
