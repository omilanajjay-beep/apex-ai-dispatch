'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Snowflake, X, Plus } from 'lucide-react';
import styles from './HvacRunway.module.css';

const services = [
  { name: 'Cooling, restored.', category: 'AIR CONDITIONING', image: 'client-outdoor-unit', alt: 'HVAC technician explaining outdoor air-conditioning service to a homeowner', intro: 'A cooler home. A clearer plan.', description: 'From warm air to unusual noises, start with a conversation about your cooling system. We’ll help arrange an on-site assessment.', steps: ['Tell us what feels wrong', 'Arrange a cooling assessment', 'Review your repair options'], details: ['Share the symptoms, when they started, and which rooms are affected with Elena.', 'Choose an available visit time through our existing appointment flow.', 'Discuss the diagnosis and recommended work with your technician before deciding.'] },
  { name: 'Warmth, made simple.', category: 'HEATING & FURNACES', image: 'comfort-consultation', alt: 'Heating technician showing a couple their home furnace and discussing comfort options', intro: 'Good advice. A warmer welcome.', description: 'Uneven heating or a furnace that won’t start? Let’s understand the issue and help you plan the next step.', steps: ['Talk through your heating issue', 'Schedule a system assessment', 'Understand the next steps'], details: ['Describe the heating issue and any changes you’ve noticed in your home.', 'Elena can collect your details and show available appointment times.', 'Ask your technician about the findings and suitable repair or replacement options.'] },
  { name: 'Your next comfort era.', category: 'SYSTEM REPLACEMENT', image: 'home-consult', alt: 'HVAC specialist consulting with homeowners beside their outdoor cooling unit', intro: 'The right system starts with you.', description: 'Explore replacement options around your home, your comfort needs, and your priorities—not a one-size-fits-all shopping cart.', steps: ['Share your comfort priorities', 'Request an on-site consultation', 'Compare suitable systems'], details: ['Tell Elena what you want to improve, such as noisy operation or uneven temperatures.', 'Arrange a visit so the team can assess your home and existing equipment.', 'Review recommendations and an on-site quote before choosing any work.'] },
  { name: 'Care that keeps up.', category: 'PREVENTIVE MAINTENANCE', image: 'technician-homeowner', alt: 'Service technician discussing an outdoor HVAC system with a homeowner', intro: 'A little care. More peace of mind.', description: 'Make space for the routine checks your system needs. Start a maintenance conversation and arrange a visit that fits.', steps: ['Tell us about your system', 'Arrange a maintenance visit', 'Get a practical care plan'], details: ['Share your system type, its recent performance, and any concerns you have.', 'Use Elena to find a suitable available appointment.', 'Your technician can explain recommended maintenance and any issues found during the visit.'] },
  { name: 'Back to feeling right.', category: 'DIAGNOSTICS & REPAIR', image: 'technician-repair', alt: 'HVAC technician inspecting and repairing an outdoor air-conditioning unit', intro: 'Find the issue. Know your options.', description: 'Unexpected shutdowns, airflow changes, or a strange sound: tell us what’s happening and let’s take the guesswork out of the next step.', steps: ['Describe the symptoms', 'Book a diagnostic visit', 'Review the recommended fix'], details: ['Tell Elena what your system is doing, without needing to diagnose it yourself.', 'Select an available appointment after sharing your contact and service details.', 'The technician can explain the cause, recommended work, and quote before you proceed.'] },
  { name: 'Comfort, together.', category: 'HOME COMFORT CONSULTATION', image: 'technician-service', alt: 'HVAC technician and customer discussing home comfort beside an outdoor unit', intro: 'Your home. A human conversation.', description: 'Not sure which service you need? Begin with your home and how it feels. Elena will help you arrange a conversation with the team.', steps: ['Tell us about your home', 'Discuss your comfort goals', 'Plan your service visit'], details: ['Share your concerns, whether it’s a hot bedroom, an aging system, or changing comfort needs.', 'Describe the result you’re hoping for so the team can understand your priorities.', 'Choose an available time and review your details before confirming your appointment.'] },
];
const number = (n: number) => String(n + 1).padStart(2, '0');

