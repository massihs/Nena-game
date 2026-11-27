/* Nena & Simba — Busy Days.
   A time-management game in Tehran. The apartment is split into rooms (living room, kitchen,
   TV room, bedroom hallway, Nena's room with her bathroom); some days take place in the street
   or at CLAP, the Japanese-style hookah & tea place Nena and Negin love.
   Requests pop up in real time; tap to send Nena, carry items, chain combos. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const A = window.Art;
  const RA = window.RoomArt;
  const snd = (n, a) => { if (save.sound !== false && window.Sound) window.Sound.play(n, a); };
  const music = (name, night) => { if (!window.Sound) return; window.Sound.setTrack(name); window.Sound.setNight(!!night); window.Sound.setIntensity(0); };
  const HAPTIC = { tap: 6, deliver: 12, perfect: [10, 30, 16], combo: (n) => [8, 24, 8 + n * 3], star: [16, 40, 16, 40, 40], fail: [60, 40, 60], tick: 5, phew: [10, 50, 10] };
  const haptic = (k, n) => { const p = HAPTIC[k]; buzz(typeof p === 'function' ? p(n || 1) : p); };
  const COMBO_WORDS = ['', '', 'Nice!', 'Great!', 'Super!', 'Amazing!', 'Fantastic!', 'Incredible!', 'Unstoppable!'];
  function announce(big, small, tier) {
    const w = document.getElementById('stage-wrap'); if (!w) return;
    w.querySelectorAll('.announce').forEach((e) => e.remove());
    const e = document.createElement('div'); e.className = 'announce t' + (tier || 2);
    e.innerHTML = `<b>${big}</b>${small ? `<small>${small}</small>` : ''}`;
    w.appendChild(e); setTimeout(() => e.remove(), 1150);
  }
  const buzz = (p) => { try { if (save.vibe !== false && navigator.vibrate) navigator.vibrate(p); } catch (e) { /* */ } };
  const rnd = Math.random;
  const pick = (a) => a[Math.floor(rnd() * a.length)];

  /* ------------------------------------------------------------------ */
  /* Save                                                                */
  /* ------------------------------------------------------------------ */
  const KEY = 'nena-simba-rush-v1';
  let save = { level: 1, stars: {}, best: {}, medals: {}, coins: 0, up: {}, sound: true, music: true, seen: {} };
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.level) save = Object.assign(save, d); } catch (e) { /* */ }
  save.medals = save.medals || {};
  save.nails = save.nails || { week: -1 };
  ['tot', 'ach', 'friend', 'scenes', 'album', 'decor', 'chapters'].forEach((k) => { save[k] = save[k] || {}; });
  save.daily = save.daily || { last: '', streak: 0 };
  save.sortd = save.sortd || { date: '', done: [] };
  save.chal = save.chal || { date: '', done: false };
  save.week = save.week || { id: -1, prog: {}, claimed: [] };
  save.owned = save.owned || { basique: 1 };
  save.outfit = save.outfit || 'basique';
  if (save.collar === undefined) save.collar = null;
  save.endless = save.endless || 0;
  save.journey = save.journey || { date: '', sec: 0, got: [] };
  save.xp = save.xp || 0; save.plv = save.plv || 1; save.stickers = save.stickers || {}; save.sets = save.sets || {};
  save.wheel = save.wheel || { date: '', used: false, extra: 0 }; save.freeB = save.freeB || {}; save.dq = save.dq || { date: '', base: {}, claimed: false };
  save.wellness = save.wellness || {};
  save.life = save.life || {};
  save.games = save.games || { tricksBest: 0, tahdigBest: 0, tricksDay: '', tahdigDay: '' };
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* */ } };
  const up = (k) => save.up[k] || 0;

  /* ------------------------------------------------------------------ */
  /* World: rooms and stations (each room is a logical 600×800 scene)    */
  /* ------------------------------------------------------------------ */
  const ROOMS = {
    salon:   { name: 'Living room', short: 'Living', icon: '🛋️', door: [60, 540] },
    kitchen: { name: 'Kitchen', short: 'Kitchen', icon: '🍳', door: [565, 470] },
    tv:      { name: 'TV room', short: 'TV', icon: '📺', door: [40, 560] },
    hall:    { name: 'Bedroom hallway', short: 'Hall', icon: '🚪', door: [300, 700] },
    bedroom: { name: 'Nena’s room', short: 'Nena', icon: '🛏️', door: [40, 700] },
    street:  { name: 'Tehran street', short: 'Street', icon: '🌳', door: [30, 530] },
    clap:    { name: 'CLAP', short: 'CLAP', icon: '🏮', door: [334, 440] },
    mall:    { name: 'Hayat Sabz mall', short: 'Mall', icon: '🛍️', door: [96, 440] },
    parking: { name: 'Hayat Sabz parking', short: 'Parking', icon: '🅿️', door: [490, 420] },
  };
  const HOME_ORDER = ['salon', 'kitchen', 'tv', 'hall', 'bedroom'];
  const STATIONS = {
    toy:     { room: 'salon', x: 452, y: 530, r: 34, stand: [430, 592], label: 'Toy basket', gives: 'ball', chip: '🎾' },
    brush:   { room: 'salon', x: 528, y: 690, r: 34, stand: [495, 706], label: 'Brush', gives: 'brush', chip: '🪮' },
    bowl:    { room: 'salon', x: 100, y: 712, r: 34, stand: [150, 702], label: 'Food bowl', chip: '👇' },
    water:   { room: 'salon', x: 184, y: 716, r: 34, stand: [222, 702], label: 'Water bowl', chip: '💧' },
    sink:    { room: 'kitchen', x: 193, y: 278, r: 36, stand: [193, 440], label: 'Sink', chip: '🧽' },
    samovar: { room: 'kitchen', x: 300, y: 282, r: 36, stand: [300, 440], label: 'Samovar', gives: 'tea', dur: 2, chip: '☕' },
    kibble:  { room: 'kitchen', x: 402, y: 288, r: 34, stand: [402, 440], label: 'Kibble', gives: 'food', chip: '🥣' },
    nasimroom:   { room: 'hall', x: 226, y: 340, r: 46, stand: [226, 480], label: 'Nasim’s room', gives: 'laundry', dur: 1.4, enter: true, chip: '🧺' },
    negin:       { room: 'hall', x: 364, y: 340, r: 46, stand: [364, 480], label: 'Negin’s room', enter: true, chip: '⏰' },
    parentsroom: { room: 'hall', x: 512, y: 340, r: 52, stand: [512, 480], label: 'Parents’ room', gives: 'charger', dur: 1.4, enter: true, chip: '🔌' },
    blankie: { room: 'bedroom', x: 217, y: 472, r: 36, stand: [240, 612], label: 'Simba’s blankie', gives: 'blanket', chip: '🧸' },
    laptop:  { room: 'bedroom', x: 345, y: 270, r: 34, stand: [345, 470], label: 'Laptop', chip: '💻' },
    mirror:  { room: 'bedroom', x: 505, y: 200, r: 46, stand: [505, 450], label: 'Mirror', chip: '💄' },
    tub:     { room: 'bedroom', x: 505, y: 640, r: 48, stand: [452, 742], label: 'Bathtub', chip: '🛁' },
    bakery:  { room: 'street', x: 120, y: 345, r: 46, stand: [120, 480], label: 'Bakery', gives: 'bread', dur: 1.2, chip: '🫓' },
    juice:   { room: 'street', x: 300, y: 345, r: 44, stand: [300, 480], label: 'Juice shop', gives: 'juice', dur: 1.2, chip: '🧃' },
    bags:    { room: 'street', x: 440, y: 405, r: 30, stand: [440, 492], label: 'Poop bags', gives: 'bag', chip: '🛍️' },
    fountain: { room: 'street', x: 545, y: 445, r: 34, stand: [515, 512], label: 'Fountain', chip: '⛲' },
    car:     { room: 'street', x: 172, y: 650, r: 56, stand: [172, 556], label: 'The white 4×4', chip: '🚙' },
    teabar:  { room: 'clap', x: 110, y: 300, r: 44, stand: [110, 446], label: 'Tea bar', gives: 'teapot', dur: 1.4, chip: '🫖' },
    brazier: { room: 'clap', x: 237, y: 400, r: 34, stand: [252, 452], label: 'Pourya’s hookah bar', gives: 'coal', dur: 1, chip: '🔥', say: ['Pourya: “Fresh head for you! …So, what’s your Instagram?”', 'Pourya: “Special mint, just for you. Instagram? No? Okay…”', 'Pourya: “Here! By the way, I followed you. Follow back?”', 'Pourya: “Double apple, like last time. Your Insta is…?”'] },
    sushi:   { room: 'clap', x: 484, y: 300, r: 44, stand: [484, 462], label: 'Sushi counter', gives: 'mochi', dur: 1.2, chip: '🍡' },
    hookah:  { room: 'clap', x: 320, y: 548, r: 36, stand: [278, 692], label: 'Hookah', chip: '💨' },
    table:   { room: 'clap', x: 425, y: 596, r: 30, stand: [425, 706], label: 'Table', chip: '🍽️' },
    plant:   { room: 'salon', x: 470, y: 338, r: 32, stand: [470, 450], label: 'Plant', chip: '🪴' },
    cushion: { room: 'salon', x: 178, y: 444, r: 30, stand: [178, 562], label: 'Sofa cushions', search: true, chip: '❓' },
    tvcab:   { room: 'tv', x: 350, y: 335, r: 32, stand: [350, 448], label: 'TV cabinet', search: true, chip: '❓' },
    tvsofa:  { room: 'tv', x: 209, y: 438, r: 28, stand: [196, 566], label: 'Baba’s sofa', search: true, chip: '❓' },
    tvplant: { room: 'tv', x: 560, y: 338, r: 30, stand: [538, 446], label: 'Plant pot', search: true, chip: '❓' },
  };
  // where each character lives, per place
  const HOMES = {
    home: { courier: ['salon', 470, 470], aunt: ['salon', 470, 525], nena: ['salon', 300, 670], simba: ['salon', 330, 600], baba: ['tv', 250, 560], fariba: ['kitchen', 160, 470], nasim: ['salon', 545, 470] },
    street: { nena: ['street', 250, 545], simba: ['street', 330, 535], nasim: ['street', 520, 600], kids: ['street', 70, 548], biscuit: ['street', 470, 548] },
    clap: { courier: ['clap', 334, 470], nena: ['clap', 250, 646], negin: ['clap', 400, 646], pourya: ['clap', 176, 452] },
  };
  const FUR_ZONE = { x0: 270, x1: 560, y0: 600, y1: 780 };
  const FRONT = [548, 430];
  const NPC_ART = { baba: ['mohsen', 'happy', 84, 147], fariba: ['fariba', 'happy', 80, 140], nasim: ['nasim', 'angry', 80, 140], negin: ['negin', 'happy', 80, 140], kids: ['mia', 'happy', 64, 112], pourya: ['pourya', 'happy', 84, 147], aunt: ['aunt', 'happy', 84, 147], courier: ['courier', 'happy', 80, 140] };
  const GUESTS = [['guest1', 40, 552, 'happy'], ['guest2', 112, 554, 'happy'], ['guest3', 42, 742, 'happy'], ['guest4', 112, 744, 'neutral'], ['witch1', 490, 552, 'angry'], ['witch2', 562, 554, 'angry']];
  const TRANSIENT = { nasim: 1, kids: 1, aunt: 1, courier: 1, biscuit: 1 };
  const ELEV = { mall: [40, 228, 112, 192], parking: [436, 214, 112, 186] };

  /* request catalogue: who asks, what item is needed (src = where to get it), where to deliver (at) */
  const REQ = {
    food:    { who: 'simba', icon: '🍖', pts: 100, pat: 24, item: 'food', src: 'kibble', at: 'bowl', dur: 0.6, hint: 'Simba is hungry: tap his bubble. Nena takes kibble in the kitchen and fills his bowl.' },
    water:   { who: 'simba', icon: '💧', pts: 80, pat: 22, at: 'water', dur: 1.2, hint: 'Tap Simba’s water bubble to refill his bowl.' },
    walk:    { who: 'simba', icon: '🦮', pts: 150, pat: 26, at: 'simba', dur: 0.3, hint: 'Tap Simba to walk him in the street!' },
    brush:   { who: 'simba', icon: '🪮', pts: 120, pat: 26, item: 'brush', src: 'brush', at: 'simba', dur: 1.6, hint: 'Tap Simba: Nena grabs the brush and grooms him.' },
    play:    { who: 'simba', icon: '🎾', pts: 110, pat: 24, item: 'ball', src: 'toy', at: 'simba', dur: 1.4, hint: 'Tap Simba: Nena grabs the ball and plays with him.' },
    blanket: { who: 'simba', icon: '🧸', pts: 130, pat: 26, item: 'blanket', src: 'blankie', at: 'simba', dur: 1, hint: 'Simba is sleepy: Nena fetches his blankie from her room.' },
    bath:    { who: 'simba', icon: '🛁', pts: 170, pat: 30, item: 'pup', src: 'simba', at: 'tub', dur: 2.4, hint: 'Muddy paws! Nena carries Simba to the bathtub in her own bathroom.' },
    tea:     { who: 'baba', icon: '☕', pts: 120, pat: 26, item: 'tea', src: 'samovar', at: 'baba', dur: 0.5, hint: 'Baba wants tea in the TV room: Nena brews it at the samovar in the kitchen.' },
    charger: { who: 'baba', icon: '🔌', pts: 150, pat: 28, item: 'charger', src: 'parentsroom', at: 'baba', dur: 0.6, hint: 'Baba’s phone is dead (he must call the girls!). Nena gets the charger in the parents’ room.' },
    cuddle:  { who: 'baba', icon: '🐶', pts: 140, pat: 28, item: 'pup', src: 'simba', at: 'baba', dur: 0.6, hint: 'Baba wants Simba on his belly: Nena carries Simba to the TV room.' },
    help:    { who: 'fariba', icon: '🍲', pts: 150, pat: 26, at: 'fariba', dur: 2.2, hint: 'Maman needs help in the kitchen: tap her.' },
    laundry: { who: 'fariba', icon: '🧺', pts: 150, pat: 28, item: 'laundry', src: 'nasimroom', at: 'fariba', dur: 0.8, hint: 'Maman wants the laundry: Nena collects it in Nasim’s messy room.' },
    talk:    { who: 'nasim', icon: '💬', pts: 130, pat: 18, at: 'nasim', dur: 1.6, hint: 'Nasim is back and angry: tap her to talk.' },
    wake:    { who: 'negin', icon: '⏰', pts: 140, pat: 24, at: 'negin', dur: 2, hint: 'Negin overslept: only Nena may enter the bedrooms. Wake her in the hallway.' },
    ready:   { who: 'mirror', icon: '💄', pts: 130, pat: 28, at: 'mirror', dur: 2, hint: 'Nena’s own tasks too: get ready at the mirror in her bathroom.' },
    study:   { who: 'laptop', icon: '📚', pts: 160, pat: 32, at: 'laptop', dur: 3, hint: 'A deadline! Nena studies on her laptop in her room.' },
    poop:    { who: 'simba', icon: '💩', pts: 110, pat: 24, item: 'bag', src: 'bags', at: 'simba', dur: 1, hint: 'Simba did his business: Nena grabs a bag and cleans up. Good citizen!' },
    thirst:  { who: 'simba', icon: '💧', pts: 80, pat: 22, at: 'fountain', dur: 1.2, hint: 'Simba is thirsty: tap him, Nena takes him to the fountain.' },
    calm:    { who: 'simba', icon: '🐈', pts: 120, pat: 16, at: 'simba', dur: 1.4, hint: 'A street cat! Calm Simba down before he runs after it.' },
    bread:   { who: 'car', icon: '🫓', pts: 140, pat: 30, item: 'bread', src: 'bakery', at: 'car', dur: 0.6, hint: 'Maman wants sangak: buy it at the bakery and put it in the white 4×4.' },
    juice:   { who: 'nasim', icon: '🧃', pts: 140, pat: 24, item: 'juice', src: 'juice', at: 'nasim', dur: 0.6, hint: 'Nasim wants a cantaloupe juice. Now. Don’t ask.' },
    kids:    { who: 'kids', icon: '🧒', pts: 110, pat: 20, at: 'kids', dur: 1.4, hint: 'Neighbour kids want to pet Simba: tap them for tips.' },
    phone:   { who: 'nena', icon: '📞', pts: 120, pat: 14, at: 'phone', dur: 1.4, hint: 'Baba is calling! Tap the 📞 to answer before it stops ringing.' },
    coals:   { who: 'hookah', icon: '🔥', pts: 130, pat: 24, item: 'coal', src: 'brazier', at: 'hookah', dur: 0.8, hint: 'The hookah needs a fresh head: Pourya prepares it at his hookah bar.' },
    insta:   { who: 'pourya', icon: '📸', pts: 90, pat: 18, at: 'pourya', dur: 1, hint: 'Pourya asks for Nena’s Instagram. Again. Answer him (politely)!' },
    chai:    { who: 'negin', icon: '🍵', pts: 120, pat: 24, item: 'teapot', src: 'teabar', at: 'negin', dur: 0.6, hint: 'Negin wants tea: bring the teapot from the tea bar.' },
    doze:    { who: 'negin', icon: '😴', pts: 110, pat: 20, at: 'negin', dur: 1.2, hint: 'Negin fell asleep at the table. Of course. Wake her up!' },
    flowers: { who: 'courier', icon: '💐', pts: 200, pat: 20, at: 'courier', dur: 0.8, special: true, vip: true, hint: 'Ding-dong! Flowers for Nena… from Jesus. Oh no. 💐' },
    choco:   { who: 'courier', icon: '🍫', pts: 200, pat: 20, at: 'courier', dur: 0.8, special: true, vip: true, hint: 'Chocolates for Nena… from Jesus. AGAIN. 🍫' },
    jtext:   { who: 'nena', icon: '📱', pts: 120, pat: 14, at: 'phone', dur: 1.2, special: true, hint: 'Jesus is texting Nena AGAIN. Tap 📱 to answer him…' },
    aunt:    { who: 'aunt', icon: '🎁', pts: 260, pat: 26, item: 'tea', src: 'samovar', at: 'aunt', dur: 0.8, special: true, vip: true, hint: 'Surprise! Aunt Mahin is visiting. Bring her tea, quick!' },
    vip:     { who: 'guest2', icon: '👑', pts: 240, pat: 22, item: 'mochi', src: 'sushi', at: 'guest2', dur: 0.6, special: true, vip: true, hint: 'A VIP at CLAP! Serve him mochi for a big tip.' },
    curse:   { who: 'witch1', icon: '🔮', pts: 160, pat: 16, at: 'witch1', dur: 1.2, special: true, hint: 'The witches are cursing your hookah! Ask them (nicely) to stop.' },
    chase:   { who: 'simba', icon: '🫓', pts: 150, pat: 14, at: 'simba', dur: 1, special: true, hint: 'Simba stole a sangak! Catch him!' },
    remote:  { who: 'baba', icon: '🔍', pts: 170, pat: 34, item: 'remote', at: 'baba', dur: 0.5, search: ['cushion', 'tvcab', 'tvsofa', 'tvplant'], hint: 'Baba lost the TV remote! Search the ❓ spots in the living room and the TV room.' },
    plants:  { who: 'plant', icon: '🪴', pts: 120, pat: 30, item: 'can', src: 'sink', at: 'plant', dur: 1.2, hint: 'The plant is thirsty: fill the watering can at the kitchen sink.' },
    dogfriend: { who: 'biscuit', icon: '🐕', pts: 140, pat: 24, at: 'biscuit', dur: 1.6, hint: 'Biscuit the shiba wants to play with Simba! Tap them.' },
    selfie:  { who: 'negin', icon: '🤳', pts: 120, pat: 22, at: 'negin', dur: 1.2, hint: 'Negin wants a photo for her Instagram story. Tap her!' },
    snack:   { who: 'table', icon: '🍡', pts: 130, pat: 26, item: 'mochi', src: 'sushi', at: 'table', dur: 0.6, hint: 'Snack time: mochi from the sushi counter to your table.' },
  };
  const ITEMS = { food: '🥣', tea: '🍵', brush: '🪮', ball: '🎾', charger: '🔌', laundry: '🧺', blanket: '🧸', pup: '🐕', bread: '🫓', juice: '🧃', bag: '🛍️', teapot: '🫖', coal: '🔥', mochi: '🍡', remote: '🎛️', can: '🪣' };
  const NOREQ = { plant: 'The plant looks happy.', baba: 'Baba is happily watching football.', fariba: 'Maman is fine for now.', nasim: 'Nasim doesn’t want to talk.', negin: 'Shh… Negin is sleeping. Leave her be.', mirror: 'Nena looks great already!', car: 'Nothing to put in the car yet.', hookah: 'The hookah is fine.', table: 'Nothing to bring to the table.', kids: 'The kids are playing.', bowl: 'Simba isn’t hungry right now.', water: 'The water bowl is already full.', fountain: 'Simba isn’t thirsty.', tub: 'No bath needed.', negin_door: '', pourya: 'Pourya is busy preparing hookah heads.' };
  const BABA_CALLS = ['Baba: “Where are you?! It’s late!”', 'Baba: “Did you eat? Come home!”', 'Baba: “Is Negin with you? Put her on!”', 'Baba: “Nena jan, it’s 11 o’clock!!”', 'Baba: “Why don’t you answer the first time?”'];

  /* ------------------------------------------------------------------ */
  /* Levels                                                              */
  /* ------------------------------------------------------------------ */
  const L = (n, title, day, place, dur, types, targets, every, extra) => Object.assign({ n, title, day, place, dur, types, targets, every }, extra || {});
  const HOME_ALL = ['food', 'water', 'walk', 'brush', 'play', 'tea', 'help', 'talk', 'cuddle', 'wake', 'charger', 'laundry', 'blanket', 'bath', 'ready', 'study', 'remote', 'plants'];
  const LEVELS = [
    L(1, 'First morning', 'Saturday', 'home', 60, ['food', 'water'], [300, 500, 650], [6, 9], { obj: { k: 'done', n: 5, label: 'Complete 5 requests' }, story: [['simba', 'happy', 'Woof! (Breakfast. Now. Please.)'], ['nena', 'happy', 'Okay Simba! Kibble is in the kitchen, your bowls are in the living room.']] }),
    L(2, 'Walkies!', 'Sunday', 'home', 70, ['food', 'water', 'walk'], [350, 600, 950], [6, 8.5], { obj: { k: 'type', t: 'walk', n: 2, label: 'Walk Simba 2 times' }, story: [['nena', 'neutral', 'Negin was supposed to walk him… she’s still asleep.'], ['simba', 'happy', '*brings the leash*']] }),
    L(3, 'Tea for Baba', 'Monday', 'home', 75, ['food', 'water', 'walk', 'tea'], [500, 950, 1450], [5.5, 8], { obj: { k: 'type', t: 'tea', n: 3, label: 'Serve Baba 3 teas' }, story: [['mohsen', 'happy', 'Nena jan, is there tea? Persepolis is playing!'], ['nena', 'happy', 'Coming, Baba! Samovar in the kitchen, TV room… use the room tabs!']] }),
    L(4, 'Fluffy trouble', 'Tuesday', 'home', 80, ['food', 'water', 'walk', 'tea', 'brush'], [700, 1200, 1900], [5.5, 7.5], { obj: { k: 'combo', n: 3, label: 'Reach a ×3 combo' }, fur: 9, story: [['nena', 'surprised', 'Orange fur EVERYWHERE. Simba, you’re shedding again!'], ['simba', 'happy', '*shakes proudly*']] }),
    L(5, 'Maman’s kitchen', 'Wednesday', 'home', 85, ['food', 'water', 'walk', 'tea', 'brush', 'help', 'plants'], [750, 1350, 2100], [5, 7], { obj: { k: 'clean', label: 'Leave no mess at the end' }, fur: 9, story: [['fariba', 'happy', 'Nena jan, help me with the ghormeh sabzi? And then the dishes, please!']] }),
    L(6, 'Bread run', 'Thursday', 'street', 80, ['poop', 'thirst', 'bread', 'calm', 'kids', 'dogfriend'], [650, 1150, 1800], [5, 7], { obj: { k: 'type', t: 'bread', n: 2, label: 'Put 2 sangak breads in the car' }, story: [['fariba', 'neutral', 'Nena jan, take Simba out and bring sangak for lunch. Put it in the 4×4!'], ['nena', 'happy', 'A walk in the street, Simba! Stay away from the cats…']] }),
    L(7, 'Nasim is home', 'Friday', 'home', 90, ['food', 'water', 'walk', 'tea', 'brush', 'help', 'talk', 'cuddle'], [900, 1600, 2450], [4.8, 6.8], { obj: { k: 'treat', label: 'Catch a golden bone' }, fur: 8, story: [['nasim', 'angry', 'DON’T talk to me. …Okay, maybe talk to me. Later.'], ['mohsen', 'happy', 'And bring me my little lion! I want him on my belly.']] }),
    L(8, 'Wake up, Negin!', 'Saturday', 'home', 95, ['food', 'water', 'walk', 'tea', 'help', 'talk', 'wake', 'charger', 'remote'], [1000, 1800, 2750], [4.6, 6.4], { obj: { k: 'done', n: 14, label: 'Complete 14 requests' }, fur: 8, story: [['negin', 'sleepy', '…zzz… five more minutes… zzz…'], ['fariba', 'neutral', 'Nena, wake your sister, she has class! You’re the only one she lets in.']] }),
    L(9, 'Night at CLAP', 'Saturday', 'clap', 85, ['coals', 'chai', 'doze', 'snack', 'phone', 'insta', 'selfie'], [750, 1350, 2150], [4.6, 6.4], { night: true, obj: { k: 'type', t: 'phone', n: 3, label: 'Answer Baba 3 times' }, story: [['negin', 'happy', 'CLAP tonight? Hookah and tea, my treat… I mean your treat.'], ['nena', 'happy', 'Okay! I park the 4×4 under Hayat Sabz, we go up to the mall, and CLAP is on the ground floor.'], ['pourya', 'happy', 'Salam Nena! A new hookah head? …And your Instagram, maybe?'], ['mohsen', 'neutral', 'Girls, be home by ten! I will call. Many times.']] }),
    L(10, 'Nena’s own day', 'Sunday', 'home', 100, ['food', 'water', 'walk', 'tea', 'ready', 'study', 'blanket', 'laundry', 'plants'], [1000, 1800, 2800], [4.4, 6.2], { obj: { k: 'type', t: 'study', n: 2, label: 'Study 2 times' }, story: [['nena', 'neutral', 'Exams, Simba, Baba, Maman… and I still have to get ready myself!'], ['nasim', 'happy', 'Oh, and someone sent you flowers AGAIN. Who is this Jesus?!'], ['nena', 'angry', 'JESUS AGAIN?! I told him to stop! Next time I block him!']] }),
    L(11, 'Rainy day', 'Monday', 'home', 100, ['food', 'water', 'walk', 'tea', 'brush', 'help', 'play', 'bath', 'blanket', 'charger', 'remote'], [1100, 1950, 3000], [4.2, 6], { rain: true, fur: 6, obj: { k: 'tips', n: 20, label: 'Earn 20 coins in tips' }, story: [['nena', 'neutral', 'Rain… muddy paws. Bath time in my bathroom, Simba.'], ['simba', 'sad', '*hides under the sofa*']] }),
    L(12, 'Tehran evening', 'Tuesday', 'street', 95, ['poop', 'thirst', 'bread', 'calm', 'kids', 'juice', 'phone', 'dogfriend'], [1250, 2250, 3500], [4.2, 6], { night: true, obj: { k: 'nomiss', label: 'Don’t miss a single request' }, story: [['nasim', 'angry', 'I’m coming too. And you’re buying me a juice.'], ['mohsen', 'neutral', 'It’s getting dark! I’ll call you every five minutes.']] }),
    L(13, 'Late night at CLAP', 'Wednesday', 'clap', 100, ['coals', 'chai', 'doze', 'snack', 'phone', 'insta', 'selfie'], [950, 1750, 2700], [3.9, 5.6], { night: true, patience: 0.92, obj: { k: 'combo', n: 5, label: 'Reach a ×5 combo' }, story: [['negin', 'sleepy', 'One more hookah… and a nap… on this cushion…'], ['pourya', 'happy', 'Nena! Today you give me your Instagram, yes?'], ['negin', 'neutral', 'Don’t look now… the two blonde witches are here again. Corner table.'], ['nena', 'surprised', 'No, Pourya. And Baba already called three times. It’s only 9!']] }),
    L(14, 'Simba’s birthday', 'Thursday', 'home', 110, HOME_ALL, [1650, 3000, 4700], [3.8, 5.3], { party: 'birthday', fur: 6, patience: 0.9, obj: { k: 'done', n: 20, label: 'Complete 20 requests' }, story: [['mohsen', 'happy', 'Happy birthday, my lion!'], ['nasim', 'neutral', 'I made the decorations. Don’t say anything.']] }),
    L(15, 'Cousin Sara’s wedding', 'Friday', 'home', 120, HOME_ALL, [1900, 3400, 5200], [3.4, 4.8], { party: 'wedding', boss: true, fur: 6, patience: 0.9, events: 16, obj: { k: 'nomiss', label: 'Don’t miss a single request' }, story: [['fariba', 'surprised', 'Cousin Sara’s wedding is TONIGHT and the whole family is getting ready here!'], ['mohsen', 'neutral', 'Where is my tie? Where is my tea? Where is everybody?!'], ['nena', 'happy', 'Boss day, Simba. Let’s do this!']] }),
  ];
  function levelCfg(n) {
    if (n > 900 && CUSTOM) return CUSTOM;
    if (n <= LEVELS.length) return LEVELS[n - 1];
    const k = n - LEVELS.length;
    const base = [LEVELS[13], LEVELS[11], LEVELS[12]][k % 3];
    return Object.assign({}, base, {
      n, title: ['Another busy day', 'Out in Tehran', 'Back to CLAP'][k % 3], day: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][(n - 1) % 7],
      targets: base.targets.map((t) => Math.round(t * (1 + k * 0.05))), every: [Math.max(2.8, base.every[0] - k * 0.06), Math.max(4, base.every[1] - k * 0.08)],
      patience: Math.max(0.65, 0.9 - k * 0.02), obj: [{ k: 'combo', n: 5, label: 'Reach a ×5 combo' }, { k: 'nomiss', label: 'Don’t miss a single request' }, { k: 'done', n: 20, label: 'Complete 20 requests' }, { k: 'tips', n: 22, label: 'Earn 22 coins in tips' }][n % 4],
      story: [[pick(['mohsen', 'fariba', 'nasim', 'nena', 'negin']), 'happy', pick(['Another day in Tehran!', 'Simba, behave today, okay?', 'Who wants tea?', 'Yallah, let’s go!'])]],
    });
  }
  // stations, rooms and characters a level needs
  function levelWorld(cfg) {
    const st = new Set(), who = new Set();
    cfg.types.forEach((t) => { const R = REQ[t]; [R.src, R.at, R.who].concat(R.search || []).forEach((x) => { if (STATIONS[x]) st.add(x); }); who.add(R.who); });
    if (cfg.types.includes('help')) st.add('sink');
    const rooms = new Set();
    if (cfg.place === 'home') {
      rooms.add('salon'); rooms.add('kitchen');
      st.forEach((s) => rooms.add(STATIONS[s].room));
      if (who.has('baba')) rooms.add('tv');
      if (rooms.has('bedroom')) st.add('laptop');
      if (rooms.has('hall') || rooms.has('bedroom')) rooms.add('hall');
    } else rooms.add(cfg.place);
    const tabs = cfg.place === 'home' ? HOME_ORDER.filter((r) => rooms.has(r)) : [cfg.place];
    const layers = tabs.slice();
    if (cfg.types.includes('walk')) layers.push('street');
    if (cfg.place === 'clap') layers.push('parking', 'mall');
    return { stations: [...st], who, tabs, layers };
  }

  /* ------------------------------------------------------------------ */
  /* Upgrades                                                            */
  /* ------------------------------------------------------------------ */
  const BOOSTERS = [
    { id: 'time', name: '+15 seconds', desc: 'A longer day.', icon: '⏱️', cost: 40 },
    { id: 'coffee', name: 'Morning coffee', desc: 'Nena is 25% faster all day.', icon: '☕', cost: 35 },
    { id: 'heart', name: 'Extra heart', desc: 'One more chance with the family.', icon: '💗', cost: 30 },
  ];
  const UPGRADES = [
    { id: 'shoes', name: 'Sneakers', desc: 'Nena walks 20% faster per level.', icon: '👟', costs: [60, 130, 220] },
    { id: 'tray', name: 'Serving tray', desc: 'Carry 2 items at once.', icon: '🍽️', costs: [150] },
    { id: 'samovar', name: 'Big samovar', desc: 'Tea brews 40% faster.', icon: '🫖', costs: [90] },
    { id: 'treats', name: 'Treat jar', desc: 'Simba waits 20% longer before getting upset.', icon: '🦴', costs: [80] },
    { id: 'fountain', name: 'Water fountain', desc: 'Simba gets thirsty less often.', icon: '⛲', costs: [100] },
    { id: 'robot', name: 'Robot vacuum', desc: 'Cleans a fur pile every 8 seconds.', icon: '🤖', costs: [160] },
    { id: 'decor', name: 'Cozy decor', desc: 'Family waits 15% longer, +1 heart.', icon: '🪴', costs: [120] },
  ];

  /* ------------------------------------------------------------------ */
  /* Level setup                                                         */
  /* ------------------------------------------------------------------ */
  let G = null;  // current level run
  let pendingBoosts = {};
  let raf = 0, last = 0;
  const stage = () => $('stage');
  const layer = (room) => (G && G.layers[room]) || stage();

  function makeActor(id, html, w, h, cls, room) {
    const el = document.createElement('div');
    el.className = 'actor ' + (cls || '');
    el.style.width = w + 'px'; el.style.height = h + 'px';
    el.innerHTML = html;
    el.dataset.actor = id;
    el.style.setProperty('--bd', (-rnd() * 4).toFixed(2) + 's');
    layer(room).appendChild(el);
    return { el, w, h, x: 0, y: 0, room };
  }
  function place(a, x, y) {
    a.x = x; a.y = y;
    a.el.style.transform = `translate(${(x - a.w / 2).toFixed(1)}px, ${(y - a.h).toFixed(1)}px)`;
    a.el.style.zIndex = String(Math.round(y));
  }
  function moveRoom(a, room) { a.room = room; layer(room).appendChild(a.el); }
  function spawnNpc(who) {
    const h = HOMES[G.cfg.place][who]; if (!h) return null;
    const dog = who === 'biscuit';
    const [art, mood, w, hh] = dog ? ['shiba', 'happy', 96, 76] : NPC_ART[who];
    const a = makeActor(who, dog ? A.simba({ palette: 'shiba', collar: 'noeud' }) : A.person(art, { mood, nails: nailOf(who) }), w, hh, dog ? 'npc simba' : 'npc', h[0]);
    a.el.dataset.target = who;
    a.mood = mood;
    place(a, h[1], h[2]);
    G.npcs[who] = a;
    if (G.life) lifeAdd(who, a, dog ? { kind: 'dog', still: true, lines: ['Arf!', '*sniff sniff*', 'Yip yip!', '*wags*'] } : {});
    return a;
  }

  function startLevel(n) {
    const cfg = levelCfg(n);
    cancelAnimationFrame(raf);
    music({ home: 'home', street: 'street', clap: 'clap' }[cfg.place] || 'home', cfg.night);
    $('s-bg').innerHTML = ''; $('s-bg').dataset.p = '';  // its gradients would shadow the room's
    const W = levelWorld(cfg);
    const st = stage();
    st.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${RA.defs(cfg)}</svg>`;
    G = {
      cfg, n, W, time: cfg.dur, score: 0, coins: 0, combo: 0, comboT: 0, hearts: 5 + (up('decor') ? 1 : 0), maxHearts: 5 + (up('decor') ? 1 : 0),
      reqs: [], queue: [], hand: [], furs: [], dishes: 0, spawnT: 2, furT: cfg.fur || 999, robotT: 8, paused: false, over: false,
      nena: null, simba: null, npcs: {}, busy: null, simbaAway: false, simbaTask: null, done: 0, failed: 0, layers: {}, st: {}, view: null,
      stats: { walk: 0, tea: 0, maxCombo: 0, tips: 0, treat: 0, type: {} }, objDone: false, boostT: 0, freezeT: 0,
      boneT: n >= 2 ? 16 + rnd() * 8 : 999, bone: null, pkgT: n >= 4 && cfg.place === 'home' ? 28 + rnd() * 12 : 999, pkg: null,
      zoomT: n >= 7 && cfg.place === 'home' ? 22 + rnd() * 10 : 999, rushHour: false, lastTick: 99, starsShown: 0, boosts: pendingBoosts || {}, tabKey: '',
    };
    if (G.boosts.time) G.time += 15;
    G.evT = cfg.events || (cfg.mod && (cfg.mod.events || cfg.mod.blackout)) || (n >= 5 && n < 900 ? 30 + rnd() * 15 : n === 902 ? 25 : null);
    if (cfg.mod && cfg.mod.hearts) { G.hearts = cfg.mod.hearts; G.maxHearts = cfg.mod.hearts; }
    if (cfg.mod && cfg.mod.zoom) G.zoomT = 6;
    Object.keys(hudCache).forEach((k) => delete hudCache[k]);
    G.joy = 60; G.joyT = 0; G.muddy = false; G.searched = new Set(); G.remoteSpot = null; G.lastPet = 0;
    G.tabsBuilt = ''; G.mc = null; G.miniT = null; G.miniN = 0; G.miniWon = 0; $('g-mini').hidden = true;
    G.giftT = (n >= 4 && (cfg.place === 'home' || cfg.place === 'clap')) || cfg.challenge ? 22 + rnd() * 30 : null;
    G.frStart = {}; FRIENDS.forEach((f) => { G.frStart[f.id] = friendLv(f.id); });
    if (G.boosts.heart) { G.hearts++; G.maxHearts++; }
    G.zen = n < 900 && save.wellness.zen === today();
    G.fit = n < 900 && save.wellness.gym === today();
    if (n < 900) { const w = weather(); setTimeout(() => { if (G && G.n === n) toast(`${w.ico} Tehran today: ${w.temp}°C, ${w.name.toLowerCase()}`, 'hint', 2000); }, 7800); }
    eventDeco(); { const E = activeEvent(); if (E && n < 900) setTimeout(() => { if (G && G.n === n) toast(`${E.def.ico} ${E.def.name}! Win days to collect ${E.def.tokName}`, 'combo', 2000); }, 2600); }
    G.golden = goldenNow();
    if (G.golden) setTimeout(() => { if (G && G.n === n) toast('✨ Golden hour! Coins ×2 for this day', 'combo', 2000); }, 1200);
    G.slept = n < 900 && dayNum() - (save.wellness.bedN ?? -9) <= 1;
    if (G.slept) setTimeout(() => { if (G && G.n === n) toast('🌙 Simba slept in Nena’s arms: he is 15% more patient!', 'hint', 2200); }, 5200);
    if (G.fit) setTimeout(() => { if (G && G.n === n) toast('🏋️ Gym energy: Nena is 15% faster today!', 'hint', 2200); }, 3400);
    if (n < 900 && save.wellness.tree === today()) { G.hearts++; G.maxHearts++; }
    if (G.zen || (n < 900 && save.wellness.tree === today())) setTimeout(() => { if (G && G.n === n) toast((G.zen ? '🧘 Zen: everyone is 10% more patient today. ' : '') + (save.wellness.tree === today() ? '🌳 Good energy: +1 heart!' : ''), 'hint', 2600); }, 600);
    pendingBoosts = {};
    // room layers
    W.layers.forEach((id) => {
      const d = document.createElement('div');
      d.className = 'room-layer'; d.dataset.room = id;
      d.innerHTML = RA.ART[id](cfg);
      (RA.PROPS[id] ? RA.PROPS[id](cfg) : []).forEach((pr) => {
        const e = document.createElement('div');
        e.className = 'prop'; e.innerHTML = pr.svg;
        e.style.left = pr.x + 'px'; e.style.top = pr.y + 'px'; e.style.width = pr.w + 'px'; e.style.height = pr.h + 'px'; e.style.zIndex = String(pr.z);
        d.appendChild(e);
      });
      const party = cfg.party && RA.PARTY[cfg.party] && RA.PARTY[cfg.party][id];
      if (party) { const e = document.createElement('div'); e.className = 'decor party'; e.innerHTML = `<svg viewBox="0 0 600 800">${party}</svg>`; d.appendChild(e); }
      DECOR.filter((x) => x.room === id && save.decor[x.id]).forEach((x) => { const e = document.createElement('div'); e.className = 'decor'; e.innerHTML = `<svg viewBox="0 0 600 800">${x.svg}</svg>`; d.appendChild(e); });
      if (RA.LIGHT[id]) { const e = document.createElement('div'); e.className = 'light'; e.innerHTML = RA.LIGHT[id](cfg); d.appendChild(e); }
      (RA.FX[id] ? RA.FX[id](cfg) : []).forEach((f) => { const e = document.createElement('div'); e.className = 'fx ' + f.cls; e.innerHTML = f.html || ''; Object.assign(e.style, { left: f.x + 'px', top: f.y + 'px', width: f.w + 'px', height: f.h + 'px' }); e.style.setProperty('--w', f.w + 'px'); d.appendChild(e); });
      const ev = ELEV[id];
      if (ev) { const e = document.createElement('div'); e.className = 'elev'; e.innerHTML = '<i></i><i></i>'; Object.assign(e.style, { left: ev[0] + 'px', top: ev[1] + 'px', width: ev[2] + 'px', height: ev[3] + 'px' }); d.appendChild(e); }
      st.appendChild(d);
      G.layers[id] = d;
    });
    // stations
    W.stations.forEach((id) => {
      const s = STATIONS[id];
      G.st[id] = s;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'hit station' + (s.enter ? ' room' : '') + (s.search ? ' search' : ''); b.dataset.target = id;
      b.setAttribute('aria-label', s.label);
      b.style.left = (s.x - s.r) + 'px'; b.style.top = (s.y - s.r) + 'px'; b.style.width = b.style.height = (s.r * 2) + 'px';
      b.innerHTML = `<span class="st-ico">${s.chip || ''}</span>`;
      layer(s.room).appendChild(b);
    });
    // characters
    const H = HOMES[cfg.place];
    G.nena = makeActor('nena', A.nena({ dressed: true, outfit: save.outfit, nails: nailOf('nena') }), 84, 147, 'nena', H.nena[0]);
    place(G.nena, H.nena[1], H.nena[2]);
    G.nena.el.dataset.target = 'nena';
    if (H.simba) {
      G.simba = makeActor('simba', simbaArt(), 112, 89, 'simba happy', H.simba[0]);
      G.simba.el.dataset.target = 'simba';
      place(G.simba, H.simba[1], H.simba[2]);
    }
    ['baba', 'fariba', 'negin', 'pourya'].forEach((w) => { if ((W.who.has(w) || (w === 'pourya' && cfg.place === 'clap')) && H[w]) spawnNpc(w); });
    G.guests = [];
    if (cfg.place === 'clap') { GUESTS.forEach(([id, x, y, mood]) => { const g = makeActor(id, A.person(id, { mood }), 72, 126, 'npc guest' + (id.startsWith('witch') ? ' witch' : ''), 'clap'); g.mood = mood; place(g, x, y); G.guests.push([id, g]); G.npcs[id] = g; g.el.dataset.target = id; }); G.witchT = 14 + rnd() * 8; }
    G.life = []; G.talk = new Set(); G.amb = []; G.ambT = 2;
    lifeAdd('nena', G.nena, { lines: LINES.nena, kind: 'think', still: true });
    if (G.simba) lifeAdd('simba', G.simba, {});
    G.guests.forEach(([id, g]) => lifeAdd(id, g, { lines: id.startsWith('witch') ? LINES.witch : LINES.guest, kind: id.startsWith('witch') ? 'witch' : '', still: true }));
    Object.keys(G.npcs).forEach((w) => lifeAdd(w, G.npcs[w], {}));
    // overlays that follow Nena
    G.bar = document.createElement('div'); G.bar.className = 'workbar'; G.bar.innerHTML = '<i></i>'; G.bar.hidden = true;
    G.handEl = document.createElement('div'); G.handEl.className = 'hand';
    G.tut = document.createElement('div'); G.tut.className = 'tut-hand'; G.tut.textContent = '👆'; G.tut.hidden = true;
    attachNenaOverlays();
    if (G.boosts.coffee) G.nena.el.classList.add('coffee');
    renderHand();
    $('screen-game').hidden = false;
    $('g-level').textContent = n > 900 ? cfg.title : `Day ${n} · ${cfg.title}`;
    $('g-rush').hidden = true;
    $('g-rooms').classList.toggle('single', W.tabs.length < 2);
    setView(G.nena.room);
    renderObj();
    $('g-star1').style.left = (cfg.targets[0] / cfg.targets[2] * 100) + '%';
    $('g-star2').style.left = (cfg.targets[1] / cfg.targets[2] * 100) + '%';
    fit();
    hud();
    // tutorial hints for newly introduced mechanics, one after another
    const fresh = cfg.types.filter((t) => !save.seen[t]);
    if (W.tabs.length > 1 && !save.seen._rooms) { fresh.push('_rooms'); }
    if (save.hints === false) fresh.length = 0;
    fresh.forEach((t, i) => setTimeout(() => { if (G && G.n === n && !G.over) toast(t === '_rooms' ? 'Other rooms are waiting! Tap the cards at the bottom 👇' : REQ[t].hint, 'hint', 4200); }, 900 + i * 5200));
    cfg.types.forEach((t) => { save.seen[t] = 1; });
    if (W.tabs.length > 1) save.seen._rooms = 1;
    persist();
    if (cfg.place === 'clap' && G.layers.parking) runIntro();
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
  const CAR = '<svg viewBox="0 0 200 100" class="sprite"><rect x="10" y="34" width="180" height="50" rx="14" fill="#f4f4f2" stroke="#d6d6d4"/><path d="M40 34 l16 -30 h90 l24 30z" fill="#eceae6"/><path d="M60 32 l10 -22 h32 v22z M108 32 v-22 h34 l14 22z" fill="#8fb6cc"/><circle cx="46" cy="86" r="16" fill="#2a2a2e"/><circle cx="46" cy="86" r="7" fill="#c9ccd0"/><circle cx="156" cy="86" r="16" fill="#2a2a2e"/><circle cx="156" cy="86" r="7" fill="#c9ccd0"/><rect x="10" y="50" width="12" height="8" rx="2" fill="#ffd98a"/></svg>';
  // Day at CLAP: Nena parks the white 4×4 under Hayat Sabz mall and takes the elevator up
  function runIntro() {
    const nn = G.nena, ng = G.npcs.negin;
    G.intro = { home: { n: [nn.x, nn.y], g: ng ? [ng.x, ng.y] : null }, timers: [] };
    G.intro.car = makeActor('car', CAR, 200, 100, 'car', 'parking');
    place(G.intro.car, 780, 700);
    const both = (fn) => [nn, ng].forEach((a) => a && fn(a));
    const go = (room, xn, yn, xg, yg) => { moveRoom(nn, room); place(nn, xn, yn); if (ng) { moveRoom(ng, room); place(ng, xg, yg); } attachNenaOverlays(); setView(room); };
    go('parking', 300, 690, 350, 690); both((a) => a.el.classList.add('gone'));
    toast('🚙 Hayat Sabz Mall · parking P2 (tap to skip)', 'hint', 2400);
    const eP = G.layers.parking.querySelector('.elev'), eM = G.layers.mall.querySelector('.elev');
    const T = (ms, fn) => G.intro.timers.push(setTimeout(() => { if (G && G.intro) fn(); }, ms));
    moveTo(G.intro.car, 300, 700, 1.4);
    T(1500, () => { both((a) => { a.el.classList.remove('gone'); a.el.classList.add('walking'); }); eP.classList.add('open'); moveTo(nn, 478, 412, 1.4); if (ng) moveTo(ng, 512, 414, 1.5); snd('click'); });
    T(3100, () => { both((a) => a.el.classList.add('gone')); eP.classList.remove('open'); });
    T(3700, () => { go('mall', 80, 418, 112, 420); mallShoppers(); eM.classList.add('open'); toast('🛍️ Hayat Sabz Mall · ground floor', 'hint', 1800); snd('success'); });
    T(4200, () => { both((a) => a.el.classList.remove('gone', 'flip')); moveTo(nn, 500, 470, 2.0); if (ng) moveTo(ng, 540, 474, 2.1); });
    T(6400, () => { both((a) => a.el.classList.add('gone')); eM.classList.remove('open'); });
    T(6900, () => { go('clap', 318, 440, 350, 442); toast('🏮 Welcome to CLAP!', 'hint', 1400); });
    T(7200, () => { both((a) => a.el.classList.remove('gone')); moveTo(nn, G.intro.home.n[0], G.intro.home.n[1], 1.0); if (ng) moveTo(ng, G.intro.home.g[0], G.intro.home.g[1], 1.1); });
    T(8500, endIntro);
  }
  function mallShoppers() {
    [['guest1', 620, 520, -40], ['sam', -40, 600, 640], ['guest3', 640, 680, -40]].forEach(([id, x0, y, x1], i) => {
      const p = makeActor('shopper', A.person(id, { mood: 'happy' }), 70, 122, 'npc', 'mall');
      place(p, x0, y); setTimeout(() => walkActor(p, x1, y, () => p.el.remove(), 70), i * 500);
    });
    setTimeout(() => { if (G && G.intro) speak(G.npcs.negin || G.nena, pick(['Ooh, a new perfume shop!', 'No shopping, Negin. Hookah!', 'CLAP is this way!']), '', 1800, true); }, 900);
  }
  function endIntro() {
    const I = G.intro; if (!I) return;
    I.timers.forEach(clearTimeout);
    G.intro = null;
    const nn = G.nena, ng = G.npcs.negin;
    for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].a === nn || tweens[i].a === ng || tweens[i].a === I.car) tweens.splice(i, 1);
    I.car.el.remove();
    moveRoom(nn, 'clap'); place(nn, I.home.n[0], I.home.n[1]); nn.el.classList.remove('gone', 'walking');
    if (ng) { moveRoom(ng, 'clap'); place(ng, I.home.g[0], I.home.g[1]); ng.el.classList.remove('gone', 'walking'); }
    attachNenaOverlays(); setView('clap');
    last = performance.now();
  }
  function attachNenaOverlays() {
    const l = layer(G.nena.room);
    l.appendChild(G.bar); l.appendChild(G.handEl);
  }

  function fit() {
    const box = $('stage-wrap');
    if (!box) return;
    const s = Math.min(box.clientWidth / 600, box.clientHeight / 800);
    stage().style.transform = `translate(${((box.clientWidth - 600 * s) / 2).toFixed(1)}px, ${((box.clientHeight - 800 * s) / 2).toFixed(1)}px) scale(${s})`;
  }
  window.addEventListener('resize', fit);

  /* ------------------------------------------------------------------ */
  /* Rooms: view and tabs                                                */
  /* ------------------------------------------------------------------ */
  // Room navigation: floor-plan cards with live thumbnails, edge arrows, slide transitions
  const navTabs = () => { const t = G.W.tabs.slice(); if (G.nena.room === 'street' && !t.includes('street')) t.push('street'); return t; };
  function setView(room) {
    if (!G.layers[room]) return;
    const prev = G.view, order = navTabs();
    G.view = room;
    Object.entries(G.layers).forEach(([id, d]) => d.classList.toggle('on', id === room));
    layer(room).appendChild(G.tut);
    if (prev && prev !== room) {
      const l = G.layers[room], dir = order.indexOf(room) > order.indexOf(prev) ? 'slide-l' : 'slide-r';
      l.classList.remove('slide-l', 'slide-r'); void l.offsetWidth; l.classList.add(dir);
      const bn = $('g-roomname'); bn.textContent = `${ROOMS[room].icon} ${ROOMS[room].name}`; bn.classList.remove('show'); void bn.offsetWidth; bn.classList.add('show');
    }
    G.tabKey = '';
    renderTabs();
  }
  // room thumbnails: rasterised once per day as small images instead of live SVG copies
  const thumbCache = {};
  function thumbOf(room) {
    const k = G.n + room;
    if (thumbCache[k]) return thumbCache[k];
    const bg = G.layers[room] && G.layers[room].querySelector('svg.stage-bg');
    if (!bg) return '';
    const svg = bg.outerHTML.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/class="stage-bg"/, '').replace(/aria-hidden="true">/, `aria-hidden="true">${RA.defs(G.cfg)}`);
    thumbCache[k] = `<img alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}">`;
    return thumbCache[k];
  }
  function buildTabs(tabs) {
    G.tabsBuilt = tabs.join();
    $('g-rooms').innerHTML = tabs.map((room, i) => {
      return `${i ? '<i class="rdoor" aria-hidden="true"></i>' : ''}<button type="button" class="rtab" data-room="${room}" aria-label="${ROOMS[room].name}">
        <span class="rt-thumb">${thumbOf(room)}</span><span class="rt-me">${A.portrait('nena', 'happy')}</span>
        <span class="rt-n">${ROOMS[room].icon} ${ROOMS[room].short}</span><span class="rt-b"></span></button>`;
    }).join('');
  }
  function renderTabs() {
    const tabs = navTabs();
    if (G.tabsBuilt !== tabs.join()) { buildTabs(tabs); G.tabKey = ''; }
    const need = needRooms();
    const parts = tabs.map((room) => ({ room, here: G.nena.room === room, view: G.view === room, need: need.has(room),
      b: G.reqs.filter((r) => whoRoom(r.who) === room).map((r) => ({ i: G.reqs.indexOf(r), icon: REQ[r.type].icon, u: r.left / r.max < 0.3 })) }));
    const key = JSON.stringify(parts);
    if (key === G.tabKey) return;
    G.tabKey = key;
    parts.forEach((p) => {
      const el = $('g-rooms').querySelector(`[data-room="${p.room}"]`); if (!el) return;
      el.classList.toggle('view', p.view); el.classList.toggle('here', p.here); el.classList.toggle('need', p.need && !p.view);
      el.querySelector('.rt-b').innerHTML = p.b.map((b) => `<span data-req="${b.i}" class="${b.u ? 'urgent' : ''}">${b.icon}</span>`).join('');
    });
    // edge arrows to the neighbouring rooms + "back to Nena"
    const i = tabs.indexOf(G.view), multi = tabs.length > 1;
    const pv = multi && i > 0 ? tabs[i - 1] : null, nx = multi && i < tabs.length - 1 ? tabs[i + 1] : null;
    const setArrow = (id, r) => { const e = $(id); e.hidden = !r; if (r) { e.dataset.room = r; e.querySelector('b').textContent = `${ROOMS[r].icon} ${ROOMS[r].short}`; e.classList.toggle('need', need.has(r) || G.reqs.some((q) => whoRoom(q.who) === r)); } };
    setArrow('g-prev', pv); setArrow('g-next', nx);
    $('g-follow').hidden = !multi || G.nena.room === G.view || G.nena.el.classList.contains('gone');
  }
  function needRooms() {
    const s = new Set();
    G.reqs.forEach((r) => { const id = nextStep(r); const room = targetRoom(id); if (room) s.add(room); });
    return s;
  }

  /* ------------------------------------------------------------------ */
  /* Feelings: moods, emotes, reactions, particles, Simba's happiness    */
  /* ------------------------------------------------------------------ */
  const simbaArt = () => A.simba({ collar: save.collar || (G && G.cfg.party === 'wedding' ? 'noeud' : null), muddy: !!(G && G.muddy), hat: G && G.cfg.party === 'birthday' ? 'party' : null });
  function swapSprite(a, html) {
    const svg = a && a.el.querySelector('svg.sprite'); if (!svg) return;
    const t = document.createElement('template'); t.innerHTML = html.trim();
    svg.replaceWith(t.content.firstElementChild);
  }
  function refreshSimba() { if (G.simba) swapSprite(G.simba, simbaArt()); }
  const defMood = (who) => (NPC_ART[who] ? NPC_ART[who][1] : (GUESTS.find((g) => g[0] === who) || [])[3] || 'happy');
  const artOf = (who) => (NPC_ART[who] ? NPC_ART[who][0] : who);
  function setMood(who, mood, ms) {
    const a = G.npcs[who]; if (!a || who === 'biscuit' || !a.el.isConnected) return;
    clearTimeout(a.moodT);
    if (ms) a.moodT = setTimeout(() => { if (G && G.npcs[who] === a && !G.reqs.some((r) => r.who === who)) setMood(who, defMood(who)); }, ms);
    if (a.mood === mood) return;
    a.mood = mood;
    swapSprite(a, A.person(artOf(who), { mood, nails: nailOf(who) }));
  }
  // a little emotion icon above someone's head (💢 ❤️ 💦 ❗ 😢 …)
  function emo(a, ch, ms) {
    if (!a || !a.el) return;
    if (!a.emoEl) { a.emoEl = document.createElement('i'); a.emoEl.className = 'emo'; a.el.appendChild(a.emoEl); }
    clearTimeout(a.emoT);
    if (!ch) { a.emoEl.classList.remove('on'); return; }
    a.emoEl.textContent = ch; a.emoEl.classList.remove('on'); void a.emoEl.offsetWidth; a.emoEl.classList.add('on');
    if (ms) a.emoT = setTimeout(() => a.emoEl && a.emoEl.classList.remove('on'), ms);
  }
  const actorOf = (who) => (who === 'simba' ? G.simba : who === 'nena' ? G.nena : G.npcs[who]);
  const WHO_NAME = { baba: 'Baba', fariba: 'Maman', nasim: 'Nasim', negin: 'Negin', pourya: 'Pourya', aunt: 'Aunt Mahin', courier: 'Delivery', guest2: 'VIP', witch1: 'Witch', kids: 'Kids', nena: 'Nena' };
  function talkAs(who, text, kind) {
    const a = actorOf(who);
    if (a && a.el.isConnected && !a.el.classList.contains('gone') && a.room === G.view) speak(a, text, kind || (who === 'simba' ? 'dog' : ''), 2400, true);
    else if (who !== 'simba' && WHO_NAME[who]) toast(`${WHO_NAME[who]}: “${text}”`, '', 1600);
  }
  const URGENT = {
    baba: ['Nenaaa! I’m waiting!', 'Is anybody in this house?!', 'My tea… my phone… my life!'],
    fariba: ['Nena jan, quickly please!', 'The rice will burn!', 'I can’t do everything alone!'],
    nasim: ['I’m leaving in 3… 2…', 'Hello?! I’m talking to you!', 'Ugh, forget it!'],
    negin: ['zzz… (still asleep)', 'zzz… five more minutes…'],
    pourya: ['Nena? Nena? Nenaaa?'], kids: ['Simbaaa! Come here!', 'Can we pet him or not?!'],
    aunt: ['Where is my tea, azizam?', 'In my house, guests get tea right away!'], courier: ['Hellooo? Delivery!', 'I don’t have all day!'],
    guest2: ['Excuse me! Service?', 'I’m a VIP, you know.'], witch1: ['Hehehe… the curse grows…', 'Your hookah is doomed…'],
    simba: ['*whine*', '*whimper*', 'Woof?! WOOF!', '*paws at the floor*'], biscuit: ['Yip! Yip!'],
  };
  const THANKS = {
    baba: ['Merci azizam! ❤️', 'That’s my girl!', 'Ahh, perfect!'], fariba: ['Khasteh nabashi, Nena jan!', 'You’re an angel!', 'Merci, my daughter!'],
    nasim: ['…Thanks.', 'Fine. Good. Whatever.'], negin: ['Mmm, merci!', 'You’re the best!'], pourya: ['Merci, Nena!'],
    guest2: ['Excellent service! Here, a big tip.', 'Bravo!'], courier: ['Have a nice day!'], kids: ['Yaaay!'],
  };
  const FAILS = {
    baba: ['Forget it! I’ll watch the match alone.', 'Nobody listens to Baba…'], fariba: ['I’ll do it myself… as always.', 'Ay, Nena…'],
    nasim: ['FINE. I’m going out!', 'Whatever!'], negin: ['zzz… (went back to sleep)'], pourya: ['Okay… next time!'],
    aunt: ['Hmph! No tea for your old aunt?'], guest2: ['Terrible service!'], kids: ['Booo!'],
  };
  // request types whose finishing touch already has its own line
  const SPEAKS = new Set(['tea', 'charger', 'cuddle', 'laundry', 'talk', 'wake', 'ready', 'study', 'bath', 'poop', 'calm', 'bread', 'juice', 'kids', 'phone', 'coals', 'chai', 'doze', 'snack', 'insta', 'aunt', 'curse', 'chase', 'flowers', 'choco', 'jtext', 'remote', 'plants', 'dogfriend', 'selfie']);
  function moodFor(r, f) {
    if (r.who === 'simba' || r.who === 'nena') return;
    const def = defMood(r.who);
    let m = def;
    if (r.who === 'negin' && (r.type === 'wake' || r.type === 'doze')) m = 'sleepy';
    else if (def === 'angry') m = 'angry';
    else if (f < 0.3) m = 'angry';
    else if (f < 0.6) m = 'neutral';
    setMood(r.who, m);
  }
  function onUrgent(r) {
    const a = actorOf(r.who); if (!a || r.who === 'nena') return;
    emo(a, r.who === 'simba' ? '❗' : '💢', 0);
    if (!r.said && URGENT[r.who]) { r.said = true; talkAs(r.who, pick(URGENT[r.who])); if (r.who === 'simba') joy(-4); }
    if (r.who === 'simba' && G.simba && !G.simbaAway) { G.simba.el.classList.add('barking'); setTimeout(() => G.simba && G.simba.el.classList.remove('barking'), 1000); }
  }
  function jolt(a, cls) { if (!a || !a.el) return; a.el.classList.remove('yay', 'oops', 'stomp'); void a.el.offsetWidth; a.el.classList.add(cls); clearTimeout(a.joltT); a.joltT = setTimeout(() => a.el && a.el.classList.remove(cls), 700); }
  function reactDone(r, perfect) {
    const a = actorOf(r.who), room = whoRoom(r.who);
    if (a && r.who !== 'simba' && r.who !== 'nena') jolt(a, 'yay');
    if (a) emo(a, perfect ? '💖' : '❤️', 1500);
    const [x, y] = anchorOf(r.who);
    burst(x, y + 34, room, perfect ? 'stars' : 'hearts', perfect ? 7 : 4);
    if (r.who === 'simba') { joy(perfect ? 12 : 8); if (G.simba && !G.simbaAway) { simbaHop(); if (rnd() < 0.5) speak(G.simba, pick(['Woof! ❤️', '*happy wiggle*', 'Arf arf!']), 'dog', 1400); } return; }
    if (G.npcs[r.who]) setMood(r.who, 'happy', 2600);
    if (!SPEAKS.has(r.type) && THANKS[r.who] && rnd() < 0.85) talkAs(r.who, pick(THANKS[r.who]));
  }
  function reactFail(r) {
    const a = actorOf(r.who);
    if (a && r.who !== 'simba' && r.who !== 'nena') jolt(a, 'stomp');
    if (a) emo(a, r.who === 'simba' ? '😢' : '💢', 2600);
    if (G.npcs[r.who]) setMood(r.who, r.who === 'fariba' ? 'sad' : 'angry', 3200);
    if (r.who === 'simba') {
      joy(-15);
      if (r.type === 'bath' && G.muddy) { G.muddy = false; refreshSimba(); }
      if (G.simba && !G.simbaAway && !G.simbaTask) { G.simba.el.classList.add('lying'); speak(G.simba, '*whimper*', 'dog', 1800); }
    } else if (FAILS[r.who]) talkAs(r.who, pick(FAILS[r.who]));
  }
  // Simba's happiness (0–100): care and cuddles raise it, neglect lowers it
  function joy(d) { if (!G.simba) return; G.joy = Math.max(0, Math.min(100, G.joy + d)); }
  function petSimba() {
    const s = G.simba; if (!s || G.simbaAway) return;
    const now = performance.now(), fresh = now - (G.lastPet || 0) > 5000; G.lastPet = now;
    if (fresh) { joy(6); G.score += 10; track('pet'); }
    s.el.classList.remove('lying', 'sniff', 'roll', 'spin', 'hop');
    void s.el.offsetWidth;
    const k = pick(['roll', 'lick', 'paw', 'spin']);
    if (k === 'roll') { s.el.classList.add('roll'); setTimeout(() => s.el.classList.remove('roll'), 1200); speak(s, '*rolls over for belly rubs*', 'dog', 1700); }
    else if (k === 'lick') { simbaHop(); speak(s, '*lick lick* 💕', 'dog', 1500); speak(G.nena, pick(['Haha, Simba! That tickles!', 'Eww, dog kisses! 😂']), '', 1700); }
    else if (k === 'paw') { simbaHop(); speak(s, '🐾 High five!', 'dog', 1400); }
    else { s.el.classList.add('spin'); setTimeout(() => s.el.classList.remove('spin'), 1450); }
    if (k !== 'lick') speak(G.nena, pick(['Good boy!', 'Who’s my little lion?', 'Aww, Simba!', 'Best dog in Tehran!']), '', 1500);
    emo(s, '💕', 1500);
    burst(s.x, s.y - 60, s.room, 'hearts', 6);
  }
  function simbaIdle() { const s = G.simba; return s && !G.simbaAway && !G.simbaTask && !s.el.classList.contains('cuddle') && !s.el.classList.contains('bath') && !findReq('simba') && s.room === 'salon'; }
  // the doorbell: Simba runs to the door and barks
  function simbaDoorbell() {
    if (!simbaIdle()) return;
    const s = G.simba; G.simbaTask = true; s.el.classList.remove('lying', 'sniff');
    walkActor(s, FRONT[0] - 60, FRONT[1] + 120, () => {
      if (!G || !G.simba) return;
      emo(s, '❗', 1600); speak(s, 'WOOF! WOOF!', 'dog', 1600); s.el.classList.add('barking'); if (s.room === G.view) snd('bark');
      setTimeout(() => { if (!G || !G.simba) return; s.el.classList.remove('barking'); const h = HOMES.home.simba; walkActor(s, h[1], h[2], () => { if (G) G.simbaTask = false; }, 110); }, 1800);
    }, 170);
  }
  // particles: hearts, stars, drops, bubbles, dust, confetti
  const BURST = { hearts: ['❤️', '💕', '💖'], stars: ['✨', '⭐', '✨'], drops: ['💧'], bubbles: ['🫧'], notes: ['🎵', '🎶'] };
  function burst(x, y, room, kind, n) {
    if (!G || room !== G.view) return;
    const l = layer(room); n = n || 6;
    for (let i = 0; i < n; i++) {
      const e = document.createElement('i'); e.className = 'pt ' + kind;
      if (BURST[kind]) e.textContent = pick(BURST[kind]); else if (kind === 'confetti') e.style.background = pick(['#ef8fb0', '#ffd36b', '#7fe0b4', '#86aaff', '#ffffff']);
      l.appendChild(e);
      const ang = (i / n) * Math.PI * 2 + rnd() * 0.7, d = 26 + rnd() * 44;
      const floaty = kind === 'hearts' || kind === 'bubbles' || kind === 'notes';
      const dx = Math.cos(ang) * d, dy = kind === 'drops' ? 18 + Math.abs(Math.sin(ang)) * d : Math.sin(ang) * d * 0.6 - (floaty ? 50 + rnd() * 40 : 0);
      e.animate([{ transform: `translate(${x}px, ${y}px) scale(.4) rotate(0deg)`, opacity: 1 }, { transform: `translate(${(x + dx).toFixed(0)}px, ${(y + dy).toFixed(0)}px) scale(1.1) rotate(${kind === 'confetti' ? 300 : 0}deg)`, opacity: 0 }], { duration: 700 + rnd() * 450, easing: 'cubic-bezier(.2,.7,.4,1)' });
      setTimeout(() => e.remove(), 1200);
    }
  }
  function flashStage() { const f = document.createElement('div'); f.className = 'flash'; $('stage-wrap').appendChild(f); setTimeout(() => f.remove(), 500); }
  // remote hunt: the ❓ spots
  function searchSpots(on) {
    stage().querySelectorAll('.hit.station.search').forEach((b) => b.classList.toggle('active', !!on && !G.searched.has(b.dataset.target)));
  }
  function searchSpot(id, rr) {
    G.searched.add(id); searchSpots(G.reqs.includes(rr));
    if (id === G.remoteSpot && G.reqs.includes(rr)) {
      give('remote'); searchSpots(false);
      speak(G.nena, pick(['Found it! 🎉', 'Under there, of course!', 'Got the remote!']), '', 1600);
      burst(G.st[id].x, G.st[id].y, G.st[id].room, 'stars', 7); snd('coin');
      if (!G.queue.some((q) => q.id === 'baba')) { G.queue.unshift({ id: 'baba', r: rr }); markQueue(); }
    } else { speak(G.nena, pick(['Not here… 🤔', 'Hmm, not under there.', 'Nope! Somewhere else…']), 'think', 1400); burst(G.st[id].x, G.st[id].y, G.st[id].room, 'dust', 5); }
  }

  /* ------------------------------------------------------------------ */
  /* Requests                                                            */
  /* ------------------------------------------------------------------ */
  function whoRoom(who) {
    if (who === 'simba') return G.simba ? G.simba.room : null;
    if (who === 'nena') return G.nena.room;
    if (G.npcs[who]) return G.npcs[who].room;
    if (G.st[who]) return G.st[who].room;
    return null;
  }
  function anchorOf(who) {
    if (who === 'simba' && G.simba) return [G.simba.x, G.simba.y - G.simba.h - 6];
    if (who === 'nena') return [G.nena.x, G.nena.y - G.nena.h - 6];
    if (G.npcs[who]) return [G.npcs[who].x, G.npcs[who].y - G.npcs[who].h - 6];
    if (G.st[who]) { const s = G.st[who]; return [s.x, s.y - s.r + 4]; }
    return [300, 300];
  }
  function patienceMul(who) {
    let m = G.cfg.patience || (G.n <= 3 ? 1.3 : G.n <= 6 ? 1.15 : 1);
    if (who === 'simba' && up('treats')) m *= 1.2;
    if (who !== 'simba' && up('decor')) m *= 1.15;
    if (G.W.tabs.length > 2) m *= 1.1;  // more rooms, more walking
    const f = FR_OF[who]; if (f) m *= 1 + 0.04 * friendLv(f);
    m *= 1 + 0.01 * cozy();
    if (G.cfg.mod && G.cfg.mod.patienceMul) m *= G.cfg.mod.patienceMul;
    if (G.boosts.easy) m *= 1.3;
    if (G.zen) m *= 1.1;
    if (who === 'simba' && G.slept) m *= 1.15;
    return m;
  }
  function spawn() {
    const busyWho = new Set(G.reqs.map((r) => r.who));
    let types = G.cfg.types.filter((t) => !busyWho.has(REQ[t].who));
    if (G.simbaAway || G.simbaTask || holding('pup')) types = types.filter((t) => REQ[t].who !== 'simba' && REQ[t].src !== 'simba');
    if (up('fountain')) types = types.filter((t) => (t !== 'water' && t !== 'thirst') || rnd() < 0.6);
    if (!types.length) return;
    addReq(pick(types.concat(types.filter((x) => REQ[x].who === 'simba'))));
  }
  function addReq(t) {
    const R = REQ[t];
    if (G.reqs.some((r) => r.who === R.who)) return;
    if (TRANSIENT[R.who] && !G.npcs[R.who]) { spawnNpc(R.who); snd('swoosh'); }
    if (R.who === 'simba' && G.simba) G.simba.el.classList.remove('lying', 'sniff');
    lifeHome(R.who);
    const max = R.pat * patienceMul(R.who);
    const el = document.createElement('div');
    el.className = 'req';
    el.dataset.target = R.who;
    el.innerHTML = `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" class="ring-bg"/><circle cx="20" cy="20" r="17" class="ring"/></svg><span>${R.icon}</span><i class="need-chip" hidden></i>`;
    layer(whoRoom(R.who)).appendChild(el);
    const r = { type: t, who: R.who, left: max, max, el };
    if (R.vip) el.classList.add('vip');
    G.reqs.push(r);
    if (R.who === 'courier' || R.who === 'aunt') simbaDoorbell();
    if (t === 'bath') { G.muddy = true; refreshSimba(); }
    if (t === 'remote') { G.remoteSpot = pick(R.search.filter((x) => G.st[x])); G.searched = new Set(); searchSpots(true); }
    posReq(r);
    if (R.special) { toast(R.hint, 'hint', 2400); snd('fanfare'); }
    else if (t === 'phone') { snd('fanfare'); buzz([30, 60, 30]); toast('📞 Baba is calling…', '', 1200); }
    else snd(R.who === 'simba' ? 'bark' : 'pop');
  }
  function posReq(r) {
    const room = whoRoom(r.who);
    if (room && r.el.parentNode !== G.layers[room]) layer(room).appendChild(r.el);
    const [x, y] = anchorOf(r.who);
    const px = Math.round(x), py = Math.round(y);
    if (r.px !== px || r.py !== py) { r.px = px; r.py = py; r.el.style.transform = `translate(${px - 24}px, ${py - 48}px)`; }
    const f = r.left / r.max;
    if (!r.ring) r.ring = r.el.querySelector('.ring');
    const off = Math.round((1 - f) * 1068) / 10;
    if (r.off !== off) { r.off = off; r.ring.style.strokeDashoffset = off; }
    const hue = Math.round(Math.max(0, Math.min(1, (f - 0.15) / 0.6)) * 10) * 12;  // red → amber → green
    if (r.hue !== hue && G.freezeT <= 0) { r.hue = hue; r.ring.style.stroke = `hsl(${hue}, 62%, 48%)`; }
    const u = f < 0.3 && G.freezeT <= 0, fr = G.freezeT > 0;
    if (r.u !== u) { r.u = u; r.el.classList.toggle('urgent', u); if (u) onUrgent(r); else { const a = actorOf(r.who); if (a && r.who !== 'nena') emo(a, ''); } }
    const mb = f < 0.3 ? 0 : f < 0.6 ? 1 : 2;
    if (r.mb !== mb) { r.mb = mb; moodFor(r, f); }
    if (r.fr !== fr) { r.fr = fr; r.el.classList.toggle('frozen', fr); if (fr) r.ring.style.stroke = ''; else r.hue = -1; }
  }
  // the little chip under a bubble says what Nena has to fetch first (or that she already has it)
  function updateChips() {
    G.reqs.forEach((r) => {
      const R = REQ[r.type], chip = r.el.querySelector('.need-chip'); if (!chip) return;
      let txt = '', cls = '';
      if (R.search && !holding(R.item)) txt = '🔍 ❓';
      else if (R.item) {
        if (holding(R.item)) { txt = '✓ ' + ITEMS[R.item]; cls = 'ok'; }
        else if (R.src === 'simba') txt = '🐕';
        else { const S = STATIONS[R.src]; txt = (S.chip || ITEMS[R.item]) + (S.room !== whoRoom(r.who) ? ' ' + ROOMS[S.room].icon : ''); }
      }
      const k = txt + cls;
      if (r.chipK === k) return; r.chipK = k;
      chip.hidden = !txt; chip.textContent = txt; chip.className = 'need-chip ' + cls;
    });
  }
  function removeReq(r) {
    r.el.remove(); G.reqs = G.reqs.filter((x) => x !== r);
    const ra = actorOf(r.who); if (ra && r.who !== 'nena') emo(ra, '');
    if (r.type === 'remote') { G.remoteSpot = null; searchSpots(false); if (holding('remote')) take('remote'); }
    if (TRANSIENT[r.who] && G.npcs[r.who]) { const n = G.npcs[r.who]; delete G.npcs[r.who]; n.el.classList.add('leave'); setTimeout(() => n.el.remove(), 500); }
    G.queue = G.queue.filter((q) => q.r !== r);
    markQueue();
  }
  function fail(r) {
    if (r.type === 'jtext') { removeReq(r); toast('Jesus: “…You’re ignoring me? 🥺”', '', 1500); return; }
    if (r.type === 'insta') { removeReq(r); toast('Pourya: “Okay… I’ll ask next time!” 😏', '', 1500); return; }
    removeReq(r);
    G.hearts--; G.failed++; G.combo = 0;
    if (G.mc && G.mc.m.k === 'nomiss') miniEnd(false);
    snd('fail'); haptic('fail'); shake(); G.heartLost = performance.now();
    { const w = $('stage-wrap'); w.classList.remove('hurt'); void w.offsetWidth; w.classList.add('hurt'); }
    jolt(G.nena, 'oops');
    renderObj();
    const [x, y] = anchorOf(r.who);
    floatText(x, y, '💔', 'bad', whoRoom(r.who));
    const R = REQ[r.type];
    reactFail(r);
    if (r.type === 'walk') { addFur(true); toast('Oops! Simba couldn’t wait… a puddle to clean.', 'bad'); }
    else if (r.type === 'brush') { addFur(); addFur(); }
    else if (r.type === 'phone') toast('Baba: “WHY DON’T YOU ANSWER?!” 😤', 'bad');
    else if (r.type === 'calm') toast('Simba chased the cat across the street!', 'bad');
    if (R.item === 'pup' && holding('pup') && !G.reqs.some((x) => REQ[x.type].item === 'pup')) { take('pup'); releaseSimba(); }
    if (G.hearts <= 0) outOfHearts();
  }
  function complete(r, bonusMul) {
    if (!G.reqs.includes(r)) return;
    const R = REQ[r.type];
    const speed = 1 + 0.5 * (r.left / r.max);
    G.combo = G.comboT > 0 ? Math.min(G.combo + 1, 8) : 1;
    G.comboT = 6;
    const mul = 1 + 0.15 * (G.combo - 1);
    const perfect = r.left / r.max > 0.75;
    const pts = Math.round(R.pts * speed * mul * (bonusMul || 1) * (G.rushHour ? 1.5 : 1) * ((G.cfg.mod && G.cfg.mod.ptsMul) || 1));
    G.score += pts; G.done++;
    const tip = r.who !== 'simba' && r.who !== 'nena' ? 2 + Math.round(3 * r.left / r.max) + (r.type === 'kids' ? 3 : 0) : 0;
    G.coins += tip;
    G.stats.tips += tip; G.stats.maxCombo = Math.max(G.stats.maxCombo, G.combo);
    G.stats.type[r.type] = (G.stats.type[r.type] || 0) + 1;
    track('req'); track('req_' + r.type); addFriend(r.who, perfect); gainXP(perfect ? 3 : 2);
    miniHit('serve'); if (r.who === 'simba') miniHit('simba'); else if (r.who !== 'nena') miniHit('family'); if (perfect) miniHit('perfect');
    if (G.combo === 5) track('combo5');
    if (G.combo === 8) track('combo8');
    if (r.type === 'walk') G.stats.walk++;
    if (r.type === 'tea') G.stats.tea++;
    const [x, y] = anchorOf(r.who);
    const room = whoRoom(r.who);
    floatText(x, y, `+${pts}${G.combo > 1 ? ` ×${mul.toFixed(2).replace(/\.?0+$/, '')}` : ''}`, 'good', room);
    const close = !perfect && r.left / r.max < 0.2;
    if (perfect) floatText(x, y - 34, 'Perfect!', 'perfect', room);
    else if (close) { floatText(x, y - 34, 'Phew! Just in time!', 'perfect', room); haptic('phew'); }
    sparkle(x, y + 20, room);
    const rush = (G.combo === 5 || G.combo === 8) && G.boostT <= 0;
    if (rush) { G.boostT = 6; G.nena.el.classList.add('boost'); }
    if (tip) { floatText(x + 30, y + 24, `+${tip} 🪙`, 'coin', room); flyCoins(tip, x, y, room); }
    if (G.combo >= 2) announce(COMBO_WORDS[G.combo], rush ? '⚡ Chai rush! Nena is super fast' : `Combo ×${G.combo}`, G.combo);
    removeReq(r);
    snd(G.combo >= 2 ? 'combo' : 'success', G.combo); if (rush) setTimeout(() => snd('fanfare'), 160);
    haptic(perfect ? 'perfect' : G.combo >= 2 ? 'combo' : 'deliver', G.combo);
    if (G.combo >= 3 || perfect) jolt(G.nena, 'yay');
    reactDone(r, perfect);
    if (G.combo === 5 || G.combo === 8) burst(G.nena.x, G.nena.y - 90, G.nena.room, 'confetti', 14);
    checkObj();
  }
  const CONT_COST = 25;
  function outOfHearts() {
    if (G.continued || G.cfg.endless || save.coins + G.coins < CONT_COST) { endLevel(true); return; }
    G.paused = true;
    $('c-cost').textContent = CONT_COST;
    $('c-msg').textContent = pick(['The family is losing patience…', 'Baba is grumbling, Simba is sulking…', 'Everyone is upset… but there is still time!']);
    $('c-portrait').innerHTML = A.portrait('nena', 'sad');
    show('screen-continue');
  }
  function addFur(puddle) {
    if (G.furs.length >= 7 || !G.layers.salon) return;
    const z = FUR_ZONE;
    const x = z.x0 + rnd() * (z.x1 - z.x0), y = z.y0 + rnd() * (z.y1 - z.y0);
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'hit fur' + (puddle ? ' puddle' : '');
    b.innerHTML = puddle ? '<svg viewBox="0 0 60 30"><ellipse cx="30" cy="15" rx="28" ry="12" fill="#e9d36a" opacity=".85"/><ellipse cx="22" cy="12" rx="8" ry="3" fill="#fff" opacity=".5"/></svg>'
      : '<svg viewBox="0 0 60 30"><ellipse cx="30" cy="24" rx="24" ry="5" fill="rgba(0,0,0,.12)"/><circle cx="24" cy="16" r="10" fill="#d98f45"/><circle cx="36" cy="14" r="9" fill="#eaa75c"/><circle cx="30" cy="20" r="8" fill="#c97f3a"/></svg>';
    const id = 'fur' + Math.floor(rnd() * 1e9);
    b.dataset.target = id;
    b.style.left = (x - 30) + 'px'; b.style.top = (y - 15) + 'px';
    b.style.zIndex = String(Math.round(y) - 40);
    layer('salon').appendChild(b);
    G.furs.push({ id, x, y, el: b, puddle });
  }
  function addDish() { G.dishes = Math.min(4, G.dishes + 1); renderDishes(); }
  function renderDishes() {
    if (!G.layers.kitchen) return;
    let el = G.layers.kitchen.querySelector('.dishes');
    if (!el) { el = document.createElement('div'); el.className = 'dishes'; G.layers.kitchen.appendChild(el); }
    el.innerHTML = Array.from({ length: G.dishes }, () => '<i></i>').join('');
    el.style.left = '150px'; el.style.top = (262 - G.dishes * 6) + 'px';
  }

  /* ------------------------------------------------------------------ */
  /* Tapping: queue targets for Nena                                     */
  /* ------------------------------------------------------------------ */
  const findReq = (who, type) => G.reqs.find((r) => r.who === who && (!type || r.type === type));
  const holding = (it) => G.hand.includes(it);
  const take = (it) => { const i = G.hand.indexOf(it); if (i >= 0) G.hand.splice(i, 1); renderHand(); };
  const planned = (id) => G.queue.some((q) => q.id === id) || (G.busy && G.busy.id === id);
  // the next place Nena must go for a request
  function nextStep(r) { const R = REQ[r.type]; if (R.search && !holding(R.item)) return (R.search.find((x) => G.st[x] && !G.searched.has(x))) || R.at; return R.item && !holding(R.item) ? R.src : R.at; }
  // One tap on a request (bubble, character or tab icon) plans the whole trip
  function chainFor(r) {
    const R = REQ[r.type], steps = [];
    if (R.search && !holding(R.item)) {
      const left = R.search.filter((x) => G.st[x] && !G.searched.has(x) && !G.queue.some((q) => q.id === x));
      if (!left.length) return steps;
      const here = left.filter((x) => G.st[x].room === G.nena.room);
      toast('🔍 Search the ❓ spots to find the remote! (Tap a spot to choose)', 'hint', 1800);
      return [{ id: (here.length ? here : left)[0], r }];
    }
    if (R.item && !holding(R.item) && !G.queue.some((q) => q.r === r && q.id === R.src) && !(G.busy && G.busy.r === r)) steps.push({ id: R.src, r });
    if (!G.queue.some((q) => q.r === r && q.id === R.at)) steps.push({ id: R.at, r });
    return steps;
  }
  function tapTarget(id) {
    const r = G.reqs.find((x) => x.who === id) || G.reqs.find((x) => REQ[x.type].at === id && REQ[x.type].item && !holding(REQ[x.type].item));
    if (r) return chainFor(r);
    return [{ id }];
  }
  function queueSteps(steps) {
    if (!steps.length) return;
    if (G.queue.length + steps.length > 6) { toast('Nena can only plan 6 things at once!', 'bad', 1200); return; }
    steps.forEach((s) => G.queue.push(s));
    if (G.queue.length >= 4) emo(G.nena, '💦', 1600);
    snd('click'); buzz(6);
    markQueue();
  }
  function onTap(e) {
    if (!G || G.paused || G.over) return;
    if (G.intro) { endIntro(); return; }
    const bone = e.target.closest('[data-bone]');
    if (bone) { catchBone(); return; }
    if (e.target.closest('[data-photo]')) { takePhoto(); return; }
    const t = e.target.closest('[data-target]');
    ripple(e, !!t);
    if (!t) { swipeStart = { x: e.clientX, y: e.clientY, t: performance.now() }; return; }
    swipeStart = null;
    t.classList.remove('tapped'); void t.offsetWidth; t.classList.add('tapped');
    if (t.dataset.target === 'nena' && !findReq('nena')) {
      if (G.queue.length) { G.queue = []; markQueue(); toast('Plan cleared ✋', '', 900); snd('pop'); }
      return;
    }
    queueSteps(tapTarget(t.dataset.target));
  }
  let swipeStart = null;
  function onSwipeEnd(e) {
    const s0 = swipeStart; swipeStart = null;
    if (!s0 || !G || G.over || G.paused) return;
    const dx = e.clientX - s0.x, dy = e.clientY - s0.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5 || performance.now() - s0.t > 600) return;
    const tabs = G.W.tabs; const i = tabs.indexOf(G.view); if (i < 0 || tabs.length < 2) return;
    const j = Math.max(0, Math.min(tabs.length - 1, i + (dx < 0 ? 1 : -1)));
    if (j !== i) { snd('tab'); G.peekAt = performance.now(); setView(tabs[j]); }
  }
  function ripple(e, hit) {
    const wrap = $('stage-wrap'), r = wrap.getBoundingClientRect();
    const d = document.createElement('i'); d.className = 'ripple' + (hit ? ' hit' : '');
    d.style.left = (e.clientX - r.left) + 'px'; d.style.top = (e.clientY - r.top) + 'px';
    wrap.appendChild(d); setTimeout(() => d.remove(), 450);
  }
  // juicy delivery: the item flies from Nena's hands to where it goes
  function flyItem(icon, to, room) {
    if (!G || room !== G.view) return;
    const el = document.createElement('div'); el.className = 'fly'; el.textContent = icon;
    layer(room).appendChild(el);
    const x0 = G.nena.x + 22, y0 = G.nena.y - 84, [x1, y1] = to;
    el.animate([{ transform: `translate(${x0}px, ${y0}px) scale(1)` }, { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 70}px) scale(1.4)` }, { transform: `translate(${x1}px, ${y1}px) scale(.6)`, opacity: 0.2 }], { duration: 380, easing: 'ease-in-out' });
    setTimeout(() => el.remove(), 380);
  }
  // coins fly up to the coin counter
  function flyCoins(n, x, y, room) {
    if (!G || room !== G.view || !n) return;
    const st = stage().getBoundingClientRect(), app = document.querySelector('.app').getBoundingClientRect(), dst = $('g-coins').getBoundingClientRect();
    const k = st.width / 600;
    for (let i = 0; i < Math.min(5, n); i++) {
      const c = document.createElement('div'); c.className = 'coinfly'; c.textContent = '🪙';
      document.querySelector('.app').appendChild(c);
      const sx = st.left - app.left + x * k, sy = st.top - app.top + y * k, ex = dst.left - app.left, ey = dst.top - app.top;
      c.animate([{ transform: `translate(${sx}px, ${sy}px) scale(.8)` }, { transform: `translate(${sx + (i - 2) * 18}px, ${sy - 40}px) scale(1.2)`, offset: 0.3 }, { transform: `translate(${ex}px, ${ey}px) scale(.7)` }], { duration: 650 + i * 70, easing: 'cubic-bezier(.5,0,.7,1)' });
      setTimeout(() => { c.remove(); const g = $('g-coins').parentNode; g.classList.remove('bump'); void g.offsetWidth; g.classList.add('bump'); }, 650 + i * 70);
    }
  }
  function onTabs(e) {
    if (!G || G.paused || G.over) return;
    const b = e.target.closest('[data-req]');
    if (b) { const r = G.reqs[+b.dataset.req]; if (r) queueSteps(chainFor(r)); e.stopPropagation(); return; }
    const t = e.target.closest('[data-room]');
    if (t) { snd('tab'); G.peekAt = performance.now(); setView(t.dataset.room); }
  }
  function spawnBone() {
    const room = G.nena.room;
    const x = 120 + rnd() * 380, y = 560 + rnd() * 200;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'hit bone'; b.dataset.bone = '1';
    b.innerHTML = `<span>${G.cfg.place === 'clap' ? '🐱' : '🦴'}</span>`;
    b.style.left = (x - 30) + 'px'; b.style.top = (y - 30) + 'px';
    layer(room).appendChild(b);
    G.bone = { el: b, t: 7 };
    snd('happy');
  }
  function catchBone() {
    if (!G.bone) return;
    G.bone.el.remove(); G.bone = null;
    G.freezeT = 5; G.stats.treat++; G.score += 50;
    if (G.simba && !G.simbaAway && G.simba.room === G.view) { emo(G.simba, '🦴', 1600); G.simba.el.classList.add('spin'); setTimeout(() => G.simba && G.simba.el.classList.remove('spin'), 1450); joy(5); }
    burst(G.nena.x, G.nena.y - 120, G.nena.room, 'stars', 8);
    toast(G.cfg.place === 'clap' ? '🐱 Lucky cat! Everyone waits patiently for 5 s' : '🦴 Golden bone! Everyone waits patiently for 5 s', 'hint', 1800);
    snd('fanfare'); buzz([20, 40, 20]);
    checkObj();
  }
  function spawnPackage() {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'hit pkg'; b.dataset.target = 'pkg';
    b.innerHTML = '<span>📦</span><i></i>';
    b.style.left = (FRONT[0] - 70) + 'px'; b.style.top = (FRONT[1] - 30) + 'px';
    layer('salon').appendChild(b);
    G.pkg = { el: b, t: 10 };
    simbaDoorbell();
    toast('🔔 Ding-dong! A delivery at the front door', '', 1600);
    snd('pop');
  }
  function drawRoute() {
    if (!G.route) { G.route = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); G.route.setAttribute('class', 'route'); G.route.setAttribute('viewBox', '0 0 600 800'); G.route.innerHTML = '<path/><circle r="7"/>'; }
    const room = G.nena.room, l = G.layers[room];
    if (G.route.parentNode !== l) l.appendChild(G.route);
    if (!G.queue.length || G.nena.el.classList.contains('gone')) { if (G.routeK !== '') { G.routeK = ''; G.route.style.display = 'none'; } return; }
    const pts = [[G.nena.x, G.nena.y - 6]];
    for (const q of G.queue) {
      const r = targetRoom(q.id);
      if (r !== room) { const d = ROOMS[room].door; pts.push([d[0], d[1]]); break; }
      const p = targetPoint(q.id, false); if (p) pts.push([p[0], p[1] - 6]);
    }
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${Math.round(p[0])} ${Math.round(p[1])}`).join(' ');
    if (d === G.routeK) return;
    G.routeK = d; G.route.style.display = '';
    G.route.firstChild.setAttribute('d', d);
    const e = pts[pts.length - 1]; G.route.lastChild.setAttribute('cx', Math.round(e[0])); G.route.lastChild.setAttribute('cy', Math.round(e[1]));
  }
  function markQueue() {
    stage().querySelectorAll('.qmark').forEach((m) => m.remove());
    G.queue.forEach((q, i) => {
      const p = targetPoint(q.id, true), room = targetRoom(q.id);
      if (!p || !room) return;
      const m = document.createElement('div');
      m.className = 'qmark'; m.textContent = String(i + 1);
      m.style.transform = `translate(${p[0] - 12}px, ${p[1] - 12}px)`;
      layer(room).appendChild(m);
    });
  }
  function targetRoom(id) {
    if (G.st[id]) return G.st[id].room;
    if (id === 'simba') return G.simba && !G.simbaAway ? G.simba.room : null;
    if (id === 'phone') return G.nena.room;
    if (G.npcs[id]) return G.npcs[id].room;
    if (id === 'pkg') return G.pkg ? 'salon' : null;
    if (G.furs.some((f) => f.id === id)) return 'salon';
    return null;
  }
  function targetPoint(id, visual) {
    if (G.st[id]) return visual ? [G.st[id].x, G.st[id].y] : G.st[id].stand;
    if (id === 'simba') return G.simba ? (visual ? [G.simba.x, G.simba.y - 60] : [G.simba.x - 70, G.simba.y + 4]) : null;
    if (id === 'phone') return visual ? [G.nena.x, G.nena.y - 160] : [G.nena.x, G.nena.y];
    if (G.npcs[id]) { const a = G.npcs[id]; const side = a.x > 400 ? -70 : 70; return visual ? [a.x, a.y - 90] : [a.x + side, a.y + 6]; }
    if (id === 'pkg') return G.pkg ? (visual ? [FRONT[0] - 40, FRONT[1] - 30] : [FRONT[0] - 70, FRONT[1] + 30]) : null;
    const f = G.furs.find((x) => x.id === id);
    if (f) return visual ? [f.x, f.y] : [f.x - 40, f.y + 8];
    return null;
  }
  function give(it) {
    const cap = up('tray') ? 2 : 1;
    if (G.hand.length >= cap) {
      // swap: put down whatever nobody needs any more (never Simba!)
      let i = G.hand.findIndex((h) => h !== 'pup' && !G.reqs.some((r) => REQ[r.type].item === h));
      if (i < 0) i = G.hand.findIndex((h) => h !== 'pup');
      if (i < 0) { toast('Nena is carrying Simba!', 'bad', 1200); return false; }
      const old = G.hand.splice(i, 1)[0];
      floatText(G.nena.x, G.nena.y - 120, `${ITEMS[old]} put down`, 'hint');
    }
    G.hand.push(it); renderHand(); snd('pop'); return true;
  }
  function renderHand() {
    $('g-hand').innerHTML = G.hand.length ? G.hand.map((h) => `<span>${ITEMS[h]}</span>`).join('') : '<em>✋</em>';
    G.handEl.innerHTML = G.hand.map((h) => `<span>${ITEMS[h]}</span>`).join('');
  }

  /* ------------------------------------------------------------------ */
  /* What happens when Nena reaches a target                             */
  /* ------------------------------------------------------------------ */
  const speedMul = () => (1 / (1 + 0.15 * up('shoes'))) * (G.boostT > 0 ? 0.6 : 1) * (G.boosts.coffee ? 0.85 : 1);
  const enterFx = (txt) => () => { G.nena.el.classList.add('gone'); floatText(G.nena.x, G.nena.y - 150, txt || '🚪', 'hint'); };
  function actionFor(id, intended) {
    const sp = speedMul();
    const S = G.st[id];
    let r = intended && G.reqs.includes(intended) ? intended : null;
    if (S && S.search) {
      const rr = G.reqs.find((x) => x.type === 'remote');
      if (!rr || holding('remote') || G.searched.has(id)) return { dur: 0.2, miss: 'Nothing interesting here.' };
      return { dur: 0.9 * sp, snd: 'brush', done: () => searchSpot(id, rr) };
    }
    // 1) picking up an item at its source
    const pickR = (r && REQ[r.type].src === id ? r : null) || (!r ? G.reqs.find((x) => REQ[x.type].src === id && !holding(REQ[x.type].item)) : null);
    if (pickR && !holding(REQ[pickR.type].item)) {
      const item = REQ[pickR.type].item;
      if (holding('pup')) return { dur: 0.2, miss: 'Nena is carrying Simba!' };
      if (id === 'simba') {
        if (!G.simba || G.simbaAway) return null;
        if (G.simbaTask) return { dur: 0.3, miss: 'Simba is busy, try again!' };
        return { dur: 0.6, snd: 'happy', done: () => { if (!G.reqs.includes(pickR)) return; give('pup'); G.simbaAway = true; G.simba.el.classList.add('gone'); floatText(G.simba.x, G.simba.y - 100, 'Up you go!', 'hint', G.simba.room); } };
      }
      const dur = (S.dur || 0.5) * (id === 'samovar' && up('samovar') ? 0.6 : 1) * sp;
      return { dur, snd: id === 'samovar' ? 'water' : S.enter ? 'swoosh' : null, start: S.enter ? enterFx() : null, done: () => { if (S.enter) G.nena.el.classList.remove('gone'); give(item); if (S.say) say(pick(S.say)); } };
    }
    if (S && S.gives) {
      const item = S.gives;
      if (holding(item)) return { dur: 0.2, miss: 'Nena already has it!' };
      return { dur: 0.2, miss: `Nobody needs ${ITEMS[item]} right now.` };
    }
    // 2) delivering / doing the task
    const doR = (r && REQ[r.type].at === id ? r : null) || G.reqs.find((x) => REQ[x.type].at === id && (!REQ[x.type].item || holding(REQ[x.type].item))) || G.reqs.find((x) => REQ[x.type].at === id);
    if (doR) {
      const R = REQ[doR.type];
      if (id === 'simba' && (!G.simba || G.simbaAway)) return null;
      if (R.item && !holding(R.item)) return { dur: 0.2, miss: `First get ${ITEMS[R.item]} (${R.src === 'simba' ? 'Simba' : STATIONS[R.src].label})!` };
      if (doR.type === 'walk') return { dur: 0.3, done: () => doWalk(doR) };
      const fx = FX[doR.type] || {};
      return {
        dur: R.dur * (R.dur > 0.7 ? sp : 1), snd: fx.snd, start: fx.start ? () => fx.start(doR) : null,
        done: () => { if (fx.end) fx.end(doR); if (!G.reqs.includes(doR)) return; if (R.item && R.item !== 'pup') flyItem(ITEMS[R.item], anchorOf(doR.who), whoRoom(doR.who)); if (R.item) take(R.item); complete(doR); if (fx.after) fx.after(doR); },
      };
    }
    // 3) things with no request
    if (id === 'simba') { if (!G.simba || G.simbaAway) return null; return { dur: 0.6, snd: 'happy', done: () => petSimba() }; }
    if (id === 'sink') { if (!G.dishes) return { dur: 0.2, miss: 'No dirty dishes.' }; return { dur: 1.6 * sp, snd: 'water', done: () => { G.dishes--; renderDishes(); G.score += 60; floatText(193, 230, '+60', 'good', 'kitchen'); } }; }
    if (id === 'laptop') return { dur: 3 * sp, done: () => { G.coins += 6; G.score += 40; floatText(345, 220, '+40 · +6 🪙', 'coin', 'bedroom'); snd('coin'); } };
    if (id === 'pkg') { if (!G.pkg) return null; return { dur: 0.8 * sp, done: () => { if (!G.pkg) return; G.pkg.el.remove(); G.pkg = null; G.score += 100; G.coins += 12; floatText(FRONT[0] - 40, FRONT[1] - 80, '+100 · +12 🪙', 'coin', 'salon'); toast('📦 A package for Baba!', '', 1300); snd('coin'); } }; }
    const f = G.furs.find((x) => x.id === id);
    if (f) return { dur: (f.puddle ? 1.2 : 0.7) * sp, snd: 'brush', done: () => { burst(f.x, f.y, 'salon', f.puddle ? 'bubbles' : 'dust', 6); f.el.remove(); G.furs = G.furs.filter((x) => x !== f); G.score += f.puddle ? 30 : 20; floatText(f.x, f.y - 20, f.puddle ? '+30' : '+20', 'good', 'salon'); } };
    if (NOREQ[id]) return { dur: 0.2, miss: NOREQ[id] };
    return null;
  }
  // per-request flavour: sounds, little scenes and family one-liners
  const SPEAKER = { 'Aunt Mahin': 'aunt', Baba: 'baba', Maman: 'fariba', Nasim: 'nasim', Negin: 'negin', Pourya: 'pourya', Nena: 'nena', 'The kids': 'kids', Simba: 'simba' };
  const say = (t) => {
    const m = /^([^:“]+):\s*“?(.+?)”?(\s*[^\w\s]*)$/u.exec(t);
    const id = m && SPEAKER[m[1].trim()];
    const a = id === 'nena' ? G.nena : id === 'simba' ? G.simba : id ? G.npcs[id] : null;
    if (a && a.el.isConnected && !a.el.classList.contains('gone')) { speak(a, m[2] + (m[3] || ''), id === 'simba' ? 'dog' : '', 2600, true); if (a.room !== G.view) toast(t, '', 1600); }
    else toast(t, '', 1600);
  };
  const FX = {
    food: { after: () => { if (G.simba && !G.simbaAway) simbaGo(STATIONS.bowl.x + 50, STATIONS.bowl.y + 30, 2); } },
    water: { snd: 'water', after: () => burst(STATIONS.water.x, STATIONS.water.y - 10, 'salon', 'drops', 7) },
    brush: { snd: 'brush' },
    play: { snd: 'happy', after: () => simbaHop() },
    blanket: { snd: 'happy', after: () => (G.photoHint = 'blankie') && floatText(G.simba.x, G.simba.y - 100, 'zzz…', 'hint', G.simba.room) },
    tea: { after: () => say(pick(['Baba: “Merci azizam! Goal!!”', 'Baba: “Ahh, chai. Now sit with your old father.”'])) },
    charger: { after: () => say('Baba: “Ahh, 3%! Now where are those girls…” 📞') },
    cuddle: { end: () => cuddleSimba(), after: () => say('Baba: “My little lion! On my belly, come!” 🦁') },
    help: { snd: 'swoosh', after: () => addDish() },
    laundry: { snd: 'swoosh', after: () => say('Maman: “Merci azizam! What a mess that girl makes…”') },
    talk: { after: () => say('Nasim: “…Thanks. Whatever.”') },
    wake: { snd: 'click', start: () => enterFx('Knock knock…')(), end: () => G.nena.el.classList.remove('gone'), after: () => say('Negin: “I’m up… I’m up…”') },
    ready: { snd: 'brush', after: () => say('Nena: “Okay. I look amazing. Next!” ✨') },
    study: { snd: 'click', after: () => say('Nena: “Chapter done! Simba, stop sitting on my notes.”') },
    bath: { snd: 'splash', start: () => bathStart(), end: () => { burst(STATIONS.tub.x, STATIONS.tub.y - 20, 'bedroom', 'bubbles', 9); burst(STATIONS.tub.x, STATIONS.tub.y - 40, 'bedroom', 'drops', 6); G.muddy = false; refreshSimba(); releaseSimba(); }, after: () => say('Simba is clean and fluffy again! 🫧') },
    poop: { snd: 'swoosh', after: () => say('A neighbour: “What a polite young lady!”') },
    thirst: { snd: 'water', start: () => { if (G.simba) moveTo(G.simba, STATIONS.fountain.x - 40, STATIONS.fountain.y + 70, 0.4); }, after: () => { if (G.simba) moveTo(G.simba, HOMES.street.simba[1], HOMES.street.simba[2], 0.6); } },
    calm: { snd: 'happy', after: () => say('Simba: “*growls at the cat, then lies down*”') },
    bread: { snd: 'swoosh', after: () => say('Hot sangak in the 4×4. Maman will be happy!') },
    juice: { after: () => say('Nasim: “…It’s fine. Thanks. Don’t look at me.”') },
    kids: { snd: 'happy', after: () => { simbaHop(); say('The kids: “He looks like a lion!!” 🦁'); } },
    phone: { snd: 'talk', start: () => { G.nena.el.classList.add('talking'); }, end: () => G.nena.el.classList.remove('talking'), after: () => { toast('📞 ' + pick(BABA_CALLS), '', 1800); speak(G.nena, pick(['Yes Baba, we’re coming!', 'Baba, it’s only 9!', 'We’re fine, Baba!', 'Okay, okay! 😅']), '', 1800, true); } },
    coals: { snd: 'swoosh', after: () => say('Fresh coals. The hookah bubbles again 💨') },
    chai: { snd: 'water', after: () => say('Negin: “Ahh, chai. Wake me up when it’s cold.”') },
    doze: { snd: 'click', after: () => say('Negin: “I wasn’t sleeping! I was… resting my eyes.”') },
    snack: { after: () => say('Mochi time! 🍡') },
    remote: { after: () => say(pick(['Baba: “My remote! Now, where was I… GOOOAL!”', 'Baba: “Who put it there?! …Nasim.”'])) },
    plants: { snd: 'water', after: () => { burst(STATIONS.plant.x, STATIONS.plant.y, 'salon', 'stars', 6); burst(STATIONS.plant.x, STATIONS.plant.y + 20, 'salon', 'drops', 5); say(pick(['Nena: “Grow, little plant! 🌱”', 'Nena: “There you go, drink up!”'])); } },
    dogfriend: { snd: 'happy', start: () => { const b = G.npcs.biscuit; if (G.simba && b && !G.simbaAway) { G.simbaTask = true; walkActor(G.simba, b.x - 100, b.y - 4, null, 160); } },
      after: () => { const b = G.npcs.biscuit; joy(10); if (G.simba) { simbaHop(); emo(G.simba, '💕', 1600); speak(G.simba, 'WOOF! (Best friend!)', 'dog', 1700); burst(G.simba.x + 40, G.simba.y - 60, 'street', 'hearts', 6); setTimeout(() => { if (!G || !G.simba) return; const h = HOMES.street.simba; walkActor(G.simba, h[1], h[2], () => { if (G) G.simbaTask = false; }, 120); }, 1300); } if (b) emo(b, '💕', 1500); } },
    selfie: { snd: 'click', start: () => { flashStage(); snd('pop'); }, after: () => say(pick(['Negin: “Perfect! Posting it! #CLAPnight 📸”', 'Negin: “Ugh, my eyes were closed. …It’s fine, posting it.”'])) },
    flowers: { snd: 'fanfare', after: () => giftFrom('flowers') },
    jtext: { snd: 'fail', start: () => G.nena.el.classList.add('talking'), end: () => G.nena.el.classList.remove('talking'), after: () => { track('gift'); toast('📱 Jesus: “' + pick(['Did you like the flowers? 🌹', 'Good morning beautiful ☀️', 'Can I call you? 🥺', 'Coffee tomorrow?']) + '”', '', 1800); speak(G.nena, pick(['Don’t call me, don’t text me EVER again!', 'Stop texting me or I’ll block you!', 'Jesus, NO. Leave me alone!', 'Blocked. …Okay, almost blocked. 😤']), '', 2600, true); } },
    choco: { snd: 'fanfare', after: () => giftFrom('choco') },
    aunt: { after: () => say('Aunt Mahin: “Such a good girl! When is YOUR wedding?” 😅') },
    vip: { after: () => { G.coins += 15; floatText(112, 400, '+15 🪙 VIP tip!', 'coin', 'clap'); } },
    curse: { snd: 'talk', after: () => toast('The witches giggle… and stop. For now. 🔮', '', 1800) },
    chase: { snd: 'happy', after: () => { G.photoHint = 'thief'; say('Simba: “*gives back the sangak… mostly*”'); } },
    insta: { snd: 'talk', after: () => say(pick(['Nena: “Pourya… no.” 😅', 'Nena: “It’s private, Pourya.”', 'Nena: “Ask me again next week.” (He will.)', 'Negin: “She doesn’t have Instagram!” (She does.)', 'Nena: “Just bring the hookah, Pourya!”'])) },
  };
  // gifts from Jesus, Nena's secret admirer
  const GIFT_REACT = {
    baba: ['WHO is this Jesus?! Give me his number, I will call HIM!', 'Good girl. Block him!'],
    fariba: ['Azizam, at least be polite to the boy…', 'Such nice flowers… a shame.'],
    nasim: ['Block him! Block him! 😂', 'Can I have the chocolates if you don’t want them?'],
    negin: ['Poor Jesus… he really tries.', 'Calm down, it’s just chocolate!'],
    pourya: ['Yes! Block him, Nena! 😏', 'Finally someone who gets rejected more than me.'],
  };
  function giftFrom(kind) {
    track('gift');
    G.coins += 10;
    G.boostT = Math.max(G.boostT, 6); G.nena.el.classList.add('boost');
    toast(kind === 'flowers' ? '💐 Flowers from Jesus… again. Nena is NOT happy.' : '🍫 Chocolates from Jesus… again. Nena is fuming.', 'bad', 2400);
    floatText(G.nena.x, G.nena.y - 160, '😤 Angry boost!', 'perfect');
    speak(G.nena, pick(['Jesus, WHY do you keep sending me gifts?!', 'Don’t call me, don’t text me ever again, or I’ll block you!', 'Again?! I said NO, Jesus!', 'One more gift and I block you. For real!']), '', 2800, true);
    const who = Object.keys(GIFT_REACT).filter((w) => G.npcs[w] && G.npcs[w].room === G.view);
    if (who.length) { const w = pick(who); setTimeout(() => { if (G && !G.over) speak(G.npcs[w], pick(GIFT_REACT[w]), '', 2800, true); }, 1600); }
    if (kind === 'choco' && G.simba && G.simba.room === G.nena.room && !G.simbaAway) setTimeout(() => { if (!G || G.over) return; speak(G.simba, '*sniff sniff* 🍫?', 'dog', 1600, true); setTimeout(() => G && speak(G.nena, 'NO Simba! Chocolate is poison for dogs!', '', 2200, true), 900); }, 3200);
  }
  function doWalk(r) {
    G.simbaAway = true; G.busy = { t: 0, dur: 99, walking: true };
    const away = 3.6 / (1 + 0.2 * up('shoes'));
    const hasStreet = !!G.layers.street;
    G.nena.el.classList.add('walking'); G.simba.el.classList.add('walking');
    moveTo(G.simba, FRONT[0] - 20, FRONT[1] + 40, 0.9);
    moveTo(G.nena, FRONT[0] - 70, FRONT[1] + 40, 0.9, () => {
      if (hasStreet) {
        moveRoom(G.nena, 'street'); moveRoom(G.simba, 'street'); attachNenaOverlays();
        place(G.nena, 20, 545); place(G.simba, 70, 540);
        G.nena.el.classList.remove('flip'); G.simba.el.classList.add('flip');
        setView('street');
        moveTo(G.nena, 520, 545, away); moveTo(G.simba, 570, 540, away);
        floatText(300, 380, '🌳 Walk in Tehran…', 'hint', 'street');
      } else { G.nena.el.classList.add('gone'); G.simba.el.classList.add('gone'); }
      setTimeout(() => {
        if (!G || G.over) return;
        if (hasStreet) { moveRoom(G.nena, 'salon'); moveRoom(G.simba, 'salon'); attachNenaOverlays(); G.simba.el.classList.remove('flip'); setView('salon'); }
        place(G.nena, FRONT[0] - 70, FRONT[1] + 40); place(G.simba, FRONT[0] - 20, FRONT[1] + 40);
        G.nena.el.classList.remove('gone'); G.simba.el.classList.remove('gone');
        complete(r, 1);
        const h = HOMES.home.simba;
        moveTo(G.simba, h[1], h[2], 1.0, () => { G.simba.el.classList.remove('walking'); G.simbaAway = false; joy(4); if (G.cfg.rain && G.cfg.types.includes('bath')) { G.muddy = true; refreshSimba(); speak(G.simba, '*muddy paws* 🐾', 'dog', 1600); setTimeout(() => G && !G.over && addReq('bath'), 1500); } });
        moveTo(G.nena, h[1] - 80, h[2] + 20, 1.0, () => { G.nena.el.classList.remove('walking'); G.busy = null; });
      }, away * 1000);
    });
  }
  // Simba carried by Nena: on Baba's belly in the TV room, or in the bathtub
  function cuddleSimba() {
    const b = G.npcs.baba; if (!b || !G.simba) { releaseSimba(); return; }
    moveRoom(G.simba, b.room); place(G.simba, b.x + 8, b.y - 22);
    G.simba.el.classList.remove('gone'); G.simba.el.classList.add('cuddle');
    G.simba.el.style.zIndex = String(Math.round(b.y) + 2);
    setTimeout(() => { if (G && !G.over) releaseSimba(); }, 6000);
  }
  function bathStart() {
    if (!G.simba) return;
    moveRoom(G.simba, 'bedroom'); place(G.simba, STATIONS.tub.x, STATIONS.tub.y + 20);
    G.simba.el.classList.remove('gone'); G.simba.el.classList.add('bath');
    G.simba.el.style.zIndex = '800';
  }
  function releaseSimba() {
    if (!G.simba) return;
    const h = HOMES[G.cfg.place].simba; if (!h) return;
    G.simba.el.classList.add('gone');
    setTimeout(() => {
      if (!G || !G.simba) return;
      G.simba.el.classList.remove('cuddle', 'bath');
      moveRoom(G.simba, h[0]); place(G.simba, h[1], h[2]);
      G.simba.el.classList.remove('gone');
      G.simbaAway = false;
    }, 350);
  }
  function simbaGo(x, y, stay, cb) {
    G.simbaTask = true;
    G.simba.el.classList.add('walking');
    moveTo(G.simba, x, y, 0.6, () => {
      G.simba.el.classList.remove('walking');
      setTimeout(() => {
        if (!G || !G.simba) return;
        G.simba.el.classList.add('walking');
        const h = HOMES[G.cfg.place].simba;
        moveTo(G.simba, h[1], h[2], 0.6, () => { G.simba.el.classList.remove('walking'); G.simbaTask = false; if (cb) cb(); });
      }, stay * 1000);
    });
  }
  function zoomies() {
    if (!G.simba || G.simbaAway || G.simbaTask || findReq('simba') || G.simba.room !== 'salon') { G.zoomT = 6; return; }
    G.simbaTask = true;
    G.simba.el.classList.add('walking', 'zoom');
    toast('💨 ZOOMIES! Simba is running all over the living room!', 'combo', 1500);
    if (G.nena.room === 'salon') setTimeout(() => G && speak(G.nena, pick(['Simbaaa, calm down!', 'Not on the clean floor!', 'Haha, crazy dog!']), '', 1600, true), 400);
    snd('bark');
    const h = HOMES.home.simba;
    const pts = [[180, 640], [470, 700], [420, 560], [200, 720], [h[1], h[2]]];
    const step = (i) => {
      if (!G || G.over) return;
      if (i >= pts.length) { G.simba.el.classList.remove('walking', 'zoom'); G.simbaTask = false; return; }
      if (i === 1 || i === 3) addFur();
      moveTo(G.simba, pts[i][0], pts[i][1], 0.45, () => step(i + 1));
    };
    step(0);
  }
  function simbaHop() { if (!G.simba) return; G.simba.el.classList.remove('hop'); void G.simba.el.offsetWidth; G.simba.el.classList.add('hop'); }
  const tweens = [];
  function moveTo(a, x, y, dur, cb) { for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].a === a) tweens.splice(i, 1); tweens.push({ a, x0: a.x, y0: a.y, x, y, t: 0, dur, cb }); }

  /* ------------------------------------------------------------------ */
  /* Life: everybody moves, talks and walks around on their own          */
  /* ------------------------------------------------------------------ */
  const LINES = {
    simba: ['Woof!', 'Woof woof!', '*sniff sniff*', 'Grrr…', '*yawns*', '🎾?', '❤️', '*wags*', 'Arf!'],
    baba: ['Goooal!! ⚽', 'Nasim, where are you?! 📞', 'Negin! Wake up!', 'Is there tea?', 'In my day…', 'Persepolis!!', 'My lion, come here!', 'Who changed the channel?!'],
    fariba: ['Who ate the tahdig?!', 'Nena jan, taste this!', 'Ghormeh sabzi is almost ready', 'Don’t walk on my clean floor!', 'Ay, my back…', 'Simba, out of my kitchen!', 'Where is my saffron?'],
    negin: ['zzz…', 'Five more minutes…', 'This hookah is perfect', 'Did Baba call again?', 'Take a photo of me!', 'Mmm, this tea…', 'Don’t look at the witches.'],
    pourya: ['Fresh hookah heads! 🔥', 'Nena… Instagram? 😏', 'Double apple, mint, lemon!', 'Who wants coals?', 'Best hookah in Tehran!'],
    nasim: ['Don’t talk to me.', 'Ugh. Whatever.', 'Where is my charger?!', 'Leave me alone!', '…'],
    kids: ['Can we pet him?!', 'He’s a lion!!', 'Simbaaa!', 'So fluffy!'],
    guest: ['Haha!', 'Delicious!', 'One more tea please', '…and then she said…', '😂', 'So cozy here', 'Cheers! 🍵'],
    witch: ['hehehe…', '*whispers*', 'Look at her…', '🔮 …', 'Mwahaha', 'Her aura is… orange.', 'Another tea, darling.'],
    nena: ['Phew!', 'Simba, no!', 'So much to do…', 'Okay, focus!', '😅', 'I love this family. Mostly.', 'Coffee… I need coffee.'],
    courier: ['Delivery for Nena!', 'Sign here, please!', 'Don’t shoot the messenger!', 'From a certain Jesus… sorry.'],
    passer: ['Salam!', 'What a cute dog!', 'Is that a lion?!', '🙂', 'Hot sangak!'],
  };
  const PITCH = { baba: 290, fariba: 470, negin: 610, pourya: 340, nena: 650, nasim: 560, kids: 820, witch: 760, guest: 520, simba: 0 };
  const SPOTS = {
    baba: [[150, 590], [360, 560], [250, 640], [470, 540]], fariba: [[240, 470], [340, 470], [430, 470], [300, 720], [470, 700]],
    pourya: [[176, 452], [300, 456], [230, 462], [120, 456]], kids: [[70, 548], [130, 560], [40, 530]],
  };
  const SIMBA_ZONE = { salon: [150, 590, 520, 760], street: [280, 520, 440, 560] };
  function lifeAdd(id, a, o) {
    if (!a || G.life.some((L) => L.a === a)) return;
    G.life.push(Object.assign({ id, a, home: [a.room, a.x, a.y], t: 1.5 + rnd() * 4, lines: LINES[id] || LINES.guest, kind: '', spots: SPOTS[id] }, o));
  }
  function lifeHome(who) {
    const L = G.life && G.life.find((x) => x.id === who);
    if (!L || L.a.room !== L.home[0]) return;
    if (Math.hypot(L.a.x - L.home[1], L.a.y - L.home[2]) > 4) walkActor(L.a, L.home[1], L.home[2]);
  }
  function walkActor(a, x, y, cb, speed) {
    const d = Math.hypot(x - a.x, y - a.y);
    if (d < 3) { if (cb) cb(); return; }
    const facesLeft = a.el.classList.contains('simba');
    a.el.classList.toggle('flip', facesLeft ? x > a.x : x < a.x);
    a.el.classList.add('walking');
    moveTo(a, x, y, d / (speed || 75), () => { a.el.classList.remove('walking'); if (cb) cb(); });
  }
  function speak(a, text, kind, ms, force) {
    if (!a || !a.el.isConnected) return;
    if (!force && (a.room !== G.view || G.talk.size >= 3)) return;
    if (a.bubble) { a.bubble.el.remove(); G.talk.delete(a); }
    const el = document.createElement('div');
    el.className = 'say ' + (kind || '');
    el.textContent = text;
    layer(a.room).appendChild(el);
    a.bubble = { el, t: (ms || 2200) / 1000, w: el.offsetWidth, h: el.offsetHeight };
    G.talk.add(a);
    if (kind !== 'think' && kind !== 'dog') { a.el.classList.add('talking'); setTimeout(() => a.el && a.el.classList.remove('talking'), Math.min(ms || 2200, 1700)); }
    const id = a.el.dataset.actor, pitch = PITCH[id] != null ? PITCH[id] : id.startsWith('witch') ? PITCH.witch : PITCH.guest;
    if (a.room === G.view && pitch && kind !== 'think') [0, 90, 180].forEach((t) => setTimeout(() => snd('talk', pitch), t));
    posBubble(a);
  }
  function posBubble(a) {
    const b = a.bubble; if (!b) return;
    const left = a.x > 400;
    let x = left ? a.x - 18 - b.w : a.x + 18, y = a.y - a.h - b.h + 22;
    x = Math.max(4, Math.min(596 - b.w, x)); y = Math.max(4, y);
    b.el.classList.toggle('left', left);
    b.el.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px)`;
  }
  function talkTick(dt) {
    G.talk.forEach((a) => {
      const b = a.bubble; if (!b) { G.talk.delete(a); return; }
      b.t -= dt;
      if (b.t <= 0 || !a.el.isConnected) { b.el.remove(); a.bubble = null; G.talk.delete(a); return; }
      if (b.t < 0.3) b.el.classList.add('out');
      posBubble(a);
    });
  }
  function lifeTick(dt) {
    for (const L of G.life) {
      const a = L.a;
      if (!a.el.isConnected || a.el.classList.contains('gone')) continue;
      L.t -= dt; if (L.t > 0) continue;
      L.t = 3 + rnd() * 5;
      if (L.id === 'simba') { simbaLife(L); continue; }
      if (L.id === 'nena') { if (!G.busy && !G.queue.length && rnd() < 0.3) speak(a, pick(L.lines), 'think', 1900); continue; }
      if (L.id === 'baba' && G.simba && G.simba.el.classList.contains('cuddle')) { if (rnd() < 0.5) speak(a, pick(['My little lion ❤️', 'Who’s a good boy?', '*pets Simba*']), '', 2200); continue; }
      const hasReq = G.reqs.some((r) => r.who === L.id) || G.queue.some((q) => q.id === L.id) || (G.busy && G.busy.id === L.id);
      const home = Math.hypot(a.x - L.home[1], a.y - L.home[2]) < 4;
      if (hasReq) { if (!home && a.room === L.home[0]) walkActor(a, L.home[1], L.home[2]); continue; }
      const r = rnd();
      if (L.still || !L.spots || r < 0.45) speak(a, pick(L.lines), L.kind, 2300);
      else if (!home && r < 0.75) walkActor(a, L.home[1], L.home[2]);
      else { const p = pick(L.spots); walkActor(a, p[0], p[1]); }
    }
  }
  function simbaLife(L) {
    const s = G.simba;
    if (!s || G.simbaAway || G.simbaTask || s.el.classList.contains('cuddle') || s.el.classList.contains('bath') || findReq('simba') || G.queue.some((q) => q.id === 'simba')) { L.t = 2; return; }
    const B = SIMBA_ZONE[s.room]; if (!B) return;
    s.el.classList.remove('lying', 'sniff');
    const r = rnd();
    if (G.joy < 35 && r < 0.45) { s.el.classList.add('lying'); emo(s, '😢', 1800); speak(s, pick(['*whimper*', '*sighs*', '*sad eyes*']), 'dog', 1800); L.t = 5 + rnd() * 3; return; }
    if (G.joy >= 75 && r < 0.2) {
      if (G.st.toy && s.room === 'salon') {
        walkActor(s, G.st.toy.x - 40, G.st.toy.y + 60, () => { if (!G || !G.simba) return; emo(s, '🎾', 1500); simbaHop(); speak(s, '*plays with his ball*', 'dog', 1500); }, 130);
      } else { s.el.classList.add('spin'); emo(s, '✨', 1200); setTimeout(() => s.el.classList.remove('spin'), 1450); }
      return;
    }
    if (r < 0.32) {
      walkActor(s, B[0] + rnd() * (B[2] - B[0]), B[1] + rnd() * (B[3] - B[1]), () => { if (rnd() < 0.5 && G.simba) { s.el.classList.add('sniff'); setTimeout(() => s.el.classList.remove('sniff'), 1600); } }, 105);
    } else if (r < 0.47 && G.nena.room === s.room && !G.nena.el.classList.contains('gone')) {
      walkActor(s, Math.max(B[0], Math.min(B[2], G.nena.x + (rnd() < 0.5 ? -90 : 90))), Math.max(B[1], Math.min(B[3], G.nena.y)), () => speak(s, '❤️', 'dog', 1200), 120);
    } else if (r < 0.64) {
      speak(s, pick(LINES.simba), 'dog', 1500); s.el.classList.add('barking'); setTimeout(() => s.el.classList.remove('barking'), 1100);
      if (s.room === G.view && rnd() < 0.35) snd('bark');
    } else if (r < 0.78) { s.el.classList.add('lying'); speak(s, 'zzz…', 'dog', 1800); L.t = 6 + rnd() * 4; }
    else if (r < 0.87) { s.el.classList.add('spin'); setTimeout(() => s.el.classList.remove('spin'), 1450); }
    else { const h = HOMES[G.cfg.place].simba; if (h && h[0] === s.room) walkActor(s, h[1], h[2], null, 100); }
  }
  // the city goes on around them: people walking by, cars passing
  function ambientTick(dt) {
    const room = G.layers.street ? 'street' : null;
    if (!room) return;
    G.ambT -= dt; if (G.ambT > 0) return;
    G.ambT = 4 + rnd() * 5;
    const ltr = rnd() < 0.5;
    if (rnd() < 0.45) {
      const col = pick(['#c0392b', '#2c3e50', '#f2c230', '#7f8c8d', '#27ae60', '#e9e9e9', '#8e44ad']);
      const car = makeActor('traffic', CAR.replace('#f4f4f2', col).replace('#eceae6', col), 170, 85, 'car', room);
      place(car, ltr ? -100 : 700, 790); car.el.style.opacity = '.95';
      if (ltr) car.el.classList.add('flip');
      moveTo(car, ltr ? 700 : -100, 790, 3.2 + rnd(), () => car.el.remove());
    } else {
      const id = pick(['guest1', 'guest2', 'guest3', 'guest4', 'sam', 'mia']);
      const p = makeActor('passer', A.person(id, { mood: pick(['happy', 'neutral']) }), 70, 122, 'npc passer', room);
      const y = 470 + rnd() * 70;
      place(p, ltr ? -40 : 640, y);
      walkActor(p, ltr ? 640 : -40, y, () => p.el.remove(), 55 + rnd() * 25);
      if (rnd() < 0.5) setTimeout(() => { if (p.el.isConnected) speak(p, pick(LINES.passer), '', 1600); }, 2500 + rnd() * 2000);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Main loop                                                           */
  /* ------------------------------------------------------------------ */
  // mini challenges: short timed goals that pop up during the day
  const MINIS = [
    { k: 'serve', icon: '⚡', label: (n) => `Serve ${n} requests`, n: [3, 4], t: 30 },
    { k: 'simba', icon: '🐾', label: (n) => `Help Simba ${n} times`, n: [2, 3], t: 30, ok: () => !!G.simba },
    { k: 'family', icon: '👨‍👩‍👧', label: (n) => `Help the family ${n} times`, n: [2], t: 32, ok: () => G.cfg.types.filter((t) => REQ[t].who !== 'simba').length >= 2 },
    { k: 'perfect', icon: '✨', label: (n) => `${n} “Perfect!” serves`, n: [2], t: 30 },
    { k: 'combo', icon: '🔥', label: (n) => `Reach a ×${n} combo`, n: [3], t: 25 },
    { k: 'nomiss', icon: '🛡️', label: () => 'No miss for 30 s', n: [1], t: 30 },
    { k: 'clean', icon: '🧹', label: () => 'Clean up all the mess', n: [1], t: 22, ok: () => G.furs.length >= 2 },
  ];
  function miniTick(dt) {
    if (G.n < 3 && G.n < 900) return;
    const el = $('g-mini');
    if (!G.mc) {
      G.miniT = (G.miniT == null ? 14 : G.miniT) - dt;
      if (G.miniT > 0 || (!G.cfg.endless && G.time < 18) || G.intro) return;
      const pool = MINIS.filter((m) => !m.ok || m.ok());
      const m = pick(pool), n = pick(m.n);
      G.mc = { m, n, p: 0, t: m.t, max: m.t };
      G.miniN = (G.miniN || 0) + 1;
      el.innerHTML = `<span class="mc-i">${m.icon}</span><span class="mc-t"><small>MINI CHALLENGE</small><b>${m.label(n)}</b><i class="mc-bar"><i></i></i></span><em class="mc-p"></em>`;
      el.hidden = false; el.classList.remove('win', 'lose'); void el.offsetWidth; el.classList.add('in');
      snd('tab');
    }
    const c = G.mc;
    c.t -= dt;
    if (c.m.k === 'combo') c.p = Math.max(c.p, G.combo);
    if (c.m.k === 'clean') c.p = G.furs.length === 0 ? 1 : 0;
    el.querySelector('.mc-bar i').style.width = Math.max(0, (c.t / c.max) * 100).toFixed(1) + '%';
    el.querySelector('.mc-p').textContent = c.m.k === 'nomiss' ? `${Math.ceil(Math.max(0, c.t))}s` : `${Math.min(c.p, c.n)}/${c.n}`;
    if (c.m.k === 'nomiss' ? c.t <= 0 : c.p >= c.n) miniEnd(true);
    else if (c.t <= 0) miniEnd(false);
  }
  function miniHit(k) { if (G.mc && G.mc.m.k === k) G.mc.p++; }
  function miniEnd(win) {
    const el = $('g-mini');
    if (win) {
      const pts = 150 + 50 * Math.min(4, G.n > 900 ? 4 : Math.floor(G.n / 4)), coins = 8;
      G.score += pts; G.coins += coins; G.miniWon = (G.miniWon || 0) + 1; track('mini');
      el.classList.add('win'); el.querySelector('.mc-p').textContent = '✓';
      toast(`⚡ Mini challenge complete! +${pts} · +${coins} 🪙`, 'combo', 1600); snd('fanfare'); buzz([20, 30, 20]);
      floatText(G.nena.x, G.nena.y - 170, `+${pts}`, 'perfect');
    } else { el.classList.add('lose'); el.querySelector('.mc-p').textContent = '✗'; snd('pop'); }
    G.mc = null; G.miniT = 26 + rnd() * 14;
    setTimeout(() => { if (!G || G.mc) return; el.hidden = true; el.classList.remove('in', 'win', 'lose'); }, 1300);
  }
  // surprise events: blackout, Aunt Mahin, VIPs, the witches, Simba the thief
  function eventTick(dt) {
    const c = G.cfg, mod = c.mod || {};
    if (G.blackout) {
      G.blackout.t -= dt;
      const el = G.blackout.el;
      if (el.parentNode !== G.layers[G.view]) layer(G.view).appendChild(el);
      const [x, y] = G.nena.room === G.view ? [G.nena.x, G.nena.y - 70] : [-200, -200];
      el.style.background = `radial-gradient(circle at ${x.toFixed(0)}px ${y.toFixed(0)}px, rgba(10,8,24,0) 0, rgba(10,8,24,0) 95px, rgba(10,8,24,.9) 175px)`;
      if (G.blackout.t <= 0) { const hid = G.blackout.simba; el.remove(); G.blackout = null; toast('💡 The power is back!', '', 1200); if (hid && G.simba) { G.simba.el.classList.remove('lying'); emo(G.simba, ''); const h = HOMES.home.simba; walkActor(G.simba, h[1], h[2], () => { if (G) G.simbaTask = false; }, 120); } }
    }
    if (G.giftT != null) { G.giftT -= dt; if (G.giftT <= 0) { G.giftT = 45 + rnd() * 30; if (c.place === 'home' || c.place === 'clap') addReq(pick(['flowers', 'choco', 'jtext'])); } }
    if (G.evT == null) return;
    G.evT -= dt; if (G.evT > 0) return;
    G.evT = (mod.events || mod.blackout || c.events || 26) + rnd() * 10;
    const opts = [];
    if (c.place === 'home') { opts.push('blackout'); if (G.st.samovar && G.n >= 7) opts.push('aunt'); }
    if (c.place === 'street') opts.push('chase');
    if (c.place === 'clap') opts.push('vip', 'curse');
    if (mod.blackout) opts.length = 0, opts.push('blackout');
    const e = pick(opts); if (!e) return;
    if (e === 'blackout') {
      if (G.blackout) return;
      const el = document.createElement('div'); el.className = 'blackout';
      G.blackout = { t: 8, el };
      Object.keys(G.npcs).forEach((w) => { const a = G.npcs[w]; if (a.room === G.view && rnd() < 0.7) { emo(a, '😱', 2000); speak(a, pick(['Aaah!', 'Who turned off the lights?!', 'I can’t see anything!', 'Nena?!']), w.startsWith('witch') ? 'witch' : '', 1800, true); } });
      if (simbaIdle()) { const s = G.simba; G.simbaTask = true; walkActor(s, 250, 548, () => { if (!G || !G.simba) return; s.el.classList.add('lying'); emo(s, '😨', 7000); speak(s, '*hides behind the sofa*', 'dog', 2000); }, 170); G.blackout.simba = true; }
      setTimeout(() => G && !G.over && speak(G.nena, pick(['Don’t worry Simba, I’m here!', 'Where are the candles?!', 'Not again!']), '', 1800, true), 900);
      toast('⚡ Blackout in the tower! Baba: “Who touched the fuses?!”', 'bad', 2200); snd('fail');
    } else if (e === 'chase') {
      if (!G.simba || G.simbaAway || G.simbaTask || findReq('simba')) return;
      walkActor(G.simba, 540, 548, null, 160); addReq('chase');
    } else addReq(e);
  }
  // photo moments: when Simba does something cute, a camera appears next to him
  function photoTick(dt) {
    G.photoT = (G.photoT == null ? 6 : G.photoT) - dt;
    if (G.photo) { G.photo.t -= dt; if (G.photo.t <= 0) { G.photo.el.remove(); G.photo = null; } return; }
    if (G.photoT > 0 || !G.simba || G.simba.room !== G.view || G.simba.el.classList.contains('gone')) return;
    const cl = G.simba.el.classList;
    const cand = PHOTOS.filter((p) => !save.album[p.id] && ((p.cls && cl.contains(p.cls)) || (p.id === 'street' && G.simba.room === 'street') || (p.id === 'kids' && findReq('kids')) || (p.id === 'party' && G.n >= 14 && G.n <= 15) || (p.id === G.photoHint)));
    if (!cand.length) return;
    const ph = cand[0];
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'hit photo-btn'; b.dataset.photo = ph.id; b.innerHTML = '<span>📸</span>';
    b.style.left = Math.min(540, G.simba.x + 40) + 'px'; b.style.top = (G.simba.y - G.simba.h - 40) + 'px';
    layer(G.simba.room).appendChild(b);
    G.photo = { el: b, t: 4, id: ph.id }; G.photoT = 9;
    snd('pop');
  }
  function takePhoto() {
    if (!G.photo) return;
    const ph = PHOTOS.find((p) => p.id === G.photo.id);
    G.photo.el.remove(); G.photo = null; G.photoHint = null;
    save.album[ph.id] = 1; track('photo'); persist();
    const f = document.createElement('div'); f.className = 'flash'; $('stage-wrap').appendChild(f); setTimeout(() => f.remove(), 500);
    snd('coin'); toast(`📸 New photo for the album: ${ph.ico} ${ph.name}!`, 'combo', 1800);
  }
  function runTweens(dt) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      tw.t += dt / tw.dur;
      const k = Math.min(1, tw.t), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      place(tw.a, tw.x0 + (tw.x - tw.x0) * e, tw.y0 + (tw.y - tw.y0) * e);
      if (k >= 1) { tweens.splice(i, 1); if (tw.cb) tw.cb(); }
    }
  }
  function walkTo(p, dt, fast) {
    const speed = 390 * (G.fit ? 1.15 : 1) * (fast || 1) * (1 + 0.2 * up('shoes')) * (G.boostT > 0 ? 1.6 : 1) * (G.boosts.coffee ? 1.2 : 1);
    const dx = p[0] - G.nena.x, dy = p[1] - G.nena.y, d = Math.hypot(dx, dy);
    if (d < 6) { G.nena.el.classList.remove('walking'); return true; }
    G.nena.el.classList.add('walking');
    const step = Math.min(d, speed * dt);
    place(G.nena, G.nena.x + (dx / d) * step, G.nena.y + (dy / d) * step);
    G.nena.el.classList.toggle('flip', dx < 0);
    return false;
  }
  function enterRoom(room) {
    moveRoom(G.nena, room);
    const d = ROOMS[room].door;
    place(G.nena, d[0], d[1]);
    G.nena.el.classList.remove('gone');
    attachNenaOverlays();
    if (!G.peekAt || performance.now() - G.peekAt > 2500 || room === G.view) setView(room);
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!G || G.paused || G.over) return;
    if (G.intro) { runTweens(dt); talkTick(dt); return; }
    G.time -= dt;
    G.comboT -= dt;
    G.elapsed = G.elapsed || 0;
    if (G.comboT <= 0 && G.combo) G.combo = 0;
    // spawn requests
    G.spawnT -= dt;
    const maxReq = G.cfg.endless ? Math.min(6, 2 + Math.floor(G.elapsed / 30)) : Math.min(5, 2 + Math.floor(Math.min(G.n, 15) / 3));
    if (G.spawnT <= 0) {
      if (G.reqs.length < maxReq) spawn();
      const [a, b] = G.cfg.every;
      const k = (G.rushHour ? 0.7 : 1) * ((G.cfg.mod && G.cfg.mod.everyMul) || 1) * (G.cfg.endless ? Math.max(0.35, 1 - G.elapsed / 240) : 1);
      G.spawnT = (a + rnd() * (b - a)) * k;
    }
    if (G.cfg.fur) { G.furT -= dt; if (G.furT <= 0) { addFur(); G.furT = G.cfg.fur * (0.7 + rnd() * 0.6); } }
    // power-ups and events
    if (G.boostT > 0) { G.boostT -= dt; if (G.boostT <= 0) G.nena.el.classList.remove('boost'); }
    G.boneT -= dt;
    if (G.boneT <= 0 && !G.bone) { spawnBone(); G.boneT = 22 + rnd() * 12; }
    if (G.bone) { G.bone.t -= dt; G.bone.el.classList.toggle('fading', G.bone.t < 2); if (G.bone.t <= 0) { G.bone.el.remove(); G.bone = null; } }
    G.pkgT -= dt;
    if (G.pkgT <= 0 && !G.pkg) { spawnPackage(); G.pkgT = 32 + rnd() * 14; }
    if (G.pkg) { G.pkg.t -= dt; G.pkg.el.querySelector('i').style.width = (G.pkg.t / 10 * 100) + '%'; if (G.pkg.t <= 0) { G.pkg.el.remove(); G.pkg = null; G.queue = G.queue.filter((q) => q.id !== 'pkg'); markQueue(); } }
    G.zoomT -= dt;
    if (G.witchT != null) { G.witchT -= dt; if (G.witchT <= 0) { G.witchT = 22 + rnd() * 14; floatText(526, 410, pick(['🔮', '✨', '🧹', '🕯️']), 'hint', 'clap'); toast(pick(['The two blonde “witches” are staring at Nena… again.', 'Negin: “Don’t look at them. They’re casting spells.”', 'One of the witches laughs. Creepy.', 'Nena: “Are they ALWAYS here?”', 'The witches order their tenth tea. Nobody has ever seen them leave.']), '', 1800); } }
    if (G.zoomT <= 0) { zoomies(); if (G.zoomT <= 0) G.zoomT = (G.cfg.mod && G.cfg.mod.zoom) || 28 + rnd() * 12; }
    eventTick(dt);
    photoTick(dt);
    miniTick(dt);
    if (G.simba) { G.joyT = (G.joyT || 0) + dt; if (G.joyT > 6) { G.joyT = 0; joy(-1); } }
    if (G.cfg.endless) { G.elapsed += dt; G.time = 99999; }
    if (!G.cfg.endless && !G.rushHour && G.time <= 15) { G.rushHour = true; $('g-rush').hidden = false; toast('⏰ Rush hour! Points ×1.5', 'combo', 1800); snd('fanfare'); if (window.Sound) window.Sound.setIntensity(1); }
    if (G.time <= 5 && Math.ceil(G.time) !== G.lastTick) { G.lastTick = Math.ceil(G.time); snd('tick'); }
    if (up('robot') && G.furs.length) { G.robotT -= dt; if (G.robotT <= 0) { const f = G.furs.find((x) => !x.puddle) || G.furs[0]; f.el.remove(); G.furs = G.furs.filter((x) => x !== f); floatText(f.x, f.y - 20, '🤖', 'hint', 'salon'); G.robotT = 8; } }
    // patience
    if (G.freezeT > 0) G.freezeT -= dt;
    for (const r of G.reqs.slice()) {
      if (r.who === 'simba' && G.simbaAway) continue;
      if (G.freezeT <= 0) r.left -= dt;
      if (r.left <= 0) fail(r); else posReq(r);
      if (G.over) return;
    }
    runTweens(dt);
    // Nena: go to the next queued target (through doorways if it is in another room), then work
    if (!G.busy && G.queue.length) {
      const q = G.queue[0];
      const room = targetRoom(q.id), p = targetPoint(q.id, false);
      if (!p || !room || !G.layers[room]) { G.queue.shift(); markQueue(); }
      else if (room !== G.nena.room) {
        if (walkTo(ROOMS[G.nena.room].door, dt, 1.6)) {
          G.nena.el.classList.add('gone');
          G.busy = { t: 0, dur: 0.14, travel: true, done: () => enterRoom(room) };
        }
      } else if (walkTo(p, dt)) {
        G.queue.shift(); markQueue();
        const act = actionFor(q.id, q.r);
        if (!act) { /* nothing */ }
        else if (act.miss) { toast(act.miss, 'bad', 1300); snd('fail'); G.busy = { t: 0, dur: act.dur }; }
        else { G.busy = { t: 0, dur: act.dur, done: act.done, id: q.id, r: q.r }; if (act.snd) snd(act.snd); if (act.start) act.start(); if (act.dur > 0.5) { G.bar.hidden = false; G.nena.el.classList.add('working'); } }
      }
    }
    // safety net: never leave Nena stuck
    if (G.busy) {
      G.busy.age = (G.busy.age || 0) + dt;
      if ((G.busy.walking && G.busy.age > 12) || (!G.busy.walking && G.busy.age > G.busy.dur + 3)) {
        G.busy = null; G.bar.hidden = true; G.simbaAway = false; G.simbaTask = false;
        G.nena.el.classList.remove('gone', 'working', 'walking'); if (G.simba) G.simba.el.classList.remove('gone', 'walking');
      }
    } else if (G.nena.el.classList.contains('gone') && !G.intro) G.nena.el.classList.remove('gone');
    if (G.busy && !G.busy.walking) {
      G.busy.t += dt;
      G.bar.style.transform = `translate(${G.nena.x - 34}px, ${G.nena.y - G.nena.h - 26}px)`;
      G.bar.firstChild.style.width = Math.min(100, (G.busy.t / G.busy.dur) * 100) + '%';
      if (G.busy.t >= G.busy.dur) { const fn = G.busy.done; G.busy = null; G.bar.hidden = true; G.nena.el.classList.remove('working'); if (fn) fn(); }
    }
    if (!G.queue.length && !G.busy) G.nena.el.classList.remove('walking');
    G.handEl.style.transform = `translate(${G.nena.x + 14}px, ${G.nena.y - 74}px)`;
    G.handEl.style.zIndex = String(Math.round(G.nena.y) + 1);
    lifeTick(dt);
    ambientTick(dt);
    talkTick(dt);
    highlights();
    G.tabT = (G.tabT || 0) - dt; if (G.tabT <= 0) { G.tabT = 0.14; renderTabs(); updateChips(); }
    drawRoute();
    if (G.time <= 0) { G.time = 0; endLevel(false); }
    hud();
  }

  // Glow on whatever helps right now, so players always know where to tap.
  let lastNeed = '';
  function highlights() {
    const need = new Set();
    G.reqs.forEach((r) => { const id = nextStep(r); if (G.st[id]) need.add(id); });
    if (G.dishes) need.add('sink');
    const key = [...need].sort().join(',');
    if (key !== lastNeed) {
      lastNeed = key;
      stage().querySelectorAll('.hit.station').forEach((b) => b.classList.toggle('need', need.has(b.dataset.target)));
    }
    // first day: a pointing hand on the next useful thing
    const tutorial = G.n === 1 && G.done < 3 && !G.queue.length && !G.busy;
    G.tut.hidden = true;
    if (tutorial && G.reqs[0]) {
      const r = G.reqs[0];
      const id = nextStep(r);
      const room = targetRoom(id);
      if (room === G.view) {
        const p = targetPoint(id, true);
        if (p) { G.tut.hidden = false; G.tut.style.transform = `translate(${p[0] - 18}px, ${p[1] + 6}px)`; }
      }
    }
  }
  function objProgress() {
    const o = G.cfg.obj; if (!o) return { ok: false, txt: '' };
    const st = G.stats;
    switch (o.k) {
      case 'done': return { ok: G.done >= o.n, txt: `${Math.min(G.done, o.n)}/${o.n}` };
      case 'walk': return { ok: st.walk >= o.n, txt: `${Math.min(st.walk, o.n)}/${o.n}` };
      case 'type': { const v = st.type[o.t] || 0; return { ok: v >= o.n, txt: `${Math.min(v, o.n)}/${o.n}` }; }
      case 'tea': return { ok: st.tea >= o.n, txt: `${Math.min(st.tea, o.n)}/${o.n}` };
      case 'combo': return { ok: st.maxCombo >= o.n, txt: `best ×${st.maxCombo}` };
      case 'tips': return { ok: st.tips >= o.n, txt: `${Math.min(st.tips, o.n)}/${o.n}` };
      case 'treat': return { ok: st.treat >= 1, txt: st.treat ? '✓' : '0/1' };
      case 'nomiss': return { ok: G.failed === 0, live: true, txt: G.failed ? '✗' : 'so far ✓' };
      case 'clean': return { ok: G.furs.length + G.dishes === 0, live: true, txt: G.furs.length + G.dishes ? `${G.furs.length + G.dishes} mess left` : 'all clean ✓' };
      default: return { ok: false, txt: '' };
    }
  }
  function renderObj() {
    const o = G.cfg.obj, el = $('g-obj');
    if (!o) { el.hidden = true; return; }
    const pr = objProgress();
    el.hidden = false;
    el.classList.toggle('done', !!(G.objDone || (pr.ok && !pr.live)));
    el.classList.toggle('failed', o.k === 'nomiss' && G.failed > 0);
    el.innerHTML = `🏅 <span>${o.label}</span> <b>${pr.txt}</b>`;
  }
  function checkObj() {
    const pr = objProgress();
    if (!G.objDone && pr.ok && !pr.live) { G.objDone = true; toast('🏅 Bonus objective complete!', 'combo', 1500); snd('fanfare'); }
    renderObj();
  }
  function shake() { const w = $('stage-wrap'); w.classList.remove('shake'); void w.offsetWidth; w.classList.add('shake'); }
  function sparkle(x, y, room) {
    for (let i = 0; i < 8; i++) {
      const el = document.createElement('div');
      el.className = 'spark';
      el.style.left = x + 'px'; el.style.top = y + 'px';
      const a = (i / 8) * Math.PI * 2;
      el.style.setProperty('--dx', (Math.cos(a) * 46).toFixed(0) + 'px');
      el.style.setProperty('--dy', (Math.sin(a) * 46).toFixed(0) + 'px');
      layer(room).appendChild(el);
      setTimeout(() => el.remove(), 650);
    }
  }
  const hudCache = {};
  const put = (id, k, v, html) => { if (hudCache[id + k] === v) return; hudCache[id + k] = v; const e = $(id); if (k === 'text') e.textContent = v; else if (k === 'html') e.innerHTML = v; else if (k[0] === '.') e.classList.toggle(k.slice(1), v); else e.style[k] = v; };
  function hud() {
    const c = G.cfg;
    const t = Math.ceil(G.cfg.endless ? G.elapsed : G.time);
    put('g-time', 'text', `${G.cfg.endless ? '∞ ' : ''}${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`);
    put('g-time', '.low', !G.cfg.endless && G.time < 10);
    const frac = G.cfg.endless ? 1 : Math.max(0, G.time / (G.cfg.dur + (G.boosts.time ? 15 : 0)));
    put('g-tring', 'strokeDashoffset', (119.4 * (1 - frac)).toFixed(1));
    put('g-tring', '.low', !G.cfg.endless && G.time < 15);
    if (G.shownScore == null) G.shownScore = G.score;
    if (G.shownScore < G.score) { G.shownScore = Math.min(G.score, G.shownScore + Math.max(1, Math.ceil((G.score - G.shownScore) * 0.16))); }
    else G.shownScore = G.score;
    if (G.lastScore !== G.score) { if (G.lastScore != null && G.score > G.lastScore) { const sc = $('g-score'); sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump'); } G.lastScore = G.score; }
    put('g-score', 'text', String(G.shownScore));
    put('stage-wrap', '.fever', G.combo >= 5);
    if (!G.cfg.endless) { const tl = Math.ceil(G.time); if (tl <= 5 && tl > 0 && tl !== G.lastTick) { G.lastTick = tl; snd('tick'); haptic('tick'); const tm = $('g-time'); tm.classList.remove('bump'); void tm.offsetWidth; tm.classList.add('bump'); } }
    put('g-fill', 'width', Math.min(100, (G.score / c.targets[2]) * 100).toFixed(1) + '%');
    put('g-star1', '.on', G.score >= c.targets[0]); put('g-star2', '.on', G.score >= c.targets[1]); put('g-star3', '.on', G.score >= c.targets[2]);
    { const lost = performance.now() - (G.heartLost || 0) < 750; put('g-hearts', 'html', Array.from({ length: G.maxHearts }, (_, i) => `<i class="${i < G.hearts ? 'on' : lost && i === G.hearts ? 'lost' : ''}">♥</i>`).join('')); }
    put('g-combo', 'html', G.combo > 1 ? `🔥×${G.combo} <i style="width:${Math.round(Math.max(0, G.comboT / 6) * 20) * 5}%"></i>` : (G.boostT > 0 ? '⚡ Rush!' : G.freezeT > 0 ? '❄️ Freeze' : ''));
    const starsNow = G.score >= c.targets[2] ? 3 : G.score >= c.targets[1] ? 2 : G.score >= c.targets[0] ? 1 : 0;
    if (starsNow > G.starsShown) { G.starsShown = starsNow; snd('star', starsNow - 1); haptic('star'); announce('★'.repeat(starsNow), ['1st star!', '2nd star!', '3 stars! Perfect day!'][starsNow - 1], 'star'); const st = $('g-star' + starsNow); st.classList.remove('pop'); void st.offsetWidth; st.classList.add('pop'); }
    put('g-coins', 'text', String(save.coins + G.coins));
    put('g-joy', '.off', !G.simba);
    if (G.simba) { const j = Math.round(G.joy); put('g-joyb', 'width', j + '%'); put('g-joyf', 'text', j >= 75 ? '😄' : j >= 45 ? '🙂' : j >= 25 ? '😕' : '😢'); put('g-joy', '.low', j < 35); }
  }

  /* ------------------------------------------------------------------ */
  /* Feedback                                                            */
  /* ------------------------------------------------------------------ */
  function floatText(x, y, txt, kind, room) {
    const el = document.createElement('div');
    el.className = 'float ' + (kind || '');
    el.textContent = txt;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    layer(room || (G && G.nena ? G.nena.room : null)).appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }
  let toastT = 0;
  function toast(msg, kind, ms) {
    const el = $('toast');
    el.textContent = msg; el.className = 'toast show ' + (kind || '');
    clearTimeout(toastT);
    toastT = setTimeout(() => { el.className = 'toast'; }, ms || 2000);
  }

  /* ------------------------------------------------------------------ */
  /* End of level                                                        */
  /* ------------------------------------------------------------------ */
  function endLevel(lost) {
    if (G.over) return;
    G.over = true;
    cancelAnimationFrame(raf);
    const c = G.cfg;
    const mess = G.furs.length + G.dishes;
    const penalty = mess * 20;
    const final = Math.max(0, G.score - penalty);
    const stars = lost ? 0 : final >= c.targets[2] ? 3 : final >= c.targets[1] ? 2 : final >= c.targets[0] ? 1 : 0;
    const pr = objProgress();
    const objOk = !lost && stars > 0 && (G.objDone || pr.ok);
    const medalNew = objOk && !save.medals[G.n];
    if (objOk) save.medals[G.n] = 1;
    let earned = (lost ? Math.floor(G.coins / 2) : G.coins + Math.floor(final / 50) + stars * 10) + (medalNew ? 25 : 0);
    let extra = '';
    if (c.endless) {
      earned = G.coins + Math.floor(final / 40);
      const rec = final > save.endless; if (rec) save.endless = final;
      extra = `<li class="ok"><span>♾️ Lasted ${Math.floor(G.elapsed / 60)}:${String(Math.floor(G.elapsed % 60)).padStart(2, '0')}</span><b>${rec ? 'NEW RECORD!' : 'Best ' + save.endless}</b></li>`;
    } else if (c.challenge) {
      const first = !(save.chal.date === today() && save.chal.done);
      if (stars > 0 && first) { earned += 60 + stars * 15; save.chal = { date: today(), done: true }; track('challenge'); extra = `<li class="ok"><span>🎯 Daily challenge done!</span><b>+${60 + stars * 15} 🪙</b></li>`; }
    }
    if (G.simba && !lost && !c.endless) {
      const j = Math.round(G.joy), jb = Math.round(j / 5);
      earned += jb; save.friend.simba = (save.friend.simba || 0) + Math.round(j / 25);
      if (j >= 100) track('joy100');
      extra += `<li class="${j >= 45 ? 'ok' : 'ko'}"><span>🐶 Simba’s happiness ${j}% ${j >= 75 ? '😄' : j >= 45 ? '🙂' : '😕'}</span><b>+${jb} 🪙</b></li>`;
    }
    if (!lost && stars) { const evn = evGain(stars * 2 + Math.floor(G.done / 4)); if (evn) { const E = activeEvent(); extra += `<li class="ok"><span>${E.def.ico} ${E.def.name}</span><b>+${evn} ${E.def.tok}</b></li>`; } }
    if (G.golden && earned > 0) { extra += `<li class="ok"><span>✨ Golden hour</span><b>×2 · +${earned} 🪙</b></li>`; earned *= 2; }
    save.coins += earned;
    save.losses = save.losses || {};
    if (!c.endless && !c.challenge) save.losses[G.n] = stars > 0 ? 0 : (save.losses[G.n] || 0) + 1;
    if (!lost) { track('day'); if (stars === 3) track('perfect'); if (G.failed === 0) track('nohit'); }
    const ups = FRIENDS.filter((f) => friendLv(f.id) > (G.frStart[f.id] || 0));
    if (G.miniN) extra += `<li class="${G.miniWon ? 'ok' : 'ko'}"><span>⚡ Mini challenges</span><b>${G.miniWon}/${G.miniN}</b></li>`;
    ups.forEach((f) => { extra += `<li class="ok"><span>❤️ ${f.name}: ${FR_TITLES[friendLv(f.id)]}!</span><b>new scene</b></li>`; });
    G.pendingScene = null;
    const ch = !c.endless && !c.challenge && chapterOf(G.n);
    if (stars > 0 && ch && ch.to === G.n && !save.chapters[ch.title]) { save.chapters[ch.title] = 1; G.pendingScene = ch; extra += `<li class="ok"><span>📖 ${ch.title} complete!</span><b>▶</b></li>`; }
    let chips = '';
    if (!lost) { const xp = 20 + 10 * stars; gainXP(xp); chips += `<span class="rc">⭐ +${xp} XP · Lv ${save.plv}<i class="xpbar"><i style="width:${Math.round(save.xp / xpNeed(save.plv) * 100)}%"></i></i></span>`; }
    if (stars === 3 && !c.endless) { save.wheel.extra = (save.wheel.extra || 0) + 1; chips += '<span class="rc">🎡 +1 spin</span>'; }
    if (stars > 0 && !c.endless) { const got = dropStickers(stars === 3 ? 2 : 1); chips += `<span class="rc">🎴 ${got.map((g) => `<i class="stk mini${g.dup ? ' dup' : ''}">${g.ico}</i>`).join('')}</span>`; }
    $('r-rewards').innerHTML = chips; $('r-rewards').hidden = !chips;
    if (stars > 0 && !c.endless && !c.challenge) {
      save.stars[G.n] = Math.max(save.stars[G.n] || 0, stars);
      save.best[G.n] = Math.max(save.best[G.n] || 0, final);
      if (G.n === save.level) save.level = G.n + 1;
    }
    persist();
    $('r-title').textContent = lost ? 'Too many upset faces…' : stars ? ['', 'Day done!', 'Great day!', 'Perfect day!'][stars] : 'Not quite…';
    $('r-stars').innerHTML = [0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}">★</span>`).join('');
    $('r-lines').innerHTML = `<li><span>Requests done</span><b>${G.done}</b></li><li><span>Missed</span><b>${G.failed}</b></li>${mess ? `<li><span>Mess left (${mess})</span><b>−${penalty}</b></li>` : ''}${c.obj ? `<li class="${objOk ? 'ok' : 'ko'}"><span>🏅 ${c.obj.label}</span><b>${objOk ? (medalNew ? '+25 🪙' : '✓') : '✗'}</b></li>` : ''}<li class="total"><span>Score</span><b>${final}</b></li><li><span>Coins earned</span><b>+${earned} 🪙</b></li>${extra}`;
    const nxt = !lost && stars && !c.endless && !c.challenge && G.n < LEVELS.length ? levelCfg(G.n + 1) : null;
    const fresh = nxt ? nxt.types.filter((t) => !c.types.includes(t)).map((t) => REQ[t].icon) : [];
    $('r-tease').innerHTML = nxt ? `<b>Tomorrow · ${nxt.title}</b>${fresh.length ? `<span>New: ${fresh.join(' ')}</span>` : `<span>${{ home: '🏠 At home', street: '🌳 Out in Tehran', clap: '🏮 At CLAP' }[nxt.place]}</span>`}` : '';
    $('r-tease').hidden = !nxt;
    if (!lost && stars && !c.endless && !c.challenge) renderMyst(G.n); else $('r-myst').hidden = true;
    $('r-sub').textContent = lost ? 'The family lost patience. Try again, and watch the rings!' : stars ? `Goal: ${c.targets[0]} · ${c.targets[1]} · ${c.targets[2]}` : `You needed ${c.targets[0]} points for 1 star.`;
    $('r-next').hidden = !stars || !!c.endless || !!c.challenge;
    $('r-title').textContent = c.endless ? 'Endless day over!' : $('r-title').textContent;
    $('r-portrait').innerHTML = A.portrait(stars >= 2 ? 'nena' : stars ? 'nena' : 'nena', stars >= 2 ? 'happy' : stars ? 'neutral' : 'sad');
    $('screen-result').hidden = false;
    const tot = document.querySelector('#r-lines li.total b');
    if (tot) { const goal = final, t0 = performance.now(); const step = (t) => { const k = Math.min(1, (t - t0) / 900); tot.textContent = Math.round(goal * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
    snd(stars ? 'win' : 'lose');
    if (window.Sound) window.Sound.setIntensity(0);
    for (let i = 0; i < stars; i++) setTimeout(() => snd('star', i), 450 + i * 220);
    if (stars === 3) confetti();
    checkAch();
  }

  function confetti() {
    const box = $('confetti'); box.innerHTML = '';
    const cols = ['#ef8fb0', '#ffd98a', '#e38c30', '#7fe0b4', '#86aaff', '#ffffff'];
    for (let i = 0; i < 46; i++) { const c = document.createElement('i'); c.style.left = (rnd() * 100) + '%'; c.style.background = cols[i % cols.length]; c.style.animationDelay = (rnd() * 0.5) + 's'; c.style.setProperty('--r', (rnd() * 720 - 360) + 'deg'); box.appendChild(c); }
    setTimeout(() => { box.innerHTML = ''; }, 3000);
  }

  /* ------------------------------------------------------------------ */
  /* Meta game: daily reward, challenge, missions, trophies, family,     */
  /* decor, wardrobe, photo album, endless, chapters, Color Sort         */
  /* ------------------------------------------------------------------ */
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const dayNum = (s) => Math.floor(new Date((s || today()) + 'T12:00:00').getTime() / 86400000);
  const weekNum = () => Math.floor((dayNum() + 3) / 7);
  function seeded(seed) { let s = (seed >>> 0) || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }

  const CHAPTERS = [
    { from: 1, to: 5, title: 'Chapter 1 · A week with Simba', end: [['nasim', 'neutral', '(whispering on the phone) …no, they don’t know. Not yet.'], ['nena', 'surprised', 'Nasim? Who was that?'], ['nasim', 'angry', 'NOBODY. Mind your own business!'], ['nena', 'neutral', 'Hmm… my little sister has a secret.']] },
    { from: 6, to: 9, title: 'Chapter 2 · Out in Tehran', end: [['negin', 'surprised', 'Nena… the witches left a note on our table.'], ['nena', 'neutral', '“The orange lion will bring you luck.” …Simba?!'], ['simba', 'happy', '*proud woof*'], ['negin', 'sleepy', 'Creepy. Let’s go home. I need a nap.']] },
    { from: 10, to: 13, title: 'Chapter 3 · Secrets', end: [['pourya', 'happy', 'Nena! I made a hookah head shaped like Simba. NOW can I have your Instagram?'], ['nena', 'happy', '…Okay. Fine. It’s @nena.and.simba.'], ['pourya', 'surprised', 'REALLY?! Best. Day. Ever.'], ['negin', 'sleepy', 'Finally. Can we go home now?']] },
    { from: 14, to: 15, title: 'Chapter 4 · The big day', end: [['nasim', 'happy', 'Okay… my secret: I adopted a kitten. She arrives tomorrow.'], ['mohsen', 'surprised', 'A CAT?! In MY house?!'], ['simba', 'sad', '…woof?'], ['nena', 'happy', 'Oh no. To be continued…']] },
  ];
  const chapterOf = (n) => CHAPTERS.find((c) => n >= c.from && n <= c.to);

  const FRIENDS = [
    { id: 'simba', name: 'Simba', pic: 'simba' }, { id: 'baba', name: 'Baba', pic: 'mohsen' }, { id: 'fariba', name: 'Maman', pic: 'fariba' },
    { id: 'nasim', name: 'Nasim', pic: 'nasim' }, { id: 'negin', name: 'Negin', pic: 'negin' }, { id: 'pourya', name: 'Pourya', pic: 'pourya' },
  ];
  const FR_OF = { simba: 'simba', kids: 'simba', baba: 'baba', fariba: 'fariba', car: 'fariba', nasim: 'nasim', negin: 'negin', hookah: 'negin', table: 'negin', pourya: 'pourya' };
  const FR_LV = [0, 8, 22, 42, 70];
  const friendLv = (id) => FR_LV.filter((t) => (save.friend[id] || 0) >= t).length - 1;
  const FR_TITLES = ['Stranger', 'Friend', 'Good friend', 'Close friend', 'Best friend'];
  const SCENES = {
    simba: [[['simba', 'happy', '*brings Nena his favourite sock*'], ['nena', 'happy', 'For me? Thank you, Simba!']], [['simba', 'happy', '*sleeps on Nena’s feet*'], ['nena', 'happy', 'My little lion heater.']], [['nena', 'neutral', 'Bad day…'], ['simba', 'happy', '*puts his big head on her lap*'], ['nena', 'happy', '…okay, better day.']], [['nena', 'happy', 'You know you’re my best friend, right?'], ['simba', 'happy', 'WOOF! (Obviously.)']]],
    baba: [[['mohsen', 'happy', 'Nena jan, your tea is the best in Tehran.'], ['nena', 'happy', 'It’s the same samovar, Baba!']], [['mohsen', 'neutral', 'When you were small, you fell asleep on my belly too. Like Simba.']], [['mohsen', 'happy', 'I only call so much because I love you girls.'], ['nena', 'happy', 'We know, Baba. Maybe call a little less?']], [['mohsen', 'happy', 'Here. The keys of the white 4×4. It’s yours now.'], ['nena', 'surprised', 'BABA?!']]],
    fariba: [[['fariba', 'happy', 'Taste this, azizam. Too much salt?'], ['nena', 'happy', 'Perfect, Maman!']], [['fariba', 'happy', 'Let me teach you my tahdig secret. Don’t tell Nasim.']], [['fariba', 'neutral', 'You do so much for this family, Nena. I see it.']], [['fariba', 'happy', 'This is my mother’s recipe book. Now it’s yours.'], ['nena', 'happy', 'Maman… thank you.']]],
    nasim: [[['nasim', 'angry', 'What. …Fine. Thanks for the juice.']], [['nasim', 'neutral', 'You can borrow my hoodie. ONCE.']], [['nasim', 'happy', 'Okay, you’re not the worst sister.'], ['nena', 'happy', 'Wow. High praise.']], [['nasim', 'happy', 'You’ll be the first to meet my kitten. Promise.'], ['nena', 'surprised', 'Your WHAT?']]],
    negin: [[['negin', 'sleepy', 'Thanks for waking me up. I guess.']], [['negin', 'happy', 'CLAP is more fun with you, Nena.']], [['negin', 'happy', 'I’ll walk Simba tomorrow. For real this time.'], ['nena', 'neutral', 'I’ll believe it when I see it.']], [['negin', 'happy', 'You’re my favourite person. Don’t tell Nasim.'], ['nena', 'happy', 'Your secret is safe. Go back to sleep.']]],
    pourya: [[['pourya', 'happy', 'Your hookah is always the best one, Nena. I make it special.']], [['pourya', 'neutral', 'Maybe… your phone number then? No? Okay.']], [['pourya', 'happy', 'I named a new flavour after you: “Nena Mint”.']], [['pourya', 'happy', 'Free hookah for you and Negin. Forever.'], ['negin', 'happy', 'I LOVE you, Pourya!']]],
  };

  const PHOTOS = [
    { id: 'nap', name: 'Nap time', cls: 'lying', ico: '💤' }, { id: 'spin', name: 'Tail chaser', cls: 'spin', ico: '🌀' },
    { id: 'sniff', name: 'Detective Simba', cls: 'sniff', ico: '🔍' }, { id: 'bark', name: 'Big bark', cls: 'barking', ico: '📣' },
    { id: 'zoom', name: 'Zoomies!', cls: 'zoom', ico: '💨' }, { id: 'cuddle', name: 'Baba’s lion', cls: 'cuddle', ico: '🦁' },
    { id: 'bath', name: 'Bubble bath', cls: 'bath', ico: '🫧' }, { id: 'street', name: 'Tehran walk', ico: '🌳' },
    { id: 'kids', name: 'Fan club', ico: '🧒' }, { id: 'thief', name: 'Sangak thief', ico: '🫓' },
    { id: 'blankie', name: 'Blankie love', ico: '🧸' }, { id: 'party', name: 'Birthday boy', ico: '🎂' },
  ];

  const ACH = [
    { id: 'first', icon: '🌅', name: 'First morning', desc: 'Finish your first day', test: (t) => (t.day || 0) >= 1, r: 20 },
    { id: 'star3', icon: '⭐', name: 'Perfect day', desc: 'Get 3 stars on a day', test: (t) => (t.perfect || 0) >= 1, r: 30 },
    { id: 'combo8', icon: '⚡', name: 'Chai master', desc: 'Reach a ×8 combo', test: (t) => (t.combo8 || 0) >= 1, r: 50 },
    { id: 'walk25', icon: '🦮', name: 'Dog walker', desc: 'Walk Simba 25 times', test: (t) => (t.req_walk || 0) >= 25, r: 50 },
    { id: 'req200', icon: '💪', name: 'Super sister', desc: 'Complete 200 requests', test: (t) => (t.req || 0) >= 200, r: 80 },
    { id: 'insta10', icon: '📵', name: 'Still no Instagram', desc: 'Turn Pourya down 10 times', test: (t) => (t.req_insta || 0) >= 10, r: 60 },
    { id: 'nohit', icon: '🛡️', name: 'Untouchable', desc: 'Finish a day without losing a heart', test: (t) => (t.nohit || 0) >= 1, r: 50 },
    { id: 'ch2', icon: '📖', name: 'Out in Tehran', desc: 'Finish chapter 2', test: () => save.level > 9, r: 60 },
    { id: 'boss', icon: '💍', name: 'Wedding planner', desc: 'Beat Cousin Sara’s wedding', test: () => (save.stars[15] || 0) > 0, r: 150 },
    { id: 'decor3', icon: '🛋️', name: 'Interior designer', desc: 'Buy 3 decorations', test: () => Object.keys(save.decor).length >= 3, r: 60 },
    { id: 'album', icon: '📸', name: 'Simba paparazzi', desc: 'Fill the photo album', test: () => Object.keys(save.album).length >= PHOTOS.length, r: 150 },
    { id: 'bff', icon: '❤️', name: 'Best friends', desc: 'Max friendship with someone', test: () => FRIENDS.some((f) => friendLv(f.id) >= 4), r: 100 },
    { id: 'endless', icon: '♾️', name: 'Never-ending day', desc: 'Score 3000 in Endless', test: () => save.endless >= 3000, r: 100 },
    { id: 'streak7', icon: '🎁', name: 'Loyal', desc: 'Claim 7 daily rewards in a row', test: () => save.daily.streak >= 7, r: 100 },
    { id: 'sort3', icon: '🧪', name: 'Colour genius', desc: 'Solve all 3 Color Sorts in a day', test: (t) => (t.sort3 || 0) >= 1, r: 60 },
    { id: 'admirer', icon: '💐', name: 'Leave me alone, Jesus!', desc: 'Turn Jesus down 5 times', test: (t) => (t.gift || 0) >= 5, r: 60 },
    { id: 'nails', icon: '💅', name: 'Nail day', desc: 'Have your nails done with Leila', test: (t) => (t.nails || 0) >= 1, r: 30 },
    { id: 'mini10', icon: '⚡', name: 'Challenge accepted', desc: 'Win 10 mini challenges', test: (t) => (t.mini || 0) >= 10, r: 70 },
    { id: 'joy100', icon: '🐶', name: 'Happiest dog', desc: 'End a day with Simba 100% happy', test: (t) => (t.joy100 || 0) >= 1, r: 80 },
    { id: 'tricks8', icon: '🎓', name: 'Good boy!', desc: 'Simba does 8 tricks in a row', test: () => (save.games.tricksBest || 0) >= 8, r: 70 },
    { id: 'tahdig', icon: '🍚', name: 'Tahdig queen', desc: 'Score 13+ in Tahdig master', test: () => (save.games.tahdigBest || 0) >= 13, r: 70 },
    { id: 'zen7', icon: '🧘', name: 'Inner peace', desc: 'Meditate on 7 different days', test: (t) => (t.zen || 0) >= 7, r: 100 },
    { id: 'tree', icon: '🌳', name: 'Tree hugger', desc: 'Hug a tree for good energy', test: (t) => (t.tree || 0) >= 1, r: 40 },
    { id: 'hair3', icon: '💇‍♀️', name: 'Salon Maman', desc: '3 stars in Hair day', test: () => (save.games.hairBest || 0) >= 3, r: 60 },
    { id: 'journey', icon: '🗺️', name: 'Full journey', desc: 'Complete a 30-minute daily journey', test: (t) => (t.journey || 0) >= 1, r: 80 },
    { id: 'lv10', icon: '⭐', name: 'Level 10', desc: 'Reach player level 10', test: () => save.plv >= 10, r: 100 },
    { id: 'set1', icon: '🎴', name: 'Collector', desc: 'Complete a sticker set', test: (t) => (t.set || 0) >= 1, r: 80 },
    { id: 'detective', icon: '🕵️‍♀️', name: 'Detective Nena', desc: 'Guess 5 mysteries right', test: (t) => (t.mystery || 0) >= 5, r: 100 },
    { id: 'festival', icon: '🎉', name: 'Festival queen', desc: 'Complete a Persian festival track', test: (t) => (t.eventDone || 0) >= 1, r: 150 },
    { id: 'clock12', icon: '🕐', name: 'Around the clock', desc: 'Live hourly moments at 12 different hours', test: () => Object.keys(save.momHours || {}).length >= 12, r: 120 },
    { id: 'life10', icon: '🏠', name: 'Real life', desc: 'Do 10 daily chores (breakfast, groceries, laundry)', test: (t) => (t.breakfast || 0) + (t.grocery || 0) + (t.laundry || 0) >= 10, r: 100 },
    { id: 'bed7', icon: '🌙', name: 'Only in her arms', desc: 'Rock Simba to sleep on 7 nights', test: (t) => (t.bed || 0) >= 7, r: 100 },
    { id: 'gym5', icon: '🏋️', name: 'Gym sisters', desc: 'Train 5 times with Negin', test: (t) => (t.gym || 0) >= 5, r: 80 },
    { id: 'cuddle10', icon: '🦁', name: 'Baba’s lion', desc: 'Put Simba on Baba’s belly 10 times', test: (t) => (t.req_cuddle || 0) >= 10, r: 60 },
  ];
  const MISSIONS = [
    { k: 'req_walk', n: 12, label: 'Walk Simba 12 times', r: 80 }, { k: 'req_tea', n: 12, label: 'Serve Baba 12 teas', r: 80 },
    { k: 'req_insta', n: 5, label: 'Turn Pourya down 5 times', r: 90 }, { k: 'perfect', n: 3, label: 'Get 3 stars on 3 days', r: 120 },
    { k: 'sort', n: 6, label: 'Solve 6 Color Sorts', r: 100 }, { k: 'req_phone', n: 8, label: 'Answer Baba 8 times', r: 90 },
    { k: 'req', n: 80, label: 'Complete 80 requests', r: 150 }, { k: 'combo5', n: 5, label: 'Reach a ×5 combo 5 times', r: 120 },
    { k: 'photo', n: 2, label: 'Take 2 Simba photos', r: 100 }, { k: 'req_bread', n: 5, label: 'Buy 5 sangak breads', r: 80 },
    { k: 'gift', n: 3, label: 'Turn Jesus down 3 times', r: 90 },
    { k: 'mini', n: 6, label: 'Win 6 mini challenges', r: 100 },
    { k: 'pet', n: 15, label: 'Pet Simba 15 times', r: 80 },
    { k: 'challenge', n: 2, label: 'Finish 2 daily challenges', r: 150 }, { k: 'req_cuddle', n: 4, label: 'Put Simba on Baba’s belly 4 times', r: 90 },
  ];
  const DAILY = [20, 30, 40, 50, 60, 80, 150];
  const CHAL = [
    { id: 'zoomies', name: 'Zoomies day', desc: 'Simba gets the zoomies every 10 seconds!', base: 7, mod: { zoom: 10 } },
    { id: 'calls', name: 'Baba calls all day', desc: 'Baba phones Nena again and again.', base: 8, mod: { addTypes: ['phone'] } },
    { id: 'rush', name: 'Rush day', desc: 'Requests come twice as fast, but everyone is patient.', base: 5, mod: { everyMul: 0.55, patienceMul: 1.25 } },
    { id: 'blackout', name: 'Power cuts', desc: 'The power keeps going out in the tower.', base: 8, mod: { blackout: 15 } },
    { id: 'vipnight', name: 'VIP night at CLAP', desc: 'VIPs everywhere, and the witches are restless.', base: 13, mod: { events: 9 } },
    { id: 'glass', name: 'Glass heart', desc: 'Only 2 hearts, but every point counts double.', base: 10, mod: { hearts: 2, ptsMul: 2 } },
    { id: 'busy', name: 'Busy Tehran', desc: 'The street is packed and Simba is a thief.', base: 12, mod: { everyMul: 0.75, events: 11 } },
  ];
  const todayChal = () => CHAL[dayNum() % CHAL.length];

  // decorations: drawn into the rooms, each one makes the family a little more patient
  const DECOR = [
    { id: 'chandelier', room: 'salon', name: 'Crystal chandelier', icon: '💎', cost: 180, svg: '<path d="M300 0 v34" stroke="#c9a24a" stroke-width="3"/><ellipse cx="300" cy="40" rx="46" ry="9" fill="#e0c27a"/>' + [-36, -18, 0, 18, 36].map((d, i) => `<path d="M${300 + d} 44 v${18 + (i % 2) * 10}" stroke="#d9eef7" stroke-width="2"/><path d="M${300 + d} ${62 + (i % 2) * 10} l-5 9 l5 9 l5 -9z" fill="#e8f6ff" stroke="#9fc4da"/>`).join('') + '<circle cx="300" cy="60" r="70" fill="url(#rglow)" opacity=".7"/>' },
    { id: 'goldbed', room: 'salon', name: 'Golden Simba bed', icon: '👑', cost: 150, svg: '<ellipse cx="330" cy="606" rx="80" ry="25" fill="#c9a24a"/><ellipse cx="330" cy="600" rx="64" ry="17" fill="#2f3f8f"/><path d="M302 572 l8 -14 l8 10 l12 -16 l12 16 l8 -10 l8 14z" fill="#f2c230" stroke="#c9952a"/>' },
    { id: 'monstera', room: 'salon', name: 'Giant monstera', icon: '🌿', cost: 90, svg: '<path d="M30 640 h50 l-6 46 h-38z" fill="#e9e1d4"/>' + [[55, 560, -30], [40, 590, -60], [70, 585, 20], [60, 535, 5], [85, 610, 40]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="30" ry="16" fill="#3f7a3a" transform="rotate(${r} ${x} ${y})"/><path d="M${x - 20} ${y} h40" stroke="#2c5a2a" stroke-width="2" transform="rotate(${r} ${x} ${y})"/>`).join('') },
    { id: 'silkrug', room: 'salon', name: 'Silk Persian rug', icon: '🧶', cost: 160, svg: '<ellipse cx="320" cy="625" rx="200" ry="66" fill="#7a1c2c"/><ellipse cx="320" cy="625" rx="184" ry="56" fill="none" stroke="#e0c27a" stroke-width="5"/><ellipse cx="320" cy="625" rx="150" ry="42" fill="none" stroke="#1f2a5a" stroke-width="8"/><ellipse cx="320" cy="625" rx="60" ry="20" fill="#e0c27a"/><ellipse cx="320" cy="625" rx="34" ry="11" fill="#1f2a5a"/>' + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<circle cx="${320 + Math.cos(i * 0.785) * 110}" cy="${625 + Math.sin(i * 0.785) * 32}" r="6" fill="#e0c27a"/>`).join('') },
    { id: 'miniature', room: 'salon', name: 'Persian miniature painting', icon: '🖼️', cost: 120, svg: '<rect x="520" y="70" width="70" height="90" fill="#c9a24a"/><rect x="526" y="76" width="58" height="78" fill="#f3e2b8"/><circle cx="555" cy="100" r="12" fill="#2f6b3e"/><path d="M536 146 q19 -30 38 0z" fill="#8c1f30"/><path d="M546 120 q9 -10 18 0" stroke="#1f2a5a" stroke-width="3" fill="none"/>' },
    { id: 'tulips', room: 'kitchen', name: 'Tulip vase', icon: '🌷', cost: 70, svg: '<path d="M412 538 h20 l-3 -26 h-14z" fill="#d9eef7" opacity=".9"/>' + [[408, 480, '#e2433a'], [422, 470, '#ef6fa3'], [436, 482, '#f2c230']].map(([x, y, c]) => `<path d="M422 512 Q${x} ${y + 20} ${x} ${y + 8}" stroke="#3f7a3a" stroke-width="2.5" fill="none"/><path d="M${x - 6} ${y + 8} q6 -16 12 0 q-6 6 -12 0z" fill="${c}"/>`).join('') },
    { id: 'espresso', room: 'kitchen', name: 'Espresso machine', icon: '☕', cost: 110, svg: '<rect x="414" y="236" width="40" height="46" rx="5" fill="#b8bec4"/><rect x="418" y="242" width="32" height="14" rx="3" fill="#2a2a2e"/><rect x="428" y="262" width="12" height="8" fill="#555"/><rect x="426" y="272" width="16" height="10" rx="2" fill="#fff"/>' },
    { id: 'aquarium', room: 'tv', name: 'Aquarium', icon: '🐠', cost: 140, svg: '<rect x="488" y="248" width="94" height="52" rx="4" fill="#7ec8e3" opacity=".85" stroke="#9aa2a8" stroke-width="3"/><path d="M500 300 q10 -14 20 0 M540 300 q8 -20 16 0" stroke="#3f7a3a" stroke-width="3" fill="none"/><path d="M510 268 q8 -6 14 0 q-6 6 -14 0z M524 268 l6 -4 v8z" fill="#f08a24"/><path d="M550 282 q8 -6 14 0 q-6 6 -14 0z M564 282 l6 -4 v8z" fill="#f2c230"/><circle cx="570" cy="260" r="3" fill="#fff" opacity=".7"/>' },
    { id: 'ambilight', room: 'tv', name: 'TV ambilight', icon: '🌈', cost: 100, svg: '<ellipse cx="445" cy="171" rx="160" ry="110" fill="#7a5cff" opacity=".18"/><ellipse cx="445" cy="171" rx="140" ry="92" fill="#3fd0ff" opacity=".16"/>' },
    { id: 'neon', room: 'bedroom', name: 'Neon sign “Nena ♥ Simba”', icon: '💡', cost: 130, svg: '<text x="155" y="372" text-anchor="middle" font-size="26" font-family="Fredoka, sans-serif" font-weight="700" fill="#ffd1e6" stroke="#ff5fa2" stroke-width="2">Nena ♥ Simba</text><ellipse cx="155" cy="362" rx="120" ry="30" fill="url(#rneon)"/>' },
    { id: 'canopy', room: 'bedroom', name: 'Bed canopy', icon: '🎀', cost: 120, svg: '<path d="M30 330 q125 -60 250 0 l-10 260 q-115 30 -230 0z" fill="#fff" opacity=".28"/><path d="M30 330 q125 -60 250 0" stroke="#f3c6d5" stroke-width="6" fill="none"/>' },
    { id: 'vanity', room: 'bedroom', name: 'Hollywood mirror lights', icon: '✨', cost: 90, svg: [...Array(10)].map((_, i) => `<circle cx="${505 + Math.cos(i * 0.628) * 64}" cy="${190 + Math.sin(i * 0.628) * 64}" r="6" fill="#fff6c4"/><circle cx="${505 + Math.cos(i * 0.628) * 64}" cy="${190 + Math.sin(i * 0.628) * 64}" r="14" fill="url(#rglow)"/>`).join('') },
    { id: 'gallery', room: 'hall', name: 'Family photo gallery', icon: '📷', cost: 80, svg: [[146, 330, '#f3c6d5'], [284, 340, '#bfe0f0'], [418, 330, '#f6e1b0']].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="26" height="34" fill="#6b4632"/><rect x="${x + 3}" y="${y + 3}" width="20" height="28" fill="${c}"/><circle cx="${x + 13}" cy="${y + 14}" r="5" fill="#c9496f" opacity=".6"/>`).join('') },
  ];
  const cozy = () => Object.keys(save.decor).length;
  const OUTFIT_SHOP = [
    { id: 'basique', name: 'Everyday stripes', cost: 0 }, { id: 'sweat', name: 'Lilac sweater', cost: 60 }, { id: 'denim', name: 'Denim day', cost: 80 },
    { id: 'rose', name: 'Rose top', cost: 90 }, { id: 'cire', name: 'Yellow raincoat', cost: 100 }, { id: 'robe', name: 'Sunny dress', cost: 120 },
    { id: 'persian', name: 'Persian green', cost: 140 }, { id: 'night', name: 'CLAP night out', cost: 160 }, { id: 'zen', name: 'Zen linen', cost: 0, reward: true },
    { id: 'yalda', name: 'Yalda red', cost: 0, reward: 'Yalda event' }, { id: 'souri', name: 'Souri sparks', cost: 0, reward: 'Souri event' }, { id: 'nowruz', name: 'Nowruz spring', cost: 0, reward: 'Nowruz event' },
  ];
  const COLLAR_SHOP = [
    { id: null, name: 'No collar', cost: 0 }, { id: 'rouge', name: 'Red collar', cost: 40 }, { id: 'bandana', name: 'Pink bandana', cost: 60 },
    { id: 'noeud', name: 'Blue bow', cost: 60 }, { id: 'green', name: 'Green bandana', cost: 70 }, { id: 'pinkbow', name: 'Pink bow', cost: 70 }, { id: 'gold', name: 'Golden collar', cost: 150 },
  ];

  // progress tracking (missions, trophies)
  function track(k, n) {
    save.tot[k] = (save.tot[k] || 0) + (n || 1);
    if (save.week.id === weekNum() && weekMissions().some((m) => m.k === k)) save.week.prog[k] = (save.week.prog[k] || 0) + (n || 1);
    checkAch();
  }
  function weekMissions() {
    if (save.week.id !== weekNum()) save.week = { id: weekNum(), prog: {}, claimed: [] };
    const r = seeded(weekNum() * 31 + 7), pool = MISSIONS.slice(), out = [];
    while (out.length < 3) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    return out;
  }
  let achQueue = [];
  function checkAch() {
    ACH.forEach((a) => {
      if (save.ach[a.id] || !a.test(save.tot)) return;
      save.ach[a.id] = 1; save.coins += a.r; achQueue.push(a);
    });
    persist();
    if (achQueue.length) { const a = achQueue.shift(); toast(`🏆 Trophy: ${a.icon} ${a.name} · +${a.r} 🪙`, 'combo', 2200); snd('fanfare'); if (achQueue.length) setTimeout(checkAch, 2300); }
  }
  function addFriend(who, perfect) {
    const id = FR_OF[who]; if (!id) return;
    save.friend[id] = (save.friend[id] || 0) + (perfect ? 2 : 1);
  }
  const dailyReady = () => save.daily.last !== today();
  const sortLeft = () => (save.sortd.date === today() ? 3 - save.sortd.done.filter(Boolean).length : 3);
  const chalReady = () => save.chal.date !== today() || !save.chal.done;
  const missionsReady = () => (!save.dq.claimed && dailyQuests().every((q) => dqProg(q) >= q.n)) || weekMissions().some((m, i) => !save.week.claimed[i] && (save.week.prog[m.k] || 0) >= m.n);
  const scenesNew = () => FRIENDS.some((f) => { for (let l = 1; l <= friendLv(f.id); l++) if (!save.scenes[f.id + l]) return true; return false; });

  /* ---- hub on the map ---- */
  const UNLOCKS = [
    ['today', 1, '📅', 'Nena’s day', 'Her real-life routine on the real clock: breakfast, groceries, laundry…'],
    ['gift', 1, '🐾', 'Simba’s surprise', 'A new gift every hour. They pile up while you’re away (up to 3) — no rush!'],
    ['moment', 1, '🕐', 'Hourly moments', 'Every hour, something new happens in the house. Come and live it!'],
    ['daily', 1, '🎁', 'Daily reward', 'Come back every day — big gift on day 7.'],
    ['missions', 1, '📋', 'Quests', 'Three new quests every day, plus weekly missions.'],
    ['family', 2, '❤️', 'Family', 'Grow your friendship with everyone and unlock little scenes.'],
    ['sort', 2, '🧪', 'Color Sort', 'Three new glass puzzles every day.'],
    ['wheel', 2, '🎡', 'Lucky wheel', 'Spin for coins, free boosters and stickers.'],
    ['stickers', 2, '🎴', 'Sticker album', 'Collect stickers and complete sets.'],
    ['bed', 2, '🌙', 'Bedtime', 'Simba only falls asleep in Nena’s arms.'],
    ['event', 2, '🎉', 'Persian festivals', 'Yalda, Chaharshanbe Souri and Nowruz: decorations, activities and exclusive rewards.'],
    ['golden', 2, '✨', 'Golden hours', 'At 13:00 and 20:00, every day pays double coins for an hour.'],
    ['challenge', 3, '🎯', 'Daily challenge', 'A special day with a twist, every day.'],
    ['zen', 3, '🧘', 'Meditation', 'Light the oud and breathe — everyone is calmer.'],
    ['album', 3, '📸', 'Photo album', 'Snap Simba’s funniest moments.'],
    ['trophies', 3, '🏆', 'Trophies', 'Big goals with big rewards.'],
    ['decor', 4, '🛋️', 'Decor', 'Make the house cosy — everyone gets more patient.'],
    ['wardrobe', 4, '👗', 'Wardrobe', 'New outfits for Nena.'],
    ['gym', 4, '🏋️', 'Gym', 'Every other day with Negin and Coach Shadi.'],
    ['nails', 5, '💅', 'Nail day', 'Once a week with Nasim and Negin.'],
    ['games', 5, '🎮', 'Mini-games', 'Simba’s tricks, tahdig, hair day and more.'],
    ['endless', 7, '♾️', 'Endless day', 'How long can Nena keep up?'],
  ];
  const UL = Object.fromEntries(UNLOCKS.map((u) => [u[0], u]));
  const daysDone = () => Math.max(save.level - 1, Object.keys(save.stars).length);
  const unlocked = (id) => !UL[id] || daysDone() >= UL[id][1];
  if (!save.unlocks) { save.unlocks = {}; UNLOCKS.forEach((u) => { if (daysDone() >= u[1]) save.unlocks[u[0]] = 1; }); }
  save.newF = save.newF || {};
  function checkUnlocks() {
    const fresh = UNLOCKS.filter((u) => daysDone() >= u[1] && !save.unlocks[u[0]]);
    if (!fresh.length) return false;
    fresh.forEach((u) => { save.unlocks[u[0]] = 1; save.newF[u[0]] = 1; }); persist();
    $('ul-list').innerHTML = fresh.map((u, i) => `<div class="ul-row" style="animation-delay:${0.15 + i * 0.12}s"><span class="ul-i">${u[2]}</span><span class="ul-t"><b>${u[3]}</b><small>${u[4]}</small></span></div>`).join('');
    $('ul-title').textContent = fresh.length > 1 ? `${fresh.length} new things unlocked!` : 'New unlocked!';
    $('unlock').hidden = false; snd('fanfare'); buzz([20, 40, 20]); confettiOn($('unlock'));
    return true;
  }
  function renderHub() {
    const items = [
      ...(unlocked('event') ? [(() => { const E = activeEvent(), nx = eventList()[0]; return E ? ['event', E.def.ico, E.def.name.replace('Chaharshanbe ', '').replace('Shab-e ', ''), evState() && evState().act !== today() ? '!' : ''] : ['event', '🎉', EVENTS[nx.id].name.replace('Chaharshanbe ', '').replace('Shab-e ', ''), daysTo(nx.start) + 'd']; })()] : []),
      ['gift', '🐾', 'Surprise', giftState().n > 0 ? String(giftState().n) : giftMin() + 'm'], ['today', '📅', 'Today', routineNow() || ''], ['daily', '🎁', 'Daily', dailyReady() ? '!' : ''], ['sort', '🧪', 'Color Sort', sortLeft() || ''], ['challenge', '🎯', 'Challenge', chalReady() ? '!' : ''],
      ['missions', '📋', 'Quests', missionsReady() ? '!' : ''], ['family', '❤️', 'Family', scenesNew() ? 'new' : ''], ['decor', '🛋️', 'Decor', ''],
      ['nails', '💅', 'Nail day', nailsReady() ? '!' : ''], ['wardrobe', '👗', 'Wardrobe', ''], ['album', '📸', 'Album', `${Object.keys(save.album).length}/${PHOTOS.length}`], ['trophies', '🏆', 'Trophies', `${Object.keys(save.ach).length}/${ACH.length}`],
      ['wheel', '🎡', 'Wheel', spinsLeft() || ''], ['stickers', '🎴', 'Stickers', `${Object.keys(save.stickers).length}/${STICKERS.length}`], ['bed', '🌙', 'Bedtime', new Date().getHours() >= 18 && save.wellness.bed !== today() ? '!' : ''], ['gym', '🏋️', 'Gym', gymDay() && save.wellness.gym !== today() ? '!' : ''], ['zen', '🧘', 'Zen', save.wellness.zen !== today() ? '!' : ''], ['games', '🎮', 'Games', ''], ['endless', '♾️', 'Endless', ''], ['settings', '⚙️', 'Settings', ''],
    ];
    $('m-journey').hidden = daysDone() < 1; if (daysDone() >= 1) renderJourney();
    const vis = items.filter(([id]) => unlocked(id)).map(([id, ico, name, b]) => [id, ico, name, b === '' && save.newF[id] ? 'new' : b]);
    const next = UNLOCKS.find((u) => !unlocked(u[0]));
    if (next) vis.push(['locked', '🔒', next[3], 'Soon']);
    $('m-hub').innerHTML = vis.map(([id, ico, name, b]) => `<button type="button" class="hub-btn${id === 'locked' ? ' locked' : ''}" data-hub="${id}"><span class="hub-i">${ico}</span><span class="hub-n">${name}</span>${b !== '' ? `<em class="${/^(\d+\/\d+|Soon|\d+m|\d+d)$/.test(String(b)) ? 'soft' : ''}">${b}</em>` : ''}</button>`).join('');
  }
  let dailyShown = false;

  /* ---- generic sheet ---- */
  let sheetKind = '';
  function openSheet(kind) {
    if (kind === 'zen') { openZen(); return; }
    if (kind === 'wheel') { openWheel(); return; }
    if (kind === 'gym') { openGym(); return; }
    if (kind === 'bed') { openBed(); return; }
    if (kind === 'gift') { openGift(); return; }
    if (kind === 'breakfast' || kind === 'grocery' || kind === 'laundry') { openLife(kind); return; }
    if (kind === 'nails') { startNailDay(); return; }
    sheetKind = kind;
    const T = { event: '🎉 Persian festivals', today: '📅 Nena’s day', stickers: '🎴 Sticker album', games: '🎮 Mini-games', settings: '⚙️ Settings', daily: '🎁 Daily reward', sort: '🧪 Daily Color Sort', challenge: '🎯 Daily challenge', missions: '📋 Quests', family: '❤️ Family', decor: '🛋️ Decorate the flat', wardrobe: '👗 Wardrobe', album: '📸 Photo album', trophies: '🏆 Trophies', endless: '♾️ Endless day' };
    $('sh2-title').textContent = T[kind] || '';
    $('sh2-coins').textContent = save.coins;
    $('sh2-body').innerHTML = SHEETS[kind]();
    show('screen-sheet');
  }
  const bar = (v, n) => `<span class="pbar"><i style="width:${Math.min(100, (v / n) * 100)}%"></i></span>`;
  const SHEETS = {
    event: () => {
      const E = activeEvent(), s = evState();
      let h = '';
      if (E) {
        const tok = s ? s.tok : 0, max = EV_MS[EV_MS.length - 1][0];
        h += `<div class="ev-card ev-${E.id}"><span class="ev-big">${E.def.ico}</span><b>${E.def.name}${E.preview ? ' · preview' : ''}</b><small>${E.def.desc}</small>${E.preview ? '' : `<small>${daysTo(E.end)} day(s) left</small>`}</div>`;
        if (!E.preview) h += `<div class="ev-track"><div class="ev-bar"><i style="width:${Math.min(100, tok / max * 100)}%"></i></div><p class="ev-tok">${tok} ${E.def.tok} collected</p>${EV_MS.map(([n, k, v], i) => { const ok = tok >= n, got = s.got[i]; const lab = k === 'coins' ? `${v} 🪙` : k === 'sticker' ? `${v} stickers 🎴` : `Outfit: ${OUTFIT_SHOP.find((o) => o.id === E.def.outfit).name} 👗`; return `<div class="row-card${got ? ' done' : ''}"><span class="rc-i">${E.def.tok}</span><span class="rc-t"><b>${n} ${E.def.tok}</b><small>${lab}</small></span>${got ? '<b class="ok">✓</b>' : `<button type="button" class="btn ${ok ? 'btn-primary' : ''}" data-act="ev-claim" data-i="${i}" ${ok ? '' : 'disabled'}>Claim</button>`}</div>`; }).join('')}</div>`;
        h += `<button type="button" class="btn btn-primary btn-big" data-act="ev-act">${E.def.act[0]} Today’s activity: ${E.def.act[2]}${s && s.act === today() ? ' ✓' : ''}</button><p class="sh-lede small">Win days during the festival to collect ${E.def.tokName} (more stars, more ${E.def.tok}).</p>`;
      } else h += '<p class="sh-lede">No festival right now — here is what’s coming. Each one brings decorations in the house, a special activity and exclusive rewards.</p>';
      h += '<h4 class="sh-h">📅 Calendar</h4>' + eventList().map((w) => { const D = EVENTS[w.id], on = new Date() >= w.start; return `<div class="row-card"><span class="rc-i">${D.ico}</span><span class="rc-t"><b>${D.name}</b><small>${w.start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${addD(w.end, -1).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${on ? 'now!' : 'in ' + daysTo(w.start) + ' days'}</small><small>${D.desc}</small></span><button type="button" class="btn" data-act="ev-preview" data-id="${w.id}">👀 Preview</button></div>`; }).join('');
      if (EV_PREVIEW) h += '<button type="button" class="btn" data-act="ev-stop">Stop preview</button>';
      return h;
    },
    today: () => {
      const w = weather(), h = new Date().getHours(), P = dayPhase();
      return `<div class="now-card ${P.k}"><span class="now-ico">${P.ico}</span><span class="now-t"><b>${P.hello}</b><small>${persianDate()} · ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} in Tehran</small><small>${w.ico} ${w.temp}°C · ${w.name}</small></span></div><p class="sh-lede">${w.tip}</p><h4 class="sh-h">🗓️ Nena’s routine</h4>`
        + routine().map((r) => { const done = r.done(), now = h >= r.win[0] && h < r.win[1]; return `<div class="row-card today-row${done ? ' done' : ''}${now && !done ? ' now' : ''}"><span class="rc-i">${r.ico}</span><span class="rc-t"><b>${r.name}</b><small>${String(r.win[0]).padStart(2, '0')}:00–${String(r.win[1] % 24).padStart(2, '0')}:00${now && !done ? ` · <em>now${LIFE[r.k] ? ' — on-time bonus ×1.5' : ''}</em>` : ''}</small><small>${r.desc}</small></span>${done ? '<b class="ok">✓</b>' : `<button type="button" class="btn ${now ? 'btn-primary' : ''}" data-act="routine" data-k="${r.k}">Go</button>`}</div>`; }).join('')
        + '<p class="sh-lede small">The routine follows your real clock. Everything can be done any time, but chores done on time pay more.</p>';
    },
    stickers: () => `<p class="sh-lede">Win stickers by finishing days (2 for a perfect day) and on the wheel. Complete a set for a big reward!</p>` + STICKER_SETS.map((set) => { const own = set.items.filter((it) => save.stickers[it[0]]).length; return `<h4 class="sh-h">${set.ico} ${set.name} <small>${own}/${set.items.length}${save.sets[set.id] ? ' · ✓ +100 🪙' : ' · reward 100 🪙'}</small></h4><div class="stk-grid">${set.items.map(([id, ico, name]) => save.stickers[id] ? `<div class="stk${save.stickers[id] > 1 ? ' many' : ''}"><i>${ico}</i><small>${name}</small>${save.stickers[id] > 1 ? `<em>×${save.stickers[id]}</em>` : ''}</div>` : '<div class="stk locked"><i>?</i><small>???</small></div>').join('')}</div>`; }).join(''),
    games: () => {
      const g = save.games, card = (act, ico, name, desc, best, daily) => `<div class="row-card game-card"><span class="rc-i">${ico}</span><span class="rc-t"><b>${name}</b><small>${desc}</small><small class="best">${best}${daily ? ' · <em>daily bonus +20 🪙</em>' : ''}</small></span><button type="button" class="btn btn-primary" data-act="${act}">Play</button></div>`;
      return card('play-tricks', '🐾', 'Simba’s tricks', 'Watch Simba’s tricks, then repeat them in the same order.', `Best: ${g.tricksBest || 0} tricks`, g.tricksDay !== today())
        + card('play-tahdig', '🍚', 'Tahdig master', 'Flip Maman’s tahdig at the perfect moment for a golden crust.', `Best: ${g.tahdigBest || 0}/15`, g.tahdigDay !== today())
        + card('play-zen', '🧘', 'Meditation', 'Light the oud and breathe with Nena. Gives a Zen bonus for today.', save.wellness.zen === today() ? 'Done today ✓' : 'Not done today', save.wellness.zen !== today())
        + card('play-hair', '💇‍♀️', 'Hair day with Maman', 'After her shower, Maman dries Nena’s hair. Don’t burn her!', `Best: ${save.games.hairBest || 0}★`, save.wellness.hair !== today())
        + card('go-sort', '🧪', 'Color Sort', 'Three new glass puzzles every day.', `${sortLeft()} left today`, false)
        + card('go-nails', '💅', 'Nail day', 'Leila comes once a week.', nailsReady() ? 'Available now!' : 'Done this week', false);
    },
    settings: () => {
      const row = (k, ico, name, desc, on) => `<div class="row-card"><span class="rc-i">${ico}</span><span class="rc-t"><b>${name}</b><small>${desc}</small></span><button type="button" class="switch${on ? ' on' : ''}" data-act="set" data-k="${k}" aria-pressed="${on}"><i></i></button></div>`;
      return row('sound', '🔊', 'Sound effects', 'Clicks, barks, fanfares', save.sound !== false)
        + row('music', '🎵', 'Music', 'Soft background music', save.music !== false)
        + row('vibe', '📳', 'Vibration', 'Little buzzes on your phone', save.vibe !== false)
        + row('hints', '💡', 'Tutorial hints', 'Explain new tasks the first time', save.hints !== false)
        + `<button type="button" class="btn" data-act="howto">❓ How to play</button><button type="button" class="btn" data-act="reset-hints">↺ Show all tutorial hints again</button>`;
    },
    daily: () => {
      const streak = save.daily.last === today() ? save.daily.streak : (save.daily.last === dayKey(-1) ? save.daily.streak + 1 : 1);
      const idx = (streak - 1) % 7;
      const shown = dailyReady() ? streak - 1 : streak;
      return `<p class="sh-lede">Come back every day! Current streak: <b>${shown} day${shown === 1 ? '' : 's'}</b></p>
        <div class="daily">${DAILY.map((c, i) => `<div class="day${i < idx || (!dailyReady() && i === idx) ? ' got' : ''}${i === idx && dailyReady() ? ' now' : ''}"><small>Day ${i + 1}</small><b>${i === 6 ? '🎁' : '🪙'}</b><span>+${c}</span></div>`).join('')}</div>
        ${dailyReady() ? '<button type="button" class="btn btn-primary btn-big" data-act="claim-daily">Claim +' + DAILY[idx] + ' 🪙</button>' : '<p class="sh-done">✓ Claimed today. See you tomorrow!</p>'}`;
    },
    sort: () => {
      if (save.sortd.date !== today()) save.sortd = { date: today(), done: [] };
      return `<p class="sh-lede">Three new glasses puzzles every day. Pour the sherbet until each glass holds a single colour.</p>
        ${window.ColorSort.LEVELS.map((L, i) => { const done = save.sortd.done[i], locked = i > 0 && !save.sortd.done[i - 1]; return `<div class="row-card${done ? ' done' : ''}"><span class="rc-i">${['🟢', '🟡', '🔴'][i]}</span><span class="rc-t"><b>${L.name}</b><small>${L.colors} colours · +${L.reward} 🪙</small></span>${done ? '<b class="ok">✓</b>' : `<button type="button" class="btn ${locked ? '' : 'btn-primary'}" data-act="sort" data-i="${i}" ${locked ? 'disabled' : ''}>${locked ? '🔒' : 'Play'}</button>`}</div>`; }).join('')}`;
    },
    challenge: () => {
      const c = todayChal(), done = save.chal.date === today() && save.chal.done;
      return `<div class="chal"><span class="chal-i">🎯</span><h3>${c.name}</h3><p>${c.desc}</p><small>Get at least 1 star · reward 60 🪙 + 15 per star</small></div>
        <button type="button" class="btn btn-primary btn-big" data-act="challenge">${done ? 'Play again (no reward)' : 'Start the challenge'}</button>${done ? '<p class="sh-done">✓ Done today!</p>' : ''}`;
    },
    missions: () => { const Q = dailyQuests(), dq = save.dq; return `<h4 class="sh-h">☀️ Today’s quests</h4>` + Q.map((q) => { const v = Math.min(q.n, dqProg(q)); return `<div class="row-card${v >= q.n ? ' done' : ''}"><span class="rc-i">${q.ico}</span><span class="rc-t"><b>${q.label}</b>${bar(v, q.n)}<small>${v}/${q.n}</small></span>${v >= q.n ? '<b class="ok">✓</b>' : ''}</div>`; }).join('')
      + (dq.claimed ? '<p class="sh-done">✓ Daily chest opened. New quests tomorrow!</p>' : `<button type="button" class="btn ${Q.every((q) => dqProg(q) >= q.n) ? 'btn-primary' : ''} btn-big" data-act="dq-claim" ${Q.every((q) => dqProg(q) >= q.n) ? '' : 'disabled'}>🎁 Daily chest · 60 🪙 + 🎡 spin</button>`)
      + '<h4 class="sh-h">📅 This week</h4>' + weekMissions().map((m, i) => { const v = save.week.prog[m.k] || 0, ok = v >= m.n, got = save.week.claimed[i]; return `<div class="row-card${got ? ' done' : ''}"><span class="rc-i">📋</span><span class="rc-t"><b>${m.label}</b>${bar(v, m.n)}<small>${Math.min(v, m.n)}/${m.n} · +${m.r} 🪙</small></span>${got ? '<b class="ok">✓</b>' : `<button type="button" class="btn ${ok ? 'btn-primary' : ''}" data-act="claim-mission" data-i="${i}" ${ok ? '' : 'disabled'}>Claim</button>`}</div>`; }).join(''); },
    missionsOld: () => `<p class="sh-lede">New missions every week.</p>` + weekMissions().map((m, i) => { const v = save.week.prog[m.k] || 0, ok = v >= m.n, got = save.week.claimed[i]; return `<div class="row-card${got ? ' done' : ''}"><span class="rc-i">📋</span><span class="rc-t"><b>${m.label}</b>${bar(v, m.n)}<small>${Math.min(v, m.n)}/${m.n} · +${m.r} 🪙</small></span>${got ? '<b class="ok">✓</b>' : `<button type="button" class="btn ${ok ? 'btn-primary' : ''}" data-act="claim-mission" data-i="${i}" ${ok ? '' : 'disabled'}>Claim</button>`}</div>`; }).join(''),
    family: () => FRIENDS.map((f) => {
      const lv = friendLv(f.id), pts = save.friend[f.id] || 0, next = FR_LV[lv + 1];
      const scenes = [1, 2, 3, 4].map((l) => `<button type="button" class="scene-b${l <= lv ? '' : ' locked'}${l <= lv && !save.scenes[f.id + l] ? ' new' : ''}" data-act="scene" data-f="${f.id}" data-l="${l}" ${l <= lv ? '' : 'disabled'}>${l <= lv ? '▶' : '🔒'} ${l}</button>`).join('');
      return `<div class="fam"><span class="fam-p">${A.portrait(f.pic, 'happy')}</span><span class="fam-t"><b>${f.name} <small>${FR_TITLES[lv]}</small></b><span class="hearts-s">${'❤️'.repeat(lv)}${'🤍'.repeat(4 - lv)}</span>${next ? bar(pts - FR_LV[lv], next - FR_LV[lv]) : '<small>Max friendship!</small>'}<span class="scenes">${scenes}</span></span></div>`;
    }).join('') + '<p class="sh-lede small">Help someone to grow your friendship. Each level unlocks a little scene and makes them a bit more patient.</p>',
    decor: () => ['salon', 'kitchen', 'tv', 'hall', 'bedroom'].map((room) => `<h4 class="sh-h">${ROOMS[room].icon} ${ROOMS[room].name}</h4>` + DECOR.filter((d) => d.room === room).map((d) => { const own = save.decor[d.id]; return `<div class="row-card${own ? ' done' : ''}"><span class="rc-i">${d.icon}</span><span class="rc-t"><b>${d.name}</b><small>+1% patience for everyone</small></span>${own ? '<b class="ok">✓</b>' : `<button type="button" class="btn btn-primary" data-act="buy-decor" data-id="${d.id}" ${save.coins < d.cost ? 'disabled' : ''}>${d.cost} 🪙</button>`}</div>`; }).join('')).join(''),
    wardrobe: () => `<h4 class="sh-h">Nena’s outfits</h4><div class="wardrobe">${OUTFIT_SHOP.map((o) => { const own = save.owned[o.id], on = save.outfit === o.id; return `<button type="button" class="ward${on ? ' on' : ''}" data-act="outfit" data-id="${o.id}" ${!own && (o.reward || save.coins < o.cost) ? 'disabled' : ''}><span class="ward-p">${A.nena({ dressed: true, outfit: o.id, eyes: 'open' })}</span><small>${o.name}</small><b>${on ? 'Wearing' : own ? 'Wear' : o.reward ? (o.reward === true ? '🔒 30-min journey' : '🔒 ' + o.reward) : o.cost + ' 🪙'}</b></button>`; }).join('')}</div>
      <h4 class="sh-h">Simba’s collars</h4><div class="wardrobe">${COLLAR_SHOP.map((o) => { const k = 'c_' + o.id, own = o.cost === 0 || save.owned[k], on = save.collar === o.id; return `<button type="button" class="ward dog${on ? ' on' : ''}" data-act="collar" data-id="${o.id}" ${!own && save.coins < o.cost ? 'disabled' : ''}><span class="ward-p">${A.simba({ collar: o.id, eyes: 'open' })}</span><small>${o.name}</small><b>${on ? 'Wearing' : own ? 'Wear' : o.cost + ' 🪙'}</b></button>`; }).join('')}</div>`,
    album: () => `<p class="sh-lede">When Simba does something cute, a 📸 appears next to him. Tap it fast!</p><div class="album">${PHOTOS.map((p) => save.album[p.id] ? `<div class="photo"><span class="ph-pic ${p.cls || ''}">${A.simba({ collar: save.collar, eyes: p.cls === 'lying' ? 'closed' : 'open' })}<em>${p.ico}</em></span><small>${p.name}</small></div>` : '<div class="photo locked"><span class="ph-pic">?</span><small>???</small></div>').join('')}</div>`,
    trophies: () => `<div class="trophies">${ACH.map((a) => `<div class="troph${save.ach[a.id] ? ' got' : ''}"><span>${save.ach[a.id] ? a.icon : '🔒'}</span><b>${a.name}</b><small>${a.desc}</small><em>+${a.r} 🪙</em></div>`).join('')}</div>`,
    endless: () => `<div class="chal"><span class="chal-i">♾️</span><h3>Endless day</h3><p>The day never ends… and it gets busier and busier. How long can Nena keep up?</p><small>Best score: <b>${save.endless}</b></small></div><button type="button" class="btn btn-primary btn-big" data-act="endless">Start</button>`,
  };
  const dayKey = (off) => { const d = new Date(); d.setDate(d.getDate() + off); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function sheetAction(e) {
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act;
    snd('click');
    if (act === 'play-tricks') { openTricks(); return; }
    if (act === 'play-zen') { openZen(); return; }
    if (act === 'ev-act') { openEventAct(); return; }
    if (act === 'ev-claim') { evClaim(+b.dataset.i); openSheet('event'); return; }
    if (act === 'ev-preview') { EV_PREVIEW = b.dataset.id; toast(`👀 Preview: ${EVENTS[EV_PREVIEW].name} decorations are on (until you stop it)`, '', 2000); openSheet('event'); return; }
    if (act === 'ev-stop') { EV_PREVIEW = null; openSheet('event'); return; }
    if (act === 'routine') { const r = routine().find((x) => x.k === b.dataset.k); if (r) r.go(); return; }
    if (act === 'play-hair') { openHair(); return; }
    if (act === 'play-tahdig') { openTahdig(); return; }
    if (act === 'go-sort') { openSheet('sort'); return; }
    if (act === 'go-nails') { startNailDay(); return; }
    if (act === 'dq-claim') { save.dq.claimed = true; save.coins += 60; save.wheel.extra = (save.wheel.extra || 0) + 1; persist(); snd('fanfare'); confetti(); toast('🎁 Daily chest: +60 🪙 and a wheel spin!', 'combo', 2000); openSheet('missions'); return; }
    if (act === 'stk-close') { openSheet('stickers'); return; }
    if (act === 'set') { const k = b.dataset.k; save[k] = save[k] === false; persist(); wake(); $('p-sound').textContent = save.sound !== false ? 'Sound: on' : 'Sound: off'; }
    else if (act === 'howto') { showHowTo(); return; }
    else if (act === 'reset-hints') { const keep = save.seen._rooms; save.seen = {}; if (!keep) delete save.seen._rooms; persist(); toast('💡 Hints will show again', '', 1300); }
    else if (act === 'claim-daily') {
      const streak = save.daily.last === dayKey(-1) ? save.daily.streak + 1 : 1;
      const gain = DAILY[(streak - 1) % 7];
      save.daily = { last: today(), streak }; save.coins += gain; persist(); snd('coin'); confetti(); toast(`🎁 +${gain} coins! Streak: ${streak} day${streak > 1 ? 's' : ''}`, 'combo', 1800); checkAch();
    } else if (act === 'sort') { startSort(+b.dataset.i); return; }
    else if (act === 'challenge') { const c = todayChal(); playCustom(challengeCfg(c)); return; }
    else if (act === 'endless') { playCustom(endlessCfg()); return; }
    else if (act === 'claim-mission') { const i = +b.dataset.i, m = weekMissions()[i]; save.week.claimed[i] = true; save.coins += m.r; persist(); snd('coin'); toast(`📋 Mission complete! +${m.r} 🪙`, 'combo', 1600); }
    else if (act === 'scene') { const f = b.dataset.f, l = +b.dataset.l; save.scenes[f + l] = 1; persist(); playScene(SCENES[f][l - 1], `${FRIENDS.find((x) => x.id === f).name} · ${FR_TITLES[l]}`, () => openSheet('family')); return; }
    else if (act === 'buy-decor') { const d = DECOR.find((x) => x.id === b.dataset.id); if (save.coins < d.cost) return; save.coins -= d.cost; save.decor[d.id] = 1; persist(); snd('coin'); toast(`${d.icon} ${d.name} added to the ${ROOMS[d.room].name.toLowerCase()}!`, 'hint', 1800); checkAch(); }
    else if (act === 'outfit') { const o = OUTFIT_SHOP.find((x) => x.id === b.dataset.id); if (!save.owned[o.id]) { if (o.reward) return; if (save.coins < o.cost) return; save.coins -= o.cost; save.owned[o.id] = 1; snd('coin'); } save.outfit = o.id; persist(); }
    else if (act === 'collar') { const id = b.dataset.id === 'null' ? null : b.dataset.id; const o = COLLAR_SHOP.find((x) => String(x.id) === String(id)); const k = 'c_' + o.id; if (o.cost && !save.owned[k]) { if (save.coins < o.cost) return; save.coins -= o.cost; save.owned[k] = 1; snd('coin'); } save.collar = id; persist(); }
    openSheet(sheetKind);
  }

  /* ---- weekly nail day with Leila ---- */
  const POLISH = [['#e2433a', 'Cherry red'], ['#c9496f', 'Raspberry'], ['#ef8fb0', 'Baby pink'], ['#f6c3c9', 'Nude rose'], ['#f08a24', 'Saffron'], ['#f2c230', 'Gold'],
    ['#3fa34d', 'Pistachio'], ['#1fb5a8', 'Turquoise'], ['#3b7dd8', 'Persian blue'], ['#8e4fc2', 'Lilac'], ['#5a1a2e', 'Wine'], ['#1c1a24', 'Black']];
  const FINISH = [['glossy', '✨ Glossy'], ['glitter', '🌟 Glitter'], ['hearts', '💗 Hearts'], ['french', '🤍 French']];
  const NAIL_GIRLS = [['nena', 'Nena'], ['nasim', 'Nasim'], ['negin', 'Negin']];
  const nailsReady = () => save.nails.week !== weekNum();
  const nailOf = (who) => (save.nails[who] && save.nails[who].c) || null;
  let ND = null;
  function startNailDay() {
    const fresh = nailsReady();
    const intro = fresh ? [['leila', 'happy', 'Salam girls! It’s nail day! I brought all my colours 💅'], ['nasim', 'neutral', 'Me first. Obviously.'], ['negin', 'sleepy', 'Can I get my nails done lying down?'], ['nena', 'happy', 'Yay! Let’s choose our colours!']]
      : [['leila', 'happy', 'Back already? Your nails still look perfect! See you next week 💅']];
    playScene(intro, '💅 Nail day', () => {
      ND = { i: 0, picks: {}, fresh };
      NAIL_GIRLS.forEach(([id]) => { ND.picks[id] = save.nails[id] ? Object.assign({}, save.nails[id]) : { c: null, f: 'glossy' }; });
      show('screen-nails'); renderNails();
      nailSay('leila', fresh ? 'Pick a colour, then a finish. Who’s first?' : 'Want to try new colours? Just for fun!');
    });
  }
  function nailSay(who, txt) {
    const el = $('na-say'); el.textContent = txt; el.className = 'say na-say' + (who === 'leila' ? ' leila' : ''); void el.offsetWidth; el.classList.add('pop');
    snd('talk', who === 'leila' ? 700 : PITCH[who] || 600);
  }
  function renderNails() {
    const [id, name] = NAIL_GIRLS[ND.i], pk = ND.picks[id];
    $('na-girls').innerHTML = NAIL_GIRLS.map(([g, n], k) => `<button type="button" class="na-girl${k === ND.i ? ' on' : ''}${ND.picks[g].c ? ' done' : ''}" data-girl="${k}"><span>${A.portrait(g, 'happy')}</span><b>${n}</b>${ND.picks[g].c ? `<i style="background:${ND.picks[g].c}"></i>` : ''}</button>`).join('');
    $('na-who').innerHTML = `<span class="na-pic">${A.portrait(id, 'happy')}</span><b>${name}’s nails</b>`;
    $('na-hand').classList.remove('final');
    $('na-hand').innerHTML = A.hand(id, pk.c, pk.f);
    $('na-leila').innerHTML = A.person('leila', { mood: 'happy', nails: '#ef8fb0' });
    $('na-pal').innerHTML = POLISH.map(([c, n]) => `<button type="button" class="bottle${pk.c === c ? ' on' : ''}" data-c="${c}" aria-label="${n}"><i style="background:${c}"></i><small>${n}</small></button>`).join('');
    $('na-fin').innerHTML = FINISH.map(([f, n]) => `<button type="button" class="fin${pk.f === f ? ' on' : ''}" data-f="${f}">${n}</button>`).join('');
    const last = ND.i === NAIL_GIRLS.length - 1;
    $('na-done').textContent = last ? 'All done! 💅' : `Next: ${NAIL_GIRLS[ND.i + 1][1]} ›`;
    $('na-done').disabled = !pk.c;
  }
  const NAIL_TALK = {
    nena: (c) => (['#e2433a', '#c9496f', '#ef8fb0', '#f6c3c9'].includes(c) ? pick(['Jesus will love it… I mean, I love it! 🙈', 'So romantic! 💗']) : pick(['Ooh, so pretty!', 'Simba, don’t lick them!', 'Perfect for CLAP tonight!'])),
    nasim: (c) => (['#1c1a24', '#5a1a2e', '#8e4fc2', '#e2433a'].includes(c) ? pick(['Perfect. Dark, like my soul.', 'Finally, a colour with attitude.']) : pick(['Ugh… fine. But only because Leila insists.', 'Pink? Seriously? …Okay, it’s cute.'])),
    negin: () => pick(['Pretty… zzz…', 'Can it dry while I nap?', 'Ooh, Instagram-worthy! 📸', 'Take a photo for my story!']),
  };
  function nailsClick(e) {
    const [id] = NAIL_GIRLS[ND.i], pk = ND.picks[id];
    const g = e.target.closest('[data-girl]'); if (g) { ND.i = +g.dataset.girl; snd('tab'); renderNails(); nailSay('leila', `${NAIL_GIRLS[ND.i][1]}, your turn! 💅`); return; }
    const b = e.target.closest('[data-c]');
    if (b) { pk.c = b.dataset.c; snd('water'); renderNails(); $('na-hand').classList.remove('painting'); void $('na-hand').offsetWidth; $('na-hand').classList.add('painting'); nailSay(id, NAIL_TALK[id](pk.c)); return; }
    const f = e.target.closest('[data-f]');
    if (f) { pk.f = f.dataset.f; snd('pop'); renderNails(); nailSay('leila', { glossy: 'Classic and shiny ✨', glitter: 'Glitter! Very CLAP night 🌟', hearts: 'Little hearts… for someone special? 😉', french: 'So elegant. Very Paris!' }[pk.f]); }
  }
  function nailsNext() {
    if (ND.i < NAIL_GIRLS.length - 1) { ND.i++; snd('tab'); renderNails(); nailSay('leila', `Next! ${NAIL_GIRLS[ND.i][1]}, sit down 💅`); return; }
    NAIL_GIRLS.forEach(([g]) => { save.nails[g] = ND.picks[g]; });
    let txt = 'Beautiful! See you next week, girls!';
    if (ND.fresh) { save.nails.week = weekNum(); save.coins += 50; ['nasim', 'negin'].forEach((g) => { save.friend[g] = (save.friend[g] || 0) + 3; }); track('nails'); txt = 'Beautiful! +50 🪙 · Nasim & Negin ❤️ +3. See you next week!'; }
    persist();
    $('na-hand').classList.add('final');
    $('na-who').innerHTML = '';
    $('na-hand').innerHTML = `<div class="na-final">${NAIL_GIRLS.map(([g, n]) => `<div><span class="na-mini">${A.hand(g, ND.picks[g].c, ND.picks[g].f)}</span><b>${n}</b></div>`).join('')}</div>`;
    nailSay('leila', txt); snd('fanfare'); confettiOn($('screen-nails'));
    $('na-done').textContent = 'Back to the map'; $('na-done').disabled = false; ND.i = 99;
  }

  /* ---- how to play (first launch, and from settings) ---- */
  const HOWTO = [
    ['👆', 'Tap a request', 'Tap a bubble above someone, or the character. Nena plans every step by herself: fetch, walk, deliver.'],
    ['🏠', 'Move between rooms', 'The room cards at the bottom show who needs what. Tap a card, swipe the floor or use the side arrows.'],
    ['⏱️', 'Be quick', 'The ring around each bubble empties. Fast service = more points, combos and tips. Missing one costs a heart.'],
    ['⭐', 'Earn stars', 'Reach the score goals for 1, 2 or 3 stars. Golden spots and dotted paths show what to do next.'],
  ];
  let howI = 0, howAfter = null;
  function showHowTo(after) { howI = 0; howAfter = after || null; renderHow(); $('screen-howto').hidden = false; }
  function renderHow() {
    const [ico, t, d] = HOWTO[howI];
    $('hw-card').innerHTML = `<span class="hw-i">${ico}</span><h3>${t}</h3><p>${d}</p>`;
    $('hw-dots').innerHTML = HOWTO.map((_, i) => `<i class="${i === howI ? 'on' : ''}"></i>`).join('');
    $('hw-next').textContent = howI === HOWTO.length - 1 ? 'Let’s go! 🐾' : 'Next ›';
  }

  /* ---- mini-game: Simba's tricks (watch, then repeat) ---- */
  const TRICKS = [['sit', '🪑', 'Sit', 'lying'], ['paw', '🐾', 'Paw', 'hop'], ['spin', '🌀', 'Spin', 'spin'], ['bark', '🗣️', 'Bark', 'barking']];
  let TK = null;
  const tkSay = (t) => { const e = $('tk-say'); e.textContent = t; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); };
  function openTricks() {
    TK = { seq: [], i: 0, state: 'idle' };
    $('tk-dog').innerHTML = A.simba({ collar: save.collar });
    $('tk-nena').innerHTML = A.nena({ dressed: true, outfit: save.outfit, nails: nailOf('nena'), eyes: 'open' });
    $('tk-pads').innerHTML = TRICKS.map(([id, ico, name], i) => `<button type="button" class="pad p${i}" data-t="${i}"><span>${ico}</span>${name}</button>`).join('');
    $('tk-best').textContent = `Best: ${save.games.tricksBest || 0}`;
    $('tk-score').textContent = 'Ready?';
    $('tk-go').hidden = false; $('tk-go').textContent = 'Start';
    show('screen-tricks'); music('home');
    tkSay('Watch my tricks, then do them in the same order! Woof!');
  }
  function tkDo(t) {
    const pad = $('tk-pads').children[t]; if (pad) { pad.classList.remove('lit'); void pad.offsetWidth; pad.classList.add('lit'); setTimeout(() => pad.classList.remove('lit'), 320); }
    const d = $('tk-dog'), cls = TRICKS[t][3];
    d.classList.remove('lying', 'hop', 'spin', 'barking'); void d.offsetWidth; d.classList.add(cls);
    setTimeout(() => d.classList.remove(cls), 520);
    snd('tone', t);
  }
  function tkNext() {
    TK.seq.push(Math.floor(rnd() * 4)); TK.i = 0; TK.state = 'show';
    $('tk-score').textContent = `Round ${TK.seq.length}`;
    tkSay(pick(['Watch closely…', 'Look at me!', 'Here we go…']));
    const gap = Math.max(420, 760 - TK.seq.length * 30);
    let k = 0;
    const step = () => { if (!TK || TK.state !== 'show') return; if (k >= TK.seq.length) { TK.state = 'input'; tkSay('Your turn!'); return; } tkDo(TK.seq[k]); k++; setTimeout(step, gap); };
    setTimeout(step, 700);
  }
  function tkPad(t) {
    if (!TK || TK.state !== 'input') return;
    tkDo(t);
    if (t !== TK.seq[TK.i]) { tkEnd(); return; }
    TK.i++;
    if (TK.i === TK.seq.length) { TK.state = 'wait'; tkSay(pick(['Good boy! 🦴', 'Woof! 🐾', 'Yes!! ❤️', 'Treat time? 🦴'])); snd('success'); setTimeout(() => TK && TK.state === 'wait' && tkNext(), 900); }
  }
  function tkEnd() {
    const score = TK.seq.length - 1; TK.state = 'over';
    const daily = save.games.tricksDay !== today();
    const coins = Math.min(40, score * 3) + (daily && score > 0 ? 20 : 0);
    if (score > (save.games.tricksBest || 0)) save.games.tricksBest = score;
    if (daily && score > 0) save.games.tricksDay = today();
    track('game'); gainXP(10);
    save.coins += coins; save.friend.simba = (save.friend.simba || 0) + (score >= 3 ? 1 : 0); persist(); checkAch();
    snd(score >= 5 ? 'win' : 'lose');
    tkSay(score ? `Oops! ${score} trick${score > 1 ? 's' : ''} in a row. +${coins} 🪙` : 'Oops! Wrong trick. Try again!');
    $('tk-best').textContent = `Best: ${save.games.tricksBest}`;
    $('tk-go').hidden = false; $('tk-go').textContent = 'Play again';
  }
  /* ---- mini-game: Tahdig master (timing) ---- */
  let TD = null, tdRaf = 0;
  const TD_LOOK = { 3: ['#e8a93a', 'Golden and crispy! 😍'], 1: ['#c98a3a', 'Not bad, azizam!'], 0: ['#4a2a12', 'Ay! Burnt… 😅'], '-1': ['#f6ecc8', 'Too pale, still soft!'] };
  const tdSay = (t) => { const e = $('td-say'); e.textContent = t; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); };
  const potSvg = (col) => `<svg viewBox="0 0 200 150"><ellipse cx="100" cy="132" rx="84" ry="10" fill="rgba(0,0,0,.15)"/><path d="M22 52 h156 l-10 74 q-68 14 -136 0z" fill="#3a3550"/><rect x="14" y="44" width="172" height="14" rx="7" fill="#4a4570"/><rect x="2" y="48" width="22" height="8" rx="4" fill="#2a2740"/><rect x="176" y="48" width="22" height="8" rx="4" fill="#2a2740"/>${col ? `<ellipse cx="100" cy="44" rx="78" ry="16" fill="${col}"/><path d="M40 42 q20 -8 40 0 M96 40 q20 -8 40 0" stroke="rgba(255,255,255,.35)" stroke-width="3" fill="none"/>` : '<ellipse cx="100" cy="44" rx="78" ry="16" fill="#fff8e6"/><g fill="#f3e2b8">' + [...Array(16)].map((_, i) => `<ellipse cx="${36 + (i % 8) * 18}" cy="${38 + Math.floor(i / 8) * 9}" rx="5" ry="2.4"/>`).join('') + '</g>'}</svg>`;
  function openTahdig() {
    TD = { pot: 0, pts: 0, res: [], run: false };
    $('td-maman').innerHTML = A.person('fariba', { mood: 'happy' });
    $('td-pot').innerHTML = potSvg(null);
    $('td-pots').innerHTML = [0, 1, 2, 3, 4].map(() => '<i></i>').join('');
    $('td-best').textContent = `Best: ${save.games.tahdigBest || 0}/15`;
    $('td-score').textContent = '0 pts';
    $('td-zone').style.cssText = 'left:40%;width:20%'; $('td-needle').style.left = '0%';
    $('td-go').textContent = 'Start'; show('screen-tahdig'); music('home');
    tdSay('Nena jan, the secret of tahdig is timing! Tap FLIP when the needle is in the gold.');
  }
  function tdPot() {
    const w = [30, 24, 19, 15, 12][TD.pot];
    TD.zone = [8 + rnd() * (84 - w), w]; TD.x = 0; TD.dir = 1; TD.speed = 52 + TD.pot * 15; TD.run = true;
    $('td-zone').style.cssText = `left:${TD.zone[0]}%;width:${w}%`;
    $('td-near').style.cssText = `left:${Math.max(0, TD.zone[0] - 8)}%;width:${Math.min(100, w + 16)}%`;
    $('td-pot').innerHTML = potSvg(null); $('td-pot').classList.remove('flip');
    $('td-go').textContent = 'FLIP! 🍳';
    tdSay(pick(['The rice is sizzling…', 'Wait for it…', 'Listen to the crackle…', 'Almost… almost…']));
    let last = performance.now();
    cancelAnimationFrame(tdRaf);
    const tick = (now) => {
      if (!TD || !TD.run || $('screen-tahdig').hidden) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      TD.x += TD.dir * TD.speed * dt;
      if (TD.x >= 100) { TD.x = 100; TD.dir = -1; } else if (TD.x <= 0) { TD.x = 0; TD.dir = 1; }
      $('td-needle').style.left = TD.x.toFixed(1) + '%';
      tdRaf = requestAnimationFrame(tick);
    };
    tdRaf = requestAnimationFrame(tick);
  }
  function tdFlip() {
    if (!TD) return;
    if (!TD.run) { if (TD.pot === 0 || TD.pot >= 5) { TD = { pot: 0, pts: 0, res: [], run: false }; $('td-pots').innerHTML = [0, 1, 2, 3, 4].map(() => '<i></i>').join(''); $('td-score').textContent = '0 pts'; tdPot(); } return; }
    TD.run = false; cancelAnimationFrame(tdRaf);
    const [z0, w] = TD.zone, c = z0 + w / 2, d = Math.abs(TD.x - c);
    const res = d <= w / 2 ? 3 : d <= w / 2 + 8 ? 1 : TD.x < c ? -1 : 0;
    TD.pts += Math.max(0, res); TD.res.push(res);
    const [col, line] = TD_LOOK[res];
    $('td-pot').innerHTML = potSvg(col); const pot = $('td-pot'); pot.classList.remove('flip'); void pot.offsetWidth; pot.classList.add('flip');
    $('td-pots').children[TD.pot].style.background = col;
    $('td-score').textContent = `${TD.pts} pts`;
    $('td-maman').innerHTML = A.person('fariba', { mood: res === 3 ? 'happy' : res === 1 ? 'neutral' : 'surprised' });
    tdSay(line); snd(res === 3 ? 'success' : res === 1 ? 'pop' : 'fail');
    TD.pot++;
    if (TD.pot < 5) { $('td-go').textContent = '…'; setTimeout(() => TD && !$('screen-tahdig').hidden && tdPot(), 1200); return; }
    const daily = save.games.tahdigDay !== today();
    const coins = TD.pts * 2 + (daily && TD.pts > 0 ? 20 : 0);
    if (TD.pts > (save.games.tahdigBest || 0)) save.games.tahdigBest = TD.pts;
    if (daily && TD.pts > 0) save.games.tahdigDay = today();
    track('game'); gainXP(10);
    save.coins += coins; save.friend.fariba = (save.friend.fariba || 0) + (TD.pts >= 9 ? 1 : 0); persist(); checkAch();
    setTimeout(() => { if (!TD) return; tdSay(TD.pts >= 13 ? `Perfect! You are a real tahdig queen! +${coins} 🪙` : TD.pts >= 8 ? `Very good, azizam! ${TD.pts}/15 · +${coins} 🪙` : `Practice makes perfect! ${TD.pts}/15 · +${coins} 🪙`); snd(TD.pts >= 8 ? 'win' : 'lose'); $('td-go').textContent = 'Play again'; $('td-best').textContent = `Best: ${save.games.tahdigBest}/15`; }, 900);
  }

  /* ---- Today's journey: play time chests (5, 10, 20, 30 minutes) ---- */
  const JOURNEY = [{ m: 5, c: 20, ico: '🎁' }, { m: 10, c: 40, ico: '🎁' }, { m: 20, c: 70, ico: '💎' }, { m: 30, c: 150, ico: '👑', outfit: 'zen' }];
  let lastInput = Date.now(), jReadyShown = -1;
  document.addEventListener('pointerdown', () => { lastInput = Date.now(); }, true);
  const ACTIVE = ['screen-game', 'screen-tricks', 'screen-tahdig', 'screen-sort', 'screen-nails', 'screen-zen', 'screen-hair', 'screen-tree', 'screen-wheel', 'screen-gym', 'screen-bed', 'screen-life'];
  function journeyToday() { if (save.journey.date !== today()) save.journey = { date: today(), sec: 0, got: [] }; return save.journey; }
  setInterval(() => {
    if (document.hidden || Date.now() - lastInput > 60000) return;
    const on = ACTIVE.some((id) => !$(id).hidden) && !(G && !$('screen-game').hidden && (G.paused || G.over));
    if (!on) return;
    const J = journeyToday(); J.sec++;
    if (J.sec % 15 === 0) persist();
    const ready = JOURNEY.findIndex((j, i) => !J.got[i] && J.sec >= j.m * 60);
    if (ready >= 0 && ready !== jReadyShown) { jReadyShown = ready; toast(`${JOURNEY[ready].ico} ${JOURNEY[ready].m}-minute chest ready! Open it on the map.`, 'combo', 2200); snd('chime'); }
  }, 1000);
  function renderJourney() {
    const J = journeyToday(), min = J.sec / 60, pct = Math.min(100, (min / 30) * 100);
    $('m-journey').innerHTML = `<div class="jr-top"><b>🗺️ Journey</b><span class="lvp">⭐ Lv ${save.plv} <i class="xpbar"><i style="width:${Math.round(save.xp / xpNeed(save.plv) * 100)}%"></i></i></span><span>${Math.floor(min)}/30 min</span></div>
      <div class="jr-bar"><i style="width:${pct.toFixed(1)}%"></i>${JOURNEY.map((j, i) => { const ok = J.sec >= j.m * 60, got = J.got[i]; return `<button type="button" class="jr-chest${got ? ' got' : ok ? ' ready' : ''}" data-chest="${i}" style="left:${(j.m / 30) * 100}%" ${ok && !got ? '' : 'disabled'}><span>${got ? '✓' : j.ico}</span><small>${j.m}′</small></button>`; }).join('')}</div>`;
  }
  function openChest(i) {
    const J = journeyToday(), j = JOURNEY[i];
    if (J.got[i] || J.sec < j.m * 60) return;
    J.got[i] = true; save.coins += j.c;
    let extra = '';
    if (j.outfit && !save.owned[j.outfit]) { save.owned[j.outfit] = 1; extra = ' + Zen linen outfit 👗'; }
    if (i === JOURNEY.length - 1) track('journey');
    persist(); snd('fanfare'); confetti();
    toast(`${j.ico} +${j.c} 🪙${extra}`, 'combo', 2200);
    renderMap();
  }

  /* ---- Meditation: light the oud, then breathe ---- */
  let ZN = null, znRaf = 0;
  const OUD = '<svg viewBox="0 0 80 90"><ellipse cx="40" cy="84" rx="26" ry="5" fill="rgba(0,0,0,.18)"/><path d="M22 84 h36 l-4 -8 h-28z" fill="#a8761b"/><rect x="34" y="58" width="12" height="20" rx="3" fill="#c9952a"/><path d="M14 58 q26 -16 52 0 q-2 10 -26 12 q-24 -2 -26 -12z" fill="#e0b84a"/><path d="M20 56 q20 -10 40 0" stroke="#fff3c4" stroke-width="2" fill="none" opacity=".7"/><g class="oud-coal"><ellipse cx="40" cy="52" rx="10" ry="4" fill="#3a2418"/><ellipse cx="40" cy="51" rx="6" ry="2.4" fill="#5a3a26"/></g></svg>';
  function openZen() {
    ZN = { phase: 'light', score: 0, total: 0, t: 0, breaths: 0 };
    const c = { n: 3, night: true };
    $('zn-bg').innerHTML = `<svg width="0" height="0" style="position:absolute">${RA.defs(c)}</svg>` + RA.ART.bedroom(c);
    $('zn-nena').innerHTML = A.portrait('nena', 'sleepy');
    $('zn-oud').innerHTML = OUD; $('zn-oud').classList.remove('lit');
    $('zn-ring').className = 'zn-ring'; $('zn-cue').textContent = '';
    $('zn-calm').style.width = '0%';
    $('zn-btn').textContent = 'Tap the oud to light it 🔥'; $('zn-btn').disabled = true;
    $('zn-after').hidden = true; $('zn-btn').hidden = false;
    $('zn-say').textContent = save.wellness.zen === today() ? 'Again? A little more calm never hurts.' : 'Time for my daily meditation. First, the oud…';
    show('screen-zen'); music('zen');
  }
  function lightOud() {
    if (!ZN || ZN.phase !== 'light') return;
    ZN.phase = 'ready'; $('zn-oud').classList.add('lit'); snd('bell');
    $('zn-say').textContent = 'Mmm… the smell of oud. Now, breathe with the circle.';
    $('zn-btn').disabled = false; $('zn-btn').textContent = 'Start breathing 🧘';
  }
  const ZCYCLE = [['in', 4, 'Breathe in…'], ['hold', 1.5, 'Hold…'], ['out', 4, 'Breathe out…']];
  function zenStart() {
    if (!ZN) return;
    if (ZN.phase === 'ready') { ZN.phase = 'breathe'; ZN.t = 0; ZN.score = 0; ZN.total = 0; ZN.held = false; $('zn-btn').textContent = 'Hold while breathing in'; $('zn-btn').classList.add('hold'); let last = performance.now(); const tick = (now) => { if (!ZN || ZN.phase !== 'breathe' || $('screen-zen').hidden) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; zenTick(dt); znRaf = requestAnimationFrame(tick); }; znRaf = requestAnimationFrame(tick); snd('bell'); }
  }
  function zenTick(dt) {
    ZN.t += dt;
    const len = ZCYCLE.reduce((a, c) => a + c[1], 0), cyc = Math.floor(ZN.t / len), tt = ZN.t % len;
    if (cyc >= 4) { zenEnd(); return; }
    let acc = 0, ph = ZCYCLE[0], k = 0;
    for (const c of ZCYCLE) { if (tt < acc + c[1]) { ph = c; k = (tt - acc) / c[1]; break; } acc += c[1]; }
    const scale = ph[0] === 'in' ? 0.55 + 0.45 * k : ph[0] === 'hold' ? 1 : 1 - 0.45 * k;
    $('zn-ring').style.transform = `scale(${scale.toFixed(3)})`;
    if ($('zn-cue').textContent !== ph[2]) { $('zn-cue').textContent = ph[2]; if (ph[0] === 'in') snd('tone', 0); }
    const want = ph[0] !== 'out', good = want === !!ZN.held;
    ZN.total += dt; if (good) ZN.score += dt;
    $('zn-ring').classList.toggle('good', good); $('zn-ring').classList.toggle('bad', !good);
    $('zn-calm').style.width = Math.min(100, (ZN.score / (len * 4)) * 100).toFixed(1) + '%';
    $('zn-round').textContent = `Breath ${cyc + 1}/4`;
  }
  function zenEnd() {
    ZN.phase = 'done'; cancelAnimationFrame(znRaf);
    const pct = Math.round((ZN.score / Math.max(1, ZN.total)) * 100), first = save.wellness.zen !== today();
    const coins = first ? 15 + Math.round(pct / 4) : 0;
    if (first) { save.wellness.zen = today(); save.coins += coins; track('zen'); }
    track('game'); gainXP(10);
    persist(); checkAch(); snd('bell');
    $('zn-btn').classList.remove('hold'); $('zn-btn').hidden = true;
    $('zn-cue').textContent = `${pct}% calm`; $('zn-ring').className = 'zn-ring done';
    $('zn-say').textContent = pct >= 75 ? 'Ahh… I feel so light. Namaste. 🙏' : pct >= 45 ? 'Better. My mind is calmer now.' : 'Hmm, my mind kept wandering… Next time.';
    $('zn-res').innerHTML = first ? `🧘 Zen bonus for today: everyone 10% more patient · +${coins} 🪙` : 'Zen bonus already active today ✓';
    // sometimes, Nena feels like going out for a walk to hug a tree
    const walk = save.wellness.tree !== today() && (rnd() < 0.6 || !save.tot.tree);
    $('zn-walk').hidden = !walk;
    $('zn-after').hidden = false;
  }

  /* ---- Tree hug: a walk in the park and good energy ---- */
  let TR = null, trRaf = 0;
  const TREE = '<svg viewBox="0 0 220 300"><ellipse cx="110" cy="292" rx="80" ry="8" fill="rgba(0,0,0,.18)"/><path d="M92 292 q6 -60 -2 -120 q14 6 20 0 q-6 60 10 120z" fill="#7a5a3e"/><path d="M98 220 q-4 -30 2 -50 M112 250 q6 -40 0 -70" stroke="#5a3e28" stroke-width="3" fill="none"/><circle cx="110" cy="96" r="70" fill="#4d8044"/><circle cx="60" cy="130" r="46" fill="#5a9150"/><circle cx="160" cy="128" r="48" fill="#3f6f3a"/><circle cx="84" cy="60" r="40" fill="#5a9150"/><circle cx="142" cy="66" r="40" fill="#4d8044"/><circle cx="76" cy="104" r="10" fill="#e2433a" opacity=".85"/><circle cx="150" cy="96" r="9" fill="#e2433a" opacity=".85"/><circle cx="118" cy="140" r="8" fill="#e2433a" opacity=".85"/></svg>';
  function openTree() {
    TR = { e: 0, hold: false, done: false };
    const c = { n: 3 };
    $('tr-bg').innerHTML = `<svg width="0" height="0" style="position:absolute">${RA.defs(c)}</svg>` + RA.ART.street(c);
    $('tr-tree').innerHTML = TREE;
    $('tr-nena').innerHTML = A.nena({ dressed: true, outfit: save.outfit, nails: nailOf('nena') });
    $('tr-nena').className = 'actor tr-nena walking'; $('tr-nena').style.left = '4%';
    $('tr-fill').style.width = '0%'; $('tr-say').textContent = 'A little walk in the fresh air… that big tree looks wise.';
    $('tr-btn').textContent = 'Hold to hug the tree 🌳'; $('tr-btn').disabled = true; $('tr-done').hidden = true;
    show('screen-tree'); music('menu');
    setTimeout(() => { $('tr-nena').style.left = '42%'; }, 50);
    setTimeout(() => { if (!TR) return; $('tr-nena').classList.remove('walking'); $('tr-btn').disabled = false; }, 2300);
    let last = performance.now();
    const tick = (now) => {
      if (!TR || $('screen-tree').hidden) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!TR.done) {
        TR.e = Math.max(0, Math.min(1, TR.e + (TR.hold ? dt / 3.2 : -dt / 5)));
        $('tr-fill').style.width = (TR.e * 100).toFixed(1) + '%';
        $('tr-nena').classList.toggle('hug', TR.hold);
        if (TR.hold && rnd() < dt * 6) leaf();
        if (TR.e >= 1) treeDone();
      }
      trRaf = requestAnimationFrame(tick);
    };
    trRaf = requestAnimationFrame(tick);
  }
  function leaf() {
    const st = $('tr-stage'), e = document.createElement('i');
    e.className = 'leaf'; e.textContent = pick(['🍃', '✨', '💚', '🌿']);
    e.style.left = (45 + rnd() * 30) + '%'; e.style.top = (20 + rnd() * 30) + '%';
    st.appendChild(e); setTimeout(() => e.remove(), 1600);
  }
  function treeDone() {
    TR.done = true; TR.hold = false;
    const first = save.wellness.tree !== today();
    if (first) { save.wellness.tree = today(); save.coins += 15; track('tree'); }
    persist(); checkAch(); snd('win');
    for (let i = 0; i < 10; i++) setTimeout(leaf, i * 70);
    $('tr-nena').classList.remove('hug');
    $('tr-say').textContent = pick(['I can feel the good energy flowing… 💚', 'Thank you, tree. I feel recharged!', 'Nature is the best therapy.']);
    $('tr-btn').hidden = true; $('tr-done').hidden = false;
    $('tr-res').textContent = first ? '🌳 Good energy: +1 heart in today’s days · +15 🪙' : 'Good energy already collected today ✓';
  }

  /* ---- Hair day: Maman dries Nena's hair after her shower ---- */
  const HZONES = [[50, 9], [28, 17], [72, 17], [15, 46], [85, 46], [14, 75], [86, 75]];
  let HD = null, hdRaf = 0;
  const DRYER = '<svg viewBox="0 0 90 70"><rect x="34" y="34" width="16" height="34" rx="6" fill="#c9496f"/><path d="M8 14 h50 a20 20 0 0 1 0 28 h-50z" fill="#ef8fb0"/><rect x="2" y="16" width="10" height="24" rx="3" fill="#c9496f"/><circle cx="60" cy="28" r="9" fill="#fff" opacity=".5"/><rect x="38" y="44" width="8" height="6" rx="2" fill="#ffd36b"/></svg>';
  function openHair() {
    HD = { z: HZONES.map(() => ({ wet: 1, heat: 0 })), t: 28, burns: 0, run: false, x: 50, y: 50, near: false };
    $('hd-nena').innerHTML = A.portrait('nena', 'happy');
    $('hd-maman').innerHTML = A.portrait('fariba', 'happy');
    $('hd-zones').innerHTML = HZONES.map(([x, y], i) => `<i class="wet" data-z="${i}" style="left:${x}%;top:${y}%"><b></b></i>`).join('');
    $('hd-dryer').innerHTML = DRYER + '<span class="air"><i></i><i></i><i></i></span>';
    $('hd-time').textContent = '0:28'; $('hd-heat').style.width = '0%';
    $('hd-go').hidden = false; $('hd-go').textContent = 'Start drying 💨';
    hdSay('fariba', 'Come, azizam, sit down. I’ll dry your hair before you catch a cold!');
    show('screen-hair'); music('home');
  }
  function hdSay(who, t) { const e = $('hd-say'); e.textContent = (who === 'fariba' ? 'Maman: ' : 'Nena: ') + t; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); }
  function hdStart() {
    if (!HD) return;
    if (HD.over) { openHair(); return; }
    HD.run = true; $('hd-go').hidden = true;
    hdSay('fariba', 'Move the dryer over the wet hair. Not too long in one place!');
    let last = performance.now(), hum = 0;
    const tick = (now) => {
      if (!HD || !HD.run || $('screen-hair').hidden) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      HD.t -= dt;
      let maxHeat = 0;
      HD.z.forEach((z, i) => {
        const [zx, zy] = HZONES[i], d = Math.hypot(HD.x - zx, (HD.y - zy) * 0.9), near = HD.near && d < 15;
        if (near) { z.wet = Math.max(0, z.wet - dt * 0.6); z.heat += dt * (z.wet > 0 ? 0.25 : 0.9); } else z.heat = Math.max(0, z.heat - dt * 0.5);
        if (z.heat >= 1) { z.heat = 0; HD.burns++; snd('fail'); buzz(40); $('hd-nena').innerHTML = A.portrait('nena', 'surprised'); hdSay('nena', pick(['Ouch! Too hot, Maman!', 'Aaah! It burns!', 'Careful!! 🔥'])); setTimeout(() => { if (HD) $('hd-nena').innerHTML = A.portrait('nena', 'happy'); }, 1200); }
        maxHeat = Math.max(maxHeat, z.heat);
        const el = $('hd-zones').children[i]; el.style.opacity = (0.15 + z.wet * 0.85).toFixed(2); el.classList.toggle('dry', z.wet <= 0);
      });
      $('hd-heat').style.width = (maxHeat * 100).toFixed(0) + '%';
      hum += dt; if (HD.near && hum > 0.6) { hum = 0; snd('swoosh'); }
      const t = Math.max(0, Math.ceil(HD.t)); $('hd-time').textContent = `0:${String(t).padStart(2, '0')}`;
      const left = HD.z.filter((z) => z.wet > 0).length;
      if (left === 0 || HD.t <= 0) { hairEnd(); return; }
      hdRaf = requestAnimationFrame(tick);
    };
    hdRaf = requestAnimationFrame(tick);
  }
  function hairMove(e) {
    if (!HD) return;
    const r = $('hd-head').getBoundingClientRect();
    HD.x = ((e.clientX - r.left) / r.width) * 100; HD.y = ((e.clientY - r.top) / r.height) * 100;
    HD.near = e.type !== 'pointerleave' && e.type !== 'pointerup' && (e.buttons > 0 || e.pointerType === 'touch' || e.type === 'pointerdown');
    const st = $('hd-stage').getBoundingClientRect();
    $('hd-dryer').style.transform = `translate(${(e.clientX - st.left + 6).toFixed(0)}px, ${(e.clientY - st.top - 30).toFixed(0)}px)`;
    $('hd-dryer').classList.toggle('on', HD.near && HD.run);
  }
  function hairEnd() {
    HD.run = false; HD.over = true; cancelAnimationFrame(hdRaf);
    const dry = HD.z.filter((z) => z.wet <= 0).length / HD.z.length;
    const stars = dry >= 1 ? (HD.burns === 0 ? 3 : HD.burns <= 2 ? 2 : 1) : dry >= 0.7 ? 1 : 0;
    const first = save.wellness.hair !== today();
    const coins = 8 * stars + (first && stars ? 20 : 0);
    if (stars > (save.games.hairBest || 0)) save.games.hairBest = stars;
    if (first && stars) save.wellness.hair = today();
    track('game'); gainXP(10);
    save.coins += coins; save.friend.fariba = (save.friend.fariba || 0) + stars; persist(); checkAch();
    snd(stars >= 2 ? 'win' : 'lose'); $('hd-dryer').classList.remove('on');
    $('hd-nena').innerHTML = A.portrait('nena', stars >= 2 ? 'happy' : 'neutral');
    hdSay('fariba', stars === 3 ? `Perfect! Soft and shiny, like a princess. ${'★'.repeat(stars)} +${coins} 🪙` : stars ? `Good, azizam! ${'★'.repeat(stars)} +${coins} 🪙` : 'Still wet… you’ll catch a cold! Try again.');
    if (stars === 3) confettiOn($('screen-hair'));
    $('hd-go').hidden = false; $('hd-go').textContent = 'Again';
  }

  /* ---- Player level (XP) ---- */
  const xpNeed = (l) => 40 + 40 * l;
  function gainXP(n) {
    save.xp += n;
    while (save.xp >= xpNeed(save.plv)) {
      save.xp -= xpNeed(save.plv); save.plv++;
      const c = 25 + 10 * save.plv; save.coins += c;
      if (save.plv % 2 === 0) save.wheel.extra = (save.wheel.extra || 0) + 1;
      setTimeout(() => { toast(`⭐ Level ${save.plv}! +${c} 🪙${save.plv % 2 === 0 ? ' + 🎡 spin' : ''}`, 'combo', 2200); snd('fanfare'); }, 300);
    }
    persist();
  }
  /* ---- Daily quests ---- */
  const DQ_POOL = [
    { k: 'pet', n: 3, ico: '🐶', label: 'Pet Simba 3 times' }, { k: 'day', n: 1, ico: '🌅', label: 'Finish a day' }, { k: 'game', n: 1, ico: '🎮', label: 'Play a mini-game' },
    { k: 'req', n: 15, ico: '⚡', label: 'Complete 15 requests' }, { k: 'perfect', n: 1, ico: '⭐', label: 'Get 3 stars on a day' }, { k: 'mini', n: 2, ico: '🔥', label: 'Win 2 mini challenges' },
    { k: 'zen', n: 1, ico: '🧘', label: 'Meditate once' }, { k: 'gym', n: 1, ico: '🏋️', label: 'Go to the gym with Negin' }, { k: 'bed', n: 1, ico: '🌙', label: 'Rock Simba to sleep' }, { k: 'breakfast', n: 1, ico: '🍳', label: 'Serve the family breakfast' }, { k: 'gift', n: 2, ico: '🐾', label: 'Open 2 of Simba’s surprises' }, { k: 'moment', n: 2, ico: '🕐', label: 'Live 2 hourly moments' }, { k: 'grocery', n: 1, ico: '🛒', label: 'Do the groceries for Maman' }, { k: 'laundry', n: 1, ico: '🧺', label: 'Hang the laundry' }, { k: 'req_food', n: 3, ico: '🍖', label: 'Feed Simba 3 times' }, { k: 'req_tea', n: 2, ico: '☕', label: 'Serve Baba 2 teas' }, { k: 'photo', n: 1, ico: '📸', label: 'Take a Simba photo' },
  ];
  function dailyQuests() {
    if (save.dq.date !== today()) save.dq = { date: today(), base: Object.assign({}, save.tot), claimed: false };
    const r = seeded(dayNum() * 13 + 5), pool = DQ_POOL.slice(), out = [];
    out.push(pool.splice(1, 1)[0]);   // always: finish a day
    while (out.length < 3) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    return out;
  }
  const dqProg = (q) => (save.tot[q.k] || 0) - (save.dq.base[q.k] || 0);
  /* ---- Stickers ---- */
  const STICKER_SETS = [
    { id: 'family', ico: '👨‍👩‍👧', name: 'The family', items: [['s_nena', '👧', 'Nena'], ['s_baba', '👴', 'Baba'], ['s_maman', '👩‍🍳', 'Maman'], ['s_nasim', '😤', 'Nasim'], ['s_negin', '😴', 'Negin'], ['s_aunt', '🎁', 'Aunt Mahin']] },
    { id: 'simba', ico: '🦁', name: 'Simba', items: [['s_lion', '🦁', 'Little lion'], ['s_ball', '🎾', 'Ball'], ['s_bone', '🦴', 'Golden bone'], ['s_blankie', '🧸', 'Blankie'], ['s_bath', '🛁', 'Bath time'], ['s_biscuit', '🐕', 'Biscuit']] },
    { id: 'tehran', ico: '🏙️', name: 'Tehran', items: [['s_milad', '🗼', 'Milad tower'], ['s_alborz', '🏔️', 'Alborz'], ['s_sangak', '🫓', 'Sangak'], ['s_juice', '🧃', 'Juice'], ['s_car', '🚙', 'White 4×4'], ['s_tea', '🍵', 'Chai']] },
    { id: 'clap', ico: '🏮', name: 'CLAP', items: [['s_lantern', '🏮', 'Lantern'], ['s_hookah', '💨', 'Hookah'], ['s_mochi', '🍡', 'Mochi'], ['s_pourya', '📸', 'Pourya'], ['s_witch', '🔮', 'The witches'], ['s_bamboo', '🎋', 'Bamboo']] },
  ];
  const STICKERS = STICKER_SETS.flatMap((s) => s.items);
  function dropStickers(n) {
    const got = [];
    for (let i = 0; i < n; i++) {
      const missing = STICKERS.filter((x) => !save.stickers[x[0]]);
      const st = missing.length && rnd() < 0.7 ? pick(missing) : pick(STICKERS);
      const dup = !!save.stickers[st[0]];
      save.stickers[st[0]] = (save.stickers[st[0]] || 0) + 1;
      if (dup) save.coins += 5;
      got.push({ id: st[0], ico: st[1], name: st[2], dup });
    }
    STICKER_SETS.forEach((set) => { if (!save.sets[set.id] && set.items.every((it) => save.stickers[it[0]])) { save.sets[set.id] = 1; save.coins += 100; track('set'); setTimeout(() => { toast(`🎴 Set complete: ${set.name}! +100 🪙`, 'combo', 2400); snd('win'); }, 900); } });
    persist();
    return got;
  }
  /* ---- Lucky wheel ---- */
  const WHEEL = [
    { ico: '🪙', label: '20', w: 22, give: () => { save.coins += 20; return '+20 🪙'; } },
    { ico: '⏱️', label: '+15s', w: 12, give: () => { save.freeB.time = (save.freeB.time || 0) + 1; return 'Free booster: +15 seconds ⏱️'; } },
    { ico: '🎴', label: '×3', w: 14, give: () => { const g = dropStickers(3); return `Sticker pack: ${g.map((x) => x.ico).join(' ')}`; } },
    { ico: '🪙', label: '50', w: 18, give: () => { save.coins += 50; return '+50 🪙'; } },
    { ico: '☕', label: 'Coffee', w: 12, give: () => { save.freeB.coffee = (save.freeB.coffee || 0) + 1; return 'Free booster: morning coffee ☕'; } },
    { ico: '🪙', label: '100', w: 10, give: () => { save.coins += 100; return '+100 🪙'; } },
    { ico: '💗', label: 'Heart', w: 10, give: () => { save.freeB.heart = (save.freeB.heart || 0) + 1; return 'Free booster: extra heart 💗'; } },
    { ico: '💎', label: '250', w: 2, give: () => { save.coins += 250; return 'JACKPOT! +250 🪙 💎'; } },
  ];
  const spinsLeft = () => (save.wheel.date !== today() || !save.wheel.used ? 1 : 0) + (save.wheel.extra || 0);
  let wheelRot = 0, spinning = false;
  function openWheel() {
    const seg = 360 / WHEEL.length, cols = ['#ef8fb0', '#ffd36b', '#86aaff', '#7fe0b4', '#c48bff', '#ffb36b', '#ff8fa8', '#2c2850'];
    const R = 140, c = 150, arc = (i) => { const a0 = (i * seg - 90) * Math.PI / 180, a1 = ((i + 1) * seg - 90) * Math.PI / 180; return `M${c} ${c} L${(c + R * Math.cos(a0)).toFixed(1)} ${(c + R * Math.sin(a0)).toFixed(1)} A${R} ${R} 0 0 1 ${(c + R * Math.cos(a1)).toFixed(1)} ${(c + R * Math.sin(a1)).toFixed(1)}Z`; };
    $('wh-wheel').innerHTML = `<svg viewBox="0 0 300 300"><circle cx="150" cy="150" r="148" fill="#fff"/>${WHEEL.map((w, i) => { const mid = (i + 0.5) * seg; return `<path d="${arc(i)}" fill="${cols[i]}" stroke="#fff" stroke-width="3"/><g transform="rotate(${mid} 150 150)"><text x="150" y="52" text-anchor="middle" font-size="28">${w.ico}</text><text x="150" y="80" text-anchor="middle" font-size="15" font-family="Fredoka, sans-serif" font-weight="700" fill="${i === 7 ? '#ffd36b' : '#3f2a22'}">${w.label}</text></g>`; }).join('')}<circle cx="150" cy="150" r="22" fill="#c9496f" stroke="#fff" stroke-width="5"/></svg>`;
    $('wh-wheel').style.transition = 'none'; $('wh-wheel').style.transform = `rotate(${wheelRot}deg)`;
    $('wh-res').textContent = ''; whButton(); show('screen-wheel');
  }
  function whButton() { const n = spinsLeft(); $('wh-spin').disabled = !n || spinning; $('wh-spin').textContent = n ? `SPIN! (${n} left)` : 'No spins left · come back tomorrow'; $('wh-how').textContent = 'Free spin every day · +1 for each perfect day, every 2 levels and the daily quest chest'; }
  function spinWheel() {
    if (spinning || !spinsLeft()) return;
    if (save.wheel.date !== today() || !save.wheel.used) save.wheel = { date: today(), used: true, extra: save.wheel.extra || 0 }; else save.wheel.extra--;
    persist(); spinning = true; whButton(); snd('click');
    let tot = WHEEL.reduce((a, w) => a + w.w, 0), x = rnd() * tot, i = 0;
    while (x > WHEEL[i].w) { x -= WHEEL[i].w; i++; }
    const seg = 360 / WHEEL.length, center = (i + 0.5) * seg + (rnd() - 0.5) * seg * 0.6;
    const cur = ((wheelRot % 360) + 360) % 360;
    wheelRot += 360 * 5 + ((360 - center - cur) % 360 + 360) % 360;
    const w = $('wh-wheel'); w.style.transition = 'transform 4s cubic-bezier(.15,.85,.25,1)'; w.style.transform = `rotate(${wheelRot}deg)`;
    let ticks = 0; const tk = setInterval(() => { if (++ticks > 22) clearInterval(tk); else snd('tick'); }, 170);
    setTimeout(() => { spinning = false; const msg = WHEEL[i].give(); persist(); $('wh-res').textContent = `🎉 ${msg}`; snd(i === 7 ? 'win' : 'coin'); if (i === 7 || i === 5) confettiOn($('screen-wheel')); whButton(); checkAch(); }, 4100);
  }
  /* ---- Welcome back: Simba missed you ---- */
  let welcomeChecked = false;
  function welcomeBack() {
    const last = save.lastSeen || 0, now = Date.now(), h = (now - last) / 3600000;
    save.lastSeen = now; persist();
    if (!last || h < 3) return false;
    const gift = Math.min(120, Math.round(h * 6));
    save.coins += gift; persist();
    $('wb-dog').innerHTML = A.simba({ collar: save.collar });
    $('wb-text').textContent = h > 20 ? `Simba waited by the door all day! He brought you ${gift} 🪙.` : `Simba missed you! He found ${gift} 🪙 under the sofa.`;
    $('screen-welcome').hidden = false; snd('bark');
    return true;
  }
  setInterval(() => { save.lastSeen = Date.now(); }, 30000);
  const bCost = (b) => ((save.freeB[b.id] || 0) > 0 ? 0 : b.cost);

  /* ---- Gym with Negin, every other day ---- */
  const gymDay = () => dayNum() % 2 === 0;
  const GYM_BG = `<svg viewBox="0 0 600 500" preserveAspectRatio="xMidYMax slice" class="gym-bg"><rect width="600" height="500" fill="#2f3440"/>
    <rect x="0" y="40" width="600" height="190" fill="#9fc4da" opacity=".35"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${10 + i * 120}" y="46" width="108" height="176" fill="#cfe3ea" opacity=".45"/><path d="M${22 + i * 120} 60 l40 150" stroke="#fff" stroke-width="5" opacity=".35"/>`).join('')}
    <rect x="0" y="0" width="600" height="34" fill="#22262f"/>${[90, 300, 510].map((x) => `<rect x="${x - 50}" y="10" width="100" height="10" rx="4" fill="#fff6dc"/>`).join('')}
    <text x="300" y="268" text-anchor="middle" font-size="26" font-family="Fredoka, sans-serif" font-weight="700" fill="#ff5fa2">FIT TEHRAN</text>
    <rect x="0" y="330" width="600" height="170" fill="#3a3f4c"/>${[...Array(12)].map((_, i) => `<path d="M${i * 50} 330 v170" stroke="#333844" stroke-width="2"/>`).join('')}
    <g fill="#1c1f26">${[40, 520].map((x) => `<rect x="${x}" y="250" width="40" height="80" rx="4"/><rect x="${x - 10}" y="240" width="60" height="12" rx="4"/>`).join('')}</g>
    ${[110, 150, 450, 490].map((x, i) => `<g><rect x="${x - 3}" y="300" width="6" height="30" fill="#7a7f8c"/><rect x="${x - 12}" y="292" width="24" height="10" rx="3" fill="${['#ef6fa3', '#86aaff', '#ffd36b', '#7fe0b4'][i]}"/></g>`).join('')}
    <rect x="236" y="290" width="128" height="40" rx="8" fill="#ef8fb0" opacity=".5"/></svg>`;
  let GY = null, gyRaf = 0;
  const GYM_STEPS = [
    { k: 'squat', name: 'Squats', ico: '🍑', help: 'Tap when the marker is in the pink zone (8 reps)' },
    { k: 'run', name: 'Treadmill', ico: '🏃‍♀️', help: 'Tap fast to keep your speed above the line (8 s)' },
    { k: 'plank', name: 'Plank', ico: '🧘‍♀️', help: 'Hold the button for 7 seconds. Don’t let go!' },
  ];
  const NEGIN_GYM = { start: ['Ugh, the gym… okay, for you, Nena.', 'Five minutes and then a nap, deal?'], good: ['Wow, you’re on fire!', 'Show-off! 😅', 'Okay okay, I’m impressed.'], bad: ['Haha, you look like me!', 'Even I can do better… maybe.'], end: ['I’m dead. Smoothie time? 🥤', 'Same time in two days? …If I’m awake.'] };
  const SHADI = { start: ['Salam girls! Warm-up done? Let’s go! 📣', 'Phones away, Negin. Today we sweat! 💪', 'Nena, Negin — ready? Big smiles, strong legs!'],
    squat: ['Squats! Hips back, chest up… and down!', 'Squats: tap when the marker hits the pink!'], run: ['Treadmill! Faster, faster — don’t drop below the line!', 'Run, girls! Imagine Simba chasing a cat!'], plank: ['Plank! Hold it… hold it… I’m counting!', 'Last one: plank. Don’t you dare let go!'],
    end: { 3: ['Perfect session! You two are my stars ⭐', 'Wow! Shadi-approved 💯'], 2: ['Very good! A bit more next time.', 'Nice work, girls! Stretch now.'], 1: ['Hmm… we’ll work on that. See you in two days!', 'Not bad, not great. Drink water!'], 0: ['Did you two even try? 😂 Again in two days!'] } };
  function gySay(who, t) { const e = $('gy-say'); e.textContent = ({ negin: 'Negin: ', shadi: 'Coach Shadi: ' }[who] || 'Nena: ') + t; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); }
  function openGym() {
    GY = { step: -1, scores: [], run: false };
    $('gy-bg').innerHTML = GYM_BG;
    $('gy-nena').innerHTML = A.nena({ dressed: true, outfit: 'sweat', nails: nailOf('nena') });
    $('gy-negin').innerHTML = A.person('negin', { mood: 'sleepy', nails: nailOf('negin') });
    $('gy-shadi').innerHTML = A.person('shadi', { mood: 'happy' });
    $('gy-meter').hidden = true; $('gy-steps').innerHTML = GYM_STEPS.map((x) => `<span>${x.ico} ${x.name}</span>`).join('');
    const ok = gymDay();
    $('gy-info').textContent = ok ? (save.wellness.gym === today() ? 'Already trained today ✓ (practice)' : 'Gym day! Reward: Nena 15% faster in today’s days') : 'Rest day today — next session tomorrow (practice only)';
    $('gy-btn').textContent = 'Start the workout 💪'; $('gy-btn').disabled = false; $('gy-btn').dataset.mode = 'start';
    gySay('shadi', pick(SHADI.start)); setTimeout(() => { if (GY && GY.step < 0 && !$('screen-gym').hidden) gySay('negin', pick(NEGIN_GYM.start)); }, 2200);
    show('screen-gym'); music('street');
  }
  function gyNext() {
    GY.step++;
    if (GY.step === 0) $('gy-negin').innerHTML = A.person('negin', { nails: nailOf('negin') });
    const st = GYM_STEPS[GY.step];
    [...$('gy-steps').children].forEach((e, i) => e.classList.toggle('on', i === GY.step));
    if (!st) { gymEnd(); return; }
    $('gy-meter').hidden = false; $('gy-help').textContent = st.help; $('gy-mark').hidden = st.k !== 'squat'; $('gy-zone').hidden = st.k !== 'squat'; $('gy-line').hidden = st.k !== 'run';
    $('gy-fill').style.width = '0%';
    ['gy-nena', 'gy-negin', 'gy-shadi'].forEach((id) => { $(id).className = 'actor gy-actor ' + id; });
    gySay('shadi', pick(SHADI[st.k]));
    GY.st = { k: st.k, t: 0, reps: 0, hits: 0, x: 0, dir: 1, speed: 0, good: 0, hold: false, held: 0 };
    $('gy-btn').dataset.mode = st.k; $('gy-btn').textContent = st.k === 'squat' ? 'SQUAT! 🍑' : st.k === 'run' ? 'RUN! 👟' : 'HOLD 🧘‍♀️';
    GY.run = true;
    let last = performance.now();
    cancelAnimationFrame(gyRaf);
    const tick = (now) => {
      if (!GY || !GY.run || $('screen-gym').hidden) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now; gyTick(dt);
      gyRaf = requestAnimationFrame(tick);
    };
    gyRaf = requestAnimationFrame(tick);
  }
  function gyTick(dt) {
    const S = GY.st; S.t += dt;
    if (S.k === 'squat') {
      S.x += S.dir * dt * (70 + S.reps * 6); if (S.x >= 100) { S.x = 100; S.dir = -1; } if (S.x <= 0) { S.x = 0; S.dir = 1; }
      $('gy-mark').style.left = S.x.toFixed(1) + '%'; $('gy-fill').style.width = (S.hits / 8 * 100) + '%';
    } else if (S.k === 'run') {
      S.speed = Math.max(0, S.speed - dt * 0.55); if (S.speed >= 0.6) S.good += dt;
      $('gy-fill').style.width = (S.speed * 100).toFixed(0) + '%';
      $('gy-nena').classList.toggle('walking', S.speed > 0.2); $('gy-negin').classList.add('walking'); $('gy-shadi').classList.toggle('walking', S.t % 2 < 1);
      $('gy-help').textContent = `Treadmill · ${Math.max(0, 8 - S.t).toFixed(1)} s`;
      if (S.t >= 8) gyStepDone(Math.min(1, S.good / 6.5));
    } else if (S.k === 'plank') {
      if (S.hold) S.held += dt;
      $('gy-fill').style.width = Math.min(100, S.held / 7 * 100).toFixed(0) + '%';
      $('gy-nena').classList.toggle('plank', S.hold);
      if (S.hold && Math.floor(S.held) !== S.cnt) { S.cnt = Math.floor(S.held); if (S.cnt > 0 && S.cnt < 7) gySay('shadi', `${S.cnt}… ${S.cnt >= 5 ? 'almost!' : 'keep going!'}`); }
      if (S.held >= 7) gyStepDone(1);
    }
  }
  function gyPress(down) {
    if (!GY || !GY.run) return;
    const S = GY.st;
    if (S.k === 'squat' && down) {
      S.reps++; const hit = S.x > 38 && S.x < 62;
      if (hit) S.hits++;
      const n = $('gy-nena'); n.classList.remove('squat'); void n.offsetWidth; n.classList.add('squat');
      ['gy-negin', 'gy-shadi'].forEach((id) => { const g = $(id); g.classList.remove('squat'); void g.offsetWidth; g.classList.add('squat'); });
      snd(hit ? 'pop' : 'fail');
      if (S.reps === 4) gySay('negin', pick(S.hits >= 3 ? NEGIN_GYM.good : NEGIN_GYM.bad));
      if (S.reps >= 8) gyStepDone(S.hits / 8);
    } else if (S.k === 'run' && down) { S.speed = Math.min(1, S.speed + 0.12); snd('tick'); }
    else if (S.k === 'plank') {
      if (down) S.hold = true;
      else if (S.hold && S.held > 0.3) { S.hold = false; gyStepDone(Math.min(1, S.held / 7)); }
    }
  }
  function gyStepDone(score) {
    GY.run = false; cancelAnimationFrame(gyRaf); GY.scores.push(score);
    ['gy-nena', 'gy-negin', 'gy-shadi'].forEach((id) => $(id).classList.remove('walking', 'plank', 'squat'));
    snd(score >= 0.7 ? 'success' : 'pop');
    gySay(score >= 0.7 ? 'negin' : 'nena', score >= 0.7 ? pick(NEGIN_GYM.good) : pick(['Phew… harder than it looks!', 'My legs are jelly…']));
    $('gy-btn').dataset.mode = 'next'; $('gy-btn').textContent = GY.step < GYM_STEPS.length - 1 ? `Next: ${GYM_STEPS[GY.step + 1].name} ›` : 'Finish 🏁';
  }
  function gymEnd() {
    $('gy-meter').hidden = true;
    const avg = GY.scores.reduce((a, b) => a + b, 0) / GY.scores.length, stars = avg >= 0.85 ? 3 : avg >= 0.6 ? 2 : avg >= 0.3 ? 1 : 0;
    const first = gymDay() && save.wellness.gym !== today() && stars > 0;
    const coins = first ? 15 + stars * 10 : 0;
    if (first) { save.wellness.gym = today(); save.coins += coins; track('gym'); }
    track('game'); gainXP(15); save.friend.negin = (save.friend.negin || 0) + stars; persist(); checkAch();
    snd(stars >= 2 ? 'win' : 'lose');
    $('gy-negin').innerHTML = A.person('negin', { mood: 'happy', nails: nailOf('negin') });
    gySay('shadi', pick(SHADI.end[stars])); setTimeout(() => { if (GY && !$('screen-gym').hidden) gySay('negin', pick(NEGIN_GYM.end)); }, 2600);
    $('gy-info').textContent = `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)} · ${first ? `Gym energy: Nena 15% faster today · +${coins} 🪙` : 'Great practice!'}`;
    $('gy-btn').dataset.mode = 'done'; $('gy-btn').textContent = 'Back to the map';
    if (stars === 3) confettiOn($('screen-gym'));
  }

  /* ---- real life: clock, Persian date, Tehran weather, daily routine ---- */
  function dayPhase() {
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return { k: 'morning', ico: '🌅', name: 'Morning', hello: 'Sobh bekheir! Good morning ☀️' };
    if (h >= 11 && h < 17) return { k: 'day', ico: '🌤️', name: 'Afternoon', hello: 'Good afternoon! Busy day in the house.' };
    if (h >= 17 && h < 21) return { k: 'evening', ico: '🌇', name: 'Evening', hello: 'Asr bekheir! The family is coming home.' };
    return { k: 'night', ico: '🌙', name: 'Night', hello: 'Shab bekheir… Simba is yawning.' };
  }
  function persianDate() {
    try { return new Intl.DateTimeFormat('en-u-ca-persian', { day: 'numeric', month: 'long' }).format(new Date()); } catch (e) { return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }); }
  }
  const TEH_HI = [8, 11, 16, 22, 28, 34, 37, 36, 32, 24, 16, 10];
  function weather() {
    const d = new Date(), m = d.getMonth(), h = d.getHours(), r = seeded(dayNum() * 7 + 3), a = r(), b = r();
    let k = 'sun';
    if (m === 11 || m <= 1) k = a < 0.18 ? 'snow' : a < 0.38 ? 'smog' : a < 0.6 ? 'cloud' : 'sun';
    else if (m <= 4) k = a < 0.25 ? 'rain' : a < 0.45 ? 'cloud' : 'sun';
    else if (m <= 7) k = a < 0.1 ? 'dust' : 'sun';
    else k = m >= 9 && a < 0.22 ? 'rain' : m >= 10 && a < 0.42 ? 'smog' : a < 0.55 ? 'cloud' : 'sun';
    const temp = Math.round(TEH_HI[m] + (b * 6 - 3) - (h < 7 || h >= 21 ? 7 : h < 11 || h >= 18 ? 3 : 0));
    const W = {
      sun: ['☀️', 'Sunny', 'Clear sky over Tehran — Alborz mountains are visible today!'],
      cloud: ['☁️', 'Cloudy', 'Grey sky. A good day for tea and staying in.'],
      rain: ['🌧️', 'Rainy', 'Rain in Tehran! Hang the laundry inside and dry Simba after walks.'],
      snow: ['❄️', 'Snowy', 'Snow! Simba loves to roll in it — get the towel ready.'],
      smog: ['🌫️', 'Smoggy — poor air', 'Air pollution alert: short walks for Simba, schools may close.'],
      dust: ['🌪️', 'Dusty wind', 'Dust in the air. Close the windows and wipe the balcony.'],
    }[k];
    return { k, ico: W[0], name: W[1], tip: W[2], temp };
  }
  function routine() {
    const L = [
      { k: 'breakfast', ico: '🍳', name: 'Family breakfast', desc: 'At the kitchen table: sangak, panir, walnuts and chai for the family.', win: [6, 11], done: () => save.life.breakfast === today(), go: () => openLife('breakfast') },
      { k: 'grocery', ico: '🛒', name: 'Groceries at Agha Reza’s shop', desc: 'Remember Maman’s list — no phone allowed!', win: [10, 14], done: () => save.life.grocery === today(), go: () => openLife('grocery') },
      { k: 'laundry', ico: '🧺', name: 'Hang the laundry', desc: 'Pair the socks and hang them on the line.', win: [13, 18], done: () => save.life.laundry === today(), go: () => openLife('laundry') },
      { k: 'zen', ico: '🧘', name: 'Meditation with oud', desc: 'Light the oud and breathe.', win: [6, 22], done: () => save.wellness.zen === today(), go: openZen },
    ];
    if (gymDay()) L.push({ k: 'gym', ico: '🏋️', name: 'Gym with Negin & Coach Shadi', desc: 'Every other day at FIT TEHRAN.', win: [16, 20], done: () => save.wellness.gym === today(), go: openGym });
    L.push({ k: 'hair', ico: '💇‍♀️', name: 'Shower, then Maman dries her hair', desc: 'Don’t let Maman burn her!', win: [19, 23], done: () => save.wellness.hair === today(), go: openHair });
    L.push({ k: 'bed', ico: '🌙', name: 'Rock Simba to sleep', desc: 'He only sleeps in Nena’s arms.', win: [20, 24], done: () => save.wellness.bed === today(), go: openBed });
    return L.filter((r) => unlocked({ hair: 'zen' }[r.k] || r.k));
  }
  const routineNow = () => { const h = new Date().getHours(); return routine().filter((r) => !r.done() && h >= r.win[0] && h < r.win[1]).length ? '!' : ''; };


  /* ---- the hourly loop: Simba's surprise (one per hour, piles up to 3, never lost),
     a different little moment of family life every hour, and two golden hours a day ---- */
  const HOUR = 3600000;
  const hourKey = () => today() + '-' + new Date().getHours();
  function giftState() {
    const g = save.gift || (save.gift = { n: 1, next: Date.now() + HOUR });
    while (g.n < 3 && Date.now() >= g.next) { g.n++; g.next += HOUR; }
    if (g.n >= 3) g.next = Date.now() + HOUR;
    return g;
  }
  const giftMin = () => Math.max(1, Math.ceil((giftState().next - Date.now()) / 60000));
  const GIFTS = [[40, 'coins', 20], [20, 'coins', 45], [15, 'boost'], [10, 'spin'], [10, 'sticker'], [5, 'xp', 30]];
  function openGift() {
    const g = giftState();
    if (g.n <= 0) { snd('click'); toast(`🐾 Simba is preparing the next surprise… ready in ${giftMin()} min`, '', 1800); return; }
    $('gf-pic').innerHTML = A.portrait('simba', 'happy');
    $('gf-say').textContent = pick(['Simba drops three boxes at Nena’s feet. Pick one!', 'Woof! Simba found surprises under the sofa. Which one?', 'Simba wags his tail proudly. Choose a box!']);
    $('gf-boxes').innerHTML = [0, 1, 2].map((i) => `<button type="button" class="gf-box" data-i="${i}" style="animation-delay:${i * 0.12}s">🎁</button>`).join('');
    $('gf-res').textContent = ''; $('gf-ok').hidden = true;
    $('gift').hidden = false; snd('happy'); haptic('tap');
  }
  function pickGift(btn) {
    const g = giftState(); if (g.n <= 0 || $('gf-boxes').classList.contains('done')) return;
    if (g.n >= 3) g.next = Date.now() + HOUR;
    g.n--;
    let r = Math.random() * 100, it = GIFTS[0];
    for (const x of GIFTS) { if ((r -= x[0]) < 0) { it = x; break; } }
    let txt = '';
    if (it[1] === 'coins') { save.coins += it[2]; txt = `+${it[2]} 🪙`; }
    else if (it[1] === 'boost') { const b = pick(BOOSTERS); save.freeB[b.id] = (save.freeB[b.id] || 0) + 1; txt = `${b.icon} Free ${b.name}`; }
    else if (it[1] === 'spin') { save.wheel.extra = (save.wheel.extra || 0) + 1; txt = '🎡 Free wheel spin'; }
    else if (it[1] === 'sticker') { const [s] = dropStickers(1); txt = `${s.ico} Sticker: ${s.name}${s.dup ? ' (+5 🪙)' : ''}`; }
    else { gainXP(it[2]); txt = `⭐ +${it[2]} XP`; }
    track('gift'); persist(); checkAch();
    $('gf-boxes').classList.add('done');
    btn.classList.add('open'); btn.textContent = '✨';
    $('gf-res').textContent = txt; snd('coin'); setTimeout(() => snd('success'), 120); haptic('star'); confettiOn($('gift'));
    $('gf-ok').hidden = false; $('gf-ok').textContent = g.n > 0 ? `Open the next one (${g.n}) 🎁` : `Yay! Next surprise in ${giftMin()} min`;
  }
  const MOM_NIGHT = [['🌙', 'simba', 'Night', 'It’s late — Nena and Simba are asleep. Tiptoe and leave a treat by his bed. See you in the morning ☾', 'hold']];
  const MOMENTS = {
    6: ['🌅', 'simba', 'Wake-up licks', 'Simba jumps on the bed and licks Nena’s face! Pet him good morning.', 'tap', 12],
    7: ['🍵', 'fariba', 'Morning chai', 'Maman: “Nena jan, bring Baba his chai — the way he likes it.”', 'pick', [['🍵', 'Chai + sugar cube', 1], ['☕', 'Coffee', 0], ['🧃', 'Juice', 0]]],
    8: ['👓', 'mohsen', 'Baba’s glasses', 'Baba: “Where are my glasses?!” Where could they be…?', 'pick', [['🙆‍♂️', 'On his head', 1], ['🛋️', 'In the sofa', 0], ['🧊', 'In the fridge', 0]]],
    9: ['🦮', 'simba', 'Morning walk', 'Simba sits by the door and wiggles. What does he want?', 'pick', [['🦮', 'His leash', 1], ['🧶', 'Wool', 0], ['🪥', 'A toothbrush', 0]]],
    10: ['😴', 'negin', 'Wake Negin', 'Negin is still asleep… wake her up gently!', 'tap', 10],
    11: ['🫓', 'nena', 'Hot sangak', 'Fresh sangak from the bakery — blow on it before it burns your fingers!', 'tap', 12],
    12: ['🍲', 'fariba', 'Ghormeh sabzi', 'Maman: “Stir the pot slowly while I chop the herbs.”', 'hold'],
    13: ['🐾', 'simba', 'Siesta', 'Simba naps on the cool tiles. Stroke him softly.', 'hold'],
    14: ['📦', 'mohsen', 'The postman', 'Ding-dong! A package for Baba. What do you need to sign?', 'pick', [['🖊️', 'A pen', 1], ['🥄', 'A spoon', 0], ['🍌', 'A banana', 0]]],
    15: ['😤', 'nasim', 'Grumpy Nasim', 'Nasim is in a mood. What will cheer her up?', 'pick', [['🍫', 'Chocolate', 1], ['🧹', 'A broom', 0], ['📚', 'Homework', 0]]],
    16: ['🌺', 'fariba', 'Balcony flowers', 'Maman’s geraniums on the balcony are thirsty. Water them gently.', 'hold'],
    17: ['🫖', 'mohsen', 'Five o’clock tea', 'Baba: “Five o’clock! Tea and…?”', 'pick', [['🌴', 'Dates', 1], ['🧂', 'Salt', 0], ['🌶️', 'Chili', 0]]],
    18: ['🐈', 'simba', 'The neighbour’s cat', 'Simba spotted the cat on the wall! Hold him and calm him down.', 'hold'],
    19: ['🤳', 'simba', 'Selfie time', 'Negin wants a selfie with Simba. Tap to make him look at the camera!', 'tap', 8],
    20: ['🍽️', 'fariba', 'Dinner table', 'Maman: “Help me set the table — what’s missing?”', 'pick', [['🌿', 'Sabzi khordan', 1], ['🧦', 'A sock', 0], ['🔨', 'A hammer', 0]]],
    21: ['🤗', 'simba', 'Cuddle time', 'Simba puts his big fluffy head on Nena’s lap. Cuddles!', 'hold'],
    22: ['📖', 'nena', 'Story time', 'Nena reads on the sofa while Simba yawns. Turn the pages!', 'tap', 8],
    23: ['🛏️', 'simba', 'Lights off', 'Simba curls up next to Nena… hold to dim the lights.', 'hold'],
  };
  const momentNow = () => MOMENTS[new Date().getHours()] || MOM_NIGHT[0];
  const MOM_FR = { simba: 'simba', mohsen: 'baba', fariba: 'fariba', negin: 'negin', nasim: 'nasim' };
  let MO = null;
  function openMoment(custom) {
    if (!custom && save.moment === hourKey()) { toast(`✓ Already lived this hour. Next moment in ${60 - new Date().getMinutes()} min`, '', 1600); return; }
    const m = custom ? custom.m : momentNow(); MO = { m, t: 0, n: 0, miss: 0, got: 0, done: false, custom };
    $('mo-head').innerHTML = `<span>${m[0]}</span><b>${m[2]}</b><small>${custom ? custom.tag : String(new Date().getHours()).padStart(2, '0') + ':00'}</small>`;
    $('mo-pic').innerHTML = A.portrait(m[1], 'happy'); $('mo-pic').className = 'mo-pic' + (m[4] === 'tap' ? ' tappable' : '');
    $('mo-say').textContent = m[3]; $('mo-ok').hidden = true; $('mo-res').textContent = '';
    if (m[4] === 'pick' || m[4] === 'multi') $('mo-play').innerHTML = `${m[4] === 'multi' ? `<p class="mo-cnt" id="mo-cnt">0/${m[5].filter((o) => o[2]).length}</p>` : ''}<div class="mo-picks${m[4] === 'multi' ? ' multi' : ''}">${m[5].map((o, i) => `<button type="button" class="mo-pick" data-i="${i}"><span>${o[0]}</span><small>${o[1]}</small></button>`).join('')}</div>`;
    else if (m[4] === 'hold') $('mo-play').innerHTML = `<button type="button" class="mo-hold" id="mo-hold"><i id="mo-holdf"></i><span>Hold 💗</span></button>`;
    else $('mo-play').innerHTML = `<p class="mo-cnt" id="mo-cnt">Tap the picture! 0/${m[5]}</p><div class="mo-bar"><i id="mo-bar"></i></div>`;
    $('moment').hidden = false; snd('chime');
    if (m[4] === 'tap') { const t0 = performance.now(); MO.iv = setInterval(() => { if (!MO || MO.done) return clearInterval(MO && MO.iv); const left = 7 - (performance.now() - t0) / 1000; $('mo-bar').style.width = Math.max(0, left / 7 * 100) + '%'; if (left <= 0) { clearInterval(MO.iv); momentDone(MO.n >= MO.m[5] * 0.6); } }, 100); }
  }
  function momentTap() {
    if (!MO || MO.done || MO.m[4] !== 'tap') return;
    MO.n++; snd('pop'); haptic('tap');
    const p = $('mo-pic'); p.classList.remove('squish'); void p.offsetWidth; p.classList.add('squish');
    const h = document.createElement('i'); h.className = 'mo-heart'; h.textContent = pick(['❤️', '💕', '✨', '💖']); h.style.left = (20 + Math.random() * 60) + '%'; p.appendChild(h); setTimeout(() => h.remove(), 900);
    $('mo-cnt').textContent = `Tap the picture! ${Math.min(MO.n, MO.m[5])}/${MO.m[5]}`;
    if (MO.n >= MO.m[5]) { clearInterval(MO.iv); momentDone(true); }
  }
  function momentDone(ok) {
    if (!MO || MO.done) return; MO.done = true;
    if (MO.custom) {
      snd(ok ? 'win' : 'pop'); haptic(ok ? 'star' : 'deliver'); if (ok) confettiOn($('moment'));
      $('mo-res').textContent = MO.custom.done(ok); $('mo-ok').hidden = false; $('mo-ok').textContent = 'Back'; return;
    }
    const coins = ok ? 15 : 6;
    save.moment = hourKey(); save.coins += coins; gainXP(ok ? 8 : 3);
    save.momHours = save.momHours || {}; save.momHours[new Date().getHours()] = 1;
    const f = MOM_FR[MO.m[1]]; if (f && ok) save.friend[f] = (save.friend[f] || 0) + 1;
    track('moment'); persist(); checkAch();
    snd(ok ? 'win' : 'pop'); haptic(ok ? 'star' : 'deliver'); if (ok) confettiOn($('moment'));
    $('mo-res').textContent = ok ? `Lovely! +${coins} 🪙${f ? ' · ❤️ +1' : ''}` : `Nice try! +${coins} 🪙`;
    $('mo-ok').hidden = false; $('mo-ok').textContent = `Next moment at ${String((new Date().getHours() + 1) % 24).padStart(2, '0')}:00 ✓`;
  }
  const GOLD = [[13, 14], [20, 21]];
  const goldenNow = () => { const h = new Date().getHours(); return unlocked('golden') && GOLD.some(([a, b]) => h >= a && h < b); };
  const nextGold = () => { const h = new Date().getHours(); const g = GOLD.find(([a]) => a > h) || GOLD[0]; return `${g[0]}:00`; };
  function renderNow() {
    const w = weather(), P = dayPhase(), EV = unlocked('event') ? activeEvent() : null;
    $('screen-map').dataset.ev = EV ? EV.id : '';
    let html = (EV ? `<button type="button" class="ev-banner ev-${EV.id}" data-evb="1"><span class="ev-garl">${EV.def.deco}</span><b>${EV.def.ico} ${EV.def.name}${EV.preview ? ' (preview)' : ''}</b><em>${evState() ? evState().tok + ' ' + EV.def.tok : 'Open ›'}</em></button>` : '') + `<div class="m-chips"><span>${P.ico} ${P.name} · ${persianDate()}</span><span>${w.ico} ${w.temp}°C</span>${unlocked('golden') ? (goldenNow() ? '<span class="gold on">✨ Coins ×2 now!</span>' : `<span class="gold">✨ ×2 at ${nextGold()}</span>`) : ''}</div>`;
    if (unlocked('moment')) {
      const m = momentNow();
      html += save.moment === hourKey()
        ? `<div class="mo-banner done">✓ ${m[2]} · next moment in ${60 - new Date().getMinutes()} min</div>`
        : `<button type="button" class="mo-banner" data-mo="1"><span class="mo-i">${m[0]}</span><span class="mo-t"><small>Now in the house · ${String(new Date().getHours()).padStart(2, '0')}:00</small><b>${m[2]}</b></span><em>Go ›</em></button>`;
    }
    $('m-now').innerHTML = html;
  }
  setInterval(() => { if (!$('screen-map').hidden) { renderNow(); renderHub(); } }, 30000);

  /* ---- Persian festivals: Shab-e Yalda, Chaharshanbe Souri, Nowruz ---- */
  const EVENTS = {
    yalda: { name: 'Shab-e Yalda', ico: '🍉', tok: '🍉', tokName: 'watermelon slices', outfit: 'yalda', deco: '🍉 🕯️ 📜 🌰 🍷 🕯️ 🍉 📜 🌰 🕯️',
      desc: 'The longest night of the year: pomegranates, watermelon, nuts, poems of Hafez and the whole family awake until late.',
      act: ['📜', 'fariba', 'Fal-e Hafez', 'Maman opens the Divan of Hafez. Make a wish… hold the book and let Hafez answer!', 'hold'],
      fal: ['Hafez says: a door you thought was closed will open soon. 🌙', 'Hafez says: the friend you are waiting for is thinking of you too. 💌', 'Hafez says: after the longest night comes the sun. ☀️', 'Hafez says: be patient, the sweetest fruit ripens slowly. 🍉', 'Hafez says: your heart already knows the answer. ❤️'] },
    souri: { name: 'Chaharshanbe Souri', ico: '🔥', tok: '🔥', tokName: 'sparks', outfit: 'souri', deco: '🏮 ✨ 🔥 🎇 🏮 ✨ 🔥 🎇 🏮',
      desc: 'The last Tuesday night before Nowruz: little bonfires in the street, sparklers, and everyone jumps over the fire.',
      act: ['🔥', 'negin', 'Jump over the fire!', 'Negin: “Zardi-ye man az to, sorkhi-ye to az man!” Tap fast to jump over every bonfire!', 'tap', 9] },
    nowruz: { name: 'Nowruz', ico: '🌱', tok: '🌱', tokName: 'sabzeh sprouts', outfit: 'nowruz', deco: '🌷 🐟 🌱 🪞 🥚 🌷 🐟 🌱 🪞 🥚',
      desc: 'Persian New Year: spring cleaning, the haft-sin table, goldfish, family visits and the Sizdah Bedar picnic.',
      act: ['🌱', 'fariba', 'Set the haft-sin', 'Maman: “Help me set the haft-sin — find the seven S things!”', 'multi', [['🌱', 'Sabzeh', 1], ['🍮', 'Samanu', 1], ['🫒', 'Senjed', 1], ['🧄', 'Seer', 1], ['🍎', 'Sib', 1], ['🥣', 'Somāq', 1], ['🫙', 'Serkeh', 1], ['🍕', 'Pizza', 0], ['🧦', 'A sock', 0], ['📱', 'A phone', 0]]] },
  };
  const EV_MS = [[10, 'coins', 100], [25, 'sticker', 2], [45, 'outfit'], [70, 'coins', 300]];
  const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  function evWindows(y) {
    const nr = new Date(y, 2, 20), tue = new Date(nr);
    do tue.setDate(tue.getDate() - 1); while (tue.getDay() !== 2);
    return [{ id: 'souri', start: addD(tue, -6), end: addD(tue, 2) }, { id: 'nowruz', start: nr, end: addD(nr, 14) }, { id: 'yalda', start: new Date(y, 11, 14), end: new Date(y, 11, 23) }];
  }
  let EV_PREVIEW = null;
  function activeEvent() {
    if (EV_PREVIEW) return { id: EV_PREVIEW, def: EVENTS[EV_PREVIEW], preview: true, end: addD(new Date(), 1), key: 'preview' };
    const now = new Date();
    for (const w of evWindows(now.getFullYear())) if (now >= w.start && now < w.end) return { id: w.id, def: EVENTS[w.id], start: w.start, end: w.end, key: w.id + '-' + w.start.getFullYear() };
    return null;
  }
  function eventList() {
    const now = new Date(), y = now.getFullYear();
    const all = evWindows(y).concat(evWindows(y + 1)).filter((w) => w.end > now).sort((a, b) => a.start - b.start);
    const seen = new Set(); return all.filter((w) => !seen.has(w.id) && seen.add(w.id));
  }
  const daysTo = (d) => Math.max(0, Math.ceil((d - new Date()) / 86400000));
  function evState() {
    const E = activeEvent(); if (!E || E.preview) return null;
    if (!save.ev || save.ev.key !== E.key) save.ev = { key: E.key, tok: 0, got: {}, act: '' };
    return save.ev;
  }
  function evGain(n) { const s = evState(); if (!s || n <= 0) return 0; s.tok += n; persist(); return n; }
  function evClaim(i) {
    const s = evState(), E = activeEvent(); if (!s || s.got[i] || s.tok < EV_MS[i][0]) return;
    const [, k, v] = EV_MS[i]; s.got[i] = 1;
    if (k === 'coins') save.coins += v; else if (k === 'sticker') dropStickers(v); else { save.owned[E.def.outfit] = 1; toast(`👗 New outfit unlocked: ${OUTFIT_SHOP.find((o) => o.id === E.def.outfit).name}!`, 'combo', 2000); }
    if (i === EV_MS.length - 1) track('eventDone');
    persist(); checkAch(); snd('fanfare'); haptic('star');
  }
  function openEventAct() {
    const E = activeEvent(); if (!E) return;
    const s = evState(), first = s && s.act !== today();
    renderMap();
    openMoment({ m: E.def.act, tag: E.preview ? 'Preview' : E.def.name, back: 'event', done: (ok) => {
      const fal = E.id === 'yalda' ? pick(E.def.fal) + ' ' : '';
      if (E.preview) return fal + 'Preview — the real event gives ' + E.def.tok + ' and rewards!';
      if (!first) return fal + 'Already done today — come back tomorrow!';
      s.act = today(); const n = evGain(ok ? 12 : 6); save.coins += 10; track('event'); persist(); checkAch();
      return `${fal}+${n} ${E.def.tok} · +10 🪙`;
    } });
  }
  function eventDeco() {
    const E = activeEvent(), w = $('stage-wrap'); w.querySelectorAll('.ev-garland').forEach((e) => e.remove());
    w.dataset.ev = E ? E.id : '';
    if (E) w.insertAdjacentHTML('beforeend', `<div class="ev-garland" aria-hidden="true">${E.def.deco}</div>`);
  }

  /* ---- a little mystery at the end of every day, solved the next morning ---- */
  const MYST = {
    1: { q: 'Last night, the leftover tahdig disappeared from the kitchen… Who ate it?', sus: [['simba', 'Simba'], ['negin', 'Negin'], ['mohsen', 'Baba']], a: 1, rev: ['negin', 'sleepy', 'Okay, okay… it was me. Midnight tahdig is the best tahdig. 🍚'] },
    2: { q: 'Something keeps buzzing inside the sofa…', sus: [['mohsen', 'Baba’s phone'], ['simba', 'Simba’s toy'], ['nasim', 'Nasim’s alarm']], a: 0, rev: ['mohsen', 'surprised', 'My phone! I looked for it all day… in the sofa, of course.'] },
    3: { q: 'Simba stares at the balcony for hours. What is out there?', sus: [['simba', 'A cat'], ['fariba', 'A pigeon'], ['pourya', 'Pourya']], a: 1, rev: ['fariba', 'happy', 'A pigeon built a nest in my geraniums! We have babies on the balcony. 🐣'] },
    4: { q: 'Maman’s saffron box is empty!', sus: [['nasim', 'Nasim'], ['simba', 'Simba'], ['fariba', 'Maman herself']], a: 2, rev: ['fariba', 'happy', 'It was me! I made sholeh zard for the whole building. Oops. 😅'] },
    5: { q: 'A mysterious package arrived with Nena’s name on it…', sus: [['courier', 'Jesus'], ['negin', 'Negin'], ['mohsen', 'Baba']], a: 0, rev: ['nena', 'surprised', 'It’s from Jesus. AGAIN. Another teddy bear… What do I do with him?! 🙄'] },
    6: { q: 'The TV remote vanished. Baba is panicking.', sus: [['simba', 'Simba'], ['nasim', 'Nasim'], ['negin', 'Negin']], a: 0, rev: ['simba', 'happy', '*proudly digs the remote out of his bed* Woof!'] },
    7: { q: 'Strange footsteps on the roof last night…', sus: [['simba', 'The neighbour’s cat'], ['pourya', 'A burglar'], ['mohsen', 'Baba sleepwalking']], a: 0, rev: ['mohsen', 'happy', 'The neighbour’s cat and all his friends. A cat party on our roof! 🐈'] },
    8: { q: 'Negin whispers on the phone and hides when Nena comes in…', sus: [['negin', 'A secret boyfriend'], ['fariba', 'A surprise for Nena'], ['pourya', 'Ordering pizza']], a: 1, rev: ['negin', 'happy', 'Shhh! It’s a surprise for you… you’ll see. 🤫'] },
    9: { q: 'Baba came home with a HUGE box…', sus: [['mohsen', 'A new TV'], ['fariba', 'A samovar'], ['simba', 'A bed for Simba']], a: 2, rev: ['mohsen', 'happy', 'A royal bed for our lion! …But Simba still sleeps in Nena’s arms. 🙄'] },
    10: { q: 'Nasim smiled today. Nobody knows why.', sus: [['nasim', 'A good grade'], ['simba', 'Simba licked her'], ['negin', 'Chocolate']], a: 0, rev: ['nasim', 'happy', 'I got 20/20 in maths. Don’t make a big deal of it. …Okay, you can clap.'] },
    11: { q: 'CLAP’s door says “Closed tonight”?!', sus: [['pourya', 'Pourya is sick'], ['negin', 'A secret party'], ['mohsen', 'New furniture']], a: 1, rev: ['pourya', 'happy', 'Closed for a private party… and you’ll soon find out who it’s for. 😏'] },
    12: { q: 'Someone left red roses at the door…', sus: [['courier', 'Jesus'], ['mohsen', 'Baba'], ['pourya', 'Pourya']], a: 1, rev: ['mohsen', 'happy', 'For Maman! It’s our anniversary. Don’t tell her I almost forgot.'] },
    13: { q: 'Simba’s collar is missing!', sus: [['simba', 'Simba ate it'], ['negin', 'Negin took it'], ['nasim', 'Nasim hid it']], a: 1, rev: ['negin', 'happy', 'I was embroidering his name on a new one! Look: “SIMBA” in gold. ✨'] },
    14: { q: 'Everyone acts strange around Nena… even Simba.', sus: [['fariba', 'They’re angry'], ['pourya', 'A surprise party'], ['mohsen', 'They forgot something']], a: 1, rev: ['pourya', 'happy', 'SURPRISE! The party at CLAP was for YOU, Nena! 🎉'] },
  };
  save.myst = save.myst || { seen: {}, guess: {}, done: {} };
  function renderMyst(n) {
    const M = MYST[n], el = $('r-myst'); if (!M) { el.hidden = true; return; }
    save.myst.seen[n] = 1; persist();
    const g = save.myst.guess[n];
    el.innerHTML = `<b>🔍 Mystery · ${M.q}</b>` + (g == null
      ? `<small>Who do you think? The answer tomorrow morning (right guess: +25 🪙)</small><div class="my-sus">${M.sus.map(([w, l], i) => `<button type="button" data-g="${i}"><span>${A.portrait(w, 'neutral')}</span><small>${l}</small></button>`).join('')}</div>`
      : `<small>Your guess: <b>${M.sus[g][1]}</b>. To be continued tomorrow…</small>`);
    el.hidden = false;
  }

  /* ---- daily chores mini-games: breakfast (orders), groceries (memory), laundry (pairs) ---- */
  const BF_ITEMS = { bread: ['🫓', 'Sangak'], panir: ['🧀', 'Panir'], walnut: ['🌰', 'Walnuts'], honey: ['🍯', 'Honey'], butter: ['🧈', 'Butter'], egg: ['🍳', 'Fried egg'], tomato: ['🍅', 'Tomato'], cucumber: ['🥒', 'Cucumber'], sabzi: ['🌿', 'Sabzi'], tea: ['🍵', 'Chai'], jam: ['🍓', 'Morabba'], haleem: ['🥣', 'Haleem'] };
  const BF_WHO = [
    ['baba', 'mohsen', 'Baba', ['bread', 'panir', 'walnut', 'tea', 'egg', 'haleem'], 'Nena jan, for me:'],
    ['fariba', 'fariba', 'Maman', ['bread', 'butter', 'jam', 'tea', 'cucumber', 'sabzi'], 'Azizam, I’d like'],
    ['negin', 'negin', 'Negin', ['honey', 'butter', 'bread', 'tea', 'jam', 'egg'], '*yawns* just give me'],
    ['nasim', 'nasim', 'Nasim', ['egg', 'tomato', 'cucumber', 'bread', 'tea', 'panir'], 'Hmph. Without talking to me, just give me'],
  ];
  const GR_ITEMS = { milk: ['🥛', 'Milk'], eggs: ['🥚', 'Eggs'], rice: ['🍚', 'Rice'], onion: ['🧅', 'Onions'], tomato: ['🍅', 'Tomatoes'], potato: ['🥔', 'Potatoes'], lime: ['🍋', 'Limes'], tea: ['🫖', 'Tea leaves'], lavash: ['🫓', 'Lavash'], cheese: ['🧀', 'Cheese'], paste: ['🥫', 'Tomato paste'], chicken: ['🍗', 'Chicken'] };
  const sockSvg = (c) => `<svg viewBox="0 0 40 48" class="sock"><path d="M12 2h16v22l8 10a7 7 0 0 1-2 10l-2 1a7 7 0 0 1-9-2L12 31Z" fill="${c}" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/><rect x="12" y="2" width="16" height="6" fill="#fff" opacity=".8"/><rect x="12" y="10" width="16" height="2.5" fill="#fff" opacity=".55"/></svg>`;
  const SOCKS = ['#e8577f', '#4f8fe0', '#f2c230', '#5bbf8a', '#9b6ad6', '#f08a3c', '#2b2b30', '#c9b28a'];
  const LIFE = {
    breakfast: { title: '🍳 Family breakfast', rounds: 4, time: 50, friend: 'baba', who: 'fariba', intro: 'Maman: “Breakfast is on the kitchen table! Nena jan, serve everyone what they ask for.”' },
    grocery: { title: '🛒 Agha Reza’s shop', rounds: 3, time: 55, friend: 'fariba', who: 'fariba', intro: 'Maman: “Nena jan, go to Agha Reza’s and buy what I tell you. Don’t forget anything!”' },
    laundry: { title: '🧺 Laundry day', rounds: 2, time: 45, friend: 'fariba', who: 'fariba', intro: 'Maman: “The washing machine is done! Pair the socks and hang them, please.”' },
  };
  let LF = null, lfTimer = 0;
  function lfSay(who, t) { $('lf-who').innerHTML = A.portrait(who, 'happy'); const e = $('lf-say'); e.textContent = t; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); }
  function openLife(k) {
    clearInterval(lfTimer);
    const C = LIFE[k], w = weather();
    LF = { k, C, round: -1, mistakes: 0, t: C.time, run: false, sel: null, phase: 'intro' };
    $('screen-life').className = 'screen life lf-' + k;
    $('lf-title').textContent = C.title; $('lf-list').innerHTML = ''; $('lf-grid').innerHTML = ''; $('lf-round').textContent = ''; $('lf-time').textContent = '';
    let intro = C.intro;
    if (k === 'laundry' && (w.k === 'rain' || w.k === 'snow')) intro += ` (It’s ${w.name.toLowerCase()} — we’ll hang it inside by the heater.)`;
    if (k === 'grocery' && w.k === 'smog') intro += ' Take a mask, the air is bad today.';
    lfSay(C.who === 'fariba' ? 'fariba' : C.who, intro);
    const r = routine().find((x) => x.k === k), h = new Date().getHours();
    LF.onTime = r && h >= r.win[0] && h < r.win[1];
    $('lf-info').textContent = save.life[k] === today() ? 'Already done today ✓ (practice)' : LF.onTime ? 'Right on time! Coins ×1.5' : 'Reward: coins, XP and friendship';
    $('lf-btn').hidden = false; $('lf-btn').textContent = 'Start'; $('lf-btn').dataset.mode = 'start';
    show('screen-life'); music('home');
  }
  function lfStart() {
    LF.run = true; $('lf-btn').hidden = true; lfNext();
    clearInterval(lfTimer);
    lfTimer = setInterval(() => {
      if (!LF || !LF.run || $('screen-life').hidden) return;
      LF.t -= 0.25; $('lf-time').textContent = `⏱ ${Math.max(0, Math.ceil(LF.t))}s`; $('lf-time').classList.toggle('low', LF.t <= 10);
      if (LF.t <= 0) lfEnd(false);
    }, 250);
  }
  const shuf = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  function lfNext() {
    LF.round++;
    if (LF.round >= LF.C.rounds) { lfEnd(true); return; }
    $('lf-round').textContent = `Round ${LF.round + 1}/${LF.C.rounds}`;
    const k = LF.k;
    if (k === 'breakfast') {
      const [id, art, name, fav, pre] = BF_WHO[LF.round % BF_WHO.length], n = LF.round < 2 ? 3 : 4;
      LF.want = shuf(fav).slice(0, n); LF.got = [];
      lfSay(art, `${name}: ${pre} ${LF.want.map((x) => BF_ITEMS[x][1].toLowerCase()).join(', ')}!`);
      $('lf-list').innerHTML = LF.want.map((x) => `<span class="lf-chip" data-k="${x}">${BF_ITEMS[x][0]} ${BF_ITEMS[x][1]}</span>`).join('');
      lfGrid(shuf(Object.keys(BF_ITEMS)).map((x) => [x, BF_ITEMS[x][0], BF_ITEMS[x][1]]));
      LF.phase = 'pick'; LF.who = id;
    } else if (k === 'grocery') {
      const n = 3 + LF.round; LF.want = shuf(Object.keys(GR_ITEMS)).slice(0, n); LF.got = [];
      lfSay('fariba', `Maman’s list (${n} things) — memorize it!`);
      $('lf-list').innerHTML = LF.want.map((x) => `<span class="lf-chip" data-k="${x}">${GR_ITEMS[x][0]} ${GR_ITEMS[x][1]}</span>`).join('');
      lfGrid(shuf(Object.keys(GR_ITEMS)).map((x) => [x, GR_ITEMS[x][0], GR_ITEMS[x][1]]));
      $('lf-grid').classList.add('wait'); LF.phase = 'memo';
      const show = 2.6 + n * 0.5;
      setTimeout(() => {
        if (!LF || LF.phase !== 'memo') return;
        [...$('lf-list').children].forEach((c) => { c.classList.add('hid'); c.textContent = '❓'; });
        $('lf-grid').classList.remove('wait'); LF.phase = 'pick';
        lfSay('fariba', LF.round === 0 ? 'Agha Reza: “Salam Nena khanum! What does Maman need today?”' : pick(['Agha Reza: “Back again? Say salam to Maman!”', 'Agha Reza: “Fresh bread just arrived!”', 'Agha Reza: “Take your time, azizam.”']));
      }, show * 1000);
    } else {
      const n = LF.round === 0 ? 6 : 8, cols = shuf(SOCKS).slice(0, n);
      LF.left = n; LF.sel = null;
      $('lf-list').innerHTML = '<span class="lf-line"></span>';
      lfGrid(shuf(cols.concat(cols)).map((c) => [c, sockSvg(c), '']));
      lfSay('fariba', LF.round === 0 ? 'Find the matching pairs. Two socks of the same colour!' : 'More socks! Where do they all come from? 😅');
      LF.phase = 'pick';
    }
  }
  function lfGrid(items) {
    $('lf-grid').className = 'lf-grid' + (items.length > 12 ? ' dense' : '');
    $('lf-grid').innerHTML = items.map(([k, ico, name]) => `<button type="button" class="lf-tile" data-k="${k}"><span>${ico}</span>${name ? `<small>${name}</small>` : ''}</button>`).join('');
  }
  function lfTap(tile) {
    if (!LF || !LF.run || LF.phase !== 'pick' || tile.disabled) return;
    const k = tile.dataset.k;
    const bad = () => { LF.mistakes++; snd('fail'); buzz(30); tile.classList.remove('no'); void tile.offsetWidth; tile.classList.add('no'); };
    if (LF.k === 'laundry') {
      if (!LF.sel) { LF.sel = tile; tile.classList.add('sel'); snd('click'); return; }
      if (LF.sel === tile) { tile.classList.remove('sel'); LF.sel = null; return; }
      const a = LF.sel; LF.sel = null; a.classList.remove('sel');
      if (a.dataset.k === k) {
        snd('pop'); [a, tile].forEach((t) => { t.disabled = true; t.classList.add('ok'); });
        $('lf-list').insertAdjacentHTML('beforeend', `<span class="lf-peg">${sockSvg(k)}</span>`);
        if (--LF.left === 0) { snd('success'); LF.phase = 'wait'; setTimeout(() => LF && lfNext(), 700); }
      } else { bad(); a.classList.remove('no'); void a.offsetWidth; a.classList.add('no'); }
      return;
    }
    const i = LF.want.indexOf(k);
    if (i < 0 || LF.got.includes(k)) { bad(); if (LF.k === 'breakfast') lfSay(BF_WHO[LF.round % BF_WHO.length][1], pick(['No no, I didn’t ask for that!', 'Hmm? That’s not mine.', 'Nena, wake up! 😅'])); return; }
    LF.got.push(k); snd('pop'); tile.disabled = true; tile.classList.add('ok');
    const chip = $('lf-list').querySelector(`[data-k="${k}"]`); if (chip) { chip.classList.add('done'); chip.classList.remove('hid'); chip.textContent = (LF.k === 'breakfast' ? BF_ITEMS : GR_ITEMS)[k].join(' '); }
    if (LF.got.length === LF.want.length) {
      snd('success'); LF.phase = 'wait';
      if (LF.k === 'breakfast') lfSay(BF_WHO[LF.round % BF_WHO.length][1], pick(['Merci azizam! Noosh-e jan! 😋', 'Perfect, just like a café!', 'Ahh, now the day can start.']));
      else lfSay('fariba', 'Agha Reza: “That’s everything! Khodahafez!”');
      setTimeout(() => LF && lfNext(), 900);
    }
  }
  function lfEnd(ok) {
    if (!LF || !LF.run) return;
    LF.run = false; clearInterval(lfTimer); LF.phase = 'end';
    let stars = ok ? 3 - (LF.mistakes > 5 ? 2 : LF.mistakes > 2 ? 1 : 0) : LF.round >= LF.C.rounds - 1 ? 1 : 0;
    if (ok && LF.t > LF.C.time * 0.4 && LF.mistakes === 0) stars = 3;
    const first = save.life[LF.k] !== today() && stars > 0;
    const coins = first ? Math.round((10 + 10 * stars) * (LF.onTime ? 1.5 : 1)) : 0;
    if (first) { save.life[LF.k] = today(); save.coins += coins; track(LF.k); }
    if (stars) { gainXP(12); save.friend[LF.C.friend] = (save.friend[LF.C.friend] || 0) + stars; }
    track('game'); persist(); checkAch();
    snd(stars >= 2 ? 'win' : 'lose');
    const msg = { breakfast: ['Everyone is full and happy. Simba got a piece of bread too 🐶', 'Breakfast was a bit chaotic… but nobody left hungry.'], grocery: ['Maman: “Afarin! You didn’t forget anything!”', 'Maman: “Hmm… where are the onions? Never mind, azizam.”'], laundry: ['All the socks are hanging. Maman is proud!', 'Some socks are still lost… the washing machine ate them. 🧦'] }[LF.k];
    lfSay('fariba', msg[stars >= 2 ? 0 : 1]);
    $('lf-info').textContent = `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)} · ${first ? `+${coins} 🪙${LF.onTime ? ' (on time ×1.5)' : ''} · ❤️ +${stars}` : stars ? 'Nice practice!' : 'Time’s up — try again!'}`;
    $('lf-btn').hidden = false; $('lf-btn').dataset.mode = stars ? 'done' : 'again'; $('lf-btn').textContent = stars ? 'Back' : 'Try again';
    if (stars === 3) confettiOn($('screen-life'));
  }

  /* ---- bedtime: Simba only sleeps in Nena's arms ---- */
  const BED_BG = `<svg viewBox="0 0 390 520" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="bdw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232750"/><stop offset="1" stop-color="#352f63"/></linearGradient><radialGradient id="bdl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd98a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient></defs>
    <rect width="390" height="520" fill="url(#bdw)"/>
    <rect x="200" y="50" width="150" height="150" rx="10" fill="#0f1433" stroke="#6a5f9c" stroke-width="7"/><circle cx="305" cy="92" r="20" fill="#fff4c8"/><circle cx="314" cy="86" r="18" fill="#0f1433"/>
    <g fill="#fff">${[[222, 70], [250, 110], [338, 140], [270, 64], [232, 132]].map(([x, y]) => `<circle class="bd-star" cx="${x}" cy="${y}" r="1.8"/>`).join('')}</g>
    <path d="M203 197 v-30 h16 v-14 h12 v24 h14 v-34 h10 v-22 l4 -14 4 14 v22 h10 v40 h18 v-18 h14 v32 h20 v-10 h12 V197Z" fill="#1d2147"/>
    <g fill="#ffd36b">${[[224, 175], [250, 165], [262, 150], [290, 180], [314, 172], [336, 185]].map(([x, y]) => `<rect x="${x}" y="${y}" width="3" height="3"/>`).join('')}</g>
    <line x1="275" y1="50" x2="275" y2="200" stroke="#6a5f9c" stroke-width="5"/><line x1="200" y1="125" x2="350" y2="125" stroke="#6a5f9c" stroke-width="5"/>
    <circle cx="70" cy="190" r="90" fill="url(#bdl)"/><rect x="62" y="200" width="16" height="60" fill="#8a6a4a"/><path d="M44 200 h52 l-10 -36 h-32Z" fill="#ffcf7a"/>
    <rect x="0" y="330" width="390" height="190" fill="#2b2650"/><rect x="0" y="326" width="390" height="8" fill="#4b4380"/>
    <rect x="-20" y="250" width="190" height="110" rx="16" fill="#e8dcff"/><rect x="-20" y="280" width="190" height="80" rx="12" fill="#f4a3c0"/><path d="M-20 300 q95 -18 190 0" stroke="#e57fa3" stroke-width="5" fill="none"/><rect x="10" y="256" width="60" height="30" rx="12" fill="#fff"/>
    <g class="bd-basket"><ellipse cx="320" cy="420" rx="58" ry="14" fill="#000" opacity=".25"/><path d="M262 384 q58 -20 116 0 l-10 34 q-48 12 -96 0Z" fill="#c98f4f"/><path d="M270 392 q50 -14 100 0" stroke="#a46f35" stroke-width="4" fill="none"/><ellipse cx="320" cy="384" rx="52" ry="12" fill="#8fd3c3"/></g>
  </svg>`;
  const BED_NOISE = [['📺', 'GOOOAL! Baba is cheering at the TV!'], ['🛵', 'A motorbike roars in the street!'], ['📱', 'Negin’s phone is ringing!'], ['🍳', 'Maman dropped a pan in the kitchen!'], ['🚪', 'Pourya slams the door!']];
  const BASKET_LINES = ['Simba jumps out and runs back to Nena. 🥺', 'Aouuu… Simba whines at the basket.', 'Nope. Simba sits at Nena’s feet and stares.', 'Simba drags the blanket back to Nena. 😂'];
  let BD = null, bdRaf = 0;
  function bdSay(t) { const e = $('bd-say'); e.textContent = t; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); }
  function bdPup(eyes) { $('bd-pup').innerHTML = A.simba({ eyes, tongue: false, collar: save.collar ? undefined : null }); }
  function openBed() {
    cancelAnimationFrame(bdRaf);
    BD = { phase: 'choose', tries: 0, sleep: 0, t: 0, hold: false, noise: null, nextNoise: 6 + Math.random() * 4, missed: 0, eyes: '' };
    $('bd-bg').innerHTML = BED_BG;
    $('bd-nena').innerHTML = A.nena({ dressed: true, outfit: 'night', eyes: 'open' });
    bdPup('open'); BD.eyes = 'open';
    $('bd-pup').className = 'bd-pup roam'; $('bd-pair').classList.remove('rock'); $('bd-zzz').hidden = true;
    $('bd-meter').hidden = true; $('bd-shh').hidden = true; $('bd-ring').hidden = true;
    $('bd-basket').hidden = false; $('bd-btn').hidden = false; $('bd-btn').dataset.mode = 'arms'; $('bd-btn').textContent = '🤗 In Nena’s arms';
    const h = new Date().getHours();
    $('bd-info').textContent = save.wellness.bed === today() ? 'Simba already slept in your arms today ✓ (cuddle again!)' : (h >= 18 || h < 5 ? 'Bedtime! Reward: Simba 15% more patient tomorrow' : 'Nap time! Reward: Simba 15% more patient');
    bdSay(pick(['Simba is yawning… but he won’t lie down. Where will he sleep?', 'Time for bed, Simba! He looks at his basket… then at Nena.']));
    show('screen-bed'); music('zen'); snd('yawn');
  }
  function bdBasket() {
    if (!BD || BD.phase !== 'choose') return;
    BD.tries++; snd('fail'); track('bedtry');
    const p = $('bd-pup'); p.className = 'bd-pup in-basket';
    bdSay('Nena puts Simba in his cosy basket…');
    setTimeout(() => { if (!BD || BD.phase !== 'choose') return; bdPup('open'); p.className = 'bd-pup roam back'; snd('bark'); bdSay(BASKET_LINES[(BD.tries - 1) % BASKET_LINES.length] + ' He only sleeps in Nena’s arms!'); }, 1100);
  }
  function bdArms() {
    if (!BD || BD.phase !== 'choose') return;
    BD.phase = 'rock'; snd('pop');
    $('bd-pup').className = 'bd-pup held'; $('bd-basket').hidden = true;
    $('bd-meter').hidden = false; $('bd-ring').hidden = false;
    $('bd-btn').dataset.mode = 'rock'; $('bd-btn').textContent = 'Hold to rock 🤱';
    bdSay('Hold while the moon grows (breathe in), let go while it shrinks (breathe out).');
    let last = performance.now();
    const tick = (now) => {
      if (!BD || BD.phase !== 'rock' || $('screen-bed').hidden) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now; bdTick(dt);
      bdRaf = requestAnimationFrame(tick);
    };
    bdRaf = requestAnimationFrame(tick);
  }
  function bdTick(dt) {
    const B = BD; B.t += dt;
    const ph = (B.t % 4) / 4, grow = ph < 0.5, sc = 0.62 + 0.38 * (grow ? ph * 2 : 2 - ph * 2);
    $('bd-ring').style.transform = `translateX(-50%) scale(${sc.toFixed(3)})`; $('bd-ring').classList.toggle('in', grow);
    const good = B.hold === grow;
    B.sleep = Math.max(0, Math.min(1, B.sleep + (good ? 0.095 : -0.05) * dt));
    $('bd-pair').classList.toggle('rock', B.hold);
    $('bd-ring').classList.toggle('bad', !good && B.t > 0.6);
    $('bd-fill').style.width = (B.sleep * 100).toFixed(0) + '%';
    const eyes = B.sleep > 0.7 ? 'closed' : B.sleep > 0.35 ? 'both' : 'open';
    if (eyes !== B.eyes) { B.eyes = eyes; bdPup(eyes); }
    if (!B.noise && B.t >= B.nextNoise && B.sleep < 0.95) {
      const [ico, txt] = pick(BED_NOISE); B.noise = { left: 1.8 };
      $('bd-shh').hidden = false; $('bd-shh').innerHTML = `${ico} Shh! 🤫`; bdSay(txt); snd('bell');
    }
    if (B.noise) {
      B.noise.left -= dt;
      if (B.noise.left <= 0) { B.noise = null; B.missed++; B.sleep = Math.max(0, B.sleep - 0.25); $('bd-shh').hidden = true; snd('bark'); bdSay('Woof?! Simba woke up… rock him again.'); B.nextNoise = B.t + 7 + Math.random() * 5; }
    }
    if (B.sleep >= 1) bdEnd(true); else if (B.t >= 50) bdEnd(false);
  }
  function bdShh() {
    if (!BD || !BD.noise) return;
    BD.noise = null; $('bd-shh').hidden = true; snd('chime'); BD.nextNoise = BD.t + 7 + Math.random() * 5;
    bdSay(pick(['Shhh… Nena covers Simba’s ears. 🤫', 'Phew. He didn’t wake up.', 'Nena hums softly… Simba stays asleep.']));
  }
  function bdEnd(ok) {
    BD.phase = 'end'; cancelAnimationFrame(bdRaf);
    $('bd-ring').hidden = true; $('bd-meter').hidden = true; $('bd-shh').hidden = true; $('bd-pair').classList.remove('rock');
    let stars = ok ? (BD.t < 26 ? 3 : BD.t < 36 ? 2 : 1) : (BD.sleep >= 0.6 ? 1 : 0);
    if (ok && BD.missed > 1) stars = Math.max(1, stars - 1);
    const first = save.wellness.bed !== today() && stars > 0, coins = first ? 15 + 10 * stars : 0;
    if (first) { save.wellness.bed = today(); save.wellness.bedN = dayNum(); save.coins += coins; track('bed'); }
    if (stars) { save.friend.simba = (save.friend.simba || 0) + stars; gainXP(15); }
    track('game'); persist(); checkAch();
    if (stars) { bdPup('closed'); $('bd-zzz').hidden = false; $('bd-pair').classList.add('asleep'); snd('win'); }
    bdSay(stars ? pick(['Lala lala, gol-e laleh… 🎶 Simba is fast asleep in Nena’s arms.', 'Simba snores softly against Nena. Good night, little lion. 🌙']) : 'Simba is still wide awake… try again, slower!');
    $('bd-info').textContent = `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)} · ${first ? `Simba slept well: 15% more patient · +${coins} 🪙 · ❤️ +${stars}` : stars ? 'Sweet dreams, Simba!' : 'Try again'}`;
    $('bd-btn').dataset.mode = stars ? 'done' : 'again'; $('bd-btn').textContent = stars ? 'Good night 🌙' : 'Try again';
    $('bd-basket').hidden = true;
    if (stars === 3) confettiOn($('screen-bed'));
  }

  /* ---- custom days: challenge and endless ---- */
  let CUSTOM = null;
  function challengeCfg(c) {
    const base = levelCfg(c.base);
    return Object.assign({}, base, { n: 902, title: '🎯 ' + c.name, challenge: c.id, mod: c.mod, story: [], obj: null, types: base.types.concat(c.mod.addTypes || []).filter((t, i, a) => a.indexOf(t) === i) });
  }
  function endlessCfg() { return Object.assign({}, LEVELS[13], { n: 901, title: '♾️ Endless day', endless: true, dur: 99999, targets: [1500, 3000, 5000], every: [4.6, 6], story: [], obj: null, fur: 8, patience: 1 }); }
  function playCustom(cfg) { CUSTOM = cfg; pendingBoosts = {}; show('screen-game'); startLevel(cfg.n); }

  /* ---- story scenes (chapter endings, friendship) ---- */
  let storyAfter = null, storyTitle = '';
  let storyPlace = null;
  function playScene(lines, title, after, place) { storyLines = lines.slice(); storyAfter = after; storyTitle = title; storyPlace = place || null; show('screen-story'); nextLine(); }

  /* ---- Color Sort screen ---- */
  let sortLv = 0;
  function startSort(i) {
    sortLv = i;
    const L = window.ColorSort.LEVELS[i];
    $('so-title').textContent = `Color Sort · ${L.name}`;
    show('screen-sort');
    window.ColorSort.start({
      seed: dayNum() * 3 + i, level: i, box: $('so-tubes'), sound: (n) => snd(n),
      onMoves: (m) => { $('so-moves').textContent = `${m} moves`; },
      onWin: (m) => {
        if (save.sortd.date !== today()) save.sortd = { date: today(), done: [] };
        const first = !save.sortd.done[i];
        save.sortd.done[i] = true;
        track('game'); gainXP(8); if (first) { save.coins += L.reward; track('sort'); if (save.sortd.done.filter(Boolean).length === 3) track('sort3'); }
        persist(); snd('fanfare'); confettiOn($('screen-sort'));
        toast(first ? `🧪 Solved in ${m} moves! +${L.reward} 🪙` : `🧪 Solved in ${m} moves!`, 'combo', 1800);
        setTimeout(() => openSheet('sort'), 1600);
      },
    });
  }
  function confettiOn(host) {
    const box = document.createElement('div'); box.className = 'confetti'; host.appendChild(box);
    const cols = ['#ef8fb0', '#ffd98a', '#e38c30', '#7fe0b4', '#86aaff', '#ffffff'];
    for (let i = 0; i < 40; i++) { const c = document.createElement('i'); c.style.left = (rnd() * 100) + '%'; c.style.background = cols[i % cols.length]; c.style.animationDelay = (rnd() * 0.5) + 's'; c.style.setProperty('--r', (rnd() * 720 - 360) + 'deg'); box.appendChild(c); }
    setTimeout(() => box.remove(), 3000);
  }

  /* ------------------------------------------------------------------ */
  /* Screens: title, map, story, shop                                    */
  /* ------------------------------------------------------------------ */
  function show(id) {
    const target = $(id), was = target.hidden;
    ['screen-title', 'screen-map', 'screen-game', 'screen-result', 'screen-shop', 'screen-story', 'screen-pause', 'screen-prep', 'screen-sheet', 'screen-sort', 'screen-nails', 'screen-continue', 'screen-tricks', 'screen-tahdig', 'screen-zen', 'screen-hair', 'screen-tree', 'screen-wheel', 'screen-welcome', 'screen-gym', 'screen-bed', 'screen-life'].forEach((s) => { $(s).hidden = s !== id && !(id === 'screen-result' && s === 'screen-game') && !(id === 'screen-pause' && s === 'screen-game') && !(id === 'screen-continue' && s === 'screen-game'); });
    if (was && !target.classList.contains('modal')) { target.classList.remove('scr-in'); void target.offsetWidth; target.classList.add('scr-in'); }
  }
  function renderMap() {
    const total = Object.values(save.stars).reduce((a, b) => a + b, 0);
    $('m-coins').textContent = save.coins;
    renderNow();
    $('m-prog').textContent = `Day ${Math.min(save.level, LEVELS.length)}/${LEVELS.length}`;
    $('m-stars').textContent = total;
    const max = Math.max(save.level + 2, LEVELS.length);
    // winding path: chapter banners, then level nodes zig-zagging down the page
    const ZONES = ['#f6ead6', '#e4f0dc', '#e6def4', '#fbeac2', '#f3e3ea'];
    const DECO = [['🐾', '🦴', '☕', '🧺'], ['🌳', '🫓', '🚙', '🧃'], ['🏮', '🍵', '🎋', '🔮'], ['💍', '🎂', '🎉', '✨'], ['⭐', '🐾', '🏮', '🌳']];
    let y = 20, zone = -1, html = '', pts = [], zones = [], deco = '';
    const xAt = (n) => 50 + Math.sin(n * 1.15) * 27;
    for (let n = 1; n <= max; n++) {
      const cfg = levelCfg(n), locked = n > save.level, st = save.stars[n] || 0;
      const chap = CHAPTERS.find((x) => x.from === n) || (n === LEVELS.length + 1 ? { title: 'Bonus days' } : null);
      if (chap) {
        zone++; zones.push(y);
        html += `<div class="chap-banner z${zone}" style="top:${y}px"><span>${chap.title.replace(' · ', '<br><b>')}</b></span></div>`;
        y += 96;
      }
      const x = xAt(n);
      pts.push([x, y + 34, !locked]);
      const right = x < 50;
      const icon = { home: '🏠', street: '🌳', clap: '🏮' }[cfg.place];
      html += `<button type="button" class="node${locked ? ' locked' : ''}${n === save.level ? ' current' : ''}${st ? ' done' : ''}${cfg.boss ? ' boss' : ''}" data-level="${n}" ${locked ? 'disabled' : ''} style="left:${x}%;top:${y}px">
        <span class="node-n">${locked ? '🔒' : cfg.boss ? '👑' : n}</span><span class="node-s">${[0, 1, 2].map((i) => `<i class="${i < st ? 'on' : ''}">★</i>`).join('')}</span>
        <span class="node-l ${right ? 'r' : 'l'}"><b>${cfg.title}</b><small>${icon} ${cfg.day}${save.medals[n] ? ' · 🏅' : ''}</small></span></button>`;
      if (n === save.level) html += `<div class="me" style="left:${x}%;top:${y - 46}px">${A.nena({ dressed: true, outfit: save.outfit, eyes: 'open' })}</div>`;
      if (n % 2 === 0) deco += `<span class="deco" style="left:${right ? 2 + (n % 3) * 2 : 84 + (n % 3) * 3}%;top:${y + 16}px">${DECO[Math.max(0, zone)][n % 4]}</span>`;
      y += 108;
    }
    const H = y + 20;
    zones.push(H);
    const bands = zones.slice(0, -1).map((top, i) => `<div class="zone" style="top:${top}px;height:${zones[i + 1] - top}px;background:${ZONES[i % ZONES.length]}"></div>`).join('');
    let d = '', dDone = '';
    pts.forEach(([x, py, ok], i) => {
      if (!i) { d = `M${x} ${py}`; dDone = d; return; }
      const [px, ppy] = pts[i - 1], my = (ppy + py) / 2;
      const seg = ` C${px} ${my} ${x} ${my} ${x} ${py}`;
      d += seg; if (ok) dDone += seg;
    });
    html = `<div class="path" style="height:${H}px">${bands}${deco}<svg class="path-line" viewBox="0 0 100 ${H}" preserveAspectRatio="none" style="height:${H}px"><path d="${d}" class="pl-all"/><path d="${dDone}" class="pl-done"/></svg>${html}</div>`;
    $('m-levels').innerHTML = html;
    renderHub();
    music('menu');
    show('screen-map');
    $('m-play').innerHTML = save.level > LEVELS.length ? '♾️ Endless day' : `▶ Play <small>Day ${save.level}</small>`;
    if (checkUnlocks()) { /* the unlock card comes first */ }
    else if (daysDone() >= 1) {
      if (!welcomeChecked) { welcomeChecked = true; if (welcomeBack()) return; }
      if (dailyReady() && !dailyShown) { dailyShown = true; setTimeout(() => openSheet('daily'), 350); }
    }
    const cur = document.querySelector('.node.current');
    if (cur) cur.scrollIntoView({ block: 'center' });
  }
  const PLACE_LABEL = { home: '🏠 Home', street: '🌳 Tehran street', clap: '🏮 CLAP' };
  const NAMES = { leila: 'Leila', courier: 'Delivery', aunt: 'Aunt Mahin', pourya: 'Pourya', nena: 'Nena', simba: 'Simba', mohsen: 'Baba', fariba: 'Maman', nasim: 'Nasim', negin: 'Negin' };
  let storyLines = [], storyLevel = 1;
  function playStory(n) {
    CUSTOM = null; storyAfter = null; storyTitle = ''; storyPlace = null;
    storyLevel = n;
    storyLines = (levelCfg(n).story || []).slice();
    const P = MYST[n - 1];
    if (P && save.myst.seen[n - 1] && !save.myst.done[n - 1]) {
      save.myst.done[n - 1] = 1; const g = save.myst.guess[n - 1], right = g === P.a;
      if (right) { save.coins += 25; track('mystery'); }
      storyLines.unshift(['nena', 'surprised', `🔍 Yesterday’s mystery: “${P.q}”`], P.rev, ['nena', right ? 'happy' : 'neutral', g == null ? 'So that was it!' : right ? 'I knew it! 🕵️‍♀️ (+25 🪙)' : `I thought it was ${P.sus[g][1]}… wrong guess!`]);
      persist(); checkAch();
    }
    show('screen-story');
    nextLine();
  }
  function nextLine() {
    const l = storyLines.shift();
    if (!l) {
      if (storyAfter) { const f = storyAfter; storyAfter = null; storyTitle = ''; f(); }
      else if (storyLevel <= 2 && ((save.losses || {})[storyLevel] || 0) < 2) { save.seen._howto = 1; pendingBoosts = {}; prepPick = {}; show('screen-game'); startLevel(storyLevel); }
      else renderPrep(storyLevel);
      return;
    }
    const [who, mood, text] = l;
    $('s-portrait').innerHTML = A.portrait(who, mood);
    $('s-name').textContent = NAMES[who] || who;
    $('s-text').textContent = text;
    const place = storyPlace || storyTitle ? (storyPlace || (storyTitle.includes('Nail') ? 'bedroom' : 'salon')) : ({ home: 'salon', street: 'street', clap: 'clap' }[levelCfg(storyLevel).place] || 'salon');
    if ($('s-bg').dataset.p !== place) { $('s-bg').dataset.p = place; const c = levelCfg(storyLevel); $('s-bg').innerHTML = `<svg width="0" height="0" style="position:absolute">${RA.defs(c)}</svg>` + RA.ART[place](c); }
    $('s-day').textContent = storyTitle || `Day ${storyLevel} · ${levelCfg(storyLevel).day}`;
    snd('talk', 600);
  }
  let prepPick = {};
  function renderPrep(n) {
    const cfg = levelCfg(n);
    $('pr-title').textContent = `Day ${n} · ${cfg.title}`;
    $('pr-goals').innerHTML = cfg.targets.map((t, i) => `<span>${'★'.repeat(i + 1)} <b>${t}</b></span>`).join('');
    $('pr-obj').innerHTML = cfg.obj ? `🏅 ${cfg.obj.label}${save.medals[n] ? ' <em>(done)</em>' : ' <em>+25 🪙</em>'}` : '';
    const cost = BOOSTERS.reduce((a, b) => a + (prepPick[b.id] ? bCost(b) : 0), 0);
    $('pr-coins').textContent = save.coins - cost;
    $('pr-boosts').innerHTML = BOOSTERS.map((b) => `<button type="button" class="boost${prepPick[b.id] ? ' on' : ''}" data-boost="${b.id}" ${!prepPick[b.id] && save.coins - cost < bCost(b) ? 'disabled' : ''}>
      <span class="b-i">${b.icon}</span><span class="b-t"><b>${b.name}</b><small>${b.desc}</small></span><span class="b-c">${prepPick[b.id] ? '✓' : bCost(b) === 0 ? `Free ×${save.freeB[b.id]}` : b.cost + ' 🪙'}</span></button>`).join('');
    const losses = (save.losses || {})[n] || 0;
    $('pr-easy').hidden = losses < 2;
    $('pr-easy').classList.toggle('on', !!prepPick.easy);
    $('pr-start').dataset.level = String(n);
    show('screen-prep');
  }
  function renderShop() {
    $('sh-coins').textContent = save.coins;
    $('sh-list').innerHTML = UPGRADES.map((u) => {
      const lv = up(u.id), maxed = lv >= u.costs.length, cost = u.costs[lv];
      return `<div class="upg${maxed ? ' maxed' : ''}"><span class="upg-i">${u.icon}</span><div class="upg-t"><b>${u.name}${u.costs.length > 1 ? ` <small>${lv}/${u.costs.length}</small>` : ''}</b><small>${u.desc}</small></div>
        <button type="button" class="btn ${maxed ? '' : 'btn-primary'}" data-buy="${u.id}" ${maxed || save.coins < cost ? 'disabled' : ''}>${maxed ? 'Owned' : cost + ' 🪙'}</button></div>`;
    }).join('');
    show('screen-shop');
  }

  /* ------------------------------------------------------------------ */
  /* Events                                                              */
  /* ------------------------------------------------------------------ */
  function wake() { if (window.Sound) { window.Sound.init(); window.Sound.setEnabled(save.sound !== false); window.Sound.setMusic(save.sound !== false && save.music !== false); } }
  document.addEventListener('pointerdown', function first() { wake(); document.removeEventListener('pointerdown', first); }, { once: true });
  $('stage').addEventListener('pointerdown', onTap);
  window.addEventListener('pointerup', onSwipeEnd);
  $('g-rooms').addEventListener('pointerdown', onTabs);
  ['g-prev', 'g-next'].forEach((id) => $(id).addEventListener('pointerdown', (e) => { e.stopPropagation(); if (!G || G.over || G.paused) return; snd('tab'); G.peekAt = performance.now(); setView(e.currentTarget.dataset.room); }));
  $('g-follow').addEventListener('pointerdown', (e) => { e.stopPropagation(); if (!G || G.over) return; snd('tab'); G.peekAt = 0; setView(G.nena.room); });
  $('btn-play').addEventListener('click', () => { wake(); snd('tab'); if (daysDone() === 0 && save.level <= 1) playStory(1); else renderMap(); });
  $('m-levels').addEventListener('click', (e) => { const b = e.target.closest('[data-level]'); if (b) { snd('click'); playStory(+b.dataset.level); } });
  $('m-shop').addEventListener('click', () => { snd('tab'); renderShop(); });
  $('m-back').addEventListener('click', () => show('screen-title'));
  $('sh-back').addEventListener('click', () => renderMap());
  $('sh-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-buy]'); if (!b) return;
    const u = UPGRADES.find((x) => x.id === b.dataset.buy), lv = up(u.id), cost = u.costs[lv];
    if (cost == null || save.coins < cost) return;
    save.coins -= cost; save.up[u.id] = lv + 1; persist(); snd('coin'); setTimeout(() => snd('success'), 120); renderShop();
  });
  $('screen-story').addEventListener('click', () => { snd('click'); nextLine(); });
  $('pr-boosts').addEventListener('click', (e) => { const b = e.target.closest('[data-boost]'); if (!b || b.disabled) return; prepPick[b.dataset.boost] = !prepPick[b.dataset.boost]; snd('click'); renderPrep(+$('pr-start').dataset.level); });
  $('pr-start').addEventListener('click', () => {
    const n = +$('pr-start').dataset.level;
    save.seen._howto = 1;
    const cost = BOOSTERS.reduce((a, b) => a + (prepPick[b.id] ? bCost(b) : 0), 0);
    if (cost > save.coins) return;
    BOOSTERS.forEach((b) => { if (prepPick[b.id] && (save.freeB[b.id] || 0) > 0) save.freeB[b.id]--; });
    save.coins -= cost; persist();
    pendingBoosts = Object.assign({}, prepPick); prepPick = {};
    show('screen-game'); startLevel(n);
  });
  $('pr-back').addEventListener('click', () => { prepPick = {}; renderMap(); });
  $('t-settings').addEventListener('click', () => { wake(); snd('tab'); openSheet('settings'); });
  $('p-settings').addEventListener('click', () => { snd('tab'); $('screen-pause').hidden = true; sheetBackToPause = true; openSheet('settings'); });
  $('hw-next').addEventListener('click', () => { snd('click'); if (howI < HOWTO.length - 1) { howI++; renderHow(); } else { $('screen-howto').hidden = true; const f = howAfter; howAfter = null; if (f) f(); } });
  $('pr-easy').addEventListener('click', () => { prepPick.easy = !prepPick.easy; snd('click'); $('pr-easy').classList.toggle('on', !!prepPick.easy); });
  $('c-yes').addEventListener('click', () => {
    if (!G || G.over) return;
    const fromRun = Math.min(G.coins, CONT_COST); G.coins -= fromRun; save.coins -= CONT_COST - fromRun; persist();
    G.continued = true; G.hearts = 2; G.maxHearts = Math.max(G.maxHearts, 2); G.freezeT = 4; G.paused = false; last = performance.now();
    show('screen-game'); snd('fanfare'); toast('💗 Second chance! Everyone waits patiently for 4 s', 'hint', 2000);
  });
  $('c-no').addEventListener('click', () => { if (!G || G.over) return; G.paused = false; show('screen-game'); endLevel(true); });
  const afterScene = (fn) => { if (G.pendingScene) { const ch = G.pendingScene; G.pendingScene = null; playScene(ch.end, ch.title, fn, { home: 'salon', street: 'street', clap: 'clap' }[levelCfg(ch.to).place]); } else fn(); };
  $('r-next').addEventListener('click', () => { const n = G.n + 1; afterScene(() => playStory(n)); });
  $('r-retry').addEventListener('click', () => { if (G.cfg.n > 900) playCustom(G.cfg); else renderPrep(G.n); });
  $('r-map').addEventListener('click', () => afterScene(renderMap));
  $('na-body').addEventListener('click', (e) => { if (ND && ND.i < 99) nailsClick(e); });
  $('na-done').addEventListener('click', () => { if (!ND) return; if (ND.i === 99) { ND = null; renderMap(); } else nailsNext(); });
  $('na-back').addEventListener('click', () => { ND = null; renderMap(); });
  $('tk-pads').addEventListener('pointerdown', (e) => { const b = e.target.closest('[data-t]'); if (b) tkPad(+b.dataset.t); });
  $('tk-go').addEventListener('click', () => { snd('click'); $('tk-go').hidden = true; TK = { seq: [], i: 0, state: 'show' }; tkNext(); });
  $('tk-back').addEventListener('click', () => { TK = null; snd('click'); openSheet('games'); });
  $('td-go').addEventListener('click', () => tdFlip());
  $('td-back').addEventListener('click', () => { if (TD) TD.run = false; cancelAnimationFrame(tdRaf); TD = null; snd('click'); openSheet('games'); });
  $('gy-btn').addEventListener('pointerdown', (e) => { const m = e.currentTarget.dataset.mode; if (['squat', 'run', 'plank'].includes(m)) { e.preventDefault(); gyPress(true); } });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => $('gy-btn').addEventListener(ev, () => { if ($('gy-btn').dataset.mode === 'plank') gyPress(false); }));
  $('gy-btn').addEventListener('click', (e) => { const m = e.currentTarget.dataset.mode; if (m === 'start' || m === 'next') { snd('click'); gyNext(); } else if (m === 'done') { GY = null; renderMap(); } });
  $('bd-btn').addEventListener('pointerdown', (e) => { if (e.currentTarget.dataset.mode === 'rock' && BD) { e.preventDefault(); BD.hold = true; } });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => $('bd-btn').addEventListener(ev, () => { if (BD) BD.hold = false; }));
  $('bd-btn').addEventListener('click', (e) => { const m = e.currentTarget.dataset.mode; if (m === 'arms') bdArms(); else if (m === 'again') openBed(); else if (m === 'done') { $('bd-pair').classList.remove('asleep'); BD = null; renderMap(); } });
  $('bd-basket').addEventListener('click', bdBasket);
  $('lf-grid').addEventListener('pointerdown', (e) => { const t = e.target.closest('.lf-tile'); if (t) { e.preventDefault(); lfTap(t); } });
  $('lf-btn').addEventListener('click', (e) => { const m = e.currentTarget.dataset.mode; if (m === 'start') lfStart(); else if (m === 'again') openLife(LF.k); else if (m === 'done') { LF = null; openSheet('today'); } });
  $('lf-back').addEventListener('click', () => { clearInterval(lfTimer); LF = null; renderMap(); });
  $('bd-shh').addEventListener('pointerdown', (e) => { e.preventDefault(); bdShh(); });
  $('bd-back').addEventListener('click', () => { cancelAnimationFrame(bdRaf); BD = null; $('bd-pair').classList.remove('asleep'); renderMap(); });
  $('gy-back').addEventListener('click', () => { if (GY) GY.run = false; cancelAnimationFrame(gyRaf); GY = null; renderMap(); });
  $('wh-spin').addEventListener('click', spinWheel);
  $('wh-back').addEventListener('click', () => { if (!spinning) renderMap(); });
  $('wb-ok').addEventListener('click', () => { $('screen-welcome').hidden = true; snd('happy'); renderMap(); });
  $('m-journey').addEventListener('click', (e) => { const b = e.target.closest('[data-chest]'); if (b && !b.disabled) openChest(+b.dataset.chest); });
  $('zn-oud').addEventListener('click', lightOud);
  $('zn-btn').addEventListener('click', zenStart);
  const zHold = (v) => (e) => { if (ZN && ZN.phase === 'breathe') { ZN.held = v; e.preventDefault(); } };
  $('zn-btn').addEventListener('pointerdown', zHold(true)); ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => $('zn-btn').addEventListener(ev, zHold(false)));
  $('zn-walk').addEventListener('click', () => { snd('tab'); openTree(); });
  $('zn-back').addEventListener('click', () => { if (ZN) ZN.phase = 'done'; cancelAnimationFrame(znRaf); ZN = null; renderMap(); });
  $('zn-home').addEventListener('click', () => { ZN = null; renderMap(); });
  const tHold = (v) => (e) => { if (TR && !TR.done && !$('tr-btn').disabled) { TR.hold = v; e.preventDefault(); } };
  $('tr-btn').addEventListener('pointerdown', tHold(true)); ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => $('tr-btn').addEventListener(ev, tHold(false)));
  $('tr-done').addEventListener('click', () => { TR = null; cancelAnimationFrame(trRaf); renderMap(); });
  $('tr-back').addEventListener('click', () => { TR = null; cancelAnimationFrame(trRaf); renderMap(); });
  $('hd-go').addEventListener('click', hdStart);
  ['pointerdown', 'pointermove', 'pointerup', 'pointerleave'].forEach((ev) => $('hd-stage').addEventListener(ev, hairMove));
  $('hd-back').addEventListener('click', () => { if (HD) HD.run = false; cancelAnimationFrame(hdRaf); HD = null; openSheet('games'); });
  $('m-hub').addEventListener('click', (e) => {
    const b = e.target.closest('[data-hub]'); if (!b) return;
    const id = b.dataset.hub;
    if (id === 'locked') { const nx = UNLOCKS.find((u) => !unlocked(u[0])); snd('fail'); toast(`🔒 ${nx[3]} unlocks after Day ${nx[1]}. Keep going!`, '', 1800); return; }
    if (save.newF[id]) { delete save.newF[id]; persist(); }
    snd('tab'); openSheet(id);
  });
  $('m-now').addEventListener('click', (e) => { if (e.target.closest('[data-mo]')) { snd('tab'); openMoment(); } else if (e.target.closest('[data-evb]')) { snd('tab'); openSheet('event'); } });
  $('gf-boxes').addEventListener('click', (e) => { const b = e.target.closest('.gf-box'); if (b) pickGift(b); });
  $('gf-ok').addEventListener('click', () => { snd('click'); $('gf-boxes').classList.remove('done'); if (giftState().n > 0) openGift(); else { $('gift').hidden = true; renderHub(); } });
  $('gf-x').addEventListener('click', () => { $('gift').hidden = true; $('gf-boxes').classList.remove('done'); renderHub(); });
  $('mo-pic').addEventListener('pointerdown', (e) => { e.preventDefault(); momentTap(); });
  $('mo-play').addEventListener('click', (e) => {
    const b = e.target.closest('.mo-pick'); if (!b || !MO || MO.done) return;
    if (MO.m[4] === 'multi') {
      const need = MO.m[5].filter((o) => o[2]).length;
      if (MO.m[5][+b.dataset.i][2]) { b.classList.add('right'); b.disabled = true; MO.got++; snd('pop'); haptic('tap'); $('mo-cnt').textContent = `${MO.got}/${need}`; if (MO.got >= need) momentDone(MO.miss <= 1); }
      else { MO.miss++; b.classList.add('wrong'); b.disabled = true; snd('fail'); haptic('fail'); $('mo-say').textContent = pick(['That doesn’t start with S! 😄', 'Not on a haft-sin!', 'Hmm… no!']); }
      return;
    }
    if (MO.m[5][+b.dataset.i][2]) { b.classList.add('right'); momentDone(MO.miss === 0); }
    else { MO.miss++; b.classList.add('wrong'); b.disabled = true; snd('fail'); haptic('fail'); $('mo-say').textContent = pick(['Hmm… not that one! 😅', 'Nope! Try again.', 'Are you sure? 🤔']); }
  });
  $('mo-play').addEventListener('pointerdown', (e) => {
    if (!e.target.closest('#mo-hold') || !MO || MO.done) return; e.preventDefault();
    const btn = $('mo-hold'); btn.classList.add('on'); snd('chime'); MO.hold = true; const t0 = performance.now() - (MO.held || 0) * 1000;
    const tick = () => { if (!MO || MO.done || !MO.hold) return; MO.held = (performance.now() - t0) / 1000; $('mo-holdf').style.height = Math.min(100, MO.held / 2.6 * 100) + '%'; if (MO.held >= 2.6) { momentDone(true); return; } if (Math.random() < 0.08) haptic('tap'); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => $('mo-play').addEventListener(ev, () => { if (MO && MO.hold) { MO.hold = false; const b = $('mo-hold'); if (b) b.classList.remove('on'); } }, true));
  $('mo-ok').addEventListener('click', () => { snd('click'); $('moment').hidden = true; const back = MO && MO.custom && MO.custom.back; if (MO) clearInterval(MO.iv); MO = null; renderNow(); renderHub(); if (back) openSheet(back); });
  $('mo-x').addEventListener('click', () => { $('moment').hidden = true; if (MO) clearInterval(MO.iv); MO = null; renderNow(); });
  $('r-myst').addEventListener('click', (e) => { const b = e.target.closest('[data-g]'); if (!b) return; const n = G ? G.n : 0; if (!MYST[n]) return; save.myst.guess[n] = +b.dataset.g; persist(); snd('pop'); haptic('tap'); renderMyst(n); });
  $('ul-ok').addEventListener('click', () => { snd('click'); $('unlock').hidden = true; renderHub(); if (dailyReady() && !dailyShown && daysDone() >= 1) { dailyShown = true; setTimeout(() => openSheet('daily'), 300); } });
  $('m-play').addEventListener('click', () => { snd('click'); const n = Math.min(save.level, LEVELS.length); if (save.level > LEVELS.length) openSheet('endless'); else playStory(n); });
  $('sh2-body').addEventListener('click', sheetAction);
  let sheetBackToPause = false;
  $('sh2-back').addEventListener('click', () => { snd('click'); if (sheetBackToPause) { sheetBackToPause = false; show('screen-pause'); } else renderMap(); });
  $('so-back').addEventListener('click', () => openSheet('sort'));
  $('so-tubes').addEventListener('click', (e) => { const g = e.target.closest('[data-i]'); if (g) window.ColorSort.tap(+g.dataset.i); });
  $('so-undo').addEventListener('click', () => window.ColorSort.undo());
  $('so-restart').addEventListener('click', () => window.ColorSort.restart());
  $('g-pause').addEventListener('click', () => { if (!G || G.over) return; G.paused = true; show('screen-pause'); });
  $('p-resume').addEventListener('click', () => { G.paused = false; last = performance.now(); show('screen-game'); });
  $('p-retry').addEventListener('click', () => { if (!G) return; G.over = true; cancelAnimationFrame(raf); if (G.cfg.n > 900) playCustom(G.cfg); else { pendingBoosts = {}; show('screen-game'); startLevel(G.n); } });
  $('p-quit').addEventListener('click', () => { G.over = true; cancelAnimationFrame(raf); CUSTOM = null; renderMap(); });
  $('p-sound').addEventListener('click', () => { save.sound = save.sound === false; persist(); wake(); $('p-sound').textContent = save.sound ? 'Sound: on' : 'Sound: off'; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G && !G.over && !G.paused) { G.paused = true; show('screen-pause'); } });
  $('p-sound').textContent = save.sound === false ? 'Sound: off' : 'Sound: on';
  (function cast() {
    const box = $('t-cast'); if (!box) return;
    const fig = (html, w, h, cls, d) => `<div class="actor ${cls}" style="position:relative;display:inline-block;width:${w}px;height:${h}px;transform:none;--bd:${d}s">${html}</div>`;
    box.innerHTML = fig(A.person('mohsen', { mood: 'happy' }), 46, 80, 'npc', -1) + fig(A.person('fariba', { mood: 'happy' }), 44, 77, 'npc', -2) + fig(A.nena({ dressed: true, outfit: save.outfit, nails: nailOf('nena') }), 52, 91, 'nena', -.5) + fig(A.simba({ collar: save.collar }), 70, 55, 'simba', -3) + fig(A.person('negin', { mood: 'happy' }), 44, 77, 'npc', -1.5) + fig(A.person('nasim', { mood: 'angry' }), 44, 77, 'npc', -2.5);
    setInterval(() => { const kids = box.children; const k = kids[Math.floor(Math.random() * kids.length)]; if (!k) return; k.classList.add(k.classList.contains('simba') ? 'barking' : 'talking'); setTimeout(() => k.classList.remove('talking', 'barking'), 1200); }, 1800);
  })();
  $('t-progress').textContent = save.level > 1 ? `Day ${save.level} · ${save.coins} 🪙` : '';
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
})();
