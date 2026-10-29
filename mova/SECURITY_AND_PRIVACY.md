# Sécurité, confidentialité et modération

**Pilote local, données de test uniquement. Pas d’affirmation de conformité RGPD validée.** Les projets juridiques sont dans `docs/LEGAL_DRAFTS.md`.

## Protections implémentées

Mots de passe 12–128 caractères, scrypt avec sel aléatoire et comparaison constante. Jetons aléatoires hachés en base, jamais journalisés. Réinitialisation à usage unique et révocation des sessions. Export excluant hashes et sessions. Suppression avec confirmation par mot de passe. Requêtes SQL paramétrées ; tables dynamiques sur listes fixes uniquement. Corps HTTP limité à 32 KiB, validation Zod 4, rate limiting en mémoire, en-têtes Helmet, CORS sur origines explicites. Aucun cookie d’auth ni secret dans l’application. RLS et contrôle d’administration serveur. Les blocs masquent les interactions dans les deux sens ; pas de médias ni DM.

SecureStore natif pour le jeton ; Web en mémoire, reconnexion après reload. AsyncStorage contient les séries de brouillon sans chiffrement applicatif : ne pas collecter d’informations médicales, effacer à la déconnexion. Export et partage natif nécessitent une action explicite. Pas de traceur, publicité, push ou collecte réelle activés.

## Risques et gates

- Compte PostgreSQL propriétaire local : permissions serveur à séparer et auditer avant déploiement.
- Pas de vérification email, MFA admin, détection de sessions anormales ni rotation de jetons ; sessions 7 jours révoquées au logout/reset/suppression. Tokens expirés à purger par tâche de maintenance future.
- Attestation 18+ par case ; pas de preuve d’identité ni de gestion de mineures. Attestation et acceptation de pilot-v1 horodatées en base ; les futures versions devront gérer une nouvelle acceptation.
- Reset : fichiers `.local/mail` ignorés, droits 0600 ; aucun email envoyé. À remplacer par transport transactionnel, éviter la rétention de jetons bruts et purger ces fichiers.
- Le déblocage est disponible dans le profil. Pas de file de modération à SLA garanti. Pas d’ouverture communautaire sans responsable, procédure d’escalade et capacité de traitement.
- Sauvegardes : pas de stratégie de rétention déployée. La suppression concerne les données actives, pas d’éventuelles sauvegardes futures. Définir fenêtre, restauration et suppression après reprise.
- Dépendances : après mise à jour Expo 58, l’audit relève encore des vulnérabilités transitives de l’outillage Expo (Zod 3 et deepmerge). L’API et le domaine utilisent Zod 4 corrigé. Ne pas exposer Metro ; ne pas rétrograder aveuglément selon npm audit fix. Revue des correctifs amont et nouvelle analyse avant lancement.

## Minimisation et décisions à prendre

Pas de poids, mensurations, cycle menstruel ou limitations médicales enregistrés. Ces données pourraient relever de catégories particulières et ne doivent pas être ajoutées par simple champ libre sans analyse de nécessité/base légale. Former la modération à ne pas exporter les signalements vers des outils non autorisés.

Prévoir registre des traitements, DPA hébergeur/mail, localisation UE, accès/suppression/export vérifiés, examen de nécessité d’AIPD, contact RGPD et délais légaux. Le pilote n’active pas d’analytics sans définition des finalités et du consentement requis.

Accès ordinateur : serveur limité à 127.0.0.1, hôte/origine vérifiés, Docker distant ignoré. Les groupes sont ouverts à l’adhésion ; ils ne doivent pas être présentés comme confidentiels sur invitation. RLS retire l’accès aux posts et commentaires après départ. Les nouvelles données (adhésions, badges, sauvegardes) sont incluses dans l’export et supprimées en cascade avec le compte. Les brouillons portent une révision serveur, bloquant l’écrasement silencieux entre appareils.

Distribution personnelle : moteur officiel vérifié, données utilisateur exclues des archives, licences conservées. PGlite est réservé au pilote local ; aucune base réseau n’est exposée, les rôles/RLS sont conservés et les transactions sont sérialisées pour éviter une fuite de contexte d’authentification. Un verrou de processus protège l’ouverture simultanée. Les cartes PNG sont téléchargées après action explicite, sans pseudonyme/charges, et ne sont jamais publiées automatiquement. La vérification SHA-256 du binaire n’est pas un test d’exécution Windows ou un audit de sécurité indépendant.
