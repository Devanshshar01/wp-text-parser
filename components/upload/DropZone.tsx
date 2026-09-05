'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { FolderUp, FileText, Archive, ShieldCheck, Loader2, PlayCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { processImportedFiles, processZipExport } from '@/lib/media';
import { getSampleChatData } from '@/lib/sample';
import { useChat } from '@/context/ChatContext';
import { ImportedFile } from '@/types';

const MAX_FILE_SIZE_MB = 800;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function DropZone() {
  const { loadChatData } = useChat();
  const [isDragging, setIsDragging] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [importSummary, setImportSummary] = useState<{
    fileCount: number;
    txtFilename: string;
    messageCount: number;
    matchedMediaCount: number;
    rawExport: Parameters<typeof loadChatData>[0];
  } | null>(null);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const txtInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const processFilesArray = async (importedFiles: ImportedFile[]) => {
    setErrorMsg(null);
    setImportSummary(null);

    if (importedFiles.length === 0) {
      setErrorMsg('No files selected.');
      return;
    }

    const totalSize = importedFiles.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > MAX_FILE_SIZE_BYTES) {
      setErrorMsg(`The total size (${(totalSize / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    try {
      setLoadingStage('Scanning files...');
      const extracted = await processImportedFiles(importedFiles, (stage) => setLoadingStage(stage));

      if (extracted.chat.messages.length === 0) {
        setErrorMsg('No WhatsApp messages could be parsed from the selected files.');
        setLoadingStage(null);
        return;
      }

      setImportSummary({
        fileCount: importedFiles.length,
        txtFilename: extracted.txtFilename,
        messageCount: extracted.chat.messages.length,
        matchedMediaCount: extracted.matchedMediaCount || 0,
        rawExport: {
          chat: extracted.chat,
          mediaMap: extracted.mediaMap,
          rawFiles: extracted.rawFiles,
        },
      });
    } catch (err: unknown) {
      console.error('Import error:', err);
      const message = err instanceof Error ? err.message : 'Failed to parse folder.';
      setErrorMsg(message || 'Failed to process WhatsApp export.');
    } finally {
      setLoadingStage(null);
    }
  };

  const handleFolderSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesList = Array.from(e.target.files);
      const imported: ImportedFile[] = filesList.map((f) => ({
        file: f,
        name: f.name,
        relativePath: (f as unknown as { webkitRelativePath?: string }).webkitRelativePath || f.name,
        type: f.type,
        size: f.size,
      }));
      processFilesArray(imported);
    }
  };

  const handleSingleTxtSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imported: ImportedFile[] = [{
        file,
        name: file.name,
        relativePath: file.name,
        type: file.type,
        size: file.size,
      }];
      processFilesArray(imported);
    }
  };

  const handleZipSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setErrorMsg(null);
      try {
        setLoadingStage('Extracting ZIP archive...');
        const extracted = await processZipExport(file, (stage) => setLoadingStage(stage));
        loadChatData({
          chat: extracted.chat,
          mediaMap: extracted.mediaMap,
          rawFiles: extracted.rawFiles,
        });
      } catch (err: unknown) {
        console.error('ZIP error:', err);
        setErrorMsg(err instanceof Error ? err.message : 'Failed to extract ZIP file.');
      } finally {
        setLoadingStage(null);
      }
    }
  };

  // Fast concurrent drag and drop directory entry scanner
  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    setLoadingStage('Reading dropped items...');
    const importedFiles: ImportedFile[] = [];

    const readDirectoryAllEntries = async (dirReader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> => {
      const allEntries: FileSystemEntry[] = [];
      let batch: FileSystemEntry[] = [];
      do {
        batch = await new Promise<FileSystemEntry[]>((resolve) => {
          dirReader.readEntries((res) => resolve(res), () => resolve([]));
        });
        allEntries.push(...batch);
      } while (batch.length > 0);
      return allEntries;
    };

    const readEntry = async (entry: FileSystemEntry, path = ''): Promise<void> => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        await new Promise<void>((resolve) => {
          fileEntry.file(
            (file) => {
              importedFiles.push({
                file,
                name: file.name,
                relativePath: path ? `${path}/${file.name}` : file.name,
                type: file.type,
                size: file.size,
              });
              resolve();
            },
            () => resolve()
          );
        });
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const dirReader = dirEntry.createReader();
        const entries = await readDirectoryAllEntries(dirReader);
        const childPath = path ? `${path}/${dirEntry.name}` : dirEntry.name;
        await Promise.all(entries.map((child) => readEntry(child, childPath)));
      }
    };

    try {
      const rootPromises: Promise<void>[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.webkitGetAsEntry) {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            rootPromises.push(readEntry(entry));
          }
        } else {
          const file = item.getAsFile();
          if (file) {
            importedFiles.push({
              file,
              name: file.name,
              relativePath: file.name,
              type: file.type,
              size: file.size,
            });
          }
        }
      }

      await Promise.all(rootPromises);

      if (importedFiles.length === 1 && importedFiles[0].name.toLowerCase().endsWith('.zip')) {
        setLoadingStage('Extracting ZIP archive...');
        const extracted = await processZipExport(importedFiles[0].file, (stage) => setLoadingStage(stage));
        loadChatData({
          chat: extracted.chat,
          mediaMap: extracted.mediaMap,
          rawFiles: extracted.rawFiles,
        });
      } else {
        processFilesArray(importedFiles);
      }
    } catch (err: unknown) {
      console.error('Drop error:', err);
      setErrorMsg('Failed to read dropped files.');
      setLoadingStage(null);
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
      {/* Hidden Inputs */}
      <input
        ref={folderInputRef}
        type="file"
        {...({ webkitdirectory: '', directory: '', multiple: true } as unknown as Record<string, string>)}
        onChange={handleFolderSelect}
        className="hidden"
      />
      <input
        ref={txtInputRef}
        type="file"
        accept=".txt"
        onChange={handleSingleTxtSelect}
        className="hidden"
      />
      <input
        ref={zipInputRef}
        type="file"
        accept=".zip"
        onChange={handleZipSelect}
        className="hidden"
      />

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          100% Client-Side Privacy
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-3">
          WhatsApp Chat Archive Viewer
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-lg mx-auto">
          Export a chat from WhatsApp and upload the unzipped folder, .txt file, or .zip archive here.
        </p>
      </div>

      <div className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 mb-6 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <p>
          <strong>Privacy Guarantee:</strong> Your chat is processed locally in your browser. The conversation and uploaded media are not uploaded to any server or third-party service.
        </p>
      </div>

      {importSummary ? (
        <div className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
            Export Ready to View
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Parsed from <span className="font-semibold text-slate-700 dark:text-slate-200">{importSummary.txtFilename}</span>
          </p>

          <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-6 text-xs">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="block text-slate-400 text-[10px] uppercase font-semibold">Total Messages</span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-100">{importSummary.messageCount.toLocaleString()}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="block text-slate-400 text-[10px] uppercase font-semibold">Matched Media</span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-100">{importSummary.matchedMediaCount.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-3 w-full max-w-sm">
            <button
              type="button"
              onClick={() => setImportSummary(null)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => loadChatData(importSummary.rawExport)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Open Conversation
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={handleDrop}
          className={`w-full rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 flex flex-col items-center justify-center min-h-[260px] ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm'
          }`}
        >
          {loadingStage ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-spin" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{loadingStage}</p>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <FolderUp className="w-7 h-7" />
              </div>

              <p className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
                Drag & Drop Extracted Folder or Zip Here
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Recommended: Extract your WhatsApp ZIP export on your device and select the folder.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-sm min-w-[140px]"
                >
                  <FolderUp className="w-4 h-4" />
                  Choose Folder
                </button>

                <button
                  type="button"
                  onClick={() => txtInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold px-3.5 py-2.5 rounded-xl text-xs transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <FileText className="w-4 h-4" />
                  Upload Chat TXT
                </button>

                <button
                  type="button"
                  onClick={() => zipInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold px-3.5 py-2.5 rounded-xl text-xs transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <Archive className="w-4 h-4" />
                  Upload ZIP
                </button>
              </div>
            </>
          )}
        </div>
      )}

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
