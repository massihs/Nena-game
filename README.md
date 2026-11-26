# Nena & Simba

A mobile web app (PWA, installable and playable offline). Tehran, a white 6-floor tower, a 4-bedroom apartment on the 5th floor:
Nena lives with her family and Simba, her chow chow. Negin (big sister) sleeps all the time, Nasim (little sister) is always angry
and takes Simba out whenever she wants, Baba Haj Mohsen loves having Simba on his belly and calls when the girls are out late,
and Maman Fariba cooks and runs the house. Nena has to take care of herself and of Simba.
Plain HTML/CSS/JS, no dependencies, no build step.

## Play
- Serve the folder over HTTPS (GitHub Pages, Netlify…) or locally: `python3 -m http.server`, then open `http://localhost:8000`.
- On a phone: "Add to Home Screen" (Android: in-game Settings → Install the app; iPhone: Safari → Share → Add to Home Screen).

## Features
- Paw Path: an endless treat-sorting puzzle path (always-solvable seeded levels, hidden treats from level 12, undo / extra jar). Every 3 levels unlocks one of 10 abilities that change daily life (faster grooming, brisk walks, super sniffer…).
- Illustrated scenes with light that follows the clock, wallpaper, wood floors, window light beams, and a framed photo of Nena & Simba.
- Story mode: 4 chapters over 4 weeks (Friday family lunch, Simba's birthday, Simba gets sick, road trip to the Caspian Sea in the white 4x4) with an ending, branching dialogue and goals.
- Family life: eat Maman's lunch and dinner, help her, let Simba nap on Baba's belly, try (and fail) to wake Negin, talk to Nasim; Nasim takes Simba out on her own; Baba calls when Nena is outside after 9 PM.
- Characters: the family, Mia & Biscuit from the 3rd floor, Dr. Karimi (vet), Mr. Rahimi (boss), with friendship hearts. Iranian week (Saturday to Friday).
- A living Simba: 5 tricks to teach (marker-training mini-game), personality, weight and health, spontaneous behaviors (naps, belly-up, stolen socks, zoomies…), memory album.
- 5 rooms (Bedroom, Bath, Kitchen, Living, Outside), a real-time clock (pause / ×1 / ×3), weekdays and weekends.
- Nena's needs (food, energy, hygiene, mood), Simba's needs (food, water, potty, coat, joy), home tidiness.
- 3 touch mini-games: coat brushing, "Fetch!", and a 3-lane walk.
- Daily weather (sun, clouds, rain, snow) that affects gameplay.
- Shop: outfits for Nena, accessories for Simba, home items with lasting effects.
- 14 achievements, a bond level, star bonuses, random events (mud, mischief, encounters).
- Lo-fi music and sound effects generated with Web Audio, vibration, particles, a tutorial.
- Autosave in the browser.

## Files
`index.html`, `style.css`, `js/art.js` (SVG characters), `js/audio.js`, `js/minigames.js`, `js/story.js` (chapters and dialogue), `js/puzzle.js` (Paw Path), `js/game.js`,
`manifest.webmanifest`, `sw.js` (offline), `icons/`, `assets/`.
