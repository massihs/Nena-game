/* Nena & Simba — daily Color Sort puzzle (pour the sherbet until every glass holds one colour).
   Puzzles are generated from the date, so everyone gets the same three each day, and are always solvable. */
(function () {
  'use strict';
  const CAP = 4;
  const COLORS = ['#e2433a', '#3b7dd8', '#3fa34d', '#f2c230', '#8e4fc2', '#f08a24', '#ef6fa3', '#1fb5a8', '#6b4632'];
  const LEVELS = [
    { name: 'Easy', colors: 3, empty: 2, reward: 20 },
    { name: 'Medium', colors: 5, empty: 2, reward: 35 },
    { name: 'A bit hard', colors: 7, empty: 2, reward: 60 },
  ];

  function rng(seed) { let s = (seed >>> 0) || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }
  const top = (t) => t[t.length - 1];
  const solved = (tubes) => tubes.every((t) => t.length === 0 || (t.length === CAP && t.every((c) => c === t[0])));
  function canPour(a, b) { return a.length > 0 && b.length < CAP && (b.length === 0 || top(b) === top(a)); }
  function pour(tubes, i, j) {
    const a = tubes[i], b = tubes[j], c = top(a);
    let n = 0;
    while (a.length && top(a) === c && b.length < CAP) { b.push(a.pop()); n++; }
    return n;
  }
  // depth-first solver with memo, used to make sure a generated puzzle can be solved
  function solvable(start, limit) {
    const seen = new Set(); let nodes = 0;
    const key = (ts) => ts.map((t) => t.join('')).sort().join('|');
    function dfs(ts) {
      if (solved(ts)) return true;
      if (++nodes > limit) return false;
      const k = key(ts); if (seen.has(k)) return false; seen.add(k);
      for (let i = 0; i < ts.length; i++) for (let j = 0; j < ts.length; j++) {
        if (i === j || !canPour(ts[i], ts[j])) continue;
        const a = ts[i];
        if (a.every((c) => c === a[0]) && ts[j].length === 0) continue;  // pointless move
        const next = ts.map((t) => t.slice()); pour(next, i, j);
        if (dfs(next)) return true;
      }
      return false;
    }
    return dfs(start.map((t) => t.slice()));
  }
  function generate(seed, lv) {
    const L = LEVELS[lv];
    for (let attempt = 0; attempt < 60; attempt++) {
      const r = rng(seed * 7 + attempt * 101 + lv * 13);
      const units = [];
      for (let c = 0; c < L.colors; c++) for (let k = 0; k < CAP; k++) units.push(c);
      for (let i = units.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [units[i], units[j]] = [units[j], units[i]]; }
      const tubes = [];
      for (let c = 0; c < L.colors; c++) tubes.push(units.slice(c * CAP, c * CAP + CAP));
      for (let e = 0; e < L.empty; e++) tubes.push([]);
      if (solved(tubes) || tubes.some((t) => t.length && t.every((x) => x === t[0]))) continue;
      if (solvable(tubes, 120000)) return tubes;
    }
    // fallback: an easy, obviously solvable layout
    const t = []; for (let c = 0; c < L.colors; c++) t.push([c, c, c, (c + 1) % L.colors]);
    t[L.colors - 1][3] = 0; for (let e = 0; e < L.empty; e++) t.push([]);
    return t;
  }

  /* ---- UI ---- */
  let S = null;
  function start(opts) {
    const tubes = generate(opts.seed, opts.level);
    S = { tubes, initial: tubes.map((t) => t.slice()), sel: -1, moves: 0, hist: [], opts, done: false };
    render();
  }
  function render() {
    const box = opts().box;
    box.innerHTML = S.tubes.map((t, i) => `<button type="button" class="glass${S.sel === i ? ' sel' : ''}${t.length === CAP && t.every((c) => c === t[0]) ? ' full' : ''}" data-i="${i}" aria-label="Glass ${i + 1}">
      <span class="liquid">${t.map((c) => `<i style="background:${COLORS[c]}"></i>`).join('')}</span></button>`).join('');
    opts().onMoves(S.moves);
  }
  const opts = () => S.opts;
  function tap(i) {
    if (!S || S.done) return;
    if (S.sel < 0) { if (S.tubes[i].length) { S.sel = i; opts().sound('click'); } render(); return; }
    if (S.sel === i) { S.sel = -1; render(); return; }
    const a = S.sel;
    if (canPour(S.tubes[a], S.tubes[i])) {
      S.hist.push(S.tubes.map((t) => t.slice()));
      pour(S.tubes, a, i); S.moves++; S.sel = -1; opts().sound('water');
      render();
      const g = opts().box.children[i]; if (g) { g.classList.add('pour'); setTimeout(() => g.classList.remove('pour'), 300); }
      if (solved(S.tubes)) { S.done = true; setTimeout(() => opts().onWin(S.moves), 450); }
    } else {
      opts().sound('fail');
      S.sel = S.tubes[i].length ? i : -1; render();
    }
  }
  function undo() { if (!S || S.done || !S.hist.length) return; S.tubes = S.hist.pop(); S.moves++; S.sel = -1; render(); }
  function restart() { if (!S || S.done) return; S.tubes = S.initial.map((t) => t.slice()); S.hist = []; S.moves = 0; S.sel = -1; render(); }

  window.ColorSort = { LEVELS, start, tap, undo, restart };
})();
