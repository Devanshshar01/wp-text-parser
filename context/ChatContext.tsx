'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ParsedChat, Message } from '../types';
import { revokeMediaUrls } from '../lib/media';

interface ChatContextType {
  chat: ParsedChat | null;
  selfParticipant: string | null;
  mediaMap: Record<string, string>;
  rawFiles: Record<string, Blob>;
  searchTerm: string;
  searchResults: Message[];
  currentSearchIndex: number;
  activeView: 'chat' | 'gallery' | 'info' | 'stats';
  activeLightboxMedia: { url: string; filename?: string; type: 'image' | 'video' } | null;
  theme: 'light' | 'dark';
  wallpaper: string;
  setWallpaper: (wallpaper: string) => void;
  setSelfParticipant: (participant: string) => void;
  loadChatData: (data: {
    chat: ParsedChat;
    mediaMap?: Record<string, string>;
    rawFiles?: Record<string, Blob>;
  }) => void;
  clearChatData: () => void;
  setSearchTerm: (term: string) => void;
  setCurrentSearchIndex: (index: number) => void;
  setActiveView: (view: 'chat' | 'gallery' | 'info' | 'stats') => void;
  setActiveLightboxMedia: (
    media: { url: string; filename?: string; type: 'image' | 'video' } | null
  ) => void;
  toggleTheme: () => void;
  setChatTitle: (title: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chat, setChat] = useState<ParsedChat | null>(null);
  const [selfParticipant, setSelfParticipant] = useState<string | null>(null);
  const [mediaMap, setMediaMap] = useState<Record<string, string>>({});
  const [rawFiles, setRawFiles] = useState<Record<string, Blob>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [activeView, setActiveView] = useState<'chat' | 'gallery' | 'info' | 'stats'>('chat');
  const [activeLightboxMedia, setActiveLightboxMedia] = useState<{
    url: string;
    filename?: string;
    type: 'image' | 'video';
  } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [wallpaper, setWallpaper] = useState<string>('doodle');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    if (!chat || !term.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    const lower = term.toLowerCase();
    const matches = chat.messages.filter((msg) => {
      const matchText = msg.text?.toLowerCase().includes(lower);
      const matchSender = msg.sender?.toLowerCase().includes(lower);
      const matchFilename = msg.mediaFilename?.toLowerCase().includes(lower);
      return matchText || matchSender || matchFilename;
    });

    setSearchResults(matches);
    setCurrentSearchIndex(0);
  };

  const loadChatData = ({
    chat: newChat,
    mediaMap: newMediaMap = {},
    rawFiles: newRawFiles = {},
  }: {
    chat: ParsedChat;
    mediaMap?: Record<string, string>;
    rawFiles?: Record<string, Blob>;
  }) => {
    revokeMediaUrls(mediaMap);

    setChat(newChat);
    setMediaMap(newMediaMap);
    setRawFiles(newRawFiles);
    setSearchTerm('');
    setSearchResults([]);
    setCurrentSearchIndex(0);
    setActiveView('chat');
    setActiveLightboxMedia(null);

    if (newChat.participants.length === 1) {
      setSelfParticipant(newChat.participants[0]);
    } else {
      setSelfParticipant(null);
    }
  };

  const clearChatData = () => {
    revokeMediaUrls(mediaMap);
    setChat(null);
    setSelfParticipant(null);
    setMediaMap({});
    setRawFiles({});
    setSearchTerm('');
    setSearchResults([]);
    setCurrentSearchIndex(0);
    setActiveView('chat');
    setActiveLightboxMedia(null);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setChatTitle = (title: string) => {
    if (chat) {
      setChat({
        ...chat,
        title,
      });
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chat,
        selfParticipant,
        mediaMap,
        rawFiles,
        searchTerm,
        searchResults,
        currentSearchIndex,
        activeView,
        activeLightboxMedia,
        theme,
        wallpaper,
        setWallpaper,
        setSelfParticipant,
        loadChatData,
        clearChatData,
        setSearchTerm: handleSearchChange,
        setCurrentSearchIndex,
        setActiveView,
        setActiveLightboxMedia,
        toggleTheme,
        setChatTitle,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
