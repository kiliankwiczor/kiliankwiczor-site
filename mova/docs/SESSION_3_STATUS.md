# Bilan courant — distribution prête à ouvrir et carte PNG

Date : 28 octobre 2026. Les sessions précédentes restent dans SESSION_STATUS.md et SESSION_2_STATUS.md. Le poste Windows de l’utilisateur n’est pas accessible par les outils de cette session : aucune installation distante sur ce poste n’a été prétendue ou effectuée.

## Ce qui a été préparé

La distribution personnelle inclut Node.js Windows x64 officiel, PostgreSQL WASM/PGlite, l’API compilée, ses 70 dépendances JS/WASM et l’interface Web déjà construite. Le destinataire n’a plus à installer Node.js, npm, Docker ou PostgreSQL. Il extrait l’archive et ouvre OUVRIR-MOVA.cmd. Le lanceur sert uniquement 127.0.0.1 et ouvre le navigateur ; les données persistent dans LOCALAPPDATA/MOVA-Pilote. La communauté reste locale à ce PC, sans faux membres ni publication Internet automatique.

Le binaire Node v24.22.2 a été téléchargé depuis nodejs.org : SHA-256 épinglé identique au checksum officiel, ZIP intègre, format PE Windows x64 vérifié. Les licences sont incluses. **Le binaire Windows et le double-clic ne sont pas exécutables dans l’environnement Linux disponible : ils ne sont pas déclarés testés sur Windows.**

Le backend standard reste PostgreSQL serveur. Un adaptateur SQL local PGlite conserve les mêmes migrations et RLS ; une file sérialise transactions et requêtes pour isoler le contexte de compte. Le lanceur verrouille le dossier de données pour empêcher deux processus concurrents. NODE_ENV=production reste refusé. La base embarquée est réservée au pilote personnel.

## Fonction produit ajoutée

Après une séance réellement terminée/synchronisée, l’ordinateur peut télécharger une carte PNG 1080×1920 issue des données relues depuis le serveur. Elle comprend programme, nombre de mouvements/séries et date de Paris. Aucun pseudonyme, charge, photo ou publication automatique. Le partage texte reste disponible ; l’export image natif iOS/Android n’est pas encore développé.

## Preuves exécutées

- TypeScript API/mobile/scripts : passé.
- ESLint : passé.
- Même suite Node : **41 tests passés avec PostgreSQL serveur**, puis **41 passés avec PostgreSQL embarqué**, zéro échec/ignoré. Ce ne sont pas 82 cas distincts ; les compteurs incluent les tests parents.
- Les scénarios vérifient auth, reset, suppression, RLS, isolation des comptes, interdiction points/droits/rôles, clôture concurrente, plafonds, achats permanents/expiration, programmes, substitutions, conflits, défis/badges, groupes, blocage et administration.
- Moteur compilé exécuté sans tsx, Docker ou fichiers de développement au lancement.
- Fermeture/réouverture avec même dossier : session et série retrouvées, révision identique, puis suppression du compte de test. Données non incorporées dans les archives.
- 2 tests Playwright sur le dossier assemblé : passés en 47,9 s, dont vrai téléchargement PNG (signature, largeur 1080 et hauteur 1920 vérifiées).
- Archive ZIP intégralement extraite dans un dossier distinct avec espaces/accent, **hors du dépôt**, puis application exécutée depuis ce dossier avec une nouvelle base locale : **2 parcours passés en 47,1 s**. La première tentative de test était partie avant la fin de l’extraction/démarrage et avait échoué par ECONNREFUSED ; elle a été relancée après vérification de disponibilité.
- Carte produite par une séance de test inspectée visuellement. Aucun faux témoignage ou résultat client présenté.
- Exports Web et bundles JavaScript/Hermes iOS et Android : passés. Aucun APK/AAB/IPA ni appareil physique testé.
- Dépendances de distribution réinstallées par npm ci avec leur lockfile indépendant : passé.
- Archive et fichier Node contrôlés par CRC/SHA-256 ; provenance et licences incluses ; aucun fichier utilisateur ou .env réel.

## Distribution et reprise

Archive principale : /workspace/MOVA-Pret-a-ouvrir-Windows.zip. /workspace/MOVA-Windows.zip pointe sur les mêmes octets pour éviter de conserver un ancien téléchargement nécessitant Docker. Les sources complètes actualisées sont dans /workspace/MOVA-Code-source.zip. Les scripts de reproduction se trouvent dans distribution/BUILD.md. Les processus de validation sont locaux au cloud, sans lien public ; leur survie après restauration n’est pas garantie.

## Ce qui n’est toujours pas finalisé

Achats/reçus/restauration réels RevenueCat/stores ; email transactionnel et vérification ; MFA et permissions de déploiement ; invitations/deep links ; notifications ; export image natif ; médias/DM modérés ; récompenses configurables et analytics avancés ; validations sportives/juridiques ; binaires/appareils natifs et audit de lancement. Les alertes transitives de l’outillage Expo restent documentées. La distribution autonome facilite l’essai personnel, elle ne rend pas le produit commercialement validé.
