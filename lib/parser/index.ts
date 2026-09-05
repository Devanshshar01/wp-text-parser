import { Message, MessageType, ParsedChat, ChatStats, ReplyReference } from '../../types';

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
 * Handles LRM (\u200e), RLM (\u200f), BOM (\ufeff) invisible Unicode prefix characters from iOS exports.
 */
export function parseMessageHeaderLine(line: string): HeaderMatch | null {
  const cleaned = line.replace(/^[\u200e\u200f\u200b-\u200d\ufeff]+/g, '');
  if (cleaned.length < 10) return null;

  const firstChar = cleaned.charCodeAt(0);

  // 1. iOS style starting with '['
  if (firstChar === 91) { // '['
    const iosBracketMatch = cleaned.match(/^\[(\d{1,4}[./\-]\d{1,2}[./\-]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\]\s*(.*)$/);
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
    const standardMatch = cleaned.match(/^(\d{1,4}[./\-]\d{1,2}[./\-]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap]\.?\s*[Mm]\.?)?)\s*[-~–—]\s*(.*)$/);
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
      year = dateParts[2];
      if (year < 100) year += 2000;

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

export function detectMediaTypeAndFilename(text: string): {
  type: MessageType;
  filename?: string;
  filenames?: string[];
} {
  const allMedia = extractAllMediaFilenames(text);
  if (allMedia.length === 0) {
    if (/^<media omitted>$/i.test(text.trim()) || /<medien ausgeschlossen>/i.test(text.trim())) {
      return { type: 'unknown-media' };
    }
    return { type: 'text' };
  }

  const filenames = allMedia.map((m) => m.filename);
  return {
    type: allMedia[0].type,
    filename: filenames[0],
    filenames: filenames.length > 1 ? filenames : undefined,
  };
}

export function extractAllMediaFilenames(text: string): { type: MessageType; filename: string }[] {
  const results: { type: MessageType; filename: string }[] = [];
  const regex = /([^\s()"'`]+\.[a-zA-Z0-9]{2,5})\s*\(file attached\)|<attached:\s*([^\s>]+)>|\[([^\s\]()]+\.[a-zA-Z0-9]{2,5})\]\s*\(file attached\)/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const fn = match[1] || match[2] || match[3];
    if (fn) {
      results.push({
        filename: fn,
        type: getMediaTypeFromFilename(fn),
      });
    }
  }

  if (results.length === 0) {
    const trimmed = text.trim();
    const directFileMatch = trimmed.match(/^([a-zA-Z0-9_\-\s.]+\.(?:jpg|jpeg|png|gif|webp|mp4|m4v|mov|mkv|3gp|mp3|ogg|opus|wav|m4a|pdf|doc|docx|txt|zip|vcf))$/i);
    if (directFileMatch) {
      const fn = directFileMatch[1].trim();
      results.push({
        filename: fn,
        type: getMediaTypeFromFilename(fn),
      });
    }
  }

  return results;
}

export function getMediaTypeFromFilename(filename: string): MessageType {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    const lower = filename.toLowerCase();
    if (lower.includes('sticker') || lower.startsWith('stk')) {
      return 'sticker';
    }
    return 'image';
  }
  if (['mp4', 'm4v', 'mov', 'mkv', '3gp', 'webm'].includes(ext)) {
    return 'video';
  }
  if (['mp3', 'ogg', 'opus', 'wav', 'm4a', 'aac'].includes(ext)) {
    return 'audio';
  }
  if (['pdf', 'doc', 'docx', 'txt', 'zip', 'csv', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
    return 'document';
  }
  return 'unknown-media';
}

/**
 * Extract quote / reply information if explicitly present in message text.
 * Handles `> Quoted line` markdown blocks, `> Sender: message`, or `[Date, Time] Sender: Message`.
 */
export function extractReplyInfo(text: string): {
  replyTo?: ReplyReference;
  bodyText: string;
} {
  const lines = text.split('\n');
  const quoteLines: string[] = [];
  const bodyLines: string[] = [];

  let inQuote = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (inQuote && line.trim().startsWith('>')) {
      quoteLines.push(line.trim().replace(/^>\s*/, ''));
    } else {
      inQuote = false;
      bodyLines.push(line);
    }
  }

  if (quoteLines.length === 0) {
    return { bodyText: text };
  }

  const rawQuote = quoteLines.join('\n').trim();
  let quotedSender: string | undefined;
  let quotedText = rawQuote;

  // Check if quote starts with `Sender: text` or `[Date, Time] Sender: text`
  const bracketSenderMatch = rawQuote.match(/^(?:\[[^\]]+\]\s*)?([^:\n]+):\s*([\s\S]*)$/);
  if (bracketSenderMatch && bracketSenderMatch[1].length < 50) {
    quotedSender = bracketSenderMatch[1].trim();
    quotedText = bracketSenderMatch[2].trim();
  }

  const mediaInfo = detectMediaTypeAndFilename(quotedText);

  return {
    replyTo: {
      quotedSender,
      quotedText,
      quotedMediaType: mediaInfo.type !== 'text' ? mediaInfo.type : undefined,
    },
    bodyText: bodyLines.join('\n').trim(),
  };
}

