/* Story mode: Nena's family in Tehran. 4 chapters over 4 weeks, branching dialogue and goals.
   Talks to the game through window.Game (exported by game.js). */
window.Story = (function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const G = () => window.Game;
  const S = () => window.Game.S;

  const NAMES = { nena: 'Nena', simba: 'Simba', nasim: 'Nasim', negin: 'Negin', mohsen: 'Haj Mohsen (Baba)', fariba: 'Maman Fariba', mia: 'Mia', biscuit: 'Biscuit', lee: 'Dr. Karimi', sam: 'Mr. Rahimi' };
  const VOICE = { nena: 620, simba: 300, nasim: 760, negin: 480, mohsen: 330, fariba: 540, mia: 700, biscuit: 380, lee: 560, sam: 420 };

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
  /* Chapters: Tehran, a white 6-floor tower, a 4-bedroom apartment      */
  /* ------------------------------------------------------------------ */
  const CHAPTERS = [
    {
      n: 1, title: 'Simba’s Family', days: [1, 7],
      blurb: 'Nena’s family lives in a 4-bedroom apartment on the 5th floor of a white tower in Tehran. Negin sleeps, Nasim sulks, Baba spoils Simba and Maman runs the house. Friday lunch (day 7, 1 PM): show the family that Simba is in good hands.',
      goals: [
        { label: 'Help Maman Fariba twice', check: (s) => (F(s).helpMom || 0) >= 2, prog: (s) => `${Math.min(2, F(s).helpMom || 0)}/2` },
        { label: 'Try to wake up Negin', check: (s) => (F(s).negin_try || 0) >= 1 },
        { label: 'Teach Simba “Sit”', check: (s) => s.pet.tricks.sit >= 100, prog: (s) => Math.min(100, Math.round(s.pet.tricks.sit)) + '%' },
        { label: 'Tidy home (70+) at Friday lunch', check: (s) => s.maison.proprete >= 70, live: true },
      ],
    },
    {
      n: 2, title: 'The Big Birthday', days: [8, 14],
      blurb: 'Simba turns 2 on Friday (day 14)! The party starts at 5 PM. Maman will bake if you bring the ingredients, Baba will film everything, and maybe Nasim will even help.',
      goals: [
        { label: 'Bring cake ingredients for Maman', check: (s) => !!F(s).cake },
        { label: 'Buy a gift', check: (s) => !!F(s).gift },
        { label: 'Send the invitations', check: (s) => !!F(s).invited },
        { label: 'Teach Simba “Paw”', check: (s) => s.pet.tricks.paw >= 100, prog: (s) => Math.min(100, Math.round(s.pet.tricks.paw)) + '%' },
      ],
    },
    {
      n: 3, title: 'Under the Weather', days: [15, 21],
      blurb: 'Simba ate something he shouldn’t have on a walk with Nasim. Baba drives you to Dr. Karimi in the white 4x4. Give the medicine morning and evening, and let the family help.',
      goals: [
        { label: 'See Dr. Karimi', check: (s) => !!F(s).vet_seen },
        { label: 'Give the medicine 6 times', check: (s) => s.pet.meds >= 6, prog: (s) => `${s.pet.meds}/6` },
        { label: 'Simba fully recovered', check: (s) => !!F(s).recovered },
      ],
    },
    {
      n: 4, title: 'Road Trip North', days: [22, 28],
      blurb: 'Next Friday (day 28) at 6 AM, the whole family drives the white 4x4 north to the Caspian Sea. Simba is coming! Get him ready and load the car.',
      goals: [
        { label: 'Know 4 tricks', check: (s) => tricks(s) >= 4, prog: (s) => `${tricks(s)}/4` },
        { label: 'Load the white 4x4 ×3', check: (s) => (F(s).practice || 0) >= 3, prog: (s) => `${F(s).practice || 0}/3` },
        { label: 'Coat 90+ on departure day', check: (s) => s.simba.pelage >= 90, live: true },
        { label: 'Simba joy 70+ on departure day', check: (s) => s.simba.bonheur >= 70, live: true },
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
  const plus = (s) => { s.story.tmp = (s.story.tmp || 0) + 1; };
  const SCENES = {
    ch1_intro: [
      { n: 'Tehran, 7 AM. The sun rises behind the snowy Alborz mountains. On the 5th floor of a white tower, a cold wet nose presses against Nena’s cheek.' },
      { s: 'nena', m: 'neutral', t: 'Mmh… Simba. Negin is supposed to feed you on Saturdays, you know.' },
      { n: 'From the next bedroom: a long, peaceful snore. Negin is asleep. As always.' },
      { s: 'fariba', t: 'Nena jan! Breakfast! Fresh barbari bread, cheese and tea. Come before it gets cold!' },
      { s: 'nasim', m: 'angry', t: 'WHO left orange fur all over my black hoodie?! SIMBA!!' },
      { s: 'simba', t: '*hides behind Nena*' },
      { s: 'mohsen', t: 'Come here, my little lion. Come sit on Baba’s belly. Don’t listen to her.' },
      { s: 'nena', t: 'Same as every day: if I don’t take care of Simba, nobody will. Well… almost nobody.' },
      { card: { t: 'Chapter 1', sub: 'Simba’s Family' } },
      { n: 'Do Simba’s tasks and your own, help Maman, and survive your sisters. Friday lunch at 1 PM: the whole family will be watching. Tap the gold banner for your goals.' },
    ],
    meet_mia: [
      { n: 'In the lobby, the elevator doors open and a small red shiba bolts straight at Simba.' },
      { s: 'biscuit', t: 'Yip! Yip yip!' },
      { s: 'mia', m: 'surprised', t: 'Biscuit! Sorry, she has zero manners. Oh wow, a chow chow! He looks like a lion cub!' },
      { s: 'nena', t: 'That’s Simba. We live on the 5th floor.' },
      { s: 'mia', t: 'I’m Mia, 3rd floor. Biscuit and I walk every evening, between 5 and 8.' },
      { choice: [
        { t: '“We’d love to join you sometime!”', do: rel('mia', 2), then: [{ s: 'mia', t: 'Yay! See you downstairs then.' }] },
        { t: '“Simba’s a little shy… maybe later.”', do: rel('mia', 1), then: [{ s: 'mia', m: 'neutral', t: 'No pressure. Biscuit will win him over. She always does.' }] },
      ] },
      { s: 'mia', t: 'Oh, and if you want to teach him tricks, start with “Sit”. Short sessions, lots of treats, and reward at the exact right moment.' },
      { do: (s) => { flag('met_mia')(s); flag('training')(s); G().memory('meet_mia', 'A new friend', 'Simba met Biscuit the shiba and Mia from the 3rd floor.', '🐕'); } },
      { n: 'New actions: “Training” in the living room and “Walk with Mia” outside in the evening.' },
    ],
    nasim_walk: [
      { n: 'The front door slams. Simba’s leash is gone… and so is Nasim.' },
      { s: 'nena', m: 'surprised', t: 'Nasim?! Did you take Simba out without telling me?' },
      { s: 'nasim', phone: true, m: 'angry', t: 'I do what I want! He was bored. I was bored. We’re walking. Bye.' },
      { s: 'nena', m: 'neutral', t: '…She hung up on me. Well. At least he gets a walk.' },
      { n: 'Nasim sometimes takes Simba out on her own. While he’s with her, you can’t brush, feed or play with him. She’ll bring him back… eventually.' },
    ],
    family_lunch: [
      { n: 'Friday, 1 PM. The smell of saffron rice and crispy tahdig fills the apartment. The whole family sits around the sofreh on the Persian rug.' },
      { s: 'fariba', t: 'Everyone sit! Negin, WAKE UP, the tahdig is getting cold!' },
      { s: 'negin', m: 'sleepy', t: '…five more minutes…' },
      { do: (s) => { s.story.tmp = 0; } },
      { if: (s) => s.maison.proprete >= 70,
        then: [{ s: 'fariba', t: 'Nena, the house is spotless. You even vacuumed Simba’s fur! Afarin, my girl.' }, { do: plus }],
        else: [{ s: 'fariba', m: 'sad', t: 'Nena jan… there’s more fur on the carpet than on the dog.' }] },
      { if: (s) => s.simba.bonheur >= 60,
        then: [{ s: 'mohsen', t: 'Look how happy he is! Come, Simba jan, come to Baba.' }, { s: 'simba', m: 'happy', t: '*climbs onto Baba’s belly and sighs happily*' }, { do: plus }],
        else: [{ s: 'mohsen', m: 'sad', t: 'He looks a bit sad, baba jan. Is he getting enough walks?' }] },
      { if: (s) => s.pet.tricks.sit >= 100,
        then: [{ s: 'nena', t: 'Simba, sit!' }, { s: 'simba', m: 'happy', t: '*sits perfectly*' }, { s: 'nasim', m: 'surprised', t: '…Okay, that’s actually cool. Whatever.' }, { do: (s) => { plus(s); rel('nasim', 1)(s); } }] },
      { if: (s) => (F(s).helpMom || 0) >= 2, then: [{ s: 'fariba', t: 'And thank you for helping me in the kitchen this week, azizam.' }, { do: (s) => { plus(s); rel('fariba', 1)(s); } }] },
      { if: (s) => (s.story.tmp || 0) >= 2,
        then: [{ s: 'mohsen', t: 'My daughter takes care of this whole family. I’m proud of you.' }, { n: 'Baba slips you $40 under the table, winks, and pretends nothing happened.' },
          { do: (s) => { rel('mohsen', 3)(s); rel('fariba', 2)(s); G().money(40); flag('lunch_proud')(s); } }],
        else: [{ s: 'mohsen', m: 'neutral', t: 'A good start, baba jan. Next Friday, even better!' }, { do: rel('mohsen', 1) }] },
      { do: (s) => { s.story.tmp = 0; G().memory('family_lunch', 'Friday tahdig', 'The whole family around the sofreh. Simba got the crispy bits.', '🍚'); } },
      { card: { t: 'Chapter 1 complete', sub: 'Next week: Simba’s birthday!' } },
    ],

    ch2_intro: [
      { s: 'nena', m: 'surprised', t: 'Simba… do you know what happens next Friday? You turn TWO!' },
      { s: 'simba', t: '*head tilt*' },
      { s: 'fariba', t: 'A birthday? Bring me the ingredients and I’ll bake him a cake. A dog cake! What a world.' },
      { s: 'mohsen', m: 'surprised', t: 'I will film everything! I just learned how to make videos on my phone.' },
      { s: 'nasim', m: 'angry', t: 'A party for a DOG? Count me out.' },
      { card: { t: 'Chapter 2', sub: 'The Big Birthday' } },
      { n: 'Bring cake ingredients and a gift (Outside), send invitations (Living room) and teach Simba “Paw”. Party: Friday at 5 PM.' },
    ],
    invites: [
      { s: 'nena', t: 'Okay, who’s coming to the party?' },
      { choice: [
        { t: 'Invite Mia and Biscuit', do: (s) => { flag('inv_mia')(s); rel('mia', 1)(s); }, then: [{ s: 'mia', phone: true, t: 'A doggy birthday party?! Biscuit will wear her fancy collar!' }] },
        { t: 'Keep it in the family', then: [{ s: 'nena', m: 'neutral', t: 'Just us this time. That’s already a lot of people.' }] },
      ] },
      { choice: [
        { t: 'Ask Nasim to do the decorations', do: (s) => { flag('nasim_help')(s); rel('nasim', 2)(s); },
          then: [{ s: 'nasim', m: 'angry', t: 'No.' }, { s: 'nasim', m: 'neutral', t: '…Fine. But I choose the colors. And it’s NOT because I like him.' }] },
        { t: 'Leave Nasim alone', then: [{ s: 'nena', m: 'neutral', t: 'Better not poke the volcano.' }] },
      ] },
      { do: flag('invited') },
    ],
    boss_call: [
      { n: '📞 Mr. Rahimi, Nena’s boss, is calling…' },
      { s: 'sam', phone: true, m: 'neutral', t: 'Nena, sorry to call so late. The client moved the deadline. Could you finish the report tonight? There’s an $80 bonus.' },
      { choice: [
        { t: '“Sure, I’ll do it.”', do: (s) => { G().money(80); s.nena.energie -= 25; s.simba.bonheur -= 12; rel('sam', 2)(s); },
          then: [{ s: 'sam', phone: true, t: 'You’re a lifesaver!' }, { n: 'Nena works until midnight. Simba sighs loudly from the doorway. Very loudly.' }] },
        { t: '“Sorry, tonight is for my family.”', do: (s) => { s.nena.moral += 8; s.simba.bonheur += 10; rel('mohsen', 1)(s); },
          then: [{ s: 'sam', phone: true, t: 'Of course. Family first.' }, { s: 'mohsen', t: 'Good answer! Now come, the news is starting.' }] },
      ] },
    ],
    party: [
      { n: 'Friday, 5 PM. Balloons everywhere. Baba is filming everything on his phone, mostly his own thumb.' },
      { s: 'mohsen', t: 'Simba! Look at Baba! No, look at the CAMERA!' },
      { if: (s) => F(s).nasim_help,
        then: [{ n: 'The living room is covered in orange and pink garlands. Nasim stands in the corner, arms crossed.' }, { s: 'nasim', m: 'neutral', t: 'Don’t say anything. …Do you like it, Simba?' }, { s: 'simba', m: 'happy', t: '*licks Nasim’s hand*' }, { s: 'nasim', t: 'Ugh. Okay. Happy birthday, furball.' }] },
      { if: (s) => F(s).inv_mia, then: [{ s: 'mia', t: 'Happy birthday, Simba! Biscuit made you a card. Well… she chewed it a little.' }, { s: 'biscuit', t: 'Yip!' }] },
      { s: 'negin', m: 'sleepy', t: 'I woke up for cake. Only for cake. Where’s the cake?' },
      { if: (s) => F(s).cake,
        then: [{ n: 'Maman brings out a dog-safe carrot cake she baked herself, and a saffron cake for the humans.' }, { s: 'simba', m: 'happy', t: '*drools a small lake*' }],
        else: [{ n: 'No ingredients… Maman improvises a cake out of kibble and plain yogurt. Simba doesn’t mind at all.' }] },
      { if: (s) => F(s).gift, then: [{ n: 'Simba tears open his gift: a giant plush duck. It is now the most important thing in his life.' }] },
      { if: (s) => s.pet.tricks.paw >= 100, then: [{ s: 'nena', t: 'Simba, paw!' }, { s: 'simba', m: 'happy', t: '*offers a big fluffy paw*' }, { s: 'fariba', m: 'surprised', t: 'Vay! He shakes hands better than your father!' }] },
      { do: (s) => {
        const pts = (F(s).cake ? 1 : 0) + (F(s).gift ? 1 : 0) + (F(s).inv_mia ? 1 : 0) + (F(s).nasim_help ? 1 : 0) + (s.pet.tricks.paw >= 100 ? 1 : 0);
        s.simba.bonheur += 10 + pts * 6; s.nena.moral += 15; s.pet.age = 2;
        F(s).party_score = pts; rel('mohsen', 1)(s); rel('fariba', 1)(s);
        G().memory('birthday', 'Simba turns 2', pts >= 4 ? 'The best party a chow chow could dream of. Baba filmed 47 videos.' : 'A cozy little party with the whole family.', '🎂');
      } },
      { s: 'mohsen', t: 'Happy birthday, my lion. Two years already… Come, sit on Baba’s belly.' },
      { card: { t: 'Chapter 2 complete', sub: (s) => `Party score: ${F(s).party_score || 0}/5` } },
    ],

    ch3_intro: [
      { n: 'Saturday morning. Simba doesn’t come to wake you up.' },
      { s: 'nena', m: 'surprised', t: 'Simba? You didn’t touch your breakfast… you’re so quiet.' },
      { s: 'simba', m: 'sad', t: '*weak tail thump*' },
      { s: 'nasim', m: 'sad', t: '…It’s my fault. Yesterday on our walk he ate half a kebab someone dropped. I didn’t stop him.' },
      { choice: [
        { t: '“It’s okay, Nasim. We’ll fix this together.”', do: rel('nasim', 2), then: [{ s: 'nasim', m: 'sad', t: '…Thanks. Don’t tell Baba I cried.' }] },
        { t: '“Nasim! You have to watch him!”', do: rel('nasim', -1), then: [{ s: 'nasim', m: 'angry', t: 'I KNOW, okay?!' }] },
      ] },
      { s: 'mohsen', t: 'Yallah, everybody downstairs. I’ll drive you to Dr. Karimi in the 4x4.' },
      { do: (s) => { s.pet.sick = true; s.pet.meds = 0; } },
      { card: { t: 'Chapter 3', sub: 'Under the Weather' } },
      { n: 'Get dressed and take Simba to the vet (Outside, 9 AM to 6 PM). Baba is waiting by the white 4x4.' },
    ],
    vet_visit: [
      { n: 'Baba double-parks the white 4x4 in front of the clinic, hazard lights blinking, like every Tehrani dad.' },
      { s: 'lee', t: 'Salam, Simba! Let’s have a look at you… gently…' },
      { s: 'lee', m: 'neutral', t: 'A mild stomach bug. Did he eat something from the street?' },
      { choice: [
        { t: '“Half a kebab, apparently…”', then: [{ s: 'lee', t: 'Chow chows are curious. No more street snacks!' }] },
        { t: '“Maybe too many treats?”', do: rel('lee', 1), then: [{ s: 'lee', t: 'Treats are fine in moderation. Let’s watch his weight too.' }] },
      ] },
      { s: 'lee', t: 'Give him this medicine twice a day, morning and evening, for three days. Rest, fresh water and lots of cuddles.' },
      { s: 'mohsen', t: 'Cuddles I can do. I am a professional.' },
      { do: (s) => { flag('vet_seen')(s); rel('lee', 1)(s); } },
      { n: 'New action in the kitchen: “Give medicine” (before noon and after 5 PM).' },
    ],
    negin_help: [
      { n: 'Late at night, Nena hears whispering in the hallway.' },
      { s: 'negin', m: 'neutral', t: 'Shh, Simba… it’s okay. I’m here.' },
      { s: 'nena', m: 'surprised', t: 'Negin? You’re… awake? At night? Standing up?' },
      { s: 'negin', t: 'I sleep all day so I can be awake when it matters. I’ll watch him tonight. And while you work. Just this once.' },
      { do: (s) => { flag('family_help')(s); rel('negin', 3)(s); s.simba.bonheur += 10; } },
      { n: 'While Simba is sick, he won’t get sad when you work.' },
    ],
    vet_nag: [
      { s: 'mohsen', phone: true, m: 'angry', t: 'Nena! The 4x4 has been waiting since yesterday! Take that poor dog to the doctor!' },
      { do: (s) => { s.simba.bonheur -= 15; } },
    ],
    recovered: [
      { n: 'Simba suddenly leaps off his bed and does three laps around the apartment, sending Baba’s tea glass flying. The zoomies are back!' },
      { s: 'nena', m: 'surprised', t: 'Look at you! You’re back!' },
      { s: 'simba', m: 'happy', t: 'WOOF!' },
      { s: 'nasim', t: 'He’s okay! …I’m still angry at the kebab guy.' },
      { do: (s) => { s.pet.sick = false; flag('recovered')(s); s.simba.bonheur += 25; rel('nasim', 1)(s); G().memory('recovered', 'Back on four paws', 'Three days of medicine, Baba’s cuddles and Negin’s night shift.', '💪'); } },
      { card: { t: 'Simba recovered!', sub: 'Chapter 4 begins next week' } },
    ],

    ch4_intro: [
      { s: 'mohsen', m: 'surprised', t: 'Family meeting! Next Friday we drive north to the Caspian Sea. All of us, in the 4x4. And Simba!' },
      { s: 'nasim', m: 'angry', t: 'Seven hours in a car with Negin snoring? No way.' },
      { s: 'negin', m: 'sleepy', t: 'zzz… road trip… zzz…' },
      { s: 'fariba', t: 'I’ll make kuku sandwiches for the road. Nena jan, you get Simba ready.' },
      { choice: [
        { t: '“Simba is going to see the sea!”', do: (s) => { s.nena.moral += 5; } },
        { t: '“Who’s going to wake Negin at 6 AM?”', then: [{ s: 'mohsen', t: 'Me. With a frying pan and the 4x4 horn.' }] },
      ] },
      { card: { t: 'Chapter 4', sub: 'Road Trip North' } },
      { n: 'Learn 4 tricks, load the 4x4 three times (Outside), and on Friday at 6 AM have a shiny coat and a happy Simba.' },
    ],
    trip: [
      { n: 'Friday, 6 AM. The white 4x4 is loaded to the roof. Baba honks three times. The whole tower is probably awake now.' },
      { s: 'mohsen', t: 'Yallah, yallah! Negin! NEGIN!' },
      { s: 'negin', m: 'sleepy', t: '…I’m in the car. I’m sleeping in the car. Same thing.' },
      { n: 'The Chalus road winds through the mountains. Simba sticks his head out of the window, his fur flying like a lion’s mane.' },
      { do: (s) => { s.story.tmp = 0; } },
      { if: (s) => tricks(s) >= 1,
        then: [{ n: (s) => `At a tea stop, Simba performs ${tricks(s)} trick${tricks(s) > 1 ? 's' : ''} for a crowd of travelers: ${Object.entries(s.pet.tricks).filter(([, v]) => v >= 100).map(([k]) => G().trickName(k)).join(', ')}. Baba films everything.` }, { do: (s) => { s.story.tmp += tricks(s); } }],
        else: [{ n: 'At a tea stop, Simba lies down in the shade and refuses to move. Fair enough.' }] },
      { if: (s) => s.simba.pelage >= 90, then: [{ n: 'Everyone at the rest stop wants a photo with “the lion”. His coat shines in the sun.' }, { do: (s) => { s.story.tmp += 2; } }] },
      { if: (s) => s.simba.bonheur >= 70, then: [{ n: 'Simba falls asleep on Nasim’s lap. She pretends not to notice, but doesn’t move for two hours.' }, { do: (s) => { s.story.tmp += 2; rel('nasim', 1)(s); } }] },
      { if: (s) => (F(s).practice || 0) >= 3, then: [{ n: 'Thanks to the perfect packing, nothing is forgotten. Not even Nasim’s headphones.' }, { do: (s) => { s.story.tmp += 1; } }] },
      { n: 'Finally, the sea. Simba stares at the waves for a long moment… and charges straight in.' },
      { if: (s) => s.story.tmp >= 8,
        then: [{ s: 'fariba', m: 'surprised', t: 'Look at him swim! He thinks he’s a fish!' }, { do: (s) => { F(s).trip = 1; G().money(60); G().memory('trip', 'The Caspian Sea!', 'A perfect road trip north. Simba met the sea and loved it.', '🌊'); } }],
        else: [{ if: (s) => s.story.tmp >= 5,
          then: [{ s: 'mohsen', t: 'A beautiful trip, apart from the traffic. And the sand in the car.' }, { do: (s) => { F(s).trip = 2; G().money(30); G().memory('trip', 'Trip north', 'Sea, sand, and a very wet chow chow.', '🏖️'); } }],
          else: [{ s: 'nasim', m: 'neutral', t: 'He rolled in seaweed. The whole car smells like fish. Best trip ever, honestly.' }, { do: (s) => { F(s).trip = 3; G().memory('trip', 'Seaweed incident', 'A few mishaps, but a trip nobody will ever forget.', '🐟'); } }] }] },
      { goto: 'epilogue' },
    ],
    epilogue: [
      { n: 'That night, in a little villa by the sea, the whole family falls asleep in the same room. Simba lies in the middle.' },
      { s: 'nena', t: 'Four weeks ago, I was the only one taking care of you. Look at us now.' },
      { if: (s) => (s.story.rel.nasim || 0) >= 3, then: [{ s: 'nasim', m: 'neutral', t: 'I’m not angry anymore. …Tonight. Don’t get used to it.' }] },
      { if: (s) => (s.story.rel.negin || 0) >= 3, then: [{ s: 'negin', m: 'sleepy', t: 'I set an alarm to walk him tomorrow. An actual alarm.' }] },
      { s: 'mohsen', m: 'sleepy', t: '*snores, with Simba on his belly*' },
      { s: 'fariba', t: 'Shab bekheir, my children. Good night.' },
      { s: 'simba', m: 'happy', t: '*happy chow chow grumble*' },
      { do: (s) => { s.story.ended = true; G().memory('season', 'Our first season', 'One tower in Tehran, one big family, one fluffy lion.', '💕'); } },
      { card: { t: 'The End', sub: 'of Season 1. Life with Simba goes on in free play.' } },
    ],
  };

  /* Triggers: by story day (+ optional time), or by game event. */
  const TRIGGERS = [
    { id: 'ch1_intro', day: 1, at: 0 },
    { id: 'meet_mia', event: 'walk', when: (s) => sday(s) <= 7 && !F(s).met_mia },
    { id: 'meet_mia', day: 2, at: 17 * 60, when: (s) => !F(s).met_mia },
    { id: 'nasim_walk', event: 'nasim' },
    { id: 'family_lunch', day: 7, at: 13 * 60 },
    { id: 'ch2_intro', day: 8, at: 0 },
    { id: 'boss_call', day: 10, at: 18 * 60 },
    { id: 'party', day: 14, at: 17 * 60 },
    { id: 'ch3_intro', day: 15, at: 0 },
    { id: 'negin_help', day: 16, at: 22 * 60, when: (s) => s.pet.sick },
    { id: 'vet_nag', day: 17, at: 0, when: (s) => !F(s).vet_seen },
    { id: 'recovered', event: 'medicine', when: (s) => s.pet.meds >= 6 && !F(s).recovered },
    { id: 'ch4_intro', day: 22, at: 0 },
    { id: 'trip', day: 28, at: 6 * 60 },
  ];

  /* ------------------------------------------------------------------ */
  /* Runner                                                              */
  /* ------------------------------------------------------------------ */
  const queue = [];
  let stack = null; // [{steps, i}]
  let typing = null;
  let onDone = null;

  const active = () => !!stack || queue.length > 0;
  let adhoc = 0;
  function run(steps, cb) {
    const id = '_adhoc' + (++adhoc);
    SCENES[id] = steps;
    play(id, () => { delete SCENES[id]; S().story.seen = S().story.seen.filter((x) => x !== id); if (cb) cb(); });
  }

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

  return { CHAPTERS, chapterOf, sday, tricks, check, event, play, run, active, NAMES };
})();
