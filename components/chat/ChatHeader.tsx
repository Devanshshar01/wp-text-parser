'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  Image as ImageIcon,
  Info,
  BarChart2,
  Moon,
  Sun,
  Edit2,
  Check,
  X,
  Users,
  User,
  Palette,
} from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import WallpaperModal from './WallpaperModal';

export default function ChatHeader() {
  const {
    chat,
    clearChatData,
    activeView,
    setActiveView,
    searchTerm,
    setSearchTerm,
    searchResults,
    currentSearchIndex,
    setCurrentSearchIndex,
    theme,
    toggleTheme,
    setChatTitle,
  } = useChat();

  const [isSearching, setIsSearching] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [isWallpaperOpen, setIsWallpaperOpen] = useState(false);

  if (!chat) return null;

  const handleStartTitleEdit = () => {
    setTitleInput(chat.title);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      setChatTitle(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const handleNextSearch = () => {
    if (searchResults.length > 0) {
      setCurrentSearchIndex((currentSearchIndex + 1) % searchResults.length);
    }
  };

  const handlePrevSearch = () => {
    if (searchResults.length > 0) {
      setCurrentSearchIndex(
        (currentSearchIndex - 1 + searchResults.length) % searchResults.length
      );
    }
  };

  return (
    <>
      <WallpaperModal isOpen={isWallpaperOpen} onClose={() => setIsWallpaperOpen(false)} />

      <header className="sticky top-0 z-30 bg-[#075e54] dark:bg-[#1f2c34] text-white px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 shadow-md">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={clearChatData}
            title="Load another chat archive"
            className="p-1.5 text-white/90 hover:bg-white/10 rounded-full transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Contact / Group Avatar */}
          <div className="w-10 h-10 rounded-full bg-[#128c7e] dark:bg-[#00a884] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs border border-white/20">
            {chat.isGroup ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </div>

          <div className="min-w-0 flex-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-1 max-w-xs">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  className="w-full text-sm px-2 py-0.5 rounded border border-white/30 bg-[#128c7e] dark:bg-[#2a3942] text-white focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="p-1 text-emerald-200"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group">
                <h2
                  onClick={handleStartTitleEdit}
                  title="Click to rename chat locally"
                  className="text-sm sm:text-base font-semibold text-white truncate cursor-pointer hover:underline"
                >
                  {chat.title}
                </h2>
                <button
                  type="button"
                  onClick={handleStartTitleEdit}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-white/70 hover:text-white transition-opacity"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <p className="text-[11px] text-white/80 flex items-center gap-1.5 font-sans">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Chat Archive • {chat.messages.length} messages
            </p>
          </div>
        </div>

        {/* Search bar popover */}
        {isSearching && (
          <div className="absolute inset-x-2 top-2 z-40 bg-[#128c7e] dark:bg-[#1f2c34] p-1.5 rounded-xl border border-white/20 shadow-xl flex items-center gap-2">
            <Search className="w-4 h-4 text-white/70 ml-2 shrink-0" />
            <input
              type="text"
              placeholder="Search message text, sender, filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs sm:text-sm bg-transparent text-white placeholder:text-white/60 focus:outline-none"
              autoFocus
            />
            {searchResults.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-white/80 shrink-0 border-l border-white/20 pl-2">
                <span>
                  {currentSearchIndex + 1}/{searchResults.length}
                </span>
                <button
                  type="button"
                  onClick={handlePrevSearch}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={handleNextSearch}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  ▼
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setIsSearching(false);
                setSearchTerm('');
              }}
              className="p-1 text-white/80 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Action Buttons */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsWallpaperOpen(true)}
            title="Change Wallpaper"
            className="p-1.5 text-white/90 hover:bg-white/10 rounded-full transition-colors"
          >
            <Palette className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsSearching(!isSearching)}
            title="Search conversation"
            className={`p-1.5 rounded-full transition-colors ${
              isSearching
                ? 'bg-white/20 text-white'
                : 'text-white/90 hover:bg-white/10'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setActiveView(activeView === 'gallery' ? 'chat' : 'gallery')}
            title="Media Gallery"
            className={`p-1.5 rounded-full transition-colors ${
              activeView === 'gallery'
                ? 'bg-white/20 text-white'
                : 'text-white/90 hover:bg-white/10'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setActiveView(activeView === 'stats' ? 'chat' : 'stats')}
            title="Statistics"
            className={`p-1.5 rounded-full transition-colors ${
              activeView === 'stats'
                ? 'bg-white/20 text-white'
                : 'text-white/90 hover:bg-white/10'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setActiveView(activeView === 'info' ? 'chat' : 'info')}
            title="Chat Details"
            className={`p-1.5 rounded-full transition-colors ${
              activeView === 'info'
                ? 'bg-white/20 text-white'
                : 'text-white/90 hover:bg-white/10'
            }`}
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 text-white/90 hover:bg-white/10 rounded-full transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>
    </>
  );
}
