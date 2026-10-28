import type { Context } from "../_lib/auth";
import { bodyJson, json, sameOrigin } from "../_lib/http";
import { leggiSconto } from "../../lib/server/sconti";

/** Verifica un codice senza esporre l'elenco. L'invio ordine lo controlla nuovamente. */
export const onRequestPost = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Ricarica la pagina e riprova." }, 403);
  const now = Math.floor(Date.now() / 1000);
  const start = Math.floor(now / 900) * 900;
  const ip = request.headers.get("CF-Connecting-IP") || "local";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${env.BETTER_AUTH_SECRET}:discount:${ip}`));
  const hash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  const counter = await env.DB.prepare(`INSERT INTO discount_checks(address_hash,window_start,attempts) VALUES (?,?,1)
    ON CONFLICT(address_hash,window_start) DO UPDATE SET attempts=attempts+1 RETURNING attempts`).bind(hash, start).first<{ attempts: number }>();
  if (!counter || counter.attempts > 60) {
    const response = json({ error: "Troppe verifiche. Riprova fra qualche minuto." }, 429);
    response.headers.set("Retry-After", String(start + 900 - now));
    return response;
  }
  await env.DB.prepare("DELETE FROM discount_checks WHERE window_start < ?").bind(now - 86400).run();
  const body = await bodyJson(request, 1000);
  const codice = await leggiSconto(env.DB, body?.code);
  if (!codice.ok) return json({ error: codice.error }, 400);
  if (!codice.code) return json({ error: "Scrivi il codice sconto." }, 400);
  return json({ code: codice.code, percent: codice.percent });
};
