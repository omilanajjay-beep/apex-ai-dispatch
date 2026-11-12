const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function loadCarouselInternals() {
  const file = path.resolve(__dirname, '../app/components/ComfortSystemsCarousel.tsx');
  const source = fs.readFileSync(file, 'utf8');
  const code = ts.transpileModule(`${source}\nexport { poseAt, metrics, createWebGLRenderer, drawFlatFrame, drawMetricFace, LOOP_SECONDS, HOLD_SECONDS, CARD_SECONDS };`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    fileName: file,
  }).outputText;
  const original = Module._load;
  Module._load = function (request, parent, main) {
    if (request === 'react') return { useEffect() {}, useRef() { return { current: null }; } };
    if (request === 'react/jsx-runtime') return { jsx() {}, jsxs() {} };
    if (request === 'lucide-react') return { ArrowUpRight: 'ArrowUpRight' };
    return original.call(this, request, parent, main);
  };
  try {
    const mod = new Module(file, module);
    mod.filename = file;
    mod.paths = Module._nodeModulePaths(path.dirname(file));
    mod._compile(code, file);
    return { ...mod.exports, source };
  } finally {
    Module._load = original;
  }
}

const { poseAt, metrics, createWebGLRenderer, drawFlatFrame, drawMetricFace, LOOP_SECONDS, HOLD_SECONDS, CARD_SECONDS, source } = loadCarouselInternals();
const near = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-8, `${message}: expected ${expected}, got ${actual}`);

test('HVAC study uses five HVAC cards and the requested 15.5-second loop', () => {
  assert.equal(LOOP_SECONDS, 15.5);
  assert.equal(HOLD_SECONDS, 2.2);
  assert.equal(metrics.length, 5);
  assert.deepEqual(metrics.map((metric) => metric.name), ['Thermostat', 'Airflow', 'System load', 'Humidity', 'Filter pressure']);
  assert.ok(metrics.every((metric) => metric.values.length === 3));
  assert.doesNotMatch(source, /<img\b|new Image\(/);
});

test('each card holds center for 2.2 seconds before the 0.9-second transition', () => {
  for (let index = 0; index < metrics.length; index += 1) {
    for (const holdTime of [0.001, 1.1, 2.199]) {
      near(poseAt(index * CARD_SECONDS + holdTime).cards[index].relative, 0, `card ${index} hold`);
    }
    const midway = poseAt(index * CARD_SECONDS + HOLD_SECONDS + 0.45);
    near(midway.cards[index].relative, -0.5, `card ${index} outgoing midpoint`);
    near(midway.cards[(index + 1) % metrics.length].relative, 0.5, `card ${index} incoming midpoint`);
  }
});

test('values advance through all three steps while each card holds', () => {
  for (let index = 0; index < metrics.length; index += 1) {
    assert.equal(poseAt(index * CARD_SECONDS + 0.1).cards[index].step, 0);
    assert.equal(poseAt(index * CARD_SECONDS + 1.0).cards[index].step, 1);
    assert.equal(poseAt(index * CARD_SECONDS + 1.9).cards[index].step, 2);
  }
});

test('exact frames repeat identically across loop wraparound, including negative times', () => {
  for (const time of [0, 0.5, 2.65, 8.3, 15.49]) {
    const first = poseAt(time);
    const repeated = poseAt(time + LOOP_SECONDS);
    first.cards.forEach((card, index) => {
      for (const key of ['relative', 'progress', 'bend', 'centerX', 'centerY', 'opacity']) {
        near(card[key], repeated.cards[index][key], `${key} at ${time}`);
      }
    });
  }
  near(poseAt(-0.5).time, 15, 'negative time wraps');
});

test('missing WebGL2 selects the flat fallback without attempting GPU setup', () => {
  const canvas = { getContext(type) { assert.equal(type, 'webgl2'); return null; } };
  assert.equal(createWebGLRenderer(canvas, []), null);
  assert.match(source, /stage\.dataset\.renderer = renderWebGL \? 'webgl2' : 'flat'/);
  assert.match(source, /UNPACK_FLIP_Y_WEBGL, 0/);
});

test('flat fallback draws all five faces and resets alpha', () => {
  const drawn = [];
  const context = { clearRect() {}, drawImage(...args) { drawn.push(args); }, globalAlpha: 1 };
  const faces = metrics.map((_, index) => ({ canvas: { index } }));
  drawFlatFrame(context, faces, poseAt(0));
  assert.equal(drawn.length, 5);
  assert.equal(drawn.at(-1)[0].index, 0);
  assert.equal(context.globalAlpha, 1);
});

test('render controls and reduced-motion still are scoped to the canvas animation', () => {
  assert.match(source, /window\.__LOOP = LOOP_SECONDS/);
  assert.match(source, /window\.__render = deterministicRender/);
  assert.match(source, /Object\.defineProperty\(window, '__MANUAL'/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /renderAt\(0\)/);
  assert.match(source, /if \(!reducedMotion\) start\(\)/);
  assert.match(source, /onClick=\{onPlanVisit\}/);
});


test('card titles, units, and captions remain left-aligned after the right-aligned serial', () => {
  const drawn = [];
  const stack = [];
  const state = { textAlign: 'start', globalAlpha: 1 };
  const context = new Proxy(state, {
    get(target, property) {
      if (property === 'save') return () => stack.push({ ...target });
      if (property === 'restore') return () => Object.assign(target, stack.pop());
      if (property === 'fillText') return (text, x, y) => drawn.push({ text, x, y, align: target.textAlign });
      if (property === 'createRadialGradient' || property === 'createLinearGradient') return () => ({ addColorStop() {} });
      if (property in target) return target[property];
      return () => {};
    },
  });
  metrics.forEach((metric, index) => {
    drawMetricFace({ context }, metric, poseAt(index * CARD_SECONDS).cards[index], 0, index);
    for (const text of [metric.name, metric.eyebrow, metric.unit, metric.caption]) {
      const entry = drawn.find((item) => item.text === text);
      assert.ok(entry, `${text} is drawn`);
      assert.equal(entry.align, 'left', `${text} alignment`);
    }
    drawn.length = 0;
  });
});
