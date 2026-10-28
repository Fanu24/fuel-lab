// @ts-expect-error Il runtime del progetto è Node 24, i tipi comuni sono ancora Node 20.
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import type { D1Database } from "@cloudflare/workers-types";
import type { Env } from "../../functions/_lib/auth";

type Valore = string | number | null;

interface Statement {
  bind: (...values: unknown[]) => Statement;
  first: () => Promise<Record<string, unknown> | null>;
  run: () => Promise<{ meta: { changes: number } }>;
  all: () => Promise<{ results: Record<string, unknown>[] }>;
}

/** Banco di prova D1 in memoria per i test: applica tutte le migrazioni e crea gli utenti di base. */
export function creaD1Prova(): { sqlite: DatabaseSync; env: Env; chiudi: () => void } {
  const sqlite: DatabaseSync = new DatabaseSync(":memory:");
  for (const migration of readdirSync("migrations").filter((name) => name.endsWith(".sql")).sort()) {
    sqlite.exec(readFileSync(`migrations/${migration}`, "utf8"));
  }
  sqlite.exec("INSERT INTO user VALUES ('matteo','Matteo','info@fuelchef.it',1,NULL,'2026-10-01','2026-10-01'); INSERT INTO staff_roles(user_id,role) VALUES ('matteo','admin');");
  sqlite.exec("INSERT INTO user VALUES ('cliente1','Cliente Uno','cliente1@test.local',1,NULL,'2026-10-01','2026-10-01');");

  function statement(sql: string, bindings: Valore[] = []): Statement {
    return {
      bind: (...values: unknown[]) => statement(sql, values as Valore[]),
      first: async () => (sqlite.prepare(sql).get(...bindings) as Record<string, unknown> | undefined) ?? null,
      run: async () => {
        const result = sqlite.prepare(sql).run(...bindings);
        return { meta: { changes: Number(result.changes) } };
      },
      all: async () => ({ results: sqlite.prepare(sql).all(...bindings) as Record<string, unknown>[] }),
    };
  }

  const env = {
    DB: {
      prepare: (sql: string) => statement(sql),
      batch: async (statements: Statement[]) => {
        sqlite.exec("BEGIN");
        try {
          const results = [];
          for (const item of statements) results.push(await item.run());
          sqlite.exec("COMMIT");
          return results;
        } catch (error) {
          sqlite.exec("ROLLBACK");
          throw error;
        }
      },
    } as unknown as D1Database,
    BETTER_AUTH_SECRET: "test-only-secret",
  };

  return { sqlite, env, chiudi: () => sqlite.close() };
}
