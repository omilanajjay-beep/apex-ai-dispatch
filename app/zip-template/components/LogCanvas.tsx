import React, { useEffect, useRef } from 'react';
import styles from './LogCanvas.module.css';

interface LogCanvasProps {
  bareImg: HTMLImageElement | null;
  mossImg: HTMLImageElement | null;
  animRef: React.RefObject<{ zoom: number; pixel: number }>;
}

interface Stamp {
  x: number;
  y: number;
  strength: number;
  born: number;
}

export const LogCanvas: React.FC<LogCanvasProps> = ({ bareImg, mossImg, animRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const imgBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    const stamps: Stamp[] = [];
    let lastX = -1000;
    let lastY = -1000;
    let travel = 0;
    let isInside = false;

    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d');
    const layerCanvas = document.createElement('canvas');
    const layerCtx = layerCanvas.getContext('2d');
    const brushCanvas = document.createElement('canvas');
    const brushCtx = brushCanvas.getContext('2d');

    const updateBrush = (radius: number) => {
      const r = Math.round(radius * 0.5);
      const size = r * 2;
      brushCanvas.width = size;
      brushCanvas.height = size;
      if (!brushCtx) return;
      brushCtx.clearRect(0, 0, size, size);
      const grad = brushCtx.createRadialGradient(r, r, 0, r, r, r);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(0.45, 'rgba(0,0,0,0.85)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      brushCtx.fillStyle = grad;
      brushCtx.beginPath();
      brushCtx.arc(r, r, r, 0, Math.PI * 2);
      brushCtx.fill();
      return r;
    };

    let lastMouseTime = performance.now();
    let currentRadius = 240;

    const onMouseMove = (e: MouseEvent) => {
      isInside = true;
      lastMouseTime = performance.now();
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      if (lastX === -1000) {
        lastX = px;
        lastY = py;
      }
      const unit = probeRef.current ? probeRef.current.getBoundingClientRect().width / 100 : 1;
      const radius = currentRadius * unit;
      const step = radius * 0.12;

      const dx = px - lastX;
      const dy = py - lastY;
      const dist = Math.hypot(dx, dy);

      for (let d = step - travel; d <= dist; d += step) {
        stamps.push({
          x: lastX + (dx * d) / dist,
          y: lastY + (dy * d) / dist,
          strength: 0.5,
          born: performance.now() / 1000,
        });
      }
      travel = (travel + dist) % step;
      lastX = px;
      lastY = py;
    };

    const onMouseLeave = () => {
      isInside = false;
      stamps.length = 0;
    };

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);

    const stillInterval = setInterval(() => {
      if (isInside && performance.now() - lastMouseTime > 50) {
        stamps.push({
          x: lastX,
          y: lastY,
          strength: 0.25,
          born: performance.now() / 1000,
        });
      }
    }, 50);

    const render = () => {
      rafId = requestAnimationFrame(render);
      if (!canvas || !ctx || !bareImg || !mossImg) return;

      const heroW = canvas.clientWidth;
      const heroH = canvas.clientHeight;
      if (heroW === 0 || heroH === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== heroW * dpr || canvas.height !== heroH * dpr) {
        canvas.width = heroW * dpr;
        canvas.height = heroH * dpr;
        maskCanvas.width = Math.round(heroW * 0.5);
        maskCanvas.height = Math.round(heroH * 0.5);
        layerCanvas.width = heroW * dpr;
        layerCanvas.height = heroH * dpr;
      }

      const unit = probeRef.current ? probeRef.current.getBoundingClientRect().width / 100 : 1;
      const RADIUS = 240 * unit;
      const r = updateBrush(RADIUS) || 120;

      const now = performance.now() / 1000;
      const isTouch = window.matchMedia('(hover: none)').matches;

      if (maskCtx) {
        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        for (let i = stamps.length - 1; i >= 0; i--) {
          const s = stamps[i];
          const age = now - s.born;
          const a = s.strength * Math.exp(-age / 1.1);
          if (a < 0.004) {
            stamps.splice(i, 1);
            continue;
          }
          maskCtx.globalAlpha = a;
          maskCtx.drawImage(brushCanvas, s.x * 0.5 - r, s.y * 0.5 - r);
        }
        maskCtx.globalAlpha = 1;
      }

      const zoom = animRef.current?.zoom ?? 1;
      const pixelBlock = animRef.current?.pixel ?? 1;

      const boxRect = imgBoxRef.current
        ? imgBoxRef.current.getBoundingClientRect()
        : { left: 0, top: 0, width: heroW, height: heroH };
      const heroRect = canvas.getBoundingClientRect();
      const baseLeft = boxRect.left - heroRect.left;
      const baseTop = boxRect.top - heroRect.top;
      const baseW = boxRect.width;
      const baseH = boxRect.height;

      const cx = baseLeft + baseW / 2;
      const cy = baseTop + baseH / 2;
      const w = baseW * zoom;
      const h = baseH * zoom;
      const x0 = cx - w / 2;
      const y0 = cy - h / 2;

      let targetCtx = ctx;
      let targetCanvasW = canvas.width;
      let targetCanvasH = canvas.height;

      if (pixelBlock > 1) {
        targetCanvasW = Math.max(1, Math.round(canvas.width / pixelBlock));
        targetCanvasH = Math.max(1, Math.round(canvas.height / pixelBlock));
        if (layerCanvas.width !== targetCanvasW || layerCanvas.height !== targetCanvasH) {
          layerCanvas.width = targetCanvasW;
          layerCanvas.height = targetCanvasH;
        }
        const lCtx = layerCanvas.getContext('2d');
        if (lCtx) {
          lCtx.imageSmoothingEnabled = false;
          targetCtx = lCtx;
        }
      }

      targetCtx.setTransform(targetCanvasW / heroW, 0, 0, targetCanvasH / heroH, 0, 0);
      targetCtx.clearRect(0, 0, heroW, heroH);

      targetCtx.drawImage(bareImg, x0, y0, w, h);

      if (isTouch) {
        targetCtx.drawImage(mossImg, x0, y0, w, h);
      } else if (layerCtx && maskCanvas.width > 0) {
        layerCtx.save();
        layerCtx.globalCompositeOperation = 'source-over';
        layerCtx.drawImage(mossImg, x0, y0, w, h);
        layerCtx.globalCompositeOperation = 'destination-in';
        layerCtx.drawImage(maskCanvas, 0, 0, heroW, heroH);
        layerCtx.restore();
        targetCtx.drawImage(layerCanvas, 0, 0, heroW, heroH, 0, 0, heroW, heroH);
      }

      if (pixelBlock > 1) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(layerCanvas, 0, 0, targetCanvasW, targetCanvasH, 0, 0, canvas.width, canvas.height);
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(stillInterval);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [bareImg, mossImg, animRef]);

  return (
    <>
      <div ref={probeRef} className={styles.probe} />
      <div ref={clipRef} className={styles.clipBox}>
        <div ref={imgBoxRef} className={styles.imageBox} />
      </div>
      <canvas ref={canvasRef} className={styles.canvas} />
    </>
  );
};
