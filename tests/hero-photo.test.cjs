const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const hero = fs.readFileSync(path.join(__dirname, '../app/components/Hero3D.jsx'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../app/globals.css'), 'utf8');

test('hero photo is a bright static layer separate from the animated WebGL scene', () => {
  const canvasMarkup = hero.indexOf('<div className="scene-canvas" ref={mountRef} />');
  const vignetteMarkup = hero.indexOf('<div className="scene-vignette" aria-hidden="true" />');
  const photoMarkup = hero.indexOf('<img className="scene-poster"');
  assert.ok(canvasMarkup >= 0 && vignetteMarkup > canvasMarkup && photoMarkup > vignetteMarkup);
  assert.match(css, /\.scene-poster \{[^}]*position: absolute;[^}]*z-index: 2;[^}]*filter: brightness\(1\.1\)/);
  assert.doesNotMatch(css.match(/\.scene-poster \{[^}]*\}/)?.[0] || '', /animation:|transition:/);
  assert.doesNotMatch(hero, /new THREE\.TextureLoader\(\)\.load\(HERO_PHOTO/);
  assert.match(css, /\.scene-hotspots \.hotspot-copy \{ display: none; \}/);
});

test('WebGL scroll motion and interactive hotspot projection remain enabled', () => {
  assert.match(hero, /let disposed = false;/);
  assert.match(hero, /scrollTimeline\.to\(scrollProgressRef\.current, \{ value: 1, ease: 'none' \}\)/);
  assert.match(hero, /setScrollPose\(scrollProgressRef\.current\.value/);
  assert.match(hero, /HOTSPOTS\.forEach\(\(hotspot\) =>/);
  assert.match(hero, /projectedHotspot\.set\(\.\.\.hotspot\.anchor\)\.project\(camera\)/);
  assert.match(hero, /onClick=\{\(\) => focusHotspot\(hotspot\)\}/);
});
