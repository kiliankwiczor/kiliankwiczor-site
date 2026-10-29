import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { get } from 'node:http';
import Fastify from 'fastify';
import { desktopGateway } from '../../../scripts/desktop-gateway.js';
test('accès ordinateur : même origine, routes directes, isolation du disque et requêtes bornées', async () => {
  const root = await mkdtemp(join(tmpdir(), 'mova-desktop-'));
  await writeFile(join(root, 'index.html'), '<html>MOVA test</html>');
  const app = Fastify();
  app.get('/health', async () => ({ ok: true }));
  app.post('/echo', async (req) => req.body);
  await app.ready();
  const server = desktopGateway(app, root);
  try {
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    assert.equal(await (await fetch(url + '/home')).text(), '<html>MOVA test</html>');
    assert.equal((await (await fetch(url + '/api/health')).json()).ok, true);
    assert.equal(
      (await fetch(url + '/api/health', { headers: { origin: 'https://site-inconnu.invalid' } }))
        .status,
      403,
    );
    assert.equal(
      await new Promise<number | undefined>((resolve, reject) => {
        get(url + '/api/health', { headers: { host: 'site-inconnu.invalid' } }, (response) => {
          response.resume();
          resolve(response.statusCode);
        }).on('error', reject);
      }),
      403,
    );
    assert.equal((await fetch(url + '/.env')).status, 404);
    assert.equal((await fetch(url + '/missing.js')).status, 404);
    assert.equal(
      (
        await fetch(url + '/api/echo', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text: 'x'.repeat(40000) }),
        })
      ).status,
      413,
    );
    assert.equal(await (await fetch(url + '/', { method: 'HEAD' })).text(), '');
  } finally {
    await new Promise<void>((r, reject) => server.close((e) => (e ? reject(e) : r())));
    await app.close();
    await rm(root, { recursive: true, force: true });
  }
});
