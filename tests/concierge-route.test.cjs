const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const routePath = path.resolve(__dirname, '../app/api/concierge/route.ts');
const intakePath = path.resolve(__dirname, '../app/lib/intake.ts');
const transpile = (file) => ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, fileName: file }).outputText;
const routeCode = transpile(routePath);
const intakeCode = transpile(intakePath);
const NextResponseMock = { json(body, init = {}) { return { body, status: init.status || 200, headers: init.headers || {} }; } };
function loadRoute() {
  const original = Module._load;
  Module._load = function (request, parent, isMain) {
    if (request === 'next/server') return { NextResponse: NextResponseMock };
    if (request === '../../lib/intake' && parent && parent.filename === routePath) {
      const mod = new Module(intakePath, module); mod.filename = intakePath; mod.paths = Module._nodeModulePaths(path.dirname(intakePath)); mod._compile(intakeCode, intakePath); return mod.exports;
    }
    return original.call(this, request, parent, isMain);
  };
  try { const mod = new Module(routePath, module); mod.filename = routePath; mod.paths = Module._nodeModulePaths(path.dirname(routePath)); mod._compile(routeCode, routePath); return mod.exports; } finally { Module._load = original; }
}
const { POST } = loadRoute();
function request(step, answer, extra = {}) { return new Request('https://apex.test/api/concierge', { method: 'POST', headers: { origin: 'https://apex.test', host: 'apex.test', 'content-type': 'application/json' }, body: JSON.stringify({ step, answer, website: '', ...extra }) }); }
test.afterEach(() => { delete global.fetch; delete process.env.GROQ_API_KEY; });

test('greeting remains at name step and does not advance', async () => {
  const result = await POST(request('name', 'Hi'));
  assert.equal(result.status, 200); assert.equal(result.body.accepted, false); assert.equal(result.body.complete, false); assert.equal(result.body.nextQuestion, ''); assert.match(result.body.reply, /name/i);
});
test('a greeting followed by small talk is not accepted as a name', async () => {
  process.env.GROQ_API_KEY = 'test-key';
  let modelCalls = 0;
  global.fetch = async () => { modelCalls += 1; throw new Error('social replies should use local copy'); };
  const result = await POST(request('name', 'Hi how u doing'));
  assert.equal(result.status, 200);
  assert.equal(result.body.accepted, false);
  assert.equal(result.body.complete, false);
  assert.match(result.body.reply, /doing well|thanks for asking/i);
  assert.match(result.body.reply, /what name/i);
  assert.doesNotMatch(result.body.reply, /smalltalk/i);
  assert.equal(modelCalls, 0);
});
test('a correction extracts the actual name and advances to the phone question', async () => {
  process.env.GROQ_API_KEY = 'test-key';
  let modelCalls = 0;
  global.fetch = async () => { modelCalls += 1; throw new Error('name acknowledgements should use local copy'); };
  const result = await POST(request('name', 'My name is not hi is Jummy'));
  assert.equal(result.status, 200);
  assert.equal(result.body.accepted, true);
  assert.equal(result.body.value, 'Jummy');
  assert.match(result.body.reply, /Lovely to meet you, Jummy!/);
  assert.match(result.body.reply, /phone number/i);
  assert.doesNotMatch(result.body.reply, /not hi is/i);
  assert.equal(modelCalls, 0);
});
test('an explicit name correction during the phone step updates identity without consuming the phone answer', async () => {
  const result = await POST(request('phone', 'My name is not hi is Jummy', { knownName: 'Hi how u doing' }));
  assert.equal(result.status, 200);
  assert.equal(result.body.accepted, false);
  assert.equal(result.body.correctedName, 'Jummy');
  assert.equal(result.body.complete, false);
  assert.match(result.body.reply, /Thanks for correcting me, Jummy/);
  assert.match(result.body.reply, /phone number/i);
  assert.doesNotMatch(result.body.reply, /seven digits|short/i);
});
test('real introductions normalize without title-casing, including Unicode', async () => {
  for (const [input, expected] of [["Hi I'm Jay", 'Jay'], [' My name is José  Núñez ', 'José Núñez'], ['单', '单']]) {
    const result = await POST(request('name', input)); assert.equal(result.body.accepted, true); assert.equal(result.body.value, expected);
  }
});
test('side questions and issue-first answers are not captured as names', async () => {
  for (const input of ['How are you?', 'Are you AI?', 'My furnace is not working']) {
    const result = await POST(request('name', input)); assert.equal(result.status, 200); assert.equal(result.body.accepted, false); assert.equal(result.body.complete, false); assert.equal(result.body.nextQuestion, ''); assert.match(result.body.reply, /name/i);
  }
});
test('phone and email validation reject bad answers without advancing', async () => {
  assert.equal((await POST(request('phone', '123'))).status, 422);
  assert.equal((await POST(request('email', 'person-at-example'))).status, 422);
  const good = await POST(request('email', ' Person@Example.COM ')); assert.equal(good.status, 200); assert.equal(good.body.accepted, true); assert.equal(good.body.value, 'person@example.com');
});
test('problem answer is accepted and gets a concise acknowledgement', async () => {
  const result = await POST(request('problem', 'The furnace is making a loud rattling noise'));
  assert.equal(result.body.accepted, true); assert.equal(result.body.complete, true); assert.equal(result.body.nextQuestion, ''); assert.match(result.body.reply, /noise|pass|team/i);
});
test('missing, failing, empty, and PII-containing model output safely fall back', async (t) => {
  for (const mode of ['missing', 'failure', 'empty', 'pii']) await t.test(mode, async () => {
    if (mode !== 'missing') process.env.GROQ_API_KEY = 'test-key';
    const calls = []; global.fetch = async (url, options) => { calls.push({ url, options }); if (mode === 'failure') return { ok: false, status: 500, async json() { return {}; } }; if (mode === 'empty') return { ok: true, status: 200, async json() { return { choices: [{ message: { content: '' } }] }; } }; if (mode === 'pii') return { ok: true, status: 200, async json() { return { choices: [{ message: { content: 'Call Jay at 5551234567' } }] }; } }; throw new Error('network'); };
    const result = await POST(request('problem', 'No heat in the house')); assert.equal(result.body.accepted, true); assert.match(result.body.reply, /heating|pass|team/i);
    if (calls.length) { const sent = JSON.parse(calls[0].options.body); assert.doesNotMatch(sent.messages[1].content, /Jay|555|house/i); }
  });
});
test('accepted replies include the next relevant question', async () => { const result = await POST(request('name', 'Jay')); assert.equal(result.body.nextQuestion, ''); assert.match(result.body.reply, /phone number/i); });


