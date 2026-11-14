'use client';

import { useState } from 'react';
import { ArrowUpRight, Check, MapPin } from 'lucide-react';

type PriceGuide = {
  id: string;
  name: string;
  shortName: string;
  range: string;
  scope: string;
  detail: string;
  sourceLabel: string;
  sourceUrl: string;
};

const priceGuides: PriceGuide[] = [
  {
    id: 'repair',
    name: 'HVAC repair',
    shortName: 'Repair',
    range: '$111–$3,333',
    scope: 'Published Seattle-area repair range',
    detail: 'Repair costs vary widely with the fault, parts, system access and timing. Angi lists standard labor around $80–$150 per hour, with after-hours labor up to $275 per hour.',
    sourceLabel: 'Angi · Seattle HVAC repair costs',
    sourceUrl: 'https://www.angi.com/articles/how-much-hvac-repair-cost/wa/seattle',
  },
  {
    id: 'furnace',
    name: 'Furnace replacement',
    shortName: 'Furnace',
    range: '$5,500–$8,500',
    scope: 'Published Seattle-area replacement range',
    detail: 'A regional reference for furnace replacement. The actual quote depends on equipment choice, home requirements, installation conditions and any related work.',
    sourceLabel: 'Product Air · Seattle-area furnace costs',
    sourceUrl: 'https://productairheating.com/blog/furnace-replacement-cost-seattle-western-washington/',
  },
  {
    id: 'heat-pump',
    name: 'Heat-pump installation',
    shortName: 'Heat pump',
    range: '$6,667–$13,852',
    scope: 'Typical 3-ton system · installed',
    detail: 'Home Comfort Alliance attributes this Seattle-area estimate to Angi; its detailed 3-ton table rounds to $6,670–$13,850. System sizing, electrical work, ducting and site conditions affect the final price.',
    sourceLabel: 'Home Comfort Alliance · Seattle heat-pump guide',
    sourceUrl: 'https://homecomfortalliance.com/heating-installation/heat-pump/heat-pump-cost/',
  },
];

export default function HVACPricingGuide({ onRequestQuote }: { onRequestQuote: (service: string) => void }) {
  const [activeId, setActiveId] = useState(priceGuides[0].id);
  const active = priceGuides.find((guide) => guide.id === activeId) ?? priceGuides[0];

  return (
    <section className="price-guide" id="pricing" aria-labelledby="price-guide-title">
      <div className="price-guide-heading">
        <div>
          <span className="eyebrow">02 / REGIONAL PRICE REFERENCES</span>
          <h2 id="price-guide-title">Start with a range.<br /><i>Finish with a real quote.</i></h2>
        </div>
        <div className="price-guide-lede">
          <p>Use these public Seattle-area figures for planning—not as Apex AI prices or a promise of what your project will cost.</p>
          <span className="price-area"><MapPin size={14} /> SEATTLE-AREA REFERENCES</span>
        </div>
      </div>

      <div className="price-guide-grid">
        <div className="price-guide-main">
          <div className="price-selector" role="group" aria-label="Choose an HVAC service to see a regional estimate">
            {priceGuides.map((guide) => (
              <button key={guide.id} type="button" className={`price-option ${active.id === guide.id ? 'selected' : ''}`} aria-pressed={active.id === guide.id} onClick={() => setActiveId(guide.id)}>
                <span>{guide.shortName}</span><span className="price-option-arrow"><ArrowUpRight size={15} /></span>
              </button>
            ))}
          </div>

          <article className="price-result" aria-live="polite">
            <div className="price-result-top"><span className="eyebrow">REGIONAL THIRD-PARTY ESTIMATE</span><span className="price-result-index">01 — 03</span></div>
            <h3>{active.name}</h3>
            <p className="price-scope">{active.scope}</p>
            <p className="price-range">{active.range}</p>
            <p className="price-detail">{active.detail}</p>
            <a className="price-source" href={active.sourceUrl} target="_blank" rel="noreferrer">Source: {active.sourceLabel}<ArrowUpRight size={14} /></a>
            <button type="button" className="price-quote-button" onClick={() => onRequestQuote(active.name)}>Request an on-site quote <ArrowUpRight size={16} /></button>
          </article>
        </div>

        <aside className="quote-request-card" aria-label="Request a home-specific HVAC quote">
          <div className="quote-request-photo"><img src="/apex-hvac-outdoor-service.jpeg" alt="HVAC technician inspecting an outdoor air-conditioning unit at a home" loading="lazy" width="1200" height="627" /></div>
          <div className="quote-request-copy">
            <span className="eyebrow">BUILT AROUND YOUR HOME</span>
            <h3>A number you can plan around.</h3>
            <p>Ask Elena to arrange an assessment. A qualified professional can review your system and provide a home-specific quote before you decide.</p>
            <button type="button" className="quote-request-link" onClick={() => onRequestQuote(active.name)}>Talk through {active.shortName.toLowerCase()} pricing <ArrowUpRight size={17} /></button>
            <div className="quote-promise"><Check size={15} /><span>Site-specific quote required. No instant price promises.</span></div>
          </div>
        </aside>
      </div>

      <p className="price-disclaimer">All figures are regional third-party estimates, not Apex AI prices. They are planning references only; your actual price depends on the equipment, home and work required. Request an assessment for a site-specific quote.</p>
    </section>
  );
}
