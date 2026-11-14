const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const component = read('app/components/HVACStory.tsx');
const page = read('app/page.tsx');
const layout = read('app/layout.tsx');
const styles = read('app/experience.css');

test('HVAC story replaces the regional pricing UI and navigation', () => {
  assert.match(page, /HVACStory onRequestQuote=\{requestSurvey\}/);
  assert.doesNotMatch(page, /HVACPricingGuide|href="#pricing"|Price guide|price range/);
  assert.match(component, /Behind every season/);
  assert.match(component, /A system in harmony/);
  assert.match(component, /loading="lazy" decoding="async"/);
  assert.doesNotMatch(component, /Seattle|\$111|price-range/);
});

test('story quote CTA retains concierge context and the original intake order', () => {
  assert.match(component, /onRequestQuote\('HVAC assessment and quote'\)/);
  assert.match(page, /Quote request — \$\{quoteService\}\. Customer reports:/);
  assert.match(page, /intakeFields: IntakeStep\[\] = \['name', 'phone', 'email', 'address', 'problem'\]/);
  assert.match(page, /fetch\('\/api\/book'/);
  assert.match(page, /fetch\('\/api\/concierge'/);
});

test('hero and preload use exactly matching responsive WebP candidates', () => {
  const imageSet = page.match(/srcSet="([^"]+)"/)[1];
  const preloadSet = layout.match(/imageSrcSet="([^"]+)"/)[1];
  assert.equal(imageSet, preloadSet);
  assert.match(page, /sizes="100vw"/);
  assert.match(layout, /imageSizes="100vw"/);
  assert.doesNotMatch(page + layout, /apex-hvac-hero-4k\.jpeg/);
  for (const width of [768, 1280, 1920, 2560]) {
    const asset = path.join(__dirname, `../public/apex-hvac-hero-${width}.webp`);
    assert.ok(fs.statSync(asset).size < 550000);
  }
  assert.ok(fs.statSync(path.join(__dirname, '../public/apex-hvac-hero-768.webp')).size < 80000);
});

test('cinematic motion remains enabled and decorative Three.js is deferred', () => {
  const deferred = read('app/components/DeferredComfortScene.tsx');
  assert.match(deferred, /dynamic\(\(\) => import\('\.\/ComfortScene'\)/);
  assert.match(deferred, /IntersectionObserver/);
  assert.match(deferred, /return ready \? <ComfortScene \/> : null/);
  assert.match(styles, /\.hvac-story\.in-view.*animation:comfort-photo/);
  assert.match(styles, /@keyframes story-airflow/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
});