test('greeting variants and genuine full names are distinguished', async () => {
  for (const input of ['Hey there', 'Hello there?', 'Good morning!']) {
    const result = await POST(request('name', input));
    assert.equal(result.body.accepted, false, input);
  }
  for (const input of ['Will Smith', 'May Li', 'Can Yılmaz', 'Jack Price', 'Booker', 'Anne-Marie O’Neill']) {
    const result = await POST(request('name', input));
    assert.equal(result.body.accepted, true, input);
    assert.equal(result.body.value, input);
  }
});

test('model acknowledgements exclude raw contact details while name acknowledgements stay local', async () => {
  process.env.GROQ_API_KEY = 'test-key';
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push(JSON.parse(options.body));
    return { ok: true, async json() { return { choices: [{ message: { content: 'Thanks for sharing that.' } }] }; } };
  };
  for (const [step, value] of [['name', 'Jay Omilana'], ['phone', '5551234567'], ['email', 'jay@example.com'], ['address', '123 Private Street']]) {
    const result = await POST(request(step, value));
    assert.equal(result.body.accepted, true);
    if (step === 'name') assert.match(result.body.reply, /Lovely to meet you, Jay Omilana/);
  }
  assert.equal(calls.length, 3);
  for (const payload of calls) {
    assert.doesNotMatch(JSON.stringify(payload.messages), /Jay|Omilana|5551234567|jay@example|Private Street/);
    assert.equal(payload.max_completion_tokens, 512);
  }
});

test('known names are used naturally in acknowledgements and next questions, but never sent to Groq', async () => {
  process.env.GROQ_API_KEY = 'test-key';
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push(JSON.parse(options.body));
    return { ok: true, async json() { return { choices: [{ message: { content: 'Thanks for sharing that.' } }] }; } };
  };
  const result = await POST(request('phone', '5551234567', { knownName: 'Jay Omilana' }));
  assert.equal(result.body.accepted, true);
  assert.match(result.body.reply, /Thanks for sharing that, Jay Omilana\./);
  assert.match(result.body.reply, /And Jay Omilana, which email address/);
  assert.doesNotMatch(JSON.stringify(calls[0].messages), /Jay Omilana/);
});

test('identity question remains factual even when a model is configured', async () => {
  process.env.GROQ_API_KEY = 'test-key';
  global.fetch = async () => { throw new Error('Identity must not be delegated to the model'); };
  const result = await POST(request('name', 'Are you AI?'));
  assert.equal(result.body.accepted, false);
  assert.match(result.body.reply, /Yes.*virtual assistant/);
});

test('null and non-object request bodies are rejected safely', async () => {
  for (const value of [null, [], 'hello', 123]) {
    const result = await POST(new Request('https://apex.test/api/concierge', { method: 'POST', body: JSON.stringify(value) }));
    assert.equal(result.status, 400);
  }
});
