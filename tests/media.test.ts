import { describe, it, expect } from 'vitest';
import { isPathSafe } from '../lib/media';
import { getSampleChatData } from '../lib/sample';

describe('Zip & Media Security Functions', () => {
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
});
