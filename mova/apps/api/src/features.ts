import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { SqlClient } from './sql.js';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { programStep, challengeProgress, type Exercise, type Program } from '@mova/domain';
import { pool, tx } from './db.js';
type Guards = {
  member: (r: FastifyRequest) => string;
  admin: (r: FastifyRequest) => string;
  fail: (code: number, message: string) => Error;
};
const uuid = z.string().uuid();
export async function awardBadges(db: SqlClient, userId: string) {
  await db.query(
    "INSERT INTO badges(user_id,code) VALUES($1,'first-workout') ON CONFLICT DO NOTHING",
    [userId],
  );
  const memberships = (
    await db.query(
      'SELECT c.*,m.joined_at FROM challenge_members m JOIN challenges c ON c.id=m.challenge_id WHERE m.user_id=$1',
      [userId],
    )
  ).rows;
  const completed = (
    await db.query(
      'SELECT completed_at::text FROM workouts WHERE user_id=$1 AND completed_at IS NOT NULL',
      [userId],
    )
  ).rows.map((r) => r.completed_at as string);
  for (const c of memberships)
    if (challengeProgress(c.joined_at.toISOString(), c.weeks, c.weekly_goal, completed).complete)
      await db.query('INSERT INTO badges(user_id,code) VALUES($1,$2) ON CONFLICT DO NOTHING', [
        userId,
        `challenge:${c.id}`,
      ]);
}
export async function registerFeatures(app: FastifyInstance, { member, admin, fail }: Guards) {
  app.get('/groups', async (req) => {
    const id = member(req);
    return (
      await tx(
        (db) =>
          db.query(
            'SELECT g.id,g.name,g.description,gm.joined_at FROM groups g LEFT JOIN group_members gm ON gm.group_id=g.id AND gm.user_id=$1 ORDER BY g.name',
            [id],
          ),
        id,
      )
    ).rows;
  });
  app.post('/groups/:id/join', async (req) => {
    const userId = member(req),
      id = uuid.parse((req.params as { id: string }).id);
    await tx(
      (db) =>
        db.query(
          'INSERT INTO group_members(user_id,group_id) VALUES($1,$2) ON CONFLICT DO NOTHING',
          [userId, id],
        ),
      userId,
    );
    return { ok: true };
  });
  app.delete('/groups/:id/join', async (req) => {
    const userId = member(req),
      id = uuid.parse((req.params as { id: string }).id);
    await tx(
      (db) => db.query('DELETE FROM group_members WHERE user_id=$1 AND group_id=$2', [userId, id]),
      userId,
    );
    return { ok: true };
  });
  app.get('/groups/:id/posts', async (req) => {
    const userId = member(req),
      id = uuid.parse((req.params as { id: string }).id),
      q = z
        .object({
          before: z.string().datetime({ offset: true }).optional(),
          beforeId: uuid.optional(),
        })
        .refine((q) => !!q.before === !!q.beforeId)
        .parse(req.query);
    return tx(async (db) => {
      if (
        !(
          await db.query('SELECT 1 FROM group_members WHERE user_id=$1 AND group_id=$2', [
            userId,
            id,
          ])
        ).rowCount
      )
        throw fail(403, 'Rejoins ce groupe pour accéder aux conversations.');
      return (
        await db.query(
          'SELECT p.id,p.body,p.user_id,p.created_at,pr.nickname FROM posts p JOIN profiles pr ON pr.user_id=p.user_id WHERE p.group_id=$1 AND ($2::timestamptz IS NULL OR (p.created_at,p.id)<($2::timestamptz,$3::uuid)) ORDER BY p.created_at DESC,p.id DESC LIMIT 20',
          [id, q.before ?? null, q.beforeId ?? null],
        )
      ).rows;
    }, userId);
  });
  app.post('/groups/:id/posts', async (req) => {
    const userId = member(req),
      id = uuid.parse((req.params as { id: string }).id),
      { body } = z.object({ body: z.string().trim().min(1).max(1500) }).parse(req.body);
    return tx(
      async (db) =>
        (
          await db.query(
            'INSERT INTO posts(id,user_id,body,group_id) VALUES($1,$2,$3,$4) RETURNING id',
            [randomUUID(), userId, body, id],
          )
        ).rows[0],
      userId,
    );
  });
  app.post('/admin/groups', async (req) => {
    const actor = admin(req),
      body = z
        .object({ name: z.string().trim().min(3).max(80), description: z.string().max(1000) })
        .parse(req.body),
      id = randomUUID();
    await tx(async (db) => {
      await db.query('INSERT INTO groups VALUES($1,$2,$3)', [id, body.name, body.description]);
      await db.query('INSERT INTO audit_log VALUES($1,$2,$3,$4,now())', [
        randomUUID(),
        actor,
        'group.create',
        id,
      ]);
    });
    return { id };
  });
  app.get('/programs/:id/progress', async (req) => {
    const userId = member(req),
      id = z
        .string()
        .max(50)
        .parse((req.params as { id: string }).id);
    return tx(async (db) => {
      const p = (await db.query("SELECT data FROM catalog WHERE id=$1 AND kind='program'", [id]))
        .rows[0]?.data as Program | undefined;
      if (!p) throw fail(404, 'Programme introuvable.');
      const count = Number(
        (
          await db.query(
            'SELECT count(*) FROM workouts WHERE user_id=$1 AND program_id=$2 AND completed_at IS NOT NULL',
            [userId, id],
          )
        ).rows[0]!.count,
      );
      return programStep(p, count);
    }, userId);
  });
  app.get('/workouts/:id', async (req) => {
    const userId = member(req),
      id = uuid.parse((req.params as { id: string }).id);
    return tx(async (db) => {
      const w = (await db.query('SELECT * FROM workouts WHERE id=$1 AND user_id=$2', [id, userId]))
        .rows[0];
      if (!w) throw fail(404, 'Séance introuvable.');
      return w;
    }, userId);
  });
  app.post('/workouts/:id/replace', async (req) => {
    const userId = member(req),
      id = uuid.parse((req.params as { id: string }).id),
      c = z
        .object({
          exerciseId: z.string(),
          alternativeId: z.string(),
          baseRevision: z.number().int().min(0),
        })
        .parse(req.body);
    return tx(async (db) => {
      const w = (
        await db.query('SELECT * FROM workouts WHERE id=$1 AND completed_at IS NULL FOR UPDATE', [
          id,
        ])
      ).rows[0];
      if (!w) throw fail(404, 'Séance active introuvable.');
      if (w.revision !== c.baseRevision)
        throw fail(
          409,
          'Cette séance a changé sur un autre appareil. Recharge la version serveur.',
        );
      const ex = (
        await db.query("SELECT data FROM catalog WHERE id=$1 AND kind='exercise'", [c.exerciseId])
      ).rows[0]?.data as Exercise | undefined;
      const alternative = (
        await db.query("SELECT data FROM catalog WHERE id=$1 AND kind='exercise'", [
          c.alternativeId,
        ])
      ).rows[0]?.data as Exercise | undefined;
      const p = w.snapshot as Program;
      if (
        !ex ||
        !alternative ||
        ex.alternativeId !== alternative.id ||
        !p.exerciseIds.includes(ex.id) ||
        p.exerciseIds.includes(alternative.id)
      )
        throw fail(400, 'Cette alternative n’est pas disponible pour ce mouvement.');
      const snapshot = {
        ...p,
        exerciseIds: p.exerciseIds.map((e) => (e === ex.id ? alternative.id : e)),
      };
      const sets = (w.sets as { exerciseId: string }[]).filter((s) => s.exerciseId !== ex.id);
      return (
        await db.query(
          'UPDATE workouts SET snapshot=$1,sets=$2,revision=revision+1 WHERE id=$3 RETURNING *',
          [JSON.stringify(snapshot), JSON.stringify(sets), id],
        )
      ).rows[0];
    }, userId);
  });
  app.get('/me/stats', async (req) => {
    const id = member(req);
    return tx(async (db) => {
      const summary = (
        await db.query(
          'SELECT count(*)::int AS sessions,coalesce(sum(jsonb_array_length(sets)),0)::int AS sets FROM workouts WHERE user_id=$1 AND completed_at IS NOT NULL',
          [id],
        )
      ).rows[0];
      const calendar = (
        await db.query(
          "SELECT (completed_at AT TIME ZONE 'Europe/Paris')::date::text AS day,count(*)::int AS sessions FROM workouts WHERE user_id=$1 AND completed_at IS NOT NULL GROUP BY day ORDER BY day DESC LIMIT 90",
          [id],
        )
      ).rows;
      const previous = (
        await db.query(
          'SELECT w.id,w.completed_at,s.value AS performance FROM workouts w CROSS JOIN LATERAL jsonb_array_elements(w.sets) s WHERE w.user_id=$1 AND w.completed_at IS NOT NULL ORDER BY w.completed_at DESC LIMIT 200',
          [id],
        )
      ).rows;
      return { ...summary, activeDays: calendar.length, calendar, previous };
    }, id);
  });
  app.get('/challenges', async (req) => {
    const id = member(req);
    return tx(async (db) => {
      const challenges = (
        await db.query(
          'SELECT c.*,m.joined_at FROM challenges c LEFT JOIN challenge_members m ON m.challenge_id=c.id AND m.user_id=$1 ORDER BY c.title',
          [id],
        )
      ).rows;
      const timestamps = (
        await db.query(
          'SELECT completed_at::text FROM workouts WHERE user_id=$1 AND completed_at IS NOT NULL',
          [id],
        )
      ).rows.map((r) => r.completed_at as string);
      return challenges.map((c) => ({
        ...c,
        progress: c.joined_at
          ? challengeProgress(c.joined_at.toISOString(), c.weeks, c.weekly_goal, timestamps)
          : null,
      }));
    }, id);
  });
  app.post('/challenges/:id/join', async (req) => {
    const userId = member(req),
      id = uuid.parse((req.params as { id: string }).id);
    await tx(
      (db) =>
        db.query(
          'INSERT INTO challenge_members(user_id,challenge_id) VALUES($1,$2) ON CONFLICT DO NOTHING',
          [userId, id],
        ),
      userId,
    );
    return { ok: true };
  });
  app.delete('/challenges/:id/join', async (req) => {
    const userId = member(req),
      id = uuid.parse((req.params as { id: string }).id);
    await tx(
      (db) =>
        db.query('DELETE FROM challenge_members WHERE user_id=$1 AND challenge_id=$2', [
          userId,
          id,
        ]),
      userId,
    );
    return { ok: true };
  });
  app.get('/me/badges', async (req) => {
    const id = member(req);
    return (
      await tx(
        (db) =>
          db.query(
            "SELECT b.code,b.awarded_at,CASE WHEN b.code='first-workout' THEN 'Mon premier pas' ELSE coalesce(c.title,'Défi terminé') END AS title FROM badges b LEFT JOIN challenges c ON b.code='challenge:'||c.id::text WHERE b.user_id=$1 ORDER BY b.awarded_at DESC",
            [id],
          ),
        id,
      )
    ).rows;
  });
  app.get('/blocks', async (req) => {
    const id = member(req);
    return (
      await pool.query(
        'SELECT b.blocked_id,p.nickname FROM blocks b JOIN profiles p ON p.user_id=b.blocked_id WHERE b.blocker_id=$1',
        [id],
      )
    ).rows;
  });
  app.delete('/blocks/:id', async (req) => {
    const userId = member(req),
      id = uuid.parse((req.params as { id: string }).id);
    await tx(
      (db) => db.query('DELETE FROM blocks WHERE blocker_id=$1 AND blocked_id=$2', [userId, id]),
      userId,
    );
    return { ok: true };
  });
  app.get('/members', async (req) => {
    const userId = member(req),
      { search } = z.object({ search: z.string().trim().min(2).max(40) }).parse(req.query);
    return (
      await tx(
        (db) =>
          db.query(
            "SELECT user_id,nickname,bio FROM profiles WHERE user_id<>$1 AND nickname ILIKE '%'||$2||'%' ORDER BY nickname LIMIT 20",
            [userId, search],
          ),
        userId,
      )
    ).rows;
  });
  app.get('/members/:id', async (req) => {
    const userId = member(req),
      id = uuid.parse((req.params as { id: string }).id);
    return tx(async (db) => {
      const p = (await db.query('SELECT user_id,nickname,bio FROM profiles WHERE user_id=$1', [id]))
        .rows[0];
      if (!p) throw fail(404, 'Profil inaccessible.');
      const posts = (
        await db.query(
          'SELECT id,body,created_at FROM posts WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20',
          [id],
        )
      ).rows;
      return { ...p, posts };
    }, userId);
  });
  app.put('/posts/:id/save', async (req) => {
    const userId = member(req),
      id = uuid.parse((req.params as { id: string }).id),
      { saved } = z.object({ saved: z.boolean() }).parse(req.body);
    await tx(
      (db) =>
        saved
          ? db.query('INSERT INTO saved_posts VALUES($1,$2) ON CONFLICT DO NOTHING', [userId, id])
          : db.query('DELETE FROM saved_posts WHERE user_id=$1 AND post_id=$2', [userId, id]),
      userId,
    );
    return { ok: true };
  });
  app.get('/me/saved-posts', async (req) => {
    const id = member(req);
    return (
      await tx(
        (db) =>
          db.query(
            'SELECT p.id,p.body,pr.nickname FROM saved_posts s JOIN posts p ON p.id=s.post_id JOIN profiles pr ON pr.user_id=p.user_id WHERE s.user_id=$1 ORDER BY p.created_at DESC LIMIT 100',
            [id],
          ),
        id,
      )
    ).rows;
  });
  app.patch('/admin/challenges/:id', async (req) => {
    const actor = admin(req),
      id = uuid.parse((req.params as { id: string }).id),
      patch = z.object({ active: z.boolean() }).strict().parse(req.body);
    await tx(async (db) => {
      const result = await db.query('UPDATE challenges SET active=$1 WHERE id=$2', [
        patch.active,
        id,
      ]);
      if (!result.rowCount) throw fail(404, 'Défi introuvable.');
      await db.query('INSERT INTO audit_log VALUES($1,$2,$3,$4,now())', [
        randomUUID(),
        actor,
        'challenge.visibility',
        id,
      ]);
    });
    return { ok: true };
  });
  app.post('/admin/challenges', async (req) => {
    const actor = admin(req),
      c = z
        .object({
          title: z.string().trim().min(3).max(100),
          description: z.string().max(1000),
          weeks: z.number().int().min(1).max(8),
          weeklyGoal: z.number().int().min(1).max(3),
        })
        .parse(req.body),
      id = randomUUID();
    await tx(async (db) => {
      await db.query('INSERT INTO challenges VALUES($1,$2,$3,$4,$5,true)', [
        id,
        c.title,
        c.description,
        c.weeks,
        c.weeklyGoal,
      ]);
      await db.query('INSERT INTO audit_log VALUES($1,$2,$3,$4,now())', [
        randomUUID(),
        actor,
        'challenge.create',
        id,
      ]);
    });
    return { id };
  });
}
