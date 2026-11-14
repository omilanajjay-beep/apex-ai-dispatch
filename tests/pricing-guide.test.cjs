const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const component = fs.readFileSync(path.join(__dirname, '../app/components/HVACPricingGuide.tsx'), 'utf8');
const page = fs.readFileSync(path.join(__dirname, '../app/page.tsx'), 'utf8');
const layout = fs.readFileSync(path.join(__dirname, '../app/layout.tsx'), 'utf8');
const styles = fs.readFileSync(path.join(__dirname, '../app/experience.css'), 'utf8');

test('price guide shows the supplied regional HVAC ranges and citations', () => {
  assert.match(component, /\$111–\$3,333/);
  assert.match(component, /\$80–\$150 per hour/);
  assert.match(component, /up to \$275 per hour/);
  assert.match(component, /\$5,500–\$8,500/);
  assert.match(component, /\$6,667–\$13,852/);
  assert.match(component, /angi\.com\/articles\/how-much-hvac-repair-cost\/wa\/seattle/);
  assert.match(component, /productairheating\.com\/blog\/furnace-replacement-cost-seattle-western-washington/);
  assert.match(component, /homecomfortalliance\.com\/heating-installation\/heat-pump\/heat-pump-cost/);
});

test('regional references are explicitly not Apex AI prices and require a site-specific quote', () => {
  assert.match(component, /Seattle-area figures for planning—not as Apex AI prices/);
  assert.match(component, /All figures are regional third-party estimates, not Apex AI prices/);
  assert.match(component, /site-specific quote/);
  assert.match(component, /aria-live="polite"/);
});

test('estimate quote buttons open the current concierge with service context in the HVAC issue intake', () => {
  assert.match(component, /onRequestQuote\(active\.name\)/);
  assert.match(page, /HVACPricingGuide onRequestQuote=\{requestSurvey\}/);
  assert.match(page, /quoteService\.toLowerCase\(\).*quote/s);
  assert.match(page, /Quote request — \$\{quoteService\}\. Customer reports:/);
  assert.match(page, /intakeFields: IntakeStep\[\] = \['name', 'phone', 'email', 'address', 'problem'\]/);
});

test('cinematic hero uses the owner-provided 4K photo with dimensions and responsive motion styles', () => {
  assert.match(page, /src="\/apex-hvac-hero-4k\.jpeg"[^>]*width="4096" height="3072"/);
  assert.match(layout, /rel="preload" as="image" href="\/apex-hvac-hero-4k\.jpeg"/);
  assert.match(styles, /\.comfort-hero \{[\s\S]*?height: 100svh/);
  assert.match(styles, /\.hero-quote-actions \.round-link:hover/);
  assert.match(styles, /@media \(max-width: 560px\)[\s\S]*?\.price-guide/);
});
