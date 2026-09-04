import { describe, it, expect } from 'vitest';
import {
  parseWhatsAppExport,
  normalizeMediaFilename,
} from '../lib/parser';

describe('WhatsApp Export Parser', () => {
  it('parses standard Android 24h format messages', () => {
    const sample = `14/06/2026, 21:07 - Alice: Hello world
14/06/2026, 21:08 - Bob: Hey Alice!`;

    const chat = parseWhatsAppExport(sample);
    expect(chat.messages).toHaveLength(2);
    expect(chat.participants).toEqual(['Alice', 'Bob']);

    expect(chat.messages[0].sender).toBe('Alice');
    expect(chat.messages[0].text).toBe('Hello world');
    expect(chat.messages[0].timestamp.getHours()).toBe(21);
    expect(chat.messages[0].timestamp.getMinutes()).toBe(7);

    expect(chat.messages[1].sender).toBe('Bob');
    expect(chat.messages[1].text).toBe('Hey Alice!');
  });

  it('parses Android 12h AM/PM format', () => {
    const sample = `14/06/2026, 9:07 pm - Alice: Good evening
15/06/2026, 8:15 AM - Bob: Good morning!`;

    const chat = parseWhatsAppExport(sample);
    expect(chat.messages).toHaveLength(2);
    expect(chat.messages[0].timestamp.getHours()).toBe(21);
    expect(chat.messages[1].timestamp.getHours()).toBe(8);
  });

  it('parses iOS bracket format with seconds', () => {
    const sample = `[14/06/2026, 21:07:05] Alice: Hello from iOS
[14/06/2026, 21:08:12] Bob: iOS received!`;

    const chat = parseWhatsAppExport(sample);
    expect(chat.messages).toHaveLength(2);
    expect(chat.messages[0].sender).toBe('Alice');
    expect(chat.messages[0].text).toBe('Hello from iOS');
    expect(chat.messages[0].timestamp.getSeconds()).toBe(5);
  });

  it('handles multiline messages correctly', () => {
    const sample = `14/06/2026, 20:31 - Alice: Hello
this is another line
and another line
14/06/2026, 20:32 - Bob: Got it`;

    const chat = parseWhatsAppExport(sample);
    expect(chat.messages).toHaveLength(2);
    expect(chat.messages[0].text).toBe('Hello\nthis is another line\nand another line');
    expect(chat.messages[1].text).toBe('Got it');
  });

  it('detects system messages without senders', () => {
    const sample = `14/06/2026, 20:00 - Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
14/06/2026, 20:05 - Alice: Hey everyone!
14/06/2026, 20:06 - Sam created group "Weekend Trip"`;

    const chat = parseWhatsAppExport(sample);
    expect(chat.messages).toHaveLength(3);
    expect(chat.messages[0].isSystem).toBe(true);
    expect(chat.messages[0].type).toBe('system');
    expect(chat.messages[1].isSystem).toBe(false);
    expect(chat.messages[1].sender).toBe('Alice');
    expect(chat.messages[2].isSystem).toBe(true);
  });

  it('handles colons and hyphens inside message text', () => {
    const sample = `14/06/2026, 21:07 - Alice: Note: meeting starts at 10:00 - don't be late!`;

    const chat = parseWhatsAppExport(sample);
    expect(chat.messages).toHaveLength(1);
    expect(chat.messages[0].sender).toBe('Alice');
    expect(chat.messages[0].text).toBe("Note: meeting starts at 10:00 - don't be late!");
  });

  it('detects media references (images, videos, audio, docs, stickers)', () => {
    const sample = `14/06/2026, 21:00 - Alice: IMG-20260614-WA0001.jpg (file attached)
14/06/2026, 21:01 - Bob: VID-20260614-WA0002.mp4 (file attached)
14/06/2026, 21:02 - Alice: AUD-20260614-WA0003.opus (file attached)
14/06/2026, 21:03 - Bob: Report.pdf (file attached)
14/06/2026, 21:04 - Alice: STK-20260614-WA0005.webp (file attached)
14/06/2026, 21:05 - Bob: <Media omitted>`;

    const chat = parseWhatsAppExport(sample);
    expect(chat.messages[0].type).toBe('image');
    expect(chat.messages[0].mediaFilename).toBe('IMG-20260614-WA0001.jpg');

    expect(chat.messages[1].type).toBe('video');
    expect(chat.messages[1].mediaFilename).toBe('VID-20260614-WA0002.mp4');

    expect(chat.messages[2].type).toBe('audio');
    expect(chat.messages[2].mediaFilename).toBe('AUD-20260614-WA0003.opus');

    expect(chat.messages[3].type).toBe('document');
    expect(chat.messages[3].mediaFilename).toBe('Report.pdf');

    expect(chat.messages[4].type).toBe('sticker');
    expect(chat.messages[4].mediaFilename).toBe('STK-20260614-WA0005.webp');

    expect(chat.messages[5].type).toBe('unknown-media');
  });

  it('handles unicode characters and emojis in sender names and message body', () => {
    const sample = `14/06/2026, 21:00 - Priya 🌸: Namaste! 🙏 Hindi: नमस्ते, how are you?
14/06/2026, 21:01 - Alex (Co-worker): All good 👍! 🔥🎉`;

    const chat = parseWhatsAppExport(sample);
    expect(chat.messages).toHaveLength(2);
    expect(chat.messages[0].sender).toBe('Priya 🌸');
    expect(chat.messages[0].text).toContain('Namaste! 🙏 Hindi: नमस्ते');
    expect(chat.messages[1].sender).toBe('Alex (Co-worker)');
  });

  it('normalizes media filenames accurately', () => {
    expect(normalizeMediaFilename('folder/subfolder/IMG_123.JPG')).toBe('img_123.jpg');
    expect(normalizeMediaFilename('\\Windows\\Path\\Doc.pdf')).toBe('doc.pdf');
  });
});
