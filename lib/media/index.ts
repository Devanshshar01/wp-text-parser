import JSZip from 'jszip';
import { parseWhatsAppExport, normalizeMediaFilename, extractAllMediaFilenames, parseMessageHeaderLine } from '../parser';
import { ParsedChat, Message, ImportedFile, MediaAsset } from '../../types';

export interface ExtractedExport {
  chat: ParsedChat;
  mediaMap: Record<string, string>;
  rawFiles: Record<string, Blob>;
  txtFilename: string;
  importedFilesCount?: number;
  matchedMediaCount?: number;
}

export function isPathSafe(filePath: string): boolean {
  if (filePath.includes('..') || filePath.startsWith('/') || filePath.startsWith('\\')) {
    return false;
  }
  return true;
}

/**
 * Score potential TXT files to identify the best WhatsApp chat export candidate.
 */
export async function findBestChatTxtFile(
  txtFiles: ImportedFile[]
): Promise<ImportedFile> {
  if (txtFiles.length === 0) {
    throw new Error('No .txt files found in the export.');
  }

  if (txtFiles.length === 1) {
    return txtFiles[0];
  }

  let bestFile = txtFiles[0];
  let maxScore = -1;

  for (const f of txtFiles) {
    let score = 0;
    const lowerName = f.name.toLowerCase();

    if (lowerName.includes('_chat.txt')) score += 50;
    if (lowerName.includes('whatsapp chat')) score += 50;
    if (lowerName.startsWith('whatsapp')) score += 30;

    try {
      const sliceText = await f.file.slice(0, 4096).text();
      const lines = sliceText.split(/\r?\n/);
      let headerCount = 0;
      for (const line of lines) {
        if (parseMessageHeaderLine(line)) {
          headerCount++;
        }
      }
      score += headerCount * 10;
    } catch {
      // ignore reading error
    }

    if (score > maxScore) {
      maxScore = score;
      bestFile = f;
    }
  }

  return bestFile;
}

/**
 * Get MIME type from extension with robust fallbacks.
 */
export function getMimeType(filename: string, fallbackType?: string): string {
  if (fallbackType && fallbackType !== 'application/octet-stream' && fallbackType !== '') {
    return fallbackType;
  }
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'mkv':
      return 'video/x-matroska';
    case 'mov':
      return 'video/quicktime';
    case 'mp3':
      return 'audio/mpeg';
    case 'ogg':
    case 'opus':
      return 'audio/ogg';
    case 'wav':
      return 'audio/wav';
    case 'm4a':
      return 'audio/m4a';
    case 'pdf':
      return 'application/pdf';
    case 'doc':
    case 'docx':
      return 'application/msword';
    case 'zip':
      return 'application/zip';
    case 'txt':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Fast multi-strategy media index map builder.
 */
export function buildMediaIndex(
  files: ImportedFile[]
): Map<string, MediaAsset> {
  const indexMap = new Map<string, MediaAsset>();

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const lowerName = f.name.toLowerCase();
    if (lowerName.endsWith('.txt') || lowerName.startsWith('._') || f.relativePath.includes('__MACOSX')) {
      continue;
    }

    const basename = f.name.split(/[/\\]/).pop() || f.name;
    const normalizedKey = normalizeMediaFilename(basename);
    const ext = basename.split('.').pop()?.toLowerCase() || '';

    const asset: MediaAsset = {
      id: `asset_${i}`,
      file: f.file,
      filename: basename,
      relativePath: f.relativePath,
      mimeType: getMimeType(basename, f.type),
      extension: ext,
      size: f.size,
    };

    // Store in index under multiple variations for constant time lookup
    indexMap.set(normalizedKey, asset);
    indexMap.set(basename.toLowerCase(), asset);
    indexMap.set(f.relativePath.toLowerCase(), asset);

    if (basename.includes('%')) {
      try {
        const decoded = decodeURIComponent(basename).toLowerCase();
        indexMap.set(decoded, asset);
      } catch {
        // ignore decode error
      }
    }
  }

  return indexMap;
}

/**
 * Process folder/file uploads or TXT files directly with optimized matching.
 */
