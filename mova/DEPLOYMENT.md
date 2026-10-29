# Déploiement — préparation uniquement

Aucun déploiement ni compte payant créé. `NODE_ENV=production` est volontairement refusé. Ne pas supprimer cette garde sans lever les gates de LAUNCH_CHECKLIST.md.

## Développement reproductible

Node 24, npm ci depuis `mova/`, PostgreSQL 17 via `bash scripts/db-up.sh`, migrations, API, Expo Web/mobile. Le volume nommé `mova-pgdata` conserve les données de test ; ne pas supposer que le daemon Docker d’une nouvelle machine restaure ce volume. Un dump de test peut être réalisé avec les outils pg, sans données réelles. Pas de suppression automatique de volume.

Variables : DATABASE_URL serveur uniquement, PORT, WEB_ORIGINS (liste exacte séparée par virgules), EXPO_PUBLIC_API_URL public au moment du build mobile. Les defaults sont strictement locaux. Aucun fichier .env réel commité. Les valeurs sensibles futures passent par le gestionnaire de secrets de l’hébergeur.

## Cible commerciale à préparer

PostgreSQL géré en UE, rôles auth/app/maintenance séparés, sauvegardes chiffrées avec test de restauration, TLS vérifié, API derrière HTTPS et limites partagées, mail transactionnel, logs sans corps sensibles, gestion d’incidents. Migrations en job unique avec sauvegarde et plan de rollback explicite ; pas de reset destructeur. CDN pour build Web/admin et contrôle d’accès serveur existant ; aucune confiance dans la seule URL cachée.

## Stores

Les profils Android sont maintenant préparés dans `apps/mobile/eas.json` : APK `preview` et AAB `play-internal`, sans soumission automatique. Voir [ANDROID_DISTRIBUTION.md](docs/ANDROID_DISTRIBUTION.md) pour les prérequis, commandes et limites. La configuration bloque une distribution qui réutiliserait le serveur local ou les identifiants provisoires. Aucun build cloud ni binaire natif n’a été produit.

Comptes Apple Developer / Google Play du propriétaire, identifiants de bundle définitifs, marque disponible, certificats et politiques confidentialité. Configurer EAS et profils development/preview/production seulement après choix du compte ; aucune commande de build cloud ou publication ne doit entraîner une dépense sans accord. Pour appareils, choisir Expo Go compatible ou un development build selon les modules. Déclarer deep links/universal links uniquement avec domaine contrôlé ; ne pas inventer de domaine de production.

Fournir privacy labels / Data Safety basés sur traitements réels, compte de revue, restauration des achats, suppression in-app, abonnement/renouvellement transparent. Pas d’annonce « disponible sur les stores » avant publication effective.

## Distribution du pilote sur ordinateur

Voir WINDOWS.md. `npm run desktop` construit l’interface relative à `/api`, prépare PostgreSQL local séparé puis ouvre le navigateur ; `DEMARRER-MOVA.cmd` gère l’installation npm initiale. Pour produire une archive source sans secrets, données locales ou dépendances binaires : `python3 scripts/package-desktop.py /chemin/MOVA-Windows.zip`. Le poste destinataire installe ses dépendances adaptées à Windows via le lockfile. Aucun installateur signé ou déploiement public n’est impliqué.
