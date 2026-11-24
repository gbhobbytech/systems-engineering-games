// Browser test for evidence-studio-sat.html.  Serve the repo root, then:
//   python3 -m http.server 8765 &   node tests/evidence-studio-sat.spec.js
// Optional: SHOTS=dir for screenshots, VW/VH for window size (default 1366x650).
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:8765/';
const SHOTS = process.env.SHOTS || '';
let pass = 0, fail = 0;
const check = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m); } };

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const ctx = await browser.newContext({ viewport: { width: Number(process.env.VW || 1366), height: Number(process.env.VH || 650) }, acceptDownloads: true });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if ((m.type() === 'error' && !/supabase|Failed to load resource|ERR_/i.test(m.text())) || /Assertion failed/.test(m.text())) errors.push(m.text()); });
  const shot = async n => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: `${SHOTS}/${n}.png` }); } };
  const st = () => page.evaluate(() => window.__satStudio.state());
  const dl = async (sel) => { const [d] = await Promise.all([page.waitForEvent('download'), page.click(sel)]); return d; };

  await page.goto(BASE + 'index.html');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('seEvidenceStudio11', JSON.stringify({ v: 1, started: true, player: { name: 'Max', cls: '12SE' } })); });
  await page.goto(BASE + 'evidence-studio-sat.html');
  console.log('\nSign in');
  check(await page.inputValue('#obName') === 'Max' && await page.inputValue('#obClass') === '12SE', 'name and class reused from the Year 11 studio');
  await page.fill('#obSystem', 'automated chicken coop door');
  await page.click('[data-fmt="website"]'); await page.click('[data-ph="3"]');
  await page.click('#startBtn');
  const s0 = await st();
  check(s0.phase === 3 && s0.format === 'website', 'unit phase and format saved');
  const home = await page.textContent('main');
  check(/TAG/.test(home) && /INDEX/.test(home) && /CLAIM/.test(home) && /DATE/.test(home), 'home explains the find-it-fast test');
  check(/UNIT 3 submission/.test(home) && /UNIT 4 submission/.test(home) && /alongside/.test(home), 'home explains C1–3 in Unit 3 and C4–8 alongside C1–3 in Unit 4');
  await shot('sat-01-home');

  console.log('\nMakeover (8 rounds, one per criterion)');
  await page.click('[data-tab="makeover"]');
  const rounds = await page.evaluate(() => window.__satStudio.ROUNDS.map(r => ({ c: r.c, probs: r.probs.map(p => !!p.ok), ups: r.ups.map(u => !!u.ok) })));
  check(rounds.map(r => r.c).join() === '1,2,3,4,5,6,7,8', 'one round per criterion, in order');
  for (let i = 0; i < rounds.length; i++) {
    const r = rounds[i];
    check((await page.textContent('.slide .sh')).includes(`CRITERION ${r.c}`), `round ${i + 1} is labelled with criterion ${r.c}`);
    if (i === 5) { await page.click(`[data-p="${r.probs.indexOf(false)}"]`); await page.click('#mkCheck'); check(/Not quite/.test(await page.textContent('#mkFeedback')), 'distractor explained (C6)'); await page.click(`[data-p="${r.probs.indexOf(false)}"]`); }
    for (let k = 0; k < r.probs.length; k++) if (r.probs[k]) await page.click(`[data-p="${k}"]`);
    await page.click('#mkCheck'); await page.click('#mkNext');
    if (i === 5) { await page.click(`[data-u="${r.ups.indexOf(false)}"]`); }
    await page.click(`[data-u="${r.ups.indexOf(true)}"]`);
    if (i === 5) { check(/COMEBACK/.test(await page.textContent('#mkFeedback')), 'comeback after mistakes'); await shot('sat-02-makeover-c6'); }
    await page.click('#mkNext');
  }
  check((await st()).mk.done && (await st()).mk.firstTry === 7, 'makeover done, 7/8 first try');

  console.log('\nSignature');
  await page.click('#toSig');
  check((await page.$$('#devs svg[aria-label^="Criterion"]')).length === 8, '8 criterion badges in preview');
  await page.click('[data-style="blueprint"]'); await page.fill('#t_test', 'Lab test');
  check((await page.textContent('#devs')).includes('LAB TEST'), 'student\'s own device name shown');
  check((await page.textContent('#devs')).includes('FORMULA') && (await page.textContent('#devs')).includes('ACTUAL (SI UNITS)'), 'test card has the VCAA test fields');
  await shot('sat-03-signature');
  const d1 = await dl('[data-dl="test"][data-type="svg"]');
  const svg = fs.readFileSync(await d1.path(), 'utf8');
  check(svg.startsWith('<svg') && svg.includes('LAB TEST') && !svg.includes('1.45 A'), 'test card SVG is a blank template: ' + d1.suggestedFilename());
  const badgeNames = [];
  page.on('download', d => badgeNames.push(d.suggestedFilename()));
  await page.click('[data-dl="badges"][data-type="svg"]'); await page.waitForTimeout(3200);
  check(badgeNames.filter(n => /badge-c[1-8]\.svg$/.test(n)).length === 8, '8 badge SVGs downloaded');

  console.log('\nCriteria guide');
  await page.click('[data-tab="criteria"]');
  check((await page.$$('.crit')).length === 3, 'Unit 3 students see C1–C3 first');
  await page.click('[data-f="all"]');
  check((await page.$$('.crit')).length === 8, 'all 8 criteria available');
  check((await page.textContent('#crit-6')).includes('SI units') && (await page.textContent('#crit-3')).includes('hierarchy of control'), 'VCAA requirements shown under the right criteria');
  check(await page.isVisible('a[href="evidence-lab.html"]'), 'links to the 9–10 Evidence Lab');
  await page.click('#crit-6 [data-move="testcard"]');
  check(await page.waitForSelector('#move-testcard.flash', { timeout: 2000 }).then(() => true, () => false), 'move chip jumps to the evidence move');

  console.log('\nIndex & self-audit');
  await page.click('[data-tab="index"]');
  check((await page.$$('.cblock')).length === 3, 'Unit 3 view shows C1–C3');
  const b1 = '[data-c="1"]';
  await page.fill(`${b1} [data-claim]`, 'This section shows C1: the ethical problem, my brief and evaluation criteria.');
  await page.fill(`${b1} [data-where]`, 'Pages 2–6');
  const nReq = (await page.$$(`${b1} [data-req]`)).length;
  for (let i = 0; i < nReq; i++) await page.click(`${b1} [data-req="${i}"]`);
  check(/In progress/.test(await page.textContent(`${b1} [data-ready]`)), 'requirements ticked but find-it-fast incomplete → in progress');
  await page.click(`${b1} [data-ffk="tag"]`); await page.click(`${b1} [data-ffk="date"]`);
  check(/Assessor-ready/.test(await page.textContent(`${b1} [data-ready]`)), 'all items + TAG/INDEX/CLAIM/DATE → assessor-ready');
  await page.click(`${b1} [data-req="0"]`);
  check(!/Assessor-ready/.test(await page.textContent(`${b1} [data-ready]`)), 'un-ticking an item removes assessor-ready');
  await page.click(`${b1} [data-req="0"]`);
  // re-render and make sure toggles don't double-fire
  await page.click('[data-tab="home"]'); await page.click('[data-tab="index"]');
  await page.click('[data-c="2"] [data-req="0"]');
  check((await st()).crit[2].have[0] === true, 'ticks still toggle once after revisiting the page');
  await page.fill('[data-c="3"] [data-need]', 'work plan budget');
  await shot('sat-04-index');
  const d2 = await dl('[data-c="1"] [data-claimdl="svg"]');
  check(fs.readFileSync(await d2.path(), 'utf8').includes('the ethical problem'), 'claim banner SVG uses the student\'s claim line');
  const d3 = await dl('[data-cover="svg"]');
  const cover = fs.readFileSync(await d3.path(), 'utf8');
  check(cover.includes('CRITERIA EVIDENCE INDEX') && cover.includes('Pages 2–6') && cover.includes('>C3<') && !cover.includes('>C4<'), 'Unit 3 index cover lists C1–C3 with locations');
  await page.check('#coverAll');
  const d4 = await dl('[data-cover="png"]');
  check(fs.statSync(await d4.path()).size > 20000, 'index cover PNG (all 8) downloads');
  if (SHOTS) { await d4.saveAs(`${SHOTS}/sat-index-cover.png`); }
  await page.click('#copyMd');
  const md = await page.evaluate(() => navigator.clipboard.readText());
  check(md.includes('| **C1** Investigating and defining |') && md.includes('Pages 2–6') && md.includes('**C8**'), 'Markdown index copied for Notion/websites');
  await page.fill('#dWeek', 'C1 brief and evaluation criteria with test methods');
  await page.fill('#dNext', 'C2 decision matrix');
  const d5 = await dl('#dropBtn');
  check(fs.statSync(await d5.path()).size > 20000, 'weekly drop PNG downloads');
  if (SHOTS) await d5.saveAs(`${SHOTS}/sat-weekly-drop.png`);
  check((await st()).done, 'studio done after makeover + signature + drop');

  console.log('\nUnit 4, persistence, hub');
  await page.click('[data-f="4"]');
  check((await page.$$('.cblock')).length === 5, 'Unit 4 view shows C4–C8');
  await page.reload(); await page.click('#resumeBtn'); await page.click('[data-tab="index"]');
  check(await page.inputValue('[data-c="1"] [data-where]') === 'Pages 2–6', 'index entries persist after reload');
  await page.goto(BASE + 'index.html');
  check(await page.isVisible('#sat a[href="evidence-studio-sat.html"]'), 'hub links to the SAT studio inside the SAT journey');
  check(/weekly drop/.test(await page.textContent('#es12done')), 'hub shows SAT studio progress');
  check(await page.evaluate(() => JSON.parse(localStorage.getItem('seEvidenceStudio11')).player.name === 'Max'), 'Year 11 studio data untouched');
  await page.locator('.lstudio12').scrollIntoViewIfNeeded(); await shot('sat-05-hub');
  await page.goto(BASE + 'evidence-studio-sat.html'); await page.click('#resumeBtn');
  let overflow = false;
  for (const t of ['home', 'makeover', 'signature', 'criteria', 'moves', 'index']) { await page.click(`[data-tab="${t}"]`); if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) { overflow = true; console.log('    overflow on ' + t); } }
  check(!overflow, 'no horizontal overflow on any tab');
  check(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  console.log(`\n${pass} passed, ${fail} failed\n`);
  await browser.close(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
