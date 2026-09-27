import type { EventoOrdine } from "../../lib/api";
import { eventoDaRiga, type Cambio, type RigaOrdine } from "../../lib/server/ordini";
import type { Env } from "./auth";

/** Ordine + email dell'account + preferenze del profilo: la forma che ordineDaRiga si aspetta. */
export const ORDER_SELECT = "SELECT o.*, u.email, p.preferences AS dietary_preferences FROM orders o JOIN user u ON u.id=o.user_id LEFT JOIN customer_profiles p ON p.user_id=o.user_id";

export async function leggiOrdine(env: Env, id: string) {
  return env.DB.prepare(`${ORDER_SELECT} WHERE o.id = ?`).bind(id).first<RigaOrdine>();
}

export async function leggiEventi(env: Env, orderId: string): Promise<EventoOrdine[]> {
  const { results } = await env.DB.prepare("SELECT id,actor,type,from_status,to_status,detail,created_at FROM order_events WHERE order_id = ? ORDER BY created_at, id")
    .bind(orderId).all<Record<string, unknown>>();
  return results.map(eventoDaRiga);
}

/** Lo statement che scrive un evento: da mettere nello stesso batch della modifica. */
export function eventoStmt(env: Env, orderId: string, actor: EventoOrdine["actor"], cambio: Cambio) {
  return env.DB.prepare("INSERT INTO order_events (order_id,actor,type,from_status,to_status,detail) VALUES (?,?,?,?,?,?)")
    .bind(orderId, actor, cambio.type, cambio.from_status, cambio.to_status, cambio.detail);
}
