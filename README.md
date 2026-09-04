# WhatsApp Chat Archive Viewer

A client-side, local-first web application to view exported WhatsApp conversations in a familiar, modern chat interface.

Upload your exported `.txt` chat or `.zip` archive (containing images, videos, voice notes, and documents) and browse your conversation with full privacy.

---

## Key Features

- 🔒 **100% Client-Side Privacy**: All processing happens locally in your browser. No data or media is uploaded to any server or third-party service.
- 📁 **TXT & ZIP Import**: Supports both standalone WhatsApp export `.txt` files and `.zip` archives containing attached media files.
- 📱 **WhatsApp-Inspired Interface**: Renders message bubbles, incoming/outgoing message visual alignment, date headers ("TODAY", "YESTERDAY", formatted dates), and system messages.
- 👥 **Participant Identification**: "Who are you in this chat?" selector to align your messages on the right and other participants on the left.
- 🔍 **Message Search**: In-memory message search covering text, sender names, and attachment filenames with next/previous match navigation.
- 📅 **Date Jump Navigation**: Easily jump directly to specific conversation dates without manual scrolling.
- 🖼️ **Media Lightbox & Gallery**: Fullscreen image and video lightbox preview, native audio note controls, document cards, and a dedicated Media Gallery tab.
- 📊 **Chat Statistics & Info**: View message breakdowns, participant activity charts, and first/latest message timestamps.
- 🌓 **Dark Mode Support**: Light and dark theme switching.
- 🚀 **Sample Chat Mode**: Includes a synthetic demo chat for instant local demonstration.

---

## Supported WhatsApp Export Formats

The parser supports common WhatsApp export header formats:

1. **Android Standard 24-Hour**: `14/06/2026, 21:07 - Alice: Hello`
2. **Android 12-Hour AM/PM**: `14/06/2026, 9:07 pm - Alice: Hello`
3. **iOS Bracket Format**: `[14/06/2026, 21:07:05] Alice: Hello` or `[14.06.26, 21:07] Alice: Hello`
4. **Multiline Messages**: Multi-line messages are preserved as single cohesive messages.
5. **System Notices**: Group creations, participant additions/removals, and encryption notices are rendered as system event bubbles.
6. **Emojis & Unicode**: Full support for emojis and international scripts (e.g. Hindi, English, accented text).

---

## Privacy Architecture

- **No Backend**: There are no API endpoints that receive uploaded chat files.
- **No Remote Storage**: Chat contents are processed in browser memory and temporary Object URLs.
- **Auto Memory Cleanup**: Object URLs (`URL.revokeObjectURL`) are automatically revoked when loading another chat or clearing data.

---

## What This Application Cannot Do

To set clear expectations:
- **Cannot recover deleted messages**: It can only display messages present in the uploaded export file.
- **Cannot restore chats into WhatsApp**: This is an archive viewer and cannot re-import messages back into the official WhatsApp application.
- **Cannot fetch missing media**: Media not included in the uploaded ZIP file cannot be rendered; graceful fallback placeholders will be shown instead.
- **Cannot fabricate live status**: It does not show live "online" status, read receipts (blue ticks), or typing indicators.

---

## Local Development

### Prerequisites

- Node.js 18+ or 20+
- npm

### Instructions

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Run local development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running Tests

Run unit tests with Vitest:
```bash
npm test
```

Run TypeScript checking & linting:
```bash
npx tsc --noEmit
npm run lint
```

---

## Deployment to Vercel

This application is a static/Next.js App Router application with no server secrets or environment variables required.

1. Push code to GitHub.
2. Import the repository in [Vercel](https://vercel.com/).
3. Deploy with default Next.js build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
