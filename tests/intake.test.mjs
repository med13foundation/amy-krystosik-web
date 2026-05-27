import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

function loadIntakeRuntime() {
  const code = readFileSync(new URL('../assets/js/intake.js', import.meta.url), 'utf8');
  const sandbox = { console, location: { href: '' } };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(code, sandbox, { filename: 'assets/js/intake.js' });
  return sandbox;
}

function loadIntakePage() {
  return loadIntakeRuntime().IntakePage;
}

test('builds a Calendly URL with name and prefilled notes', () => {
  const { buildCalendlyHref } = loadIntakePage();

  const href = buildCalendlyHref({
    name: 'Test Person',
    org: 'Foundation Lab',
    type: 'Study design',
    detail: 'Need protocol review by June 15.',
  });

  const url = new URL(href);
  assert.equal(`${url.origin}${url.pathname}`, 'https://calendly.com/amykrystosik/30min');
  assert.equal(url.searchParams.get('name'), 'Test Person');
  assert.equal(
    url.searchParams.get('a1'),
    [
      'What I need: Study design',
      'Organization: Foundation Lab',
      'Decision & deadline: Need protocol review by June 15.',
    ].join('\n'),
  );
});

test('does not claim intake details are saved', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

  assert.doesNotMatch(html, /details are saved/i);
  assert.doesNotMatch(html, /SHEET_ENDPOINT|fetch\(/);
  assert.match(html, /go straight to Calendly/i);
});

test('hidden elements are not overridden by component display CSS', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(html, /\[hidden\]\s*\{\s*display\s*:\s*none\s*!important\s*\}/);
});

test('intake submits directly to Calendly without an intermediate booking card', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(html, /Continue to Calendly/);
  assert.doesNotMatch(html, /id="bookedStep"|id="calendlyLink"|Open my calendar/);
});

test('form submit navigates to the prefilled Calendly URL', () => {
  const runtime = loadIntakeRuntime();
  const intakePage = runtime.IntakePage;
  let submitHandler;
  const form = {
    addEventListener(event, handler) {
      if (event === 'submit') submitHandler = handler;
    },
    reportValidity() {
      return true;
    },
  };
  const fields = {
    intakeForm: form,
    'f-name': { value: 'Test Person' },
    'f-org': { value: 'Foundation Lab' },
    'f-type': { value: 'Study design' },
    'f-detail': { value: 'Need protocol review by June 15.' },
  };

  intakePage.initIntakeForm({
    getElementById(id) {
      return fields[id] || null;
    },
  });
  submitHandler({ preventDefault() {} });

  const url = new URL(runtime.location.href);
  assert.equal(`${url.origin}${url.pathname}`, 'https://calendly.com/amykrystosik/30min');
  assert.equal(url.searchParams.get('name'), 'Test Person');
});

test('Artana Bio links navigate directly to artana.bio', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const artanaLinks = [...html.matchAll(/<a [^>]*href="https:\/\/artana\.bio"[^>]*>/g)].map(
    (match) => match[0],
  );

  assert.equal(artanaLinks.length, 2);
  for (const link of artanaLinks) {
    assert.doesNotMatch(link, /\starget=/);
    assert.doesNotMatch(link, /\srel=/);
  }
});

test('Book a call nav hover stays subtle instead of turning black', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const hoverRule = html.match(/\.nav-cta:hover\{[^}]+\}/)?.[0] || '';

  assert.match(hoverRule, /background:var\(--accent-soft\)/);
  assert.match(hoverRule, /color:var\(--accent-deep\)/);
  assert.doesNotMatch(hoverRule, /background:var\(--ink\)/);
});
