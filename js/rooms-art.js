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
  const label = (x, y, txt, col, size) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size || 11}" font-family="Baloo 2, sans-serif" font-weight="800" fill="${col}">${txt}</text>`;
  const arch = (x, y, w, h, hint) => `<path d="M${x} ${y + h} V${y + w / 2} a${w / 2} ${w / 2} 0 0 1 ${w} 0 V${y + h}z" fill="#d9c9b2"/><path d="M${x + 6} ${y + h} V${y + w / 2} a${w / 2 - 6} ${w / 2 - 6} 0 0 1 ${w - 12} 0 V${y + h}z" fill="#c7b499"/>${hint ? label(x + w / 2, y + w / 2 + 18, hint, '#7a5c4e', 9) : ''}`;
  const rug = (cx, cy, w, h) => `<g><ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="${h / 2}" fill="#8c1f30"/><ellipse cx="${cx}" cy="${cy}" rx="${w / 2 - 10}" ry="${h / 2 - 8}" fill="none" stroke="#1f2a5a" stroke-width="6"/><ellipse cx="${cx}" cy="${cy}" rx="${w / 5}" ry="${h / 5}" fill="#f0d9a8"/><ellipse cx="${cx}" cy="${cy}" rx="${w / 9}" ry="${h / 9}" fill="#1f2a5a"/></g>`;

  /* ----------------------------------------------------------------- */
  const ART = {};

  ART.salon = (c) => svg(`
    ${wall(392)}
    ${bay(104, 22, 398, 364, 20, 4)}
    ${arch(0, 196, 88, 196, 'KITCHEN · TV')}
    <rect x="512" y="186" width="88" height="206" fill="#e2d6c4"/><rect x="518" y="192" width="82" height="200" fill="#5a3a26"/><rect x="532" y="210" width="54" height="44" rx="4" fill="#9fc4da" opacity=".7"/><rect x="590" y="300" width="4" height="24" rx="2" fill="#c9a24a"/>
    ${label(558, 182, 'FRONT DOOR', '#7a5c4e', 9)}
    ${marble(392)}
    <rect x="512" y="392" width="88" height="14" fill="#8c6a4a" opacity=".35"/>
    ${rug(320, 625, 380, 120)}
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
  `, c);

  ART.kitchen = (c) => svg(`
    <rect width="600" height="392" fill="#fbfbfa"/><rect width="600" height="12" fill="#ffffff"/>
    ${bay(150, 22, 300, 226, 90, 3)}
    <rect x="0" y="12" width="142" height="380" fill="#f7f7f6"/>${[0, 1].map((i) => `<path d="M${71 * (i + 1)} 12 V392" stroke="#e1e1df" stroke-width="2"/>`).join('')}<path d="M0 200 H142" stroke="#e1e1df" stroke-width="2"/><rect x="66" y="230" width="3" height="60" rx="1.5" fill="#d4d4d2"/><rect x="74" y="230" width="3" height="60" rx="1.5" fill="#d4d4d2"/>
    ${label(71, 180, 'FRIDGE', '#c3c3c0', 9)}
    <rect x="458" y="12" width="82" height="380" fill="#f7f7f6"/><path d="M499 12 V392 M458 200 H540" stroke="#e1e1df" stroke-width="2"/>
    <rect x="474" y="232" width="50" height="34" rx="4" fill="#2a2a2e"/><rect x="478" y="236" width="42" height="26" rx="3" fill="#3b3f46"/><circle cx="499" cy="249" r="3" fill="#7fe0b4"/>
    <rect x="142" y="248" width="316" height="34" fill="#f1f1ef"/><path d="M160 256 q40 10 80 -2 t90 6 t110 -4" stroke="#c9cbcf" stroke-width="1.2" fill="none"/>
    <rect x="142" y="282" width="316" height="10" fill="#ffffff" stroke="#e6e6e4"/><path d="M150 287 q60 4 120 -1 t170 2" stroke="#c9cbcf" stroke-width="1" fill="none"/>
    <rect x="142" y="292" width="316" height="100" fill="#f9f9f8"/>${[0, 1, 2, 3].map((i) => `<path d="M${142 + 79 * (i + 1)} 292 V392" stroke="#e4e4e2" stroke-width="2"/>`).join('')}<path d="M142 300 H458" stroke="#ececea" stroke-width="2"/>
    <rect x="166" y="272" width="54" height="12" rx="4" fill="#dfe3e6"/><path d="M193 272 v-22 q0 -8 10 -8 h6" stroke="#9aa2a8" stroke-width="3.5" fill="none"/>
    <g><ellipse cx="300" cy="282" rx="24" ry="4" fill="rgba(0,0,0,.12)"/><path d="M282 280 q-4 -30 7 -43 h22 q11 13 7 43z" fill="#d9b866"/><path d="M291 237 q9 -9 18 0" fill="#c9a24a"/><path d="M292 228 h16 l-2 10 h-12z" fill="#e05b7b"/><path d="M282 248 q-2 18 4 28" stroke="#fff6cc" stroke-width="3" fill="none" opacity=".7"/></g>
    <g><path d="M384 282 l4 -40 h28 l4 40z" fill="#c9a27a"/><path d="M388 248 h28" stroke="#9a6232" stroke-width="3"/>${label(402, 268, 'KIBBLE', '#7a4a22', 9)}</g>
    ${arch(540, 196, 60, 196, '')}${label(570, 190, 'LIVING ›', '#9a9a96', 9)}
    ${marble(392)}
    ${[210, 300, 390].map((x) => `<path d="M${x} 392 V448" stroke="#c9ccd0" stroke-width="1.5"/><path d="M${x - 16} 462 q16 -22 32 0z" fill="#f4f4f2" stroke="#d6d6d4"/><ellipse cx="${x}" cy="470" rx="34" ry="12" fill="url(#rglow)" opacity=".7"/>`).join('')}
    <rect x="150" y="540" width="300" height="18" rx="4" fill="#f4f3f0" stroke="#dcdcda"/><path d="M164 548 q60 6 120 -2 t150 4" stroke="#b9bcc0" stroke-width="1.2" fill="none"/>
    <rect x="162" y="558" width="276" height="96" fill="#fafaf9"/><path d="M162 580 H438" stroke="#ececea" stroke-width="2"/>${[0, 1].map((i) => `<path d="M${162 + 92 * (i + 1)} 580 V654" stroke="#ececea" stroke-width="2"/>`).join('')}
    <rect x="196" y="532" width="80" height="8" rx="3" fill="#2a2a2e"/><circle cx="216" cy="536" r="2.5" fill="#ff8a3a"/><circle cx="256" cy="536" r="2.5" fill="#555"/>
    <g><ellipse cx="370" cy="538" rx="22" ry="5" fill="#f3efe9"/><circle cx="362" cy="530" r="7" fill="#e05b3b"/><circle cx="376" cy="530" r="6" fill="#f2b33a"/></g>
    ${[200, 300, 400].map((x) => `<ellipse cx="${x}" cy="690" rx="24" ry="8" fill="#2a2a2e"/><rect x="${x - 2}" y="690" width="4" height="40" fill="#9aa2a8"/><ellipse cx="${x}" cy="732" rx="16" ry="4" fill="#9aa2a8"/>`).join('')}
  `, c);

  ART.tv = (c) => svg(`
    ${wall(392, '#efe6da')}
    ${bay(46, 22, 240, 364, 40, 3)}
    <rect x="320" y="96" width="250" height="150" rx="6" fill="#111"/><rect x="328" y="104" width="234" height="134" fill="url(#rtv)"/>
    <path d="M328 171 H562 M445 104 V238" stroke="#fff" stroke-width="2" opacity=".55"/><circle cx="445" cy="171" r="20" fill="none" stroke="#fff" stroke-width="2" opacity=".55"/><rect x="328" y="146" width="22" height="50" fill="none" stroke="#fff" stroke-width="2" opacity=".55"/><rect x="540" y="146" width="22" height="50" fill="none" stroke="#fff" stroke-width="2" opacity=".55"/>
    <circle cx="470" cy="160" r="4" fill="#fff"/><rect x="336" y="110" width="74" height="14" rx="3" fill="rgba(0,0,0,.45)"/><text x="373" y="121" text-anchor="middle" font-size="9" font-family="Nunito, sans-serif" font-weight="800" fill="#fff">PERSEPOLIS 2–1</text>
    <rect x="330" y="252" width="230" height="10" rx="3" fill="#2a2a2a"/>
    <rect x="300" y="300" width="290" height="70" rx="6" fill="#6b4632"/><rect x="310" y="312" width="80" height="46" rx="4" fill="#5a3a26"/><rect x="400" y="312" width="80" height="46" rx="4" fill="#5a3a26"/><rect x="490" y="312" width="90" height="46" rx="4" fill="#5a3a26"/>
    <rect x="0" y="0" width="38" height="392" fill="#e6dccf"/><rect x="0" y="196" width="34" height="196" fill="#c7b499"/>${label(20, 190, '‹', '#7a5c4e', 16)}
    ${marble(392)}
    ${rug(330, 640, 420, 150)}
    <g><rect x="150" y="430" width="200" height="100" rx="26" fill="#7a4a32"/><rect x="164" y="402" width="172" height="64" rx="22" fill="#8a5a3a"/><rect x="138" y="446" width="34" height="88" rx="16" fill="#6b3f2a"/><rect x="328" y="446" width="34" height="88" rx="16" fill="#6b3f2a"/><rect x="186" y="420" width="46" height="36" rx="10" fill="#d9b866"/></g>
    <rect x="370" y="600" width="170" height="14" rx="4" fill="#6b4632"/><rect x="380" y="614" width="6" height="36" fill="#5a3a26"/><rect x="524" y="614" width="6" height="36" fill="#5a3a26"/>
    <g><rect x="398" y="580" width="12" height="20" rx="2" fill="#f8e3c2" opacity=".9"/><rect x="400" y="586" width="8" height="12" fill="#b4472a"/><ellipse cx="470" cy="596" rx="24" ry="6" fill="#e9e1d4"/><circle cx="462" cy="588" r="7" fill="#e05b3b"/><circle cx="476" cy="588" r="6" fill="#9b59b6"/><circle cx="512" cy="594" r="10" fill="#c9a24a" opacity=".6"/></g>
    ${plant(560, 392, 1.1)}
  `, c);

  ART.hall = (c) => {
    const door = (x, w, col, frame, name, extra) => `<rect x="${x - 6}" y="226" width="${w + 12}" height="206" fill="#e2d6c4"/><rect x="${x}" y="232" width="${w}" height="200" fill="${col}"/><rect x="${x + 10}" y="246" width="${w - 20}" height="70" rx="4" fill="none" stroke="${frame}" stroke-width="2" opacity=".5"/><rect x="${x + 10}" y="330" width="${w - 20}" height="88" rx="4" fill="none" stroke="${frame}" stroke-width="2" opacity=".5"/><circle cx="${x + w - 14}" cy="338" r="4" fill="#c9a24a"/><rect x="${x + w / 2 - 34}" y="196" width="68" height="22" rx="6" fill="#fff8ee" stroke="${frame}" stroke-width="2"/>${label(x + w / 2, 212, name, frame, 11)}${extra || ''}`;
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
    <g stroke="#fff" stroke-width="5" stroke-linecap="round"><path d="M150 742 H450 M150 778 H450"/>${[...Array(13)].map((_, i) => `<path d="M${156 + i * 24} 738 v48"/>`).join('')}</g>
    <rect x="232" y="700" width="136" height="30" rx="6" fill="#2f4a3e"/>${label(300, 715, 'BEDROOMS', '#ffd98a', 11)}<text x="300" y="726" text-anchor="middle" font-size="9" font-family="Nunito, sans-serif" font-weight="800" fill="#fff">🔑 Nena only</text>
  `, c);
  };

  ART.bedroom = (c) => svg(`
    <rect width="410" height="430" fill="#f6e4e4"/><rect width="410" height="12" fill="#fbf3f0"/>
    ${bay(24, 22, 262, 300, 20, 3)}
    <path d="M30 40 q100 30 200 0 q60 20 120 0" stroke="#7a5c4e" stroke-width="1.2" fill="none"/>${[...Array(12)].map((_, i) => `<circle cx="${40 + i * 27}" cy="${46 + Math.sin(i) * 6}" r="3.4" fill="${['#ffd98a', '#ef8fb0', '#86d1ff'][i % 3]}"/>`).join('')}
    <rect x="276" y="282" width="120" height="10" rx="2" fill="#8a5a3a"/><rect x="284" y="292" width="6" height="140" fill="#7a4e32"/><rect x="382" y="292" width="6" height="140" fill="#7a4e32"/>
    <path d="M318 282 l6 -34 h44 l6 34z" fill="#3a3550"/><rect x="326" y="252" width="40" height="26" fill="#ef8fb0" opacity=".85"/>
    <rect x="300" y="120" width="90" height="120" rx="4" fill="#e9d2d2"/><rect x="306" y="126" width="78" height="108" fill="#f8eeee"/>${label(345, 186, 'NENA', '#c9496f', 13)}
    ${marble(430, 0, 410)}
    <rect x="30" y="330" width="250" height="110" rx="18" fill="#c9a0a8"/>
    <rect x="22" y="420" width="268" height="170" rx="24" fill="#f5ead9"/><path d="M22 470 q134 -30 268 0 v96 q0 24 -24 24 h-220 q-24 0 -24 -24z" fill="#f2b7c8"/><path d="M40 500 q60 -14 120 8 q60 18 120 -4" stroke="#fff" stroke-width="4" fill="none" opacity=".5"/>
    <rect x="44" y="420" width="88" height="44" rx="18" fill="#fff"/><rect x="150" y="420" width="88" height="44" rx="18" fill="#fff"/>
    <g><rect x="182" y="452" width="70" height="40" rx="10" fill="#e8a25a" transform="rotate(-8 217 472)"/><text x="217" y="478" text-anchor="middle" font-size="18" transform="rotate(-8 217 472)">🐾</text></g>
    <rect x="60" y="640" width="160" height="70" rx="35" fill="#efe1f2"/>
    <rect x="410" y="0" width="190" height="800" fill="#e9f2f2"/>${[...Array(5)].map((_, k) => `<path d="M${410 + k * 40} 0 V800" stroke="#d3e2e2"/>`).join('')}${[...Array(20)].map((_, r) => `<path d="M410 ${r * 40} H600" stroke="#d3e2e2"/>`).join('')}
    <rect x="404" y="0" width="10" height="800" fill="#bcd8e6" opacity=".8"/>
    <circle cx="505" cy="190" r="56" fill="#cfe3ea" stroke="#c9a24a" stroke-width="5"/><path d="M480 160 q16 -14 32 -4" stroke="#fff" stroke-width="5" fill="none" opacity=".7"/>
    <rect x="450" y="262" width="110" height="20" rx="4" fill="#fff"/><rect x="458" y="282" width="94" height="74" rx="4" fill="#cfa77a"/><ellipse cx="505" cy="266" rx="30" ry="6" fill="#dfeef2"/><path d="M505 258 v-10 h10" stroke="#9aa2a8" stroke-width="3" fill="none"/>
    <path d="M416 600 h178 v50 q0 46 -46 46 h-86 q-46 0 -46 -46z" fill="#fff" stroke="#d3dde0" stroke-width="3"/><ellipse cx="505" cy="604" rx="84" ry="10" fill="#bfe4f2"/><path d="M432 694 l-6 18 M578 694 l6 18" stroke="#c9a24a" stroke-width="5"/>
    ${win(426, 376, 162, 196, 220, 2)}
    <rect x="440" y="730" width="120" height="40" rx="12" fill="#86d1ff" opacity=".6"/>
    <rect x="0" y="560" width="14" height="200" fill="#8a5a3a"/><rect x="0" y="560" width="10" height="200" fill="#c7b499"/>
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
    ${label(172, 716, 'FAMILY 4×4', '#e9e1c8', 10)}${label(456, 718, 'FAMILY SEDAN', '#e9e1c8', 10)}
    ${c.rain ? [...Array(60)].map((_, k) => `<path d="M${hash(k) * 600} ${hash(k + 2) * 800} l-5 16" stroke="#e6eef7" stroke-width="1.4" opacity=".6"/>`).join('') : ''}
  `, c);
  };

  const elevator = (x, y, w, h, sign) => `<rect x="${x - 10}" y="${y - 34}" width="${w + 20}" height="${h + 34}" fill="url(#rsteel)"/><rect x="${x + w / 2 - 24}" y="${y - 28}" width="48" height="20" rx="4" fill="#1a1a1e"/><text x="${x + w / 2}" y="${y - 13}" text-anchor="middle" font-size="12" font-family="Nunito, sans-serif" font-weight="900" fill="#ff8a3a">▲ 4</text><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff4d6"/><rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 6}" fill="#e9dcc0"/><path d="M${x + 10} ${y + 30} H${x + w - 10}" stroke="#c9a24a" stroke-width="3"/>${sign ? label(x + w / 2, y - 40, sign, '#ffd98a', 10) : ''}`;
  ART.clap = (c) => svg(`
    <rect width="600" height="420" fill="#2b1d1a"/>${[...Array(30)].map((_, i) => `<path d="M${i * 20} 0 V420" stroke="#3a2723" stroke-width="6"/>`).join('')}
    ${win(26, 112, 196, 160, 80, 3)}
    <rect x="236" y="20" width="200" height="74" rx="14" fill="#1a1011"/><circle cx="336" cy="57" r="120" fill="url(#rneon)"/>
    <text x="336" y="72" text-anchor="middle" font-size="44" font-family="Baloo 2, sans-serif" font-weight="800" fill="#ffd1e6" stroke="#ff5fa2" stroke-width="2.5">CLAP</text>
    <text x="336" y="88" text-anchor="middle" font-size="10" font-family="Nunito, sans-serif" font-weight="800" fill="#ff9cc8">クラップ · HOOKAH &amp; TEA</text>
    ${label(336, 112, 'HAYAT SABZ MALL · 4TH FLOOR', '#c9a24a', 10)}
    ${[90, 210, 470, 560].map((x, i) => `<path d="M${x} 0 v${26 + i % 2 * 14}" stroke="#111" stroke-width="2"/><ellipse cx="${x}" cy="${50 + i % 2 * 14}" rx="18" ry="24" fill="#d63a3a"/><path d="M${x - 18} ${50 + i % 2 * 14} h36 M${x - 16} ${40 + i % 2 * 14} h32 M${x - 16} ${60 + i % 2 * 14} h32" stroke="#a52525" stroke-width="2"/><circle cx="${x}" cy="${50 + i % 2 * 14}" r="40" fill="url(#rglow)" opacity=".5"/>`).join('')}
    ${elevator(282, 206, 104, 214, '')}${label(334, 166, 'ELEVATOR', '#9aa2a8', 9)}
    <g transform="translate(470 150)">${[[10, 0], [74, -12], [-40, -10], [40, 40], [96, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" fill="#f6b7cf" opacity=".9"/><circle cx="${x}" cy="${y}" r="5" fill="#fff"/>`).join('')}</g>
    <rect x="0" y="300" width="196" height="22" fill="#6b4632"/><rect x="0" y="322" width="196" height="98" fill="#4a2f22"/>
    <g><ellipse cx="70" cy="294" rx="26" ry="20" fill="#2a2a2e"/><path d="M48 290 q-14 -6 -10 -18" stroke="#2a2a2e" stroke-width="6" fill="none"/><rect x="64" y="268" width="12" height="8" rx="2" fill="#2a2a2e"/>${[118, 144, 170].map((x) => `<rect x="${x - 7}" y="284" width="14" height="16" rx="3" fill="#e8dcc2"/>`).join('')}</g>
    ${label(98, 345, 'TEA BAR', '#e8dcc2', 11)}
    <rect x="198" y="304" width="76" height="26" rx="5" fill="#1a1011"/>${label(236, 321, 'POURYA’S', '#ffd98a', 10)}
    ${[212, 236, 260].map((x) => `<path d="M${x - 7} 352 h14 l-3 12 h-8z" fill="#b4572a"/><rect x="${x - 2}" y="364" width="4" height="8" fill="#7a3a1a"/>`).join('')}<rect x="200" y="372" width="72" height="5" fill="#6b4632"/>
    <g><rect x="208" y="398" width="58" height="26" rx="4" fill="#2a2a2e"/><rect x="214" y="390" width="46" height="12" rx="3" fill="#e05b3b"/><circle cx="228" cy="394" r="4" fill="#ffcf73"/><circle cx="244" cy="396" r="4" fill="#ff8a3a"/><path d="M226 384 q6 -12 0 -22 M246 384 q6 -12 0 -22" stroke="#bbb" stroke-width="2" fill="none" opacity=".6"/></g>
    <rect x="400" y="300" width="200" height="22" fill="#6b4632"/><rect x="400" y="322" width="200" height="98" fill="#4a2f22"/>
    <path d="M410 196 h180 v60 h-180z" fill="#1f2a5a"/><circle cx="500" cy="226" r="16" fill="#fff" opacity=".9"/><path d="M455 196 v60 M545 196 v60" stroke="#16204a" stroke-width="3"/>
    ${[430, 480, 530].map((x) => `<ellipse cx="${x}" cy="296" rx="20" ry="6" fill="#fff"/><rect x="${x - 10}" y="284" width="8" height="8" rx="2" fill="#e05b3b"/><rect x="${x + 2}" y="284" width="8" height="8" rx="2" fill="#f2b33a"/>`).join('')}
    ${label(500, 345, 'SUSHI', '#e8dcc2', 11)}
    ${wood(420, '#8a5c3c', 'rgba(40,20,10,.28)')}
  `, c, true);

  // the underground parking of Hayat Sabz mall
  ART.parking = (c) => svg(`
    <rect width="600" height="400" fill="#8d9298"/><rect width="600" height="40" fill="#6f747a"/>${[60, 220, 380, 540].map((x) => `<rect x="${x - 40}" y="16" width="80" height="8" rx="3" fill="#f6f7e8"/><circle cx="${x}" cy="30" r="70" fill="url(#rglow)" opacity=".35"/>`).join('')}
    <path d="M0 52 H600" stroke="#6b7076" stroke-width="10"/><path d="M0 70 H600" stroke="#c0392b" stroke-width="5" opacity=".8"/>
    ${[110, 300].map((x) => `<rect x="${x - 22}" y="40" width="44" height="360" fill="#a3a8ae"/><rect x="${x - 22}" y="250" width="44" height="18" fill="#f2c230"/><rect x="${x - 22}" y="290" width="44" height="18" fill="#f2c230"/>`).join('')}
    <rect x="140" y="100" width="130" height="60" rx="6" fill="#2f6b3e"/>${label(205, 124, 'HAYAT SABZ', '#fff', 15)}${label(205, 146, 'MALL · PARKING P2', '#d8f0dc', 10)}
    ${elevator(436, 214, 112, 186, 'CLAP · 4F ↑')}
    <rect x="0" y="400" width="600" height="400" fill="#5d6168"/>
    ${[0, 1, 2, 3].map((i) => `<path d="M${i * 150} 560 V800" stroke="#e9e6d6" stroke-width="5"/>`).join('')}<path d="M0 560 H600" stroke="#e9e6d6" stroke-width="5" opacity=".6"/>
    ${label(75, 780, 'P2-14', '#e9e6d6', 16)}${label(375, 780, 'P2-16', '#e9e6d6', 16)}${label(525, 780, 'P2-17', '#e9e6d6', 16)}
    <path d="M300 520 l40 -40 l40 40 h-24 v40 h-32 v-40z" fill="#e9e6d6" opacity=".7" transform="translate(150 -40)"/>
    <g><rect x="20" y="640" width="110" height="50" rx="14" fill="#c0392b"/><path d="M40 640 q14 -28 36 -28 h14 q20 0 30 28z" fill="#a93226"/><circle cx="44" cy="692" r="14" fill="#2a2a2e"/><circle cx="108" cy="692" r="14" fill="#2a2a2e"/></g>
    <g><rect x="470" y="640" width="120" height="50" rx="14" fill="#2c3e50"/><path d="M490 640 q14 -28 40 -28 h14 q22 0 34 28z" fill="#22313f"/><circle cx="496" cy="692" r="14" fill="#2a2a2e"/><circle cx="566" cy="692" r="14" fill="#2a2a2e"/></g>
  `, c, true);

  // foreground props (drawn above characters standing behind them)
  const table = (w, top, legs, extra) => `<svg viewBox="0 0 ${w} ${top + legs + 4}" width="${w}" height="${top + legs + 4}">${extra || ''}<rect x="0" y="${top}" width="${w}" height="16" rx="4" fill="#b07a48"/><path d="M8 ${top + 6} H${w - 8}" stroke="#8a5a32" stroke-width="1.5" opacity=".6"/><rect x="0" y="${top + 14}" width="${w}" height="6" fill="#8a5a32"/><rect x="12" y="${top + 20}" width="9" height="${legs - 16}" fill="#7a4e2c"/><rect x="${w - 21}" y="${top + 20}" width="9" height="${legs - 16}" fill="#7a4e2c"/></svg>`;
  const glasses = (x, y) => `<rect x="${x - 6}" y="${y}" width="12" height="16" rx="3" fill="#f8e3c2" opacity=".9"/><rect x="${x - 4}" y="${y + 6}" width="8" height="9" fill="#b4472a"/>`;
  const hookah = (x, y) => `<path d="M${x - 14} ${y + 98} q-8 -22 14 -34 q22 12 14 34z" fill="#7ec8e3" opacity=".85"/><rect x="${x - 4}" y="${y + 24}" width="8" height="42" fill="#c9a24a"/><path d="M${x - 12} ${y + 24} h24 l-4 -10 h-16z" fill="#b4572a"/><circle cx="${x}" cy="${y + 10}" r="6" fill="#ff8a3a"/><path d="M${x + 4} ${y + 60} q40 10 60 34" stroke="#2a2a2e" stroke-width="3" fill="none"/><path d="M${x - 6} ${y} q-8 -20 6 -36 q-10 -16 4 -30" stroke="#ddd" stroke-width="5" fill="none" opacity=".35"/>`;
  const PROPS = {
    clap: () => [
      { x: 160, y: 490, w: 330, h: 170, z: 662, svg: table(330, 110, 56, hookah(160, 12) + glasses(220, 96) + glasses(244, 96) + '<ellipse cx="270" cy="108" rx="22" ry="5" fill="#f3efe9"/>') },
      { x: 0, y: 440, w: 182, h: 92, z: 526, svg: table(182, 34, 54, glasses(60, 20) + glasses(120, 20)) },
      { x: 438, y: 668, w: 162, h: 92, z: 756, svg: table(162, 34, 54, glasses(50, 20) + '<ellipse cx="110" cy="32" rx="20" ry="5" fill="#f3efe9"/>') },
    ],
  };

  window.RoomArt = { defs, ART, PROPS };
})();
