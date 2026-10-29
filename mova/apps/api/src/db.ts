import pg from 'pg';
import type { SqlClient, SqlPool } from './sql.js';
const engine = process.env.MOVA_DATABASE_ENGINE ?? 'postgres';
if (!['postgres', 'embedded'].includes(engine)) throw new Error('Moteur de base inconnu.');
if (engine === 'embedded' && process.env.NODE_ENV === 'production')
  throw new Error('La base embarquée est réservée au pilote local.');
export const pool: SqlPool =
  engine === 'embedded'
    ? (await import('./embedded.js')).embeddedPool(
        process.env.MOVA_LOCAL_DATA_DIR ?? '.local/database',
      )
    : new pg.Pool({
        connectionString:
          process.env.DATABASE_URL ?? 'postgres://mova:mova_local_only@127.0.0.1:5433/mova',
        max: 10,
      });
export async function tx<T>(fn: (db: SqlClient) => Promise<T>, userId?: string): Promise<T> {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    if (userId) {
      await db.query('SET LOCAL ROLE mova_app');
      await db.query("SELECT set_config('mova.user_id',$1,true)", [userId]);
    }
    const result = await fn(db);
    await db.query('COMMIT');
    return result;
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  } finally {
    db.release();
  }
}
