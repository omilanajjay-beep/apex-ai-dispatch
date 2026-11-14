'use client';

import { useEffect, useRef } from 'react';
import styles from './ApexCursor.module.css';

export default function ApexCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let targetX = -100;
    let targetY = -100;
    let currentX = targetX;
    let currentY = targetY;
    let frame = 0;
    let visible = false;
    const cursor = cursorRef.current;
    if (!cursor) return;

    const move = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      visible = true;
      cursor.style.opacity = '1';
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const leave = () => { visible = false; cursor.style.opacity = '0'; };
    const tick = () => {
      const ease = 0.24;
      currentX += (targetX - currentX) * ease;
      currentY += (targetY - currentY) * ease;
      cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      if (Math.abs(targetX - currentX) > 0.25 || Math.abs(targetY - currentY) > 0.25) frame = requestAnimationFrame(tick);
      else frame = 0;
      if (!visible) cursor.style.opacity = '0';
    };

    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('mouseleave', leave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={cursorRef} className={styles.cursor} aria-hidden="true" />;
}
