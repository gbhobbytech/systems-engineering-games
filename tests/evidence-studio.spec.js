// Browser test for evidence-studio.html.  Serve the repo root, then:
//   python3 -m http.server 8765 &   node tests/evidence-studio.spec.js
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
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if ((m.type() === 'error' && !/supabase|Failed to load resource|ERR_/i.test(m.text())) || /Assertion failed/.test(m.text())) errors.push(m.text()); });
  const shot = async n => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: `${SHOTS}/${n}.png`, fullPage: false }); } };
  const st = () => page.evaluate(() => window.__evidenceStudio.state());

  await page.goto(BASE + 'index.html');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('seStepUp2Player', JSON.stringify({ name: 'Ava', cls: '11SE' })); localStorage.setItem('seStepUp2Progress', '{"v":1,"started":true}'); });
  await page.goto(BASE + 'evidence-studio.html');
  console.log('\nSign in');
  check(await page.inputValue('#obName') === 'Ava' && await page.inputValue('#obClass') === '11SE', 'name and class reused from another game');
  await page.fill('#obSystem', 'automatic pet feeder');
  await page.click('[data-fmt="canva"]');
  await shot('es-01-signin');
  await page.click('#startBtn');
  check((await st()).format === 'canva' && (await st()).system === 'automatic pet feeder', 'system and format saved');
  check(/SHOW/.test(await page.textContent('main')) && /NEXT/.test(await page.textContent('main')), 'home explains the Evidence Test');
  await shot('es-02-home');

  console.log('\nEvidence Makeover');
  await page.click('[data-tab="makeover"]');
  const rounds = await page.evaluate(() => window.__evidenceStudio.ROUNDS.map(r => ({ probs: r.probs.map(p => !!p.ok), ups: r.ups.map(u => !!u.ok) })));
  for (let i = 0; i < rounds.length; i++) {
    const r = rounds[i];
    if (i === 0) { // deliberately make mistakes in round 1
      await page.click(`[data-p="${r.probs.indexOf(false)}"]`); await page.click('#mkCheck');
      check(/Not quite/.test(await page.textContent('#mkFeedback')), 'picking a non-problem explains why');
      await page.click(`[data-p="${r.probs.indexOf(false)}"]`);
      await page.click(`[data-p="${r.probs.indexOf(true)}"]`); await page.click('#mkCheck');
      check(/missed/.test(await page.textContent('#mkFeedback')), 'missing problems is pointed out');
      for (let k = 0; k < r.probs.length; k++) if (r.probs[k] && k !== r.probs.indexOf(true)) await page.click(`[data-p="${k}"]`);
    } else for (let k = 0; k < r.probs.length; k++) if (r.probs[k]) await page.click(`[data-p="${k}"]`);
    if (i !== 0) await page.click('#mkCheck'); else await page.click('#mkCheck');
    await page.click('#mkNext');
    if (i === 0) { await page.click(`[data-u="${r.ups.indexOf(false)}"]`); check(/✗/.test(await page.textContent('#mkFeedback')), 'weak upgrade explained'); }
    await page.click(`[data-u="${r.ups.indexOf(true)}"]`);
    if (i === 0) { check(/COMEBACK/.test(await page.textContent('#mkFeedback')), 'comeback after mistakes'); await shot('es-03-makeover'); }
    await page.click('#mkNext');
  }
  const s1 = await st();
  check(s1.mk.done && s1.mk.firstTry === rounds.length - 1, `makeover complete, ${s1.mk.firstTry}/${rounds.length} first try`);
  check(/Makeover complete/.test(await page.textContent('main')), 'completion message');

  console.log('\nMy signature');
  await page.click('#toSig');
  await page.click('[data-style="field"]'); await page.click('[data-acc="#4ade80"]'); await page.click('[data-icon="🌱"]');
  await page.fill('#t_decision', 'My call'); await page.fill('#sigTag', 'measure twice');
  check((await page.textContent('#devs')).includes('MY CALL') && (await page.textContent('#devs')).includes('measure twice'), 'preview uses the student\'s own words');
  await shot('es-04-signature');
  const [svgDl] = await Promise.all([page.waitForEvent('download'), page.click('[data-dl="decision"][data-type="svg"]')]);
  const svgText = fs.readFileSync(await svgDl.path(), 'utf8');
  check(/^<svg/.test(svgText) && svgText.includes('MY CALL') && !svgText.includes('Capacitive'), 'SVG download is a blank template in the chosen style: ' + svgDl.suggestedFilename());
  const [pngDl] = await Promise.all([page.waitForEvent('download'), page.click('[data-dl="fault"][data-type="png"]')]);
  check(fs.statSync(await pngDl.path()).size > 5000, 'PNG download works: ' + pngDl.suggestedFilename());
  check((await st()).sig.made, 'signature marked as made');

  console.log('\nWhat to show & evidence moves');
  await page.click('[data-tab="beats"]');
  const nBeats = await page.$$eval('.beat', x => x.length);
  check(nBeats === 15, nBeats + ' evidence beats shown');
  await page.click('#beat-faults [data-move="faultticket"]');
  check(await page.waitForSelector('#move-faultticket.flash', { timeout: 2000 }).then(() => true, () => false), 'move chip jumps to the matching evidence move');
  await shot('es-05-moves');

  console.log('\nSelf-audit & weekly drop');
  await page.click('[data-tab="audit"]');
  for (const k of ['show', 'say', 'why', 'next']) await page.click(`[data-row="stages"] [data-ck="${k}"]`);
  check(/Strong/.test(await page.textContent('[data-row="stages"] [data-stat]')), 'four ticks = strong');
  await page.click('[data-row="kpis"] [data-ck="say"]');
  check(/Captured/.test(await page.textContent('[data-row="kpis"] [data-stat]')), 'some ticks = captured');
  await page.fill('[data-row="stages"] [data-where]', 'Page 4');
  await page.fill('[data-row="kpis"] [data-need]', 'targets with numbers');
  await page.click('#dropBtn');
  check(/Fill in/.test(await page.textContent('#toast')), 'weekly drop needs this/next week');
  await page.fill('#dWeek', 'Stage 1 and 2 photos with checks');
  await page.fill('#dNext', 'KPI table with targets');
  await shot('es-06-audit');
  const [dropDl] = await Promise.all([page.waitForEvent('download'), page.click('#dropBtn')]);
  const dropPath = await dropDl.path();
  check(fs.statSync(dropPath).size > 20000, 'weekly drop PNG downloads (' + fs.statSync(dropPath).size + ' bytes)');
  if (SHOTS) await dropDl.saveAs(`${SHOTS}/es-weekly-drop.png`);
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.click('#indexBtn');
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  check(clip.includes('Build stages (one per stage): Page 4') && clip.includes('(not yet)'), 'evidence index copied with locations');
  const s2 = await st();
  check(s2.done && s2.drops.length === 1, 'studio marked done after makeover + signature + drop');

  console.log('\nPersistence and hub');
  await page.reload();
  check(/Ava/.test(await page.textContent('#resumeText')), 'resume offered after reload');
  await page.click('#resumeBtn'); await page.click('[data-tab="audit"]');
  check(await page.inputValue('[data-row="stages"] [data-where]') === 'Page 4', 'audit entries persist');
  check(await page.evaluate(() => localStorage.getItem('seStepUp2Progress') === '{"v":1,"started":true}'), 'other games\' progress untouched');
  await page.goto(BASE + 'index.html');
  check(await page.isVisible('a[href="evidence-studio.html"]'), 'hub links to the studio');
  check(/weekly drop done/.test(await page.textContent('#esdone')), 'hub shows studio progress');
  check(!(await page.textContent('#sat')).includes('Evidence Studio'), 'studio is in the Year 11 section, not the SAT journey');
  await page.locator('.lstudio').scrollIntoViewIfNeeded(); await shot('es-07-hub');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  check(!overflow, 'hub has no horizontal overflow');
  await page.goto(BASE + 'evidence-studio.html'); await page.click('#resumeBtn');
  for (const t of ['home', 'makeover', 'signature', 'beats', 'moves', 'audit']) { await page.click(`[data-tab="${t}"]`); const o = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1); if (o) check(false, 'horizontal overflow on ' + t); }
  check(true, 'no horizontal overflow on any studio tab');
  check(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  console.log(`\n${pass} passed, ${fail} failed\n`);
  await browser.close(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
