# Monétisation — préparation, aucun achat activé

| Offre prévue | Prix hypothétique TTC | Valeur future |
|---|---|---|
| Free | 0 € | initiation complète, communauté, journal de base, points |
| Plus | 5,99 €/mois | programmes complémentaires, historique/analyses étendus |
| Premium | 9,99 €/mois | catalogue inclus et personnalisation avancée |
| À l’unité | 9,99 / 14,99 / 19,99 € à tester | programme identifié, droit permanent clairement indiqué |

Aucune fausse réduction, urgence ou transformation garantie. Le pilote gratuit existe ; les promesses payantes ne sont pas commercialisées. Les tarifs réels devront provenir des métadonnées localisées Apple/Google. Essais, annuels, fondateurs et campagnes sont à configurer dans les stores puis dans le backend, sans prix codé faisant foi.

## Contrat des droits implémenté

Accès gratuit ou droit serveur actif. Un achat `purchase` lié à program_id, sans expiration, reste valide même si un abonnement expire. Plus ne donne pas accès aux programmes Premium. Expiration comparée au temps serveur, jamais à une propriété modifiable du profil. Le rôle SQL applicatif ne peut pas écrire les droits. Il n’existe pas de bouton de faux achat.

## Intégration RevenueCat à réaliser

1. Créer produits et offres dans les sandbox, RevenueCat et les stores (intervention du propriétaire, aucun achat de service ici).
2. Identifier l’appUserId par UUID serveur et tester changement de compte/anonymat, jamais par email.
3. Webhook avec secret serveur vérifié, corps borné, événement unique, journal brut minimisé et file transactionnelle ; récupération serveur des droits pour réconcilier événements désordonnés.
4. Gérer achat/restauration, renouvellement, grâce, résiliation à échéance, expiration, remboursement et révocation d’achat permanent séparément.
5. Tester sandbox iOS/Android et restauration sur second appareil ; le bouton de restauration ne doit jamais créer lui-même un droit.

Les tests actuels prouvent les règles de droits avec événements de test en SQL, **pas** la validation de reçus ou la restauration en store. Les points ne sont ni vendus ni convertis en contenu payant. Avant récompenses numériques, revoir les textes actuels des règles Apple et Google ; accès réseau officiel non disponible pendant cette session.

Voir BUSINESS_MODEL.md pour les scénarios de rentabilité. Le tarif 5,99 € n’est pas validé économiquement ; un lancement sans maîtrise des coûts humains peut être déficitaire.
