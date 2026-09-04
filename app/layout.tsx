import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from './ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WhatsApp Chat Archive Viewer',
  description: 'View your exported WhatsApp conversations in a familiar chat interface locally in your browser.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
