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
} from 'lucide-react';
import { useChat } from '@/context/ChatContext';

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
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 shadow-xs">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          type="button"
          onClick={clearChatData}
          title="Load another chat archive"
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="w-10 h-10 rounded-full bg-emerald-600 dark:bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
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
                className="w-full text-sm px-2 py-0.5 rounded border border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                className="p-1 text-emerald-600 dark:text-emerald-400"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group">
              <h2
                onClick={handleStartTitleEdit}
                title="Click to rename chat locally"
                className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:underline"
              >
                {chat.title}
              </h2>
              <button
                type="button"
                onClick={handleStartTitleEdit}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-opacity"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Chat Archive • {chat.messages.length} messages
          </p>
        </div>
      </div>

      {isSearching && (
        <div className="absolute inset-x-2 top-2 z-40 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
          <input
            type="text"
            placeholder="Search message text, sender, filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs sm:text-sm bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
            autoFocus
          />
          {searchResults.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-2">
              <span>
                {currentSearchIndex + 1}/{searchResults.length}
              </span>
              <button
                type="button"
                onClick={handlePrevSearch}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={handleNextSearch}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
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
            className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setIsSearching(!isSearching)}
          title="Search conversation"
          className={`p-2 rounded-full transition-colors ${
            isSearching
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setActiveView(activeView === 'gallery' ? 'chat' : 'gallery')}
          title="Media Gallery"
          className={`p-2 rounded-full transition-colors ${
            activeView === 'gallery'
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setActiveView(activeView === 'stats' ? 'chat' : 'stats')}
          title="Statistics"
          className={`p-2 rounded-full transition-colors ${
            activeView === 'stats'
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setActiveView(activeView === 'info' ? 'chat' : 'info')}
          title="Chat Details"
          className={`p-2 rounded-full transition-colors ${
            activeView === 'info'
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Info className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
