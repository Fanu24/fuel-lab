import { currentUser, type Context } from "../_lib/auth";
import { bodyJson, json, sameOrigin, str } from "../_lib/http";
import { getExtra, getPiatto } from "../../lib/catalogo";
import { GIORNI, PASTI, potaAllenamenti, potaPiano } from "../../lib/settimana";

const ORDER_SELECT = "SELECT o.*, u.email, p.preferences AS dietary_preferences FROM orders o JOIN user u ON u.id=o.user_id LEFT JOIN customer_profiles p ON p.user_id=o.user_id";

export const onRequestGet = async ({ env, request }: Context) => {
  const user = await currentUser(env, request);
  if (!user) return json({ error: "Accesso richiesto" }, 401);
  const rows = user.role === "admin"
    ? (await Promise.all([
      env.DB.prepare(`${ORDER_SELECT} WHERE o.status NOT IN ('completed','cancelled') ORDER BY o.created_at DESC`).all(),
      env.DB.prepare(`${ORDER_SELECT} WHERE o.status IN ('completed','cancelled') ORDER BY o.created_at DESC LIMIT 100`).all(),
    ])).flatMap((result) => result.results)
    : (await env.DB.prepare(`${ORDER_SELECT} WHERE o.user_id = ? ORDER BY o.created_at DESC LIMIT 50`).bind(user.id).all()).results;
  return json({ orders: rows.map((row) => ({
    ...row,
    items: JSON.parse(String(row.items_json)),
    plan_json: undefined,
    training_json: undefined,
    items_json: undefined,
    internal_note: user.role === "admin" ? row.internal_note : undefined,
    production_date: user.role === "admin" ? row.production_date : undefined,
  })), historyLimit: user.role === "admin" ? 100 : undefined });
};

export const onRequestPost = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Origine non valida" }, 403);
  const user = await currentUser(env, request);
  if (!user) return json({ error: "Accedi prima di inviare una richiesta" }, 401);
  const body = await bodyJson(request, 30000);
  if (!body) return json({ error: "Dati non validi" }, 400);

  const name = str(body.name, 100) || user.name;
  const phone = str(body.phone, 40);
  const comune = str(body.comune, 100);
  const address = str(body.address, 240);
  const notes = str(body.notes, 1500);
  const fulfillment = body.fulfillment === "pickup" ? "pickup" : body.fulfillment === "delivery" ? "delivery" : null;
  const service = ["menu-settimana", "sui-tuoi-macro", "home-cooking"].includes(String(body.service)) ? body.service as string : "menu-settimana";
  const requestedDate = typeof body.requestedDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.requestedDate) ? body.requestedDate : null;
  if (!name || phone.replace(/\D/g, "").length < 9 || !comune || !fulfillment || (fulfillment === "delivery" && !address)) {
    return json({ error: "Completa nome, telefono e dati di ritiro o consegna" }, 400);
  }
  if (requestedDate && (requestedDate < new Date().toISOString().slice(0, 10) || requestedDate > new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10))) {
    return json({ error: "Scegli una data nei prossimi 90 giorni" }, 400);
  }
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM orders WHERE user_id=? AND created_at > datetime('now','-1 day')")
    .bind(user.id).first<{ n: number }>();
  if ((recent?.n ?? 0) >= 5) return json({ error: "Hai già inviato diverse richieste oggi. Scrivici a info@fuelchef.it." }, 429);

  const plan = potaPiano(body.plan);
  const training = potaAllenamenti(body.training);
  const items: Array<{ id: string; name: string; day: string; meal: string; extras: string[] }> = [];
  for (const day of GIORNI) for (const meal of PASTI) {
    const slot = plan[day]?.[meal];
    if (!slot?.piatto) continue;
    const dish = getPiatto(slot.piatto);
    if (!dish) continue;
    items.push({ id: dish.id, name: dish.nome, day, meal, extras: slot.extra.map((id) => getExtra(id)?.nome).filter((x): x is string => !!x) });
  }
  if (service !== "home-cooking" && !items.length) return json({ error: "Componi almeno un piatto prima di inviare" }, 400);
  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO orders (id,user_id,service,fulfillment,requested_date,customer_name,phone,comune,address,notes,plan_json,training_json,items_json,meals) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
    .bind(id, user.id, service, fulfillment, requestedDate, name, phone, comune, address, notes, JSON.stringify(plan), JSON.stringify(training), JSON.stringify(items), items.length).run();
  return json({ id, status: "requested" }, 201);
};
