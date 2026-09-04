'use client';

import React from 'react';
import { UserCheck, Users } from 'lucide-react';
import { useChat } from '@/context/ChatContext';

export default function ParticipantSelectorModal() {
  const { chat, selfParticipant, setSelfParticipant } = useChat();

  if (!chat || selfParticipant || chat.participants.length <= 1) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4 text-emerald-600 dark:text-emerald-400">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Who are you in this chat?
          </h2>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          Select your name to properly align message bubbles (your messages will be on the right, other senders on the left).
        </p>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {chat.participants.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setSelfParticipant(name)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all text-left text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              <span>{name}</span>
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
