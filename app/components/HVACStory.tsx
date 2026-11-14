'use client';

import { ArrowUpRight } from 'lucide-react';

const chapters = [
  { number: '01', title: 'Listen to the home.', copy: 'The room that runs warm. The sound that changed. Every comfort story starts with what you notice.' },
  { number: '02', title: 'Find the connection.', copy: 'Heating, cooling and airflow work together. An on-site assessment helps reveal the next right step.' },
  { number: '03', title: 'Bring comfort back.', copy: 'A considered plan. Clear recommendations. A home that feels like yours, in every season.' },
];

export default function HVACStory({ onRequestQuote }: { onRequestQuote: (service?: string) => void }) {
  return <section className="hvac-story" id="hvac-story" aria-labelledby="hvac-story-title">
    <div className="hvac-story-visual">
      <img src="/apex-hvac-outdoor-service.jpeg" alt="HVAC technician carefully inspecting an outdoor cooling system" width="1200" height="627" loading="lazy" decoding="async" />
      <div className="hvac-story-shade" />
      <div className="hvac-story-caption"><span className="eyebrow">02 / THE INVISIBLE, MADE COMFORTABLE</span><span>HEAT / AIR / BALANCE</span></div>
      <div className="hvac-story-heading"><span className="eyebrow">A HOME COMFORT STORY</span><h2 id="hvac-story-title">Behind every season.<br /><i>A system in harmony.</i></h2><p>Good comfort is felt, not seen.</p></div>
      <div className="hvac-story-air" aria-hidden="true"><i /><i /><i /></div>
    </div>
    <div className="hvac-story-chapters">{chapters.map(chapter => <article key={chapter.number}><span>{chapter.number} / APEX</span><h3>{chapter.title}</h3><p>{chapter.copy}</p></article>)}</div>
    <div className="hvac-story-next"><p>Your home. Your questions. A clearer next step.</p><button className="visit-cta" onClick={() => onRequestQuote('HVAC assessment and quote')}>Talk through your home <ArrowUpRight size={17} /></button></div>
  </section>;
}
