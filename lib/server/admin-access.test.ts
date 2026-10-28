// @ts-expect-error Il runtime del progetto è Node 24, i tipi comuni sono ancora Node 20.
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { D1Database } from "@cloudflare/workers-types";
import type { Env } from "../../functions/_lib/auth";
import { adminCookie, ADMIN_ATTEMPT_LIMIT, currentAdminSession, digest, hashAdminPassword, readAdminToken, reserveAdminAttempt, supportsAdminSession, verifyAdminPassword } from "../../functions/_lib/admin-access";
import { onRequestDelete, onRequestGet, onRequestPost } from "../../functions/api/admin/session";

let sqlite: DatabaseSync;
let env: Env;
let credentialHash: string;
const TOKEN = "a".repeat(64);
const request = (method = "GET", path = "/api/admin/session", body?: unknown, cookie?: string) => new Request(`https://fuelchef.it${path}`, {
  method, headers: { Origin: "https://fuelchef.it", "CF-Connecting-IP": "192.0.2.10", ...(cookie ? { Cookie: cookie } : {}) },
  ...(body ? { body: JSON.stringify(body) } : {}),
});

/** SQLite vera esegue le query di D1, comprese JOIN e contatore UPSERT atomico. */
function statement(sql: string, bindings: unknown[] = []) {
  return {
    bind: (...values: unknown[]) => statement(sql, values),
    first: async () => sqlite.prepare(sql).get(...bindings as (string | number | null)[]) ?? null,
    run: async () => sqlite.prepare(sql).run(...bindings as (string | number | null)[]),
  };
}

beforeEach(async () => {
  sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync("migrations/0000_auth.sql", "utf8"));
  sqlite.exec("CREATE TABLE staff_roles(user_id TEXT PRIMARY KEY, role TEXT);");
  sqlite.exec(readFileSync("migrations/0007_admin_access.sql", "utf8"));
  sqlite.exec(`INSERT INTO user VALUES ('matteo','Matteo','info@fuelchef.it',1,NULL,'2026-10-01','2026-10-01'); INSERT INTO staff_roles VALUES ('matteo','admin');`);
  credentialHash = await hashAdminPassword("password-di-test", "0123456789abcdef0123456789abcdef");
  sqlite.prepare("INSERT INTO admin_access_credentials(id,user_id,password_hash) VALUES ('matteo','matteo',?)").run(credentialHash);
  env = { DB: {
    prepare: (sql: string) => statement(sql),
    batch: async (statements: ReturnType<typeof statement>[]) => {
      sqlite.exec("BEGIN");
      try { const results = await Promise.all(statements.map((s) => s.run())); sqlite.exec("COMMIT"); return results; }
      catch (error) { sqlite.exec("ROLLBACK"); throw error; }
    },
  } as unknown as D1Database, BETTER_AUTH_SECRET: "test-only-secret" };
});
afterEach(() => sqlite.close());

describe("accesso dedicato al pannello", () => {
  it("verifica la password e rifiuta hash malformati o password errate", async () => {
    expect(await verifyAdminPassword("password-di-test", credentialHash)).toBe(true);
    expect(await verifyAdminPassword("errata", credentialHash)).toBe(false);
    expect(await verifyAdminPassword("password-di-test", "pbkdf2-sha256:1:bad:bad")).toBe(false);
  });

  it("cookie Secure HttpOnly, token non leggibile dalle API cliente", () => {
    expect(adminCookie(request(), TOKEN)).toContain("HttpOnly; SameSite=Strict; Max-Age=43200; Secure");
    expect(readAdminToken(request("GET", undefined, undefined, `__Host-fuelchef-admin=${TOKEN}`))).toBe(TOKEN);
    expect(readAdminToken(request("GET", undefined, undefined, "__Host-fuelchef-admin=token-inventato"))).toBeNull();
    expect(supportsAdminSession(request("GET", "/api/orders"))).toBe(true);
    expect(supportsAdminSession(request("PATCH", "/api/orders/123"))).toBe(true);
    for (const path of ["/api/me", "/api/profile", "/api/account/export", "/api/plan", "/api/contact"]) expect(supportsAdminSession(request("GET", path))).toBe(false);
    expect(supportsAdminSession(request("POST", "/api/orders"))).toBe(false);
  });

  it("limita anche tentativi concorrenti, il nuovo intervallo riparte", async () => {
    const attempts = await Promise.all(Array.from({ length: 12 }, () => reserveAdminAttempt(env, request(), 1000)));
    expect(attempts.filter((a) => a.allowed)).toHaveLength(ADMIN_ATTEMPT_LIMIT);
    expect((await reserveAdminAttempt(env, request(), 1800)).allowed).toBe(true);
  });

  it("non accetta login e logout da altri siti", async () => {
    const foreign = new Request("https://fuelchef.it/api/admin/session", { method: "POST", headers: { Origin: "https://altro.it" }, body: JSON.stringify({ password: "password-di-test" }) });
    expect((await onRequestPost({ env, request: foreign, params: {} })).status).toBe(403);
    expect((await onRequestDelete({ env, request: foreign, params: {} })).status).toBe(403);
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM admin_access_sessions").get()?.n).toBe(0);
  });

  it("login salva solo hash token e logout lo revoca davvero", async () => {
    const result = await onRequestPost({ env, request: request("POST", undefined, { password: "password-di-test" }), params: {} });
    expect(result.status).toBe(200);
    const cookie = result.headers.get("Set-Cookie")!;
    const token = cookie.split(";")[0].split("=")[1];
    expect(sqlite.prepare("SELECT token_hash FROM admin_access_sessions").get()?.token_hash).toBe(await digest(token));
    expect((await onRequestGet({ env, request: request("GET", undefined, undefined, cookie), params: {} })).status).toBe(200);
    expect(await currentAdminSession(env, request("GET", undefined, undefined, cookie))).toMatchObject({ id: "matteo", role: "admin" });
    await onRequestDelete({ env, request: request("DELETE", undefined, undefined, cookie), params: {} });
    expect(await currentAdminSession(env, request("GET", undefined, undefined, cookie))).toBeNull();
  });

  it("sessioni scadute e cambio password revocano l'accesso, staff rimosso revoca", async () => {
    const cookie = `__Host-fuelchef-admin=${TOKEN}`;
    sqlite.prepare("INSERT INTO admin_access_sessions VALUES (?, 'matteo', ?, ?, CURRENT_TIMESTAMP)").run(await digest(TOKEN), credentialHash, Math.floor(Date.now() / 1000) - 1);
    expect(await currentAdminSession(env, request("GET", undefined, undefined, cookie))).toBeNull();
    sqlite.prepare("UPDATE admin_access_sessions SET expires_at=?").run(Math.floor(Date.now() / 1000) + 100);
    expect(await currentAdminSession(env, request("GET", undefined, undefined, cookie))).not.toBeNull();
    sqlite.prepare("UPDATE admin_access_credentials SET password_hash='changed'").run();
    expect(await currentAdminSession(env, request("GET", undefined, undefined, cookie))).toBeNull();
    sqlite.prepare("UPDATE admin_access_credentials SET password_hash=?").run(credentialHash);
    sqlite.exec("DELETE FROM staff_roles");
    expect(await currentAdminSession(env, request("GET", undefined, undefined, cookie))).toBeNull();
  });
});
