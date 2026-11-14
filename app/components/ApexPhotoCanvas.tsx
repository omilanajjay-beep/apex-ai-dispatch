'use client';

import { useEffect, useRef } from 'react';
import type { RefObject, MutableRefObject } from 'react';
import styles from './ApexPhotoCanvas.module.css';

type MotionState = { zoom: number; pixel: number };
type Stamp = { x: number; y: number; born: number; strength: number };

type Props = {
  photo: HTMLImageElement | null;
  frameRef: RefObject<HTMLDivElement | null>;
  introActive: boolean;
  interactive: boolean;
  motionRef: MutableRefObject<MotionState>;
  drawRef: MutableRefObject<(() => void) | null>;
};

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function clipPhoto(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  const top = Math.min(width * 0.32, height * 0.44, 170);
  const bottom = Math.min(width * 0.035, 24);
  ctx.beginPath();
  ctx.moveTo(x + top, y);
  ctx.lineTo(x + width - top, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + top);
  ctx.lineTo(x + width, y + height - bottom);
  ctx.quadraticCurveTo(x + width, y + height, x + width - bottom, y + height);
  ctx.lineTo(x + bottom, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - bottom);
  ctx.lineTo(x, y + top);
  ctx.quadraticCurveTo(x, y, x + top, y);
  ctx.closePath();
  ctx.clip();
}

