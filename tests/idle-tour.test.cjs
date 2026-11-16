const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function loadInternals() {
  const file = path.resolve(__dirname, '../app/components/useIdleTour.ts');
  const source = fs.readFileSync(file, 'utf8');
  const code = ts.transpileModule(`${source}\nmodule.exports.__idleTour = { IDLE_START_MS, MANUAL_IDLE_MS, HERO_INITIAL_DWELL_MS, WORK_DWELL_MS, FOOTER_DWELL_MS, clamp, easeInOut, upcomingWaypointIndex };`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    fileName: file,
  }).outputText;
  const original = Module._load;
  Module._load = function (request, parent, main) {
    if (request === 'react') return { useEffect() {}, useRef() { return { current: null }; }, useState() { return [false, () => {}]; }, useCallback(fn) { return fn; } };
    if (request === 'framer-motion') return { useReducedMotion() { return false; } };
    return original.call(this, request, parent, main);
  };
  try {
    const mod = new Module(file, module);
    mod.filename = file;
    mod.paths = Module._nodeModulePaths(path.dirname(file));
    mod._compile(code, file);
    return { ...mod.exports.__idleTour, source };
  } finally {
    Module._load = original;
  }
}

const { IDLE_START_MS, MANUAL_IDLE_MS, HERO_INITIAL_DWELL_MS, WORK_DWELL_MS, FOOTER_DWELL_MS, clamp, easeInOut, upcomingWaypointIndex, source } = loadInternals();

const waypoints = [
  { name: 'hero-start', target: 0, dwell: HERO_INITIAL_DWELL_MS },
  { name: 'hero-intro', target: 1080, dwell: 4500 },
  { name: 'hero-final', target: 2440, dwell: 5000 },
  { name: 'services-start', target: 3600, dwell: 4500 },
  { name: 'services-middle', target: 5700, dwell: 4500 },
  { name: 'services-end', target: 7300, dwell: 4500 },
  { name: 'work', target: 8000, dwell: WORK_DWELL_MS },
  { name: 'footer', target: 10000, dwell: FOOTER_DWELL_MS },
];

test('idle tour waits before starting and gives readable dwell time to hero, work, and footer', () => {
  assert.equal(IDLE_START_MS, 2000);
  assert.equal(HERO_INITIAL_DWELL_MS, 5000);
  assert.equal(WORK_DWELL_MS, 20000);
  assert.equal(FOOTER_DWELL_MS, 8000);
  assert.equal(MANUAL_IDLE_MS, 12000);
});

