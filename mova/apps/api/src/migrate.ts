import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, tx } from './db.js';
import { exercises, programs } from '@mova/domain';
export async function migrate() {
  await tx(async (db) => {
    await db.query('SELECT pg_advisory_xact_lock(6412026)');
    await db.query(
      'CREATE TABLE IF NOT EXISTS migrations (name text PRIMARY KEY, applied_at timestamptz DEFAULT now())',
    );
    for (const name of [
      '001_initial',
      '002_consents',
      '003_progress_and_challenges',
      '004_groups',
    ]) {
      if (!(await db.query('SELECT 1 FROM migrations WHERE name=$1', [name])).rowCount) {
        await db.query(
          await readFile(
            join(
              process.env.MOVA_MIGRATIONS_DIR ??
                fileURLToPath(new URL('../../../database', import.meta.url)),
              `${name}.sql`,
            ),
            'utf8',
          ),
        );
        await db.query('INSERT INTO migrations(name) VALUES($1)', [name]);
      }
    }
    for (const [kind, items] of [
      ['exercise', exercises],
      ['program', programs],
    ] as const)
      for (const item of items)
        await db.query(
          'INSERT INTO catalog(id,kind,data) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING',
          [item.id, kind, JSON.stringify(item)],
        );
  });
}
if (process.argv[1]?.endsWith('migrate.ts')) {
  await migrate();
  console.log('Migrations et catalogue appliqués sans écraser les contenus existants.');
  await pool.end();
}
