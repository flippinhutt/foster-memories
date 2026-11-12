/// <reference types="node" />
import { DatabaseSync } from 'node:sqlite';
import type { SqlDatabase, SqlValue } from '@/src/db/types';

/** Adapts Node's built-in SQLite to the SqlDatabase interface so tests run real SQL. */
export function openNodeSqlite(path = ':memory:'): SqlDatabase & { close(): void } {
  const db = new DatabaseSync(path);
  return {
    execAsync: async (source) => {
      db.exec(source);
    },
    runAsync: async (source, params: SqlValue[]) => db.prepare(source).run(...params),
    getAllAsync: async <T,>(source: string, params: SqlValue[]) =>
      db.prepare(source).all(...params) as T[],
    getFirstAsync: async <T,>(source: string, params: SqlValue[]) =>
      (db.prepare(source).get(...params) as T | undefined) ?? null,
    close: () => db.close(),
  };
}
