# MOVA — pilote fonctionnel

« Ta progression. Ta communauté. Ton rythme. »

Projet Expo iOS/Android/Web + API Fastify TypeScript + PostgreSQL 17. Le site personnel à la racine du dépôt est conservé. **Version de développement, données de test uniquement, non commercialisable à ce stade.** Nom provisoire, disponibilité non vérifiée.

## Ouvrir sur Windows

**[Télécharger la version Windows prête à ouvrir](https://github.com/kiliankwiczor/kiliankwiczor-site/raw/refs/heads/main/mova/downloads/MOVA-Pret-a-ouvrir-Windows.zip)**, puis extraire tout et ouvrir `MOVA/OUVRIR-MOVA.cmd`.

Voir **WINDOWS.md** : la nouvelle distribution **MOVA-Pret-a-ouvrir-Windows.zip** contient le moteur Node Windows officiel, PostgreSQL embarqué et l’interface déjà construite. Extraire tout, puis double-cliquer sur **OUVRIR-MOVA.cmd**. Aucun Node.js/Docker à installer sur le poste destinataire. Le code commun est testé sous Linux ; le double-clic Windows reste à vérifier sur un poste Windows. Il n’existe pas de lien cloud public dans cette session.

## Lancer

Depuis `mova/`, avec Node 24, npm et Docker local :

```sh
npm ci
bash scripts/db-up.sh
npm run db:migrate
npm run api
```

Dans un autre terminal, toujours dans `mova/` :

```sh
npm run web
# ou pour iOS/Android via un client Expo compatible SDK 58 :
npm run mobile
```

Le backend utilise le port 3001 et PostgreSQL le port 5433, limité à localhost. Le Web utilise 8081. Aucun secret externe requis. Sur un téléphone, définir `EXPO_PUBLIC_API_URL` vers l’adresse accessible de la machine de développement ; `localhost` désigne le téléphone. Ne jamais placer de secret dans une variable `EXPO_PUBLIC_*`. Les valeurs de `.env.example` sont des exemples locaux ; pour le backend les exporter dans le shell, le fichier n’est pas chargé automatiquement. Un sandbox peut nécessiter une escalade pour les sockets et Docker.

Pour servir le build de validation : `npm run build:web`, puis `node scripts/serve-web.mjs`. Ne pas utiliser ce serveur local en production.

## Ce qui existe

- Comptes adultes de test, mots de passe scrypt, sessions révocables, déconnexion, reset avec boîte de sortie locale (aucun email envoyé).
- Questionnaire en cinq étapes ; recommandation déterministe simple ; profil éditable.
- 14 fiches d’exercices et 10 programmes **brouillons non validés** ; 4 programmes gratuits et progression des repères par semaine de programme.
- Séance avec charges/répétitions, repos conservé, brouillon sur appareil versionné, synchronisation explicite, reprise, remplacement contrôlé de mouvement, historique et statistiques/calendrier.
- Points serveur avec registre, idempotence et plafonds ; défis de régularité, badges serveur, partage du texte de réussite et carte PNG sur ordinateur.
- Fil chronologique paginé, recherche/profils publics, abonnements entre membres, publications textuelles, likes, commentaires, sauvegardes, signalements et blocage/déblocage. Groupes thématiques avec conversations réservées aux membres.
- Export JSON, suppression du compte et cascade des données actives.
- Administration `/admin` réservée au rôle serveur : compteurs, signalements avec contenu, masquage, édition des noms/consignes/paramètres sportifs, création de groupes et création/fermeture de défis ; journal d’audit.
- Droits payants modélisés et vérifiés côté serveur. Aucun achat ou webhook réel activé.

Créer son propre compte de test dans l’interface. Aucun faux compte ou faux témoignage prérempli. Pour tester l’administration, promouvoir **uniquement un compte de test local** par SQL `UPDATE users SET role='admin' WHERE email='adresse-de-test';` depuis l’accès propriétaire local ; aucun endpoint public ne permet cette promotion. Les compteurs administratifs ne sont pas un tableau de bord business complet.

## Vérifier

```sh
npm run typecheck
npm run lint
npm test                 # nécessite PostgreSQL local ; données de test nettoyées
npm run build:web
# API et serveur Web de validation déjà démarrés :
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npx playwright test
```

Sans Chromium système, `npx playwright install chromium` (réseau requis), puis `npx playwright test`. Voir TESTING.md pour les résultats exacts et limites. Ne pas exécuter ces tests sur des données réelles.

## Reprendre

Lire FEATURE_STATUS.md, ROADMAP.md, DECISIONS.md et LAUNCH_CHECKLIST.md. Le bilan courant est dans docs/SESSION_3_STATUS.md ; les autres bilans conservent les sessions antérieures. Prochaine priorité : validation professionnelle, durcissement auth/DB, tests sur appareils et intégrations externes. Les sessions Web sont en mémoire et disparaissent au rechargement ; sur mobile le jeton est conservé dans SecureStore. Les brouillons restent sur cet appareil jusqu’à déconnexion ou suppression. Une déconnexion purge les brouillons MOVA.

Médias, messages privés, achats, notifications, invitations, vrais emails et analytics avancés ne sont pas opérationnels. Ils sont indiqués comme indisponibles, sans faux résultats. Le backend refuse volontairement `NODE_ENV=production` tant que les prérequis de lancement ne sont pas traités.

## Construire la distribution personnelle

Voir distribution/BUILD.md. `npm run prepare:personal` installe les dépendances serveur figées, `npm run build:personal` assemble le moteur et l’interface, puis `scripts/package-personal.py` crée l’archive avec Node Windows vérifié. Le backend standard reste PostgreSQL ; le mode `MOVA_DATABASE_ENGINE=embedded` est réservé au pilote local et conserve les mêmes migrations/RLS, avec transactions sérialisées.
