const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const page = read('app/page.tsx');
const layout = read('app/layout.tsx');
const hero = read('app/components/ApexZipHero.tsx');
const heroCss = read('app/components/ApexZipHero.module.css');
const canvas = read('app/components/ApexPhotoCanvas.tsx');
const globalCss = read('app/globals.css');

test('the Apex home page is the complete ZIP-inspired HVAC screen, not the old multisection page', () => {
  assert.match(page, /<ApexZipHero onRequestQuote=\{requestSurvey\}/);
  assert.match(page, /<Concierge open=\{chatOpen\}/);
  assert.doesNotMatch(page, /DeferredComfortScene|ExperienceMotion|ComfortSystemsCarousel|HVACStory|comfort-intro|comfort-finale|experience-footer|service-gallery|comfort-metrics-section/);
  assert.doesNotMatch(page, /<section|<footer/);
  assert.match(hero, /Every zone/);
  assert.match(hero, /tells a story\./);
  assert.doesNotMatch(hero, /#services|#hvac-story|#approach|#finale/);
});

test('HVAC navigation and hero actions enter Elena while preserving the original intake and API routes', () => {
  assert.match(hero, /\['Cooling', 'Air conditioning repair'\]/);
  assert.match(hero, /\['Heating', 'Heating & furnace care'\]/);
  assert.match(hero, /\['Maintenance', 'Seasonal maintenance'\]/);
  assert.match(hero, /\['Air quality', 'Indoor air quality'\]/);
  assert.match(hero, /onClick=\{\(\) => requestQuote\(service\)\}/);
  assert.match(hero, /onClick=\{\(\) => requestQuote\('HVAC assessment and quote'\)\}/);
  assert.match(page, /Quote request — \$\{quoteService\}\. Customer reports:/);
  assert.match(page, /intakeFields: IntakeStep\[\] = \['name', 'phone', 'email', 'address', 'problem'\]/);
  assert.match(page, /fetch\('\/api\/book'/);
  assert.match(page, /fetch\('\/api\/concierge'/);
});

test('Apex hero and preload use the same fast responsive HVAC image variants', () => {
  const imageSet = hero.match(/const photoSrcSet = '([^']+)'/)[1];
  const preloadSet = layout.match(/imageSrcSet="([^"]+)"/)[1];
  assert.equal(imageSet, preloadSet);
  assert.match(hero, /sizes="\(max-width: 1023px\) 88vw, 42vw"/);
  assert.match(layout, /imageSizes="\(max-width: 1023px\) 88vw, 42vw"/);
  assert.doesNotMatch(hero + layout, /apex-hvac-hero-4k\.jpeg/);
  for (const width of [768, 1200]) {
    const asset = path.join(__dirname, `../public/apex-hvac-outdoor-${width}.webp`);
    assert.ok(fs.statSync(asset).size < 100000);
  }
  assert.match(hero, /fetchPriority="high"/);
  assert.match(hero, /HVAC technician inspecting an outdoor air conditioning unit/);
});

test('the ZIP-style intro and image reveal stay animated and honor reduced-motion preferences', () => {
  assert.match(heroCss, /height: 100svh/);
  assert.match(heroCss, /@keyframes photoBreathe/);
  assert.match(heroCss, /prefers-reduced-motion: reduce/);
  assert.match(hero, /timeline\.to\(progress/);
  assert.match(canvas, /createRadialGradient/);
  assert.match(canvas, /requestAnimationFrame/);
  assert.match(globalCss, /font-family: 'Instrument Sans'/);
});
