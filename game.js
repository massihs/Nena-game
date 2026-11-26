/* Nena & Simba — une simulation de vie douce.
   Nena doit s'occuper d'elle-même, de la maison et de Simba, son chow-chow. */
(function () {
  'use strict';

  const SAVE_KEY = 'nena-simba-save-v1';
  const DAY_START = 7 * 60;
  const BEDTIME_OK = 20 * 60;
  const COLLAPSE_AT = 25 * 60; // 1 h du matin

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
  const rnd = Math.random;

  /* ------------------------------------------------------------------ */
  /* Tâches                                                              */
  /* ------------------------------------------------------------------ */
  const TASKS = {
    lit:           { label: 'Faire le lit', who: 'nena' },
    dents_matin:   { label: 'Se brosser les dents (matin)', who: 'nena' },
    douche:        { label: 'Prendre une douche', who: 'nena' },
    habiller:      { label: "S'habiller", who: 'nena' },
    repas:         { label: 'Manger 3 repas', who: 'nena', need: 3 },
    travail:       { label: 'Travailler 4 h', who: 'nena', need: 2 },
    dents_soir:    { label: 'Se brosser les dents (soir)', who: 'nena' },
    gamelle_matin: { label: 'Gamelle de Simba (matin)', who: 'simba' },
    gamelle_soir:  { label: 'Gamelle de Simba (soir)', who: 'simba' },
    eau:           { label: 'Eau fraîche pour Simba', who: 'simba', need: 2 },
    promenade:     { label: 'Promener Simba 3 fois', who: 'simba', need: 3 },
    brosser:       { label: 'Brosser le pelage de Simba', who: 'simba' },
    jouer:         { label: 'Jouer avec Simba', who: 'simba' },
    calin:         { label: 'Câlin avec Simba', who: 'simba' },
    vaisselle:     { label: 'Cuisine rangée au coucher', who: 'maison', check: (s) => s.maison.vaisselle === 0 },
    aspirateur:    { label: "Aspirateur (poils de chow-chow !)", who: 'maison' },
    lessive:       { label: 'Faire une lessive', who: 'maison' },
    courses:       { label: 'Faire des courses', who: 'maison' },
    veto:          { label: 'Rendez-vous chez le véto', who: 'simba' },
    bain:          { label: 'Donner un bain à Simba', who: 'simba' },
  };
  const BASE = ['lit', 'dents_matin', 'habiller', 'douche', 'repas', 'gamelle_matin', 'eau', 'promenade',
    'brosser', 'travail', 'jouer', 'calin', 'gamelle_soir', 'dents_soir', 'vaisselle'];

  function makeDay(day) {
    const ids = BASE.slice();
    const extras = ['aspirateur', 'lessive', 'courses'];
    // une tâche ménagère qui tourne chaque jour, deux le week-end
    ids.push(extras[(day - 1) % 3]);
    if (day % 7 === 6 || day % 7 === 0) ids.push(extras[day % 3]);
    if (day % 5 === 0) ids.push('veto');
    const uniq = [...new Set(ids)];
    return {
      tasks: uniq.map((id) => ({ id, done: 0, need: TASKS[id].need || 1 })),
      treats: 0, accidents: 0, mischief: 0,
    };
  }

  /* ------------------------------------------------------------------ */
  /* Etat                                                                */
  /* ------------------------------------------------------------------ */
  function newState() {
    return {
      day: 1, time: DAY_START, money: 60, kibble: 6, food: 4,
      room: 'chambre', dressed: false, muddy: false,
      nena: { faim: 65, energie: 85, hygiene: 55, moral: 75 },
      simba: { ventre: 35, eau: 55, pipi: 40, pelage: 70, bonheur: 70 },
      maison: { proprete: 80, vaisselle: 1, linge: 2, lit: false },
      today: makeDay(1),
      stars: 0, history: [], speed: 1,
    };
  }

  let S = newState();
  let busy = false;
  let modalOpen = true;

  /* ------------------------------------------------------------------ */
  /* Utilitaires temps                                                   */
  /* ------------------------------------------------------------------ */
  const hh = (t) => String(Math.floor(t / 60) % 24).padStart(2, '0') + ':' + String(Math.floor(t % 60)).padStart(2, '0');
  function period(t) {
    const h = (t / 60) % 24;
    if (h < 6) return 'Nuit';
    if (h < 12) return 'Matin';
    if (h < 14) return 'Midi';
    if (h < 18) return 'Après-midi';
    if (h < 22) return 'Soir';
    return 'Nuit';
  }
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
    const h = (t / 60) % 24;
    if (h < 6 || h >= 21.5) return ['#1d2047', '#3a3466'];
    if (h < 8) return ['#f6b9a0', '#fde3c3'];
    if (h < 18) return ['#8fcbee', '#d7eefa'];
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
    if (t.done >= t.need) note('✓ ' + TASKS[id].label, 'good');
  }
  function addTask(id) {
    if (!S.today.tasks.find((x) => x.id === id)) S.today.tasks.push({ id, done: 0, need: TASKS[id].need || 1 });
  }

  // Avance d'une minute. Retourne false si la journée s'arrête net.
  function tickMinute() {
    const n = S.nena, d = S.simba, m = S.maison;
    S.time += 1;
    n.faim -= 0.085; n.energie -= 0.055; n.hygiene -= 0.045;
    d.ventre -= 0.1; d.eau -= 0.14; d.pipi -= 0.13; d.pelage -= 0.035;
    d.bonheur -= 0.06 + (d.ventre < 20 ? 0.05 : 0) + (d.eau < 20 ? 0.05 : 0);
    m.proprete -= 0.03 + (d.pelage < 40 ? 0.05 : 0); // un chow-chow mal brossé perd ses poils partout
    let mood = -0.015 + (d.bonheur > 60 ? 0.025 : -0.02);
    if (n.faim < 20) mood -= 0.05;
    if (m.proprete < 35) mood -= 0.03;
    if (n.hygiene < 20) mood -= 0.02;
    n.moral += mood;

    for (const k in n) n[k] = clamp(n[k]);
    for (const k in d) d[k] = clamp(d[k]);
    m.proprete = clamp(m.proprete);

    if (d.pipi <= 0) {
      d.pipi = 75; m.proprete = clamp(m.proprete - 25); n.moral = clamp(n.moral - 8);
      S.today.accidents++;
      note('Oups ! Simba ne pouvait plus attendre : pipi sur le tapis…', 'bad');
    }
    if (d.bonheur < 18 && rnd() < 0.006) {
      const betises = [
        'Simba a mâchouillé une pantoufle de Nena.',
        'Simba a renversé la plante du salon.',
        'Simba a volé un coussin et l’a mis en pièces.',
      ];
      m.proprete = clamp(m.proprete - 12); n.moral = clamp(n.moral - 5);
      S.today.mischief++;
      note(betises[Math.floor(rnd() * betises.length)] + ' Il s’ennuie !', 'bad');
    }
    if (n.energie <= 0 || S.time >= COLLAPSE_AT) {
      endDay(true);
      return false;
    }
    return true;
  }
  function advance(min) {
    for (let i = 0; i < min; i++) if (!tickMinute()) return false;
    return true;
  }

  /* ------------------------------------------------------------------ */
  /* Actions                                                             */
  /* ------------------------------------------------------------------ */
  const needDressed = (s) => (s.dressed ? true : 'Nena est encore en pyjama !');
  const ACTIONS = [
    // Chambre
    { room: 'chambre', id: 'lit', name: 'Faire le lit', desc: 'Une chambre bien rangée, un moral au top.', tag: 'maison', dur: 5,
      verb: 'Nena tire la couette…', task: 'lit',
      avail: (s) => (!s.maison.lit ? true : 'Le lit est déjà fait.'),
      run: (s) => { s.maison.lit = true; s.nena.moral += 4; credit('lit'); } },
    { room: 'chambre', id: 'habiller', name: "S'habiller", desc: 'Indispensable avant de sortir.', tag: 'nena', dur: 10,
      verb: 'Nena choisit sa tenue…', task: 'habiller',
      avail: (s) => (!s.dressed ? true : 'Nena est déjà habillée.'),
      run: (s) => { s.dressed = true; s.nena.moral += 3; credit('habiller'); } },
    { room: 'chambre', id: 'pyjama', name: 'Mettre son pyjama', desc: 'Le pyjama rose préféré de Nena.', tag: 'nena', dur: 5,
      verb: 'Nena enfile son pyjama…',
      avail: (s) => (!s.dressed ? 'Elle est déjà en pyjama.' : s.time < 18 * 60 ? 'Il est un peu tôt pour ça.' : true),
      run: (s) => { s.dressed = false; s.nena.moral += 3; } },
    { room: 'chambre', id: 'calin', name: 'Câlin avec Simba', desc: 'Plonger le nez dans sa crinière.', tag: 'simba', dur: 10,
      verb: 'Gros câlin tout doux…', task: 'calin',
      run: (s) => { s.simba.bonheur += 20; s.nena.moral += 10; credit('calin'); } },
    { room: 'chambre', id: 'sieste', name: 'Faire une sieste', desc: 'Simba se colle à elle.', tag: 'nena', dur: 60,
      verb: 'Zzz… petite sieste…', sleepy: true,
      avail: (s) => (s.nena.energie < 70 ? true : 'Nena n’est pas fatiguée.'),
      run: (s) => { s.nena.energie += 30; s.simba.bonheur += 5; } },
    { room: 'chambre', id: 'dormir', name: 'Dormir avec Simba', desc: 'Termine la journée.', tag: 'nena', dur: 0,
      verb: 'Bonne nuit…',
      avail: (s) => (s.time >= BEDTIME_OK || s.nena.energie < 20 ? true : 'Pas avant 20:00 (sauf si épuisée).'),
      run: () => endDay(false) },

    // Salle de bain
    { room: 'sdb', id: 'douche', name: 'Prendre une douche', desc: 'Hygiène au maximum.', tag: 'nena', dur: 15,
      verb: 'Nena chante sous la douche…', task: 'douche',
      avail: (s) => (s.nena.hygiene < 92 ? true : 'Nena est déjà toute propre.'),
      run: (s) => { s.nena.hygiene = 100; s.nena.moral += 5; s.maison.linge += 1; credit('douche'); } },
    { room: 'sdb', id: 'dents', name: 'Se brosser les dents', desc: 'Le matin avant midi, le soir après 19:00.', tag: 'nena', dur: 3,
      verb: 'Brossage, brossage…', task: (s) => (s.time < 12 * 60 ? 'dents_matin' : s.time >= 19 * 60 ? 'dents_soir' : null),
      run: (s) => {
        s.nena.hygiene += 6;
        if (s.time < 12 * 60) credit('dents_matin');
        else if (s.time >= 19 * 60) credit('dents_soir');
      } },
    { room: 'sdb', id: 'brosser', name: 'Brosser Simba', desc: 'Son double pelage de chow-chow en a besoin chaque jour.', tag: 'simba', dur: 20,
      verb: 'Nena démêle la crinière de Simba…', task: 'brosser',
      avail: (s) => (s.simba.pelage < 95 ? true : 'Son pelage est déjà parfait.'),
      run: (s) => { s.simba.pelage = 100; s.simba.bonheur += 8; s.maison.proprete -= 6; credit('brosser'); note('Que de poils roux par terre !'); } },
    { room: 'sdb', id: 'bain', name: 'Donner un bain à Simba', desc: 'Il n’aime pas trop l’eau…', tag: 'simba', dur: 35,
      verb: 'Shampoing et éclaboussures…', task: 'bain',
      avail: (s) => (s.muddy ? true : 'Simba n’est pas sale.'),
      run: (s) => { s.muddy = false; s.simba.bonheur -= 8; s.simba.pelage = clamp(s.simba.pelage - 15); s.nena.hygiene -= 15; s.maison.linge += 1; credit('bain'); note('Simba est propre… et Nena trempée !'); } },
    { room: 'sdb', id: 'lessive', name: 'Lancer une lessive', desc: 'Serviettes, pyjamas, plaids pleins de poils.', tag: 'maison', dur: 15,
      verb: 'La machine tourne…', task: 'lessive',
      avail: (s) => (s.maison.linge > 0 ? true : 'Le panier à linge est vide.'),
      run: (s) => { s.maison.linge = 0; s.nena.moral += 2; credit('lessive'); } },

    // Cuisine
    { room: 'cuisine', id: 'repas', name: (s) => mealName(s.time), desc: 'Utilise 1 repas du frigo.', tag: 'nena', dur: 20,
      verb: 'Nena cuisine et mange…', task: 'repas',
      avail: (s) => (s.food <= 0 ? 'Le frigo est vide : va faire les courses.' : s.nena.faim > 88 ? 'Nena n’a pas faim.' : true),
      run: (s) => { s.food -= 1; s.nena.faim += 42; s.nena.moral += 4; s.maison.vaisselle += 1; credit('repas'); } },
    { room: 'cuisine', id: 'gamelle', name: 'Remplir la gamelle', desc: 'Matin avant midi, soir après 17:00.', tag: 'simba', dur: 3,
      verb: 'Simba remue la queue devant sa gamelle…', task: (s) => (s.time < 12 * 60 ? 'gamelle_matin' : s.time >= 17 * 60 ? 'gamelle_soir' : null),
      avail: (s) => (s.kibble <= 0 ? 'Plus de croquettes !' : s.simba.ventre > 80 ? 'Simba n’a pas faim.' : true),
      run: (s) => {
        s.kibble -= 1; s.simba.ventre += 55; s.simba.bonheur += 5;
        if (s.time < 12 * 60) credit('gamelle_matin');
        else if (s.time >= 17 * 60) credit('gamelle_soir');
      } },
    { room: 'cuisine', id: 'eau', name: 'Changer l’eau de Simba', desc: 'Une gamelle d’eau fraîche.', tag: 'simba', dur: 2,
      verb: 'Glouglou…', task: 'eau',
      avail: (s) => (s.simba.eau < 85 ? true : 'Sa gamelle d’eau est pleine.'),
      run: (s) => { s.simba.eau = 100; credit('eau'); } },
    { room: 'cuisine', id: 'friandise', name: 'Donner une friandise', desc: '3 par jour maximum.', tag: 'simba', dur: 1,
      verb: 'Assis… la patte… bravo !',
      avail: (s) => (s.today.treats < 3 ? true : 'Assez de friandises pour aujourd’hui.'),
      run: (s) => { s.today.treats++; s.simba.bonheur += 10; s.simba.ventre += 5; } },
    { room: 'cuisine', id: 'vaisselle', name: 'Faire la vaisselle', desc: 'Une cuisine nette avant de dormir.', tag: 'maison', dur: 15,
      verb: 'Ça mousse dans l’évier…', task: 'vaisselle',
      avail: (s) => (s.maison.vaisselle > 0 ? true : 'Pas de vaisselle sale.'),
      run: (s) => { s.maison.vaisselle = 0; s.nena.moral += 2; } },

    // Salon
    { room: 'salon', id: 'travail', name: 'Télétravail (2 h)', desc: '+45 € · entre 08:00 et 19:00.', tag: 'nena', dur: 120,
      verb: 'Nena travaille sur son ordinateur…', task: 'travail', working: true,
      avail: (s) => (s.time < 8 * 60 || s.time > 19 * 60 ? 'Le bureau est fermé à cette heure.' : s.nena.energie < 20 ? 'Nena est trop fatiguée.' : true),
      run: (s) => { s.money += 45; s.nena.energie -= 12; s.nena.moral -= 5; s.simba.bonheur -= 8; credit('travail'); note('+45 € gagnés', 'good'); } },
    { room: 'salon', id: 'balle', name: 'Jouer à la balle', desc: 'Simba adore la ramener… parfois.', tag: 'simba', dur: 15,
      verb: 'Lancer, courir, rapporter !', task: 'jouer',
      run: (s) => { s.simba.bonheur += 25; s.nena.energie -= 5; s.nena.moral += 6; credit('jouer'); } },
    { room: 'salon', id: 'aspirateur', name: 'Passer l’aspirateur', desc: 'Les poils roux s’accumulent vite.', tag: 'maison', dur: 20,
      verb: 'Vrrrrr ! Simba aboie sur l’aspirateur…', task: 'aspirateur',
      avail: (s) => (s.maison.proprete < 92 ? true : 'La maison est déjà propre.'),
      run: (s) => { s.maison.proprete = 100; s.simba.bonheur -= 4; credit('aspirateur'); } },
    { room: 'salon', id: 'serie', name: 'Série sur le canapé', desc: 'Simba ronfle sur ses genoux.', tag: 'nena', dur: 45,
      verb: 'Encore un épisode…',
      run: (s) => { s.nena.moral += 14; s.nena.energie += 5; s.simba.bonheur += 8; } },

    // Dehors
    { room: 'dehors', id: 'promenade', name: 'Promener Simba', desc: 'Pipi, reniflage et air frais.', tag: 'simba', dur: 30,
      verb: 'Promenade dans le quartier…', task: 'promenade', walk: true,
      avail: needDressed,
      run: (s) => {
        s.simba.pipi = 100; s.simba.bonheur += 14; s.nena.energie -= 6; s.nena.moral += 5; credit('promenade');
        walkEvent(s);
      } },
    { room: 'dehors', id: 'parc', name: 'Parc à chiens (1 h)', desc: 'Compte comme une promenade, Simba se défoule.', tag: 'simba', dur: 60,
      verb: 'Simba court avec ses copains…', task: 'promenade', walk: true,
      avail: needDressed,
      run: (s) => {
        s.simba.pipi = 100; s.simba.bonheur += 35; s.nena.energie -= 12; s.nena.moral += 8; credit('promenade'); credit('jouer');
        walkEvent(s, 0.2);
      } },
    { room: 'dehors', id: 'courses', name: 'Courses pour Nena', desc: '−24 € · +4 repas au frigo.', tag: 'maison', dur: 40,
      verb: 'Nena remplit son panier…', task: 'courses',
      avail: (s) => (!s.dressed ? 'Nena est encore en pyjama !' : s.money < 24 ? 'Pas assez d’argent (24 €).' : true),
      run: (s) => { s.money -= 24; s.food += 4; s.simba.bonheur -= 6; credit('courses'); } },
    { room: 'dehors', id: 'croquettes', name: 'Sac de croquettes', desc: '−20 € · +8 portions pour Simba.', tag: 'simba', dur: 25,
      verb: 'Direction l’animalerie…', task: 'courses',
      avail: (s) => (!s.dressed ? 'Nena est encore en pyjama !' : s.money < 20 ? 'Pas assez d’argent (20 €).' : true),
      run: (s) => { s.money -= 20; s.kibble += 8; s.simba.bonheur -= 4; credit('courses'); } },
    { room: 'dehors', id: 'veto', name: 'Visite chez le véto', desc: '−30 € · contrôle annuel, entre 09:00 et 18:00.', tag: 'simba', dur: 60,
      verb: 'Simba tremble un peu dans la salle d’attente…', task: 'veto',
      avail: (s) => (!S.today.tasks.find((t) => t.id === 'veto') ? 'Pas de rendez-vous aujourd’hui.' : !s.dressed ? 'Nena est encore en pyjama !' :
        s.time < 9 * 60 || s.time > 18 * 60 ? 'Le cabinet est fermé.' : s.money < 30 ? 'Pas assez d’argent (30 €).' : true),
      run: (s) => { s.money -= 30; s.simba.bonheur -= 6; credit('veto'); note('Le véto : « Simba est en pleine forme ! »', 'good'); } },
  ];

  function walkEvent(s, extra = 0) {
    const r = rnd();
    if (r < 0.14 + extra) {
      s.muddy = true; addTask('bain');
      note('Simba s’est roulé dans une flaque de boue ! Un bain s’impose.', 'bad');
    } else if (r < 0.32 + extra) {
      s.simba.bonheur += 10;
      note('Simba a rencontré Biscotte, sa copine shiba.', 'good');
    } else if (r < 0.4 + extra) {
      s.nena.moral += 8;
      note('Une passante : « Oh, on dirait un petit ours ! »', 'good');
    }
  }
  function mealName(t) {
    const h = t / 60;
    if (h < 11) return 'Petit-déjeuner';
    if (h < 15) return 'Déjeuner';
    if (h < 18) return 'Goûter';
    return 'Dîner';
  }
  const val = (x, s) => (typeof x === 'function' ? x(s) : x);
  const actionTask = (a) => val(a.task, S);

  /* ------------------------------------------------------------------ */
  /* Pièces & décors                                                     */
  /* ------------------------------------------------------------------ */
  const ROOMS = {
    chambre: { name: 'Chambre', nena: [46, 7], simba: [68, 6] },
    sdb:     { name: 'Salle de bain', nena: [58, 6], simba: [78, 5] },
    cuisine: { name: 'Cuisine', nena: [40, 6], simba: [70, 5] },
    salon:   { name: 'Salon', nena: [62, 7], simba: [38, 6] },
    dehors:  { name: 'Dehors', nena: [42, 9], simba: [60, 8] },
  };

  function fluff(s) {
    // moutons de poils roux sur le sol quand la maison est sale
    const count = Math.round((100 - s.maison.proprete) / 14);
    const spots = [[120, 420], [250, 400], [520, 430], [640, 395], [740, 425], [380, 438], [60, 400]];
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
    let lights = '';
    if (night) {
      for (let i = 0; i < 9; i++) lights += `<circle cx="${x + 12 + ((i * 37) % (w - 20))}" cy="${y + h - 18 - ((i * 23) % 30)}" r="3" fill="#ffc96b" opacity=".9"/>`;
    }
    return `<defs><linearGradient id="sky${x}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
      <rect x="${x - 8}" y="${y - 8}" width="${w + 16}" height="${h + 16}" rx="6" fill="#5b3a2c"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#sky${x})"/>
      <path d="M${x} ${y + h} v-28 h${w * 0.18} v-16 h${w * 0.16} v22 h${w * 0.2} v-34 h${w * 0.2} v20 h${w * 0.26} v36z" fill="${night ? '#2a2a4a' : '#9cb4c8'}" opacity=".85"/>
      ${lights}
      <rect x="${x + w / 2 - 3}" y="${y}" width="6" height="${h}" fill="#5b3a2c"/>
      <rect x="${x}" y="${y + h / 2 - 3}" width="${w}" height="6" fill="#5b3a2c"/>`;
  }
  function floor(color, rug) {
    return `<rect x="0" y="330" width="800" height="120" fill="${color}"/>
      <rect x="0" y="326" width="800" height="8" fill="rgba(0,0,0,.12)"/>
      ${rug ? `<ellipse cx="400" cy="405" rx="260" ry="34" fill="${rug}"/>` : ''}`;
  }

  const DRAW = {
    chambre(s) {
      const made = s.maison.lit;
      return `<rect width="800" height="450" fill="#ecd6c3"/>
        <rect y="0" width="800" height="18" fill="#dcbfa8"/>
        ${windowSvg(560, 70, 170, 150, s)}
        <path d="M540 52 h40 v210 q-20 -40 -40 -10z" fill="#e8d2bb"/><path d="M750 52 h-40 v210 q20 -40 40 -10z" fill="#e8d2bb"/>
        ${floor('#b9875f', '#f0b6c8')}
        <rect x="60" y="190" width="330" height="110" rx="18" fill="#a77450"/>
        <rect x="52" y="268" width="346" height="82" rx="24" fill="#f4e7d4"/>
        ${made
          ? `<rect x="52" y="282" width="346" height="68" rx="22" fill="#e7cfb1"/><path d="M60 300 h330" stroke="#d6b994" stroke-width="3"/>
             <rect x="78" y="248" width="110" height="40" rx="18" fill="#fff8ee"/><rect x="200" y="248" width="110" height="40" rx="18" fill="#fff8ee"/>`
          : `<path d="M52 300 q40 -40 90 -6 q50 -30 90 6 q50 -40 100 0 q40 -20 66 4 v46 h-346z" fill="#e7cfb1"/>
             <rect x="70" y="240" width="110" height="40" rx="18" fill="#fff8ee" transform="rotate(-10 125 260)"/>`}
        <rect x="408" y="262" width="80" height="80" rx="8" fill="#8a5a3c"/>
        <rect x="424" y="226" width="12" height="38" fill="#6d4630"/>
        <path d="M402 230 l26 -54 l26 54z" fill="${nightLevel(s.time) > 0.3 ? '#ffd98a' : '#f4e2c4'}"/>
        <rect x="452" y="244" width="22" height="18" rx="4" fill="#fff"/>
        <path d="M455 236 q4 -8 0 -14 M462 236 q4 -8 0 -14" stroke="#c9b8a4" stroke-width="2" fill="none"/>
        <g fill="#6f9a52"><ellipse cx="770" cy="300" rx="14" ry="24"/><ellipse cx="750" cy="290" rx="12" ry="22" transform="rotate(-25 750 290)"/></g>
        <rect x="748" y="306" width="40" height="30" rx="6" fill="#c97b52"/>
        ${fluff(s)}`;
    },
    sdb(s) {
      let tiles = '';
      for (let y = 0; y < 330; y += 40) for (let x = 0; x < 800; x += 40) tiles += `<rect x="${x + 1}" y="${y + 1}" width="38" height="38" fill="#d4e6e8"/>`;
      const linge = Math.min(3, s.maison.linge);
      let basket = '';
      for (let i = 0; i < linge; i++) basket += `<ellipse cx="${708 + i * 8}" cy="${300 - i * 10}" rx="22" ry="9" fill="${['#f19bb8', '#9cc2d9', '#f6d9b8'][i]}"/>`;
      return `<rect width="800" height="450" fill="#c3dadd"/>${tiles}
        ${floor('#e9e2d8', '#9cc2d9')}
        <rect x="40" y="230" width="300" height="110" rx="48" fill="#fffdf9"/>
        <rect x="56" y="244" width="268" height="40" rx="20" fill="#bfe1ee"/>
        <circle cx="120" cy="246" r="10" fill="#fff"/><circle cx="140" cy="240" r="7" fill="#fff"/><circle cx="160" cy="248" r="9" fill="#fff"/>
        <rect x="70" y="150" width="8" height="90" fill="#b8c1c6"/><path d="M60 150 h40 l-10 14 h-20z" fill="#b8c1c6"/>
        <rect x="400" y="90" width="120" height="140" rx="60" fill="#f6efe6" stroke="#b6a089" stroke-width="6"/>
        <rect x="410" y="240" width="100" height="22" rx="8" fill="#fffdf9"/><rect x="440" y="262" width="40" height="70" fill="#f1ebe2"/>
        <rect x="560" y="190" width="110" height="145" rx="12" fill="#f8f6f3" stroke="#d8d2ca" stroke-width="3"/>
        <circle cx="615" cy="270" r="38" fill="#9db7c2" stroke="#ccc4ba" stroke-width="6"/>
        <circle cx="580" cy="208" r="5" fill="#e98aab"/><circle cx="598" cy="208" r="5" fill="#8fcf8f"/>
        <rect x="684" y="290" width="70" height="46" rx="10" fill="#c9a67a"/>${basket}
        ${fluff(s)}`;
    },
    cuisine(s) {
      let tiles = '';
      for (let x = 40; x < 460; x += 30) tiles += `<rect x="${x}" y="180" width="28" height="68" fill="#f7efe2"/>`;
      let dishes = '';
      for (let i = 0; i < Math.min(5, s.maison.vaisselle); i++) dishes += `<ellipse cx="${140 + (i % 2) * 6}" cy="${244 - i * 8}" rx="34" ry="6" fill="#fffaf2" stroke="#c9b8a4" stroke-width="2"/>`;
      const foodLvl = s.simba.ventre > 70 ? 0 : 12;
      const water = Math.round(s.simba.eau / 100 * 10);
      return `<rect width="800" height="450" fill="#f1dfc5"/>${tiles}
        ${windowSvg(250, 50, 150, 110, s)}
        ${floor('#c8a27a')}
        <rect x="30" y="248" width="440" height="92" fill="#a8744d"/>
        <rect x="24" y="240" width="452" height="14" rx="4" fill="#e9dcc6"/>
        <g fill="#8e5f3e"><rect x="50" y="268" width="120" height="60" rx="6"/><rect x="190" y="268" width="120" height="60" rx="6"/><rect x="330" y="268" width="120" height="60" rx="6"/></g>
        <rect x="290" y="220" width="70" height="22" rx="10" fill="#c9cfd3"/>
        ${dishes}
        <rect x="490" y="110" width="120" height="230" rx="16" fill="#f7f4ef" stroke="#ddd5ca" stroke-width="3"/>
        <path d="M490 190 h120" stroke="#ddd5ca" stroke-width="3"/><rect x="590" y="140" width="6" height="34" rx="3" fill="#b8b0a6"/>
        <rect x="590" y="210" width="6" height="40" rx="3" fill="#b8b0a6"/>
        <text x="550" y="300" text-anchor="middle" font-family="Nunito, sans-serif" font-size="16" font-weight="800" fill="#b8b0a6">${s.food} repas</text>
        <path d="M655 400 h60 l-8 22 h-44z" fill="#e98aab"/>
        <ellipse cx="685" cy="400" rx="30" ry="6" fill="${foodLvl ? '#9a6232' : '#c95f84'}"/>
        <path d="M725 400 h60 l-8 22 h-44z" fill="#7aa6c2"/>
        <ellipse cx="755" cy="400" rx="${18 + water}" ry="5" fill="${water > 2 ? '#bfe6f5' : '#5d88a3'}"/>
        <text x="720" y="442" text-anchor="middle" font-family="Baloo 2, sans-serif" font-size="15" font-weight="700" fill="#7a5c4e">SIMBA</text>
        ${fluff(s)}`;
    },
    salon(s) {
      const tv = s.time >= 8 * 60 && s.time <= 19 * 60;
      return `<rect width="800" height="450" fill="#ead4d8"/>
        <rect y="200" width="800" height="130" fill="#e0c3c8"/>
        ${windowSvg(330, 50, 150, 120, s)}
        ${floor('#a8774f', '#e6c38d')}
        <rect x="560" y="210" width="190" height="10" rx="4" fill="#7c533a"/>
        <rect x="575" y="220" width="10" height="110" fill="#7c533a"/><rect x="725" y="220" width="10" height="110" fill="#7c533a"/>
        <rect x="610" y="150" width="96" height="62" rx="6" fill="#3a3550"/>
        <rect x="616" y="156" width="84" height="50" rx="3" fill="${tv ? '#9fd0e8' : '#4b4766'}"/>
        <rect x="650" y="210" width="16" height="6" fill="#3a3550"/>
        <rect x="60" y="230" width="320" height="100" rx="30" fill="#d07f9b"/>
        <rect x="80" y="196" width="280" height="70" rx="26" fill="#df95ae"/>
        <rect x="40" y="250" width="50" height="80" rx="20" fill="#c06b89"/><rect x="350" y="250" width="50" height="80" rx="20" fill="#c06b89"/>
        <rect x="120" y="214" width="60" height="44" rx="14" fill="#f6d9b8"/>
        <circle cx="520" cy="410" r="12" fill="#d8e650"/><path d="M510 404 q10 8 20 0" stroke="#fff" stroke-width="2" fill="none"/>
        <g fill="#6f9a52"><ellipse cx="40" cy="160" rx="18" ry="34"/><ellipse cx="62" cy="150" rx="14" ry="28" transform="rotate(25 62 150)"/><ellipse cx="22" cy="150" rx="14" ry="28" transform="rotate(-25 22 150)"/></g>
        <rect x="20" y="186" width="44" height="40" rx="6" fill="#c97b52"/>
        ${fluff(s)}`;
    },
    dehors(s) {
      const [a, b] = skyColor(s.time);
      const night = nightLevel(s.time) > 0.4;
      let bld = '';
      const xs = [[0, 150, 90], [100, 110, 70], [180, 180, 100], [300, 130, 80], [390, 200, 90], [500, 140, 120], [640, 170, 80], [720, 120, 90]];
      xs.forEach(([x, h, w], i) => {
        bld += `<rect x="${x}" y="${270 - h}" width="${w}" height="${h}" fill="${night ? '#2c2b4a' : ['#b9c4d3', '#a9b6c8', '#c6cfdb'][i % 3]}"/>`;
        for (let wy = 270 - h + 14; wy < 256; wy += 22) for (let wx = x + 10; wx < x + w - 10; wx += 20)
          bld += `<rect x="${wx}" y="${wy}" width="9" height="11" fill="${night ? ((wx + wy) % 3 ? '#ffcf73' : '#3b3a5c') : '#e8eef5'}"/>`;
      });
      return `<defs><linearGradient id="skyOut" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
        <rect width="800" height="450" fill="url(#skyOut)"/>
        ${night ? '<circle cx="660" cy="70" r="26" fill="#fff3c9"/><circle cx="672" cy="62" r="24" fill="' + a + '"/>' : '<circle cx="660" cy="70" r="30" fill="#ffe08a"/>'}
        ${bld}
        <rect y="270" width="800" height="180" fill="${night ? '#3f5a3a' : '#8fbf6a'}"/>
        <path d="M0 360 q400 -60 800 0 v40 q-400 -60 -800 0z" fill="${night ? '#6b5d4d' : '#e3cfa6'}"/>
        <g><rect x="96" y="210" width="16" height="90" fill="#7a5233"/><circle cx="104" cy="200" r="46" fill="${night ? '#2f4a2c' : '#5f9a4c'}"/><circle cx="78" cy="220" r="30" fill="${night ? '#35532f' : '#6fae58'}"/></g>
        <g><rect x="690" y="220" width="14" height="80" fill="#7a5233"/><circle cx="697" cy="208" r="40" fill="${night ? '#2f4a2c' : '#5f9a4c'}"/></g>
        <rect x="560" y="300" width="100" height="10" rx="4" fill="#9a6b44"/><rect x="560" y="284" width="100" height="8" rx="4" fill="#9a6b44"/>
        <rect x="568" y="310" width="6" height="22" fill="#6d4a2e"/><rect x="646" y="310" width="6" height="22" fill="#6d4a2e"/>
        <rect x="300" y="200" width="6" height="140" fill="#4a4a5a"/><circle cx="303" cy="196" r="12" fill="${night ? '#ffd98a' : '#d9d9e0'}"/>
        ${night ? '<circle cx="303" cy="196" r="40" fill="#ffd98a" opacity=".25"/>' : ''}
        <ellipse cx="200" cy="420" rx="24" ry="8" fill="${night ? '#33475a' : '#7d9fb3'}" opacity=".8"/>`;
    },
  };

  /* ------------------------------------------------------------------ */
  /* Rendu                                                               */
  /* ------------------------------------------------------------------ */
  const NEEDS = {
    nena: [['faim', 'Ventre'], ['energie', 'Énergie'], ['hygiene', 'Hygiène'], ['moral', 'Moral']],
    simba: [['ventre', 'Ventre'], ['eau', 'Eau'], ['pipi', 'Vessie'], ['pelage', 'Pelage'], ['bonheur', 'Bonheur']],
  };
  function barColor(v) { return v < 25 ? 'var(--bad)' : v < 50 ? 'var(--warn)' : 'var(--good)'; }
  function needRow(label, v) {
    const r = Math.round(v);
    return `<div class="need${r < 25 ? ' low' : ''}"><span class="need-name">${label}</span>
      <div class="need-bar" role="meter" aria-label="${label}" aria-valuenow="${r}" aria-valuemin="0" aria-valuemax="100"><div class="need-fill" style="width:${r}%;background:${barColor(r)}"></div></div>
      <span class="need-val">${r}</span></div>`;
  }

  function renderHud() {
    $('hud-day').textContent = S.day;
    $('hud-time').textContent = hh(S.time);
    $('hud-period').textContent = period(S.time);
    $('hud-money').textContent = S.money + ' €';
    $('hud-kibble').textContent = S.kibble;
    $('hud-food').textContent = S.food;
    [0, 1, 3].forEach((v) => $('spd-' + v).setAttribute('aria-pressed', String(S.speed === v)));
  }

  function renderScene() {
    $('scene-bg').innerHTML = DRAW[S.room](S);
    const lvl = S.room === 'dehors' ? nightLevel(S.time) * 0.55 : nightLevel(S.time) * 0.7;
    $('scene').style.setProperty('--nightlvl', lvl.toFixed(2));
    const pos = ROOMS[S.room];
    const nena = $('nena'), simba = $('simba');
    nena.style.left = pos.nena[0] + '%'; nena.style.bottom = pos.nena[1] + '%';
    simba.style.left = pos.simba[0] + '%'; simba.style.bottom = pos.simba[1] + '%';
    nena.classList.toggle('dressed', S.dressed);
    nena.classList.toggle('sad', S.nena.moral < 30);
    simba.classList.toggle('happy', S.simba.bonheur >= 60);
    simba.classList.toggle('muddy', S.muddy);

    // bulles de besoin
    const d = S.simba;
    const dogNeeds = [[d.pipi, 'Sortir ! 🌳'], [d.eau, 'Soif… 💧'], [d.ventre, 'Faim ! 🍖'], [d.bonheur, 'Joue avec moi 🎾'], [d.pelage, 'Brosse-moi ✨']]
      .filter(([v]) => v < 30).sort((x, y) => x[0] - y[0]);
    const sb = $('simba-bubble');
    if (S.muddy) { sb.hidden = false; sb.textContent = 'Tout boueux 🛁'; }
    else if (dogNeeds.length && !busy) { sb.hidden = false; sb.textContent = dogNeeds[0][1]; }
    else sb.hidden = true;

    const n = S.nena;
    const hers = [[n.energie, 'Je suis épuisée…'], [n.faim, 'J’ai faim…'], [n.hygiene, 'Une douche ?'], [n.moral, 'Pas le moral…']]
      .filter(([v]) => v < 25).sort((x, y) => x[0] - y[0]);
    const nb = $('nena-bubble');
    if (hers.length && !busy) { nb.hidden = false; nb.textContent = hers[0][1]; }
    else if (S.time >= 22 * 60 && !busy) { nb.hidden = false; nb.textContent = 'Il est tard, au lit !'; }
    else nb.hidden = true;
  }

  function roomHasTodo(room) {
    return ACTIONS.some((a) => a.room === room && isTodo(a) && val(a.avail || (() => true), S) === true);
  }
  function isTodo(a) {
    const id = actionTask(a);
    if (!id) return false;
    const t = S.today.tasks.find((x) => x.id === id);
    if (!t) return false;
    if (TASKS[id].check) return !TASKS[id].check(S);
    return t.done < t.need;
  }

  function renderRooms() {
    const nav = $('rooms');
    nav.innerHTML = Object.entries(ROOMS).map(([id, r]) =>
      `<button type="button" class="room-btn" data-room="${id}" aria-current="${S.room === id}" ${busy ? 'disabled' : ''}>
        ${r.name}${roomHasTodo(id) && S.room !== id ? '<span class="dot" aria-label="tâche à faire"></span>' : ''}</button>`).join('');
  }

  function renderActions() {
    $('room-title').textContent = ROOMS[S.room].name;
    const list = ACTIONS.filter((a) => a.room === S.room);
    $('actions').innerHTML = list.map((a) => {
      const ok = a.avail ? a.avail(S) : true;
      const todo = isTodo(a);
      const tagTxt = { nena: 'Nena', simba: 'Simba', maison: 'Maison' }[a.tag];
      return `<button type="button" class="action${ok !== true ? ' locked' : ''}${todo && ok === true ? ' todo' : ''}" data-action="${a.id}" ${busy ? 'disabled' : ''} aria-disabled="${ok !== true}">
        <span class="a-top"><span class="a-name">${val(a.name, S)}</span><span class="a-dur">${a.dur ? durTxt(a.dur) : ''}</span></span>
        <span class="a-desc">${ok === true ? a.desc : ok}</span>
        <span class="a-tag ${a.tag}">${tagTxt}${todo ? ' · à faire' : ''}</span>
      </button>`;
    }).join('');
  }

  function renderNeeds() {
    $('needs-nena').innerHTML = NEEDS.nena.map(([k, l]) => needRow(l, S.nena[k])).join('');
    $('needs-simba').innerHTML = NEEDS.simba.map(([k, l]) => needRow(l, S.simba[k])).join('');
    $('needs-home').innerHTML = needRow('Propreté', S.maison.proprete) +
      `<div class="need"><span class="need-name">Vaisselle</span><span>${S.maison.vaisselle ? S.maison.vaisselle + ' assiette(s) sale(s)' : 'Rangée'}</span><span></span></div>` +
      `<div class="need"><span class="need-name">Linge</span><span>${S.maison.linge ? S.maison.linge + ' panier(s)' : 'Panier vide'}</span><span></span></div>`;
  }

  function taskDone(t) {
    const def = TASKS[t.id];
    return def.check ? def.check(S) : t.done >= t.need;
  }
  function renderTasks() {
    const ts = S.today.tasks;
    const done = ts.filter(taskDone).length;
    $('tasks-count').textContent = done + ' / ' + ts.length;
    $('tasks').innerHTML = ts.map((t) => {
      const def = TASKS[t.id];
      const ok = taskDone(t);
      return `<li class="task${ok ? ' done' : ''}"><span class="box">${ok ? '✓' : ''}</span>
        <span class="t-label"><span class="who ${def.who}"></span>${def.label}</span>
        <span class="t-count">${t.need > 1 && !def.check ? t.done + '/' + t.need : ''}</span></li>`;
    }).join('');
  }

  const BONDS = [
    [0, 'Nouvelle colocation'], [6, 'Premiers pas ensemble'], [15, 'Duo complice'],
    [30, 'Inséparables'], [50, 'Meilleurs amis pour la vie'], [80, 'Âmes sœurs à poils roux'],
  ];
  function renderBond() {
    let cur = BONDS[0], next = null;
    for (let i = 0; i < BONDS.length; i++) if (S.stars >= BONDS[i][0]) { cur = BONDS[i]; next = BONDS[i + 1] || null; }
    $('bond-stars').textContent = S.stars + ' ★';
    $('bond-title').textContent = cur[1];
    const pct = next ? ((S.stars - cur[0]) / (next[0] - cur[0])) * 100 : 100;
    $('bond-fill').style.width = pct + '%';
    $('bond-next').textContent = next ? `Encore ${next[0] - S.stars} ★ pour « ${next[1]} »` : 'Niveau maximum atteint !';
  }

  function render() {
    renderHud(); renderScene(); renderRooms(); renderActions(); renderNeeds(); renderTasks(); renderBond();
    flushToasts();
  }

  function toast(msg, kind) {
    const box = $('toasts');
    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.textContent = msg;
    box.appendChild(el);
    while (box.children.length > 4) box.firstChild.remove();
    setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(), 450); }, 3800);
  }
  function flushToasts() { while (pendingToasts.length) toast(...pendingToasts.shift()); }

  /* ------------------------------------------------------------------ */
  /* Exécution d'une action                                              */
  /* ------------------------------------------------------------------ */
  function doAction(id) {
    if (busy || modalOpen) return;
    const a = ACTIONS.find((x) => x.id === id);
    if (!a) return;
    const ok = a.avail ? a.avail(S) : true;
    if (ok !== true) { toast(ok, 'bad'); return; }
    if (!a.dur) { a.run(S); after(); return; }

    busy = true;
    const nena = $('nena'), simba = $('simba');
    nena.classList.toggle('working', !a.walk && !a.sleepy);
    if (a.walk) { nena.classList.add('walking'); simba.classList.add('walking'); }
    if (a.sleepy) { nena.classList.add('asleep'); simba.classList.add('asleep'); }
    $('busy-label').textContent = a.verb;
    $('busy').hidden = false;
    renderRooms(); renderActions(); renderScene();

    const start = S.time;
    const total = a.dur;
    const ms = Math.min(2200, 700 + total * 12);
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
      clampAll();
      after();
    }
    requestAnimationFrame(frame);
  }
  function clampAll() {
    for (const k in S.nena) S.nena[k] = clamp(S.nena[k]);
    for (const k in S.simba) S.simba[k] = clamp(S.simba[k]);
    S.maison.proprete = clamp(S.maison.proprete);
  }
  function after() { clampAll(); render(); save(); }

  /* ------------------------------------------------------------------ */
  /* Fin de journée                                                      */
  /* ------------------------------------------------------------------ */
  let lastSummary = null;
  function endDay(collapsed) {
    if (modalOpen) return;
    const ts = S.today.tasks;
    const done = ts.filter(taskDone);
    const ratio = done.length / ts.length;
    let stars = ratio >= 0.9 ? 3 : ratio >= 0.65 ? 2 : ratio >= 0.35 ? 1 : 0;
    const notes = [];
    if (collapsed) { stars = Math.max(0, stars - 1); notes.push('Nena s’est endormie d’épuisement sur le canapé (−1 ★).'); }
    if (S.today.accidents) notes.push(`${S.today.accidents} accident(s) pipi : pense à sortir Simba plus souvent.`);
    if (S.today.mischief) notes.push(`${S.today.mischief} bêtise(s) : Simba s’ennuyait.`);
    if (S.simba.bonheur >= 80 && S.nena.moral >= 70) notes.push('Nena et Simba s’endorment heureux, blottis l’un contre l’autre. 💕');
    S.stars += stars;
    S.history.push({ day: S.day, stars, done: done.length, total: ts.length });
    lastSummary = { day: S.day, stars, collapsed, notes, tasks: ts.map((t) => ({ label: TASKS[t.id].label, ok: taskDone(t) })), bedtime: S.time };
    S.pendingNight = lastSummary;
    showNight(lastSummary);
    save();
  }

  function showNight(sum) {
    modalOpen = true;
    $('night-title').textContent = sum.collapsed ? 'Nena s’est écroulée…' : `Bonne nuit, jour ${sum.day} !`;
    const done = sum.tasks.filter((t) => t.ok).length;
    $('night-sub').textContent = `Couchée à ${hh(sum.bedtime)} · ${done} tâche(s) sur ${sum.tasks.length} accomplie(s).`;
    $('night-stars').innerHTML = [0, 1, 2].map((i) => `<span class="${i < sum.stars ? 'on' : ''}">★</span>`).join('');
    $('night-stars').setAttribute('aria-label', sum.stars + ' étoile(s) sur 3');
    $('night-list').innerHTML = sum.tasks.map((t) => `<li class="${t.ok ? 'ok' : 'ko'}">${t.ok ? '✓' : '✗'} ${t.label}</li>`).join('');
    $('night-notes').textContent = sum.notes.join(' ');
    $('night-screen').hidden = false;
    $('btn-next-day').focus();
  }

  function nextDay() {
    const sum = S.pendingNight || lastSummary;
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
    S.simba.pipi = clamp(Math.min(S.simba.pipi, 100) - 55, 15);
    S.simba.bonheur = clamp(S.simba.bonheur + 5);
    S.maison.lit = false;
    S.maison.linge += 1;
    S.maison.proprete = clamp(S.maison.proprete - 8);
    S.dressed = false;
    S.room = 'chambre';
    S.today = makeDay(S.day);
    if (S.muddy) addTask('bain');
    S.pendingNight = null;
    $('night-screen').hidden = true;
    modalOpen = false;
    note(`Jour ${S.day} : Simba te réveille avec un coup de truffe !`);
    if (S.today.tasks.find((t) => t.id === 'veto')) note('Rappel : rendez-vous chez le véto aujourd’hui.', '');
    if (S.money < 20 && S.kibble < 3) { S.money += 30; note('Mamie t’a envoyé 30 € « pour les croquettes de Simba ».', 'good'); }
    after();
  }

  /* ------------------------------------------------------------------ */
  /* Sauvegarde                                                          */
  /* ------------------------------------------------------------------ */
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* stockage indisponible */ }
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !data.nena || !data.today) return null;
      return data;
    } catch (e) { return null; }
  }

  /* ------------------------------------------------------------------ */
  /* Boucle temps réel : 1 seconde = 1 minute (x3 en rapide)              */
  /* ------------------------------------------------------------------ */
  let lastMinuteRender = 0;
  setInterval(() => {
    if (modalOpen || busy || !S.speed) return;
    const alive = advance(S.speed);
    if (!alive) return;
    clampAll();
    renderHud(); renderNeeds(); renderTasks(); flushToasts();
    // décor, bulles et boutons : moins souvent
    if (S.time - lastMinuteRender >= 5 || S.time < lastMinuteRender) {
      lastMinuteRender = S.time;
      renderScene(); renderActions(); renderRooms();
      save();
    }
  }, 1000);

  /* ------------------------------------------------------------------ */
  /* Evénements UI                                                       */
  /* ------------------------------------------------------------------ */
  $('rooms').addEventListener('click', (e) => {
    const b = e.target.closest('[data-room]');
    if (!b || busy || modalOpen) return;
    if (S.room === b.dataset.room) return;
    S.room = b.dataset.room;
    ['nena', 'simba'].forEach((id) => { $(id).classList.add('walking'); setTimeout(() => $(id).classList.remove('walking'), 900); });
    advance(2); // se déplacer prend un peu de temps
    after();
  });
  $('actions').addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]');
    if (b) doAction(b.dataset.action);
  });
  [0, 1, 3].forEach((v) => $('spd-' + v).addEventListener('click', () => { S.speed = v; renderHud(); save(); }));

  function startGame(state) {
    S = state;
    $('title-screen').hidden = true;
    modalOpen = false;
    if (S.pendingNight) { lastSummary = S.pendingNight; render(); showNight(S.pendingNight); return; }
    render();
  }
  $('btn-new').addEventListener('click', () => {
    if (load()) { $('confirm-screen').hidden = false; $('btn-confirm-no').focus(); return; }
    startGame(newState());
    note('Bienvenue ! Simba attend sa gamelle et sa promenade du matin.');
    flushToasts();
  });
  $('btn-confirm-yes').addEventListener('click', () => {
    $('confirm-screen').hidden = true;
    startGame(newState());
    note('Nouvelle vie à deux ! Simba attend sa gamelle et sa promenade du matin.');
    flushToasts();
    save();
  });
  $('btn-confirm-no').addEventListener('click', () => { $('confirm-screen').hidden = true; });
  $('btn-continue').addEventListener('click', () => { const d = load(); if (d) startGame(d); });
  $('btn-next-day').addEventListener('click', nextDay);

  document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && !modalOpen && e.target === document.body) {
      e.preventDefault(); S.speed = S.speed ? 0 : 1; renderHud();
    }
  });

  /* ------------------------------------------------------------------ */
  /* Démarrage                                                           */
  /* ------------------------------------------------------------------ */
  function boot() {
    const saved = load();
    if (saved) { $('btn-continue').hidden = false; $('continue-day').textContent = saved.day; }
    render(); // décor visible derrière l'écran titre
  }
  boot();
})();
