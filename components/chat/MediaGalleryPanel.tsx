'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, Video, FileText, Download } from 'lucide-react';
import { useChat } from '@/context/ChatContext';

export default function MediaGalleryPanel() {
  const { chat, setActiveLightboxMedia } = useChat();
  const [activeTab, setActiveTab] = useState<'all' | 'image' | 'video' | 'document'>('all');

  if (!chat) return null;

  const mediaMessages = chat.messages.filter(
    (m) =>
      m.type === 'image' ||
      m.type === 'video' ||
      m.type === 'document' ||
      m.type === 'sticker'
  );

  const filteredMedia = mediaMessages.filter((m) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'image') return m.type === 'image' || m.type === 'sticker';
    if (activeTab === 'video') return m.type === 'video';
    if (activeTab === 'document') return m.type === 'document';
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 max-w-4xl mx-auto w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Media Gallery
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mediaMessages.length} total media items found in export
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'image'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Images
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'video'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Videos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('document')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'document'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Docs
          </button>
        </div>
      </div>

      {filteredMedia.length === 0 ? (
        <div className="text-center py-12 text-xs text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
          No media found for this category in the uploaded export.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredMedia.map((m) => {
            const filename = m.mediaFilename || 'Media';

            if (m.type === 'image' || m.type === 'sticker') {
              return (
                <div
                  key={m.id}
                  onClick={() =>
                    m.mediaUrl &&
                    setActiveLightboxMedia({
                      url: m.mediaUrl,
                      filename,
                      type: 'image',
                    })
                  }
                  className="aspect-square rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden relative group cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  {m.mediaUrl ? (
                    <img
                      src={m.mediaUrl}
                      alt={filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-slate-400 text-[10px]">
                      <ImageIcon className="w-6 h-6 mb-1" />
                      <span className="truncate w-full">{filename}</span>
                    </div>
                  )}
                </div>
              );
            }

            if (m.type === 'video') {
              return (
                <div
                  key={m.id}
                  className="aspect-square rounded-xl bg-slate-900 overflow-hidden relative group border border-slate-200 dark:border-slate-700 flex items-center justify-center"
                >
                  {m.mediaUrl ? (
                    <video src={m.mediaUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 text-[10px]">
                      <Video className="w-6 h-6 mb-1" />
                      <span>{filename}</span>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div
                key={m.id}
                className="aspect-square rounded-xl bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 flex flex-col justify-between"
              >
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 w-fit">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {filename}
                  </p>
                  <p className="text-[10px] text-slate-500">Document</p>
                </div>
                {m.mediaUrl && (
                  <a
                    href={m.mediaUrl}
                    download={filename}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                  >
                    <Download className="w-3 h-3" /> Download
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
