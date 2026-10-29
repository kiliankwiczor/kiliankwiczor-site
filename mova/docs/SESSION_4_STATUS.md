# Bilan — préparation Android et retour de lancement Windows

29 octobre 2026.

Le code, la documentation et l’archive Windows ont été poussés sur `main` dans le dépôt `kiliankwiczor/kiliankwiczor-site` au commit `e3aae32`. Le téléchargement et son empreinte ont été vérifiés depuis GitHub. Cela n’a pas hébergé le backend.

Le propriétaire signale ensuite que `OUVRIR-MOVA.cmd` ne lance ni fenêtre utilisable ni navigateur. Aucune trace d’erreur Windows n’est disponible ; la cause n’est pas identifiée et aucun correctif Windows n’est déclaré validé. L’essai sous Linux ne suffit pas à établir le fonctionnement sur Windows. L’adresse `127.0.0.1` nécessite que le serveur local démarre et s’ouvre dans un navigateur, pas dans le Bloc-notes.

Le propriétaire préfère une installation par Google Play et confirme ne pas avoir de compte développeur. La distribution recommandée commence par un test interne, après création du compte par le propriétaire, préparation de l’API HTTPS, compilation signée et tests sur Android.

Ajouts : profils EAS APK de test et AAB destiné à Play Console, contrôle des variables de distribution, blocage des URL locales et identifiants provisoires, protection Git des clés/binaires, guide `ANDROID_DISTRIBUTION.md`. Les commandes de compilation/soumission n’ont pas été lancées ; aucune dépense, signature ou publication.

Les blocages externes restent : compte développeur Play et vérifications, compte/projet Expo, serveur HTTPS et comptes d’hébergement, nom/identifiant définitifs, validations de lancement. Le backend refuse toujours la production. Le SDK Android, les certificats et les appareils ne sont pas disponibles ici. Aucun APK/AAB livré, aucun lien Play Store disponible.

Les résultats des contrôles de cette session sont consignés dans TESTING.md. Les preuves historiques détaillées du moteur local restent dans SESSION_3_STATUS.md.
