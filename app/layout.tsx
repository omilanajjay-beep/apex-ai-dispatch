import type { Metadata, Viewport } from 'next';
import './globals.css';
import './zip-template/styles/tokens.css';
import './zip-template/styles/global.css';

export const metadata: Metadata = {
  title: 'Apex AI Dispatch — Every thermal zone tells a story.',
  description: 'APEX AI transforms historical HVAC telemetry and climate data into structured dispatch decisions — without losing the story behind it.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://apex-ai-dispatch.vercel.app'),
  alternates: { canonical: '/' },
  icons: { icon: 'data:,' },
  openGraph: {
    title: 'Apex AI Dispatch — Every thermal zone tells a story.',
    description: 'APEX AI transforms historical HVAC telemetry and climate data into structured dispatch decisions — without losing the story behind it.',
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
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500&family=Instrument+Serif:ital@1&display=swap" rel="stylesheet" />
        <link rel="preload" as="fetch" href="/apex-hvac/base-mobile.webp" crossOrigin="anonymous" media="(max-width: 1023px)" />
        <link rel="preload" as="fetch" href="/apex-hvac/airflow-mobile.webp" crossOrigin="anonymous" media="(max-width: 1023px)" />
        <link rel="preload" as="fetch" href="/apex-hvac/base-desktop.webp" crossOrigin="anonymous" media="(min-width: 1024px)" />
        <link rel="preload" as="fetch" href="/apex-hvac/airflow-desktop.webp" crossOrigin="anonymous" media="(min-width: 1024px)" />
      </head>
      <body>{children}</body>
    </html>
  );
}
