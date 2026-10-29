import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { createServer } from 'node:net';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { desktopGateway } from './desktop-gateway.js';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
process.chdir(root);
const port = Number(process.env.MOVA_DESKTOP_PORT ?? 8080);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error('MOVA_DESKTOP_PORT doit être un port entre 1024 et 65535.');
if (Number(process.versions.node.split('.')[0]) < 24)
  throw new Error('Installez Node.js 24 LTS pour lancer MOVA.');
const address = `http://127.0.0.1:${port}`;
function openBrowser() {
  if (process.env.MOVA_OPEN_BROWSER !== '0') {
    const child =
      process.platform === 'win32'
        ? spawn('cmd', ['/c', 'start', '', address])
        : process.platform === 'darwin'
          ? spawn('open', [address])
          : spawn('xdg-open', [address]);
    child.on('error', () => console.log(`Ouvrez ${address} dans votre navigateur.`));
    child.unref();
  }
}
try {
  const response = await fetch(`${address}/api/health`, { signal: AbortSignal.timeout(1000) });
  if (response.ok && (await response.json()).app === 'MOVA') {
    console.log(`MOVA est déjà ouvert : ${address}`);
    openBrowser();
    process.exit(0);
  }
} catch {
  /* Le serveur n'est pas encore démarré. */
}
const probe = createServer();
await new Promise<void>((done, reject) => {
  probe.once('error', () =>
    reject(
      new Error(
        `Le port ${port} est déjà utilisé. Fermez l'autre application ou définissez MOVA_DESKTOP_PORT.`,
      ),
    ),
  );
  probe.listen(port, '127.0.0.1', () => probe.close(() => done()));
});
const image =
  'postgres:17-alpine@sha256:266d3c257594e195b309ae9d1805e54c788f1d7b375f56bf6c367aac6c917e7b';
const dockerEnv = { ...process.env };
for (const name of [
  'DOCKER_HOST',
  'DOCKER_CONTEXT',
  'DOCKER_TLS',
  'DOCKER_TLS_VERIFY',
  'DOCKER_CERT_PATH',
])
  delete dockerEnv[name];
const localSocket =
  process.platform === 'darwin' && !existsSync('/var/run/docker.sock')
    ? join(homedir(), '.docker/run/docker.sock')
    : '/var/run/docker.sock';
const endpoint =
  process.platform === 'win32' ? 'npipe:////./pipe/docker_engine' : `unix://${localSocket}`;
const docker = (args: string[]) =>
  execFileSync('docker', ['--host', endpoint, ...args], {
    env: dockerEnv,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
console.log('MOVA · préparation de votre espace local');
try {
  docker(['info', '--format', '{{.ServerVersion}}']);
} catch {
  throw new Error(
    'Docker ne répond pas. Démarrez Docker Desktop et attendez son état « running ».',
  );
}
let exists = false;
try {
  const actual = docker(['inspect', '--format', '{{.Config.Image}}', 'mova-desktop-db']).trim();
  if (actual !== image)
    throw new Error(
      'Le nom mova-desktop-db est utilisé par une autre image. Aucun conteneur supprimé.',
    );
  exists = true;
} catch (e) {
  if (e instanceof Error && e.message.startsWith('Le nom')) throw e;
}
if (exists) docker(['start', 'mova-desktop-db']);
else
  docker([
    'run',
    '-d',
    '--name',
    'mova-desktop-db',
    '-e',
    'POSTGRES_USER=mova',
    '-e',
    'POSTGRES_PASSWORD=mova_desktop_local',
    '-e',
    'POSTGRES_DB=mova',
    '-p',
    '127.0.0.1:5434:5432',
    '-v',
    'mova-desktop-data:/var/lib/postgresql/data',
    image,
  ]);
let ready = false;
for (let i = 0; i < 30; i++) {
  try {
    docker(['exec', 'mova-desktop-db', 'pg_isready', '-U', 'mova', '-d', 'mova']);
    ready = true;
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 1000));
  }
}
if (!ready) throw new Error('La base locale ne répond pas. Consultez docker logs mova-desktop-db.');
process.env.DATABASE_URL = 'postgres://mova:mova_desktop_local@127.0.0.1:5434/mova';
process.env.WEB_ORIGINS = `http://127.0.0.1:${port},http://localhost:${port}`;
const { migrate } = await import('../apps/api/src/migrate.js');
await migrate();
const hash = createHash('sha256');
async function fingerprint(path: string): Promise<void> {
  const entries = await readdir(join(root, path), { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) await fingerprint(child);
    else {
      hash.update(child);
      hash.update(await readFile(join(root, child)));
    }
  }
}
for (const path of ['apps/mobile/app', 'apps/mobile/src', 'packages/domain/src'])
  await fingerprint(path);
for (const path of ['package-lock.json', 'apps/mobile/app.json', 'apps/mobile/package.json'])
  hash.update(await readFile(join(root, path)));
const stamp = hash.digest('hex');
await mkdir('.local', { recursive: true });
let previous = '';
try {
  previous = await readFile('.local/desktop-build.sha', 'utf8');
  await readFile('apps/mobile/dist-desktop/index.html');
} catch {
  previous = '';
}
if (previous !== stamp) {
  console.log('Construction de l’interface (premier lancement ou mise à jour)…');
  const child = spawn(
    process.execPath,
    [
      fileURLToPath(import.meta.resolve('expo/bin/cli')),
      'export',
      '--platform',
      'web',
      '--output-dir',
      'dist-desktop',
    ],
    {
      cwd: join(root, 'apps/mobile'),
      env: { ...process.env, EXPO_PUBLIC_API_URL: '/api' },
      stdio: 'inherit',
    },
  );
  const exit = await new Promise<number | null>((r, reject) => {
    child.on('exit', r);
    child.on('error', reject);
  });
  if (exit !== 0) throw new Error('La construction de l’interface a échoué.');
  await writeFile('.local/desktop-build.sha', stamp);
}
const { buildApp } = await import('../apps/api/src/server.js');
const app = await buildApp();
await app.ready();
const server = desktopGateway(app, join(root, 'apps/mobile/dist-desktop'));
await new Promise<void>((r, reject) => {
  server.once('error', reject);
  server.listen(port, '127.0.0.1', r);
});

console.log(
  `\nMOVA est ouvert sur votre ordinateur : ${address}\nGardez cette fenêtre ouverte. Ctrl+C arrête l’application sans supprimer vos données.\n`,
);
openBrowser();
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  server.close();
  await app.close();
  const { pool } = await import('../apps/api/src/db.js');
  await pool.end();
  process.exit(0);
}
process.on('SIGINT', close);
process.on('SIGTERM', close);
