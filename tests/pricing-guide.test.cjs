const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const page = read('app/page.tsx');
const layout = read('app/layout.tsx');
const hero = read('app/zip-template/components/Hero.tsx');
const heroCss = read('app/zip-template/components/Hero.module.css');
const nav = read('app/zip-template/components/Nav.tsx');
const navCss = read('app/zip-template/components/Nav.module.css');
const canvas = read('app/zip-template/components/LogCanvas.tsx');
const cursor = read('app/zip-template/components/Cursor.tsx');
const loader = read('app/zip-template/lib/loadImages.ts');
const tokens = read('app/zip-template/styles/tokens.css');
const zipGlobalCss = read('app/zip-template/styles/global.css');

test('Apex displays the original ZIP page rather than the prior HVAC adaptation or legacy sections', () => {
  assert.match(page, /import \{ Hero \} from '\.\/zip-template\/components\/Hero'/);
  assert.match(page, /<Hero \/>/);
  assert.match(page, /<Cursor \/>/);
  assert.doesNotMatch(page, /ApexZipHero|DeferredComfortScene|ExperienceMotion|ComfortSystemsCarousel|HVACStory|comfort-intro|comfort-finale|experience-footer|service-gallery|comfort-metrics-section/);
  assert.match(hero, /Every zone tells a story\./);
  assert.match(hero, /Turn static thermostat data, legacy duct logs, and silent climate shifts into actionable telemetry\./);
  assert.match(hero, /APEX AI transforms historical thermal data into structured dispatch decisions — without losing the story behind it\./);
  assert.match(hero, /Deploy dispatch/);
  assert.match(nav, /Systems[\s\S]*Platform[\s\S]*Dispatch[\s\S]*Telemetry[\s\S]*Integrations[\s\S]*Journal[\s\S]*Contact/);
  assert.match(nav, /https:\/\/assets\.uberdesigner\.ai\/easylog\/logo\.svg/);
});

test('HVAC base and airflow reveal use responsive, lightweight, paired local images', () => {
  assert.match(hero, /const imageTier = window\.matchMedia\('\(max-width: 1023px\)'\)\.matches \? 'mobile' : 'desktop'/);
  assert.match(hero, /fetchImageWithProgress\(`\/apex-hvac\/base-\$\{imageTier\}\.webp`, updateProgress\)/);
  assert.match(hero, /fetchImageWithProgress\(`\/apex-hvac\/airflow-\$\{imageTier\}\.webp`, updateProgress\)/);
  assert.doesNotMatch(hero, /easylog\/log-(?:bare|moss)\.webp/);
  for (const tier of ['mobile', 'desktop']) {
    const base = fs.readFileSync(path.join(__dirname, '..', 'public', 'apex-hvac', `base-${tier}.webp`));
    const airflow = fs.readFileSync(path.join(__dirname, '..', 'public', 'apex-hvac', `airflow-${tier}.webp`));
    assert.equal(base.toString('ascii', 0, 4), 'RIFF');
    assert.equal(base.toString('ascii', 8, 12), 'WEBP');
    assert.equal(airflow.toString('ascii', 0, 4), 'RIFF');
    assert.equal(airflow.toString('ascii', 8, 12), 'WEBP');
    assert.ok(base.length + airflow.length < (tier === 'mobile' ? 75_000 : 140_000), `${tier} image pair should stay lightweight`);
  }
  assert.match(canvas, /targetCtx\.drawImage\(bareImg/);
  assert.match(canvas, /targetCtx\.drawImage\(mossImg/);
  assert.match(loader, /const response = await fetch\(url\)/);
  assert.match(layout, /href="\/apex-hvac\/base-mobile\.webp"[^>]*media="\(max-width: 1023px\)"/);
  assert.match(layout, /href="\/apex-hvac\/airflow-mobile\.webp"[^>]*media="\(max-width: 1023px\)"/);
  assert.match(layout, /href="\/apex-hvac\/base-desktop\.webp"[^>]*media="\(min-width: 1024px\)"/);
  assert.match(layout, /href="\/apex-hvac\/airflow-desktop\.webp"[^>]*media="\(min-width: 1024px\)"/);
  assert.doesNotMatch(layout, /log-(?:bare|moss)\.webp/);
});

test('original ZIP layout and motion modules are used without changing their viewport design', () => {
  assert.match(heroCss, /height: 100svh/);
  assert.match(heroCss, /--sky-0/);
  assert.match(heroCss, /font-size: calc\(184 \* var\(--u\)\)/);
  assert.match(heroCss, /@media \(max-width: 1023px\)/);
  assert.match(navCss, /height: calc\(50 \* var\(--u\)\)/);
  assert.match(hero, /zoom: 2\.6, pixel: 64/);
  assert.match(hero, /gsap\.timeline\(\)/);
  assert.match(canvas, /requestAnimationFrame\(render\)/);
  assert.match(canvas, /createRadialGradient/);
  assert.match(canvas, /window\.addEventListener\('mousemove', onMouseMove\)/);
  assert.match(cursor, /requestAnimationFrame\(loop\)/);
  assert.match(tokens, /--sky-0: #0B1926/);
  assert.match(tokens, /--lime: #D0F24B/);
  assert.match(zipGlobalCss, /font-family: 'Instrument Sans'/);
});

test('Contact and Deploy dispatch open Elena, with no added launcher and the booking APIs intact', () => {
  assert.match(page, /label !== 'Contact' && label !== 'Deploy dispatch'/);
  assert.match(page, /setQuoteService\('HVAC service visit'\)/);
  assert.match(page, /setChatOpen\(true\)/);
  assert.match(page, /showLauncher=\{false\}/);
  assert.match(page, /showLauncher && !open/);
  assert.match(page, /const intakeFields: IntakeStep\[\] = \['name', 'phone', 'email', 'address', 'problem'\]/);
  assert.match(page, /fetch\('\/api\/concierge'/);
  assert.match(page, /fetch\(`\/api\/slots\?/);
  assert.match(page, /fetch\('\/api\/book'/);
});

test('ZIP global styles, fonts, title and responsive image preloads are loaded by Next', () => {
  assert.match(layout, /import '\.\/zip-template\/styles\/tokens\.css'/);
  assert.match(layout, /import '\.\/zip-template\/styles\/global\.css'/);
  assert.match(layout, /Apex AI Dispatch — Every thermal zone tells a story\./);
  assert.match(layout, /https:\/\/fonts\.googleapis\.com\/css2\?family=Instrument\+Sans/);
  assert.match(layout, /preconnect/);
  assert.doesNotMatch(layout, /apex-hvac-outdoor/);
});
