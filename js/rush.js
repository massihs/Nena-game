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
    home: { courier: ['salon', 470, 470], aunt: ['salon', 470, 525], nena: ['salon', 300, 670], simba: ['salon', 330, 600], baba: ['tv', 250, 560], fariba: ['kitchen', 160, 470], nasim: ['salon', 545, 470] },
    street: { nena: ['street', 250, 545], simba: ['street', 330, 535], nasim: ['street', 520, 600], kids: ['street', 70, 548] },
    clap: { courier: ['clap', 334, 470], nena: ['clap', 250, 646], negin: ['clap', 400, 646], pourya: ['clap', 176, 452] },
  };
  const FUR_ZONE = { x0: 270, x1: 560, y0: 600, y1: 780 };
  const FRONT = [548, 430];
  const NPC_ART = { baba: ['mohsen', 'happy', 84, 147], fariba: ['fariba', 'happy', 80, 140], nasim: ['nasim', 'angry', 80, 140], negin: ['negin', 'happy', 80, 140], kids: ['mia', 'happy', 64, 112], pourya: ['pourya', 'happy', 84, 147], aunt: ['aunt', 'happy', 84, 147], courier: ['courier', 'happy', 80, 140] };
  const GUESTS = [['guest1', 40, 552, 'happy'], ['guest2', 112, 554, 'happy'], ['guest3', 42, 742, 'happy'], ['guest4', 112, 744, 'neutral'], ['witch1', 490, 552, 'angry'], ['witch2', 562, 554, 'angry']];
  const TRANSIENT = { nasim: 1, kids: 1, aunt: 1, courier: 1 };
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
    L(10, 'Nena’s own day', 'Sunday', 'home', 100, ['food', 'water', 'walk', 'tea', 'ready', 'study', 'blanket', 'laundry'], [1000, 1800, 2800], [4.4, 6.2], { obj: { k: 'type', t: 'study', n: 2, label: 'Study 2 times' }, story: [['nena', 'neutral', 'Exams, Simba, Baba, Maman… and I still have to get ready myself!'], ['nasim', 'happy', 'Oh, and someone sent you flowers AGAIN. Who is this Jesus?!'], ['nena', 'angry', 'JESUS AGAIN?! I told him to stop! Next time I block him!']] }),
    L(11, 'Rainy day', 'Monday', 'home', 100, ['food', 'water', 'walk', 'tea', 'brush', 'help', 'play', 'bath', 'blanket', 'charger'], [1100, 1950, 3000], [4.2, 6], { rain: true, fur: 6, obj: { k: 'tips', n: 20, label: 'Earn 20 coins in tips' }, story: [['nena', 'neutral', 'Rain… muddy paws. Bath time in my bathroom, Simba.'], ['simba', 'sad', '*hides under the sofa*']] }),
    L(12, 'Tehran evening', 'Tuesday', 'street', 95, ['poop', 'thirst', 'bread', 'calm', 'kids', 'juice', 'phone'], [1250, 2250, 3500], [4.2, 6], { night: true, obj: { k: 'nomiss', label: 'Don’t miss a single request' }, story: [['nasim', 'angry', 'I’m coming too. And you’re buying me a juice.'], ['mohsen', 'neutral', 'It’s getting dark! I’ll call you every five minutes.']] }),
    L(13, 'Late night at CLAP', 'Wednesday', 'clap', 100, ['coals', 'chai', 'doze', 'snack', 'phone', 'insta'], [950, 1750, 2700], [3.9, 5.6], { night: true, patience: 0.92, obj: { k: 'combo', n: 5, label: 'Reach a ×5 combo' }, story: [['negin', 'sleepy', 'One more hookah… and a nap… on this cushion…'], ['pourya', 'happy', 'Nena! Today you give me your Instagram, yes?'], ['negin', 'neutral', 'Don’t look now… the two blonde witches are here again. Corner table.'], ['nena', 'surprised', 'No, Pourya. And Baba already called three times. It’s only 9!']] }),
    L(14, 'Simba’s birthday', 'Thursday', 'home', 110, HOME_ALL, [1650, 3000, 4700], [3.8, 5.3], { fur: 6, patience: 0.9, obj: { k: 'done', n: 20, label: 'Complete 20 requests' }, story: [['mohsen', 'happy', 'Happy birthday, my lion!'], ['nasim', 'neutral', 'I made the decorations. Don’t say anything.']] }),
    L(15, 'Cousin Sara’s wedding', 'Friday', 'home', 120, HOME_ALL, [1900, 3400, 5200], [3.4, 4.8], { boss: true, fur: 6, patience: 0.9, events: 16, obj: { k: 'nomiss', label: 'Don’t miss a single request' }, story: [['fariba', 'surprised', 'Cousin Sara’s wedding is TONIGHT and the whole family is getting ready here!'], ['mohsen', 'neutral', 'Where is my tie? Where is my tea? Where is everybody?!'], ['nena', 'happy', 'Boss day, Simba. Let’s do this!']] }),
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
    const [art, mood, w, hh] = NPC_ART[who];
    const a = makeActor(who, A.person(art, { mood, nails: nailOf(who) }), w, hh, 'npc', h[0]);
    a.el.dataset.target = who;
    place(a, h[1], h[2]);
    G.npcs[who] = a;
    if (G.life) lifeAdd(who, a, {});
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
    G.evT = cfg.events || (cfg.mod && (cfg.mod.events || cfg.mod.blackout)) || (n >= 5 && n < 900 ? 30 + rnd() * 15 : n === 902 ? 25 : null);
    if (cfg.mod && cfg.mod.hearts) { G.hearts = cfg.mod.hearts; G.maxHearts = cfg.mod.hearts; }
    if (cfg.mod && cfg.mod.zoom) G.zoomT = 6;
    Object.keys(hudCache).forEach((k) => delete hudCache[k]);
    G.giftT = (n >= 4 && (cfg.place === 'home' || cfg.place === 'clap')) || cfg.challenge ? 22 + rnd() * 30 : null;
    G.frStart = {}; FRIENDS.forEach((f) => { G.frStart[f.id] = friendLv(f.id); });
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
      DECOR.filter((x) => x.room === id && save.decor[x.id]).forEach((x) => { const e = document.createElement('div'); e.className = 'decor'; e.innerHTML = `<svg viewBox="0 0 600 800">${x.svg}</svg>`; d.appendChild(e); });
      if (RA.LIGHT[id]) { const e = document.createElement('div'); e.className = 'light'; e.innerHTML = RA.LIGHT[id](cfg); d.appendChild(e); }
      (RA.FX[id] ? RA.FX[id](cfg) : []).forEach((f) => { const e = document.createElement('div'); e.className = 'fx ' + f.cls; e.innerHTML = f.html || ''; Object.assign(e.style, { left: f.x + 'px', top: f.y + 'px', width: f.w + 'px', height: f.h + 'px' }); d.appendChild(e); });
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
    G.nena = makeActor('nena', A.nena({ dressed: true, outfit: save.outfit, nails: nailOf('nena') }), 84, 147, 'nena', H.nena[0]);
    place(G.nena, H.nena[1], H.nena[2]);
    G.nena.el.dataset.target = 'nena';
    if (H.simba) {
      G.simba = makeActor('simba', A.simba({ collar: save.collar }), 112, 89, 'simba happy', H.simba[0]);
      G.simba.el.dataset.target = 'simba';
      place(G.simba, H.simba[1], H.simba[2]);
    }
    ['baba', 'fariba', 'negin', 'pourya'].forEach((w) => { if ((W.who.has(w) || (w === 'pourya' && cfg.place === 'clap')) && H[w]) spawnNpc(w); });
    G.guests = [];
    if (cfg.place === 'clap') { GUESTS.forEach(([id, x, y, mood]) => { const g = makeActor(id, A.person(id, { mood }), 72, 126, 'npc guest' + (id.startsWith('witch') ? ' witch' : ''), 'clap'); place(g, x, y); G.guests.push([id, g]); G.npcs[id] = g; g.el.dataset.target = id; }); G.witchT = 14 + rnd() * 8; }
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
    const f = FR_OF[who]; if (f) m *= 1 + 0.04 * friendLv(f);
    m *= 1 + 0.01 * cozy();
    if (G.cfg.mod && G.cfg.mod.patienceMul) m *= G.cfg.mod.patienceMul;
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
    el.innerHTML = `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" class="ring-bg"/><circle cx="20" cy="20" r="17" class="ring"/></svg><span>${R.icon}</span>`;
    layer(whoRoom(R.who)).appendChild(el);
    const r = { type: t, who: R.who, left: max, max, el };
    if (R.vip) el.classList.add('vip');
    G.reqs.push(r);
    posReq(r);
    if (R.special) { toast(R.hint, 'hint', 2400); snd('fanfare'); }
    else if (t === 'phone') { snd('fanfare'); buzz([30, 60, 30]); toast('📞 Baba is calling…', '', 1200); }
    else snd(R.who === 'simba' ? 'bark' : 'pop');
  }
  function posReq(r) {
    const room = whoRoom(r.who);
    if (room && r.el.parentNode !== G.layers[room]) layer(room).appendChild(r.el);
    const [x, y] = anchorOf(r.who);
    r.el.style.transform = `translate(${x - 24}px, ${y - 48}px)`;
    const f = r.left / r.max;
    if (!r.ring) r.ring = r.el.querySelector('.ring');
    r.ring.style.strokeDashoffset = ((1 - f) * 106.8).toFixed(1);
    const u = f < 0.3 && G.freezeT <= 0, fr = G.freezeT > 0;
    if (r.u !== u) { r.u = u; r.el.classList.toggle('urgent', u); }
    if (r.fr !== fr) { r.fr = fr; r.el.classList.toggle('frozen', fr); }
  }
  function removeReq(r) {
    r.el.remove(); G.reqs = G.reqs.filter((x) => x !== r);
    if (TRANSIENT[r.who] && G.npcs[r.who]) { const n = G.npcs[r.who]; delete G.npcs[r.who]; n.el.classList.add('leave'); setTimeout(() => n.el.remove(), 500); }
    G.queue = G.queue.filter((q) => q.r !== r);
    markQueue();
  }
  function fail(r) {
    if (r.type === 'jtext') { removeReq(r); toast('Jesus: “…You’re ignoring me? 🥺”', '', 1500); return; }
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
    const pts = Math.round(R.pts * speed * mul * (bonusMul || 1) * (G.rushHour ? 1.5 : 1) * ((G.cfg.mod && G.cfg.mod.ptsMul) || 1));
    G.score += pts; G.done++;
    const tip = r.who !== 'simba' && r.who !== 'nena' ? 2 + Math.round(3 * r.left / r.max) + (r.type === 'kids' ? 3 : 0) : 0;
    G.coins += tip;
    G.stats.tips += tip; G.stats.maxCombo = Math.max(G.stats.maxCombo, G.combo);
    G.stats.type[r.type] = (G.stats.type[r.type] || 0) + 1;
    track('req'); track('req_' + r.type); addFriend(r.who, perfect);
    if (G.combo === 5) track('combo5');
    if (G.combo === 8) track('combo8');
    if (r.type === 'walk') G.stats.walk++;
    if (r.type === 'tea') G.stats.tea++;
    const [x, y] = anchorOf(r.who);
    const room = whoRoom(r.who);
    floatText(x, y, `+${pts}${G.combo > 1 ? ` ×${mul.toFixed(2).replace(/\.?0+$/, '')}` : ''}`, 'good', room);
    if (perfect) floatText(x, y - 34, 'Perfect!', 'perfect', room);
    sparkle(x, y + 20, room);
    if ((G.combo === 5 || G.combo === 8) && G.boostT <= 0) { G.boostT = 6; G.nena.el.classList.add('boost'); toast('⚡ Chai rush! Nena is super fast!', 'combo', 1600); }
    if (tip) { floatText(x + 30, y + 24, `+${tip} 🪙`, 'coin', room); flyCoins(tip, x, y, room); }
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
    if (j !== i) { snd('tab'); G.peekAt = performance.now(); setView(tabs[j]); const l = G.layers[tabs[j]]; l.classList.remove('slide-l', 'slide-r'); void l.offsetWidth; l.classList.add(dx < 0 ? 'slide-l' : 'slide-r'); }
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
        done: () => { if (fx.end) fx.end(doR); if (!G.reqs.includes(doR)) return; if (R.item && R.item !== 'pup') flyItem(ITEMS[R.item], anchorOf(doR.who), whoRoom(doR.who)); if (R.item) take(R.item); complete(doR); if (fx.after) fx.after(doR); },
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
    water: { snd: 'water' },
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
    bath: { snd: 'splash', start: () => bathStart(), end: () => releaseSimba(), after: () => say('Simba is clean and fluffy again! 🫧') },
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
  // surprise events: blackout, Aunt Mahin, VIPs, the witches, Simba the thief
  function eventTick(dt) {
    const c = G.cfg, mod = c.mod || {};
    if (G.blackout) {
      G.blackout.t -= dt;
      const el = G.blackout.el;
      if (el.parentNode !== G.layers[G.view]) layer(G.view).appendChild(el);
      const [x, y] = G.nena.room === G.view ? [G.nena.x, G.nena.y - 70] : [-200, -200];
      el.style.background = `radial-gradient(circle at ${x.toFixed(0)}px ${y.toFixed(0)}px, rgba(10,8,24,0) 0, rgba(10,8,24,0) 95px, rgba(10,8,24,.9) 175px)`;
      if (G.blackout.t <= 0) { el.remove(); G.blackout = null; toast('💡 The power is back!', '', 1200); }
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
    const speed = 390 * (fast || 1) * (1 + 0.2 * up('shoes')) * (G.boostT > 0 ? 1.6 : 1) * (G.boosts.coffee ? 1.2 : 1);
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
    if (G.cfg.endless) { G.elapsed += dt; G.time = 99999; }
    if (!G.cfg.endless && !G.rushHour && G.time <= 15) { G.rushHour = true; $('g-rush').hidden = false; toast('⏰ Rush hour! Points ×1.5', 'combo', 1800); snd('fanfare'); }
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
    G.tabT = (G.tabT || 0) - dt; if (G.tabT <= 0) { G.tabT = 0.14; renderTabs(); }
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
    put('g-score', 'text', String(G.score));
    put('g-fill', 'width', Math.min(100, (G.score / c.targets[2]) * 100).toFixed(1) + '%');
    put('g-star1', '.on', G.score >= c.targets[0]); put('g-star2', '.on', G.score >= c.targets[1]); put('g-star3', '.on', G.score >= c.targets[2]);
    put('g-hearts', 'html', Array.from({ length: G.maxHearts }, (_, i) => `<i class="${i < G.hearts ? 'on' : ''}">♥</i>`).join(''));
    put('g-combo', 'html', G.combo > 1 ? `Combo ×${G.combo} <i style="width:${Math.round(Math.max(0, G.comboT / 6) * 20) * 5}%"></i>` : (G.boostT > 0 ? '⚡ Chai rush!' : G.freezeT > 0 ? '❄️ Treat time' : ''));
    const starsNow = G.score >= c.targets[2] ? 3 : G.score >= c.targets[1] ? 2 : G.score >= c.targets[0] ? 1 : 0;
    if (starsNow > G.starsShown) { G.starsShown = starsNow; snd('coin'); const st = $('g-star' + starsNow); st.classList.remove('pop'); void st.offsetWidth; st.classList.add('pop'); }
    put('g-coins', 'text', String(save.coins + G.coins));
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
    save.coins += earned;
    if (!lost) { track('day'); if (stars === 3) track('perfect'); if (G.failed === 0) track('nohit'); }
    const ups = FRIENDS.filter((f) => friendLv(f.id) > (G.frStart[f.id] || 0));
    ups.forEach((f) => { extra += `<li class="ok"><span>❤️ ${f.name}: ${FR_TITLES[friendLv(f.id)]}!</span><b>new scene</b></li>`; });
    G.pendingScene = null;
    const ch = !c.endless && !c.challenge && chapterOf(G.n);
    if (stars > 0 && ch && ch.to === G.n && !save.chapters[ch.title]) { save.chapters[ch.title] = 1; G.pendingScene = ch; extra += `<li class="ok"><span>📖 ${ch.title} complete!</span><b>▶</b></li>`; }
    if (stars > 0 && !c.endless && !c.challenge) {
      save.stars[G.n] = Math.max(save.stars[G.n] || 0, stars);
      save.best[G.n] = Math.max(save.best[G.n] || 0, final);
      if (G.n === save.level) save.level = G.n + 1;
    }
    persist();
    $('r-title').textContent = lost ? 'Too many upset faces…' : stars ? ['', 'Day done!', 'Great day!', 'Perfect day!'][stars] : 'Not quite…';
    $('r-stars').innerHTML = [0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}">★</span>`).join('');
    $('r-lines').innerHTML = `<li><span>Requests done</span><b>${G.done}</b></li><li><span>Missed</span><b>${G.failed}</b></li>${mess ? `<li><span>Mess left (${mess})</span><b>−${penalty}</b></li>` : ''}${c.obj ? `<li class="${objOk ? 'ok' : 'ko'}"><span>🏅 ${c.obj.label}</span><b>${objOk ? (medalNew ? '+25 🪙' : '✓') : '✗'}</b></li>` : ''}<li class="total"><span>Score</span><b>${final}</b></li><li><span>Coins earned</span><b>+${earned} 🪙</b></li>${extra}`;
    $('r-sub').textContent = lost ? 'The family lost patience. Try again, and watch the rings!' : stars ? `Goal: ${c.targets[0]} · ${c.targets[1]} · ${c.targets[2]}` : `You needed ${c.targets[0]} points for 1 star.`;
    $('r-next').hidden = !stars || !!c.endless || !!c.challenge;
    $('r-title').textContent = c.endless ? 'Endless day over!' : $('r-title').textContent;
    $('r-portrait').innerHTML = A.portrait(stars >= 2 ? 'nena' : stars ? 'nena' : 'nena', stars >= 2 ? 'happy' : stars ? 'neutral' : 'sad');
    $('screen-result').hidden = false;
    const tot = document.querySelector('#r-lines li.total b');
    if (tot) { const goal = final, t0 = performance.now(); const step = (t) => { const k = Math.min(1, (t - t0) / 900); tot.textContent = Math.round(goal * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
    snd(stars >= 2 ? 'fanfare' : stars ? 'success' : 'fail');
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
    { id: 'cuddle10', icon: '🦁', name: 'Baba’s lion', desc: 'Put Simba on Baba’s belly 10 times', test: (t) => (t.req_cuddle || 0) >= 10, r: 60 },
  ];
  const MISSIONS = [
    { k: 'req_walk', n: 12, label: 'Walk Simba 12 times', r: 80 }, { k: 'req_tea', n: 12, label: 'Serve Baba 12 teas', r: 80 },
    { k: 'req_insta', n: 5, label: 'Turn Pourya down 5 times', r: 90 }, { k: 'perfect', n: 3, label: 'Get 3 stars on 3 days', r: 120 },
    { k: 'sort', n: 6, label: 'Solve 6 Color Sorts', r: 100 }, { k: 'req_phone', n: 8, label: 'Answer Baba 8 times', r: 90 },
    { k: 'req', n: 80, label: 'Complete 80 requests', r: 150 }, { k: 'combo5', n: 5, label: 'Reach a ×5 combo 5 times', r: 120 },
    { k: 'photo', n: 2, label: 'Take 2 Simba photos', r: 100 }, { k: 'req_bread', n: 5, label: 'Buy 5 sangak breads', r: 80 },
    { k: 'gift', n: 3, label: 'Turn Jesus down 3 times', r: 90 },
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
    { id: 'neon', room: 'bedroom', name: 'Neon sign “Nena ♥ Simba”', icon: '💡', cost: 130, svg: '<text x="155" y="372" text-anchor="middle" font-size="26" font-family="Baloo 2, sans-serif" font-weight="800" fill="#ffd1e6" stroke="#ff5fa2" stroke-width="2">Nena ♥ Simba</text><ellipse cx="155" cy="362" rx="120" ry="30" fill="url(#rneon)"/>' },
    { id: 'canopy', room: 'bedroom', name: 'Bed canopy', icon: '🎀', cost: 120, svg: '<path d="M30 330 q125 -60 250 0 l-10 260 q-115 30 -230 0z" fill="#fff" opacity=".28"/><path d="M30 330 q125 -60 250 0" stroke="#f3c6d5" stroke-width="6" fill="none"/>' },
    { id: 'vanity', room: 'bedroom', name: 'Hollywood mirror lights', icon: '✨', cost: 90, svg: [...Array(10)].map((_, i) => `<circle cx="${505 + Math.cos(i * 0.628) * 64}" cy="${190 + Math.sin(i * 0.628) * 64}" r="6" fill="#fff6c4"/><circle cx="${505 + Math.cos(i * 0.628) * 64}" cy="${190 + Math.sin(i * 0.628) * 64}" r="14" fill="url(#rglow)"/>`).join('') },
    { id: 'gallery', room: 'hall', name: 'Family photo gallery', icon: '📷', cost: 80, svg: [[146, 330, '#f3c6d5'], [284, 340, '#bfe0f0'], [418, 330, '#f6e1b0']].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="26" height="34" fill="#6b4632"/><rect x="${x + 3}" y="${y + 3}" width="20" height="28" fill="${c}"/><circle cx="${x + 13}" cy="${y + 14}" r="5" fill="#c9496f" opacity=".6"/>`).join('') },
  ];
  const cozy = () => Object.keys(save.decor).length;
  const OUTFIT_SHOP = [
    { id: 'basique', name: 'Everyday stripes', cost: 0 }, { id: 'sweat', name: 'Lilac sweater', cost: 60 }, { id: 'denim', name: 'Denim day', cost: 80 },
    { id: 'rose', name: 'Rose top', cost: 90 }, { id: 'cire', name: 'Yellow raincoat', cost: 100 }, { id: 'robe', name: 'Sunny dress', cost: 120 },
    { id: 'persian', name: 'Persian green', cost: 140 }, { id: 'night', name: 'CLAP night out', cost: 160 },
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
  const missionsReady = () => weekMissions().some((m, i) => !save.week.claimed[i] && (save.week.prog[m.k] || 0) >= m.n);
  const scenesNew = () => FRIENDS.some((f) => { for (let l = 1; l <= friendLv(f.id); l++) if (!save.scenes[f.id + l]) return true; return false; });

  /* ---- hub on the map ---- */
  function renderHub() {
    const items = [
      ['daily', '🎁', 'Daily', dailyReady() ? '!' : ''], ['sort', '🧪', 'Color Sort', sortLeft() || ''], ['challenge', '🎯', 'Challenge', chalReady() ? '!' : ''],
      ['missions', '📋', 'Missions', missionsReady() ? '!' : ''], ['family', '❤️', 'Family', scenesNew() ? 'new' : ''], ['decor', '🛋️', 'Decor', ''],
      ['nails', '💅', 'Nail day', nailsReady() ? '!' : ''], ['wardrobe', '👗', 'Wardrobe', ''], ['album', '📸', 'Album', `${Object.keys(save.album).length}/${PHOTOS.length}`], ['trophies', '🏆', 'Trophies', `${Object.keys(save.ach).length}/${ACH.length}`],
      ['endless', '♾️', 'Endless', ''],
    ];
    $('m-hub').innerHTML = items.map(([id, ico, name, b]) => `<button type="button" class="hub-btn" data-hub="${id}"><span class="hub-i">${ico}</span><span class="hub-n">${name}</span>${b !== '' ? `<em class="${/^\d+\/\d+$/.test(String(b)) ? 'soft' : ''}">${b}</em>` : ''}</button>`).join('');
  }
  let dailyShown = false;

  /* ---- generic sheet ---- */
  let sheetKind = '';
  function openSheet(kind) {
    if (kind === 'nails') { startNailDay(); return; }
    sheetKind = kind;
    const T = { daily: '🎁 Daily reward', sort: '🧪 Daily Color Sort', challenge: '🎯 Daily challenge', missions: '📋 Weekly missions', family: '❤️ Family', decor: '🛋️ Decorate the flat', wardrobe: '👗 Wardrobe', album: '📸 Photo album', trophies: '🏆 Trophies', endless: '♾️ Endless day' };
    $('sh2-title').textContent = T[kind] || '';
    $('sh2-coins').textContent = save.coins;
    $('sh2-body').innerHTML = SHEETS[kind]();
    show('screen-sheet');
  }
  const bar = (v, n) => `<span class="pbar"><i style="width:${Math.min(100, (v / n) * 100)}%"></i></span>`;
  const SHEETS = {
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
    missions: () => `<p class="sh-lede">New missions every week.</p>` + weekMissions().map((m, i) => { const v = save.week.prog[m.k] || 0, ok = v >= m.n, got = save.week.claimed[i]; return `<div class="row-card${got ? ' done' : ''}"><span class="rc-i">📋</span><span class="rc-t"><b>${m.label}</b>${bar(v, m.n)}<small>${Math.min(v, m.n)}/${m.n} · +${m.r} 🪙</small></span>${got ? '<b class="ok">✓</b>' : `<button type="button" class="btn ${ok ? 'btn-primary' : ''}" data-act="claim-mission" data-i="${i}" ${ok ? '' : 'disabled'}>Claim</button>`}</div>`; }).join(''),
    family: () => FRIENDS.map((f) => {
      const lv = friendLv(f.id), pts = save.friend[f.id] || 0, next = FR_LV[lv + 1];
      const scenes = [1, 2, 3, 4].map((l) => `<button type="button" class="scene-b${l <= lv ? '' : ' locked'}${l <= lv && !save.scenes[f.id + l] ? ' new' : ''}" data-act="scene" data-f="${f.id}" data-l="${l}" ${l <= lv ? '' : 'disabled'}>${l <= lv ? '▶' : '🔒'} ${l}</button>`).join('');
      return `<div class="fam"><span class="fam-p">${A.portrait(f.pic, 'happy')}</span><span class="fam-t"><b>${f.name} <small>${FR_TITLES[lv]}</small></b><span class="hearts-s">${'❤️'.repeat(lv)}${'🤍'.repeat(4 - lv)}</span>${next ? bar(pts - FR_LV[lv], next - FR_LV[lv]) : '<small>Max friendship!</small>'}<span class="scenes">${scenes}</span></span></div>`;
    }).join('') + '<p class="sh-lede small">Help someone to grow your friendship. Each level unlocks a little scene and makes them a bit more patient.</p>',
    decor: () => ['salon', 'kitchen', 'tv', 'hall', 'bedroom'].map((room) => `<h4 class="sh-h">${ROOMS[room].icon} ${ROOMS[room].name}</h4>` + DECOR.filter((d) => d.room === room).map((d) => { const own = save.decor[d.id]; return `<div class="row-card${own ? ' done' : ''}"><span class="rc-i">${d.icon}</span><span class="rc-t"><b>${d.name}</b><small>+1% patience for everyone</small></span>${own ? '<b class="ok">✓</b>' : `<button type="button" class="btn btn-primary" data-act="buy-decor" data-id="${d.id}" ${save.coins < d.cost ? 'disabled' : ''}>${d.cost} 🪙</button>`}</div>`; }).join('')).join(''),
    wardrobe: () => `<h4 class="sh-h">Nena’s outfits</h4><div class="wardrobe">${OUTFIT_SHOP.map((o) => { const own = save.owned[o.id], on = save.outfit === o.id; return `<button type="button" class="ward${on ? ' on' : ''}" data-act="outfit" data-id="${o.id}" ${!own && save.coins < o.cost ? 'disabled' : ''}><span class="ward-p">${A.nena({ dressed: true, outfit: o.id, eyes: 'open' })}</span><small>${o.name}</small><b>${on ? 'Wearing' : own ? 'Wear' : o.cost + ' 🪙'}</b></button>`; }).join('')}</div>
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
    if (act === 'claim-daily') {
      const streak = save.daily.last === dayKey(-1) ? save.daily.streak + 1 : 1;
      const gain = DAILY[(streak - 1) % 7];
      save.daily = { last: today(), streak }; save.coins += gain; persist(); snd('coin'); confetti(); toast(`🎁 +${gain} coins! Streak: ${streak} day${streak > 1 ? 's' : ''}`, 'combo', 1800); checkAch();
    } else if (act === 'sort') { startSort(+b.dataset.i); return; }
    else if (act === 'challenge') { const c = todayChal(); playCustom(challengeCfg(c)); return; }
    else if (act === 'endless') { playCustom(endlessCfg()); return; }
    else if (act === 'claim-mission') { const i = +b.dataset.i, m = weekMissions()[i]; save.week.claimed[i] = true; save.coins += m.r; persist(); snd('coin'); toast(`📋 Mission complete! +${m.r} 🪙`, 'combo', 1600); }
    else if (act === 'scene') { const f = b.dataset.f, l = +b.dataset.l; save.scenes[f + l] = 1; persist(); playScene(SCENES[f][l - 1], `${FRIENDS.find((x) => x.id === f).name} · ${FR_TITLES[l]}`, () => openSheet('family')); return; }
    else if (act === 'buy-decor') { const d = DECOR.find((x) => x.id === b.dataset.id); if (save.coins < d.cost) return; save.coins -= d.cost; save.decor[d.id] = 1; persist(); snd('coin'); toast(`${d.icon} ${d.name} added to the ${ROOMS[d.room].name.toLowerCase()}!`, 'hint', 1800); checkAch(); }
    else if (act === 'outfit') { const o = OUTFIT_SHOP.find((x) => x.id === b.dataset.id); if (!save.owned[o.id]) { if (save.coins < o.cost) return; save.coins -= o.cost; save.owned[o.id] = 1; snd('coin'); } save.outfit = o.id; persist(); }
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
  function playScene(lines, title, after) { storyLines = lines.slice(); storyAfter = after; storyTitle = title; show('screen-story'); nextLine(); }

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
        if (first) { save.coins += L.reward; track('sort'); if (save.sortd.done.filter(Boolean).length === 3) track('sort3'); }
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
    ['screen-title', 'screen-map', 'screen-game', 'screen-result', 'screen-shop', 'screen-story', 'screen-pause', 'screen-prep', 'screen-sheet', 'screen-sort', 'screen-nails'].forEach((s) => { $(s).hidden = s !== id && !(id === 'screen-result' && s === 'screen-game') && !(id === 'screen-pause' && s === 'screen-game'); });
  }
  function renderMap() {
    const total = Object.values(save.stars).reduce((a, b) => a + b, 0);
    $('m-coins').textContent = save.coins;
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
    show('screen-map');
    if (dailyReady() && !dailyShown) { dailyShown = true; setTimeout(() => openSheet('daily'), 350); }
    const cur = document.querySelector('.node.current');
    if (cur) cur.scrollIntoView({ block: 'center' });
  }
  const PLACE_LABEL = { home: '🏠 Home', street: '🌳 Tehran street', clap: '🏮 CLAP' };
  const NAMES = { leila: 'Leila', courier: 'Delivery', aunt: 'Aunt Mahin', pourya: 'Pourya', nena: 'Nena', simba: 'Simba', mohsen: 'Baba', fariba: 'Maman', nasim: 'Nasim', negin: 'Negin' };
  let storyLines = [], storyLevel = 1;
  function playStory(n) {
    CUSTOM = null; storyAfter = null; storyTitle = '';
    storyLevel = n;
    storyLines = (levelCfg(n).story || []).slice();
    show('screen-story');
    nextLine();
  }
  function nextLine() {
    const l = storyLines.shift();
    if (!l) { if (storyAfter) { const f = storyAfter; storyAfter = null; storyTitle = ''; f(); } else renderPrep(storyLevel); return; }
    const [who, mood, text] = l;
    $('s-portrait').innerHTML = A.portrait(who, mood);
    $('s-name').textContent = NAMES[who] || who;
    $('s-text').textContent = text;
    $('s-day').textContent = storyTitle || `Day ${storyLevel} · ${levelCfg(storyLevel).day}`;
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
  window.addEventListener('pointerup', onSwipeEnd);
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
  const afterScene = (fn) => { if (G.pendingScene) { const ch = G.pendingScene; G.pendingScene = null; playScene(ch.end, ch.title, fn); } else fn(); };
  $('r-next').addEventListener('click', () => { const n = G.n + 1; afterScene(() => playStory(n)); });
  $('r-retry').addEventListener('click', () => { if (G.cfg.n > 900) playCustom(G.cfg); else renderPrep(G.n); });
  $('r-map').addEventListener('click', () => afterScene(renderMap));
  $('na-body').addEventListener('click', (e) => { if (ND && ND.i < 99) nailsClick(e); });
  $('na-done').addEventListener('click', () => { if (!ND) return; if (ND.i === 99) { ND = null; renderMap(); } else nailsNext(); });
  $('na-back').addEventListener('click', () => { ND = null; renderMap(); });
  $('m-hub').addEventListener('click', (e) => { const b = e.target.closest('[data-hub]'); if (b) { snd('tab'); openSheet(b.dataset.hub); } });
  $('sh2-body').addEventListener('click', sheetAction);
  $('sh2-back').addEventListener('click', () => { snd('click'); renderMap(); });
  $('so-back').addEventListener('click', () => openSheet('sort'));
  $('so-tubes').addEventListener('click', (e) => { const g = e.target.closest('[data-i]'); if (g) window.ColorSort.tap(+g.dataset.i); });
  $('so-undo').addEventListener('click', () => window.ColorSort.undo());
  $('so-restart').addEventListener('click', () => window.ColorSort.restart());
  $('g-pause').addEventListener('click', () => { if (!G || G.over) return; G.paused = true; show('screen-pause'); });
  $('p-resume').addEventListener('click', () => { G.paused = false; last = performance.now(); show('screen-game'); });
  $('p-quit').addEventListener('click', () => { G.over = true; cancelAnimationFrame(raf); CUSTOM = null; renderMap(); });
  $('p-sound').addEventListener('click', () => { save.sound = save.sound === false; save.music = save.sound; persist(); wake(); $('p-sound').textContent = save.sound ? 'Sound: on' : 'Sound: off'; });
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
