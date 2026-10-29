# Contrat analytique futur — aucun SDK actif

Événements serveur proposés : account_created, onboarding_completed, workout_started, workout_completed, post_created, comment_created, challenge_joined, entitlement_activated/expired/revoked. Événements client avec consentement si requis : invitation_share_opened (pas « invitation envoyée »), paywall_viewed, purchase_flow_started. Aucun corps de publication, email, charge, poids ou information médicale dans les propriétés. UUID interne pseudonyme ne signifie pas anonymisation.

Définir déduplication par event_id, horodatage serveur UTC et reporting Europe/Paris, version du schéma et durée courte. L’export et suppression doivent englober la source analytique. Aucune collecte de données réelles avant finalités, base légale et configuration approuvées.

DAU/MAU = utilisateurs uniques ayant une activité produit définie sur jour civil / 30 jours glissants. Activation = première séance terminée sous 7 jours de création. Rétention J1/J7/J30 = retour dans la journée locale correspondante d’une cohorte d’inscriptions, avec fuseau fixé. Renouvellement = événement de facturation distinct. MRR = revenus abonnements récurrents normalisés HT, exclut achats à l’unité et essais gratuits. Présenter brut, TVA, commissions, remboursements et net séparément. ARPPU sur payants, ARPU sur la population explicitée. Résiliation demandée ≠ expiration effective.

Le dashboard actuel n’affiche que les nombres de comptes, séances, publications et signalements ; pas de DAU, MRR ou LTV inventés. Ajouter tableaux par cohorte et contrôles de fraîcheur quand un pipeline réel existe. Les invitations converties exigent deep link vérifié, opt-in et attribution antifraude avant tout comptage.
