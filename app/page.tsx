'use client';

import React from 'react';
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
