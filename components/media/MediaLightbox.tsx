'use client';

import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { useChat } from '@/context/ChatContext';

export default function MediaLightbox() {
  const { activeLightboxMedia, setActiveLightboxMedia } = useChat();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveLightboxMedia(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveLightboxMedia]);

  if (!activeLightboxMedia) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setActiveLightboxMedia(null)}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          {activeLightboxMedia.url && (
            <a
              href={activeLightboxMedia.url}
              download={activeLightboxMedia.filename || 'media'}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition-colors"
              title="Download Media"
            >
              <Download className="w-5 h-5" />
            </a>
          )}
          <button
            type="button"
            onClick={() => setActiveLightboxMedia(null)}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition-colors"
            title="Close Lightbox"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeLightboxMedia.type === 'image' ? (
          <img
            src={activeLightboxMedia.url}
            alt={activeLightboxMedia.filename || 'Lightbox Image'}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
        ) : (
          <video
            src={activeLightboxMedia.url}
            controls
            autoPlay
            className="max-w-full max-h-[85vh] rounded-xl shadow-2xl"
          />
        )}

        {activeLightboxMedia.filename && (
          <div className="mt-3 text-xs text-slate-300 font-mono truncate max-w-md bg-slate-900/80 px-3 py-1 rounded-full">
            {activeLightboxMedia.filename}
          </div>
        )}
      </div>
    </div>
  );
}
