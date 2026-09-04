'use client';

import React from 'react';
import { Message } from '@/types';
import { FileText, Music, Play, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useChat } from '@/context/ChatContext';

export default function MediaAttachment({ message }: { message: Message }) {
  const { setActiveLightboxMedia } = useChat();

  const filename = message.mediaFilename || 'Media attachment';

  if (message.type === 'image' || message.type === 'sticker') {
    if (message.mediaUrl) {
      return (
        <div className="relative rounded-lg overflow-hidden max-w-sm my-1 group">
          <img
            src={message.mediaUrl}
            alt={filename}
            onClick={() =>
              setActiveLightboxMedia({
                url: message.mediaUrl!,
                filename,
                type: 'image',
              })
            }
            className="w-full max-h-72 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
          />
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs my-1">
        <ImageIcon className="w-4 h-4 shrink-0 text-slate-400" />
        <span className="truncate italic">Image not included in export</span>
      </div>
    );
  }

  if (message.type === 'video') {
    if (message.mediaUrl) {
      return (
        <div className="relative rounded-lg overflow-hidden max-w-sm my-1">
          <video
            src={message.mediaUrl}
            controls
            preload="metadata"
            className="w-full max-h-72 rounded-lg bg-black"
          />
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs my-1">
        <Play className="w-4 h-4 shrink-0 text-slate-400" />
        <span className="truncate italic">Video not included in export</span>
      </div>
    );
  }

  if (message.type === 'audio') {
    if (message.mediaUrl) {
      return (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 my-1 max-w-xs">
          <div className="p-2 rounded-full bg-emerald-600 text-white shrink-0">
            <Music className="w-4 h-4" />
          </div>
          <audio src={message.mediaUrl} controls className="w-full h-8" />
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs my-1">
        <Music className="w-4 h-4 shrink-0 text-slate-400" />
        <span className="truncate italic">Audio unavailable in export</span>
      </div>
    );
  }

  if (message.type === 'document') {
    return (
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 my-1 max-w-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              {filename}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Document</p>
          </div>
        </div>
        {message.mediaUrl && (
          <a
            href={message.mediaUrl}
            download={filename}
            className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline ml-2 shrink-0"
          >
            Save
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs my-1 border border-slate-200 dark:border-slate-700">
      <AlertCircle className="w-4 h-4 shrink-0 text-slate-400" />
      <span className="truncate font-medium">{filename}</span>
    </div>
  );
}
