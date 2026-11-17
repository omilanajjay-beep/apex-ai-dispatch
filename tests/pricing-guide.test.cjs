const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const page = read('app/page.tsx');
const layout = read('app/layout.tsx');
const visual = read('app/components/HvacRunway.tsx');
const css = read('app/components/HvacRunway.module.css');

test('Apex renders a six-stop HVAC Runway directly in React without commerce content', () => {
  assert.match(page, /<HvacRunway onBook=\{openElena\} chatOpen=\{chatOpen\} \/>/);
  assert.doesNotMatch(page, /<iframe|addEventListener\('message'/);
  for (const text of ['AIR CONDITIONING', 'HEATING & FURNACES', 'SYSTEM REPLACEMENT', 'PREVENTIVE MAINTENANCE', 'DIAGNOSTICS & REPAIR', 'HOME COMFORT CONSULTATION']) assert.ok(visual.includes(text), text);
  assert.doesNotMatch(visual, /Nike|shopping bag|Add to bag|Tshirt|Sweatshirt|Shopify/);
  assert.match(visual, /Math\.cos\(theta\)/);
  assert.match(visual, /Math\.sin\(theta\)/);
  assert.match(visual, /requestAnimationFrame\(step\)/);
});

test('all six supplied HVAC photos have local, optimized mobile, desktop and thumbnail variants', () => {
  for (const name of ['client-outdoor-unit', 'comfort-consultation', 'home-consult', 'technician-homeowner', 'technician-repair', 'technician-service']) {
    for (const size of [240,640,1000]) {
      const photo = fs.readFileSync(path.join(__dirname, '..', 'public', 'hvac-runway', `${name}-${size}.webp`));
      assert.equal(photo.toString('ascii', 0, 4), 'RIFF');
      assert.equal(photo.toString('ascii', 8, 12), 'WEBP');
      assert.ok(photo.length < (size === 640 ? 70000 : 150000));
    }
  }
  assert.match(visual, /<source media="\(max-width: 749px\)"/);
  assert.match(visual, /fetchPriority=\{i === 0 \? 'high' : 'auto'\}/);
});

test('service CTAs invoke the existing Elena flow with service context and retain the visible launcher', () => {
  assert.match(page, /const openElena = \(service: string\) =>/);
  assert.match(page, /setQuoteService\(service\)/);
  assert.match(page, /setChatOpen\(true\)/);
  assert.match(page, /showLauncher=\{true\}/);
  assert.match(visual, /onBook\(name\)/);
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

test('Runway preserves depth blur, mobile diagonal motion, unobstructed service photos, keyboard navigation and native detail dialog', () => {
  for (const color of ['#0d1b2d', '#f7f5ef', '#b49a66']) assert.ok(css.includes(color), color);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(visual, /prefers-reduced-motion: reduce/);
  assert.match(visual, /mobile \? \(1 - depth\) \* -70 \+ x \* -\.20/);
  assert.match(visual, /blur\(\$\{blur\}px\)/);
  assert.match(visual, /e\.key === 'ArrowRight'/);
  assert.match(visual, /onPointerMove/);
  assert.match(visual, /onPointerUp/);
  assert.doesNotMatch(visual, /data-pin|className=\{styles\.pin\}/);
  assert.match(visual, /className=\{styles\.ticks\}/);
  assert.match(visual, /showModal\(\)/);
  assert.match(visual, /aria-labelledby="service-detail-title"/);
  assert.match(css, /scroll-snap-type:x mandatory/);
});

test('Runway starts immediately at five-second intervals, has no pause control and holds for Elena or details', () => {
  assert.match(visual, /setTimeout\(\(\) => go\(Math\.round\(target\.current\) \+ 1\), 5000\)/);
  assert.match(visual, /if \(detail !== null \|\| chatOpen \|\| dragging\) return/);
  assert.doesNotMatch(visual, /Pause motion|Play motion|Pause automatic tour|Resume automatic tour|data-idle-tour-control|IntersectionObserver|useIdleTour/);
  assert.match(css, /animation:fill 5s linear forwards/);
});