export default function HvacRunway({ onBook, chatOpen }: { onBook: (service: string) => void; chatOpen: boolean }) {
  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [detail, setDetail] = useState<number | null>(null);
  const [detailService, setDetailService] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false, view: false });
  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const target = useRef(0);
  const current = useRef(0);
  const velocity = useRef(0);
  const pointer = useRef<{ x: number; y: number; target: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const reduced = useRef(false);

  const go = useCallback((next: number) => {
    target.current = next;
    setIndex(((Math.round(next) % 6) + 6) % 6);
    setCycle(c => c + 1);
  }, []);
  const select = (next: number) => {
    const active = ((Math.round(target.current) % 6) + 6) % 6;
    let delta = next - active;
    if (delta > 3) delta -= 6;
    if (delta < -3) delta += 6;
    go(Math.round(target.current) + delta);
  };

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let last = performance.now();
    let width = stage.current?.clientWidth || 900;
    let mobile = window.innerWidth <= 749;
    const observer = new ResizeObserver(() => { width = stage.current?.clientWidth || 900; mobile = window.innerWidth <= 749; });
    if (stage.current) observer.observe(stage.current);
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, .032); last = now;
      const diff = target.current - current.current;
      velocity.current += (95 * diff - 19.5 * velocity.current) * dt;
      current.current = reduced.current ? target.current : current.current + velocity.current * dt;
      cards.current.forEach((card, i) => {
        if (!card) return;
        const theta = (i - current.current) * Math.PI / 3;
        const depth = (Math.cos(theta) + 1) / 2;
        const x = Math.sin(theta) * width * (mobile ? .53 : .43);
        const y = mobile ? (1 - depth) * -70 + x * -.20 : (1 - depth) * -65;
        const scale = .48 + depth * .52;
        const blur = reduced.current ? 0 : (1 - depth) * 5.5;
        card.style.transform = `translate(-50%, -50%) translate3d(${x}px,${y}px,0) scale(${scale})`;
        card.style.filter = `blur(${blur}px)`;
        card.style.opacity = String(.28 + depth * .72);
        card.style.zIndex = String(Math.round(depth * 100));
      });
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, []);

  useEffect(() => {
    if (detail !== null || chatOpen || dragging) return;
    const timer = window.setTimeout(() => go(Math.round(target.current) + 1), 5000);
    return () => window.clearTimeout(timer);
  }, [cycle, detail, chatOpen, dragging, go]);

  useEffect(() => {
    if (detail !== null && !dialog.current?.open) dialog.current?.showModal();
    if (detail === null && dialog.current?.open) dialog.current.close();
  }, [detail]);

  const openDetail = (item: number) => { setDetailService(index); setDetail(item); };
  const active = services[index];
  const popup = services[detailService];
  const book = (name: string) => { setDetail(null); onBook(name); };

  return <main className={styles.page} id="apex-home">
    <a className={styles.skip} href="#comfort-services">Skip to services</a>
    <header className={styles.header}>
      <a href="#apex-home" aria-label="Apex AI home" className={styles.brand}><Snowflake strokeWidth={1.4} size={31} /><span>APEX AI<small>HOME COMFORT, CONNECTED.</small></span></a>
      <nav aria-label="Main navigation"><a href="#comfort-services">Our services</a><button onClick={() => book('Home comfort consultation')}>Meet your comfort team <ArrowUpRight size={13} /></button></nav>
      <button className={styles.headerCta} onClick={() => book(active.category)}>Book a visit <ArrowUpRight size={15} /></button>
    </header>
    <section className={styles.grid} id="comfort-services" aria-label="Explore six HVAC services">
      <div className={styles.left}>
        <div className={styles.heading}><div><p className={styles.eyebrow}>THE APEX COMFORT COLLECTION</p><h1>Feel the difference.</h1><p className={styles.subtitle}>Six ways to make home feel right. Explore your next step.</p></div><span className={styles.counter}>{number(index)} <i>/ 06</i></span></div>
        <div className={`${styles.stage} ${dragging ? styles.dragging : ''}`} ref={stage} tabIndex={0} role="region" aria-roledescription="carousel" aria-label="HVAC services — use left and right arrow keys or swipe"
          onKeyDown={e => { if (e.target !== e.currentTarget) return; if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); go(Math.round(target.current) + (e.key === 'ArrowRight' ? 1 : -1)); } if (e.key === 'Home') { e.preventDefault(); go(0); } if (e.key === 'End') { e.preventDefault(); select(5); } }}
          onPointerDown={e => { if (e.button !== 0) return; pointer.current = { x: e.clientX, y: e.clientY, target: target.current, moved: false }; suppressClick.current = false; }}
          onPointerMove={e => {
            setCursor({ x: e.clientX, y: e.clientY, visible: e.pointerType === 'mouse', view: !!(e.target as HTMLElement).closest('[data-active="true"]') });
            const p = pointer.current; if (!p) return;
            const dx = e.clientX - p.x;
            if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - p.y)) { p.moved = true; setDragging(true); suppressClick.current = true; stage.current?.setPointerCapture(e.pointerId); target.current = p.target - dx / Math.max(130, (stage.current?.clientWidth || 800) * .24); }
          }}
          onPointerUp={() => { const p = pointer.current; pointer.current = null; if (p?.moved) go(Math.round(target.current)); setDragging(false); }}
          onPointerCancel={() => { pointer.current = null; go(Math.round(target.current)); setDragging(false); }}
          onPointerLeave={() => setCursor(c => ({ ...c, visible: false }))}>
          <span className={styles.stageWord} aria-hidden="true">COMFORT</span>
          <div className={styles.floor} />
          {services.map((service, i) => <div className={styles.scene} key={service.image} ref={el => { cards.current[i] = el; }} data-active={i === index} aria-hidden={i !== index}>
            <button className={styles.sceneHit} tabIndex={i === index ? 0 : -1} aria-label={i === index ? `View ${service.category.toLowerCase()} details` : `Explore ${service.category.toLowerCase()}`} onClick={() => { if (suppressClick.current) return; if (i === index) openDetail(0); else select(i); }}>
              <picture><source media="(max-width: 749px)" srcSet={`/hvac-runway/${service.image}-640.webp`} /><img src={`/hvac-runway/${service.image}-1000.webp`} alt={service.alt} width={640} height={640} draggable={false} loading={i === 0 || i === 1 || i === 5 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : 'auto'} /></picture>
              <span className={styles.imageCaption}>{number(i)} / {service.category}</span>
            </button>
          </div>)}
          <p className={styles.dragHint}>DRAG TO EXPLORE <span>↔</span> SELECT TO DISCOVER</p>
        </div>
        <div className={styles.controls}>
          <button className={styles.arrow} aria-label="Previous service" onClick={() => go(Math.round(target.current) - 1)}><ArrowLeft size={23} strokeWidth={1.2} /></button>
          <div className={styles.ticks}>{services.map((s, i) => <button key={s.name} className={`${styles.tick} ${i === index ? styles.active : ''}`} aria-label={`Service ${i + 1}: ${s.category.toLowerCase()}`} aria-current={i === index ? 'true' : undefined} onClick={() => select(i)}><span className={styles.bar}>{i === index && <span key={cycle} style={{ animationPlayState: detail !== null || chatOpen || dragging ? 'paused' : 'running' }} />}</span><span>{number(i)} <span className={styles.tickName}>{s.category}</span></span></button>)}</div>
          <button className={styles.arrow} aria-label="Next service" onClick={() => go(Math.round(target.current) + 1)}><ArrowRight size={23} strokeWidth={1.2} /></button>
        </div>
      </div>
      <aside className={styles.panel} aria-label="Service information">
        <div className={styles.panelTop}><p className={styles.eyebrow}>IN THIS SERVICE <span>{number(index)}</span></p><h2 key={active.name}>{active.name}</h2><p>{active.description}</p></div>
        <ol className={styles.items} key={index}>{active.steps.map((title, n) => <li key={title} style={{ animationDelay: `${n * 80}ms` }}><button className={styles.item} onClick={() => openDetail(n)}><span className={styles.itemImage}><img src={`/hvac-runway/${active.image}-240.webp`} alt="" width={72} height={72} /><b>{n + 1}</b></span><span><small>{['LET’S UNDERSTAND', 'LET’S CONNECT', 'LET’S MAKE A PLAN'][n]}</small><strong>{title}</strong></span><Plus size={17} strokeWidth={1.2} /></button></li>)}</ol>
        <div className={styles.panelFooter}><span className={styles.miniLabel}>HUMAN SERVICE. SEAMLESS BOOKING.</span><p>{active.intro}</p><button className={styles.book} onClick={() => book(active.category)}>Arrange a service visit <ArrowRight size={19} strokeWidth={1.3} /></button><small>Start with Elena. Review your details before confirming.</small></div>
      </aside>
    </section>
    <footer className={styles.footer}><span>APEX AI © {new Date().getFullYear()}</span><span>HEATING · COOLING · REAL CONNECTION</span></footer>
    <div aria-hidden="true" className={`${styles.cursor} ${cursor.visible && !chatOpen && detail === null ? styles.cursorVisible : ''}`} style={{ left: cursor.x, top: cursor.y }}>{dragging ? 'DRAG' : cursor.view ? 'VIEW' : 'DRAG'}<span>{cursor.view && !dragging ? '↗' : '↔'}</span></div>
    <dialog ref={dialog} className={styles.dialog} onCancel={() => setDetail(null)} onClose={() => setDetail(null)} onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) setDetail(null); } }} aria-labelledby="service-detail-title">
      <button className={styles.close} aria-label="Close service details" onClick={() => setDetail(null)}><X size={23} /></button>
      {detail !== null && <><img className={styles.dialogImage} src={`/hvac-runway/${popup.image}-640.webp`} alt={popup.alt} /><div className={styles.dialogBody}><p className={styles.eyebrow}>{popup.category} / {detail + 1}</p><h2 id="service-detail-title">{popup.steps[detail]}</h2><p>{popup.details[detail]}</p><div className={styles.detailTabs}>{popup.steps.map((s, n) => <button key={s} aria-label={s} aria-current={detail === n ? 'step' : undefined} onClick={() => setDetail(n)}>{n + 1}</button>)}</div><button className={styles.book} onClick={() => book(popup.category)}>Talk to Elena <ArrowRight size={18} /></button><small>No purchase here. Confirm only when you’re ready.</small></div></>}
    </dialog>
  </main>;
}
