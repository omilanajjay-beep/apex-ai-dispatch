'use client';

import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import gsap from 'gsap';
import { ArrowDown, ArrowRight, ArrowUpRight, Menu, Moon, Sun, X } from 'lucide-react';
import ApexCursor from './ApexCursor';
import ApexPhotoCanvas from './ApexPhotoCanvas';
import styles from './ApexZipHero.module.css';

type Props = {
  onRequestQuote: (service?: string) => void;
  light: boolean;
  onToggleTheme: () => void;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
};

type MotionState = { zoom: number; pixel: number };

const photoSrcSet = '/apex-hvac-outdoor-768.webp 768w, /apex-hvac-outdoor-1200.webp 1200w';
const navLinks = [
  ['Our expertise', '#services'],
  ['Comfort in motion', '#hvac-story'],
  ['The Apex approach', '#approach'],
  ['Let’s talk', '#finale'],
] as const;

export default function ApexZipHero({ onRequestQuote, light, onToggleTheme, menuOpen, onToggleMenu, onCloseMenu }: Props) {
  const heroRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const leadRef = useRef<HTMLParagraphElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const motionRef = useRef<MotionState>({ zoom: 2.6, pixel: 64 });
  const drawRef = useRef<(() => void) | null>(null);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [introActive, setIntroActive] = useState(false);
  const [interactiveMotion, setInteractiveMotion] = useState(false);

  useEffect(() => {
    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setInteractiveMotion(pointerQuery.matches && !reducedQuery.matches);
    update();
    pointerQuery.addEventListener('change', update);
    reducedQuery.addEventListener('change', update);
    const source = imageRef.current;
    if (source?.complete && source.naturalWidth > 0) setPhoto(source);
    return () => {
      pointerQuery.removeEventListener('change', update);
      reducedQuery.removeEventListener('change', update);
    };
  }, []);

  const onPhotoLoad = (event: SyntheticEvent<HTMLImageElement>) => setPhoto(event.currentTarget);

  useEffect(() => {
    if (!photo) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIntroActive(false);
      motionRef.current = { zoom: 1, pixel: 1 };
      return;
    }

    setIntroActive(true);
    motionRef.current = { zoom: 2.6, pixel: 64 };
    let timeline: gsap.core.Timeline | undefined;
    const ctx = gsap.context(() => {
      const chars = headingRef.current?.querySelectorAll(`.${styles.char}`) ?? [];
      const progress = { value: 0 };
      timeline = gsap.timeline({
        defaults: { overwrite: 'auto' },
        onComplete: () => setIntroActive(false),
      });
      timeline.to(progress, {
        value: 1,
        duration: 0.95,
        ease: 'power1.out',
        onUpdate: () => {
          motionRef.current.pixel = 64 - 63 * progress.value;
          motionRef.current.zoom = 2.6 - 1.6 * gsap.parseEase('expo.out')(progress.value);
          drawRef.current?.();
        },
      }, 0);
      timeline.fromTo(navRef.current, { opacity: 0, y: -8, filter: 'blur(8px)' }, {
        opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.55, ease: 'power2.out', clearProps: 'filter',
      }, 0.55);
      if (chars.length) timeline.fromTo(chars, { opacity: 0, xPercent: -25, filter: 'blur(16px)' }, {
        opacity: 1, xPercent: 0, filter: 'blur(0px)', duration: 0.7, stagger: 0.025, ease: 'power2.out', clearProps: 'filter,transform',
      }, 0.76);
      timeline.fromTo(leadRef.current, { opacity: 0, y: 12, filter: 'blur(9px)' }, {
        opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.55, ease: 'power2.out', clearProps: 'filter,transform',
      }, 1.22);
      timeline.fromTo(actionRef.current, { opacity: 0, y: 14, filter: 'blur(9px)' }, {
        opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.55, ease: 'power2.out', clearProps: 'filter,transform',
      }, 1.42);
      timeline.fromTo(bottomBarRef.current, { opacity: 0, filter: 'blur(8px)' }, {
        opacity: 1, filter: 'blur(0px)', duration: 0.45, ease: 'power2.out', clearProps: 'filter',
      }, 1.58);
    }, heroRef);

    return () => {
      timeline?.kill();
      ctx.revert();
    };
  }, [photo]);

  const requestQuote = (service?: string) => {
    onCloseMenu();
    onRequestQuote(service);
  };
  const lineOne = 'Every zone';
  const lineTwo = 'tells a story.';
  const chars = (text: string) => text.split('').map((char, index) => <span key={`${text}-${index}`} className={styles.char}>{char === ' ' ? '\u00a0' : char}</span>);

  return <>
    <section ref={heroRef} className={`${styles.hero} ${light ? styles.light : ''}`} aria-labelledby="apex-hero-title">
      <nav ref={navRef} className={styles.nav} aria-label="Main navigation">
        <a href="#top" className={styles.brand} aria-label="Apex AI home" onClick={onCloseMenu}>
          <span className={styles.brandMark} aria-hidden="true">A</span>
          <span className={styles.brandName}>APEX<small>AI</small></span>
        </a>
        <div className={`${styles.links} ${menuOpen ? styles.open : ''}`} id="apex-primary-links">
          {navLinks.map(([label, href]) => <a key={href} href={href} onClick={onCloseMenu}>{label}</a>)}
        </div>
        <div className={styles.navActions}>
          <button className={styles.themeToggle} type="button" onClick={onToggleTheme} aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'} title={light ? 'Switch to dark theme' : 'Switch to light theme'}>
            {light ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
          </button>
          <button className={styles.quoteButton} type="button" onClick={() => requestQuote('HVAC assessment and quote')}>Request a quote <ArrowUpRight size={15} aria-hidden="true" /></button>
          <button className={styles.menuButton} type="button" aria-expanded={menuOpen} aria-controls="apex-primary-links" onClick={onToggleMenu} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}>
            {menuOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
          </button>
        </div>
      </nav>

      <p className={styles.eyebrow}>01 / APEX AI HOME HVAC</p>
      <h1 ref={headingRef} className={styles.headline} id="apex-hero-title" aria-label="Every zone tells a story.">
        <span className={styles.lineOne} aria-hidden="true">{chars(lineOne)}</span>
        <span className={styles.lineTwo} aria-hidden="true">{chars(lineTwo)}</span>
      </h1>

      <p ref={leadRef} className={styles.lead}>
        A room that runs warm. Airflow that feels off. An HVAC system that needs a closer look. Start with what you notice.
      </p>

      <div ref={frameRef} className={`${styles.photoFrame} ${introActive ? styles.introActive : ''}`}>
        <img
          ref={imageRef}
          src="/apex-hvac-outdoor-1200.webp"
          srcSet={photoSrcSet}
          sizes="(max-width: 1023px) 88vw, 42vw"
          alt="HVAC technician inspecting an outdoor air conditioning unit at a home"
          width={1200}
          height={627}
          fetchPriority="high"
          decoding="async"
          onLoad={onPhotoLoad}
        />
        <div className={styles.photoEdge} aria-hidden="true" />
      </div>
      <ApexPhotoCanvas photo={photo} frameRef={frameRef} introActive={introActive} interactive={interactiveMotion} motionRef={motionRef} drawRef={drawRef} />

      <div ref={actionRef} className={styles.actionBlock}>
        <p className={styles.actionText}>Tell Elena what your home is noticing. She’ll collect the details and help arrange a clear next step.</p>
        <button className={styles.ctaButton} type="button" onClick={() => requestQuote('HVAC assessment and quote')}>
          Talk to Elena <ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>

      <div ref={bottomBarRef} className={styles.bottomBar}>
        <a href="#approach" className={styles.scrollLink}>
          <span className={styles.arrowCircle}><ArrowDown size={15} aria-hidden="true" /></span>
          <span>Scroll to find your balance</span>
        </a>
        <span className={styles.bottomRight}>HEATING / COOLING / HOME COMFORT</span>
      </div>
    </section>
    <ApexCursor />
  </>;
}