export default function ApexPhotoCanvas({ photo, frameRef, introActive, interactive, motionRef, drawRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !ctx || !photo) {
      drawRef.current = null;
      return;
    }

    let rafId = 0;
    let cssWidth = 0;
    let cssHeight = 0;
    let dpr = 1;
    let lastX = -1000;
    let lastY = -1000;
    const stamps: Stamp[] = [];
    const warmCanvas = document.createElement('canvas');
    const warmCtx = warmCanvas.getContext('2d');
    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d');
    const pixelCanvas = document.createElement('canvas');
    const pixelCtx = pixelCanvas.getContext('2d');
    if (!warmCtx || !maskCtx || !pixelCtx) return;

    const schedule = () => {
      if (!rafId) rafId = window.requestAnimationFrame(render);
    };

    const resizeCanvases = (width: number, height: number) => {
      cssWidth = width;
      cssHeight = height;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const pixelWidth = Math.max(1, Math.round(width * dpr));
      const pixelHeight = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        warmCanvas.width = pixelWidth;
        warmCanvas.height = pixelHeight;
        maskCanvas.width = Math.max(1, Math.round(pixelWidth * 0.5));
        maskCanvas.height = Math.max(1, Math.round(pixelHeight * 0.5));
      }
    };

    const render = () => {
      rafId = 0;
      const canvasRect = canvas.getBoundingClientRect();
      if (canvasRect.width === 0 || canvasRect.height === 0) return;
      if (canvasRect.width !== cssWidth || canvasRect.height !== cssHeight) resizeCanvases(canvasRect.width, canvasRect.height);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const frameRect = frameRef.current?.getBoundingClientRect();
      if (!frameRect || frameRect.width === 0 || frameRect.height === 0) return;
      const x = frameRect.left - canvasRect.left;
      const y = frameRect.top - canvasRect.top;
      const width = frameRect.width;
      const height = frameRect.height;
      let active = introActive;

      if (introActive) {
        const block = Math.max(1, Math.round(motionRef.current.pixel));
        const lowWidth = Math.max(1, Math.round(canvas.width / block));
        const lowHeight = Math.max(1, Math.round(canvas.height / block));
        if (pixelCanvas.width !== lowWidth || pixelCanvas.height !== lowHeight) {
          pixelCanvas.width = lowWidth;
          pixelCanvas.height = lowHeight;
        }
        pixelCtx.setTransform(lowWidth / canvasRect.width, 0, 0, lowHeight / canvasRect.height, 0, 0);
        pixelCtx.clearRect(0, 0, canvasRect.width, canvasRect.height);
        pixelCtx.save();
        clipPhoto(pixelCtx, x, y, width, height);
        const zoom = motionRef.current.zoom;
        const zoomWidth = width * zoom;
        const zoomHeight = height * zoom;
        drawCover(pixelCtx, photo, x + (width - zoomWidth) / 2, y + (height - zoomHeight) / 2, zoomWidth, zoomHeight);
        pixelCtx.restore();
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(pixelCanvas, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      } else if (stamps.length) {
        const now = performance.now() / 1000;
        for (let index = stamps.length - 1; index >= 0; index--) {
          if (now - stamps[index].born > 1.15) stamps.splice(index, 1);
        }
        if (stamps.length) {
          maskCtx.setTransform(1, 0, 0, 1, 0, 0);
          maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
          const maskScale = dpr * 0.5;
          maskCtx.setTransform(maskScale, 0, 0, maskScale, 0, 0);
          const radius = Math.min(190, Math.max(95, width * 0.29));
          for (const stamp of stamps) {
            const alpha = stamp.strength * Math.exp(-(now - stamp.born) / 0.48);
            if (alpha < 0.004) continue;
            const gradient = maskCtx.createRadialGradient(stamp.x, stamp.y, 0, stamp.x, stamp.y, radius);
            gradient.addColorStop(0, 'rgba(0,0,0,1)');
            gradient.addColorStop(0.45, 'rgba(0,0,0,0.85)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            maskCtx.globalAlpha = alpha;
            maskCtx.fillStyle = gradient;
            maskCtx.fillRect(stamp.x - radius, stamp.y - radius, radius * 2, radius * 2);
          }
          maskCtx.globalAlpha = 1;
          warmCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
          warmCtx.clearRect(0, 0, canvasRect.width, canvasRect.height);
          warmCtx.save();
          clipPhoto(warmCtx, x, y, width, height);
          warmCtx.filter = 'sepia(0.13) saturate(1.12) brightness(1.06)';
          drawCover(warmCtx, photo, x, y, width, height);
          warmCtx.restore();
          warmCtx.filter = 'none';
          warmCtx.setTransform(1, 0, 0, 1, 0, 0);
          warmCtx.globalCompositeOperation = 'destination-in';
          warmCtx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);
          warmCtx.globalCompositeOperation = 'source-over';
          ctx.drawImage(warmCanvas, 0, 0);
          active = stamps.length > 0;
        }
      }

      if (active) schedule();
    };

    const onMove = (event: MouseEvent) => {
      if (!interactive || introActive) return;
      const frameRect = frameRef.current?.getBoundingClientRect();
      if (!frameRect || event.clientX < frameRect.left || event.clientX > frameRect.right || event.clientY < frameRect.top || event.clientY > frameRect.bottom) return;
      const canvasRect = canvas.getBoundingClientRect();
      const x = event.clientX - canvasRect.left;
      const y = event.clientY - canvasRect.top;
      const distance = Math.hypot(x - lastX, y - lastY);
      if (distance > 12) {
        stamps.push({ x, y, born: performance.now() / 1000, strength: 0.58 });
        if (stamps.length > 100) stamps.splice(0, stamps.length - 100);
        lastX = x;
        lastY = y;
        schedule();
      }
    };
    const onLeave = () => { lastX = -1000; lastY = -1000; };
    const onResize = () => schedule();
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    resizeObserver?.observe(canvas);
    if (frameRef.current) resizeObserver?.observe(frameRef.current);
    window.addEventListener('resize', onResize, { passive: true });
    if (interactive) {
      window.addEventListener('mousemove', onMove, { passive: true });
      document.addEventListener('mouseleave', onLeave);
    }
    drawRef.current = schedule;
    schedule();

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      if (drawRef.current === schedule) drawRef.current = null;
    };
  }, [photo, frameRef, introActive, interactive, motionRef, drawRef]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
