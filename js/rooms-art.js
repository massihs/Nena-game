/* Nena & Simba — room backgrounds (logical 600×800 each).
   The apartment is split into rooms; the street and the CLAP restaurant are their own maps. */
(function () {
  'use strict';
  function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  // Tehran skyline seen through windows (Alborz mountains, Milad tower, towers)
  function skyline(night, rain) {
    let o = '<rect width="400" height="300" fill="url(#rsky)"/>';
    if (night) for (let i = 0; i < 26; i++) o += `<circle cx="${hash(i) * 400}" cy="${hash(i + 9) * 90}" r="1" fill="#fff" opacity=".8"/>`;
    else o += '<g fill="#fff" opacity=".85"><ellipse cx="90" cy="50" rx="44" ry="10"/><ellipse cx="300" cy="70" rx="36" ry="8"/></g>';
    let ridge = 'M0 300 L0 160 ';
    for (let x = 0; x <= 400; x += 10) ridge += `L${x} ${(170 - (40 + Math.sin(x * 0.03) * 22 + Math.sin(x * 0.09 + 1) * 8)).toFixed(1)} `;
    o += `<path d="${ridge} L400 300Z" fill="${night ? '#24264a' : '#8e9ab6'}"/>`;
    for (let x = 20; x < 400; x += 46) { const h = 40 + Math.sin(x * 0.03) * 22 + Math.sin(x * 0.09 + 1) * 8; if (h > 50) o += `<path d="M${x - 9} ${170 - h + 10} L${x} ${170 - h} L${x + 10} ${170 - h + 9}Z" fill="#fff" opacity="${night ? 0.5 : 0.95}"/>`; }
    o += `<g fill="${night ? '#1b1c34' : '#6f7c96'}"><rect x="296" y="64" width="5" height="130"/><ellipse cx="298.5" cy="90" rx="16" ry="7"/><rect x="297" y="34" width="2" height="32"/></g>`;
    let x = -6, i = 0;
    while (x < 406) {
      const bw = 18 + hash(i) * 30, bh = 30 + hash(i + 3) * 70;
      o += `<rect x="${x}" y="${250 - bh}" width="${bw}" height="${bh + 60}" fill="${night ? (i % 2 ? '#22224a' : '#1c1c3a') : (i % 2 ? '#c2ccd9' : '#b0bdcd')}"/>`;
      if (hash(i + 21) < 0.6) o += `<rect x="${(x + bw * 0.25).toFixed(1)}" y="${(242 - bh).toFixed(1)}" width="9" height="8" fill="${night ? '#2c2c4c' : '#d9dde2'}"/><path d="M${(x + bw * 0.25 + 2).toFixed(1)} ${(244 - bh).toFixed(1)} v4 M${(x + bw * 0.25 + 4.5).toFixed(1)} ${(244 - bh).toFixed(1)} v4 M${(x + bw * 0.25 + 7).toFixed(1)} ${(244 - bh).toFixed(1)} v4" stroke="${night ? '#1c1c3a' : '#9aa3ad'}" stroke-width=".8"/>`;
      if (hash(i + 33) < 0.4) o += `<ellipse cx="${(x + bw * 0.7).toFixed(1)}" cy="${(245 - bh).toFixed(1)}" rx="4.5" ry="3" fill="${night ? '#2c2c4c' : '#eef0f2'}" transform="rotate(-25 ${(x + bw * 0.7).toFixed(1)} ${(245 - bh).toFixed(1)})"/>`;
      for (let wy = 256 - bh; wy < 290; wy += 9) for (let wx = x + 4; wx < x + bw - 4; wx += 7) if (hash(wx * 2.1 + wy) < 0.4) o += `<rect x="${wx.toFixed(0)}" y="${wy}" width="3" height="4" fill="${night ? '#ffcf73' : '#fff'}" opacity="${night ? 1 : 0.45}"/>`;
      x += bw + 3; i++;
    }
    if (rain) { o += '<rect width="400" height="300" fill="#7a8696" opacity=".3"/>'; for (let k = 0; k < 50; k++) o += `<path d="M${hash(k) * 400} ${hash(k + 2) * 300} l-4 12" stroke="#e6eef7" stroke-width="1.4" opacity=".7"/>`; }
    return o;
  }

  let VIEW = '';
  function defs(c) {
    const night = !!c.night, rain = !!c.rain;
    const sky = night ? ['#151838', '#3a3466'] : rain ? ['#8b97a8', '#c3cbd6'] : c.n % 3 === 2 ? ['#f2a07a', '#fde3c3'] : ['#8fcbee', '#d7eefa'];
    VIEW = skyline(night, rain);
    return `<defs><linearGradient id="rsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>
      <linearGradient id="rglass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient>
      <radialGradient id="rglow"><stop offset="0" stop-color="#ffd98a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
      <radialGradient id="rneon"><stop offset="0" stop-color="#ff5fa2" stop-opacity=".55"/><stop offset="1" stop-color="#ff5fa2" stop-opacity="0"/></radialGradient>
      <linearGradient id="rwall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6efe6"/><stop offset="1" stop-color="#ebe1d4"/></linearGradient>
      <linearGradient id="rshine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="rrefl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dff1ff" stop-opacity=".55"/><stop offset="1" stop-color="#dff1ff" stop-opacity="0"/></linearGradient>
      <radialGradient id="rao"><stop offset="0" stop-color="#2a1a14" stop-opacity=".32"/><stop offset="1" stop-color="#2a1a14" stop-opacity="0"/></radialGradient>
      <linearGradient id="rbeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6dc" stop-opacity=".34"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0"/></linearGradient>
      <radialGradient id="rvig" cx="50%" cy="46%" r="72%"><stop offset=".55" stop-color="#1c1428" stop-opacity="0"/><stop offset="1" stop-color="#1c1428" stop-opacity=".55"/></radialGradient>
      <radialGradient id="rwarm"><stop offset="0" stop-color="#ffcf80" stop-opacity=".5"/><stop offset="1" stop-color="#ffcf80" stop-opacity="0"/></radialGradient>
      <radialGradient id="rcold"><stop offset="0" stop-color="#e8f4ff" stop-opacity=".45"/><stop offset="1" stop-color="#e8f4ff" stop-opacity="0"/></radialGradient>
      <linearGradient id="rsteel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8bec4"/><stop offset=".5" stop-color="#e3e6e9"/><stop offset="1" stop-color="#aab0b6"/></linearGradient>
      <linearGradient id="rtv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f8f4a"/><stop offset="1" stop-color="#2d6e38"/></linearGradient></defs>`;
  }
  const win = (x, y, w, h, ox, panes) => {
    const n = panes || 2;
    let m = '';
    for (let i = 1; i < n; i++) m += `<rect x="${(x + (w * i) / n - 2).toFixed(1)}" y="${y}" width="4" height="${h}" fill="#1e1d22"/>`;
    const W = (w * 300) / h;
    const vb = W > 400 ? `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">` : `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${Math.min(ox, 400 - W).toFixed(1)} 0 ${W.toFixed(1)} 300" preserveAspectRatio="none">`;
    return `<rect x="${x - 6}" y="${y - 6}" width="${w + 12}" height="${h + 12}" fill="#1e1d22"/>${vb}${VIEW}</svg><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#rglass)"/>${m}`;
  };
  // floor-to-ceiling bay window (the flat has glass everywhere)
  const bay = (x, y, w, h, ox, panes) => win(x, y, w, h, ox, panes) + `<rect x="${x - 8}" y="${y + h}" width="${w + 16}" height="6" fill="#d8dadc"/>`;
  // reflection of a bay window on the polished floor, and soft contact shadows under furniture
  const refl = (x, w, y0, panes) => `<rect x="${x}" y="${y0}" width="${w}" height="130" fill="url(#rrefl)" opacity=".7"/>` + [...Array((panes || 2) - 1)].map((_, i) => `<rect x="${(x + (w * (i + 1)) / (panes || 2) - 2).toFixed(0)}" y="${y0}" width="4" height="90" fill="#1e1d22" opacity=".08"/>`).join('');
  const ao = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry || 16}" fill="url(#rao)"/>`;
  // polished white & grey marble floor
  function marble(y0, x0, x1) {
    x0 = x0 || 0; x1 = x1 || 600;
    let o = `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${800 - y0}" fill="#f2f1ee"/>`;
    for (let r = 0, y = y0; y < 800; r++, y += 84) for (let x = x0 - (r % 2) * 60; x < x1; x += 120) {
      const t = hash(x * 0.37 + y * 1.3);
      o += `<rect x="${Math.max(x, x0)}" y="${y}" width="${Math.min(120, x1 - Math.max(x, x0), x + 120 - Math.max(x, x0))}" height="84" fill="${t < 0.33 ? '#f6f5f3' : t < 0.66 ? '#ecebe8' : '#e4e5e6'}" stroke="#d3d2ce" stroke-width="1.2"/>`;
    }
    for (let i = 0; i < 16; i++) {
      const sx = x0 + hash(i * 3.1 + y0) * (x1 - x0), sy = y0 + 10 + hash(i * 5.7 + 1) * (780 - y0);
      o += `<path d="M${sx.toFixed(0)} ${sy.toFixed(0)} q${(20 + hash(i) * 40).toFixed(0)} ${(-14 + hash(i + 1) * 28).toFixed(0)} ${(60 + hash(i + 2) * 50).toFixed(0)} ${(hash(i + 3) * 30 - 8).toFixed(0)} t${(50 + hash(i + 6) * 40).toFixed(0)} ${(hash(i + 4) * 26 - 13).toFixed(0)}" stroke="${i % 3 ? '#a7abb1' : '#8c9097'}" stroke-width="${(0.7 + hash(i + 5) * 1.3).toFixed(1)}" fill="none" opacity=".5"/>`;
    }
    return o + `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${800 - y0}" fill="url(#rshine)"/>`;
  }
  const svg = (inner, c, dark) => `<svg viewBox="0 0 600 800" class="stage-bg" aria-hidden="true">${inner}${c.night && !dark ? '<circle cx="300" cy="140" r="220" fill="url(#rglow)" opacity=".45"/><rect width="600" height="800" fill="#1a1838" opacity=".24"/>' : ''}</svg>`;
  function wood(y0, col, line) {
    let o = `<rect x="0" y="${y0}" width="600" height="${800 - y0}" fill="${col || '#d4ad82'}"/>`;
    for (let y = y0 + 4; y < 800; y += 34) o += `<path d="M0 ${y} H600" stroke="${line || 'rgba(110,70,35,.13)'}" stroke-width="1.4"/>`;
    for (let r = 0; r * 34 + y0 < 800; r++) for (let x = (r * 97) % 180; x < 600; x += 180) o += `<path d="M${x} ${y0 + 4 + r * 34} v34" stroke="${line || 'rgba(110,70,35,.11)'}" stroke-width="1.4"/>`;
    return o;
  }
  const wall = (h, col) => `<rect width="600" height="${h}" fill="${col || 'url(#rwall)'}"/><rect width="600" height="12" fill="#f9f5ef"/><rect y="12" width="600" height="3" fill="#ffe2b0"/><rect y="${h - 6}" width="600" height="6" fill="#efe6d8"/>`;
  const plant = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s || 1})"><path d="M-14 0 h28 l-3 -30 h-22z" fill="#ebe5dc"/><ellipse cx="-10" cy="-50" rx="16" ry="8" fill="#4d8044" transform="rotate(-30 -10 -50)"/><ellipse cx="10" cy="-62" rx="16" ry="8" fill="#5a9150" transform="rotate(25 10 -62)"/><ellipse cx="-4" cy="-76" rx="14" ry="7" fill="#3f6f3a"/><ellipse cx="12" cy="-38" rx="13" ry="6" fill="#4d8044" transform="rotate(35 12 -38)"/></g>`;
  const label = (x, y, txt, col, size) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size || 11}" font-family="Fredoka, sans-serif" font-weight="700" fill="${col}">${txt}</text>`;
  const arch = (x, y, w, h, hint) => `<path d="M${x} ${y + h} V${y + w / 2} a${w / 2} ${w / 2} 0 0 1 ${w} 0 V${y + h}z" fill="#d9c9b2"/><path d="M${x + 6} ${y + h} V${y + w / 2} a${w / 2 - 6} ${w / 2 - 6} 0 0 1 ${w - 12} 0 V${y + h}z" fill="#c7b499"/>${hint ? label(x + w / 2, y + w / 2 + 18, hint, '#7a5c4e', 9) : ''}`;
  const rug = (cx, cy, w, h) => `<g><ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="${h / 2}" fill="#8c1f30"/><ellipse cx="${cx}" cy="${cy}" rx="${w / 2 - 10}" ry="${h / 2 - 8}" fill="none" stroke="#1f2a5a" stroke-width="6"/><ellipse cx="${cx}" cy="${cy}" rx="${w / 5}" ry="${h / 5}" fill="#f0d9a8"/><ellipse cx="${cx}" cy="${cy}" rx="${w / 9}" ry="${h / 9}" fill="#1f2a5a"/></g>`;


  /* ---- realism kit: Persian rugs, drapes, tea glasses, poshti, Tehran rooftops… ---- */
  const FA = (x, y, txt, size, col, extra) => `<text x="${x}" y="${y}" text-anchor="middle" direction="rtl" font-size="${size}" font-family="Vazirmatn, Tahoma, sans-serif" font-weight="800" fill="${col}"${extra || ''}>${txt}</text>`;
  function persianRug(cx, cy, w, h, p) {
    p = p || { field: '#8e1f2c', border: '#1f2f5c', guard: '#e8c98a', med: '#f1dcae', med2: '#2a3d6e' };
    const q = (ins) => { const tw = ((w - 2 * ins) * 0.8) / 2, bw = (w - 2 * ins) / 2, y0 = cy - h / 2 + ins * 0.6, y1 = cy + h / 2 - ins * 0.6; return { tw, bw, y0, y1, pts: `${(cx - tw).toFixed(1)},${y0.toFixed(1)} ${(cx + tw).toFixed(1)},${y0.toFixed(1)} ${(cx + bw).toFixed(1)},${y1.toFixed(1)} ${(cx - bw).toFixed(1)},${y1.toFixed(1)}` }; };
    const a = q(0), f = q(15);
    let o = `<polygon points="${a.pts}" fill="${p.border}"/><polygon points="${q(5).pts}" fill="none" stroke="${p.guard}" stroke-width="1.6"/>`;
    for (let i = 0; i < 18; i++) { const t = (i + 0.5) / 18; o += `<circle cx="${(cx - a.tw * 0.92 + t * a.tw * 1.84).toFixed(1)}" cy="${(a.y0 + 5).toFixed(1)}" r="2" fill="${p.guard}"/><circle cx="${(cx - a.bw * 0.94 + t * a.bw * 1.88).toFixed(1)}" cy="${(a.y1 - 5).toFixed(1)}" r="2.4" fill="${p.guard}"/>`; }
    o += `<polygon points="${f.pts}" fill="${p.field}"/><polygon points="${q(19).pts}" fill="none" stroke="${p.guard}" stroke-width="1.2" stroke-dasharray="4 3"/>`;
    for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) { const ty = f.y0 + 12 + (r * (f.y1 - f.y0 - 24)) / 3, half = f.tw + ((ty - f.y0) / (f.y1 - f.y0)) * (f.bw - f.tw), tx = cx - half + 14 + (k * (2 * half - 28)) / 8; o += `<path d="M${tx.toFixed(1)} ${(ty - 4).toFixed(1)} l4 4 -4 4 -4 -4z" fill="${p.guard}" opacity=".45"/>`; }
    o += `<polygon points="${cx},${cy - h * 0.34} ${cx + w * 0.22},${cy} ${cx},${cy + h * 0.34} ${cx - w * 0.22},${cy}" fill="${p.med}"/><polygon points="${cx},${cy - h * 0.24} ${cx + w * 0.15},${cy} ${cx},${cy + h * 0.24} ${cx - w * 0.15},${cy}" fill="${p.med2}"/><ellipse cx="${cx}" cy="${cy}" rx="${w * 0.06}" ry="${h * 0.1}" fill="${p.field}"/><ellipse cx="${cx}" cy="${cy}" rx="${w * 0.025}" ry="${h * 0.04}" fill="${p.guard}"/>`;
    for (let i = 0; i <= 30; i++) { const t = i / 30; o += `<path d="M${(cx - a.tw + t * 2 * a.tw).toFixed(1)} ${a.y0.toFixed(1)} v-5 M${(cx - a.bw + t * 2 * a.bw).toFixed(1)} ${a.y1.toFixed(1)} v6" stroke="#f5ecd8" stroke-width="1.2"/>`; }
    return `<g class="prug">${o}</g>`;
  }
  // long Persian runner seen in perspective (hallway)
  function runner(x0t, x1t, x0b, x1b, yt, yb) {
    const L = (k) => `${x0t + k * 0.8},${yt + k * 0.4} ${x1t - k * 0.8},${yt + k * 0.4} ${x1b - k},${yb} ${x0b + k},${yb}`;
    let o = `<polygon points="${L(0)}" fill="#1f2f5c"/><polygon points="${L(10)}" fill="#8e1f2c"/><polygon points="${L(14)}" fill="none" stroke="#e8c98a" stroke-width="1.4" stroke-dasharray="5 3"/>`;
    for (let i = 0; i < 6; i++) { const t = (i + 0.6) / 6, y = yt + t * (yb - yt), cx = ((x0t + x1t) / 2) * (1 - t) + ((x0b + x1b) / 2) * t, s = 0.6 + t * 0.8; o += `<path d="M${cx} ${(y - 16 * s).toFixed(1)} l${(18 * s).toFixed(1)} ${(16 * s).toFixed(1)} l${(-18 * s).toFixed(1)} ${(16 * s).toFixed(1)} l${(-18 * s).toFixed(1)} ${(-16 * s).toFixed(1)}z" fill="#f1dcae"/><circle cx="${cx}" cy="${y.toFixed(1)}" r="${(4 * s).toFixed(1)}" fill="#2a3d6e"/>`; }
    return o;
  }
  function drapes(x, y, w, h, col, col2) {
    col = col || '#7a1f2e'; col2 = col2 || '#a8323f';
    const pw = Math.max(30, w * 0.13);
    let o = `<rect x="${x + pw - 8}" y="${y - 6}" width="${w - 2 * pw + 16}" height="${h + 10}" fill="#fff" opacity=".2"/>`;
    for (let fx = x + pw; fx < x + w - pw; fx += 13) o += `<path d="M${fx.toFixed(0)} ${y - 4} q3 ${h / 2} -1 ${h + 6}" stroke="#fff" stroke-width="1.4" opacity=".35" fill="none"/>`;
    const panel = (px, left) => { let s = `<path d="M${px} ${y - 12} h${pw} ${left ? `q-8 ${h * 0.55} 6 ${h + 14}` : `q8 ${h * 0.55} -6 ${h + 14}`} h${-pw + (left ? -6 : 6)} ${left ? `q-4 ${-h * 0.5} 0 ${-h - 14}` : `q4 ${-h * 0.5} 0 ${-h - 14}`}z" fill="${col}"/>`; for (let i = 1; i < 4; i++) s += `<path d="M${(px + (i * pw) / 4).toFixed(1)} ${y - 8} q${left ? -3 : 3} ${h * 0.5} ${left ? 1 : -1} ${h + 10}" stroke="${col2}" stroke-width="3.2" fill="none" opacity=".75"/>`; return s + `<path d="M${px - 2} ${(y + h * 0.58).toFixed(0)} h${pw + 4}" stroke="#d9b45a" stroke-width="4" stroke-linecap="round"/>`; };
    o += panel(x - 6, true) + panel(x + w - pw + 6, false);
    o += `<rect x="${x - 18}" y="${y - 24}" width="${w + 36}" height="18" rx="3" fill="${col}"/><path d="M${x - 18} ${y - 6} ${[...Array(Math.ceil((w + 36) / 30))].map(() => 'q7.5 10 15 0 t15 0').join(' ')}" fill="${col}"/><path d="M${x - 18} ${y - 20} h${w + 36}" stroke="#d9b45a" stroke-width="2"/>`;
    for (let tx = x - 10; tx < x + w + 18; tx += 30) o += `<circle cx="${tx}" cy="${y + 6}" r="2.6" fill="#d9b45a"/>`;
    return o;
  }
  const radiator = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="44" rx="4" fill="#f6f6f4" stroke="#d6d6d3"/>${[...Array(Math.floor(w / 9))].map((_, i) => `<path d="M${x + 6 + i * 9} ${y + 6} v32" stroke="#dcdcda" stroke-width="2"/>`).join('')}<rect x="${x + w - 10}" y="${y + 18}" width="14" height="6" rx="2" fill="#c9ccd0"/>`;
  const estekan = (x, y) => `<ellipse cx="${x}" cy="${y + 12}" rx="9" ry="3" fill="#e9e3d8" stroke="#c9a24a" stroke-width="1"/><path d="M${x - 6} ${y - 6} q-1 9 3 12 q-3 3 -1 6 h8 q2 -3 -1 -6 q4 -3 3 -12z" fill="#b4472a" opacity=".9"/><path d="M${x - 6} ${y - 6} h12" stroke="#fff" stroke-width="1.6" opacity=".8"/>`;
  const teaTray = (x, y) => `<ellipse cx="${x}" cy="${y + 14}" rx="34" ry="8" fill="#d8d3c8" stroke="#b9b2a4"/>${estekan(x - 18, y)}${estekan(x, y - 2)}${estekan(x + 18, y)}<ellipse cx="${x + 30}" cy="${y + 8}" rx="8" ry="4" fill="#fff" stroke="#c9a24a"/><rect x="${x + 26}" y="${y + 2}" width="4" height="4" fill="#fff" stroke="#ddd" stroke-width=".6"/><rect x="${x + 31}" y="${y + 3}" width="4" height="4" fill="#fff" stroke="#ddd" stroke-width=".6"/>`;
  const fruitBowl = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s || 1})"><ellipse cx="0" cy="10" rx="28" ry="7" fill="rgba(0,0,0,.12)"/><path d="M-26 -4 q26 22 52 0z" fill="#e8eef2" stroke="#b9c7cf" stroke-width="1.2"/><circle cx="-12" cy="-10" r="9" fill="#c0392b"/><circle cx="4" cy="-12" r="9" fill="#e98a2b"/><circle cx="16" cy="-8" r="8" fill="#a8c63a"/><path d="M-20 -6 q14 -12 30 -8" stroke="#3f7d3a" stroke-width="6" stroke-linecap="round" fill="none"/><circle cx="-2" cy="-20" r="6" fill="#8e1f2c"/><path d="M-3 -26 l1 -3 1 3" stroke="#5a1018" stroke-width="1.5"/></g>`;
  const poshti = (x, y, col) => `<g><rect x="${x}" y="${y}" width="62" height="40" rx="14" fill="${col}"/><rect x="${x + 4}" y="${y + 4}" width="54" height="32" rx="11" fill="none" stroke="#d9b45a" stroke-width="2"/>${[0, 1].map((i) => `<path d="M${x + 20 + i * 22} ${y + 12} q8 4 4 12 q-6 2 -8 -4 q0 -4 4 -8z" fill="#d9b45a" opacity=".9"/>`).join('')}</g>`;
  const frame = (x, y, w, h, inner, col) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${col || '#7a5032'}"/><rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" fill="#f3e8d2"/>${inner || ''}`;
  const famPhoto = (x, y, w, h) => frame(x, y, w, h, `<rect x="${x + 7}" y="${y + 7}" width="${w - 14}" height="${h - 14}" fill="#bcd3e0"/><path d="M${x + 7} ${y + h - 7} l${(w - 14) * 0.35} ${-(h - 14) * 0.45} ${(w - 14) * 0.3} ${(h - 14) * 0.25} ${(w - 14) * 0.35} ${-(h - 14) * 0.15} V${y + h - 7}z" fill="#6f8f6a"/>${[0.3, 0.55, 0.75].map((t, i) => `<circle cx="${x + 7 + (w - 14) * t}" cy="${y + h * 0.5}" r="${3.4 - i * 0.4}" fill="#5a3a26"/><rect x="${x + 4 + (w - 14) * t}" y="${y + h * 0.5 + 3}" width="6" height="${h * 0.22}" rx="2" fill="${['#c9496f', '#3a5480', '#e7b84a'][i]}"/>`).join('')}`, '#c9a24a');
  const shoeRack = (x, y) => `<rect x="${x}" y="${y}" width="66" height="34" rx="2" fill="#7a5032"/><path d="M${x + 3} ${y + 16} h60" stroke="#5a3a22" stroke-width="2"/><g fill="#2a2a2e"><path d="M${x + 6} ${y + 12} q8 -8 18 0z"/><path d="M${x + 30} ${y + 12} q8 -8 18 0z" fill="#8a5a3a"/><path d="M${x + 10} ${y + 30} q8 -7 16 0z" fill="#e8577f"/><path d="M${x + 36} ${y + 30} q8 -7 18 0z" fill="#e9e1d4"/></g><g><ellipse cx="${x + 18}" cy="${y + 46}" rx="9" ry="4" fill="#3a6fb0"/><ellipse cx="${x + 30}" cy="${y + 48}" rx="9" ry="4" fill="#3a6fb0"/><ellipse cx="${x + 48}" cy="${y + 44}" rx="8" ry="3.6" fill="#7a5032"/><ellipse cx="${x + 59}" cy="${y + 46}" rx="8" ry="3.6" fill="#7a5032"/></g>`;


  // the Tehran street, as it really looks: Persian signs, sangak oven, fruit piles, plane trees painted white, Valiasr sign, a yellow taxi
  function streetReal(c) {
    const night = !!c.night, glass = night ? '#ffd98a' : '#3a2a22';
    let o = '';
    // facades: balconies, coolers, satellite dishes, laundry
    [[0, 90, 120], [120, 60, 130], [450, 80, 150]].forEach(([x, y, w], b) => {
      o += `<rect x="${x + 4}" y="${y - 10}" width="12" height="10" fill="${night ? '#3a3958' : '#d9dde2'}"/><path d="M${x + 6} ${y - 7} v6 M${x + 10} ${y - 7} v6 M${x + 14} ${y - 7} v6" stroke="#9aa3ad"/>`;
      o += `<ellipse cx="${x + w - 20}" cy="${y - 6}" rx="9" ry="6" fill="${night ? '#3a3958' : '#f1f2f4'}" transform="rotate(-25 ${x + w - 20} ${y - 6})"/><path d="M${x + w - 20} ${y - 2} v6" stroke="#9aa3ad" stroke-width="2"/>`;
      for (let r = 0; r < 3; r++) { const by = y + 34 + r * 56; o += `<rect x="${x + 6}" y="${by}" width="${w - 12}" height="4" fill="${night ? '#4a4970' : '#a99a86'}"/>${[...Array(Math.floor((w - 12) / 8))].map((_, k) => `<path d="M${x + 8 + k * 8} ${by} v-14" stroke="${night ? '#4a4970' : '#8a7c6a'}" stroke-width="1.4"/>`).join('')}<path d="M${x + 6} ${by - 14} h${w - 12}" stroke="${night ? '#4a4970' : '#8a7c6a'}" stroke-width="2"/>`; if ((r + b) % 2 === 0) o += `<rect x="${x + w - 30}" y="${by - 22}" width="12" height="9" fill="#c94a3a"/><path d="M${x + w - 30} ${by - 22} q6 -10 12 0" fill="#5a9150"/>`; }
      if (b === 1) o += `<path d="M${x + 6} ${y + 74} q${w / 2} 10 ${w - 12} 0" stroke="#777" stroke-width="1" fill="none"/>${['#e98aab', '#7fb2ff', '#fff', '#ffd36b'].map((col, k) => `<rect x="${x + 16 + k * 26}" y="${y + 76 + (k % 2) * 2}" width="14" height="18" fill="${col}"/>`).join('')}`;
    });
    // bakery: نانوایی سنگکی with the pebble oven
    o += `<rect x="30" y="250" width="180" height="150" fill="#e4d3b8"/>${[...Array(5)].map((_, r) => `<path d="M30 ${262 + r * 30} h180" stroke="#cbb796" stroke-width="1.2"/>`).join('')}
      <rect x="26" y="252" width="188" height="42" rx="3" fill="#1f6b3a"/><rect x="30" y="256" width="180" height="34" rx="2" fill="none" stroke="#e8c98a" stroke-width="1.5"/>${FA(120, 280, 'نانوایی سنگکی', 19, '#fff')}<text x="120" y="304" text-anchor="middle" font-size="8" font-family="Nunito, sans-serif" font-weight="900" fill="#1f6b3a" opacity=".8">SANGAK BAKERY</text>
      <rect x="38" y="308" width="164" height="86" fill="${glass}" opacity="${night ? 0.6 : 0.9}"/><path d="M84 394 v-38 a36 30 0 0 1 72 0 v38z" fill="#1a1210"/><ellipse cx="120" cy="374" rx="30" ry="14" fill="#ff8a2a" opacity=".85"/><ellipse cx="120" cy="378" rx="18" ry="8" fill="#ffd36b"/>${[...Array(14)].map((_, i) => `<circle cx="${96 + (i % 7) * 8}" cy="${386 + Math.floor(i / 7) * 4}" r="1.8" fill="#8a7a6a"/>`).join('')}
      ${[46, 176].map((x) => `<path d="M${x} 314 h18 q4 36 -2 74 h-14 q-6 -38 -2 -74z" fill="#d9a35a"/>${[0, 1, 2, 3].map((k) => `<circle cx="${x + 9}" cy="${326 + k * 16}" r="2" fill="#b8803a"/>`).join('')}`).join('')}`;
    // juice & ice cream: آبمیوه و بستنی
    o += `<rect x="220" y="250" width="160" height="150" fill="#f3e3c4"/><rect x="216" y="252" width="168" height="42" rx="3" fill="#e98a2b"/>${FA(300, 279, 'آبمیوه و بستنی', 17, '#fff')}<text x="300" y="304" text-anchor="middle" font-size="8" font-family="Nunito, sans-serif" font-weight="900" fill="#c0601a">JUICE · ICE CREAM</text>
      <rect x="228" y="308" width="144" height="86" fill="${night ? '#ffe2a6' : '#fdf6ea'}"/>${['#e98a2b', '#a8162c', '#f2c230', '#e98a2b', '#7fc35a', '#a8162c', '#f2c230'].map((col, k) => `<path d="M${236 + k * 19} 316 h12 l-2 22 h-8z" fill="${col}" opacity=".9"/><path d="M${236 + k * 19} 316 h12" stroke="#fff" stroke-width="1.5"/><path d="M${245 + k * 19} 316 l3 -8" stroke="#e8577f" stroke-width="1.5"/>`).join('')}
      ${[[246, 384, '#e98a2b'], [262, 384, '#e98a2b'], [278, 384, '#e98a2b'], [254, 370, '#e98a2b'], [270, 370, '#e98a2b'], [262, 357, '#e98a2b'], [318, 384, '#a8162c'], [334, 384, '#a8162c'], [350, 384, '#a8162c'], [326, 370, '#a8162c'], [342, 370, '#a8162c']].map(([cx, cy, col]) => `<circle cx="${cx}" cy="${cy}" r="8" fill="${col}"/>`).join('')}<ellipse cx="300" cy="380" rx="11" ry="10" fill="#e9d79a"/><path d="M292 376 l16 8 M292 384 l16 -8" stroke="#c9b26a"/>
      <rect x="290" y="330" width="9" height="16" rx="2" fill="#e98a2b" opacity=".85"/><rect x="303" y="330" width="9" height="16" rx="2" fill="#e8577f" opacity=".85"/>`;
    // mini market: سوپرمارکت
    o += `<rect x="390" y="250" width="210" height="150" fill="${night ? '#2b2a48' : '#ddd3c4'}"/><rect x="390" y="252" width="210" height="40" fill="#1f5aa6"/>${FA(495, 278, 'سوپرمارکت', 18, '#fff')}<text x="495" y="302" text-anchor="middle" font-size="8" font-family="Nunito, sans-serif" font-weight="900" fill="#1f5aa6">MINI MARKET</text>
      <rect x="400" y="308" width="190" height="64" fill="${night ? '#ffe2a6' : '#eef3f6'}"/>${[0, 1, 2].map((r) => `<path d="M400 ${326 + r * 18} h190" stroke="#b8c2c8" stroke-width="2"/>${[...Array(14)].map((_, k) => `<rect x="${404 + k * 13}" y="${314 + r * 18}" width="9" height="11" fill="${['#e05b3b', '#ffd36b', '#5f9a57', '#7fb2ff', '#e98aab'][(k + r) % 5]}"/>`).join('')}`).join('')}
      <g><rect x="470" y="378" width="30" height="18" fill="#9a6a3a"/><circle cx="478" cy="376" r="6" fill="#3f7d3a"/><circle cx="491" cy="376" r="6" fill="#3f7d3a"/><rect x="503" y="380" width="26" height="16" fill="#9a6a3a"/>${[0, 1, 2].map((k) => `<circle cx="${508 + k * 8}" cy="${378}" r="4" fill="#d9362c"/>`).join('')}</g>`;
    // plane trees painted white at the bottom, the jub with a little bridge
    [-14, 400, 590].forEach((x) => { o += `<rect x="${x - 7}" y="522" width="14" height="48" fill="#f4f1ea"/>`; });
    o += `<rect x="300" y="566" width="46" height="20" fill="#a59d92"/><path d="M60 578 q4 -3 8 0 M150 576 q4 -3 8 0 M470 579 q4 -3 8 0" stroke="#d9a35a" stroke-width="2" fill="none"/>`;
    // blue street sign: Valiasr
    o += `<rect x="212" y="410" width="5" height="150" fill="#6a6a70"/><rect x="186" y="404" width="58" height="30" rx="3" fill="#1f4f9a" stroke="#fff" stroke-width="2"/>${FA(215, 420, 'خیابان ولیعصر', 9, '#fff')}<text x="215" y="430" text-anchor="middle" font-size="6.5" font-family="Nunito, sans-serif" font-weight="900" fill="#fff">VALIASR ST.</text>`;
    // the second car becomes a yellow Tehran taxi
    o += `<rect x="350" y="598" width="214" height="132" fill="#4a4a52"/>${[...Array(3)].map((_, i) => `<rect x="${380 + i * 80}" y="736" width="44" height="6" fill="#e9e1c8" opacity=".8"/>`).join('')}
      <g><rect x="360" y="642" width="196" height="46" rx="12" fill="#f2c230"/><path d="M396 642 l16 -30 h74 l22 30z" fill="#f2c230"/><path d="M404 640 l12 -24 h30 v24z M452 616 h30 l16 24 h-46z" fill="#8fb6cc"/><rect x="430" y="602" width="34" height="10" rx="3" fill="#fff" stroke="#2a2a2e"/>${FA(447, 610, 'تاکسی', 7, '#2a2a2e')}<path d="M360 664 h196" stroke="#2f8a54" stroke-width="5"/><circle cx="398" cy="692" r="18" fill="#2a2a2e"/><circle cx="398" cy="692" r="8" fill="#c9ccd0"/><circle cx="514" cy="692" r="18" fill="#2a2a2e"/><circle cx="514" cy="692" r="8" fill="#c9ccd0"/><rect x="548" y="650" width="10" height="7" rx="2" fill="#ffd98a"/></g>
      ${label(456, 718, 'TAXI · تاکسی', '#e9e1c8', 10)}`;
    return o;
  }


  /* ---- finer objects and accessories, drawn over each room ---- */
  const ACunit = (x, y, w) => `<g><rect x="${x}" y="${y}" width="${w}" height="34" rx="8" fill="#fbfbfa" stroke="#d9d9d6"/><rect x="${x + 8}" y="${y + 22}" width="${w - 16}" height="6" rx="3" fill="#e6e6e3"/>${[...Array(6)].map((_, i) => `<path d="M${x + 12 + i * ((w - 24) / 5)} ${y + 24} v4" stroke="#cfcfcb"/>`).join('')}<circle cx="${x + w - 12}" cy="${y + 10}" r="2" fill="#5fd38a"/><text x="${x + 10}" y="${y + 13}" font-size="6" font-family="Nunito, sans-serif" font-weight="900" fill="#9aa2a8">LG</text></g>`;
  const plate = (x, y, txt) => `<g><rect x="${x}" y="${y}" width="40" height="11" rx="2" fill="#fff" stroke="#333" stroke-width=".8"/><rect x="${x}" y="${y}" width="7" height="11" rx="1.5" fill="#1f4f9a"/><text x="${x + 23}" y="${y + 8.5}" text-anchor="middle" font-size="6.5" font-family="Nunito, sans-serif" font-weight="900" fill="#222">${txt}</text></g>`;
  const person = (who, x, y, w, h, mood) => (window.Art ? window.Art.person(who, { mood: mood || 'happy' }).replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" `) : '');
  const DET = {
    salon: (c) => `
      ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${160 + i * 42}" cy="436" r="2" fill="#d9cdbd"/><circle cx="${181 + i * 42}" cy="452" r="2" fill="#d9cdbd"/>`).join('')}
      <path d="M132 470 H354" stroke="#e1d5c5" stroke-width="2"/><path d="M243 470 v62" stroke="#e1d5c5" stroke-width="2"/>
      <rect x="118" y="534" width="8" height="12" rx="2" fill="#7a5032"/><rect x="360" y="534" width="8" height="12" rx="2" fill="#7a5032"/>
      <path d="M104 456 q-10 40 6 78 h30 q-10 -36 4 -76z" fill="#c9785a" opacity=".9"/>${[0, 1, 2, 3].map((i) => `<path d="M${112 + i * 7} 506 v30" stroke="#f3e0c9" stroke-width="1.6" opacity=".7"/>`).join('')}
      <path d="M156 432 h44 M286 432 h44" stroke="#fff" stroke-width="1.2" opacity=".35"/>
      <path d="M52 284 h28 M50 292 h32" stroke="#e6b85a" stroke-width="1.2"/><ellipse cx="66" cy="300" rx="22" ry="5" fill="#ffe6a8" opacity=".6"/>
      <g><path d="M78 706 q24 -12 44 0" fill="#7a4a22"/>${[...Array(9)].map((_, i) => `<circle cx="${84 + (i % 5) * 8}" cy="${703 - Math.floor(i / 5) * 4}" r="3" fill="${i % 2 ? '#8a5a2a' : '#a8743a'}"/>`).join('')}<path d="M77 706 h48" stroke="#fff" stroke-width="2" opacity=".55"/><g fill="#fff" opacity=".8"><circle cx="100" cy="716" r="2.6"/><circle cx="95" cy="712" r="1.2"/><circle cx="100" cy="710.5" r="1.2"/><circle cx="105" cy="712" r="1.2"/></g></g>
      <g><ellipse cx="184" cy="710" rx="22" ry="4" fill="#5fb8e8"/><path d="M172 709 q6 -2 12 0" stroke="#fff" stroke-width="1.6" opacity=".8"/><path d="M161 710 h46" stroke="#fff" stroke-width="2" opacity=".5"/></g>
      ${[...Array(5)].map((_, i) => `<path d="M${428 + i * 10} 530 v26" stroke="#a88456" stroke-width="1.2"/>`).join('')}<path d="M426 528 h52" stroke="#8a6a3a" stroke-width="3"/>
      <path d="M468 520 q10 -6 14 4 q-4 6 -10 2" stroke="#e8577f" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M492 676 h80 M492 698 h80" stroke="#5a3a22" stroke-width="1.6"/><circle cx="532" cy="666" r="2.5" fill="#c9a24a"/><circle cx="532" cy="688" r="2.5" fill="#c9a24a"/><rect x="494" y="720" width="6" height="8" fill="#4a2e1c"/><rect x="564" y="720" width="6" height="8" fill="#4a2e1c"/>
      <g><rect x="556" y="616" width="12" height="30" rx="5" fill="#2f6b8a"/><path d="M560 616 q-6 -14 -2 -24 M564 616 q4 -12 10 -18" stroke="#5a9150" stroke-width="2" fill="none"/><circle cx="574" cy="598" r="3" fill="#ef8fb0"/><circle cx="558" cy="592" r="3" fill="#ffd36b"/></g>
      <g><rect x="514" y="396" width="86" height="10" rx="2" fill="#8e1f2c"/><path d="M520 401 h74" stroke="#e8c98a" stroke-width="1" stroke-dasharray="3 2"/></g>
      <circle cx="560" cy="226" r="3" fill="#2a2a2e"/><circle cx="560" cy="226" r="1.6" fill="#9fc4da"/>`,
    kitchen: (c) => `
      <rect x="0" y="12" width="142" height="380" fill="url(#rsteel)" opacity=".18"/>
      <rect x="40" y="250" width="22" height="40" rx="4" fill="#e9ecef" stroke="#c9ccd0"/><rect x="45" y="262" width="12" height="14" rx="2" fill="#3a3f46"/><circle cx="51" cy="284" r="2" fill="#7fb2ff"/>
      ${[[478, 120], [520, 120], [478, 300], [520, 300]].map(([x, y]) => `<rect x="${x}" y="${y}" width="3" height="28" rx="1.5" fill="#c9ccd0"/>`).join('')}
      <g><rect x="152" y="252" width="40" height="22" rx="3" fill="#c9a27a"/><path d="M156 256 h32" stroke="#a87e54" stroke-width="1"/><path d="M160 262 q6 -8 12 0 q6 -8 12 0" stroke="#4d8044" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M186 270 l14 -8" stroke="#9aa2a8" stroke-width="2.5"/></g>
      <g><path d="M206 534 q-2 -22 8 -26 h44 q10 4 8 26z" fill="#9aa2a8"/><ellipse cx="236" cy="508" rx="30" ry="5" fill="#b8bec4"/><rect x="230" y="500" width="12" height="5" rx="2" fill="#2a2a2e"/><path d="M228 496 q4 -12 -2 -22 M244 494 q4 -10 0 -18" stroke="#fff" stroke-width="2.5" fill="none" opacity=".6"/></g>
      <g><path d="M300 540 q-30 0 -30 -8 h60 q0 8 -30 8z" fill="#e9e1d4"/><path d="M288 532 q4 -14 12 -16 q8 2 12 16z" fill="#d9a35a"/><path d="M296 520 h8" stroke="#a87e54" stroke-width="2"/></g>
      <g><ellipse cx="410" cy="538" rx="14" ry="3" fill="#2f6b8a"/><path d="M402 538 v-14 h16 v14" fill="#2f6b8a"/><path d="M400 524 q10 -18 20 0" stroke="#4d8044" stroke-width="4" fill="none"/><path d="M404 520 q6 -14 12 0" stroke="#5a9150" stroke-width="4" fill="none"/></g>
      ${[208, 300, 392].map((x) => `<rect x="${x - 20}" y="600" width="40" height="3" rx="1.5" fill="#c9ccd0"/>`).join('')}
      ${[200, 300, 400].map((x) => `<ellipse cx="${x}" cy="687" rx="24" ry="6" fill="#8a5a3a"/><ellipse cx="${x}" cy="712" rx="12" ry="3" fill="none" stroke="#9aa2a8" stroke-width="2"/>`).join('')}
      <g><rect x="470" y="160" width="62" height="40" rx="3" fill="#7a5032"/><rect x="474" y="164" width="54" height="32" fill="#f3e8d2"/>${FA(501, 185, 'نوش جان', 11, '#8e1f2c')}</g>`,
    tv: (c) => `
      <rect x="328" y="104" width="234" height="134" fill="url(#rglass)"/><text x="445" y="249" text-anchor="middle" font-size="6" font-family="Nunito, sans-serif" font-weight="900" fill="#666">SAMSUNG</text>
      ${[350, 440, 535].map((x) => `<rect x="${x - 8}" y="334" width="16" height="3" rx="1.5" fill="#c9a24a"/>`).join('')}
      <g><path d="M318 300 q2 -20 10 -26 q8 6 10 26z" fill="#2f6b8a"/><path d="M328 274 q-6 -16 -2 -28 M330 274 q6 -14 2 -26" stroke="#5a9150" stroke-width="2" fill="none"/><rect x="540" y="276" width="34" height="24" rx="2" fill="#c9a24a"/><rect x="544" y="280" width="26" height="16" fill="#bcd3e0"/><circle cx="557" cy="288" r="4" fill="#e8b48c"/></g>
      <g><path d="M206 404 q24 -10 48 0 l-4 22 q-20 6 -40 0z" fill="#fff" opacity=".85"/>${[...Array(7)].map((_, i) => `<circle cx="${212 + i * 6}" cy="${426 + (i % 2)}" r="2" fill="#fff"/>`).join('')}</g>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${180 + i * 28}" cy="440" r="2" fill="#5a3422"/>`).join('')}
      <rect x="154" y="528" width="8" height="12" rx="2" fill="#4a2e1c"/><rect x="338" y="528" width="8" height="12" rx="2" fill="#4a2e1c"/>
      ${ACunit(470, 36, 110)}
      <g><rect x="76" y="600" width="44" height="40" rx="3" fill="#6b4632"/><rect x="72" y="596" width="52" height="6" rx="2" fill="#7a5032"/><path d="M90 596 l-6 -40 h28 l-6 40z" fill="#f4e2b8" opacity=".95"/><circle cx="98" cy="580" r="34" fill="url(#rwarm)"/><rect x="84" y="610" width="28" height="12" rx="2" fill="#5a3a22"/></g>`,
    hall: (c) => `
      <g><ellipse cx="300" cy="18" rx="44" ry="6" fill="#fff"/><path d="M300 18 v14" stroke="#c9a24a" stroke-width="2"/><path d="M284 32 h32 l-6 12 h-20z" fill="#f4e2b8" stroke="#c9a24a"/><circle cx="300" cy="60" r="60" fill="url(#rwarm)" opacity=".6"/></g>
      ${[124, 262, 400, 560].map((x) => `<rect x="${x - 4}" y="330" width="8" height="16" rx="3" fill="#c9a24a"/>`).join('')}
      <g><rect x="560" y="420" width="38" height="10" rx="2" fill="#7a5032"/><rect x="564" y="430" width="4" height="40" fill="#5a3a22"/><rect x="590" y="430" width="4" height="40" fill="#5a3a22"/><path d="M570 420 q4 -16 18 -14 v14z" fill="#2a2a2e"/><path d="M574 408 q-4 -10 6 -10" stroke="#2a2a2e" stroke-width="2" fill="none"/></g>`,
    bedroom: (c) => `
      ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${70 + i * 44}" cy="360" r="2.4" fill="#a87a84"/><circle cx="${92 + i * 44}" cy="388" r="2.4" fill="#a87a84"/>`).join('')}
      <path d="M40 530 q60 -10 120 6 t110 -6 M40 556 q70 -8 130 6 t100 -4" stroke="#e59ab0" stroke-width="2" fill="none"/>
      <path d="M200 560 h80 v26 q-40 8 -80 0z" fill="#c9a0a8" opacity=".85"/>${[0, 1, 2].map((i) => `<path d="M206 ${566 + i * 7} h68" stroke="#fff" stroke-width="1.2" opacity=".5"/>`).join('')}
      <g><circle cx="74" cy="452" r="14" fill="#c98f4f"/><circle cx="64" cy="440" r="6" fill="#c98f4f"/><circle cx="84" cy="440" r="6" fill="#c98f4f"/><circle cx="74" cy="456" r="6" fill="#e8c09a"/><circle cx="69" cy="449" r="1.6" fill="#2a2130"/><circle cx="79" cy="449" r="1.6" fill="#2a2130"/><path d="M60 466 q14 10 28 0 v14 q-14 6 -28 0z" fill="#c98f4f"/></g>
      <rect x="306" y="126" width="78" height="108" fill="#ffe9d6"/><circle cx="345" cy="172" r="26" fill="#e8952f"/><circle cx="345" cy="176" r="18" fill="#f2a94e"/><circle cx="338" cy="172" r="2.4" fill="#2a2130"/><circle cx="352" cy="172" r="2.4" fill="#2a2130"/><ellipse cx="345" cy="181" rx="4" ry="3" fill="#2a2130"/><circle cx="327" cy="150" r="6" fill="#c96f1c"/><circle cx="363" cy="150" r="6" fill="#c96f1c"/>${label(345, 222, 'SIMBA ♥', '#c9496f', 11)}
      <rect x="328" y="254" width="36" height="22" fill="#fff" opacity=".85"/><rect x="331" y="257" width="30" height="5" fill="#ef8fb0"/>${[0, 1, 2].map((k) => `<rect x="${332 + k * 10}" y="264" width="8" height="8" fill="${['#ffd36b', '#7fb2ff', '#e98aab'][k]}"/>`).join('')}
      <g><path d="M372 282 v-30 l14 -12" stroke="#3a3550" stroke-width="3" fill="none"/><path d="M378 236 l18 -6 4 12 -18 6z" fill="#ef8fb0"/><rect x="364" y="279" width="16" height="4" rx="2" fill="#3a3550"/></g>
      <g><rect x="284" y="270" width="10" height="12" rx="2" fill="#7fb2ff"/><path d="M286 270 l-2 -10 M290 270 l1 -12 M292 270 l3 -9" stroke="#e05b3b" stroke-width="1.6"/></g>
      <g><rect x="312" y="330" width="56" height="10" rx="4" fill="#f2b7c8"/><rect x="314" y="340" width="52" height="40" rx="6" fill="#f2b7c8"/><rect x="318" y="380" width="4" height="40" fill="#bfbfc4"/><rect x="358" y="380" width="4" height="40" fill="#bfbfc4"/><ellipse cx="340" cy="420" rx="26" ry="4" fill="#bfbfc4"/></g>
      <g><path d="M488 252 v-16 h22" stroke="#c9ccd0" stroke-width="3" fill="none"/><rect x="530" y="244" width="10" height="16" rx="2" fill="#7fe0b4"/><path d="M533 244 v-8 M537 244 v-10" stroke="#ef8fb0" stroke-width="1.6"/></g>
      <g><path d="M584 606 v-30 q0 -10 -12 -10 h-14" stroke="#c9ccd0" stroke-width="4" fill="none"/><ellipse cx="556" cy="566" rx="10" ry="4" fill="#c9ccd0"/><path d="M574 598 h14" stroke="#c9ccd0" stroke-width="5"/></g>
      <g fill="#fff" opacity=".85"><circle cx="470" cy="598" r="5"/><circle cx="482" cy="594" r="4"/><circle cx="530" cy="597" r="6"/><circle cx="545" cy="600" r="3.5"/></g>`,
    street: (c) => {
      const night = !!c.night;
      let o = '';
      // striped awnings and shop doors
      [[30, 180, '#1f6b3a', '#f4efe2'], [220, 160, '#e98a2b', '#fff6e8'], [390, 210, '#1f5aa6', '#eef3f6']].forEach(([x, w, a, b]) => {
        o += `<g>${[...Array(Math.ceil(w / 20))].map((_, i) => `<path d="M${x + i * 20} 294 h20 v12 q-10 8 -20 0z" fill="${i % 2 ? a : b}"/>`).join('')}<path d="M${x} 294 h${w}" stroke="rgba(0,0,0,.2)" stroke-width="2"/></g>`;
      });
      o += `<rect x="168" y="326" width="36" height="70" fill="${night ? '#ffd98a' : '#9fc4da'}" opacity=".7" stroke="#5a3a22" stroke-width="3"/><circle cx="196" cy="364" r="2" fill="#c9a24a"/>`;
      o += `<rect x="534" y="326" width="40" height="70" fill="${night ? '#ffe2a6' : '#cfe3ea'}" stroke="#7a8a96" stroke-width="3"/><rect x="540" y="340" width="28" height="12" rx="2" fill="#fff"/>${FA(554, 349, 'باز است', 7, '#2f8a54')}`;
      // shopkeepers behind the counters
      o += person('guest4', 128, 330, 34, 60) + person('guest2', 352, 330, 32, 56);
      // juice stand chairs
      o += `<g><path d="M232 520 h26 v-4 h-26z M234 520 v22 M256 520 v22 M236 516 v-24 h20 v24" stroke="#e8577f" stroke-width="3" fill="none"/></g>`;
      // street lamp + wires
      o += `<g><rect x="380" y="300" width="7" height="270" fill="#4a4a52"/><path d="M383 304 q0 -24 30 -24" stroke="#4a4a52" stroke-width="6" fill="none"/><path d="M406 280 h24 l-4 10 h-16z" fill="#3a3a42"/><ellipse cx="418" cy="292" rx="10" ry="3" fill="${night ? '#ffe9a8' : '#fff6dc'}"/>${night ? '<circle cx="418" cy="300" r="60" fill="url(#rwarm)"/>' : ''}</g>`;
      o += `<path d="M0 120 q180 30 383 6 t217 10 M0 132 q200 26 383 2" stroke="#2a2a2e" stroke-width="1.4" fill="none" opacity=".6"/>`;
      // sidewalk paving and kerb
      o += `<g opacity=".35">${[...Array(15)].map((_, i) => `<path d="M${i * 40 + 20} 400 v170" stroke="#9a9288" stroke-width=".8"/>`).join('')}${[430, 460, 515, 545].map((y) => `<path d="M0 ${y} H600" stroke="#9a9288" stroke-width=".8"/>`).join('')}</g><rect x="0" y="566" width="600" height="5" fill="#d9d2c6"/>${[...Array(15)].map((_, i) => `<rect x="${i * 40}" y="566" width="20" height="5" fill="#2a2a2e" opacity=".55"/>`).join('')}`;
      // parked motorbike (Tehran's Honda 125)
      o += `<g transform="translate(40 486)"><circle cx="10" cy="44" r="13" fill="#2a2a2e"/><circle cx="10" cy="44" r="5" fill="#9aa2a8"/><circle cx="76" cy="44" r="13" fill="#2a2a2e"/><circle cx="76" cy="44" r="5" fill="#9aa2a8"/><path d="M10 44 l18 -24 h30 l18 24" stroke="#555" stroke-width="4" fill="none"/><path d="M26 22 q14 -10 34 0 v8 h-34z" fill="#c0392b"/><path d="M58 18 h18 l8 -8" stroke="#2a2a2e" stroke-width="4" fill="none" stroke-linecap="round"/><rect x="28" y="16" width="26" height="6" rx="3" fill="#2a2a2e"/><circle cx="84" cy="12" r="4" fill="#ffd98a"/></g>`;
      // zebra crossing + manhole
      o += `${[...Array(7)].map((_, i) => `<rect x="284" y="${598 + i * 28}" width="64" height="14" fill="#f2efe6" opacity=".9"/>`).join('')}<ellipse cx="320" cy="772" rx="18" ry="6" fill="#3a3a42" stroke="#5a5a62" stroke-width="2"/>`;
      // car details: plates, mirrors, handles, hubcaps
      o += plate(148, 668, '۲۲ ج ۴۸۶') + plate(428, 672, '۱۱ ت ۳۵۷') + `<rect x="228" y="626" width="14" height="4" rx="2" fill="#9aa2a8"/><path d="M180 622 v54" stroke="#d6d6d4" stroke-width="2"/><rect x="190" y="640" width="12" height="3" rx="1.5" fill="#9aa2a8"/><path d="M458 642 v44" stroke="#d9a820" stroke-width="2"/><rect x="466" y="656" width="12" height="3" rx="1.5" fill="#8a6a10"/>`;
      return o;
    },
  };

  /* ----------------------------------------------------------------- */
  const ART = {};

  ART.salon = (c) => svg(`
    ${wall(392)}
    ${bay(104, 22, 398, 364, 20, 4)}${drapes(104, 22, 398, 364)}
    ${arch(0, 196, 88, 196, 'KITCHEN · TV')}
    <rect x="512" y="186" width="88" height="206" fill="#e2d6c4"/><rect x="518" y="192" width="82" height="200" fill="#5a3a26"/><rect x="532" y="210" width="54" height="44" rx="4" fill="#9fc4da" opacity=".7"/><rect x="590" y="300" width="4" height="24" rx="2" fill="#c9a24a"/>
    ${label(558, 182, 'FRONT DOOR', '#7a5c4e', 9)}
    ${marble(392)}${refl(104, 398, 394, 4)}
    <rect x="512" y="392" width="88" height="14" fill="#8c6a4a" opacity=".35"/>
    ${ao(244, 540, 150, 18)}${ao(530, 724, 56, 10)}${ao(452, 560, 34, 8)}
    ${persianRug(320, 630, 420, 156)}${shoeRack(522, 396)}
    <g><rect x="112" y="596" width="110" height="10" rx="3" fill="#cfe3ea" opacity=".75" stroke="#9fb6c4"/><rect x="118" y="606" width="5" height="24" fill="#8a6a4a"/><rect x="211" y="606" width="5" height="24" fill="#8a6a4a"/>${fruitBowl(140, 586, 0.7)}${teaTray(190, 584)}</g>
    <rect x="118" y="438" width="250" height="96" rx="28" fill="#efe6da"/><rect x="132" y="408" width="222" height="62" rx="24" fill="#f4ece2"/><rect x="106" y="452" width="36" height="84" rx="16" fill="#e6dccf"/><rect x="344" y="452" width="36" height="84" rx="16" fill="#e6dccf"/>
    <rect x="152" y="424" width="52" height="40" rx="12" fill="#c9785a"/><rect x="282" y="424" width="52" height="40" rx="12" fill="#2f4a3e"/>
    <g><rect x="64" y="300" width="4" height="120" fill="#3a3550"/><path d="M48 300 h36 l-8 -26 h-20z" fill="#ffd98a"/><ellipse cx="66" cy="422" rx="18" ry="5" fill="#3a3550"/></g>
    <ellipse cx="330" cy="604" rx="72" ry="22" fill="#b5476d"/><ellipse cx="330" cy="598" rx="58" ry="15" fill="#f3c6d5"/>
    <path d="M426 528 h52 l-6 30 h-40z" fill="#c9a67a"/><path d="M430 540 h44 M432 550 h40" stroke="#a88456" stroke-width="2"/><circle cx="444" cy="524" r="9" fill="#d8e650"/><path d="M462 516 q8 -8 14 4" stroke="#4a7bd0" stroke-width="5" fill="none"/>
    <rect x="492" y="650" width="80" height="70" rx="4" fill="#6b4632"/><rect x="488" y="646" width="88" height="7" rx="2" fill="#f3efe9"/><rect x="512" y="626" width="34" height="14" rx="5" fill="#ef8fb0"/><path d="M516 640 v6 M522 640 v6 M528 640 v6 M534 640 v6 M540 640 v6" stroke="#c9496f" stroke-width="2"/>
    <ellipse cx="142" cy="728" rx="92" ry="9" fill="rgba(0,0,0,.1)"/>
    <path d="M74 704 h52 l-6 18 h-40z" fill="#e98aab"/><path d="M158 708 h52 l-6 18 h-40z" fill="#7aa6c2"/>
    ${label(142, 754, 'SIMBA', '#7a5c4e', 13)}
    ${plant(470, 392, 1.1)}
    ${DET.salon(c)}
  `, c);

  ART.kitchen = (c) => svg(`
    <rect width="600" height="392" fill="#fbfbfa"/><rect width="600" height="12" fill="#ffffff"/>
    ${bay(150, 22, 300, 226, 90, 3)}<rect x="150" y="22" width="300" height="70" fill="#fff" opacity=".25"/>${[...Array(22)].map((_, i) => `<path d="M${156 + i * 13.5} 22 q3 34 -1 70" stroke="#fff" stroke-width="1.3" opacity=".4" fill="none"/>`).join('')}<path d="M150 92 ${[...Array(15)].map(() => 'q10 8 20 0').join(' ')}" fill="none" stroke="#f0e6d8" stroke-width="3"/>
    <rect x="0" y="12" width="142" height="380" fill="#f7f7f6"/>${[0, 1].map((i) => `<path d="M${71 * (i + 1)} 12 V392" stroke="#e1e1df" stroke-width="2"/>`).join('')}<path d="M0 200 H142" stroke="#e1e1df" stroke-width="2"/><rect x="66" y="230" width="3" height="60" rx="1.5" fill="#d4d4d2"/><rect x="74" y="230" width="3" height="60" rx="1.5" fill="#d4d4d2"/>
    ${label(71, 180, 'FRIDGE', '#c3c3c0', 9)}
    <rect x="22" y="52" width="40" height="52" fill="#fff" stroke="#d9d9d6"/><rect x="22" y="52" width="40" height="12" fill="#2f8a54"/>${FA(42, 62, 'آذر', 8, '#fff')}<g fill="#9aa2a8">${[...Array(12)].map((_, i) => `<rect x="${26 + (i % 4) * 9}" y="${70 + Math.floor(i / 4) * 10}" width="5" height="5"/>`).join('')}</g>
    <circle cx="92" cy="74" r="6" fill="#e05b3b"/><rect x="84" y="96" width="16" height="12" rx="2" fill="#7fb2ff"/><circle cx="104" cy="130" r="5" fill="#ffd36b"/><rect x="18" y="230" width="30" height="20" fill="#fff" stroke="#ddd"/><path d="M22 238 h22 M22 244 h16" stroke="#c9496f" stroke-width="2"/>
    <rect x="458" y="12" width="82" height="380" fill="#f7f7f6"/><path d="M499 12 V392 M458 200 H540" stroke="#e1e1df" stroke-width="2"/>
    <rect x="474" y="232" width="50" height="34" rx="4" fill="#2a2a2e"/><rect x="478" y="236" width="42" height="26" rx="3" fill="#3b3f46"/><circle cx="499" cy="249" r="3" fill="#7fe0b4"/>
    <rect x="142" y="248" width="316" height="34" fill="#f1f1ef"/><path d="M160 256 q40 10 80 -2 t90 6 t110 -4" stroke="#c9cbcf" stroke-width="1.2" fill="none"/>
    <rect x="142" y="282" width="316" height="10" fill="#ffffff" stroke="#e6e6e4"/><path d="M150 287 q60 4 120 -1 t170 2" stroke="#c9cbcf" stroke-width="1" fill="none"/>
    <rect x="142" y="292" width="316" height="100" fill="#f9f9f8"/>${[0, 1, 2, 3].map((i) => `<path d="M${142 + 79 * (i + 1)} 292 V392" stroke="#e4e4e2" stroke-width="2"/>`).join('')}<path d="M142 300 H458" stroke="#ececea" stroke-width="2"/>
    <rect x="166" y="272" width="54" height="12" rx="4" fill="#dfe3e6"/><path d="M193 272 v-22 q0 -8 10 -8 h6" stroke="#9aa2a8" stroke-width="3.5" fill="none"/>
    <g><ellipse cx="300" cy="282" rx="24" ry="4" fill="rgba(0,0,0,.12)"/><path d="M282 280 q-4 -30 7 -43 h22 q11 13 7 43z" fill="#d9b866"/><path d="M291 237 q9 -9 18 0" fill="#c9a24a"/><path d="M292 228 h16 l-2 10 h-12z" fill="#e05b7b"/><path d="M282 248 q-2 18 4 28" stroke="#fff6cc" stroke-width="3" fill="none" opacity=".7"/></g>
    <g><ellipse cx="248" cy="282" rx="20" ry="4" fill="rgba(0,0,0,.12)"/><rect x="230" y="256" width="36" height="26" rx="10" fill="#f6f4ef" stroke="#d6d2c8"/><ellipse cx="248" cy="257" rx="18" ry="6" fill="#c0392b"/><rect x="244" y="248" width="8" height="5" rx="2" fill="#2a2a2e"/><circle cx="248" cy="270" r="2" fill="#5fd38a"/></g>${teaTray(352, 266)}
    <g><path d="M384 282 l4 -40 h28 l4 40z" fill="#c9a27a"/><path d="M388 248 h28" stroke="#9a6232" stroke-width="3"/>${label(402, 268, 'KIBBLE', '#7a4a22', 9)}</g>
    ${arch(540, 196, 60, 196, '')}${label(570, 190, 'LIVING ›', '#9a9a96', 9)}
    ${marble(392)}${ao(300, 656, 170, 16)}${ao(300, 736, 140, 12)}
    ${[210, 300, 390].map((x) => `<path d="M${x} 392 V448" stroke="#c9ccd0" stroke-width="1.5"/><path d="M${x - 16} 462 q16 -22 32 0z" fill="#f4f4f2" stroke="#d6d6d4"/><ellipse cx="${x}" cy="470" rx="34" ry="12" fill="url(#rglow)" opacity=".7"/>`).join('')}
    <rect x="150" y="540" width="300" height="18" rx="4" fill="#f4f3f0" stroke="#dcdcda"/><path d="M164 548 q60 6 120 -2 t150 4" stroke="#b9bcc0" stroke-width="1.2" fill="none"/>
    <rect x="162" y="558" width="276" height="96" fill="#fafaf9"/><path d="M162 580 H438" stroke="#ececea" stroke-width="2"/>${[0, 1].map((i) => `<path d="M${162 + 92 * (i + 1)} 580 V654" stroke="#ececea" stroke-width="2"/>`).join('')}
    <rect x="196" y="532" width="80" height="8" rx="3" fill="#2a2a2e"/><circle cx="216" cy="536" r="2.5" fill="#ff8a3a"/><circle cx="256" cy="536" r="2.5" fill="#555"/>
    <g><ellipse cx="370" cy="538" rx="22" ry="5" fill="#f3efe9"/><circle cx="362" cy="530" r="7" fill="#e05b3b"/><circle cx="376" cy="530" r="6" fill="#f2b33a"/></g>
    ${[200, 300, 400].map((x) => `<ellipse cx="${x}" cy="690" rx="24" ry="8" fill="#2a2a2e"/><rect x="${x - 2}" y="690" width="4" height="40" fill="#9aa2a8"/><ellipse cx="${x}" cy="732" rx="16" ry="4" fill="#9aa2a8"/>`).join('')}
    ${DET.kitchen(c)}
  `, c);

  ART.tv = (c) => svg(`
    ${wall(392, '#efe6da')}
    ${bay(46, 22, 240, 364, 40, 3)}
    <rect x="320" y="96" width="250" height="150" rx="6" fill="#111"/><rect x="328" y="104" width="234" height="134" fill="url(#rtv)"/>
    <path d="M328 171 H562 M445 104 V238" stroke="#fff" stroke-width="2" opacity=".55"/><circle cx="445" cy="171" r="20" fill="none" stroke="#fff" stroke-width="2" opacity=".55"/><rect x="328" y="146" width="22" height="50" fill="none" stroke="#fff" stroke-width="2" opacity=".55"/><rect x="540" y="146" width="22" height="50" fill="none" stroke="#fff" stroke-width="2" opacity=".55"/>
    <circle cx="470" cy="160" r="4" fill="#fff"/><rect x="336" y="110" width="74" height="14" rx="3" fill="rgba(0,0,0,.45)"/><text x="373" y="121" text-anchor="middle" font-size="9" font-family="Nunito, sans-serif" font-weight="800" fill="#fff">PERSEPOLIS 2–1</text>
    <rect x="330" y="252" width="230" height="10" rx="3" fill="#2a2a2a"/>
    ${drapes(46, 22, 240, 364, '#5a3f2a', '#7a573a')}
    <rect x="300" y="300" width="290" height="70" rx="6" fill="#6b4632"/><rect x="310" y="312" width="80" height="46" rx="4" fill="#5a3a26"/><rect x="400" y="312" width="80" height="46" rx="4" fill="#5a3a26"/><rect x="490" y="312" width="90" height="46" rx="4" fill="#5a3a26"/>
    <rect x="0" y="0" width="38" height="392" fill="#e6dccf"/><rect x="0" y="196" width="34" height="196" fill="#c7b499"/>${label(20, 190, '‹', '#7a5c4e', 16)}
    ${marble(392)}${refl(46, 240, 394, 3)}${ao(250, 534, 130, 16)}${ao(445, 372, 150, 10)}
    ${persianRug(330, 648, 460, 176, { field: '#1f3a6b', border: '#8e1f2c', guard: '#e8c98a', med: '#f1dcae', med2: '#8e1f2c' })}
    <g><rect x="396" y="290" width="44" height="10" rx="2" fill="#1d1d22"/><circle cx="432" cy="295" r="1.8" fill="#5fd38a"/><path d="M402 295 h16" stroke="#3a3a42" stroke-width="2"/></g>
    ${poshti(392, 398, '#8e1f2c')}${poshti(458, 398, '#2a3d6e')}${poshti(524, 398, '#8e1f2c')}
    <g><rect x="150" y="430" width="200" height="100" rx="26" fill="#7a4a32"/><rect x="164" y="402" width="172" height="64" rx="22" fill="#8a5a3a"/><rect x="138" y="446" width="34" height="88" rx="16" fill="#6b3f2a"/><rect x="328" y="446" width="34" height="88" rx="16" fill="#6b3f2a"/><rect x="186" y="420" width="46" height="36" rx="10" fill="#d9b866"/></g>
    <rect x="370" y="600" width="170" height="14" rx="4" fill="#6b4632"/><rect x="380" y="614" width="6" height="36" fill="#5a3a26"/><rect x="524" y="614" width="6" height="36" fill="#5a3a26"/>
    <g><path d="M420 594 q12 -10 24 0 q-12 8 -24 0z" fill="none" stroke="#3a6b4a" stroke-width="2.4" stroke-dasharray="1.5 2.4"/><path d="M432 597 v8" stroke="#3a6b4a" stroke-width="2"/><path d="M486 590 q6 -4 12 0 M498 590 q6 -4 12 0 M498 590 h-0" stroke="#3a3550" stroke-width="2" fill="none"/><circle cx="492" cy="591" r="5" fill="none" stroke="#3a3550" stroke-width="1.6"/><circle cx="504" cy="591" r="5" fill="none" stroke="#3a3550" stroke-width="1.6"/></g>
    <g><rect x="398" y="580" width="12" height="20" rx="2" fill="#f8e3c2" opacity=".9"/><rect x="400" y="586" width="8" height="12" fill="#b4472a"/><ellipse cx="470" cy="596" rx="24" ry="6" fill="#e9e1d4"/><circle cx="462" cy="588" r="7" fill="#e05b3b"/><circle cx="476" cy="588" r="6" fill="#9b59b6"/><circle cx="512" cy="594" r="10" fill="#c9a24a" opacity=".6"/></g>
    ${plant(560, 392, 1.1)}
    ${DET.tv(c)}
  `, c);

  ART.hall = (c) => {
    const door = (x, w, col, frame, name, extra) => `<rect x="${x - 6}" y="226" width="${w + 12}" height="206" fill="#e2d6c4"/><rect x="${x}" y="232" width="${w}" height="200" fill="${col}"/><rect x="${x + 10}" y="246" width="${w - 20}" height="70" rx="4" fill="none" stroke="${frame}" stroke-width="2" opacity=".5"/><rect x="${x + 10}" y="330" width="${w - 20}" height="88" rx="4" fill="none" stroke="${frame}" stroke-width="2" opacity=".5"/><circle cx="${x + w - 14}" cy="338" r="4" fill="#c9a24a"/><rect x="${x + w / 2 - Math.max(34, name.length * 4.6)}" y="196" width="${Math.max(68, name.length * 9.2)}" height="22" rx="6" fill="#fff8ee" stroke="${frame}" stroke-width="2"/>${label(x + w / 2, 212, name, frame, 11)}${extra || ''}`;
    return svg(`
    ${wall(432, '#f1e7d8')}
    <rect y="300" width="600" height="132" fill="#e6d8c4"/><path d="M0 300 H600" stroke="#cdb99c" stroke-width="3"/>
    ${bay(30, 24, 540, 150, 0, 6)}
    ${door(40, 96, '#f2b7c8', '#c9496f', 'NENA', label(88, 290, '♥', '#c9496f', 22))}
    ${door(178, 96, '#c8a2d6', '#7d4a96', 'NASIM', '<rect x="196" y="262" width="60" height="18" rx="3" fill="#ffde59" transform="rotate(-6 226 271)"/><text x="226" y="275" text-anchor="middle" font-size="9" font-family="Nunito, sans-serif" font-weight="900" fill="#c0392b" transform="rotate(-6 226 271)">KEEP OUT!</text>')}
    ${door(316, 96, '#a9c2d4', '#4a5a8a', 'NEGIN', '<text x="364" y="282" text-anchor="middle" font-size="9" font-family="Nunito, sans-serif" font-weight="900" fill="#4a5a8a">DO NOT WAKE</text><text x="388" y="258" font-size="16">💤</text>')}
    ${door(450, 124, '#b98b5e', '#6b4632', 'BABA & MAMAN', '<path d="M512 232 V432" stroke="#8a6340" stroke-width="3"/>')}
    ${marble(432)}
    <polygon points="230,432 370,432 420,800 180,800" fill="#8c1f30" opacity=".9"/><polygon points="242,440 358,440 404,800 196,800" fill="none" stroke="#1f2a5a" stroke-width="5"/>
    ${runner(230, 370, 180, 420, 432, 800)}
    ${[157, 295, 433].map((x) => `<g><circle cx="${x}" cy="262" r="26" fill="url(#rwarm)"/><path d="M${x - 7} 270 h14 l-3 -18 h-8z" fill="#f4e2b8" stroke="#c9a24a"/><rect x="${x - 2}" y="270" width="4" height="8" fill="#c9a24a"/></g>`).join('')}
    ${famPhoto(140, 330, 34, 44)}${famPhoto(280, 340, 30, 38)}${famPhoto(574, 320, 22, 60)}
    <g stroke="#fff" stroke-width="5" stroke-linecap="round"><path d="M150 742 H450 M150 778 H450"/>${[...Array(13)].map((_, i) => `<path d="M${156 + i * 24} 738 v48"/>`).join('')}</g>
    <rect x="232" y="700" width="136" height="30" rx="6" fill="#2f4a3e"/>${label(300, 715, 'BEDROOMS', '#ffd98a', 11)}<text x="300" y="726" text-anchor="middle" font-size="9" font-family="Nunito, sans-serif" font-weight="800" fill="#fff">🔑 Nena only</text>
    ${DET.hall(c)}
  `, c);
  };

  ART.bedroom = (c) => svg(`
    <rect width="410" height="430" fill="#f6e4e4"/><rect width="410" height="12" fill="#fbf3f0"/>
    ${bay(24, 22, 262, 300, 20, 3)}
    ${drapes(24, 22, 262, 300, '#d77f9a', '#ee9db4')}
    <path d="M30 40 q100 30 200 0 q60 20 120 0" stroke="#7a5c4e" stroke-width="1.2" fill="none"/>
    <rect x="296" y="64" width="104" height="6" fill="#8a5a3a"/>${['#c9496f', '#3a5480', '#e7b84a', '#5f9a57', '#9b59b6', '#e05b3b', '#3a3550'].map((col, i) => `<rect x="${300 + i * 12}" y="${36 + (i % 3) * 3}" width="10" height="${28 - (i % 3) * 3}" fill="${col}"/>`).join('')}<path d="M388 64 l8 -26" stroke="#c9a24a" stroke-width="5" stroke-linecap="round"/>${[...Array(12)].map((_, i) => `<circle cx="${40 + i * 27}" cy="${46 + Math.sin(i) * 6}" r="3.4" fill="${['#ffd98a', '#ef8fb0', '#86d1ff'][i % 3]}"/>`).join('')}
    <rect x="276" y="282" width="120" height="10" rx="2" fill="#8a5a3a"/><rect x="284" y="292" width="6" height="140" fill="#7a4e32"/><rect x="382" y="292" width="6" height="140" fill="#7a4e32"/>
    <path d="M318 282 l6 -34 h44 l6 34z" fill="#3a3550"/><rect x="326" y="252" width="40" height="26" fill="#ef8fb0" opacity=".85"/>
    <rect x="300" y="120" width="90" height="120" rx="4" fill="#e9d2d2"/><rect x="306" y="126" width="78" height="108" fill="#f8eeee"/>${label(345, 186, 'NENA', '#c9496f', 13)}
    ${marble(430, 0, 410)}${ao(156, 592, 150, 18)}${ao(140, 712, 90, 10)}
    <rect x="30" y="330" width="250" height="110" rx="18" fill="#c9a0a8"/>
    <rect x="22" y="420" width="268" height="170" rx="24" fill="#f5ead9"/><path d="M22 470 q134 -30 268 0 v96 q0 24 -24 24 h-220 q-24 0 -24 -24z" fill="#f2b7c8"/><path d="M40 500 q60 -14 120 8 q60 18 120 -4" stroke="#fff" stroke-width="4" fill="none" opacity=".5"/>
    <rect x="44" y="420" width="88" height="44" rx="18" fill="#fff"/><rect x="150" y="420" width="88" height="44" rx="18" fill="#fff"/>
    <g><rect x="182" y="452" width="70" height="40" rx="10" fill="#e8a25a" transform="rotate(-8 217 472)"/><text x="217" y="478" text-anchor="middle" font-size="18" transform="rotate(-8 217 472)">🐾</text></g>
    <rect x="60" y="640" width="160" height="70" rx="35" fill="#efe1f2"/>
    <g><ellipse cx="250" cy="626" rx="11" ry="5" fill="#f2b7c8"/><ellipse cx="270" cy="630" rx="11" ry="5" fill="#f2b7c8"/><circle cx="246" cy="622" r="4" fill="#fff"/><circle cx="266" cy="626" r="4" fill="#fff"/></g>
    <rect x="410" y="330" width="190" height="10" fill="#3aa8a0"/><rect x="410" y="342" width="190" height="4" fill="#2a7f7a"/>
    <g><rect x="566" y="290" width="34" height="5" rx="2" fill="#c9a24a"/><rect x="570" y="295" width="26" height="62" rx="4" fill="#ef8fb0"/><path d="M570 345 h26" stroke="#fff" stroke-width="3"/></g>
    <g><rect x="440" y="580" width="12" height="20" rx="3" fill="#7fb2ff"/><rect x="456" y="584" width="10" height="16" rx="3" fill="#ffd36b"/><rect x="443" y="576" width="6" height="5" fill="#fff"/></g>
    <rect x="410" y="0" width="190" height="800" fill="#e9f2f2"/>${[...Array(5)].map((_, k) => `<path d="M${410 + k * 40} 0 V800" stroke="#d3e2e2"/>`).join('')}${[...Array(20)].map((_, r) => `<path d="M410 ${r * 40} H600" stroke="#d3e2e2"/>`).join('')}
    <rect x="404" y="0" width="10" height="800" fill="#bcd8e6" opacity=".8"/>
    <circle cx="505" cy="190" r="56" fill="#cfe3ea" stroke="#c9a24a" stroke-width="5"/><path d="M480 160 q16 -14 32 -4" stroke="#fff" stroke-width="5" fill="none" opacity=".7"/>
    <rect x="450" y="262" width="110" height="20" rx="4" fill="#fff"/><rect x="458" y="282" width="94" height="74" rx="4" fill="#cfa77a"/><ellipse cx="505" cy="266" rx="30" ry="6" fill="#dfeef2"/><path d="M505 258 v-10 h10" stroke="#9aa2a8" stroke-width="3" fill="none"/>
    <path d="M416 600 h178 v50 q0 46 -46 46 h-86 q-46 0 -46 -46z" fill="#fff" stroke="#d3dde0" stroke-width="3"/><ellipse cx="505" cy="604" rx="84" ry="10" fill="#bfe4f2"/><path d="M432 694 l-6 18 M578 694 l6 18" stroke="#c9a24a" stroke-width="5"/>
    ${win(426, 376, 162, 196, 220, 2)}
    <rect x="440" y="730" width="120" height="40" rx="12" fill="#86d1ff" opacity=".6"/>
    <rect x="0" y="560" width="14" height="200" fill="#8a5a3a"/><rect x="0" y="560" width="10" height="200" fill="#c7b499"/>
    ${DET.bedroom(c)}
  `, c);

  ART.street = (c) => {
    const night = !!c.night;
    const shop = (x, w, col, sign, sub) => `<rect x="${x}" y="250" width="${w}" height="150" fill="${col}"/><rect x="${x + 8}" y="300" width="${w - 16}" height="90" fill="${night ? '#ffd98a' : '#cfe3ea'}" opacity="${night ? 0.85 : 0.9}"/><rect x="${x}" y="258" width="${w}" height="34" fill="#2f4a3e"/>${label(x + w / 2, 276, sign, '#ffd98a', 13)}<text x="${x + w / 2}" y="288" text-anchor="middle" font-size="9" font-family="Nunito, sans-serif" font-weight="800" fill="#fff">${sub}</text>`;
    return svg(`
    <rect width="600" height="400" fill="url(#rsky)"/>
    <svg x="0" y="0" width="600" height="300" viewBox="0 0 400 200" preserveAspectRatio="none">${VIEW}</svg>
    ${[[0, 90, 120], [120, 60, 130], [450, 80, 150]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="320" fill="${night ? '#2b2a48' : '#d8c6ae'}"/>${[...Array(6)].map((_, r) => [...Array(Math.floor(w / 26))].map((_, k) => `<rect x="${x + 8 + k * 26}" y="${y + 12 + r * 28}" width="14" height="18" fill="${night ? (hash(x + r * 7 + k) < 0.5 ? '#ffcf73' : '#3b3a5c') : '#9fb6c8'}"/>`).join('')).join('')}`).join('')}
    ${shop(30, 180, '#c9785a', 'NANVAYI · BAKERY', 'fresh sangak bread')}
    <g>${[0, 1, 2].map((i) => `<path d="M${54 + i * 46} 340 q20 -16 40 0 v30 q-20 10 -40 0z" fill="#d9a35a"/>`).join('')}</g>
    ${shop(220, 160, '#e7b84a', 'ABMIVEH · JUICE', 'cantaloupe · pomegranate')}
    <g>${['#e05b3b', '#f2b33a', '#6aa84f', '#e05b3b', '#9b59b6'].map((f, i) => `<circle cx="${240 + i * 26}" cy="372" r="11" fill="${f}"/>`).join('')}</g>
    <rect x="390" y="250" width="210" height="150" fill="${night ? '#24233d' : '#cbb79c'}"/>
    <rect x="0" y="400" width="600" height="170" fill="#bdb6ad"/>${[...Array(15)].map((_, i) => `<path d="M${i * 40} 400 v170" stroke="#aaa298" stroke-width="1.2"/>`).join('')}<path d="M0 485 H600" stroke="#aaa298" stroke-width="1.2"/>
    ${[-14, 400, 590].map((x) => `<rect x="${x - 7}" y="300" width="14" height="270" fill="#7a5a3e"/><circle cx="${x}" cy="290" r="54" fill="${night ? '#24452c' : '#4d8044'}"/><circle cx="${x - 30}" cy="318" r="34" fill="${night ? '#1f3c26' : '#5a9150'}"/><circle cx="${x + 32}" cy="314" r="36" fill="${night ? '#1d3824' : '#3f6f3a'}"/>`).join('')}
    <g><rect x="434" y="400" width="12" height="40" fill="#4a7a5a"/><rect x="424" y="384" width="32" height="24" rx="4" fill="#5f9a57"/>${label(440, 400, '🐾', '#fff', 12)}</g>
    <g><rect x="532" y="418" width="26" height="52" rx="4" fill="#8e9aa8"/><path d="M545 418 q0 -16 14 -14" stroke="#8e9aa8" stroke-width="5" fill="none"/><ellipse cx="545" cy="470" rx="22" ry="6" fill="#7aa6c2"/></g>
    <rect x="0" y="570" width="600" height="16" fill="#7aa6c2"/><rect x="0" y="566" width="600" height="5" fill="#9b9389"/>
    <rect x="0" y="586" width="600" height="214" fill="#4a4a52"/>${[...Array(8)].map((_, i) => `<rect x="${20 + i * 80}" y="736" width="44" height="6" fill="#e9e1c8" opacity=".8"/>`).join('')}
    <g><rect x="78" y="618" width="190" height="66" rx="14" fill="#f4f4f2"/><path d="M104 618 l18 -40 h106 l22 40z" fill="#eceae6"/><path d="M126 616 l12 -30 h38 v30z M184 616 v-30 h40 l16 30z" fill="#8fb6cc"/><circle cx="118" cy="688" r="20" fill="#2a2a2e"/><circle cx="118" cy="688" r="9" fill="#c9ccd0"/><circle cx="230" cy="688" r="20" fill="#2a2a2e"/><circle cx="230" cy="688" r="9" fill="#c9ccd0"/><rect x="258" y="640" width="12" height="8" rx="2" fill="#ffd98a"/></g>
    <g><rect x="360" y="640" width="190" height="50" rx="16" fill="#f4f4f2"/><path d="M394 640 q18 -34 54 -34 h28 q30 0 50 34z" fill="#eceae6"/><path d="M406 638 q14 -24 40 -24 v24z M456 614 h22 q22 0 36 24 h-58z" fill="#8fb6cc"/><circle cx="398" cy="692" r="18" fill="#2a2a2e"/><circle cx="398" cy="692" r="8" fill="#c9ccd0"/><circle cx="514" cy="692" r="18" fill="#2a2a2e"/><circle cx="514" cy="692" r="8" fill="#c9ccd0"/></g>
    ${label(172, 716, 'FAMILY 4×4', '#e9e1c8', 10)}
    ${streetReal(c)}
    ${c.rain ? [...Array(60)].map((_, k) => `<path d="M${hash(k) * 600} ${hash(k + 2) * 800} l-5 16" stroke="#e6eef7" stroke-width="1.4" opacity=".6"/>`).join('') : ''}
    ${DET.street(c)}
  `, c);
  };

  const elevator = (x, y, w, h, sign, floor) => `<rect x="${x - 10}" y="${y - 34}" width="${w + 20}" height="${h + 34}" fill="url(#rsteel)"/><rect x="${x + w / 2 - 24}" y="${y - 28}" width="48" height="20" rx="4" fill="#1a1a1e"/><text x="${x + w / 2}" y="${y - 13}" text-anchor="middle" font-size="12" font-family="Nunito, sans-serif" font-weight="900" fill="#ff8a3a">▲ ${floor || 'G'}</text><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff4d6"/><rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 6}" fill="#e9dcc0"/><path d="M${x + 10} ${y + 30} H${x + w - 10}" stroke="#c9a24a" stroke-width="3"/>${sign ? label(x + w / 2, y - 40, sign, '#ffd98a', 10) : ''}`;
  // bamboo stalks: CLAP is wrapped in bamboo
  const bamboo = (x, y0, y1, w, shade) => {
    const col = shade ? '#7f9a3e' : '#9bb54c', node = shade ? '#5f7a2a' : '#6f8a32';
    let o = `<rect x="${x}" y="${y0}" width="${w}" height="${y1 - y0}" rx="${w / 2}" fill="${col}"/><rect x="${x + w * 0.2}" y="${y0}" width="${w * 0.18}" height="${y1 - y0}" fill="#c9dc84" opacity=".5"/>`;
    for (let y = y0 + 30 + (x % 23); y < y1; y += 46 + (x % 9)) o += `<rect x="${x - 1}" y="${y}" width="${w + 2}" height="4" rx="2" fill="${node}"/>`;
    return o;
  };
  const leaves = (x, y, flip) => `<g transform="translate(${x} ${y}) scale(${flip ? -1 : 1} 1)" fill="#6f9a3a">${[[0, 0, -30], [14, -10, -55], [6, 14, -10], [22, 4, -40]].map(([dx, dy, r]) => `<ellipse cx="${dx + 18}" cy="${dy}" rx="20" ry="5" transform="rotate(${r} ${dx} ${dy})"/>`).join('')}</g>`;
  ART.clap = (c) => {
    let wall = '<rect width="600" height="420" fill="#c8b98a"/>';
    for (let x = 0; x < 600; x += 15) wall += bamboo(x, 0, 420, 13, (x / 15) % 2);
    let edge = '';
    for (let x = 0; x < 40; x += 13) edge += bamboo(x, 0, 800, 11, x % 2);
    for (let x = 562; x < 600; x += 13) edge += bamboo(x, 0, 800, 11, x % 2);
    return svg(`
    ${wall}<rect width="600" height="420" fill="#2b1d1a" opacity=".38"/>
    <rect x="236" y="20" width="200" height="74" rx="14" fill="#1a1011"/><circle cx="336" cy="57" r="120" fill="url(#rneon)"/>
    <text x="336" y="72" text-anchor="middle" font-size="44" font-family="Fredoka, sans-serif" font-weight="700" fill="#ffd1e6" stroke="#ff5fa2" stroke-width="2.5">CLAP</text>
    <text x="336" y="88" text-anchor="middle" font-size="10" font-family="Nunito, sans-serif" font-weight="800" fill="#ff9cc8">クラップ · HOOKAH &amp; TEA</text>
    ${[90, 210, 470, 560].map((x, i) => `<path d="M${x} 0 v${26 + i % 2 * 14}" stroke="#111" stroke-width="2"/><ellipse cx="${x}" cy="${50 + i % 2 * 14}" rx="18" ry="24" fill="#d63a3a"/><path d="M${x - 18} ${50 + i % 2 * 14} h36 M${x - 16} ${40 + i % 2 * 14} h32 M${x - 16} ${60 + i % 2 * 14} h32" stroke="#a52525" stroke-width="2"/><circle cx="${x}" cy="${50 + i % 2 * 14}" r="40" fill="url(#rglow)" opacity=".5"/>`).join('')}
    <circle cx="124" cy="190" r="74" fill="#3b2a20"/><circle cx="124" cy="190" r="66" fill="#f3d9a0"/><circle cx="124" cy="190" r="66" fill="url(#rglow)"/>${[96, 118, 142].map((x, i) => `<rect x="${x}" y="${130 + i * 8}" width="7" height="120" fill="#4a5a2a" opacity=".55"/>`).join('')}${leaves(100, 160, 0)}${leaves(150, 180, 1)}
    <rect x="272" y="168" width="124" height="252" fill="#3a2418"/><rect x="282" y="206" width="104" height="214" fill="#b9d2dc" opacity=".55"/><path d="M334 206 V420" stroke="#3a2418" stroke-width="4"/><path d="M292 230 l30 -16 M346 250 l30 -16" stroke="#fff" stroke-width="5" opacity=".45"/>
    ${label(334, 196, 'ENTRANCE', '#ffd98a', 11)}${label(334, 312, 'CLAP', '#ff5fa2', 18)}<text x="334" y="330" text-anchor="middle" font-size="8.5" font-family="Nunito, sans-serif" font-weight="800" fill="#3a2418">HAYAT SABZ MALL · G</text>
    <rect x="40" y="300" width="160" height="22" fill="#6b4632"/><rect x="40" y="322" width="160" height="98" fill="#4a2f22"/>
    <g><ellipse cx="80" cy="294" rx="26" ry="20" fill="#2a2a2e"/><path d="M58 290 q-14 -6 -10 -18" stroke="#2a2a2e" stroke-width="6" fill="none"/><rect x="74" y="268" width="12" height="8" rx="2" fill="#2a2a2e"/>${[124, 150, 176].map((x) => `<rect x="${x - 7}" y="284" width="14" height="16" rx="3" fill="#e8dcc2"/>`).join('')}</g>
    ${label(120, 395, 'TEA BAR', '#e8dcc2', 11)}
    <rect x="200" y="304" width="66" height="26" rx="5" fill="#1a1011"/>${label(233, 321, 'POURYA’S', '#ffd98a', 10)}
    ${[212, 233, 254].map((x) => `<path d="M${x - 7} 352 h14 l-3 12 h-8z" fill="#b4572a"/><rect x="${x - 2}" y="364" width="4" height="8" fill="#7a3a1a"/>`).join('')}<rect x="202" y="372" width="64" height="5" fill="#6b4632"/>
    <g><rect x="206" y="398" width="56" height="26" rx="4" fill="#2a2a2e"/><rect x="212" y="390" width="44" height="12" rx="3" fill="#e05b3b"/><circle cx="226" cy="394" r="4" fill="#ffcf73"/><circle cx="242" cy="396" r="4" fill="#ff8a3a"/><path d="M224 384 q6 -12 0 -22 M244 384 q6 -12 0 -22" stroke="#bbb" stroke-width="2" fill="none" opacity=".6"/></g>
    <rect x="404" y="300" width="160" height="22" fill="#6b4632"/><rect x="404" y="322" width="160" height="98" fill="#4a2f22"/>
    <path d="M412 196 h146 v60 h-146z" fill="#1f2a5a"/><circle cx="485" cy="226" r="16" fill="#fff" opacity=".9"/><path d="M461 196 v60 M510 196 v60" stroke="#16204a" stroke-width="3"/>
    ${[432, 482, 532].map((x) => `<ellipse cx="${x}" cy="296" rx="20" ry="6" fill="#fff"/><rect x="${x - 10}" y="284" width="8" height="8" rx="2" fill="#e05b3b"/><rect x="${x + 2}" y="284" width="8" height="8" rx="2" fill="#f2b33a"/>`).join('')}
    ${label(484, 395, 'SUSHI', '#e8dcc2', 11)}
    ${wood(420, '#8a5c3c', 'rgba(40,20,10,.28)')}
    ${edge}${leaves(26, 120, 0)}${leaves(26, 520, 0)}${leaves(574, 260, 1)}${leaves(574, 640, 1)}
  `, c, true);
  };

  // ground floor of Hayat Sabz mall: from the elevator to CLAP's entrance
  ART.mall = (c) => {
    const shop = (x, w, col, name) => `<rect x="${x}" y="190" width="${w}" height="230" fill="${col}"/><rect x="${x + 10}" y="236" width="${w - 20}" height="184" fill="#dfe9ee" opacity=".85"/><rect x="${x}" y="196" width="${w}" height="30" fill="#2a2a30"/>${label(x + w / 2, 216, name, '#fff', 12)}<path d="M${x + w / 2} 236 V420" stroke="#9aa2a8" stroke-width="2"/>`;
    let bam = '';
    for (let x = 440; x < 600; x += 14) bam += bamboo(x, 170, 420, 12, (x / 14) % 2);
    return svg(`
    <rect width="600" height="420" fill="#efe9df"/>
    <rect x="0" y="0" width="600" height="70" fill="#dfe9ee"/>${[...Array(7)].map((_, i) => `<path d="M${i * 100} 0 V70" stroke="#c3ccd2" stroke-width="3"/>`).join('')}<path d="M0 70 H600" stroke="#c3ccd2" stroke-width="4"/>
    <rect x="0" y="120" width="600" height="14" fill="#cfd5da"/><rect x="0" y="100" width="600" height="20" fill="#bfe0ea" opacity=".6"/>
    <rect x="170" y="78" width="260" height="34" rx="8" fill="#2f6b3e"/>${label(300, 101, 'HAYAT SABZ MALL · G', '#fff', 14)}
    ${elevator(40, 228, 112, 192, '', 'G')}
    ${shop(176, 120, '#c9785a', 'BOUTIQUE')}${shop(306, 120, '#b98bc9', 'PERFUME')}
    ${bam}<rect x="452" y="210" width="136" height="210" fill="#2b1d1a"/><path d="M462 210 h116 v50 h-116z" fill="#a52525"/><path d="M500 210 v50 M540 210 v50" stroke="#7a1c1c" stroke-width="3"/>
    <rect x="456" y="150" width="128" height="44" rx="10" fill="#1a1011"/><circle cx="520" cy="172" r="70" fill="url(#rneon)"/><text x="520" y="184" text-anchor="middle" font-size="30" font-family="Fredoka, sans-serif" font-weight="700" fill="#ffd1e6" stroke="#ff5fa2" stroke-width="2">CLAP</text>
    ${[470, 570].map((x) => `<ellipse cx="${x}" cy="246" rx="12" ry="16" fill="#d63a3a"/><circle cx="${x}" cy="246" r="26" fill="url(#rglow)" opacity=".6"/>`).join('')}
    <rect x="0" y="420" width="600" height="380" fill="#efe8dc"/>${[...Array(6)].map((_, r) => [...Array(6)].map((_, k) => `<rect x="${k * 100}" y="${420 + r * 64}" width="100" height="64" fill="${(r + k) % 2 ? '#f6f1e8' : '#e9e1d3'}"/>`).join('')).join('')}<rect x="0" y="420" width="600" height="380" fill="url(#rshine)"/>
    ${plant(170, 430, 1.3)}${plant(430, 430, 1.3)}
    <rect x="230" y="600" width="140" height="44" rx="8" fill="#d9d2c6"/>${label(300, 628, '→ CLAP · Hookah & Tea', '#7a5c4e', 11)}
  `, c, true);
  };

  // the underground parking of Hayat Sabz mall
  ART.parking = (c) => svg(`
    <rect width="600" height="400" fill="#8d9298"/><rect width="600" height="40" fill="#6f747a"/>${[60, 220, 380, 540].map((x) => `<rect x="${x - 40}" y="16" width="80" height="8" rx="3" fill="#f6f7e8"/><circle cx="${x}" cy="30" r="70" fill="url(#rglow)" opacity=".35"/>`).join('')}
    <path d="M0 52 H600" stroke="#6b7076" stroke-width="10"/><path d="M0 70 H600" stroke="#c0392b" stroke-width="5" opacity=".8"/>
    ${[110, 300].map((x) => `<rect x="${x - 22}" y="40" width="44" height="360" fill="#a3a8ae"/><rect x="${x - 22}" y="250" width="44" height="18" fill="#f2c230"/><rect x="${x - 22}" y="290" width="44" height="18" fill="#f2c230"/>`).join('')}
    <rect x="140" y="100" width="130" height="60" rx="6" fill="#2f6b3e"/>${label(205, 124, 'HAYAT SABZ', '#fff', 15)}${label(205, 146, 'MALL · PARKING P2', '#d8f0dc', 10)}
    ${elevator(436, 214, 112, 186, 'MALL · CLAP ↑', 'G')}
    <rect x="0" y="400" width="600" height="400" fill="#5d6168"/>
    ${[0, 1, 2, 3].map((i) => `<path d="M${i * 150} 560 V800" stroke="#e9e6d6" stroke-width="5"/>`).join('')}<path d="M0 560 H600" stroke="#e9e6d6" stroke-width="5" opacity=".6"/>
    ${label(75, 780, 'P2-14', '#e9e6d6', 16)}${label(375, 780, 'P2-16', '#e9e6d6', 16)}${label(525, 780, 'P2-17', '#e9e6d6', 16)}
    <path d="M300 520 l40 -40 l40 40 h-24 v40 h-32 v-40z" fill="#e9e6d6" opacity=".7" transform="translate(150 -40)"/>
    <g><rect x="20" y="640" width="110" height="50" rx="14" fill="#c0392b"/><path d="M40 640 q14 -28 36 -28 h14 q20 0 30 28z" fill="#a93226"/><circle cx="44" cy="692" r="14" fill="#2a2a2e"/><circle cx="108" cy="692" r="14" fill="#2a2a2e"/></g>
    <g><rect x="470" y="640" width="120" height="50" rx="14" fill="#2c3e50"/><path d="M490 640 q14 -28 40 -28 h14 q22 0 34 28z" fill="#22313f"/><circle cx="496" cy="692" r="14" fill="#2a2a2e"/><circle cx="566" cy="692" r="14" fill="#2a2a2e"/></g>
  `, c, true);

  // foreground props (tables with a front board hide the legs of people sitting behind them)
  const table = (w, top, extra) => `<svg viewBox="0 0 ${w} ${top + 72}" width="${w}" height="${top + 72}">${extra || ''}<rect x="0" y="${top}" width="${w}" height="14" rx="4" fill="#b07a48"/><path d="M8 ${top + 6} H${w - 8}" stroke="#8a5a32" stroke-width="1.5" opacity=".6"/><rect x="4" y="${top + 12}" width="${w - 8}" height="40" fill="#9a683c"/>${[...Array(Math.floor(w / 30))].map((_, i) => `<path d="M${12 + i * 30} ${top + 14} v36" stroke="#86582f" stroke-width="2"/>`).join('')}<rect x="10" y="${top + 52}" width="9" height="18" fill="#7a4e2c"/><rect x="${w - 19}" y="${top + 52}" width="9" height="18" fill="#7a4e2c"/></svg>`;
  const glasses = (x, y) => `<rect x="${x - 6}" y="${y}" width="12" height="16" rx="3" fill="#f8e3c2" opacity=".9"/><rect x="${x - 4}" y="${y + 6}" width="8" height="9" fill="#b4472a"/>`;
  const hookah = (x, y) => `<path d="M${x - 14} ${y + 98} q-8 -22 14 -34 q22 12 14 34z" fill="#7ec8e3" opacity=".85"/><rect x="${x - 4}" y="${y + 24}" width="8" height="42" fill="#c9a24a"/><path d="M${x - 12} ${y + 24} h24 l-4 -10 h-16z" fill="#b4572a"/><circle cx="${x}" cy="${y + 10}" r="6" fill="#ff8a3a"/><path d="M${x + 4} ${y + 60} q40 10 60 34" stroke="#2a2a2e" stroke-width="3" fill="none"/><path d="M${x - 6} ${y} q-8 -20 6 -36 q-10 -16 4 -30" stroke="#ddd" stroke-width="5" fill="none" opacity=".35"/>`;
  const PROPS = {
    clap: () => [
      { x: 170, y: 490, w: 300, h: 182, z: 668, svg: table(300, 110, hookah(150, 12) + glasses(206, 96) + glasses(228, 96) + '<ellipse cx="255" cy="108" rx="22" ry="5" fill="#f3efe9"/>') },
      { x: 0, y: 470, w: 150, h: 112, z: 576, svg: table(150, 40, glasses(50, 26) + glasses(100, 26)) },
      { x: 0, y: 660, w: 150, h: 112, z: 766, svg: table(150, 40, glasses(46, 26) + '<ellipse cx="104" cy="38" rx="20" ry="5" fill="#f3efe9"/>') },
      { x: 450, y: 470, w: 150, h: 112, z: 576, svg: table(150, 40, '<circle cx="75" cy="30" r="10" fill="#7a2d8c" opacity=".85"/><circle cx="75" cy="30" r="16" fill="url(#rglow)"/>' + glasses(40, 26) + glasses(112, 26)) },
      { x: 450, y: 660, w: 150, h: 112, z: 766, svg: table(150, 40, glasses(60, 26) + glasses(90, 26)) },
    ],
  };

  /* lighting overlays (above characters, below bubbles) */
  const beam = (x0, x1, yb, dx) => `<polygon points="${x0},${yb} ${x1},${yb} ${x1 + dx},800 ${x0 + dx},800" fill="url(#rbeam)"/>`;
  const vig = (k) => `<rect width="600" height="800" fill="url(#rvig)" opacity="${k}"/>`;
  const warm = (x, y, r, k) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#rwarm)" opacity="${k || 1}"/>`;
  const L = (inner) => `<svg viewBox="0 0 600 800" aria-hidden="true">${inner}</svg>`;
  const home = (bx0, bx1, yb, dx, lamps) => (c) => L(c.night ? lamps.map(([x, y, r]) => warm(x, y, r)).join('') + vig(1) : beam(bx0, bx1, yb, dx) + vig(.5));
  const LIGHT = {
    salon: home(110, 500, 392, 80, [[66, 290, 160], [300, 120, 200]]),
    kitchen: home(150, 450, 392, 60, [[210, 470, 90], [300, 470, 90], [390, 470, 90]]),
    tv: home(46, 286, 392, 90, [[445, 171, 200]]),
    hall: home(30, 570, 432, 0, [[300, 40, 260]]),
    bedroom: home(24, 286, 430, 70, [[200, 60, 160], [505, 200, 120]]),
    street: (c) => L(c.night ? [70, 330, 590].map((x) => warm(x, 300, 140, .8)).join('') + vig(1) : '<circle cx="560" cy="40" r="260" fill="url(#rwarm)" opacity=".5"/>' + vig(.35)),
    clap: () => L([[90, 50], [210, 64], [470, 50], [560, 64]].map(([x, y]) => warm(x, y, 120)).join('') + warm(320, 520, 220, .55) + vig(.9)),
    mall: () => L('<rect width="600" height="420" fill="url(#rbeam)"/>' + vig(.3)),
    parking: () => L([60, 220, 380, 540].map((x) => `<circle cx="${x}" cy="40" r="140" fill="url(#rcold)"/>`).join('') + vig(1)),
  };
  /* small living details: steam, TV flicker, smoke, lantern glow, clouds */
  const puffs = (n) => '<i></i>'.repeat(n);
  // what you see through a window: birds by day, twinkling city lights at night, rain on rainy days
  const winFx = (c, x, y, w, h) => {
    if (c.rain) return [{ cls: 'rainfx', x, y, w, h, html: puffs(6) }];
    if (c.night) return [{ cls: 'twinkle', x, y: y + h * 0.48, w, h: h * 0.5, html: [...Array(12)].map((_, i) => `<i style="left:${(hash(i * 3.1 + x) * 96).toFixed(1)}%;top:${(hash(i * 7.7 + y) * 90).toFixed(1)}%;animation-delay:-${(hash(i + x) * 3).toFixed(2)}s"></i>`).join('') }];
    return [{ cls: 'birds', x, y: y + 10, w, h: h * 0.4, html: '<i></i><i></i><i></i>' }, { cls: 'sky', x, y, w, h: Math.min(140, h * 0.45), html: `<div class="cloud" style="position:absolute;top:18px;width:70px;height:16px;--cw:${w + 80}px"></div><div class="cloud" style="position:absolute;top:58px;width:50px;height:12px;--cw:${w + 80}px;animation-delay:-17s"></div>` }];
  };
  const clockFx = (x, y) => ({ cls: 'clock', x: x - 30, y: y - 30, w: 60, h: 60, html: '<i class="h"></i><i class="m"></i><b></b>' });
  const pigeon = '<svg viewBox="0 0 40 30"><ellipse cx="20" cy="19" rx="12" ry="8" fill="#8e96a3"/><circle cx="31" cy="12" r="6" fill="#7a8290"/><path d="M36 12 l5 1.5 -5 1.5z" fill="#e0a43a"/><circle cx="32.5" cy="10.5" r="1.3" fill="#1c1a24"/><path d="M10 17 q-8 -2 -10 3 q6 2 12 0z" fill="#6a7280"/><path d="M17 26 v4 M23 26 v4" stroke="#d0705a" stroke-width="1.6"/></svg>';
  const cat = '<svg viewBox="0 0 50 50"><path d="M14 46 q-2 -20 11 -24 q13 4 11 24z" fill="#3a3550"/><circle cx="25" cy="18" r="9" fill="#3a3550"/><path d="M17 13 l2 -9 5 6z M33 13 l-2 -9 -5 6z" fill="#3a3550"/><circle cx="21.5" cy="18" r="1.6" fill="#ffd36b"/><circle cx="28.5" cy="18" r="1.6" fill="#ffd36b"/><path class="cat-tail" d="M35 44 q14 -2 12 -16" stroke="#3a3550" stroke-width="4" fill="none" stroke-linecap="round"/></svg>';
  const balloons = (cols) => cols.map((col, i) => `<span class="balloon" style="left:${i * 26}px;animation-delay:-${i * 0.9}s"><b style="background:${col}"></b><i></i></span>`).join('');
  const FX = {
    kitchen: (c) => [{ cls: 'steam', x: 288, y: 186, w: 30, h: 40, html: puffs(3) }, { cls: 'steam', x: 228, y: 488, w: 30, h: 40, html: puffs(3) }].concat(winFx(c, 150, 22, 300, 226)),
    tv: (c) => [{ cls: 'flicker', x: 328, y: 104, w: 234, h: 134 }, { cls: 'match', x: 328, y: 104, w: 234, h: 134, html: '<i class="ball"></i><i class="p a"></i><i class="p b"></i><i class="p c"></i>' }].concat(winFx(c, 46, 22, 240, 364)),
    clap: () => [{ cls: 'smoke', x: 312, y: 436, w: 24, h: 40, html: puffs(3) }, { cls: 'smoke', x: 226, y: 350, w: 24, h: 40, html: puffs(3) }]
      .concat([[90, 50], [210, 64], [470, 50], [560, 64]].map(([x, y]) => ({ cls: 'glow', x: x - 46, y: y - 46, w: 92, h: 92 }))),
    salon: (c) => [clockFx(556, 104)].concat(winFx(c, 104, 22, 398, 364)).concat(c.party === 'birthday' ? [{ cls: 'balloons', x: 10, y: 40, w: 90, h: 160, html: balloons(['#ef6fa3', '#ffd36b', '#7fb2ff']) }, { cls: 'candles', x: 74, y: 556, w: 44, h: 20, html: puffs(3) }] : c.party === 'wedding' ? [{ cls: 'balloons', x: 10, y: 40, w: 90, h: 160, html: balloons(['#ffffff', '#f3e2b8', '#ffd1e6']) }] : []),
    bedroom: (c) => [{ cls: 'fairy', x: 0, y: 0, w: 600, h: 120, html: [...Array(12)].map((_, i) => `<i style="left:${40 + i * 27 - 5}px;top:${(46 + Math.sin(i) * 6 - 5).toFixed(1)}px;animation-delay:-${(i * 0.37).toFixed(2)}s;background:${['#ffd98a', '#ef8fb0', '#86d1ff'][i % 3]}"></i>`).join('') }].concat(winFx(c, 24, 22, 262, 300)),
    hall: (c) => winFx(c, 30, 24, 540, 150),
    street: (c) => [{ cls: 'pigeons', x: 40, y: 196, w: 110, h: 40, html: `<i>${pigeon}</i><i>${pigeon}</i>` }, { cls: 'cat', x: 500, y: 214, w: 44, h: 44, html: cat }].concat(c.night ? [] : [{ cls: 'birds', x: 0, y: 30, w: 600, h: 120, html: '<i></i><i></i><i></i>' }]),
  };
  // special days: Simba's birthday and Cousin Sara's wedding
  const bunting = (x0, x1, y, sag, cols) => {
    let o = `<path d="M${x0} ${y} Q${(x0 + x1) / 2} ${y + sag * 2} ${x1} ${y}" stroke="#7a5c4e" stroke-width="2" fill="none"/>`;
    const n = Math.floor((x1 - x0) / 26);
    for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, yy = y + sag * 4 * t * (1 - t); o += `<path d="M${(x - 9).toFixed(0)} ${yy.toFixed(0)} L${(x + 9).toFixed(0)} ${yy.toFixed(0)} L${x.toFixed(0)} ${(yy + 18).toFixed(0)}Z" fill="${cols[i % cols.length]}"/>`; }
    return o;
  };
  const banner = (cx, y, w, txt, bg, fg) => `<g><path d="M${cx - w / 2 - 14} ${y + 4} l14 12 -14 12 h20 v-24z M${cx + w / 2 + 14} ${y + 4} l-14 12 14 12 h-20 v-24z" fill="${bg}" opacity=".8"/><rect x="${cx - w / 2}" y="${y}" width="${w}" height="34" rx="6" fill="${bg}"/><text x="${cx}" y="${y + 23}" text-anchor="middle" font-size="17" font-family="Fredoka, sans-serif" font-weight="700" fill="${fg}">${txt}</text></g>`;
  const BDAY = ['#ef6fa3', '#ffd36b', '#7fb2ff', '#7fe0b4', '#c48bff'], WED = ['#ffffff', '#f3e2b8', '#ffd1e6', '#e0c27a'];
  const cake = (x, y) => `<g><ellipse cx="${x}" cy="${y + 64}" rx="34" ry="8" fill="rgba(0,0,0,.15)"/><rect x="${x - 3}" y="${y + 30}" width="6" height="34" fill="#8a5a3a"/><ellipse cx="${x}" cy="${y + 30}" rx="34" ry="9" fill="#b07a48"/><rect x="${x - 24}" y="${y + 2}" width="48" height="24" rx="5" fill="#f6c3d3"/><path d="M${x - 24} ${y + 8} q6 6 12 0 q6 6 12 0 q6 6 12 0 q6 6 12 0" stroke="#fff" stroke-width="3" fill="none"/><rect x="${x - 15}" y="${y - 14}" width="30" height="18" rx="4" fill="#fff3f7"/>${[-8, 0, 8].map((d) => `<rect x="${x + d - 1.5}" y="${y - 26}" width="3" height="12" fill="${['#7fb2ff', '#ffd36b', '#ef6fa3'][(d + 8) / 8]}"/>`).join('')}</g>`;
  const garland = (x0, x1, y) => { let o = ''; for (let x = x0; x <= x1; x += 22) o += `<circle cx="${x}" cy="${y + Math.sin(x * 0.05) * 6}" r="7" fill="${x % 44 ? '#ffd1e6' : '#ffffff'}" stroke="#e0c27a" stroke-width="1.2"/>`; return o; };
  const PARTY = {
    birthday: {
      salon: bunting(110, 496, 30, 18, BDAY) + banner(303, 120, 250, 'HAPPY BIRTHDAY SIMBA! 🐾', '#c9496f', '#fff') + cake(96, 560),
      kitchen: bunting(150, 450, 30, 14, BDAY),
      tv: bunting(50, 286, 30, 12, BDAY),
      hall: bunting(36, 564, 30, 14, BDAY),
    },
    wedding: {
      salon: bunting(110, 496, 30, 18, WED) + garland(120, 490, 70) + banner(303, 120, 230, 'Mobarak, Sara & Ali! 💍', '#e0c27a', '#3f2a22'),
      kitchen: bunting(150, 450, 30, 14, WED),
      tv: bunting(50, 286, 30, 12, WED),
      hall: bunting(36, 564, 30, 14, WED) + garland(40, 560, 190),
    },
  };

  window.RoomArt = { defs, ART, PROPS, LIGHT, FX, PARTY };
})();
