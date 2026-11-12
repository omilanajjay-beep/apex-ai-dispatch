const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '../app/experience.css'), 'utf8');
const scene = fs.readFileSync(path.join(__dirname, '../app/components/ComfortScene.tsx'), 'utf8');

test('native service photos stay opaque even after WebGL loads', () => {
  assert.match(css, /\.experience \.service-image>img \{ opacity:1; \}/);
  assert.doesNotMatch(css, /data-webgl-ready[^}]+opacity:0/);
  assert.match(scene, /Keep category photos crisp in the DOM;[\s\S]*?mesh\.visible = false/);
});

test('hover keeps original pictures bright with restrained smooth motion', () => {
  assert.match(css, /\.comfort-card\.active \.service-image img \{ transform:scale\(1\.035\); filter:brightness\(1\.05\); \}/);
  assert.match(css, /animation:comfort-photo 9s cubic-bezier\(\.22,\.72,\.28,1\) infinite alternate/);
  assert.match(css, /\.service-image\.photo-in-view img \{ animation:service-photo-drift 10s cubic-bezier\(\.22,\.72,\.28,1\) infinite alternate/);
  assert.match(css, /@keyframes service-photo-drift[^{]*\{[^}]*scale\(1\.035\)[^}]*translate3d\(-1\.25%,0,0\)[^}]*\} to \{[^}]*scale\(1\.11\)[^}]*translate3d\(1\.5%,-\.7%,0\)/);
  assert.match(css, /--hero-photo-shift/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test('gallery photo motion runs only while photos are near the viewport', () => {
  const motion = fs.readFileSync(path.join(__dirname, '../app/components/ExperienceMotion.tsx'), 'utf8');
  assert.match(motion, /const photoObserver = new IntersectionObserver/);
  assert.match(motion, /classList\.toggle\('photo-in-view', entry\.isIntersecting\)/);
  assert.match(motion, /photoObserver\.disconnect\(\)/);
});

test('opening picture is not covered by the decorative photo ribbon', () => {
  assert.match(scene, /mesh\.visible = heroProgress > 0\.12 && i % 3 === 0/);
  assert.match(scene, /material\.uniforms\.uBlend\.value = 0;/);
  assert.match(scene, /#include <colorspace_fragment>/);
});
