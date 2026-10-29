> Bilan historique de la première session. Pour l’état courant, voir SESSION_2_STATUS.md.

# Bilan de session — 28 octobre 2026

## Livré et exécuté

Le site personnel original est intact. Le monorepo MOVA se trouve dans `mova/`. Sources non commitées, aucun push ni déploiement. Lire FEATURE_STATUS.md pour le périmètre exact et ROADMAP.md pour la reprise.

- Installation `npm install` puis **`npm ci` standard** réussie, lockfile présent.
- PostgreSQL 17 local, image épinglée par digest ; démarrage idempotent testé ; deux migrations appliquées et rejouées sans perte.
- `npm run typecheck` : succès final.
- `npm run lint` : succès final.
- `npm test` : **26 tests passés, 0 échec, 0 ignoré** (dont un test parent). Vraie DB, auth, isolation RLS, données privées, points concurrents, droits, blocage/modération, reset, export et suppression.
- `npm run build:web` : export final réussi dans apps/mobile/dist.
- `npm run build:bundles` : export final réussi iOS et Android, bundles Hermes d’environ 3,4 Mo chacun dans apps/mobile/dist-native. **Aucun binaire APK/AAB/IPA, aucun test sur appareil.**
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npx playwright test` : **1 test passé, 40,6 s**, contre API et DB réelles, viewport 390 × 844. Création compte → onboarding → programme → saisie → requête de sauvegarde coupée → pause/reprise du brouillon → synchronisation → attente réelle de 31 s → fin/+50 points → publication → suppression.
- GET /health renvoie `{ok:true,mode:pilot}` ; serveur Web renvoie bien le HTML du build.
- Rendu d’accueil observé dans Chromium ; contrastes des couleurs principales calculés. Aucun audit global d’accessibilité revendiqué.

## Corrections trouvées par E2E

Prévol CORS PUT/PATCH/DELETE corrigé avec test API de non-régression. Cache des préférences corrigé pour éviter le retour à l’onboarding après séance. Les premières tentatives E2E échouées ne sont pas comptées comme succès. Une tentative a été perturbée par la réinstallation des dépendances pendant le watcher : services redémarrés avant la dernière validation. Les comptes navigateur de ces tentatives ont été supprimés avec filtre strict sur les seuls comptes test créés par cette session. La dernière suite nettoie aussi son compte en finally.

## Processus de fin de session

API de développement sur 3001, serveur de validation Web sur 8081 et conteneur mova-db démarrés au moment des derniers contrôles. Leur survie après fermeture/restauration n’est pas garantie. Le serveur du site personnel sur 8000 est indépendant. Ne pas réinstaller node_modules pendant un test en cours.

## Configuration enregistrée

`install_script` et `start_skill` du brouillon de l’environnement ont été sauvegardés avec les instructions MOVA. La sauvegarde est confirmée ; **aucune publication de l’environnement n’a été effectuée**. Pour activer ce brouillon, le propriétaire peut le vérifier/enregistrer dans les paramètres puis publier l’environnement ; cela ne publie pas l’application sur les stores. Les volumes Docker ne doivent pas être supposés inclus dans une restauration future ; les données sont uniquement des tests et les migrations recréent le schéma si nécessaire.

## Limites externes et produit

Sources concurrentielles officielles refusées par le proxy (403) : analyse de principes préparatoire, tarifs et fonctions actuels non vérifiés. API Expo de validation en ligne inaccessible ; contrôle offline compatible et exports réels réussis. Téléchargement Chromium Playwright refusé, Chromium système utilisé. SDK Android/Xcode absents : pas de compilation native. Alertes npm transitives Expo restantes, détaillées dans DEPENDENCY_AUDIT.md.

Contenus sportifs non relus, aucune progression hebdomadaire finalisée, aucun paiement/restauration réel, aucun groupe/défi opérationnel, pas d’upload ou DM. Auth/DB locale à durcir avant ouverture. Documents juridiques non validés, liste d’attente inactive. Aucun compte payant créé, aucune dépense, aucune collecte personnelle réelle ou sollicitation commerciale.

## Prochaine priorité

Programme versionné sur plusieurs semaines, substitutions sûres et tests natifs, puis validation professionnelle d’un premier programme. Avant pilote externe : revue sécurité/auth et rôles DB, email vérifié, validation juridique et responsable modération. Les comptes stores/RevenueCat et autorisations de dépense/déploiement seront nécessaires lors de la phase commerciale, pas pour continuer le développement local.
