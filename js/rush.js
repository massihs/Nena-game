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
  const buzz = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* */ } };
  const rnd = Math.random;
  const pick = (a) => a[Math.floor(rnd() * a.length)];

  /* ------------------------------------------------------------------ */
  /* Save                                                                */
  /* ------------------------------------------------------------------ */
  const KEY = 'nena-simba-rush-v1';
  let save = { level: 1, stars: {}, best: {}, medals: {}, coins: 0, up: {}, sound: true, music: true, seen: {} };
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.level) save = Object.assign(save, d); } catch (e) { /* */ }
  save.medals = save.medals || {};
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
  };
  // where each character lives, per place
  const HOMES = {
    home: { nena: ['salon', 300, 670], simba: ['salon', 330, 600], baba: ['tv', 250, 560], fariba: ['kitchen', 160, 470], nasim: ['salon', 545, 470] },
    street: { nena: ['street', 250, 545], simba: ['street', 330, 535], nasim: ['street', 520, 600], kids: ['street', 70, 548] },
    clap: { nena: ['clap', 250, 646], negin: ['clap', 400, 646], pourya: ['clap', 176, 452] },
  };
  const FUR_ZONE = { x0: 270, x1: 560, y0: 600, y1: 780 };
  const FRONT = [548, 430];
  const NPC_ART = { baba: ['mohsen', 'happy', 84, 147], fariba: ['fariba', 'happy', 80, 140], nasim: ['nasim', 'angry', 80, 140], negin: ['negin', 'happy', 76, 132], kids: ['mia', 'happy', 64, 112], pourya: ['pourya', 'happy', 84, 147] };
  const GUESTS = [['guest1', 40, 552, 'happy'], ['guest2', 112, 554, 'happy'], ['guest3', 42, 742, 'happy'], ['guest4', 112, 744, 'neutral'], ['witch1', 490, 552, 'angry'], ['witch2', 562, 554, 'angry']];
  const TRANSIENT = { nasim: 1, kids: 1 };
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
    snack:   { who: 'table', icon: '🍡', pts: 130, pat: 26, item: 'mochi', src: 'sushi', at: 'table', dur: 0.6, hint: 'Snack time: mochi from the sushi counter to your table.' },
  };
  const ITEMS = { food: '🥣', tea: '🍵', brush: '🪮', ball: '🎾', charger: '🔌', laundry: '🧺', blanket: '🧸', pup: '🐕', bread: '🫓', juice: '🧃', bag: '🛍️', teapot: '🫖', coal: '🔥', mochi: '🍡' };
  const NOREQ = { baba: 'Baba is happily watching football.', fariba: 'Maman is fine for now.', nasim: 'Nasim doesn’t want to talk.', negin: 'Shh… Negin is sleeping. Leave her be.', mirror: 'Nena looks great already!', car: 'Nothing to put in the car yet.', hookah: 'The hookah is fine.', table: 'Nothing to bring to the table.', kids: 'The kids are playing.', bowl: 'Simba isn’t hungry right now.', water: 'The water bowl is already full.', fountain: 'Simba isn’t thirsty.', tub: 'No bath needed.', negin_door: '', pourya: 'Pourya is busy preparing hookah heads.' };
  const BABA_CALLS = ['Baba: “Where are you?! It’s late!”', 'Baba: “Did you eat? Come home!”', 'Baba: “Is Negin with you? Put her on!”', 'Baba: “Nena jan, it’s 11 o’clock!!”', 'Baba: “Why don’t you answer the first time?”'];

  /* ------------------------------------------------------------------ */
  /* Levels                                                              */
  /* ------------------------------------------------------------------ */
  const L = (n, title, day, place, dur, types, targets, every, extra) => Object.assign({ n, title, day, place, dur, types, targets, every }, extra || {});
  const HOME_ALL = ['food', 'water', 'walk', 'brush', 'play', 'tea', 'help', 'talk', 'cuddle', 'wake', 'charger', 'laundry', 'blanket', 'bath', 'ready', 'study'];
  const LEVELS = [
    L(1, 'First morning', 'Saturday', 'home', 60, ['food', 'water'], [300, 500, 650], [6, 9], { obj: { k: 'done', n: 5, label: 'Complete 5 requests' }, story: [['simba', 'happy', 'Woof! (Breakfast. Now. Please.)'], ['nena', 'happy', 'Okay Simba! Kibble is in the kitchen, your bowls are in the living room.']] }),
    L(2, 'Walkies!', 'Sunday', 'home', 70, ['food', 'water', 'walk'], [350, 600, 950], [6, 8.5], { obj: { k: 'type', t: 'walk', n: 2, label: 'Walk Simba 2 times' }, story: [['nena', 'neutral', 'Negin was supposed to walk him… she’s still asleep.'], ['simba', 'happy', '*brings the leash*']] }),
    L(3, 'Tea for Baba', 'Monday', 'home', 75, ['food', 'water', 'walk', 'tea'], [500, 950, 1450], [5.5, 8], { obj: { k: 'type', t: 'tea', n: 3, label: 'Serve Baba 3 teas' }, story: [['mohsen', 'happy', 'Nena jan, is there tea? Persepolis is playing!'], ['nena', 'happy', 'Coming, Baba! Samovar in the kitchen, TV room… use the room tabs!']] }),
    L(4, 'Fluffy trouble', 'Tuesday', 'home', 80, ['food', 'water', 'walk', 'tea', 'brush'], [700, 1200, 1900], [5.5, 7.5], { obj: { k: 'combo', n: 3, label: 'Reach a ×3 combo' }, fur: 9, story: [['nena', 'surprised', 'Orange fur EVERYWHERE. Simba, you’re shedding again!'], ['simba', 'happy', '*shakes proudly*']] }),
    L(5, 'Maman’s kitchen', 'Wednesday', 'home', 85, ['food', 'water', 'walk', 'tea', 'brush', 'help'], [750, 1350, 2100], [5, 7], { obj: { k: 'clean', label: 'Leave no mess at the end' }, fur: 9, story: [['fariba', 'happy', 'Nena jan, help me with the ghormeh sabzi? And then the dishes, please!']] }),
    L(6, 'Bread run', 'Thursday', 'street', 80, ['poop', 'thirst', 'bread', 'calm', 'kids'], [650, 1150, 1800], [5, 7], { obj: { k: 'type', t: 'bread', n: 2, label: 'Put 2 sangak breads in the car' }, story: [['fariba', 'neutral', 'Nena jan, take Simba out and bring sangak for lunch. Put it in the 4×4!'], ['nena', 'happy', 'A walk in the street, Simba! Stay away from the cats…']] }),
    L(7, 'Nasim is home', 'Friday', 'home', 90, ['food', 'water', 'walk', 'tea', 'brush', 'help', 'talk', 'cuddle'], [900, 1600, 2450], [4.8, 6.8], { obj: { k: 'treat', label: 'Catch a golden bone' }, fur: 8, story: [['nasim', 'angry', 'DON’T talk to me. …Okay, maybe talk to me. Later.'], ['mohsen', 'happy', 'And bring me my little lion! I want him on my belly.']] }),
    L(8, 'Wake up, Negin!', 'Saturday', 'home', 95, ['food', 'water', 'walk', 'tea', 'help', 'talk', 'wake', 'charger'], [1000, 1800, 2750], [4.6, 6.4], { obj: { k: 'done', n: 14, label: 'Complete 14 requests' }, fur: 8, story: [['negin', 'sleepy', '…zzz… five more minutes… zzz…'], ['fariba', 'neutral', 'Nena, wake your sister, she has class! You’re the only one she lets in.']] }),
    L(9, 'Night at CLAP', 'Saturday', 'clap', 85, ['coals', 'chai', 'doze', 'snack', 'phone', 'insta'], [750, 1350, 2150], [4.6, 6.4], { night: true, obj: { k: 'type', t: 'phone', n: 3, label: 'Answer Baba 3 times' }, story: [['negin', 'happy', 'CLAP tonight? Hookah and tea, my treat… I mean your treat.'], ['nena', 'happy', 'Okay! I park the 4×4 under Hayat Sabz, we go up to the mall, and CLAP is on the ground floor.'], ['pourya', 'happy', 'Salam Nena! A new hookah head? …And your Instagram, maybe?'], ['mohsen', 'neutral', 'Girls, be home by ten! I will call. Many times.']] }),
    L(10, 'Nena’s own day', 'Sunday', 'home', 100, ['food', 'water', 'walk', 'tea', 'ready', 'study', 'blanket', 'laundry'], [1000, 1800, 2800], [4.4, 6.2], { obj: { k: 'type', t: 'study', n: 2, label: 'Study 2 times' }, story: [['nena', 'neutral', 'Exams, Simba, Baba, Maman… and I still have to get ready myself!']] }),
    L(11, 'Rainy day', 'Monday', 'home', 100, ['food', 'water', 'walk', 'tea', 'brush', 'help', 'play', 'bath', 'blanket', 'charger'], [1100, 1950, 3000], [4.2, 6], { rain: true, fur: 6, obj: { k: 'tips', n: 20, label: 'Earn 20 coins in tips' }, story: [['nena', 'neutral', 'Rain… muddy paws. Bath time in my bathroom, Simba.'], ['simba', 'sad', '*hides under the sofa*']] }),
    L(12, 'Tehran evening', 'Tuesday', 'street', 95, ['poop', 'thirst', 'bread', 'calm', 'kids', 'juice', 'phone'], [1250, 2250, 3500], [4.2, 6], { night: true, obj: { k: 'nomiss', label: 'Don’t miss a single request' }, story: [['nasim', 'angry', 'I’m coming too. And you’re buying me a juice.'], ['mohsen', 'neutral', 'It’s getting dark! I’ll call you every five minutes.']] }),
    L(13, 'Late night at CLAP', 'Wednesday', 'clap', 100, ['coals', 'chai', 'doze', 'snack', 'phone', 'insta'], [950, 1750, 2700], [3.9, 5.6], { night: true, patience: 0.92, obj: { k: 'combo', n: 5, label: 'Reach a ×5 combo' }, story: [['negin', 'sleepy', 'One more hookah… and a nap… on this cushion…'], ['pourya', 'happy', 'Nena! Today you give me your Instagram, yes?'], ['negin', 'neutral', 'Don’t look now… the two blonde witches are here again. Corner table.'], ['nena', 'surprised', 'No, Pourya. And Baba already called three times. It’s only 9!']] }),
    L(14, 'Simba’s birthday', 'Thursday', 'home', 110, HOME_ALL, [1650, 3000, 4700], [3.8, 5.3], { fur: 6, patience: 0.9, obj: { k: 'done', n: 20, label: 'Complete 20 requests' }, story: [['mohsen', 'happy', 'Happy birthday, my lion!'], ['nasim', 'neutral', 'I made the decorations. Don’t say anything.']] }),
  ];
  function levelCfg(n) {
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
    cfg.types.forEach((t) => { const R = REQ[t]; [R.src, R.at, R.who].forEach((x) => { if (STATIONS[x]) st.add(x); }); who.add(R.who); });
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
    const [art, mood, w, hh] = NPC_ART[who];
    const a = makeActor(who, A.person(art, { mood }), w, hh, 'npc', h[0]);
    a.el.dataset.target = who;
    place(a, h[1], h[2]);
    G.npcs[who] = a;
    return a;
  }

  function startLevel(n) {
    const cfg = levelCfg(n);
    cancelAnimationFrame(raf);
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
    if (G.boosts.heart) { G.hearts++; G.maxHearts++; }
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
      b.type = 'button'; b.className = 'hit station' + (s.enter ? ' room' : ''); b.dataset.target = id;
      b.setAttribute('aria-label', s.label);
      b.style.left = (s.x - s.r) + 'px'; b.style.top = (s.y - s.r) + 'px'; b.style.width = b.style.height = (s.r * 2) + 'px';
      b.innerHTML = `<span class="st-ico">${s.chip || ''}</span>`;
      layer(s.room).appendChild(b);
    });
    // characters
    const H = HOMES[cfg.place];
    G.nena = makeActor('nena', A.nena({ dressed: true, outfit: 'basique', eyes: 'open' }), 84, 147, 'nena', H.nena[0]);
    place(G.nena, H.nena[1], H.nena[2]);
    if (H.simba) {
      G.simba = makeActor('simba', A.simba({ eyes: 'open' }), 112, 89, 'simba happy', H.simba[0]);
      G.simba.el.dataset.target = 'simba';
      place(G.simba, H.simba[1], H.simba[2]);
    }
    ['baba', 'fariba', 'negin', 'pourya'].forEach((w) => { if ((W.who.has(w) || (w === 'pourya' && cfg.place === 'clap')) && H[w]) spawnNpc(w); });
    if (cfg.place === 'clap') { GUESTS.forEach(([id, x, y, mood]) => { const g = makeActor(id, A.person(id, { mood }), 72, 126, 'npc guest' + (id.startsWith('witch') ? ' witch' : ''), 'clap'); place(g, x, y); }); G.witchT = 14 + rnd() * 8; }
    // overlays that follow Nena
    G.bar = document.createElement('div'); G.bar.className = 'workbar'; G.bar.innerHTML = '<i></i>'; G.bar.hidden = true;
    G.handEl = document.createElement('div'); G.handEl.className = 'hand';
    G.tut = document.createElement('div'); G.tut.className = 'tut-hand'; G.tut.textContent = '👆'; G.tut.hidden = true;
    attachNenaOverlays();
    if (G.boosts.coffee) G.nena.el.classList.add('coffee');
    renderHand();
    $('screen-game').hidden = false;
    $('g-level').textContent = `Day ${n} · ${cfg.title}`;
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
    if (W.tabs.length > 1 && !save.seen._rooms) { fresh.unshift('_rooms'); }
    fresh.forEach((t, i) => setTimeout(() => { if (G && G.n === n && !G.over) toast(t === '_rooms' ? 'The flat has several rooms: use the tabs at the bottom to look around. Tap an icon on a tab to send Nena!' : REQ[t].hint, 'hint', 4800); }, i * 5200));
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
    T(3700, () => { go('mall', 80, 418, 112, 420); eM.classList.add('open'); toast('🛍️ Hayat Sabz Mall · ground floor', 'hint', 1800); snd('success'); });
    T(4200, () => { both((a) => a.el.classList.remove('gone', 'flip')); moveTo(nn, 500, 470, 2.0); if (ng) moveTo(ng, 540, 474, 2.1); });
    T(6400, () => { both((a) => a.el.classList.add('gone')); eM.classList.remove('open'); });
    T(6900, () => { go('clap', 318, 440, 350, 442); toast('🏮 Welcome to CLAP!', 'hint', 1400); });
    T(7200, () => { both((a) => a.el.classList.remove('gone')); moveTo(nn, G.intro.home.n[0], G.intro.home.n[1], 1.0); if (ng) moveTo(ng, G.intro.home.g[0], G.intro.home.g[1], 1.1); });
    T(8500, endIntro);
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
  function setView(room) {
    if (!G.layers[room]) return;
    G.view = room;
    Object.entries(G.layers).forEach(([id, d]) => d.classList.toggle('on', id === room));
    layer(room).appendChild(G.tut);
    G.tabKey = '';
    renderTabs();
  }
  function renderTabs() {
    const tabs = G.W.tabs.slice();
    if (G.nena.room === 'street' && !tabs.includes('street')) tabs.push('street');
    const need = needRooms();
    const parts = tabs.map((room) => {
      const reqs = G.reqs.filter((r) => whoRoom(r.who) === room);
      return { room, here: G.nena.room === room, view: G.view === room, need: need.has(room), b: reqs.map((r) => ({ i: G.reqs.indexOf(r), icon: REQ[r.type].icon, u: r.left / r.max < 0.3 })) };
    });
    const key = JSON.stringify(parts);
    if (key === G.tabKey) return;
    G.tabKey = key;
    $('g-rooms').innerHTML = parts.map((p) => `<button type="button" class="rtab${p.view ? ' view' : ''}${p.here ? ' here' : ''}${p.need ? ' need' : ''}" data-room="${p.room}">
      <span class="rt-n">${ROOMS[p.room].icon} ${ROOMS[p.room].short}</span><span class="rt-b">${p.b.map((b) => `<span data-req="${b.i}" class="${b.u ? 'urgent' : ''}">${b.icon}</span>`).join('')}</span></button>`).join('');
  }
  function needRooms() {
    const s = new Set();
    G.reqs.forEach((r) => { const id = nextStep(r); const room = targetRoom(id); if (room) s.add(room); });
    return s;
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
    return m;
  }
  function spawn() {
    const busyWho = new Set(G.reqs.map((r) => r.who));
    let types = G.cfg.types.filter((t) => !busyWho.has(REQ[t].who));
    if (G.simbaAway || G.simbaTask || holding('pup')) types = types.filter((t) => REQ[t].who !== 'simba' && REQ[t].src !== 'simba');
    if (up('fountain')) types = types.filter((t) => (t !== 'water' && t !== 'thirst') || rnd() < 0.6);
    if (!types.length) return;
    const t = pick(types.concat(types.filter((x) => REQ[x].who === 'simba')));
    const R = REQ[t];
    if (TRANSIENT[R.who] && !G.npcs[R.who]) { spawnNpc(R.who); snd('swoosh'); }
    const max = R.pat * patienceMul(R.who);
    const el = document.createElement('div');
    el.className = 'req';
    el.dataset.target = R.who;
    el.innerHTML = `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" class="ring-bg"/><circle cx="20" cy="20" r="17" class="ring"/></svg><span>${R.icon}</span>`;
    layer(whoRoom(R.who)).appendChild(el);
    const r = { type: t, who: R.who, left: max, max, el };
    G.reqs.push(r);
    posReq(r);
    if (t === 'phone') { snd('fanfare'); buzz([30, 60, 30]); toast('📞 Baba is calling…', '', 1200); }
    else snd(R.who === 'simba' ? 'bark' : 'pop');
  }
  function posReq(r) {
    const room = whoRoom(r.who);
    if (room && r.el.parentNode !== G.layers[room]) layer(room).appendChild(r.el);
    const [x, y] = anchorOf(r.who);
    r.el.style.transform = `translate(${x - 24}px, ${y - 48}px)`;
    r.el.style.zIndex = '2000';
    const f = r.left / r.max;
    r.el.querySelector('.ring').style.strokeDashoffset = String((1 - f) * 106.8);
    r.el.classList.toggle('urgent', f < 0.3 && G.freezeT <= 0);
    r.el.classList.toggle('frozen', G.freezeT > 0);
  }
  function removeReq(r) {
    r.el.remove(); G.reqs = G.reqs.filter((x) => x !== r);
    if (TRANSIENT[r.who] && G.npcs[r.who]) { const n = G.npcs[r.who]; delete G.npcs[r.who]; n.el.classList.add('leave'); setTimeout(() => n.el.remove(), 500); }
    G.queue = G.queue.filter((q) => q.r !== r);
    markQueue();
  }
  function fail(r) {
    if (r.type === 'insta') { removeReq(r); toast('Pourya: “Okay… I’ll ask next time!” 😏', '', 1500); return; }
    removeReq(r);
    G.hearts--; G.failed++; G.combo = 0;
    snd('fail'); buzz(60); shake();
    renderObj();
    const [x, y] = anchorOf(r.who);
    floatText(x, y, '💔', 'bad', whoRoom(r.who));
    const R = REQ[r.type];
    if (r.type === 'walk') { addFur(true); toast('Oops! Simba couldn’t wait… a puddle to clean.', 'bad'); }
    else if (r.type === 'brush') { addFur(); addFur(); }
    else if (r.type === 'phone') toast('Baba: “WHY DON’T YOU ANSWER?!” 😤', 'bad');
    else if (r.type === 'calm') toast('Simba chased the cat across the street!', 'bad');
    else if (r.who === 'baba') toast('Baba grumbles at the TV.', 'bad');
    else if (r.who === 'nasim') toast('Nasim stormed off!', 'bad');
    else if (r.who === 'negin') toast('Negin went back to sleep…', 'bad');
    if (R.item === 'pup' && holding('pup') && !G.reqs.some((x) => REQ[x.type].item === 'pup')) { take('pup'); releaseSimba(); }
    if (G.hearts <= 0) endLevel(true);
  }
  function complete(r, bonusMul) {
    if (!G.reqs.includes(r)) return;
    const R = REQ[r.type];
    const speed = 1 + 0.5 * (r.left / r.max);
    G.combo = G.comboT > 0 ? Math.min(G.combo + 1, 8) : 1;
    G.comboT = 6;
    const mul = 1 + 0.15 * (G.combo - 1);
    const perfect = r.left / r.max > 0.75;
    const pts = Math.round(R.pts * speed * mul * (bonusMul || 1) * (G.rushHour ? 1.5 : 1));
    G.score += pts; G.done++;
    const tip = r.who !== 'simba' && r.who !== 'nena' ? 2 + Math.round(3 * r.left / r.max) + (r.type === 'kids' ? 3 : 0) : 0;
    G.coins += tip;
    G.stats.tips += tip; G.stats.maxCombo = Math.max(G.stats.maxCombo, G.combo);
    G.stats.type[r.type] = (G.stats.type[r.type] || 0) + 1;
    if (r.type === 'walk') G.stats.walk++;
    if (r.type === 'tea') G.stats.tea++;
    const [x, y] = anchorOf(r.who);
    const room = whoRoom(r.who);
    floatText(x, y, `+${pts}${G.combo > 1 ? ` ×${mul.toFixed(2).replace(/\.?0+$/, '')}` : ''}`, 'good', room);
    if (perfect) floatText(x, y - 34, 'Perfect!', 'perfect', room);
    sparkle(x, y + 20, room);
    if ((G.combo === 5 || G.combo === 8) && G.boostT <= 0) { G.boostT = 6; G.nena.el.classList.add('boost'); toast('⚡ Chai rush! Nena is super fast!', 'combo', 1600); }
    if (tip) floatText(x + 30, y + 24, `+${tip} 🪙`, 'coin', room);
    if (G.combo >= 3) toast(`Combo ×${G.combo}!`, 'combo', 900);
    removeReq(r);
    snd(G.combo >= 3 ? 'fanfare' : 'success'); buzz(12);
    checkObj();
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
  function nextStep(r) { const R = REQ[r.type]; return R.item && !holding(R.item) ? R.src : R.at; }
  // One tap on a request (bubble, character or tab icon) plans the whole trip
  function chainFor(r) {
    const R = REQ[r.type], steps = [];
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
    snd('click'); buzz(6);
    markQueue();
  }
  function onTap(e) {
    if (!G || G.paused || G.over) return;
    if (G.intro) { endIntro(); return; }
    const bone = e.target.closest('[data-bone]');
    if (bone) { catchBone(); return; }
    const t = e.target.closest('[data-target]');
    if (!t) return;
    queueSteps(tapTarget(t.dataset.target));
  }
  function onTabs(e) {
    if (!G || G.paused || G.over) return;
    const b = e.target.closest('[data-req]');
    if (b) { const r = G.reqs[+b.dataset.req]; if (r) queueSteps(chainFor(r)); e.stopPropagation(); return; }
    const t = e.target.closest('[data-room]');
    if (t) { snd('tab'); setView(t.dataset.room); }
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
    toast('🔔 Ding-dong! A delivery at the front door', '', 1600);
    snd('pop');
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
        done: () => { if (fx.end) fx.end(doR); if (!G.reqs.includes(doR)) return; if (R.item) take(R.item); complete(doR); if (fx.after) fx.after(doR); },
      };
    }
    // 3) things with no request
    if (id === 'simba') { if (!G.simba || G.simbaAway) return null; return { dur: 0.6, snd: 'happy', done: () => { G.score += 10; floatText(G.simba.x, G.simba.y - 100, '♥', 'heart', G.simba.room); simbaHop(); } }; }
    if (id === 'sink') { if (!G.dishes) return { dur: 0.2, miss: 'No dirty dishes.' }; return { dur: 1.6 * sp, snd: 'water', done: () => { G.dishes--; renderDishes(); G.score += 60; floatText(193, 230, '+60', 'good', 'kitchen'); } }; }
    if (id === 'laptop') return { dur: 3 * sp, done: () => { G.coins += 6; G.score += 40; floatText(345, 220, '+40 · +6 🪙', 'coin', 'bedroom'); snd('coin'); } };
    if (id === 'pkg') { if (!G.pkg) return null; return { dur: 0.8 * sp, done: () => { if (!G.pkg) return; G.pkg.el.remove(); G.pkg = null; G.score += 100; G.coins += 12; floatText(FRONT[0] - 40, FRONT[1] - 80, '+100 · +12 🪙', 'coin', 'salon'); toast('📦 A package for Baba!', '', 1300); snd('coin'); } }; }
    const f = G.furs.find((x) => x.id === id);
    if (f) return { dur: (f.puddle ? 1.2 : 0.7) * sp, snd: 'brush', done: () => { f.el.remove(); G.furs = G.furs.filter((x) => x !== f); G.score += f.puddle ? 30 : 20; floatText(f.x, f.y - 20, f.puddle ? '+30' : '+20', 'good', 'salon'); } };
    if (NOREQ[id]) return { dur: 0.2, miss: NOREQ[id] };
    return null;
  }
  // per-request flavour: sounds, little scenes and family one-liners
  const say = (t) => toast(t, '', 1600);
  const FX = {
    food: { after: () => { if (G.simba && !G.simbaAway) simbaGo(STATIONS.bowl.x + 50, STATIONS.bowl.y + 30, 2); } },
    water: { snd: 'water' },
    brush: { snd: 'brush' },
    play: { snd: 'happy', after: () => simbaHop() },
    blanket: { snd: 'happy', after: () => floatText(G.simba.x, G.simba.y - 100, 'zzz…', 'hint', G.simba.room) },
    tea: { after: () => say(pick(['Baba: “Merci azizam! Goal!!”', 'Baba: “Ahh, chai. Now sit with your old father.”'])) },
    charger: { after: () => say('Baba: “Ahh, 3%! Now where are those girls…” 📞') },
    cuddle: { end: () => cuddleSimba(), after: () => say('Baba: “My little lion! On my belly, come!” 🦁') },
    help: { snd: 'swoosh', after: () => addDish() },
    laundry: { snd: 'swoosh', after: () => say('Maman: “Merci azizam! What a mess that girl makes…”') },
    talk: { after: () => say('Nasim: “…Thanks. Whatever.”') },
    wake: { snd: 'click', start: () => enterFx('Knock knock…')(), end: () => G.nena.el.classList.remove('gone'), after: () => say('Negin: “I’m up… I’m up…”') },
    ready: { snd: 'brush', after: () => say('Nena: “Okay. I look amazing. Next!” ✨') },
    study: { snd: 'click', after: () => say('Nena: “Chapter done! Simba, stop sitting on my notes.”') },
    bath: { snd: 'splash', start: () => bathStart(), end: () => releaseSimba(), after: () => say('Simba is clean and fluffy again! 🫧') },
    poop: { snd: 'swoosh', after: () => say('A neighbour: “What a polite young lady!”') },
    thirst: { snd: 'water', start: () => { if (G.simba) moveTo(G.simba, STATIONS.fountain.x - 40, STATIONS.fountain.y + 70, 0.4); }, after: () => { if (G.simba) moveTo(G.simba, HOMES.street.simba[1], HOMES.street.simba[2], 0.6); } },
    calm: { snd: 'happy', after: () => say('Simba: “*growls at the cat, then lies down*”') },
    bread: { snd: 'swoosh', after: () => say('Hot sangak in the 4×4. Maman will be happy!') },
    juice: { after: () => say('Nasim: “…It’s fine. Thanks. Don’t look at me.”') },
    kids: { snd: 'happy', after: () => { simbaHop(); say('The kids: “He looks like a lion!!” 🦁'); } },
    phone: { snd: 'talk', after: () => say(pick(BABA_CALLS)) },
    coals: { snd: 'swoosh', after: () => say('Fresh coals. The hookah bubbles again 💨') },
    chai: { snd: 'water', after: () => say('Negin: “Ahh, chai. Wake me up when it’s cold.”') },
    doze: { snd: 'click', after: () => say('Negin: “I wasn’t sleeping! I was… resting my eyes.”') },
    snack: { after: () => say('Mochi time! 🍡') },
    insta: { snd: 'talk', after: () => say(pick(['Nena: “Pourya… no.” 😅', 'Nena: “It’s private, Pourya.”', 'Nena: “Ask me again next week.” (He will.)', 'Negin: “She doesn’t have Instagram!” (She does.)', 'Nena: “Just bring the hookah, Pourya!”'])) },
  };
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
        moveTo(G.simba, h[1], h[2], 1.0, () => { G.simba.el.classList.remove('walking'); G.simbaAway = false; });
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
  /* Main loop                                                           */
  /* ------------------------------------------------------------------ */
  function runTweens(dt) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      tw.t += dt / tw.dur;
      const k = Math.min(1, tw.t), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      place(tw.a, tw.x0 + (tw.x - tw.x0) * e, tw.y0 + (tw.y - tw.y0) * e);
      if (k >= 1) { tweens.splice(i, 1); if (tw.cb) tw.cb(); }
    }
  }
  function walkTo(p, dt) {
    const speed = 300 * (1 + 0.2 * up('shoes')) * (G.boostT > 0 ? 1.7 : 1) * (G.boosts.coffee ? 1.25 : 1);
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
    setView(room);
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!G || G.paused || G.over) return;
    if (G.intro) { runTweens(dt); return; }
    G.time -= dt;
    G.comboT -= dt;
    if (G.comboT <= 0 && G.combo) G.combo = 0;
    // spawn requests
    G.spawnT -= dt;
    const maxReq = Math.min(5, 2 + Math.floor(G.n / 3));
    if (G.spawnT <= 0) { if (G.reqs.length < maxReq) spawn(); const [a, b] = G.cfg.every; G.spawnT = (a + rnd() * (b - a)) * (G.rushHour ? 0.7 : 1); }
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
    if (G.zoomT <= 0) { zoomies(); if (G.zoomT <= 0) G.zoomT = 28 + rnd() * 12; }
    if (!G.rushHour && G.time <= 15) { G.rushHour = true; $('g-rush').hidden = false; toast('⏰ Rush hour! Points ×1.5', 'combo', 1800); snd('fanfare'); }
    if (G.time <= 5 && Math.ceil(G.time) !== G.lastTick) { G.lastTick = Math.ceil(G.time); snd('click'); }
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
        if (walkTo(ROOMS[G.nena.room].door, dt)) {
          G.nena.el.classList.add('gone');
          G.busy = { t: 0, dur: 0.3, travel: true, done: () => enterRoom(room) };
        }
      } else if (walkTo(p, dt)) {
        G.queue.shift(); markQueue();
        const act = actionFor(q.id, q.r);
        if (!act) { /* nothing */ }
        else if (act.miss) { toast(act.miss, 'bad', 1300); snd('fail'); G.busy = { t: 0, dur: act.dur }; }
        else { G.busy = { t: 0, dur: act.dur, done: act.done, id: q.id, r: q.r }; if (act.snd) snd(act.snd); if (act.start) act.start(); if (act.dur > 0.5) { G.bar.hidden = false; G.nena.el.classList.add('working'); } }
      }
    }
    if (G.busy && !G.busy.walking) {
      G.busy.t += dt;
      G.bar.style.transform = `translate(${G.nena.x - 34}px, ${G.nena.y - G.nena.h - 26}px)`;
      G.bar.firstChild.style.width = Math.min(100, (G.busy.t / G.busy.dur) * 100) + '%';
      if (G.busy.t >= G.busy.dur) { const fn = G.busy.done; G.busy = null; G.bar.hidden = true; G.nena.el.classList.remove('working'); if (fn) fn(); }
    }
    if (!G.queue.length && !G.busy) G.nena.el.classList.remove('walking');
    G.handEl.style.transform = `translate(${G.nena.x + 14}px, ${G.nena.y - 74}px)`;
    G.handEl.style.zIndex = String(Math.round(G.nena.y) + 1);
    highlights();
    renderTabs();
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
      case 'clean': return { ok: G.furs.length + G.dishes === 0, live: true, txt: 'at the end' };
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
  function hud() {
    const c = G.cfg;
    const t = Math.ceil(G.time);
    $('g-time').textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    $('g-time').classList.toggle('low', G.time < 10);
    $('g-score').textContent = G.score;
    $('g-fill').style.width = Math.min(100, (G.score / c.targets[2]) * 100) + '%';
    $('g-star1').classList.toggle('on', G.score >= c.targets[0]);
    $('g-star2').classList.toggle('on', G.score >= c.targets[1]);
    $('g-star3').classList.toggle('on', G.score >= c.targets[2]);
    $('g-hearts').textContent = '♥'.repeat(Math.max(0, G.hearts)) + '♡'.repeat(Math.max(0, G.maxHearts - G.hearts));
    $('g-combo').innerHTML = G.combo > 1 ? `Combo ×${G.combo} <i style="width:${Math.max(0, G.comboT / 6) * 100}%"></i>` : (G.boostT > 0 ? '⚡ Chai rush!' : G.freezeT > 0 ? '❄️ Treat time' : '');
    const starsNow = G.score >= c.targets[2] ? 3 : G.score >= c.targets[1] ? 2 : G.score >= c.targets[0] ? 1 : 0;
    if (starsNow > G.starsShown) { G.starsShown = starsNow; snd('coin'); const st = $('g-star' + starsNow); st.classList.remove('pop'); void st.offsetWidth; st.classList.add('pop'); }
    $('g-coins').textContent = save.coins + G.coins;
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
    const earned = (lost ? Math.floor(G.coins / 2) : G.coins + Math.floor(final / 50) + stars * 10) + (medalNew ? 25 : 0);
    save.coins += earned;
    if (stars > 0) {
      save.stars[G.n] = Math.max(save.stars[G.n] || 0, stars);
      save.best[G.n] = Math.max(save.best[G.n] || 0, final);
      if (G.n === save.level) save.level = G.n + 1;
    }
    persist();
    $('r-title').textContent = lost ? 'Too many upset faces…' : stars ? ['', 'Day done!', 'Great day!', 'Perfect day!'][stars] : 'Not quite…';
    $('r-stars').innerHTML = [0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}">★</span>`).join('');
    $('r-lines').innerHTML = `<li><span>Requests done</span><b>${G.done}</b></li><li><span>Missed</span><b>${G.failed}</b></li>${mess ? `<li><span>Mess left (${mess})</span><b>−${penalty}</b></li>` : ''}${c.obj ? `<li class="${objOk ? 'ok' : 'ko'}"><span>🏅 ${c.obj.label}</span><b>${objOk ? (medalNew ? '+25 🪙' : '✓') : '✗'}</b></li>` : ''}<li class="total"><span>Score</span><b>${final}</b></li><li><span>Coins earned</span><b>+${earned} 🪙</b></li>`;
    $('r-sub').textContent = lost ? 'The family lost patience. Try again, and watch the rings!' : stars ? `Goal: ${c.targets[0]} · ${c.targets[1]} · ${c.targets[2]}` : `You needed ${c.targets[0]} points for 1 star.`;
    $('r-next').hidden = !stars;
    $('screen-result').hidden = false;
    snd(stars >= 2 ? 'fanfare' : stars ? 'success' : 'fail');
    if (stars === 3) confetti();
  }

  function confetti() {
    const box = $('confetti'); box.innerHTML = '';
    const cols = ['#ef8fb0', '#ffd98a', '#e38c30', '#7fe0b4', '#86aaff', '#ffffff'];
    for (let i = 0; i < 46; i++) { const c = document.createElement('i'); c.style.left = (rnd() * 100) + '%'; c.style.background = cols[i % cols.length]; c.style.animationDelay = (rnd() * 0.5) + 's'; c.style.setProperty('--r', (rnd() * 720 - 360) + 'deg'); box.appendChild(c); }
    setTimeout(() => { box.innerHTML = ''; }, 3000);
  }

  /* ------------------------------------------------------------------ */
  /* Screens: title, map, story, shop                                    */
  /* ------------------------------------------------------------------ */
  function show(id) {
    ['screen-title', 'screen-map', 'screen-game', 'screen-result', 'screen-shop', 'screen-story', 'screen-pause', 'screen-prep'].forEach((s) => { $(s).hidden = s !== id && !(id === 'screen-result' && s === 'screen-game') && !(id === 'screen-pause' && s === 'screen-game'); });
  }
  function renderMap() {
    const total = Object.values(save.stars).reduce((a, b) => a + b, 0);
    $('m-coins').textContent = save.coins;
    $('m-stars').textContent = total;
    const max = Math.max(save.level + 2, LEVELS.length);
    let html = '';
    for (let n = 1; n <= max; n++) {
      const cfg = levelCfg(n), locked = n > save.level, st = save.stars[n] || 0;
      html += `<button type="button" class="lvl${locked ? ' locked' : ''}${n === save.level ? ' current' : ''}" data-level="${n}" ${locked ? 'disabled' : ''}>
        <span class="lvl-n">${locked ? '🔒' : n}</span><span class="lvl-t"><b>${cfg.title}</b><small>${cfg.day} · ${PLACE_LABEL[cfg.place]}</small></span>
        <span class="lvl-s">${save.medals[n] ? '<em>🏅</em>' : ''}${'★'.repeat(st)}<i>${'★'.repeat(3 - st)}</i></span></button>`;
    }
    $('m-levels').innerHTML = html;
    show('screen-map');
    const cur = document.querySelector('.lvl.current');
    if (cur) cur.scrollIntoView({ block: 'center' });
  }
  const PLACE_LABEL = { home: '🏠 Home', street: '🌳 Tehran street', clap: '🏮 CLAP' };
  const NAMES = { pourya: 'Pourya', nena: 'Nena', simba: 'Simba', mohsen: 'Baba', fariba: 'Maman', nasim: 'Nasim', negin: 'Negin' };
  let storyLines = [], storyLevel = 1;
  function playStory(n) {
    storyLevel = n;
    storyLines = (levelCfg(n).story || []).slice();
    show('screen-story');
    nextLine();
  }
  function nextLine() {
    const l = storyLines.shift();
    if (!l) { renderPrep(storyLevel); return; }
    const [who, mood, text] = l;
    $('s-portrait').innerHTML = A.portrait(who, mood);
    $('s-name').textContent = NAMES[who] || who;
    $('s-text').textContent = text;
    $('s-day').textContent = `Day ${storyLevel} · ${levelCfg(storyLevel).day}`;
    snd('talk', 600);
  }
  let prepPick = {};
  function renderPrep(n) {
    const cfg = levelCfg(n);
    $('pr-title').textContent = `Day ${n} · ${cfg.title}`;
    $('pr-goals').innerHTML = cfg.targets.map((t, i) => `<span>${'★'.repeat(i + 1)} <b>${t}</b></span>`).join('');
    $('pr-obj').innerHTML = cfg.obj ? `🏅 ${cfg.obj.label}${save.medals[n] ? ' <em>(done)</em>' : ' <em>+25 🪙</em>'}` : '';
    const cost = BOOSTERS.reduce((a, b) => a + (prepPick[b.id] ? b.cost : 0), 0);
    $('pr-coins').textContent = save.coins - cost;
    $('pr-boosts').innerHTML = BOOSTERS.map((b) => `<button type="button" class="boost${prepPick[b.id] ? ' on' : ''}" data-boost="${b.id}" ${!prepPick[b.id] && save.coins - cost < b.cost ? 'disabled' : ''}>
      <span class="b-i">${b.icon}</span><span class="b-t"><b>${b.name}</b><small>${b.desc}</small></span><span class="b-c">${prepPick[b.id] ? '✓' : b.cost + ' 🪙'}</span></button>`).join('');
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
  function wake() { if (window.Sound) { window.Sound.init(); window.Sound.setEnabled(save.sound !== false); window.Sound.setMusic(save.music !== false); } }
  $('stage').addEventListener('pointerdown', onTap);
  $('g-rooms').addEventListener('pointerdown', onTabs);
  $('btn-play').addEventListener('click', () => { wake(); snd('tab'); renderMap(); });
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
    const cost = BOOSTERS.reduce((a, b) => a + (prepPick[b.id] ? b.cost : 0), 0);
    if (cost > save.coins) return;
    save.coins -= cost; persist();
    pendingBoosts = Object.assign({}, prepPick); prepPick = {};
    show('screen-game'); startLevel(n);
  });
  $('pr-back').addEventListener('click', () => { prepPick = {}; renderMap(); });
  $('r-next').addEventListener('click', () => { playStory(G.n + 1); });
  $('r-retry').addEventListener('click', () => { renderPrep(G.n); });
  $('r-map').addEventListener('click', () => renderMap());
  $('g-pause').addEventListener('click', () => { if (!G || G.over) return; G.paused = true; show('screen-pause'); });
  $('p-resume').addEventListener('click', () => { G.paused = false; last = performance.now(); show('screen-game'); });
  $('p-quit').addEventListener('click', () => { G.over = true; cancelAnimationFrame(raf); renderMap(); });
  $('p-sound').addEventListener('click', () => { save.sound = save.sound === false; save.music = save.sound; persist(); wake(); $('p-sound').textContent = save.sound ? 'Sound: on' : 'Sound: off'; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G && !G.over && !G.paused) { G.paused = true; show('screen-pause'); } });
  $('p-sound').textContent = save.sound === false ? 'Sound: off' : 'Sound: on';
  $('t-progress').textContent = save.level > 1 ? `Day ${save.level} · ${save.coins} 🪙` : '';
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
})();
