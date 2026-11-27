# Nena & Simba — Busy Days

A cozy time-management game for phones (PWA, installable, plays offline).
Tehran, a big modern apartment on the 5th floor: Nena takes care of Simba, her chow chow, and her whole family.

## How to play
- Every level is a day with a timer. Requests pop up with a patience ring:
  Simba (food, water, walk, brushing, play), Baba (tea), Maman (help in the kitchen), Nasim (talk), Negin (wake up).
- Tap things to send Nena: she queues up to 4 actions, carries items (kibble, tea, brush, ball) and works on stations.
- Fast chains give combos and tips. Missed requests cost hearts and make a mess (fur, puddles, dishes).
- Reach the score goals for 1 to 3 stars, earn coins, buy upgrades (sneakers, tray, big samovar, robot vacuum…).
- Short family scenes between days.

## Run
Serve the folder (`python3 -m http.server`) and open it, or install it from the browser on a phone.

## Files
`index.html`, `style.css`, `js/rush.js` (game), `js/art.js` (characters), `js/audio.js` (music and sounds), `manifest.webmanifest`, `sw.js`, `icons/`, `assets/`.

## Maps

- **Home** (Tehran, 6-floor tower): Living room, Kitchen, TV room, Bedroom hallway (Nena only), Nena's room with her bathroom. Use the room tabs at the bottom; tap an icon on a tab to send Nena there.
- **Tehran street**: bakery (sangak), juice shop, fountain, the family's white 4×4 and sedan.
- **CLAP** (Hayat Sabz mall, 4th floor): Nena parks the 4×4 in the mall parking and takes the elevator up. Wooden tables, other customers, and Pourya, the hookah guy, who asks for Nena's Instagram every single time.
