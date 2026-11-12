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
  assert.match(css, /animation:comfort-photo 22s ease-in-out infinite alternate/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test('opening picture is not covered by the decorative photo ribbon', () => {
  assert.match(scene, /mesh\.visible = heroProgress > 0\.12 && i % 3 === 0/);
  assert.match(scene, /material\.uniforms\.uBlend\.value = 0;/);
  assert.match(scene, /#include <colorspace_fragment>/);
});
