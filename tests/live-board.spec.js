// End-to-end test of the class live board (live.js + dashboard.html) against a MOCK Supabase.
// Students play the real pages; their posts go into an in-memory table; the real dashboard reads it back.
//   python3 -m http.server 8765 &   node tests/live-board.spec.js      (Optional: SHOTS=dir)
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:8765/';
const SHOTS = process.env.SHOTS || '';
let pass = 0, fail = 0;
const check = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m); } };

// ---------------- mock Supabase ----------------
const rows = []; let nextId = 1, down = false;
async function mockSupabase(ctx) {
  await ctx.route(/supabase\.co\/rest\/v1\/rubric_events/, async route => {
    const req = route.request();
    if (down) return route.fulfill({ status: 503, body: 'down' });
    if (req.method() === 'POST') {
      const r = JSON.parse(req.postData());
      for (const k of ['session_code', 'player_id', 'name', 'event', 'level']) if (r[k] === undefined || r[k] === null || r[k] === '') return route.fulfill({ status: 400, body: 'missing ' + k });
      rows.push(Object.assign({ id: nextId++, created_at: new Date().toISOString() }, r));
      return route.fulfill({ status: 201, body: '' });
    }
    const u = new URL(req.url()), q = k => (u.searchParams.get(k) || '').replace(/^(eq|gt)\./, '');
    const out = rows.filter(r => r.session_code === decodeURIComponent(q('session_code')) && String(r.level) === q('level') && r.id > Number(q('id') || 0));
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(out) });
  });
  await ctx.route(/supabase\.co\/rest\/v1\/level_locks/, route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await ctx.route(/supabase\.co\/auth\//, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ access_token: 'a', refresh_token: 'r', expires_in: 3600, user: { email: 'teacher@test' } }) }));
}
const sent = (f) => rows.filter(f);
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
  await mockSupabase(ctx);
  const errors = [];
  const newPage = async () => { const p = await ctx.newPage(); p.on('pageerror', e => errors.push(p.url() + ': ' + e.message)); p.on('console', m => { if (/Assertion failed/.test(m.text())) errors.push(m.text()); }); return p; };
  const shot = async (p, n) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: `${SHOTS}/${n}.png` }); } };

  console.log('\nPractice mode sends nothing');
  let pg = await newPage();
  await pg.goto(BASE + 'index.html'); await pg.evaluate(() => localStorage.clear());
  await pg.goto(BASE + 'step-up-circuit-rescue.html');
  await pg.fill('#obName', 'Zoe'); await pg.fill('#obClass', '11A'); await pg.click('#startBtn');
  await pg.click('[data-phys="D1"]'); await pg.click('[data-symc="R1"]'); // a wrong answer
  await wait(600);
  check(rows.length === 0, 'no rows sent without a session code');
  check(/Join class board/.test(await pg.textContent('#seLiveChip')), 'chip offers to join the class board');
  check((await pg.evaluate(() => SELive.state().score)) === 0, 'practice mistakes cost nothing');

  console.log('\nJoining from the chip (Circuit Rescue, level 7)');
  await pg.click('#seLiveChip');
  await pg.fill('#seLiveCode', 'test1');
  check(await pg.inputValue('#seLiveName') === 'Zoe', 'join panel knows the student\'s name');
  await pg.click('#seLivePanel [data-x="join"]'); await wait(500);
  check(sent(r => r.event === 'join' && r.level === 7 && r.session_code === 'TEST1' && r.name === 'Zoe').length === 1, 'join row sent with level 7 and the upper-cased code');
  check(/LIVE TEST1/.test(await pg.textContent('#seLiveChip')), 'chip shows LIVE and the code');
  for (const id of ['D1', 'WIRE', 'S1', 'SUP', 'R1']) { await pg.click(`[data-phys="${id}"]`); await pg.click(`[data-symc="${id}"]`); }
  await wait(400);
  const a1 = sent(r => r.level === 7 && r.event === 'answer' && r.question_id === 'm1:0');
  check(a1.length === 1 && a1[0].correct === true && a1[0].score === 5, 'step after earlier mistake scores 5 (retry)');
  // rest of mission 1
  const next = async () => { await pg.waitForSelector('#nextBtn:not(.hidden)'); await pg.click('#nextBtn'); };
  await next(); await pg.click('[data-z="long"]'); await next(); await pg.click('[data-z="flat"]'); await next();
  await pg.click('#interact .opt:has-text("Into the anode")'); await next();
  await wait(500);
  check(sent(r => r.level === 7 && r.event === 'vault' && r.question_id === 'S:m1' && r.vault === 1).length === 1, 'mission complete → section row (vault 1)');
  const score1 = await pg.evaluate(() => SELive.state().score);
  check(score1 === 5 + 10 + 10 + 10 + 20, `points: 5 + 3×10 + 20 = ${score1}`);
  // replay mission 1: no extra points
  await pg.click('[data-m="m1"]');
  for (const id of ['D1', 'WIRE', 'S1', 'SUP', 'R1']) { await pg.click(`[data-phys="${id}"]`); await pg.click(`[data-symc="${id}"]`); }
  await next(); await pg.click('[data-z="long"]'); await next(); await pg.click('[data-z="flat"]'); await next();
  await pg.click('#interact .opt:has-text("Into the anode")'); await next(); await wait(400);
  check((await pg.evaluate(() => SELive.state().score)) === score1, 'replaying a mission adds no points');
  await shot(pg, 'live-01-circuit-chip');

  console.log('\nOffline queue');
  down = true;
  await pg.click('[data-m="m2"]').catch(() => {});
  await pg.evaluate(() => SELive.answer('offline-test', true, { sec: 2 }));
  await wait(700);
  check(/saving offline/.test(await pg.textContent('#seLiveChip')), 'chip shows offline when the database is unreachable');
  const before = rows.length; down = false; await wait(6000);
  check(rows.length > before && sent(r => r.question_id === 'offline-test').length === 1, 'queued row delivered once the connection returns');

  console.log('\nJoining by link with a known name (Evidence Studio Y11, level 8)');
  const p2 = await newPage();
  await p2.goto(BASE + 'evidence-studio.html');
  await p2.fill('#obName', 'Ari'); await p2.fill('#obClass', '11A'); await p2.click('#startBtn');
  await p2.goto(BASE + 'evidence-studio.html?session=TEST1'); await p2.click('#resumeBtn'); await wait(600);
  check(sent(r => r.level === 8 && r.event === 'join' && r.name === 'Ari').length === 1, 'opening the ?session= link joins automatically when the name is known');
  await p2.click('[data-tab="makeover"]');
  const r0 = await p2.evaluate(() => window.__evidenceStudio.ROUNDS[0]);
  await p2.click(`[data-p="${r0.probs.findIndex(x => !x.ok)}"]`); await p2.click('#mkCheck'); // wrong
  await p2.click(`[data-p="${r0.probs.findIndex(x => !x.ok)}"]`);
  for (let k = 0; k < r0.probs.length; k++) if (r0.probs[k].ok) await p2.click(`[data-p="${k}"]`);
  await p2.click('#mkCheck'); await p2.click('#mkNext');
  await p2.click(`[data-u="${r0.ups.findIndex(x => x.ok)}"]`);
  await p2.click('[data-tab="signature"]'); const [dl] = await Promise.all([p2.waitForEvent('download'), p2.click('[data-dl="test"][data-type="svg"]')]); await dl.path();
  await p2.click('[data-tab="audit"]');
  for (const k of ['show', 'say', 'why', 'next']) await p2.click(`[data-row="stages"] [data-ck="${k}"]`);
  await p2.fill('[data-row="kpis"] [data-need]', 'targets with numbers');
  await p2.fill('#dWeek', 'Build stage photos'); await p2.fill('#dNext', 'KPI table'); await p2.fill('#dStuck', 'relay wiring');
  const [dl2] = await Promise.all([p2.waitForEvent('download'), p2.click('#dropBtn')]); await dl2.path();
  await wait(3200);
  check(sent(r => r.level === 8 && r.question_id === 'S:MK1').length === 1, 'makeover round → section row');
  check(sent(r => r.level === 8 && r.question_id === 'SIG').length === 1, 'signature reported');
  const audit = sent(r => r.level === 8 && r.question_id === 'AUDIT').pop();
  check(audit && audit.payload.stages.construct[0] === 1 && audit.score === 0, 'audit snapshot sent (no points) with stage counts');
  const drop = sent(r => r.level === 8 && r.question_id === 'DROP').pop();
  check(drop && drop.payload.stuck === 'relay wiring' && drop.payload.needs.some(n => /targets with numbers/.test(n)), 'weekly drop sent with stuck-on and still-needed');
  check(sent(r => r.level === 8 && r.question_id === 'AUDIT').length <= 3, 'rapid audit edits are merged (debounced)');

  console.log('\nOther activities load and join with the right level');
  for (const [file, lvl] of [['orientation.html', 1], ['step-up.html', 5], ['controller-challenge.html', 6], ['evidence-studio-sat.html', 9]]) {
    const p = await newPage();
    await p.goto(BASE + file + '?session=TEST1'); await wait(900);
    const panel = await p.$('#seLivePanel');
    if (panel) { await p.fill('#seLiveName', 'Kai'); await p.fill('#seLiveCls', '12B'); await p.click('#seLivePanel [data-x="join"]'); }
    await wait(500);
    check(sent(r => r.level === lvl && r.event === 'join' && r.session_code === 'TEST1').length >= 1, `${file}: joins as level ${lvl}`);
    if (lvl === 1 || lvl === 5) { // typing in the panel must not drive the game
      await p.click('#seLiveChip'); await p.click('#seLivePanel [data-x="close"]');
    }
    await p.close();
  }

  console.log('\nTeacher dashboard: game leaderboard (level 7)');
  const d = await newPage();
  await d.goto(BASE + 'index.html');
  await d.evaluate(() => localStorage.setItem('seTeacherAuth', JSON.stringify({ access: 'a', refresh: 'r', expiresAt: Date.now() + 3600e3, email: 'teacher@test', stay: true })));
  await d.goto(BASE + 'dashboard.html?session=TEST1&level=7'); await wait(3500);
  check((await d.textContent('#title')).includes('CIRCUIT RESCUE'), 'dashboard opens the Circuit Rescue board');
  const lbText = await d.textContent('#lb');
  const zoeScore = await pg.evaluate(() => SELive.state().score);
  check(lbText.includes('Zoe') && lbText.includes(String(zoeScore)), `leaderboard shows Zoe with ${zoeScore} pts`);
  check((await d.textContent('#race')).includes('1/7'), 'race shows sections done out of 7');
  check((await d.textContent('#heat')).includes('Decode'), 'heatmap uses Circuit Rescue section names');
  check(/STUDIO Y11/.test(await d.textContent('#boardLvl')) && /ORIENTATION/.test(await d.textContent('#boardLvl')), 'level buttons include the new activities');
  await shot(d, 'live-02-dashboard-game');

  console.log('\nTeacher dashboard: progress wall (level 8)');
  await d.goto(BASE + 'dashboard.html?session=TEST1&level=8'); await wait(3500);
  check(!(await d.isHidden('#wallBoard')) && await d.isHidden('#mainGrid'), 'wall view replaces the leaderboard layout');
  const wall = await d.textContent('#wall');
  check(wall.includes('Ari') && wall.includes('✓'), 'progress wall lists Ari with a drop this week');
  check((await d.textContent('#lbWall')).includes('Ari'), 'makeover leaderboard lists Ari');
  check((await d.$$eval('#wall td.wc.part, #wall td.wc.full', x => x.length)) >= 1, 'stage cells coloured from the audit snapshot');
  check(/Drops this week/.test(await d.textContent('#stVaultsLbl')) && (await d.textContent('#stVaults')) === '1', 'stats show drops this week');
  await d.keyboard.press('t'); await wait(300);
  check((await d.textContent('#tbody')).includes('relay wiring'), 'teacher view (private) shows what the student is stuck on');
  await shot(d, 'live-03-dashboard-wall');
  await d.keyboard.press('t');

  console.log('\nHub markers');
  const h = await newPage(); await h.goto(BASE + 'index.html');
  const lbCards = await h.$$eval('.lvl .t-lb', x => x.length), wallCards = await h.$$eval('.lvl .t-wall', x => x.length);
  check(lbCards === 5 && wallCards === 4, `hub: ${lbCards} leaderboard cards, ${wallCards} progress-wall cards`);
  check(await h.isVisible('.trackkey'), 'hub explains the two markers');
  await h.locator('#sat').scrollIntoViewIfNeeded(); await shot(h, 'live-04-hub');

  check(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  console.log(`\n${pass} passed, ${fail} failed (${rows.length} rows in mock table)\n`);
  await browser.close(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
