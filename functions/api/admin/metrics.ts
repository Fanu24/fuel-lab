import { currentUser, type Context } from "../../_lib/auth";
import { json } from "../../_lib/http";

export const onRequestGet = async ({ env, request }: Context) => {
  const user = await currentUser(env, request);
  if (user?.role !== "admin") return json({ error: "Riservato a Matteo" }, 403);
  const [customers, orders, traffic] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS count FROM user").first<{ count: number }>(),
    env.DB.prepare("SELECT status,COUNT(*) AS count FROM orders GROUP BY status").all<{ status: string; count: number }>(),
    env.DB.prepare("SELECT day,SUM(views) AS views FROM traffic_daily WHERE day >= date('now','-29 days') GROUP BY day ORDER BY day").all<{ day: string; views: number }>(),
  ]);
  return json({ customers: customers?.count ?? 0, orders: orders.results, traffic: traffic.results });
};
