# Registre de décisions

| ID | Décision | Raison et compromis |
|---|---|---|
| 001 | Sous-projet `mova/` | Préserver le site personnel et son historique ; pas de nouveau worktree |
| 002 | Expo SDK 58 / TypeScript / Router | Base commune native/Web ; SDK actuel choisi après audit de la première sélection 54 |
| 003 | Fastify + PostgreSQL local | Exécution et tests complets sans compte externe ; auth à durcir ou migrer avant ouverture |
| 004 | Un backend modulaire, pas de microservices | Coûts et maintenance limités ; extraction future si métriques le justifient |
| 005 | Contenu `pending_review` | Aucune validation sportive inventée ; publication commerciale bloquée |
| 006 | Texte seulement pour la communauté | Valeur sans photo du corps, modération et coûts initiaux limités |
| 007 | Points serveur, 50/jour, 3 gains/semaine | Régularité et antifraude élémentaire ; aucune incitation à cumuler des séances |
| 008 | Aucun paiement simulé | Modèle de droits testable sans prétendre restaurer de vrais reçus |
| 009 | Pas d’IA générative au lancement | Règles explicites, coût nul et pas de prescription libre |
| 010 | Web auth en mémoire / SecureStore mobile | Éviter stockage persistant de jeton Web ; reconnexion après reload |
| 011 | Pas de collecte réelle | Autorisation utilisateur limitée au développement ; toutes les inscriptions de validation sont des tests |
| 012 | Pas de messagerie initiale | Sécurité/modération pas encore démontrées ; ne pas activer un canal risqué sans opérateur |

## Décisions restant au propriétaire

Nom et marque définitifs, société/éditeur, professionnelle sportive et droits, revue juridique, hébergeur et budget, comptes stores/RevenueCat/email, autorisation de déploiement et publication. Pas de dépense ni d’engagement pris ici.

## Vérifications impossibles dans ce réseau

Les sites officiels des concurrents renvoient un refus de domaine par le proxy. Les tarifs et fonctions ne sont pas déclarés actuels. Téléchargement du Chromium Playwright également refusé ; un Chromium système est utilisé pour la validation locale. Les politiques Apple/Google devront être consultées dans leur version applicable avant monétisation.

| 013 | Lanceur ordinateur Node + Docker local uniquement | Pas de service d’aperçu public disponible ; un serveur de même origine évite de configurer deux adresses dans le navigateur. Aucun contexte Docker distant utilisé. |
| 014 | Révisions optimistes des séances et recharge explicite | Refuser une écriture ancienne plutôt que fusionner silencieusement des performances. |
| 015 | Défis par journées distinctes, badge serveur sans bonus monétaire | Ne pas encourager plusieurs séances par jour pour les récompenses. |
| 016 | Groupes ouverts avec lecture réservée aux adhérentes courantes | Valeur communautaire réelle ; ne pas confondre ces groupes avec des groupes privés sur invitation. |

| 017 | Distribution personnelle autonome avec PostgreSQL WASM | Supprimer les installations Node/Docker chez le destinataire, conserver le même backend et les mêmes RLS ; usage local uniquement et tests des deux moteurs. |
| 018 | Runtime Windows officiel épinglé et vérifié | Distribuer un moteur connu avec licences/provenance, sans installateur distant ni script de téléchargement au premier lancement. |
| 019 | Cartes PNG Web générées après relecture serveur | Partage volontaire sans identité/charges ; export image natif restant explicite. |
