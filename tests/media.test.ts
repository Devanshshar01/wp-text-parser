import { describe, it, expect } from 'vitest';
import { isPathSafe, buildMediaIndex, processImportedFiles } from '../lib/media';
import { getSampleChatData } from '../lib/sample';
import { ImportedFile } from '../types';

describe('Zip & Media Security & Folder Processing Functions', () => {
  it('detects zip path traversal attempts', () => {
    expect(isPathSafe('valid/file.jpg')).toBe(true);
    expect(isPathSafe('../malicious.txt')).toBe(false);
    expect(isPathSafe('/etc/passwd')).toBe(false);
    expect(isPathSafe('\\windows\\system32')).toBe(false);
  });

  it('generates synthetic sample chat properly', () => {
    const { chat, mediaMap } = getSampleChatData();
    expect(chat.messages.length).toBeGreaterThan(10);
    expect(chat.participants).toContain('Alex');
    expect(chat.participants).toContain('Sam');
    expect(mediaMap['dashboard-preview.jpg']).toBeDefined();
    expect(chat.messages.some((m) => m.mediaUrl !== undefined)).toBe(true);
  });

  it('builds media index map accurately from imported files', () => {
    const fakeImage = new File(['fake-img-bytes'], 'IMG-1234.jpg', { type: 'image/jpeg' });
    const imported: ImportedFile[] = [
      {
        file: fakeImage,
        name: 'IMG-1234.jpg',
        relativePath: 'WhatsApp Chat/IMG-1234.jpg',
        type: 'image/jpeg',
        size: 100,
      },
    ];

    const indexMap = buildMediaIndex(imported);
    expect(indexMap.has('img-1234.jpg')).toBe(true);
    expect(indexMap.get('img-1234.jpg')?.filename).toBe('IMG-1234.jpg');
  });

  it('processes imported folder files and matches media to messages', async () => {
    const txtContent = `14/06/2026, 10:00 - Alex: Hello Sam!
14/06/2026, 10:01 - Sam: IMG-001.jpg (file attached)
14/06/2026, 10:02 - Alex: Got the picture!`;

    const txtFile = new File([txtContent], '_chat.txt', { type: 'text/plain' });
    const imgFile = new File(['fake-jpg'], 'IMG-001.jpg', { type: 'image/jpeg' });

    const importedFiles: ImportedFile[] = [
      { file: txtFile, name: '_chat.txt', relativePath: 'ExportFolder/_chat.txt', type: 'text/plain', size: txtContent.length },
      { file: imgFile, name: 'IMG-001.jpg', relativePath: 'ExportFolder/IMG-001.jpg', type: 'image/jpeg', size: 8 },
    ];

    const result = await processImportedFiles(importedFiles);
    expect(result.chat.messages).toHaveLength(3);
    expect(result.chat.messages[1].mediaFilename).toBe('IMG-001.jpg');
    expect(result.chat.messages[1].mediaUrl).toBeDefined();
    expect(result.matchedMediaCount).toBe(1);
  });
});
