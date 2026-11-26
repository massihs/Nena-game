# Nena & Simba

Web app mobile (PWA, installable et jouable hors-ligne) : Nena vit avec Simba, son chow-chow,
et doit accomplir chaque jour ses propres tâches, celles de la maison et celles du chien.
HTML/CSS/JS pur, aucune dépendance ni étape de build.

## Jouer
- Servir le dossier en HTTPS (GitHub Pages, Netlify…) ou en local : `python3 -m http.server`, puis ouvrir `http://localhost:8000`.
- Sur téléphone : « Ajouter à l'écran d'accueil » (Android : menu Options du jeu → Installer ; iPhone : Safari → Partager → Sur l'écran d'accueil).

## Contenu
- 5 pièces (Chambre, Bain, Cuisine, Salon, Dehors), horloge en temps réel (pause / ×1 / ×3), jours de la semaine et week-ends.
- Besoins de Nena (faim, forme, hygiène, moral) et de Simba (faim, eau, pipi, poils, joie), propreté de la maison.
- 3 mini-jeux tactiles : brossage du pelage, « Rapporte ! » (lancer de balle), balade à 3 voies.
- Météo quotidienne (soleil, nuages, pluie, neige) avec effets sur le gameplay.
- Boutique : tenues de Nena, accessoires de Simba, objets de maison aux effets permanents.
- 14 succès, niveau de complicité, prime d'étoiles, événements aléatoires (boue, bêtises, rencontres).
- Musique lo-fi et bruitages générés en Web Audio, vibrations, particules, didacticiel.
- Sauvegarde automatique dans le navigateur.

## Fichiers
`index.html`, `style.css`, `js/art.js` (personnages SVG), `js/audio.js`, `js/minigames.js`, `js/game.js`,
`manifest.webmanifest`, `sw.js` (hors-ligne), `icons/`, `assets/`.
