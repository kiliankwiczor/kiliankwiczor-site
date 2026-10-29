# Audit de dépendances — instantané de session

`npm audit --omit=dev --json` exécuté après passage à Expo 58.0.21 et Zod 4.6.7 : 8 entrées de paquets affectés, dont 3 classées high et 5 low, aucune critical. Cela ne représente pas 8 vulnérabilités indépendantes : Expo et @expo/cli héritent des avis transitifs.

- Zod 3.25.76 reste sous @expo/cli ; avis GHSA-mrhx-c7xc-m3w5 (collections contraintes surdimensionnées, épuisement mémoire). L’API et le domaine dépendent directement de Zod 4.6.7, au-delà du correctif 4.6.6 annoncé par l’avis.
- deepmerge 4.3.1, avis GHSA-gcqx-w48m-w2h4 (prototype poisoning), affecte la configuration/outillage Expo ; propagation aux paquets @expo/config, @expo/metro-config, @expo/prebuild-config et @expo/local-build-cache-provider.

Sources : métadonnées d’avis fournies par le registre npm durant l’audit ; liens consultables : https://github.com/advisories/GHSA-mrhx-c7xc-m3w5 et https://github.com/advisories/GHSA-gcqx-w48m-w2h4 . Pas de pentest indépendant effectué. Ne pas présenter le projet comme exempt de vulnérabilités.

Le correctif automatique proposé peut rétrograder Expo et ne garantit pas la sécurité globale. Aucun override incompatible de Zod 3 vers 4 n’a été forcé dans l’outillage tiers. Ne pas exposer Metro ni traiter de fichiers externes non fiables dans les outils de build. Vérifier les correctifs amont et réexécuter audit, build et tests avant lancement. Les limites HTTP et l’absence d’uploads réduisent le périmètre applicatif, sans remplacer une correction des dépendances.

## Distribution personnelle prête à ouvrir

Audit npm exécuté sur les 70 dépendances de `distribution/` installées par lockfile : 0 alerte signalée. Le périmètre exclut l’outillage Expo de développement et ne constitue pas un audit de sécurité indépendant. Les alertes Expo décrites ci-dessus restent à traiter pour le projet global. Le moteur Windows officiel est épinglé et vérifié par SHA-256 publié ; il n’a pas été exécuté sur Windows dans cette session.
