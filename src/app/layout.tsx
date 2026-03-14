import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Thiruppam — The story is in your hands.',
  description: 'Listen to the drama unfold, and when the moment comes, you decide what happens next.',
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
