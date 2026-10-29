# Tests et preuves

## Contrôles du 29 octobre 2026 — préparation Android

- ESLint et TypeScript API/mobile/scripts : passés.
- Suite complète avec PostgreSQL embarqué : **45 tests passés, zéro échec/ignoré**, dont quatre nouveaux tests des limites de configuration Android. Aucun achat ou appareil natif testé.
- Expo résout correctement la configuration locale existante, et la configuration de distribution avec des valeurs réservées aux tests, sans compilation ni requête vers l’API de test.
- `npm run android:check` échoue explicitement en l’absence d’API HTTPS, projet Expo et identifiant Android définitif : blocage attendu, pas une application compilée.
- Aucun APK/AAB, SDK Android ou certificat de signature disponible. Aucun build EAS ou envoi Play Console exécuté.
- Le propriétaire signale un échec du lanceur Windows. Cause non identifiée ; ne pas déduire le fonctionnement Windows des essais Linux historiques.

## Preuves historiques du moteur local

Validation locale du 28 octobre 2026. Installer avec `npm ci` et PostgreSQL 17 avant les tests. `npm test` utilise Fastify inject avec une vraie base PostgreSQL ; pas de mock de persistance. Les données créées utilisent `example.invalid` et sont supprimées en fin de suite. Ne jamais pointer DATABASE_URL vers une base réelle pour cette commande.

## Résultats

- TypeScript API/mobile : passé.
- ESLint : passé.
- Tests Node : **41 passés, 0 échec, 0 ignoré** (inclut le test parent d’intégration).
- Migrations appliquées plusieurs fois : sans écrasement du catalogue ni doublon.
- Export Web Expo SDK 58 : passé, toutes les routes compilées.
- Bundles JavaScript/Hermes iOS et Android : générés avec Expo, sans compilation de binaire natif.
- Versions natives : contrôle offline à partir du manifeste npm Expo, compatible ; contrôle en ligne Expo échoue faute d’accès réseau à son API.
- Audit : alertes transitives Expo restantes, voir SECURITY_AND_PRIVACY.md ; ce n’est pas un audit de sécurité indépendant.
- Test navigateur Playwright : **2 passés depuis l’archive personnelle extraite (47,1 s)** sur Chromium système avec API et PostgreSQL réels ; coupure de sauvegarde, reprise, fin, publication et suppression, ainsi que défi, conflit inter-appareils, rechargement, remplacement, publication de groupe et sauvegarde vérifiés. Voir `docs/SESSION_3_STATUS.md` pour l’état courant.

## Couverture réelle

Inscription majeure, connexion incorrecte/correcte, absence de session, onboarding privé, catalogue, démarrage, reprise via API, validation des séries, durée minimale, double clôture concurrente, plafond quotidien, RLS des séances, interdiction SQL points/droits/rôles, expiration et achat permanent, publication, like idempotent, commentaire, abonnement membre, pagination aux timestamps égaux, blocage réciproque, signalement, modération auditée, reset usage unique, export, logout et suppression/cascade.

E2E navigateur : saisie depuis l’interface, onboarding, démarrage, interruption de requête de sauvegarde, retour/reprise du brouillon, synchronisation, vraie attente 31 s, points, publication et suppression. Exécution contre les vrais services locaux. Une seule utilisatrice de test, pas un test de charge.

## Non exécutés / à faire

Compilation native Xcode/iOS (outillage absent), compilation Android (SDK absent), appareils réels, SecureStore natif, appels Share natifs, kill OS, notifications, restauration RevenueCat en store, achats/remboursements, email réel, accessibilité lecteur d’écran, charge et pentest. Les tests de droits SQL ne remplacent pas des achats sandbox. Le mode hors réseau ne garantit pas la fusion concurrente multi-appareils.

CI GitHub préparée dans `.github/workflows/mova.yml`, mais non exécutée sur GitHub pendant cette session. Vérifier les journaux de la première exécution distante. Aucun succès CI distant présumé.

Nouveaux tests : progression temporelle et de séances, conflits 409, retrait des séries remplacées, défis sans rétroactivité, badge serveur unique, profils et statistiques privés, déblocage, sauvegardes, groupes non accessibles aux non-membres, retrait d’accès aux commentaires après départ. Le serveur ordinateur est testé par HTTP pour le routage, l’origine/hôte, les fichiers cachés et les corps trop volumineux. Le .cmd Windows n’a pas été exécuté sous Windows ; le moteur commun est validé sous Linux.

La même suite de 41 cas a été exécutée sur PostgreSQL serveur puis sur PostgreSQL embarqué. Les deux passent, sans relâcher RLS ou les assertions. Une fermeture/réouverture du moteur autonome a conservé compte, session et série. Le test navigateur télécharge aussi un PNG réel de 1080×1920. La distribution a été extraite hors du dépôt pour exclure une dépendance accidentelle aux node_modules de développement. Le binaire Windows fourni est vérifié, mais son exécution reste à confirmer sur Windows.
