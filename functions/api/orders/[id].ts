import { currentUser, type Context } from "../../_lib/auth";
import { bodyJson, json, sameOrigin, str } from "../../_lib/http";

const STATES = ["requested", "confirmed", "preparing", "ready", "completed", "cancelled"];

export const onRequestPatch = async ({ env, request, params }: Context<{ id: string }>) => {
  if (!sameOrigin(request)) return json({ error: "Origine non valida" }, 403);
  const user = await currentUser(env, request);
  if (user?.role !== "admin") return json({ error: "Riservato a Matteo" }, 403);
  const id = String(params.id);
  const body = await bodyJson(request, 5000);
  if (!body) return json({ error: "Dati non validi" }, 400);
  const current = await env.DB.prepare("SELECT status,production_date,fulfillment_date,internal_note FROM orders WHERE id=?").bind(id).first<{status:string;production_date:string|null;fulfillment_date:string|null;internal_note:string}>();
  if (!current) return json({ error: "Richiesta non trovata" }, 404);
  const status = body.status === undefined ? current.status : String(body.status);
  if (!STATES.includes(status)) return json({ error: "Stato non valido" }, 400);
  const productionDate = body.productionDate === undefined ? current.production_date : body.productionDate === null || body.productionDate === "" ? null : str(body.productionDate, 10);
  const fulfillmentDate = body.fulfillmentDate === undefined ? current.fulfillment_date : body.fulfillmentDate === null || body.fulfillmentDate === "" ? null : str(body.fulfillmentDate, 10);
  const validDate = (value: string | null) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  if (!validDate(productionDate) || !validDate(fulfillmentDate)) return json({ error: "Data non valida" }, 400);
  if (productionDate && fulfillmentDate && productionDate > fulfillmentDate) return json({ error: "La produzione non può essere dopo il ritiro o la consegna" }, 400);
  if (!["requested", "cancelled"].includes(status) && (!productionDate || !fulfillmentDate)) return json({ error: "Assegna le date di produzione e ritiro o consegna prima di avanzare l'ordine" }, 400);
  const note = body.internalNote === undefined ? current.internal_note : str(body.internalNote, 2000);
  await env.DB.prepare("UPDATE orders SET status=?,production_date=?,fulfillment_date=?,internal_note=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
    .bind(status, productionDate, fulfillmentDate, note, id).run();
  return json({ id, status, productionDate, fulfillmentDate, internalNote: note });
};
