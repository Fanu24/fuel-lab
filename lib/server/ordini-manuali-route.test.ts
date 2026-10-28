// @ts-expect-error Il runtime del progetto è Node 24, i tipi comuni sono ancora Node 20.
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { D1Database } from "@cloudflare/workers-types";
import type { Env } from "../../functions/_lib/auth";
import { onRequestPost } from "../../functions/api/admin/orders";
import { PIATTI } from "../catalogo";

vi.mock("../../functions/_lib/auth", () => ({
  currentUser: async () => ({ id: "matteo", role: "admin" }),
  soloAdmin: () => null,
}));

let sqlite: DatabaseSync;
let env: Env;
function statement(sql: string, bindings: unknown[] = []) {
  return {
    bind: (...values: unknown[]) => statement(sql, values),
    first: async () => sqlite.prepare(sql).get(...bindings as (string | number | null)[]) ?? null,
    run: async () => {
      const result = sqlite.prepare(sql).run(...bindings as (string | number | null)[]);
      return { meta: { changes: Number(result.changes) } };
    },
  };
}

beforeEach(() => {
  sqlite = new DatabaseSync(":memory:");
  for (const migration of readdirSync("migrations").filter((name) => name.endsWith(".sql")).sort()) {
    sqlite.exec(readFileSync(`migrations/${migration}`, "utf8"));
  }
  sqlite.exec("INSERT INTO user VALUES ('matteo','Matteo','info@fuelchef.it',1,NULL,'2026-10-01','2026-10-01'); INSERT INTO staff_roles(user_id,role) VALUES ('matteo','admin');");
  env = { DB: {
    prepare: (sql: string) => statement(sql),
    batch: async (statements: ReturnType<typeof statement>[]) => {
      sqlite.exec("BEGIN");
      try {
        const results = [];
        for (const item of statements) results.push(await item.run());
        sqlite.exec("COMMIT");
        return results;
      } catch (error) { sqlite.exec("ROLLBACK"); throw error; }
    },
  } as unknown as D1Database, BETTER_AUTH_SECRET: "test-only-secret" };
});
afterEach(() => sqlite.close());

it("gli ordini manuali distinguono ritiro, consegna e indirizzo mantenendo il retry idempotente", async () => {
  const common = {
    name: "Cliente prova", phone: "3400000000", comune: "Pescara", address: "", fulfillment: "pickup",
    service: "menu-settimana", status: "requested", priceCents: 10000,
    plan: { lun: { pranzo: { piatto: PIATTI[0].id, extra: [] } } },
  };
  const post = async (changes: Record<string, string>) => {
    const request = new Request("https://fuelchef.it/api/admin/orders", { method: "POST", headers: { Origin: "https://fuelchef.it" }, body: JSON.stringify({ ...common, ...changes }) });
    const response = await onRequestPost({ env, request, params: {} });
    const payload = await response.json() as { order: { id: string; fulfillment: string; address: string; comune: string } };
    return { status: response.status, order: payload.order };
  };
  const requests: Record<string, string>[] = [
    {},
    { fulfillment: "delivery", address: "Via Roma 1" },
    { fulfillment: "delivery", address: "Via Roma 2" },
    { fulfillment: "delivery", address: "Via Roma 2", comune: "Montesilvano" },
  ];
  const ids = new Set<string>();
  for (const changes of requests) {
    const first = await post(changes);
    expect(first.status).toBe(201);
    expect(first.order).toMatchObject({ fulfillment: changes.fulfillment ?? "pickup", address: changes.address ?? "", comune: changes.comune ?? "Pescara" });
    ids.add(first.order.id);
    const repeated = await post(changes);
    expect(repeated.status).toBe(200);
    expect(repeated.order.id).toBe(first.order.id);
  }
  expect(ids.size).toBe(4);
  expect(sqlite.prepare("SELECT COUNT(*) AS n FROM orders").get()?.n).toBe(4);
  expect(sqlite.prepare("SELECT COUNT(*) AS n FROM order_events").get()?.n).toBe(4);
});