test('waypoints progress through hero, services, work, and footer without a loop-back target', () => {
  assert.deepEqual(waypoints.map(({ name }) => name), ['hero-start', 'hero-intro', 'hero-final', 'services-start', 'services-middle', 'services-end', 'work', 'footer']);
  assert.ok(waypoints.every((point, index) => index === 0 || point.target > waypoints[index - 1].target));
  assert.equal(upcomingWaypointIndex(waypoints, waypoints.at(-1).target + 100), waypoints.length - 1);
  assert.match(source, /window\.scrollTo\(\{ top:/);
});

test('manual position selects the next waypoint rather than snapping backwards', () => {
  assert.equal(upcomingWaypointIndex(waypoints, 1), 1);
  assert.equal(upcomingWaypointIndex(waypoints, 2000), 2);
  assert.equal(upcomingWaypointIndex(waypoints, 7980), 6);
  assert.equal(upcomingWaypointIndex(waypoints, 12000), 7);
});

test('scroll interpolation is bounded and eased', () => {
  assert.equal(clamp(-2), 0);
  assert.equal(clamp(2), 1);
  assert.equal(easeInOut(0), 0);
  assert.equal(easeInOut(0.5), 0.5);
  assert.equal(easeInOut(1), 1);
  assert.ok(easeInOut(0.25) < 0.25);
  assert.ok(easeInOut(0.75) > 0.75);
});

test('input policy pauses without cancelling browser defaults', () => {
  assert.match(source, /wheel/);
  assert.match(source, /touchstart/);
  assert.match(source, /pointerdown/);
  assert.match(source, /keydown/);
  assert.match(source, /MANUAL_IDLE_MS/);
  assert.match(source, /data-idle-tour-control/);
  assert.match(source, /isManualNavigation/);
  assert.doesNotMatch(source, /event\.preventDefault\s*\(/);
});

test('visibility, menu, chat, and focused controls are scroll guards', () => {
  assert.match(source, /document\.hidden/);
  assert.match(source, /getElementById\('outbox-menu'\)/);
  assert.match(source, /querySelector\('\.chat-drawer'\)/);
  assert.match(source, /input, textarea, select/);
  assert.match(source, /#work button/);
});

test('reduced motion is conservative and live media changes stop the tour', () => {
  assert.match(source, /reduce !== false/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /addEventListener\?\.\('change'/);
  assert.match(source, /if \(media\.matches\) stop\(\)/);
});

test('tour uses rAF and stops at the final footer waypoint', () => {
  assert.match(source, /requestAnimationFrame\(run\)/);
  assert.match(source, /stageRef\.current >= waypoints\.length - 1/);
  assert.match(source, /if \(stageRef\.current >= waypoints\.length - 1\) \{ stop\(\); return; \}/);
});

test('lifecycle startup timer schedules RAF and RAF advances scroll', () => {
  const file = path.resolve(__dirname, '../app/components/useIdleTour.ts');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    fileName: file,
  }).outputText;
  const effects = [];
  const refs = [];
  const timers = new Map();
  const frames = new Map();
  let nextTimer = 1;
  let nextFrame = 1;
  const sections = {
    top: { top: 0, height: 4000 },
    services: { top: 4000, height: 3000 },
    work: { top: 7000, height: 1000 },
    contact: { top: 8000, height: 1000 },
  };
  let scrollY = 0;
  const oldGlobals = { window: global.window, document: global.document, Element: global.Element, cancelAnimationFrame: global.cancelAnimationFrame };
  const documentMock = {
    hidden: false,
    activeElement: null,
    documentElement: { scrollHeight: 9000 },
    getElementById(id) {
      if (id === 'outbox-menu') return null;
      const section = sections[id];
      return section && { getBoundingClientRect: () => ({ top: section.top - scrollY, height: section.height }) };
    },
    querySelector: () => null,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  const windowMock = {
    innerHeight: 1000,
    get scrollY() { return scrollY; },
    setTimeout(fn) { const id = nextTimer++; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
    requestAnimationFrame(fn) { const id = nextFrame++; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    scrollTo(value) { scrollY = typeof value === 'number' ? value : value.top; },
    matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
  };
  global.window = windowMock;
  global.document = documentMock;
  global.Element = class Element {};
  global.cancelAnimationFrame = windowMock.cancelAnimationFrame;
  const originalLoad = Module._load;
  Module._load = function (request, parent, main) {
    if (request === 'react') return {
      useEffect(fn) { effects.push(fn); },
      useRef(value) { const ref = { current: value }; refs.push(ref); return ref; },
      useState(value) { return [value, () => {}]; },
      useCallback(fn) { return fn; },
    };
    if (request === 'framer-motion') return { useReducedMotion: () => false };
    return originalLoad.call(this, request, parent, main);
  };
  try {
    const mod = new Module(file, module);
    mod.filename = file;
    mod.paths = Module._nodeModulePaths(path.dirname(file));
    mod._compile(code, file);
    const cleanup = [];
    mod.exports.default({ enabled: true, paused: false });
    effects.forEach((effect) => { const result = effect(); if (typeof result === 'function') cleanup.push(result); });
    assert.equal(frames.size, 0);
    const startup = [...timers.values()][0];
    assert.ok(startup, 'startup timer should be registered');
    startup();
    assert.equal(frames.size, 1, 'startup should schedule the first RAF');
    let frame = [...frames.entries()][0];
    frames.delete(frame[0]);
    frame[1](0);
    let time = 100;
    for (let index = 0; index < 51; index += 1) {
      frame = [...frames.entries()][0];
      frames.delete(frame[0]);
      frame[1](time);
      time += 100;
    }
    assert.ok(scrollY > 0, 'RAF travel should advance scroll position');
    cleanup.forEach((fn) => fn());
  } finally {
    Module._load = originalLoad;
    global.window = oldGlobals.window;
    global.document = oldGlobals.document;
    global.Element = oldGlobals.Element;
    global.cancelAnimationFrame = oldGlobals.cancelAnimationFrame;
  }
});
