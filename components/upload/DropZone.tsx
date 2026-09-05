'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, FileText, Archive, ShieldCheck, Loader2, PlayCircle, AlertCircle } from 'lucide-react';
import { parseWhatsAppExport } from '@/lib/parser';
import { processZipExport } from '@/lib/media';
import { getSampleChatData } from '@/lib/sample';
import { useChat } from '@/context/ChatContext';

const MAX_FILE_SIZE_MB = 800;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function DropZone() {
  const { loadChatData } = useChat();
  const [isDragging, setIsDragging] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setErrorMsg(null);

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg(`This export is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB) for this browser-based viewer. Max allowed size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    const lowerName = file.name.toLowerCase();
    const isTxt = lowerName.endsWith('.txt') || file.type === 'text/plain';
    const isZip =
      lowerName.endsWith('.zip') ||
      file.type === 'application/zip' ||
      file.type === 'application/x-zip-compressed' ||
      file.type === 'application/zip-compressed';

    if (!isTxt && !isZip) {
      setErrorMsg('Unsupported file format. Please upload a WhatsApp export .txt file or .zip archive.');
      return;
    }

    try {
      if (isTxt && !lowerName.endsWith('.zip')) {
        setLoadingStage('Reading export file...');
        const text = await file.text();
        setLoadingStage('Parsing messages...');
        const chat = parseWhatsAppExport(text);

        if (chat.messages.length === 0) {
          setErrorMsg('We couldn\'t find any valid WhatsApp messages in this file.');
          setLoadingStage(null);
          return;
        }

        setLoadingStage('Preparing chat...');
        loadChatData({ chat });
      } else {
        const extracted = await processZipExport(file, (stage) => setLoadingStage(stage));

        if (extracted.chat.messages.length === 0) {
          setErrorMsg('We couldn\'t find any valid WhatsApp messages in this zip file.');
          setLoadingStage(null);
          return;
        }

        loadChatData({
          chat: extracted.chat,
          mediaMap: extracted.mediaMap,
          rawFiles: extracted.rawFiles,
        });
      }
    } catch (err: unknown) {
      console.error('Error processing chat export:', err);
      const message = err instanceof Error ? err.message : 'Failed to parse file.';
      setErrorMsg(message || 'Failed to process WhatsApp export file.');
    } finally {
      setLoadingStage(null);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleSampleClick = () => {
    setLoadingStage('Loading sample conversation...');
    setTimeout(() => {
      const sample = getSampleChatData();
      loadChatData({
        chat: sample.chat,
        mediaMap: sample.mediaMap,
      });
      setLoadingStage(null);
    }, 300);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col items-center">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-4 h-4" />
          100% Client-Side Privacy
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-3">
          WhatsApp Chat Archive Viewer
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-lg mx-auto">
          Export a chat from WhatsApp and upload the .txt or .zip file here (up to 800MB) to view your conversation in a familiar interface.
        </p>
      </div>

      <div className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 mb-6 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <p>
          <strong>Privacy Guarantee:</strong> Your chat is processed locally in your browser. The conversation and uploaded media are not uploaded to any server or third-party service.
        </p>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !loadingStage && fileInputRef.current?.click()}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`w-full cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 flex flex-col items-center justify-center min-h-[240px] focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-slate-900 shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.zip,application/zip,application/x-zip-compressed,text/plain"
          onChange={handleFileChange}
          className="hidden"
        />

        {loadingStage ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-spin" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{loadingStage}</p>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Upload className="w-7 h-7" />
            </div>
            <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
              Drop your WhatsApp export here
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              or click to browse from your device (Max {MAX_FILE_SIZE_MB}MB)
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                <FileText className="w-3.5 h-3.5" /> .TXT
              </span>
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                <Archive className="w-3.5 h-3.5" /> .ZIP (with media)
              </span>
            </div>
          </>
        )}
      </div>

      {errorMsg && (
        <div className="w-full mt-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl p-3 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 w-full flex flex-col items-center">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Want to see how it works first?
        </p>
        <button
          type="button"
          onClick={handleSampleClick}
          className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-xl text-xs font-medium transition-colors border border-slate-200 dark:border-slate-700"
        >
          <PlayCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Try synthetic sample chat
        </button>
      </div>
    </div>
  );
}
