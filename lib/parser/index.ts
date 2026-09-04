import { Message, MessageType, ParsedChat, ChatStats } from '../../types';

interface HeaderMatch {
  dateStr: string;
  timeStr: string;
  body: string;
}

export function normalizeMediaFilename(name: string): string {
  const basename = name.split(/[/\\]/).pop() || name;
  return basename.trim().toLowerCase();
}

/**
 * Fast header matching with initial character fast-guards to avoid running regexes on every continuation line.
 */
export function parseMessageHeaderLine(line: string): HeaderMatch | null {
  if (line.length < 10) return null;

  const firstChar = line.charCodeAt(0);

  // 1. iOS style starting with '['
  if (firstChar === 91) { // '['
    const iosBracketMatch = line.match(/^\[(\d{1,4}[./\-]\d{1,2}[./\-]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\]\s*(.*)$/);
    if (iosBracketMatch) {
      return {
        dateStr: iosBracketMatch[1],
        timeStr: iosBracketMatch[2],
        body: iosBracketMatch[3],
      };
    }
  }

  // 2. Standard / Android style starting with digit (0-9)
  if (firstChar >= 48 && firstChar <= 57) {
    const standardMatch = line.match(/^(\d{1,4}[./\-]\d{1,2}[./\-]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap]\.?\s*[Mm]\.?)?)\s*[-~–—]\s*(.*)$/);
    if (standardMatch) {
      return {
        dateStr: standardMatch[1],
        timeStr: standardMatch[2],
        body: standardMatch[3],
      };
    }
  }

  return null;
}

export function parseWhatsAppDateTime(dateStr: string, timeStr: string): Date {
  const cleanDate = dateStr.replace(/\./g, '/').replace(/-/g, '/');
  const dateParts = cleanDate.split('/').map((p) => parseInt(p, 10));

  let year = 2000;
  let month = 1;
  let day = 1;

  if (dateParts.length === 3) {
    if (dateParts[0] > 1000) {
      year = dateParts[0];
      month = dateParts[1];
      day = dateParts[2];
    } else {
      if (dateParts[2] > 31) {
        year = dateParts[2];
        if (dateParts[2] < 100) year += 2000;
      }
      if (dateParts[0] > 12) {
        day = dateParts[0];
        month = dateParts[1];
      } else if (dateParts[1] > 12) {
        month = dateParts[0];
        day = dateParts[1];
      } else {
        day = dateParts[0];
        month = dateParts[1];
      }
    }
  }

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  const timeNormalized = timeStr.trim().toUpperCase();
  const isPM = timeNormalized.includes('PM') || timeNormalized.includes('P.M.');
  const isAM = timeNormalized.includes('AM') || timeNormalized.includes('A.M.');

  const timeOnly = timeNormalized.replace(/[^\d:]/g, '');
  const timeParts = timeOnly.split(':').map((p) => parseInt(p, 10));

  if (timeParts.length >= 2) {
    hours = timeParts[0];
    minutes = timeParts[1];
    if (timeParts.length >= 3) {
      seconds = timeParts[2];
    }

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
  }

  const dateObj = new Date(year, month - 1, day, hours, minutes, seconds);
  if (isNaN(dateObj.getTime())) {
    return new Date();
  }
  return dateObj;
}

export function parseBodyContent(body: string): {
  sender?: string;
  isSystem: boolean;
  text: string;
  type: MessageType;
  mediaFilename?: string;
} {
  const colonIdx = body.indexOf(':');

  const isSystemNotice =
    body.includes('Messages and calls are end-to-end encrypted') ||
    body.includes('created group') ||
    body.includes('added') ||
    body.includes('removed') ||
    body.includes('left') ||
    body.includes('changed the group') ||
    body.includes('changed the subject') ||
    body.includes('changed this group') ||
    body.includes('Security code changed') ||
    body.includes('You deleted this message') ||
    body.includes('This message was deleted') ||
    body.includes('disappearing messages');

  if (colonIdx === -1 || (isSystemNotice && !body.slice(0, colonIdx).includes(' '))) {
    return {
      isSystem: true,
      text: body,
      type: 'system',
    };
  }

  const possibleSender = body.slice(0, colonIdx).trim();
  const textContent = body.slice(colonIdx + 1).trim();

  if (!possibleSender || possibleSender.length > 50) {
    return {
      isSystem: true,
      text: body,
      type: 'system',
    };
  }

  const mediaInfo = detectMediaTypeAndFilename(textContent);

  return {
    sender: possibleSender,
    isSystem: false,
    text: textContent,
    type: mediaInfo.type,
    mediaFilename: mediaInfo.filename,
  };
}

