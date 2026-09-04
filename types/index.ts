export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'system'
  | 'unknown-media';

export interface Message {
  id: string;
  timestamp: Date;
  sender?: string;
  text?: string;
  type: MessageType;
  mediaFilename?: string;
  mediaUrl?: string;
  mediaMimeType?: string;
  mediaSize?: number;
  isSystem?: boolean;
  raw?: string;
}

export interface ChatStats {
  totalMessages: number;
  textMessages: number;
  mediaCount: number;
  imageCount: number;
  videoCount: number;
  audioCount: number;
  documentCount: number;
  stickerCount: number;
  systemCount: number;
  participantCounts: Record<string, number>;
  firstMessageDate: Date | null;
  lastMessageDate: Date | null;
}

export interface ParsedChat {
  messages: Message[];
  participants: string[];
  title: string;
  isGroup: boolean;
  stats: ChatStats;
  warnings?: string[];
  mediaFiles?: Record<string, File | Blob>;
}

export interface RawMediaFile {
  name: string;
  blob: Blob;
  mimeType: string;
}
