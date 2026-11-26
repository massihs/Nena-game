# Nena & Simba

Jeu de simulation de vie (HTML/CSS/JS, sans dépendance) : Nena vit avec Simba, son chow-chow,
et doit accomplir chaque jour ses propres tâches, celles de la maison et celles du chien.

## Jouer
Ouvrir `index.html` dans un navigateur (ou servir le dossier : `python3 -m http.server`).

## Règles
- 5 pièces : Chambre, Salle de bain, Cuisine, Salon, Dehors. Chaque action fait avancer l'horloge.
- Besoins de Nena : ventre, énergie, hygiène, moral.
- Besoins de Simba : ventre, eau, vessie, pelage (double pelage à brosser chaque jour), bonheur.
- Liste du jour (lit, dents, douche, 3 repas, 4 h de travail, gamelles matin/soir, 3 promenades,
  brossage, jeu, câlin, vaisselle + ménage/courses/véto selon le jour).
- Si on oublie Simba : pipi sur le tapis, bêtises quand il s'ennuie, boue en promenade = bain.
- Dormir avec Simba après 20:00 → bilan de la journée et 0 à 3 étoiles de complicité.
- 1 seconde = 1 minute de jeu (pause / x1 / x3). Sauvegarde automatique dans le navigateur.
