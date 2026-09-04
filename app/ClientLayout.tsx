'use client';

import { ChatProvider } from '@/context/ChatContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ChatProvider>{children}</ChatProvider>;
}
