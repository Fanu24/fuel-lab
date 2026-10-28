import { currentUser, soloAdmin, type Context } from "../../_lib/auth";
import { bodyJson, json, sameOrigin } from "../../_lib/http";
import { generaCodice, normalizzaCodice, percentualeValida } from "../../../lib/sconti";

export const onRequestGet = async ({ env, request }: Context) => {
  const vietato = soloAdmin(await currentUser(env, request));
  if (vietato) return vietato;
  const rows = await env.DB.prepare(`SELECT d.*, (SELECT COUNT(*) FROM orders o WHERE o.discount_code=d.code AND o.status<>'cancelled') AS uses FROM discount_codes d ORDER BY created_at DESC,code`).all();
  return json({ discounts: rows.results });
};

export const onRequestPost = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Ricarica la pagina e riprova." }, 403);
  const vietato = soloAdmin(await currentUser(env, request));
  if (vietato) return vietato;
  const body = await bodyJson(request, 2000);
  if (!body || !percentualeValida(body.percent)) return json({ error: "Scegli una percentuale intera da 1 a 100." }, 400);
  const code = body.code === undefined || body.code === "" ? generaCodice() : normalizzaCodice(body.code);
  if (!code) return json({ error: "Codice: da 3 a 32 lettere, numeri, - o _." }, 400);
  const result = await env.DB.prepare("INSERT INTO discount_codes (code,percent) VALUES (?,?) ON CONFLICT(code) DO NOTHING").bind(code, body.percent).run();
  if (!result.meta.changes) return json({ error: "Questo codice esiste già. Scegli un altro nome." }, 409);
  return json({ discount: await env.DB.prepare("SELECT *,0 AS uses FROM discount_codes WHERE code=?").bind(code).first() }, 201);
};

export const onRequestPatch = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Ricarica la pagina e riprova." }, 403);
  const vietato = soloAdmin(await currentUser(env, request));
  if (vietato) return vietato;
  const body = await bodyJson(request, 2000);
  const code = normalizzaCodice(body?.code);
  if (!body || !code || typeof body.active !== "boolean") return json({ error: "Codice o stato non valido." }, 400);
  const result = await env.DB.prepare("UPDATE discount_codes SET active=? WHERE code=?").bind(body.active ? 1 : 0, code).run();
  return result.meta.changes ? json({ ok: true }) : json({ error: "Codice non trovato." }, 404);
};
