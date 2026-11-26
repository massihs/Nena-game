/* Story mode: 4 chapters over 4 weeks, characters, branching dialogue and goals.
   Talks to the game through window.Game (exported by game.js). */
window.Story = (function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const G = () => window.Game;
  const S = () => window.Game.S;

  const NAMES = { nena: 'Nena', simba: 'Simba', mia: 'Mia', biscuit: 'Biscuit', grandma: 'Grandma Rose', lee: 'Dr. Lee', sam: 'Sam' };
  const VOICE = { nena: 620, simba: 300, mia: 700, biscuit: 380, grandma: 520, lee: 560, sam: 420 };

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */
  const F = (s) => s.story.flags;
  const rel = (who, n) => (s) => { s.story.rel[who] = Math.max(0, Math.min(10, (s.story.rel[who] || 0) + n)); };
  const flag = (k, v = true) => (s) => { s.story.flags[k] = v; };
  const tricks = (s) => Object.values(s.pet.tricks).filter((v) => v >= 100).length;
  const sday = (s) => s.day - s.story.base;

  /* ------------------------------------------------------------------ */
  /* Chapters                                                            */
  /* ------------------------------------------------------------------ */
  const CHAPTERS = [
    {
      n: 1, title: 'A New Leash on Life', days: [1, 7],
      blurb: 'New apartment, new routine. Grandma Rose visits on Sunday (day 7) at 3 PM to see if Nena can handle a chow chow on her own.',
      goals: [
        { label: 'Meet your neighbor', check: (s) => !!F(s).met_mia },
        { label: 'Teach Simba “Sit”', check: (s) => s.pet.tricks.sit >= 100, prog: (s) => Math.min(100, Math.round(s.pet.tricks.sit)) + '%' },
        { label: 'Tidy home (70+) for Grandma', check: (s) => s.maison.proprete >= 70, live: true },
        { label: 'Happy Simba (60+) for Grandma', check: (s) => s.simba.bonheur >= 60, live: true },
      ],
    },
    {
      n: 2, title: 'The Big Birthday', days: [8, 14],
      blurb: 'Simba turns 2 on Sunday (day 14)! The party starts at 5 PM: cake, gift, guests, and a new trick to show off.',
      goals: [
        { label: 'Order the cake', check: (s) => !!F(s).cake },
        { label: 'Buy a gift', check: (s) => !!F(s).gift },
        { label: 'Send the invitations', check: (s) => !!F(s).invited },
        { label: 'Teach Simba “Paw”', check: (s) => s.pet.tricks.paw >= 100, prog: (s) => Math.min(100, Math.round(s.pet.tricks.paw)) + '%' },
      ],
    },
    {
      n: 3, title: 'Under the Weather', days: [15, 21],
      blurb: 'Simba is not himself. Get him to Dr. Lee, give his medicine morning and evening, and keep him company.',
      goals: [
        { label: 'See Dr. Lee', check: (s) => !!F(s).vet_seen },
        { label: 'Give the medicine 6 times', check: (s) => s.pet.meds >= 6, prog: (s) => `${s.pet.meds}/6` },
        { label: 'Simba fully recovered', check: (s) => !!F(s).recovered },
      ],
    },
    {
      n: 4, title: 'Best in Show', days: [22, 28],
      blurb: 'The Neighborhood Dog Show is on Sunday (day 28) at 2 PM. Judges look at tricks, coat and the bond between you.',
      goals: [
        { label: 'Know 4 tricks', check: (s) => tricks(s) >= 4, prog: (s) => `${tricks(s)}/4` },
        { label: 'Agility practice ×3', check: (s) => (F(s).practice || 0) >= 3, prog: (s) => `${F(s).practice || 0}/3` },
        { label: 'Coat 90+ on show day', check: (s) => s.simba.pelage >= 90, live: true },
        { label: 'Simba joy 70+ on show day', check: (s) => s.simba.bonheur >= 70, live: true },
      ],
    },
  ];
  function chapterOf(s) {
    const d = sday(s);
    if (s.story.ended || d > 28) return null;
    return CHAPTERS.find((c) => d >= c.days[0] && d <= c.days[1]) || null;
  }

  /* ------------------------------------------------------------------ */
  /* Scenes                                                              */
  /* step: {s:who, m:mood, t:text|fn, phone:bool} | {n:text} | {card:{t,sub}}  */
  /*       {do:fn} | {if:fn, then:[], else:[]} | {choice:[{t, do, then}]}      */
  /* ------------------------------------------------------------------ */
  const SCENES = {
    ch1_intro: [
      { n: 'A cold, wet nose presses against Nena’s cheek. Boop.' },
      { s: 'nena', m: 'neutral', t: 'Mmh… good morning, Simba. Is it breakfast time already?' },
      { s: 'simba', m: 'happy', t: 'Woof!' },
      { s: 'nena', t: 'Okay, okay. New apartment, new routine. Just you and me now, big guy.' },
      { s: 'nena', m: 'neutral', t: 'Grandma thinks I can’t handle a chow chow on my own. Let’s prove her wrong.' },
      { card: { t: 'Chapter 1', sub: 'A New Leash on Life' } },
      { n: 'Take care of Simba and get the home ready: Grandma visits on Sunday at 3 PM. Tap the gold banner to see your goals.' },
    ],
    meet_mia: [
      { n: 'On the way back, a small red shiba bolts out of a doorway and runs straight at Simba.' },
      { s: 'biscuit', t: 'Yip! Yip yip!' },
      { s: 'mia', m: 'surprised', t: 'Biscuit! Sorry, sorry, she has zero manners. Oh wow, is that a chow chow? He looks like a lion cub!' },
      { s: 'nena', t: 'That’s Simba. He’s friendlier than he looks… most of the time.' },
      { s: 'mia', t: 'I’m Mia, I live right next door. Biscuit and I walk every evening.' },
      { choice: [
        { t: '“We’d love to join you sometime!”', do: (s) => { rel('mia', 2)(s); }, then: [{ s: 'mia', t: 'Yay! Find us outside between 5 and 8 PM.' }] },
        { t: '“Simba’s a little shy… maybe later.”', do: rel('mia', 1), then: [{ s: 'mia', m: 'neutral', t: 'No pressure. Biscuit will win him over eventually. She always does.' }] },
      ] },
      { s: 'mia', t: 'Oh, and if you want to teach him tricks, start with “Sit”. Short sessions, lots of treats, and reward at the exact right moment.' },
      { do: (s) => { flag('met_mia')(s); flag('training')(s); G().memory('meet_mia', 'A new friend', 'Simba met Biscuit the shiba and Mia from next door.', '🐕'); } },
      { n: 'New actions: “Training” in the living room and “Walk with Mia” outside in the evening.' },
    ],
    grandma_call: [
      { n: '📞 Grandma Rose is calling…' },
      { s: 'grandma', phone: true, t: 'Nena, darling! How are my favorite granddaughter and that walking teddy bear?' },
      { s: 'nena', t: 'We’re doing great, Grandma! Mostly.' },
      { s: 'grandma', phone: true, m: 'neutral', t: 'I’ll come by on Sunday afternoon to see for myself. I expect a tidy home and a happy dog!' },
      { choice: [
        { t: '“Can’t wait! Bring your lemon cake?”', do: rel('grandma', 1), then: [{ s: 'grandma', phone: true, t: 'Only if Simba stays off the sofa. Ha!' }] },
        { t: '“Sunday? Already?!”', then: [{ s: 'grandma', phone: true, m: 'surprised', t: 'Already! Chop chop, dear.' }] },
      ] },
      { n: 'Sunday, 3 PM: tidiness 70+ and Simba’s joy 60+. Bonus points if he knows “Sit”.' },
    ],
    grandma_visit: [
      { n: 'Ding-dong! Grandma Rose arrives with a lemon cake and a very serious inspection face.' },
      { s: 'grandma', m: 'neutral', t: 'Let me have a look at you two…' },
      { if: (s) => s.maison.proprete >= 70,
        then: [{ s: 'grandma', m: 'surprised', t: 'Spotless! Not a single orange hair on the rug. I’m impressed.' }, { do: (s) => { s.story.tmp = (s.story.tmp || 0) + 1; } }],
        else: [{ s: 'grandma', m: 'sad', t: 'Goodness, there’s enough fur on this floor to knit a second dog.' }] },
      { if: (s) => s.simba.bonheur >= 60,
        then: [{ s: 'grandma', t: 'And look at him wiggle! This dog is clearly loved.' }, { do: (s) => { s.story.tmp = (s.story.tmp || 0) + 1; } }],
        else: [{ s: 'grandma', m: 'sad', t: 'He looks a little glum, dear. Is he getting enough walks and cuddles?' }] },
      { if: (s) => s.pet.tricks.sit >= 100,
        then: [{ s: 'nena', t: 'Simba… sit!' }, { s: 'simba', m: 'happy', t: '*sits perfectly*' }, { s: 'grandma', m: 'surprised', t: 'He SITS? Oh, I take back everything I said!' }, { do: (s) => { s.story.tmp = (s.story.tmp || 0) + 1; } }] },
      { if: (s) => (s.story.tmp || 0) >= 2,
        then: [{ s: 'grandma', t: 'You’re doing a wonderful job, Nena. I’m proud of you.' }, { n: 'Grandma slips you $40 “for treats”.' },
          { do: (s) => { rel('grandma', 3)(s); G().money(40); flag('grandma_proud')(s); } }],
        else: [{ s: 'grandma', m: 'neutral', t: 'It’s a good start. I’ll be back to check, you know!' }, { do: rel('grandma', 1) }] },
      { do: (s) => { s.story.tmp = 0; G().memory('grandma', 'Grandma’s inspection', 'Grandma Rose came for lemon cake and a very thorough inspection.', '🍋'); } },
      { card: { t: 'Chapter 1 complete', sub: 'Next week: Simba’s birthday!' } },
    ],

    ch2_intro: [
      { s: 'nena', m: 'surprised', t: 'Simba… do you know what happens in one week? You turn TWO!' },
      { s: 'simba', t: '*head tilt*' },
      { s: 'nena', t: 'A party! Cake, a gift, friends… and maybe a new trick to show off.' },
      { card: { t: 'Chapter 2', sub: 'The Big Birthday' } },
      { n: 'Order a cake and buy a gift (outside), send invitations (living room) and teach Simba “Paw”. Party: Sunday at 5 PM.' },
    ],
    invites: [
      { s: 'nena', t: 'Okay, who’s on the guest list?' },
      { choice: [
        { t: 'Invite Mia and Biscuit', do: (s) => { flag('inv_mia')(s); rel('mia', 1)(s); }, then: [{ s: 'mia', phone: true, t: 'A doggy birthday party?! Biscuit will wear her fancy collar!' }] },
        { t: 'Keep it small', then: [{ s: 'nena', m: 'neutral', t: 'Maybe just family this time.' }] },
      ] },
      { choice: [
        { t: 'Invite Grandma Rose', do: (s) => { flag('inv_grandma')(s); rel('grandma', 1)(s); }, then: [{ s: 'grandma', phone: true, t: 'Wouldn’t miss it! I’m knitting him a little party hat.' }] },
        { t: 'Let Grandma rest this week', then: [{ s: 'nena', m: 'neutral', t: 'I’ll send her lots of photos instead.' }] },
      ] },
      { do: flag('invited') },
    ],
    boss_call: [
      { n: '📞 Sam, Nena’s boss, is calling…' },
      { s: 'sam', phone: true, m: 'neutral', t: 'Nena, sorry to bother you. Our biggest client moved the deadline. Could you finish the report tonight? There’s an $80 bonus.' },
      { choice: [
        { t: '“Sure, I’ll do it.”', do: (s) => { G().money(80); s.nena.energie -= 25; s.simba.bonheur -= 12; rel('sam', 2)(s); },
          then: [{ s: 'sam', phone: true, t: 'You’re a lifesaver!' }, { n: 'Nena works late. Simba sighs loudly from his bed. Very loudly.' }] },
        { t: '“Sorry Sam, tonight is for Simba.”', do: (s) => { s.nena.moral += 8; s.simba.bonheur += 10; },
          then: [{ s: 'sam', phone: true, t: 'Fair enough. Family first. Give that fluffball a scratch for me.' }] },
      ] },
    ],
    party: [
      { n: 'It’s 5 PM. Party time! Simba has no idea what’s going on, but he’s very excited about it.' },
      { if: (s) => F(s).inv_mia, then: [{ s: 'mia', t: 'Happy birthday, Simba! Biscuit made you a card. Well… she chewed it a little.' }, { s: 'biscuit', t: 'Yip!' }] },
      { if: (s) => F(s).inv_grandma, then: [{ s: 'grandma', t: 'Here’s your party hat, sweet boy. Hold still… there!' }] },
      { if: (s) => F(s).cake,
        then: [{ n: 'Nena brings out a dog-friendly peanut butter cake with two candles.' }, { s: 'simba', m: 'happy', t: '*drools a small lake*' }],
        else: [{ n: 'No cake… Nena improvises one out of kibble and a candle. Simba doesn’t mind at all.' }] },
      { if: (s) => F(s).gift, then: [{ n: 'Simba tears open his gift: a giant plush duck. It is now his favorite thing in the universe.' }] },
      { if: (s) => s.pet.tricks.paw >= 100, then: [{ s: 'nena', t: 'Simba, paw!' }, { s: 'simba', m: 'happy', t: '*offers a big fluffy paw*' }, { n: 'Everyone cheers!' }] },
      { do: (s) => {
        const pts = (F(s).cake ? 1 : 0) + (F(s).gift ? 1 : 0) + (F(s).inv_mia ? 1 : 0) + (F(s).inv_grandma ? 1 : 0) + (s.pet.tricks.paw >= 100 ? 1 : 0);
        s.simba.bonheur += 10 + pts * 6; s.nena.moral += 15; s.pet.age = 2;
        F(s).party_score = pts;
        G().memory('birthday', 'Simba turns 2', pts >= 4 ? 'The best party a chow chow could dream of.' : 'A cozy little party with a lot of love.', '🎂');
      } },
      { s: 'nena', t: 'Happy birthday, my big fluffy lion. Two years of you. Best two years ever.' },
      { card: { t: 'Chapter 2 complete', sub: (s) => `Party score: ${F(s).party_score || 0}/5` } },
    ],

    ch3_intro: [
      { n: 'This morning, Simba doesn’t come to wake you up.' },
      { s: 'nena', m: 'surprised', t: 'Simba? You didn’t touch your breakfast… and you’re so quiet.' },
      { s: 'simba', m: 'sad', t: '*weak tail thump*' },
      { s: 'nena', m: 'sad', t: 'Okay. We’re going to see Dr. Lee today. No arguments.' },
      { do: (s) => { s.pet.sick = true; s.pet.meds = 0; } },
      { card: { t: 'Chapter 3', sub: 'Under the Weather' } },
      { n: 'Get dressed and take Simba to the vet (outside, 9 AM to 6 PM).' },
    ],
    vet_visit: [
      { s: 'lee', t: 'Hello, Simba! Let’s have a look at you… gentle, gentle…' },
      { s: 'lee', m: 'neutral', t: 'Hmm. A mild stomach bug. Did he eat anything strange lately?' },
      { choice: [
        { t: '“He might have snacked on something at the park…”', then: [{ s: 'lee', t: 'Chow chows are curious. Keep an eye on him during walks.' }] },
        { t: '“Maybe too many treats?”', do: rel('lee', 1), then: [{ s: 'lee', t: 'Treats are fine in moderation. Let’s keep an eye on his weight too.' }] },
      ] },
      { s: 'lee', t: 'Give him this medicine twice a day, morning and evening, for three days. Rest, fresh water and lots of cuddles.' },
      { do: (s) => { flag('vet_seen')(s); rel('lee', 1)(s); } },
      { n: 'New action in the kitchen: “Give medicine” (before noon and after 5 PM).' },
    ],
    mia_help: [
      { s: 'mia', m: 'sad', t: 'I heard Simba’s sick! Poor baby. Do you want me to check on him while you work?' },
      { choice: [
        { t: '“That would help so much, thank you.”', do: (s) => { flag('mia_help')(s); rel('mia', 2)(s); }, then: [{ s: 'mia', t: 'Consider it done! Biscuit will be his nurse.' }] },
        { t: '“It’s okay, I’ll manage.”', then: [{ s: 'mia', m: 'neutral', t: 'Okay! Just knock if you need anything.' }] },
      ] },
    ],
    vet_nag: [
      { s: 'nena', m: 'sad', t: 'Simba still won’t eat… I really need to take him to Dr. Lee today.' },
      { do: (s) => { s.simba.bonheur -= 15; } },
    ],
    recovered: [
      { n: 'Simba suddenly leaps off his bed and does three laps around the apartment. The zoomies are back!' },
      { s: 'nena', m: 'surprised', t: 'Look at you! You’re back!' },
      { s: 'simba', m: 'happy', t: 'WOOF!' },
      { do: (s) => { s.pet.sick = false; flag('recovered')(s); s.simba.bonheur += 25; G().memory('recovered', 'Back on four paws', 'After three days of medicine and cuddles, Simba got his zoomies back.', '💪'); } },
      { if: (s) => F(s).mia_help, then: [{ s: 'mia', phone: true, t: 'Biscuit says she takes full credit for this.' }] },
      { card: { t: 'Simba recovered!', sub: 'Chapter 4 begins next week' } },
    ],

    ch4_intro: [
      { n: 'Knock knock knock!' },
      { s: 'mia', m: 'surprised', t: 'Nena! Did you see the poster? The Neighborhood Dog Show is next Sunday!' },
      { s: 'mia', t: 'Biscuit is entering agility. Simba HAS to enter Best in Show!' },
      { choice: [
        { t: '“Simba? On stage? …Let’s do it!”', do: (s) => { rel('mia', 1)(s); s.nena.moral += 5; } },
        { t: '“He’ll probably just lie down. But okay.”', then: [{ s: 'mia', t: 'Then teach him “Down” and call it a trick!' }] },
      ] },
      { card: { t: 'Chapter 4', sub: 'Best in Show' } },
      { n: 'Learn 4 tricks, practice agility 3 times (outside), and have a shiny coat and a happy Simba on Sunday at 2 PM.' },
    ],
    show: [
      { n: 'The park is full of dogs, ribbons and proud owners. The judge, a tall man with a clipboard, calls: “Number 7, Simba!”' },
      { s: 'mia', t: 'You’ve got this! Biscuit already won a ribbon for “Most Enthusiastic”.' },
      { do: (s) => { s.story.tmp = 0; } },
      { if: (s) => tricks(s) >= 1, then: [{ n: (s) => `Simba performs ${tricks(s)} trick${tricks(s) > 1 ? 's' : ''}: ${Object.entries(s.pet.tricks).filter(([, v]) => v >= 100).map(([k]) => G().trickName(k)).join(', ')}.` }, { do: (s) => { s.story.tmp += tricks(s); } }],
        else: [{ n: 'Simba sits down… lies down… and falls asleep on stage. The crowd goes “awww”.' }] },
      { if: (s) => s.simba.pelage >= 90, then: [{ n: 'The judge runs a hand through Simba’s coat and raises an eyebrow. “Magnificent.”' }, { do: (s) => { s.story.tmp += 2; } }],
        else: [{ n: '“A bit fluffy in the wrong places,” the judge mutters.' }] },
      { if: (s) => s.simba.bonheur >= 70, then: [{ n: 'Simba trots back to Nena and leans against her legs, tail wagging. Everyone can see the bond.' }, { do: (s) => { s.story.tmp += 2; } }] },
      { if: (s) => (F(s).practice || 0) >= 3, then: [{ do: (s) => { s.story.tmp += 1; } }] },
      { if: (s) => s.story.tmp >= 8,
        then: [{ n: '“And Best in Show goes to… SIMBA!”' }, { s: 'nena', m: 'surprised', t: 'WHAT?! Simba, you did it!!' }, { do: (s) => { F(s).show = 1; G().money(100); G().memory('show', 'Best in Show!', 'First place at the Neighborhood Dog Show. The fluffiest champion.', '🏆'); } }],
        else: [{ if: (s) => s.story.tmp >= 5,
          then: [{ n: '“Second place: Simba, the chow chow!”' }, { s: 'nena', t: 'Second place! I’m so proud of you!' }, { do: (s) => { F(s).show = 2; G().money(50); G().memory('show', 'Silver ribbon', 'Second place at the Neighborhood Dog Show.', '🥈'); } }],
          else: [{ n: '“And a special ribbon for… Fluffiest Dog in Show: Simba!”' }, { s: 'nena', t: 'Fluffiest! Honestly, that’s the most accurate award ever.' }, { do: (s) => { F(s).show = 3; G().money(25); G().memory('show', 'Fluffiest Dog in Show', 'A special ribbon for the fluffiest dog in the neighborhood.', '🎀'); } }] }] },
      { goto: 'epilogue' },
    ],
    epilogue: [
      { n: 'That evening, back home, Nena and Simba collapse onto the bed together.' },
      { s: 'nena', t: 'Four weeks ago it was just you and me in a new apartment. Look at us now.' },
      { if: (s) => (s.story.rel.grandma || 0) >= 3, then: [{ s: 'grandma', phone: true, t: 'I saw the photos! I always knew you could do it, darling.' }] },
      { if: (s) => (s.story.rel.mia || 0) >= 4, then: [{ s: 'mia', phone: true, t: 'Same time tomorrow at the park? Biscuit is already waiting by the door.' }] },
      { s: 'simba', m: 'happy', t: '*happy chow chow grumble*' },
      { do: (s) => { s.story.ended = true; G().memory('season', 'Our first season', 'Four weeks, one apartment, two best friends.', '💕'); } },
      { card: { t: 'The End', sub: 'of Season 1. Life with Simba goes on in free play.' } },
    ],
  };

  /* Triggers: by story day (+ optional time), or by game event. */
  const TRIGGERS = [
    { id: 'ch1_intro', day: 1, at: 0 },
    { id: 'meet_mia', event: 'walk', when: (s) => sday(s) <= 7 && !F(s).met_mia },
    { id: 'meet_mia', day: 2, at: 17 * 60, when: (s) => !F(s).met_mia },
    { id: 'grandma_call', day: 4, at: 18 * 60 },
    { id: 'grandma_visit', day: 7, at: 15 * 60 },
    { id: 'ch2_intro', day: 8, at: 0 },
    { id: 'boss_call', day: 10, at: 18 * 60 },
    { id: 'party', day: 14, at: 17 * 60 },
    { id: 'ch3_intro', day: 15, at: 0 },
    { id: 'mia_help', day: 16, at: 9 * 60, when: (s) => s.pet.sick },
    { id: 'vet_nag', day: 17, at: 0, when: (s) => !F(s).vet_seen },
    { id: 'recovered', event: 'medicine', when: (s) => s.pet.meds >= 6 && !F(s).recovered },
    { id: 'ch4_intro', day: 22, at: 0 },
    { id: 'show', day: 28, at: 14 * 60 },
  ];

  /* ------------------------------------------------------------------ */
  /* Runner                                                              */
  /* ------------------------------------------------------------------ */
  const queue = [];
  let stack = null; // [{steps, i}]
  let typing = null;
  let onDone = null;

  const active = () => !!stack || queue.length > 0;

  function play(id, cb) {
    if (!SCENES[id]) return;
    queue.push([id, cb]);
    if (!stack) next();
  }
  function next() {
    const item = queue.shift();
    if (!item) return;
    const [id, cb] = item;
    S().story.seen.push(id);
    onDone = cb || null;
    stack = [{ steps: SCENES[id], i: 0 }];
    $('dlg').hidden = false;
    G().pauseFx(true);
    advance();
  }
  function finish() {
    stack = null;
    $('dlg').hidden = true;
    $('dlg-card').hidden = true;
    G().pauseFx(false);
    G().after();
    const cb = onDone; onDone = null;
    if (cb) cb();
    if (queue.length) setTimeout(next, 250);
    else setTimeout(check, 400);
  }
  function advance() {
    const s = S();
    while (stack && stack.length) {
      const top = stack[stack.length - 1];
      if (top.i >= top.steps.length) { stack.pop(); continue; }
      const st = top.steps[top.i++];
      if (st.do) { st.do(s); continue; }
      if (st.goto) { stack = [{ steps: SCENES[st.goto], i: 0 }]; s.story.seen.push(st.goto); continue; }
      if (st.if) { const branch = st.if(s) ? st.then : st.else; if (branch) stack.push({ steps: branch, i: 0 }); continue; }
      if (st.card) { showCard(st.card); return; }
      if (st.choice) { showChoice(st.choice); return; }
      showLine(st); return;
    }
    finish();
  }
  function showLine(st) {
    $('dlg-card').hidden = true;
    $('dlg-choices').innerHTML = '';
    const who = st.s || null;
    const text = typeof (st.t || st.n) === 'function' ? (st.t || st.n)(S()) : (st.t || st.n);
    const box = $('dlg');
    box.classList.toggle('narrator', !who);
    box.classList.toggle('phone', !!st.phone);
    $('dlg-portrait').innerHTML = who ? window.Art.portrait(who, st.m || 'happy') : '';
    $('dlg-portrait').className = 'dlg-portrait' + (who ? ' in' : '') + (who === 'simba' || who === 'biscuit' ? ' dog' : '');
    $('dlg-name').textContent = who ? NAMES[who] + (st.phone ? ' 📞' : '') : '';
    $('dlg-name').hidden = !who;
    $('dlg-next').hidden = true;
    const el = $('dlg-text');
    let i = 0;
    clearInterval(typing);
    el.textContent = '';
    typing = setInterval(() => {
      i += 2;
      el.textContent = text.slice(0, i);
      if (who && i % 6 === 0) G().snd('talk', VOICE[who]);
      if (i >= text.length) { clearInterval(typing); typing = null; $('dlg-next').hidden = false; }
    }, 22);
    box.dataset.full = text;
  }
  function showChoice(choices) {
    $('dlg-next').hidden = true;
    $('dlg-choices').innerHTML = choices.map((c, k) => `<button type="button" class="dlg-choice" data-k="${k}">${c.t}</button>`).join('');
    $('dlg-choices')._choices = choices;
    G().snd('pop');
  }
  function showCard(card) {
    const c = $('dlg-card');
    c.hidden = false;
    $('dlg-card-t').textContent = card.t;
    $('dlg-card-sub').textContent = typeof card.sub === 'function' ? card.sub(S()) : card.sub;
    c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
    G().snd('fanfare');
  }
  function onTap(e) {
    if (!stack) return;
    const btn = e.target.closest('.dlg-choice');
    if (btn) {
      const c = $('dlg-choices')._choices[+btn.dataset.k];
      $('dlg-choices').innerHTML = '';
      G().snd('click');
      if (c.do) c.do(S());
      if (c.then) stack.push({ steps: c.then, i: 0 });
      advance();
      return;
    }
    if ($('dlg-choices').children.length) return;
    if (typing) { clearInterval(typing); typing = null; $('dlg-text').textContent = $('dlg').dataset.full; $('dlg-next').hidden = false; return; }
    advance();
  }

  /* ------------------------------------------------------------------ */
  /* Trigger checks                                                      */
  /* ------------------------------------------------------------------ */
  function seen(id) { return S().story.seen.includes(id); }
  function check() {
    const s = S();
    if (!s || !s.story || active() || G().blocked()) return false;
    const d = sday(s);
    for (const t of TRIGGERS) {
      if (t.event || seen(t.id)) continue;
      if (d < t.day) continue;
      if (d === t.day && s.time < t.at) continue;
      // a missed timed event from an earlier day still plays, but intros only play on their own day
      if (d > t.day && /intro|nag/.test(t.id)) continue;
      if (t.when && !t.when(s)) continue;
      play(t.id);
      return true;
    }
    return false;
  }
  function event(name) {
    const s = S();
    for (const t of TRIGGERS) {
      if (t.event !== name || seen(t.id)) continue;
      if (t.when && !t.when(s)) continue;
      play(t.id);
      return true;
    }
    return false;
  }

  function bind() {
    $('dlg').addEventListener('click', onTap);
    document.addEventListener('keydown', (e) => { if (stack && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onTap(e); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();

  return { CHAPTERS, chapterOf, sday, tricks, check, event, play, active, NAMES };
})();
