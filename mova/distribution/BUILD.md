# Construire la distribution personnelle

Depuis `mova/`, Node 24 et Python 3 sont nécessaires sur la machine qui prépare l’archive. Ces outils ne sont pas à installer sur le PC destinataire.

```sh
npm ci
npm run prepare:personal
python3 scripts/fetch-windows-runtime.py
EXPO_PUBLIC_API_URL=/api npm exec -w @mova/mobile -- expo export --platform web --output-dir dist-desktop
npm run build:personal
python3 scripts/package-personal.py /workspace/MOVA-Pret-a-ouvrir-Windows.zip
```

Le moteur Windows est épinglé dans node-runtime.json. Le téléchargement vérifie le checksum publié depuis nodejs.org et celui épinglé ; un changement inattendu bloque la construction. Les dépendances serveur sont figées dans package-lock.json de ce dossier et installées avec npm ci. Le builder refuse des modules `.node` spécifiques à Linux. Les licences sont conservées.

`build-personal.mjs` compile les sources de l’API et le domaine en JavaScript, copie migrations, interface et dépendances pures JS/WASM dans `.local/personal-release`. Aucune donnée utilisateur n’est incorporée. La distribution ZIP ajoute le binaire Windows sans le modifier et son texte de licence. `package-personal.py` vérifie le CRC et produit un SHA-256.

Validation sur Linux, avec le même moteur applicatif compilé :

```sh
MOVA_OPEN_BROWSER=0 MOVA_DESKTOP_PORT=8083 MOVA_LOCAL_DATA_DIR=/tmp/mova-personal-validation node .local/personal-release/app.mjs
# Dans un autre terminal :
MOVA_E2E_BASE_URL=http://127.0.0.1:8083 MOVA_E2E_API_URL=http://127.0.0.1:8083/api PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e
```

La base personnelle est PostgreSQL WASM via PGlite ; elle garde les migrations et politiques RLS. Un verrou de processus et une file sérialisée empêchent deux transactions de partager le contexte utilisateur. Le serveur ne s’ouvre que sur loopback. Ce moteur est réservé au pilote local ; PostgreSQL serveur reste le backend standard et NODE_ENV=production reste bloqué.

Ne reconstruisez pas pendant un test ou pendant l’utilisation du dossier compilé. Les données de validation doivent être isolées des données personnelles. Ne prétendez pas avoir exécuté Windows, un appareil mobile ou un achat store si seul le moteur Linux a été testé.
