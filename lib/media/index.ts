import JSZip from 'jszip';
import { parseWhatsAppExport, normalizeMediaFilename } from '../parser';
import { ParsedChat, Message } from '../../types';

export interface ExtractedExport {
  chat: ParsedChat;
  mediaMap: Record<string, string>;
  rawFiles: Record<string, Blob>;
  txtFilename: string;
}

export function isPathSafe(filePath: string): boolean {
  if (filePath.includes('..') || filePath.startsWith('/') || filePath.startsWith('\\')) {
    return false;
  }
  return true;
}

export async function processZipExport(
  file: File,
  onProgress?: (stage: string) => void
): Promise<ExtractedExport> {
  onProgress?.('Reading ZIP file...');
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  onProgress?.('Scanning files in archive...');
  const txtFiles: { name: string; zipObject: JSZip.JSZipObject }[] = [];

  const entries = Object.keys(loadedZip.files);
  for (let i = 0; i < entries.length; i++) {
    const relativePath = entries[i];
    if (!isPathSafe(relativePath)) continue;

    const zipEntry = loadedZip.files[relativePath];
    if (zipEntry.dir) continue;

    const lowerPath = relativePath.toLowerCase();
    const basename = relativePath.split(/[/\\]/).pop() || relativePath;

    if (lowerPath.endsWith('.txt') && !basename.startsWith('._') && !lowerPath.includes('__macosx')) {
      txtFiles.push({ name: relativePath, zipObject: zipEntry });
    }
  }

  if (txtFiles.length === 0) {
    throw new Error('We couldn\'t find a WhatsApp chat export (.txt file) in this archive.');
  }

  txtFiles.sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (nameA.includes('_chat.txt') || nameA.includes('whatsapp chat')) return -1;
    if (nameB.includes('_chat.txt') || nameB.includes('whatsapp chat')) return 1;
    return 0;
  });

  const selectedTxt = txtFiles[0];
  onProgress?.(`Parsing conversation from ${selectedTxt.name.split('/').pop()}...`);

  const rawText = await selectedTxt.zipObject.async('string');
  const parsedChat = parseWhatsAppExport(rawText);

  onProgress?.('Processing media attachments...');

  // Build a fast lookup set of referenced media filenames from parsed messages
  const referencedMediaNames = new Set<string>();
  for (let i = 0; i < parsedChat.messages.length; i++) {
    const m = parsedChat.messages[i];
    if (m.mediaFilename) {
      referencedMediaNames.add(normalizeMediaFilename(m.mediaFilename));
    }
  }

  const mediaMap: Record<string, string> = {};
  const rawFiles: Record<string, Blob> = {};

  // Extract object URLs efficiently for matching media
  for (let i = 0; i < entries.length; i++) {
    const relativePath = entries[i];
    if (!isPathSafe(relativePath)) continue;

    const zipEntry = loadedZip.files[relativePath];
    if (zipEntry.dir) continue;

    const basename = relativePath.split(/[/\\]/).pop() || relativePath;
    if (basename.startsWith('._') || relativePath.toLowerCase().includes('__macosx')) {
      continue;
    }

    const normalizedName = normalizeMediaFilename(basename);

    // Extract blob if explicitly referenced, or if small archive
    if (referencedMediaNames.size === 0 || referencedMediaNames.has(normalizedName) || entries.length <= 50) {
      const blob = await zipEntry.async('blob');
      rawFiles[normalizedName] = blob;
      mediaMap[normalizedName] = URL.createObjectURL(blob);
    }
  }

  // Map object URLs back to messages
  const updatedMessages: Message[] = parsedChat.messages.map((msg: Message) => {
    if (msg.mediaFilename) {
      const norm = normalizeMediaFilename(msg.mediaFilename);
      const url = mediaMap[norm];
      if (url) {
        return {
          ...msg,
          mediaUrl: url,
        };
      }
    }
    return msg;
  });

  return {
    chat: {
      ...parsedChat,
      messages: updatedMessages,
    },
    mediaMap,
    rawFiles,
    txtFilename: selectedTxt.name,
  };
}

export function revokeMediaUrls(mediaMap: Record<string, string>) {
  for (const url of Object.values(mediaMap)) {
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }
  }
}
