/* SVG characters: used in the scene (DOM) and in the mini-games (canvas). */
window.Art = (function () {
  'use strict';

  const OUTFITS = {
    basique: { top: '#f6d9b8', stripe: '#e98aab', bottom: '#4f6d9a' },
    sweat:   { top: '#b9a5e3', stripe: '#ffffff', bottom: '#3f4f78' },
    robe:    { top: '#f5cf5b', stripe: '#fff3c4', bottom: '#f5cf5b' },
    cire:    { top: '#f2c230', stripe: '#d99a00', bottom: '#4f6d9a' },
  };
  const COLLARS = {
    rouge:   { color: '#d4513f', kind: 'collar' },
    bandana: { color: '#ef8fb0', kind: 'bandana' },
    noeud:   { color: '#4a7bd0', kind: 'bow' },
  };

  /* Nena's hair, modelled on the cover art: big, tousled auburn-chestnut waves. */
  const NH = { base: '#7d3a1a', mid: '#984f27', dark: '#5a2711', light: '#c4743f' };
  const NENA_HAIR_BACK = `
      <path d="M60 14 C29 12 10 35 13 60 C3 72 9 88 5 101 C-1 117 11 127 5 141 C1 155 13 165 9 179 C21 188 34 183 40 170 L80 170 C86 183 99 188 111 179 C107 165 119 155 115 141 C109 127 121 117 115 101 C111 88 117 72 107 60 C110 35 91 12 60 14Z" fill="${NH.dark}"/>
      <path d="M60 19 C33 18 16 38 18 61 C10 73 15 88 11 100 C6 115 16 125 11 139 C8 151 18 161 15 172 C25 178 34 172 39 162 L81 162 C86 172 95 178 105 172 C102 161 112 151 109 139 C104 125 114 115 109 100 C105 88 110 73 102 61 C104 38 87 18 60 19Z" fill="${NH.base}"/>
      <g fill="none" stroke-linecap="round">
        <path d="M17 64 C27 76 13 88 21 100 C29 112 13 124 19 138 C25 150 13 160 19 171" stroke="${NH.mid}" stroke-width="4"/>
        <path d="M103 64 C93 76 107 88 99 100 C91 112 107 124 101 138 C95 150 107 160 101 171" stroke="${NH.mid}" stroke-width="4"/>
        <path d="M27 72 C35 84 23 96 29 108 C35 120 23 132 29 144" stroke="${NH.light}" stroke-width="2.2" opacity=".7"/>
        <path d="M93 72 C85 84 97 96 91 108 C85 120 97 132 91 144" stroke="${NH.light}" stroke-width="2.2" opacity=".7"/>
      </g>`;
  const NENA_HAIR_FRONT = `
      <path d="M27 74 C21 38 45 21 66 24 C89 27 100 46 95 75 C91 60 85 52 75 49 C71 60 58 66 44 66 C37 66 31 69 27 74Z" fill="${NH.base}"/>
      <path d="M29 52 C29 34 45 25 57 29 C46 34 39 45 41 58Z" fill="${NH.mid}"/>
      <path d="M41 31 C55 23 77 26 89 41" stroke="${NH.light}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>
      <path d="M49 39 C57 48 66 51 72 48" stroke="${NH.mid}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <path d="M31 60 C18 76 34 88 22 104 C12 118 30 130 20 146 C14 158 26 166 24 173 C35 171 43 160 41 148 C39 134 47 124 41 110 C35 96 47 86 39 72 C37 66 35 62 33 60Z" fill="${NH.mid}"/>
      <path d="M89 60 C102 76 86 88 98 104 C108 118 90 130 100 146 C106 158 94 166 96 173 C85 171 77 160 79 148 C81 134 73 124 79 110 C85 96 73 86 81 72 C83 66 85 62 87 60Z" fill="${NH.mid}"/>
      <g fill="none" stroke="${NH.light}" stroke-width="1.9" stroke-linecap="round" opacity=".8">
        <path d="M33 68 C27 80 37 90 29 102 C23 112 33 122 27 134"/><path d="M87 68 C93 80 83 90 91 102 C97 112 87 122 93 134"/>
      </g>`;

  /* eyes: 'both' (CSS decides), 'open', 'closed' */
  const HL = 'rgba(255,255,255,.22)', SH = 'rgba(60,20,10,.14)';
  function nena(opts) {
    const o = Object.assign({ dressed: false, outfit: 'basique', eyes: 'both', standalone: false }, opts || {});
    const c = OUTFITS[o.outfit] || OUTFITS.basique;
    const arm = o.dressed ? c.top : '#f4a3c0';
    const ns = o.standalone ? ' xmlns="http://www.w3.org/2000/svg" width="240" height="420"' : '';
    const dress = o.dressed && o.outfit === 'robe';
    const H1 = '#7a3a1c', H2 = '#92502a', H3 = '#5a2912', HLc = '#b86c3e', SK = '#f8cfae', SK2 = '#efb892';
    const eyesOpen = `<g class="eyes-open">
        <ellipse cx="46" cy="75" rx="5.4" ry="6.6" fill="#3a1d12"/><ellipse cx="74" cy="75" rx="5.4" ry="6.6" fill="#3a1d12"/>
        <ellipse cx="46" cy="76.5" rx="3.6" ry="4.4" fill="#6e3a22"/><ellipse cx="74" cy="76.5" rx="3.6" ry="4.4" fill="#6e3a22"/>
        <circle cx="47.8" cy="72.6" r="2" fill="#fff"/><circle cx="75.8" cy="72.6" r="2" fill="#fff"/>
        <circle cx="44.2" cy="78.4" r="0.9" fill="#fff" opacity=".8"/><circle cx="72.2" cy="78.4" r="0.9" fill="#fff" opacity=".8"/>
        <path d="M39.5 70.5 q6.5 -5 13 0" stroke="#2a130b" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <path d="M67.5 70.5 q6.5 -5 13 0" stroke="#2a130b" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <path d="M39.6 71 l-3.2 -1.6 M40.6 69.4 l-2.4 -2.6 M80.4 71 l3.2 -1.6 M79.4 69.4 l2.4 -2.6" stroke="#2a130b" stroke-width="1.6" stroke-linecap="round"/></g>`;
    const eyesClosed = `<g class="eyes-closed">
        <path d="M39 75 q7 6 14 0" stroke="#2a130b" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path d="M67 75 q7 6 14 0" stroke="#2a130b" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path d="M41 77.5 l-1.6 2.6 M44.5 79 l-0.8 2.8 M48.5 79 l0.4 2.8 M71.5 79 l-0.4 2.8 M75.5 79 l0.8 2.8 M79 77.5 l1.6 2.6" stroke="#2a130b" stroke-width="1.4" stroke-linecap="round"/></g>`;
    const eyes = o.eyes === 'open' ? eyesOpen : o.eyes === 'closed' ? eyesClosed : eyesOpen + eyesClosed;
    const shoes = `<ellipse cx="47" cy="202" rx="11.5" ry="5.5" fill="#5a3426"/><ellipse cx="73" cy="202" rx="11.5" ry="5.5" fill="#5a3426"/>
      <ellipse cx="44" cy="200" rx="4" ry="1.6" fill="${HL}"/><ellipse cx="70" cy="200" rx="4" ry="1.6" fill="${HL}"/>`;
    let body;
    if (!o.dressed) {
      body = `<rect x="38" y="164" width="18" height="36" rx="8" fill="#ec8eaf"/><rect x="64" y="164" width="18" height="36" rx="8" fill="#ec8eaf"/>
        <rect x="38" y="190" width="18" height="6" rx="3" fill="#d9779b"/><rect x="64" y="190" width="18" height="6" rx="3" fill="#d9779b"/>
        <path d="M34 128 q0 -16 26 -16 q26 0 26 16 v34 q0 12 -26 12 q-26 0 -26 -12z" fill="#f4a3c0"/>
        <path d="M72 114 q14 4 14 16 v32 q0 10 -12 12 q8 -20 -2 -60z" fill="${SH}"/>
        <path d="M48 114 l12 15 l12 -15" fill="#fff4f8" stroke="#c9557d" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M60 129 v40" stroke="#c9557d" stroke-width="1.6" stroke-dasharray="0.1 9" stroke-linecap="round" stroke-width="3.4"/>
        <g fill="#fff" opacity=".75"><path d="M42 140 l1.6 3.2 l3.4 .4 l-2.5 2.4 l.6 3.4 l-3.1 -1.6 l-3.1 1.6 l.6 -3.4 l-2.5 -2.4 l3.4 -.4z" transform="scale(.7) translate(18 60)"/><circle cx="76" cy="150" r="1.6"/><circle cx="46" cy="160" r="1.4"/><circle cx="72" cy="134" r="1.2"/></g>`;
    } else if (dress) {
      body = `<rect x="42" y="172" width="13" height="28" rx="6" fill="${SK}"/><rect x="65" y="172" width="13" height="28" rx="6" fill="${SK}"/>
        <path d="M38 124 q22 -14 44 0 l12 52 q-34 10 -68 0z" fill="${c.top}"/>
        <path d="M70 116 q12 6 14 12 l10 48 q-8 3 -16 4 q6 -30 -8 -64z" fill="${SH}"/>
        <path d="M28 168 q32 10 64 0" stroke="${c.stripe}" stroke-width="5" fill="none"/>
        <path d="M48 116 q12 10 24 0" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>`;
    } else {
      body = `<rect x="38" y="160" width="18" height="40" rx="7" fill="${c.bottom}"/><rect x="64" y="160" width="18" height="40" rx="7" fill="${c.bottom}"/>
        <path d="M47 164 v30 M73 164 v30" stroke="rgba(255,255,255,.18)" stroke-width="1.6"/>
        <rect x="36" y="156" width="48" height="14" rx="6" fill="${c.bottom}"/>
        <path d="M34 128 q0 -16 26 -16 q26 0 26 16 v26 q0 8 -26 8 q-26 0 -26 -8z" fill="${c.top}"/>
        <path d="M72 114 q14 4 14 16 v24 q0 6 -12 8 q8 -20 -2 -48z" fill="${SH}"/>
        <path d="M38 132 h44" stroke="${c.stripe}" stroke-width="5"/><path d="M36 145 h48" stroke="${c.stripe}" stroke-width="5"/>
        <path d="M50 113 q10 8 20 0" stroke="rgba(0,0,0,.12)" stroke-width="3" fill="none"/>
        ${o.outfit === 'cire' ? `<path d="M34 122 q26 -14 52 0" stroke="${c.stripe}" stroke-width="4" fill="none"/><circle cx="60" cy="136" r="2.4" fill="${c.stripe}"/><circle cx="60" cy="150" r="2.4" fill="${c.stripe}"/>` : ''}`;
    }
    return `<svg viewBox="0 0 120 210" class="sprite"${ns}>
      ${NENA_HAIR_BACK}
      ${body}
      ${shoes}
      <g class="arms">
        <path class="arm-l" d="M36 120 q-14 6 -14 22 v14 q0 6 7 6 q7 0 7 -6 v-12 q0 -10 6 -14z" fill="${arm}"/>
        <path class="arm-r" d="M84 120 q14 6 14 22 v14 q0 6 -7 6 q-7 0 -7 -6 v-12 q0 -10 -6 -14z" fill="${arm}"/>
        <path d="M84 122 q12 6 13 20 v14 q-2 4 -5 5 q2 -24 -8 -39z" fill="${SH}"/>
        <circle cx="29" cy="162" r="7" fill="${SK}"/><circle cx="91" cy="162" r="7" fill="${SK}"/>
      </g>
      <rect x="53" y="96" width="14" height="19" rx="6" fill="${SK2}"/>
      <ellipse cx="60" cy="108" rx="10" ry="4" fill="rgba(120,50,30,.18)"/>
      <ellipse cx="60" cy="72" rx="30.5" ry="32.5" fill="${SK}"/>
      <path d="M33 80 q4 18 27 24 q-20 -2 -27 -24z" fill="rgba(230,150,120,.25)"/>
      ${NENA_HAIR_FRONT}
      <path d="M39 63 q7 -5.2 14 -1.2" stroke="#5a2c17" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <path d="M67 62 q7 -4 14 1.2" stroke="#5a2c17" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      ${eyes}
      <ellipse cx="37.5" cy="87" rx="7.5" ry="4.8" fill="#f38fae" opacity=".55"/><ellipse cx="82.5" cy="87" rx="7.5" ry="4.8" fill="#f38fae" opacity=".55"/>
      <g fill="#c98466"><circle cx="35" cy="83" r=".95"/><circle cx="39" cy="85.5" r=".95"/><circle cx="36.5" cy="88" r=".8"/><circle cx="85" cy="83" r=".95"/><circle cx="81" cy="85.5" r=".95"/><circle cx="83.5" cy="88" r=".8"/></g>
      <path d="M58.6 83 q1.6 1.6 3 0" stroke="#d99a7c" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path class="mouth" d="M53.5 90 q6.5 6.5 13 0" stroke="#b4485a" stroke-width="2.4" fill="#e9707f" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  function collarSvg(id) {
    const c = COLLARS[id];
    if (!c) return '';
    if (c.kind === 'bandana') return `<path d="M30 96 q24 12 46 -2 l-20 28z" fill="${c.color}"/><g fill="#fff"><circle cx="48" cy="104" r="2"/><circle cx="58" cy="108" r="2"/><circle cx="54" cy="114" r="1.6"/></g>`;
    if (c.kind === 'bow') return `<path d="M34 98 q20 10 40 0" stroke="#2f4f8f" stroke-width="5" fill="none"/><path d="M54 104 l-14 -9 v18z M54 104 l14 -9 v18z" fill="${c.color}"/><circle cx="54" cy="104" r="4" fill="#2f4f8f"/>`;
    return `<path d="M32 97 q22 12 44 0" stroke="${c.color}" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="54" cy="110" r="5" fill="#ffd36b" stroke="#c99a2e" stroke-width="1.5"/>`;
  }

  const PALETTES = {
    chow:  { tail: '#e38c30', tail2: '#f0a54a', body: '#e38c30', back: '#ee9f45', legs: '#de8429', paws: '#f0a54a', mane: '#e8952f', face: '#f2a94e', ear: '#c96f1c', earIn: '#8f4e18', muzzle: '#f7c27c' },
    shiba: { tail: '#d0672c', tail2: '#f6e3c8', body: '#d0672c', back: '#dd7a3a', legs: '#c45f28', paws: '#f6e3c8', mane: '#d97236', face: '#e08443', ear: '#b9551f', earIn: '#f3d2b4', muzzle: '#fbeedd' },
  };
  // fur tuft outline around the head (chow chow lion mane)
  function tufts(cx, cy, r1, r2, n, rot) {
    let d = '';
    for (let i = 0; i <= n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2 + (rot || 0);
      const r = i % 2 ? r2 : r1;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * r).toFixed(1) + ' ' + (cy + Math.sin(a) * r).toFixed(1) + ' ';
    }
    return d + 'Z';
  }
  const MANE = tufts(52, 68, 49, 40, 18, 0.1);
  const MANE2 = tufts(52, 68, 42, 35, 16, 0.3);
  function simba(opts) {
    const o = Object.assign({ collar: null, muddy: false, eyes: 'both', tongue: 'css', standalone: false, palette: 'chow' }, opts || {});
    const P = PALETTES[o.palette] || PALETTES.chow;
    const ns = o.standalone ? ' xmlns="http://www.w3.org/2000/svg" width="340" height="270"' : '';
    const open = `<g class="dog-eyes-open">
        <ellipse cx="41" cy="60.5" rx="4.6" ry="4" fill="#2a2130"/><ellipse cx="63" cy="60.5" rx="4.6" ry="4" fill="#2a2130"/>
        <circle cx="42.6" cy="59" r="1.5" fill="#fff"/><circle cx="64.6" cy="59" r="1.5" fill="#fff"/>
</g>`;
    const closed = `<g class="dog-eyes-closed">
        <path d="M35 60 q6 4.5 12 0" stroke="#2a2130" stroke-width="2.8" fill="none" stroke-linecap="round"/>
        <path d="M57 60 q6 4.5 12 0" stroke="#2a2130" stroke-width="2.8" fill="none" stroke-linecap="round"/></g>`;
    const eyes = o.eyes === 'open' ? open : o.eyes === 'closed' ? closed : open + closed;
    const tongue = o.tongue === false ? '' : `<path class="tongue" d="M47.5 87 q4.5 13 9 0Z" fill="${o.palette === 'shiba' ? '#e9677f' : '#3c3a6b'}"/>`;
    const mud = o.muddy ? `<g fill="#6e4f33" opacity=".88"><ellipse cx="96" cy="104" rx="11" ry="6"/><ellipse cx="128" cy="90" rx="8" ry="5"/><ellipse cx="74" cy="122" rx="7" ry="4"/><ellipse cx="40" cy="94" rx="6" ry="4"/><circle cx="110" cy="112" r="3"/><circle cx="62" cy="104" r="2.4"/></g>` : '';
    const furStroke = 'rgba(140,60,10,.28)';
    return `<svg viewBox="0 0 170 135" class="sprite"${ns}>
      <g class="tail">
        <circle cx="130" cy="54" r="21" fill="${P.tail}"/>
        <circle cx="139" cy="44" r="14" fill="${P.tail2}"/><circle cx="123" cy="40" r="11" fill="${P.tail2}"/><circle cx="146" cy="56" r="9" fill="${P.tail}"/>
        <path d="M120 36 q8 -6 18 -2 M134 34 q10 0 14 10 M112 50 q2 -10 10 -14" stroke="${furStroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
      </g>
      <ellipse cx="104" cy="89" rx="51" ry="35" fill="${P.body}"/>
      <ellipse cx="104" cy="80" rx="41" ry="22" fill="${P.back}"/>
      <path d="M60 100 q44 26 94 -4 q-6 22 -46 26 q-38 0 -48 -22z" fill="rgba(120,50,10,.16)"/>
      <path d="M82 72 q6 -4 12 0 M104 68 q6 -4 12 0 M124 74 q5 -3 10 2 M92 90 q6 -3 12 1 M116 92 q6 -3 11 2" stroke="${furStroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <rect x="66" y="98" width="21" height="30" rx="9.5" fill="${P.legs}"/><rect x="122" y="98" width="21" height="30" rx="9.5" fill="${P.legs}"/>
      <path d="M80 100 v24 M136 100 v24" stroke="rgba(120,50,10,.15)" stroke-width="3"/>
      <ellipse cx="76.5" cy="128" rx="12.5" ry="6.5" fill="${P.paws}"/><ellipse cx="132.5" cy="128" rx="12.5" ry="6.5" fill="${P.paws}"/>
      <path d="M72 126 v4 M77 126 v4 M82 126 v4 M128 126 v4 M133 126 v4 M138 126 v4" stroke="rgba(120,50,10,.3)" stroke-width="1.4" stroke-linecap="round"/>
      ${mud}
      <path d="${MANE}" fill="${P.mane}"/>
      <path d="${MANE2}" fill="${P.tail}" opacity=".55"/>
      <g fill="${P.mane}"><circle cx="40" cy="100" r="15"/><circle cx="62" cy="102" r="15"/></g>
      <path d="M30 98 q6 8 14 8 M58 108 q8 2 14 -4" stroke="${furStroke}" stroke-width="2" fill="none" stroke-linecap="round"/>
      ${collarSvg(o.collar)}
      <circle cx="30" cy="38" r="10.5" fill="${P.ear}"/><circle cx="30" cy="38.5" r="6" fill="${P.earIn}"/>
      <circle cx="74" cy="38" r="10.5" fill="${P.ear}"/><circle cx="74" cy="38.5" r="6" fill="${P.earIn}"/>
      <circle cx="52" cy="67" r="31" fill="${P.face}"/>
      <ellipse cx="52" cy="54" rx="22" ry="12" fill="rgba(255,255,255,.12)"/>
      <ellipse cx="31" cy="78" rx="10" ry="12" fill="${P.muzzle}" opacity=".55"/><ellipse cx="73" cy="78" rx="10" ry="12" fill="${P.muzzle}" opacity=".55"/>
      <path d="M48 50 q4 -3 8 0 M50 46 q2 -1.6 4 0" stroke="${furStroke}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <ellipse cx="52" cy="81" rx="17.5" ry="12.5" fill="${P.muzzle}"/>
      <path d="M45.5 73 q6.5 -5.5 13 0 q0 5 -6.5 6.5 q-6.5 -1.5 -6.5 -6.5z" fill="#2a2130"/>
      <ellipse cx="50" cy="72.4" rx="2.4" ry="1.3" fill="#7a7184"/>
      <path d="M52 79.5 v3.5" stroke="#2a2130" stroke-width="1.8" stroke-linecap="round"/>
      <g fill="rgba(120,60,20,.35)"><circle cx="42" cy="82" r=".9"/><circle cx="44" cy="85" r=".9"/><circle cx="62" cy="82" r=".9"/><circle cx="60" cy="85" r=".9"/></g>
      ${eyes}
      <path d="M45 85 q3.5 3 7 0 q3.5 3 7 0" stroke="#2a2130" stroke-width="2" fill="none" stroke-linecap="round"/>
      ${tongue}
    </svg>`;
  }

  /* People: head-and-shoulders portraits for dialogue and full-body figures for the scenes.
     mood: happy | neutral | sad | surprised | angry | sleepy */
  const PEOPLE = {
    nena:    { skin: '#f8cfae', hair: '#7d3a1a', hair2: '#984f27', hl: '#c4743f', style: 'wavy', shirt: '#f4a3c0', collar: '#c9557d', freckles: true, pants: '#4f6d9a' },
    nasim:   { skin: '#f3c7a3', hair: '#7d4526', hair2: '#8f5430', style: 'ponytail', shirt: '#3d3a5c', collar: '#ef5f7f', pants: '#2f2b46', scale: 0.94, hoodie: true },
    negin:   { skin: '#f4cbab', hair: '#4a2414', hair2: '#5b2f1c', style: 'messy', shirt: '#9cc2d9', collar: '#6f9bb7', pants: '#9cc2d9', mask: true, scale: 0.86 },
    mohsen:  { skin: '#eebd96', hair: '#b9b4be', hair2: '#d3cfd7', style: 'gray', shirt: '#dfe9f3', collar: '#8fa9c4', pants: '#4f5566', belly: true, shirtDetails: true },
    fariba:  { skin: '#f0c19c', hair: '#6b3a20', hair2: '#c99a62', style: 'bob', shirt: '#b5476d', collar: '#8c2f52', pants: '#5a3d6b', apron: true, earrings: '#ffd36b' },
    mia:     { skin: '#8d5a3b', hair: '#1f1612', hair2: '#2c201a', style: 'puff', shirt: '#f2c230', collar: '#d99a00', earrings: '#ffd36b' },
    lee:     { skin: '#e9bf94', hair: '#1c1b22', hair2: '#2b2a33', style: 'short', shirt: '#ffffff', collar: '#cfd8e0', stetho: true, glasses: true },
    sam:     { skin: '#f0c7a0', hair: '#3a2a22', hair2: '#4a362c', style: 'side', shirt: '#4f6d9a', collar: '#3a5480', beard: true },
    pourya:  { skin: '#e6b68e', hair: '#16110e', hair2: '#2a201a', style: 'side', shirt: '#26232b', collar: '#c9a24a', pants: '#2b2b30', beard: true, apron: true },
    guest1:  { skin: '#f2c9a6', hair: '#2b1d16', hair2: '#3e2a20', style: 'bob', shirt: '#7aa6c2', collar: '#4f7f9c', pants: '#3a3550', earrings: '#ffd36b' },
    guest2:  { skin: '#dcae86', hair: '#1c1b22', hair2: '#2b2a33', style: 'short', shirt: '#6aa84f', collar: '#4d8044', pants: '#3a3a44', beard: true },
    guest3:  { skin: '#f4cdb0', hair: '#5a2a16', hair2: '#6e3820', style: 'ponytail', shirt: '#e98aab', collar: '#c9496f', pants: '#2f2b46' },
    guest4:  { skin: '#c99872', hair: '#241a14', hair2: '#33261e', style: 'side', shirt: '#e7b84a', collar: '#c9952a', pants: '#3a3550' },
  };

  function hairParts(c) {
    let back = '', front = '';
    if (c.style === 'curly') {
      back = `<g fill="${c.hair}"><circle cx="80" cy="66" r="50"/><circle cx="36" cy="92" r="24"/><circle cx="124" cy="92" r="24"/><circle cx="34" cy="122" r="18"/><circle cx="126" cy="122" r="18"/></g>`;
      front = `<path d="M44 66 C44 26 116 26 116 66 C106 48 92 44 80 52 C68 42 52 48 44 66Z" fill="${c.hair}"/><g fill="${c.hair2}"><circle cx="50" cy="44" r="12"/><circle cx="68" cy="32" r="13"/><circle cx="92" cy="32" r="13"/><circle cx="110" cy="44" r="12"/></g>`;
    } else if (c.style === 'wavy') {
      const T2 = 'translate(80 76) scale(1.25) translate(-60 -72)';
      back = `<g transform="${T2}">${NENA_HAIR_BACK}</g>`;
      front = `<g transform="${T2}">${NENA_HAIR_FRONT}</g>`;
    } else if (c.style === 'bob') {
      back = `<path d="M80 30 C44 30 33 58 36 88 C34 108 40 122 35 136 C50 144 62 138 66 128 L94 128 C98 138 110 144 125 136 C120 122 126 108 124 88 C127 58 116 30 80 30Z" fill="${c.hair}"/>`;
      front = `<path d="M43 78 C41 45 62 32 82 34 C103 36 119 52 117 80 C109 61 97 53 83 52 C71 61 56 65 43 78Z" fill="${c.hair}"/>
        <g fill="none" stroke="${c.hair2}" stroke-linecap="round" opacity=".75"><path d="M56 42 C50 58 55 74 48 90 C44 104 49 116 45 128" stroke-width="3.2"/><path d="M92 38 C102 52 97 68 107 84 C113 98 109 112 116 126" stroke-width="3.2"/><path d="M72 36 C67 46 70 56 63 68" stroke-width="2.6"/><path d="M104 48 C110 60 108 72 114 86" stroke-width="2.4"/></g>`;
    } else if (c.style === 'gray') {
      back = `<ellipse cx="80" cy="58" rx="41" ry="33" fill="${c.hair}"/><path d="M41 74 q-4 -18 4 -30 M119 74 q4 -18 -4 -30" stroke="${c.hair}" stroke-width="12" stroke-linecap="round" fill="none"/>`;
      front = `<path d="M42 72 Q40 33 80 30 Q120 33 118 72 Q113 52 99 47 Q86 54 70 49 Q55 49 46 61Z" fill="${c.hair2}"/>
        <g fill="none" stroke="${c.hair}" stroke-width="2" stroke-linecap="round" opacity=".8"><path d="M58 40 q8 -4 16 -2"/><path d="M84 38 q10 0 18 6"/><path d="M50 52 q6 -6 12 -6"/></g>`;
    } else if (c.style === 'puff') {
      back = `<g fill="${c.hair}"><circle cx="80" cy="30" r="30"/><circle cx="50" cy="52" r="22"/><circle cx="110" cy="52" r="22"/></g>`;
      front = `<path d="M46 66 q2 -34 34 -36 q32 2 34 36 q-10 -18 -34 -20 q-24 2 -34 20z" fill="${c.hair2}"/>`;
    } else if (c.style === 'ponytail') {
      back = `<ellipse cx="80" cy="58" rx="40" ry="34" fill="${c.hair}"/><path d="M104 30 q40 -6 34 40 q-4 30 -20 44 q8 -34 -14 -60z" fill="${c.hair}"/><circle cx="106" cy="34" r="7" fill="${c.collar}"/>`;
      front = `<path d="M43 68 q0 -40 38 -40 q36 0 38 38 q-14 -20 -40 -20 q-18 0 -36 22z" fill="${c.hair2}"/><path d="M52 50 q20 -14 44 -6" stroke="rgba(255,255,255,.18)" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    } else if (c.style === 'messy') {
      back = `<ellipse cx="80" cy="60" rx="44" ry="38" fill="${c.hair}"/><circle cx="80" cy="22" r="20" fill="${c.hair}"/><path d="M66 10 l-6 -8 M92 8 l6 -8 M80 4 v-8" stroke="${c.hair}" stroke-width="5" stroke-linecap="round"/>
        <path d="M38 80 q-8 30 4 50 M122 80 q8 30 -4 50" stroke="${c.hair}" stroke-width="12" stroke-linecap="round" fill="none"/>`;
      front = `<path d="M43 66 q2 -38 37 -38 q35 0 37 38 q-8 -10 -18 -14 q-6 10 -20 6 q-12 8 -24 -2 q-6 4 -12 10z" fill="${c.hair2}"/>
        ${c.mask ? '<path d="M44 48 q36 -14 72 0 v12 q-36 -12 -72 0z" fill="#ef8fb0"/><g fill="#fff"><circle cx="64" cy="50" r="2"/><circle cx="96" cy="50" r="2"/></g>' : ''}`;
    } else if (c.style === 'bun') {
      back = `<circle cx="80" cy="22" r="18" fill="${c.hair}"/><ellipse cx="80" cy="56" rx="42" ry="34" fill="${c.hair}"/>`;
      front = `<path d="M44 62 q4 -30 36 -32 q32 2 36 32 q-14 -16 -36 -16 q-22 0 -36 16z" fill="${c.hair}"/><path d="M84 30 q18 4 26 20" stroke="${c.hair2}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    } else if (c.style === 'bald') {
      back = `<path d="M42 70 q-4 -26 8 -34 M118 70 q4 -26 -8 -34" stroke="${c.hair}" stroke-width="14" stroke-linecap="round" fill="none"/>`;
      front = `<path d="M44 72 q-2 -16 6 -26 M116 72 q2 -16 -6 -26" stroke="${c.hair2}" stroke-width="9" stroke-linecap="round" fill="none"/><ellipse cx="76" cy="44" rx="14" ry="5" fill="rgba(255,255,255,.25)"/>`;
    } else if (c.style === 'short') {
      back = `<ellipse cx="80" cy="54" rx="40" ry="32" fill="${c.hair}"/>`;
      front = `<path d="M42 64 q0 -36 38 -36 q38 0 38 36 q-6 -14 -20 -16 q-10 10 -40 8 q-10 2 -16 8z" fill="${c.hair2}"/>`;
    } else {
      back = `<ellipse cx="80" cy="54" rx="38" ry="30" fill="${c.hair}"/>`;
      front = `<path d="M42 62 q2 -34 40 -34 q34 2 36 30 q-20 -16 -50 -12 q-14 4 -26 16z" fill="${c.hair2}"/>`;
    }
    return { back, front };
  }

  function face(c, mood) {
    const m = mood || 'happy';
    const eyes = m === 'happy'
      ? `<path d="M60 76 q6 -6 12 0" stroke="#2b1a14" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M88 76 q6 -6 12 0" stroke="#2b1a14" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : m === 'sleepy' ? `<path d="M59 78 q7 4 14 0" stroke="#2b1a14" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M87 78 q7 4 14 0" stroke="#2b1a14" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : `<ellipse cx="66" cy="76" rx="4.4" ry="${m === 'surprised' ? 6.5 : m === 'angry' ? 4.4 : 5.4}" fill="#2b1a14"/><ellipse cx="94" cy="76" rx="4.4" ry="${m === 'surprised' ? 6.5 : m === 'angry' ? 4.4 : 5.4}" fill="#2b1a14"/><circle cx="67.5" cy="74.5" r="1.6" fill="#fff"/><circle cx="95.5" cy="74.5" r="1.6" fill="#fff"/>`;
    const lashes = c.freckles && m !== 'happy' && m !== 'sleepy' ? '<path d="M59 70 q7 -6 14 0 M87 70 q7 -6 14 0" stroke="#2b1a14" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M59 71 l-4 -2 M101 71 l4 -2" stroke="#2b1a14" stroke-width="1.8" stroke-linecap="round"/>' : '';
    const bc = c.style === 'gray' ? '#8f8a96' : c.style === 'wavy' ? '#5a2c17' : c.hair;
    const brows = m === 'sad' ? `<path d="M58 64 l14 -4 M102 64 l-14 -4" stroke="${bc}" stroke-width="3" stroke-linecap="round"/>`
      : m === 'angry' ? `<path d="M57 62 l15 6 M103 62 l-15 6" stroke="${bc}" stroke-width="4" stroke-linecap="round"/>`
      : m === 'surprised' ? `<path d="M58 60 q8 -6 14 -2 M88 58 q6 -4 14 2" stroke="${bc}" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : `<path d="M58 64 q7 -4 14 0 M88 64 q7 -4 14 0" stroke="${bc}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    const mouth = m === 'sad' ? `<path d="M72 98 q8 -6 16 0" stroke="#9c4250" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : m === 'angry' ? `<path d="M71 100 q9 -8 18 0" stroke="#9c4250" stroke-width="3.4" fill="none" stroke-linecap="round"/>`
      : m === 'surprised' ? `<ellipse cx="80" cy="98" rx="5" ry="6" fill="#9c4250"/>`
      : m === 'sleepy' ? `<ellipse cx="80" cy="98" rx="4" ry="3" fill="#9c4250"/>`
      : m === 'neutral' ? `<path d="M73 97 h14" stroke="#9c4250" stroke-width="3" stroke-linecap="round"/>`
      : `<path d="M70 94 q10 10 20 0" stroke="#9c4250" stroke-width="3" fill="#fff" stroke-linecap="round"/>`;
    return `${brows}${eyes}${lashes}
      <ellipse cx="56" cy="90" rx="8" ry="5" fill="#f08aa0" opacity="${m === 'angry' ? 0.75 : 0.45}"/><ellipse cx="104" cy="90" rx="8" ry="5" fill="#f08aa0" opacity="${m === 'angry' ? 0.75 : 0.45}"/>
      ${c.freckles ? '<g fill="#c98b6a"><circle cx="54" cy="86" r="1.2"/><circle cx="59" cy="89" r="1.2"/><circle cx="101" cy="86" r="1.2"/><circle cx="106" cy="89" r="1.2"/></g>' : ''}
      ${c.glasses ? '<g fill="none" stroke="#5a4a6a" stroke-width="3"><circle cx="66" cy="76" r="11"/><circle cx="94" cy="76" r="11"/><path d="M77 76 h6"/></g>' : ''}
      ${c.mustache ? `<path d="M64 92 q8 -8 16 -2 q8 -6 16 2 q-8 6 -16 2 q-8 4 -16 -2z" fill="${c.hair}"/>` : ''}
      ${c.earrings ? `<circle cx="44" cy="94" r="4" fill="${c.earrings}"/><circle cx="116" cy="94" r="4" fill="${c.earrings}"/>` : ''}
      ${m === 'angry' ? '<path d="M118 40 l6 -6 M122 48 l8 -2 M114 34 l2 -8" stroke="#e04a4a" stroke-width="3" stroke-linecap="round"/>' : ''}
      ${m === 'sleepy' ? '<text x="116" y="40" font-family="Baloo 2, sans-serif" font-weight="800" font-size="18" fill="#7a7fb8">z</text>' : ''}
      ${mouth}`;
  }

  function headParts(who, mood) {
    const c = PEOPLE[who];
    const h = hairParts(c);
    const head = `<rect x="70" y="100" width="20" height="22" rx="8" fill="${c.skin}" style="filter:brightness(.93)"/>
      <ellipse cx="80" cy="76" rx="36" ry="40" fill="${c.skin}"/>
      ${c.beard ? `<path d="M46 84 q4 34 34 36 q30 -2 34 -36 q-8 16 -34 18 q-26 -2 -34 -18z" fill="${c.hair}"/>` : ''}
      ${h.front}${face(c, mood)}`;
    return { back: h.back, head };
  }

  function bust(who, mood) {
    const c = PEOPLE[who];
    if (!c) return '';
    const hp = headParts(who, mood);
    const shoulders = c.belly ? 'M8 170 q0 -54 72 -56 q72 2 72 56z' : (c.scale || 1) < 0.95 ? 'M28 170 q2 -44 52 -48 q50 4 52 48z' : 'M18 170 q2 -50 62 -54 q60 4 62 54z';
    return `<svg viewBox="0 0 160 170" class="portrait-svg" xmlns="http://www.w3.org/2000/svg">
      ${hp.back}
      <path d="${shoulders}" fill="${c.shirt}"/>
      ${c.hoodie ? '<path d="M50 126 q30 22 60 0" stroke="#ef5f7f" stroke-width="4" fill="none"/><path d="M70 132 v20 M90 132 v20" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' : ''}
      ${c.apron ? '<path d="M56 130 h48 v40 h-48z" fill="#fff8ee"/><path d="M56 130 q24 -16 48 0" stroke="#fff8ee" stroke-width="4" fill="none"/>' : ''}
      ${c.stetho ? '<path d="M60 124 q-6 30 20 34 q26 -4 20 -34" stroke="#3a3550" stroke-width="4" fill="none"/><circle cx="80" cy="158" r="6" fill="#9aa3b5"/>' : ''}
      ${c.shirtDetails ? '<path d="M66 116 l14 16 l14 -16 l-6 -4 l-8 9 l-8 -9z" fill="#ffffff"/><g fill="#8fa9c4"><circle cx="80" cy="142" r="2.6"/><circle cx="80" cy="158" r="2.6"/></g><rect x="98" y="136" width="16" height="14" rx="2" fill="none" stroke="#8fa9c4" stroke-width="2"/>' : ''}
      <path d="M64 118 l16 14 l16 -14" fill="none" stroke="${c.collar}" stroke-width="4" stroke-linecap="round"/>
      ${hp.head}
    </svg>`;
  }

  /* Full-body figure for scenes (same 120×210 frame as Nena). */
  function person(who, opts) {
    const c = PEOPLE[who];
    if (!c) return '';
    const o = Object.assign({ mood: 'happy' }, opts || {});
    const hp = headParts(who, o.mood);
    const SH2 = 'rgba(60,20,10,.14)';
    const torso = c.belly
      ? `<path d="M30 124 q0 -14 30 -14 q30 0 30 14 q8 22 0 40 q-6 10 -30 10 q-24 0 -30 -10 q-8 -18 0 -40z" fill="${c.shirt}"/><path d="M74 112 q16 6 16 16 q8 22 0 38 q-4 8 -12 8 q10 -30 -4 -62z" fill="${SH2}"/>
         <g fill="${c.collar}"><circle cx="60" cy="130" r="1.8"/><circle cx="60" cy="144" r="1.8"/></g>
         ${c.shirtDetails ? `<path d="M50 112 l10 11 l10 -11 l-4 -3 l-6 7 l-6 -7z" fill="#ffffff" stroke="${c.collar}" stroke-width="1"/><path d="M60 123 v34" stroke="${c.collar}" stroke-width="1"/><rect x="66" y="126" width="11" height="9" rx="1.5" fill="none" stroke="${c.collar}" stroke-width="1.4"/><rect x="31" y="158" width="58" height="7" rx="3" fill="#3a2a22"/><rect x="56" y="158" width="8" height="7" rx="1" fill="#c9a24a"/>` : ''}`
      : `<path d="M36 128 q0 -16 24 -16 q24 0 24 16 v30 q0 10 -24 10 q-24 0 -24 -10z" fill="${c.shirt}"/><path d="M70 114 q14 4 14 14 v28 q0 8 -10 10 q8 -20 -4 -52z" fill="${SH2}"/>`;
    const legs = `<rect x="${c.belly ? 38 : 40}" y="162" width="17" height="38" rx="7" fill="${c.pants}"/><rect x="${c.belly ? 65 : 63}" y="162" width="17" height="38" rx="7" fill="${c.pants}"/>
      ${c.shirtDetails ? `<path d="M46 168 v30 M73 168 v30" stroke="rgba(255,255,255,.2)" stroke-width="1.4"/>` : ''}
      <ellipse cx="47" cy="202" rx="11" ry="5" fill="${who === 'mohsen' || who === 'fariba' ? '#7a6a5e' : '#3a3550'}"/><ellipse cx="73" cy="202" rx="11" ry="5" fill="${who === 'mohsen' || who === 'fariba' ? '#7a6a5e' : '#3a3550'}"/>`;
    const armL = c.belly ? 'M30 122 q-14 8 -12 26 v10 q1 6 7 6 q7 0 7 -6 v-12 q0 -10 4 -16z' : 'M37 120 q-12 6 -12 22 v14 q0 6 6 6 q7 0 7 -6 v-12 q0 -10 5 -14z';
    const armR = c.belly ? 'M90 122 q14 8 12 26 v10 q-1 6 -7 6 q-7 0 -7 -6 v-12 q0 -10 -4 -16z' : 'M83 120 q12 6 12 22 v14 q0 6 -6 6 q-7 0 -7 -6 v-12 q0 -10 -5 -14z';
    const extras = (c.apron ? '<path d="M46 124 h28 v42 q-14 6 -28 0z" fill="#fff8ee"/><path d="M48 124 q12 -10 24 0" stroke="#fff8ee" stroke-width="2.6" fill="none"/><path d="M50 150 h20" stroke="#ef8fb0" stroke-width="3"/>' : '')
      + (c.hoodie ? '<path d="M44 118 q16 12 32 0" stroke="#ef5f7f" stroke-width="3" fill="none"/><rect x="48" y="146" width="24" height="10" rx="4" fill="rgba(0,0,0,.15)"/>' : '')
      + (c.mask ? '<g fill="#fff" opacity=".8"><circle cx="48" cy="140" r="1.6"/><circle cx="72" cy="150" r="1.6"/><circle cx="56" cy="160" r="1.4"/></g>' : '');
    const scale = c.scale || 1;
    return `<svg viewBox="0 0 120 210" class="sprite">
      <g transform="translate(${60 - 60 * scale} ${210 - 210 * scale}) scale(${scale})">
      <g transform="translate(60 72) scale(.82) translate(-80 -76)">${hp.back}</g>
      ${legs}${torso}${extras}
      <path d="${armL}" fill="${c.shirt}"/><path d="${armR}" fill="${c.shirt}"/>
      <circle cx="${c.belly ? 25 : 31}" cy="162" r="6.5" fill="${c.skin}"/><circle cx="${c.belly ? 95 : 89}" cy="162" r="6.5" fill="${c.skin}"/>
      <g transform="translate(60 72) scale(.82) translate(-80 -76)">${hp.head}</g>
      </g>
    </svg>`;
  }

  function portrait(who, mood) {
    if (who === 'simba') return simba({ eyes: mood === 'sad' ? 'closed' : 'open', tongue: mood === 'happy' ? true : false }).replace('class="sprite"', 'class="portrait-svg dog"');
    if (who === 'biscuit') return simba({ palette: 'shiba', eyes: 'open', tongue: true }).replace('class="sprite"', 'class="portrait-svg dog"');
    return bust(who, mood);
  }

  function toImage(svg) {
    const im = new Image();
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    return im;
  }

  return { nena, simba, portrait, person, toImage, OUTFITS, COLLARS };
})();