export function detectMediaTypeAndFilename(text: string): {
  type: MessageType;
  filename?: string;
} {
  const trimmed = text.trim();

  const attachedMatch =
    trimmed.match(/^([^\s()]+\.[a-zA-Z0-9]{2,5})\s*\(file attached\)$/i) ||
    trimmed.match(/^<attached:\s*([^\s>]+)>/i) ||
    trimmed.match(/^(?:\[|\()?([^\s\]()]+\.[a-zA-Z0-9]{2,5})(?:\]|\))?\s*\(file attached\)$/i);

  let filename = attachedMatch ? attachedMatch[1] : undefined;

  if (!filename) {
    const directFileMatch = trimmed.match(/^([a-zA-Z0-9_\-\s.]+\.(?:jpg|jpeg|png|gif|webp|mp4|m4v|mov|mkv|3gp|mp3|ogg|opus|wav|m4a|pdf|doc|docx|txt|zip|vcf))$/i);
    if (directFileMatch) {
      filename = directFileMatch[1].trim();
    }
  }

  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      const lower = filename.toLowerCase();
      if (lower.includes('sticker') || lower.startsWith('stk')) {
        return { type: 'sticker', filename };
      }
      return { type: 'image', filename };
    }
    if (['mp4', 'm4v', 'mov', 'mkv', '3gp', 'webm'].includes(ext)) {
      return { type: 'video', filename };
    }
    if (['mp3', 'ogg', 'opus', 'wav', 'm4a', 'aac'].includes(ext)) {
      return { type: 'audio', filename };
    }
    if (['pdf', 'doc', 'docx', 'txt', 'zip', 'csv', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
      return { type: 'document', filename };
    }
    return { type: 'unknown-media', filename };
  }

  if (/^<media omitted>$/i.test(trimmed) || /<medien ausgeschlossen>/i.test(trimmed)) {
    return { type: 'unknown-media' };
  }

  return { type: 'text' };
}

function generateMessageId(index: number, timestamp: Date): string {
  return `m_${index}_${timestamp.getTime()}`;
}

export function parseWhatsAppExport(rawText: string): ParsedChat {
  // Split efficiently without regex overhead
  const lines = rawText.split(/\r?\n/);

  const messages: Message[] = [];
  const participantsSet = new Set<string>();
  const warnings: string[] = [];

  let currentMsgBuilder: {
    timestamp: Date;
    sender?: string;
    isSystem: boolean;
    textLines: string[];
    type: MessageType;
    mediaFilename?: string;
    rawLines: string[];
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Strip invisible BOM / zero width spaces
    const cleanedLine = line.charCodeAt(0) === 0xfeff ? line.slice(1) : line;

    const headerMatch = parseMessageHeaderLine(cleanedLine);

    if (headerMatch) {
      if (currentMsgBuilder) {
        const fullText = currentMsgBuilder.textLines.join('\n');
        messages.push({
          id: generateMessageId(messages.length, currentMsgBuilder.timestamp),
          timestamp: currentMsgBuilder.timestamp,
          sender: currentMsgBuilder.sender,
          text: fullText,
          type: currentMsgBuilder.type,
          mediaFilename: currentMsgBuilder.mediaFilename,
          isSystem: currentMsgBuilder.isSystem,
          raw: currentMsgBuilder.rawLines.join('\n'),
        });
      }

      const timestamp = parseWhatsAppDateTime(headerMatch.dateStr, headerMatch.timeStr);
      const parsedBody = parseBodyContent(headerMatch.body);

      if (parsedBody.sender) {
        participantsSet.add(parsedBody.sender);
      }

      currentMsgBuilder = {
        timestamp,
        sender: parsedBody.sender,
        isSystem: parsedBody.isSystem,
        textLines: [parsedBody.text],
        type: parsedBody.type,
        mediaFilename: parsedBody.mediaFilename,
        rawLines: [line],
      };
    } else if (currentMsgBuilder) {
      currentMsgBuilder.textLines.push(line);
      currentMsgBuilder.rawLines.push(line);
    } else if (line.trim().length > 0) {
      warnings.push(`Skipped non-header line: "${line}"`);
    }
  }

  if (currentMsgBuilder) {
    const fullText = currentMsgBuilder.textLines.join('\n');
    messages.push({
      id: generateMessageId(messages.length, currentMsgBuilder.timestamp),
      timestamp: currentMsgBuilder.timestamp,
      sender: currentMsgBuilder.sender,
      text: fullText,
      type: currentMsgBuilder.type,
      mediaFilename: currentMsgBuilder.mediaFilename,
      isSystem: currentMsgBuilder.isSystem,
      raw: currentMsgBuilder.rawLines.join('\n'),
    });
  }

  const participants = Array.from(participantsSet);
  const isGroup = participants.length > 2;
  const title = isGroup
    ? `Group Chat (${participants.length} participants)`
    : participants.length > 0
    ? participants.join(' & ')
    : 'WhatsApp Chat';

  // Single pass statistics computation
  const stats: ChatStats = {
    totalMessages: messages.length,
    textMessages: 0,
    mediaCount: 0,
    imageCount: 0,
    videoCount: 0,
    audioCount: 0,
    documentCount: 0,
    stickerCount: 0,
    systemCount: 0,
    participantCounts: {},
    firstMessageDate: messages.length > 0 ? messages[0].timestamp : null,
    lastMessageDate: messages.length > 0 ? messages[messages.length - 1].timestamp : null,
  };

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];

    if (m.sender) {
      stats.participantCounts[m.sender] = (stats.participantCounts[m.sender] || 0) + 1;
    }

    if (m.isSystem) {
      stats.systemCount++;
    }

    switch (m.type) {
      case 'text':
        stats.textMessages++;
        break;
      case 'image':
        stats.imageCount++;
        stats.mediaCount++;
        break;
      case 'video':
        stats.videoCount++;
        stats.mediaCount++;
        break;
      case 'audio':
        stats.audioCount++;
        stats.mediaCount++;
        break;
      case 'document':
        stats.documentCount++;
        stats.mediaCount++;
        break;
      case 'sticker':
        stats.stickerCount++;
        stats.mediaCount++;
        break;
      case 'unknown-media':
        stats.mediaCount++;
        break;
    }
  }

  return {
    messages,
    participants,
    title,
    isGroup,
    stats,
    warnings,
  };
}
