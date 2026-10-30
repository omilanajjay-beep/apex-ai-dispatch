import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Apex AI | Architectural Climate Systems',
  description: 'Thoughtful heat-pump systems, service and contractor partnerships—considered as part of the architecture, not an afterthought.',
  applicationName: 'Apex AI',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://apex-ai-dispatch.onrender.com'),
  alternates: { canonical: '/' },
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Apex AI | Architectural Climate Systems',
    description: 'Comfort, quietly perfected.',
    type: 'website',
    siteName: 'Apex AI',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0c',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
