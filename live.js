// Class live board: connects any activity to the teacher's live dashboard (dashboard.html).
//
// How it works
//  - Students only appear on the board after joining with the class session code (from the
//    dashboard, or the ?session=CODE link). Without a code nothing is sent: practice mode.
//  - Events go to the same Supabase table as Rubric Heist (rubric_events), tagged with the
//    activity's level number (the same number as its teacher lock).
//  - Points are the same in every activity so boards are fair:
//      10 = correct first try · 5 = correct after a retry · 0 = revealed
//      20 = each section completed · 50 = finishing
//    Each question and section counts once, so replaying never adds points.
//  - Offline: events wait in a queue and are retried every 5 seconds.
//
// Use in a page:
//   <script src="live.js"></script>
//   SELive.init({ level: 7, name: 'Circuit Rescue', joinPayload: () => ({...}), corner: 'right' });  (corner is optional)
//   SELive.identify(name, cls)          when the student signs in or resumes
//   SELive.answer('M2:3', true, { sec: 2 })   every attempt at a question / check
//   SELive.stage('m2', { sec: 2, label: 'Mission 2' })   a section completed
//   SELive.finish()                     the whole activity completed
//   SELive.report('AUDIT', {...})       non-scoring progress snapshot (progress walls)
(function () {
  'use strict';
  const SUPABASE_URL = 'https://elebvltrvcqqyyjwwydi.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_wgUH3E8Nepy-6QC_dXpVtA_Uyszqkrm'; // publishable key: safe in a web page
  const PTS = { first: 10, retry: 5, stage: 20, finish: 50 };
  const LAST_KEY = 'seLiveLastSession';
  let cfg = null, st = null, queue = [], flushing = false, online = true, retryTimer = null, chip = null, panel = null;
  const debounce = {};

  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));
  const blank = () => ({ pid: uuid(), session: '', name: '', cls: '', score: 0, q: {}, sec: {}, done: false, t0: 0 });
  const key = () => 'seLive:' + cfg.level;
  function load() { try { const s = JSON.parse(localStorage.getItem(key()) || 'null'); return s && s.pid ? Object.assign(blank(), s) : null; } catch (e) { return null; } }
  function persist() { try { localStorage.setItem(key(), JSON.stringify(st)); } catch (e) {} }
  const validCode = c => /^[A-Z0-9]{4,8}$/.test(c || '');
  function knownName() {
    if (st.name) return { name: st.name, cls: st.cls };
    for (const k of ['sePlayer', 'seStepUpPlayer', 'seStepUp2Player', 'rubricHeistPlayer']) {
      try { const v = JSON.parse(localStorage.getItem(k) || 'null'); if (v && v.name) return { name: v.name, cls: v.cls || '' }; } catch (e) {}
    }
    return { name: '', cls: '' };
  }
  function lastSession() { try { const v = JSON.parse(localStorage.getItem(LAST_KEY) || 'null'); return v && Date.now() - v.at < 10 * 3600 * 1000 ? v.code : ''; } catch (e) { return ''; } }

  // ---------------- network ----------------
  function post(event, extra) {
    if (!st || !st.session) return; // practice mode: nothing leaves the device
    queue.push(Object.assign({
      session_code: st.session, player_id: st.pid, name: st.name, class: st.cls || null, event, level: cfg.level,
      elapsed_s: Math.min(7200, Math.round((Date.now() - (st.t0 || Date.now())) / 1000))
    }, extra || {}));
    flush();
  }
  async function flush() {
    if (flushing || !queue.length) return;
    flushing = true;
    while (queue.length) {
      try {
        const res = await fetch(SUPABASE_URL + '/rest/v1/rubric_events', {
          method: 'POST', headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(queue[0])
        });
        if (res.ok || (res.status >= 400 && res.status < 500)) { if (!res.ok) console.warn('[live] row rejected', res.status); queue.shift(); }
        else throw new Error('server ' + res.status);
        setOnline(true);
      } catch (e) { setOnline(false); clearTimeout(retryTimer); retryTimer = setTimeout(flush, 5000); break; }
    }
    flushing = false;
  }
  function setOnline(v) { online = v; drawChip(); }

  // ---------------- public API ----------------
  function init(c) {
    cfg = Object.assign({ name: 'this activity', joinPayload: null }, c);
    st = load() || blank();
    buildChip();
    const fromUrl = (new URLSearchParams(location.search).get('session') || '').toUpperCase();
    if (validCode(fromUrl) && fromUrl !== st.session) {
      const who = knownName();
      if (who.name && who.cls) { st.name = who.name; st.cls = who.cls; join(fromUrl); }
      else setTimeout(() => openPanel(fromUrl), 400);
    } else if (st.session) { setTimeout(flush, 500); }
    drawChip();
  }
  // Called when the student signs in or resumes. A different name on a shared device starts fresh.
  function identify(name, cls) {
    if (!st || !name) return;
    if (st.name && st.name.toLowerCase() !== String(name).toLowerCase()) { const s = st.session; st = blank(); if (s) { st.session = s; st.t0 = Date.now(); } }
    const changed = st.name !== name || st.cls !== cls;
    st.name = name; st.cls = cls || ''; persist();
    if (changed && st.session) catchUp();
    drawChip();
  }
  function join(code) {
    st.session = code; st.t0 = Date.now(); persist();
    try { localStorage.setItem(LAST_KEY, JSON.stringify({ code, at: Date.now() })); } catch (e) {}
    catchUp();
    toast(`📡 Connected to class board ${code}`);
    drawChip();
  }
  function catchUp() { // tell the board who we are and what we've already done
    post('join', { payload: Object.assign({ total: st.score }, cfg.joinPayload ? safe(cfg.joinPayload) : {}) });
    const done = Object.keys(st.sec).length;
    if (done || st.score) post('vault', { vault: Math.min(9, done), score: 0, question_id: 'CATCHUP', payload: { total: st.score, catchup: true } });
    if (st.done) post('finish', { vault: 9, score: st.score, payload: { total: st.score } });
    if (cfg.onJoin) safe(cfg.onJoin);
  }
  function safe(fn) { try { return fn() || {}; } catch (e) { return {}; } }
  function leave() { st.session = ''; persist(); drawChip(); toast('Left the class board. Practice mode: nothing is sent.'); }
  function answer(qid, correct, o) {
    o = o || {}; qid = String(qid).slice(0, 60);
    const r = st.q[qid] || (st.q[qid] = { t: 0, d: 0 });
    if (r.d) return 0; // already resolved: replays don't score
    let pts = 0;
    if (correct) { r.d = 1; pts = o.revealed ? 0 : (r.t === 0 ? PTS.first : PTS.retry); st.score += pts; } else r.t++;
    persist(); drawChip();
    post('answer', { vault: o.sec || 0, question_id: qid, correct: !!correct, score: pts, payload: { total: st.score, sec: o.sec || 0, revealed: !!o.revealed } });
    return pts;
  }
  function stage(id, o) {
    o = o || {}; id = String(id);
    if (st.sec[id]) return 0;
    st.sec[id] = 1; st.score += PTS.stage; persist(); drawChip();
    post('vault', { vault: Math.min(9, Object.keys(st.sec).length), score: PTS.stage, question_id: ('S:' + id).slice(0, 60), payload: { total: st.score, sec: o.sec || 0, label: o.label || id } });
    return PTS.stage;
  }
  function finish(o) {
    if (st.done) return 0;
    st.done = true; st.score += PTS.finish; persist(); drawChip();
    post('finish', { vault: 9, score: st.score, payload: Object.assign({ total: st.score }, (o && o.payload) || {}) });
    return PTS.finish;
  }
  // Non-scoring snapshot for progress walls. Repeated reports of the same kind are merged (sent after 2.5 s quiet).
  function report(kind, payload, now) {
    if (!st || !st.session) return;
    const send = () => post('answer', { vault: 0, question_id: String(kind).slice(0, 60), score: 0, payload: Object.assign({ total: st.score }, payload || {}) });
    clearTimeout(debounce[kind]);
    if (now) send(); else debounce[kind] = setTimeout(send, 2500);
  }

  // ---------------- UI: a small chip in the corner ----------------
  const css = `#seLiveChip{position:fixed;left:10px;bottom:10px;z-index:2147482000;font:bold 12px monospace;border-radius:16px;padding:6px 11px;cursor:pointer;border:2px solid #555;background:rgba(10,10,16,0.92);color:#ddd;box-shadow:0 2px 10px rgba(0,0,0,.5)}
#seLiveChip.live{border-color:#4ade80;color:#4ade80}#seLiveChip.off{border-color:#facc15;color:#facc15}
#seLivePanel{position:fixed;left:10px;bottom:48px;z-index:2147482001;width:min(330px,calc(100vw - 20px));background:#0b0b12;color:#eee;border:2px solid #22d3ee;border-radius:10px;padding:12px;font:13px/1.45 monospace;box-shadow:0 6px 24px rgba(0,0,0,.6)}
#seLivePanel h4{margin:0 0 6px;font-size:14px;color:#fff}#seLivePanel label{display:block;margin:7px 0 2px;color:#cbd5e1}
#seLivePanel input{width:100%;box-sizing:border-box;background:#111;color:#eee;border:1px solid #555;border-radius:5px;padding:6px 8px;font:14px monospace}
#seLivePanel button{margin-top:9px;margin-right:6px;padding:7px 11px;border-radius:6px;border:none;font:bold 13px monospace;cursor:pointer;background:#22d3ee;color:#000}
#seLivePanel button.alt{background:#222;color:#eee;border:1px solid #555}#seLivePanel .msg{color:#f87171;min-height:1.2em;margin-top:4px}
#seLiveToast{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147482002;background:#052e16;color:#4ade80;border:2px solid #4ade80;border-radius:8px;padding:8px 14px;font:bold 13px monospace}
html.seLiveRight #seLiveChip,html.seLiveRight #seLivePanel{left:auto;right:10px}
@media print{#seLiveChip,#seLivePanel,#seLiveToast{display:none!important}}`;
  function buildChip() {
    if (chip) return;
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    chip = document.createElement('button'); chip.id = 'seLiveChip'; chip.type = 'button';
    if (cfg.corner === 'right') document.documentElement.classList.add('seLiveRight');
    chip.addEventListener('click', () => (panel ? closePanel() : openPanel()));
    document.body.appendChild(chip);
  }
  function drawChip() {
    if (!chip) return;
    chip.className = st.session ? (online ? 'live' : 'off') : '';
    chip.textContent = st.session ? (online ? `● LIVE ${st.session} · ${st.score} pts` : `● ${st.session} · saving offline`) : '📡 Join class board';
    chip.title = st.session ? 'You are on the class board. Click for details.' : 'Practice mode: nothing is sent. Click to join your class board with a session code.';
  }
  function openPanel(prefill) {
    closePanel();
    panel = document.createElement('div'); panel.id = 'seLivePanel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Class board');
    const who = knownName();
    if (st.session && !prefill) {
      panel.innerHTML = `<h4>📡 Class board: ${st.session}</h4><div>You're on your class's live board for ${esc(cfg.name)} as <b>${esc(st.name)}</b>${st.cls ? ' (' + esc(st.cls) + ')' : ''}.</div>
        <div style="margin-top:6px;color:#9ca3af">Points: ${st.score}. 10 = right first try · 5 = right after a retry · 20 = section done · 50 = finished.</div>
        <button class="alt" data-x="leave">Leave board</button><button data-x="close">Close</button>`;
    } else {
      panel.innerHTML = `<h4>📡 Join your class board</h4><div style="color:#9ca3af">Only if your teacher gave you a session code. Your first name, class and progress in ${esc(cfg.name)} will show on the class board.</div>
        <label for="seLiveCode">Session code</label><input id="seLiveCode" maxlength="8" autocomplete="off" value="${esc(prefill || st.session || lastSession())}">
        <label for="seLiveName">First name</label><input id="seLiveName" maxlength="40" autocomplete="given-name" value="${esc(who.name)}">
        <label for="seLiveCls">Class</label><input id="seLiveCls" maxlength="20" value="${esc(who.cls)}">
        <div class="msg" id="seLiveMsg" role="alert"></div><button data-x="join">Join ▶</button><button class="alt" data-x="close">Not now</button>`;
    }
    // keep typing inside the panel away from the game's keyboard controls
    ['keydown', 'keyup', 'keypress'].forEach(t => panel.addEventListener(t, e => e.stopPropagation()));
    panel.addEventListener('click', e => {
      const x = e.target.dataset && e.target.dataset.x; if (!x) return;
      if (x === 'close') closePanel();
      if (x === 'leave') { leave(); closePanel(); }
      if (x === 'join') tryJoin();
    });
    panel.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') tryJoin(); if (e.key === 'Escape') closePanel(); });
    document.body.appendChild(panel);
    const f = panel.querySelector('input'); if (f) setTimeout(() => f.focus(), 30);
  }
  function tryJoin() {
    const code = panel.querySelector('#seLiveCode').value.trim().toUpperCase(), name = panel.querySelector('#seLiveName').value.trim(), cls = panel.querySelector('#seLiveCls').value.trim();
    const m = panel.querySelector('#seLiveMsg');
    if (!validCode(code)) { m.textContent = 'Session codes are 4–8 letters or numbers. Check the board.'; return; }
    if (!name || !cls) { m.textContent = 'Add your first name and class.'; return; }
    if (st.name && st.name.toLowerCase() !== name.toLowerCase()) st = Object.assign(blank(), {});
    st.name = name; st.cls = cls; closePanel(); join(code);
  }
  function closePanel() { if (panel) { panel.remove(); panel = null; } }
  function toast(t) {
    let el = document.getElementById('seLiveToast');
    if (!el) { el = document.createElement('div'); el.id = 'seLiveToast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = t; el.style.display = ''; clearTimeout(toast.h); toast.h = setTimeout(() => { el.style.display = 'none'; }, 3000);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  window.SELive = { init, identify, answer, stage, finish, report, open: openPanel,
    state: () => (st ? JSON.parse(JSON.stringify(st)) : null), points: PTS };
})();
