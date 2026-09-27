import { currentUser, type Context } from "../_lib/auth";
import { bodyJson, json, sameOrigin, str } from "../_lib/http";

export const onRequestGet = async ({ env, request }: Context) => {
  const user = await currentUser(env, request);
  if (!user) return json({ error: "Accesso richiesto" }, 401);
  const profile = await env.DB.prepare("SELECT phone,comune,address,preferences,updated_at FROM customer_profiles WHERE user_id = ?")
    .bind(user.id).first();
  return json({ profile: profile ?? { phone: "", comune: "", address: "", preferences: "" } });
};

export const onRequestPut = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Origine non valida" }, 403);
  const user = await currentUser(env, request);
  if (!user) return json({ error: "Accesso richiesto" }, 401);
  const body = await bodyJson(request, 4000);
  if (!body) return json({ error: "Dati non validi" }, 400);
  const phone = str(body.phone, 40);
  const comune = str(body.comune, 100);
  const address = str(body.address, 240);
  const preferences = str(body.preferences, 1000);
  await env.DB.prepare("INSERT INTO customer_profiles (user_id,phone,comune,address,preferences,updated_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET phone=excluded.phone,comune=excluded.comune,address=excluded.address,preferences=excluded.preferences,updated_at=CURRENT_TIMESTAMP")
    .bind(user.id, phone, comune, address, preferences).run();
  return json({ profile: { phone, comune, address, preferences } });
};
