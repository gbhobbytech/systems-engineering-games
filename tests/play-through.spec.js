// Browser play-through of step-up-circuit-rescue.html (all missions, persistence, reload, hub).
// Needs Playwright:  npm i -D playwright  (or a global install), then serve the repo root and run:
//   python3 -m http.server 8765 &   node tests/play-through.spec.js
// Optional: SHOTS=dir to save screenshots; VW/VH to set the window size (default 1366x768).
'use strict';
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8765/';
const SHOTS = process.env.SHOTS || '';
const fs = require('fs');

let pass = 0, fail = 0;
const check = (cond, msg) => { if (cond) { pass++; console.log('  ✓ ' + msg); } else { fail++; console.log('  ✗ ' + msg); } };

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const ctx = await browser.newContext({ viewport: { width: Number(process.env.VW || 1366), height: Number(process.env.VH || 768) }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/supabase|Failed to load resource|ERR_/i.test(m.text())) errors.push(m.text()); if (m.type() === 'assert' || /Assertion failed/.test(m.text())) errors.push(m.text()); });
  const shot = async n => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: `${SHOTS}/${n}.png` }); } };

  // Seed Part 1 data to prove Part 2 never touches it
  await page.goto(BASE + 'index.html');
  const P1 = JSON.stringify({ v: 1, started: true, done: true, player: { name: 'Ava' } });
  await page.evaluate(p1 => { localStorage.clear(); localStorage.setItem('seStepUpProgress', p1); localStorage.setItem('seStepUpPlayer', JSON.stringify({ name: 'Ava', cls: '11SE' })); }, P1);

  await page.goto(BASE + 'step-up-circuit-rescue.html');
  console.log('\nSign-in');
  check(await page.inputValue('#obName') === 'Ava', 'player name reused from Part 1');
  await shot('01-signin');
  await page.click('#startBtn');

  // ---------- helpers ----------
  const st = () => page.evaluate(() => window.__circuitRescue.step());
  const sim = () => page.evaluate(() => window.__circuitRescue.sim());
  const chip = () => page.textContent('#diagChip');
  const next = async () => { await page.waitForSelector('#nextBtn:not(.hidden)'); await page.click('#nextBtn'); };
  const hole = async h => {
    const pt = await page.evaluate(h => {
      const svg = document.getElementById('board'), m = /^([A-J])(\d+)$/.exec(h), ci = 'ABCDEFGHIJ'.indexOf(m[1]), row = +m[2];
      const x = 156 + 22 + (row - 1) * 26, y = 30 + 28 + (ci < 5 ? ci : ci + 2) * 26;
      const p = svg.createSVGPoint(); p.x = x; p.y = y; const q = p.matrixTransform(svg.getScreenCTM()); return { x: q.x, y: q.y };
    }, h);
    await page.mouse.click(pt.x, pt.y);
  };
  const tray = async k => page.click(`[data-tray="${k}"]`);
  const place = async (k, ...hs) => { await tray(k); for (const h of hs) await hole(h); };
  const power = async on => { if ((await sim()).power !== on) await page.click('#powerBtn'); };
  const pressHold = async () => { const b = await page.$('#pressBtn'); const r = await b.boundingBox(); await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await page.mouse.down(); };
  const release = async () => page.mouse.up();
  const testCycle = async () => { await power(true); await pressHold(); const c = await chip(); await release(); return c; };
  const opt = async text => page.click(`#interact .opt:has-text("${text}")`);
  const sym = async id => page.click(`#schem [data-sym="${id}"] .hit`, { force: true });
  const act = async a => page.click(`#inspector [data-act="${a}"]`);
  const fb = () => page.textContent('#feedback');

  // ---------- Mission 1 ----------
  console.log('\nMission 1 – Decode the Diagram');
  await page.click('[data-phys="D1"]'); await page.click('[data-symc="R1"]');
  check(/resistor/i.test(await fb()), 'wrong match gives explanatory feedback');
  for (const id of ['D1', 'WIRE', 'S1', 'SUP', 'R1']) { await page.click(`[data-phys="${id}"]`); await page.click(`[data-symc="${id}"]`); }
  check((await st()).done, 'all components matched');
  await shot('02-m1-match'); await next();
  await page.click('[data-z="short"]'); check(/shorter leg/.test(await fb()), 'clicking the short leg explains it is the cathode');
  await page.click('[data-z="long"]'); await next();
  await page.click('[data-z="flat"]'); await next();
  await opt('Into the anode'); check((await st()).done, 'LED direction question'); await next();
  check(/MISSION 1 COMPLETE/.test(await page.textContent('#say')), 'mission complete card'); await next();
  check((await st()).mission === 'm2', 'Mission 2 unlocked and started');

  // ---------- Mission 2 ----------
  console.log('\nMission 2 – Complete the Circuit');
  if ((await st()).mission !== 'm2') await page.click('[data-m="m2"]');
  const fits = await page.evaluate(() => {
    const vis = id => { const r = document.getElementById(id).getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; };
    return { big: innerWidth >= 1000 && innerHeight >= 500, noScroll: document.documentElement.scrollHeight <= innerHeight + 1, board: vis('board'), power: vis('powerBtn'), press: vis('pressBtn'), status: vis('diagChip') };
  });
  if (fits.big) check(fits.noScroll && fits.board && fits.power && fits.press && fits.status, 'fit to screen: board, power, press and status all visible without scrolling ' + JSON.stringify(fits));
  await hole('C5'); check((await page.$$('#bbHi rect.hi')).length === 5, 'selecting a hole highlights its 5 connected contacts');
  check(/A5–E5/.test(await page.textContent('#inspector')), 'inspector names the connected group');
  await next();
  await hole('F5'); check(/channel/i.test(await fb()), 'F5 rejected: across the channel');
  await hole('C6'); check(/rows are NOT connected/i.test(await fb()), 'C6 rejected: neighbouring row');
  await hole('A5'); check((await st()).done, 'A5 accepted'); await next();
  await opt('A3 and A4'); await opt('G9 and J9'); check((await st()).done, 'connection quiz (retry after a wrong answer)'); await next();
  // Build an arrangement that is NOT Ohmbot's reference layout
  await place('led', 'H9', 'H14'); check(/3 holes/.test(await page.textContent('#placeMsg')), 'LED legs too far apart are refused');
  await page.keyboard.press('Escape');
  await place('pos', 'A3'); await place('neg', 'D12');
  await place('button', 'F3');
  await place('resistor', 'G5', 'G9');
  await place('led', 'H9', 'H12');
  check((await testCycle()).includes('Open circuit'), 'incomplete circuit reports an open circuit when pressed');
  await place('jumper', 'I12', 'C12');
  await shot('03-m2-built');
  await power(true);
  check((await chip()).includes('ready'), 'status: circuit ready (switch open)');
  await pressHold();
  check((await chip()).includes('operating'), 'status: circuit operating while pressed');
  check(await page.$('#bbParts [data-part="D1"] text') !== null && /LIT/.test(await page.textContent('#bbParts [data-part="D1"]')), 'LED drawn lit');
  await shot('04-m2-operating');
  await release();
  check((await st()).done, 'Mission 2 success needs press → lit and release → off');
  check(!(await page.textContent('#bbParts [data-part="D1"]')).includes('LIT'), 'LED off after release');
  await next();

  // ---------- Mission 3 ----------
  console.log('\nMission 3 – The Single Path');
  await next().catch(() => {});
  check((await st()).mission === 'm3', 'Mission 3 started');
  check(JSON.stringify((await page.evaluate(() => window.__circuitRescue.layout())).parts.find(p => p.id === 'D1')) .includes('H12'), 'Mission 3 uses the student\'s own saved circuit');
  await power(true); await page.check('#latch');
  check((await st()).done && (await page.$$('#bbPath .path-strip')).length > 0, 'current path shown while pressed'); await next();
  await sym('R1'); check(/reaches something else first/.test(await fb()), 'trace out of order is corrected');
  await sym('S1'); await sym('R1'); await sym('D1');
  check((await st()).done, 'trace complete: button → resistor → LED'); await shot('05-m3-trace'); await next();
  await page.uncheck('#latch');
  check((await st()).done && (await page.$$('#bbPath .path-strip')).length === 0, 'path disappears when the switch is released'); await next();
  await opt('A series circuit'); await next();
  await opt('breaks the only path'); await next();
  await page.fill('#ansText', 'Opening the switch breaks the single path so no current can flow around the loop.');
  await page.click('#ansBtn'); check((await st()).done, 'own-words explanation saved'); await next();

  // ---------- Mission 4 ----------
  console.log('\nMission 4 – Wrong Way Around');
  await next().catch(() => {});
  await power(true); await pressHold(); await release();
  check((await chip()).includes('hidden'), 'diagnosis hidden during investigation'); await next();
  await sym('R1'); await act('accuse'); check(/aren't polarised/.test(await fb()), 'accusing the resistor explains it is not polarised');
  await sym('D1'); await act('accuse'); check((await st()).done, 'reversed LED identified'); await next();
  await opt('only lets current through'); await next();
  await sym('D1'); await act('flip'); await testCycle();
  check((await st()).done, 'reversed LED repaired and tested'); await next();
  await power(true); await pressHold(); await release(); await next();
  await sym('SUP'); await act('accuse'); check((await st()).done, 'reversed supply identified'); await next();
  await sym('SUP'); await act('swap'); await testCycle(); check((await st()).done, 'supply polarity repaired'); await next();
  await page.fill('#ansText', 'The long leg was in the row that went to the negative lead, so it was reversed.'); await page.click('#ansBtn'); await next();

  // ---------- Mission 5 ----------
  console.log('\nMission 5 – The Broken Connection');
  await next().catch(() => {});
  await power(true);
  await opt('Yes:'); await opt('No:'); check((await st()).done, 'normally-open switch vs fault'); await next();
  await pressHold(); await release(); check((await st()).done, 'pressed and still dark'); await next();
  await hole('A2'); const insp = await page.textContent('#inspector'); check(/A2–E2/.test(insp), 'inspection works during the gap step' + (/A2–E2/.test(insp) ? '' : ': ' + insp));
  await page.click('#gapBtn'); await hole('C2'); await hole('C9');
  check(/wouldn't fix/.test(await fb()), 'wrong gap rejected');
  await page.click('#gapBtn'); await hole('C2'); await hole('C5'); check((await st()).done, 'true gap located'); await next();
  await place('jumper', 'D2', 'A5'); await testCycle(); check((await st()).done, 'missing jumper repaired (different holes from the original)'); await next();
  await power(true); await pressHold(); await release(); await next();
  await page.click('#gapBtn'); await hole('J14'); await hole('J13'); check((await st()).done, 'wrong-row gap located'); await next();
  await sym('D1'); await act('move'); await hole('H11'); await hole('H13'); await testCycle(); check((await st()).done, 'LED leg moved to the right row'); await next();
  await page.fill('#ansText', 'An open circuit breaks the path by accident so current cannot flow even when pressed.'); await page.click('#ansBtn'); await next();

  // ---------- Mission 6 ----------
  console.log('\nMission 6 – The Dangerous Shortcut');
  await next().catch(() => {});
  await power(true); check((await chip()).includes('Short circuit'), 'direct short trips the supply on power-up');
  check((await page.textContent('#bbSupply')).includes('SHUTDOWN'), 'supply display shows SHUTDOWN'); await shot('06-m6-short'); await next();
  await opt('connects + to − directly'); await next();
  await sym('R1'); await act('accuse'); check((await fb()).includes('normal loop'), 'accusing the resistor for a short is corrected');
  await page.click('#bbParts [data-part="J3"] rect'); await act('accuse'); check((await st()).done, 'shorting jumper identified'); await next();
  await page.click('#bbParts [data-part="J3"] rect'); await act('remove');
  check((await sim()).tripped, 'supply stays shut down until power is switched off');
  await power(false); await testCycle(); check((await st()).done, 'short removed and tested'); await next();
  await power(true); await pressHold(); await release();
  check((await sim()).blown && !(await sim()).tripped, 'bypassed resistor blows the LED but does NOT trip the supply'); await shot('07-m6-blown'); await next();
  await opt('bypasses the resistor'); await next();
  await page.click('#bbParts [data-part="J3"] rect'); await act('accuse'); check((await st()).done, 'bypass jumper identified'); await next();
  await power(false); await page.click('#bbParts [data-part="J3"] rect'); await act('remove'); await testCycle(); check((await st()).done, 'resistor bypass repaired'); await next();
  await opt('supply shuts down'); check((await st()).done, 'any prediction accepted (no penalty)'); await next();
  await power(true); await pressHold(); const c6 = await chip(); await release();
  check(c6.includes('LED shorted out') && !(await sim()).tripped, 'LED short is reported differently from a supply short'); await next();
  await page.fill('#ansText', 'A short circuit is a low resistance path so the current gets far too big.'); await page.click('#ansBtn'); await next();

  // ---------- Detective ----------
  console.log('\nFinal challenge – Circuit Detective');
  await next().catch(() => {});
  const fault = (await page.evaluate(() => window.__circuitRescue.state().detective.fault));
  console.log('    (fault chosen: ' + fault + ')');
  check(!(await page.textContent('#say')).toLowerCase().includes(fault.replace('-', ' ')), 'fault type not revealed');
  await power(true); await pressHold(); await release(); await hole('A2');
  await next();
  const LABEL = { 'led-reversed': 'Reversed LED', 'supply-reversed': 'Reversed supply polarity', 'missing-connection': 'Missing connection', 'wrong-row': 'Incorrect breadboard row', 'supply-short': 'Jumper shorting the supply', 'resistor-bypass': 'Bypassed current-limiting resistor' };
  const wrong = Object.keys(LABEL).find(k => k !== fault);
  await opt(LABEL[wrong]); check(/doesn't match/.test(await fb()), 'wrong diagnosis gets evidence-based feedback');
  await opt(LABEL[fault]); check(/one more test/.test(await fb()), 'guessing again immediately is blocked until more evidence is gathered');
  await hole('A13'); await opt(LABEL[fault]); check((await st()).done, 'correct diagnosis after further investigation'); await next();
  await page.fill('#ansText', 'When I pressed the button the LED did not behave normally because the path was wrong.'); await page.click('#ansBtn'); await next();
  await power(false);
  if (fault === 'led-reversed') { await sym('D1'); await act('flip'); }
  if (fault === 'supply-reversed') { await sym('SUP'); await act('swap'); }
  if (fault === 'missing-connection') await place('jumper', 'J13', 'C13');
  if (fault === 'wrong-row') { await sym('R1'); await act('move'); await hole('G7'); await hole('G11'); }
  if (fault === 'supply-short' || fault === 'resistor-bypass') { await page.click('#bbParts [data-part="J3"] rect'); await act('remove'); }
  await testCycle();
  check((await st()).done, 'repaired and demonstrated'); await next();
  check(!(await page.isHidden('#endOverlay')), 'completion screen shown');
  check((await page.$$('.concepts li:not(.no)')).length === 7, 'all 7 concepts listed as demonstrated');
  await page.fill('#reflection', 'Every part in a series circuit shares one path, so one break stops everything.');
  await page.click('#makeReport');
  const rep = await page.textContent('#reportPreview');
  check(rep.includes('Ava') && rep.includes(LABEL[fault]) && rep.includes('one break stops everything'), 'report has name, diagnosed fault, explanation and reflection');
  await shot('08-end');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#repPng')]);
  const dlPath = await dl.path(); check(dlPath && fs.statSync(dlPath).size > 20000, 'report PNG downloads (' + (dlPath ? fs.statSync(dlPath).size : 0) + ' bytes)');
  if (SHOTS) await dl.saveAs(`${SHOTS}/report.png`);

  // ---------- persistence ----------
  console.log('\nPersistence, reload and restart');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('seStepUp2Progress')));
  check(saved.done && saved.completed.length === 7 && saved.detective.solved, 'progress saved: 7 missions, detective solved');
  check(Object.values(saved.hints).length >= 0 && typeof saved.answers.m3 === 'string', 'answers saved');
  check(await page.evaluate(p1 => localStorage.getItem('seStepUpProgress') === p1 && JSON.parse(localStorage.getItem('seStepUpPlayer')).cls === '11SE', P1), 'Part 1 progress and player untouched');
  await page.reload();
  check(/case closed/.test(await page.textContent('#resumeText')), 'reload offers to continue a finished game');
  await page.click('#resumeBtn');
  check(!(await page.isHidden('#endOverlay')), 'finished game reopens the completion screen');
  await page.click('#endBack'); await page.click('[data-m="m2"]');
  check((await st()).mission === 'm2', 'completed missions can be replayed');
  // mid-mission reload keeps the current mission
  await page.click('[data-m="m4"]'); await page.reload(); await page.click('#resumeBtn');
  check((await st()).mission === 'm4', 'reload resumes the current mission');
  await page.click('#restartBtn'); await page.click('#cfYes'); await page.waitForLoadState('load');
  check(await page.isVisible('#signCard') && await page.evaluate(() => !localStorage.getItem('seStepUp2Progress')), 'restart clears Part 2 progress only');
  check(await page.evaluate(p1 => localStorage.getItem('seStepUpProgress') === p1, P1), 'Part 1 still untouched after restart');

  // ---------- hub ----------
  console.log('\nGame hub');
  await page.goto(BASE + 'index.html');
  check(await page.isVisible('a[href="step-up-circuit-rescue.html"]'), 'hub links to Part 2');
  check(/Part 1/i.test(await page.textContent('#stepup')) && /Part 2/i.test(await page.textContent('#stepup')), 'hub shows Part 1 → Part 2 sequence');
  check(!(await page.textContent('#sat')).includes('Circuit Rescue'), 'Part 2 not in the Year 12 SAT sequence');
  await page.evaluate(() => localStorage.setItem('seStepUp2Progress', JSON.stringify({ v: 1, started: true, done: true })));
  await page.reload();
  check(/Report made/i.test(await page.textContent('#su2done')), 'hub shows Part 2 progress from its own key');
  await page.locator('#stepup').scrollIntoViewIfNeeded(); await shot('09-hub');

  // ---------- every detective fault ----------
  console.log('\nCircuit Detective: every fault scenario');
  for (const f of Object.keys(LABEL)) {
    await page.goto(BASE + 'index.html');
    await page.evaluate(f => localStorage.setItem('seStepUp2Progress', JSON.stringify({ v: 1, started: true, player: { name: 'Tester', cls: 'X' }, current: 'det', completed: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'], detective: { fault: f, last: f, wrongTries: 0, diagnosed: false, explanation: '', solved: false, hints: 0 } })), f);
    await page.goto(BASE + 'step-up-circuit-rescue.html'); await page.click('#resumeBtn');
    await power(true); await pressHold(); const seen = await chip(); await release(); await hole('A2');
    const s1 = await sim();
    await next();
    await opt(LABEL[f]);
    await next();
    await page.fill('#ansText', 'Explaining what I saw and how the current path was affected by this fault.'); await page.click('#ansBtn'); await next();
    await power(false);
    if (f === 'led-reversed') { await sym('D1'); await act('flip'); }
    if (f === 'supply-reversed') { await sym('SUP'); await act('swap'); }
    if (f === 'missing-connection') await place('jumper', 'J13', 'C13');
    if (f === 'wrong-row') { await sym('R1'); await act('move'); await hole('G7'); await hole('G11'); }
    if (f === 'supply-short' || f === 'resistor-bypass') { await page.click('#bbParts [data-part="J3"] rect'); await act('remove'); }
    await testCycle();
    const symptom = f === 'supply-short' ? s1.tripped : f === 'resistor-bypass' ? s1.blown : (!s1.tripped && !s1.blown && seen.includes('hidden'));
    check(symptom && (await st()).done, `${f}: correct symptom while investigating (${seen.trim()}), diagnosed, repaired, demonstrated`);
  }

  check(errors.length === 0, 'no page errors or failed assertions' + (errors.length ? ': ' + errors.join(' | ') : ''));
  console.log(`\n${pass} passed, ${fail} failed\n`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
