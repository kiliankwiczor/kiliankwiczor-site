# Installer MOVA sur Android — préparation, aucune publication effectuée

État au 29 octobre 2026 : le propriétaire indique ne pas avoir de compte développeur Google Play Console. Aucun compte Expo lié, serveur HTTPS de pilote, certificat de signature, APK ou AAB n’est disponible dans cette session. L’environnement contient Java, mais pas le SDK Android ni un appareil Android. Les exports JavaScript antérieurs ne sont pas des applications Android installables.

## Parcours recommandé

1. Le propriétaire crée son compte dans [Google Play Console](https://play.google.com/console/signup), accepte les conditions, effectue les vérifications et règle les frais affichés directement à Google. Aucune création, dépense ou acceptation contractuelle par l’agent.
2. Préparer un serveur pilote HTTPS avec PostgreSQL, sauvegardes, vrais emails, permissions adaptées et documents de confidentialité. Les données ne doivent pas dépendre d’un PC allumé. Le serveur actuel refuse volontairement `NODE_ENV=production` : cette garde reste en place tant que LAUNCH_CHECKLIST.md n’est pas traitée. Une variable d’URL ne déploie pas ce serveur.
3. Relier un projet au compte Expo du propriétaire et conserver sa signature Android dans son compte. Choisir l’identifiant Android définitif avant la première distribution, après vérification de l’identité de l’éditeur et du nom provisoire MOVA. `fr.mova.pilot` n’est pas accepté pour la distribution.
4. Compiler d’abord un APK de test, installer sur un vrai Android, puis tester inscription, connexion, séance hors connexion/reprise, suppression, confidentialité et réseau mobile. Les achats restent désactivés et ne doivent pas être annoncés.
5. Compiler un AAB signé, créer l’application dans Play Console et charger le fichier dans la piste **Test interne**. Configurer les testeuses et récupérer le lien d’inscription au test pour le compte Google utilisé sur le téléphone. Une piste de test n’est pas une publication publique ni une validation commerciale.
6. Préparer la publication publique après les tests requis par Google pour le compte concerné, la revue produit/sécurité/juridique et les contrôles de la console. Ne pas promettre une date d’acceptation.

La création d’un compte Google ordinaire ne remplace pas le compte développeur Play Console. Les frais, délais de vérification, exigences de tests et conditions exactes doivent être vérifiés au moment de l’inscription ; ils n’ont pas été confirmés en ligne dans cette session.

## Configurations ajoutées

`apps/mobile/eas.json` définit deux profils, sans soumission automatique :

| Profil | Fichier prévu | Usage |
| --- | --- | --- |
| `preview` | APK signé | Installation de test hors store via Expo ; ne nécessite pas Play Console, mais nécessite le compte Expo, le serveur et l’autorisation des éventuels coûts de compilation. |
| `play-internal` | AAB signé | Fichier à charger dans la piste Test interne de Play Console. Un AAB ne s’ouvre pas directement sur un téléphone. |

L’environnement EAS nommé `production` de ce second profil désigne les variables du build Expo. Il ne lève pas le blocage de production du backend et ne déclenche aucune publication. Les profils ne contiennent ni identifiant de projet inventé ni clé privée.

Les valeurs publiques nécessaires sont :

- `EXPO_PUBLIC_API_URL` : URL de l’API HTTPS réellement déployée ; jamais une clé ni un jeton.
- `MOVA_EAS_PROJECT_ID` : identifiant UUID du projet lié au compte Expo du propriétaire.
- `MOVA_ANDROID_PACKAGE` : identifiant Android définitif.

Configurer ces valeurs dans l’environnement EAS correspondant et dans le shell local pour la vérification. La configuration dynamique bloque les builds distribuables sans ces valeurs, avec une URL relative/HTTP/locale usuelle ou contenant des identifiants. Elle ne prouve pas que le domaine répond, que le serveur est sécurisé ou que la marque est disponible.

Vérification sans compilation, depuis `mova/` :

```sh
npm run android:check
```

L’échec actuel est attendu : les valeurs externes n’existent pas encore. Le développement Web et mobile local continue à fonctionner sans ces variables.

Après traitement des prérequis et autorisation de toute dépense, depuis `mova/apps/mobile/` :

```sh
npx eas-cli@27.1.0 build --platform android --profile preview
# Après validation sur appareil :
npx eas-cli@27.1.0 build --platform android --profile play-internal
```

Ces commandes utilisent un service externe et peuvent demander une connexion, une configuration de signature et un plan de compilation. **Elles n’ont pas été exécutées.** Pas de `--auto-submit`, pas de création de compte automatisée et pas de service account JSON dans le dépôt. Le propriétaire doit garder l’accès et la maîtrise de la signature ; ne jamais demander un mot de passe dans le chat.

## Dossier Play Console à compléter

- Identité et contact de l’éditeur, politique de confidentialité publique, page de demande de suppression de compte, descriptions et captures provenant de la vraie application.
- Questionnaire Data Safety d’après les données réellement traitées : compte, profil, activité sportive et textes communautaires ; pas de déclaration fictive « aucune donnée » pour une API distante.
- Classification, public majeur, règles communautaires, signalement/blocage, moyens de contact et procédure de modération.
- Compte de revue si demandé, accès aux fonctions protégées et instructions exactes. Les identifiants se transmettent à la console par un canal adapté, jamais dans GitHub.
- Versions SDK/permissions, signature, architectures et comportement réel issus du premier build ; les configurations seules ne les valident pas.
- Pas d’abonnements ni de programmes payants proposés à la vente tant que Google Play Billing/RevenueCat et leurs tests ne sont pas opérationnels.

Sources officielles à consulter au moment de l’exécution : [Google Play Console](https://play.google.com/console/about/), [tests internes](https://support.google.com/googleplay/android-developer/answer/9845334), [exigences de test des nouveaux comptes personnels](https://support.google.com/googleplay/android-developer/answer/14151465), [build Android Expo](https://docs.expo.dev/build/setup/). Les sites d’aide Google/Expo ne sont pas autorisés par la politique réseau actuelle ; les conditions actuelles ne sont pas présentées comme vérifiées.
