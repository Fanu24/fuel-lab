import type { ClienteAdmin } from "../../../lib/api";
import { tsSqlite } from "../../../lib/server/date";
import { currentUser, soloAdmin, type Context } from "../../_lib/auth";
import { json } from "../../_lib/http";

/** GET /api/admin/customers — gli account clienti (Matteo e lo staff esclusi) con i loro numeri. */
export const onRequestGet = async ({ env, request }: Context) => {
  const user = await currentUser(env, request);
  const vietato = soloAdmin(user);
  if (vietato) return vietato;

  const { results } = await env.DB.prepare(`
    SELECT u.id, u.name, u.email, u.emailVerified, u.createdAt,
      COALESCE(p.phone,'') AS phone, COALESCE(p.comune,'') AS comune,
      COALESCE(p.address,'') AS address, COALESCE(p.preferences,'') AS preferences,
      COALESCE(o.orders,0) AS orders, COALESCE(o.active_orders,0) AS active_orders,
      COALESCE(o.meals,0) AS meals, o.last_order_at, COALESCE(o.spent_cents,0) AS spent_cents,
      CASE WHEN sp.user_id IS NULL THEN 0 ELSE 1 END AS has_saved_plan
    FROM user u
    LEFT JOIN customer_profiles p ON p.user_id = u.id
    LEFT JOIN (
      SELECT user_id,
        COUNT(*) AS orders,
        SUM(CASE WHEN status NOT IN ('completed','cancelled') THEN 1 ELSE 0 END) AS active_orders,
        SUM(CASE WHEN status <> 'cancelled' THEN meals ELSE 0 END) AS meals,
        MAX(created_at) AS last_order_at,
        SUM(CASE WHEN status <> 'cancelled' AND price_cents IS NOT NULL AND (status <> 'requested' OR paid = 1) THEN price_cents ELSE 0 END) AS spent_cents
      FROM orders GROUP BY user_id
    ) o ON o.user_id = u.id
    LEFT JOIN saved_plans sp ON sp.user_id = u.id
    WHERE u.id NOT IN (SELECT user_id FROM staff_roles)
    ORDER BY o.last_order_at IS NULL, o.last_order_at DESC, u.createdAt DESC
    LIMIT 2000`).all<Record<string, unknown>>();

  const customers: ClienteAdmin[] = results.map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    emailVerified: Boolean(row.emailVerified),
    createdAt: tsSqlite(row.createdAt) ?? String(row.createdAt ?? ""),
    phone: String(row.phone),
    comune: String(row.comune),
    address: String(row.address),
    preferences: String(row.preferences),
    orders: Number(row.orders) || 0,
    activeOrders: Number(row.active_orders) || 0,
    meals: Number(row.meals) || 0,
    lastOrderAt: tsSqlite(row.last_order_at),
    spentCents: Number(row.spent_cents) || 0,
    hasSavedPlan: Number(row.has_saved_plan) === 1,
  }));
  return json({ customers });
};
