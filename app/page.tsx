'use client';

import React, { useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import DropZone from '@/components/upload/DropZone';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessagesList from '@/components/chat/ChatMessagesList';
import MediaGalleryPanel from '@/components/chat/MediaGalleryPanel';
import ChatInfoPanel from '@/components/chat/ChatInfoPanel';
import ChatStatsPanel from '@/components/chat/ChatStatsPanel';
import ParticipantSelectorModal from '@/components/chat/ParticipantSelectorModal';
import MediaLightbox from '@/components/media/MediaLightbox';

export default function Home() {
  const { chat, activeView } = useChat();

  // Attach window beforeunload confirmation listener when chat is loaded
  useEffect(() => {
    if (!chat) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have an active chat loaded. Are you sure you want to exit?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [chat]);

  if (!chat) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-10 px-4">
        <DropZone />
      </main>
    );
  }

  return (
    <main className="flex flex-col h-[100dvh] bg-slate-100 dark:bg-slate-950 max-w-5xl mx-auto shadow-2xl border-x border-slate-200 dark:border-slate-800 overflow-hidden">
      <ParticipantSelectorModal />
      <MediaLightbox />
      <ChatHeader />

      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        {activeView === 'chat' && <ChatMessagesList />}
        {activeView === 'gallery' && <MediaGalleryPanel />}
        {activeView === 'info' && <ChatInfoPanel />}
        {activeView === 'stats' && <ChatStatsPanel />}
      </div>
    </main>
  );
}
