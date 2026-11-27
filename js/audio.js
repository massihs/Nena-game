/* Lo-fi music and sound effects generated live with the Web Audio API (no audio files). */
window.Sound = (function () {
  'use strict';
  let ctx = null, master, music, sfx, filter, noiseBuf;
  let enabled = true, musicOn = true, night = false;
  let timer = null;

  /* ---- Soundtrack: composed loops per place, 16th-note sequencer ---- */
  const N = (semi) => 261.63 * Math.pow(2, semi / 12);       // semitones from C4
  // scales (semitones) and tracks; melody digits = scale degree (1-7, 8-9 = octave up), '.' rest, '-' hold
  const TRACKS = {
    menu: { bpm: 88, key: 2, scale: [0, 2, 3, 5, 7, 9, 10], pluck: 'tri',  // D dorian, warm lo-fi
      chords: [[0, [0, 3, 7, 10]], [5, [0, 4, 7, 10]], [-2, [0, 4, 7, 11]], [3, [0, 4, 7, 11]]],
      mel: '5...4.3.1...----3.4.5.7.5...----8...7.5.4...3.4.5.....3.2.1...----',
      kick: 'x.......x.x.....', snare: '....x.......x...', hat: '..x...x...x...x.' },
    home: { bpm: 100, key: 2, scale: [0, 1, 4, 5, 7, 8, 10], pluck: 'santur',  // D hijaz-flavoured, cosy
      chords: [[0, [0, 4, 7]], [-2, [0, 4, 7]], [-4, [0, 4, 7]], [0, [0, 4, 7, 10]]],
      mel: '1.2.3...2.1.----3.4.5.6.5.4.3...5.6.8...6.5.4.5-3.4.3.2.1.......',
      kick: 'x.....x...x.....', snare: '....x.......x..x', hat: 'x.x.x.x.x.x.x.x.' },
    street: { bpm: 116, key: 0, scale: [0, 2, 4, 5, 7, 9, 11], pluck: 'lead',  // C major, bouncy
      chords: [[0, [0, 4, 7]], [7, [0, 4, 7]], [9, [0, 3, 7]], [5, [0, 4, 7]]],
      mel: '5.5.6.5.3...1.2.3.3.4.3.2...5.6.7.7.8.7.5...6.5.4.3.2.3.1.......',
      kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.' },
    zen: { bpm: 60, key: 2, scale: [0, 2, 4, 7, 9, 12, 14], pluck: 'koto',  // pentatonic, very calm
      chords: [[0, [0, 7, 12, 16]], [-3, [0, 7, 12, 15]], [5, [0, 7, 12, 16]], [-5, [0, 7, 12, 14]]],
      mel: '5.......3.......6.......2.......5.......8.......7.......3.......',
      kick: '................', snare: '................', hat: '................' },
    clap: { bpm: 82, key: 2, scale: [0, 2, 3, 7, 8, 12, 14], pluck: 'koto',  // D in-scale, lounge
      chords: [[0, [0, 3, 7, 10]], [-4, [0, 4, 7, 11]], [-2, [0, 4, 7, 9]], [-5, [0, 3, 7, 10]]],
      mel: '1...3.4.5-----4.3.1...----5...6.5.4.3.1...----3.4.5.6.7-----6.5.',
      kick: 'x.......x.......', snare: '........x.......', hat: '..x...x...x.x.x.' },
  };
  let track = TRACKS.menu, pendingTrack = null, step = 0, nextStep = 0, intensity = 0;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { ctx = null; return; }
    master = ctx.createGain(); master.gain.value = enabled ? 0.9 : 0; master.connect(ctx.destination);
    filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 2400; filter.connect(master);
    music = ctx.createGain(); music.gain.value = musicOn ? 0.5 : 0; music.connect(filter);
    sfx = ctx.createGain(); sfx.gain.value = 0.5; sfx.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    nextStep = ctx.currentTime + 0.2;
    timer = setInterval(schedule, 100);
  }

  function note(freq, t, dur, opt) {
    const o = Object.assign({ type: 'triangle', vol: 0.2, attack: 0.02, out: sfx, slide: 0 }, opt || {});
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type;
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * o.slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol, t + o.attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(o.out);
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  function noise(t, dur, freq, q, vol) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(sfx);
    src.start(t); src.stop(t + dur + 0.05);
  }

  function kick(t, v) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(g); g.connect(music); o.start(t); o.stop(t + 0.25); }
  function drum(t, freq, q, dur, v) { const src = ctx.createBufferSource(); src.buffer = noiseBuf; const bp = ctx.createBiquadFilter(); bp.type = freq > 5000 ? 'highpass' : 'bandpass'; bp.frequency.value = freq; bp.Q.value = q; const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); src.connect(bp); bp.connect(g); g.connect(music); src.start(t); src.stop(t + dur + 0.02); }
  function pluck(kind, f, t, sp) {
    if (kind === 'lead') { note(f, t, sp * 1.8, { type: 'square', vol: 0.035, attack: 0.01, out: music }); note(f * 2, t, sp, { type: 'sine', vol: 0.02, attack: 0.01, out: music }); return; }
    const dur = kind === 'koto' ? 0.9 : kind === 'santur' ? 0.55 : 0.7;
    note(f, t, dur, { type: 'triangle', vol: 0.075, attack: 0.004, out: music });
    note(f * 2, t, dur * 0.5, { type: 'sine', vol: kind === 'koto' ? 0.035 : 0.025, attack: 0.004, out: music });
    if (kind === 'koto') note(f * 1.004, t + 0.012, dur * 0.7, { type: 'sine', vol: 0.02, attack: 0.004, out: music });
    note(f, t + sp * 3, dur * 0.6, { type: 'triangle', vol: 0.025, attack: 0.004, out: music });   // echo
  }
  function schedule() {
    if (!ctx || !musicOn) return;
    while (nextStep < ctx.currentTime + 0.4) {
      const T = track, sp = 60 / T.bpm / 4, t = nextStep, s16 = step % 16, barN = Math.floor(step / 16);
      if (s16 === 0 && pendingTrack) { track = pendingTrack; pendingTrack = null; step = 0; continue; }
      const [root, chord] = T.chords[barN % T.chords.length];
      const base = T.key + root;
      if (s16 === 0) chord.forEach((iv, i) => note(N(base + iv - 12), t + i * 0.02, sp * 15.5, { type: 'sine', vol: 0.045, attack: 0.25, out: music }));
      if (s16 === 0 || s16 === 8 || (T.bpm > 105 && (s16 === 6 || s16 === 14))) note(N(base - 24), t, sp * 6, { type: 'triangle', vol: 0.14, attack: 0.01, out: music });
      if (intensity && s16 % 4 === 2) note(N(base - 12), t, sp * 1.5, { type: 'triangle', vol: 0.07, attack: 0.01, out: music });
      if (T.kick[s16] === 'x') kick(t, 0.32);
      if (T.snare[s16] === 'x') drum(t, 1800, 0.8, 0.12, 0.09);
      if (T.hat[s16] === 'x' || (intensity && s16 % 2 === 1)) drum(t, 8000, 0.7, 0.035, intensity ? 0.05 : 0.035);
      const mi = step % T.mel.length, ch = T.mel[mi];
      if (ch >= '1' && ch <= '9') {
        const d = +ch - 1, oct = Math.floor(d / 7), deg = T.scale[d % 7] + 12 * oct;
        const loopUp = Math.floor(step / T.mel.length) % 4 === 3 ? 12 : 0;      // every 4th loop, an octave higher
        pluck(T.pluck, N(T.key + deg + loopUp), t, sp);
      }
      nextStep += sp; step++;
    }
  }
  function setTrack(name) { const T = TRACKS[name]; if (!T || T === track || T === pendingTrack) return; if (!ctx) { track = T; return; } pendingTrack = T; }
  function setIntensity(v) { intensity = v ? 1 : 0; }

  const fx = {
    click() { const t = ctx.currentTime; note(880, t, 0.06, { type: 'sine', vol: 0.12 }); },
    tab() { const t = ctx.currentTime; note(660, t, 0.08, { type: 'sine', vol: 0.1 }); note(990, t + 0.04, 0.08, { type: 'sine', vol: 0.06 }); },
    success() { const t = ctx.currentTime; [523, 659, 784, 1047].forEach((f, i) => note(f, t + i * 0.08, 0.35, { vol: 0.14 })); },
    fanfare() { const t = ctx.currentTime; [523, 659, 784, 659, 784, 1047].forEach((f, i) => note(f, t + i * 0.11, 0.4, { type: 'square', vol: 0.06 })); },
    coin() { const t = ctx.currentTime; note(988, t, 0.08, { type: 'square', vol: 0.07 }); note(1319, t + 0.08, 0.25, { type: 'square', vol: 0.07 }); },
    fail() { const t = ctx.currentTime; note(330, t, 0.25, { type: 'sawtooth', vol: 0.06, slide: 0.6 }); note(247, t + 0.2, 0.35, { type: 'sawtooth', vol: 0.06, slide: 0.6 }); },
    pop() { const t = ctx.currentTime; note(500 + Math.random() * 400, t, 0.09, { type: 'sine', vol: 0.18, slide: 2.2 }); },
    bark() {
      const t = ctx.currentTime;
      [0, 0.22].forEach((d) => {
        note(380, t + d, 0.14, { type: 'sawtooth', vol: 0.12, slide: 0.45, attack: 0.005 });
        noise(t + d, 0.1, 900, 2, 0.25);
      });
    },
    happy() { const t = ctx.currentTime; note(700, t, 0.12, { type: 'sine', vol: 0.12, slide: 1.4 }); note(900, t + 0.1, 0.16, { type: 'sine', vol: 0.1, slide: 1.3 }); },
    water() { const t = ctx.currentTime; noise(t, 0.9, 1800, 0.8, 0.18); for (let i = 0; i < 5; i++) note(600 + Math.random() * 700, t + i * 0.12, 0.08, { type: 'sine', vol: 0.06, slide: 1.8 }); },
    brush() { const t = ctx.currentTime; noise(t, 0.12, 4200, 3, 0.12); },
    swoosh() { const t = ctx.currentTime; noise(t, 0.3, 1200, 0.7, 0.16); },
    splash() { const t = ctx.currentTime; noise(t, 0.4, 600, 0.9, 0.3); },
    talk(pitch) { const t = ctx.currentTime; note((pitch || 520) * (0.9 + Math.random() * 0.25), t, 0.05, { type: 'triangle', vol: 0.05 }); },
    tone(i) { const t = ctx.currentTime, f = [392, 494, 587, 784][i || 0]; note(f, t, 0.38, { type: 'triangle', vol: 0.13 }); note(f * 2, t, 0.22, { type: 'sine', vol: 0.04 }); },
    bell() { const t = ctx.currentTime; note(528, t, 3.2, { type: 'sine', vol: 0.12, attack: 0.005 }); note(1056, t, 2.2, { type: 'sine', vol: 0.04, attack: 0.005 }); note(1584, t, 1.2, { type: 'sine', vol: 0.02, attack: 0.005 }); },
    chime() { const t = ctx.currentTime; [1047, 1319, 1568].forEach((f, i) => note(f, t + i * 0.05, 0.5, { type: 'sine', vol: 0.07 })); },
    star(i) { const t = ctx.currentTime, f = [784, 988, 1175][i || 0]; note(f, t, 0.5, { type: 'triangle', vol: 0.12 }); note(f * 1.5, t + 0.06, 0.4, { type: 'sine', vol: 0.06 }); },
    win() { const t = ctx.currentTime; [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => note(f, t + i * 0.12, i === 6 ? 0.9 : 0.3, { type: 'triangle', vol: 0.11 })); },
    lose() { const t = ctx.currentTime; [523, 494, 466, 440].forEach((f, i) => note(f, t + i * 0.22, 0.4, { type: 'triangle', vol: 0.09, slide: i === 3 ? 0.9 : 1 })); },
    combo(n) { const t = ctx.currentTime, f = [523, 587, 659, 784, 880, 1047, 1175, 1319][Math.max(0, Math.min(7, (n || 1) - 1))]; note(f, t, 0.24, { type: 'triangle', vol: 0.13 }); note(f * 1.5, t + 0.05, 0.2, { type: 'sine', vol: 0.06 }); note(f * 2, t + 0.1, 0.28, { type: 'sine', vol: 0.045 }); },
    tick() { const t = ctx.currentTime; note(1600, t, 0.04, { type: 'square', vol: 0.05 }); },
    yawn() { const t = ctx.currentTime; note(420, t, 0.9, { type: 'sine', vol: 0.08, slide: 0.55, attack: 0.2 }); },
  };

  function play(name, arg) {
    if (!ctx || !enabled || !fx[name]) return;
    try { fx[name](arg); } catch (e) { /* audio unavailable */ }
  }
  function setEnabled(v) { enabled = v; if (master) master.gain.setTargetAtTime(v ? 0.9 : 0, ctx.currentTime, 0.05); }
  function setMusic(v) { musicOn = v; if (music) music.gain.setTargetAtTime(v ? 0.5 : 0, ctx.currentTime, 0.3); }
  function setNight(v) {
    if (v === night) return;
    night = v;
    if (filter) filter.frequency.setTargetAtTime(v ? 900 : 2400, ctx.currentTime, 2);
  }
  return { init, play, setEnabled, setMusic, setNight, setTrack, setIntensity, get enabled() { return enabled; }, get musicOn() { return musicOn; } };
})();
