'use client';

import React from 'react';
import { BarChart2, MessageSquare, Image as ImageIcon, Video, Music, FileText, UserCheck } from 'lucide-react';
import { useChat } from '@/context/ChatContext';

export default function ChatStatsPanel() {
  const { chat } = useChat();

  if (!chat) return null;

  const { stats } = chat;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 max-w-2xl mx-auto w-full space-y-6">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs flex items-center gap-3">
        <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 rounded-xl text-emerald-700 dark:text-emerald-300">
          <BarChart2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Chat Statistics
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Analytics derived from parsed conversation archive
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xs">
          <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
          <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {stats.totalMessages.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500">Total Messages</p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xs">
          <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
          <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {stats.imageCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500">Images</p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xs">
          <Video className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
          <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {stats.videoCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500">Videos</p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xs">
          <Music className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
          <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {stats.audioCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500">Audio</p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xs">
          <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
          <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {stats.documentCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500">Documents</p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xs">
          <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
          <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {chat.participants.length}
          </p>
          <p className="text-[11px] text-slate-500">Participants</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Message Count by Participant
        </h4>
        <div className="space-y-3">
          {chat.participants.map((name) => {
            const count = stats.participantCounts[name] || 0;
            const percentage = stats.totalMessages > 0 ? (count / stats.totalMessages) * 100 : 0;

            return (
              <div key={name} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-800 dark:text-slate-200">{name}</span>
                  <span className="text-slate-500">
                    {count.toLocaleString()} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
