'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { ArrowDown, ArrowUpRight, Menu, Pause, Play, Plus, X } from 'lucide-react';
import useIdleTour from './useIdleTour';
import styles from './OutboxExperience.module.css';

const AutoplayContext = createContext(false);

function useMotionPreference() {
  const preference = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated ? preference : null;
}

const assets = {
  consultation: '/hvac-consultation.webp',
  comfort: '/hvac-home-comfort.webp',
  service: '/hvac-service-visit.webp',
};

function Film({ scene = 'consultation', className = '' }: { scene?: keyof typeof assets; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const playing = useContext(AutoplayContext);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let visible = false;
    const sync = () => {
      if (playing && visible && !document.hidden) void video.play().catch(() => { /* The still poster remains available when autoplay is blocked. */ });
      else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(video);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); video.pause(); };
  }, [playing]);
  return <video ref={ref} className={`${styles.film} ${className}`} autoPlay={playing} loop muted playsInline preload="metadata" poster={assets[scene]} aria-hidden="true" tabIndex={-1}>
    <source src={`/hvac-${scene}-motion.mp4`} type="video/mp4" />
  </video>;
}

function TalkButton({ onTalk }: { onTalk: () => void }) {
  return <button type="button" className={styles.talkButton} onClick={onTalk}>Let's Talk <ArrowUpRight size={22} aria-hidden="true" /></button>;
}

