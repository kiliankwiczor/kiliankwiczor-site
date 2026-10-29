# Schéma PostgreSQL

Migrations `database/001_initial.sql` à `004_groups.sql`, application par verrou consultatif transactionnel et table `migrations`. Les catalogues initiaux sont insérés sans écraser les modifications. Toutes les clés de compte référencent users ; cascades explicites pour données actives. Pas de stockage de poids ni de données médicales.

| Table | Usage | Accès mobile indirect |
|---|---|---|
| users | email, hash scrypt, rôle, création | aucun accès SQL applicatif |
| auth_sessions | hash jeton, compte, expiration | serveur auth seulement |
| password_resets | hash jeton, expiration 30 min | serveur auth seulement |
| consents | version pilot-v1 et attestation de majorité horodatées | lecture propriétaire, écriture serveur |
| profiles | pseudo et bio publics | lecture hors blocage, édition du propriétaire |
| preferences | questionnaire JSON | propriétaire seulement |
| catalog | exercices/programmes JSON, statut brouillon | lecture ; écriture admin auditée |
| workouts | snapshot programme, séries JSON, début/fin | propriétaire seulement |
| points_ledger | gain unique par séance, motif/date | propriétaire en lecture, serveur en écriture |
| entitlements | abonnement expirant ou achat permanent | propriétaire en lecture, serveur en écriture |
| posts / comments / likes | fil textuel et interactions | RLS visibilité/blocage |
| follows | abonnements entre membres | propriétaire |
| blocks | blocages | propriétaire ; fonction sécurisée pour visibilité réciproque |
| reports | motif, publication, état | création membre, revue admin |
| challenges / challenge_members | définition et adhésion de défis | lectures actives et adhésions personnelles |
| badges | première séance et défi réussi | lecture personnelle ; écriture serveur |
| groups / group_members | groupes ouverts et adhésions | métadonnées et adhésion personnelle |
| saved_posts | sauvegarde de conversations visibles | propriétaire, avec visibilité du post requise |
| audit_log | acteur, action, cible | serveur seulement |

La fonction `mutually_visible` a un search_path fixé et ne retourne qu’un booléen. `actor` dépend d’un contexte transactionnel posé par le serveur, jamais d’un user_id accepté depuis le corps du client. Les écritures points/droits/rôles sont interdites au rôle mova_app.

Limites : JSON des séries validé principalement par Zod serveur ; imposer le schéma en SQL avant accès direct externe. Les données business avancées, versions de validation professionnelle, plans sportifs avancés et webhooks restent à migrer. Les snapshots capturent désormais le rang et la semaine de programme, et workouts.revision contrôle les sauvegardes concurrentes. Les posts de groupe nécessitent une adhésion courante, y compris via commentaires et sauvegardes. Les statistiques administratives sont des compteurs instantanés, sans faux DAU/MRR.
