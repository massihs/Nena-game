/* World3D: real-time 3D rendering of the apartment and the Tehran street with Three.js.
   The game logic stays in game.js. This module reads the game state and the actor
   elements (their position and CSS classes) and renders them as 3D characters.
   If WebGL is unavailable, the game keeps its 2D SVG scenes. */
window.World3D = (function () {
  'use strict';
  const T = window.THREE;
  let ok = false, renderer, scene, camera, container, clock;
  let rooms = {}, cur = null, S = null;
  let hemi, sun, lamp, lamp2;
  const chars = {};
  let visW = 7, groundTarget = -0.86, camBase = null;
  const tmpV = new (T ? T.Vector3 : Object)();

  /* ------------------------------------------------------------------ */
  /* Materials, textures and modeling helpers                            */
  /* ------------------------------------------------------------------ */
  const matCache = {};
  const lin = (c) => new T.Color(c).convertSRGBToLinear();
  const setLin = (color, c) => color.set(c).convertSRGBToLinear();
  function mat(color, o) {
    o = o || {};
    const key = [color, o.r, o.m, o.e, o.ei, o.o, o.map ? o.map.uuid : '', o.side].join('|');
    if (!o.unique && matCache[key]) return matCache[key];
    const m = new T.MeshStandardMaterial({
      color: lin(color), roughness: o.r != null ? o.r : 0.8, metalness: o.m || 0,
      emissive: lin(o.e || '#000000'), emissiveIntensity: o.ei != null ? o.ei : 1,
      transparent: o.o != null && o.o < 1, opacity: o.o != null ? o.o : 1, map: o.map || null,
      side: o.side || T.FrontSide,
    });
    if (!o.unique) matCache[key] = m;
    return m;
  }
  function add(parent, geo, material, x, y, z, o) {
    const m = new T.Mesh(geo, material);
    m.position.set(x || 0, y || 0, z || 0);
    o = o || {};
    m.castShadow = o.cast !== false;
    m.receiveShadow = o.recv !== false;
    if (o.rx) m.rotation.x = o.rx;
    if (o.ry) m.rotation.y = o.ry;
    if (o.rz) m.rotation.z = o.rz;
    if (o.s) m.scale.set(o.s[0], o.s[1], o.s[2]);
    parent.add(m);
    return m;
  }
  const box = (p, w, h, d, c, x, y, z, o) => add(p, new T.BoxGeometry(w, h, d), c.isMaterial ? c : mat(c, o), x, y, z, o);
  const cyl = (p, rt, rb, h, c, x, y, z, o) => add(p, new T.CylinderGeometry(rt, rb, h, (o && o.seg) || 24), c.isMaterial ? c : mat(c, o), x, y, z, o);
  const sph = (p, r, c, x, y, z, o) => add(p, new T.SphereGeometry(r, (o && o.seg) || 20, (o && o.seg) ? Math.max(8, o.seg - 4) : 16), c.isMaterial ? c : mat(c, o), x, y, z, o);
  const plane = (p, w, h, c, x, y, z, o) => add(p, new T.PlaneGeometry(w, h), c.isMaterial ? c : mat(c, o), x, y, z, Object.assign({ cast: false }, o));
  const torus = (p, r, t, c, x, y, z, o) => add(p, new T.TorusGeometry(r, t, 10, 28, (o && o.arc) || Math.PI * 2), c.isMaterial ? c : mat(c, o), x, y, z, o);

  function canvasTex(w, h, draw, repeat) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    t.anisotropy = 4;
    if (repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  }
  const TEX = {};
  function texWood() {
    return TEX.wood || (TEX.wood = canvasTex(512, 512, (g, w, h) => {
      const cols = ['#b98457', '#a8744b', '#c08d61', '#ad7a4f'];
      for (let r = 0; r < 8; r++) {
        let x = -((r * 97) % 200);
        while (x < w) {
          const len = 180 + ((r * 31 + x) % 120);
          g.fillStyle = cols[(r + Math.abs(x)) % 4];
          g.fillRect(x, r * 64, len, 64);
          g.strokeStyle = 'rgba(70,35,10,.35)'; g.lineWidth = 2; g.strokeRect(x, r * 64, len, 64);
          g.strokeStyle = 'rgba(90,50,20,.12)';
          for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x, r * 64 + 12 + k * 13); g.bezierCurveTo(x + len * 0.3, r * 64 + 8 + k * 13, x + len * 0.6, r * 64 + 18 + k * 13, x + len, r * 64 + 12 + k * 13); g.stroke(); }
          x += len;
        }
      }
    }, [3, 3]));
  }
  function texWall(base, stripe) {
    const k = 'wall' + base + stripe;
    return TEX[k] || (TEX[k] = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      g.fillStyle = stripe;
      for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 12, h);
      for (let x = 22; x < w; x += 64) for (let y = 20; y < h; y += 64) { g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill(); }
    }, [6, 2]));
  }
  function texTiles(base, grout, rep) {
    const k = 'tile' + base + grout;
    return TEX[k] || (TEX[k] = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = grout; g.fillRect(0, 0, w, h);
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
        g.fillStyle = base; g.fillRect(x * 64 + 3, y * 64 + 3, 58, 58);
        g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x * 64 + 6, y * 64 + 6, 52, 10);
      }
    }, rep || [8, 3]));
  }
  function texPersian() {
    return TEX.rug || (TEX.rug = canvasTex(512, 320, (g, w, h) => {
      g.fillStyle = '#8c1f30'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#1f2a5a'; g.lineWidth = 22; g.strokeRect(22, 22, w - 44, h - 44);
      g.strokeStyle = '#f0d9a8'; g.lineWidth = 4; g.strokeRect(40, 40, w - 80, h - 80); g.strokeRect(10, 10, w - 20, h - 20);
      g.fillStyle = '#a8293c'; g.fillRect(46, 46, w - 92, h - 92);
      const cx = w / 2, cy = h / 2;
      g.fillStyle = '#f0d9a8'; g.beginPath(); g.ellipse(cx, cy, 120, 80, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#1f2a5a'; g.beginPath(); g.ellipse(cx, cy, 86, 56, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#c9496f'; g.beginPath(); g.ellipse(cx, cy, 50, 32, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#f0d9a8'; g.beginPath(); g.ellipse(cx, cy, 18, 12, 0, 0, Math.PI * 2); g.fill();
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(a) * 104, cy + Math.sin(a) * 68, 6, 0, Math.PI * 2); g.fillStyle = i % 2 ? '#1f2a5a' : '#e8b73a'; g.fill(); }
      [[70, 70], [w - 70, 70], [70, h - 70], [w - 70, h - 70]].forEach(([x, y]) => { g.fillStyle = '#1f2a5a'; g.beginPath(); g.moveTo(x, y - 20); g.lineTo(x + 20, y); g.lineTo(x, y + 20); g.lineTo(x - 20, y); g.fill(); g.fillStyle = '#e8b73a'; g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = 'rgba(0,0,0,.06)'; for (let i = 0; i < 1400; i++) g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }));
  }
  function texText(lines, bg, fg, w, h, size) {
    return canvasTex(w || 256, h || 128, (g, W, H) => {
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
      lines.forEach((l, i) => { g.font = `800 ${(size || 34) - i * 8}px "Baloo 2", "Trebuchet MS", sans-serif`; g.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * (size || 34) * 1.05); });
    });
  }
  function texBuilding(cols, rows, base, seed) {
    const day = canvasTex(256, 512, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      const cw = w / cols, rh = h / rows;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        g.fillStyle = '#9fb9cc'; g.fillRect(c * cw + cw * 0.18, r * rh + rh * 0.2, cw * 0.64, rh * 0.55);
        g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(c * cw + cw * 0.18, r * rh + rh * 0.2, cw * 0.64, rh * 0.1);
        g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(c * cw, r * rh + rh * 0.86, cw, rh * 0.08);
      }
    });
    const night = canvasTex(256, 512, (g, w, h) => {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      const cw = w / cols, rh = h / rows;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (((r * 7 + c * 3 + seed) % 5) < 3) { g.fillStyle = (r + c + seed) % 4 ? '#ffcf73' : '#ffe9b0'; g.fillRect(c * cw + cw * 0.18, r * rh + rh * 0.2, cw * 0.64, rh * 0.55); }
      }
    });
    return { day, night };
  }

  /* ------------------------------------------------------------------ */
  /* Time of day                                                          */
  /* ------------------------------------------------------------------ */
  function nightLevel(t) {
    const h = t / 60;
    if (h < 6.5) return 0.9;
    if (h < 8) return 0.9 * (8 - h) / 1.5;
    if (h < 18.5) return 0;
    if (h < 21) return 0.8 * (h - 18.5) / 2.5;
    return Math.min(0.92, 0.8 + (h - 21) * 0.05);
  }
  function skyColor(s) {
    const h = (s.time / 60) % 24, w = s.today.weather;
    const night = new T.Color('#1a1d40');
    let day = new T.Color(w === 'pluie' ? '#9aa6b6' : w === 'neige' ? '#d3dde7' : w === 'nuages' ? '#a9c6dc' : '#8fcbee');
    if ((h >= 6 && h < 8.2) || (h >= 17.5 && h < 21.5)) day = new T.Color(w === 'pluie' ? '#a99aa0' : '#f2a07a');
    return day.lerp(night, nightLevel(s.time)).convertSRGBToLinear();
  }

  /* ------------------------------------------------------------------ */
  /* Shared room pieces                                                  */
  /* ------------------------------------------------------------------ */
  const W = 15, BACK = -3.6;
  function shell(g, o) {
    const floorMat = o.floor === 'tiles' ? mat('#ffffff', { map: texTiles(o.floorTile || '#efe8de', '#cfc6b8', [10, 7]), r: 0.6 }) : mat('#ffffff', { map: texWood(), r: 0.7 });
    plane(g, W + 6, 12, floorMat, 0, 0, 2.4, { rx: -Math.PI / 2, recv: true });
    const wallMat = o.wallTile ? mat('#ffffff', { map: texTiles(o.wallTile, '#ffffff', [9, 3]), r: 0.5 }) : mat('#ffffff', { map: texWall(o.wall, o.stripe) });
    plane(g, W + 6, 9.5, wallMat, 0, 4.75, BACK, { recv: true });
    const side = mat(o.wall || '#e8d8c4', { r: 0.9 });
    plane(g, 12, 9.5, side, -(W / 2 + 3), 4.75, 2.4, { ry: Math.PI / 2, recv: true });
    plane(g, 12, 9.5, side, (W / 2 + 3), 4.75, 2.4, { ry: -Math.PI / 2, recv: true });
    box(g, W + 6, 0.28, 0.12, '#f4ead9', 0, 0.14, BACK + 0.06);
    if (o.wainscot) { box(g, W + 6, 0.08, 0.1, o.wainscot, 0, 1.5, BACK + 0.05); }
    box(g, W + 6, 0.3, 0.3, '#fbf5ec', 0, 7.0, BACK + 0.15);
    plane(g, W + 6, 12, mat('#fbf5ec', { e: '#f4e6d0', ei: 0.35 }), 0, 7.15, 2.4, { rx: Math.PI / 2, cast: false });
  }
  const windows = [];
  function windowOn(g, x, y, w, h, curtain) {
    const glass = mat('#9fd0ee', { e: '#9fd0ee', ei: 0.9, unique: true, r: 0.2 });
    plane(g, w, h, glass, x, y, BACK + 0.02);
    windows.push(glass);
    const fr = '#6b4632';
    box(g, w + 0.24, 0.14, 0.18, fr, x, y + h / 2, BACK + 0.08); box(g, w + 0.24, 0.14, 0.18, fr, x, y - h / 2, BACK + 0.08);
    box(g, 0.14, h, 0.18, fr, x - w / 2, y, BACK + 0.08); box(g, 0.14, h, 0.18, fr, x + w / 2, y, BACK + 0.08);
    box(g, 0.08, h, 0.1, fr, x, y, BACK + 0.06); box(g, w, 0.08, 0.1, fr, x, y, BACK + 0.06);
    box(g, w + 0.6, 0.12, 0.4, '#7d553d', x, y - h / 2 - 0.1, BACK + 0.2);
    if (curtain) {
      [-1, 1].forEach((sgn) => {
        for (let i = 0; i < 4; i++) cyl(g, 0.12, 0.16, h + 0.7, curtain, x + sgn * (w / 2 + 0.25 + i * 0.16), y - 0.1, BACK + 0.25 + (i % 2) * 0.06, { seg: 10 });
      });
      cyl(g, 0.04, 0.04, w + 1.8, '#8a6044', x, y + h / 2 + 0.3, BACK + 0.25, { rz: Math.PI / 2 });
    }
  }
  let coverTex = null;
  function photo(g, x, y, s) {
    if (!coverTex) { coverTex = new T.TextureLoader().load('assets/nena-simba.jpg'); coverTex.encoding = T.sRGBEncoding; }
    box(g, s + 0.22, s + 0.22, 0.08, '#8a5a3c', x, y, BACK + 0.05);
    box(g, s + 0.08, s + 0.08, 0.09, '#fff8ee', x, y, BACK + 0.06);
    plane(g, s, s, mat('#ffffff', { map: coverTex, r: 0.5 }), x, y, BACK + 0.11);
  }
  function plant(g, x, z, sc) {
    const p = new T.Group(); p.position.set(x, 0, z); p.scale.setScalar(sc || 1); g.add(p);
    cyl(p, 0.42, 0.32, 0.7, '#c97b52', 0, 0.35, 0, { seg: 18 });
    cyl(p, 0.44, 0.44, 0.08, '#b06a44', 0, 0.72, 0, { seg: 18 });
    const leaf = ['#5f8f45', '#77ab58', '#6aa04c'];
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4, r = 0.25 + (i % 3) * 0.12;
      sph(p, 0.32 - (i % 3) * 0.04, leaf[i % 3], Math.cos(a) * r, 1.1 + (i % 4) * 0.22, Math.sin(a) * r, { s: [1, 1.5, 0.6], ry: a, seg: 12 });
    }
    return p;
  }
  function fluffs(g, spots) {
    return spots.map(([x, z]) => {
      const f = new T.Group(); f.position.set(x, 0, z); g.add(f);
      sph(f, 0.14, '#d98f45', 0, 0.1, 0, { seg: 10 }); sph(f, 0.11, '#eaa75c', 0.14, 0.09, 0.04, { seg: 10 }); sph(f, 0.1, '#c97f3a', -0.12, 0.08, 0.03, { seg: 10 });
      return f;
    });
  }
  function zSprite(txt, color) {
    const sm = new T.SpriteMaterial({ map: texText([txt], 'rgba(0,0,0,0)', color, 128, 128, 90), transparent: true, depthWrite: false });
    return new T.Sprite(sm);
  }

  /* ------------------------------------------------------------------ */
  /* Rooms                                                               */
  /* ------------------------------------------------------------------ */
  const BUILD = {
    chambre() {
      const g = new T.Group(), r = { g };
      shell(g, { wall: '#f1ddcb', stripe: '#f8e9dc', wainscot: '#e5c9b2' });
      windowOn(g, 3.8, 3.2, 2.4, 2.1, '#efe0cc');
      photo(g, -0.1, 3.4, 1.1);
      box(g, 0.85, 1.05, 0.06, '#c99a6a', 1.35, 3.3, BACK + 0.05); plane(g, 0.72, 0.9, mat('#fff8ee'), 1.35, 3.3, BACK + 0.09);
      sph(g, 0.18, '#f2a94e', 1.35, 3.45, BACK + 0.12, { s: [1, 1, 0.3] });
      // bed
      const bx = -4.2;
      box(g, 3.8, 2.0, 0.25, '#8f5f3f', bx, 1.0, BACK + 0.2);
      for (let i = 0; i < 4; i++) sph(g, 0.08, '#b9875f', bx - 1.2 + i * 0.8, 1.4, BACK + 0.34, { seg: 8 });
      box(g, 3.8, 0.5, 4.2, '#a77450', bx, 0.3, BACK + 2.25);
      box(g, 3.6, 0.36, 4.0, '#f6ebdb', bx, 0.72, BACK + 2.25);
      r.duvetMade = new T.Group(); g.add(r.duvetMade);
      box(r.duvetMade, 3.75, 0.24, 2.9, '#e9d2b3', bx, 0.98, BACK + 2.85);
      cyl(r.duvetMade, 0.2, 0.2, 3.75, '#fff6e8', bx, 1.02, BACK + 1.42, { rz: Math.PI / 2 });
      r.duvetMessy = new T.Group(); g.add(r.duvetMessy);
      [[-1.1, 2.4], [0.2, 2.9], [1.1, 2.1], [-0.4, 3.6], [0.9, 3.5]].forEach(([dx, dz], i) => sph(r.duvetMessy, 0.75, '#e9d2b3', bx + dx, 0.9, BACK + dz, { s: [1.2, 0.35, 1], ry: i }));
      sph(g, 0.5, '#fffaf2', bx - 0.9, 1.05, BACK + 0.8, { s: [1.3, 0.45, 0.8] }); sph(g, 0.5, '#fffaf2', bx + 0.9, 1.05, BACK + 0.8, { s: [1.3, 0.45, 0.8] });
      // nightstand & lamp
      box(g, 1.0, 1.0, 0.8, '#8a5a3c', -1.6, 0.5, BACK + 0.5);
      sph(g, 0.06, '#e8c38f', -1.6, 0.6, BACK + 0.92, { seg: 8 });
      cyl(g, 0.05, 0.05, 0.6, '#6d4630', -1.75, 1.3, BACK + 0.5);
      r.shade = cyl(g, 0.22, 0.38, 0.45, '#f4e2c4', -1.75, 1.75, BACK + 0.5, { e: '#ffcf73', ei: 0, unique: true, seg: 20 });
      r.lampPos = new T.Vector3(-1.75, 1.7, BACK + 0.9);
      cyl(g, 0.12, 0.1, 0.22, '#fffaf2', -1.35, 1.11, BACK + 0.5); torus(g, 0.07, 0.02, '#fffaf2', -1.2, 1.12, BACK + 0.5, { ry: Math.PI / 2 });
      // shelf, books, plant
      box(g, 2.2, 0.1, 0.4, '#7d553d', -4.2, 3.6, BACK + 0.2);
      ['#c9496f', '#5f8f45', '#e8b73a', '#4a7bd0', '#8a5bc9'].forEach((c, i) => box(g, 0.18, 0.5 + (i % 3) * 0.08, 0.32, c, -5.0 + i * 0.22, 3.92, BACK + 0.22));
      plant(g, 5.9, BACK + 0.9, 1.1);
      r.plant2 = plant(g, 6.3, 0.6, 0.9);
      cyl(g, 2.4, 2.4, 0.03, '#f0b6c8', 0.7, 0.015, 0.9, { s: [1, 1, 0.55], seg: 40 });
      cyl(g, 1.7, 1.7, 0.035, '#fff3f7', 0.7, 0.02, 0.9, { s: [1, 1, 0.55], seg: 40 });
      r.dogBed = new T.Group(); g.add(r.dogBed);
      torus(r.dogBed, 0.8, 0.28, '#b5476d', 4.6, 0.25, -0.4, { rx: Math.PI / 2 }); cyl(r.dogBed, 0.8, 0.8, 0.15, '#f3c6d5', 4.6, 0.1, -0.4);
      r.fluff = fluffs(g, [[-2, 1.8], [2.6, 2.2], [-0.4, 2.8], [3.8, 1.3], [-3, 3], [1.4, 3.2], [5, 2.6]]);
      r.cam = { pos: [0.4, 3.1, 12.5], target: [0.2, 1.8, 0] };
      r.update = (s) => {
        r.duvetMade.visible = s.maison.lit; r.duvetMessy.visible = !s.maison.lit;
        r.dogBed.visible = has(s, 'panier'); r.plant2.visible = has(s, 'plante');
      };
      return r;
    },
    hall() {
      const g = new T.Group(), r = { g };
      shell(g, { wall: '#f4e6d3', stripe: '#fbf1e4', wainscot: '#e2cdb4' });
      const doors = [
        { x: -5.2, c: '#f3c6d5', sign: ['NENA'], bg: '#fff8ee', fg: '#c9496f' },
        { x: -1.75, c: '#bcd6e6', sign: ['NEGIN', 'DO NOT WAKE'], bg: '#fff8ee', fg: '#4a5a8a' },
        { x: 1.75, c: '#3d3a5c', sign: ['KEEP OUT!', 'NASIM'], bg: '#ef5f7f', fg: '#ffffff' },
        { x: 5.2, c: '#d8c3a5', sign: ['MAMAN', 'BABA'], bg: '#fff8ee', fg: '#7a5c4e' },
      ];
      doors.forEach((d) => {
        box(g, 2.3, 4.2, 0.12, '#e6d3bd', d.x, 2.1, BACK + 0.05);
        box(g, 2.0, 4.0, 0.14, d.c, d.x, 2.0, BACK + 0.1);
        box(g, 1.6, 1.4, 0.04, d.c, d.x, 2.9, BACK + 0.19, { s: [1, 1, 1] }).material = mat(new T.Color(d.c).multiplyScalar(0.92).getStyle());
        box(g, 1.6, 1.6, 0.04, d.c, d.x, 1.0, BACK + 0.19).material = mat(new T.Color(d.c).multiplyScalar(0.92).getStyle());
        sph(g, 0.09, '#d9b25c', d.x + 0.75, 1.9, BACK + 0.24, { m: 0.8, r: 0.3, seg: 12 });
        plane(g, 1.2, 0.6, mat('#ffffff', { map: texText(d.sign, d.bg, d.fg, 256, 128, 40) }), d.x, 3.0, BACK + 0.22, { rz: d.x > 1 && d.x < 2 ? 0.08 : 0 });
      });
      r.zz = [0, 1, 2].map((i) => { const z = zSprite('z', '#7a7fb8'); z.scale.setScalar(0.5 + i * 0.2); z.position.set(-0.6 + i * 0.25, 3.9 + i * 0.4, BACK + 0.4); g.add(z); return z; });
      plane(g, 9, 2.6, mat('#ffffff', { map: texPersian(), r: 0.95 }), 0, 0.012, 0.6, { rx: -Math.PI / 2, recv: true });
      box(g, 1.2, 1.4, 0.6, '#8a5a3c', 7.2, 0.7, BACK + 0.4);
      [[6.95, 0.98, '#ef8fb0'], [7.4, 0.98, '#ef8fb0'], [6.95, 0.45, '#6b6f7e'], [7.4, 0.45, '#6b6f7e']].forEach(([x, y, c]) => sph(g, 0.15, c, x, y, BACK + 0.75, { s: [1, 0.5, 1.6], seg: 10 }));
      r.fluff = fluffs(g, [[-3, 2], [2.4, 2.4], [0, 3], [4, 1.6], [-4.4, 2.8], [1.2, 3.4], [5.4, 2.8]]);
      r.cam = { pos: [0, 3.1, 12.5], target: [0, 1.9, 0] };
      r.update = () => {};
      r.tick = (t) => { r.zz.forEach((z, i) => { z.position.y = 3.9 + i * 0.4 + Math.sin(t * 1.5 + i) * 0.12; z.material.opacity = 0.6 + 0.4 * Math.sin(t * 1.5 + i); }); };
      return r;
    },
    sdb() {
      const g = new T.Group(), r = { g };
      shell(g, { wallTile: '#d4e6e8', floor: 'tiles', floorTile: '#efe8de' });
      // bathtub
      const tx = -4.0;
      box(g, 3.8, 1.2, 2.0, '#fffdf9', tx, 0.6, BACK + 1.1, { r: 0.25 });
      box(g, 3.4, 0.2, 1.6, '#bfe1ee', tx, 1.05, BACK + 1.1, { r: 0.1, m: 0.1, o: 0.95 });
      for (let i = 0; i < 9; i++) sph(g, 0.16 + (i % 3) * 0.06, '#ffffff', tx - 1.3 + i * 0.32, 1.2 + (i % 2) * 0.08, BACK + 0.6 + (i % 3) * 0.35, { r: 0.2, seg: 12 });
      box(g, 0.12, 0.6, 0.12, '#c4ccd2', tx + 1.6, 1.5, BACK + 0.3, { m: 0.8, r: 0.3 });
      cyl(g, 0.04, 0.04, 4.6, '#c4ccd2', tx, 4.1, BACK + 2.2, { rz: Math.PI / 2, m: 0.8 });
      for (let i = 0; i < 6; i++) cyl(g, 0.14, 0.18, 3.0, '#f3c6d5', tx - 2.1 + i * 0.22, 2.6, BACK + 2.2 + (i % 2) * 0.08, { seg: 10 });
      // sink and mirror
      cyl(g, 0.22, 0.32, 1.6, '#f2ede6', 0.5, 0.8, BACK + 0.5);
      box(g, 1.6, 0.3, 1.0, '#fffdf9', 0.5, 1.7, BACK + 0.6, { r: 0.2 });
      box(g, 0.1, 0.35, 0.1, '#c4ccd2', 0.5, 2.0, BACK + 0.25, { m: 0.8, r: 0.3 });
      const mirror = add(g, new T.CircleGeometry(0.9, 40), mat('#d9e8ee', { m: 0.05, r: 0.12 }), 0.5, 3.3, BACK + 0.04, { cast: false });
      mirror.scale.set(0.85, 1.15, 1);
      torus(g, 0.9, 0.06, '#d8c2a8', 0.5, 3.3, BACK + 0.06, { s: [0.85, 1.15, 1] });
      // washing machine & basket
      box(g, 1.5, 1.8, 1.3, '#f8f6f3', 3.6, 0.9, BACK + 0.75, { r: 0.4 });
      torus(g, 0.42, 0.07, '#cfd8dd', 3.6, 0.85, BACK + 1.42, { m: 0.6, r: 0.3 });
      add(g, new T.CircleGeometry(0.4, 30), mat('#8fb3c4', { m: 0.3, r: 0.1, o: 0.85 }), 3.6, 0.85, BACK + 1.41, { cast: false });
      sph(g, 0.06, '#e98aab', 3.2, 1.62, BACK + 1.41, { seg: 8 }); sph(g, 0.06, '#8fcf8f', 3.4, 1.62, BACK + 1.41, { seg: 8 });
      cyl(g, 0.55, 0.45, 0.8, '#c9a67a', 5.2, 0.4, BACK + 0.9, { seg: 16 });
      r.linge = [0, 1, 2].map((i) => sph(g, 0.32, ['#f19bb8', '#9cc2d9', '#f6d9b8'][i], 5.1 + i * 0.12, 0.85 + i * 0.12, BACK + 0.9, { s: [1.2, 0.5, 1], seg: 12 }));
      box(g, 0.9, 1.2, 0.1, '#f6d9b8', 6.6, 2.6, BACK + 0.12); cyl(g, 0.03, 0.03, 1.2, '#c4ccd2', 6.6, 3.25, BACK + 0.15, { rz: Math.PI / 2 });
      cyl(g, 2.0, 2.0, 0.03, '#9cc2d9', 0.8, 0.015, 1.0, { s: [1, 1, 0.5], seg: 36 });
      r.fluff = fluffs(g, [[-2, 2], [2.4, 2.4], [0, 3], [4, 2], [-3.4, 3.2], [1.2, 3.4], [5.4, 2.8]]);
      r.cam = { pos: [0.3, 3.1, 12.5], target: [0.2, 1.8, 0] };
      r.update = (s) => { r.linge.forEach((m, i) => { m.visible = i < Math.min(3, s.maison.linge); }); };
      return r;
    },
    cuisine() {
      const g = new T.Group(), r = { g };
      shell(g, { wall: '#f6e6cd', stripe: '#fbefdc' });
      plane(g, 7.4, 1.4, mat('#ffffff', { map: texTiles('#e6f0ea', '#ffffff', [10, 2]) }), -2.6, 1.95, BACK + 0.02);
      windowOn(g, -3.4, 4.0, 1.8, 1.3, null);
      // lower cabinets & counter
      box(g, 7.4, 1.4, 1.1, '#a8744d', -2.6, 0.7, BACK + 0.6);
      for (let i = 0; i < 5; i++) { box(g, 1.3, 1.1, 0.04, '#b98157', -5.6 + i * 1.5, 0.72, BACK + 1.17); box(g, 0.3, 0.06, 0.06, '#e8c38f', -5.6 + i * 1.5, 1.1, BACK + 1.2, { m: 0.6 }); }
      box(g, 7.6, 0.12, 1.25, '#efe3cf', -2.6, 1.46, BACK + 0.62, { r: 0.35 });
      // upper cabinets
      for (let i = 0; i < 3; i++) { box(g, 1.6, 1.3, 0.7, '#fffaf2', -6.0 + i * 1.75, 4.1, BACK + 0.35); box(g, 0.3, 0.06, 0.06, '#c9a27a', -6.0 + i * 1.75, 3.6, BACK + 0.72); }
      // stove & pot
      box(g, 1.2, 0.04, 0.9, '#2f2b36', -0.1, 1.53, BACK + 0.6);
      cyl(g, 0.38, 0.34, 0.5, '#e05b7b', -0.1, 1.8, BACK + 0.6, { m: 0.2, r: 0.4 });
      // samovar & tea glasses
      const sv = new T.Group(); sv.position.set(-2.6, 1.52, BACK + 0.55); g.add(sv);
      const gold = mat('#d9b866', { m: 0.85, r: 0.25 });
      cyl(sv, 0.3, 0.38, 0.15, gold, 0, 0.08, 0); cyl(sv, 0.34, 0.42, 1.0, gold, 0, 0.65, 0); cyl(sv, 0.2, 0.34, 0.2, gold, 0, 1.25, 0);
      sph(sv, 0.22, '#e05b7b', 0, 1.5, 0, { s: [1, 0.8, 1] }); sph(sv, 0.06, '#c9496f', 0, 1.7, 0, { seg: 8 });
      box(sv, 0.22, 0.06, 0.06, gold, 0.42, 0.5, 0.1);
      [0.65, 0.95].forEach((x) => { cyl(g, 0.09, 0.07, 0.24, '#c8562a', -2.6 + x, 1.65, BACK + 0.85, { o: 0.75, r: 0.1 }); cyl(g, 0.15, 0.15, 0.02, '#f2f0ea', -2.6 + x, 1.53, BACK + 0.85); });
      r.dishes = [0, 1, 2, 3, 4].map((i) => cyl(g, 0.34, 0.3, 0.06, '#fffaf2', -4.8, 1.56 + i * 0.07, BACK + 0.6, { seg: 20 }));
      r.cafe = new T.Group(); g.add(r.cafe);
      box(r.cafe, 0.5, 0.7, 0.5, '#3a3550', -5.8, 1.87, BACK + 0.5); cyl(r.cafe, 0.08, 0.07, 0.15, '#ffffff', -5.8, 1.6, BACK + 0.8);
      // fridge
      box(g, 1.7, 3.5, 1.3, '#f7f4ef', 2.4, 1.75, BACK + 0.7, { r: 0.3 });
      box(g, 1.7, 0.03, 1.32, '#ddd5ca', 2.4, 2.5, BACK + 0.7);
      box(g, 0.08, 0.6, 0.1, '#b8b0a6', 3.05, 3.0, BACK + 1.4, { m: 0.6 }); box(g, 0.08, 0.8, 0.1, '#b8b0a6', 3.05, 1.8, BACK + 1.4, { m: 0.6 });
      plane(g, 0.5, 0.6, mat('#ffffff', { map: texText(['☺'], '#ffffff', '#f2a94e', 128, 160, 90) }), 2.0, 3.0, BACK + 1.36, { rz: -0.06 });
      // pendant lamp
      cyl(g, 0.01, 0.01, 1.4, '#3a3550', -1.0, 5.7, 0.2);
      r.shade = cyl(g, 0.1, 0.5, 0.4, '#3a3550', -1.0, 4.9, 0.2, { e: '#ffcf73', ei: 0, unique: true });
      r.lampPos = new T.Vector3(-1.0, 4.4, 0.4);
      // Simba's bowls
      cyl(g, 0.42, 0.32, 0.25, '#e98aab', 4.2, 0.125, 1.2); r.kibble = cyl(g, 0.36, 0.36, 0.06, '#9a6232', 4.2, 0.24, 1.2);
      cyl(g, 0.42, 0.32, 0.25, '#7aa6c2', 5.2, 0.125, 1.3); r.water = cyl(g, 0.36, 0.36, 0.04, '#bfe6f5', 5.2, 0.22, 1.3, { r: 0.1, m: 0.2 });
      plane(g, 1.6, 0.4, mat('#ffffff', { map: texText(['SIMBA'], 'rgba(0,0,0,0)', '#7a5c4e', 256, 64, 44), o: 0.99 }), 4.7, 0.02, 1.9, { rx: -Math.PI / 2 });
      r.fluff = fluffs(g, [[-2, 2], [1.4, 2.4], [0, 3], [3.2, 2.6], [-3.4, 3.2], [-0.8, 3.6], [5.6, 2.8]]);
      r.cam = { pos: [0.2, 3.1, 12.5], target: [0, 1.9, 0] };
      r.update = (s) => {
        r.dishes.forEach((d, i) => { d.visible = i < Math.min(5, s.maison.vaisselle); });
        r.kibble.visible = s.simba.ventre <= 70;
        const lv = s.simba.eau / 100; r.water.position.y = 0.06 + lv * 0.16; setLin(r.water.material.color, lv > 0.2 ? '#bfe6f5' : '#5d88a3');
        r.cafe.visible = has(s, 'cafe');
      };
      return r;
    },
    salon() {
      const g = new T.Group(), r = { g };
      shell(g, { wall: '#efd8dc', stripe: '#f6e6e9', wainscot: '#d9b8bf' });
      windowOn(g, 0.6, 3.4, 2.2, 1.9, '#e7c3cc');
      photo(g, -3.2, 3.6, 0.95);
      // sofa
      const sx = -3.6, sz = BACK + 1.1;
      const pink = '#cf7c99', pink2 = '#e29ab3';
      box(g, 4.4, 0.7, 1.5, pink, sx, 0.45, sz + 0.3, { r: 0.9 });
      box(g, 4.4, 1.4, 0.45, pink, sx, 1.1, sz - 0.35, { r: 0.9 });
      box(g, 0.5, 1.0, 1.6, '#bd6886', sx - 2.3, 0.6, sz + 0.25); box(g, 0.5, 1.0, 1.6, '#bd6886', sx + 2.3, 0.6, sz + 0.25);
      box(g, 2.0, 0.3, 1.2, pink2, sx - 1.05, 0.92, sz + 0.35, { r: 0.9 }); box(g, 2.0, 0.3, 1.2, pink2, sx + 1.05, 0.92, sz + 0.35, { r: 0.9 });
      sph(g, 0.4, '#f6d9b8', sx - 1.3, 1.3, sz, { s: [1, 0.9, 0.45], rz: 0.2 }); sph(g, 0.38, '#fff3c4', sx + 1.3, 1.3, sz, { s: [1, 0.9, 0.45], rz: -0.2 });
      box(g, 1.2, 0.08, 1.4, '#9cc2d9', sx + 1.6, 1.12, sz + 0.4, { rz: -0.15 });
      // Persian rug and tea table
      plane(g, 7.2, 4.0, mat('#ffffff', { map: texPersian(), r: 0.95 }), 0.2, 0.012, 0.6, { rx: -Math.PI / 2, recv: true });
      box(g, 1.8, 0.1, 0.9, '#7c533a', -0.8, 0.55, -1.6); [-0.6, 0.6].forEach((dx) => [-0.3, 0.3].forEach((dz) => cyl(g, 0.05, 0.05, 0.5, '#7c533a', -0.8 + dx, 0.27, -1.6 + dz)));
      [-1.1, -0.7].forEach((x) => cyl(g, 0.07, 0.06, 0.2, '#c8562a', x, 0.7, -1.6, { o: 0.75, r: 0.1 }));
      sph(g, 0.12, '#e8b73a', -0.3, 0.65, -1.6, { seg: 10 });
      // TV
      box(g, 2.6, 0.7, 0.8, '#7c533a', 3.6, 0.35, BACK + 0.5);
      box(g, 2.3, 1.35, 0.1, '#2f2b46', 3.6, 1.6, BACK + 0.45, { r: 0.4 });
      r.tv = plane(g, 2.1, 1.18, mat('#3d3a5c', { e: '#9fd0e8', ei: 0, unique: true, r: 0.3 }), 3.6, 1.6, BACK + 0.51);
      // bookshelf
      box(g, 1.6, 4.4, 0.6, '#8f5f3f', 6.4, 2.2, BACK + 0.3);
      for (let rr = 0; rr < 4; rr++) {
        box(g, 1.5, 0.06, 0.55, '#6d4630', 6.4, 0.6 + rr * 1.0, BACK + 0.35);
        ['#c9496f', '#5f8f45', '#e8b73a', '#4a7bd0', '#8a5bc9', '#e57f22'].forEach((c, i) => box(g, 0.17, 0.55 + ((i + rr) % 3) * 0.1, 0.4, c, 5.8 + i * 0.22, 0.95 + rr * 1.0, BACK + 0.38));
      }
      // floor lamp
      cyl(g, 0.3, 0.3, 0.06, '#3a3550', -6.5, 0.03, BACK + 0.8); cyl(g, 0.04, 0.04, 3.4, '#3a3550', -6.5, 1.7, BACK + 0.8);
      r.shade = cyl(g, 0.35, 0.55, 0.6, '#f4e2c4', -6.5, 3.5, BACK + 0.8, { e: '#ffcf73', ei: 0, unique: true });
      r.lampPos = new T.Vector3(-6.2, 3.2, BACK + 1.2);
      sph(g, 0.22, '#d8e650', 1.6, 0.22, 1.6, { r: 0.6 });
      r.rope = new T.Group(); g.add(r.rope); torus(r.rope, 0.35, 0.1, '#4a7bd0', 2.6, 0.1, 2.2, { rx: Math.PI / 2, arc: Math.PI * 1.5 });
      r.robot = new T.Group(); g.add(r.robot); cyl(r.robot, 0.5, 0.5, 0.16, '#2f2b46', 4.8, 0.08, 2.0); sph(r.robot, 0.05, '#7ee08a', 4.8, 0.18, 2.0, { e: '#7ee08a', seg: 8 });
      r.plant2 = plant(g, -5.4, 2.0, 0.9);
      r.fluff = fluffs(g, [[-2, 2.2], [2.4, 2.6], [0, 3], [4, 2.4], [-4.4, 3.2], [1.2, 3.6], [5.4, 3]]);
      r.cam = { pos: [0.2, 3.1, 12.5], target: [0.1, 1.8, 0] };
      r.update = (s) => {
        const tv = s.time >= 8 * 60 && s.time <= 19 * 60 && (s.day - 1) % 7 < 5;
        r.tv.material.emissiveIntensity = tv ? 1 : 0;
        r.rope.visible = has(s, 'corde'); r.robot.visible = has(s, 'robot'); r.plant2.visible = has(s, 'plante');
      };
      return r;
    },
    dehors() {
      const g = new T.Group(), r = { g, outdoor: true };
      // ground: sidewalk, jub, road
      plane(g, 80, 12, mat('#ffffff', { map: texTiles('#d8cfc2', '#bdb3a4', [24, 4]), r: 0.85 }), 0, 0, 4, { rx: -Math.PI / 2, recv: true });
      r.sidewalk = g.children[g.children.length - 1];
      box(g, 80, 0.12, 0.5, '#9a9488', 0, 0.02, -1.95);
      r.jub = plane(g, 80, 0.36, mat('#8fb2c4', { m: 0.3, r: 0.15 }), 0, 0.03, -1.95, { rx: -Math.PI / 2 });
      r.road = plane(g, 80, 9, mat('#6f727c', { r: 0.9 }), 0, -0.01, -6.6, { rx: -Math.PI / 2, recv: true });
      for (let i = -20; i < 20; i++) plane(g, 1.6, 0.14, mat('#f4f4f4'), i * 3.2, 0.005, -6.6, { rx: -Math.PI / 2 });
      plane(g, 80, 40, mat('#9a9488'), 0, -0.02, -31, { rx: -Math.PI / 2 });
      // family tower (6 floors, 5th floor is home)
      const fam = texBuilding(4, 6, '#f2ece2', 1);
      r.famMat = mat('#ffffff', { map: fam.day, e: '#ffffff', ei: 0, unique: true });
      r.famMat.emissiveMap = fam.night;
      const tw = box(g, 6, 13, 5, r.famMat, -8.2, 6.5, -13, { cast: true });
      box(g, 6.4, 0.4, 5.4, '#ddd3c4', -8.2, 13.2, -13);
      box(g, 1.4, 2.2, 0.2, '#7d553d', -7.4, 1.1, -10.4);
      for (let f = 1; f < 6; f++) box(g, 2.4, 0.12, 0.7, '#bfb3a2', -8.2, f * 2.17 + 0.05, -10.2);
      sph(g, 0.25, '#e38c30', -9.3, 9.9, -10.45, { s: [1, 1, 0.4] });
      // city blocks
      r.blockMats = [];
      [[2, -34, 5, 7, '#c9d2de'], [9, -36, 6, 9, '#b7c3d2'], [16, -32, 5, 6, '#d4dbe5'], [-16, -36, 7, 8, '#c9d2de'], [22, -40, 6, 10, '#b7c3d2'], [-26, -40, 8, 7, '#d4dbe5'], [30, -36, 6, 8, '#c9d2de']].forEach(([x, z, w, h, c], i) => {
        const t = texBuilding(4, Math.round(h / 2), c, i + 2);
        const m = mat('#ffffff', { map: t.day, e: '#ffffff', ei: 0, unique: true }); m.emissiveMap = t.night; r.blockMats.push(m);
        box(g, w, h, 5, m, x, h / 2, z);
      });
      // Milad tower
      const milad = new T.Group(); milad.position.set(14, 0, -70); g.add(milad);
      const mm = mat('#8d9bb0', { r: 0.6 });
      cyl(milad, 0.9, 2.2, 30, mm, 0, 15, 0, { seg: 16 }); cyl(milad, 3.2, 2.4, 2.2, mm, 0, 27, 0, { seg: 20 }); cyl(milad, 2.4, 3.2, 1.4, mm, 0, 29, 0, { seg: 20 });
      cyl(milad, 0.25, 0.4, 9, mm, 0, 34.5, 0, { seg: 8 });
      r.miladLight = sph(milad, 0.4, '#ff6b6b', 0, 39.2, 0, { e: '#ff3b3b', ei: 0, unique: true, seg: 8 });
      // Alborz mountains with snow
      const mtn = mat('#9aa6c0', { r: 1 }), snowM = mat('#ffffff', { r: 0.9 });
      [[-70, 58, 34], [-35, 72, 38], [0, 62, 36], [35, 80, 42], [70, 60, 34], [100, 68, 36]].forEach(([x, h, rr]) => {
        const c = add(g, new T.ConeGeometry(rr, h, 7), mtn, x, h / 2 - 2, -120, { cast: false, recv: false });
        c.rotation.y = x;
        add(g, new T.ConeGeometry(rr * 0.32, h * 0.32, 7), snowM, x, h - h * 0.16 - 2 + 0.2, -119.6, { cast: false, recv: false }).rotation.y = x;
      });
      r.mtnMat = mtn;
      // plane trees (chenar) along the jub
      r.leaves = [];
      [-11, -4.5, 3.5, 10].forEach((x, i) => {
        const tr = new T.Group(); tr.position.set(x, 0, -2.9); tr.scale.setScalar(0.85); g.add(tr);
        cyl(tr, 0.22, 0.3, 4.2, '#d9cdb4', 0, 2.1, 0, { seg: 12 });
        for (let k = 0; k < 5; k++) box(tr, 0.2, 0.3, 0.05, '#a49478', (k % 2 ? 0.12 : -0.1), 0.8 + k * 0.7, 0.26);
        for (let k = 0; k < 7; k++) { const a = k * 0.9 + i; const lm = mat(k % 2 ? '#6aa04c' : '#5f9a4c', { unique: true }); r.leaves.push(lm); sph(tr, 1.0 + (k % 3) * 0.25, lm, Math.cos(a) * 1.0, 4.6 + (k % 3) * 0.5, Math.sin(a) * 0.8, { seg: 14 }); }
      });
      // street lamp
      cyl(g, 0.08, 0.1, 5, '#3a3a4c', 5.6, 2.5, -1.4); box(g, 1.0, 0.1, 0.1, '#3a3a4c', 5.15, 5.0, -1.4);
      r.streetBulb = box(g, 0.5, 0.2, 0.3, '#d9d9e0', 4.75, 4.9, -1.4, { e: '#ffd98a', ei: 0, unique: true });
      r.lampPos = new T.Vector3(4.75, 4.5, -1.0);
      // cars: white 4x4 and white sedan
      const white = mat('#f7f7f5', { r: 0.25, m: 0.2 }), glass = mat('#2c3150', { r: 0.1, m: 0.6 }), tire = mat('#2f2b36', { r: 0.9 }), rim = mat('#c9cfd3', { m: 0.8, r: 0.3 });
      const wheel = (p, x, y, z, rr) => { const w1 = cyl(p, rr, rr, 0.35, tire, x, y, z, { rx: Math.PI / 2, seg: 18 }); cyl(p, rr * 0.5, rr * 0.5, 0.37, rim, x, y, z, { rx: Math.PI / 2, seg: 14 }); return w1; };
      const suv = new T.Group(); suv.position.set(-1.0, 0, -4.4); g.add(suv);
      box(suv, 4.4, 1.1, 1.9, white, 0, 0.95, 0); box(suv, 3.0, 0.9, 1.75, white, -0.3, 1.9, 0);
      box(suv, 2.9, 0.7, 1.78, glass, -0.3, 1.95, 0);
      box(suv, 0.12, 0.25, 1.4, mat('#ffcf73', { e: '#ffcf73', ei: 0.4 }), 2.22, 1.05, 0); box(suv, 0.12, 0.25, 1.4, mat('#e05b5b', { e: '#e05b5b', ei: 0.4 }), -2.22, 1.05, 0);
      cyl(suv, 0.5, 0.5, 0.3, tire, -2.35, 1.1, 0, { rz: Math.PI / 2 });
      wheel(suv, 1.4, 0.45, 0.95, 0.48); wheel(suv, -1.4, 0.45, 0.95, 0.48); wheel(suv, 1.4, 0.45, -0.95, 0.48); wheel(suv, -1.4, 0.45, -0.95, 0.48);
      box(suv, 3.2, 0.08, 1.6, '#333', -0.3, 2.4, 0);
      r.sedan = new T.Group(); r.sedan.position.set(4.6, 0, -4.4); g.add(r.sedan);
      box(r.sedan, 4.2, 0.75, 1.8, white, 0, 0.7, 0); box(r.sedan, 2.2, 0.6, 1.65, white, -0.2, 1.35, 0);
      box(r.sedan, 2.1, 0.5, 1.68, glass, -0.2, 1.38, 0);
      wheel(r.sedan, 1.35, 0.38, 0.92, 0.4); wheel(r.sedan, -1.35, 0.38, 0.92, 0.4); wheel(r.sedan, 1.35, 0.38, -0.92, 0.4); wheel(r.sedan, -1.35, 0.38, -0.92, 0.4);
      // street sign
      cyl(g, 0.04, 0.04, 2.2, '#555555', 7.6, 1.1, 1.2);
      plane(g, 1.0, 0.7, mat('#ffffff', { map: texText(['کوچه', 'Narges'], '#2f6f9e', '#ffffff', 256, 180, 52) }), 7.6, 2.3, 1.22);
      // snowman for snowy days
      r.snowman = new T.Group(); g.add(r.snowman);
      sph(r.snowman, 0.5, '#ffffff', -5.6, 0.45, 2.2); sph(r.snowman, 0.34, '#ffffff', -5.6, 1.15, 2.2); add(r.snowman, new T.ConeGeometry(0.06, 0.3, 8), mat('#e57f22'), -5.6, 1.15, 2.55, { rx: Math.PI / 2 });
      r.cam = { pos: [0, 2.2, 13], target: [0, 3.4, -1] };
      r.update = (s) => {
        const snow = s.today.weather === 'neige', rain = s.today.weather === 'pluie';
        r.sedan.visible = !(s.time >= 9 * 60 && s.time < 12 * 60 && (s.day - 1) % 7 < 5);
        r.snowman.visible = snow;
        setLin(r.road.material.color, snow ? '#e8ecf0' : rain ? '#55585f' : '#6f727c');
        r.road.material.roughness = rain ? 0.3 : 0.9;
        r.leaves.forEach((m, i) => setLin(m.color, snow ? (i % 2 ? '#f4f7fa' : '#e9eef3') : i % 2 ? '#6aa04c' : '#5f9a4c'));
        setLin(r.jub.material.color, snow ? '#eef3f6' : '#8fb2c4');
      };
      return r;
    },
  };
  const has = (s, id) => s.owned && s.owned.includes(id);

  /* ------------------------------------------------------------------ */
  /* Characters                                                          */
  /* ------------------------------------------------------------------ */
  const PEOPLE = {
    nena:   { skin: '#f8cfae', hair: '#7b3d20', hair2: '#93502b', style: 'curly', top: '#f4a3c0', bottom: '#ec8eaf' },
    nasim:  { skin: '#f3c7a3', hair: '#2a1a14', hair2: '#3a251c', style: 'ponytail', top: '#3d3a5c', bottom: '#2f2b46', scale: 0.88, angry: true },
    fariba: { skin: '#f0c19c', hair: '#3a261d', hair2: '#6d5a52', style: 'bun', top: '#b5476d', bottom: '#5a3d6b', apron: true },
    mohsen: { skin: '#eebd96', hair: '#c9c6cf', hair2: '#b3afba', style: 'bald', top: '#cfe0f0', bottom: '#6b6f7e', belly: true, glasses: true, mustache: true },
  };
  function makeHuman(spec) {
    const root = new T.Group(), body = new T.Group(), head = new T.Group();
    root.add(body); body.add(head);
    const skin = mat(spec.skin, { r: 0.65 });
    const topM = mat(spec.top, { unique: true, r: 0.85 }), botM = mat(spec.bottom, { unique: true, r: 0.85 });
    const legs = [-0.2, 0.2].map((x) => cyl(body, 0.15, 0.13, 0.78, botM, x, 0.42, 0, { seg: 14 }));
    [-0.2, 0.2].forEach((x) => sph(body, 0.17, '#5a3426', x, 0.08, 0.06, { s: [1, 0.6, 1.4], seg: 12 }));
    const torso = spec.belly ? sph(body, 0.62, topM, 0, 1.2, 0.05, { s: [1, 1.05, 0.95] }) : cyl(body, 0.36, 0.46, 0.92, topM, 0, 1.22, 0, { seg: 20 });
    if (!spec.belly) sph(body, 0.37, topM, 0, 1.66, 0, { s: [1.05, 0.5, 1] });
    const arms = [-1, 1].map((sg) => {
      const a = new T.Group(); a.position.set(sg * (spec.belly ? 0.62 : 0.48), 1.6, 0); body.add(a);
      cyl(a, 0.12, 0.11, 0.75, topM, 0, -0.36, 0, { seg: 12 });
      sph(a, 0.12, skin, 0, -0.78, 0.02, { seg: 12 });
      a.rotation.z = sg * 0.12;
      return a;
    });
    if (spec.apron) { box(body, 0.6, 0.85, 0.05, '#fff8ee', 0, 1.1, spec.belly ? 0.62 : 0.45); }
    if (spec.style === 'ponytail') { box(body, 0.5, 0.18, 0.05, '#ef5f7f', 0, 1.55, 0.44, { rx: -0.2 }); }
    cyl(body, 0.12, 0.13, 0.2, skin, 0, 1.82, 0);
    head.position.set(0, 2.25, 0);
    sph(head, 0.52, skin, 0, 0, 0, { s: [1, 1.04, 0.96], seg: 28 });
    // hair
    const H1 = mat(spec.hair, { r: 0.9 }), H2 = mat(spec.hair2, { r: 0.9 });
    if (spec.style === 'curly') {
      for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; sph(head, 0.26, i % 2 ? H1 : H2, Math.cos(a) * 0.5, 0.05 + Math.sin(a) * 0.42, -0.18 - Math.abs(Math.sin(a)) * 0.05, { seg: 12 }); }
      for (let i = 0; i < 6; i++) sph(head, 0.24, i % 2 ? H1 : H2, -0.42 + i * 0.17, 0.42 + Math.sin(i) * 0.04, 0.1, { seg: 12 });
      [-1, 1].forEach((sg) => { for (let k = 0; k < 4; k++) sph(head, 0.24 - k * 0.02, k % 2 ? H1 : H2, sg * (0.52 + k * 0.03), -0.25 - k * 0.3, -0.1, { seg: 12 }); });
      sph(head, 0.55, H1, 0, 0.12, -0.12, { s: [1.08, 1.02, 1] });
    } else if (spec.style === 'ponytail') {
      sph(head, 0.55, H1, 0, 0.1, -0.06, { s: [1.04, 1, 1] });
      sph(head, 0.2, '#ef5f7f', 0, 0.42, -0.42, { seg: 10 });
      for (let k = 0; k < 4; k++) sph(head, 0.2 - k * 0.02, k % 2 ? H1 : H2, 0, 0.36 - k * 0.26, -0.6 - k * 0.06, { seg: 12 });
    } else if (spec.style === 'bun') {
      sph(head, 0.55, H1, 0, 0.1, -0.08, { s: [1.04, 1, 1] }); sph(head, 0.26, H1, 0, 0.55, -0.3);
      box(head, 0.06, 0.4, 0.06, H2, 0.28, 0.32, 0.32, { rz: -0.6 });
    } else if (spec.style === 'bald') {
      [-1, 1].forEach((sg) => sph(head, 0.24, H1, sg * 0.46, -0.02, -0.12, { s: [0.7, 1, 1.2] }));
      sph(head, 0.3, H2, 0, -0.05, -0.38, { s: [1.4, 0.8, 0.6] });
    }
    // face
    const eyes = new T.Group(); head.add(eyes);
    [-0.19, 0.19].forEach((x) => {
      sph(eyes, 0.085, '#2a130b', x, -0.02, 0.47, { s: [1, 1.2, 0.6], seg: 14 });
      sph(eyes, 0.028, '#ffffff', x + 0.03, 0.03, 0.52, { seg: 8, cast: false });
    });
    const browM = mat(spec.style === 'bald' ? '#8f8a96' : spec.hair);
    const brows = [-0.19, 0.19].map((x) => box(head, 0.18, 0.035, 0.03, browM, x, 0.17, 0.49, { rz: spec.angry ? (x < 0 ? -0.35 : 0.35) : (x < 0 ? 0.08 : -0.08) }));
    [-0.3, 0.3].forEach((x) => add(head, new T.CircleGeometry(0.09, 16), mat('#f38fae', { o: 0.5 }), x, -0.14, 0.47, { cast: false, ry: x < 0 ? -0.35 : 0.35 }));
    const mouth = torus(head, 0.07, 0.018, '#b4485a', 0, -0.22, 0.49, { arc: Math.PI, rz: spec.angry ? 0 : Math.PI });
    if (spec.angry) mouth.position.y = -0.27;
    sph(head, 0.035, new T.Color(spec.skin).multiplyScalar(0.9).getStyle(), 0, -0.08, 0.52, { seg: 8 });
    if (spec.glasses) { [-0.19, 0.19].forEach((x) => torus(head, 0.13, 0.016, '#5a4a6a', x, 0, 0.5, { m: 0.5 })); box(head, 0.12, 0.02, 0.02, '#5a4a6a', 0, 0.02, 0.51); }
    if (spec.mustache) sph(head, 0.16, H1, 0, -0.16, 0.48, { s: [1.3, 0.35, 0.5] });
    return { root, body, head, eyes, arms, legs, topM, botM, brows, mouth, spec };
  }
  function makeSimba() {
    const root = new T.Group(), body = new T.Group();
    root.add(body);
    const fur = mat('#e38c30', { r: 1 }), fur2 = mat('#f0a54a', { r: 1 }), mane = mat('#e8952f', { r: 1 }), face = mat('#f2a94e', { r: 0.95 }), muz = mat('#f7c27c', { r: 0.9 }), dark = mat('#2a2130', { r: 0.4 });
    sph(body, 0.6, fur, 0, 0.8, -0.55, { s: [1.0, 0.85, 1.45], seg: 24 });
    sph(body, 0.5, fur2, 0, 1.02, -0.55, { s: [0.9, 0.5, 1.2] });
    const legs = [[-0.32, 0.05], [0.32, 0.05], [-0.32, -1.05], [0.32, -1.05]].map(([x, z]) => {
      const l = cyl(body, 0.17, 0.15, 0.55, '#de8429', x, 0.3, z, { seg: 12 });
      sph(body, 0.17, fur2, x, 0.06, z + 0.08, { s: [1, 0.6, 1.2], seg: 12 });
      return l;
    });
    const tail = new T.Group(); tail.position.set(0, 1.25, -1.15); body.add(tail);
    sph(tail, 0.36, fur, 0, 0.1, 0, { seg: 16 }); sph(tail, 0.26, fur2, 0.12, 0.32, 0.1, { seg: 14 }); sph(tail, 0.22, fur2, -0.15, 0.28, -0.05, { seg: 14 }); sph(tail, 0.2, fur, 0, 0.42, 0.25, { seg: 12 });
    const head = new T.Group(); head.position.set(0, 1.2, 0.28); body.add(head);
    for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2; sph(head, 0.24 + (i % 3) * 0.03, i % 2 ? mane : fur, Math.cos(a) * 0.55, Math.sin(a) * 0.52 - 0.05, -0.15, { seg: 12 }); }
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; sph(head, 0.22, mane, Math.cos(a) * 0.35, Math.sin(a) * 0.32, -0.32, { seg: 10 }); }
    sph(head, 0.48, face, 0, 0, 0, { s: [1, 0.95, 0.9], seg: 26 });
    [-0.3, 0.3].forEach((x) => { sph(head, 0.15, '#c96f1c', x, 0.42, -0.02, { s: [1, 1, 0.6], seg: 12 }); sph(head, 0.08, '#8f4e18', x, 0.42, 0.06, { s: [1, 1, 0.4], seg: 10 }); });
    [-0.27, 0.27].forEach((x) => sph(head, 0.17, muz, x, -0.14, 0.26, { s: [1, 1.1, 0.7], seg: 12 }));
    sph(head, 0.26, muz, 0, -0.14, 0.34, { s: [1.05, 0.75, 0.8], seg: 18 });
    sph(head, 0.09, dark, 0, -0.02, 0.55, { s: [1.3, 0.9, 0.9], seg: 14 });
    sph(head, 0.025, '#7a7184', -0.03, 0.01, 0.62, { seg: 8, cast: false });
    const eyes = new T.Group(); head.add(eyes);
    [-0.17, 0.17].forEach((x) => { sph(eyes, 0.06, dark, x, 0.12, 0.42, { s: [1.2, 1, 0.6], seg: 12 }); sph(eyes, 0.02, '#ffffff', x + 0.02, 0.15, 0.46, { seg: 6, cast: false }); });
    const tongue = sph(head, 0.07, '#3c3a6b', 0, -0.3, 0.42, { s: [1, 1.4, 0.5], seg: 10 });
    const collar = torus(head, 0.42, 0.05, '#d4513f', 0, -0.42, -0.05, { rx: Math.PI / 2 - 0.3, unique: true });
    collar.material = mat('#d4513f', { unique: true });
    const tag = sph(head, 0.06, '#ffd36b', 0, -0.55, 0.32, { m: 0.8, r: 0.3, seg: 10 });
    const mud = new T.Group(); body.add(mud);
    [[0.35, 0.7, -0.3], [-0.4, 0.6, -0.8], [0.2, 0.95, -1.0], [-0.1, 0.45, -0.1]].forEach(([x, y, z]) => sph(mud, 0.16, '#6e4f33', x, y, z, { s: [1, 0.6, 1], seg: 10 }));
    root.rotation.y = -0.55;
    return { root, body, head, eyes, tail, tongue, legs, collar, tag, mud };
  }

  /* ------------------------------------------------------------------ */
  /* Weather particles                                                   */
  /* ------------------------------------------------------------------ */
  let precip = null;
  function makePrecip() {
    const n = 900, geo = new T.BufferGeometry(), pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 30; pos[i * 3 + 1] = Math.random() * 14; pos[i * 3 + 2] = -6 + Math.random() * 14; }
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    const m = new T.PointsMaterial({ color: '#ffffff', size: 0.08, transparent: true, opacity: 0.8, depthWrite: false });
    precip = new T.Points(geo, m);
    precip.visible = false;
    scene.add(precip);
  }

  /* ------------------------------------------------------------------ */
  /* Setup                                                               */
  /* ------------------------------------------------------------------ */
  function init(el) {
    if (!T) return false;
    try {
      const test = document.createElement('canvas');
      if (!(test.getContext('webgl2') || test.getContext('webgl'))) return false;
      container = el;
      renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.outputEncoding = T.sRGBEncoding;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.95;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
      renderer.domElement.className = 'scene-3d';
      el.insertBefore(renderer.domElement, el.firstChild);
      scene = new T.Scene();
      camera = new T.PerspectiveCamera(38, 1, 0.1, 400);
      hemi = new T.HemisphereLight('#fff4e6', '#8a6a52', 0.65); scene.add(hemi);
      sun = new T.DirectionalLight('#fff1d6', 1.4);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -6, near: 0.5, far: 60 });
      sun.shadow.bias = -0.0008;
      sun.shadow.radius = 4;
      scene.add(sun); scene.add(sun.target);
      lamp = new T.PointLight('#ffc978', 0, 14, 1.6); scene.add(lamp);
      lamp2 = new T.PointLight('#ffd9a0', 0, 30, 1.2); scene.add(lamp2);
      ['nena', 'nasim', 'fariba', 'mohsen'].forEach((k) => { chars[k] = makeHuman(PEOPLE[k]); chars[k].root.visible = false; scene.add(chars[k].root); });
      chars.simba = makeSimba(); scene.add(chars.simba.root);
      chars.nena.root.visible = true;
      makePrecip();
      clock = new T.Clock();
      window.addEventListener('resize', resize);
      if (window.ResizeObserver) new ResizeObserver(() => resize()).observe(el);
      resize();
      ok = true;
      requestAnimationFrame(loop);
      return true;
    } catch (e) {
      console.warn('3D unavailable', e);
      ok = false;
      return false;
    }
  }
  function resize() {
    if (!renderer) return;
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    // size the HTML tap zones from the scene height so characters keep a natural scale
    container.style.setProperty('--nena-w', Math.round(h * 0.4 / 1.75) + 'px');
    container.style.setProperty('--simba-w', Math.round(h * 0.27 / 0.794) + 'px');
    container.style.setProperty('--nasim-w', Math.round(h * 0.36 / 1.75) + 'px');
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (cur) frameCamera(cur);
  }
  function frameCamera(room) {
    const c = room.cam;
    camera.position.set(c.pos[0], c.pos[1], c.pos[2]);
    const target = new T.Vector3(c.target[0], c.target[1], c.target[2]);
    // Make the floor line where characters stand (z=0) sit near the bottom of the view,
    // so the HTML bubbles and tap zones line up with the 3D characters.
    for (let i = 0; i < 8; i++) {
      camera.lookAt(target);
      camera.updateMatrixWorld();
      tmpV.set(0, 0, 0.3).project(camera);
      const err = tmpV.y - groundTarget;
      target.y += err * 2.2;
    }
    camera.lookAt(target);
    camera.updateMatrixWorld();
    const a = new T.Vector3(0, 0, 0.3).project(camera).x, b = new T.Vector3(1, 0, 0.3).project(camera).x;
    visW = 2 / Math.max(0.01, b - a);
    camBase = { pos: camera.position.clone(), target };
  }

  function setRoom(id) {
    if (!rooms[id]) { rooms[id] = BUILD[id](); scene.add(rooms[id].g); }
    Object.keys(rooms).forEach((k) => { rooms[k].g.visible = k === id; });
    cur = rooms[id];
    cur.id = id;
    frameCamera(cur);
    const cv = renderer.domElement;
    cv.classList.remove('fade'); void cv.offsetWidth; cv.classList.add('fade');
  }

  /* ------------------------------------------------------------------ */
  /* Sync with the game state                                            */
  /* ------------------------------------------------------------------ */
  function sync(state) {
    if (!ok) return;
    S = state;
    if (!cur || cur.id !== S.room) setRoom(S.room);
    cur.update(S);
    const night = nightLevel(S.time);
    const sky = skyColor(S);
    windows.forEach((m) => { m.color.copy(sky); m.emissive.copy(sky); m.emissiveIntensity = 0.55 + (1 - night) * 0.5; });
    const lampOn = night > 0.3;
    if (cur.shade) cur.shade.material.emissiveIntensity = lampOn ? 1.2 : 0;
    lamp.intensity = cur.lampPos && lampOn ? 2.2 * Math.min(1, night * 1.4) : 0;
    if (cur.lampPos) lamp.position.copy(cur.lampPos);
    if (cur.outdoor) {
      scene.background = sky.clone();
      scene.fog = new T.Fog(sky.clone(), 30, S.today.weather === 'pluie' ? 90 : 160);
      hemi.color.set('#dfefff').lerp(new T.Color('#3a3f6e'), night);
      hemi.groundColor.set('#8a8070').lerp(new T.Color('#1d1b2a'), night);
      hemi.intensity = 0.75 - night * 0.35;
      sun.intensity = (S.today.weather === 'soleil' ? 1.8 : 1.0) * (1 - night) + 0.08;
      sun.color.set(night > 0.2 ? '#ffb07a' : '#fff1d6');
      sun.position.set(10, 18, 12);
      sun.target.position.set(0, 0, -2);
      const lit = night;
      cur.famMat.emissiveIntensity = lit * 1.2; cur.blockMats.forEach((m) => { m.emissiveIntensity = lit * 1.2; });
      cur.streetBulb.material.emissiveIntensity = lampOn ? 1.5 : 0;
      cur.miladLight.material.emissiveIntensity = lampOn ? 2 : 0;
      setLin(cur.mtnMat.color, '#9aa6c0').lerp(lin('#2c2d52'), night);
      lamp.distance = 16;
      precip.visible = S.today.weather === 'pluie' || S.today.weather === 'neige';
      precip.material.size = S.today.weather === 'neige' ? 0.14 : 0.06;
      precip.material.color.set(S.today.weather === 'neige' ? '#ffffff' : '#cfe1f5');
    } else {
      scene.background = lin('#2a2236');
      scene.fog = null;
      hemi.color.set('#fff4e6').lerp(new T.Color('#5a4f7a'), night);
      hemi.groundColor.set('#8a6a52').lerp(new T.Color('#2a2036'), night);
      hemi.intensity = 0.7 - night * 0.38;
      sun.intensity = (1 - night) * (S.today.weather === 'soleil' ? 1.25 : 0.8) + 0.05;
      sun.color.set(night > 0.2 ? '#ffb48a' : '#fff1d6');
      sun.position.set(2, 9, 10);
      sun.target.position.set(0, 0, -1);
      lamp.distance = 14;
      precip.visible = false;
    }
    lamp2.intensity = 0;
    // characters' outfits and looks
    const n = chars.nena, O = window.Art && window.Art.OUTFITS;
    if (S.dressed && O) { const c = O[S.outfit] || O.basique; setLin(n.topM.color, c.top); setLin(n.botM.color, S.outfit === 'robe' ? '#f8cfae' : c.bottom); }
    else { setLin(n.topM.color, '#f4a3c0'); setLin(n.botM.color, '#ec8eaf'); }
    const sm = chars.simba;
    sm.mud.visible = !!S.muddy;
    const collars = { rouge: '#d4513f', bandana: '#ef8fb0', noeud: '#4a7bd0' };
    sm.collar.visible = !!S.collar; sm.tag.visible = !!S.collar;
    if (S.collar) setLin(sm.collar.material.color, collars[S.collar] || '#d4513f');
  }

  /* ------------------------------------------------------------------ */
  /* Per-frame animation                                                 */
  /* ------------------------------------------------------------------ */
  const posCache = {};
  function actorX(el, key) {
    const pct = parseFloat(el.style.left);
    const target = ((isNaN(pct) ? 50 : pct) / 100 - 0.5) * visW;
    if (posCache[key] == null) posCache[key] = target;
    posCache[key] += (target - posCache[key]) * 0.08;
    return posCache[key];
  }
  const BASE_H = { nena: 2.8, simba: 1.75, nasim: 2.8, fariba: 2.8, mohsen: 2.8 };
  function fitScale(el, key, obj) {
    const ch = container.clientHeight || 1;
    const f = el.offsetHeight / ch;
    const d = camera.position.distanceTo(obj.root.position);
    const visH = 2 * d * Math.tan((camera.fov * Math.PI) / 360);
    return Math.max(0.2, Math.min(3, (f * visH) / BASE_H[key]));
  }
  let blinkT = 0, last = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    if (!ok || !S || !cur) return;
    if (document.hidden || S.settings.three === false) return;
    const ts = document.getElementById('title-screen'), mg = document.getElementById('mg');
    if ((ts && !ts.hidden) || (mg && !mg.hidden)) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    const t = clock.getElapsedTime();
    // gentle cinematic camera drift
    if (camBase) {
      camera.position.x = camBase.pos.x + Math.sin(t * 0.13) * 0.18;
      camera.position.y = camBase.pos.y + Math.sin(t * 0.21) * 0.05;
      camera.lookAt(camBase.target);
    }
    if (cur.tick) cur.tick(t);
    if (container.clientWidth && Math.abs(camera.aspect - container.clientWidth / container.clientHeight) > 0.01) resize();
    blinkT -= dt;
    const blink = blinkT < 0.12 && blinkT > 0;
    if (blinkT < 0) blinkT = 2.5 + Math.random() * 3;

    // Nena
    const nEl = document.getElementById('nena'), n = chars.nena;
    n.root.position.set(actorX(nEl, 'nena'), 0, 0.3);
    n.root.scale.setScalar(fitScale(nEl, 'nena', n));
    n.root.rotation.y = 0.25;
    const working = nEl.classList.contains('working'), walking = nEl.classList.contains('walking'), asleep = nEl.classList.contains('asleep');
    n.body.position.y = walking ? Math.abs(Math.sin(t * 9)) * 0.12 : 0;
    n.body.rotation.z = working ? Math.sin(t * 10) * 0.05 : 0;
    n.body.scale.y = 1 + Math.sin(t * 2) * 0.012;
    n.eyes.scale.y = asleep || blink ? 0.12 : 1;
    n.head.rotation.z = Math.sin(t * 0.7) * 0.04;
    n.arms[0].rotation.x = walking ? Math.sin(t * 9) * 0.5 : working ? Math.sin(t * 10) * 0.3 - 0.4 : 0;
    n.arms[1].rotation.x = walking ? -Math.sin(t * 9) * 0.5 : working ? -Math.sin(t * 10) * 0.3 - 0.4 : 0;

    // Simba
    const sEl = document.getElementById('simba'), sm = chars.simba;
    sm.root.visible = !sEl.hidden;
    if (!sEl.hidden) {
      const c = sEl.classList;
      const x = actorX(sEl, 'simba');
      let rx = 0, rz = 0, ry = -0.55, y = 0, bodyY = 0;
      const happy = c.contains('happy') || c.contains('petted');
      if (c.contains('walking') || c.contains('trickhop')) y = Math.abs(Math.sin(t * 10)) * 0.18;
      if (c.contains('zoomies')) { ry = Math.sin(t * 6) > 0 ? -1.4 : 1.4; sm.root.position.x = x + Math.sin(t * 3) * 2.2; }
      else sm.root.position.x = x;
      if (c.contains('spin')) ry = t * 7;
      if (c.contains('belly')) { rz = Math.PI * 0.92; y = 1.35 * sm.root.scale.x; }
      if (c.contains('petted')) rz = Math.sin(t * 20) * 0.06;
      const sleeping = c.contains('asleep');
      if (sleeping) bodyY = -0.35;
      sm.body.position.y = bodyY + (sleeping ? Math.sin(t * 1.5) * 0.02 : 0);
      sm.legs.forEach((l) => { l.scale.y = sleeping ? 0.3 : 1; });
      sm.root.position.y = y;
      sm.root.position.z = 0.7;
      sm.root.scale.setScalar(fitScale(sEl, 'simba', sm));
      sm.root.rotation.set(rx, ry, rz);
      sm.body.scale.set(1, 1 + Math.sin(t * (c.contains('sick') ? 1.2 : 2.6)) * 0.015, 1);
      sm.tail.rotation.z = Math.sin(t * (happy ? 14 : 3)) * (happy ? 0.35 : 0.1);
      sm.head.rotation.x = c.contains('sick') ? 0.35 : sleeping ? 0.25 : Math.sin(t * 0.8) * 0.04;
      sm.head.rotation.z = c.contains('scratch') ? Math.sin(t * 30) * 0.12 : Math.sin(t * 0.6) * 0.05;
      sm.eyes.scale.y = sleeping || c.contains('petted') || blink ? 0.15 : 1;
      sm.tongue.visible = happy && !sleeping;
    }

    // family NPC
    const npcEl = document.getElementById('npc');
    ['nasim', 'fariba', 'mohsen'].forEach((k) => { chars[k].root.visible = false; });
    if (npcEl && !npcEl.hidden && chars[npcEl.dataset.who]) {
      const p = chars[npcEl.dataset.who];
      p.root.visible = true;
      p.root.position.set(actorX(npcEl, 'npc_' + npcEl.dataset.who), 0, -0.2);
      p.root.rotation.y = -0.35;
      p.root.scale.setScalar(fitScale(npcEl, npcEl.dataset.who, p));
      p.body.scale.y = 1 + Math.sin(t * 1.8 + 1) * 0.012;
      p.eyes.scale.y = blink ? 0.12 : 1;
      p.head.rotation.z = Math.sin(t * 0.5 + 2) * 0.05;
      if (npcEl.dataset.who === 'fariba') p.arms[1].rotation.x = Math.sin(t * 3) * 0.3 - 0.5;
    }

    // rain / snow
    if (precip.visible) {
      const a = precip.geometry.attributes.position, arr = a.array, snow = S.today.weather === 'neige';
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] -= (snow ? 1.2 : 14) * dt;
        if (snow) arr[i] += Math.sin(t + i) * 0.004;
        if (arr[i + 1] < 0) arr[i + 1] = 14;
      }
      a.needsUpdate = true;
    }
    renderer.render(scene, camera);
  }

  return {
    init, sync, resize,
    get ok() { return ok; },
  };
})();
