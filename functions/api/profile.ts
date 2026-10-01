import { testoLibero, unaRiga } from "../../lib/server/contatti";
import { currentUser, type Context } from "../_lib/auth";
import { bodyJson, json, sameOrigin } from "../_lib/http";

const VUOTO = { phone: "", comune: "", address: "", preferences: "" };

export const onRequestGet = async ({ env, request }: Context) => {
  const user = await currentUser(env, request);
  if (!user) return json({ error: "Accesso richiesto" }, 401);
  const profile = await env.DB.prepare("SELECT phone,comune,address,preferences,updated_at FROM customer_profiles WHERE user_id = ?")
    .bind(user.id).first();
  return json({ profile: profile ?? VUOTO });
};

/**
 * PUT /api/profile — i quattro campi del profilo. Un campo assente resta com'e'
 * (una pagina rimasta aperta da prima di un aggiornamento non cancella i campi
 * che non conosce); un campo che non e' testo e' un errore, non un "svuota".
 * Telefono, comune e indirizzo stanno su una riga, le preferenze possono andare a capo.
 */
export const onRequestPut = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Origine non valida" }, 403);
  const user = await currentUser(env, request);
  if (!user) return json({ error: "Accesso richiesto" }, 401);
  const body = await bodyJson(request, 4000);
  if (!body) return json({ error: "Dati non validi" }, 400);
  for (const chiave of Object.keys(VUOTO)) {
    if (body[chiave] !== undefined && typeof body[chiave] !== "string") return json({ error: "Dati non validi" }, 400);
  }
  const riga = (valore: unknown, max: number) => (typeof valore === "string" ? unaRiga(valore).slice(0, max).trim() : null);
  const phone = riga(body.phone, 40);
  const comune = riga(body.comune, 100);
  const address = riga(body.address, 240);
  const preferences = typeof body.preferences === "string" ? testoLibero(body.preferences).slice(0, 1000).trim() : null;
  // I valori assenti sono null: la prima volta diventano vuoti, dopo il campo resta quello salvato (COALESCE).
  const profile = await env.DB.prepare(`INSERT INTO customer_profiles (user_id,phone,comune,address,preferences,updated_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET phone=COALESCE(?,phone),comune=COALESCE(?,comune),address=COALESCE(?,address),preferences=COALESCE(?,preferences),updated_at=CURRENT_TIMESTAMP
      RETURNING phone,comune,address,preferences`)
    .bind(user.id, phone ?? "", comune ?? "", address ?? "", preferences ?? "", phone, comune, address, preferences)
    .first<typeof VUOTO>();
  return json({ profile: profile ?? { phone: phone ?? "", comune: comune ?? "", address: address ?? "", preferences: preferences ?? "" } });
};
