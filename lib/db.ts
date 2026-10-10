import { readFileSync } from "node:fs";
import { join } from "node:path";

type Rows<T> = Promise<T[]>;
interface Driver { query(sql: string, params?: unknown[]): Promise<{ rows: any[] }>; exec(sql: string): Promise<void> }

const g = globalThis as unknown as { __db?: Promise<Driver> };

async function connect(): Promise<Driver> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    return {
      query: async (s, p = []) => ({ rows: (await sql.query(s, p as any[])) as any[] }),
      exec: async (s) => { for (const stmt of s.split(/;\s*\n/).map((x) => x.trim()).filter(Boolean)) await sql.query(stmt); },
    };
  }
  if (process.env.VERCEL) throw new Error("DATABASE_URL is required on Vercel");
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite(process.env.PGLITE_DIR ?? ".pglite");
  return { query: (s, p) => db.query(s, p as any[]) as any, exec: async (s) => { await db.exec(s); } };
}

async function init(): Promise<Driver> {
  const d = await connect();
  await d.exec(readFileSync(join(process.cwd(), "db/schema.sql"), "utf8"));
  return d;
}

export function db(): Promise<Driver> {
  return (g.__db ??= init());
}

export async function q<T = any>(sql: string, params: unknown[] = []): Rows<T> {
  return (await (await db()).query(sql, params)).rows as T[];
}
export async function q1<T = any>(sql: string, params: unknown[] = []): Promise<T | null> {
  return (await q<T>(sql, params))[0] ?? null;
}
