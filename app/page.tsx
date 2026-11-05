'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  Menu,
  MessageCircle,
  Send,
  ShieldCheck,
  Snowflake,
  Wrench,
  X,
} from 'lucide-react';
import SiteMotion from './components/SiteMotion';
import Hero3D from './components/Hero3D';

type Role = 'assistant' | 'user';
type ChatMessage = { role: Role; text: string };
type IntakeStep = 'name' | 'phone' | 'email' | 'address' | 'problem';
type Intake = Record<IntakeStep, string>;
type AvailableSlot = { start: string; end?: string; date: string };

const intakeFields: IntakeStep[] = ['name', 'phone', 'email', 'address', 'problem'];
const emptyIntake: Intake = { name: '', phone: '', email: '', address: '', problem: '' };

function localDateInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${read('year')}-${read('month')}-${read('day')}`;
}

function shiftDate(date: string, days: number) {
  const [year, month, day] = date.split('-').map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, '0')}-${String(result.getUTCDate()).padStart(2, '0')}`;
}

function formatSlotTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', timeZone }).format(new Date(value));
}

function formatSlotDay(value: string, timeZone: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', timeZone }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function Concierge({ open, setOpen }: { open: boolean; setOpen: (next: boolean) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'Hi, I’m Elena, Apex AI’s visit coordinator. Let’s start with your home and what you need. What name would you like me to use?' },
  ]);
  const [intake, setIntake] = useState<Intake>(emptyIntake);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [timeZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slotUnavailable, setSlotUnavailable] = useState(false);
  const [consented, setConsented] = useState(false);
  const [booked, setBooked] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const grouped = useMemo(() => slots.reduce<Record<string, AvailableSlot[]>>((days, slot) => {
    days[slot.date] ??= [];
    days[slot.date].push(slot);
    return days;
  }, {}), [slots]);

  const loadSlots = async () => {
    setSlotUnavailable(false);
    const first = shiftDate(localDateInZone(new Date(), timeZone), 1);
    const last = shiftDate(first, 13);
    try {
      const query = new URLSearchParams({ start: first, end: last, timeZone });
      const response = await fetch(`/api/slots?${query.toString()}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.slots)) throw new Error('availability-unavailable');
      setSlots(data.slots);
      setSlotUnavailable(data.slots.length === 0);
    } catch {
      setSlotUnavailable(true);
    }
  };

  const send = async () => {
    const answer = input.trim();
    if (!answer || busy || step >= intakeFields.length) return;
    const field = intakeFields[step];
    const withUser: ChatMessage[] = [...messages, { role: 'user', text: answer }];
    setMessages(withUser);
    setInput('');
    setBusy(true);

    try {
      const response = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: field, answer, completedFields: intakeFields.slice(0, step), knownName: intake.name, website: honeypot }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'I could not process that just now. Please try again.');
      if (typeof data.reply !== 'string' || typeof data.accepted !== 'boolean' || (data.accepted && typeof data.value !== 'string')) {
        throw new Error('I couldn’t save that detail. Could you try again?');
      }
      const nextMessages: ChatMessage[] = [...withUser, { role: 'assistant', text: data.reply }];
      setMessages(nextMessages);
      if (typeof data.correctedName === 'string') setIntake((current) => ({ ...current, name: data.correctedName }));
      if (typeof data.retryStep === 'string' && intakeFields.includes(data.retryStep as IntakeStep)) {
        setStep(intakeFields.indexOf(data.retryStep as IntakeStep));
        return;
      }
      if (!data.accepted) return;
      setIntake((current) => ({ ...current, [field]: data.value }));
      if (data.complete) {
        setStep(intakeFields.length);
        await loadSlots();
        return;
      }
      setStep(step + 1);
    } catch (error) {
      setMessages([...withUser, { role: 'assistant', text: error instanceof Error ? error.message : 'Please try again in a moment.' }]);
    } finally {
      setBusy(false);
    }
  };

  const confirmBooking = async () => {
    if (!selectedSlot || !consented || busy || booked) return;
    setBusy(true);
    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: selectedSlot, timeZone, attendee: intake }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'That time could not be reserved. Please choose another slot.');
      setBooked(true);
      setMessages((current) => [...current, {
        role: 'assistant',
        text: data.emailWarning
          ? `${intake.name ? `${intake.name}, your visit is reserved. ` : 'Your visit is reserved. '}One of the confirmation emails couldn’t be sent, so our dispatch team will follow up.`
          : `${intake.name ? `${intake.name}, you’re all set! ` : 'You’re all set! '}Your appointment is confirmed. A confirmation email has been sent to you and the on-call technician.`,
      }]);
    } catch (error) {
      setMessages((current) => [...current, { role: 'assistant', text: error instanceof Error ? error.message : 'Please try another time.' }]);
      setSelectedSlot('');
      await loadSlots();
    } finally {
      setBusy(false);
    }
  };

  return <>
    {!open && <button type="button" className="chat-launcher" onClick={() => setOpen(true)} aria-label="Open chat" title="Open chat">
      <MessageCircle size={25} strokeWidth={1.7} aria-hidden="true" />
    </button>}
    {open && <aside className="chat-drawer" aria-label="Elena concierge chat">
      <header className="chat-header">
        <div className="concierge-avatar" aria-hidden="true"><Snowflake size={18} /></div>
        <div className="chat-title"><span className="eyebrow">DISPATCH CONCIERGE</span><h2>Elena <span className="online-label"><i /> ready</span></h2></div>
        <button className="icon-button" onClick={() => setOpen(false)} aria-label="Close chat"><X size={18} /></button>
      </header>
      <div className="chat-messages" aria-live="polite">
        {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>{message.text}</div>)}
        {busy && <div className="chat-bubble assistant typing"><span /><span /><span /></div>}
        {step === intakeFields.length && !busy && !booked && <div className="appointment-panel">
          <div className="appointment-title"><CalendarDays size={15} /><span>AVAILABLE VISIT TIMES</span></div>
          <label className="booking-name">Name for the appointment
            <input value={intake.name} onChange={(event) => setIntake((current) => ({ ...current, name: event.target.value }))} maxLength={80} autoComplete="name" aria-label="Name for the appointment" />
          </label>
          {slotUnavailable ? <p className="slot-empty">Sorry, live appointment times aren’t available just now. Please try again a little later.</p> : <>
            {Object.entries(grouped).map(([date, daySlots]) => <div className="slot-day" key={date}>
              <span className="slot-day-label">{formatSlotDay(date, timeZone)}</span>
              <div className="slot-grid">{daySlots.map((slot) => <button key={slot.start} className={`slot-choice ${selectedSlot === slot.start ? 'selected' : ''}`} onClick={() => setSelectedSlot(slot.start)} disabled={busy}>{formatSlotTime(slot.start, timeZone)}</button>)}</div>
            </div>)}
            <div className="timezone-note"><Clock3 size={12} /> Times shown in {timeZone}</div>
            <label className="consent-line"><input type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} /> <span>Share these details with our booking and email providers to arrange this visit.</span></label>
            <button className="confirm-slot" onClick={() => void confirmBooking()} disabled={!selectedSlot || !consented || busy}>{busy ? 'Confirming…' : 'Confirm appointment'}<ArrowRight size={15} /></button>
          </>}
        </div>}
        {booked && <div className="booking-confirmation"><BadgeCheck size={18} /><span>Appointment confirmed</span></div>}
      </div>
      {step < intakeFields.length && <form className="chat-compose" onSubmit={(event) => { event.preventDefault(); void send(); }}>
        <label className="honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} /></label>
        <input value={input} onChange={(event) => setInput(event.target.value)} maxLength={step === 4 ? 800 : 240} placeholder={busy ? 'Elena is typing…' : 'Type your reply…'} aria-label="Your reply" disabled={busy} />
        <button type="submit" disabled={busy || !input.trim()} aria-label="Send reply"><Send size={16} /></button>
      </form>}
      <p className="chat-footnote">Your details help the team arrange your visit. You can review the name on the appointment before confirming.</p>
    </aside>}
  </>;
}

export default function Home() {
  const [partnerCount, setPartnerCount] = useState(3);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const setupTotal = partnerCount * 2500;
  const monthlyTotal = partnerCount * 1000;
  const firstYearTotal = setupTotal + monthlyTotal * 12;

  const requestSurvey = () => {
    setChatOpen(true);
    setMenuOpen(false);
  };

  return <main className="min-h-screen bg-ink text-paper">
    <div className="status-bar"><span><i className="status-indicator" /> HOME HVAC / PEOPLE BEFORE EQUIPMENT</span><span className="status-right">COMFORT CARE, MADE CLEAR <ArrowUpRight size={12} /></span></div>
    <nav className="site-nav" aria-label="Main navigation">
      <a className="brand" href="#top" aria-label="Apex AI home"><span className="brand-symbol">A</span><span className="brand-name">APEX<small>AI</small></span></a>
      <div id="primary-links" className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <a onClick={() => setMenuOpen(false)} href="#system">Your comfort</a>
        <a onClick={() => setMenuOpen(false)} href="#team">The people</a>
        <a onClick={() => setMenuOpen(false)} href="#partners">For contractors</a>
        <a onClick={() => setMenuOpen(false)} href="#reviews">Homeowner feedback</a>
      </div>
      <button className="nav-cta" onClick={requestSurvey}>Plan a visit <ArrowUpRight size={15} /></button>
      <button className="menu-toggle" aria-expanded={menuOpen} aria-controls="primary-links" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
    </nav>

    <section className="hero" id="top">
      <div className="hero-copy">
        <span className="eyebrow">HOME COMFORT / START WITH A CONVERSATION</span>
        <h1>The right care<br /><i>starts at home.</i></h1>
        <p>Tell us what you’re noticing at home. A clear service request can help the HVAC professional understand your concern before the visit.</p>
        <div className="hero-actions"><button className="button button-primary" onClick={() => document.getElementById('system')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}>How a visit works <ArrowUpRight size={15} /></button><button className="quiet-link" onClick={requestSurvey}>Talk through your needs <ArrowRight size={15} /></button></div>
        <div className="hero-facts"><div><span>01</span><small>Your home<br />comes first</small></div><div><span>02</span><small>Questions<br />are welcome</small></div><div><span>03</span><small>Next steps<br />made clear</small></div></div>
      </div>
      <div className="hero-visual"><Hero3D /><div className="visual-label"><span>APEX AI / HOME HVAC CARE</span><span>A CLOSER LOOK AT THE VISIT</span></div></div>
      <a className="scroll-cue" href="#system"><span>SEE HOW WE WORK</span><ArrowDownRight size={15} /></a>
    </section>

    <section className="manifesto" aria-label="Our approach"><span>LISTEN BEFORE RECOMMENDING</span><i /> <span>COMFORT IS PERSONAL</span><i /> <span>CLEAR SERVICE, STEP BY STEP</span></section>

    <section className="section system-section" id="system">
      <div className="section-heading" data-reveal><span className="eyebrow">01 / YOUR COMFORT</span><h2>Start with your<br /><i>idea of comfort.</i></h2><p>Every home has its own rhythms. A useful conversation begins with what you notice, what you already have, and what you would like to feel different.</p></div>
      <div className="feature-stack">
        <article className="feature-row feature-row-photo" data-reveal><span className="feature-index">01</span><img className="feature-photo" src="/apex-ai-technicians.jpg" alt="HVAC technicians servicing an outdoor unit beside a service van" width={1280} height={698} loading="lazy" /><div><h3>Tell us what you notice</h3><p>Share the room, equipment or concern that brought you here. The first conversation starts with your experience.</p></div><ChevronRight size={17} className="feature-chevron" /></article>
        <article className="feature-row" data-reveal><span className="feature-index">02</span><div className="feature-icon"><Snowflake size={19} /></div><div><h3>Talk through the options</h3><p>An on-site assessment helps a professional understand your home before suggesting a path.</p></div><ChevronRight size={17} className="feature-chevron" /></article>
        <article className="feature-row" data-reveal><span className="feature-index">03</span><div className="feature-icon"><Wrench size={19} /></div><div><h3>Know the next step</h3><p>Leave the conversation understanding what was discussed and what follow-up may be useful.</p></div><ChevronRight size={17} className="feature-chevron" /></article>
        <div className="system-note"><ShieldCheck size={15} /><span>The right equipment and service approach depend on your home, climate and an on-site assessment.</span></div>
      </div>
    </section>

    <section className="team-section" id="team">
      <div className="team-intro" data-reveal><div><span className="eyebrow">02 / THE PEOPLE</span><h2>Good service starts<br /><i>with being heard.</i></h2></div><p>A useful first visit makes room for questions: hear what the homeowner needs, understand the home, and explain possible next steps in plain language.</p></div>
      <div className="service-cards">
        <article className="service-card" data-reveal data-depth><span className="card-number">01 / LISTEN</span><div className="service-glyph"><MapPin size={21} /></div><h3>Home &amp; comfort check</h3><p>Talk through the rooms, existing equipment, and the temperatures that feel right to you.</p><span className="card-rule" /></article>
        <article className="service-card" data-reveal data-depth><span className="card-number">02 / PLAN</span><div className="service-glyph"><Wrench size={21} /></div><h3>Work planned together</h3><p>Discuss the proposed setup, access, controls and timing before work begins.</p><span className="card-rule" /></article>
        <article className="service-card" data-reveal data-depth><span className="card-number">03 / FOLLOW UP</span><div className="service-glyph"><Clock3 size={21} /></div><h3>Support after the visit</h3><p>Understand what was completed and where to turn when service or maintenance is needed.</p><span className="card-rule" /></article>
      </div>
      <div className="directory-note" data-reveal><BadgeCheck size={16} /><p><strong>Professional details</strong><br />Profiles appear only after licensing and service-area information is verified. We do not list professional credentials here without supporting records.</p><button onClick={requestSurvey}>Ask about a service visit <ArrowUpRight size={14} /></button></div>
    </section>

    <section className="partner-section" id="partners">
      <div className="partner-copy" data-reveal><span className="eyebrow">03 / FOR CONTRACTORS</span><h2>Better care takes<br /><i>good partners.</i></h2><p>A homeowner’s experience is shaped by the people behind the equipment. Apex AI gives contractors a way to explore a clearer path from first conversation to visit and ongoing care.</p><ul><li><Check size={15} /> A defined setup engagement</li><li><Check size={15} /> A consistent monthly retainer</li><li><Check size={15} /> A homeowner-first service journey</li></ul><button className="partner-link" onClick={requestSurvey}>Explore a partnership <ArrowUpRight size={15} /></button></div>
      <div className="calculator glass-panel" data-reveal data-depth>
        <div className="calc-top"><span>PARTNER PROGRAM / ESTIMATE</span><span className="calc-mark">A / 01</span></div>
        <h3>View a sample partner estimate</h3>
        <label className="range-label" htmlFor="partner-count">Partner accounts <strong>{partnerCount}</strong></label>
        <input id="partner-count" type="range" min="1" max="12" step="1" value={partnerCount} onChange={(event) => setPartnerCount(Number(event.target.value))} />
        <div className="range-ends"><span>1 partner</span><span>12 partners</span></div>
        <div className="calc-primary"><span>Illustrative first-year gross</span><strong>${firstYearTotal.toLocaleString('en-US')}</strong></div>
        <div className="calc-breakdown"><div><span>One-time setup</span><b>${setupTotal.toLocaleString('en-US')}</b></div><div><span>Monthly retainer</span><b>${monthlyTotal.toLocaleString('en-US')} / mo</b></div></div>
        <p className="calc-disclaimer">Example only, before delivery costs. Uses $2,500 setup and $1,000 per month per account for 12 months.</p>
        <button className="button button-light" onClick={requestSurvey}>Ask about working together <ArrowUpRight size={15} /></button>
      </div>
    </section>

    <section className="reviews-section" id="reviews">
      <div className="reviews-intro" data-reveal><span className="eyebrow">04 / HOMEOWNER FEEDBACK</span><h2>Trust grows from<br /><i>real experiences.</i></h2><p>Feedback should reflect a real visit and be shared with the homeowner’s permission.</p></div>
      <div className="review-empty glass-panel" data-reveal data-depth><span className="review-seal"><ShieldCheck size={23} /></span><span className="eyebrow">REAL SERVICE, REAL VOICES</span><h3>Nothing made up.</h3><p>This space is for feedback from completed visits, shared with the homeowner’s permission. No rating or testimonial is published without that confirmation.</p><button onClick={requestSurvey}>Ask about a service visit <ArrowUpRight size={15} /></button></div>
    </section>

    <section className="closing-band" data-reveal><div><span className="eyebrow">THE NEXT STEP STARTS AT HOME</span><h2>Tell us what<br /><i>comfort means to you.</i></h2></div><button className="button button-primary" onClick={requestSurvey}>Arrange a visit <ArrowUpRight size={15} /></button></section>

    <footer className="site-footer"><a className="brand" href="#top"><span className="brand-symbol">A</span><span className="brand-name">APEX<small>AI</small></span></a><span className="footer-note">HOME HVAC / CARE, MADE CLEAR</span><button onClick={requestSurvey}>Start a conversation <ArrowUpRight size={14} /></button></footer>

    <SiteMotion />
    <Concierge open={chatOpen} setOpen={setChatOpen} />
  </main>;
}
