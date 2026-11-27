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
      <linearGradient id="rtv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f8f4a"/><stop offset="1" stop-color="#2d6e38"/></linearGradient></defs>`;
  }
  const win = (x, y, w, h, ox) => `<rect x="${x - 6}" y="${y - 6}" width="${w + 12}" height="${h + 12}" fill="#1e1d22"/><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${ox} 0 ${(w * 300) / h} 300" preserveAspectRatio="none">${VIEW}</svg><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#rglass)"/><rect x="${x + w / 2 - 2}" y="${y}" width="4" height="${h}" fill="#1e1d22"/>`;
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
    ${win(122, 44, 220, 262, 100)}${win(362, 44, 128, 262, 240)}
    <path d="M108 30 q10 150 0 290 h-16 q8 -146 0 -290z" fill="#e9d8c2"/><path d="M506 30 q-10 150 0 290 h16 q-8 -146 0 -290z" fill="#e9d8c2"/>
    ${arch(0, 196, 88, 196, 'KITCHEN · TV')}
    <rect x="512" y="186" width="88" height="206" fill="#e2d6c4"/><rect x="518" y="192" width="82" height="200" fill="#5a3a26"/><rect x="532" y="210" width="54" height="44" rx="4" fill="#9fc4da" opacity=".7"/><rect x="590" y="300" width="4" height="24" rx="2" fill="#c9a24a"/>
    ${label(558, 182, 'FRONT DOOR', '#7a5c4e', 9)}
    ${wood(392)}
    <rect x="512" y="392" width="88" height="14" fill="#8c6a4a" opacity=".5"/>
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
    ${wall(392)}
    ${[0, 1].map((i) => `<rect x="${10 + i * 112}" y="56" width="106" height="110" rx="3" fill="#2f4a3e"/><rect x="${18 + i * 112}" y="152" width="90" height="3" fill="#c9a24a"/>`).join('')}
    ${win(250, 44, 200, 196, 120)}
    <rect x="0" y="176" width="600" height="104" fill="#f1ede7"/>${[...Array(15)].map((_, i) => `<path d="M${i * 40} 176 v104" stroke="#e4ddd2" stroke-width="1"/>`).join('')}<path d="M0 228 H600" stroke="#e4ddd2"/>
    <rect x="0" y="280" width="600" height="10" fill="#f8f5f0"/>
    <rect x="0" y="290" width="600" height="102" fill="#2f4a3e"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${12 + i * 98}" y="302" width="78" height="3" fill="#c9a24a"/>`).join('')}
    <rect x="22" y="266" width="62" height="14" rx="4" fill="#cfd5d9"/><path d="M52 266 v-18 q0 -7 9 -7 h7" stroke="#c9a24a" stroke-width="3.5" fill="none"/>
    <rect x="112" y="272" width="72" height="8" fill="#222"/><ellipse cx="148" cy="262" rx="24" ry="11" fill="#e05b7b"/><rect x="124" y="252" width="48" height="13" rx="3" fill="#e05b7b"/><path d="M140 244 q4 -10 0 -18 M152 244 q4 -10 0 -18" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/>
    <g><ellipse cx="240" cy="280" rx="24" ry="4" fill="rgba(0,0,0,.15)"/><path d="M222 278 q-4 -30 7 -43 h22 q11 13 7 43z" fill="#d9b866"/><path d="M231 235 q9 -9 18 0" fill="#c9a24a"/><path d="M232 226 h16 l-2 10 h-12z" fill="#e05b7b"/><path d="M222 246 q-2 18 4 28" stroke="#fff6cc" stroke-width="3" fill="none" opacity=".7"/></g>
    <g><path d="M312 280 l4 -42 h30 l4 42z" fill="#c9a27a"/><path d="M316 244 h30" stroke="#9a6232" stroke-width="3"/>${label(331, 266, 'KIBBLE', '#7a4a22', 10)}</g>
    <g><ellipse cx="410" cy="276" rx="26" ry="6" fill="#e9e1d4"/><circle cx="400" cy="266" r="9" fill="#e05b3b"/><circle cx="414" cy="264" r="8" fill="#f2b33a"/><circle cx="420" cy="270" r="7" fill="#6aa84f"/></g>
    <rect x="462" y="108" width="74" height="284" rx="6" fill="#d9dde0"/><rect x="466" y="112" width="66" height="96" rx="4" fill="#e7eaec"/><rect x="466" y="212" width="66" height="176" rx="4" fill="#e7eaec"/><rect x="522" y="140" width="4" height="40" rx="2" fill="#9aa2a8"/><rect x="522" y="240" width="4" height="60" rx="2" fill="#9aa2a8"/>
    ${arch(540, 196, 60, 196, '')}${label(570, 190, 'LIVING ›', '#7a5c4e', 9)}
    <rect x="0" y="392" width="600" height="408" fill="#efe7da"/>${[...Array(10)].map((_, r) => [...Array(10)].map((_, k) => ((r + k) % 2 ? `<rect x="${k * 60}" y="${392 + r * 42}" width="60" height="42" fill="#e3d8c6"/>` : '')).join('')).join('')}
    <rect x="200" y="566" width="230" height="16" rx="4" fill="#8a5a3a"/><rect x="214" y="582" width="8" height="70" fill="#7a4e32"/><rect x="408" y="582" width="8" height="70" fill="#7a4e32"/>
    ${[230, 300, 370].map((x) => `<rect x="${x}" y="530" width="34" height="34" rx="6" fill="#c9785a"/>`).join('')}
    <ellipse cx="315" cy="560" rx="22" ry="6" fill="#f3efe9"/><path d="M305 556 q10 -26 20 0" fill="#6aa84f"/>
  `, c);

  ART.tv = (c) => svg(`
    ${wall(392, '#efe6da')}
    ${win(44, 50, 240, 250, 60)}
    <rect x="320" y="96" width="250" height="150" rx="6" fill="#111"/><rect x="328" y="104" width="234" height="134" fill="url(#rtv)"/>
    <path d="M328 171 H562 M445 104 V238" stroke="#fff" stroke-width="2" opacity=".55"/><circle cx="445" cy="171" r="20" fill="none" stroke="#fff" stroke-width="2" opacity=".55"/><rect x="328" y="146" width="22" height="50" fill="none" stroke="#fff" stroke-width="2" opacity=".55"/><rect x="540" y="146" width="22" height="50" fill="none" stroke="#fff" stroke-width="2" opacity=".55"/>
    <circle cx="470" cy="160" r="4" fill="#fff"/><rect x="336" y="110" width="74" height="14" rx="3" fill="rgba(0,0,0,.45)"/><text x="373" y="121" text-anchor="middle" font-size="9" font-family="Nunito, sans-serif" font-weight="800" fill="#fff">PERSEPOLIS 2–1</text>
    <rect x="330" y="252" width="230" height="10" rx="3" fill="#2a2a2a"/>
    <rect x="300" y="300" width="290" height="70" rx="6" fill="#6b4632"/><rect x="310" y="312" width="80" height="46" rx="4" fill="#5a3a26"/><rect x="400" y="312" width="80" height="46" rx="4" fill="#5a3a26"/><rect x="490" y="312" width="90" height="46" rx="4" fill="#5a3a26"/>
    <rect x="0" y="0" width="38" height="392" fill="#e6dccf"/><rect x="0" y="196" width="34" height="196" fill="#c7b499"/>${label(20, 190, '‹', '#7a5c4e', 16)}
    ${wood(392, '#caa278')}
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
    ${[100, 300, 500].map((x) => `<ellipse cx="${x}" cy="22" rx="30" ry="8" fill="#fff8e6"/><circle cx="${x}" cy="40" r="60" fill="url(#rglow)" opacity=".6"/>`).join('')}
    ${[[150, 92], [290, 80], [430, 96]].map(([x, y], i) => `<rect x="${x}" y="${y}" width="46" height="56" rx="3" fill="#6b4632"/><rect x="${x + 5}" y="${y + 5}" width="36" height="46" fill="${['#f3c6d5', '#bfe0f0', '#f6e1b0'][i]}"/><circle cx="${x + 23}" cy="${y + 24}" r="9" fill="${['#c9496f', '#4a5a8a', '#c9a24a'][i]}" opacity=".7"/>`).join('')}
    ${door(40, 96, '#f2b7c8', '#c9496f', 'NENA', label(88, 290, '♥', '#c9496f', 22))}
    ${door(178, 96, '#c8a2d6', '#7d4a96', 'NASIM', '<rect x="196" y="262" width="60" height="18" rx="3" fill="#ffde59" transform="rotate(-6 226 271)"/><text x="226" y="275" text-anchor="middle" font-size="9" font-family="Nunito, sans-serif" font-weight="900" fill="#c0392b" transform="rotate(-6 226 271)">KEEP OUT!</text>')}
    ${door(316, 96, '#a9c2d4', '#4a5a8a', 'NEGIN', '<text x="364" y="282" text-anchor="middle" font-size="9" font-family="Nunito, sans-serif" font-weight="900" fill="#4a5a8a">DO NOT WAKE</text><text x="388" y="258" font-size="16">💤</text>')}
    ${door(450, 124, '#b98b5e', '#6b4632', 'BABA & MAMAN', '<path d="M512 232 V432" stroke="#8a6340" stroke-width="3"/>')}
    ${wood(432, '#c99d70')}
    <polygon points="230,432 370,432 420,800 180,800" fill="#8c1f30" opacity=".9"/><polygon points="242,440 358,440 404,800 196,800" fill="none" stroke="#1f2a5a" stroke-width="5"/>
    <g stroke="#fff" stroke-width="5" stroke-linecap="round"><path d="M150 742 H450 M150 778 H450"/>${[...Array(13)].map((_, i) => `<path d="M${156 + i * 24} 738 v48"/>`).join('')}</g>
    <rect x="232" y="700" width="136" height="30" rx="6" fill="#2f4a3e"/>${label(300, 715, 'BEDROOMS', '#ffd98a', 11)}<text x="300" y="726" text-anchor="middle" font-size="9" font-family="Nunito, sans-serif" font-weight="800" fill="#fff">🔑 Nena only</text>
  `, c);
  };

  ART.bedroom = (c) => svg(`
    <rect width="410" height="430" fill="#f6e4e4"/><rect width="410" height="12" fill="#fbf3f0"/>
    ${win(40, 50, 200, 210, 30)}
    <path d="M30 40 q100 30 200 0 q60 20 120 0" stroke="#7a5c4e" stroke-width="1.2" fill="none"/>${[...Array(12)].map((_, i) => `<circle cx="${40 + i * 27}" cy="${46 + Math.sin(i) * 6}" r="3.4" fill="${['#ffd98a', '#ef8fb0', '#86d1ff'][i % 3]}"/>`).join('')}
    <rect x="276" y="282" width="120" height="10" rx="2" fill="#8a5a3a"/><rect x="284" y="292" width="6" height="140" fill="#7a4e32"/><rect x="382" y="292" width="6" height="140" fill="#7a4e32"/>
    <path d="M318 282 l6 -34 h44 l6 34z" fill="#3a3550"/><rect x="326" y="252" width="40" height="26" fill="#ef8fb0" opacity=".85"/>
    <rect x="300" y="120" width="90" height="120" rx="4" fill="#e9d2d2"/><rect x="306" y="126" width="78" height="108" fill="#f8eeee"/>${label(345, 186, 'NENA', '#c9496f', 13)}
    <rect x="0" y="430" width="410" height="370" fill="#d9b48c"/>${[...Array(12)].map((_, i) => `<path d="M0 ${440 + i * 34} H410" stroke="rgba(110,70,35,.12)" stroke-width="1.4"/>`).join('')}
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
    <path d="M560 380 v120 M548 380 h24" stroke="#9aa2a8" stroke-width="4"/><circle cx="560" cy="510" r="10" fill="#9aa2a8"/>
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

  ART.clap = (c) => svg(`
    <rect width="600" height="420" fill="#2b1d1a"/>${[...Array(30)].map((_, i) => `<path d="M${i * 20} 0 V420" stroke="#3a2723" stroke-width="6"/>`).join('')}
    ${win(30, 110, 190, 170, 80)}
    <rect x="236" y="40" width="200" height="74" rx="14" fill="#1a1011"/><circle cx="336" cy="77" r="120" fill="url(#rneon)"/>
    <text x="336" y="92" text-anchor="middle" font-size="44" font-family="Baloo 2, sans-serif" font-weight="800" fill="#ffd1e6" stroke="#ff5fa2" stroke-width="2.5">CLAP</text>
    <text x="336" y="108" text-anchor="middle" font-size="10" font-family="Nunito, sans-serif" font-weight="800" fill="#ff9cc8">クラップ · HOOKAH &amp; TEA</text>
    ${[90, 210, 470, 560].map((x, i) => `<path d="M${x} 0 v${26 + i % 2 * 14}" stroke="#111" stroke-width="2"/><ellipse cx="${x}" cy="${50 + i % 2 * 14}" rx="18" ry="24" fill="#d63a3a"/><path d="M${x - 18} ${50 + i % 2 * 14} h36 M${x - 16} ${40 + i % 2 * 14} h32 M${x - 16} ${60 + i % 2 * 14} h32" stroke="#a52525" stroke-width="2"/><circle cx="${x}" cy="${50 + i % 2 * 14}" r="40" fill="url(#rglow)" opacity=".5"/>`).join('')}
    <g transform="translate(470 150)"><path d="M0 120 q30 -60 10 -120 M10 60 q40 -20 70 -10 M14 30 q-30 -20 -50 -8" stroke="#5a3a2a" stroke-width="5" fill="none"/>${[[10, 0], [74, -12], [-40, -10], [40, 40], [20, 80], [-20, 40], [96, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" fill="#f6b7cf" opacity=".9"/><circle cx="${x}" cy="${y}" r="5" fill="#fff"/>`).join('')}</g>
    <rect x="0" y="300" width="200" height="22" fill="#6b4632"/><rect x="0" y="322" width="200" height="98" fill="#4a2f22"/>
    <g><ellipse cx="80" cy="294" rx="26" ry="20" fill="#2a2a2e"/><path d="M58 290 q-14 -6 -10 -18" stroke="#2a2a2e" stroke-width="6" fill="none"/><rect x="74" y="268" width="12" height="8" rx="2" fill="#2a2a2e"/>${[124, 150, 176].map((x) => `<rect x="${x - 7}" y="284" width="14" height="16" rx="3" fill="#e8dcc2"/>`).join('')}</g>
    <rect x="400" y="300" width="200" height="22" fill="#6b4632"/><rect x="400" y="322" width="200" height="98" fill="#4a2f22"/>
    <path d="M410 150 h180 v90 h-180z" fill="#1f2a5a"/><circle cx="500" cy="196" r="22" fill="#fff" opacity=".9"/><path d="M455 150 v90 M545 150 v90" stroke="#16204a" stroke-width="3"/>
    ${[430, 480, 530].map((x) => `<ellipse cx="${x}" cy="296" rx="20" ry="6" fill="#fff"/><rect x="${x - 10}" y="284" width="8" height="8" rx="2" fill="#e05b3b"/><rect x="${x + 2}" y="284" width="8" height="8" rx="2" fill="#f2b33a"/>`).join('')}
    <g><rect x="210" y="400" width="60" height="26" rx="4" fill="#2a2a2e"/><rect x="216" y="392" width="48" height="12" rx="3" fill="#e05b3b"/><circle cx="230" cy="396" r="4" fill="#ffcf73"/><circle cx="246" cy="398" r="4" fill="#ff8a3a"/><path d="M226 384 q6 -12 0 -22 M246 384 q6 -12 0 -22" stroke="#bbb" stroke-width="2" fill="none" opacity=".6"/></g>
    <rect x="0" y="420" width="600" height="380" fill="#c9c08e"/>${[...Array(4)].map((_, r) => [...Array(4)].map((_, k) => `<rect x="${k * 150 + 2}" y="${424 + r * 96}" width="146" height="92" fill="none" stroke="#6b5e3a" stroke-width="4"/>`).join('')).join('')}
    <rect x="200" y="600" width="300" height="20" rx="4" fill="#3a2418"/><rect x="214" y="620" width="10" height="40" fill="#2a1a12"/><rect x="476" y="620" width="10" height="40" fill="#2a1a12"/>
    ${[[230, 690], [470, 690], [240, 590]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="40" ry="12" fill="#a52525"/>`).join('')}
    <g><path d="M308 598 q-8 -20 12 -30 q20 10 12 30z" fill="#7ec8e3" opacity=".8"/><rect x="316" y="528" width="8" height="42" fill="#c9a24a"/><path d="M308 528 h24 l-4 -10 h-16z" fill="#2a2a2e"/><circle cx="320" cy="514" r="6" fill="#ff8a3a"/><path d="M324 560 q40 10 60 34" stroke="#2a2a2e" stroke-width="3" fill="none"/><path d="M314 506 q-8 -20 6 -36 q-10 -16 4 -30" stroke="#ddd" stroke-width="5" fill="none" opacity=".35"/></g>
    <g><ellipse cx="410" cy="598" rx="26" ry="6" fill="#f3efe9"/>${[400, 420].map((x) => `<rect x="${x - 6}" y="580" width="12" height="16" rx="3" fill="#f8e3c2" opacity=".9"/><rect x="${x - 4}" y="586" width="8" height="9" fill="#b4472a"/>`).join('')}</g>
  `, c, true);

  window.RoomArt = { defs, ART };
})();
