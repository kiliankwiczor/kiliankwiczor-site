# kiliankwiczor-site

Site personnel statique de Kilian KWICZOR — animateur et présentateur.

## Stack

- HTML / CSS / JS pur (zéro framework)
- PHP pour le formulaire de contact (fonction `mail()` native OVH)
- Polices : Geist, Inter, Lilita One (Google Fonts)

## Structure

```
.
├── index.html          # Accueil
├── work.html           # Projets
├── about.html          # À propos
├── contact.html        # Formulaire de contact
├── contact.php         # Traitement du formulaire (envoi mail OVH)
├── assets/
│   ├── css/style.css
│   ├── js/main.js
│   └── images/         # Photos et visuels
└── README.md
```

## Déploiement OVH

1. Uploader tous les fichiers via FTP dans le dossier `www/` de l'hébergement.
2. Vérifier qu'OVH a bien activé PHP (par défaut sur tous les hébergements mutualisés).
3. Dans `contact.php`, l'adresse `$EXPEDITEUR` doit être une boîte du domaine (`contact@kiliankwiczor.com`) — créer la boîte mail depuis l'espace client OVH si besoin.

## Développement local

Pour tester en local, lancer un petit serveur PHP :

```bash
php -S localhost:8000
```

Puis ouvrir http://localhost:8000

## Pages

- **Accueil** — hero, services, projets en vedette, avantages, processus, FAQ
- **Projets** — galerie complète des animations
- **À propos** — parcours et présentation
- **Contact** — formulaire avec envoi par mail
