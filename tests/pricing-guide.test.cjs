const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const page = read('app/page.tsx');
const layout = read('app/layout.tsx');

test('Apex displays the approved Gemini design in a same-origin isolated document', () => {
  assert.match(page, /src="\/apex-experience\.html"/);
  assert.match(page, /title="Apex AI — Autonomous dispatch and seamless client flow"/);
  assert.doesNotMatch(page, /<Hero \/>|<Cursor \/>/);
  const html = read('public/apex-experience.html');
  assert.match(html, /AUTONOMOUS DISPATCH/);
  assert.match(html, /SEAMLESS CLIENT FLOW/);
  assert.match(html, /calls-slider/);
  assert.match(html, /card-inner/);
});

test('HVAC client relationship photo is a local, optimized WebP', () => {
  const html = read('public/apex-experience.html');
  assert.match(html, /\/apex-client-relationship\.webp/);
  const photo = fs.readFileSync(path.join(__dirname, '..', 'public', 'apex-client-relationship.webp'));
  assert.equal(photo.toString('ascii', 0, 4), 'RIFF');
  assert.equal(photo.toString('ascii', 8, 12), 'WEBP');
  assert.ok(photo.length < 500_000);
});

test('only the trusted Apex experience can open existing Elena', () => {
  assert.match(page, /event\.origin !== window\.location\.origin/);
  assert.match(page, /event\.source !== experience\.current\?\.contentWindow/);
  assert.match(page, /event\.data\?\.type !== 'apex:open-elena'/);
  assert.match(page, /setQuoteService\('HVAC service visit'\)/);
  assert.match(page, /setChatOpen\(true\)/);
  assert.match(page, /showLauncher=\{false\}/);
  const html = read('public/apex-experience.html');
  assert.match(html, /apex:open-elena/);
});

test('original Elena intake order and native Cal.com booking APIs remain intact', () => {
  assert.match(page, /const intakeFields: IntakeStep\[\] = \['name', 'phone', 'email', 'address', 'problem'\]/);
  assert.match(page, /fetch\('\/api\/concierge'/);
  assert.match(page, /fetch\(`\/api\/slots\?/);
  assert.match(page, /fetch\('\/api\/book'/);
  assert.match(page, /Cal\.com will send your confirmation email/);
});

test('new metadata matches the reference and only the experience allows same-origin framing', () => {
  assert.match(layout, /Apex AI — Autonomous Dispatch & Seamless Client Flow/);
  assert.doesNotMatch(layout, /preload.*apex-hvac\//);
  const config = JSON.parse(read('vercel.json'));
  assert.ok(config.headers[0].headers.some(h => h.key === 'X-Frame-Options' && h.value === 'DENY'));
  const experience = config.headers.find(h => h.source === '/apex-experience.html');
  assert.ok(experience.headers.some(h => h.key === 'X-Frame-Options' && h.value === 'SAMEORIGIN'));
  assert.ok(experience.headers.some(h => h.key === 'Content-Security-Policy' && h.value === "frame-ancestors 'self'"));
});