export function parseBodyContent(body: string): {
  sender?: string;
  isSystem: boolean;
  text: string;
  type: MessageType;
  mediaFilename?: string;
  mediaFilenames?: string[];
  replyTo?: ReplyReference;
} {
  const colonIdx = body.indexOf(':');

  // No colon = System message (e.g. "Messages and calls are end-to-end encrypted", "Alex created group...")
  if (colonIdx === -1) {
    return {
      isSystem: true,
      text: body,
      type: 'system',
    };
  }

  const possibleSender = body.slice(0, colonIdx).trim();
  const textContent = body.slice(colonIdx + 1).trim();

  // If text before colon is longer than typical sender names or looks like a system header line without sender
  const isSystemPhraseWithoutSender =
    body.startsWith('Messages and calls are end-to-end encrypted') ||
    body.startsWith('Security code changed') ||
    body.startsWith('You deleted this message') ||
    body.startsWith('This message was deleted');

  if (!possibleSender || possibleSender.length > 50 || isSystemPhraseWithoutSender) {
    return {
      isSystem: true,
      text: body,
      type: 'system',
    };
  }

  const { replyTo, bodyText } = extractReplyInfo(textContent);
  const mediaInfo = detectMediaTypeAndFilename(bodyText.length > 0 ? bodyText : textContent);

  return {
    sender: possibleSender,
    isSystem: false,
    text: textContent,
    type: mediaInfo.type,
    mediaFilename: mediaInfo.filename,
    mediaFilenames: mediaInfo.filenames,
    replyTo,
  };
}

function generateMessageId(index: number, timestamp: Date): string {
  return `m_${index}_${timestamp.getTime()}`;
}

export function parseWhatsAppExport(rawText: string): ParsedChat {
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
    mediaFilenames?: string[];
    replyTo?: ReplyReference;
    rawLines: string[];
  } | null = null;

  const pushMessage = (builder: typeof currentMsgBuilder) => {
    if (!builder) return;
    const fullText = builder.textLines.join('\n');
    const msgId = generateMessageId(messages.length, builder.timestamp);

    let replyTo = builder.replyTo;
    if (!replyTo) {
      // Re-check full text for reply quotes if line-buffered text had quotes
      const replyCheck = extractReplyInfo(fullText);
      if (replyCheck.replyTo) {
        replyTo = replyCheck.replyTo;
      }
    }

    // Try linking replyTo targetMessageId to an earlier message
    if (replyTo && replyTo.quotedText) {
      const targetText = replyTo.quotedText.toLowerCase().trim();
      const targetSender = replyTo.quotedSender?.toLowerCase().trim();

      for (let i = messages.length - 1; i >= 0; i--) {
        const prev = messages[i];
        if (targetSender && prev.sender?.toLowerCase().trim() !== targetSender) {
          continue;
        }
        if (prev.text && prev.text.toLowerCase().includes(targetText.slice(0, 30))) {
          replyTo.targetMessageId = prev.id;
          break;
        }
      }
    }

    messages.push({
      id: msgId,
      timestamp: builder.timestamp,
      sender: builder.sender,
      text: fullText,
      type: builder.type,
      mediaFilename: builder.mediaFilename,
      replyTo,
      isSystem: builder.isSystem,
      raw: builder.rawLines.join('\n'),
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cleanedLine = line.replace(/^[\u200e\u200f\u200b-\u200d\ufeff]+/g, '');

    const headerMatch = parseMessageHeaderLine(cleanedLine);

    if (headerMatch) {
      if (currentMsgBuilder) {
        pushMessage(currentMsgBuilder);
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
        mediaFilenames: parsedBody.mediaFilenames,
        replyTo: parsedBody.replyTo,
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
    pushMessage(currentMsgBuilder);
  }

  const participants = Array.from(participantsSet);
  const isGroup = participants.length > 2;
  const title = isGroup
    ? `Group Chat (${participants.length} participants)`
    : participants.length > 0
    ? participants.join(' & ')
    : 'WhatsApp Chat';

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
    replyCount: 0,
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

    if (m.replyTo) {
      stats.replyCount++;
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
