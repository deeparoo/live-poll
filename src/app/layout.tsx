import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LivePoll — Real-time Audience Polling',
  description: 'Instant live polling for large audiences. No app required.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080810] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
