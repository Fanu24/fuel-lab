import { currentUser, type Context } from "../_lib/auth";
import { bodyJson, json, sameOrigin } from "../_lib/http";
import { potaAllenamenti, potaPiano } from "../../lib/settimana";

export const onRequestGet = async ({ env, request }: Context) => {
  const user = await currentUser(env, request);
  if (!user) return json({ error: "Accedi per leggere il piano" }, 401);
  const row = await env.DB.prepare("SELECT plan_json, training_json, updated_at FROM saved_plans WHERE user_id = ?")
    .bind(user.id).first<{ plan_json: string; training_json: string; updated_at: string }>();
  return json({ plan: row ? JSON.parse(row.plan_json) : null, training: row ? JSON.parse(row.training_json) : null, updatedAt: row?.updated_at ?? null });
};

export const onRequestPut = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Origine non valida" }, 403);
  const user = await currentUser(env, request);
  if (!user) return json({ error: "Accedi per salvare il piano" }, 401);
  const body = await bodyJson(request, 25000);
  if (!body) return json({ error: "Dati non validi" }, 400);
  const plan = potaPiano(body.plan);
  const training = potaAllenamenti(body.training);
  await env.DB.prepare("INSERT INTO saved_plans (user_id,plan_json,training_json,updated_at) VALUES (?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET plan_json=excluded.plan_json,training_json=excluded.training_json,updated_at=CURRENT_TIMESTAMP")
    .bind(user.id, JSON.stringify(plan), JSON.stringify(training)).run();
  return json({ plan, training });
};
