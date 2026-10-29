import { build } from 'esbuild';
import { cp, mkdir, rm, writeFile, readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
const root = resolve('.local/personal-release');
await rm(root, { recursive: true, force: true });
await mkdir(root, { recursive: true });
const runtime = JSON.parse(await readFile('distribution/package.json', 'utf8'));
await build({
  entryPoints: ['scripts/personal.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  outfile: join(root, 'app.mjs'),
  external: Object.keys(runtime.dependencies),
  logLevel: 'warning',
});
await cp('distribution/node_modules', join(root, 'node_modules'), {
  recursive: true,
  dereference: true,
});
await cp('database', join(root, 'database'), { recursive: true });
await cp('apps/mobile/dist-desktop', join(root, 'web'), { recursive: true });
await writeFile(
  join(root, 'package.json'),
  JSON.stringify({ ...runtime, name: 'mova-personal' }, null, 2),
);
await cp('distribution/package-lock.json', join(root, 'runtime-package-lock.json'));
for (const name of ['WINDOWS.md', 'FEATURE_STATUS.md','LAUNCH_CHECKLIST.md']) await cp(name, join(root, name));
async function inspect(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) await inspect(path);
    else if (path.endsWith('.node'))
      throw new Error('Dépendance native à vérifier pour Windows : ' + path);
  }
}
await inspect(join(root, 'node_modules'));
console.log(
  'Version personnelle construite, dépendances sans modules natifs spécifiques à Linux :',
  root,
);
