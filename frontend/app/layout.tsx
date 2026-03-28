import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  weight: ['400', '500', '600'],
});

export const viewport: Viewport = {
  themeColor: '#0a0f1a',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'ContentAI - AI Marketing Automation Platform',
  description: 'Automate your marketing with AI-powered multi-agent content generation. Create compliant LinkedIn and Twitter posts in seconds with brand governance built-in.',
  keywords: ['AI', 'marketing automation', 'content generation', 'LinkedIn', 'Twitter', 'social media', 'multi-agent AI'],
  authors: [{ name: 'ContentAI' }],
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
