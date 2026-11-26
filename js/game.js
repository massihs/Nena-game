/* Nena & Simba — a cozy mobile life sim.
   Nena takes care of herself, the home and Simba, her chow chow. */
(function () {
  'use strict';

  const SAVE_KEY = 'nena-simba-save-v2';
  const DAY_START = 7 * 60;
  const BEDTIME_OK = 20 * 60;
  const COLLAPSE_AT = 25 * 60;

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
  const rnd = Math.random;
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const snd = (n, arg) => window.Sound && window.Sound.play(n, arg);
  const buzz = (p) => { try { if (S && S.settings.haptics && navigator.vibrate) navigator.vibrate(p); } catch (e) { /* */ } };

  /* ------------------------------------------------------------------ */
  /* Data                                                                */
  /* ------------------------------------------------------------------ */
  const WEEKDAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const weekday = (d) => WEEKDAYS[(d - 1) % 7];
  const isWeekend = (d) => (d - 1) % 7 >= 5;

  const WEATHER = {
    soleil: { label: 'Sunny', icon: '☀️', w: 0.36, tip: 'Chow chows dislike the heat: Simba drinks more.' },
    nuages: { label: 'Cloudy', icon: '⛅', w: 0.28, tip: 'Perfect weather for a long walk.' },
    pluie:  { label: 'Rain', icon: '🌧️', w: 0.24, tip: 'Watch out for puddles! A raincoat keeps Nena dry.' },
    neige:  { label: 'Snow', icon: '❄️', w: 0.12, tip: 'Simba loves the cold: walks are even happier.' },
  };
  function rollWeather() {
    let r = rnd(), acc = 0;
    for (const [k, v] of Object.entries(WEATHER)) { acc += v.w; if (r < acc) return k; }
    return 'soleil';
  }

  const TASKS = {
    lit:           { label: 'Make the bed', who: 'nena' },
    dents_matin:   { label: 'Brush teeth (morning)', who: 'nena' },
    douche:        { label: 'Take a shower', who: 'nena' },
    habiller:      { label: 'Get dressed', who: 'nena' },
    repas:         { label: 'Eat 3 meals', who: 'nena', need: 3 },
    travail:       { label: 'Work 4 hours', who: 'nena', need: 2 },
    dents_soir:    { label: 'Brush teeth (evening)', who: 'nena' },
    gamelle_matin: { label: 'Feed Simba (morning)', who: 'simba' },
    gamelle_soir:  { label: 'Feed Simba (evening)', who: 'simba' },
    eau:           { label: 'Fresh water for Simba', who: 'simba', need: 2 },
    promenade:     { label: 'Walk Simba 3 times', who: 'simba', need: 3 },
    brosser:       { label: 'Brush Simba’s coat', who: 'simba' },
    jouer:         { label: 'Play with Simba', who: 'simba' },
    calin:         { label: 'Cuddle Simba', who: 'simba' },
    parc:          { label: 'Trip to the dog park', who: 'simba' },
    vaisselle:     { label: 'Clean kitchen at bedtime', who: 'maison', check: (s) => s.maison.vaisselle === 0 },
    aspirateur:    { label: 'Vacuum (chow chow fur!)', who: 'maison' },
    lessive:       { label: 'Do the laundry', who: 'maison' },
    courses:       { label: 'Go shopping', who: 'maison' },
    veto:          { label: 'Vet appointment', who: 'simba' },
    bain:          { label: 'Give Simba a bath', who: 'simba' },
  };

  function makeDay(day) {
    const ids = ['lit', 'dents_matin', 'habiller', 'douche', 'repas', 'gamelle_matin', 'eau', 'promenade',
      'brosser', isWeekend(day) ? 'parc' : 'travail', 'jouer', 'calin', 'gamelle_soir', 'dents_soir', 'vaisselle'];
    const extras = ['aspirateur', 'lessive', 'courses'];
    ids.push(extras[(day - 1) % 3]);
    if (isWeekend(day)) ids.push(extras[day % 3]);
    if (day % 5 === 0) ids.push('veto');
    const uniq = [...new Set(ids)];
    return {
      tasks: uniq.map((id) => ({ id, done: 0, need: TASKS[id].need || 1 })),
      treats: 0, accidents: 0, mischief: 0, pets: 0, coffee: 0, trains: 0, medAM: false, medPM: false, miaWalk: false, nasimWalk: false, babaCall: false, babaCall2: 0, babaToast: false, momLunch: false, momDinner: false, helpMom: 0, nasimTalk: false, babaNap: false, neginRel: false,
      weather: day === 1 ? 'soleil' : rollWeather(),
    };
  }

  const SHOP = [
    { id: 'sweat', cat: 'tenues', name: 'Lavender hoodie', desc: 'Soft and warm.', price: 60 },
    { id: 'robe', cat: 'tenues', name: 'Yellow dress', desc: 'For sunny days.', price: 90 },
    { id: 'cire', cat: 'tenues', name: 'Raincoat', desc: 'Nena stays dry in the rain.', price: 70 },
    { id: 'rouge', cat: 'simba', name: 'Red collar', desc: 'With a golden tag.', price: 25 },
    { id: 'bandana', cat: 'simba', name: 'Pink bandana', desc: 'Matches Nena’s pajamas.', price: 35 },
    { id: 'noeud', cat: 'simba', name: 'Bow tie', desc: 'Very dapper at the park.', price: 45 },
    { id: 'panier', cat: 'maison', name: 'Cozy dog bed', desc: 'Simba gets bored more slowly.', price: 80, icon: '🧺' },
    { id: 'robot', cat: 'maison', name: 'Robot vacuum', desc: 'Fur piles up half as fast.', price: 150, icon: '🤖' },
    { id: 'cafe', cat: 'maison', name: 'Coffee machine', desc: 'New action: a coffee (+energy).', price: 60, icon: '☕' },
    { id: 'corde', cat: 'maison', name: 'Rope toy', desc: 'Playtime makes Simba even happier.', price: 30, icon: '🪢' },
    { id: 'plante', cat: 'maison', name: 'Big plant', desc: 'Nena’s mood drops more slowly.', price: 40, icon: '🪴' },
  ];

  const ACHIEVEMENTS = [
    { id: 'first_day', name: 'First sleepover', desc: 'Finish the first day.', test: (s) => s.counters.days >= 1 },
    { id: 'perfect', name: 'Perfect day', desc: 'Earn 3 stars in one day.', test: (s) => s.counters.perfect >= 1 },
    { id: 'perfect3', name: 'Golden routine', desc: 'Have 3 perfect days.', test: (s) => s.counters.perfect >= 3 },
    { id: 'week', name: 'One week together', desc: 'Reach day 8.', test: (s) => s.day >= 8 },
    { id: 'walker', name: 'Big walker', desc: 'Walk Simba 20 times.', test: (s) => s.counters.walks >= 20 },
    { id: 'groomer', name: 'Lion’s mane', desc: 'Brush Simba 10 times.', test: (s) => s.counters.brushes >= 10 },
    { id: 'petter', name: 'Cuddle therapy', desc: 'Pet Simba 50 times.', test: (s) => s.counters.pets >= 50 },
    { id: 'brush_master', name: 'Comb master', desc: 'Untangle every knot while brushing.', test: (s) => s.best.brush >= 1 },
    { id: 'fetch_master', name: 'Star pitcher', desc: 'Score 90% or more at “Fetch!”.', test: (s) => s.best.fetch >= 0.9 },
    { id: 'walk_master', name: 'Flawless walk', desc: 'Score 90% or more on a walk.', test: (s) => s.best.walk >= 0.9 },
    { id: 'shopper', name: 'Treat yourself', desc: 'Buy an item from the shop.', test: (s) => s.owned.length > 1 },
    { id: 'saver', name: 'Saver', desc: 'Have $300 in the wallet.', test: (s) => s.money >= 300 },
    { id: 'clean', name: 'Zero accidents', desc: 'Finish 3 days with no pee on the rug.', test: (s) => s.counters.cleanDays >= 3 },
    { id: 'snow', name: 'Snow bear', desc: 'Walk Simba in the snow.', test: (s) => s.counters.snowWalks >= 1 },
    { id: 'first_trick', name: 'Good boy!', desc: 'Teach Simba his first trick.', test: (s) => Object.values(s.pet.tricks).some((v) => v >= 100) },
    { id: 'all_tricks', name: 'Circus star', desc: 'Teach Simba all 5 tricks.', test: (s) => Object.values(s.pet.tricks).every((v) => v >= 100) },
    { id: 'mia_friend', name: 'Neighbors for life', desc: 'Reach 5 hearts with Mia.', test: (s) => (s.story.rel.mia || 0) >= 10 },
    { id: 'season', name: 'Season 1 complete', desc: 'Finish the story.', test: (s) => s.story.ended },
    { id: 'best_show', name: 'Road trippers', desc: 'Have a perfect trip to the Caspian Sea.', test: (s) => s.story.flags.trip === 1 },
    { id: 'family_glue', name: 'Family glue', desc: 'Reach 3 hearts with Maman, Baba, Negin and Nasim.', test: (s) => ['fariba', 'mohsen', 'negin', 'nasim'].every((k) => (s.story.rel[k] || 0) >= 6) },
  ];

  const BONDS = [
    [0, 'New roommates'], [6, 'First steps together'], [15, 'Partners in crime'],
    [30, 'Inseparable'], [50, 'Best friends forever'], [80, 'Fluffy soulmates'],
  ];

  /* ------------------------------------------------------------------ */
  /* State                                                               */
  /* ------------------------------------------------------------------ */
  function newState() {
    return {
      v: 2, day: 1, time: DAY_START, money: 60, kibble: 6, food: 4,
      room: 'chambre', dressed: false, muddy: false,
      nena: { faim: 65, energie: 85, hygiene: 55, moral: 75 },
      simba: { ventre: 35, eau: 55, pipi: 40, pelage: 70, bonheur: 70 },
      maison: { proprete: 80, vaisselle: 1, linge: 2, lit: false },
      today: makeDay(1),
      stars: 0, history: [], speed: 1,
      owned: ['basique'], outfit: 'basique', collar: null,
      counters: { days: 0, perfect: 0, walks: 0, brushes: 0, pets: 0, cleanDays: 0, snowWalks: 0 },
      best: { brush: 0, fetch: 0, walk: 0 },
      achievements: [],
      tutorialDone: false,
      settings: { sound: true, music: true, haptics: true },
      story: { base: 0, seen: [], flags: {}, rel: { fariba: 0, mohsen: 0, negin: 0, nasim: 0, mia: 0, lee: 0, sam: 0 }, ended: false, tmp: 0 },
      family: { out: false, back: 0 },
      pet: { tricks: { sit: 0, paw: 0, down: 0, spin: 0, playdead: 0 }, weight: 23, sick: false, meds: 0, age: 1, stubborn: 60, plays: 0, cuddles: 0 },
      album: [],
      puzzle: { level: 1, stars: {}, perks: [] },
    };
  }

  let S = newState();
  let busy = false;
  let modalOpen = true;
  const has = (id) => S.owned.includes(id);
  const perk = (id) => !!(S.puzzle && S.puzzle.perks.includes(id));
  const durOf = (a) => (typeof a.dur === 'function' ? a.dur(S) : a.dur);

  /* ------------------------------------------------------------------ */
  /* Time                                                                */
  /* ------------------------------------------------------------------ */
  const hh = (t) => {
    const h = Math.floor(t / 60) % 24, m = String(Math.floor(t % 60)).padStart(2, '0');
    return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
  };
  function durTxt(m) {
    if (m < 60) return m + ' min';
    const h = Math.floor(m / 60), r = m % 60;
    return h + ' h' + (r ? ' ' + String(r).padStart(2, '0') : '');
  }
  function nightLevel(t) {
    const h = t / 60;
    if (h < 6.5) return 0.85;
    if (h < 8) return 0.85 * (8 - h) / 1.5;
    if (h < 18.5) return 0;
    if (h < 21) return 0.75 * (h - 18.5) / 2.5;
    return Math.min(0.85, 0.75 + (h - 21) * 0.05);
  }
  function skyColor(t) {
    const h = (t / 60) % 24, w = S.today.weather;
    if (h < 6 || h >= 21.5) return ['#1d2047', '#3a3466'];
    if (w === 'pluie') return h < 18 ? ['#8b97a8', '#c3cbd6'] : ['#6d6f8a', '#a9a0b0'];
    if (w === 'neige') return h < 18 ? ['#c9d6e2', '#eef3f7'] : ['#9aa3c2', '#d8d4e6'];
    if (h < 8) return ['#f6b9a0', '#fde3c3'];
    if (h < 18) return w === 'nuages' ? ['#a9c6dc', '#e2edf4'] : ['#8fcbee', '#d7eefa'];
    return ['#e9866a', '#f7c491'];
  }

  /* ------------------------------------------------------------------ */
  /* Simulation                                                          */
  /* ------------------------------------------------------------------ */
  const pendingToasts = [];
  function note(msg, kind) { pendingToasts.push([msg, kind]); }

  function credit(id, n = 1) {
    const t = S.today.tasks.find((x) => x.id === id);
    if (!t || t.done >= t.need) return;
    t.done = Math.min(t.need, t.done + n);
    if (t.done >= t.need) { note('✓ ' + TASKS[id].label, 'good'); snd('success'); burstAt('spark', 50, 40, 6); }
  }
  function addTask(id) {
    if (!S.today.tasks.find((x) => x.id === id)) S.today.tasks.push({ id, done: 0, need: TASKS[id].need || 1 });
  }

  function tickMinute() {
    const n = S.nena, d = S.simba, m = S.maison, w = S.today.weather;
    S.time += 1;
    n.faim -= 0.085; n.energie -= 0.055; n.hygiene -= 0.045;
    d.ventre -= 0.1; d.eau -= w === 'soleil' ? 0.2 : 0.14; d.pipi -= 0.13; d.pelage -= 0.035 * (perk('furshield') ? 0.6 : 1);
    d.bonheur -= (0.06 + (d.ventre < 20 ? 0.05 : 0) + (d.eau < 20 ? 0.05 : 0)) * (has('panier') ? 0.7 : 1) * (S.pet.sick ? 1.5 : 1) * (perk('bestie') ? 0.75 : 1) * (S.pet.weight > 26 ? 1.1 : 1);
    m.proprete -= (0.03 + (d.pelage < 40 ? 0.05 : 0)) * (has('robot') ? 0.5 : 1) * (perk('zen') ? 0.7 : 1);
    let mood = -0.015 + (d.bonheur > 60 ? 0.025 : -0.02);
    if (n.faim < 20) mood -= 0.05;
    if (m.proprete < 35) mood -= 0.03;
    if (n.hygiene < 20) mood -= 0.02;
    if (has('plante') && mood < 0) mood *= 0.7;
    n.moral += mood;
    clampAll();

    if (d.pipi <= 0) {
      d.pipi = 75; m.proprete = clamp(m.proprete - 25); n.moral = clamp(n.moral - 8);
      S.today.accidents++;
      note('Oops! Simba couldn’t hold it: pee on the rug…', 'bad');
      snd('fail'); buzz([40, 60, 40]);
    }
    if (d.bonheur < 18 && rnd() < 0.006) {
      const betises = ['Simba chewed up a slipper.', 'Simba knocked over the plant.', 'Simba shredded a cushion.', 'Simba hid the TV remote.'];
      m.proprete = clamp(m.proprete - 12); n.moral = clamp(n.moral - 5);
      S.today.mischief++;
      note(pick(betises) + ' He’s bored!', 'bad'); snd('bark');
    }
    const fam = S.family;
    if (fam.out && S.time >= fam.back) nasimReturn();
    if (S.room === 'dehors' && S.time >= 21 * 60 && !S.today.babaCall) { S.today.babaCall = true; setTimeout(() => babaCall(false), 60); }
    if (S.room === 'dehors' && S.today.babaCall2 > 0 && S.time >= S.today.babaCall2) { S.today.babaCall2 = -1; setTimeout(() => babaCall(true), 60); }
    if (S.time >= 22 * 60 && !S.today.babaToast) { S.today.babaToast = true; note('📞 Baba has called Nasim 4 times. She’s not answering. He’s grumbling at the TV.'); }
    if (n.energie <= 0 || S.time >= COLLAPSE_AT) { endDay(true); return false; }
    return true;
  }
  function advance(min) {
    for (let i = 0; i < min; i++) if (!tickMinute()) return false;
    return true;
  }
  function clampAll() {
    for (const k in S.nena) S.nena[k] = clamp(S.nena[k]);
    for (const k in S.simba) S.simba[k] = clamp(S.simba[k]);
    S.maison.proprete = clamp(S.maison.proprete);
  }

  /* ------------------------------------------------------------------ */
  /* Actions                                                             */
  /* ------------------------------------------------------------------ */
  const TRICKS = ['sit', 'paw', 'down', 'spin', 'playdead'];
  const TRICK_NAMES = { sit: 'Sit', paw: 'Paw', down: 'Down', spin: 'Spin', playdead: 'Play dead' };
  const nextTrick = (s) => TRICKS.find((t) => s.pet.tricks[t] < 100) || null;
  const learned = (s) => TRICKS.filter((t) => s.pet.tricks[t] >= 100);
  const chapterN = (s) => { const c = window.Story && window.Story.chapterOf(s); return c ? c.n : 0; };
  const storyFlag = (s, k) => !!(s.story && s.story.flags[k]);
  const weigh = (s, d) => { s.pet.weight = Math.max(18, Math.min(30, s.pet.weight + d)); };
  function memory(id, title, text, icon) {
    if (S.album.find((m) => m.id === id)) return;
    S.album.push({ id, title, text, icon, day: S.day });
    note('📸 New memory: ' + title, 'good');
  }
  const relUp = (who, n) => { S.story.rel[who] = Math.max(0, Math.min(10, (S.story.rel[who] || 0) + n)); };
  const babaHome = () => !(S.time >= 9 * 60 && S.time < 12 * 60 && !isWeekend(S.day));
  const outside = (s, extra) => (!s.dressed ? 'Nena is still in her pajamas!' : extra ? extra(s) : true);
  function rainCheck(s) {
    if (s.today.weather === 'pluie' && s.outfit !== 'cire') { s.nena.hygiene -= 10; note('Nena got soaked… a raincoat would help.'); }
  }
  const ACTIONS = [
    // Chambre
    { room: 'chambre', id: 'lit', name: 'Make the bed', desc: 'A tidy room, a happy mind.', tag: 'maison', dur: 5,
      verb: 'Nena straightens the duvet…', task: 'lit', sfx: 'swoosh',
      avail: (s) => (!s.maison.lit ? true : 'The bed is already made.'),
      run: (s) => { s.maison.lit = true; s.nena.moral += 4; credit('lit'); } },
    { room: 'chambre', id: 'habiller', name: 'Get dressed', desc: 'A must before going out.', tag: 'nena', dur: 10,
      verb: 'Nena picks an outfit…', task: 'habiller', sfx: 'swoosh',
      avail: (s) => (!s.dressed ? true : 'Nena is already dressed.'),
      run: (s) => { s.dressed = true; s.nena.moral += 3; credit('habiller'); burstAt('spark', posOf('nena')[0], 45, 6); } },
    { room: 'chambre', id: 'pyjama', name: 'Put on pajamas', desc: 'Her favorite pink pajamas.', tag: 'nena', dur: 5,
      verb: 'Nena slips into her pajamas…',
      avail: (s) => (!s.dressed ? 'She’s already in pajamas.' : s.time < 18 * 60 ? 'It’s a bit early.' : true),
      run: (s) => { s.dressed = false; s.nena.moral += 3; } },
    { room: 'chambre', id: 'calin', name: 'Cuddle Simba', desc: 'Nose buried in his mane.', tag: 'simba', dur: 10,
      verb: 'A big soft cuddle…', task: 'calin', sfx: 'happy',
      run: (s) => { s.simba.bonheur += 20; s.nena.moral += 10; s.pet.cuddles++; credit('calin'); burstAt('heart', 58, 45, 10); } },
    { room: 'chambre', id: 'sieste', name: 'Take a nap', desc: 'Simba snuggles up to her.', tag: 'nena', dur: 60,
      verb: 'Zzz… quick nap…', sleepy: true, sfx: 'yawn',
      avail: (s) => (s.nena.energie < 70 ? true : 'Nena isn’t tired.'),
      run: (s) => { s.nena.energie += 30; s.simba.bonheur += 5; } },
    { room: 'chambre', id: 'dormir', name: 'Sleep with Simba', desc: 'Ends the day.', tag: 'nena', dur: 0,
      verb: 'Good night…',
      avail: (s) => (s.time >= BEDTIME_OK || s.nena.energie < 20 ? true : 'Not before 8 PM (unless exhausted).'),
      run: () => { snd('yawn'); endDay(false); } },

    // Salle de bain
    { room: 'sdb', id: 'douche', name: 'Take a shower', desc: 'Hygiene to the max.', tag: 'nena', dur: 15,
      verb: 'Nena sings in the shower…', task: 'douche', sfx: 'water',
      avail: (s) => (s.nena.hygiene < 92 ? true : 'Nena is already squeaky clean.'),
      run: (s) => { s.nena.hygiene = 100; s.nena.moral += 5; s.maison.linge += 1; credit('douche'); burstAt('bubbleb', posOf('nena')[0], 40, 12); } },
    { room: 'sdb', id: 'dents', name: 'Brush teeth', desc: 'Before noon, then after 7 PM.', tag: 'nena', dur: 3,
      verb: 'Brush, brush, brush…', sfx: 'brush',
      task: (s) => (s.time < 12 * 60 ? 'dents_matin' : s.time >= 19 * 60 ? 'dents_soir' : null),
      run: (s) => {
        s.nena.hygiene += 6;
        if (s.time < 12 * 60) credit('dents_matin'); else if (s.time >= 19 * 60) credit('dents_soir');
      } },
    { room: 'sdb', id: 'brosser', name: 'Brush Simba', desc: 'His double coat needs it every day.', tag: 'simba', dur: () => (perk('groomer') ? 10 : 20), mini: 'brush',
      verb: 'Nena untangles his mane…', task: 'brosser',
      avail: (s) => (s.simba.pelage < 95 ? true : 'His coat is already perfect.'),
      run: (s, r) => {
        const sc = r ? r.score : 0.6;
        s.simba.pelage = clamp(55 + 45 * sc + (perk('groomer') ? 10 : 0)); s.simba.bonheur += 4 + 10 * sc; s.maison.proprete -= 6;
        s.counters.brushes++; s.best.brush = Math.max(s.best.brush, sc);
        credit('brosser'); burstAt('fur', posOf('simba')[0], 40, 12);
      } },
    { room: 'sdb', id: 'bain', name: 'Bath for Simba', desc: 'He’s not a fan of water…', tag: 'simba', dur: 35,
      verb: 'Shampoo and splashes…', task: 'bain', sfx: 'water',
      avail: (s) => (s.muddy ? true : 'Simba isn’t dirty.'),
      run: (s) => { s.muddy = false; s.simba.bonheur -= 8; s.nena.hygiene -= 15; s.maison.linge += 1; credit('bain'); burstAt('bubbleb', posOf('simba')[0], 35, 16); note('Simba is clean… and Nena is soaked!'); } },
    { room: 'sdb', id: 'lessive', name: 'Start the laundry', desc: 'Blankets full of orange fur.', tag: 'maison', dur: 15,
      verb: 'The machine is spinning…', task: 'lessive', sfx: 'water',
      avail: (s) => (s.maison.linge > 0 ? true : 'The laundry basket is empty.'),
      run: (s) => { s.maison.linge = 0; s.nena.moral += 2; credit('lessive'); } },

    // Cuisine
    { room: 'cuisine', id: 'repas', name: (s) => mealName(s.time), desc: 'Uses 1 meal from the fridge.', tag: 'nena', dur: 20,
      verb: 'Nena cooks and eats…', task: 'repas', sfx: 'pop',
      avail: (s) => (s.food <= 0 ? 'Fridge is empty: go shopping.' : s.nena.faim > 88 ? 'Nena isn’t hungry.' : true),
      run: (s) => { s.food -= 1; s.nena.faim += 42; s.nena.moral += 4; s.maison.vaisselle += 1; credit('repas'); } },
    { room: 'cuisine', id: 'gamelle', name: 'Fill the food bowl', desc: 'Before noon, then after 5 PM.', tag: 'simba', dur: 3,
      verb: 'Simba wags his tail…', sfx: 'bark',
      task: (s) => (s.time < 12 * 60 ? 'gamelle_matin' : s.time >= 17 * 60 ? 'gamelle_soir' : null),
      avail: (s) => (s.kibble <= 0 ? 'Out of kibble!' : s.simba.ventre > 80 ? 'Simba isn’t hungry.' : true),
      run: (s) => {
        if (s.simba.ventre > 45) weigh(s, 0.08);
        s.kibble -= 1; s.simba.ventre += 55; s.simba.bonheur += 5;
        if (s.time < 12 * 60) credit('gamelle_matin'); else if (s.time >= 17 * 60) credit('gamelle_soir');
        if (s.kibble <= 1) note('Only ' + s.kibble + ' portion(s) of kibble left.', 'bad');
      } },
    { room: 'cuisine', id: 'eau', name: 'Change the water', desc: 'A bowl of fresh water.', tag: 'simba', dur: 2,
      verb: 'Slurp slurp…', task: 'eau', sfx: 'water',
      avail: (s) => (s.simba.eau < 85 ? true : 'His water bowl is full.'),
      run: (s) => { s.simba.eau = 100; credit('eau'); } },
    { room: 'cuisine', id: 'friandise', name: 'Give a treat', desc: '3 per day max.', tag: 'simba', dur: 1,
      verb: 'Sit… paw… good boy!', sfx: 'happy',
      avail: (s) => (s.today.treats < 3 ? true : 'Enough treats for today.'),
      run: (s) => { s.today.treats++; s.simba.bonheur += perk('treats') ? 15 : 10; s.simba.ventre += 5; if (!perk('treats')) weigh(s, 0.06); burstAt('heart', posOf('simba')[0], 45, 5); } },
    { room: 'cuisine', id: 'cafe', name: 'Have a coffee', desc: '+15 energy · 2 per day.', tag: 'nena', dur: 5, needs: 'cafe',
      verb: 'The smell of coffee fills the kitchen…', sfx: 'pop',
      avail: (s) => (s.today.coffee < 2 ? true : 'Enough coffee for today.'),
      run: (s) => { s.today.coffee++; s.nena.energie += 15; s.maison.vaisselle += 1; } },
    { room: 'cuisine', id: 'vaisselle', name: 'Do the dishes', desc: 'A clean kitchen before bed.', tag: 'maison', dur: 15,
      verb: 'Suds in the sink…', task: 'vaisselle', sfx: 'water',
      avail: (s) => (s.maison.vaisselle > 0 ? true : 'No dirty dishes.'),
      run: (s) => { s.maison.vaisselle = 0; s.nena.moral += 2; burstAt('bubbleb', 25, 45, 8); } },

    // Salon
    { room: 'salon', id: 'travail', name: 'Work from home (2 h)', desc: '+$45 · 8 AM to 7 PM.', tag: 'nena', dur: 120,
      verb: 'Nena works on her laptop…', task: 'travail', working: true,
      avail: (s) => (isWeekend(s.day) ? 'It’s the weekend, time off!' : s.time < 8 * 60 || s.time > 19 * 60 ? 'The office is closed.' : s.nena.energie < 20 ? 'Nena is too tired.' : true),
      run: (s) => { s.money += 45; s.nena.energie -= 12; s.nena.moral -= 5; s.simba.bonheur -= (s.pet.sick && storyFlag(s, 'family_help')) ? 0 : 8; credit('travail'); moneyFx(45); } },
    { room: 'salon', id: 'balle', name: 'Play ball', desc: 'You throw, Simba fetches… sometimes.', tag: 'simba', dur: 15, mini: 'fetch',
      verb: 'Throw, run, fetch!', task: 'jouer',
      run: (s, r) => {
        const sc = r ? r.score : 0.6;
        s.simba.bonheur += 12 + 22 * sc + (has('corde') ? 8 : 0); s.nena.energie -= 5; s.nena.moral += 6;
        s.best.fetch = Math.max(s.best.fetch, sc); s.pet.plays++;
        credit('jouer'); burstAt('heart', posOf('simba')[0], 45, 8);
      } },
    { room: 'salon', id: 'aspirateur', name: 'Vacuum', desc: 'Orange fur piles up fast.', tag: 'maison', dur: 20,
      verb: 'Vrrrrr! Simba barks at the vacuum…', task: 'aspirateur', sfx: 'bark',
      avail: (s) => (s.maison.proprete < 92 ? true : 'The house is already clean.'),
      run: (s) => { s.maison.proprete = 100; s.simba.bonheur -= 4; credit('aspirateur'); burstAt('spark', 50, 70, 10); } },
    { room: 'salon', id: 'serie', name: 'Couch & TV show', desc: 'Simba snores on her lap.', tag: 'nena', dur: 45,
      verb: 'Just one more episode…',
      run: (s) => { s.nena.moral += 14; s.nena.energie += 5; s.simba.bonheur += 8; } },

    // Dehors
    { room: 'dehors', id: 'promenade', name: 'Walk Simba', desc: 'Pee, sniffing and fresh air.', tag: 'simba', dur: () => (perk('quickwalk') ? 20 : 30), mini: 'walk',
      verb: 'A walk around the block…', task: 'promenade', walk: true,
      avail: (s) => outside(s),
      run: (s, r) => {
        const sc = r ? r.score : 0.6;
        s.simba.pipi = 100; s.simba.bonheur += 8 + 14 * sc + (s.today.weather === 'neige' ? 10 : 0);
        s.nena.energie -= 6; s.nena.moral += 5;
        s.counters.walks++; if (s.today.weather === 'neige') s.counters.snowWalks++; weigh(s, -0.05);
        if (r && !r.skipped) s.best.walk = Math.max(s.best.walk, r.hits ? Math.min(sc, 0.89) : sc);
        credit('promenade'); rainCheck(s); storyEvent('walk');
        if (perk('sniffer') && rnd() < 0.25) { const c = 5 + Math.floor(rnd() * 11); s.money += c; moneyFx(c); note(`Super Sniffer! Simba found $${c} in the grass.`, 'good'); }
        if (r && r.muddy) { s.muddy = true; addTask('bain'); note('Simba jumped into a mud puddle! Bath time.', 'bad'); }
        else if (r && r.skipped) walkEvent(s);
        else if (rnd() < 0.3) friendEvent(s);
      } },
    { room: 'dehors', id: 'parc', name: 'Dog park', desc: 'Counts as a walk.', tag: 'simba', dur: () => (perk('quickwalk') ? 45 : 60),
      verb: 'Simba runs with his buddies…', task: 'parc', walk: true, sfx: 'bark',
      avail: (s) => outside(s),
      run: (s) => {
        s.simba.pipi = 100; s.simba.bonheur += 35; s.nena.energie -= 12; s.nena.moral += 8;
        s.counters.walks++; if (s.today.weather === 'neige') s.counters.snowWalks++;
        credit('parc'); credit('promenade'); credit('jouer'); rainCheck(s);
        walkEvent(s, 0.15); burstAt('heart', posOf('simba')[0], 45, 8); weigh(s, -0.1); s.pet.plays++;
      } },
    { room: 'dehors', id: 'courses', name: 'Groceries for Nena', desc: '−$24 · +4 meals in the fridge.', tag: 'maison', dur: 40,
      verb: 'Nena fills her basket…', task: 'courses', sfx: 'coin',
      avail: (s) => outside(s, (x) => (x.money < 24 ? 'Not enough money ($24).' : true)),
      run: (s) => { s.money -= 24; s.food += perk('chef') ? 6 : 4; s.simba.bonheur -= 6; credit('courses'); rainCheck(s); } },
    { room: 'dehors', id: 'croquettes', name: 'Bag of kibble', desc: '−$20 · +8 portions.', tag: 'simba', dur: 25,
      verb: 'Off to the pet store…', task: 'courses', sfx: 'coin',
      avail: (s) => outside(s, (x) => (x.money < 20 ? 'Not enough money ($20).' : true)),
      run: (s) => { s.money -= 20; s.kibble += 8; s.simba.bonheur -= 4; credit('courses'); rainCheck(s); } },
    { room: 'dehors', id: 'veto', name: 'Vet visit', desc: '−$30 · 9 AM to 6 PM.', tag: 'simba', dur: 60,
      verb: 'Simba trembles a little in the waiting room…', task: 'veto',
      avail: (s) => outside(s, (x) => (!x.today.tasks.find((t) => t.id === 'veto') && !(x.pet.sick && !storyFlag(x, 'vet_seen')) ? 'No appointment today.' :
        x.time < 9 * 60 || x.time > 18 * 60 ? 'The clinic is closed.' : x.money < 30 ? 'Not enough money ($30).' : true)),
      run: (s) => {
        s.money -= 30; s.simba.bonheur -= 6; credit('veto');
        if (s.pet.sick && !storyFlag(s, 'vet_seen')) storyLater('vet_visit');
        else note(s.pet.weight > 26 ? 'Dr. Lee: “He’s healthy, but a little chubby. Fewer treats, more walks!”' : 'Dr. Lee: “Simba is in great shape!”', 'good');
      } },

    // Story & Simba actions
    { room: 'salon', id: 'training', name: 'Training', tag: 'simba', dur: 15, mini: 'train',
      desc: (s) => { const t = nextTrick(s); return t ? `Teaching “${TRICK_NAMES[t]}” · ${Math.round(s.pet.tricks[t])}%` : 'Simba knows every trick!'; },
      verb: 'Sit… good… treat!', show: (s) => storyFlag(s, 'training') || learned(s).length > 0 || s.story.ended,
      task: () => null,
      avail: (s) => (!nextTrick(s) ? 'He knows all 5 tricks. Superstar!' : s.today.trains >= 2 ? 'Short sessions work best: 2 per day max.' : s.pet.sick ? 'Simba is too sick to train.' : true),
      run: (s, r) => {
        const t = nextTrick(s); if (!t) return;
        const sc = r ? r.score : 0.6;
        const before = s.pet.tricks[t];
        s.pet.tricks[t] = Math.min(100, before + (20 + 30 * sc) * (1.1 - s.pet.stubborn / 200) * (perk('master') ? 1.5 : 1));
        s.pet.stubborn = Math.max(10, s.pet.stubborn - 4);
        s.today.trains++; s.simba.bonheur += 6; weigh(s, 0.03);
        if (s.pet.tricks[t] >= 100) {
          note(`🎉 Simba learned “${TRICK_NAMES[t]}”!`, 'good'); snd('fanfare'); burstAt('spark', posOf('simba')[0], 40, 14);
          memory('trick_' + t, `Trick learned: ${TRICK_NAMES[t]}`, `Simba mastered “${TRICK_NAMES[t]}” after lots of treats.`, '🦴');
        } else note(`“${TRICK_NAMES[t]}”: ${Math.round(s.pet.tricks[t])}% learned`);
      } },
    { room: 'salon', id: 'invites', name: 'Send party invites', desc: 'Who’s coming to Simba’s birthday?', tag: 'maison', dur: 5,
      verb: 'Writing invitations…', show: (s) => chapterN(s) === 2 && !storyFlag(s, 'invited'),
      run: () => storyLater('invites') },
    { room: 'dehors', id: 'cake', name: 'Cake ingredients for Maman', desc: '−$20 · carrots, eggs, saffron.', tag: 'simba', dur: 20,
      verb: 'Choosing the perfect cake…', sfx: 'coin', show: (s) => chapterN(s) === 2 && !storyFlag(s, 'cake'),
      avail: (s) => outside(s, (x) => (x.money < 20 ? 'Not enough money ($20).' : true)),
      run: (s) => { s.money -= 20; s.story.flags.cake = true; note('Maman: “Leave the rest to me, azizam.”', 'good'); } },
    { room: 'dehors', id: 'gift', name: 'Buy a birthday gift', desc: '−$30 · something squeaky.', tag: 'simba', dur: 25,
      verb: 'Squeezing every toy in the store…', sfx: 'coin', show: (s) => chapterN(s) === 2 && !storyFlag(s, 'gift'),
      avail: (s) => outside(s, (x) => (x.money < 30 ? 'Not enough money ($30).' : true)),
      run: (s) => { s.money -= 30; s.story.flags.gift = true; note('Gift wrapped and hidden in the closet.', 'good'); } },
    { room: 'dehors', id: 'miawalk', name: 'Walk with Mia', desc: '5 to 8 PM · Simba and Biscuit play together.', tag: 'simba', dur: () => (perk('quickwalk') ? 30 : 40),
      verb: 'Chatting with Mia while the dogs play…', task: 'promenade', walk: true, sfx: 'bark',
      show: (s) => storyFlag(s, 'met_mia'),
      avail: (s) => outside(s, (x) => (x.today.miaWalk ? 'You already walked with Mia today.' : x.time < 17 * 60 || x.time > 20 * 60 ? 'Mia walks between 5 and 8 PM.' : x.pet.sick ? 'Simba needs rest today.' : true)),
      run: (s) => {
        s.today.miaWalk = true; s.simba.pipi = 100; s.simba.bonheur += 20; s.nena.moral += 10; s.nena.energie -= 6;
        s.counters.walks++; weigh(s, -0.05); credit('promenade'); rainCheck(s);
        s.story.rel.mia = Math.min(10, (s.story.rel.mia || 0) + 1);
        note('Mia: “' + pick(['Biscuit has a crush on Simba, I swear.', 'Did you try the new café? Dogs get free biscuits!', 'Simba is getting so good on the leash!', 'Same time tomorrow?', 'I started a dog-photo account. Simba is the star.']) + '”', 'good');
        burstAt('heart', posOf('simba')[0], 45, 8);
      } },
    { room: 'dehors', id: 'agility', name: 'Load the white 4x4', desc: 'Bags, kuku sandwiches, Simba’s beach towel.', tag: 'maison', dur: 25,
      verb: 'Playing Tetris with suitcases…', show: (s) => chapterN(s) === 4 && (s.story.flags.practice || 0) < 3,
      avail: (s) => outside(s),
      run: (s) => { s.story.flags.practice = (s.story.flags.practice || 0) + 1; s.nena.energie -= 4; relUp('mohsen', 1); note(`4x4 loaded ${s.story.flags.practice}/3 · Baba: “Not like that! Like THIS.”`, 'good'); } },
    { room: 'cuisine', id: 'medicine', name: 'Give medicine', desc: 'Morning (before noon) and evening (after 5 PM).', tag: 'simba', dur: 3,
      verb: 'Hiding the pill in a bit of cheese…', sfx: 'pop', show: (s) => s.pet.sick && storyFlag(s, 'vet_seen'),
      task: (s) => ((s.time < 12 * 60 && !s.today.medAM) || (s.time >= 17 * 60 && !s.today.medPM) ? 'medicine' : null),
      avail: (s) => (s.time < 12 * 60 ? (s.today.medAM ? 'Morning dose done. Next one after 5 PM.' : true) : s.time >= 17 * 60 ? (s.today.medPM ? 'Evening dose done. See you tomorrow!' : true) : 'Next dose after 5 PM.'),
      run: (s) => { if (s.time < 12 * 60) s.today.medAM = true; else s.today.medPM = true; s.pet.meds++; s.simba.bonheur += 3; note(`Medicine ${s.pet.meds}/6 · Simba gobbled the cheese.`); storyEvent('medicine'); } },
    // Family: Maman Fariba, Baba Mohsen, Negin and Nasim
    { room: 'cuisine', id: 'momfood', name: (s) => (s.time < 17 * 60 ? 'Maman’s lunch' : 'Maman’s dinner'), tag: 'nena', dur: 30,
      desc: (s) => (s.time < 17 * 60 ? 'Ghormeh sabzi and saffron rice. Free!' : 'Kuku sabzi, bread and yogurt. Free!'),
      verb: 'The whole family eats together…', task: 'repas', sfx: 'pop',
      avail: (s) => {
        const lunch = s.time >= 12.5 * 60 && s.time <= 15 * 60, dinner = s.time >= 19 * 60 && s.time <= 21.5 * 60;
        if (!lunch && !dinner) return 'Maman serves lunch 12:30–3 PM and dinner 7–9:30 PM.';
        if ((lunch && s.today.momLunch) || (dinner && s.today.momDinner)) return 'You already ate. Maman insists you eat more anyway.';
        return true;
      },
      run: (s) => {
        if (s.time < 17 * 60) s.today.momLunch = true; else s.today.momDinner = true;
        s.nena.faim += 55; s.nena.moral += 8; s.maison.vaisselle += 1; credit('repas'); relUp('fariba', 1);
        note('Maman: “' + pick(['Eat, eat! You’re too thin.', 'Did Simba eat? Did YOU eat?', 'Your father wants more rice. Again.', 'Negin is still asleep? Vay, this girl…', 'Take some tahdig, the crispy part is for you.']) + '”', 'good');
      } },
    { room: 'cuisine', id: 'helpmom', name: 'Help Maman', desc: 'Dishes, sweeping and chopping herbs together.', tag: 'maison', dur: 25,
      verb: 'Chopping herbs with Maman…', sfx: 'water',
      avail: (s) => (s.today.helpMom >= 2 ? 'Maman: “Enough, go rest, azizam.”' : s.time < 8 * 60 || s.time > 22 * 60 ? 'Maman is resting.' : true),
      run: (s) => {
        s.today.helpMom++; s.maison.proprete += 15; s.maison.vaisselle = 0; s.nena.moral += 4; s.nena.energie -= 4;
        s.story.flags.helpMom = (s.story.flags.helpMom || 0) + 1; relUp('fariba', 1);
        note('Maman: “' + pick(['Thank you, azizam. You’re my right hand.', 'If only your sisters helped like you…', 'Chop the herbs finer, like this. Good!', 'Put the samovar on, your father wants tea.']) + '”', 'good');
      } },
    { room: 'salon', id: 'babanap', name: 'Simba on Baba’s belly', desc: 'Baba’s favorite thing in the world.', tag: 'simba', dur: 20,
      verb: 'Simba snores on Baba’s belly…', sfx: 'happy',
      avail: (s) => (!babaHome() ? 'Baba took the white sedan to the bazaar (back at noon).' : s.today.babaNap ? 'Simba already napped on Baba today.' : true),
      run: (s) => {
        s.today.babaNap = true; s.simba.bonheur += 25; s.nena.moral += 6; relUp('mohsen', 1); burstAt('heart', 82, 40, 12);
        note('Baba: “' + pick(['This dog understands me better than the TV.', 'Look, he snores like me!', 'Don’t tell your mother, I gave him a little piece of cheese.', 'My lion, my little lion…']) + '”', 'good');
      } },
    { room: 'hall', id: 'wakenegin', name: 'Wake up Negin', desc: 'Knock on the “Do not wake” door.', tag: 'nena', dur: 3,
      verb: 'Knock knock knock…', sfx: 'click',
      run: (s) => {
        s.story.flags.negin_try = (s.story.flags.negin_try || 0) + 1;
        if (!s.today.neginRel) { s.today.neginRel = true; relUp('negin', 1); }
        if (storyFlag(s, 'family_help') && rnd() < 0.35) { s.simba.eau = 100; note('Negin actually gets up, fills Simba’s water bowl… and goes back to bed.', 'good'); return; }
        note(pick(['Negin: “Mmmph… five more minutes…” (She said that two hours ago.)', 'Negin: “I’m not asleep, I’m resting my eyes.”', 'A pillow hits the door. That’s a no.', 'Negin: “Is the house on fire? No? Then goodnight.”', 'Negin mumbles something about a dream with a giant kebab.']));
      } },
    { room: 'hall', id: 'neginfeed', name: 'Ask Negin to feed Simba', desc: 'Spoiler: it never works.', tag: 'nena', dur: 2,
      verb: 'Negotiating through the door…', sfx: 'click',
      run: () => note(pick(['Negin: “Simba is YOUR dog.” (He’s everyone’s dog.)', 'Negin: “I fed him last year. Your turn.”', 'Negin: “Tell Simba I love him. From here. Under the blanket.”', 'Negin pretends to snore. Very loudly. Very badly.'])) },
    { room: 'hall', id: 'talknasim', name: 'Talk to Nasim', desc: 'Careful, she bites.', tag: 'nena', dur: 10,
      verb: 'Knocking on the KEEP OUT door…', sfx: 'click',
      avail: (s) => (s.family.out ? 'Nasim is out with Simba.' : s.today.nasimTalk ? 'Nasim slammed her door. Try tomorrow.' : true),
      run: (s) => {
        s.today.nasimTalk = true; relUp('nasim', 1);
        const soft = (s.story.rel.nasim || 0) >= 5;
        note(soft ? pick(['Nasim: “…Can I brush Simba later? Just because.”', 'Nasim shows you 37 photos of Simba. She’s smiling. Don’t mention it.', 'Nasim: “Okay, he’s the best dog. Happy now?”'])
          : pick(['Nasim: “What? I’m busy.” (She’s on her phone.)', 'Nasim: “Leave me alone! …Is Simba okay though?”', 'Nasim: “I walked him yesterday. Don’t thank me. Seriously, don’t.”', 'Nasim: “Ugh, FINE. Five seconds. Bye.”']));
      } },
  ];

  function friendEvent(s) {
    const ev = pick([
      ['Simba met Biscuit, his shiba friend.', () => { s.simba.bonheur += 10; }],
      ['A passerby: “Aww, he looks like a little bear!”', () => { s.nena.moral += 8; }],
      ['Nena found $5 on the ground!', () => { s.money += 5; moneyFx(5); }],
    ]);
    ev[1](); note(ev[0], 'good');
  }
  function walkEvent(s, extra = 0) {
    const mud = 0.12 + extra + (s.today.weather === 'pluie' ? 0.2 : 0);
    if (rnd() < mud) { s.muddy = true; addTask('bain'); note('Simba rolled in the mud! Bath time.', 'bad'); }
    else if (rnd() < 0.35) friendEvent(s);
  }
  function mealName(t) {
    const h = t / 60;
    return h < 11 ? 'Breakfast' : h < 15 ? 'Lunch' : h < 18 ? 'Snack' : 'Dinner';
  }
  const val = (x, s) => (typeof x === 'function' ? x(s) : x);
  const visibleActions = (room) => ACTIONS.filter((a) => a.room === room && (!a.needs || has(a.needs)) && (!a.show || a.show(S)));

  /* ------------------------------------------------------------------ */
  /* Rooms & scenery                                                      */
  /* ------------------------------------------------------------------ */
  const ROOMS = {
    chambre: { name: 'Bedroom', icon: '🛏️', nena: [44, 6], simba: [70, 5] },
    hall:    { name: 'Hallway', icon: '🚪', nena: [24, 6], simba: [46, 5] },
    sdb:     { name: 'Bath', icon: '🛁', nena: [56, 6], simba: [78, 5] },
    cuisine: { name: 'Kitchen', icon: '🍳', nena: [36, 6], simba: [68, 5] },
    salon:   { name: 'Living', icon: '🛋️', nena: [64, 7], simba: [34, 6] },
    dehors:  { name: 'Outside', icon: '🌳', nena: [40, 9], simba: [64, 8] },
  };
  const posOf = (who) => ROOMS[S.room][who];

  /* Illustrated scenes (800×450, floor line at y=330). Lighting follows the clock. */
  function fluff(s) {
    const count = Math.round((100 - s.maison.proprete) / 14);
    const spots = [[210, 420], [300, 398], [520, 432], [610, 400], [430, 440], [250, 440], [580, 444]];
    let out = '';
    for (let i = 0; i < Math.min(count, spots.length); i++) {
      const [x, y] = spots[i];
      out += `<g opacity=".9"><ellipse cx="${x}" cy="${y + 6}" rx="14" ry="3" fill="rgba(0,0,0,.12)"/><circle cx="${x}" cy="${y}" r="8" fill="#d98f45"/><circle cx="${x + 8}" cy="${y - 3}" r="6.5" fill="#eaa75c"/><circle cx="${x - 7}" cy="${y - 2}" r="5.5" fill="#c97f3a"/><path d="M${x - 10} ${y - 6} l-4 -3 M${x + 12} ${y - 8} l4 -3" stroke="#d98f45" stroke-width="1.5"/></g>`;
    }
    return out;
  }
  const dayLight = (s) => 1 - Math.min(1, nightLevel(s.time) / 0.6);
  function sceneDefs(s, wall1, wall2, floor1, floor2) {
    return `<defs>
      <linearGradient id="sc-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wall1}"/><stop offset="1" stop-color="${wall2}"/></linearGradient>
      <linearGradient id="sc-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${floor1}"/><stop offset="1" stop-color="${floor2}"/></linearGradient>
      <linearGradient id="sc-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d8" stop-opacity=".55"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></linearGradient>
      <radialGradient id="sc-glow"><stop offset="0" stop-color="#ffd98a" stop-opacity=".75"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
      <radialGradient id="sc-vig" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#2a1608" stop-opacity=".28"/></radialGradient>
      <linearGradient id="sc-gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <clipPath id="sc-photo"><rect x="0" y="0" width="1" height="1"/></clipPath>
    </defs>`;
  }
  function wallpaper(stripe) {
    let o = '<rect width="800" height="330" fill="url(#sc-wall)"/>';
    for (let x = 0; x < 800; x += 36) o += `<rect x="${x}" y="0" width="14" height="330" fill="${stripe}"/>`;
    for (let x = 18; x < 800; x += 72) for (let y = 30; y < 300; y += 60) o += `<circle cx="${x + ((y / 60) % 2) * 36}" cy="${y}" r="2.2" fill="${stripe}" opacity="1.6"/>`;
    return o;
  }
  function woodFloor() {
    let o = '<rect x="0" y="330" width="800" height="120" fill="url(#sc-floor)"/>';
    const rows = [330, 352, 378, 410, 450];
    for (let i = 0; i < rows.length - 1; i++) {
      o += `<path d="M0 ${rows[i + 1]} H800" stroke="rgba(60,30,10,.18)" stroke-width="1.5"/>`;
      for (let x = (i * 97) % 160; x < 800; x += 160 + i * 12) o += `<path d="M${x} ${rows[i]} V${rows[i + 1]}" stroke="rgba(60,30,10,.14)" stroke-width="1.5"/>`;
    }
    o += '<rect x="0" y="322" width="800" height="12" fill="#f4ead9"/><rect x="0" y="332" width="800" height="3" fill="rgba(0,0,0,.12)"/>';
    return o;
  }
  function windowSvg(x, y, w, h, s, curtain) {
    const [a, b] = skyColor(s.time);
    const night = nightLevel(s.time) > 0.4, wx = s.today.weather;
    let extra = '';
    extra += `<path d="M${x} ${y + h} v-30 h${w * 0.16} v-18 h${w * 0.14} v26 h${w * 0.2} v-40 h${w * 0.18} v22 h${w * 0.32} v40z" fill="${night ? '#24233f' : '#a9bccd'}"/>`;
    for (let i = 0; i < 10; i++) extra += `<rect x="${x + 6 + ((i * 31) % (w - 14))}" y="${y + h - 24 - ((i * 13) % 26)}" width="4" height="5" fill="${night ? '#ffcf73' : '#dfe8f0'}" opacity="${night ? (i % 3 ? 0.95 : 0.3) : 0.8}"/>`;
    if (!night && wx !== 'pluie') extra += `<g fill="#fff" opacity=".85"><ellipse cx="${x + w * 0.3}" cy="${y + h * 0.25}" rx="18" ry="6"/><ellipse cx="${x + w * 0.38}" cy="${y + h * 0.22}" rx="12" ry="6"/></g>`;
    if (night) extra += `<circle cx="${x + w * 0.75}" cy="${y + h * 0.22}" r="9" fill="#fff3c9"/><circle cx="${x + w * 0.78}" cy="${y + h * 0.2}" r="8" fill="${a}"/>`;
    if (wx === 'pluie') for (let i = 0; i < 16; i++) extra += `<path d="M${x + ((i * 29) % w)} ${y + ((i * 41) % h)} l-4 12" stroke="#e6eef7" stroke-width="1.6" opacity=".7"/>`;
    if (wx === 'neige') for (let i = 0; i < 16; i++) extra += `<circle cx="${x + ((i * 29) % w)}" cy="${y + ((i * 41) % h)}" r="2.4" fill="#fff"/>`;
    const id = 'sky' + x;
    const beam = !night && dayLight(s) > 0.2 ? `<polygon points="${x},${y + h} ${x + w},${y + h} ${x + w + 120},450 ${x - 60},450" fill="url(#sc-beam)" opacity="${(dayLight(s) * (wx === 'soleil' ? 1 : 0.55)).toFixed(2)}"/>` : '';
    const curt = curtain ? `<path d="M${x - 30} ${y - 22} h${w * 0.32} q-8 ${h * 0.5} 6 ${h + 30} q-24 6 -${w * 0.36} 0 z" fill="${curtain}"/>
      <path d="M${x + w + 30} ${y - 22} h-${w * 0.32} q8 ${h * 0.5} -6 ${h + 30} q24 6 ${w * 0.36} 0 z" fill="${curtain}"/>
      <path d="M${x - 18} ${y - 18} v${h + 24} M${x - 4} ${y - 18} v${h + 20} M${x + w + 18} ${y - 18} v${h + 24} M${x + w + 4} ${y - 18} v${h + 20}" stroke="rgba(0,0,0,.08)" stroke-width="3"/>
      <rect x="${x - 40}" y="${y - 28}" width="${w + 80}" height="7" rx="3.5" fill="#8a6044"/>` : '';
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
      <rect x="${x - 10}" y="${y - 10}" width="${w + 20}" height="${h + 20}" rx="6" fill="#6b4632"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id})"/>
      ${extra}
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#sc-gloss)" opacity=".18"/>
      <rect x="${x + w / 2 - 3}" y="${y}" width="6" height="${h}" fill="#6b4632"/>
      <rect x="${x}" y="${y + h / 2 - 3}" width="${w}" height="6" fill="#6b4632"/>
      <rect x="${x - 16}" y="${y + h + 8}" width="${w + 32}" height="9" rx="3" fill="#7d553d"/>
      ${curt}${beam}`;
  }
  const photo = (x, y, w, h) => `<g><rect x="${x - 7}" y="${y - 7}" width="${w + 14}" height="${h + 14}" rx="3" fill="#8a5a3c"/><rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" fill="#fff8ee"/>
    <svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><image href="assets/nena-simba.jpg" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice"/></svg>
    <rect x="${x}" y="${y}" width="${w}" height="${h * 0.4}" fill="url(#sc-gloss)" opacity=".25"/></g>`;
  const frame = (x, y, w, h, inner) => `<g><rect x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${h + 10}" rx="2" fill="#c99a6a"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff8ee"/>${inner}</g>`;
  const plant = (x, y, sc = 1) => `<g transform="translate(${x} ${y}) scale(${sc})">
    <g fill="#5f8f45"><ellipse cx="0" cy="-34" rx="16" ry="32"/><ellipse cx="22" cy="-42" rx="12" ry="28" transform="rotate(28 22 -42)"/><ellipse cx="-22" cy="-42" rx="12" ry="28" transform="rotate(-28 -22 -42)"/></g>
    <g fill="#77ab58"><ellipse cx="6" cy="-40" rx="8" ry="22" transform="rotate(10 6 -40)"/><ellipse cx="-12" cy="-30" rx="7" ry="18" transform="rotate(-20 -12 -30)"/></g>
    <path d="M0 -60 V-4 M0 -30 L18 -50 M0 -24 L-18 -46" stroke="#4a7537" stroke-width="2" fill="none"/>
    <path d="M-22 -6 h44 l-5 40 h-34z" fill="#c97b52"/><rect x="-24" y="-8" width="48" height="8" rx="3" fill="#b06a44"/><path d="M-16 4 l4 26" stroke="rgba(255,255,255,.2)" stroke-width="4"/></g>`;
  const pothos = (x, y) => {
    let leaves = '';
    const pts = [[0, 0], [-14, 18], [-6, 38], [-18, 58], [-8, 80], [10, 16], [16, 40], [8, 62]];
    pts.forEach(([dx, dy], i) => { leaves += `<path d="M${x + dx} ${y + dy} q8 -8 14 0 q-6 10 -14 0z" fill="${i % 2 ? '#6aa04c' : '#7fbb5e'}" transform="rotate(${i % 2 ? -30 : 25} ${x + dx} ${y + dy})"/>`; });
    return `<path d="M${x} ${y} q-16 30 -8 80 M${x} ${y} q16 26 8 62" stroke="#4f7d39" stroke-width="2" fill="none"/>${leaves}`;
  };
  const lampGlow = (s, x, y, r) => (nightLevel(s.time) > 0.25 ? `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#sc-glow)"/>` : '');
  const dogBed = (x, y) => `<g><ellipse cx="${x}" cy="${y + 8}" rx="76" ry="14" fill="rgba(0,0,0,.14)"/><ellipse cx="${x}" cy="${y}" rx="72" ry="24" fill="#b5476d"/><ellipse cx="${x}" cy="${y - 6}" rx="58" ry="15" fill="#f3c6d5"/><path d="M${x - 50} ${y - 4} q50 14 100 0" stroke="#e7a8bf" stroke-width="3" fill="none"/></g>`;
  const rug = (cx, cy, rx, ry, c1, c2) => `<ellipse cx="${cx}" cy="${cy + 4}" rx="${rx + 4}" ry="${ry + 3}" fill="rgba(0,0,0,.1)"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c1}"/><ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.78}" ry="${ry * 0.7}" fill="none" stroke="${c2}" stroke-width="4" stroke-dasharray="2 8" stroke-linecap="round"/><ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.5}" ry="${ry * 0.42}" fill="${c2}" opacity=".5"/>`;
  const persianRug = (cx, cy, w, h) => {
    const x0 = cx - w / 2, y0 = cy - h / 2;
    let o = `<polygon points="${x0 + 40},${y0} ${x0 + w - 40},${y0} ${x0 + w},${y0 + h} ${x0},${y0 + h}" fill="#8c1f30"/>`;
    o += `<polygon points="${x0 + 52},${y0 + 6} ${x0 + w - 52},${y0 + 6} ${x0 + w - 14},${y0 + h - 6} ${x0 + 14},${y0 + h - 6}" fill="none" stroke="#1f2a5a" stroke-width="7"/>`;
    o += `<polygon points="${x0 + 66},${y0 + 14} ${x0 + w - 66},${y0 + 14} ${x0 + w - 30},${y0 + h - 14} ${x0 + 30},${y0 + h - 14}" fill="#a8293c"/>`;
    o += `<ellipse cx="${cx}" cy="${cy}" rx="${w * 0.2}" ry="${h * 0.3}" fill="#f0d9a8"/><ellipse cx="${cx}" cy="${cy}" rx="${w * 0.13}" ry="${h * 0.2}" fill="#1f2a5a"/><ellipse cx="${cx}" cy="${cy}" rx="${w * 0.05}" ry="${h * 0.08}" fill="#f0d9a8"/>`;
    o += `<path d="M${cx - w * 0.32} ${cy} l14 -8 l14 8 l-14 8z M${cx + w * 0.32} ${cy} l-14 -8 l-14 8 l14 8z" fill="#f0d9a8"/>`;
    for (let i = 0; i < 16; i++) o += `<path d="M${x0 + 4 + i * (w - 8) / 15} ${y0 + h} v6" stroke="#f4ead9" stroke-width="2"/>`;
    return o;
  };
  const samovar = (x, y) => `<g><ellipse cx="${x}" cy="${y + 2}" rx="26" ry="4" fill="rgba(0,0,0,.15)"/><rect x="${x - 14}" y="${y - 8}" width="28" height="8" rx="3" fill="#b9a46a"/>
    <path d="M${x - 18} ${y - 8} q-4 -30 6 -44 h24 q10 14 6 44z" fill="#d9c27a"/><path d="M${x - 10} ${y - 48} q10 -10 20 0" fill="#c9b06a"/>
    <path d="M${x - 12} ${y - 44} q-2 24 4 34" stroke="#fff6cc" stroke-width="4" fill="none" opacity=".7"/><rect x="${x + 16}" y="${y - 22}" width="10" height="4" rx="2" fill="#a88f52"/>
    <path d="M${x - 9} ${y - 62} h18 l-3 12 h-12z" fill="#e05b7b"/><circle cx="${x}" cy="${y - 64}" r="3" fill="#c9496f"/>
    <path d="M${x + 34} ${y} h10 l-2 -14 h-6z" fill="rgba(200,90,40,.75)" stroke="#e8e0d0" stroke-width="1.5"/><path d="M${x + 50} ${y} h10 l-2 -14 h-6z" fill="rgba(200,90,40,.75)" stroke="#e8e0d0" stroke-width="1.5"/></g>`;
  const vignette = '<rect width="800" height="450" fill="url(#sc-vig)"/>';

  const DRAW = {
    hall(s) {
      const negZ = '<text x="0" y="0" font-family="Baloo 2, sans-serif" font-weight="800" font-size="22" fill="#7a7fb8">z</text>';
      const door = (x, color, sign, extra) => `<g>
        <rect x="${x - 6}" y="104" width="112" height="226" rx="4" fill="#e6d3bd"/>
        <rect x="${x}" y="110" width="100" height="220" rx="3" fill="${color}"/>
        <rect x="${x + 10}" y="122" width="80" height="86" rx="3" fill="rgba(0,0,0,.06)"/><rect x="${x + 10}" y="218" width="80" height="100" rx="3" fill="rgba(0,0,0,.06)"/>
        <circle cx="${x + 84}" cy="224" r="5" fill="#d9b25c"/><rect x="${x + 80}" y="222" width="14" height="4" rx="2" fill="#d9b25c"/>
        ${sign}${extra || ''}</g>`;
      const runner = (() => {
        let o = '<polygon points="230,338 570,338 640,450 160,450" fill="#8c1f30"/><polygon points="244,344 556,344 616,444 184,444" fill="none" stroke="#1f2a5a" stroke-width="8"/>';
        o += '<polygon points="262,352 538,352 590,436 210,436" fill="#a8293c"/><ellipse cx="400" cy="392" rx="70" ry="24" fill="#f0d9a8"/><ellipse cx="400" cy="392" rx="46" ry="15" fill="#1f2a5a"/><ellipse cx="400" cy="392" rx="20" ry="7" fill="#f0d9a8"/>';
        for (let i = 0; i < 9; i++) o += `<path d="M${180 + i * 55} 448 v6" stroke="#f4ead9" stroke-width="2"/>`;
        return o;
      })();
      return `${sceneDefs(s, '#f4e6d3', '#e9d5bd', '#c69a6e', '#a37650')}
        ${wallpaper('rgba(255,255,255,.2)')}
        ${woodFloor()}
        ${door(70, '#f3c6d5', '<rect x="84" y="140" width="72" height="44" rx="6" fill="#fff8ee" transform="rotate(-4 120 162)"/><text x="120" y="158" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="11" fill="#7a5c4e" transform="rotate(-4 120 162)">NENA</text><path d="M108 172 q4 -6 8 0 q4 -6 8 0 q-8 10 -8 10 q0 0 -8 -10z" fill="#e05b7b" transform="rotate(-4 120 162)"/>', '')}
        ${door(250, '#bcd6e6', '<rect x="262" y="136" width="76" height="52" rx="6" fill="#fff8ee"/><text x="300" y="156" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="10" fill="#4a5a8a">NEGIN</text><text x="300" y="174" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="800" font-size="9" fill="#4a5a8a">DO NOT WAKE</text>',
          `<g class="zz-door"><g transform="translate(340 120)">${negZ}</g><g transform="translate(352 98) scale(1.3)">${negZ}</g><g transform="translate(366 72) scale(1.6)">${negZ}</g></g>`)}
        ${door(430, '#3d3a5c', '<rect x="442" y="132" width="76" height="58" rx="4" fill="#ef5f7f" transform="rotate(5 480 161)"/><text x="480" y="154" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="11" fill="#fff" transform="rotate(5 480 161)">KEEP OUT!</text><text x="480" y="176" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="10" fill="#fff" transform="rotate(5 480 161)">NASIM 😠</text>', '<circle cx="460" cy="290" r="9" fill="#ffd36b"/><circle cx="492" cy="270" r="7" fill="#7fe0b4"/>')}
        ${door(610, '#d8c3a5', '<rect x="626" y="138" width="68" height="40" rx="4" fill="#fff8ee"/><text x="660" y="162" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="10" fill="#7a5c4e">MAMAN · BABA</text>', '')}
        <g><rect x="726" y="250" width="64" height="80" rx="4" fill="#8a5a3c"/><rect x="732" y="272" width="52" height="4" fill="#6d4630"/><rect x="732" y="300" width="52" height="4" fill="#6d4630"/>
          <ellipse cx="744" cy="268" rx="8" ry="3" fill="#ef8fb0"/><ellipse cx="764" cy="268" rx="8" ry="3" fill="#ef8fb0"/><ellipse cx="746" cy="296" rx="8" ry="3" fill="#6b6f7e"/><ellipse cx="766" cy="296" rx="8" ry="3" fill="#6b6f7e"/></g>
        ${runner}
        ${fluff(s)}${vignette}`;
    },
    chambre(s) {
      const made = s.maison.lit, lamp = nightLevel(s.time) > 0.3;
      return `${sceneDefs(s, '#f1ddcb', '#e5c9b2', '#c08d63', '#9c6a44')}
        ${wallpaper('rgba(255,255,255,.18)')}
        ${woodFloor()}
        ${windowSvg(530, 74, 140, 130, s, '#efe0cc')}
        ${photo(250, 70, 76, 76)}
        ${frame(350, 92, 46, 56, '<circle cx="373" cy="114" r="12" fill="#f2a94e"/><path d="M356 140 q17 -16 34 0" fill="#ef8fb0"/>')}
        <g fill="#7d553d"><rect x="120" y="120" width="96" height="8" rx="3"/></g>
        <g><rect x="128" y="96" width="12" height="24" fill="#c9496f"/><rect x="141" y="100" width="10" height="20" fill="#5f8f45"/><rect x="152" y="94" width="14" height="26" fill="#e8b73a"/><rect x="167" y="104" width="9" height="16" fill="#4a7bd0" transform="rotate(12 171 112)"/></g>
        ${pothos(196, 120)}
        ${rug(400, 404, 230, 30, '#f0b6c8', '#fff3f7')}
        <rect x="102" y="186" width="320" height="22" rx="11" fill="#8f5f3f"/>
        <rect x="110" y="200" width="304" height="100" rx="16" fill="#a77450"/>
        <g fill="#b9875f">${[0, 1, 2, 3].map((i) => `<circle cx="${150 + i * 76}" cy="236" r="5"/>`).join('')}${[0, 1, 2].map((i) => `<circle cx="${188 + i * 76}" cy="264" r="5"/>`).join('')}</g>
        <rect x="96" y="264" width="332" height="88" rx="26" fill="#f6ebdb"/>
        ${made
          ? `<rect x="124" y="236" width="104" height="42" rx="18" fill="#fffaf2"/><rect x="242" y="236" width="104" height="42" rx="18" fill="#fffaf2"/>
             <path d="M132 250 q46 -10 88 0 M250 250 q46 -10 88 0" stroke="#ecdcc6" stroke-width="3" fill="none"/>
             <path d="M96 290 h332 v40 q0 22 -26 22 h-280 q-26 0 -26 -22z" fill="#e9d2b3"/>
             <path d="M96 292 h332" stroke="#fff6e8" stroke-width="5"/><path d="M130 312 q40 8 90 0 q50 -8 100 0 q40 6 90 0" stroke="#d8bd98" stroke-width="3" fill="none"/>`
          : `<rect x="118" y="232" width="104" height="42" rx="18" fill="#fffaf2" transform="rotate(-12 170 254)"/>
             <path d="M96 300 q40 -46 96 -10 q46 -36 92 4 q50 -44 94 -2 q28 -18 50 8 v32 q0 22 -26 22 h-280 q-26 0 -26 -22z" fill="#e9d2b3"/>
             <path d="M140 300 q20 -18 46 -4 M240 298 q26 -20 50 0 M330 296 q22 -16 44 2" stroke="#d8bd98" stroke-width="3" fill="none"/>`}
        <ellipse cx="262" cy="356" rx="170" ry="8" fill="rgba(0,0,0,.12)"/>
        <rect x="438" y="258" width="78" height="86" rx="8" fill="#8a5a3c"/><rect x="438" y="258" width="78" height="10" rx="5" fill="#a06d4a"/>
        <rect x="448" y="292" width="58" height="4" rx="2" fill="#6d4630"/><circle cx="477" cy="314" r="3.4" fill="#e8c38f"/>
        ${lampGlow(s, 466, 196, 110)}
        <rect x="460" y="218" width="10" height="40" fill="#6d4630"/><ellipse cx="465" cy="258" rx="16" ry="4" fill="#5a3a28"/>
        <path d="M436 222 l20 -52 h20 l20 52z" fill="${lamp ? '#ffe3a3' : '#f4e2c4'}"/><path d="M436 222 h60" stroke="${lamp ? '#ffd27a' : '#e2ccaa'}" stroke-width="3"/>
        <g><rect x="482" y="240" width="22" height="18" rx="4" fill="#fffaf2"/><path d="M504 244 q8 0 8 6 q0 6 -8 6" stroke="#fffaf2" stroke-width="3" fill="none"/><path d="M489 247 q4 -3 8 0 q-4 6 -8 0z" fill="#e05b7b"/>
          <path d="M488 236 q4 -8 0 -14 M496 236 q4 -8 0 -14" stroke="rgba(255,255,255,.7)" stroke-width="2" fill="none"/></g>
        ${has('panier') ? dogBed(616, 404) : ''}
        ${has('plante') ? plant(706, 312, 0.95) : plant(712, 318, 0.75)}
        ${fluff(s)}${vignette}`;
    },
    sdb(s) {
      let tiles = '';
      for (let y = 0; y < 322; y += 32) for (let x = (y / 32) % 2 ? -16 : 0; x < 800; x += 32) tiles += `<rect x="${x + 1}" y="${y + 1}" width="30" height="30" rx="3" fill="rgba(255,255,255,.35)"/>`;
      const linge = Math.min(3, s.maison.linge);
      let basket = '';
      for (let i = 0; i < linge; i++) basket += `<ellipse cx="${640 + i * 8}" cy="${296 - i * 9}" rx="22" ry="9" fill="${['#f19bb8', '#9cc2d9', '#f6d9b8'][i]}"/>`;
      let floorTiles = '<rect x="0" y="330" width="800" height="120" fill="url(#sc-floor)"/>';
      for (let x = 0; x < 800; x += 56) floorTiles += `<path d="M${x} 330 L${x - 40 + (x - 400) * 0.25} 450" stroke="rgba(0,0,0,.08)" stroke-width="2"/>`;
      for (const y of [356, 388, 428]) floorTiles += `<path d="M0 ${y} H800" stroke="rgba(0,0,0,.08)" stroke-width="2"/>`;
      return `${sceneDefs(s, '#cfe3e6', '#b6d2d6', '#efe8de', '#d9cfc2')}
        <rect width="800" height="330" fill="url(#sc-wall)"/>${tiles}
        <rect x="0" y="180" width="800" height="8" fill="#9cc2c8"/>
        ${floorTiles}<rect x="0" y="322" width="800" height="10" fill="#e9f2f3"/>
        ${rug(470, 400, 120, 24, '#9cc2d9', '#d7ecf5')}
        <path d="M104 70 h8 v170 h-8z" fill="#c4ccd2"/><path d="M100 66 h250 v8 h-250z" fill="#c4ccd2"/>
        <path d="M112 74 q20 80 4 170 h70 q-24 -90 -10 -170z" fill="#f3c6d5" opacity=".9"/><path d="M130 80 q10 80 0 160 M152 80 q12 80 2 160" stroke="#e7a8bf" stroke-width="3" fill="none"/>
        <ellipse cx="248" cy="346" rx="150" ry="10" fill="rgba(0,0,0,.12)"/>
        <path d="M110 238 h276 v40 q0 64 -70 64 h-136 q-70 0 -70 -64z" fill="#fffdf9"/>
        <path d="M120 248 h256 v18 q-128 14 -256 0z" fill="#bfe1ee"/>
        <path d="M118 250 q60 40 130 40" stroke="url(#sc-gloss)" stroke-width="10" fill="none" opacity=".6"/>
        <g fill="#fff"><circle cx="190" cy="246" r="12"/><circle cx="212" cy="238" r="9"/><circle cx="232" cy="248" r="11"/><circle cx="300" cy="244" r="8"/><circle cx="318" cy="238" r="6"/></g>
        <g fill="#c4ccd2"><rect x="128" y="342" width="12" height="10" rx="3"/><rect x="356" y="342" width="12" height="10" rx="3"/></g>
        <path d="M352 238 v-34 q0 -10 10 -10 h10" stroke="#c4ccd2" stroke-width="6" fill="none" stroke-linecap="round"/>
        <g><ellipse cx="458" cy="150" rx="54" ry="70" fill="#d8c2a8"/><ellipse cx="458" cy="150" rx="46" ry="62" fill="#e8f3f6"/>
          <path d="M424 112 q20 -30 50 -26" stroke="#fff" stroke-width="8" stroke-linecap="round" fill="none" opacity=".8"/>
          <path d="M430 196 q28 14 56 0" stroke="#cfe3e6" stroke-width="4" fill="none"/></g>
        <rect x="404" y="232" width="108" height="22" rx="9" fill="#fffdf9"/><rect x="434" y="254" width="48" height="76" rx="6" fill="#f2ede6"/>
        <path d="M458 232 v-12 h12" stroke="#c4ccd2" stroke-width="4" fill="none"/>
        <g><rect x="420" y="214" width="12" height="18" rx="3" fill="#ef8fb0"/><rect x="490" y="208" width="10" height="24" rx="3" fill="#7fc9a7"/></g>
        <rect x="540" y="196" width="104" height="138" rx="12" fill="#f8f6f3"/><rect x="540" y="196" width="104" height="26" rx="12" fill="#ece8e2"/>
        <circle cx="592" cy="276" r="36" fill="#cfd8dd"/><circle cx="592" cy="276" r="28" fill="#8fb3c4"/><path d="M572 262 q14 -12 32 -4" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".7"/>
        <circle cx="560" cy="209" r="5" fill="#e98aab"/><circle cx="576" cy="209" r="5" fill="#8fcf8f"/><rect x="600" y="204" width="34" height="10" rx="3" fill="#cfd8dd"/>
        <path d="M652 290 h72 l-6 46 h-60z" fill="#c9a67a"/><path d="M656 302 h64 M658 316 h60 M660 328 h56" stroke="#b08c60" stroke-width="2"/>${basket}
        <rect x="690" y="120" width="40" height="70" rx="6" fill="#f6d9b8"/><rect x="684" y="114" width="52" height="8" rx="4" fill="#c4ccd2"/><path d="M690 170 h40" stroke="#ef8fb0" stroke-width="4"/>
        ${fluff(s)}${vignette}`;
    },
    cuisine(s) {
      let tiles = '';
      for (let y = 168; y < 240; y += 18) for (let x = 100 + ((y / 18) % 2) * 15; x < 430; x += 30) tiles += `<rect x="${x}" y="${y}" width="28" height="16" rx="2" fill="rgba(255,255,255,.6)"/>`;
      let dishes = '';
      for (let i = 0; i < Math.min(5, s.maison.vaisselle); i++) dishes += `<ellipse cx="${348 + (i % 2) * 5}" cy="${236 - i * 7}" rx="26" ry="5" fill="#fffaf2" stroke="#c9b8a4" stroke-width="1.6"/>`;
      const foodLvl = s.simba.ventre > 70 ? 0 : 1;
      const water = Math.round(s.simba.eau / 100 * 10);
      return `${sceneDefs(s, '#f6e6cd', '#ecd5b4', '#d2ae86', '#ad8660')}
        <rect width="800" height="330" fill="url(#sc-wall)"/>
        ${woodFloor()}
        <rect x="96" y="164" width="340" height="80" fill="#e6f0ea"/>${tiles}
        ${windowSvg(470, 64, 120, 100, s, null)}
        <g>${[0, 1, 2].map((i) => `<path d="M${484 + i * 34} 168 h22 l-3 16 h-16z" fill="#c97b52"/><g fill="#6aa04c"><ellipse cx="${495 + i * 34}" cy="160" rx="7" ry="10"/><ellipse cx="${489 + i * 34}" cy="164" rx="5" ry="7" transform="rotate(-30 ${489 + i * 34} 164)"/><ellipse cx="${501 + i * 34}" cy="164" rx="5" ry="7" transform="rotate(30 ${501 + i * 34} 164)"/></g>`).join('')}</g>
        <rect x="96" y="48" width="340" height="104" rx="6" fill="#f2e3cc"/>
        ${[0, 1, 2].map((i) => `<rect x="${104 + i * 112}" y="56" width="104" height="88" rx="6" fill="#fffaf2"/><rect x="${150 + i * 112}" y="124" width="12" height="4" rx="2" fill="#c9a27a"/>`).join('')}
        <path d="M240 20 v18" stroke="#3a3550" stroke-width="2"/><path d="M220 38 h40 l-6 14 h-28z" fill="#3a3550"/>${lampGlow(s, 240, 60, 90)}
        <ellipse cx="270" cy="346" rx="190" ry="9" fill="rgba(0,0,0,.12)"/>
        <rect x="92" y="250" width="348" height="92" fill="#a8744d"/>
        <rect x="86" y="238" width="360" height="16" rx="5" fill="#efe3cf"/><rect x="86" y="238" width="360" height="5" rx="2.5" fill="#fff7ea"/>
        ${[0, 1, 2].map((i) => `<rect x="${104 + i * 112}" y="264" width="100" height="70" rx="6" fill="#b98157"/><rect x="${146 + i * 112}" y="272" width="16" height="4" rx="2" fill="#e8c38f"/>`).join('')}
        <rect x="320" y="224" width="70" height="16" rx="6" fill="#c9cfd3"/>${dishes}${samovar(260, 238)}
        <g><path d="M128 214 h40 q4 0 4 4 v20 h-48 v-20 q0 -4 4 -4z" fill="#e05b7b"/><path d="M172 222 q12 0 12 8" stroke="#e05b7b" stroke-width="4" fill="none"/><rect x="142" y="206" width="12" height="8" rx="2" fill="#c9496f"/></g>
        ${has('cafe') ? '<rect x="196" y="200" width="36" height="40" rx="6" fill="#3a3550"/><rect x="204" y="222" width="18" height="14" rx="3" fill="#fff"/><circle cx="214" cy="210" r="3" fill="#7ee08a"/>' : ''}
        <rect x="462" y="190" width="120" height="152" rx="16" fill="#f7f4ef"/><rect x="462" y="190" width="120" height="152" rx="16" fill="url(#sc-gloss)" opacity=".25"/>
        <path d="M462 248 h120" stroke="#ddd5ca" stroke-width="3"/><rect x="564" y="206" width="6" height="30" rx="3" fill="#b8b0a6"/><rect x="564" y="258" width="6" height="40" rx="3" fill="#b8b0a6"/>
        <rect x="478" y="204" width="30" height="34" rx="2" fill="#fff" transform="rotate(-4 493 221)"/><circle cx="490" cy="216" r="6" fill="#f2a94e"/><path d="M482 232 q10 -8 20 0" stroke="#ef8fb0" stroke-width="3" fill="none"/>
        <circle cx="530" cy="212" r="6" fill="#ef8fb0"/><circle cx="546" cy="226" r="5" fill="#7fc9a7"/>
        <text x="522" y="290" text-anchor="middle" font-family="Nunito, sans-serif" font-size="15" font-weight="800" fill="#b8b0a6">${s.food} meals</text>
        <ellipse cx="634" cy="424" rx="74" ry="8" fill="rgba(0,0,0,.12)"/>
        <path d="M576 400 h56 l-8 22 h-40z" fill="#e98aab"/><ellipse cx="604" cy="400" rx="28" ry="6" fill="${foodLvl ? '#9a6232' : '#c95f84'}"/>
        ${foodLvl ? '<g fill="#7a4a22"><circle cx="596" cy="398" r="3"/><circle cx="606" cy="397" r="3"/><circle cx="614" cy="399" r="2.6"/></g>' : ''}
        <path d="M640 400 h56 l-8 22 h-40z" fill="#7aa6c2"/><ellipse cx="668" cy="400" rx="${16 + water}" ry="5" fill="${water > 2 ? '#bfe6f5' : '#5d88a3'}"/>
        <text x="636" y="444" text-anchor="middle" font-family="Baloo 2, sans-serif" font-size="15" font-weight="800" fill="#7a5c4e">SIMBA</text>
        ${fluff(s)}${vignette}`;
    },
    salon(s) {
      const tv = s.time >= 8 * 60 && s.time <= 19 * 60 && !isWeekend(s.day);
      const lamp = nightLevel(s.time) > 0.3;
      let books = '';
      const bc = ['#c9496f', '#5f8f45', '#e8b73a', '#4a7bd0', '#8a5bc9', '#e57f22'];
      for (let r = 0; r < 3; r++) { let x = 614; for (let i = 0; i < 6; i++) { const h = 22 + ((i * 7 + r * 3) % 9); books += `<rect x="${x}" y="${132 + r * 46 - h}" width="11" height="${h}" fill="${bc[(i + r) % 6]}"/>`; x += 13; } }
      return `${sceneDefs(s, '#efd8dc', '#e2c3c9', '#b58257', '#8c5f3b')}
        ${wallpaper('rgba(255,255,255,.16)')}
        <rect x="0" y="210" width="800" height="112" fill="rgba(160,90,110,.12)"/><rect x="0" y="206" width="800" height="6" fill="#d9b8bf"/>
        ${woodFloor()}
        ${windowSvg(330, 56, 136, 116, s, '#e7c3cc')}
        ${photo(150, 90, 64, 64)}${frame(232, 104, 40, 40, '<path d="M236 140 l12 -18 l8 10 l6 -6 l6 14z" fill="#7fbb5e"/><circle cx="262" cy="114" r="5" fill="#ffd36b"/>')}
        <rect x="600" y="40" width="96" height="290" rx="4" fill="#8f5f3f"/><rect x="606" y="46" width="84" height="278" fill="#6d4630"/>
        ${[0, 1, 2, 3].map((r) => `<rect x="606" y="${132 + r * 46}" width="84" height="6" fill="#8f5f3f"/>`).join('')}${books}
        <g><rect x="634" y="250" width="30" height="20" rx="4" fill="#fffaf2"/><path d="M640 256 q9 -8 18 0" stroke="#e05b7b" stroke-width="3" fill="none"/></g>
        ${persianRug(380, 400, 460, 70)}
        <rect x="470" y="226" width="110" height="8" rx="3" fill="#7c533a"/><rect x="478" y="234" width="8" height="96" fill="#7c533a"/><rect x="564" y="234" width="8" height="96" fill="#7c533a"/><rect x="478" y="290" width="94" height="6" fill="#7c533a"/>
        <rect x="478" y="160" width="94" height="62" rx="6" fill="#2f2b46"/><rect x="484" y="166" width="82" height="50" rx="3" fill="${tv ? '#9fd0e8' : '#3d3a5c'}"/>
        ${tv ? '<path d="M490 206 l14 -16 l10 10 l8 -8 l18 14z" fill="#7fbb5e"/><circle cx="550" cy="180" r="6" fill="#ffd36b"/>' : '<path d="M488 170 l30 20" stroke="rgba(255,255,255,.12)" stroke-width="6"/>'}
        <rect x="518" y="220" width="14" height="6" fill="#2f2b46"/>
        <ellipse cx="250" cy="348" rx="180" ry="9" fill="rgba(0,0,0,.14)"/>
        <rect x="92" y="196" width="316" height="84" rx="34" fill="#d98aa5"/>
        <rect x="80" y="246" width="340" height="88" rx="30" fill="#cf7c99"/>
        <rect x="104" y="240" width="140" height="44" rx="18" fill="#e29ab3"/><rect x="256" y="240" width="140" height="44" rx="18" fill="#e29ab3"/>
        <rect x="64" y="236" width="54" height="98" rx="24" fill="#bd6886"/><rect x="384" y="236" width="54" height="98" rx="24" fill="#bd6886"/>
        <path d="M112 214 q40 -10 80 0 M260 214 q40 -10 80 0" stroke="rgba(255,255,255,.25)" stroke-width="5" fill="none" stroke-linecap="round"/>
        <rect x="132" y="206" width="58" height="46" rx="16" fill="#f6d9b8" transform="rotate(-8 161 229)"/><rect x="300" y="208" width="54" height="44" rx="16" fill="#fff3c4" transform="rotate(6 327 230)"/>
        <path d="M330 250 q30 30 60 20 l10 50 q-40 6 -70 -10z" fill="#9cc2d9"/><path d="M340 262 l50 50 M354 256 l40 40" stroke="#fff" stroke-width="3" opacity=".6"/>
        <rect x="86" y="332" width="12" height="12" rx="3" fill="#7c533a"/><rect x="404" y="332" width="12" height="12" rx="3" fill="#7c533a"/>
        ${lampGlow(s, 40, 120, 120)}<rect x="36" y="140" width="6" height="190" fill="#3a3550"/><path d="M14 146 l12 -46 h30 l12 46z" fill="${lamp ? '#ffe3a3' : '#f4e2c4'}"/><ellipse cx="39" cy="330" rx="18" ry="5" fill="#3a3550"/>
        <circle cx="460" cy="414" r="12" fill="#d8e650"/><path d="M450 408 q10 8 20 0" stroke="#fff" stroke-width="2" fill="none"/>
        ${has('corde') ? '<path d="M510 426 q20 -16 40 0 q20 16 40 0" stroke="#4a7bd0" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M510 426 q20 -16 40 0 q20 16 40 0" stroke="#fff" stroke-width="2" stroke-dasharray="4 6" fill="none"/>' : ''}
        ${has('robot') ? '<g><ellipse cx="660" cy="432" rx="36" ry="11" fill="#2f2b46"/><ellipse cx="660" cy="426" rx="30" ry="9" fill="#6f6a92"/><circle cx="660" cy="424" r="3" fill="#7ee08a"/></g>' : ''}
        ${has('plante') ? plant(730, 318, 1.05) : ''}
        ${fluff(s)}${vignette}`;
    },
    dehors(s) {
      const [a, b] = skyColor(s.time);
      const night = nightLevel(s.time) > 0.4, w = s.today.weather, snow = w === 'neige', rain = w === 'pluie';
      const sedanHome = !(s.time >= 9 * 60 && s.time < 12 * 60 && !isWeekend(s.day));
      // Alborz range with snowy peaks
      const ridge = 'M0 210 L60 170 L110 190 L170 120 L220 160 L270 110 L330 150 L390 95 L450 140 L500 118 L560 160 L620 105 L690 150 L740 128 L800 165 V260 H0Z';
      const snowCaps = 'M150 140 L170 120 L190 136 L178 132 L168 142Z M250 128 L270 110 L292 128 L280 124 L270 134Z M368 116 L390 95 L414 116 L400 112 L390 124 L380 112Z M600 124 L620 105 L642 124 L630 120 L620 130Z M482 134 L500 118 L516 132 L504 130Z';
      let city = '';
      const bl = [[230, 70, 46], [282, 96, 40], [326, 60, 52], [384, 110, 38], [430, 76, 50], [560, 88, 44], [610, 64, 56], [672, 100, 40], [716, 72, 60]];
      bl.forEach(([x, h, wd], i) => {
        city += `<rect x="${x}" y="${300 - h}" width="${wd}" height="${h}" fill="${night ? '#2a2946' : ['#c9d2de', '#b7c3d2', '#d4dbe5'][i % 3]}"/>`;
        for (let wy = 306 - h; wy < 292; wy += 14) for (let wx = x + 6; wx < x + wd - 6; wx += 11)
          city += `<rect x="${wx}" y="${wy}" width="5" height="7" fill="${night ? ((wx * 3 + wy) % 5 ? '#ffcf73' : '#34334f') : 'rgba(255,255,255,.6)'}"/>`;
      });
      // the family tower: 6 floors, they live on the 5th
      let tower = `<rect x="18" y="58" width="190" height="290" fill="${night ? '#3a3858' : '#f2ece2'}"/><rect x="18" y="58" width="190" height="10" fill="${night ? '#2f2d4a' : '#ddd3c4'}"/>`;
      for (let f = 0; f < 6; f++) {
        const y = 300 - f * 44;
        tower += `<rect x="26" y="${y + 30}" width="174" height="5" fill="${night ? '#2f2d4a' : '#d8cdbc'}"/>`;
        for (let k = 0; k < 4; k++) {
          const lit = night ? ((f + k) % 3 !== 0) : false;
          const home = f === 4 && k === 1;
          tower += `<rect x="${34 + k * 42}" y="${y}" width="30" height="26" rx="2" fill="${home && night ? '#ffd27a' : lit ? '#ffcf73' : night ? '#24233c' : '#a9c4d8'}"/>`;
          if (home) tower += `<circle cx="${49 + k * 42}" cy="${y + 20}" r="5" fill="#e38c30"/><circle cx="${46 + k * 42}" cy="${y + 16}" r="2.4" fill="#e38c30"/><circle cx="${52 + k * 42}" cy="${y + 16}" r="2.4" fill="#e38c30"/>`;
        }
        tower += `<rect x="${30 + 42}" y="${y + 24}" width="38" height="4" fill="${night ? '#55537a' : '#bfb3a2'}"/>`;
      }
      tower += `<rect x="90" y="300" width="46" height="48" rx="3" fill="${night ? '#ffd27a' : '#7d553d'}"/><rect x="80" y="294" width="66" height="8" rx="3" fill="${night ? '#2f2d4a' : '#c4b6a2'}"/>`;
      const milad = `<g fill="${night ? '#2a2946' : '#8d9bb0'}"><rect x="514" y="94" width="8" height="206"/><ellipse cx="518" cy="132" rx="22" ry="12"/><rect x="500" y="124" width="36" height="16" rx="6"/><rect x="516" y="54" width="4" height="44"/><path d="M496 300 l22 -60 l22 60z"/></g>
        ${night ? '<g fill="#ffcf73"><circle cx="506" cy="132" r="2"/><circle cx="518" cy="134" r="2"/><circle cx="530" cy="132" r="2"/><circle cx="518" cy="56" r="2.4" fill="#ff6b6b"/></g>' : ''}`;
      const chenar = (x, y, r) => `<g><rect x="${x - 7}" y="${y}" width="14" height="${r * 2}" fill="#d9cdb4"/><path d="M${x - 7} ${y + 10} h7 v8 h-7z M${x} ${y + r} h7 v10 h-7z M${x - 7} ${y + r * 1.5} h6 v8 h-6z" fill="#a49478"/>
        <circle cx="${x}" cy="${y - 6}" r="${r}" fill="${snow ? '#f2f5f8' : night ? '#2c4a2e' : '#6aa04c'}"/><circle cx="${x - r * 0.65}" cy="${y + 4}" r="${r * 0.6}" fill="${snow ? '#ffffff' : night ? '#2f4f31' : '#5f9a4c'}"/><circle cx="${x + r * 0.6}" cy="${y}" r="${r * 0.62}" fill="${snow ? '#ffffff' : night ? '#355a35' : '#7fbb5e'}"/></g>`;
      const car4x4 = `<g><ellipse cx="540" cy="350" rx="80" ry="7" fill="rgba(0,0,0,.2)"/>
        <rect x="470" y="300" width="146" height="44" rx="8" fill="#f7f7f5"/><path d="M488 300 l14 -30 h88 l14 30z" fill="#f2f2f0"/>
        <path d="M500 298 l10 -22 h32 v22z M548 298 v-22 h36 l10 22z" fill="${night ? '#2c3150' : '#9fc3dc'}"/>
        ${snow ? '<rect x="492" y="262" width="104" height="8" rx="4" fill="#fff"/>' : ''}
        <rect x="466" y="318" width="10" height="10" rx="2" fill="#ffcf73"/><rect x="608" y="316" width="10" height="12" rx="2" fill="#e05b5b"/>
        <circle cx="620" cy="318" r="12" fill="#2f2b36"/><circle cx="620" cy="318" r="6" fill="#c9cfd3"/>
        <circle cx="500" cy="344" r="14" fill="#2f2b36"/><circle cx="500" cy="344" r="6" fill="#c9cfd3"/><circle cx="590" cy="344" r="14" fill="#2f2b36"/><circle cx="590" cy="344" r="6" fill="#c9cfd3"/>
        <path d="M478 312 h128" stroke="#dcdcd8" stroke-width="2"/><rect x="520" y="306" width="12" height="3" rx="1.5" fill="#bfc4c9"/></g>`;
      const sedan = sedanHome ? `<g><ellipse cx="700" cy="350" rx="78" ry="6" fill="rgba(0,0,0,.18)"/>
        <path d="M628 330 q0 -16 18 -18 l20 -22 h62 l24 22 q22 2 22 18 v12 h-146z" fill="#f7f7f5"/>
        <path d="M672 308 l10 -14 h24 v14z M712 308 v-14 h14 l14 14z" fill="${night ? '#2c3150' : '#9fc3dc'}"/>
        ${snow ? '<path d="M668 290 h62 l6 6 h-74z" fill="#fff"/>' : ''}
        <circle cx="660" cy="344" r="12" fill="#2f2b36"/><circle cx="660" cy="344" r="5" fill="#c9cfd3"/><circle cx="742" cy="344" r="12" fill="#2f2b36"/><circle cx="742" cy="344" r="5" fill="#c9cfd3"/>
        <rect x="626" y="326" width="8" height="6" rx="2" fill="#ffcf73"/><rect x="766" y="324" width="8" height="8" rx="2" fill="#e05b5b"/></g>` : '';
      let tiles = '';
      for (let x = 0; x < 800; x += 50) tiles += `<path d="M${x} 372 L${x - 30 + (x - 400) * 0.2} 450" stroke="rgba(0,0,0,.07)" stroke-width="2"/>`;
      for (const y of [392, 420]) tiles += `<path d="M0 ${y} H800" stroke="rgba(0,0,0,.07)" stroke-width="2"/>`;
      return `<defs><linearGradient id="skyOut" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
          <linearGradient id="mtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${night ? '#3a3a62' : '#9aa6c0'}"/><stop offset="1" stop-color="${night ? '#2a2a48' : '#c7cfdf'}"/></linearGradient>
          <radialGradient id="sc-glow"><stop offset="0" stop-color="#ffd98a" stop-opacity=".7"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
          <radialGradient id="sunG"><stop offset="0" stop-color="#fff2b0"/><stop offset=".5" stop-color="#ffe08a" stop-opacity=".6"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient></defs>
        <rect width="800" height="450" fill="url(#skyOut)"/>
        ${night ? Array.from({ length: 18 }, (_, i) => `<circle cx="${(i * 97 + 40) % 800}" cy="${(i * 37) % 90 + 8}" r="${i % 4 ? 1.1 : 1.8}" fill="#fff" opacity=".8"/>`).join('') + '<circle cx="680" cy="56" r="22" fill="#fff3c9"/><circle cx="690" cy="50" r="20" fill="' + a + '"/>'
          : w === 'soleil' ? '<circle cx="680" cy="60" r="70" fill="url(#sunG)"/><circle cx="680" cy="60" r="24" fill="#ffe9a0"/>' : ''}
        ${!night ? `<g fill="#fff" opacity="${rain ? 0.7 : 0.85}"><ellipse cx="300" cy="60" rx="56" ry="16"/><ellipse cx="330" cy="50" rx="34" ry="16"/><ellipse cx="580" cy="80" rx="44" ry="12"/></g>` : ''}
        <path d="${ridge}" fill="url(#mtn)"/><path d="${snowCaps}" fill="#fff" opacity="${night ? 0.6 : 0.95}"/>
        ${rain ? '<rect width="800" height="300" fill="#6b7a8e" opacity=".25"/>' : ''}
        ${milad}${city}
        <rect x="0" y="296" width="800" height="62" fill="${night ? '#3a3a48' : snow ? '#e8ecf0' : '#7c7f8a'}"/>
        <path d="M0 326 H800" stroke="${night ? '#5a5a68' : '#f4f4f4'}" stroke-width="3" stroke-dasharray="26 22"/>
        ${tower}
        ${car4x4}${sedan}
        <rect x="0" y="356" width="800" height="14" fill="#9a9488"/><rect x="0" y="358" width="800" height="8" fill="${rain ? '#7aa6c2' : snow ? '#eef3f6' : '#8fb2c4'}"/>
        <rect x="0" y="370" width="800" height="80" fill="${snow ? '#f1f4f7' : night ? '#6d6a66' : '#d8cfc2'}"/>${tiles}
        ${chenar(250, 250, 36)}${chenar(430, 262, 30)}${chenar(770, 250, 36)}
        ${night ? '<circle cx="340" cy="250" r="80" fill="url(#sc-glow)"/>' : ''}
        <rect x="337" y="250" width="6" height="122" fill="#3a3a4c"/><path d="M340 250 q0 -16 18 -16" stroke="#3a3a4c" stroke-width="5" fill="none"/><rect x="352" y="232" width="18" height="8" rx="3" fill="${night ? '#ffe3a3' : '#d9d9e0'}"/>
        <g><rect x="640" y="380" width="44" height="54" rx="4" fill="#2f6f9e"/><text x="662" y="404" text-anchor="middle" font-family="Nunito, sans-serif" font-size="9" font-weight="800" fill="#fff">کوچه</text><text x="662" y="420" text-anchor="middle" font-family="Nunito, sans-serif" font-size="8" font-weight="800" fill="#fff">Narges</text><rect x="660" y="434" width="4" height="16" fill="#555"/></g>
        ${rain ? '<ellipse cx="250" cy="430" rx="38" ry="8" fill="#9db7c8" opacity=".8"/><ellipse cx="560" cy="440" rx="26" ry="6" fill="#9db7c8" opacity=".8"/>' : ''}
        ${snow ? '<g><circle cx="720" cy="420" r="18" fill="#fff"/><circle cx="720" cy="394" r="12" fill="#fff"/><circle cx="716" cy="391" r="1.8" fill="#333"/><circle cx="724" cy="391" r="1.8" fill="#333"/><path d="M720 395 l8 2 l-8 2z" fill="#e57f22"/></g>' : ''}`;
    },
  };

  /* ------------------------------------------------------------------ */
  /* Effects: particles, weather, toasts                                 */
  /* ------------------------------------------------------------------ */
  const GLYPH = { heart: '♥', spark: '✦', money: '' };
  function burstAt(kind, xPct, yPct, n) {
    const box = $('particles');
    if (!box) return;
    for (let i = 0; i < n; i++) {
      const el = document.createElement('span');
      el.className = 'pt ' + kind;
      el.textContent = GLYPH[kind] || '';
      el.style.left = (xPct + (rnd() - 0.5) * 10) + '%';
      el.style.top = (yPct + (rnd() - 0.5) * 10) + '%';
      el.style.setProperty('--dx', ((rnd() - 0.5) * 120).toFixed(0) + 'px');
      el.style.setProperty('--dy', (-60 - rnd() * 90).toFixed(0) + 'px');
      el.style.setProperty('--rot', ((rnd() - 0.5) * 90).toFixed(0) + 'deg');
      el.style.animationDelay = (i * 0.04).toFixed(2) + 's';
      box.appendChild(el);
      setTimeout(() => el.remove(), 1800 + i * 40);
    }
  }
  function moneyFx(n) {
    const box = $('particles');
    const el = document.createElement('span');
    el.className = 'pt money'; el.textContent = (n > 0 ? '+$' : '-$') + Math.abs(n);
    el.style.left = posOf('nena')[0] + '%'; el.style.top = '30%';
    el.style.setProperty('--dx', '0px'); el.style.setProperty('--dy', '-70px'); el.style.setProperty('--rot', '0deg');
    box.appendChild(el); setTimeout(() => el.remove(), 1600);
    const w = document.querySelector('.wallet'); w.classList.remove('bump'); void w.offsetWidth; w.classList.add('bump');
    snd('coin');
  }

  // rain / snow on the outdoor scene
  const fx = { cv: null, cx: null, drops: [], run: false };
  function weatherFx() {
    const want = S.room === 'dehors' && (S.today.weather === 'pluie' || S.today.weather === 'neige') && !modalOpen;
    if (!fx.cv) { fx.cv = $('weather-fx'); fx.cx = fx.cv.getContext('2d'); }
    if (want && !fx.run) { fx.run = true; requestAnimationFrame(fxLoop); }
    if (!want && fx.run) { fx.run = false; fx.cx.clearRect(0, 0, fx.cv.width, fx.cv.height); }
  }
  let fxLast = 0;
  function fxLoop(t) {
    if (!fx.run) return;
    const c = fx.cv, r = c.getBoundingClientRect();
    if (c.width !== Math.round(r.width) || c.height !== Math.round(r.height)) {
      c.width = Math.round(r.width); c.height = Math.round(r.height);
      fx.drops = Array.from({ length: 90 }, () => ({ x: rnd() * c.width, y: rnd() * c.height, v: 0.6 + rnd() * 0.6 }));
    }
    const dt = Math.min(0.05, (t - fxLast) / 1000 || 0.016); fxLast = t;
    const snow = S.today.weather === 'neige', g = fx.cx;
    g.clearRect(0, 0, c.width, c.height);
    g.strokeStyle = 'rgba(225,238,255,.65)'; g.fillStyle = '#fff'; g.lineWidth = 1.4;
    for (const d of fx.drops) {
      d.y += (snow ? 40 : 520) * d.v * dt; d.x += snow ? Math.sin((d.y + d.v * 100) / 25) * 0.4 : -60 * dt;
      if (d.y > c.height) { d.y = -10; d.x = rnd() * c.width; }
      if (snow) { g.beginPath(); g.arc(d.x, d.y, 1.6 + d.v * 1.6, 0, Math.PI * 2); g.fill(); }
      else { g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(d.x - 3, d.y + 11); g.stroke(); }
    }
    requestAnimationFrame(fxLoop);
  }

  function toast(msg, kind) {
    const box = $('toasts');
    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.textContent = msg;
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(), 450); }, 3600);
  }
  function flushToasts() { while (pendingToasts.length) toast(...pendingToasts.shift()); }

  /* ------------------------------------------------------------------ */
  /* Achievements                                                             */
  /* ------------------------------------------------------------------ */
  const achvQueue = [];
  let achvShowing = false;
  function checkAchievements() {
    for (const a of ACHIEVEMENTS) {
      if (!S.achievements.includes(a.id) && a.test(S)) { S.achievements.push(a.id); achvQueue.push(a); }
    }
    showNextAchv();
  }
  function showNextAchv() {
    if (achvShowing || !achvQueue.length) return;
    const a = achvQueue.shift();
    achvShowing = true;
    $('achv-name').textContent = a.name;
    const pop = $('achv-pop');
    pop.hidden = false; pop.style.animation = 'none'; void pop.offsetWidth; pop.style.animation = '';
    snd('fanfare'); buzz([30, 50, 30]);
    setTimeout(() => { pop.hidden = true; achvShowing = false; showNextAchv(); }, 3300);
    $('menu-badge').hidden = false;
  }

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  const GAUGES = {
    nena: [['faim', '🍽️', 'Food'], ['energie', '⚡', 'Pep'], ['hygiene', '🧼', 'Clean'], ['moral', '💗', 'Mood']],
    simba: [['ventre', '🍖', 'Food'], ['eau', '💧', 'Water'], ['pipi', '🌳', 'Potty'], ['pelage', '✨', 'Coat'], ['bonheur', '🎾', 'Joy']],
  };
  const barColor = (v) => (v < 25 ? 'var(--bad)' : v < 50 ? 'var(--warn)' : 'var(--good)');

  function renderHud() {
    $('hud-weekday').textContent = `${weekday(S.day)} · Day ${S.day}`;
    $('hud-time').textContent = hh(S.time);
    $('hud-weather').textContent = WEATHER[S.today.weather].icon;
    $('hud-weather').title = WEATHER[S.today.weather].label;
    $('hud-money').textContent = S.money;
    $('btn-speed').textContent = S.speed === 0 ? '❚❚' : S.speed === 1 ? '▶' : '▶▶';
    $('btn-speed').setAttribute('aria-label', S.speed === 0 ? 'Time paused' : S.speed === 1 ? 'Normal speed' : 'Fast speed');
  }
  function renderGauges() {
    for (const who of ['nena', 'simba']) {
      $('g-' + who).innerHTML = GAUGES[who].map(([k, ico, label]) => {
        const v = Math.round(S[who][k]);
        return `<div class="gauge${v < 25 ? ' low' : ''}"><div class="gauge-ring" style="--v:${v};--c:${barColor(v)}"><i>${ico}</i></div><small>${label}</small></div>`;
      }).join('');
    }
  }

  let spriteKeys = { nena: '', simba: '' };
  function renderActors() {
    const nk = `${S.dressed}|${S.outfit}`;
    if (spriteKeys.nena !== nk) { $('nena-sprite').innerHTML = window.Art.nena({ dressed: S.dressed, outfit: S.outfit }); spriteKeys.nena = nk; }
    const sk = `${S.collar}|${S.muddy}`;
    if (spriteKeys.simba !== sk) { $('simba-sprite').innerHTML = window.Art.simba({ collar: S.collar, muddy: S.muddy }); spriteKeys.simba = sk; }
  }

  function npcNow() {
    const t = S.time, r = S.room;
    if (r === 'cuisine' && t >= 8 * 60 && t <= 22 * 60) {
      const lunch = t >= 12.5 * 60 && t <= 15 * 60 && !S.today.momLunch, dinner = t >= 19 * 60 && t <= 21.5 * 60 && !S.today.momDinner;
      return { who: 'fariba', x: 86, mood: 'happy', bubble: lunch ? 'Lunch is ready! 🍚' : dinner ? 'Dinner is ready! 🍲' : '' };
    }
    if (r === 'salon' && babaHome()) return { who: 'mohsen', x: 86, mood: 'happy', bubble: S.today.babaNap ? '' : 'Simba jan, come to Baba!' };
    if (r === 'dehors' && S.family.out) return { who: 'nasim', x: 86, mood: 'angry', bubble: 'Don’t look at me. 😠' };
    if (r === 'hall' && !S.family.out && t >= 9 * 60 && t <= 23 * 60) return { who: 'nasim', x: 78, mood: 'angry', bubble: '' };
    return null;
  }
  let npcKey = '';
  function renderNpc() {
    const el = $('npc');
    if (!el) return;
    const n = npcNow();
    if (!n) { el.hidden = true; npcKey = ''; return; }
    el.hidden = false;
    const k = n.who + n.mood;
    if (k !== npcKey) { $('npc-sprite').innerHTML = window.Art.person(n.who, { mood: n.mood }); npcKey = k; }
    el.style.left = n.x + '%';
    el.classList.toggle('small', n.who === 'nasim');
    const b = $('npc-bubble');
    b.hidden = !n.bubble || busy; b.textContent = n.bubble;
  }
  function renderScene() {
    $('scene-bg').innerHTML = DRAW[S.room](S);
    const lvl = S.room === 'dehors' ? nightLevel(S.time) * 0.55 : nightLevel(S.time) * 0.7;
    $('scene').style.setProperty('--nightlvl', lvl.toFixed(2));
    window.Sound && window.Sound.setNight(nightLevel(S.time) > 0.4);
    renderActors();
    const pos = ROOMS[S.room];
    const nena = $('nena'), simba = $('simba');
    nena.style.left = pos.nena[0] + '%'; nena.style.bottom = pos.nena[1] + '%';
    simba.style.left = pos.simba[0] + '%'; simba.style.bottom = pos.simba[1] + '%';
    nena.classList.toggle('sad', S.nena.moral < 30);
    simba.classList.toggle('happy', S.simba.bonheur >= 60 && !S.pet.sick);
    simba.classList.toggle('sick', S.pet.sick);
    const away = S.family.out;
    simba.hidden = away && S.room !== 'dehors';
    if (away && S.room === 'dehors') { simba.style.left = '68%'; }
    renderNpc();

    const d = S.simba;
    const dogNeeds = [[d.pipi, 'Walkies! 🌳'], [d.eau, 'Thirsty… 💧'], [d.ventre, 'Hungry! 🍖'], [d.bonheur, 'Play with me 🎾'], [d.pelage, 'Brush me ✨']]
      .filter(([v]) => v < 30).sort((x, y) => x[0] - y[0]);
    const sb = $('simba-bubble');
    if (busy) sb.hidden = true;
    else if (beh.bubble) { sb.hidden = false; sb.textContent = beh.bubble; }
    else if (S.pet.sick) { sb.hidden = false; sb.textContent = 'I don’t feel well 🤒'; }
    else if (S.muddy) { sb.hidden = false; sb.textContent = 'All muddy 🛁'; }
    else if (dogNeeds.length) { sb.hidden = false; sb.textContent = dogNeeds[0][1]; }
    else sb.hidden = true;

    const n = S.nena;
    const hers = [[n.energie, 'I’m exhausted…'], [n.faim, 'I’m hungry…'], [n.hygiene, 'Shower time?'], [n.moral, 'Feeling down…']]
      .filter(([v]) => v < 25).sort((x, y) => x[0] - y[0]);
    const nb = $('nena-bubble');
    if (busy) nb.hidden = true;
    else if (hers.length) { nb.hidden = false; nb.textContent = hers[0][1]; }
    else if (S.time >= 22 * 60) { nb.hidden = false; nb.textContent = 'It’s late, bedtime!'; }
    else nb.hidden = true;
    weatherFx();
  }

  function isTodo(a) {
    const id = val(a.task, S);
    if (!id) return false;
    if (id === 'medicine') return true;
    const t = S.today.tasks.find((x) => x.id === id);
    if (!t) return false;
    if (TASKS[id].check) return !TASKS[id].check(S) && S.maison.vaisselle > 0;
    return t.done < t.need;
  }
  const NO_SIMBA_OK = ['eau', 'gamelle', 'cake', 'gift', 'croquettes', 'medicine'];
  const availOf = (a) => {
    if (S.family && S.family.out && a.tag === 'simba' && !NO_SIMBA_OK.includes(a.id)) return S.room === 'dehors' ? 'Nasim has Simba. She says: “MY walk.”' : 'Simba is out with Nasim.';
    return a.avail ? a.avail(S) : true;
  };
  const roomHasTodo = (room) => visibleActions(room).some((a) => isTodo(a) && availOf(a) === true);

  function renderRooms() {
    $('rooms').innerHTML = Object.entries(ROOMS).map(([id, r]) =>
      `<button type="button" class="tab" data-room="${id}" aria-current="${S.room === id}" ${busy ? 'disabled' : ''}>
        <span class="tab-ico" aria-hidden="true">${r.icon}</span><span>${r.name}</span>
        ${roomHasTodo(id) && S.room !== id ? '<span class="dot" aria-label="task to do"></span>' : ''}</button>`).join('');
  }

  function renderActions() {
    const list = visibleActions(S.room).slice().sort((a, b) => {
      const sa = (availOf(a) === true ? 0 : 2) - (isTodo(a) ? 1 : 0);
      const sb = (availOf(b) === true ? 0 : 2) - (isTodo(b) ? 1 : 0);
      return sa - sb;
    });
    $('actions').innerHTML = list.map((a) => {
      const ok = availOf(a);
      const todo = isTodo(a) && ok === true;
      const tagTxt = { nena: 'Nena', simba: 'Simba', maison: 'Home' }[a.tag];
      return `<button type="button" class="action${ok !== true ? ' locked' : ''}${todo ? ' todo' : ''}" data-action="${a.id}" ${busy ? 'disabled' : ''}>
        <span class="a-top"><span class="a-name">${val(a.name, S)}</span><span class="a-dur">${durOf(a) ? durTxt(durOf(a)) : ''}</span></span>
        <span class="a-desc">${ok === true ? val(a.desc, S) : ok}</span>
        <span class="a-tags"><span class="a-tag ${a.tag}">${tagTxt}</span>${a.mini ? '<span class="a-tag play">Mini-game</span>' : ''}${todo ? '<span class="a-tag todo">To do</span>' : ''}</span>
      </button>`;
    }).join('');
  }

  const taskDone = (t) => (TASKS[t.id].check ? TASKS[t.id].check(S) : t.done >= t.need);
  function renderFab() {
    const ts = S.today.tasks, done = ts.filter(taskDone).length;
    $('tasks-count').textContent = `${done}/${ts.length}`;
    $('btn-tasks').classList.toggle('complete', done === ts.length);
  }

  function render() {
    renderQuest();
    renderHud(); renderGauges(); renderScene(); renderRooms(); renderActions(); renderFab();
    $('room-label').textContent = ROOMS[S.room].name;
    if (sheet.open) renderSheet();
    flushToasts();
  }

  /* ------------------------------------------------------------------ */
  /* Sheets (list, needs, shop, achievements, menu)                  */
  /* ------------------------------------------------------------------ */
  const sheet = { open: false, view: 'tasks', shopCat: 'tenues' };
  const MENU_TABS = [['story', 'Story'], ['tasks', 'Today'], ['simba', 'Simba'], ['needs', 'Needs'], ['shop', 'Shop'], ['achv', 'Awards'], ['menu', 'Settings']];
  function openSheet(view) {
    sheet.open = true; sheet.view = view;
    $('sheet-wrap').hidden = false;
    if (view === 'achv') $('menu-badge').hidden = true;
    renderSheet();
    snd('tab');
  }
  function closeSheet() { sheet.open = false; $('sheet-wrap').hidden = true; }

  function renderSheet() {
    const v = sheet.view;
    $('sheet-title').textContent = { story: 'Story', simba: 'Simba', tasks: 'Today’s list', needs: 'Needs', shop: 'Shop', achv: 'Achievements', menu: 'Settings' }[v];
    $('sheet-tabs').innerHTML = MENU_TABS.map(([id, l]) => `<button type="button" class="stab" role="tab" data-view="${id}" aria-selected="${v === id}">${l}</button>`).join('');
    const body = $('sheet-body');
    if (v === 'tasks') body.innerHTML = sheetTasks();
    else if (v === 'needs') body.innerHTML = sheetNeeds();
    else if (v === 'shop') body.innerHTML = sheetShop();
    else if (v === 'achv') body.innerHTML = sheetAchv();
    else if (v === 'story') body.innerHTML = sheetStory();
    else if (v === 'simba') body.innerHTML = sheetSimba();
    else body.innerHTML = sheetMenu();
  }
  function sheetTasks() {
    const ts = S.today.tasks, done = ts.filter(taskDone).length;
    const w = WEATHER[S.today.weather];
    return `<p><b>${weekday(S.day)}, day ${S.day}</b> · ${w.icon} ${w.label}</p>
      <div class="progress"><div style="width:${(done / ts.length) * 100}%"></div></div>
      <ul class="tasks">${ts.map((t) => {
        const def = TASKS[t.id], ok = taskDone(t);
        return `<li class="task${ok ? ' done' : ''}"><span class="box">${ok ? '✓' : ''}</span>
          <span class="t-label"><span class="who ${def.who}"></span>${def.label}</span>
          <span class="t-count">${t.need > 1 && !def.check ? t.done + '/' + t.need : ''}</span></li>`;
      }).join('')}</ul>
      <p class="tip">90% of tasks = 3 stars. Go to sleep with Simba after 8 PM to end the day. ${w.tip}</p>`;
  }
  function needRow(ico, label, v) {
    const r = Math.round(v);
    return `<div class="need${r < 25 ? ' low' : ''}"><span>${ico}</span><span class="need-name">${label}</span>
      <div class="need-bar"><div class="need-fill" style="width:${r}%;background:${barColor(r)}"></div></div><span class="need-val">${r}</span></div>`;
  }
  function sheetNeeds() {
    return `<h3>Nena</h3>${GAUGES.nena.map(([k, i, l]) => needRow(i, l, S.nena[k])).join('')}
      <h3>Simba · chow chow</h3>${GAUGES.simba.map(([k, i, l]) => needRow(i, l, S.simba[k])).join('')}
      <h3>Home</h3>${needRow('🧹', 'Tidiness', S.maison.proprete)}
      <div class="need"><span>🍽️</span><span class="need-name">Dishes</span><span>${S.maison.vaisselle ? S.maison.vaisselle + ' dirty plate(s)' : 'All clean'}</span><span></span></div>
      <div class="need"><span>🧺</span><span class="need-name">Laundry</span><span>${S.maison.linge ? S.maison.linge + ' load(s)' : 'Basket empty'}</span><span></span></div>
      <h3>Supplies</h3>
      <div class="stats-grid"><div class="stat"><b>${S.kibble}</b><small>Kibble</small></div><div class="stat"><b>${S.food}</b><small>Meals</small></div><div class="stat"><b>$${S.money}</b><small>Money</small></div></div>
      <p class="tip">Chow chows have a blue-black tongue, a thick double coat and a tail curled over the back. They shed a lot: brush Simba every day!</p>`;
  }
  function itemArt(it) {
    if (it.cat === 'tenues') return window.Art.nena({ dressed: true, outfit: it.id, eyes: 'open' });
    if (it.cat === 'simba') return window.Art.simba({ collar: it.id, eyes: 'open', tongue: false });
    return `<span class="big">${it.icon}</span>`;
  }
  function sheetShop() {
    const cats = [['tenues', 'Nena’s outfits'], ['simba', 'For Simba'], ['maison', 'Home']];
    const items = SHOP.filter((i) => i.cat === sheet.shopCat);
    let extra = '';
    if (sheet.shopCat === 'tenues') extra = `<button type="button" class="item${S.outfit === 'basique' ? ' equipped owned' : ' owned'}" data-equip="basique">
      <div class="item-art">${window.Art.nena({ dressed: true, outfit: 'basique', eyes: 'open' })}</div><b>Everyday outfit</b><small>Striped sweater and jeans.</small>
      <span class="price">${S.outfit === 'basique' ? 'Wearing' : 'Wear'}</span></button>`;
    if (sheet.shopCat === 'simba') extra = `<button type="button" class="item owned${!S.collar ? ' equipped' : ''}" data-equip="none">
      <div class="item-art">${window.Art.simba({ eyes: 'open', tongue: false })}</div><b>No accessory</b><small>Au naturel.</small>
      <span class="price">${!S.collar ? 'Wearing' : 'Remove'}</span></button>`;
    return `<p>Wallet: <b>$${S.money}</b>. Earn money by working from home.</p>
      <div class="sheet-tabs" style="padding:0 0 10px">${cats.map(([id, l]) => `<button type="button" class="stab" data-cat="${id}" aria-selected="${sheet.shopCat === id}">${l}</button>`).join('')}</div>
      <div class="shop">${extra}${items.map((it) => {
        const owned = has(it.id);
        const equipped = S.outfit === it.id || S.collar === it.id;
        const cant = !owned && S.money < it.price;
        const label = owned ? (it.cat === 'maison' ? 'Installed' : equipped ? 'Wearing' : 'Wear') : '$' + it.price;
        return `<button type="button" class="item${owned ? ' owned' : ''}${equipped ? ' equipped' : ''}${cant ? ' cant' : ''}" data-item="${it.id}">
          <div class="item-art">${itemArt(it)}</div><b>${it.name}</b><small>${it.desc}</small><span class="price">${label}</span></button>`;
      }).join('')}</div>`;
  }
  function sheetAchv() {
    const n = S.achievements.length;
    return `<p><b>${n} / ${ACHIEVEMENTS.length}</b> achievements unlocked</p>
      <div class="progress"><div style="width:${(n / ACHIEVEMENTS.length) * 100}%"></div></div>
      <div class="achs">${ACHIEVEMENTS.map((a) => {
        const on = S.achievements.includes(a.id);
        return `<div class="ach${on ? ' on' : ''}"><span class="medal">${on ? '★' : '?'}</span><div><b>${a.name}</b><small>${a.desc}</small></div></div>`;
      }).join('')}</div>`;
  }
  function bondInfo() {
    let cur = BONDS[0], next = null;
    for (let i = 0; i < BONDS.length; i++) if (S.stars >= BONDS[i][0]) { cur = BONDS[i]; next = BONDS[i + 1] || null; }
    return { cur, next, pct: next ? ((S.stars - cur[0]) / (next[0] - cur[0])) * 100 : 100 };
  }
  function sheetMenu() {
    const b = bondInfo();
    const sw = (on) => `<span class="switch${on ? ' on' : ''}" aria-hidden="true"></span>`;
    return `<h3>Bond · ${S.stars} ★</h3>
      <p class="bond-title">${b.cur[1]}</p>
      <div class="progress"><div style="width:${b.pct}%"></div></div>
      <p style="font-size:.82rem;color:var(--cocoa-soft)">${b.next ? `${b.next[0] - S.stars} more ★ to reach “${b.next[1]}”` : 'Maximum level reached!'}</p>
      <div class="stats-grid">
        <div class="stat"><b>${S.counters.walks}</b><small>Walks</small></div>
        <div class="stat"><b>${S.counters.pets}</b><small>Pets</small></div>
        <div class="stat"><b>${S.counters.perfect}</b><small>3★ days</small></div>
      </div>
      <h3>Preferences</h3>
      <div class="menu-list">
        <button type="button" class="menu-row" data-set="sound" role="switch" aria-checked="${S.settings.sound}"><span>Sound effects</span>${sw(S.settings.sound)}</button>
        <button type="button" class="menu-row" data-set="music" role="switch" aria-checked="${S.settings.music}"><span>Lo-fi music</span>${sw(S.settings.music)}</button>
        <button type="button" class="menu-row" data-set="haptics" role="switch" aria-checked="${S.settings.haptics}"><span>Vibration</span>${sw(S.settings.haptics)}</button>
        ${installPrompt ? '<button type="button" class="menu-row" data-cmd="install"><span>Install the app<small>Add Nena &amp; Simba to your home screen</small></span><span>⤓</span></button>'
          : '<div class="menu-row"><span>Install on iPhone<small>In Safari: Share button, then “Add to Home Screen”.</small></span></div>'}
        <button type="button" class="menu-row" data-cmd="tutorial"><span>Replay the tutorial</span><span>›</span></button>
        <button type="button" class="menu-row" data-cmd="title"><span>Title screen</span><span>›</span></button>
        <button type="button" class="menu-row" data-cmd="reset"><span style="color:var(--bad)">New game</span><span>›</span></button>
      </div>`;
  }

  function onSheetClick(e) {
    const t = e.target.closest('[data-view],[data-cat],[data-item],[data-equip],[data-set],[data-cmd]');
    if (!t) return;
    if (t.dataset.view) { sheet.view = t.dataset.view; if (sheet.view === 'achv') $('menu-badge').hidden = true; snd('tab'); renderSheet(); return; }
    if (t.dataset.cat) { sheet.shopCat = t.dataset.cat; snd('tab'); renderSheet(); return; }
    if (t.dataset.equip) {
      if (t.dataset.equip === 'basique') S.outfit = 'basique'; else S.collar = null;
      snd('swoosh'); after(); return;
    }
    if (t.dataset.item) { buyOrEquip(t.dataset.item); return; }
    if (t.dataset.set) {
      const k = t.dataset.set; S.settings[k] = !S.settings[k]; applySettings(); snd('click'); save(); renderSheet(); return;
    }
    const cmd = t.dataset.cmd;
    if (cmd === 'install') doInstall();
    if (cmd === 'tutorial') { closeSheet(); startCoach(); }
    if (cmd === 'title') { closeSheet(); showTitle(); }
    if (cmd === 'reset') { closeSheet(); $('confirm-screen').hidden = false; }
  }
  function buyOrEquip(id) {
    const it = SHOP.find((x) => x.id === id);
    if (!has(id)) {
      if (S.money < it.price) { toast(`You need $${it.price - S.money} more for the ${it.name}.`, 'bad'); snd('fail'); return; }
      S.money -= it.price; S.owned.push(id);
      snd('coin'); setTimeout(() => snd('success'), 150); buzz(20);
      toast(`${it.name} purchased!`, 'good');
      burstAt('spark', 50, 40, 12);
    }
    if (it.cat === 'tenues') { S.outfit = id; if (!S.dressed) toast('Dress Nena to see her new outfit.'); }
    if (it.cat === 'simba') S.collar = id;
    checkAchievements();
    after();
  }
  function applySettings() {
    if (!window.Sound) return;
    window.Sound.setEnabled(S.settings.sound || S.settings.music);
    window.Sound.setMusic(S.settings.music);
    soundFx = S.settings.sound;
  }
  let soundFx = true;
  const origPlay = window.Sound ? window.Sound.play : null;
  if (window.Sound) window.Sound.play = (n, arg) => { if (soundFx) origPlay(n, arg); };

  /* ------------------------------------------------------------------ */
  /* Running an action                                                */
  /* ------------------------------------------------------------------ */
  function doAction(id) {
    if (busy || modalOpen || storyActive() || pzOpen()) return;
    const a = ACTIONS.find((x) => x.id === id);
    if (!a) return;
    const ok = availOf(a);
    if (ok !== true) { toast(ok, 'bad'); snd('fail'); buzz(30); return; }
    snd('click'); buzz(8);
    if (!durOf(a)) { a.run(S); after(); return; }

    if (a.mini && window.MiniGames) {
      busy = true;
      window.MiniGames.start(a.mini, {
        collar: S.collar, outfit: S.outfit, trick: nextTrick(S), stubborn: S.pet.stubborn,
        rain: S.today.weather === 'pluie', snow: S.today.weather === 'neige',
        onEnd: (res) => {
          busy = false;
          const alive = advance(durOf(a));
          if (alive) a.run(S, res);
          after();
        },
      });
      return;
    }

    busy = true;
    const nena = $('nena'), simba = $('simba');
    nena.classList.toggle('working', !a.walk && !a.sleepy);
    if (a.walk) { nena.classList.add('walking'); simba.classList.add('walking'); }
    if (a.sleepy) { nena.classList.add('asleep'); simba.classList.add('asleep'); }
    if (a.sfx) snd(a.sfx);
    $('busy-label').textContent = a.verb;
    $('busy').hidden = false;
    renderRooms(); renderActions(); renderScene();

    const start = S.time, total = durOf(a);
    const ms = Math.min(2000, 650 + total * 11);
    const t0 = performance.now();
    const fill = $('busy-fill');
    function frame(now) {
      const p = Math.min(1, (now - t0) / ms);
      fill.style.width = (p * 100) + '%';
      $('busy-time').textContent = hh(start + Math.round(total * p));
      if (p < 1) requestAnimationFrame(frame);
      else finish();
    }
    function finish() {
      if (a.room === 'dehors' && rnd() < 0.15 && S.time < 20 * 60) note('📞 Baba: “' + pick(BABA_DAY) + '”');
      $('busy').hidden = true;
      nena.classList.remove('working', 'walking', 'asleep');
      simba.classList.remove('walking', 'asleep');
      busy = false;
      const alive = advance(total);
      if (alive) a.run(S);
      after();
    }
    requestAnimationFrame(frame);
  }
  const pzOpen = () => !!(window.Puzzle && window.Puzzle.open);
  function after() { clampAll(); checkAchievements(); render(); save(); if (!busy && !modalOpen) storyCheck(); }
  const storyActive = () => !!(window.Story && window.Story.active());
  const storyCheck = () => window.Story && window.Story.check();
  const storyEvent = (n) => setTimeout(() => window.Story && window.Story.event(n), 50);
  const storyLater = (id) => setTimeout(() => window.Story && window.Story.play(id), 50);

  /* ------------------------------------------------------------------ */
  /* Direct interactions                                               */
  /* ------------------------------------------------------------------ */
  let petCool = 0;
  function petSimba() {
    if (busy || modalOpen || storyActive()) return;
    const now = performance.now();
    if (now - petCool < 450) return;
    petCool = now;
    if (behTap()) return;
    const known = learned(S);
    if (known.length && rnd() < 0.3 && !S.pet.sick) {
      const t = pick(known);
      startBeh('trick', `*${TRICK_NAMES[t]}!*`, 2200, t === 'spin' ? 'spin' : t === 'playdead' ? 'belly' : 'trickhop');
      snd('happy'); burstAt('spark', posOf('simba')[0], 45, 5);
      S.counters.pets++; checkAchievements();
      return;
    }
    const el = $('simba');
    el.classList.remove('petted'); void el.offsetWidth; el.classList.add('petted');
    setTimeout(() => el.classList.remove('petted'), 600);
    burstAt('heart', posOf('simba')[0], 50, 4);
    snd(rnd() < 0.3 ? 'bark' : 'happy'); buzz(12);
    S.counters.pets++;
    if (S.today.pets < 10) { S.today.pets++; S.simba.bonheur = clamp(S.simba.bonheur + 2); S.nena.moral = clamp(S.nena.moral + 1); }
    else if (S.today.pets === 10) { S.today.pets++; toast('Simba has had enough pets… for now!'); }
    renderGauges(); checkAchievements();
    if (coach.step === 0 && !$('coach').hidden) nextCoach();
  }
  const NENA_LINES = [
    (s) => s.simba.pipi < 35 && 'I think Simba needs to go out…',
    (s) => !s.dressed && s.time > 9 * 60 && 'I should get dressed.',
    (s) => s.simba.pelage < 40 && 'Orange fur everywhere… brushing time?',
    (s) => s.today.weather === 'pluie' && 'It’s raining… Simba will love the puddles. Not me.',
    (s) => s.today.weather === 'neige' && 'Snow! Simba is going to think he’s a polar bear.',
    (s) => s.money < 25 && 'My wallet is almost empty.',
    () => 'You’re the best, Simba!',
    () => 'Another lovely day, just us two.',
  ];
  function talkNena() {
    if (busy || modalOpen) return;
    const line = NENA_LINES.map((f) => f(S)).find(Boolean);
    const nb = $('nena-bubble');
    nb.hidden = false; nb.textContent = line;
    snd('pop');
    clearTimeout(talkNena.t); talkNena.t = setTimeout(() => renderScene(), 2600);
  }

  /* ------------------------------------------------------------------ */
  /* End of day                                                         */
  /* ------------------------------------------------------------------ */
  function endDay(collapsed) {
    if (modalOpen || storyActive()) return;
    const ts = S.today.tasks, done = ts.filter(taskDone);
    const ratio = done.length / ts.length;
    let stars = ratio >= 0.9 ? 3 : ratio >= 0.65 ? 2 : ratio >= 0.35 ? 1 : 0;
    const notes = [];
    if (collapsed) { stars = Math.max(0, stars - 1); notes.push('Nena passed out from exhaustion on the couch (−1 ★).'); }
    if (S.today.accidents) notes.push(`${S.today.accidents} potty accident(s): take Simba out more often.`);
    if (S.today.mischief) notes.push(`${S.today.mischief} bit(s) of mischief: Simba was bored.`);
    if (S.simba.bonheur >= 80 && S.nena.moral >= 70) notes.push('Nena and Simba fall asleep happy, snuggled up together.');
    const bonus = stars * 5;
    S.money += bonus;
    S.stars += stars;
    S.counters.days++;
    if (stars === 3) S.counters.perfect++;
    if (!S.today.accidents) S.counters.cleanDays++;
    S.history.push({ day: S.day, stars, done: done.length, total: ts.length });
    S.pendingNight = { day: S.day, stars, collapsed, notes, bonus, tasks: ts.map((t) => ({ label: TASKS[t.id].label, ok: taskDone(t) })), bedtime: S.time };
    showNight(S.pendingNight);
    checkAchievements();
    save();
  }
  function showNight(sum) {
    modalOpen = true;
    weatherFx();
    $('night-title').textContent = sum.collapsed ? 'Nena collapsed…' : `Good night, day ${sum.day}!`;
    const done = sum.tasks.filter((t) => t.ok).length;
    $('night-sub').textContent = `In bed at ${hh(sum.bedtime)} · ${done} of ${sum.tasks.length} task(s).`;
    $('night-stars').innerHTML = [0, 1, 2].map((i) => `<span class="${i < sum.stars ? 'on' : ''}">★</span>`).join('');
    $('night-stars').setAttribute('aria-label', sum.stars + ' of 3 stars');
    $('night-gains').innerHTML = `<span>+${sum.stars} ★ bond</span>${sum.bonus ? `<span>+$${sum.bonus} bonus</span>` : ''}<span>${bondInfo().cur[1]}</span>`;
    $('night-list').innerHTML = sum.tasks.map((t) => `<li class="${t.ok ? 'ok' : 'ko'}">${t.ok ? '✓' : '✗'} ${t.label}</li>`).join('');
    $('night-notes').textContent = sum.notes.join(' ');
    $('night-screen').hidden = false;
    setTimeout(() => { for (let i = 0; i < sum.stars; i++) setTimeout(() => snd('coin'), i * 250); }, 200);
  }
  function nextDay() {
    const sum = S.pendingNight;
    const bedtime = sum ? sum.bedtime : 23 * 60;
    const collapsed = sum ? sum.collapsed : false;
    const sleptH = (24 * 60 + DAY_START - bedtime) / 60;
    S.day += 1;
    S.time = collapsed ? 9 * 60 : DAY_START;
    S.nena.energie = clamp((collapsed ? 55 : 25 + sleptH * 9) + (perk('morning') ? 15 : 0));
    S.nena.faim = clamp(S.nena.faim - 30);
    S.nena.hygiene = clamp(S.nena.hygiene - 20);
    S.nena.moral = clamp(S.nena.moral + (sum && sum.stars >= 2 ? 8 : -4));
    S.simba.ventre = clamp(S.simba.ventre - 35);
    S.simba.eau = clamp(S.simba.eau - 40);
    S.simba.pipi = clamp(S.simba.pipi - 55, 15);
    S.simba.bonheur = clamp(S.simba.bonheur + 5);
    S.maison.lit = false; S.maison.linge += 1; S.maison.proprete = clamp(S.maison.proprete - 8);
    S.dressed = false; S.room = 'chambre'; S.family.out = false;
    S.today = makeDay(S.day);
    if (S.muddy) addTask('bain');
    S.pendingNight = null;
    $('night-screen').hidden = true;
    modalOpen = false;
    const w = WEATHER[S.today.weather];
    note(`${weekday(S.day)} · ${w.icon} ${w.label}. Simba wakes you with a nose boop!`);
    if (isWeekend(S.day)) note('It’s the weekend: no work, park day!', 'good');
    if (S.today.tasks.find((t) => t.id === 'veto')) note('Reminder: vet appointment today.');
    if (S.money < 20 && S.kibble < 3) { S.money += 30; note('Grandma sent you $30 “for Simba’s kibble”.', 'good'); }
    snd('bark');
    after();
  }

  /* ------------------------------------------------------------------ */
  /* Tutorial                                                            */
  /* ------------------------------------------------------------------ */
  const COACH = [
    ['#simba', 'This is Simba, your chow chow! Tap him to pet him.', 'top'],
    ['#gauges', 'Nena’s needs on the left, Simba’s on the right. Tap them for details.', 'bottom'],
    ['#rooms', 'Switch rooms here. An orange dot means there’s a task to do.', 'top'],
    ['.tray', 'Pick an action. Every action takes time. “Mini-games” are played with your finger!', 'top'],
    ['#btn-tasks', 'Your list for today. After 8 PM, go to sleep with Simba to earn stars. Enjoy life together!', 'bottom'],
  ];
  const coach = { step: -1, el: null };
  function startCoach() { coach.step = -1; $('coach').hidden = false; nextCoach(); }
  function nextCoach() {
    if (coach.el) coach.el.classList.remove('coach-hl');
    coach.step++;
    if (coach.step >= COACH.length) { endCoach(); return; }
    const [sel, txt, where] = COACH[coach.step];
    coach.el = document.querySelector(sel);
    if (coach.el) coach.el.classList.add('coach-hl');
    $('coach-step').textContent = `${coach.step + 1} / ${COACH.length}`;
    $('coach-text').textContent = txt;
    $('coach').style.alignItems = where === 'top' ? 'flex-start' : 'flex-end';
    $('coach').style.paddingTop = where === 'top' ? 'calc(70px + env(safe-area-inset-top, 0px))' : '20px';
    $('coach-next').textContent = coach.step === COACH.length - 1 ? 'Let’s go!' : 'Next';
    snd('pop');
  }
  function endCoach() {
    if (coach.el) coach.el.classList.remove('coach-hl');
    coach.el = null; coach.step = -1;
    $('coach').hidden = true;
    S.tutorialDone = true; save();
  }

  /* ------------------------------------------------------------------ */
  /* Save                                                                */
  /* ------------------------------------------------------------------ */
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || data.v !== 2 || !data.nena || !data.today) return null;
      const base = newState();
      return Object.assign(base, data, {
        counters: Object.assign(base.counters, data.counters),
        best: Object.assign(base.best, data.best),
        settings: Object.assign(base.settings, data.settings),
        story: data.story ? Object.assign(base.story, data.story, { rel: Object.assign(base.story.rel, data.story.rel), flags: data.story.flags || {} })
          : Object.assign(base.story, { base: data.day - 1 }),
        pet: data.pet ? Object.assign(base.pet, data.pet, { tricks: Object.assign(base.pet.tricks, data.pet.tricks) }) : base.pet,
        album: data.album || [],
        puzzle: Object.assign({ level: 1, stars: {}, perks: [] }, data.puzzle),
        today: Object.assign({ trains: 0, medAM: false, medPM: false, miaWalk: false, nasimWalk: false, babaCall: false, babaCall2: 0, babaToast: false, momLunch: false, momDinner: false, helpMom: 0, nasimTalk: false, babaNap: false, neginRel: false }, data.today),
        family: Object.assign({ out: false, back: 0 }, data.family),
      });
    } catch (e) { return null; }
  }


  /* ------------------------------------------------------------------ */
  /* Family life: Nasim's walks, Baba's calls                            */
  /* ------------------------------------------------------------------ */
  function nasimTake() {
    const f = S.family;
    f.out = true; f.back = S.time + 60 + Math.floor(rnd() * 50);
    S.today.nasimWalk = true;
    endBeh(true);
    note('😠 Nasim grabbed the leash and took Simba out. Without asking.', 'bad');
    snd('swoosh');
    storyEvent('nasim');
    render();
  }
  function nasimReturn() {
    const f = S.family, d = S.simba;
    f.out = false;
    d.pipi = 100; d.bonheur = clamp(d.bonheur + 8);
    S.counters.walks++; credit('promenade');
    const r = rnd();
    if (r < 0.22) { S.muddy = true; addTask('bain'); note('Nasim brought Simba back covered in mud: “He jumped in the jub. Not my fault.”', 'bad'); }
    else if (r < 0.37) { weigh(S, 0.2); note('Nasim: “I gave him half my sandwich. He looked hungry.” (He always looks hungry.)'); }
    else note(pick(['Nasim brought Simba back. “He had fun. Don’t make it weird.”', 'Nasim: “Here’s your dog.” She’s almost smiling.', 'Nasim is back with Simba, and 200 photos on her phone.']), 'good');
    relUp('nasim', 1);
  }
  function familyTick() {
    if (busy || modalOpen || storyActive() || pzOpen()) return;
    const f = S.family, d = S.simba;
    if (!f.out && !S.today.nasimWalk && S.time >= 10 * 60 && S.time <= 19 * 60 && d.pipi < 65 && !S.pet.sick && rnd() < 0.006) nasimTake();
  }
  const BABA_DAY = ['Where are you? Did you eat?', 'Is Simba wearing his collar? Good.', 'Buy sangak bread on the way back!', 'Your sisters don’t answer, so I call you.', 'Don’t let Simba eat things from the street!'];
  function babaCall(second) {
    if (!window.Story) return;
    const steps = second ? [
      { n: '📞 Baba is calling. Again.' },
      { s: 'mohsen', phone: true, m: 'angry', t: 'NENA! Thirty minutes! Your mother is worried, I’m worried, even the doorman is worried! I’m coming down with the car!' },
      { n: 'Nena hurries back up to the 5th floor. Baba is waiting in the doorway in his slippers.' },
      { do: () => { relUp('mohsen', -1); S.nena.moral = clamp(S.nena.moral - 3); S.room = 'hall'; } },
    ] : [
      { n: '📞 Baba is calling…' },
      { s: 'mohsen', phone: true, m: 'neutral', t: pick(['Nena jan, where are you? It’s dark already!', 'Baba, it’s 9 PM. Where are you? Is Simba with you? Did you eat?', 'Hello? Nena? I called Nasim, she didn’t answer. I called Negin, she was asleep. Where are YOU?']) },
      { choice: [
        { t: '“Coming home now, Baba!”', do: () => { relUp('mohsen', 1); S.today.babaCall2 = -1; S.room = 'hall'; }, then: [{ s: 'mohsen', phone: true, t: 'Good girl. Your mother made tea. Walk carefully!' }] },
        { t: '“Five more minutes!”', do: () => { S.today.babaCall2 = S.time + 30; }, then: [{ s: 'mohsen', phone: true, m: 'angry', t: 'Five minutes! I’m counting! In my day we were home before dinner!' }] },
      ] },
    ];
    window.Story.run(steps, () => after());
  }
  setInterval(familyTick, 1000);

  /* ------------------------------------------------------------------ */
  /* Simba's spontaneous behaviors                                       */
  /* ------------------------------------------------------------------ */
  const beh = { state: null, bubble: '', until: 0, next: Date.now() + 8000, cls: '' };
  function startBeh(state, bubble, ms, cls) {
    endBeh(true);
    beh.state = state; beh.bubble = bubble; beh.until = Date.now() + ms; beh.cls = cls || '';
    if (beh.cls) $('simba').classList.add(beh.cls);
    renderScene();
  }
  function endBeh(silent) {
    if (!beh.state) return;
    const was = beh.state;
    if (beh.cls) $('simba').classList.remove(beh.cls);
    beh.state = null; beh.bubble = ''; beh.cls = '';
    if (!silent) {
      if (was === 'sock') { S.nena.moral = clamp(S.nena.moral - 2); toast('Simba hid your sock somewhere. It’s gone forever.'); }
      renderScene();
    }
  }
  function behTap() {
    if (!beh.state) return false;
    const st = beh.state;
    if (st === 'sock') { S.simba.bonheur = clamp(S.simba.bonheur + 4); S.nena.moral = clamp(S.nena.moral + 3); toast('You got your sock back… slightly damp.', 'good'); snd('happy'); }
    else if (st === 'belly') { S.simba.bonheur = clamp(S.simba.bonheur + 6); toast('Belly rubs! Simba melts into a puddle of fluff.', 'good'); burstAt('heart', posOf('simba')[0], 50, 8); snd('happy'); }
    else if (st === 'ball') { S.simba.bonheur = clamp(S.simba.bonheur + 5); S.pet.plays++; toast('You toss the ball. Simba brings it back… eventually.', 'good'); snd('bark'); }
    else if (st === 'nap') { toast('Simba opens one eye, sighs, and goes back to sleep.'); snd('yawn'); }
    else if (st === 'whine') { S.simba.bonheur = clamp(S.simba.bonheur + 3); toast('You stroke his head. He leans into your hand.', 'good'); }
    else return false;
    S.counters.pets++;
    endBeh(true); renderScene(); renderGauges(); checkAchievements();
    return true;
  }
  function moveSimba(pct) {
    const el = $('simba');
    el.classList.add('walking'); el.style.left = pct + '%';
    setTimeout(() => el.classList.remove('walking'), 900);
  }
  function simbaTick() {
    if (S.family.out || busy || modalOpen || storyActive() || sheet.open || pzOpen() || (window.MiniGames && window.MiniGames.active) || !$('coach').hidden || document.hidden) return;
    const now = Date.now();
    if (beh.state && now > beh.until) endBeh();
    if (beh.state || now < beh.next) return;
    beh.next = now + 9000 + rnd() * 10000;
    const d = S.simba, night = nightLevel(S.time) > 0.4;
    const opts = [];
    if (S.pet.sick) { opts.push(['nap', 4], ['whine', 2]); }
    else {
      opts.push(['wander', 4], ['nap', night ? 5 : 1.5], ['belly', d.bonheur > 50 ? 2 : 0.5], ['scratch', d.pelage < 50 ? 3 : 1], ['follow', 2]);
      if (S.room !== 'dehors') opts.push(['sock', 1.2], ['ball', d.bonheur < 70 ? 2.5 : 1]);
      if (d.bonheur > 75) opts.push(['zoomies', 2]);
      if (learned(S).length) opts.push(['trick', 1.5]);
    }
    let tot = opts.reduce((a, o) => a + o[1], 0), r = rnd() * tot, pickB = opts[0][0];
    for (const [k, w] of opts) { r -= w; if (r <= 0) { pickB = k; break; } }
    const nx = posOf('nena')[0];
    if (pickB === 'wander') { let x; do { x = 18 + rnd() * 64; } while (Math.abs(x - nx) < 14); moveSimba(x); }
    else if (pickB === 'follow') { moveSimba(Math.max(14, Math.min(86, nx + (nx > 50 ? -16 : 16)))); }
    else if (pickB === 'nap') { startBeh('nap', 'Zzz…', 10000, 'asleep'); }
    else if (pickB === 'whine') { startBeh('whine', '*soft whine*', 6000, ''); }
    else if (pickB === 'belly') { startBeh('belly', 'Belly rubs? 🐾', 7000, 'belly'); }
    else if (pickB === 'scratch') { startBeh('scratch', '*scratch scratch*', 2200, 'scratch'); }
    else if (pickB === 'sock') { startBeh('sock', 'Stole a sock! 🧦', 9000, 'trickhop'); snd('bark'); }
    else if (pickB === 'ball') { startBeh('ball', 'Play? 🎾', 8000, ''); }
    else if (pickB === 'zoomies') { startBeh('zoomies', 'ZOOMIES!', 2600, 'zoomies'); snd('bark'); }
    else if (pickB === 'trick') { const t = pick(learned(S)); startBeh('trick', `*shows off ${TRICK_NAMES[t]}*`, 2400, t === 'spin' ? 'spin' : 'trickhop'); }
  }
  setInterval(simbaTick, 1000);

  /* ------------------------------------------------------------------ */
  /* Story banner and sheets                                             */
  /* ------------------------------------------------------------------ */
  function renderQuest() {
    const q = $('quest');
    if (!q || !window.Story) return;
    const ch = window.Story.chapterOf(S);
    if (!ch) {
      $('q-ch').textContent = S.story.ended ? '★' : '—';
      $('q-txt').textContent = S.story.ended ? 'Season 1 complete · free play' : 'Free play';
      $('q-prog').textContent = '';
      return;
    }
    const goals = ch.goals, done = goals.filter((g) => g.check(S));
    const next = goals.find((g) => !g.check(S));
    const left = ch.days[1] - window.Story.sday(S);
    $('q-ch').textContent = 'Ch. ' + ch.n;
    $('q-txt').textContent = next ? next.label + (next.prog ? ' · ' + next.prog(S) : '') : 'All goals ready!';
    $('q-prog').textContent = left > 0 ? `${left}d left` : 'Today!';
  }
  const hearts = (n) => { const h = Math.round((n || 0) / 2); return '♥'.repeat(h) + '♡'.repeat(5 - h); };
  function sheetStory() {
    const ch = window.Story.chapterOf(S);
    const relRow = (who, label) => `<div class="rel"><div class="rel-face">${window.Art.portrait(who, 'happy')}</div><div><b>${label}</b><span class="hearts">${hearts(S.story.rel[who])}</span></div></div>`;
    let head;
    if (ch) {
      const d = window.Story.sday(S) - ch.days[0] + 1;
      head = `<p class="ch-eyebrow">Chapter ${ch.n} · day ${d} of 7</p><h3 class="ch-title">${ch.title}</h3><p>${ch.blurb}</p>
        <ul class="tasks">${ch.goals.map((g) => { const ok = g.check(S); return `<li class="task${ok ? ' done' : ''}"><span class="box">${ok ? '✓' : ''}</span><span class="t-label">${g.label}${g.live ? ' <small>(checked on the day)</small>' : ''}</span><span class="t-count">${g.prog ? g.prog(S) : ''}</span></li>`; }).join('')}</ul>`;
    } else {
      head = S.story.ended ? `<h3 class="ch-title">Season 1 complete</h3><p>Thank you for taking such good care of Simba. Life goes on in free play: keep collecting memories and achievements!</p>` : '<p>Free play.</p>';
    }
    const known = S.story.flags.met_mia;
    return head + `<h3>Family & friends</h3><div class="rels">
      ${relRow('fariba', 'Maman Fariba')}${relRow('mohsen', 'Baba · Haj Mohsen')}${relRow('negin', 'Negin (big sister)')}${relRow('nasim', 'Nasim (little sister)')}
      ${known ? relRow('mia', 'Mia & Biscuit · 3rd floor') : '<div class="rel locked">??? <small>Walk Simba to meet the neighbors</small></div>'}
      ${S.story.flags.vet_seen || (S.story.rel.lee || 0) > 0 ? relRow('lee', 'Dr. Karimi (vet)') : ''}
      ${(S.story.rel.sam || 0) > 0 || window.Story.sday(S) >= 10 ? relRow('sam', 'Mr. Rahimi (boss)') : ''}
    </div>`;
  }
  function sheetSimba() {
    const p = S.pet;
    const w = p.weight;
    const wTxt = w > 26 ? 'a bit chubby' : w < 20 ? 'a bit thin' : 'ideal';
    const playful = clamp(20 + p.plays * 6), cuddly = clamp(20 + p.cuddles * 5 + S.counters.pets * 0.4);
    const obedient = clamp(TRICKS.reduce((a, t) => a + p.tricks[t], 0) / 5), stubborn = p.stubborn;
    const top = [['a playful goofball', playful], ['a big cuddle bug', cuddly], ['a clever student', obedient], ['a proud, stubborn lion', stubborn]].sort((a, b) => b[1] - a[1])[0][0];
    const bar = (label, v) => `<div class="need"><span></span><span class="need-name">${label}</span><div class="need-bar"><div class="need-fill" style="width:${Math.round(v)}%;background:var(--amber)"></div></div><span class="need-val">${Math.round(v)}</span></div>`;
    return `<div class="profile"><div class="profile-pic">${window.Art.simba({ collar: S.collar, eyes: 'open', tongue: true })}</div>
        <div><h3 class="ch-title">Simba</h3><p>Chow chow · ${p.age} year${p.age > 1 ? 's' : ''} old<br>${w.toFixed(1)} kg (${wTxt}) · ${p.sick ? '🤒 sick' : '💪 healthy'}</p></div></div>
      <p class="tip">Simba is ${top}.</p>
      <h3>Personality</h3>${bar('Playful', playful)}${bar('Cuddly', cuddly)}${bar('Obedient', obedient)}${bar('Stubborn', stubborn)}
      <h3>Tricks</h3>${TRICKS.map((t) => bar(TRICK_NAMES[t] + (p.tricks[t] >= 100 ? ' ✓' : ''), p.tricks[t])).join('')}
      <h3>Memories · ${S.album.length}</h3>
      ${S.album.length ? `<div class="album">${S.album.slice().reverse().map((m) => `<div class="memory"><span class="mem-ico">${m.icon}</span><b>${m.title}</b><small>Day ${m.day} · ${m.text}</small></div>`).join('')}</div>` : '<p>No memories yet. They appear as you live your story together.</p>'}`;
  }

  window.Game = {
    get S() { return S; },
    note, toast, after, memory,
    snd: (n, a) => snd(n, a),
    money: (n) => { S.money += n; moneyFx(n); },
    pauseFx: () => {},
    save: () => save(),
    blocked: () => busy || modalOpen || pzOpen() || (window.MiniGames && window.MiniGames.active) || !$('coach').hidden,
    trickName: (k) => TRICK_NAMES[k],
  };

  /* ------------------------------------------------------------------ */
  /* Real-time loop: 1 s = 1 game minute (×3 when fast)                  */
  /* ------------------------------------------------------------------ */
  let lastFull = 0;
  setInterval(() => {
    if (modalOpen || busy || !S.speed || sheet.open || !$('coach').hidden || document.hidden || storyActive() || pzOpen()) return;
    if (!advance(S.speed)) return;
    if (storyCheck()) return;
    clampAll();
    renderHud(); renderGauges(); renderFab(); flushToasts();
    if (S.time - lastFull >= 5 || S.time < lastFull) {
      lastFull = S.time;
      renderScene(); renderActions(); renderRooms();
      checkAchievements(); save();
    }
  }, 1000);

  /* ------------------------------------------------------------------ */
  /* PWA: install and offline                                           */
  /* ------------------------------------------------------------------ */
  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; $('btn-install-title').hidden = false; });
  function doInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.finally(() => { installPrompt = null; $('btn-install-title').hidden = true; if (sheet.open) renderSheet(); });
  }
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { /* no offline support here */ }); });
  }

  /* ------------------------------------------------------------------ */
  /* UI events                                                          */
  /* ------------------------------------------------------------------ */
  $('rooms').addEventListener('click', (e) => {
    const b = e.target.closest('[data-room]');
    if (!b || busy || modalOpen || S.room === b.dataset.room) return;
    S.room = b.dataset.room;
    endBeh(true);
    snd('tab'); buzz(6);
    ['nena', 'simba'].forEach((id) => { $(id).classList.add('walking'); setTimeout(() => $(id).classList.remove('walking'), 900); });
    const lbl = $('room-label'); lbl.classList.remove('enter'); void lbl.offsetWidth; lbl.classList.add('enter');
    document.querySelector('.tray').scrollTop = 0;
    advance(2);
    after();
  });
  $('actions').addEventListener('click', (e) => { const b = e.target.closest('[data-action]'); if (b) doAction(b.dataset.action); });
  $('simba').addEventListener('click', petSimba);
  $('nena').addEventListener('click', talkNena);
  $('btn-speed').addEventListener('click', () => { S.speed = S.speed === 0 ? 1 : S.speed === 1 ? 3 : 0; snd('click'); renderHud(); save(); });
  $('btn-menu').addEventListener('click', () => openSheet('menu'));
  $('btn-puzzle').addEventListener('click', () => { if (busy || modalOpen || storyActive()) return; window.Puzzle && window.Puzzle.show(); });
  $('quest').addEventListener('click', () => openSheet('story'));
  $('btn-tasks').addEventListener('click', () => openSheet('tasks'));
  $('btn-tasks-top').addEventListener('click', () => openSheet('tasks'));
  $('gauges').addEventListener('click', () => { if (coach.step === 1) { nextCoach(); return; } openSheet('needs'); });
  $('sheet-close').addEventListener('click', closeSheet);
  $('sheet-dim').addEventListener('click', closeSheet);
  $('sheet-wrap').addEventListener('click', onSheetClick);
  $('coach-next').addEventListener('click', nextCoach);
  $('coach-skip').addEventListener('click', endCoach);
  $('btn-next-day').addEventListener('click', nextDay);
  $('btn-install-title').addEventListener('click', doInstall);

  function wakeAudio() { if (window.Sound) { window.Sound.init(); applySettings(); } }
  function startGame(state, fresh) {
    S = state;
    spriteKeys = { nena: '', simba: '' };
    wakeAudio();
    $('title-screen').hidden = true;
    modalOpen = false;
    if (S.pendingNight) { render(); showNight(S.pendingNight); return; }
    render();
    setTimeout(() => {
      storyCheck();
      const waitCoach = () => { if (storyActive()) setTimeout(waitCoach, 500); else if (!S.tutorialDone) startCoach(); };
      waitCoach();
    }, 400);
  }
  function showTitle() {
    modalOpen = true;
    const saved = load();
    $('btn-continue').hidden = !saved;
    if (saved) $('continue-day').textContent = saved.day;
    $('title-screen').hidden = false;
    weatherFx();
  }
  $('btn-new').addEventListener('click', () => { if (load()) { $('confirm-screen').hidden = false; return; } startGame(newState(), true); });
  $('btn-confirm-yes').addEventListener('click', () => {
    $('confirm-screen').hidden = true;
    const keep = S.settings;
    const ns = newState(); ns.settings = keep; ns.tutorialDone = S.tutorialDone;
    startGame(ns, true); save();
  });
  $('btn-confirm-no').addEventListener('click', () => { $('confirm-screen').hidden = true; });
  $('btn-continue').addEventListener('click', () => { const d = load(); if (d) startGame(d, false); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheet.open) closeSheet();
    if (e.key === ' ' && !modalOpen && e.target === document.body) { e.preventDefault(); S.speed = S.speed ? 0 : 1; renderHud(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */
  const saved = load();
  if (saved) { $('btn-continue').hidden = false; $('continue-day').textContent = saved.day; S = saved; }
  render();
})();
