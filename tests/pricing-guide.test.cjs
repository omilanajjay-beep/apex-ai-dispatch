const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const page = read('app/page.tsx');
const layout = read('app/layout.tsx');
const visual = read('app/components/OutboxExperience.tsx');
const css = read('app/components/OutboxExperience.module.css');

test('Apex renders the supplied scroll-driven OUTBOX design directly in React', () => {
  assert.match(page, /<OutboxExperience onTalk=\{openElena\} \/>/);
  assert.doesNotMatch(page, /<iframe|addEventListener\('message'/);
  for (const text of ['Think outside', 'the box.', 'Elevating Brands.', 'Defining Futures.', 'Brand Identity', 'Digital Marketing', 'Web Experience', 'Featured Work', "LET'S TALK."]) assert.ok(visual.includes(text), text);
  assert.match(visual, /useScroll\(\{ target: containerRef/);
  assert.match(visual, /useTransform/);
  assert.match(css, /height:400vh/);
  assert.match(css, /height:300vh;margin-top:-100vh/);
});

test('HVAC client relationship replacements are local optimized WebP photographs and playable MP4 backgrounds', () => {
  for (const name of ['consultation', 'home-comfort', 'service-visit']) {
    const photo = fs.readFileSync(path.join(__dirname, '..', 'public', `hvac-${name}.webp`));
    assert.equal(photo.toString('ascii', 0, 4), 'RIFF');
    assert.equal(photo.toString('ascii', 8, 12), 'WEBP');
    assert.ok(photo.length < 500_000);
  }
  for (const name of ['consultation', 'comfort', 'service']) {
    const video = fs.readFileSync(path.join(__dirname, '..', 'public', `hvac-${name}-motion.mp4`));
    assert.equal(video.toString('ascii', 4, 8), 'ftyp');
    assert.ok(video.length < 1_000_000);
  }
  assert.match(visual, /autoPlay loop muted playsInline/);
  assert.doesNotMatch(visual, /strvid\.nyc3|cloudinary/);
});

test('the in-tree visual invokes Elena through an explicit callback and retains the visible launcher', () => {
  assert.match(page, /const openElena = \(\) =>/);
  assert.match(page, /setQuoteService\('HVAC service visit'\)/);
  assert.match(page, /setChatOpen\(true\)/);
  assert.match(page, /showLauncher=\{true\}/);
  assert.match(visual, /onClick=\{onTalk\}/);
  assert.doesNotMatch(page, /postMessage|addEventListener\('message'/);
});

test('original Elena intake order and native Cal.com booking APIs remain intact', () => {
  assert.match(page, /const intakeFields: IntakeStep\[\] = \['name', 'phone', 'email', 'address', 'problem'\]/);
  assert.match(page, /fetch\('\/api\/concierge'/);
  assert.match(page, /fetch\(`\/api\/slots\?/);
  assert.match(page, /fetch\('\/api\/book'/);
  assert.match(page, /Cal\.com will send your confirmation email/);
});

test('metadata and original framing security configuration remain intact', () => {
  assert.match(layout, /Apex AI — Autonomous Dispatch & Seamless Client Flow/);
  const config = JSON.parse(read('vercel.json'));
  assert.ok(config.headers[0].headers.some(h => h.key === 'X-Frame-Options' && h.value === 'DENY'));
  const experience = config.headers.find(h => h.source === '/apex-experience.html');
  assert.ok(experience.headers.some(h => h.key === 'X-Frame-Options' && h.value === 'SAMEORIGIN'));
});

test('specified palette, blend masks, responsive accordion, keyboard navigation and reduced motion are present', () => {
  for (const color of ['#f24d29', '#c63d25', '#963222', '#691c10']) assert.ok(css.includes(color), color);
  for (const mode of ['overlay', 'screen', 'multiply']) assert.ok(css.includes(`mix-blend-mode:${mode}`), mode);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(visual, /useReducedMotion/);
  assert.match(visual, /onFocus=\{\(\) => setActive\(index\)\}/);
  assert.match(visual, /aria-expanded=\{active === index\}/);
  assert.match(visual, /event.key === 'Escape'/);
  assert.match(visual, /event.key === 'Tab'/);
  assert.match(css, /flex-direction:column;height:75vh/);
});
