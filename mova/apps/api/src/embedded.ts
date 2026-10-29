import { PGlite } from '@electric-sql/pglite';
import type { QueryResultRow } from 'pg';
import type { SqlClient, SqlPool, SqlResult } from './sql.js';
/** Local desktop only. Transactions and standalone queries share one connection queue. */
export function embeddedPool(dataDir: string): SqlPool {
  const database = new PGlite({ dataDir });
  let tail = Promise.resolve();
  async function acquire() {
    const previous = tail;
    let unlock = () => {};
    tail = new Promise<void>((resolve) => {
      unlock = resolve;
    });
    await previous;
    return unlock;
  }
  async function execute<R extends QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<SqlResult<R>> {
    const result =
      values === undefined
        ? (await database.exec(text)).at(-1)
        : await database.query<R>(text, values);
    return {
      rows: (result?.rows ?? []) as R[],
      rowCount: result?.rowCount ?? result?.affectedRows ?? 0,
    };
  }
  return {
    async query<R extends QueryResultRow>(text: string, values?: unknown[]) {
      const release = await acquire();
      try {
        return await execute<R>(text, values);
      } finally {
        release();
      }
    },
    async connect(): Promise<SqlClient> {
      const unlock = await acquire();
      let released = false;
      return {
        query: execute,
        release() {
          if (!released) {
            released = true;
            unlock();
          }
        },
      };
    },
    async end() {
      const release = await acquire();
      try {
        await database.close();
      } finally {
        release();
      }
    },
  };
}
