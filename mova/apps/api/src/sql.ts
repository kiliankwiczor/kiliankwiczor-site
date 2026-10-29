import type { QueryResultRow } from 'pg';
export type SqlResult<R extends QueryResultRow = QueryResultRow> = {
  rows: R[];
  rowCount: number | null;
};
export interface SqlClient {
  query<R extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<SqlResult<R>>;
  release(): void;
}
export interface SqlPool extends Omit<SqlClient, 'release'> {
  connect(): Promise<SqlClient>;
  end(): Promise<void>;
}
