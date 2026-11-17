const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const page = read('app/page.tsx');
const layout = read('app/layout.tsx');
const visual = read('app/components/OutboxExperience.tsx');
const css = read('app/components/OutboxExperience.module.css');
const idleTour = read('app/components/useIdleTour.ts');

const publicFile = file => path.join(__dirname, '..', 'public', file);

function assertWebp(file, maxBytes = 500_000) {
  const data = fs.readFileSync(publicFile(file));
  assert.equal(data.toString('ascii', 0, 4), 'RIFF', file);
  assert.equal(data.toString('ascii', 8, 12), 'WEBP', file);
  assert.ok(data.length < maxBytes, `${file} should remain optimized`);
}

function assertMp4(file, maxBytes = 1_000_000) {
  const data = fs.readFileSync(publicFile(file));
  assert.equal(data.toString('ascii', 4, 8), 'ftyp', file);
  assert.ok(data.length < maxBytes, `${file} should remain optimized`);
}

test('Apex restores Outbox directly in React with the giant B/X hero and HVAC media', () => {
  assert.match(page, /import OutboxExperience from ['"]\.\/components\/OutboxExperience['"]/);
  assert.match(page, /<OutboxExperience onTalk=\{openElena\} chatOpen=\{chatOpen\} \/>/);
  assert.doesNotMatch(page, /<iframe|postMessage|addEventListener\('message'/);

  for (const asset of [
    '/perf/hvac-consultation-1280-q80-v1.webp',
    '/perf/hvac-home-comfort-1280-q80-v1.webp',
    '/perf/hvac-service-visit-1280-q80-v1.webp',
    '/apex-hvac-outdoor-1200.webp',
    '/apex-client-relationship.webp',
  ]) assert.match(visual, new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(visual, /<span className=\{styles\.letterB\}>B<\/span>/);
  assert.match(visual, /<span className=\{styles\.letterX\}>X<\/span>/);
  assert.match(visual, /HVAC technician and client/);
  assert.match(visual, /hvac-\$\{scene\}-motion\.mp4/);
});

test('all restored HVAC posters and motion backgrounds are local optimized media', () => {
  for (const file of ['hvac-consultation.webp', 'hvac-home-comfort.webp', 'hvac-service-visit.webp']) assertWebp(file);
  for (const file of ['perf/hvac-consultation-1280-q80-v1.webp', 'perf/hvac-home-comfort-1280-q80-v1.webp', 'perf/hvac-service-visit-1280-q80-v1.webp']) assertWebp(file, 150_000);
  for (const file of ['hvac-consultation-motion.mp4', 'hvac-comfort-motion.mp4', 'hvac-service-motion.mp4']) assertMp4(file);
  assert.match(visual, /autoPlay=\{playing && near && visible\} loop muted playsInline preload="none"/);
  assert.match(visual, /\{near && <source src=\{`\/hvac-\$\{scene\}-motion\.mp4`\}/);
  assert.match(visual, /poster=\{near \? assets\[scene\] : undefined\}/);
  assert.doesNotMatch(visual, /strvid\.nyc3|cloudinary/);
});

test('Outbox CTAs use the existing Elena flow and the launcher remains visible', () => {
  assert.match(page, /const openElena = \(\) =>/);
  assert.match(page, /setQuoteService\('HVAC service visit'\)/);
  assert.match(page, /setChatOpen\(true\)/);
  assert.match(page, /showLauncher=\{true\}/);
  assert.match(visual, /onClick=\{onTalk\}/);
  assert.match(visual, /onTalk: \(\) => void/);
  assert.doesNotMatch(page, /postMessage|addEventListener\('message'/);
});

test('original Elena intake order and native Cal.com booking APIs remain intact', () => {
  assert.match(page, /const intakeFields: IntakeStep\[\] = \['name', 'phone', 'email', 'address', 'problem'\]/);
  assert.match(page, /fetch\('\/api\/concierge'/);
  assert.match(page, /fetch\(`\/api\/slots\?/);
  assert.match(page, /fetch\('\/api\/book'/);
  assert.match(page, /Cal\.com will send your confirmation email/);
  assert.match(page, /quoteService/);
});

test('Outbox keeps the long sticky structure, palette, responsive stack and HVAC-safe reduced-motion fallback', () => {
  assert.match(css, /\.hero\{height:400vh/);
  assert.match(css, /\.heroSticky\{height:100vh;height:100svh;position:sticky;top:0/);
  assert.match(css, /\.services\{height:300vh;margin-top:-100vh/);
  assert.match(css, /\.servicesSticky\{position:sticky;top:0;height:100vh;height:100svh/);
  assert.match(css, /--orange:#f24d29;--dark:#c63d25;--darker:#963222;--darkest:#691c10/);
  assert.match(css, /@media\(max-width:767px\)/);
  assert.match(css, /\.servicesSticky\{flex-direction:column/);
  assert.match(css, /\.accordion\{flex-direction:column;height:75vh/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /url\('\/hvac-consultation\.webp'\)/);
  assert.match(visual, /useScroll\(\{ target: containerRef/);
  assert.match(visual, /useTransform/);
});

test('automatic idle tour is preserved, pauses for Elena and exposes no motion control', () => {
  assert.match(visual, /useIdleTour\(\{ enabled: reduce === false, paused: chatOpen \}\)/);
  assert.match(idleTour, /IDLE_START_MS = 2000/);
  assert.match(idleTour, /requestAnimationFrame\(run\)/);
  assert.match(idleTour, /window\.scrollTo\(\{ top:/);
  assert.match(idleTour, /document\.hidden/);
  assert.match(idleTour, /document\.querySelector\('\.chat-drawer'\)/);
  assert.match(idleTour, /MANUAL_IDLE_MS = 12000/);
  assert.doesNotMatch(visual, /Pause motion|Play motion|Pause automatic tour|Resume automatic tour|data-idle-tour-control/);
  assert.doesNotMatch(css, /tourControl/);
});

test('metadata and framing security configuration remain intact', () => {
  assert.match(layout, /Apex AI — Autonomous Dispatch & Seamless Client Flow/);
  assert.doesNotMatch(layout, /fonts\.googleapis\.com/);
  assert.match(css, /font-family:Inter;font-style:normal;font-weight:400 900;font-display:swap;src:url\('\/fonts\/inter-latin-variable-v1\.woff2'\)/);
  assert.ok(fs.statSync(publicFile('fonts/inter-latin-variable-v1.woff2')).size < 60_000);
  const config = JSON.parse(read('vercel.json'));
  assert.ok(config.headers[0].headers.some(h => h.key === 'X-Frame-Options' && h.value === 'DENY'));
  const experience = config.headers.find(h => h.source === '/apex-experience.html');
  assert.ok(experience.headers.some(h => h.key === 'X-Frame-Options' && h.value === 'SAMEORIGIN'));
});
