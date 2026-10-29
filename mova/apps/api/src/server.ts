import Fastify, { type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { z, ZodError } from 'zod';
import {
  onboardingSchema,
  recommend,
  sessionSchema,
  validateCompletedSets,
  canAccess,
  type Program,
  programStep,
} from '@mova/domain';
import { pool, tx } from './db.js';
import { registerFeatures, awardBadges } from './features.js';
import { digest, token, hashPassword, verifyPassword } from './crypto.js';
declare module 'fastify' {
  interface FastifyRequest {
    actor: { id: string; role: string } | null;
  }
}
const uuid = z.string().uuid();
const credentials = z.object({
  email: z
    .string()
    .email()
    .max(254)
    .transform((s) => s.toLowerCase().trim()),
  password: z.string().min(12).max(128),
});
const fail = (statusCode: number, message: string) =>
  Object.assign(new Error(message), { statusCode });
function member(r: FastifyRequest) {
  if (!r.actor) throw fail(401, 'Connecte-toi pour continuer.');
  return r.actor.id;
}
function admin(r: FastifyRequest) {
  member(r);
  if (r.actor?.role !== 'admin') throw fail(403, 'Accès réservé à l’administration.');
  return r.actor.id;
}
async function newSession(userId: string) {
  const raw = token();
  await pool.query("INSERT INTO auth_sessions VALUES($1,$2,now()+interval '7 days')", [
    digest(raw),
    userId,
  ]);
  return raw;
}
async function getProgram(id: string) {
  const row = (await pool.query("SELECT data FROM catalog WHERE id=$1 AND kind='program'", [id]))
    .rows[0];
  if (!row) throw fail(404, 'Programme introuvable.');
  return row.data as Program;
}
async function allowed(userId: string, p: Program) {
  const grants = await tx(
    (db) =>
      db.query<{ kind: string; program_id: string | null; expires_at: string | null }>(
        'SELECT kind,program_id,expires_at::text FROM entitlements WHERE user_id=$1',
        [userId],
      ),
    userId,
  );
  if (!canAccess('', grants.rows, p))
    throw fail(
      403,
      'Ce programme nécessite un droit d’accès. Les achats ne sont pas encore activés.',
    );
}
export async function buildApp(options: { testing?: boolean } = {}) {
  if (process.env.NODE_ENV === 'production')
    throw new Error(
      'Pilote uniquement : revue sécurité, email transactionnel et configuration de production requis. Voir LAUNCH_CHECKLIST.md.',
    );
  const app = Fastify({
    logger: options.testing ? false : { redact: ['req.headers.authorization'] },
    bodyLimit: 32 * 1024,
  });
  await app.register(cors, {
    origin: (process.env.WEB_ORIGINS ?? 'http://localhost:8081,http://127.0.0.1:8081').split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  await app.register(helmet);
  await app.register(rateLimit, { max: options.testing ? 1000 : 120, timeWindow: '1 minute' });
  app.decorateRequest('actor', null);
  app.addHook('onRequest', async (req) => {
    const bearer = req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
    if (bearer) {
      const row = (
        await pool.query<{ id: string; role: string }>(
          'SELECT u.id,u.role FROM auth_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()',
          [digest(bearer)],
        )
      ).rows[0];
      req.actor = row ?? null;
    }
  });
  app.setErrorHandler((error, _req, reply) => {
    const e = error as Error & { code?: string; statusCode?: number };
    if (error instanceof ZodError)
      return reply
        .code(400)
        .send({ message: 'Vérifie les champs renseignés.', fields: error.flatten().fieldErrors });
    if (e.code === '23505')
      return reply
        .code(409)
        .send({ message: 'Cette action existe déjà ou une séance est déjà en cours.' });
    if (e.code === '23503' || e.code === '42501')
      return reply.code(403).send({ message: 'Action non autorisée ou contenu inaccessible.' });
    const status = e.statusCode ?? 500;
    if (status >= 500) app.log.error({ name: e.name, code: e.code }, 'Erreur serveur');
    return reply
      .code(status)
      .send({ message: status >= 500 ? 'Service indisponible. Réessaie plus tard.' : e.message });
  });
  app.get('/health', async () => {
    await pool.query('SELECT 1');
    return { ok: true, mode: 'pilot', app: 'MOVA' };
  });
  app.post(
    '/auth/register',
    { config: { rateLimit: { max: options.testing ? 100 : 5, timeWindow: '1 minute' } } },
    async (req) => {
      const c = credentials
        .extend({
          nickname: z.string().trim().min(2).max(40),
          adult: z.literal(true),
          terms: z.literal(true),
        })
        .parse(req.body);
      const id = randomUUID(),
        hash = await hashPassword(c.password);
      await tx(async (db) => {
        await db.query('INSERT INTO users(id,email,password_hash) VALUES($1,$2,$3)', [
          id,
          c.email,
          hash,
        ]);
        await db.query('INSERT INTO profiles(user_id,nickname) VALUES($1,$2)', [id, c.nickname]);
        await db.query("INSERT INTO consents(user_id,terms_version) VALUES($1,'pilot-v1')", [id]);
      });
      return { token: await newSession(id) };
    },
  );
  app.post(
    '/auth/login',
    { config: { rateLimit: { max: options.testing ? 100 : 10, timeWindow: '1 minute' } } },
    async (req) => {
      const c = credentials.parse(req.body);
      const u = (await pool.query('SELECT * FROM users WHERE email=$1', [c.email])).rows[0];
      // Equal-cost password work for unknown accounts.
      const valid = await verifyPassword(
        c.password,
        u?.password_hash ?? `${'0'.repeat(32)}:${'0'.repeat(128)}`,
      );
      if (!u || !valid) throw fail(401, 'Email ou mot de passe incorrect.');
      return { token: await newSession(u.id) };
    },
  );
  app.post('/auth/logout', async (req) => {
    member(req);
    await pool.query('DELETE FROM auth_sessions WHERE token_hash=$1', [
      digest(req.headers.authorization!.slice(7)),
    ]);
    return { ok: true };
  });
  app.post(
    '/auth/forgot',
    { config: { rateLimit: { max: options.testing ? 100 : 3, timeWindow: '1 minute' } } },
    async (req) => {
      const { email } = z
        .object({
          email: z
            .string()
            .email()
            .transform((s) => s.toLowerCase().trim()),
        })
        .parse(req.body);
      const u = (await pool.query('SELECT id FROM users WHERE email=$1', [email])).rows[0];
      if (u) {
        const raw = token();
        await tx(async (db) => {
          await db.query('DELETE FROM password_resets WHERE user_id=$1', [u.id]);
          await db.query("INSERT INTO password_resets VALUES($1,$2,now()+interval '30 minutes')", [
            digest(raw),
            u.id,
          ]);
        });
        // Explicit development sink, never sent or exposed through an API. Production is disabled above.
        if (!options.testing) {
          await mkdir('.local/mail', { recursive: true, mode: 0o700 });
          await writeFile(
            `.local/mail/${randomUUID()}.json`,
            JSON.stringify({ to: email, resetToken: raw, expiresMinutes: 30 }),
            { mode: 0o600 },
          );
        }
      }
      return {
        message:
          'Si le compte existe, une demande a été créée. Dans ce pilote, aucun email n’est envoyé : le lien est écrit dans le dossier local de développement de l’API.',
      };
    },
  );
  app.post('/auth/reset', async (req) => {
    const c = z
        .object({ token: z.string().length(43), password: z.string().min(12).max(128) })
        .parse(req.body),
      hash = await hashPassword(c.password);
    await tx(async (db) => {
      const r = (
        await db.query(
          'DELETE FROM password_resets WHERE token_hash=$1 AND expires_at>now() RETURNING user_id',
          [digest(c.token)],
        )
      ).rows[0];
      if (!r) throw fail(400, 'Lien expiré ou déjà utilisé.');
      await db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, r.user_id]);
      await db.query('DELETE FROM auth_sessions WHERE user_id=$1', [r.user_id]);
    });
    return { ok: true };
  });
  app.get('/me', async (req) => {
    const id = member(req);
    return tx(async (db) => {
      const profile = (await db.query('SELECT * FROM profiles WHERE user_id=$1', [id])).rows[0];
      const prefs =
        (await db.query('SELECT data FROM preferences WHERE user_id=$1', [id])).rows[0]?.data ??
        null;
      const ledger = (
        await db.query(
          'SELECT amount,reason,created_at FROM points_ledger WHERE user_id=$1 ORDER BY created_at DESC',
          [id],
        )
      ).rows;
      return {
        id,
        role: req.actor!.role,
        profile,
        preferences: prefs,
        points: ledger.reduce((n, r) => n + r.amount, 0),
        ledger,
      };
    }, id);
  });
  app.put('/me/onboarding', async (req) => {
    const id = member(req),
      data = onboardingSchema.parse(req.body);
    await tx(
      (db) =>
        db.query(
          'INSERT INTO preferences VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data',
          [id, JSON.stringify(data)],
        ),
      id,
    );
    return { recommendedProgramId: recommend(data) };
  });
  app.patch('/me/profile', async (req) => {
    const id = member(req),
      p = z
        .object({ nickname: z.string().trim().min(2).max(40), bio: z.string().trim().max(300) })
        .parse(req.body);
    await tx(
      (db) =>
        db.query('UPDATE profiles SET nickname=$1,bio=$2 WHERE user_id=$3', [
          p.nickname,
          p.bio,
          id,
        ]),
      id,
    );
    return { ok: true };
  });
  app.get('/me/export', async (req) => {
    const id = member(req);
    return tx(async (db) => {
      const result: Record<string, unknown> = {};
      for (const [table, column] of [
        ['users', 'id'],
        ['consents', 'user_id'],
        ['challenge_members', 'user_id'],
        ['group_members', 'user_id'],
        ['badges', 'user_id'],
        ['saved_posts', 'user_id'],
        ['profiles', 'user_id'],
        ['preferences', 'user_id'],
        ['workouts', 'user_id'],
        ['points_ledger', 'user_id'],
        ['entitlements', 'user_id'],
        ['posts', 'user_id'],
        ['comments', 'user_id'],
        ['likes', 'user_id'],
        ['follows', 'follower_id'],
        ['blocks', 'blocker_id'],
        ['reports', 'reporter_id'],
      ] as const) {
        result[table] =
          table === 'users'
            ? (await db.query('SELECT id,email,created_at FROM users WHERE id=$1', [id])).rows
            : (await db.query(`SELECT * FROM ${table} WHERE ${column}=$1`, [id])).rows;
      }
      return result;
    });
  });
  app.delete('/me', async (req) => {
    const id = member(req);
    const { password } = z.object({ password: z.string().min(12).max(128) }).parse(req.body);
    const u = (await pool.query('SELECT password_hash FROM users WHERE id=$1', [id])).rows[0];
    if (!u || !(await verifyPassword(password, u.password_hash)))
      throw fail(401, 'Mot de passe incorrect.');
    await pool.query('DELETE FROM users WHERE id=$1', [id]);
    return { ok: true };
  });
  app.get('/catalog', async () => {
    const rows = (await pool.query('SELECT kind,data FROM catalog ORDER BY id')).rows;
    return {
      exercises: rows.filter((r) => r.kind === 'exercise').map((r) => r.data),
      programs: rows.filter((r) => r.kind === 'program').map((r) => r.data),
    };
  });
  app.get('/workouts', async (req) => {
    const id = member(req);
    return (
      await tx(
        (db) =>
          db.query('SELECT * FROM workouts WHERE user_id=$1 ORDER BY started_at DESC LIMIT 100', [
            id,
          ]),
        id,
      )
    ).rows;
  });
  app.post('/workouts', async (req) => {
    const id = member(req),
      { programId } = z
        .object({ programId: z.string(), acknowledgeDraft: z.literal(true) })
        .parse(req.body);
    const p = await getProgram(programId);
    await allowed(id, p);
    const wid = randomUUID();
    return tx(async (db) => {
      await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [id]);
      const count = Number(
        (
          await db.query(
            'SELECT count(*) FROM workouts WHERE user_id=$1 AND program_id=$2 AND completed_at IS NOT NULL',
            [id, p.id],
          )
        ).rows[0]!.count,
      );
      const step = programStep(p, count);
      const snapshot = {
        ...p,
        reps: step.reps,
        week: step.week,
        ordinal: step.ordinal,
        totalSessions: step.total,
        maintenance: step.maintenance,
      };
      return (
        await db.query(
          'INSERT INTO workouts(id,user_id,program_id,snapshot) VALUES($1,$2,$3,$4) RETURNING *',
          [wid, id, p.id, JSON.stringify(snapshot)],
        )
      ).rows[0];
    }, id);
  });
  app.put('/workouts/:id/sets', async (req) => {
    const id = member(req),
      wid = uuid.parse((req.params as { id: string }).id),
      { sets, baseRevision } = sessionSchema
        .pick({ sets: true })
        .extend({ baseRevision: z.number().int().min(0).default(0) })
        .parse(req.body);
    return tx(async (db) => {
      const w = (
        await db.query('SELECT * FROM workouts WHERE id=$1 AND completed_at IS NULL FOR UPDATE', [
          wid,
        ])
      ).rows[0];
      if (!w) throw fail(404, 'Séance active introuvable.');
      if (w.revision !== baseRevision)
        throw fail(
          409,
          'Cette séance a changé sur un autre appareil. Recharge la version serveur.',
        );
      const p = w.snapshot as Program;
      if (
        sets.some((s) => !p.exerciseIds.includes(s.exerciseId) || s.index >= p.sets) ||
        new Set(sets.map((s) => `${s.exerciseId}:${s.index}`)).size !== sets.length
      )
        throw fail(400, 'Séries invalides.');
      return (
        await db.query('UPDATE workouts SET sets=$1,revision=revision+1 WHERE id=$2 RETURNING *', [
          JSON.stringify(sets),
          wid,
        ])
      ).rows[0];
    }, id);
  });
  app.post('/workouts/:id/finish', async (req) => {
    const id = member(req),
      wid = uuid.parse((req.params as { id: string }).id);
    return tx(async (db) => {
      await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [id]);
      await db.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [id]); // Serializes the reward cap across all workouts.
      const w = (
        await db.query('SELECT * FROM workouts WHERE id=$1 AND user_id=$2 FOR UPDATE', [wid, id])
      ).rows[0];
      if (!w) throw fail(404, 'Séance introuvable.');
      const reward = (await db.query('SELECT amount FROM points_ledger WHERE workout_id=$1', [wid]))
        .rows[0];
      if (w.completed_at) return { workout: w, points: reward?.amount ?? 0 };
      if (!validateCompletedSets(w.snapshot, w.sets))
        throw fail(400, 'Enregistre toutes les séries avant de terminer.');
      if (Date.now() - new Date(w.started_at).getTime() < 30000)
        throw fail(400, 'Une séance doit durer au moins 30 secondes pour être terminée.');
      const n = Number(
        (
          await db.query(
            "SELECT count(*) FROM points_ledger WHERE user_id=$1 AND amount>0 AND created_at >= date_trunc('week',now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris'",
            [id],
          )
        ).rows[0]!.count,
      );
      const today = Number(
        (
          await db.query(
            "SELECT count(*) FROM points_ledger WHERE user_id=$1 AND amount>0 AND (created_at AT TIME ZONE 'Europe/Paris')::date=(now() AT TIME ZONE 'Europe/Paris')::date",
            [id],
          )
        ).rows[0]!.count,
      );
      const amount = n < 3 && today === 0 ? 50 : 0;
      const finished = (
        await db.query('UPDATE workouts SET completed_at=now() WHERE id=$1 RETURNING *', [wid])
      ).rows[0];
      await db.query('INSERT INTO points_ledger VALUES($1,$2,$3,$4,$5,now())', [
        randomUUID(),
        id,
        wid,
        amount,
        amount ? 'Séance terminée' : 'Séance terminée · plafond de points atteint',
      ]);
      await awardBadges(db, id);
      return { workout: finished, points: amount };
    });
  });
  app.get('/feed', async (req) => {
    const id = member(req),
      q = z
        .object({
          before: z.string().datetime({ offset: true }).optional(),
          beforeId: uuid.optional(),
          scope: z.enum(['community', 'following']).default('community'),
        })
        .refine((q) => !!q.before === !!q.beforeId)
        .parse(req.query);
    return tx(async (db) => {
      return (
        await db.query(
          `SELECT p.id,p.user_id,p.body,p.created_at,pr.nickname,
   (SELECT count(*)::int FROM likes l WHERE l.post_id=p.id) likes,
   EXISTS(SELECT 1 FROM likes l WHERE l.post_id=p.id AND l.user_id=$1) liked,
   EXISTS(SELECT 1 FROM follows f WHERE f.followed_id=p.user_id AND f.follower_id=$1) following
   FROM posts p JOIN profiles pr ON pr.user_id=p.user_id WHERE p.group_id IS NULL AND ($2::timestamptz IS NULL OR (p.created_at,p.id)<($2::timestamptz,$4::uuid))
   AND ($3='community' OR p.user_id=$1 OR EXISTS(SELECT 1 FROM follows f WHERE f.followed_id=p.user_id AND f.follower_id=$1))
   ORDER BY p.created_at DESC,p.id DESC LIMIT 20`,
          [id, q.before ?? null, q.scope, q.beforeId ?? null],
        )
      ).rows;
    }, id);
  });
  app.get('/posts/:id', async (req) => {
    const id = member(req),
      pid = uuid.parse((req.params as { id: string }).id);
    return tx(async (db) => {
      const p = (
        await db.query(
          'SELECT p.id,p.user_id,p.body,p.created_at,p.group_id,pr.nickname FROM posts p JOIN profiles pr ON pr.user_id=p.user_id WHERE p.id=$1',
          [pid],
        )
      ).rows[0];
      if (!p) throw fail(404, 'Publication inaccessible.');
      return p;
    }, id);
  });
  app.post('/posts', async (req) => {
    const id = member(req),
      { body } = z.object({ body: z.string().trim().min(1).max(1500) }).parse(req.body);
    return tx(
      async (db) =>
        (
          await db.query('INSERT INTO posts(id,user_id,body) VALUES($1,$2,$3) RETURNING *', [
            randomUUID(),
            id,
            body,
          ])
        ).rows[0],
      id,
    );
  });
  app.get('/posts/:id/comments', async (req) => {
    const id = member(req),
      pid = uuid.parse((req.params as { id: string }).id);
    return (
      await tx(
        (db) =>
          db.query(
            'SELECT c.id,c.body,c.created_at,p.nickname FROM comments c JOIN profiles p ON p.user_id=c.user_id WHERE c.post_id=$1 ORDER BY c.created_at LIMIT 100',
            [pid],
          ),
        id,
      )
    ).rows;
  });
  app.post('/posts/:id/comments', async (req) => {
    const id = member(req),
      pid = uuid.parse((req.params as { id: string }).id),
      { body } = z.object({ body: z.string().trim().min(1).max(500) }).parse(req.body);
    await tx(
      (db) =>
        db.query('INSERT INTO comments VALUES($1,$2,$3,$4,now())', [randomUUID(), pid, id, body]),
      id,
    );
    return { ok: true };
  });
  app.put('/posts/:id/like', async (req) => {
    const id = member(req),
      pid = uuid.parse((req.params as { id: string }).id),
      { liked } = z.object({ liked: z.boolean() }).parse(req.body);
    await tx(
      (db) =>
        liked
          ? db.query('INSERT INTO likes VALUES($1,$2) ON CONFLICT DO NOTHING', [pid, id])
          : db.query('DELETE FROM likes WHERE post_id=$1 AND user_id=$2', [pid, id]),
      id,
    );
    return { ok: true };
  });
  app.delete('/posts/:id', async (req) => {
    const id = member(req),
      pid = uuid.parse((req.params as { id: string }).id);
    await tx((db) => db.query('DELETE FROM posts WHERE id=$1 AND user_id=$2', [pid, id]), id);
    return { ok: true };
  });
  app.put('/members/:id/follow', async (req) => {
    const id = member(req),
      other = uuid.parse((req.params as { id: string }).id),
      { following } = z.object({ following: z.boolean() }).parse(req.body);
    if (id === other) throw fail(400, 'Action impossible sur ton propre profil.');
    await tx(
      (db) =>
        following
          ? db.query('INSERT INTO follows VALUES($1,$2) ON CONFLICT DO NOTHING', [id, other])
          : db.query('DELETE FROM follows WHERE follower_id=$1 AND followed_id=$2', [id, other]),
      id,
    );
    return { ok: true };
  });
  app.post('/blocks', async (req) => {
    const id = member(req),
      { userId } = z.object({ userId: uuid }).parse(req.body);
    if (id === userId) throw fail(400, 'Action impossible sur ton propre profil.');
    await tx(async (db) => {
      await db.query('INSERT INTO blocks VALUES($1,$2) ON CONFLICT DO NOTHING', [id, userId]);
      await db.query('DELETE FROM follows WHERE follower_id=$1 AND followed_id=$2', [id, userId]);
    }, id);
    return { ok: true };
  });
  app.post('/reports', async (req) => {
    const id = member(req),
      r = z.object({ postId: uuid, reason: z.string().trim().min(5).max(500) }).parse(req.body);
    await tx(
      (db) =>
        db.query('INSERT INTO reports(id,reporter_id,post_id,reason) VALUES($1,$2,$3,$4)', [
          randomUUID(),
          id,
          r.postId,
          r.reason,
        ]),
      id,
    );
    return { ok: true };
  });
  app.get('/billing', async (req) => {
    const id = member(req);
    return {
      enabled: false,
      message: 'Achats et restauration indisponibles dans le pilote.',
      entitlements: (
        await tx(
          (db) =>
            db.query('SELECT kind,program_id,expires_at FROM entitlements WHERE user_id=$1', [id]),
          id,
        )
      ).rows,
    };
  });
  app.get('/admin/overview', async (req) => {
    admin(req);
    const counts: Record<string, number> = {};
    for (const table of ['users', 'workouts', 'posts', 'reports'])
      counts[table] = Number((await pool.query(`SELECT count(*) FROM ${table}`)).rows[0]!.count);
    return {
      counts,
      reports: (
        await pool.query(
          "SELECT r.id,r.post_id,r.reason,r.state,r.created_at,p.body FROM reports r LEFT JOIN posts p ON p.id=r.post_id WHERE r.state='open' ORDER BY r.created_at LIMIT 100",
        )
      ).rows,
    };
  });
  app.post('/admin/reports/:id/resolve', async (req) => {
    const actor = admin(req),
      id = uuid.parse((req.params as { id: string }).id),
      { hide } = z.object({ hide: z.boolean() }).parse(req.body);
    await tx(async (db) => {
      const r = (
        await db.query("UPDATE reports SET state='resolved' WHERE id=$1 RETURNING post_id", [id])
      ).rows[0];
      if (!r) throw fail(404, 'Signalement introuvable.');
      if (hide) await db.query('UPDATE posts SET hidden=true WHERE id=$1', [r.post_id]);
      await db.query('INSERT INTO audit_log VALUES($1,$2,$3,$4,now())', [
        randomUUID(),
        actor,
        hide ? 'report.hide' : 'report.resolve',
        id,
      ]);
    });
    return { ok: true };
  });
  app.patch('/admin/catalog/:id', async (req) => {
    const actor = admin(req),
      id = z
        .string()
        .max(50)
        .parse((req.params as { id: string }).id);
    const patch = z
      .object({
        name: z.string().trim().min(3).max(100).optional(),
        sets: z.number().int().min(1).max(4).optional(),
        reps: z.number().int().min(3).max(20).optional(),
        rest: z.number().int().min(30).max(180).optional(),
        instructions: z.array(z.string().min(5).max(500)).min(1).max(8).optional(),
        safety: z.string().min(10).max(500).optional(),
      })
      .strict()
      .parse(req.body);
    await tx(async (db) => {
      const row = (await db.query('SELECT * FROM catalog WHERE id=$1 FOR UPDATE', [id])).rows[0];
      if (!row) throw fail(404, 'Contenu introuvable.');
      if (row.kind === 'exercise' && (patch.sets || patch.reps || patch.rest))
        throw fail(400, 'Champs de programme interdits sur un exercice.');
      if (row.kind === 'program' && (patch.instructions || patch.safety))
        throw fail(400, 'Champs d’exercice interdits sur un programme.');
      await db.query('UPDATE catalog SET data=$1,updated_at=now() WHERE id=$2', [
        JSON.stringify({ ...row.data, ...patch, status: 'pending_review' }),
        id,
      ]);
      await db.query('INSERT INTO audit_log VALUES($1,$2,$3,$4,now())', [
        randomUUID(),
        actor,
        'catalog.edit',
        id,
      ]);
    });
    return { ok: true };
  });
  await registerFeatures(app, { member, admin, fail });
  return app;
}
