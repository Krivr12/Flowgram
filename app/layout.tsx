import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Flowgram — Real-Time Event Tracking',
  description: 'A real-time event tracking platform for admins and participants.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-white antialiased">{children}</body>
    </html>
  );
}
