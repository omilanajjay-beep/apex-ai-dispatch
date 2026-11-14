import type { Metadata, Viewport } from 'next';
import './globals.css';
import './experience.css';
import './apex-hero.css';

export const metadata: Metadata = {
  title: 'Apex AI | Home HVAC Care, Made Clear',
  description: 'Apex AI helps homeowners start clear conversations with HVAC professionals about comfort, service visits and the next step.',
  applicationName: 'Apex AI',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://apex-ai-dispatch.vercel.app'),
  alternates: { canonical: '/' },
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Apex AI | Home HVAC Care, Made Clear',
    description: 'A better HVAC conversation starts at home.',
    type: 'website',
    siteName: 'Apex AI',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#08111E',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head><link rel="preload" as="image" href="/apex-hvac-hero-1280.webp" imageSrcSet="/apex-hvac-hero-768.webp 768w, /apex-hvac-hero-1280.webp 1280w, /apex-hvac-hero-1920.webp 1920w, /apex-hvac-hero-2560.webp 2560w" imageSizes="100vw" fetchPriority="high" /></head><body>{children}</body></html>;
}
