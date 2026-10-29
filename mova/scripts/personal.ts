import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { mkdir, readFile, open, unlink } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { desktopGateway } from './desktop-gateway.js';
async function main() {
  const root = process.env.MOVA_RELEASE_ROOT
    ? resolve(process.env.MOVA_RELEASE_ROOT)
    : dirname(fileURLToPath(import.meta.url));
  process.chdir(root);
  const port = Number(process.env.MOVA_DESKTOP_PORT ?? 8080);
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error('Le port MOVA doit être compris entre 1024 et 65535.');
  const address = `http://127.0.0.1:${port}`;
  function browse() {
    if (process.env.MOVA_OPEN_BROWSER === '0') return;
    const child =
      process.platform === 'win32'
        ? spawn('cmd', ['/c', 'start', '', address])
        : process.platform === 'darwin'
          ? spawn('open', [address])
          : spawn('xdg-open', [address]);
    child.on('error', () => console.log(`Ouvrez ${address} dans votre navigateur.`));
    child.unref();
  }
  try {
    const response = await fetch(address + '/api/health', { signal: AbortSignal.timeout(800) });
    if (response.ok && (await response.json()).app === 'MOVA') {
      console.log(`MOVA est déjà ouvert : ${address}`);
      browse();
      return;
    }
  } catch {
    /* Pas encore démarré. */
  }
  const probe = createServer();
  await new Promise<void>((done, reject) => {
    probe.once('error', () =>
      reject(new Error(`Le port ${port} est occupé par une autre application.`)),
    );
    probe.listen(port, '127.0.0.1', () => probe.close(() => done()));
  });
  const userRoot = process.env.MOVA_LOCAL_DATA_DIR
    ? resolve(process.env.MOVA_LOCAL_DATA_DIR)
    : process.platform === 'win32' && process.env.LOCALAPPDATA
      ? join(process.env.LOCALAPPDATA, 'MOVA-Pilote')
      : join(root, '..', 'mova-personal-data');
  await mkdir(userRoot, { recursive: true });
  // One process owns this local database. Never steal a lock from another process.
  const lockFile = join(userRoot, 'application.lock');
  async function takeLock() {
    try {
      const file = await open(lockFile, 'wx', 0o600);
      await file.writeFile(String(process.pid));
      await file.close();
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
      let pid = Number.NaN;
      try {
        pid = Number(await readFile(lockFile, 'utf8'));
      } catch {
        throw new Error(
          'Le verrou local est illisible. Fermez MOVA et vérifiez le dossier de données.',
        );
      }
      let alive = true;
      if (Number.isInteger(pid) && pid > 0) {
        try {
          process.kill(pid, 0);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ESRCH') alive = false;
        }
      }
      if (alive)
        throw new Error(
          'Une autre instance MOVA utilise déjà ces données. Fermez-la avant de changer de port.',
        );
      await unlink(lockFile);
      const file = await open(lockFile, 'wx', 0o600);
      await file.writeFile(String(process.pid));
      await file.close();
    }
  }
  await takeLock();
  process.env.MOVA_DATABASE_ENGINE = 'embedded';
  process.env.MOVA_LOCAL_DATA_DIR = join(userRoot, 'database');
  process.env.MOVA_MIGRATIONS_DIR = join(root, 'database');
  process.env.WEB_ORIGINS = `${address},http://localhost:${port}`;
  console.log('MOVA · ouverture de votre espace personnel…');
  const { pool } = await import('../apps/api/src/db.js');
  let closing = false;
  let stopServer = () => {};
  let closeApp = async () => {};
  async function close() {
    if (closing) return;
    closing = true;
    stopServer();
    await closeApp();
    await pool.end();
    await unlink(lockFile).catch(() => {});
  }
  try {
    const { migrate } = await import('../apps/api/src/migrate.js');
    await migrate();
    const { buildApp } = await import('../apps/api/src/server.js');
    const app = await buildApp();
    await app.ready();
    closeApp = () => app.close();
    const server = desktopGateway(app, join(root, 'web'));
    stopServer = () => {
      server.close();
      server.closeIdleConnections();
    };
    await new Promise<void>((done, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', done);
    });
    console.log(
      `\nMOVA est prêt : ${address}\nAucune installation de Node.js ou Docker requise dans la version Windows portable.\nVos données restent sur cet ordinateur. Gardez cette fenêtre ouverte. Ctrl+C pour quitter.\n`,
    );
    browse();
    for (const signal of ['SIGINT', 'SIGTERM'] as const)
      process.on(signal, () => {
        close()
          .then(() => process.exit(0))
          .catch(() => process.exit(1));
      });
  } catch (e) {
    await close();
    throw e;
  }
}
main().catch((error) => {
  console.error(`MOVA n’a pas pu démarrer : ${(error as Error).message}`);
  process.exitCode = 1;
});
