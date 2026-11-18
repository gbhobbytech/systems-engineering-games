// Teacher level locks: shared by the level select page and every game.
// The teacher locks/unlocks levels from the dashboard; rows live in Supabase table level_locks.
// If the lock status can't be loaded (offline etc.), levels stay open so a lesson is never blocked by a network hiccup.
(function () {
  const SUPABASE_URL = 'https://elebvltrvcqqyyjwwydi.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_wgUH3E8Nepy-6QC_dXpVtA_Uyszqkrm'; // publishable key: safe in a web page
  const RECHECK_MS = 20000;

  async function fetchLocks() {
    const r = await fetch(SUPABASE_URL + '/rest/v1/level_locks?select=level,locked', { headers: { apikey: SUPABASE_KEY }, cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    const map = {};
    (await r.json()).forEach(x => { map[x.level] = !!x.locked; });
    return map;
  }

  // Game pages: if the level is locked when the page opens, cover it until the teacher unlocks it.
  // Students already playing when a level gets locked are not interrupted.
  function guard(level) {
    let overlay = null, timer = null;
    const blockKeys = e => { if (overlay) { e.stopImmediatePropagation(); if (e.key !== 'Tab') e.preventDefault(); } };
    function cover() {
      if (overlay) return;
      overlay = document.createElement('div');
      overlay.id = 'seLock';
      overlay.setAttribute('role', 'dialog');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,0.94);color:#eee;font-family:monospace;' +
        'display:flex;align-items:center;justify-content:center;text-align:center;padding:20px';
      overlay.innerHTML = '<div style="max-width:520px;border:2px solid #f87171;border-radius:12px;padding:26px 22px;background:#140606;box-shadow:0 0 30px rgba(248,113,113,0.35)">' +
        '<div style="font-size:56px">🔒</div>' +
        '<div style="font:bold clamp(26px,6vw,40px) monospace;color:#fff;margin:6px 0 10px;text-shadow:0 0 12px #f87171">LOCKED</div>' +
        '<div id="seLockMsg" style="font-size:16px;line-height:1.5">Your teacher hasn\'t opened this level yet.</div>' +
        '<div style="font-size:13px;color:#999;margin-top:10px">This page checks again every 20 seconds and opens by itself when it\'s unlocked.</div>' +
        '<a href="index.html" style="display:inline-block;margin-top:18px;padding:10px 16px;border:1px solid #555;border-radius:6px;color:#eee;text-decoration:none;font:bold 15px monospace">◀ LEVEL SELECT</a></div>';
      document.body.appendChild(overlay);
      window.addEventListener('keydown', blockKeys, true);
    }
    function uncover() {
      if (!overlay) return;
      const box = overlay.firstChild;
      box.style.borderColor = '#4ade80'; box.style.background = '#06140b'; box.style.boxShadow = '0 0 30px rgba(74,222,128,0.4)';
      box.innerHTML = '<div style="font-size:56px">🔓</div><div style="font:bold clamp(26px,6vw,40px) monospace;color:#fff;margin:6px 0 10px;text-shadow:0 0 12px #4ade80">UNLOCKED!</div>' +
        '<button id="seLockGo" style="padding:12px 18px;border:none;border-radius:6px;background:#4ade80;color:#000;font:bold 16px monospace;cursor:pointer">LET\'S GO ▶</button>';
      const go = () => { window.removeEventListener('keydown', blockKeys, true); overlay.remove(); overlay = null; };
      document.getElementById('seLockGo').addEventListener('click', go);
      document.getElementById('seLockGo').focus();
    }
    async function check(first) {
      try {
        const locks = await fetchLocks();
        if (locks[level]) cover();
        else if (overlay) { clearInterval(timer); timer = null; window.removeEventListener('keydown', blockKeys, true); window.addEventListener('keydown', blockKeysExceptGo, true); uncover(); }
        if (first && locks[level]) timer = setInterval(() => check(false), RECHECK_MS);
      } catch (e) { /* offline: leave the level open */ }
    }
    function blockKeysExceptGo(e) {
      if (!overlay) { window.removeEventListener('keydown', blockKeysExceptGo, true); return; }
      if (e.target && e.target.id === 'seLockGo') return; // Enter/Space on the button still works
      e.stopImmediatePropagation(); e.preventDefault();
    }
    check(true);
  }

  window.SELocks = { fetch: fetchLocks, guard: guard, RECHECK_MS: RECHECK_MS };
})();
