# Découvrir MOVA sur Windows

**Retour du 29 octobre 2026 :** le lancement ne fonctionne pas sur le poste du propriétaire. La cause n’est pas identifiée ; aucune correction Windows n’est encore validée. La procédure ci-dessous décrit le fonctionnement prévu. Une adresse Web s’ouvre dans Edge, Chrome ou Firefox, pas dans le Bloc-notes ; elle ne répond que si le lanceur démarre réellement le serveur local. Le passage à Android est préparé dans [ANDROID_DISTRIBUTION.md](docs/ANDROID_DISTRIBUTION.md).

## Version prête à ouvrir — recommandée

**[Télécharger MOVA depuis GitHub](https://github.com/kiliankwiczor/kiliankwiczor-site/raw/refs/heads/main/mova/downloads/MOVA-Pret-a-ouvrir-Windows.zip)**. Le bouton vert « Code → Download ZIP » télécharge les sources du projet ; utilisez ce lien pour obtenir l’application prête à ouvrir.

L’archive **MOVA-Pret-a-ouvrir-Windows.zip** contient le moteur Node.js Windows officiel, PostgreSQL embarqué, le serveur et l’interface déjà construits. Aucun Docker, npm, PostgreSQL ou Node.js à installer sur votre PC.

1. Téléchargez l’archive, puis **clic droit → Extraire tout**.
2. Ouvrez le dossier `MOVA` extrait.
3. Double-cliquez sur **OUVRIR-MOVA.cmd**.
4. Attendez l’ouverture du navigateur et gardez la fenêtre MOVA ouverte.

L’application fonctionne sur votre ordinateur à l’adresse affichée, normalement `http://127.0.0.1:8080`. Ce n’est ni une adresse publique ni un lien vers le cloud de la conversation. Tous les fichiers nécessaires au démarrage sont inclus. Le lanceur ne modifie pas les installations globales et ne demande pas de compte externe.

Créez votre propre compte de test dans l’interface, avec un mot de passe de 12 caractères minimum, puis complétez le questionnaire. Aucun faux membre ou témoignage n’est préchargé. La communauté de cette distribution est locale à votre ordinateur ; rien n’est partagé automatiquement sur Internet.

## Fermer et reprendre

Ctrl+C dans la fenêtre du lanceur ferme proprement la base. Relancez ensuite le même fichier et reconnectez-vous si nécessaire. Les comptes et séances persistent dans `%LOCALAPPDATA%\MOVA-Pilote`. Une nouvelle archive réutilise ce dossier ; ne le supprimez pas pour résoudre un problème de lancement. Les séries du brouillon navigateur nécessitent la synchronisation explicite habituelle.

La fermeture/réouverture et la conservation d’un compte, d’une session et d’une série ont été vérifiées sur le moteur commun sous Linux. Le moteur Windows est officiel, avec version épinglée et SHA-256 vérifié. **Le binaire et le double-clic Windows n’ont pas été exécutés dans l’environnement Linux disponible.** Distribution destinée à Windows 64 bits ; pas d’installateur MOVA signé fourni.

Si le navigateur ne s’ouvre pas, recopiez l’adresse imprimée. Si le port 8080 est occupé par une autre application, fermez celle-ci, ou dans un terminal de ce dossier : `set MOVA_DESKTOP_PORT=8084`, puis `OUVRIR-MOVA.cmd`. Ne démarrez pas deux instances sur un même dossier de données.

Le guide `OUVRIR-MOVA.txt` inclus dans l’archive est lisible au Bloc-notes. `PROVENANCE.json`, `Node-LICENSE.txt` et les licences des dépendances documentent les composants inclus.

## Ancienne version et code source

L’ancienne archive source utilisait **DEMARRER-MOVA.cmd**, Node.js 24 et Docker Desktop. Ce mode de développement reste disponible, mais vous pouvez utiliser la nouvelle distribution prête à ouvrir pour découvrir l’application sans ces installations. Les données de l’ancienne base Docker ne sont pas transférées automatiquement : conservez l’ancienne version et vos exports si vous l’avez déjà utilisée.

Pour développer depuis les sources : `npm ci`, `npm run db:up`, `npm run db:migrate`, puis `npm run api` et `npm run web`, ou le lanceur Docker `npm run desktop`. Le backend standard continue d’utiliser PostgreSQL. Les instructions de construction de la distribution personnelle sont dans `distribution/BUILD.md`.

## Limites du pilote

Les contenus sportifs restent à valider professionnellement. Les achats et vrais emails sont désactivés. Les cartes PNG sont exportables sur ordinateur ; le partage texte reste disponible sur mobile. Ce produit n’est pas encore une version commerciale validée. FEATURE_STATUS.md et LAUNCH_CHECKLIST.md détaillent les éléments restants. Aucun hébergement public ou installation à distance sur votre PC n’a été effectué par l’agent.
