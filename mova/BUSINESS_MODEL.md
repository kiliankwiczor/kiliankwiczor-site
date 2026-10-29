# Scénarios économiques mensuels hypothétiques

Aucun devis fournisseur vérifié, aucun revenu réalisé. EUR/mois. Population = comptes inscrits ; MAU = hypothèse 60 %. Conversion = 5 % des MAU, soit 3 % des inscrites. Répartition payante 80 % Plus à 5,99 et 20 % Premium à 9,99 → ARPPU TTC 6,79 €. Pas d’achats unitaires, annuels, essais ou churn inclus. Modèle statique, pas de promesse de croissance.

Hypothèses à remplacer par contrats réels : TVA 20 % simplifiée ; commission store 15 % sur HT (éligibilité non établie, scénario à 30 % ci-dessous). Stockage 0,01 €/MAU ; diffusion vidéo future plafonnée 0,02 €/MAU (dans le pilote sans upload, ce poste est nul). Modération 0,10 €/MAU = 4 h pour 1 000 MAU à 25 €/h ; support 0,04 €/MAU = 16 tickets pour 1 000 MAU à 2,50 €/ticket. Acquisition mensuelle de 1 % des inscrites à CAC 3 €. Backend fixe par palier, inclut hypothétiquement DB/API/mail/surveillance, pas un prix de service constaté.

| Inscrites | MAU | Abonnées | CA TTC | TVA | Commission | Stockage | Vidéo | Backend | Modération | Support | Acquisition | Contribution |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 100 | 60 | 3 | 20.37 | 3.39 | 2.55 | 1 | 1 | 60 | 6 | 2 | 3 | -58.77 |
| 1,000 | 600 | 30 | 203.70 | 33.95 | 25.46 | 6 | 12 | 100 | 60 | 24 | 30 | -87.71 |
| 10,000 | 6,000 | 300 | 2,037.00 | 339.50 | 254.62 | 60 | 120 | 250 | 600 | 240 | 300 | -127.12 |
| 50,000 | 30,000 | 1,500 | 10,185.00 | 1,697.50 | 1,273.12 | 300 | 600 | 900 | 3,000 | 1,200 | 1,500 | -285.62 |
| 100,000 | 60,000 | 3,000 | 20,370.00 | 3,395.00 | 2,546.25 | 600 | 1,200 | 1600 | 6,000 | 2,400 | 3,000 | -371.25 |

Contribution = CA TTC − TVA − commission − postes ci-dessus. **Ce n’est pas le bénéfice** : développement, salaires fondateurs, création/validation sportive, juridique, assurance, impôts, remboursements et frais généraux ne sont pas inclus. LTV ne peut pas être estimée crédiblement sans churn et contribution par cohorte observés.

## Soutenabilité de 5,99 €

À 5,99 € TTC, avec ces hypothèses, le net avant opérations est 5,99 / 1,20 × 0,85 ≈ 4,24 €/abonnée. À 5 % de conversion des MAU, cela apporte 0,212 €/MAU. Les opérations variables du modèle coûtent 0,17 €/MAU ; acquisition 0,05 €/MAU ; le backend n’est pas encore couvert. Le tarif seul ne soutient donc pas cette base gratuite dans ce scénario.

Le mix à 6,79 € ajoute un peu de contribution, mais reste fragile. Une commission de 30 % enlève encore environ 0,0255 € par inscrite et par mois au modèle (CA HT × 15 points). Un doublement du besoin de modération ajoute 0,06 € par inscrite. L’ajout de vidéos sans limites peut invalider les hypothèses de bande passante.

## Alternatives à expérimenter

Tester Plus à 7,99 et Premium à 11,99, même mix = 8,79 TTC ; net 6,23 €/abonnée, soit 0,311 €/MAU à 5 % de conversion. Avec 0,22 €/MAU opérations/acquisition, il reste 0,091 €/MAU avant backend et coûts fixes d’équipe. À 10 000 MAU et backend 250 €, contribution approximative 660 €, toujours insuffisante pour financer une équipe complète. Augmenter le prix n’assure pas la conversion.

Priorités : gratuit textuel utile, pas de vidéo native initialement, mesurer coûts humains, maintenir la modération, offrir un catalogue validé qui justifie réellement Plus, développer acquisition organique consentie. Aucun système de publicité invasive pour compenser. Décider de la grille finale après pilote et tests d’élasticité, sans retirer brutalement le programme gratuit promis.
