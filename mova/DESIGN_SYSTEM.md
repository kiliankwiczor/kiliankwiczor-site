# Design system MOVA v0

Identité typographique provisoire : `mova ◒`. Symbole géométrique et nom éditables dans les composants ; centralisation finale de toutes les occurrences et vérification de marque encore nécessaires. Aucun asset photographique ou vidéo tiers.

| Rôle | Clair | Sombre |
|---|---|---|
| Fond | #F7F5F1 | #19161F |
| Texte | #282334 | #F7F5FA |
| Surface | #FFFFFF | #272130 |
| Primaire | #573B68 | #573B68 |
| Texte secondaire | #6C6475 | #C2B8CD |
| Accent lavande | #E9E1F1 | réservé aux notices |
| Corail | #BD4A3C | réservé aux accents |

Source des tokens et composants : `apps/mobile/src/ui.tsx`. Typographie système pour rapidité, accents français et adaptation plateforme. Corps 16/25, titres 27/34, héros 44/50, labels 13/20. Cartes rayon 24, boutons rayon 16, champs rayon 14. Grille de 12–24 px, largeur de lecture maximum 780 px. Cibles tactiles minimum 48 px.

Composants : Page, Txt, Card, Row, Button, Field, Notice et Loading. Boutons désactivés pendant les mutations principales, messages réseau et erreurs explicites. États vides sans faux membres ni résultats simulés. Mode sombre par préférence système. Champs avec libellés accessibles ; boutons ont un rôle ; erreurs annoncées en région dynamique. Aucun autoplay ni mouvement imposé. Les animations de récompense et le retour haptique restent à ajouter avec respect de la réduction des animations.

À auditer : contrastes calculés systématiquement, zoom à 200 %, longues traductions, VoiceOver/TalkBack, navigation clavier, focus des changements de route, annonces du timer, textes agrandis sur petit écran. Une palette lisible ne remplace pas ces tests. Une carte PNG 1080×1920 est désormais exportable sur ordinateur depuis une séance terminée. Elle utilise les couleurs et formes du système, sans photo tierce ni pseudonyme/charges. L’export image natif mobile reste à développer ; le partage texte reste disponible.

Contrastes WCAG calculés sur les couleurs statiques : texte principal clair 13,97:1 ; secondaire clair 5,19:1 ; blanc sur bouton prune 9,41:1 ; texte principal sombre 16,50:1 ; onglet actif lavande sur surface sombre 9,52:1. Ce calcul ne valide ni le focus, ni les états désactivés, ni l’ensemble des écrans sur appareil.

Les titres ont maintenant un rôle de titre accessible. Les icônes de navigation sont dessinées avec des formes React Native, sans dépendance à un glyphe manquant de la police système. Elles sont décoratives pour les lecteurs d’écran ; les onglets gardent leurs libellés.
