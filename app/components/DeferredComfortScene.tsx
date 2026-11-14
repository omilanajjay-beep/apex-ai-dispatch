'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const ComfortScene = dynamic(() => import('./ComfortScene'), { ssr: false });

/** The visible hero is CSS-driven; decorative WebGL is only needed farther down. */
export default function DeferredComfortScene() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const target = document.getElementById('services');
    if (!target) return;
    if (typeof IntersectionObserver === 'undefined') { setReady(true); return; }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setReady(true);
        observer.disconnect();
      }
    }, { rootMargin: '700px 0px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  return ready ? <ComfortScene /> : null;
}
