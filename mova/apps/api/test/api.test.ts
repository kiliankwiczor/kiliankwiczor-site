import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { buildApp } from '../src/server.js';
import { pool, tx } from '../src/db.js';
import { token, digest } from '../src/crypto.js';
import { migrate } from '../src/migrate.js';
import { programs } from '@mova/domain';
test('API et PostgreSQL : parcours et frontières de sécurité', async (t) => {
  const target = new URL(process.env.DATABASE_URL ?? 'postgres://localhost:5433/mova');
  assert.ok(
    ['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname),
    'Les tests sont limités à une base PostgreSQL locale, jamais une base réelle distante.',
  );
  await migrate();
  const app = await buildApp({ testing: true }),
    ids: string[] = [];
  const password = 'UnMotDePasseTest42!',
    email = `test-${randomUUID()}@example.invalid`;
  async function call(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    bearer?: string,
    payload?: unknown,
  ) {
    return app.inject({
      method,
      url,
      headers: bearer ? { authorization: `Bearer ${bearer}` } : {},
      payload: payload as object,
    });
  }
  let a = '',
    b = '',
    aid = '',
    bid = '',
    wid = '',
    pid = '';
  try {
    await t.test('prévol Web autorise les méthodes d’édition et suppression', async () => {
      const r = await app.inject({
        method: 'OPTIONS',
        url: '/me/onboarding',
        headers: {
          origin: 'http://127.0.0.1:8081',
          'access-control-request-method': 'PUT',
          'access-control-request-headers': 'content-type,authorization',
        },
      });
      assert.equal(r.statusCode, 204);
      assert.ok(r.headers['access-control-allow-methods']?.includes('PUT'));
      assert.ok(r.headers['access-control-allow-methods']?.includes('DELETE'));
    });
    await t.test('inscription exige majorité et conditions', async () => {
      assert.equal(
        (
          await call('POST', '/auth/register', undefined, {
            email,
            password,
            nickname: 'Test',
            adult: false,
            terms: true,
          })
        ).statusCode,
        400,
      );
    });
    await t.test('inscription et connexion réelles', async () => {
      const r = await call('POST', '/auth/register', undefined, {
        email,
        password,
        nickname: 'Test A',
        adult: true,
        terms: true,
      });
      assert.equal(r.statusCode, 200);
      a = r.json().token;
      const r2 = await call('POST', '/auth/register', undefined, {
        email: `b-${email}`,
        password,
        nickname: 'Test B',
        adult: true,
        terms: true,
      });
      b = r2.json().token;
      aid = (await call('GET', '/me', a)).json().id;
      bid = (await call('GET', '/me', b)).json().id;
      ids.push(aid, bid);
      assert.equal(
        (await call('POST', '/auth/login', undefined, { email, password })).statusCode,
        200,
      );
      assert.equal(
        (await call('POST', '/auth/login', undefined, { email, password: 'incorrectpassword' }))
          .statusCode,
        401,
      );
    });
    await t.test('routes privées et administration interdites sans rôle', async () => {
      assert.equal((await call('GET', '/workouts')).statusCode, 401);
      assert.equal((await call('GET', '/admin/overview', a)).statusCode, 403);
    });
    await t.test('onboarding persistant et privé', async () => {
      const r = await call('PUT', '/me/onboarding', a, {
        goal: 'routine',
        level: 'beginner',
        location: 'home',
        days: 2,
        minutes: 20,
      });
      assert.equal(r.json().recommendedProgramId, 'express');
      assert.equal((await call('GET', '/me', b)).json().preferences, null);
    });
    await t.test('catalogue et démarrage de séance', async () => {
      assert.equal((await call('GET', '/catalog')).json().programs.length, 10);
      const r = await call('POST', '/workouts', a, { programId: 'first', acknowledgeDraft: true });
      assert.equal(r.statusCode, 200);
      wid = r.json().id;
      assert.equal(
        (await call('POST', '/workouts', a, { programId: 'first', acknowledgeDraft: true }))
          .statusCode,
        409,
      );
    });
    const p = programs.find((p) => p.id === 'first')!,
      sets = p.exerciseIds.flatMap((exerciseId) =>
        [0, 1].map((index) => ({ exerciseId, index, reps: 8, weight: 0 })),
      );
    await t.test('isolation de séances et contrôle des séries', async () => {
      assert.equal((await call('GET', '/workouts', b)).json().length, 0);
      assert.equal((await call('PUT', `/workouts/${wid}/sets`, b, { sets })).statusCode, 404);
      assert.equal(
        (
          await call('PUT', `/workouts/${wid}/sets`, a, {
            sets: [{ exerciseId: 'invented', index: 0, reps: 8, weight: 0 }],
          })
        ).statusCode,
        400,
      );
      assert.equal((await call('POST', `/workouts/${wid}/finish`, a, {})).statusCode, 400);
    });
    await t.test('séries sauvegardées et reprise', async () => {
      assert.equal((await call('PUT', `/workouts/${wid}/sets`, a, { sets })).statusCode, 200);
      assert.equal((await call('GET', '/workouts', a)).json()[0].sets.length, 6);
      assert.equal((await call('POST', `/workouts/${wid}/finish`, a, {})).statusCode, 400);
      await pool.query("UPDATE workouts SET started_at=now()-interval '2 minutes' WHERE id=$1", [
        wid,
      ]);
    });
    await t.test('fin concurrente idempotente et points serveur', async () => {
      const results = await Promise.all([
        call('POST', `/workouts/${wid}/finish`, a, {}),
        call('POST', `/workouts/${wid}/finish`, a, { points: 999999 }),
      ]);
      assert.ok(results.every((r) => r.statusCode === 200 && r.json().points === 50));
      assert.equal((await call('GET', '/me', a)).json().points, 50);
      assert.equal(
        Number(
          (await pool.query('SELECT count(*) FROM points_ledger WHERE user_id=$1', [aid])).rows[0]!
            .count,
        ),
        1,
      );
    });
    await t.test('plafond quotidien sans encourager le surentraînement', async () => {
      const w = (
        await call('POST', '/workouts', a, { programId: 'first', acknowledgeDraft: true })
      ).json();
      await call('PUT', `/workouts/${w.id}/sets`, a, { sets });
      await pool.query("UPDATE workouts SET started_at=now()-interval '2 minutes' WHERE id=$1", [
        w.id,
      ]);
      assert.equal((await call('POST', `/workouts/${w.id}/finish`, a, {})).json().points, 0);
    });
    await t.test(
      'RLS refuse écriture des points, droits payants, rôle et lecture privée',
      async () => {
        const other = await tx(
          (db) => db.query('SELECT * FROM workouts WHERE user_id=$1', [aid]),
          bid,
        );
        assert.equal(other.rowCount, 0);
        for (const sql of [
          "INSERT INTO points_ledger VALUES(gen_random_uuid(),$1,NULL,50,'fraude',now())",
          "INSERT INTO entitlements VALUES(gen_random_uuid(),$1,'premium',NULL,now()+interval '1 year','fake')",
          "UPDATE users SET role='admin' WHERE id=$1",
        ]) {
          await assert.rejects(
            tx((db) => db.query(sql, [aid]), aid),
            /permission denied/,
          );
        }
      },
    );
    await t.test('abonnement expiré refusé, achat permanent conservé', async () => {
      assert.equal(
        (await call('POST', '/workouts', b, { programId: 'strength', acknowledgeDraft: true }))
          .statusCode,
        403,
      );
      await pool.query(
        "INSERT INTO entitlements VALUES($1,$2,'premium',NULL,now()-interval '1 day',$3)",
        [randomUUID(), bid, randomUUID()],
      );
      assert.equal(
        (await call('POST', '/workouts', b, { programId: 'strength', acknowledgeDraft: true }))
          .statusCode,
        403,
      );
      await pool.query("INSERT INTO entitlements VALUES($1,$2,'purchase','strength',NULL,$3)", [
        randomUUID(),
        bid,
        randomUUID(),
      ]);
      assert.equal(
        (await call('POST', '/workouts', b, { programId: 'strength', acknowledgeDraft: true }))
          .statusCode,
        200,
      );
      assert.equal((await call('GET', '/billing', b)).json().enabled, false);
    });
    await t.test('publication, abonnement membre, like idempotent et commentaire', async () => {
      const r = await call('POST', '/posts', a, { body: 'Publication de test explicite' });
      assert.equal(r.statusCode, 200);
      pid = r.json().id;
      await call('PUT', `/members/${aid}/follow`, b, { following: true });
      assert.ok(
        (await call('GET', '/feed?scope=following', b))
          .json()
          .some((p: { id: string }) => p.id === pid),
      );
      await call('PUT', `/posts/${pid}/like`, b, { liked: true });
      await call('PUT', `/posts/${pid}/like`, b, { liked: true });
      assert.equal(
        (await call('GET', '/feed', a)).json().find((p: { id: string }) => p.id === pid).likes,
        1,
      );
      assert.equal(
        (await call('POST', `/posts/${pid}/comments`, b, { body: 'Bravo !' })).statusCode,
        200,
      );
      assert.equal((await call('GET', `/posts/${pid}/comments`, a)).json().length, 1);
    });
    await t.test('pagination stable pour des publications au même horodatage', async () => {
      const timestamp = '2026-01-01T00:00:00.000Z';
      for (let i = 0; i < 23; i++)
        await pool.query('INSERT INTO posts(id,user_id,body,created_at) VALUES($1,$2,$3,$4)', [
          randomUUID(),
          aid,
          `Pagination test ${i}`,
          timestamp,
        ]);
      const first = (await call('GET', '/feed', b)).json();
      const last = first.at(-1);
      const next = (
        await call(
          'GET',
          `/feed?before=${encodeURIComponent(last.created_at)}&beforeId=${last.id}`,
          b,
        )
      ).json();
      assert.equal(first.length, 20);
      assert.equal(next.length, 4);
      assert.equal(new Set([...first, ...next].map((p) => p.id)).size, 24);
    });
    await t.test('signalement et blocage réciproque effectifs', async () => {
      assert.equal(
        (await call('POST', '/reports', b, { postId: pid, reason: 'Signalement de test' }))
          .statusCode,
        200,
      );
      assert.equal((await call('POST', '/blocks', b, { userId: aid })).statusCode, 200);
      assert.equal((await call('GET', `/posts/${pid}`, b)).statusCode, 404);
      assert.equal((await call('GET', `/posts/${pid}/comments`, a)).json().length, 0);
      assert.equal(
        (await call('POST', `/posts/${pid}/comments`, b, { body: 'Tentative bloquée' })).statusCode,
        403,
      );
    });
    await t.test('administration protégée, modération et journal d’audit', async () => {
      await pool.query("UPDATE users SET role='admin' WHERE id=$1", [aid]);
      const overview = (await call('GET', '/admin/overview', a)).json();
      const report = overview.reports.find((r: { post_id: string }) => r.post_id === pid);
      assert.ok(report);
      assert.equal(
        (await call('POST', `/admin/reports/${report.id}/resolve`, a, { hide: true })).statusCode,
        200,
      );
      assert.equal((await call('GET', `/posts/${pid}`, a)).statusCode, 404);
      assert.equal(
        Number(
          (await pool.query('SELECT count(*) FROM audit_log WHERE actor_id=$1', [aid])).rows[0]!
            .count,
        ),
        1,
      );
    });
    await t.test(
      'demande de reset sans fuite de jeton, usage unique et sessions révoquées',
      async () => {
        const r = await call('POST', '/auth/forgot', undefined, { email });
        assert.equal(r.statusCode, 200);
        assert.equal(r.json().token, undefined);
        const raw = token();
        await pool.query("INSERT INTO password_resets VALUES($1,$2,now()+interval '5 minutes')", [
          digest(raw),
          aid,
        ]);
        const changed = 'NouveauMotDePasse42!';
        assert.equal(
          (await call('POST', '/auth/reset', undefined, { token: raw, password: changed }))
            .statusCode,
          200,
        );
        assert.equal(
          (await call('POST', '/auth/reset', undefined, { token: raw, password: changed }))
            .statusCode,
          400,
        );
        assert.equal((await call('GET', '/me', a)).statusCode, 401);
        a = (await call('POST', '/auth/login', undefined, { email, password: changed })).json()
          .token;
      },
    );
    await t.test('export sans hash de mot de passe ou jeton', async () => {
      const r = await call('GET', '/me/export', a);
      assert.equal(r.statusCode, 200);
      assert.ok(!r.body.includes('password_hash'));
      assert.ok(!r.body.includes('token_hash'));
      assert.equal(r.json().consents[0].terms_version, 'pilot-v1');
    });
    await t.test('déconnexion révoque la session', async () => {
      const temp = (
        await call('POST', '/auth/login', undefined, { email: `b-${email}`, password })
      ).json().token;
      assert.equal((await call('POST', '/auth/logout', temp, {})).statusCode, 200);
      assert.equal((await call('GET', '/me', temp)).statusCode, 401);
    });
    await t.test('suppression confirmée et cascade des données privées', async () => {
      assert.equal(
        (await call('DELETE', '/me', b, { password: 'mauvais-password' })).statusCode,
        401,
      );
      assert.equal((await call('DELETE', '/me', b, { password })).statusCode, 200);
      assert.equal((await call('GET', '/me', b)).statusCode, 401);
      assert.equal(
        (await pool.query('SELECT * FROM workouts WHERE user_id=$1', [bid])).rowCount,
        0,
      );
    });
  } finally {
    for (const id of ids) await pool.query('DELETE FROM users WHERE id=$1', [id]);
    await app.close();
    await pool.end();
  }
});
