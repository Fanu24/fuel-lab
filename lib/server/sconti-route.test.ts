// @ts-expect-error Node 24 fornisce SQLite; i tipi comuni sono ancora Node 20.
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import type { D1Database } from "@cloudflare/workers-types";
import type { Env } from "../../functions/_lib/auth";
import { onRequestPost } from "../../functions/api/discounts";

let db: DatabaseSync;
let env: Env;
function statement(sql: string, bindings: unknown[] = []) {
  return {
    bind: (...values: unknown[]) => statement(sql, values),
    first: async () => db.prepare(sql).get(...bindings as (string | number | null)[]) ?? null,
    run: async () => { const result = db.prepare(sql).run(...bindings as (string | number | null)[]); return { meta: { changes: Number(result.changes) } }; },
  };
}
beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(Date.UTC(2026, 9, 14, 12));
  db = new DatabaseSync(":memory:");
  for (const file of readdirSync("migrations").filter((f) => f.endsWith(".sql")).sort()) db.exec(readFileSync(`migrations/${file}`, "utf8"));
  db.exec("INSERT INTO discount_codes(code,percent,active) VALUES ('MATTEO20',20,1),('SPENTO',30,0);");
  env = { DB: { prepare: (sql: string) => statement(sql) } as unknown as D1Database, BETTER_AUTH_SECRET: "test-only-secret" };
});
afterEach(() => { db.close(); vi.restoreAllMocks(); });
async function check(code: string, origin = "https://fuelchef.it", extra = {}) {
  return onRequestPost({ env, params: {}, request: new Request("https://fuelchef.it/api/discounts", {
    method: "POST", headers: { Origin: origin, "CF-Connecting-IP": "192.0.2.1" }, body: JSON.stringify({ code, ...extra }),
  }) });
}
it("verifica prima del login e legge la percentuale autorevole dal database", async () => {
  const response = await check(" matteo20 ", undefined, { percent: 100 });
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ code: "MATTEO20", percent: 20 });
  expect(response.headers.get("Cache-Control")).toBe("no-store");
});
it("rifiuta codici inesistenti o disattivati", async () => {
  for (const code of ["SPENTO", "SCONOSCIUTO", "ab", ""]) expect((await check(code)).status).toBe(400);
});
it("rifiuta altre origini prima di accedere al database", async () => {
  expect((await check("MATTEO20", "https://other.example")).status).toBe(403);
  expect(db.prepare("SELECT COUNT(*) AS n FROM discount_checks").get().n).toBe(0);
});
it("limita le verifiche e permette di riprovare nella finestra successiva", async () => {
  for (let i = 0; i < 60; i++) expect((await check("MATTEO20")).status).toBe(200);
  const response = await check("MATTEO20");
  expect(response.status).toBe(429);
  expect(response.headers.get("Retry-After")).toBe("900");
  vi.mocked(Date.now).mockReturnValue(Date.UTC(2026, 9, 14, 12, 15));
  expect((await check("MATTEO20")).status).toBe(200);
});
