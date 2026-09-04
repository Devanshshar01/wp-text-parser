import { parseWhatsAppExport } from '../parser';
import { ParsedChat, Message } from '../../types';

export const SAMPLE_CHAT_TXT = `15/02/2026, 09:30 - Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
15/02/2026, 09:31 - Alex: Hey Sam! 👋 Are we still on for the design review meeting today?
15/02/2026, 09:32 - Sam: Morning Alex! Yes, absolutely. I finished updating the prototype frames last night.
15/02/2026, 09:33 - Sam: Here is a quick preview of the new dashboard wireframe:
15/02/2026, 09:33 - Sam: dashboard-preview.jpg (file attached)
15/02/2026, 09:35 - Alex: Wow, that looks really clean! 🚀
I especially like how the header navigation turned out.
Did you include the mobile layout specs as well?
15/02/2026, 09:36 - Sam: Thanks! Yes, I included full mobile specifications in this PDF document:
15/02/2026, 09:36 - Sam: Mobile-Design-Spec-v2.pdf (file attached)
15/02/2026, 09:38 - Alex: Perfect! I'll review it before 2 PM.
15/02/2026, 09:40 - Sam: Sounds great. I also recorded a short voice note walking through the interaction details:
15/02/2026, 09:41 - Sam: voice-note-walkthrough.opus (file attached)
15/02/2026, 09:45 - Alex: Awesome. See you on Google Meet at 2! 👍
15/02/2026, 14:00 - Sam created group "Project Launch Sync"
15/02/2026, 14:01 - Sam added Taylor
15/02/2026, 14:02 - Taylor: Hey everyone! Excited to join the project team.
15/02/2026, 14:05 - Alex: Welcome Taylor! We were just going over the mobile UI specs.`;

function createSVGDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

export function getSampleChatData(): { chat: ParsedChat; mediaMap: Record<string, string> } {
  const parsedChat = parseWhatsAppExport(SAMPLE_CHAT_TXT);

  const sampleDashboardSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none">
    <rect width="600" height="400" fill="#1e293b"/>
    <rect x="20" y="20" width="560" height="50" rx="8" fill="#334155"/>
    <circle cx="50" cy="45" r="15" fill="#10b981"/>
    <rect x="80" y="38" width="120" height="14" rx="4" fill="#94a3b8"/>
    <rect x="20" y="90" width="260" height="130" rx="8" fill="#0f172a"/>
    <rect x="300" y="90" width="280" height="130" rx="8" fill="#0f172a"/>
    <path d="M40 190 L90 140 L140 170 L200 120 L240 160" stroke="#10b981" stroke-width="4" fill="none"/>
    <text x="30" y="120" fill="#f8fafc" font-family="sans-serif" font-size="16" font-weight="bold">Dashboard Analytics Preview</text>
    <rect x="20" y="240" width="560" height="140" rx="8" fill="#0f172a"/>
    <text x="40" y="280" fill="#94a3b8" font-family="sans-serif" font-size="14">WhatsApp Archive Viewer - Sample Data</text>
  </svg>`;

  const dashboardImgUrl = createSVGDataUrl(sampleDashboardSvg);

  const mediaMap: Record<string, string> = {
    'dashboard-preview.jpg': dashboardImgUrl,
  };

  const updatedMessages = parsedChat.messages.map((m: Message) => {
    if (m.mediaFilename && mediaMap[m.mediaFilename.toLowerCase()]) {
      return {
        ...m,
        mediaUrl: mediaMap[m.mediaFilename.toLowerCase()],
      };
    }
    return m;
  });

  return {
    chat: {
      ...parsedChat,
      title: 'Alex, Sam & Taylor',
      messages: updatedMessages,
    },
    mediaMap,
  };
}
