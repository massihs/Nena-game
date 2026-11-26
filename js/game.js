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
  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
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
      treats: 0, accidents: 0, mischief: 0, pets: 0, coffee: 0, trains: 0, medAM: false, medPM: false, miaWalk: false,
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
    { id: 'best_show', name: 'Best in Show', desc: 'Win first place at the dog show.', test: (s) => s.story.flags.show === 1 },
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
      story: { base: 0, seen: [], flags: {}, rel: { mia: 0, grandma: 0, lee: 0, sam: 0 }, ended: false, tmp: 0 },
      pet: { tricks: { sit: 0, paw: 0, down: 0, spin: 0, playdead: 0 }, weight: 23, sick: false, meds: 0, age: 1, stubborn: 60, plays: 0, cuddles: 0 },
      album: [],
    };
  }

  let S = newState();
  let busy = false;
  let modalOpen = true;
  const has = (id) => S.owned.includes(id);

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
    d.ventre -= 0.1; d.eau -= w === 'soleil' ? 0.2 : 0.14; d.pipi -= 0.13; d.pelage -= 0.035;
    d.bonheur -= (0.06 + (d.ventre < 20 ? 0.05 : 0) + (d.eau < 20 ? 0.05 : 0)) * (has('panier') ? 0.7 : 1) * (S.pet.sick ? 1.5 : 1) * (S.pet.weight > 26 ? 1.1 : 1);
    m.proprete -= (0.03 + (d.pelage < 40 ? 0.05 : 0)) * (has('robot') ? 0.5 : 1);
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
    { room: 'sdb', id: 'brosser', name: 'Brush Simba', desc: 'His double coat needs it every day.', tag: 'simba', dur: 20, mini: 'brush',
      verb: 'Nena untangles his mane…', task: 'brosser',
      avail: (s) => (s.simba.pelage < 95 ? true : 'His coat is already perfect.'),
      run: (s, r) => {
        const sc = r ? r.score : 0.6;
        s.simba.pelage = clamp(55 + 45 * sc); s.simba.bonheur += 4 + 10 * sc; s.maison.proprete -= 6;
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
      run: (s) => { s.today.treats++; s.simba.bonheur += 10; s.simba.ventre += 5; weigh(s, 0.06); burstAt('heart', posOf('simba')[0], 45, 5); } },
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
      run: (s) => { s.money += 45; s.nena.energie -= 12; s.nena.moral -= 5; s.simba.bonheur -= (s.pet.sick && storyFlag(s, 'mia_help')) ? 0 : 8; credit('travail'); moneyFx(45); } },
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
    { room: 'dehors', id: 'promenade', name: 'Walk Simba', desc: 'Pee, sniffing and fresh air.', tag: 'simba', dur: 30, mini: 'walk',
      verb: 'A walk around the block…', task: 'promenade', walk: true,
      avail: (s) => outside(s),
      run: (s, r) => {
        const sc = r ? r.score : 0.6;
        s.simba.pipi = 100; s.simba.bonheur += 8 + 14 * sc + (s.today.weather === 'neige' ? 10 : 0);
        s.nena.energie -= 6; s.nena.moral += 5;
        s.counters.walks++; if (s.today.weather === 'neige') s.counters.snowWalks++; weigh(s, -0.05);
        if (r && !r.skipped) s.best.walk = Math.max(s.best.walk, r.hits ? Math.min(sc, 0.89) : sc);
        credit('promenade'); rainCheck(s); storyEvent('walk');
        if (r && r.muddy) { s.muddy = true; addTask('bain'); note('Simba jumped into a mud puddle! Bath time.', 'bad'); }
        else if (r && r.skipped) walkEvent(s);
        else if (rnd() < 0.3) friendEvent(s);
      } },
    { room: 'dehors', id: 'parc', name: 'Dog park (1 h)', desc: 'Counts as a walk.', tag: 'simba', dur: 60,
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
      run: (s) => { s.money -= 24; s.food += 4; s.simba.bonheur -= 6; credit('courses'); rainCheck(s); } },
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
        s.pet.tricks[t] = Math.min(100, before + (20 + 30 * sc) * (1.1 - s.pet.stubborn / 200));
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
    { room: 'dehors', id: 'cake', name: 'Order the birthday cake', desc: '−$35 · peanut butter, dog-safe.', tag: 'simba', dur: 20,
      verb: 'Choosing the perfect cake…', sfx: 'coin', show: (s) => chapterN(s) === 2 && !storyFlag(s, 'cake'),
      avail: (s) => outside(s, (x) => (x.money < 35 ? 'Not enough money ($35).' : true)),
      run: (s) => { s.money -= 35; s.story.flags.cake = true; note('Cake ordered! Ready on Sunday.', 'good'); } },
    { room: 'dehors', id: 'gift', name: 'Buy a birthday gift', desc: '−$30 · something squeaky.', tag: 'simba', dur: 25,
      verb: 'Squeezing every toy in the store…', sfx: 'coin', show: (s) => chapterN(s) === 2 && !storyFlag(s, 'gift'),
      avail: (s) => outside(s, (x) => (x.money < 30 ? 'Not enough money ($30).' : true)),
      run: (s) => { s.money -= 30; s.story.flags.gift = true; note('Gift wrapped and hidden in the closet.', 'good'); } },
    { room: 'dehors', id: 'miawalk', name: 'Walk with Mia', desc: '5 to 8 PM · Simba and Biscuit play together.', tag: 'simba', dur: 40,
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
    { room: 'dehors', id: 'agility', name: 'Agility practice', desc: 'Get ready for the dog show.', tag: 'simba', dur: 30, mini: 'fetch',
      verb: 'Jump, run, fetch!', walk: true, show: (s) => chapterN(s) === 4,
      avail: (s) => outside(s),
      run: (s, r) => { s.story.flags.practice = (s.story.flags.practice || 0) + 1; s.simba.bonheur += 8 + 10 * (r ? r.score : 0.6); s.simba.pipi = 100; weigh(s, -0.06); note(`Practice ${s.story.flags.practice}/3 done!`, 'good'); } },
    { room: 'cuisine', id: 'medicine', name: 'Give medicine', desc: 'Morning (before noon) and evening (after 5 PM).', tag: 'simba', dur: 3,
      verb: 'Hiding the pill in a bit of cheese…', sfx: 'pop', show: (s) => s.pet.sick && storyFlag(s, 'vet_seen'),
      task: (s) => ((s.time < 12 * 60 && !s.today.medAM) || (s.time >= 17 * 60 && !s.today.medPM) ? 'medicine' : null),
      avail: (s) => (s.time < 12 * 60 ? (s.today.medAM ? 'Morning dose done. Next one after 5 PM.' : true) : s.time >= 17 * 60 ? (s.today.medPM ? 'Evening dose done. See you tomorrow!' : true) : 'Next dose after 5 PM.'),
      run: (s) => { if (s.time < 12 * 60) s.today.medAM = true; else s.today.medPM = true; s.pet.meds++; s.simba.bonheur += 3; note(`Medicine ${s.pet.meds}/6 · Simba gobbled the cheese.`); storyEvent('medicine'); } },
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
    sdb:     { name: 'Bath', icon: '🛁', nena: [56, 6], simba: [78, 5] },
    cuisine: { name: 'Kitchen', icon: '🍳', nena: [36, 6], simba: [68, 5] },
    salon:   { name: 'Living', icon: '🛋️', nena: [64, 7], simba: [34, 6] },
    dehors:  { name: 'Outside', icon: '🌳', nena: [40, 9], simba: [64, 8] },
  };
  const posOf = (who) => ROOMS[S.room][who];

  function fluff(s) {
    const count = Math.round((100 - s.maison.proprete) / 14);
    const spots = [[200, 420], [300, 400], [520, 430], [610, 395], [430, 438], [250, 440], [580, 440]];
    let out = '';
    for (let i = 0; i < Math.min(count, spots.length); i++) {
      const [x, y] = spots[i];
      out += `<g opacity=".85"><circle cx="${x}" cy="${y}" r="9" fill="#d9944c"/><circle cx="${x + 8}" cy="${y - 4}" r="7" fill="#e6a65e"/><circle cx="${x - 7}" cy="${y - 3}" r="6" fill="#c98540"/></g>`;
    }
    return out;
  }
  function windowSvg(x, y, w, h, s) {
    const [a, b] = skyColor(s.time);
    const night = nightLevel(s.time) > 0.4;
    let extra = '';
    if (night) for (let i = 0; i < 9; i++) extra += `<circle cx="${x + 12 + ((i * 37) % (w - 20))}" cy="${y + h - 18 - ((i * 23) % 30)}" r="3" fill="#ffc96b" opacity=".9"/>`;
    if (s.today.weather === 'pluie') for (let i = 0; i < 14; i++) extra += `<path d="M${x + ((i * 29) % w)} ${y + ((i * 41) % h)} l-4 12" stroke="#e6eef7" stroke-width="2" opacity=".7"/>`;
    if (s.today.weather === 'neige') for (let i = 0; i < 14; i++) extra += `<circle cx="${x + ((i * 29) % w)}" cy="${y + ((i * 41) % h)}" r="2.6" fill="#fff"/>`;
    return `<defs><linearGradient id="sky${x}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
      <rect x="${x - 8}" y="${y - 8}" width="${w + 16}" height="${h + 16}" rx="6" fill="#5b3a2c"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#sky${x})"/>
      <path d="M${x} ${y + h} v-28 h${w * 0.18} v-16 h${w * 0.16} v22 h${w * 0.2} v-34 h${w * 0.2} v20 h${w * 0.26} v36z" fill="${night ? '#2a2a4a' : '#9cb4c8'}" opacity=".85"/>
      ${extra}
      <rect x="${x + w / 2 - 3}" y="${y}" width="6" height="${h}" fill="#5b3a2c"/>
      <rect x="${x}" y="${y + h / 2 - 3}" width="${w}" height="6" fill="#5b3a2c"/>`;
  }
  function floor(color, rug) {
    return `<rect x="0" y="330" width="800" height="120" fill="${color}"/>
      <rect x="0" y="326" width="800" height="8" fill="rgba(0,0,0,.12)"/>
      ${rug ? `<ellipse cx="400" cy="405" rx="240" ry="32" fill="${rug}"/>` : ''}`;
  }
  const plant = (x, y, sc = 1) => `<g transform="translate(${x} ${y}) scale(${sc})"><g fill="#6f9a52"><ellipse cx="0" cy="-30" rx="18" ry="34"/><ellipse cx="22" cy="-40" rx="14" ry="28" transform="rotate(25 22 -40)"/><ellipse cx="-22" cy="-40" rx="14" ry="28" transform="rotate(-25 -22 -40)"/></g><rect x="-22" y="-6" width="44" height="40" rx="6" fill="#c97b52"/></g>`;
  const dogBed = (x, y) => `<g><ellipse cx="${x}" cy="${y}" rx="70" ry="22" fill="#b5476d"/><ellipse cx="${x}" cy="${y - 6}" rx="56" ry="14" fill="#f3c6d5"/></g>`;

  const DRAW = {
    chambre(s) {
      const made = s.maison.lit;
      return `<rect width="800" height="450" fill="#ecd6c3"/>
        <rect y="0" width="800" height="18" fill="#dcbfa8"/>
        ${windowSvg(520, 70, 150, 140, s)}
        <path d="M502 52 h36 v200 q-18 -40 -36 -10z" fill="#e8d2bb"/><path d="M688 52 h-36 v200 q18 -40 36 -10z" fill="#e8d2bb"/>
        ${floor('#b9875f', '#f0b6c8')}
        <rect x="110" y="190" width="300" height="110" rx="18" fill="#a77450"/>
        <rect x="102" y="268" width="316" height="82" rx="24" fill="#f4e7d4"/>
        ${made
          ? `<rect x="102" y="282" width="316" height="68" rx="22" fill="#e7cfb1"/><path d="M110 300 h300" stroke="#d6b994" stroke-width="3"/>
             <rect x="126" y="248" width="100" height="40" rx="18" fill="#fff8ee"/><rect x="240" y="248" width="100" height="40" rx="18" fill="#fff8ee"/>`
          : `<path d="M102 300 q40 -40 90 -6 q50 -30 90 6 q50 -40 90 0 q30 -20 46 4 v46 h-316z" fill="#e7cfb1"/>
             <rect x="120" y="240" width="100" height="40" rx="18" fill="#fff8ee" transform="rotate(-10 170 260)"/>`}
        <rect x="428" y="262" width="76" height="80" rx="8" fill="#8a5a3c"/>
        <rect x="444" y="226" width="12" height="38" fill="#6d4630"/>
        <path d="M422 230 l28 -54 l28 54z" fill="${nightLevel(s.time) > 0.3 ? '#ffd98a' : '#f4e2c4'}"/>
        ${nightLevel(s.time) > 0.3 ? '<circle cx="450" cy="215" r="70" fill="#ffd98a" opacity=".18"/>' : ''}
        <rect x="470" y="244" width="22" height="18" rx="4" fill="#fff"/>
        ${has('panier') ? dogBed(610, 400) : ''}
        ${has('plante') ? plant(700, 312, 0.9) : ''}
        ${fluff(s)}`;
    },
    sdb(s) {
      let tiles = '';
      for (let y = 0; y < 330; y += 40) for (let x = 0; x < 800; x += 40) tiles += `<rect x="${x + 1}" y="${y + 1}" width="38" height="38" fill="#d4e6e8"/>`;
      const linge = Math.min(3, s.maison.linge);
      let basket = '';
      for (let i = 0; i < linge; i++) basket += `<ellipse cx="${630 + i * 8}" cy="${300 - i * 10}" rx="22" ry="9" fill="${['#f19bb8', '#9cc2d9', '#f6d9b8'][i]}"/>`;
      return `<rect width="800" height="450" fill="#c3dadd"/>${tiles}
        ${floor('#e9e2d8', '#9cc2d9')}
        <rect x="110" y="230" width="270" height="110" rx="48" fill="#fffdf9"/>
        <rect x="126" y="244" width="238" height="40" rx="20" fill="#bfe1ee"/>
        <circle cx="180" cy="246" r="10" fill="#fff"/><circle cx="200" cy="240" r="7" fill="#fff"/><circle cx="220" cy="248" r="9" fill="#fff"/>
        <rect x="140" y="150" width="8" height="90" fill="#b8c1c6"/><path d="M130 150 h40 l-10 14 h-20z" fill="#b8c1c6"/>
        <rect x="400" y="90" width="110" height="130" rx="55" fill="#f6efe6" stroke="#b6a089" stroke-width="6"/>
        <rect x="405" y="232" width="100" height="22" rx="8" fill="#fffdf9"/><rect x="435" y="254" width="40" height="76" fill="#f1ebe2"/>
        <rect x="530" y="200" width="100" height="135" rx="12" fill="#f8f6f3" stroke="#d8d2ca" stroke-width="3"/>
        <circle cx="580" cy="275" r="34" fill="#9db7c2" stroke="#ccc4ba" stroke-width="6"/>
        <circle cx="550" cy="216" r="5" fill="#e98aab"/><circle cx="566" cy="216" r="5" fill="#8fcf8f"/>
        <rect x="606" y="290" width="66" height="46" rx="10" fill="#c9a67a"/>${basket}
        ${fluff(s)}`;
    },
    cuisine(s) {
      let tiles = '';
      for (let x = 110; x < 420; x += 30) tiles += `<rect x="${x}" y="180" width="28" height="68" fill="#f7efe2"/>`;
      let dishes = '';
      for (let i = 0; i < Math.min(5, s.maison.vaisselle); i++) dishes += `<ellipse cx="${200 + (i % 2) * 6}" cy="${244 - i * 8}" rx="32" ry="6" fill="#fffaf2" stroke="#c9b8a4" stroke-width="2"/>`;
      const foodLvl = s.simba.ventre > 70 ? 0 : 12;
      const water = Math.round(s.simba.eau / 100 * 10);
      return `<rect width="800" height="450" fill="#f1dfc5"/>${tiles}
        ${windowSvg(240, 50, 140, 110, s)}
        ${floor('#c8a27a')}
        <rect x="100" y="248" width="330" height="92" fill="#a8744d"/>
        <rect x="94" y="240" width="342" height="14" rx="4" fill="#e9dcc6"/>
        <g fill="#8e5f3e"><rect x="114" y="268" width="96" height="60" rx="6"/><rect x="220" y="268" width="96" height="60" rx="6"/><rect x="326" y="268" width="96" height="60" rx="6"/></g>
        <rect x="330" y="220" width="64" height="22" rx="10" fill="#c9cfd3"/>
        ${dishes}
        ${has('cafe') ? '<rect x="120" y="206" width="34" height="36" rx="6" fill="#3a3550"/><rect x="128" y="226" width="16" height="12" rx="3" fill="#fff"/>' : ''}
        <rect x="446" y="110" width="110" height="230" rx="16" fill="#f7f4ef" stroke="#ddd5ca" stroke-width="3"/>
        <path d="M446 190 h110" stroke="#ddd5ca" stroke-width="3"/><rect x="538" y="140" width="6" height="34" rx="3" fill="#b8b0a6"/>
        <rect x="538" y="210" width="6" height="40" rx="3" fill="#b8b0a6"/>
        <text x="501" y="300" text-anchor="middle" font-family="Nunito, sans-serif" font-size="16" font-weight="800" fill="#b8b0a6">${s.food} meals</text>
        <path d="M560 400 h56 l-8 22 h-40z" fill="#e98aab"/>
        <ellipse cx="588" cy="400" rx="28" ry="6" fill="${foodLvl ? '#9a6232' : '#c95f84'}"/>
        <path d="M624 400 h56 l-8 22 h-40z" fill="#7aa6c2"/>
        <ellipse cx="652" cy="400" rx="${16 + water}" ry="5" fill="${water > 2 ? '#bfe6f5' : '#5d88a3'}"/>
        <text x="620" y="442" text-anchor="middle" font-family="Baloo 2, sans-serif" font-size="15" font-weight="700" fill="#7a5c4e">SIMBA</text>
        ${fluff(s)}`;
    },
    salon(s) {
      const tv = s.time >= 8 * 60 && s.time <= 19 * 60 && !isWeekend(s.day);
      return `<rect width="800" height="450" fill="#ead4d8"/>
        <rect y="200" width="800" height="130" fill="#e0c3c8"/>
        ${windowSvg(340, 50, 140, 120, s)}
        ${floor('#a8774f', '#e6c38d')}
        <rect x="500" y="210" width="180" height="10" rx="4" fill="#7c533a"/>
        <rect x="515" y="220" width="10" height="110" fill="#7c533a"/><rect x="655" y="220" width="10" height="110" fill="#7c533a"/>
        <rect x="546" y="150" width="96" height="62" rx="6" fill="#3a3550"/>
        <rect x="552" y="156" width="84" height="50" rx="3" fill="${tv ? '#9fd0e8' : '#4b4766'}"/>
        <rect x="586" y="210" width="16" height="6" fill="#3a3550"/>
        <rect x="110" y="230" width="290" height="100" rx="30" fill="#d07f9b"/>
        <rect x="130" y="196" width="250" height="70" rx="26" fill="#df95ae"/>
        <rect x="92" y="250" width="50" height="80" rx="20" fill="#c06b89"/><rect x="368" y="250" width="50" height="80" rx="20" fill="#c06b89"/>
        <rect x="160" y="214" width="60" height="44" rx="14" fill="#f6d9b8"/>
        <circle cx="470" cy="410" r="12" fill="#d8e650"/><path d="M460 404 q10 8 20 0" stroke="#fff" stroke-width="2" fill="none"/>
        ${has('corde') ? '<path d="M520 420 q20 -16 40 0 q20 16 40 0" stroke="#4a7bd0" stroke-width="8" fill="none" stroke-linecap="round"/>' : ''}
        ${has('robot') ? '<g><ellipse cx="640" cy="425" rx="34" ry="11" fill="#3a3550"/><ellipse cx="640" cy="420" rx="28" ry="8" fill="#6f6a92"/><circle cx="640" cy="418" r="3" fill="#7ee08a"/></g>' : ''}
        ${plant(90, 176, 1)}
        ${fluff(s)}`;
    },
    dehors(s) {
      const [a, b] = skyColor(s.time);
      const night = nightLevel(s.time) > 0.4, w = s.today.weather, snow = w === 'neige';
      let bld = '';
      const xs = [[60, 150, 90], [140, 110, 70], [210, 180, 100], [320, 130, 80], [400, 200, 90], [500, 140, 110], [610, 170, 80], [690, 120, 90]];
      xs.forEach(([x, h, wd], i) => {
        bld += `<rect x="${x}" y="${270 - h}" width="${wd}" height="${h}" fill="${night ? '#2c2b4a' : ['#b9c4d3', '#a9b6c8', '#c6cfdb'][i % 3]}"/>`;
        if (snow) bld += `<rect x="${x}" y="${270 - h - 5}" width="${wd}" height="8" rx="4" fill="#fff"/>`;
        for (let wy = 270 - h + 14; wy < 256; wy += 22) for (let wx = x + 10; wx < x + wd - 10; wx += 20)
          bld += `<rect x="${wx}" y="${wy}" width="9" height="11" fill="${night ? ((wx + wy) % 3 ? '#ffcf73' : '#3b3a5c') : '#e8eef5'}"/>`;
      });
      const grass = snow ? '#f2f5f8' : night ? '#3f5a3a' : w === 'pluie' ? '#6f9a52' : '#8fbf6a';
      const leaves = snow ? '#e9eef3' : night ? '#2f4a2c' : '#5f9a4c';
      return `<defs><linearGradient id="skyOut" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
        <rect width="800" height="450" fill="url(#skyOut)"/>
        ${night ? '<circle cx="600" cy="70" r="26" fill="#fff3c9"/><circle cx="612" cy="62" r="24" fill="' + a + '"/>' : w === 'soleil' ? '<circle cx="600" cy="70" r="30" fill="#ffe08a"/><circle cx="600" cy="70" r="50" fill="#ffe08a" opacity=".25"/>' : ''}
        ${w === 'pluie' || w === 'nuages' ? '<g fill="#fff" opacity=".7"><ellipse cx="250" cy="70" rx="70" ry="22"/><ellipse cx="290" cy="58" rx="44" ry="22"/><ellipse cx="520" cy="100" rx="60" ry="18"/></g>' : ''}
        ${bld}
        <rect y="270" width="800" height="180" fill="${grass}"/>
        <path d="M0 360 q400 -60 800 0 v40 q-400 -60 -800 0z" fill="${night ? '#6b5d4d' : snow ? '#dfe5ea' : '#e3cfa6'}"/>
        <g><rect x="146" y="210" width="16" height="90" fill="#7a5233"/><circle cx="154" cy="200" r="46" fill="${leaves}"/><circle cx="128" cy="220" r="30" fill="${leaves}"/></g>
        <g><rect x="640" y="220" width="14" height="80" fill="#7a5233"/><circle cx="647" cy="208" r="40" fill="${leaves}"/></g>
        <rect x="520" y="300" width="100" height="10" rx="4" fill="#9a6b44"/><rect x="520" y="284" width="100" height="8" rx="4" fill="#9a6b44"/>
        <rect x="528" y="310" width="6" height="22" fill="#6d4a2e"/><rect x="606" y="310" width="6" height="22" fill="#6d4a2e"/>
        <rect x="330" y="200" width="6" height="140" fill="#4a4a5a"/><circle cx="333" cy="196" r="12" fill="${night ? '#ffd98a' : '#d9d9e0'}"/>
        ${night ? '<circle cx="333" cy="196" r="44" fill="#ffd98a" opacity=".25"/>' : ''}
        ${w === 'pluie' ? `<ellipse cx="250" cy="420" rx="34" ry="9" fill="#7d9fb3" opacity=".8"/><ellipse cx="560" cy="430" rx="26" ry="7" fill="#7d9fb3" opacity=".8"/>` : ''}`;
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
  const availOf = (a) => (a.avail ? a.avail(S) : true);
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
        <span class="a-top"><span class="a-name">${val(a.name, S)}</span><span class="a-dur">${a.dur ? durTxt(a.dur) : ''}</span></span>
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
    if (busy || modalOpen || storyActive()) return;
    const a = ACTIONS.find((x) => x.id === id);
    if (!a) return;
    const ok = availOf(a);
    if (ok !== true) { toast(ok, 'bad'); snd('fail'); buzz(30); return; }
    snd('click'); buzz(8);
    if (!a.dur) { a.run(S); after(); return; }

    if (a.mini && window.MiniGames) {
      busy = true;
      window.MiniGames.start(a.mini, {
        collar: S.collar, outfit: S.outfit, trick: nextTrick(S), stubborn: S.pet.stubborn,
        rain: S.today.weather === 'pluie', snow: S.today.weather === 'neige',
        onEnd: (res) => {
          busy = false;
          const alive = advance(a.dur);
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

    const start = S.time, total = a.dur;
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
    S.nena.energie = collapsed ? 55 : clamp(25 + sleptH * 9);
    S.nena.faim = clamp(S.nena.faim - 30);
    S.nena.hygiene = clamp(S.nena.hygiene - 20);
    S.nena.moral = clamp(S.nena.moral + (sum && sum.stars >= 2 ? 8 : -4));
    S.simba.ventre = clamp(S.simba.ventre - 35);
    S.simba.eau = clamp(S.simba.eau - 40);
    S.simba.pipi = clamp(S.simba.pipi - 55, 15);
    S.simba.bonheur = clamp(S.simba.bonheur + 5);
    S.maison.lit = false; S.maison.linge += 1; S.maison.proprete = clamp(S.maison.proprete - 8);
    S.dressed = false; S.room = 'chambre';
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
        today: Object.assign({ trains: 0, medAM: false, medPM: false, miaWalk: false }, data.today),
      });
    } catch (e) { return null; }
  }


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
    if (busy || modalOpen || storyActive() || sheet.open || (window.MiniGames && window.MiniGames.active) || !$('coach').hidden || document.hidden) return;
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
    return head + `<h3>Friends</h3><div class="rels">
      ${known ? relRow('mia', 'Mia & Biscuit') : '<div class="rel locked">??? <small>Walk Simba to meet the neighbors</small></div>'}
      ${relRow('grandma', 'Grandma Rose')}
      ${S.story.flags.vet_seen || (S.story.rel.lee || 0) > 0 ? relRow('lee', 'Dr. Lee') : ''}
      ${(S.story.rel.sam || 0) > 0 || window.Story.sday(S) >= 10 ? relRow('sam', 'Sam (boss)') : ''}
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
    blocked: () => busy || modalOpen || (window.MiniGames && window.MiniGames.active) || !$('coach').hidden,
    trickName: (k) => TRICK_NAMES[k],
  };

  /* ------------------------------------------------------------------ */
  /* Real-time loop: 1 s = 1 game minute (×3 when fast)                  */
  /* ------------------------------------------------------------------ */
  let lastFull = 0;
  setInterval(() => {
    if (modalOpen || busy || !S.speed || sheet.open || !$('coach').hidden || document.hidden || storyActive()) return;
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
