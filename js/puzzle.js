/* Paw Path: a treat-sorting puzzle path. Sort the treats so each jar holds one flavor.
   Every 3 levels unlocks an ability that helps in daily life. */
window.Puzzle = (function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const G = () => window.Game;
  const CAP = 4;

  const FLAVORS = [
    { name: 'Strawberry', c1: '#ff7a99', c2: '#e04a6f', sym: '♥' },
    { name: 'Pumpkin', c1: '#ffb35c', c2: '#e57f22', sym: '●' },
    { name: 'Banana', c1: '#ffe27a', c2: '#e8b928', sym: '★' },
    { name: 'Mint', c1: '#7fe0b4', c2: '#36a978', sym: '♣' },
    { name: 'Blueberry', c1: '#86aaff', c2: '#4a6fd9', sym: '◆' },
    { name: 'Grape', c1: '#c49bf2', c2: '#8a5bc9', sym: '✿' },
    { name: 'Peanut', c1: '#c99467', c2: '#8e5c38', sym: '■' },
    { name: 'Coconut', c1: '#ffffff', c2: '#c9c3d6', sym: '▲' },
  ];

  const ABILITIES = [
    { lvl: 3, id: 'groomer', name: 'Speedy Groomer', desc: 'Brushing Simba takes half the time and leaves his coat extra shiny.', icon: '🪮' },
    { lvl: 6, id: 'treats', name: 'Treat Whisperer', desc: 'Treats make Simba happier and never add weight.', icon: '🦴' },
    { lvl: 9, id: 'quickwalk', name: 'Brisk Walker', desc: 'Walks, park trips and walks with Mia take less time.', icon: '👟' },
    { lvl: 12, id: 'morning', name: 'Morning Person', desc: 'Nena wakes up with +15 energy every day.', icon: '🌅' },
    { lvl: 15, id: 'furshield', name: 'Silky Coat', desc: 'Simba’s coat stays tidy 40% longer.', icon: '✨' },
    { lvl: 18, id: 'sniffer', name: 'Super Sniffer', desc: 'Simba sometimes sniffs out coins on walks.', icon: '👃' },
    { lvl: 21, id: 'zen', name: 'Zen Home', desc: 'Fur and mess pile up 30% slower.', icon: '🧘' },
    { lvl: 24, id: 'bestie', name: 'Best Buddies', desc: 'Simba’s joy drops 25% slower.', icon: '💞' },
    { lvl: 27, id: 'chef', name: 'Batch Cook', desc: 'Groceries give 2 extra meals.', icon: '🍲' },
    { lvl: 30, id: 'master', name: 'Trick Master', desc: 'Training sessions teach 50% faster.', icon: '🎓' },
  ];

  /* ------------------------------------------------------------------ */
  /* Level generation (seeded, always solvable)                          */
  /* ------------------------------------------------------------------ */
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function config(lvl) {
    const colors = Math.min(FLAVORS.length, 2 + Math.floor((lvl + 1) / 3));
    const empties = lvl <= 2 ? 1 : 2;
    const hidden = lvl >= 12 ? Math.min(0.45, 0.2 + (lvl - 12) * 0.015) : 0;
    return { colors, empties, hidden };
  }
  const isDone = (jars) => jars.every((j) => j.length === 0 || (j.length === CAP && j.every((x) => x === j[0])));
  function topRun(j) {
    if (!j.length) return 0;
    let n = 1; const c = j[j.length - 1];
    for (let i = j.length - 2; i >= 0 && j[i] === c; i--) n++;
    return n;
  }
  function canPour(jars, a, b) {
    if (a === b) return false;
    const A = jars[a], B = jars[b];
    if (!A.length || B.length >= CAP) return false;
    if (B.length && B[B.length - 1] !== A[A.length - 1]) return false;
    return true;
  }
  function pour(jars, a, b) {
    const n = Math.min(topRun(jars[a]), CAP - jars[b].length);
    for (let i = 0; i < n; i++) jars[b].push(jars[a].pop());
    return n;
  }
  function solvable(start) {
    const seen = new Set();
    let nodes = 0;
    const key = (js) => js.map((j) => j.join('')).sort().join('|');
    function dfs(js) {
      if (isDone(js)) return true;
      if (++nodes > 60000) return false;
      const k = key(js);
      if (seen.has(k)) return false;
      seen.add(k);
      for (let a = 0; a < js.length; a++) {
        const A = js[a];
        if (!A.length) continue;
        const uniform = topRun(A) === A.length;
        if (uniform && A.length === CAP) continue;
        for (let b = 0; b < js.length; b++) {
          if (!canPour(js, a, b)) continue;
          if (uniform && !js[b].length) continue; // pointless move
          const next = js.map((j) => j.slice());
          pour(next, a, b);
          if (dfs(next)) return true;
        }
      }
      return false;
    }
    return dfs(start.map((j) => j.slice()));
  }
  function generate(lvl) {
    const cfg = config(lvl);
    for (let attempt = 0; attempt < 60; attempt++) {
      const r = rng(lvl * 7919 + attempt * 104729);
      const pool = [];
      for (let c = 0; c < cfg.colors; c++) for (let k = 0; k < CAP; k++) pool.push(c);
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      const jars = [];
      for (let c = 0; c < cfg.colors; c++) jars.push(pool.slice(c * CAP, c * CAP + CAP));
      if (isDone(jars)) continue;
      if (jars.some((j) => j.every((x) => x === j[0]))) continue;
      for (let e = 0; e < cfg.empties; e++) jars.push([]);
      if (!solvable(jars)) continue;
      // hidden treats: covered until they reach the top
      const hidden = jars.map((j) => j.map((_, i) => i < j.length - 1 && r() < cfg.hidden));
      return { jars, hidden };
    }
    // fallback: easier layout with an extra empty jar
    const jars = []; for (let c = 0; c < cfg.colors; c++) jars.push([]);
    let c = 0; for (let k = 0; k < cfg.colors * CAP; k++) { jars[k % cfg.colors].push(c); if ((k + 1) % cfg.colors === 0) c++; }
    jars.push([], [], []);
    return { jars, hidden: jars.map((j) => j.map(() => false)) };
  }

  /* ------------------------------------------------------------------ */
  /* State                                                               */
  /* ------------------------------------------------------------------ */
  let open = false, view = 'map';
  let cur = null; // { lvl, jars, hidden, sel, history, undos, extra, moves }

  const P = () => G().S.puzzle;
  const abilityAt = (lvl) => ABILITIES.find((a) => a.lvl === lvl);

  function show() {
    open = true; view = 'map';
    $('pz').hidden = false;
    renderMap();
    G().snd('tab');
    setTimeout(() => { const n = document.querySelector('.pz-node.current'); if (n) n.scrollIntoView({ block: 'center' }); }, 60);
  }
  function hide() {
    open = false; cur = null;
    $('pz').hidden = true;
    G().after();
  }

  /* ------------------------------------------------------------------ */
  /* Map                                                                 */
  /* ------------------------------------------------------------------ */
  function renderMap() {
    view = 'map';
    $('pz-map').hidden = false; $('pz-level').hidden = true;
    const p = P();
    const last = Math.max(p.level + 6, 12);
    const unlocked = p.perks.length;
    $('pz-title').textContent = 'Paw Path';
    $('pz-sub').textContent = `Level ${p.level} · ${unlocked}/${ABILITIES.length} abilities`;
    let html = '';
    for (let l = last; l >= 1; l--) {
      const ab = abilityAt(l);
      const done = l < p.level, curr = l === p.level, locked = l > p.level;
      const st = p.stars[l] || 0;
      const x = 50 + Math.sin(l * 0.9) * 28;
      html += `<div class="pz-row" style="--x:${x}%">
        ${ab ? `<div class="pz-ability${p.perks.includes(ab.id) ? ' got' : ''}" style="--x:${x}%"><span>${ab.icon}</span><b>${ab.name}</b></div>` : ''}
        <button type="button" class="pz-node${done ? ' done' : ''}${curr ? ' current' : ''}${locked ? ' locked' : ''}${ab ? ' milestone' : ''}" data-lvl="${l}" ${locked ? 'disabled' : ''} aria-label="Level ${l}">
          <span class="pz-num">${l}</span>
          ${done ? `<span class="pz-stars">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span>` : ''}
          ${curr ? '<span class="pz-paw">🐾</span>' : ''}
        </button></div>`;
    }
    $('pz-path').innerHTML = html;
    $('pz-abilities').innerHTML = ABILITIES.map((a) => {
      const got = p.perks.includes(a.id);
      return `<div class="pz-ab${got ? ' got' : ''}"><span class="pz-ab-ico">${got ? a.icon : '🔒'}</span><div><b>${a.name}</b><small>${got ? a.desc : `Unlocks at level ${a.lvl}`}</small></div></div>`;
    }).join('');
  }

  /* ------------------------------------------------------------------ */
  /* Level                                                               */
  /* ------------------------------------------------------------------ */
  function startLevel(lvl) {
    const g = generate(lvl);
    cur = { lvl, jars: g.jars, hidden: g.hidden, sel: -1, history: [], undos: 3, extra: false, used: 0, moves: 0 };
    view = 'level';
    $('pz-map').hidden = true; $('pz-level').hidden = false; $('pz-win').hidden = true;
    $('pz-title').textContent = 'Level ' + lvl;
    const ab = abilityAt(lvl);
    $('pz-sub').textContent = ab ? `Reward: ${ab.icon} ${ab.name}` : `Sort the treats: one flavor per jar`;
    renderLevel();
    G().snd('pop');
  }
  function treatHtml(c, hidden, cls) {
    if (hidden) return `<span class="treat hidden ${cls || ''}"><i>?</i></span>`;
    const f = FLAVORS[c];
    return `<span class="treat ${cls || ''}" style="--c1:${f.c1};--c2:${f.c2}"><i>${f.sym}</i></span>`;
  }
  function renderLevel(fx) {
    const jars = cur.jars;
    const cols = jars.length <= 5 ? jars.length : Math.ceil(jars.length / 2);
    $('pz-jars').style.gridTemplateColumns = `repeat(${cols}, minmax(0, 64px))`;
    $('pz-jars').innerHTML = jars.map((j, i) => {
      const full = j.length === CAP && j.every((x) => x === j[0]);
      const sel = cur.sel === i;
      const run = sel ? topRun(j) : 0;
      const items = j.map((c, k) => {
        const lifted = sel && k >= j.length - run;
        const isNew = fx && fx.to === i && k >= j.length - fx.n;
        return treatHtml(c, cur.hidden[i][k], (lifted ? 'lift' : '') + (isNew ? ' drop' : ''));
      }).join('');
      return `<button type="button" class="jar${sel ? ' sel' : ''}${full ? ' full' : ''}" data-jar="${i}" aria-label="Jar ${i + 1}">
        <span class="jar-lid"></span><span class="jar-body">${items}</span>${full ? '<span class="jar-done">✓</span>' : ''}</button>`;
    }).join('');
    $('pz-undo').textContent = `Undo (${cur.undos})`;
    $('pz-undo').disabled = !cur.history.length || cur.undos <= 0;
    $('pz-extra').disabled = cur.extra;
  }
  function reveal() {
    cur.jars.forEach((j, i) => { if (j.length) cur.hidden[i][j.length - 1] = false; });
  }
  function tapJar(i) {
    if (!cur || !$('pz-win').hidden) return;
    const jars = cur.jars;
    if (cur.sel < 0) {
      if (!jars[i].length) return;
      if (cur.hidden[i][jars[i].length - 1]) return;
      cur.sel = i; G().snd('click');
      try { navigator.vibrate && navigator.vibrate(6); } catch (e) { /* */ }
      renderLevel(); return;
    }
    const a = cur.sel;
    if (a === i) { cur.sel = -1; renderLevel(); return; }
    if (!canPour(jars, a, i)) {
      if (jars[i].length) { cur.sel = jars[i].length && !cur.hidden[i][jars[i].length - 1] ? i : -1; }
      G().snd('fail');
      renderLevel(); return;
    }
    cur.history.push({ jars: jars.map((j) => j.slice()), hidden: cur.hidden.map((h) => h.slice()) });
    const n = Math.min(topRun(jars[a]), CAP - jars[i].length);
    pour(jars, a, i);
    // keep hidden flags aligned
    cur.hidden[a] = cur.hidden[a].slice(0, jars[a].length);
    while (cur.hidden[i].length < jars[i].length) cur.hidden[i].push(false);
    reveal();
    cur.sel = -1; cur.moves++;
    G().snd('pop');
    const full = jars[i].length === CAP && jars[i].every((x) => x === jars[i][0]);
    if (full) { setTimeout(() => G().snd('success'), 120); }
    renderLevel({ to: i, n });
    if (isDone(jars)) setTimeout(win, 450);
  }
  function undo() {
    if (!cur || !cur.history.length || cur.undos <= 0) return;
    const h = cur.history.pop();
    cur.jars = h.jars; cur.hidden = h.hidden; cur.undos--; cur.used++; cur.sel = -1;
    G().snd('swoosh'); renderLevel();
  }
  function extraJar() {
    if (!cur || cur.extra) return;
    cur.extra = true; cur.used++;
    cur.jars.push([]); cur.hidden.push([]);
    G().snd('coin'); renderLevel();
  }
  function restart() { if (cur) startLevel(cur.lvl); }

  function win() {
    const p = P();
    const stars = cur.used === 0 ? 3 : cur.used === 1 ? 2 : 1;
    const lvl = cur.lvl;
    const first = lvl === p.level;
    p.stars[lvl] = Math.max(p.stars[lvl] || 0, stars);
    let reward = first ? 4 + Math.floor(lvl / 2) + stars : 0;
    const ab = abilityAt(lvl);
    let unlocked = null;
    if (first) {
      p.level = lvl + 1;
      if (ab && !p.perks.includes(ab.id)) { p.perks.push(ab.id); unlocked = ab; }
    }
    if (reward) G().money(reward);
    $('pz-win-stars').innerHTML = [0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}">★</span>`).join('');
    $('pz-win-t').textContent = stars === 3 ? 'Purr-fect!' : stars === 2 ? 'Well sorted!' : 'Sorted!';
    $('pz-win-reward').textContent = reward ? `+$${reward}` : 'Replay complete';
    const ua = $('pz-win-ability');
    if (unlocked) { ua.hidden = false; ua.innerHTML = `<span>${unlocked.icon}</span><div><small>New ability unlocked</small><b>${unlocked.name}</b><em>${unlocked.desc}</em></div>`; }
    else ua.hidden = true;
    $('pz-win').hidden = false;
    G().snd(unlocked ? 'fanfare' : 'success');
    confetti();
    if (unlocked) G().memory('ability_' + unlocked.id, 'Ability: ' + unlocked.name, unlocked.desc, unlocked.icon);
    G().save();
  }
  function confetti() {
    const box = $('pz-confetti');
    box.innerHTML = '';
    for (let i = 0; i < 40; i++) {
      const s = document.createElement('i');
      const f = FLAVORS[i % FLAVORS.length];
      s.style.left = Math.random() * 100 + '%';
      s.style.background = f.c1;
      s.style.animationDelay = (Math.random() * 0.4) + 's';
      s.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      box.appendChild(s);
    }
    setTimeout(() => { box.innerHTML = ''; }, 2600);
  }

  function bind() {
    $('pz-close').addEventListener('click', () => { if (view === 'level') renderMap(); else hide(); });
    $('pz-path').addEventListener('click', (e) => { const b = e.target.closest('[data-lvl]'); if (b && !b.disabled) startLevel(+b.dataset.lvl); });
    $('pz-jars').addEventListener('click', (e) => { const b = e.target.closest('[data-jar]'); if (b) tapJar(+b.dataset.jar); });
    $('pz-undo').addEventListener('click', undo);
    $('pz-extra').addEventListener('click', extraJar);
    $('pz-restart').addEventListener('click', restart);
    $('pz-next').addEventListener('click', () => { startLevel(P().level); });
    $('pz-tomap').addEventListener('click', () => { renderMap(); setTimeout(() => { const n = document.querySelector('.pz-node.current'); if (n) n.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();

  return { show, hide, get open() { return open; }, ABILITIES, generate, solvable };
})();
