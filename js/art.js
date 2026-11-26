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

  /* eyes: 'both' (CSS decides), 'open', 'closed' */
  function nena(opts) {
    const o = Object.assign({ dressed: false, outfit: 'basique', eyes: 'both', standalone: false }, opts || {});
    const c = OUTFITS[o.outfit] || OUTFITS.basique;
    const arm = o.dressed ? c.top : '#f19bb8';
    const ns = o.standalone ? ' xmlns="http://www.w3.org/2000/svg" width="240" height="420"' : '';
    const dress = o.outfit === 'robe';
    const eyesOpen = `<g class="eyes-open">
        <ellipse cx="46" cy="74" rx="4.2" ry="5.2" fill="#3b2016"/><ellipse cx="74" cy="74" rx="4.2" ry="5.2" fill="#3b2016"/>
        <circle cx="47.5" cy="72" r="1.5" fill="#fff"/><circle cx="75.5" cy="72" r="1.5" fill="#fff"/></g>`;
    const eyesClosed = `<g class="eyes-closed">
        <path d="M40 75 q6 5 12 0" stroke="#3b2016" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path d="M68 75 q6 5 12 0" stroke="#3b2016" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>`;
    const eyes = o.eyes === 'open' ? eyesOpen : o.eyes === 'closed' ? eyesClosed : eyesOpen + eyesClosed;
    const body = o.dressed
      ? (dress
        ? `<path d="M36 116 q24 -8 48 0 l10 62 q-34 10 -68 0z" fill="${c.top}"/>
           <path d="M30 168 q30 8 60 0" stroke="${c.stripe}" stroke-width="5" fill="none"/>
           <rect x="42" y="172" width="13" height="28" rx="6" fill="#f4c4a1"/><rect x="65" y="172" width="13" height="28" rx="6" fill="#f4c4a1"/>`
        : `<rect x="34" y="112" width="52" height="58" rx="20" fill="${c.top}"/>
           <path d="M40 130 h40" stroke="${c.stripe}" stroke-width="5"/><path d="M40 142 h40" stroke="${c.stripe}" stroke-width="5"/>
           <rect x="38" y="160" width="18" height="40" rx="7" fill="${c.bottom}"/><rect x="64" y="160" width="18" height="40" rx="7" fill="${c.bottom}"/>
           <rect x="36" y="158" width="48" height="12" rx="5" fill="${c.bottom}"/>
           ${o.outfit === 'cire' ? `<path d="M34 120 q26 -14 52 0" stroke="${c.stripe}" stroke-width="4" fill="none"/><circle cx="60" cy="134" r="2.5" fill="${c.stripe}"/><circle cx="60" cy="148" r="2.5" fill="${c.stripe}"/>` : ''}`)
      : `<rect x="34" y="112" width="52" height="62" rx="20" fill="#f19bb8"/>
         <rect x="38" y="166" width="18" height="34" rx="8" fill="#e98aab"/><rect x="64" y="166" width="18" height="34" rx="8" fill="#e98aab"/>
         <path d="M50 114 L60 128 L70 114" fill="none" stroke="#b5476d" stroke-width="2.5" stroke-linecap="round"/>
         <circle cx="60" cy="140" r="2.2" fill="#b5476d"/><circle cx="60" cy="152" r="2.2" fill="#b5476d"/>
         <g fill="#fff" opacity=".7"><circle cx="44" cy="130" r="1.6"/><circle cx="76" cy="146" r="1.6"/><circle cx="48" cy="160" r="1.6"/></g>`;
    return `<svg viewBox="0 0 120 210" class="sprite"${ns}>
      <g fill="#7a3f22"><circle cx="60" cy="52" r="40"/><circle cx="26" cy="70" r="20"/><circle cx="94" cy="70" r="20"/></g>
      <g fill="#6b351c"><circle cx="22" cy="96" r="16"/><circle cx="98" cy="96" r="16"/><circle cx="30" cy="116" r="12"/><circle cx="90" cy="116" r="12"/></g>
      ${body}
      <ellipse cx="47" cy="202" rx="11" ry="5" fill="#5a3426"/><ellipse cx="73" cy="202" rx="11" ry="5" fill="#5a3426"/>
      <g class="arms"><rect class="arm-l" x="22" y="118" width="15" height="42" rx="7.5" fill="${arm}"/>
        <rect class="arm-r" x="83" y="118" width="15" height="42" rx="7.5" fill="${arm}"/>
        <circle cx="29.5" cy="160" r="7" fill="#f4c4a1"/><circle cx="90.5" cy="160" r="7" fill="#f4c4a1"/></g>
      <rect x="53" y="96" width="14" height="18" rx="6" fill="#efb995"/>
      <ellipse cx="60" cy="72" rx="30" ry="32" fill="#f6caa7"/>
      <path d="M30 66 C30 34 90 34 90 66 C82 50 70 46 60 52 C50 44 36 50 30 66Z" fill="#7a3f22"/>
      <g fill="#8a4a28"><circle cx="34" cy="50" r="10"/><circle cx="50" cy="38" r="11"/><circle cx="70" cy="38" r="11"/><circle cx="86" cy="50" r="10"/></g>
      <path d="M40 63 q6 -4 12 0" stroke="#5a2e18" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M68 63 q6 -4 12 0" stroke="#5a2e18" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      ${eyes}
      <ellipse cx="38" cy="86" rx="7" ry="4.5" fill="#f19bb0" opacity=".7"/><ellipse cx="82" cy="86" rx="7" ry="4.5" fill="#f19bb0" opacity=".7"/>
      <g fill="#c98b6a"><circle cx="36" cy="82" r="1"/><circle cx="40" cy="84" r="1"/><circle cx="80" cy="82" r="1"/><circle cx="84" cy="84" r="1"/></g>
      <path class="mouth" d="M53 90 q7 6 14 0" stroke="#b4535f" stroke-width="2.6" fill="none" stroke-linecap="round"/>
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
  function simba(opts) {
    const o = Object.assign({ collar: null, muddy: false, eyes: 'both', tongue: 'css', standalone: false, palette: 'chow' }, opts || {});
    const P = PALETTES[o.palette] || PALETTES.chow;
    const ns = o.standalone ? ' xmlns="http://www.w3.org/2000/svg" width="340" height="270"' : '';
    const open = `<g class="dog-eyes-open">
        <path d="M36 62 q5 -3 10 0" stroke="#2e2730" stroke-width="3.2" fill="none" stroke-linecap="round"/>
        <path d="M58 62 q5 -3 10 0" stroke="#2e2730" stroke-width="3.2" fill="none" stroke-linecap="round"/></g>`;
    const closed = `<g class="dog-eyes-closed">
        <path d="M36 61 q5 4 10 0" stroke="#2e2730" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M58 61 q5 4 10 0" stroke="#2e2730" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
    const eyes = o.eyes === 'open' ? open : o.eyes === 'closed' ? closed : open + closed;
    const tongue = o.tongue === false ? '' : `<path class="tongue" d="M48 86 q4 12 8 0Z" fill="${o.palette === 'shiba' ? '#e9677f' : '#3c3a6b'}"/>`;
    const mud = o.muddy ? `<g fill="#7a5a3a" opacity=".85"><ellipse cx="96" cy="104" rx="10" ry="6"/><ellipse cx="128" cy="90" rx="8" ry="5"/><ellipse cx="74" cy="122" rx="7" ry="4"/><ellipse cx="40" cy="92" rx="6" ry="4"/></g>` : '';
    return `<svg viewBox="0 0 170 135" class="sprite"${ns}>
      <g class="tail"><circle cx="128" cy="52" r="20" fill="${P.tail}"/><circle cx="136" cy="44" r="13" fill="${P.tail2}"/><circle cx="122" cy="40" r="10" fill="${P.tail2}"/></g>
      <ellipse cx="104" cy="88" rx="50" ry="34" fill="${P.body}"/><ellipse cx="104" cy="80" rx="40" ry="22" fill="${P.back}"/>
      <rect x="66" y="98" width="20" height="30" rx="9" fill="${P.legs}"/><rect x="122" y="98" width="20" height="30" rx="9" fill="${P.legs}"/>
      <ellipse cx="76" cy="128" rx="12" ry="6" fill="${P.paws}"/><ellipse cx="132" cy="128" rx="12" ry="6" fill="${P.paws}"/>
      ${mud}
      <g fill="${P.mane}"><circle cx="56" cy="34" r="16"/><circle cx="36" cy="40" r="15"/><circle cx="24" cy="58" r="15"/>
        <circle cx="26" cy="80" r="15"/><circle cx="42" cy="96" r="16"/><circle cx="64" cy="98" r="16"/>
        <circle cx="80" cy="84" r="16"/><circle cx="82" cy="60" r="16"/><circle cx="74" cy="40" r="15"/></g>
      ${collarSvg(o.collar)}
      <circle cx="52" cy="66" r="31" fill="${P.face}"/>
      <circle cx="30" cy="38" r="10" fill="${P.ear}"/><circle cx="30" cy="38" r="5.5" fill="${P.earIn}"/>
      <circle cx="74" cy="38" r="10" fill="${P.ear}"/><circle cx="74" cy="38" r="5.5" fill="${P.earIn}"/>
      <ellipse cx="52" cy="80" rx="17" ry="12" fill="${P.muzzle}"/><ellipse cx="52" cy="73" rx="7" ry="5" fill="#2e2730"/>
      <ellipse cx="50" cy="71.5" rx="2.2" ry="1.3" fill="#6b6170"/>
      ${eyes}
      <path d="M46 84 q6 4 12 0" stroke="#2e2730" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      ${tongue}
    </svg>`;
  }


  /* Head-and-shoulders portraits for dialogue. mood: happy | neutral | sad | surprised */
  const PEOPLE = {
    nena:    { skin: '#f6caa7', hair: '#7a3f22', hair2: '#8a4a28', style: 'curly', shirt: '#f19bb8', collar: '#b5476d', freckles: true },
    mia:     { skin: '#8d5a3b', hair: '#1f1612', hair2: '#2c201a', style: 'puff', shirt: '#f2c230', collar: '#d99a00', earrings: '#ffd36b' },
    grandma: { skin: '#f3d1b8', hair: '#d9d6df', hair2: '#c3bfcc', style: 'bun', shirt: '#8c6bb1', collar: '#6c4f92', glasses: true },
    lee:     { skin: '#e9bf94', hair: '#1c1b22', hair2: '#2b2a33', style: 'short', shirt: '#ffffff', collar: '#cfd8e0', stetho: true },
    sam:     { skin: '#f0c7a0', hair: '#b4562a', hair2: '#c66a3a', style: 'side', shirt: '#4f6d9a', collar: '#3a5480', beard: true },
  };
  function bust(who, mood) {
    const c = PEOPLE[who];
    if (!c) return '';
    let back = '', front = '';
    if (c.style === 'curly') {
      back = `<g fill="${c.hair}"><circle cx="80" cy="66" r="50"/><circle cx="36" cy="92" r="24"/><circle cx="124" cy="92" r="24"/><circle cx="34" cy="122" r="18"/><circle cx="126" cy="122" r="18"/></g>`;
      front = `<path d="M44 66 C44 26 116 26 116 66 C106 48 92 44 80 52 C68 42 52 48 44 66Z" fill="${c.hair}"/><g fill="${c.hair2}"><circle cx="50" cy="44" r="12"/><circle cx="68" cy="32" r="13"/><circle cx="92" cy="32" r="13"/><circle cx="110" cy="44" r="12"/></g>`;
    } else if (c.style === 'puff') {
      back = `<g fill="${c.hair}"><circle cx="80" cy="30" r="30"/><circle cx="50" cy="52" r="22"/><circle cx="110" cy="52" r="22"/></g>`;
      front = `<path d="M46 66 q2 -34 34 -36 q32 2 34 36 q-10 -18 -34 -20 q-24 2 -34 20z" fill="${c.hair2}"/>`;
    } else if (c.style === 'bun') {
      back = `<circle cx="80" cy="22" r="18" fill="${c.hair}"/><ellipse cx="80" cy="56" rx="42" ry="34" fill="${c.hair}"/>`;
      front = `<path d="M44 62 q4 -30 36 -32 q32 2 36 32 q-14 -16 -36 -16 q-22 0 -36 16z" fill="${c.hair2}"/>`;
    } else if (c.style === 'short') {
      back = `<ellipse cx="80" cy="54" rx="40" ry="32" fill="${c.hair}"/>`;
      front = `<path d="M42 64 q0 -36 38 -36 q38 0 38 36 q-6 -14 -20 -16 q-10 10 -40 8 q-10 2 -16 8z" fill="${c.hair2}"/>`;
    } else {
      back = `<ellipse cx="80" cy="54" rx="38" ry="30" fill="${c.hair}"/>`;
      front = `<path d="M42 62 q2 -34 40 -34 q34 2 36 30 q-20 -16 -50 -12 q-14 4 -26 16z" fill="${c.hair2}"/>`;
    }
    const m = mood || 'happy';
    const eyes = m === 'happy'
      ? `<path d="M60 76 q6 -6 12 0" stroke="#2b1a14" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M88 76 q6 -6 12 0" stroke="#2b1a14" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : `<ellipse cx="66" cy="76" rx="4.4" ry="${m === 'surprised' ? 6.5 : 5.4}" fill="#2b1a14"/><ellipse cx="94" cy="76" rx="4.4" ry="${m === 'surprised' ? 6.5 : 5.4}" fill="#2b1a14"/><circle cx="67.5" cy="74" r="1.6" fill="#fff"/><circle cx="95.5" cy="74" r="1.6" fill="#fff"/>`;
    const brows = m === 'sad'
      ? `<path d="M58 64 l14 -4 M102 64 l-14 -4" stroke="${c.hair}" stroke-width="3" stroke-linecap="round"/>`
      : m === 'surprised' ? `<path d="M58 60 q8 -6 14 -2 M88 58 q6 -4 14 2" stroke="${c.hair}" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : `<path d="M58 64 q7 -4 14 0 M88 64 q7 -4 14 0" stroke="${c.hair}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    const mouth = m === 'sad' ? `<path d="M72 98 q8 -6 16 0" stroke="#9c4250" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : m === 'surprised' ? `<ellipse cx="80" cy="98" rx="5" ry="6" fill="#9c4250"/>`
      : m === 'neutral' ? `<path d="M73 97 h14" stroke="#9c4250" stroke-width="3" stroke-linecap="round"/>`
      : `<path d="M70 94 q10 10 20 0" stroke="#9c4250" stroke-width="3" fill="#fff" stroke-linecap="round"/>`;
    return `<svg viewBox="0 0 160 170" class="portrait-svg" xmlns="http://www.w3.org/2000/svg">
      ${back}
      <path d="M18 170 q2 -50 62 -54 q60 4 62 54z" fill="${c.shirt}"/>
      ${c.stetho ? '<path d="M60 124 q-6 30 20 34 q26 -4 20 -34" stroke="#3a3550" stroke-width="4" fill="none"/><circle cx="80" cy="158" r="6" fill="#9aa3b5"/>' : ''}
      ${who === 'grandma' ? '<g fill="#fff"><circle cx="80" cy="140" r="3"/><circle cx="80" cy="156" r="3"/></g>' : ''}
      <path d="M64 118 l16 14 l16 -14" fill="none" stroke="${c.collar}" stroke-width="4" stroke-linecap="round"/>
      <rect x="70" y="100" width="20" height="22" rx="8" fill="${c.skin}" style="filter:brightness(.93)"/>
      <ellipse cx="80" cy="76" rx="36" ry="40" fill="${c.skin}"/>
      ${c.beard ? `<path d="M46 84 q4 34 34 36 q30 -2 34 -36 q-8 16 -34 18 q-26 -2 -34 -18z" fill="${c.hair}"/>` : ''}
      ${front}
      ${brows}${eyes}
      <ellipse cx="56" cy="90" rx="8" ry="5" fill="#f08aa0" opacity=".45"/><ellipse cx="104" cy="90" rx="8" ry="5" fill="#f08aa0" opacity=".45"/>
      ${c.freckles ? '<g fill="#c98b6a"><circle cx="54" cy="86" r="1.2"/><circle cx="59" cy="89" r="1.2"/><circle cx="101" cy="86" r="1.2"/><circle cx="106" cy="89" r="1.2"/></g>' : ''}
      ${c.glasses ? '<g fill="none" stroke="#5a4a6a" stroke-width="3"><circle cx="66" cy="76" r="11"/><circle cx="94" cy="76" r="11"/><path d="M77 76 h6"/></g>' : ''}
      ${c.earrings ? `<circle cx="44" cy="94" r="4" fill="${c.earrings}"/><circle cx="116" cy="94" r="4" fill="${c.earrings}"/>` : ''}
      ${mouth}
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

  return { nena, simba, portrait, toImage, OUTFITS, COLLARS };
})();
