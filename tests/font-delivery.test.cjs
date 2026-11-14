const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8');

test('font delivery is local, non-blocking, and covers every imported family', () => {
  assert.doesNotMatch(css, /@import\s+url\([^)]*fonts\.googleapis\.com/);
  const faces = [...css.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)].map((match) => match[1]);
  assert.equal(faces.length, 7);
  assert.ok(faces.every((face) => /font-display:\s*swap/.test(face)));
  assert.ok(faces.every((face) => /src:\s*url\('\/fonts\/[^']+\.woff2'\)/.test(face)));

  const expectedFiles = [
    'dm-mono-400.woff2',
    'dm-mono-500.woff2',
    'geist-variable.woff2',
    'jetbrains-mono-variable.woff2',
    'playfair-display-variable.woff2',
    'playfair-display-italic-variable.woff2',
    'plus-jakarta-sans-variable.woff2',
  ];
  for (const file of expectedFiles) {
    const asset = path.join(root, 'public/fonts', file);
    assert.ok(fs.statSync(asset).size > 0, `${file} should exist and be non-empty`);
  }
});

test('local font faces preserve the requested family styles and weight ranges', () => {
  assert.match(css, /font-family: 'DM Mono';[\s\S]*?font-weight: 400;/);
  assert.match(css, /font-family: 'DM Mono';[\s\S]*?font-weight: 500;/);
  assert.match(css, /font-family: 'Geist';[\s\S]*?font-weight: 400 700;/);
  assert.match(css, /font-family: 'JetBrains Mono';[\s\S]*?font-weight: 400 600;/);
  assert.match(css, /font-family: 'Playfair Display';[\s\S]*?font-style: normal;[\s\S]*?font-weight: 500 700;/);
  assert.match(css, /font-family: 'Playfair Display';[\s\S]*?font-style: italic;[\s\S]*?font-weight: 500 600;/);
  assert.match(css, /font-family: 'Plus Jakarta Sans';[\s\S]*?font-weight: 400 700;/);
});
