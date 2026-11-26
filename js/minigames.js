/* Touch mini-games: brushing, fetch, walk. Rendered on canvas. */
window.MiniGames = (function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const buzz = (ms) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* */ } };
  const snd = (n) => window.Sound && window.Sound.play(n);

  let cv, cx, W = 0, H = 0, raf = 0, game = null, onEnd = null, last = 0, elapsed = 0, phase = 'off', countdown = 0;
  let imgs = {};
  let ptr = { down: false, x: 0, y: 0, sx: 0, sy: 0, st: 0 };

  function prepare(opts) {
    imgs.simba = window.Art.toImage(window.Art.simba({ standalone: true, eyes: 'open', collar: opts.collar, muddy: false, tongue: true }));
    imgs.simbaMud = window.Art.toImage(window.Art.simba({ standalone: true, eyes: 'open', collar: opts.collar, muddy: true, tongue: true }));
    imgs.simbaHappy = window.Art.toImage(window.Art.simba({ standalone: true, eyes: 'closed', collar: opts.collar, tongue: true }));
    imgs.nena = window.Art.toImage(window.Art.nena({ standalone: true, dressed: true, outfit: opts.outfit, eyes: 'open' }));
  }

  function resize() {
    const r = cv.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawImg(im, x, y, w, flip) {
    if (!im || !im.complete || !im.naturalWidth) return;
    const h = w * (im.naturalHeight / im.naturalWidth);
    cx.save();
    cx.translate(x, y);
    if (flip) cx.scale(-1, 1);
    cx.drawImage(im, -w / 2, -h, w, h);
    cx.restore();
  }
  function text(str, x, y, size, color, align) {
    cx.font = `800 ${size}px "Baloo 2", "Trebuchet MS", sans-serif`;
    cx.textAlign = align || 'center';
    cx.lineWidth = Math.max(3, size / 6);
    cx.strokeStyle = 'rgba(63,42,34,.85)';
    cx.strokeText(str, x, y);
    cx.fillStyle = color || '#fff';
    cx.fillText(str, x, y);
  }

  /* -------------------------------------------------------------- */
  /* 1. Brushing: rub out the knots in the coat                      */
  /* -------------------------------------------------------------- */
  const brush = {
    title: 'Coat brushing',
    hint: 'Rub the knots with your finger to untangle Simba’s double coat.',
    duration: 20,
    init() {
      this.w = Math.min(W * 0.95, H * 1.05);
      this.x0 = W / 2 - this.w / 2;
      this.y0 = H * 0.5 - (this.w * 135 / 170) / 2 + 10;
      const s = this.w / 170;
      this.knots = [];
      for (let i = 0; i < 12; i++) {
        let px, py;
        if (i % 3 === 0) { const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 12; px = 52 + Math.cos(a) * r; py = 66 + Math.sin(a) * r * 0.95; }
        else { px = 70 + Math.random() * 75; py = 66 + Math.random() * 40; }
        this.knots.push({ x: this.x0 + px * s, y: this.y0 + py * s, hp: 100, r: 15 + Math.random() * 8, rot: Math.random() * 6, dead: false });
      }
      this.parts = []; this.cleared = 0; this.lastP = null; this.sound = 0;
    },
    pointer(kind, x, y) {
      if (kind === 'down') { this.lastP = { x, y }; return; }
      if (kind === 'up') { this.lastP = null; return; }
      if (!this.lastP) return;
      const d = Math.hypot(x - this.lastP.x, y - this.lastP.y);
      this.lastP = { x, y };
      let hit = false;
      for (const k of this.knots) {
        if (k.dead) continue;
        if (Math.hypot(x - k.x, y - k.y) < k.r + 22) {
          k.hp -= d * 0.9; hit = true;
          if (Math.random() < 0.3) this.fur(k.x, k.y, 1);
          if (k.hp <= 0) { k.dead = true; this.cleared++; this.fur(k.x, k.y, 14); snd('pop'); buzz(15); }
        }
      }
      if (hit && performance.now() - this.sound > 120) { snd('brush'); this.sound = performance.now(); }
    },
    fur(x, y, n) {
      for (let i = 0; i < n; i++) this.parts.push({ x, y, vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 260 - 40, life: 1, r: 3 + Math.random() * 4 });
    },
    update(dt) {
      for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.life -= dt * 0.9; }
      this.parts = this.parts.filter((p) => p.life > 0);
    },
    draw() {
      const g = cx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#d4e6e8'); g.addColorStop(1, '#bcd6da');
      cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      cx.fillStyle = '#e9e2d8'; cx.fillRect(0, H * 0.82, W, H * 0.18);
      drawImg(this.cleared === this.knots.length ? imgs.simbaHappy : imgs.simba, W / 2, this.y0 + this.w * 135 / 170, this.w);
      for (const k of this.knots) {
        if (k.dead) continue;
        const r = k.r * (0.5 + 0.5 * k.hp / 100);
        cx.save(); cx.translate(k.x, k.y); cx.rotate(k.rot + elapsed * 0.5);
        cx.fillStyle = '#b8661c'; cx.beginPath(); cx.arc(0, 0, r, 0, Math.PI * 2); cx.fill();
        cx.strokeStyle = '#7d4210'; cx.lineWidth = 2.2;
        for (let i = 0; i < 3; i++) { cx.beginPath(); cx.arc(i * 2 - 2, i - 1, r * (0.35 + i * 0.18), i, i + 4.2); cx.stroke(); }
        cx.restore();
      }
      for (const p of this.parts) { cx.globalAlpha = Math.max(0, p.life); cx.fillStyle = '#e8952f'; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, Math.PI * 2); cx.fill(); }
      cx.globalAlpha = 1;
      if (ptr.down) {
        cx.save(); cx.translate(ptr.x, ptr.y); cx.rotate(-0.4);
        cx.fillStyle = '#ef8fb0'; cx.fillRect(-28, -34, 56, 16);
        cx.fillStyle = '#c9496f'; for (let i = -24; i <= 24; i += 6) cx.fillRect(i, -18, 3, 16);
        cx.restore();
      }
      text(`${this.cleared} / ${this.knots.length} knots`, W / 2, H - 18, 20, '#fff');
    },
    finished() { return this.cleared === this.knots.length; },
    result() {
      const bonus = this.finished() ? clamp((this.duration - elapsed) / this.duration, 0, 1) * 0.15 : 0;
      return { score: clamp(this.cleared / this.knots.length + bonus, 0, 1), label: `${this.cleared} of ${this.knots.length} knots untangled` };
    },
  };

  /* -------------------------------------------------------------- */
  /* 2. Fetch: aim for the cushion                                    */
  /* -------------------------------------------------------------- */
  const fetchGame = {
    title: 'Fetch!',
    hint: 'The arrow slides along the ground: tap when it is on the cushion.',
    duration: 0,
    init() {
      this.throws = 0; this.max = 5; this.points = 0; this.state = 'aim'; this.t = 0;
      this.ground = H * 0.8; this.x0 = W * 0.16; this.x1 = W * 0.94;
      this.simX = W * 0.3; this.simFlip = false; this.jump = 0; this.msg = ''; this.msgT = 0;
      this.newTarget();
    },
    newTarget() { this.target = 0.35 + Math.random() * 0.55; this.speed = 1.6 + this.throws * 0.35; this.t = Math.random() * 3; },
    pos(p) { return this.x0 + p * (this.x1 - this.x0); },
    pointer(kind) {
      if (kind !== 'down' || this.state !== 'aim') return;
      this.power = (Math.sin(this.t * this.speed) + 1) / 2;
      this.state = 'fly'; this.flyT = 0; snd('swoosh'); buzz(10);
    },
    update(dt) {
      this.msgT -= dt;
      if (this.state === 'aim') { this.t += dt; this.simX += (W * 0.3 - this.simX) * dt * 4; this.simFlip = false; }
      else if (this.state === 'fly') {
        this.flyT += dt / 0.85;
        const land = this.pos(this.power);
        this.simX += (land - this.simX) * dt * 3.2;
        if (this.flyT >= 1) {
          const diff = Math.abs(this.power - this.target);
          let pts = 0, msg = 'Missed… Simba runs laps around the yard.';
          if (diff < 0.035) { pts = 3; msg = 'PERFECT! Caught mid-air!'; this.jump = 1; snd('fanfare'); buzz([20, 40, 20]); }
          else if (diff < 0.08) { pts = 2; msg = 'Great throw!'; snd('happy'); }
          else if (diff < 0.14) { pts = 1; msg = 'Not bad!'; snd('pop'); }
          else snd('fail');
          if (pts) snd('bark');
          this.points += pts; this.msg = msg; this.msgT = 1.4;
          this.state = 'return'; this.retT = 0; this.throws++;
        }
      } else if (this.state === 'return') {
        this.retT += dt;
        this.jump = Math.max(0, this.jump - dt * 2);
        if (this.retT > 0.45) { this.simFlip = true; this.simX += (W * 0.3 - this.simX) * dt * 3; }
        if (this.retT > 1.5) { if (this.throws >= this.max) this.state = 'done'; else { this.state = 'aim'; this.newTarget(); } }
      }
    },
    draw() {
      const g = cx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#8fcbee'); g.addColorStop(1, '#d7eefa');
      cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      cx.fillStyle = '#ffe08a'; cx.beginPath(); cx.arc(W * 0.85, H * 0.14, 28, 0, Math.PI * 2); cx.fill();
      cx.fillStyle = '#8fbf6a'; cx.fillRect(0, this.ground - 10, W, H);
      cx.fillStyle = '#7aad57'; for (let i = 0; i < W; i += 26) cx.fillRect(i, this.ground - 10, 3, 8);
      // coussin cible
      const tx = this.pos(this.target), tw = (this.x1 - this.x0) * 0.08;
      cx.fillStyle = '#ef8fb0'; cx.beginPath(); cx.ellipse(tx, this.ground + 4, tw + 8, 12, 0, 0, Math.PI * 2); cx.fill();
      cx.fillStyle = '#c9496f'; cx.beginPath(); cx.ellipse(tx, this.ground + 2, tw * 0.45, 5, 0, 0, Math.PI * 2); cx.fill();
      drawImg(imgs.nena, this.x0 - W * 0.06, this.ground + 6, Math.min(W * 0.16, 90));
      const sw = Math.min(W * 0.28, 160);
      drawImg(this.jump > 0 ? imgs.simbaHappy : imgs.simba, this.simX, this.ground + 8 - Math.sin(this.jump * Math.PI) * 60, sw, this.simFlip);
      if (this.state === 'aim') {
        const p = (Math.sin(this.t * this.speed) + 1) / 2, ax = this.pos(p);
        cx.fillStyle = '#c9496f';
        cx.beginPath(); cx.moveTo(ax, this.ground - 20); cx.lineTo(ax - 12, this.ground - 42); cx.lineTo(ax + 12, this.ground - 42); cx.fill();
        cx.setLineDash([4, 6]); cx.strokeStyle = 'rgba(201,73,111,.5)'; cx.lineWidth = 2;
        cx.beginPath(); cx.moveTo(this.x0, this.ground - 60); cx.quadraticCurveTo((this.x0 + ax) / 2, this.ground - 160, ax, this.ground - 44); cx.stroke(); cx.setLineDash([]);
      }
      if (this.state === 'fly') {
        const land = this.pos(this.power), f = this.flyT;
        const bx = this.x0 + (land - this.x0) * f, by = this.ground - 50 - Math.sin(f * Math.PI) * H * 0.35 + f * 40;
        cx.fillStyle = '#d8e650'; cx.beginPath(); cx.arc(bx, by, 10, 0, Math.PI * 2); cx.fill();
        cx.strokeStyle = '#fff'; cx.lineWidth = 2; cx.beginPath(); cx.arc(bx, by, 7, 0.4, 2.6); cx.stroke();
      }
      if (this.msgT > 0) text(this.msg, W / 2, H * 0.3, Math.min(30, W / 14), this.msg.startsWith('PERFECT') ? '#ffd36b' : '#fff');
      text(`Throw ${Math.min(this.throws + 1, this.max)} / ${this.max} · ${this.points} pts`, W / 2, H - 16, 20, '#fff');
    },
    finished() { return this.state === 'done'; },
    result() { return { score: clamp(this.points / (this.max * 3), 0, 1), label: `${this.points} of ${this.max * 3} points` }; },
    progress() { return `${Math.min(this.throws + 1, this.max)}/${this.max}`; },
  };

  /* -------------------------------------------------------------- */
  /* 3. Walk: 3 lanes, treats and puddles                            */
  /* -------------------------------------------------------------- */
  const walk = {
    title: 'Walk with Simba',
    hint: 'Swipe or tap left / right. Grab treats and flowers to sniff, dodge puddles and bikes!',
    duration: 25,
    init() {
      this.lane = 1; this.x = this.laneX(1); this.items = []; this.spawn = 0.6; this.scroll = 0;
      this.got = 0; this.goods = 0; this.hits = 0; this.muddy = false; this.shake = 0; this.pops = [];
      this.rain = !!this.opts.rain; this.snow = !!this.opts.snow;
      this.drops = Array.from({ length: 60 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 400 + Math.random() * 300 }));
    },
    laneX(i) { return W * (0.22 + 0.28 * i); },
    move(dir) { const n = clamp(this.lane + dir, 0, 2); if (n !== this.lane) { this.lane = n; snd('click'); buzz(8); } },
    pointer(kind, x, y) {
      if (kind === 'down') { ptr.sx = x; ptr.sy = y; ptr.st = performance.now(); }
      if (kind === 'up') {
        const dx = x - ptr.sx;
        if (Math.abs(dx) > 30) this.move(dx > 0 ? 1 : -1);
        else this.move(x < W / 2 ? -1 : 1);
      }
    },
    key(k) { if (k === 'ArrowLeft') this.move(-1); if (k === 'ArrowRight') this.move(1); },
    update(dt) {
      const speed = H * (0.42 + elapsed * 0.018);
      this.scroll = (this.scroll + speed * dt) % 80;
      this.x += (this.laneX(this.lane) - this.x) * Math.min(1, dt * 14);
      this.shake = Math.max(0, this.shake - dt);
      this.spawn -= dt;
      if (this.spawn <= 0) {
        const r = Math.random();
        const kind = r < 0.38 ? 'treat' : r < 0.55 ? 'flower' : r < 0.82 ? 'puddle' : 'bike';
        const lane = Math.floor(Math.random() * 3);
        this.items.push({ kind, lane, y: -40 });
        if (kind === 'treat' || kind === 'flower') this.goods++;
        this.spawn = Math.max(0.38, 0.9 - elapsed * 0.02) * (0.7 + Math.random() * 0.6);
      }
      const sy = H * 0.8;
      for (const it of this.items) {
        it.y += speed * dt;
        if (!it.done && Math.abs(it.y - sy) < 34 && it.lane === this.lane) {
          it.done = true;
          if (it.kind === 'treat' || it.kind === 'flower') { this.got++; snd('pop'); this.pops.push({ x: this.laneX(it.lane), y: sy - 60, t: 1, s: it.kind === 'treat' ? '+1 🦴' : '+1 🌼' }); }
          else { this.hits++; this.shake = 0.4; buzz(60); if (it.kind === 'puddle') { this.muddy = true; snd('splash'); } else snd('fail'); this.pops.push({ x: this.laneX(it.lane), y: sy - 60, t: 1, s: it.kind === 'puddle' ? 'Splash!' : 'Ouch!' }); }
        }
      }
      this.items = this.items.filter((it) => it.y < H + 60 && !(it.done && (it.kind === 'treat' || it.kind === 'flower')));
      for (const p of this.pops) { p.t -= dt; p.y -= 40 * dt; }
      this.pops = this.pops.filter((p) => p.t > 0);
      for (const d of this.drops) { d.y += d.v * dt * (this.snow ? 0.15 : 1); d.x += this.snow ? Math.sin(d.y / 30) * 0.5 : -1; if (d.y > H) { d.y = -10; d.x = Math.random() * W; } }
    },
    draw() {
      cx.save();
      if (this.shake) cx.translate((Math.random() - 0.5) * 10 * this.shake, 0);
      cx.fillStyle = this.snow ? '#eef3f6' : this.rain ? '#5f8a4c' : '#8fbf6a'; cx.fillRect(-10, 0, W + 20, H);
      const pathL = W * 0.08, pathR = W * 0.92;
      cx.fillStyle = this.rain ? '#b9ab90' : this.snow ? '#d9dde2' : '#e3cfa6'; cx.fillRect(pathL, 0, pathR - pathL, H);
      cx.fillStyle = 'rgba(0,0,0,.06)';
      for (let y = -80 + this.scroll; y < H; y += 80) { cx.fillRect(pathL, y, pathR - pathL, 3); }
      // trees along the sides
      for (let y = -120 + ((this.scroll * 1.5) % 160); y < H + 80; y += 160) {
        [[pathL * 0.4, y], [W - pathL * 0.4, y + 80]].forEach(([tx, ty]) => {
          cx.fillStyle = this.snow ? '#ffffff' : '#4f8a3e'; cx.beginPath(); cx.arc(tx, ty, Math.max(18, pathL * 0.9), 0, Math.PI * 2); cx.fill();
        });
      }
      for (const it of this.items) {
        const x = this.laneX(it.lane), y = it.y;
        if (it.kind === 'treat') {
          cx.fillStyle = '#fff3dc'; cx.strokeStyle = '#c9a27a'; cx.lineWidth = 2;
          cx.beginPath(); cx.roundRect ? cx.roundRect(x - 16, y - 5, 32, 10, 5) : cx.rect(x - 16, y - 5, 32, 10); cx.fill(); cx.stroke();
          [[-16, -5], [-16, 5], [16, -5], [16, 5]].forEach(([a, b]) => { cx.beginPath(); cx.arc(x + a, y + b, 6, 0, Math.PI * 2); cx.fill(); cx.stroke(); });
        } else if (it.kind === 'flower') {
          cx.fillStyle = '#ef8fb0'; for (let i = 0; i < 5; i++) { const a = i * 1.256; cx.beginPath(); cx.arc(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 7, 0, Math.PI * 2); cx.fill(); }
          cx.fillStyle = '#ffd36b'; cx.beginPath(); cx.arc(x, y, 6, 0, Math.PI * 2); cx.fill();
        } else if (it.kind === 'puddle') {
          cx.fillStyle = '#7a5a3a'; cx.beginPath(); cx.ellipse(x, y, 40, 18, 0, 0, Math.PI * 2); cx.fill();
          cx.fillStyle = 'rgba(255,255,255,.25)'; cx.beginPath(); cx.ellipse(x - 10, y - 4, 14, 5, 0, 0, Math.PI * 2); cx.fill();
        } else {
          cx.strokeStyle = '#3a3550'; cx.lineWidth = 4;
          cx.beginPath(); cx.arc(x, y - 22, 13, 0, Math.PI * 2); cx.stroke(); cx.beginPath(); cx.arc(x, y + 22, 13, 0, Math.PI * 2); cx.stroke();
          cx.fillStyle = '#d4513f'; cx.fillRect(x - 4, y - 18, 8, 36);
        }
      }
      const sy = H * 0.8, bob = Math.sin(elapsed * 14) * 3;
      cx.strokeStyle = '#c9496f'; cx.lineWidth = 3;
      cx.beginPath(); cx.moveTo(this.x - 12, sy - 40 + bob); cx.quadraticCurveTo(this.x, H, W / 2, H + 10); cx.stroke();
      drawImg(this.muddy ? imgs.simbaMud : imgs.simba, this.x, sy + 30 + bob, Math.min(W * 0.26, 140));
      for (const p of this.pops) { cx.globalAlpha = Math.max(0, p.t); text(p.s, p.x, p.y, 20, '#fff'); }
      cx.globalAlpha = 1;
      if (this.rain || this.snow) {
        cx.strokeStyle = this.snow ? '#fff' : 'rgba(220,235,255,.6)'; cx.fillStyle = '#fff'; cx.lineWidth = 1.5;
        for (const d of this.drops) {
          if (this.snow) { cx.beginPath(); cx.arc(d.x, d.y, 2.5, 0, Math.PI * 2); cx.fill(); }
          else { cx.beginPath(); cx.moveTo(d.x, d.y); cx.lineTo(d.x - 3, d.y + 12); cx.stroke(); }
        }
      }
      cx.restore();
      text(`🦴 ${this.got}   💥 ${this.hits}`, W / 2, H - 16, 20, '#fff');
    },
    finished() { return false; },
    result() {
      const base = this.goods ? this.got / Math.max(4, this.goods * 0.85) : 0.5;
      return { score: clamp(base - this.hits * 0.12, 0, 1), muddy: this.muddy, hits: this.hits, label: `${this.got} finds · ${this.hits} bump(s)` };
    },
  };

  const GAMES = { brush, fetch: fetchGame, walk };

  /* -------------------------------------------------------------- */
  /* Loop and UI                                                      */
  /* -------------------------------------------------------------- */
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (phase === 'count') {
      countdown -= dt;
      game.draw();
      cx.fillStyle = 'rgba(38,35,64,.35)'; cx.fillRect(0, 0, W, H);
      text(countdown > 0.5 ? String(Math.ceil(countdown - 0.5)) : 'Go!', W / 2, H / 2, 64, '#ffd36b');
      if (countdown <= 0) { phase = 'play'; snd('success'); }
    } else if (phase === 'play') {
      elapsed += dt;
      game.update(dt);
      game.draw();
      const left = game.duration ? Math.max(0, game.duration - elapsed) : null;
      $('mg-timer').textContent = left !== null ? Math.ceil(left) + ' s' : game.progress();
      if (game.finished() || (left !== null && left <= 0)) { finish(game.result()); return; }
    }
    raf = requestAnimationFrame(loop);
  }

  function start(type, opts) {
    cv = $('mg-canvas'); cx = cv.getContext('2d');
    game = GAMES[type]; game.opts = opts || {};
    onEnd = opts.onEnd;
    prepare(opts);
    $('mg').hidden = false;
    $('mg-result').hidden = true;
    $('mg-title').textContent = game.title;
    $('mg-hint').textContent = game.hint;
    $('mg-timer').textContent = game.duration ? game.duration + ' s' : '';
    requestAnimationFrame(() => {
      resize();
      elapsed = 0;
      game.init();
      phase = 'count'; countdown = 3.4;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    });
  }

  let pending = null;
  function finish(res) {
    phase = 'off';
    cancelAnimationFrame(raf);
    pending = res;
    const pct = Math.round(res.score * 100);
    $('mg-score').textContent = pct + '%';
    $('mg-verdict').textContent = res.skipped ? 'Quick version' : pct >= 90 ? 'Amazing!' : pct >= 65 ? 'Very good!' : pct >= 35 ? 'Not bad!' : 'You’ll do better next time';
    $('mg-detail').textContent = res.label || '';
    $('mg-result').hidden = false;
    snd(pct >= 65 ? 'fanfare' : 'pop');
    $('mg-continue').focus();
  }
  function close() {
    $('mg').hidden = true;
    const cb = onEnd, r = pending;
    onEnd = null; pending = null; game = null;
    if (cb) cb(r);
  }

  function local(e) { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  let bound = false;
  function bind() {
    if (bound) return; bound = true;
    const c = $('mg-canvas');
    c.addEventListener('pointerdown', (e) => {
      if (phase !== 'play') return;
      c.setPointerCapture && c.setPointerCapture(e.pointerId);
      const [x, y] = local(e); ptr.down = true; ptr.x = x; ptr.y = y; game.pointer('down', x, y);
    });
    c.addEventListener('pointermove', (e) => { if (phase !== 'play') return; const [x, y] = local(e); ptr.x = x; ptr.y = y; if (ptr.down) game.pointer('move', x, y); });
    const up = (e) => { if (!ptr.down) return; ptr.down = false; if (phase !== 'play') return; const [x, y] = local(e); game.pointer('up', x, y); };
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    window.addEventListener('keydown', (e) => {
      if (phase !== 'play' || !game) return;
      if (game.key) game.key(e.key);
      if (e.key === ' ' && game === fetchGame) { e.preventDefault(); game.pointer('down'); }
    });
    window.addEventListener('resize', () => { if (phase !== 'off' && cv) resize(); });
    $('mg-skip').addEventListener('click', () => { if (phase === 'off') return; finish({ score: 0.6, skipped: true, label: 'Nena handles it without the mini-game.' }); });
    $('mg-continue').addEventListener('click', close);
  }
  document.addEventListener('DOMContentLoaded', bind);
  if (document.readyState !== 'loading') bind();

  return { start, get active() { return phase !== 'off' || !!pending; } };
})();
