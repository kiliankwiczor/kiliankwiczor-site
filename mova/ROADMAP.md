# Roadmap de reprise — état courant

La distribution personnelle Windows inclut son moteur officiel et PostgreSQL embarqué ; aucun Node/Docker à installer sur le poste destinataire. Son code commun est testé sous Linux, pas son exécution Windows. Voir WINDOWS.md et docs/SESSION_3_STATUS.md. Le produit reste un pilote, avec des contenus sportifs non validés.

| Phase | Livré et testable | Encore nécessaire |
|---|---|---|
| Fondations | Comptes, consentement versionné, navigation, PostgreSQL/RLS, lanceur ordinateur | Vérification email réelle, MFA admin, rôles DB de déploiement séparés, traductions externalisées |
| Sport | Catalogue, repères progressifs par semaine de séances, snapshot, remplacement contrôlé, séries, repos conservé, reprise, conflits explicites, statistiques/calendrier | Validation professionnelle, catalogue enrichi, options matériel avancées, durée active, tests natifs |
| Communauté | Texte, profils/recherche, abonnements, likes, commentaires, sauvegarde, blocage/déblocage, signalement, groupes et fil isolé/paginé | Rôles délégués, réponses imbriquées, groupes privés, médias et outils de modération renforcés |
| Engagement | Points plafonnés, défis configurables, adhésions, progrès et badges serveur, partage texte | Invitations/deep links et attribution, équipes, niveaux, récompenses configurables, export image natif (PNG déjà exportable sur ordinateur) |
| Monétisation | Modèle de droits, tests achat permanent/expiration, offre informative désactivée | SDK RevenueCat et webhooks, produits stores, vrais achats/restaurations/remboursements, offres et tests sandbox |
| Lancement | Exports Web/iOS/Android JS, tests API et navigateur, docs, stratégies marketing/économiques | APK/AAB/IPA, appareils, revue sécurité/RGPD, contenus validés, hébergement HTTPS, capacité modération/support et comptes externes |

## Priorités suivantes

1. Validation par une professionnelle qualifiée d’un premier programme et de ses alternatives ; stocker réviseur/version/date avant toute publication.
2. Séparer les permissions DB auth/app/maintenance et renforcer l’auth ; raccorder le mail transactionnel avec comptes et secrets fournis de manière sécurisée.
3. Tester le double-clic sur un poste Windows et les parcours sur appareils Android/iOS, notamment SecureStore, Share et interruption système.
4. Intégrer achats sandbox et synchronisation des droits quand les comptes stores/RevenueCat sont disponibles.
5. Développer invitations/export image natif et récompenses après examen des règles stores, puis activer des pilotes humains consentis et modérés.

Les messages privés et les vidéos ne seront activés qu’avec les garanties de modération et de stockage adaptées. Aucun processus de développement en arrière-plan n’est promis après fin de session.
