'use client';

import React, { useRef, ChangeEvent } from 'react';
import { X, Image as ImageIcon, Upload, Check } from 'lucide-react';
import { useChat } from '@/context/ChatContext';

const PRESET_WALLPAPERS = [
  { id: 'doodle', name: 'Default Doodle', value: 'doodle' },
  { id: 'dark-solid', name: 'Dark Teal', value: '#0b141a' },
  { id: 'light-solid', name: 'Beige Solid', value: '#efeae2' },
  { id: 'slate', name: 'Slate Gray', value: '#1e293b' },
  { id: 'emerald', name: 'Emerald', value: '#064e3b' },
  { id: 'navy', name: 'Deep Navy', value: '#0f172a' },
  { id: 'rose', name: 'Soft Rose', value: '#4c1d95' },
];

export default function WallpaperModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { wallpaper, setWallpaper } = useChat();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCustomUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      setWallpaper(objectUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111b21] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[#00a884]">
            <ImageIcon className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Chat Wallpaper
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 mb-5">
          Customize your WhatsApp conversation background color, theme, or upload a custom picture.
        </p>

        {/* Presets Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {PRESET_WALLPAPERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setWallpaper(item.value);
                onClose();
              }}
              className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
                wallpaper === item.value
                  ? 'border-[#00a884] bg-emerald-50/50 dark:bg-[#202c33] text-[#00a884]'
                  : 'border-slate-200 dark:border-slate-800 hover:border-[#00a884] text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shadow-2xs"
                  style={{
                    backgroundColor:
                      item.value === 'doodle' ? '#efeae2' : item.value,
                  }}
                />
                <span>{item.name}</span>
              </div>
              {wallpaper === item.value && <Check className="w-4 h-4 text-[#00a884]" />}
            </button>
          ))}
        </div>

        {/* Custom Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleCustomUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#00a884] dark:hover:border-[#00a884] text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
        >
          <Upload className="w-4 h-4 text-[#00a884]" />
          Upload Custom Background Image
        </button>
      </div>
    </div>
  );
}
