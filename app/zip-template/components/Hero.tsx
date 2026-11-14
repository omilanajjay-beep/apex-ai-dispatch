import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Nav } from './Nav';
import { LogCanvas } from './LogCanvas';
import { fetchImageWithProgress } from '../lib/loadImages';
import styles from './Hero.module.css';

export const Hero: React.FC = () => {
  const [bareImg, setBareImg] = useState<HTMLImageElement | null>(null);
  const [mossImg, setMossImg] = useState<HTMLImageElement | null>(null);
  const [counterVal, setCounterVal] = useState(0);

  const navRef = useRef<HTMLElement | null>(null);
  const h1Ref = useRef<HTMLHeadingElement | null>(null);
  const leadRef = useRef<HTMLParagraphElement | null>(null);
  const bottomBarRef = useRef<HTMLDivElement | null>(null);
  const actionBlockRef = useRef<HTMLDivElement | null>(null);
  const counterRef = useRef<HTMLParagraphElement | null>(null);

  const animRef = useRef({ zoom: 2.6, pixel: 64 });
  const progressProxy = useRef({ p: 0 });

  useEffect(() => {
    let isStale = false;

    async function init() {
      try {
        let loadedCount = 0;
        const updateProgress = () => {
          loadedCount++;
          const p = loadedCount / 2;
          if (!isStale) {
            gsap.to(progressProxy.current, {
              p,
              duration: 0.4,
              ease: 'power1.out',
              onUpdate: () => {
                const rounded = Math.round(progressProxy.current.p * 90);
                setCounterVal(rounded);
              }
            });
          }
        };

        const imageTier = window.matchMedia('(max-width: 1023px)').matches ? 'mobile' : 'desktop';
        const [bare, moss] = await Promise.all([
          fetchImageWithProgress(`/apex-hvac/base-${imageTier}.webp`, updateProgress),
          fetchImageWithProgress(`/apex-hvac/airflow-${imageTier}.webp`, updateProgress),
        ]);

        if (isStale) return;
        setBareImg(bare);
        setMossImg(moss);

        await Promise.all([
          document.fonts.load('italic 400 1em "Instrument Serif"'),
          document.fonts.load('400 1em "Instrument Sans"'),
          document.fonts.load('500 1em "Instrument Sans"')
        ]);

        if (isStale) return;

        const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const ctx = gsap.context(() => {
          const tl = gsap.timeline();

          if (isReduced) {
            setCounterVal(100);
            gsap.to(counterRef.current, { opacity: 0, duration: 0.4 });
            animRef.current.zoom = 1;
            animRef.current.pixel = 1;

            tl.to([navRef.current, h1Ref.current, leadRef.current, bottomBarRef.current, actionBlockRef.current], {
              opacity: 1,
              duration: 0.4,
              ease: 'power1.out',
              clearProps: 'filter'
            });
          } else {
            tl.to(progressProxy.current, {
              p: 1.0,
              duration: 0.8,
              ease: 'power1.out',
              onUpdate: () => {
                setCounterVal(Math.round(progressProxy.current.p * 100));
              }
            }, 0);

            tl.to(animRef.current, {
              zoom: 1.0,
              duration: 0.9,
              ease: 'expo.out'
            }, 0);

            tl.to(animRef.current, {
              pixel: 1,
              duration: 1.0,
              ease: 'none'
            }, 0);

            tl.to(counterRef.current, {
              opacity: 0,
              duration: 0.4,
              ease: 'power1.in'
            }, 0.85);

            tl.fromTo(navRef.current, 
              { opacity: 0, filter: 'blur(8px)' },
              { opacity: 1, filter: 'blur(0px)', duration: 0.5, ease: 'power2.out', clearProps: 'filter' },
              1.0
            );

            const chars = h1Ref.current?.querySelectorAll('.char') || [];
            tl.fromTo(chars,
              { opacity: 0, filter: 'blur(18px)', xPercent: -30 },
              { opacity: 1, filter: 'blur(0px)', xPercent: 0, duration: 0.8, ease: 'power2.out', stagger: 0.035, clearProps: 'filter,transform' },
              1.3
            );

            tl.fromTo(leadRef.current,
              { opacity: 0, filter: 'blur(10px)' },
              { opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power2.out', clearProps: 'filter' },
              2.1
            );

            tl.fromTo(bottomBarRef.current,
              { opacity: 0, filter: 'blur(10px)' },
              { opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power2.out', clearProps: 'filter' },
              2.5
            );

            const actionP = actionBlockRef.current?.querySelector('p');
            if (actionP) {
              tl.fromTo(actionP,
                { opacity: 0, filter: 'blur(10px)' },
                { opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power2.out', clearProps: 'filter' },
                2.7
              );
            }

            const ctaBtn = actionBlockRef.current?.querySelector('a');
            if (ctaBtn) {
              tl.fromTo(ctaBtn,
                { opacity: 0, filter: 'blur(10px)' },
                { opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power2.out', clearProps: 'filter' },
                2.85
              );
            }
          }
        });

        return () => ctx.revert();
      } catch (err) {
        console.error('Asset load error:', err);
      }
    }

    init();

    return () => {
      isStale = true;
    };
  }, []);

  const headlineText = "Every zone tells a story.";
  const line1Chars = "Every zone".split('');
  const line2Chars = "tells a story.".split('');

  return (
    <main className={styles.hero}>
      <LogCanvas bareImg={bareImg} mossImg={mossImg} animRef={animRef} />

      <Nav navRef={navRef} />

      <h1 ref={h1Ref} className={styles.headline} aria-label={headlineText}>
        <span aria-hidden="true" className={styles.line1}>
          {line1Chars.map((char, i) => (
            <span key={i} className="char" style={{ whiteSpace: 'pre', display: 'inline-block' }}>
              {char}
            </span>
          ))}
        </span>
        <span aria-hidden="true" className={styles.line2}>
          {line2Chars.map((char, i) => (
            <span key={i} className="char" style={{ whiteSpace: 'pre', display: 'inline-block' }}>
              {char}
            </span>
          ))}
        </span>
      </h1>

      <p ref={leadRef} className={styles.lead}>
        Turn static thermostat data, legacy duct logs, and silent climate shifts into actionable telemetry.
      </p>

      <div ref={actionBlockRef} className={styles.actionBlock}>
        <p className={styles.actionText}>
          APEX AI transforms historical thermal data into structured dispatch decisions — without losing the story behind it.
        </p>
        <a href="#" className={styles.ctaButton}>Deploy dispatch</a>
      </div>

      <div ref={bottomBarRef} className={styles.bottomBar}>
        <div className={styles.bottomLeft}>
          <div className={styles.arrowCircle}>↓</div>
          <span className={styles.scrollText}>Scroll down for telemetry</span>
        </div>
        <div className={styles.bottomRight}>20–26</div>
      </div>

      <p ref={counterRef} className={styles.counter}>
        {String(counterVal).padStart(2, '0')}<span className={styles.counterPercent}>%</span>
      </p>
    </main>
  );
};
