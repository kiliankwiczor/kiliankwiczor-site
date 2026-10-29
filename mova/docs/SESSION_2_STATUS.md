> Bilan historique de la deuxième session. Pour la distribution actuelle prête à ouvrir, voir SESSION_3_STATUS.md.

# Bilan courant — accès ordinateur et fonctions complétées

Date : 28 octobre 2026. Le bilan de première session est conservé dans SESSION_STATUS.md. L’état détaillé est dans FEATURE_STATUS.md.

## Accès sur ordinateur

- `DEMARRER-MOVA.cmd` : lanceur Windows avec contrôle de présence de Node/Docker et installation npm initiale.
- `npm run desktop` : Docker local explicite (aucun contexte distant), base indépendante sur 5434, migrations, build relatif à /api, serveur Web/API limité à 127.0.0.1, ouverture du navigateur.
- Deuxième lancement détecté : pas de serveur concurrent ni de nouvelle base.
- WINDOWS.md et LIRE-EN-PREMIER.txt expliquent installation, arrêt et reprise.
- Archive source produite par scripts/package-desktop.py : dépendances, .env réels, comptes, mails locaux et caches exclus ; CRC vérifié et SHA-256 joint.
- Aucun outil de lien d’aperçu public n’est connecté à cette session. Un localhost dans le cloud n’est pas accessible comme tel depuis le PC de l’utilisateur. Aucun tunnel ou hébergement public créé.

Le moteur est testé ici sous Linux. **Le fichier .cmd, son ouverture automatique du navigateur et le double-clic n’ont pas été exécutés sur un poste Windows.** Aucun installateur signé/exécutable natif fourni. Le poste Windows doit disposer de Node.js 24 et Docker Desktop en fonctionnement.

## Nouvelles fonctions réelles

- Semaines de programme calculées depuis les séances terminées, repères de répétitions progressifs et phase d’entretien, sans augmentation automatique de charge. Toujours brouillons non validés.
- Remplacement d’un mouvement autorisé par le catalogue ; retrait des seules séries concernées et conservation du snapshot historique.
- Révision optimiste : écritures anciennes refusées en 409, brouillon conservé, choix explicite de rechargement serveur et champs réellement réinitialisés.
- Échéance du repos persistée dans le brouillon ; dernières performances, statistiques et calendrier privés.
- Défis avec adhésion/sortie persistées, périodes de 7 jours, un jour civil compté une fois, pas de progrès rétroactif, badges attribués par serveur.
- Recherche de membres et profils publics sans email/préférences privés ; publications sauvegardées ; interface de déblocage.
- Groupes ouverts, adhésions, fil paginé, publications/commentaires réservés aux membres courants par RLS. Quitter retire les accès. Pas de fausse communauté préremplie : seuls des thèmes et un défi sont définis.
- Administration : édition des consignes/sécurité et paramètres de programme, création de groupes et défis, fermeture des défis, signalements avec contenu de publication, actions auditées.
- Titres accessibles et icônes de navigation géométriques ne dépendant pas des glyphes de police.

## Vérifications exécutées sur le code final

- TypeScript API/mobile/scripts : passé.
- ESLint API/mobile/domain/scripts/E2E : passé.
- Tests Node avec PostgreSQL réel : **41 passés, 0 échec, 0 ignoré** ; le compteur inclut deux tests parents.
- Installation lockfile : npm ci standard validé en première session ; contrôle dry-run offline final cohérent.
- Export Web standard et export ordinateur : passés.
- Bundles JS/Hermes iOS et Android : passés. Pas d’APK, AAB ou IPA.
- Tests Playwright contre serveur ordinateur 8082 et base isolée 5434 : **2 passés en 47,4 s**.
  1. Défi → sauvegarde → modification concurrente par API → conflit visible → rechargement avec vraies valeurs → substitution → vérification DB → groupe → publication → sauvegarde du post.
  2. Compte → onboarding → séance → coupure de requête → reprise locale → synchronisation → attente réelle → fin et points → publication → suppression.
- Test HTTP du serveur ordinateur : origine/hôte externes refusés, corps bornés, fichiers cachés non servis, routes SPA et API fonctionnelles.
- Aperçu réel enregistré avec un compte de test, supprimé ensuite ; aucune performance ou utilisatrice fictive présentée comme réelle.

Les premiers échecs de compilation et de sélecteurs ont été corrigés et ne sont pas comptés comme des succès. Les tests ne remplacent pas les validations sportives, juridiques, natives et de sécurité.

## Configuration et services

Les instructions cloud de démarrage ont été enrichies et sauvegardées dans le brouillon, sans publication. Le serveur ordinateur de validation utilisait le port 8082 ; son processus et les volumes Docker ne sont pas garantis restaurés après la session. Sur le PC Windows, l’adresse par défaut est 8080. Aucun déploiement, achat, abonnement externe ou message commercial effectué.

## Périmètre restant

SDK RevenueCat, produits/webhooks/offres/restauration stores ; mails transactionnels/vérification ; durcissement auth et rôles DB de déploiement/MFA ; invitations et deep links vérifiés ; cartes de partage graphiques exportables ; niveaux/récompenses configurables ; notifications ; analytics avancés ; médias et messagerie modérables ; rôles/groupes privés avancés ; binaires et appareils natifs ; tests de charge/accessibilité approfondis. Ce sont encore des développements ou validations, pas de simples secrets à ajouter.

Les comptes et autorisations externes nécessaires avant lancement restent ceux des stores/RevenueCat, de l’hébergement/mail, les droits de contenus, la relecture professionnelle et la revue juridique. Les alertes transitives Expo restent documentées dans DEPENDENCY_AUDIT.md. `NODE_ENV=production` demeure volontairement bloqué.
