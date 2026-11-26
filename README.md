# Nena & Simba

A mobile web app (PWA, installable and playable offline): Nena lives with Simba, her chow chow,
and every day she has to take care of herself, the home, and the dog.
Plain HTML/CSS/JS, no dependencies, no build step.

## Play
- Serve the folder over HTTPS (GitHub Pages, Netlify…) or locally: `python3 -m http.server`, then open `http://localhost:8000`.
- On a phone: "Add to Home Screen" (Android: in-game Settings → Install the app; iPhone: Safari → Share → Add to Home Screen).

## Features
- 5 rooms (Bedroom, Bath, Kitchen, Living, Outside), a real-time clock (pause / ×1 / ×3), weekdays and weekends.
- Nena's needs (food, energy, hygiene, mood), Simba's needs (food, water, potty, coat, joy), home tidiness.
- 3 touch mini-games: coat brushing, "Fetch!", and a 3-lane walk.
- Daily weather (sun, clouds, rain, snow) that affects gameplay.
- Shop: outfits for Nena, accessories for Simba, home items with lasting effects.
- 14 achievements, a bond level, star bonuses, random events (mud, mischief, encounters).
- Lo-fi music and sound effects generated with Web Audio, vibration, particles, a tutorial.
- Autosave in the browser.

## Files
`index.html`, `style.css`, `js/art.js` (SVG characters), `js/audio.js`, `js/minigames.js`, `js/game.js`,
`manifest.webmanifest`, `sw.js` (offline), `icons/`, `assets/`.