export async function processImportedFiles(
  importedFiles: ImportedFile[],
  onProgress?: (stage: string) => void
): Promise<ExtractedExport> {
  onProgress?.('Reading files...');

  const txtFiles: ImportedFile[] = [];
  for (let i = 0; i < importedFiles.length; i++) {
    const f = importedFiles[i];
    const lower = f.name.toLowerCase();
    if (lower.endsWith('.txt') && !lower.startsWith('._') && !f.relativePath.includes('__MACOSX')) {
      txtFiles.push(f);
    }
  }

  if (txtFiles.length === 0) {
    throw new Error('We couldn\'t find a WhatsApp chat export (.txt file) in the uploaded files.');
  }

  onProgress?.(`Finding WhatsApp export in ${txtFiles.length} text file(s)...`);
  const chatTxtFile = await findBestChatTxtFile(txtFiles);

  onProgress?.(`Parsing conversation from ${chatTxtFile.name}...`);
  const rawText = await chatTxtFile.file.text();
  const parsedChat = parseWhatsAppExport(rawText);

  onProgress?.('Matching media files...');
  const mediaIndex = buildMediaIndex(importedFiles);

  const mediaMap: Record<string, string> = {};
  const rawFiles: Record<string, Blob> = {};
  let matchedCount = 0;

  const updatedMessages: Message[] = parsedChat.messages.map((msg: Message) => {
    // Fast-path: if text message has no media reference indicators, return early
    if (msg.type === 'text' && !msg.mediaFilename) {
      return msg;
    }

    const referencedMedia = extractAllMediaFilenames(msg.text || '');
    if (msg.mediaFilename && !referencedMedia.some((m) => m.filename === msg.mediaFilename)) {
      referencedMedia.unshift({
        filename: msg.mediaFilename,
        type: msg.type,
      });
    }

    if (referencedMedia.length === 0) {
      return msg;
    }

    const matchedAssets: MediaAsset[] = [];

    for (let i = 0; i < referencedMedia.length; i++) {
      const ref = referencedMedia[i];
      const normKey = normalizeMediaFilename(ref.filename);
      const matchedAsset = mediaIndex.get(normKey) || mediaIndex.get(ref.filename.toLowerCase());

      if (matchedAsset) {
        let objectUrl = matchedAsset.objectUrl;
        if (!objectUrl) {
          objectUrl = URL.createObjectURL(matchedAsset.file);
          matchedAsset.objectUrl = objectUrl;
        }

        mediaMap[normKey] = objectUrl;
        rawFiles[normKey] = matchedAsset.file;
        matchedAssets.push({
          ...matchedAsset,
          objectUrl,
        });
        matchedCount++;
      }
    }

    if (matchedAssets.length > 0) {
      return {
        ...msg,
        mediaUrl: matchedAssets[0].objectUrl,
        mediaFilename: matchedAssets[0].filename,
        mediaMimeType: matchedAssets[0].mimeType,
        mediaSize: matchedAssets[0].size,
        mediaAssets: matchedAssets,
      };
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
    txtFilename: chatTxtFile.name,
    importedFilesCount: importedFiles.length,
    matchedMediaCount: matchedCount,
  };
}

export async function processZipExport(
  file: File,
  onProgress?: (stage: string) => void
): Promise<ExtractedExport> {
  onProgress?.('Reading ZIP file...');
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  onProgress?.('Scanning files in archive...');
  const importedFiles: ImportedFile[] = [];

  const entries = Object.keys(loadedZip.files);
  for (let i = 0; i < entries.length; i++) {
    const relativePath = entries[i];
    if (!isPathSafe(relativePath)) continue;

    const zipEntry = loadedZip.files[relativePath];
    if (zipEntry.dir) continue;

    const basename = relativePath.split(/[/\\]/).pop() || relativePath;
    if (basename.startsWith('._') || relativePath.toLowerCase().includes('__macosx')) continue;

    const blob = await zipEntry.async('blob');
    const importedFile = new File([blob], basename, { type: blob.type });

    importedFiles.push({
      file: importedFile,
      name: basename,
      relativePath,
      type: blob.type,
      size: blob.size,
    });
  }

  return processImportedFiles(importedFiles, onProgress);
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
