/* Nena & Simba — Busy Days.
   A time-management game: every level is a day in the family apartment in Tehran.
   Requests pop up in real time; tap to send Nena, carry items, chain combos, keep the family happy. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const A = window.Art;
  const snd = (n, a) => { if (save.sound !== false && window.Sound) window.Sound.play(n, a); };
  const buzz = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* */ } };
  const rnd = Math.random;
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ------------------------------------------------------------------ */
  /* Save                                                                */
  /* ------------------------------------------------------------------ */
  const KEY = 'nena-simba-rush-v1';
  let save = { level: 1, stars: {}, best: {}, coins: 0, up: {}, sound: true, music: true, seen: {} };
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.level) save = Object.assign(save, d); } catch (e) { /* */ }
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* */ } };
  const up = (k) => save.up[k] || 0;

  /* ------------------------------------------------------------------ */
  /* Stage layout (logical 600×800, portrait)                            */
  /* ------------------------------------------------------------------ */
  const STATIONS = {
    sink:    { x: 40,  y: 300, r: 38, stand: [70, 420],  label: 'Sink' },
    samovar: { x: 168, y: 292, r: 36, stand: [168, 420], label: 'Samovar' },
    kibble:  { x: 238, y: 300, r: 34, stand: [238, 420], label: 'Kibble' },
    negin:   { x: 340, y: 270, r: 46, stand: [340, 410], label: 'Negin’s door' },
    toy:     { x: 452, y: 520, r: 34, stand: [430, 575], label: 'Toy basket' },
    laptop:  { x: 540, y: 470, r: 36, stand: [520, 560], label: 'Laptop' },
    bowl:    { x: 92,  y: 702, r: 34, stand: [130, 690], label: 'Food bowl' },
    water:   { x: 176, y: 708, r: 34, stand: [200, 690], label: 'Water bowl' },
    brush:   { x: 528, y: 690, r: 34, stand: [500, 700], label: 'Brush' },
  };
  const HOME = { nena: [300, 640], simba: [330, 585], baba: [205, 530], fariba: [100, 430], nasim: [548, 425], negin: [340, 400] };
  const DOOR = [548, 420];
  const FUR_ZONE = { x0: 270, x1: 560, y0: 600, y1: 780 };

  /* request catalogue */
  const REQ = {
    food:   { who: 'simba', icon: '🍖', pts: 100, pat: 24, hint: 'Tap the kibble, then Simba’s bowl.' },
    water:  { who: 'simba', icon: '💧', pts: 80, pat: 22, hint: 'Tap the water bowl to refill it.' },
    walk:   { who: 'simba', icon: '🦮', pts: 150, pat: 26, hint: 'Tap Simba to take him for a walk.' },
    brush:  { who: 'simba', icon: '🪮', pts: 120, pat: 26, hint: 'Grab the brush, then tap Simba.' },
    play:   { who: 'simba', icon: '🎾', pts: 110, pat: 24, hint: 'Grab the ball from the basket, then tap Simba.' },
    tea:    { who: 'baba', icon: '☕', pts: 120, pat: 26, hint: 'Tap the samovar, then bring the tea to Baba.' },
    help:   { who: 'fariba', icon: '🍲', pts: 150, pat: 26, hint: 'Tap Maman to help her cook.' },
    talk:   { who: 'nasim', icon: '💬', pts: 130, pat: 18, hint: 'Nasim is back and angry: tap her to talk.' },
    wake:   { who: 'negin', icon: '⏰', pts: 140, pat: 24, hint: 'Negin overslept: tap her door.' },
  };
  const ITEMS = { food: '🥣', tea: '🍵', brush: '🪮', ball: '🎾' };

  /* ------------------------------------------------------------------ */
  /* Levels                                                              */
  /* ------------------------------------------------------------------ */
  const L = (n, title, day, dur, types, targets, every, extra) => Object.assign({ n, title, day, dur, types, targets, every }, extra || {});
  const LEVELS = [
    L(1, 'First morning', 'Saturday', 60, ['food', 'water'], [300, 500, 700], [6, 9], { story: [['simba', 'happy', 'Woof! (Breakfast. Now. Please.)'], ['nena', 'happy', 'Okay Simba! Kibble first, then fresh water.']] }),
    L(2, 'Walkies!', 'Sunday', 70, ['food', 'water', 'walk'], [450, 750, 1000], [6, 8.5], { story: [['nena', 'neutral', 'Negin was supposed to walk him… she’s still asleep.'], ['simba', 'happy', '*brings the leash*']] }),
    L(3, 'Tea for Baba', 'Monday', 75, ['food', 'water', 'walk', 'tea'], [700, 1100, 1450], [5.5, 8], { laptop: true, story: [['mohsen', 'happy', 'Nena jan, is there tea? A father needs his tea!'], ['nena', 'happy', 'Coming, Baba! And I have work on my laptop too…']] }),
    L(4, 'Fluffy trouble', 'Tuesday', 80, ['food', 'water', 'walk', 'tea', 'brush'], [900, 1350, 1750], [5.5, 7.5], { laptop: true, fur: 9, story: [['nena', 'surprised', 'Orange fur EVERYWHERE. Simba, you’re shedding again!'], ['simba', 'happy', '*shakes proudly*']] }),
    L(5, 'Maman’s kitchen', 'Wednesday', 85, ['food', 'water', 'walk', 'tea', 'brush', 'help'], [1100, 1600, 2100], [5, 7], { laptop: true, fur: 9, story: [['fariba', 'happy', 'Nena jan, help me with the ghormeh sabzi? And then the dishes, please!']] }),
    L(6, 'Nasim is home', 'Thursday', 90, ['food', 'water', 'walk', 'tea', 'brush', 'help', 'talk'], [1300, 1900, 2500], [4.8, 6.8], { laptop: true, fur: 8, story: [['nasim', 'angry', 'DON’T talk to me. …Okay, maybe talk to me. Later.'], ['mohsen', 'neutral', 'Nena, go see your sister before she explodes.']] }),
    L(7, 'Play time', 'Friday', 90, ['food', 'water', 'walk', 'tea', 'brush', 'help', 'talk', 'play'], [1500, 2200, 2800], [4.6, 6.5], { laptop: true, fur: 8, story: [['simba', 'happy', '*drops the ball on your foot. Again.*'], ['nena', 'happy', 'Friday means play time!']] }),
    L(8, 'Wake up, Negin!', 'Saturday', 95, ['food', 'water', 'walk', 'tea', 'help', 'talk', 'play', 'wake'], [1700, 2400, 3100], [4.4, 6.2], { laptop: true, fur: 8, story: [['negin', 'sleepy', '…zzz… five more minutes… zzz…'], ['fariba', 'neutral', 'Nena, wake your sister, she has class!']] }),
    L(9, 'Busy Friday', 'Friday', 100, ['food', 'water', 'walk', 'tea', 'brush', 'help', 'talk', 'play', 'wake'], [1900, 2700, 3500], [4.2, 6], { laptop: true, fur: 7, story: [['mohsen', 'happy', 'The whole family is home today! Tea for everyone!']] }),
    L(10, 'Rainy day', 'Sunday', 100, ['food', 'water', 'walk', 'tea', 'brush', 'help', 'talk', 'play'], [2000, 2900, 3700], [4.1, 5.8], { laptop: true, fur: 5, rain: true, story: [['nena', 'neutral', 'Rain… muddy paws, wet fur, more mess. Let’s go!']] }),
    L(11, 'Party prep', 'Wednesday', 105, ['food', 'water', 'walk', 'tea', 'brush', 'help', 'talk', 'play', 'wake'], [2200, 3100, 4000], [3.9, 5.5], { laptop: true, fur: 7, patience: 0.92, story: [['fariba', 'surprised', 'Simba’s birthday is tomorrow and nothing is ready!']] }),
    L(12, 'Simba’s birthday', 'Thursday', 110, ['food', 'water', 'walk', 'tea', 'brush', 'help', 'talk', 'play', 'wake'], [2400, 3400, 4400], [3.8, 5.3], { laptop: true, fur: 6, patience: 0.9, story: [['mohsen', 'happy', 'Happy birthday, my lion!'], ['nasim', 'neutral', 'I made the decorations. Don’t say anything.']] }),
  ];
  function levelCfg(n) {
    if (n <= LEVELS.length) return LEVELS[n - 1];
    const k = n - LEVELS.length;
    const base = LEVELS[LEVELS.length - 1];
    return Object.assign({}, base, {
      n, title: 'Another busy day', day: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][(n - 1) % 7],
      dur: 110, targets: base.targets.map((t) => Math.round(t * (1 + k * 0.06))), every: [Math.max(2.8, 3.8 - k * 0.08), Math.max(4, 5.3 - k * 0.1)],
      patience: Math.max(0.65, 0.9 - k * 0.02), rain: n % 4 === 0, story: [[pick(['mohsen', 'fariba', 'nasim', 'nena']), 'happy', pick(['Another day in the tower!', 'Simba, behave today, okay?', 'Who wants tea?', 'Yallah, let’s go!'])]],
    });
  }

  /* ------------------------------------------------------------------ */
  /* Upgrades                                                            */
  /* ------------------------------------------------------------------ */
  const UPGRADES = [
    { id: 'shoes', name: 'Sneakers', desc: 'Nena walks 20% faster per level.', icon: '👟', costs: [60, 130, 220] },
    { id: 'tray', name: 'Serving tray', desc: 'Carry 2 items at once.', icon: '🍽️', costs: [150] },
    { id: 'samovar', name: 'Big samovar', desc: 'Tea brews 40% faster.', icon: '🫖', costs: [90] },
    { id: 'treats', name: 'Treat jar', desc: 'Simba waits 20% longer before getting upset.', icon: '🦴', costs: [80] },
    { id: 'fountain', name: 'Water fountain', desc: 'Simba gets thirsty less often.', icon: '⛲', costs: [100] },
    { id: 'robot', name: 'Robot vacuum', desc: 'Cleans a fur pile every 8 seconds.', icon: '🤖', costs: [160] },
    { id: 'decor', name: 'Cozy decor', desc: 'Family waits 15% longer, +1 heart.', icon: '🪴', costs: [120] },
  ];

  /* ------------------------------------------------------------------ */
  /* Background art (logical 600×800)                                    */
  /* ------------------------------------------------------------------ */
  function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function skyline(night, rain) {
    let o = `<rect width="400" height="300" fill="url(#rsky)"/>`;
    if (night) for (let i = 0; i < 26; i++) o += `<circle cx="${hash(i) * 400}" cy="${hash(i + 9) * 90}" r="1" fill="#fff" opacity=".8"/>`;
    else o += '<g fill="#fff" opacity=".85"><ellipse cx="90" cy="50" rx="44" ry="10"/><ellipse cx="300" cy="70" rx="36" ry="8"/></g>';
    let ridge = 'M0 300 L0 160 ';
    for (let x = 0; x <= 400; x += 10) ridge += `L${x} ${(170 - (40 + Math.sin(x * 0.03) * 22 + Math.sin(x * 0.09 + 1) * 8)).toFixed(1)} `;
    o += `<path d="${ridge} L400 300Z" fill="${night ? '#24264a' : '#8e9ab6'}"/>`;
    for (let x = 20; x < 400; x += 46) { const hgt = 40 + Math.sin(x * 0.03) * 22 + Math.sin(x * 0.09 + 1) * 8; if (hgt > 50) o += `<path d="M${x - 9} ${170 - hgt + 10} L${x} ${170 - hgt} L${x + 10} ${170 - hgt + 9}Z" fill="#fff" opacity="${night ? 0.5 : 0.95}"/>`; }
    o += `<g fill="${night ? '#1b1c34' : '#6f7c96'}"><rect x="296" y="64" width="5" height="130"/><ellipse cx="298.5" cy="90" rx="16" ry="7"/><rect x="297" y="34" width="2" height="32"/></g>`;
    let x = -6, i = 0;
    while (x < 406) {
      const bw = 18 + hash(i) * 30, bh = 30 + hash(i + 3) * 70;
      o += `<rect x="${x}" y="${250 - bh}" width="${bw}" height="${bh + 60}" fill="${night ? (i % 2 ? '#22224a' : '#1c1c3a') : (i % 2 ? '#c2ccd9' : '#b0bdcd')}"/>`;
      for (let wy = 256 - bh; wy < 290; wy += 9) for (let wx = x + 4; wx < x + bw - 4; wx += 7) if (hash(wx * 2.1 + wy) < 0.4) o += `<rect x="${wx.toFixed(0)}" y="${wy}" width="3" height="4" fill="${night ? '#ffcf73' : '#fff'}" opacity="${night ? 1 : 0.45}"/>`;
      x += bw + 3; i++;
    }
    if (rain) { o += '<rect width="400" height="300" fill="#7a8696" opacity=".3"/>'; for (let k = 0; k < 50; k++) o += `<path d="M${hash(k) * 400} ${hash(k + 2) * 300} l-4 12" stroke="#e6eef7" stroke-width="1.4" opacity=".7"/>`; }
    return o;
  }
  function stageArt(cfg) {
    const night = cfg.n % 3 === 0, rain = !!cfg.rain;
    const sky = night ? ['#151838', '#3a3466'] : rain ? ['#8b97a8', '#c3cbd6'] : cfg.n % 3 === 2 ? ['#f2a07a', '#fde3c3'] : ['#8fcbee', '#d7eefa'];
    const view = skyline(night, rain);
    const win = (x, y, w, h, ox) => `<rect x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${h + 10}" fill="#1e1d22"/><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${ox} 0 ${(w * 300) / h} 300" preserveAspectRatio="none">${view}</svg><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#rglass)"/><rect x="${x + w / 2 - 2}" y="${y}" width="4" height="${h}" fill="#1e1d22"/>`;
    let floor = '';
    for (let yy = 380; yy < 800; yy += 34) floor += `<path d="M0 ${yy} H600" stroke="rgba(110,70,35,.13)" stroke-width="1.4"/>`;
    for (let r = 0; r < 13; r++) for (let xx = (r * 97) % 180; xx < 600; xx += 180) floor += `<path d="M${xx} ${380 + r * 34} v34" stroke="rgba(110,70,35,.11)" stroke-width="1.4"/>`;
    return `<svg viewBox="0 0 600 800" class="stage-bg" aria-hidden="true">
      <defs><linearGradient id="rsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>
        <linearGradient id="rglass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient>
        <radialGradient id="rglow"><stop offset="0" stop-color="#ffd98a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
        <linearGradient id="rwall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6efe6"/><stop offset="1" stop-color="#ebe1d4"/></linearGradient></defs>
      <rect width="600" height="380" fill="url(#rwall)"/>
      <rect width="600" height="14" fill="#f9f5ef"/><rect y="14" width="600" height="3" fill="#ffe2b0"/>
      ${win(400, 40, 190, 230, 200)}
      ${win(276, 40, 110, 120, 140)}
      <rect x="0" y="376" width="600" height="424" fill="#d4ad82"/>${floor}
      <rect x="0" y="372" width="600" height="6" fill="#efe6d8"/>
      <!-- kitchen -->
      ${[0, 1, 2].map((i) => `<rect x="${8 + i * 88}" y="60" width="84" height="110" rx="3" fill="#2f4a3e"/><rect x="${14 + i * 88}" y="156" width="72" height="3" fill="#c9a24a"/>`).join('')}
      <rect x="0" y="178" width="276" height="96" fill="#f1ede7"/>
      <rect x="0" y="274" width="276" height="10" fill="#f8f5f0"/>
      <rect x="0" y="284" width="276" height="92" fill="#2f4a3e"/>${[0, 1, 2].map((i) => `<rect x="${10 + i * 92}" y="296" width="76" height="3" fill="#c9a24a"/>`).join('')}
      <rect x="18" y="262" width="46" height="12" rx="4" fill="#cfd5d9"/><path d="M44 262 v-16 q0 -6 8 -6 h6" stroke="#c9a24a" stroke-width="3" fill="none"/>
      <rect x="84" y="268" width="50" height="6" fill="#222"/><ellipse cx="109" cy="258" rx="20" ry="10" fill="#e05b7b"/><rect x="89" y="250" width="40" height="12" rx="3" fill="#e05b7b"/>
      <g><ellipse cx="168" cy="276" rx="22" ry="4" fill="rgba(0,0,0,.15)"/><path d="M152 274 q-4 -28 6 -40 h20 q10 12 6 40z" fill="#d9b866"/><path d="M160 234 q8 -8 16 0" fill="#c9a24a"/><path d="M161 226 h14 l-2 10 h-10z" fill="#e05b7b"/><path d="M152 244 q-2 18 4 26" stroke="#fff6cc" stroke-width="3" fill="none" opacity=".7"/></g>
      <g><path d="M222 274 l4 -40 h28 l4 40z" fill="#c9a27a"/><path d="M226 240 h28" stroke="#9a6232" stroke-width="3"/><text x="240" y="262" text-anchor="middle" font-size="11" font-family="Baloo 2, sans-serif" font-weight="800" fill="#7a4a22">KIBBLE</text></g>
      <!-- Negin's door -->
      <rect x="296" y="180" width="88" height="196" fill="#e2d6c4"/><rect x="300" y="184" width="80" height="192" fill="#a9c2d4"/><rect x="368" y="270" width="4" height="34" rx="2" fill="#c9a24a"/>
      <rect x="308" y="198" width="64" height="36" rx="5" fill="#fff8ee"/><text x="340" y="214" text-anchor="middle" font-size="10" font-family="Baloo 2, sans-serif" font-weight="800" fill="#4a5a8a">NEGIN</text><text x="340" y="228" text-anchor="middle" font-size="8" font-family="Nunito, sans-serif" font-weight="800" fill="#4a5a8a">DO NOT WAKE</text>
      <!-- front door -->
      <rect x="496" y="276" width="104" height="100" fill="#e2d6c4"/><rect x="502" y="282" width="98" height="94" fill="#5a3a26"/><rect x="590" y="324" width="4" height="22" rx="2" fill="#c9a24a"/>
      <!-- sofa, rug -->
      <polygon points="150,560 470,560 520,660 100,660" fill="#8c1f30"/><polygon points="164,568 456,568 500,652 116,652" fill="none" stroke="#1f2a5a" stroke-width="6"/><ellipse cx="310" cy="610" rx="70" ry="20" fill="#f0d9a8"/><ellipse cx="310" cy="610" rx="44" ry="12" fill="#1f2a5a"/>
      <rect x="20" y="440" width="230" height="90" rx="26" fill="#efe6da"/><rect x="32" y="410" width="206" height="60" rx="24" fill="#f4ece2"/><rect x="10" y="452" width="34" height="80" rx="16" fill="#e6dccf"/><rect x="226" y="452" width="34" height="80" rx="16" fill="#e6dccf"/>
      <rect x="54" y="424" width="50" height="40" rx="12" fill="#c9785a"/><rect x="150" y="426" width="48" height="38" rx="12" fill="#2f4a3e"/>
      <!-- Simba's bed -->
      <ellipse cx="330" cy="592" rx="70" ry="22" fill="#b5476d"/><ellipse cx="330" cy="586" rx="56" ry="15" fill="#f3c6d5"/>
      <!-- toy basket -->
      <path d="M426 528 h52 l-6 30 h-40z" fill="#c9a67a"/><path d="M430 540 h44 M432 550 h40" stroke="#a88456" stroke-width="2"/><circle cx="444" cy="524" r="9" fill="#d8e650"/><path d="M462 516 q8 -8 14 4" stroke="#4a7bd0" stroke-width="5" fill="none"/>
      <!-- desk -->
      <rect x="490" y="470" width="100" height="8" rx="2" fill="#6b4632"/><rect x="496" y="478" width="5" height="74" fill="#6b4632"/><rect x="580" y="478" width="5" height="74" fill="#6b4632"/>
      <path d="M516 470 l6 -34 h40 l6 34z" fill="#3a3550"/><rect x="524" y="440" width="36" height="24" fill="#9fd0e8"/>
      <!-- bowls -->
      <ellipse cx="134" cy="720" rx="90" ry="9" fill="rgba(0,0,0,.1)"/>
      <path d="M66 696 h52 l-6 18 h-40z" fill="#e98aab"/><path d="M150 700 h52 l-6 18 h-40z" fill="#7aa6c2"/>
      <text x="134" y="746" text-anchor="middle" font-size="13" font-family="Baloo 2, sans-serif" font-weight="800" fill="#7a5c4e">SIMBA</text>
      <!-- brush cabinet -->
      <rect x="492" y="650" width="80" height="70" rx="4" fill="#6b4632"/><rect x="488" y="646" width="88" height="7" rx="2" fill="#f3efe9"/><rect x="512" y="626" width="34" height="14" rx="5" fill="#ef8fb0"/><path d="M516 640 v6 M522 640 v6 M528 640 v6 M534 640 v6 M540 640 v6" stroke="#c9496f" stroke-width="2"/>
      <!-- plant -->
      <g transform="translate(270 372)"><path d="M-14 0 h28 l-3 -30 h-22z" fill="#ebe5dc"/><ellipse cx="-10" cy="-50" rx="16" ry="8" fill="#4d8044" transform="rotate(-30 -10 -50)"/><ellipse cx="10" cy="-62" rx="16" ry="8" fill="#5a9150" transform="rotate(25 10 -62)"/><ellipse cx="-4" cy="-76" rx="14" ry="7" fill="#3f6f3a"/></g>
      ${night ? '<circle cx="330" cy="120" r="200" fill="url(#rglow)" opacity=".5"/><rect width="600" height="800" fill="#1a1838" opacity=".22"/>' : ''}
    </svg>`;
  }

  /* ------------------------------------------------------------------ */
  /* Game state                                                          */
  /* ------------------------------------------------------------------ */
  let G = null;  // current level run
  let raf = 0, last = 0;
  const stage = () => $('stage');

  function makeActor(id, html, w, h, cls) {
    const el = document.createElement('div');
    el.className = 'actor ' + (cls || '');
    el.style.width = w + 'px'; el.style.height = h + 'px';
    el.innerHTML = html;
    el.dataset.actor = id;
    stage().appendChild(el);
    return { el, w, h, x: 0, y: 0 };
  }
  function place(a, x, y) {
    a.x = x; a.y = y;
    a.el.style.transform = `translate(${(x - a.w / 2).toFixed(1)}px, ${(y - a.h).toFixed(1)}px)`;
    a.el.style.zIndex = String(Math.round(y));
  }

  function startLevel(n) {
    const cfg = levelCfg(n);
    cancelAnimationFrame(raf);
    const st = stage();
    st.innerHTML = stageArt(cfg);
    G = {
      cfg, n, time: cfg.dur, score: 0, coins: 0, combo: 0, comboT: 0, hearts: 5 + (up('decor') ? 1 : 0), maxHearts: 5 + (up('decor') ? 1 : 0),
      reqs: [], queue: [], hand: [], furs: [], dishes: 0, spawnT: 2, furT: cfg.fur || 999, robotT: 8, paused: false, over: false,
      nena: null, simba: null, npcs: {}, busy: null, simbaAway: false, simbaTask: null, done: 0, failed: 0,
    };
    // stations hit areas
    Object.entries(STATIONS).forEach(([id, s]) => {
      if (id === 'laptop' && !cfg.laptop) return;
      if (id === 'negin' && !cfg.types.includes('wake')) return;
      if (id === 'samovar' && !cfg.types.includes('tea')) return;
      if (id === 'brush' && !cfg.types.includes('brush')) return;
      if (id === 'toy' && !cfg.types.includes('play')) return;
      if (id === 'sink' && !cfg.types.includes('help')) return;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'hit station'; b.dataset.target = id;
      b.setAttribute('aria-label', s.label);
      b.style.left = (s.x - s.r) + 'px'; b.style.top = (s.y - s.r) + 'px'; b.style.width = b.style.height = (s.r * 2) + 'px';
      st.appendChild(b);
    });
    // characters
    G.nena = makeActor('nena', A.nena({ dressed: true, outfit: 'basique', eyes: 'open' }), 84, 147, 'nena');
    place(G.nena, HOME.nena[0], HOME.nena[1]);
    G.simba = makeActor('simba', A.simba({ eyes: 'open' }), 112, 89, 'simba happy');
    G.simba.el.dataset.target = 'simba';
    place(G.simba, HOME.simba[0], HOME.simba[1]);
    if (cfg.types.includes('tea')) { G.npcs.baba = makeActor('baba', A.person('mohsen', { mood: 'happy' }), 84, 147, 'npc'); G.npcs.baba.el.dataset.target = 'baba'; place(G.npcs.baba, HOME.baba[0], HOME.baba[1]); }
    if (cfg.types.includes('help')) { G.npcs.fariba = makeActor('fariba', A.person('fariba', { mood: 'happy' }), 80, 140, 'npc'); G.npcs.fariba.el.dataset.target = 'fariba'; place(G.npcs.fariba, HOME.fariba[0], HOME.fariba[1]); }
    // overlays
    G.bar = document.createElement('div'); G.bar.className = 'workbar'; G.bar.innerHTML = '<i></i>'; G.bar.hidden = true; st.appendChild(G.bar);
    G.handEl = document.createElement('div'); G.handEl.className = 'hand'; st.appendChild(G.handEl);
    renderHand();
    $('screen-game').hidden = false;
    $('g-level').textContent = `Day ${n} · ${cfg.title}`;
    $('g-star1').style.left = (cfg.targets[0] / cfg.targets[2] * 100) + '%';
    $('g-star2').style.left = (cfg.targets[1] / cfg.targets[2] * 100) + '%';
    fit();
    hud();
    // tutorial hint for a newly introduced mechanic
    const newType = cfg.types.find((t) => !save.seen[t]);
    if (newType) { toast(REQ[newType].hint, 'hint', 4500); cfg.types.forEach((t) => { save.seen[t] = 1; }); persist(); }
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function fit() {
    const box = $('stage-wrap');
    if (!box) return;
    const s = Math.min(box.clientWidth / 600, box.clientHeight / 800);
    stage().style.transform = `translate(${((box.clientWidth - 600 * s) / 2).toFixed(1)}px, ${((box.clientHeight - 800 * s) / 2).toFixed(1)}px) scale(${s})`;
  }
  window.addEventListener('resize', fit);

  /* ------------------------------------------------------------------ */
  /* Requests                                                            */
  /* ------------------------------------------------------------------ */
  function anchorOf(who) {
    if (who === 'simba') return [G.simba.x, G.simba.y - G.simba.h - 6];
    if (G.npcs[who]) return [G.npcs[who].x, G.npcs[who].y - G.npcs[who].h - 6];
    if (who === 'negin') return [STATIONS.negin.x, 176];
    if (who === 'nasim') return [DOOR[0], DOOR[1] - 150];
    return [300, 300];
  }
  function patienceMul(who) {
    let m = G.cfg.patience || 1;
    if (who === 'simba' && up('treats')) m *= 1.2;
    if (who !== 'simba' && up('decor')) m *= 1.15;
    return m;
  }
  function spawn() {
    const busyWho = new Set(G.reqs.map((r) => r.who));
    let types = G.cfg.types.filter((t) => !busyWho.has(REQ[t].who));
    if (G.simbaAway || G.simbaTask) types = types.filter((t) => REQ[t].who !== 'simba');
    if (up('fountain')) types = types.filter((t) => t !== 'water' || rnd() < 0.6);
    if (!types.length) return;
    // keep Simba central: favour his needs a little
    const t = pick(types.concat(types.filter((x) => REQ[x].who === 'simba')));
    const R = REQ[t];
    if (R.who === 'nasim') { G.npcs.nasim = makeActor('nasim', A.person('nasim', { mood: 'angry' }), 80, 140, 'npc'); G.npcs.nasim.el.dataset.target = 'nasim'; place(G.npcs.nasim, DOOR[0], DOOR[1]); snd('swoosh'); }
    const max = R.pat * patienceMul(R.who);
    const el = document.createElement('div');
    el.className = 'req';
    el.innerHTML = `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" class="ring-bg"/><circle cx="20" cy="20" r="17" class="ring"/></svg><span>${R.icon}</span>`;
    stage().appendChild(el);
    const r = { type: t, who: R.who, left: max, max, el };
    G.reqs.push(r);
    posReq(r);
    snd(R.who === 'simba' ? 'bark' : 'pop');
  }
  function posReq(r) {
    const [x, y] = anchorOf(r.who);
    r.el.style.transform = `translate(${x - 24}px, ${y - 48}px)`;
    r.el.style.zIndex = '2000';
    const f = r.left / r.max;
    r.el.querySelector('.ring').style.strokeDashoffset = String((1 - f) * 106.8);
    r.el.classList.toggle('urgent', f < 0.3);
  }
  function removeReq(r) { r.el.remove(); G.reqs = G.reqs.filter((x) => x !== r); if (r.who === 'nasim' && G.npcs.nasim) { const n = G.npcs.nasim; delete G.npcs.nasim; n.el.classList.add('leave'); setTimeout(() => n.el.remove(), 500); } }
  function fail(r) {
    removeReq(r);
    G.hearts--; G.failed++; G.combo = 0;
    snd('fail'); buzz(60);
    const [x, y] = anchorOf(r.who);
    floatText(x, y, '💔', 'bad');
    if (r.type === 'walk') { addFur(true); toast('Oops! Simba couldn’t wait… a puddle to clean.', 'bad'); }
    else if (r.type === 'brush') { addFur(); addFur(); }
    else if (r.who === 'baba') toast('Baba grumbles at the TV.', 'bad');
    else if (r.who === 'nasim') toast('Nasim slammed her door!', 'bad');
    if (G.hearts <= 0) endLevel(true);
  }
  function complete(r, bonusMul) {
    const R = REQ[r.type];
    const speed = 1 + 0.5 * (r.left / r.max);
    G.combo = G.comboT > 0 ? Math.min(G.combo + 1, 8) : 1;
    G.comboT = 4;
    const mul = 1 + 0.25 * (G.combo - 1);
    const pts = Math.round(R.pts * speed * mul * (bonusMul || 1));
    G.score += pts; G.done++;
    const tip = r.who !== 'simba' ? 2 + Math.round(3 * r.left / r.max) : 0;
    G.coins += tip;
    const [x, y] = anchorOf(r.who);
    floatText(x, y, `+${pts}${G.combo > 1 ? ` ×${mul.toFixed(2).replace(/\.?0+$/, '')}` : ''}`, 'good');
    if (tip) floatText(x + 30, y + 24, `+${tip} 🪙`, 'coin');
    if (G.combo >= 3) toast(`Combo ×${G.combo}!`, 'combo', 900);
    removeReq(r);
    snd(G.combo >= 3 ? 'fanfare' : 'success'); buzz(12);
  }
  function addFur(puddle) {
    if (G.furs.length >= 7) return;
    const z = FUR_ZONE;
    const x = z.x0 + rnd() * (z.x1 - z.x0), y = z.y0 + rnd() * (z.y1 - z.y0);
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'hit fur' + (puddle ? ' puddle' : '');
    b.innerHTML = puddle ? '<svg viewBox="0 0 60 30"><ellipse cx="30" cy="15" rx="28" ry="12" fill="#e9d36a" opacity=".85"/><ellipse cx="22" cy="12" rx="8" ry="3" fill="#fff" opacity=".5"/></svg>'
      : '<svg viewBox="0 0 60 30"><ellipse cx="30" cy="24" rx="24" ry="5" fill="rgba(0,0,0,.12)"/><circle cx="24" cy="16" r="10" fill="#d98f45"/><circle cx="36" cy="14" r="9" fill="#eaa75c"/><circle cx="30" cy="20" r="8" fill="#c97f3a"/></svg>';
    const id = 'fur' + Math.floor(rnd() * 1e9);
    b.dataset.target = id;
    b.style.left = (x - 30) + 'px'; b.style.top = (y - 15) + 'px';
    b.style.zIndex = String(Math.round(y) - 40);
    stage().appendChild(b);
    G.furs.push({ id, x, y, el: b, puddle });
  }
  function addDish() {
    G.dishes = Math.min(4, G.dishes + 1);
    renderDishes();
  }
  function renderDishes() {
    let el = stage().querySelector('.dishes');
    if (!el) { el = document.createElement('div'); el.className = 'dishes'; stage().appendChild(el); }
    el.innerHTML = Array.from({ length: G.dishes }, () => '<i></i>').join('');
    el.style.left = '16px'; el.style.top = (250 - G.dishes * 6) + 'px';
  }

  /* ------------------------------------------------------------------ */
  /* Tapping: queue targets for Nena                                     */
  /* ------------------------------------------------------------------ */
  function onTap(e) {
    if (!G || G.paused || G.over) return;
    const t = e.target.closest('[data-target]');
    if (!t) return;
    const id = t.dataset.target;
    if (G.queue.length >= 4) { toast('Nena can only remember 4 things at once!', 'bad', 1200); return; }
    G.queue.push(id);
    snd('click'); buzz(6);
    markQueue();
  }
  function markQueue() {
    stage().querySelectorAll('.qmark').forEach((m) => m.remove());
    G.queue.forEach((id, i) => {
      const p = targetPoint(id, true);
      if (!p) return;
      const m = document.createElement('div');
      m.className = 'qmark'; m.textContent = String(i + 1);
      m.style.transform = `translate(${p[0] - 12}px, ${p[1] - 12}px)`;
      stage().appendChild(m);
    });
  }
  function targetPoint(id, visual) {
    if (STATIONS[id]) return visual ? [STATIONS[id].x, STATIONS[id].y] : STATIONS[id].stand;
    if (id === 'simba') return visual ? [G.simba.x, G.simba.y - 60] : [G.simba.x - 70, G.simba.y + 4];
    if (G.npcs[id]) return visual ? [G.npcs[id].x, G.npcs[id].y - 90] : [G.npcs[id].x + (id === 'nasim' ? -70 : 70), G.npcs[id].y + 6];
    const f = G.furs.find((x) => x.id === id);
    if (f) return visual ? [f.x, f.y] : [f.x - 40, f.y + 8];
    return null;
  }
  const findReq = (who, type) => G.reqs.find((r) => r.who === who && (!type || r.type === type));
  const holding = (it) => G.hand.includes(it);
  const take = (it) => { G.hand.splice(G.hand.indexOf(it), 1); renderHand(); };
  function give(it) {
    const cap = up('tray') ? 2 : 1;
    if (G.hand.length >= cap) { toast(cap === 1 ? 'Hands full! (Buy the serving tray to carry 2.)' : 'Hands full!', 'bad', 1400); return false; }
    G.hand.push(it); renderHand(); snd('pop'); return true;
  }
  function renderHand() {
    $('g-hand').innerHTML = G.hand.length ? G.hand.map((h) => `<span>${ITEMS[h]}</span>`).join('') : '<em>Empty hands</em>';
    G.handEl.innerHTML = G.hand.map((h) => `<span>${ITEMS[h]}</span>`).join('');
  }

  // Decide what happens when Nena reaches a target: returns {dur, done()} or null (nothing to do)
  function actionFor(id) {
    const sp = 1 / (1 + 0.15 * up('shoes'));
    switch (id) {
      case 'kibble': return { dur: 0.6, done: () => give('food') };
      case 'samovar': return { dur: (up('samovar') ? 1.2 : 2) * sp, snd: 'water', done: () => give('tea') };
      case 'brush': return { dur: 0.4, done: () => give('brush') };
      case 'toy': return { dur: 0.4, done: () => give('ball') };
      case 'laptop': return { dur: 3 * sp, done: () => { G.coins += 6; G.score += 40; floatText(540, 420, '+40 · +6 🪙', 'coin'); snd('coin'); } };
      case 'water': { const r = findReq('simba', 'water'); if (!r) return { dur: 0.3, miss: 'The water bowl is already full.' }; return { dur: 1.2 * sp, snd: 'water', done: () => complete(r) }; }
      case 'bowl': {
        const r = findReq('simba', 'food');
        if (!holding('food')) return { dur: 0.2, miss: 'Grab kibble first!' };
        if (!r) return { dur: 0.2, miss: 'Simba isn’t hungry right now.' };
        return { dur: 0.6, done: () => { take('food'); simbaGo(STATIONS.bowl.x + 50, STATIONS.bowl.y + 30, 2, () => {}); complete(r); } };
      }
      case 'sink': if (!G.dishes) return { dur: 0.2, miss: 'No dirty dishes.' }; return { dur: 1.6 * sp, snd: 'water', done: () => { G.dishes--; renderDishes(); G.score += 60; floatText(60, 230, '+60', 'good'); } };
      case 'negin': { const r = findReq('negin'); if (!r) return { dur: 0.2, miss: 'Shh… Negin is sleeping. Leave her be.' }; return { dur: 2 * sp, snd: 'click', done: () => { complete(r); toast('Negin: “I’m up… I’m up…”', '', 1500); } }; }
      case 'simba': {
        if (G.simbaAway) return null;
        const walk = findReq('simba', 'walk'), br = findReq('simba', 'brush'), pl = findReq('simba', 'play');
        if (walk) return { dur: 0.3, done: () => doWalk(walk) };
        if (br && holding('brush')) return { dur: 1.6 * sp, snd: 'brush', done: () => { take('brush'); complete(br); } };
        if (pl && holding('ball')) return { dur: 1.4 * sp, snd: 'happy', done: () => { take('ball'); complete(pl); simbaHop(); } };
        if (br) return { dur: 0.2, miss: 'Grab the brush first!' };
        if (pl) return { dur: 0.2, miss: 'Grab the ball first!' };
        return { dur: 0.6, snd: 'happy', done: () => { G.score += 10; floatText(G.simba.x, G.simba.y - 100, '♥', 'heart'); simbaHop(); } };
      }
      case 'baba': { const r = findReq('baba'); if (!r) return { dur: 0.2, miss: 'Baba is happily watching TV.' }; if (!holding('tea')) return { dur: 0.2, miss: 'Brew tea at the samovar first!' }; return { dur: 0.5, done: () => { take('tea'); complete(r); } }; }
      case 'fariba': { const r = findReq('fariba'); if (!r) return { dur: 0.2, miss: 'Maman is fine for now.' }; return { dur: 2.2 * sp, snd: 'swoosh', done: () => { complete(r); addDish(); } }; }
      case 'nasim': { const r = findReq('nasim'); if (!r) return null; return { dur: 1.6 * sp, done: () => { complete(r); toast('Nasim: “…Thanks. Whatever.”', '', 1500); } }; }
      default: {
        const f = G.furs.find((x) => x.id === id);
        if (!f) return null;
        return { dur: (f.puddle ? 1.2 : 0.7) * sp, snd: 'brush', done: () => { f.el.remove(); G.furs = G.furs.filter((x) => x !== f); G.score += f.puddle ? 30 : 20; floatText(f.x, f.y - 20, f.puddle ? '+30' : '+20', 'good'); } };
      }
    }
  }
  function doWalk(r) {
    G.simbaAway = true; G.busy = { t: 0, dur: 99, walking: true };
    const sp = 1 + 0.2 * up('shoes');
    const away = 3.6 / sp;
    G.nena.el.classList.add('walking'); G.simba.el.classList.add('walking');
    moveTo(G.simba, DOOR[0] - 20, DOOR[1] + 40, 0.9);
    moveTo(G.nena, DOOR[0] - 70, DOOR[1] + 40, 0.9, () => {
      G.nena.el.classList.add('gone'); G.simba.el.classList.add('gone');
      floatText(DOOR[0] - 40, DOOR[1] - 120, '🌳 Walk…', 'hint');
      setTimeout(() => {
        if (!G || G.over) return;
        G.nena.el.classList.remove('gone'); G.simba.el.classList.remove('gone');
        complete(r, 1);
        moveTo(G.simba, HOME.simba[0], HOME.simba[1], 1.0, () => { G.simba.el.classList.remove('walking'); G.simbaAway = false; });
        moveTo(G.nena, HOME.simba[0] - 80, HOME.simba[1] + 20, 1.0, () => { G.nena.el.classList.remove('walking'); G.busy = null; });
      }, away * 1000);
    });
  }
  function simbaGo(x, y, stay, cb) {
    G.simbaTask = true;
    G.simba.el.classList.add('walking');
    moveTo(G.simba, x, y, 0.6, () => {
      G.simba.el.classList.remove('walking');
      setTimeout(() => {
        if (!G) return;
        G.simba.el.classList.add('walking');
        moveTo(G.simba, HOME.simba[0], HOME.simba[1], 0.6, () => { G.simba.el.classList.remove('walking'); G.simbaTask = false; if (cb) cb(); });
      }, stay * 1000);
    });
  }
  function simbaHop() { G.simba.el.classList.remove('hop'); void G.simba.el.offsetWidth; G.simba.el.classList.add('hop'); }
  // tweened moves for scripted motions
  const tweens = [];
  function moveTo(a, x, y, dur, cb) { tweens.push({ a, x0: a.x, y0: a.y, x, y, t: 0, dur, cb }); }

  /* ------------------------------------------------------------------ */
  /* Main loop                                                           */
  /* ------------------------------------------------------------------ */
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!G || G.paused || G.over) return;
    G.time -= dt;
    G.comboT -= dt;
    if (G.comboT <= 0 && G.combo) G.combo = 0;
    // spawn requests
    G.spawnT -= dt;
    const maxReq = Math.min(5, 2 + Math.floor(G.n / 3));
    if (G.spawnT <= 0) { if (G.reqs.length < maxReq) spawn(); const [a, b] = G.cfg.every; G.spawnT = a + rnd() * (b - a); }
    if (G.cfg.fur) { G.furT -= dt; if (G.furT <= 0) { addFur(); G.furT = G.cfg.fur * (0.7 + rnd() * 0.6); } }
    if (up('robot') && G.furs.length) { G.robotT -= dt; if (G.robotT <= 0) { const f = G.furs.find((x) => !x.puddle) || G.furs[0]; f.el.remove(); G.furs = G.furs.filter((x) => x !== f); floatText(f.x, f.y - 20, '🤖', 'hint'); G.robotT = 8; } }
    // patience
    for (const r of G.reqs.slice()) {
      if (r.who === 'simba' && G.simbaAway) continue;
      r.left -= dt;
      if (r.left <= 0) fail(r); else posReq(r);
      if (G.over) return;
    }
    // tweens
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      tw.t += dt / tw.dur;
      const k = Math.min(1, tw.t), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      place(tw.a, tw.x0 + (tw.x - tw.x0) * e, tw.y0 + (tw.y - tw.y0) * e);
      if (k >= 1) { tweens.splice(i, 1); if (tw.cb) tw.cb(); }
    }
    // Nena: walk to next queued target, then work
    if (!G.busy && G.queue.length) {
      const id = G.queue[0];
      const p = targetPoint(id, false);
      if (!p) { G.queue.shift(); markQueue(); }
      else {
        const speed = 300 * (1 + 0.2 * up('shoes'));
        const dx = p[0] - G.nena.x, dy = p[1] - G.nena.y, d = Math.hypot(dx, dy);
        if (d < 6) {
          G.queue.shift(); markQueue();
          const act = actionFor(id);
          G.nena.el.classList.remove('walking');
          if (!act) { /* nothing */ }
          else if (act.miss) { toast(act.miss, 'bad', 1300); snd('fail'); G.busy = { t: 0, dur: act.dur }; }
          else { G.busy = { t: 0, dur: act.dur, done: act.done }; if (act.snd) snd(act.snd); if (act.dur > 0.5) { G.bar.hidden = false; G.nena.el.classList.add('working'); } }
        } else {
          G.nena.el.classList.add('walking');
          const step = Math.min(d, speed * dt);
          place(G.nena, G.nena.x + (dx / d) * step, G.nena.y + (dy / d) * step);
          G.nena.el.classList.toggle('flip', dx < 0);
        }
      }
    }
    if (G.busy && !G.busy.walking) {
      G.busy.t += dt;
      G.bar.style.transform = `translate(${G.nena.x - 34}px, ${G.nena.y - G.nena.h - 26}px)`;
      G.bar.firstChild.style.width = Math.min(100, (G.busy.t / G.busy.dur) * 100) + '%';
      if (G.busy.t >= G.busy.dur) { const fn = G.busy.done; G.busy = null; G.bar.hidden = true; G.nena.el.classList.remove('working'); if (fn) fn(); }
    }
    if (!G.queue.length && !G.busy) G.nena.el.classList.remove('walking');
    G.handEl.style.transform = `translate(${G.nena.x + 14}px, ${G.nena.y - 74}px)`;
    G.handEl.style.zIndex = String(Math.round(G.nena.y) + 1);
    if (G.time <= 0) { G.time = 0; endLevel(false); }
    hud();
  }

  function hud() {
    const c = G.cfg;
    const t = Math.ceil(G.time);
    $('g-time').textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    $('g-time').classList.toggle('low', G.time < 10);
    $('g-score').textContent = G.score;
    $('g-fill').style.width = Math.min(100, (G.score / c.targets[2]) * 100) + '%';
    $('g-star1').classList.toggle('on', G.score >= c.targets[0]);
    $('g-star2').classList.toggle('on', G.score >= c.targets[1]);
    $('g-star3').classList.toggle('on', G.score >= c.targets[2]);
    $('g-hearts').textContent = '♥'.repeat(Math.max(0, G.hearts)) + '♡'.repeat(Math.max(0, G.maxHearts - G.hearts));
    $('g-combo').textContent = G.combo > 1 ? `Combo ×${G.combo}` : '';
    $('g-coins').textContent = save.coins + G.coins;
  }

  /* ------------------------------------------------------------------ */
  /* Feedback                                                            */
  /* ------------------------------------------------------------------ */
  function floatText(x, y, txt, kind) {
    const el = document.createElement('div');
    el.className = 'float ' + (kind || '');
    el.textContent = txt;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    stage().appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }
  let toastT = 0;
  function toast(msg, kind, ms) {
    const el = $('toast');
    el.textContent = msg; el.className = 'toast show ' + (kind || '');
    clearTimeout(toastT);
    toastT = setTimeout(() => { el.className = 'toast'; }, ms || 2000);
  }

  /* ------------------------------------------------------------------ */
  /* End of level                                                        */
  /* ------------------------------------------------------------------ */
  function endLevel(lost) {
    if (G.over) return;
    G.over = true;
    cancelAnimationFrame(raf);
    const c = G.cfg;
    const mess = G.furs.length + G.dishes;
    const penalty = mess * 20;
    const final = Math.max(0, G.score - penalty);
    const stars = lost ? 0 : final >= c.targets[2] ? 3 : final >= c.targets[1] ? 2 : final >= c.targets[0] ? 1 : 0;
    const earned = lost ? Math.floor(G.coins / 2) : G.coins + Math.floor(final / 25) + stars * 10;
    save.coins += earned;
    if (stars > 0) {
      save.stars[G.n] = Math.max(save.stars[G.n] || 0, stars);
      save.best[G.n] = Math.max(save.best[G.n] || 0, final);
      if (G.n === save.level) save.level = G.n + 1;
    }
    persist();
    $('r-title').textContent = lost ? 'Too many upset faces…' : stars ? ['', 'Day done!', 'Great day!', 'Perfect day!'][stars] : 'Not quite…';
    $('r-stars').innerHTML = [0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}">★</span>`).join('');
    $('r-lines').innerHTML = `<li><span>Requests done</span><b>${G.done}</b></li><li><span>Missed</span><b>${G.failed}</b></li>${mess ? `<li><span>Mess left (${mess})</span><b>−${penalty}</b></li>` : ''}<li class="total"><span>Score</span><b>${final}</b></li><li><span>Coins earned</span><b>+${earned} 🪙</b></li>`;
    $('r-sub').textContent = lost ? 'The family lost patience. Try again, and watch the rings!' : stars ? `Goal: ${c.targets[0]} · ${c.targets[1]} · ${c.targets[2]}` : `You needed ${c.targets[0]} points for 1 star.`;
    $('r-next').hidden = !stars;
    $('screen-result').hidden = false;
    snd(stars >= 2 ? 'fanfare' : stars ? 'success' : 'fail');
  }

  /* ------------------------------------------------------------------ */
  /* Screens: title, map, story, shop                                    */
  /* ------------------------------------------------------------------ */
  function show(id) {
    ['screen-title', 'screen-map', 'screen-game', 'screen-result', 'screen-shop', 'screen-story', 'screen-pause'].forEach((s) => { $(s).hidden = s !== id && !(id === 'screen-result' && s === 'screen-game') && !(id === 'screen-pause' && s === 'screen-game'); });
  }
  function renderMap() {
    const total = Object.values(save.stars).reduce((a, b) => a + b, 0);
    $('m-coins').textContent = save.coins;
    $('m-stars').textContent = total;
    const max = Math.max(save.level + 2, LEVELS.length);
    let html = '';
    for (let n = 1; n <= max; n++) {
      const cfg = levelCfg(n), locked = n > save.level, st = save.stars[n] || 0;
      html += `<button type="button" class="lvl${locked ? ' locked' : ''}${n === save.level ? ' current' : ''}" data-level="${n}" ${locked ? 'disabled' : ''}>
        <span class="lvl-n">${locked ? '🔒' : n}</span><span class="lvl-t"><b>${cfg.title}</b><small>${cfg.day}${n > LEVELS.length ? '' : ' · ' + cfg.types.length + ' tasks'}</small></span>
        <span class="lvl-s">${'★'.repeat(st)}<i>${'★'.repeat(3 - st)}</i></span></button>`;
    }
    $('m-levels').innerHTML = html;
    show('screen-map');
    const cur = document.querySelector('.lvl.current');
    if (cur) cur.scrollIntoView({ block: 'center' });
  }
  const NAMES = { nena: 'Nena', simba: 'Simba', mohsen: 'Baba', fariba: 'Maman', nasim: 'Nasim', negin: 'Negin' };
  let storyLines = [], storyLevel = 1;
  function playStory(n) {
    storyLevel = n;
    storyLines = (levelCfg(n).story || []).slice();
    show('screen-story');
    nextLine();
  }
  function nextLine() {
    const l = storyLines.shift();
    if (!l) { show('screen-game'); startLevel(storyLevel); return; }
    const [who, mood, text] = l;
    $('s-portrait').innerHTML = A.portrait(who, mood);
    $('s-name').textContent = NAMES[who] || who;
    $('s-text').textContent = text;
    $('s-day').textContent = `Day ${storyLevel} · ${levelCfg(storyLevel).day}`;
    snd('talk', 600);
  }
  function renderShop() {
    $('sh-coins').textContent = save.coins;
    $('sh-list').innerHTML = UPGRADES.map((u) => {
      const lv = up(u.id), maxed = lv >= u.costs.length, cost = u.costs[lv];
      return `<div class="upg${maxed ? ' maxed' : ''}"><span class="upg-i">${u.icon}</span><div class="upg-t"><b>${u.name}${u.costs.length > 1 ? ` <small>${lv}/${u.costs.length}</small>` : ''}</b><small>${u.desc}</small></div>
        <button type="button" class="btn ${maxed ? '' : 'btn-primary'}" data-buy="${u.id}" ${maxed || save.coins < cost ? 'disabled' : ''}>${maxed ? 'Owned' : cost + ' 🪙'}</button></div>`;
    }).join('');
    show('screen-shop');
  }

  /* ------------------------------------------------------------------ */
  /* Events                                                              */
  /* ------------------------------------------------------------------ */
  function wake() { if (window.Sound) { window.Sound.init(); window.Sound.setEnabled(save.sound !== false); window.Sound.setMusic(save.music !== false); } }
  $('stage').addEventListener('pointerdown', onTap);
  $('btn-play').addEventListener('click', () => { wake(); snd('tab'); renderMap(); });
  $('m-levels').addEventListener('click', (e) => { const b = e.target.closest('[data-level]'); if (b) { snd('click'); playStory(+b.dataset.level); } });
  $('m-shop').addEventListener('click', () => { snd('tab'); renderShop(); });
  $('m-back').addEventListener('click', () => show('screen-title'));
  $('sh-back').addEventListener('click', () => renderMap());
  $('sh-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-buy]'); if (!b) return;
    const u = UPGRADES.find((x) => x.id === b.dataset.buy), lv = up(u.id), cost = u.costs[lv];
    if (cost == null || save.coins < cost) return;
    save.coins -= cost; save.up[u.id] = lv + 1; persist(); snd('coin'); setTimeout(() => snd('success'), 120); renderShop();
  });
  $('screen-story').addEventListener('click', () => { snd('click'); nextLine(); });
  $('r-next').addEventListener('click', () => { playStory(G.n + 1); });
  $('r-retry').addEventListener('click', () => { show('screen-game'); startLevel(G.n); });
  $('r-map').addEventListener('click', () => renderMap());
  $('g-pause').addEventListener('click', () => { if (!G || G.over) return; G.paused = true; show('screen-pause'); });
  $('p-resume').addEventListener('click', () => { G.paused = false; last = performance.now(); show('screen-game'); });
  $('p-quit').addEventListener('click', () => { G.over = true; cancelAnimationFrame(raf); renderMap(); });
  $('p-sound').addEventListener('click', () => { save.sound = save.sound === false; save.music = save.sound; persist(); wake(); $('p-sound').textContent = save.sound ? 'Sound: on' : 'Sound: off'; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G && !G.over && !G.paused) { G.paused = true; show('screen-pause'); } });
  $('p-sound').textContent = save.sound === false ? 'Sound: off' : 'Sound: on';
  $('t-progress').textContent = save.level > 1 ? `Day ${save.level} · ${save.coins} 🪙` : '';
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
})();
