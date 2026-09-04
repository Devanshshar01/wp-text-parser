'use client';

import React from 'react';
import { Calendar, MessageSquare, Image as ImageIcon, Video, Music, FileText, Users, Clock } from 'lucide-react';
import { useChat } from '@/context/ChatContext';

export default function ChatInfoPanel() {
  const { chat } = useChat();

  if (!chat) return null;

  const { stats } = chat;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 max-w-2xl mx-auto w-full space-y-6">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs">
        <h3 className="text-base font-bold mb-1 text-slate-900 dark:text-slate-100">
          {chat.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {chat.isGroup ? 'Group Conversation' : 'Direct Conversation'} • Chat Archive
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Archive Summary
        </h4>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
            <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {stats.totalMessages.toLocaleString()}
              </p>
              <p className="text-slate-500 dark:text-slate-400">Total Messages</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {chat.participants.length}
              </p>
              <p className="text-slate-500 dark:text-slate-400">Participants</p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> First message:
            </span>
            <span className="font-medium">
              {stats.firstMessageDate
                ? stats.firstMessageDate.toLocaleDateString([], {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'N/A'}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Latest message:
            </span>
            <span className="font-medium">
              {stats.lastMessageDate
                ? stats.lastMessageDate.toLocaleDateString([], {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Participants ({chat.participants.length})
        </h4>
        <div className="space-y-2">
          {chat.participants.map((name) => (
            <div
              key={name}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs"
            >
              <span className="font-semibold text-slate-800 dark:text-slate-200">{name}</span>
              <span className="text-slate-500 dark:text-slate-400">
                {(stats.participantCounts[name] || 0).toLocaleString()} msgs
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Media Attachments ({stats.mediaCount})
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-center">
            <ImageIcon className="w-4 h-4 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
            <p className="font-bold text-slate-800 dark:text-slate-200">{stats.imageCount}</p>
            <p className="text-[10px] text-slate-500">Images</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-center">
            <Video className="w-4 h-4 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
            <p className="font-bold text-slate-800 dark:text-slate-200">{stats.videoCount}</p>
            <p className="text-[10px] text-slate-500">Videos</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-center">
            <Music className="w-4 h-4 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
            <p className="font-bold text-slate-800 dark:text-slate-200">{stats.audioCount}</p>
            <p className="text-[10px] text-slate-500">Audio</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-center">
            <FileText className="w-4 h-4 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
            <p className="font-bold text-slate-800 dark:text-slate-200">{stats.documentCount}</p>
            <p className="text-[10px] text-slate-500">Documents</p>
          </div>
        </div>
      </div>
    </div>
  );
}