function Navigation({ onTalk }: { onTalk: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const firstLink = useRef<HTMLAnchorElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 50);
    update(); window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => firstLink.current?.focus(), 80);
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); menuButton.current?.focus(); }
      if (event.key === 'Tab') {
        const controls = Array.from(document.querySelectorAll<HTMLElement>('#outbox-menu a, #outbox-menu button'));
        const current = controls.indexOf(document.activeElement as HTMLElement);
        const next = (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
        event.preventDefault(); controls[next]?.focus();
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => { document.body.style.overflow = previous; clearTimeout(timer); document.removeEventListener('keydown', keyboard); };
  }, [open]);
  const links = [['About', '#about'], ['Services', '#services'], ['Work', '#work'], ['Contact', '#contact']];
  return <>
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`} aria-label="Main navigation" style={open ? { visibility: 'hidden' } : undefined}>
      <a href="#top" className={styles.logo} aria-label="OUTBOX — Apex AI home" onClick={() => setOpen(false)}>OUT<span>BOX</span><i /></a>
      <div className={styles.desktopLinks}>{links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}</div>
      <button ref={menuButton} id="outbox-menu-toggle" type="button" className={styles.menuToggle} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="outbox-menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    </nav>
    <AnimatePresence>{open && <motion.div id="outbox-menu" className={styles.mobileMenu} role="dialog" aria-modal="true" aria-label="Navigation menu" initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }} transition={{ duration: .55, ease: [.25, 1, .5, 1] }}>
      <button type="button" className={styles.overlayClose} aria-label="Close menu" onClick={() => { setOpen(false); menuButton.current?.focus(); }}><X /></button>
      <div>{links.map(([label, href], i) => <motion.a ref={i === 0 ? firstLink : undefined} href={href} key={label} onClick={() => { setOpen(false); menuButton.current?.focus(); }} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .12 + i * .08 }} whileHover={{ x: 14 }}><small>0{i + 1}</small>{label}<ArrowUpRight /></motion.a>)}<button onClick={() => { setOpen(false); onTalk(); }}>Let's Talk <ArrowUpRight /></button></div>
    </motion.div>}</AnimatePresence>
  </>;
}

function Hero({ onTalk }: { onTalk: () => void }) {
  const containerRef = useRef<HTMLElement>(null);
  const reduce = useMotionPreference();
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const scale = useTransform(scrollYProgress, [.75, 1], [1, .7]);
  const y = useTransform(scrollYProgress, [.75, 1], ['0vh', '-8vh']);
  const borderRadius = useTransform(scrollYProgress, [.75, 1], ['0px', '60px']);
  const opacity = useTransform(scrollYProgress, [.86, 1], [1, 0]);
  const outerScale = useTransform(scrollYProgress, [0, .65], [.5, 5]);
  const secondScale = useTransform(scrollYProgress, [0, .08, .56], [.4, .4, 4.5]);
  const thirdScale = useTransform(scrollYProgress, [0, .14, .58], [.3, .3, 4]);
  const fourthScale = useTransform(scrollYProgress, [0, .2, .6], [.2, .2, 3.5]);
  const circlesOpacity = useTransform(scrollYProgress, [.28, .48], [1, 0]);
  const lettersOpacity = useTransform(scrollYProgress, [0, .05], [1, 0]);
  const introOpacity = useTransform(scrollYProgress, [.12, .2, .36, .45], [0, 1, 1, 0]);
  const introY = useTransform(scrollYProgress, [.15, .24, .36, .45], [50, 0, 0, -50]);
  const finalOpacity = useTransform(scrollYProgress, [.45, .55], [0, 1]);
  const finalY = useTransform(scrollYProgress, [.45, .55], [50, 0]);
  const finalVisibility = useTransform(scrollYProgress, value => value >= .45 ? 'visible' : 'hidden');
  const hintOpacity = useTransform(scrollYProgress, [0, .06], [1, 0]);
  return <section ref={containerRef} id="top" className={`${styles.hero} ${reduce ? styles.reducedHero : ''}`} aria-label="Think outside the box">
    <motion.div className={styles.heroSticky} style={reduce ? undefined : { scale, y, borderRadius, opacity }}>
      <Film className={styles.heroFilm} />
      <div className={styles.heroShade} />
      <div className={styles.circlePosition}><motion.div className={`${styles.circle} ${styles.outerCircle}`} style={{ scale: reduce ? 3 : outerScale }}><Film scene="comfort" /></motion.div></div>
      {!reduce && <>
        <div className={styles.circlePosition}><motion.div className={`${styles.circle} ${styles.secondCircle}`} style={{ scale: secondScale, opacity: circlesOpacity }} /></div>
        <div className={styles.circlePosition}><motion.div className={`${styles.circle} ${styles.thirdCircle}`} style={{ scale: thirdScale, opacity: circlesOpacity }} /></div>
        <div className={styles.circlePosition}><motion.div className={`${styles.circle} ${styles.fourthCircle}`} style={{ scale: fourthScale, opacity: circlesOpacity }} /></div>
        <motion.div className={styles.boxLetters} style={{ opacity: lettersOpacity }} aria-hidden="true"><span className={styles.letterB}>B</span><span className={styles.letterX}>X</span></motion.div>
        <motion.div className={styles.heroCaption} style={{ opacity: hintOpacity }}><span>INDEPENDENT THINKING.<br />EXTRAORDINARY POSSIBILITIES.</span><span>AUTOMATIC JOURNEY<br />OR SCROLL TO EXPLORE <ArrowDown size={16} /></span></motion.div>
        <motion.div id="about" className={styles.heroContent} style={{ opacity: introOpacity, y: introY }}><span className={styles.eyebrow}>NO LIMITS. JUST POSSIBILITIES.</span><h1>Think outside<br />the box.</h1></motion.div>
      </>}
      <motion.div className={`${styles.heroContent} ${styles.finalContent}`} style={reduce ? undefined : { opacity: finalOpacity, y: finalY, visibility: finalVisibility }}>
        <span className={styles.eyebrow}>BEYOND THE EXPECTED.</span><h2>Elevating Brands.<br />Defining Futures.</h2><TalkButton onTalk={onTalk} />
      </motion.div>
    </motion.div>
  </section>;
}

const services = [
  { title: 'Brand Identity', scene: 'consultation' as const, tags: ['STRATEGY', 'IDENTITY', 'DIRECTION'], description: 'Distinctive by design. Unmistakable by nature.' },
  { title: 'Digital Marketing', scene: 'comfort' as const, tags: ['CONNECTION', 'CAMPAIGNS', 'GROWTH'], description: 'Meaningful connections. Measurable impact.' },
  { title: 'Web Experience', scene: 'service' as const, tags: ['DESIGN', 'DEVELOPMENT', 'EXPERIENCE'], description: 'Digital experiences that move people forward.' },
];

function StackCard({ item, index, progress }: { item: typeof services[number]; index: number; progress: MotionValue<number> }) {
  const y = useTransform(progress, [Math.max(0, index * .27 - .08), index * .27 + .16], [index === 0 ? '0%' : '120%', '0%']);
  const scale = useTransform(progress, [index * .27 + .2, 1], [1, .9 + index * .05]);
  return <motion.article className={`${styles.stackCard} ${styles[`card${index}`]}`} style={{ top: index * 40, y, scale, zIndex: index + 1 }}>
    <Film scene={item.scene} /><div className={styles.cardShade} />
    <div className={styles.cardTop}><span>0{index + 1} / EXPERTISE</span><ArrowUpRight size={28} /></div>
    <div className={styles.cardBottom}><div className={styles.tags}>{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div><h3>{item.title}</h3><p>{item.description}</p></div>
  </motion.article>;
}

function Services() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  return <section ref={containerRef} id="services" className={styles.services} aria-labelledby="services-title"><div className={styles.servicesSticky}>
    <div className={styles.expertise}><span className={styles.eyebrow}>01 / WHAT WE DO</span><h2 id="services-title">Our Core<br />Expertise.</h2><p>We challenge convention.<br />We create what comes next.</p><span className={styles.expertiseNote}>A DIFFERENT PERSPECTIVE.<br />A LASTING IMPRESSION.</span></div>
    <div className={styles.cardWrapper}>{services.map((item, index) => <StackCard item={item} index={index} key={item.title} progress={scrollYProgress} />)}</div>
  </div></section>;
}

const works = [
  { title: 'EcoNexa', category: 'BRAND STRATEGY / DIGITAL DESIGN', image: assets.consultation, position: '46% center' },
  { title: 'Bali Travel', category: 'IDENTITY / EXPERIENCE', image: assets.service, position: '30% center' },
  { title: 'Calm', category: 'ART DIRECTION / WEB EXPERIENCE', image: assets.comfort, position: '58% center' },
  { title: 'Northridge', category: 'STRATEGY / BRAND IDENTITY', image: '/apex-hvac-outdoor-1200.webp', position: '52% center' },
  { title: 'Naturally', category: 'DIGITAL DESIGN / DEVELOPMENT', image: '/apex-client-relationship.webp', position: '60% center' },
];

function Work() {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const playing = useContext(AutoplayContext);
  useEffect(() => {
    if (!playing || !ref.current) return;
    let visible = false;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: .45 });
    observer.observe(ref.current);
    const timer = window.setInterval(() => {
      if (visible && !document.hidden && !document.querySelector('.chat-drawer, #outbox-menu') && !ref.current?.contains(document.activeElement)) setActive(current => (current + 1) % works.length);
    }, 4500);
    return () => { observer.disconnect(); window.clearInterval(timer); };
  }, [playing]);
  return <section ref={ref} id="work" className={styles.work} aria-labelledby="work-title"><div className={styles.workHeading}><div><span className={styles.eyebrow}>02 / SELECTED PROJECTS</span><h2 id="work-title">Featured Work<span>.</span></h2></div><span className={styles.workNote}>DIFFERENT CHALLENGES.<br />ONE DISTINCT POINT OF VIEW.</span></div>
    <div className={styles.accordion}>{works.map((work, index) => <button key={work.title} className={`${styles.workItem} ${active === index ? styles.activeWork : ''}`} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => setActive(index)} aria-expanded={active === index} aria-label={`${work.title} — ${work.category}`}>
      {/* Local, original HVAC images replace the supplied portfolio pictures. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={work.image} alt={`HVAC technician and client — ${work.title} visual study`} style={{ objectPosition: work.position }} loading="lazy" />
      <div className={styles.workShade} /><span className={styles.workIndex}>0{index + 1}</span><div className={styles.workText}><span>{work.category}</span><h3>{work.title}</h3></div><ArrowUpRight className={styles.workArrow} size={28} aria-hidden="true" />
    </button>)}</div>
  </section>;
}

function Footer({ onTalk }: { onTalk: () => void }) {
  return <footer id="contact" className={styles.footer}>
    <div className={styles.footerIntro}><span className={styles.eyebrow}>HAVE SOMETHING IN MIND?</span><span>GOOD THINGS START<br />WITH A CONVERSATION.</span></div>
    <button type="button" className={styles.maskButton} onClick={onTalk} aria-label="Let's talk — open Elena booking concierge"><div className={styles.videoMask}><Film /><span>LET'S TALK.</span></div><ArrowUpRight className={styles.footerArrow} aria-hidden="true" /></button>
    <div className={styles.footerBottom}><a href="#top" className={styles.logo} aria-label="Back to top">OUT<span>BOX</span><i /></a><span>APEX AI © {new Date().getFullYear()}</span><div><a href="#about">About</a><a href="#services">Services</a><a href="#work">Work</a><button type="button" onClick={onTalk}>Let's Talk <Plus size={14} /></button></div><a href="#top" className={styles.backTop}>BACK TO TOP <ArrowUpRight size={16} /></a></div>
  </footer>;
}

export default function OutboxExperience({ onTalk, chatOpen = false }: { onTalk: () => void; chatOpen?: boolean }) {
  const reduce = useMotionPreference();
  const tour = useIdleTour({ enabled: reduce === false, paused: chatOpen });
  return <AutoplayContext.Provider value={tour.playing && !reduce && !chatOpen}><div className={styles.experience}><a className={styles.skip} href="#services">Skip to content</a><div className={styles.grid} aria-hidden="true" /><Navigation onTalk={onTalk} /><main><Hero onTalk={onTalk} /><Services /><Work /></main><Footer onTalk={onTalk} />
    {reduce === false && <button type="button" data-idle-tour-control className={styles.tourControl} onClick={tour.toggle} aria-label={tour.playing ? 'Pause automatic tour' : 'Resume automatic tour'} aria-pressed={tour.playing}>{tour.playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}<span>{tour.playing ? 'Pause motion' : 'Play motion'}</span></button>}
  </div></AutoplayContext.Provider>;
}
