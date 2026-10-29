# État des fonctionnalités — vérité du pilote

| Parcours demandé | État réel | Limites |
|---|---|---|
| Accueil, bienvenue, compte | Implémenté | Données de test, email non vérifié |
| Inscription / login / logout | Implémenté et tests API | Web en mémoire ; SecureStore natif non testé sur appareil |
| Reset mot de passe | Backend + interface + test de jeton | Fichier de sortie dev, aucun email envoyé |
| Onboarding / recommandation | Implémenté | Lieu/durée seulement utilisés par le moteur ; pas de prescription avancée |
| Catalogue / détail d’exercice | 14 fiches brouillons | Pas de vidéo, niveau/secondaires à structurer |
| Catalogue / détail programme | 10 modèles brouillons, repères progressifs par semaine de séances | Validation professionnelle requise ; pas de charge automatique |
| Séance active / fin / historique | Implémenté, remplacement contrôlé et versionnement | Conflit détecté et choix explicite du serveur ; pas de fusion automatique ni durée active exacte |
| Reprise hors réseau | Brouillon versionné et repos conservé + sync explicite | Pas de nouvelle séance sans serveur ; kill OS natif non testé |
| Calendrier / statistiques | Séances, séries, jours d’activité et derniers repères par exercice | Pas d’analyse avancée ou mesure de temps actif |
| Profils | Pseudo/bio, recherche et profil public avec publications visibles | Pas de photo ni de données privées affichées |
| Fil / publications / commentaires | Implémenté, chronologique paginé, sauvegarde de publications | Texte uniquement, pas de réponses imbriquées ou partage externe des posts |
| Likes / abonnements | Implémenté | Pas de découverte personnalisée |
| Blocage / signalement | Blocage/déblocage, signalement et tests réciproques | Revue humaine permanente à organiser |
| Groupes / communautés distinctes | Groupes ouverts avec adhésion, fil paginé et conversations isolées par RLS | Pas de groupes privés sur invitation, rôles délégués ou messagerie |
| Messages privés | Désactivés | Conditions de sécurité/modération non établies |
| Points / portefeuille | Implémenté serveur + registre | Plafonds simples, pas de récompense achetable |
| Badges / niveaux / récompenses | Badges première séance et défi réussi attribués par serveur | Niveaux et récompenses configurables non implémentés |
| Défis | Adhésion, progression par jours distincts, sortie, badge et administration | Pas d’équipes, invitations ou classement |
| Invitations / parrainage / deep links | Non implémenté | Scheme déclaré, pas de résolution fiable des invitations |
| Partage de réussite | Texte via Share et PNG 1080×1920 sur ordinateur issu de la séance serveur | Export image natif mobile restant ; aucun envoi automatique |
| Abonnements / achats à l’unité | UI informative désactivée + modèle de droits | Pas de RevenueCat, achat ou restauration en store |
| Entitlements | Règles serveur et tests | Données d’achat uniquement en fixtures locales |
| Paramètres / confidentialité | Textes pilote, export et suppression | Pas de notifications, support opérationnel ou journal des appareils |
| Admin | Compteurs, signalements avec contenu, masquage, édition catalogue, création groupes/défis et fermeture de défis auditées | Pas de gestion complète rôles/offres/récompenses/erreurs |
| Analytics / KPI | Contrat documenté, aucun SDK | Compteurs instantanés seulement |
| Landing / attente | Proposition HTML livrée | Collecte inactive, aucun déploiement |
| Compilations natives | Bundles JS/Hermes générés | Aucun APK/AAB/IPA produit, aucun test physique |

Les écrans d’indisponibilité ne constituent pas des fonctions développées. ROADMAP.md définit les prochains incréments ; LAUNCH_CHECKLIST.md bloque la commercialisation.

Mode de développement ordinateur : lanceur Node/Docker et DEMARRER-MOVA.cmd ; voir WINDOWS.md. Le cœur du lanceur et le serveur sont testés sous Linux, le double-clic Windows reste à vérifier sur un poste Windows.

Distribution personnelle prête à ouvrir : Node Windows officiel et PostgreSQL WASM inclus, aucun Node/Docker à installer sur le PC destinataire. Voir distribution/OUVRIR-MOVA.txt. L’exécution Windows physique n’est pas validée ici ; le moteur commun et les parcours sont testés sous Linux.
