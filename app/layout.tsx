import type { Metadata, Viewport } from 'next';
import './globals.css';
import './zip-template/styles/tokens.css';
import './zip-template/styles/global.css';

export const metadata: Metadata = {
  title: 'Apex AI — Autonomous Dispatch & Seamless Client Flow',
  description: 'HVAC dispatch intelligence and stronger client relationships. Explore Apex AI and arrange your next service visit with Elena and Cal.com.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://apex-ai-dispatch.vercel.app'),
  alternates: { canonical: '/' },
  icons: { icon: 'data:,' },
  openGraph: {
    title: 'Apex AI — Autonomous Dispatch & Seamless Client Flow',
    description: 'HVAC dispatch intelligence and stronger client relationships, with Elena and Cal.com booking.',
    type: 'website',
    siteName: 'Apex AI',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#071017',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Instrument+Sans:wght@400;500&family=Instrument+Serif:ital@1&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
