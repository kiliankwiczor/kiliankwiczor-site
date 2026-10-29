import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { programs, type Program } from '@mova/domain';
import { buildApp } from '../src/server.js';
import { pool, tx } from '../src/db.js';
import { migrate } from '../src/migrate.js';
test('programmes, versions, défis, confidentialité et administration', async (t) => {
  assert.ok(
    ['localhost', '127.0.0.1', '[::1]'].includes(
      new URL(process.env.DATABASE_URL ?? 'postgres://localhost/mova').hostname,
    ),
  );
  await migrate();
  const app = await buildApp({ testing: true }),
    users: string[] = [],
    programId = `test-${randomUUID()}`,
    p: Program = {
      ...programs.find((p) => p.id === 'start')!,
      id: programId,
      name: 'Plan de test',
    };
  const password = 'MotDePasseIntegration42!';
  let a = '',
    b = '',
    aid = '',
    bid = '',
    wid = '',
    revision = 0,
    challengeId = '',
    groupId = '',
    postId = '';
  const call = (
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    bearer: string,
    payload?: object,
  ) => app.inject({ method, url, headers: { authorization: `Bearer ${bearer}` }, payload });
  try {
    for (const name of ['A', 'B']) {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: `feature-${randomUUID()}@example.invalid`,
          password,
          nickname: `Membre test ${name}`,
          adult: true,
          terms: true,
        },
      });
      assert.equal(response.statusCode, 200);
      const token = response.json().token;
      const id = (await call('GET', '/me', token)).json().id;
      users.push(id);
      if (name === 'A') {
        a = token;
        aid = id;
      } else {
        b = token;
        bid = id;
      }
    }
    await pool.query("INSERT INTO catalog(id,kind,data) VALUES($1,'program',$2)", [
      programId,
      JSON.stringify(p),
    ]);
    const initialSets = p.exerciseIds.flatMap((exerciseId) =>
      [0, 1].map((index) => ({ exerciseId, index, reps: 8, weight: 0 })),
    );
    await t.test('progression issue des séances terminées, pas du temps écoulé', async () => {
      for (let i = 0; i < 2; i++)
        await pool.query(
          "INSERT INTO workouts(id,user_id,program_id,snapshot,sets,started_at,completed_at) VALUES($1,$2,$3,$4,$5,now()-interval '2 days',now()-interval '2 days')",
          [randomUUID(), aid, programId, JSON.stringify(p), JSON.stringify(initialSets)],
        );
      const step = (await call('GET', `/programs/${programId}/progress`, a)).json();
      assert.equal(step.week, 2);
      assert.equal(step.reps, 9);
      const response = await call('POST', '/workouts', a, { programId, acknowledgeDraft: true });
      assert.equal(response.statusCode, 200);
      wid = response.json().id;
      assert.equal(response.json().snapshot.week, 2);
      assert.equal(response.json().snapshot.reps, 9);
    });
    await t.test('sauvegarde ancienne refusée et séance privée', async () => {
      const response = await call('PUT', `/workouts/${wid}/sets`, a, {
        sets: [initialSets[0]],
        baseRevision: 0,
      });
      assert.equal(response.statusCode, 200);
      revision = response.json().revision;
      assert.equal(
        (await call('PUT', `/workouts/${wid}/sets`, a, { sets: [], baseRevision: 0 })).statusCode,
        409,
      );
      assert.equal((await call('GET', `/workouts/${wid}`, b)).statusCode, 404);
      assert.equal((await call('GET', `/workouts/${wid}`, a)).json().sets.length, 1);
    });
    await t.test(
      'remplacement contrôlé retire les anciennes séries, préserve les autres et protège contre les conflits',
      async () => {
        assert.equal(
          (
            await call('POST', `/workouts/${wid}/replace`, a, {
              exerciseId: 'chair',
              alternativeId: 'rdl',
              baseRevision: revision,
            })
          ).statusCode,
          400,
        );
        const response = await call('POST', `/workouts/${wid}/replace`, a, {
          exerciseId: 'chair',
          alternativeId: 'squat',
          baseRevision: revision,
        });
        assert.equal(response.statusCode, 200);
        revision = response.json().revision;
        assert.deepEqual(response.json().snapshot.exerciseIds, ['squat', 'bridge', 'wall-push']);
        assert.equal(response.json().sets.length, 0);
        assert.equal(
          (
            await call('POST', `/workouts/${wid}/replace`, a, {
              exerciseId: 'squat',
              alternativeId: 'chair',
              baseRevision: 0,
            })
          ).statusCode,
          409,
        );
      },
    );
    await t.test(
      'fin avec nouvelles séries, badge serveur unique et statistiques privées',
      async () => {
        const w = (await call('GET', `/workouts/${wid}`, a)).json(),
          sets = w.snapshot.exerciseIds.flatMap((exerciseId: string) =>
            [0, 1].map((index) => ({ exerciseId, index, reps: 9, weight: 0 })),
          );
        assert.equal(
          (await call('PUT', `/workouts/${wid}/sets`, a, { sets, baseRevision: revision }))
            .statusCode,
          200,
        );
        await pool.query("UPDATE workouts SET started_at=now()-interval '2 minutes' WHERE id=$1", [
          wid,
        ]);
        assert.equal((await call('POST', `/workouts/${wid}/finish`, a, {})).statusCode, 200);
        await call('POST', `/workouts/${wid}/finish`, a, {});
        const badges = (await call('GET', '/me/badges', a)).json();
        assert.equal(badges.filter((r: { code: string }) => r.code === 'first-workout').length, 1);
        assert.equal((await call('GET', '/me/stats', a)).json().sessions, 3);
        assert.equal((await call('GET', '/me/stats', b)).json().sessions, 0);
        await assert.rejects(
          tx((db) => db.query("INSERT INTO badges(user_id,code) VALUES($1,'fake')", [aid]), aid),
          /permission denied/,
        );
      },
    );
    await t.test(
      'défi créé par admin seulement, adhésion idempotente et sans progrès rétroactif',
      async () => {
        const body = {
          title: 'Défi test',
          description: 'Une période de test',
          weeks: 1,
          weeklyGoal: 1,
        };
        assert.equal((await call('POST', '/admin/challenges', b, body)).statusCode, 403);
        await pool.query("UPDATE users SET role='admin' WHERE id=$1", [aid]);
        const response = await call('POST', '/admin/challenges', a, body);
        assert.equal(response.statusCode, 200);
        challengeId = response.json().id;
        await call('POST', `/challenges/${challengeId}/join`, a, {});
        const first = (await call('GET', '/challenges', a))
          .json()
          .find((c: { id: string }) => c.id === challengeId);
        await call('POST', `/challenges/${challengeId}/join`, a, {});
        const repeated = (await call('GET', '/challenges', a))
          .json()
          .find((c: { id: string }) => c.id === challengeId);
        assert.equal(first.joined_at, repeated.joined_at);
        assert.deepEqual(first.progress.periods, [0]);
        assert.equal(
          (await call('GET', '/challenges', b))
            .json()
            .find((c: { id: string }) => c.id === challengeId).joined_at,
          null,
        );
      },
    );
    await t.test(
      'séance suivante incrémente le défi et attribue son badge côté serveur',
      async () => {
        const response = await call('POST', '/workouts', a, { programId, acknowledgeDraft: true }),
          w = response.json();
        assert.equal(response.statusCode, 200);
        const sets = w.snapshot.exerciseIds.flatMap((exerciseId: string) =>
          [0, 1].map((index) => ({ exerciseId, index, reps: 9, weight: 0 })),
        );
        await call('PUT', `/workouts/${w.id}/sets`, a, { sets, baseRevision: 0 });
        await pool.query("UPDATE workouts SET started_at=now()-interval '2 minutes' WHERE id=$1", [
          w.id,
        ]);
        assert.equal((await call('POST', `/workouts/${w.id}/finish`, a, {})).statusCode, 200);
        assert.equal(
          (await call('GET', '/challenges', a))
            .json()
            .find((c: { id: string }) => c.id === challengeId).progress.complete,
          true,
        );
        assert.ok(
          (await call('GET', '/me/badges', a))
            .json()
            .some((b: { code: string }) => b.code === `challenge:${challengeId}`),
        );
        await call('DELETE', `/challenges/${challengeId}/join`, a);
        assert.equal(
          (await call('GET', '/challenges', a))
            .json()
            .find((c: { id: string }) => c.id === challengeId).joined_at,
          null,
        );
      },
    );
    await t.test(
      'édition du catalogue ne modifie pas les snapshots historiques et fermeture admin auditée',
      async () => {
        assert.equal(
          (await call('PATCH', `/admin/catalog/${programId}`, a, { name: 'Nom révisé pour test' }))
            .statusCode,
          200,
        );
        assert.equal(
          (await call('GET', `/workouts/${wid}`, a)).json().snapshot.name,
          'Plan de test',
        );
        assert.equal(
          (await call('PATCH', `/admin/challenges/${challengeId}`, b, { active: false }))
            .statusCode,
          403,
        );
        assert.equal(
          (await call('PATCH', `/admin/challenges/${challengeId}`, a, { active: false }))
            .statusCode,
          200,
        );
        assert.equal(
          (await call('GET', '/challenges', a))
            .json()
            .some((c: { id: string }) => c.id === challengeId),
          false,
        );
        assert.ok(
          Number(
            (await pool.query('SELECT count(*) FROM audit_log WHERE actor_id=$1', [aid])).rows[0]!
              .count,
          ) >= 3,
        );
      },
    );
    await t.test(
      'recherche, profil public, sauvegarde et blocage sans fuite de données privées',
      async () => {
        postId = (
          await call('POST', '/posts', b, { body: 'Publication de test sauvegardée' })
        ).json().id;
        assert.equal(
          (await call('PUT', `/posts/${postId}/save`, a, { saved: true })).statusCode,
          200,
        );
        assert.equal((await call('GET', '/me/saved-posts', a)).json().length, 1);
        const profile = (await call('GET', `/members/${bid}`, a)).json();
        assert.equal(profile.nickname, 'Membre test B');
        assert.equal(profile.email, undefined);
        assert.equal(profile.preferences, undefined);
        await call('POST', '/blocks', a, { userId: bid });
        assert.equal((await call('GET', `/members/${bid}`, a)).statusCode, 404);
        assert.equal((await call('GET', '/me/saved-posts', a)).json().length, 0);
        const results = (await call('GET', '/members?search=Membre', a)).json();
        assert.equal(
          results.some((p: { user_id: string }) => p.user_id === bid),
          false,
        );
        assert.equal((await call('GET', '/blocks', a)).json()[0].blocked_id, bid);
        await call('DELETE', `/blocks/${bid}`, a);
        assert.equal((await call('GET', `/members/${bid}`, a)).statusCode, 200);
        await call('PUT', `/posts/${postId}/save`, a, { saved: false });
        assert.equal((await call('GET', '/me/saved-posts', a)).json().length, 0);
      },
    );
    await t.test(
      'groupes : adhésion réelle, fil isolé, commentaires et retrait des accès après départ',
      async () => {
        assert.equal(
          (
            await call('POST', '/admin/groups', b, {
              name: 'Groupe de test',
              description: 'Test de permissions',
            })
          ).statusCode,
          403,
        );
        const created = await call('POST', '/admin/groups', a, {
          name: 'Groupe de test',
          description: 'Test de permissions',
        });
        assert.equal(created.statusCode, 200);
        groupId = created.json().id;
        assert.equal((await call('GET', `/groups/${groupId}/posts`, a)).statusCode, 403);
        await call('POST', `/groups/${groupId}/join`, a, {});
        const publication = await call('POST', `/groups/${groupId}/posts`, a, {
          body: 'Conversation limitée aux membres',
        });
        assert.equal(publication.statusCode, 200);
        const post = publication.json().id;
        assert.equal((await call('GET', `/posts/${post}`, b)).statusCode, 404);
        assert.equal(
          (await call('POST', `/posts/${post}/comments`, b, { body: 'Tentative non membre' }))
            .statusCode,
          403,
        );
        assert.equal(
          (await call('GET', '/feed', a)).json().some((p: { id: string }) => p.id === post),
          false,
        );
        await call('POST', `/groups/${groupId}/join`, b, {});
        assert.equal((await call('GET', `/groups/${groupId}/posts`, b)).json()[0].id, post);
        assert.equal(
          (await call('POST', `/posts/${post}/comments`, b, { body: 'Commentaire membre' }))
            .statusCode,
          200,
        );
        await call('DELETE', `/groups/${groupId}/join`, b);
        assert.equal((await call('GET', `/posts/${post}`, b)).statusCode, 404);
        assert.equal((await call('GET', `/posts/${post}/comments`, b)).json().length, 0);
      },
    );
  } finally {
    for (const id of users) await pool.query('DELETE FROM users WHERE id=$1', [id]);
    if (groupId) await pool.query('DELETE FROM groups WHERE id=$1', [groupId]);
    if (challengeId) await pool.query('DELETE FROM challenges WHERE id=$1', [challengeId]);
    await pool.query('DELETE FROM catalog WHERE id=$1', [programId]);
    await app.close();
    await pool.end();
  }
});
