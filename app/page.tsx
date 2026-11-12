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
  Sun,
  Moon,
  Snowflake,
  Wrench,
  X,
} from 'lucide-react';
import ComfortScene from './components/ComfortScene';
import ExperienceMotion from './components/ExperienceMotion';
import ComfortSystemsCarousel from './components/ComfortSystemsCarousel';

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
        text: `${intake.name ? `${intake.name}, you’re all set! ` : 'You’re all set! '}Your appointment is confirmed. Cal.com will send your confirmation email.`,
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

const services = [
  ['Cooling, restored.', 'Air conditioning repair', 'Uneven temperatures, warm air or an unfamiliar sound? Start with a clear diagnosis, not a guess.', '/hvac-service.webp'],
  ['Warmth, without worry.', 'Heating & furnace care', 'Talk through cold rooms, heating interruptions and the next step toward a comfortable home.', '/hvac-detail.jpg'],
  ['A smarter kind of comfort.', 'Heat pump systems', 'Explore heating and cooling in one system, with a plan suited to your home and climate.', '/hvac-heatpump.jpg'],
  ['Small system. Big difference.', 'Ductless mini-splits', 'Discuss targeted comfort for a new room, a home office or a space your existing system misses.', '/hvac-detail.jpg'],
  ['Keep the good air flowing.', 'Seasonal maintenance', 'Give your equipment attention before the weather changes. Ask about checks, cleaning and upkeep.', '/apex-ai-technicians.jpg'],
  ['Fresh thinking, indoors.', 'Indoor air quality', 'Bring your questions about filtration, ventilation and the air moving through your home.', '/hvac-heatpump.jpg'],
  ['Every room belongs.', 'Airflow & ductwork', 'Explore why one room feels different, and what an on-site airflow assessment can reveal.', '/hvac-service.webp'],
  ['Comfort at your fingertips.', 'Thermostat & controls', 'Make sense of schedules, settings and controls so your system works around your day.', '/hvac-detail.jpg'],
  ['A better next chapter.', 'System replacement', 'Compare options after an assessment of your existing equipment, space and comfort priorities.', '/hvac-heatpump.jpg'],
  ['Find the reason first.', 'System diagnostics', 'Describe leaks, strange noises, cycling or reduced performance. Let the visit start with context.', '/apex-ai-technicians.jpg'],
  ['Built around your home.', 'Installation planning', 'Discuss equipment placement, access, timing and the practical details before work begins.', '/hvac-service.webp'],
  ['Ready for what’s next.', 'Year-round comfort', 'Make a practical plan for the seasons ahead, from everyday upkeep to future improvements.', '/hvac-heatpump.jpg'],
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [light, setLight] = useState(false);
  const [activeService, setActiveService] = useState<number | null>(null);
  const requestSurvey = () => { setChatOpen(true); setMenuOpen(false); };

  return <main className={`experience ${light ? 'theme-light' : ''}`} id="top">
    <ComfortScene />
    <nav className="experience-nav" aria-label="Main navigation">
      <a className="brand" href="#top" aria-label="Apex AI home"><span className="brand-symbol">A</span><span className="brand-name">APEX<small>AI</small></span></a>
      <div id="primary-links" className={`experience-links ${menuOpen ? 'open' : ''}`}>
        <a href="#services" onClick={() => setMenuOpen(false)}>Our expertise</a><a href="#approach" onClick={() => setMenuOpen(false)}>The Apex approach</a><a href="#finale" onClick={() => setMenuOpen(false)}>Let’s talk</a>
      </div>
      <div className="nav-tools"><button className="theme-toggle" onClick={() => setLight(!light)} aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'}>{light ? <Moon size={17} /> : <Sun size={17} />}</button><button className="visit-cta" onClick={requestSurvey}>Plan a visit <ArrowUpRight size={16} /></button><button className="menu-toggle" aria-expanded={menuOpen} aria-controls="primary-links" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button></div>
    </nav>

    <section className="comfort-hero" aria-labelledby="comfort-title">
      <div className="hero-photograph"><img src="/hvac-heatpump.jpg" alt="Outdoor heat pump beside a bright modern home" fetchPriority="high" /><div className="photo-shade" /></div>
      <div className="hero-topline"><span className="eyebrow">APEX AI / HEATING · COOLING · HOME COMFORT</span><span className="edition">A BREATH OF SOMETHING BETTER — 01</span></div>
      <div className="comfort-heading"><h1 id="comfort-title"><span className="headline-first">Feel at home.</span><span className="headline-second"><i>In every season.</i></span></h1><div className="hero-bottom-copy"><p>Real homes. Real comfort.<br />Thoughtful HVAC care, from the first conversation to the next clear step.</p><button className="round-link" onClick={requestSurvey}><span>Find your comfort</span><span className="round-arrow"><ArrowUpRight size={23} /></span></button></div></div>
      <div className="hero-bottomline"><a href="#services">SCROLL TO EXPLORE <ArrowDownRight size={15} /></a><span>HEATING / COOLING / EVERYTHING BETWEEN</span></div>
    </section>

    <section className="comfort-intro" id="approach"><span className="eyebrow">01 / THE APEX APPROACH</span><div><h2>Your home has a rhythm.<br /><i>We help you find it.</i></h2><p>Not just equipment. The room that never cools down. The first cold morning. The air your family breathes. Tell us what you notice — we’ll help make the next step clear.</p></div><span className="intro-index">A / AI</span></section>

    <ComfortSystemsCarousel onPlanVisit={requestSurvey} />

    <section className="expertise" id="services" aria-labelledby="expertise-title">
      <div className="expertise-heading"><div><span className="eyebrow">02 / A WHOLE WORLD OF HOME COMFORT</span><h2 id="expertise-title">Good air.<br /><i>Better living.</i></h2></div><p>Twelve ways to start a better conversation about your home. Explore a service, then tell Elena what you need.</p></div>
      <div className="service-gallery">{services.map(([headline, title, summary, image], index) => <article className={`comfort-card ${activeService === index ? 'active' : ''}`} key={title} onMouseEnter={() => { setActiveService(index); window.dispatchEvent(new CustomEvent('apex-service-hover', { detail: index })); }} onMouseLeave={() => { setActiveService(null); window.dispatchEvent(new CustomEvent('apex-service-hover', { detail: -1 })); }}>
        <button className="service-image" onClick={requestSurvey} onFocus={() => setActiveService(index)} onBlur={() => setActiveService(null)} aria-label={`Ask Elena about ${title}`}><img src={image} alt={title === 'Heat pump systems' || index === 11 ? 'Residential heat pump beside a modern home' : 'HVAC service equipment and professional maintenance'} loading="lazy" width={800} height={520} /><span className="image-number">{String(index + 1).padStart(2, '0')} / APEX</span><span className="service-open"><ArrowUpRight size={22} /></span><span className="hover-headline">{headline}</span></button>
        <div className="service-caption"><h3>{title}</h3><p>{summary}</p></div>
      </article>)}</div>
      <p className="expertise-note"><ShieldCheck size={15} /> Service availability, equipment suitability and recommendations depend on an on-site assessment. Images illustrate service categories, not completed Apex AI projects.</p>
    </section>

    <section className="visit-story"><span className="eyebrow">03 / PEOPLE BEFORE EQUIPMENT</span><h2>Less uncertainty.<br /><i>More understanding.</i></h2><div className="visit-steps"><article><span>01 — LISTEN</span><h3>Start with your story.</h3><p>Tell Elena your name, contact details, property address and what you’re noticing. One clear question at a time.</p></article><article><span>02 — ARRANGE</span><h3>A time that works.</h3><p>Choose from live available visit times, review your details and confirm when you’re ready.</p></article><article><span>03 — UNDERSTAND</span><h3>Know what comes next.</h3><p>A professional can assess your home and explain the options. Cal.com handles your booking confirmation.</p></article></div><button className="visit-cta" onClick={requestSurvey}>Start with a conversation <ArrowUpRight size={17} /></button></section>

    <section className="comfort-finale" id="finale"><div className="blinds" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--blind': i } as React.CSSProperties} />)}</div><div className="finale-content"><span className="eyebrow">YOUR NEXT SEASON STARTS HERE</span><h2 className="split-headline" data-text="Comfort. Reimagined.">Comfort.<br /><i>Reimagined.</i></h2><p>Let’s make home feel like home again.</p><button className="finale-button" onClick={requestSurvey}>Talk to Elena <ArrowUpRight size={24} /></button><span className="finale-small">A REAL CONVERSATION. A CLEARER NEXT STEP.</span></div></section>
    <footer className="experience-footer"><a className="brand" href="#top"><span className="brand-symbol">A</span><span className="brand-name">APEX<small>AI</small></span></a><span>HOME COMFORT, CONSIDERED.</span><a href="#top">BACK TO TOP <ArrowUpRight size={14} /></a></footer>
    <ExperienceMotion />
    <Concierge open={chatOpen} setOpen={setChatOpen} />
  </main>;
}
