/* Musique lo-fi et bruitages générés en direct avec la Web Audio API (aucun fichier audio). */
window.Sound = (function () {
  'use strict';
  let ctx = null, master, music, sfx, filter, noiseBuf;
  let enabled = true, musicOn = true, night = false;
  let nextBar = 0, bar = 0, timer = null;

  // Progression douce : Fmaj7 – Em7 – Dm7 – Cmaj7 (en Hz)
  const CHORDS = [
    [174.61, 220.0, 261.63, 329.63],
    [164.81, 196.0, 246.94, 293.66],
    [146.83, 174.61, 220.0, 261.63],
    [130.81, 164.81, 196.0, 246.94],
  ];
  const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { ctx = null; return; }
    master = ctx.createGain(); master.gain.value = enabled ? 0.9 : 0; master.connect(ctx.destination);
    filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 2400; filter.connect(master);
    music = ctx.createGain(); music.gain.value = musicOn ? 0.16 : 0; music.connect(filter);
    sfx = ctx.createGain(); sfx.gain.value = 0.5; sfx.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    nextBar = ctx.currentTime + 0.2;
    timer = setInterval(schedule, 250);
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

  function schedule() {
    if (!ctx || !musicOn) return;
    const barLen = night ? 3.2 : 2.6;
    while (nextBar < ctx.currentTime + 1.2) {
      const ch = CHORDS[bar % 4];
      const t = nextBar;
      ch.forEach((f, i) => note(f, t + i * 0.03, barLen * 0.98, { type: 'sine', vol: 0.09, attack: 0.4, out: music }));
      note(ch[0] / 2, t, barLen * 0.9, { type: 'sine', vol: 0.16, attack: 0.05, out: music });
      // petites notes de mélodie, clairsemées
      const steps = 8;
      for (let s = 0; s < steps; s++) {
        if (Math.random() < (night ? 0.18 : 0.32)) {
          const f = SCALE[Math.floor(Math.random() * SCALE.length)] / (night ? 2 : 1);
          note(f, t + (s * barLen) / steps, 0.5, { type: 'triangle', vol: 0.05, attack: 0.01, out: music });
        }
      }
      // "vinyle" léger sur le temps
      noise(t, 0.04, 3000, 1, 0.01);
      nextBar += barLen; bar++;
    }
  }

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
    yawn() { const t = ctx.currentTime; note(420, t, 0.9, { type: 'sine', vol: 0.08, slide: 0.55, attack: 0.2 }); },
  };

  function play(name) {
    if (!ctx || !enabled || !fx[name]) return;
    try { fx[name](); } catch (e) { /* audio indisponible */ }
  }
  function setEnabled(v) { enabled = v; if (master) master.gain.setTargetAtTime(v ? 0.9 : 0, ctx.currentTime, 0.05); }
  function setMusic(v) { musicOn = v; if (music) music.gain.setTargetAtTime(v ? 0.16 : 0, ctx.currentTime, 0.3); }
  function setNight(v) {
    if (v === night) return;
    night = v;
    if (filter) filter.frequency.setTargetAtTime(v ? 900 : 2400, ctx.currentTime, 2);
  }
  return { init, play, setEnabled, setMusic, setNight, get enabled() { return enabled; }, get musicOn() { return musicOn; } };
})();
