import { creaCliente, leggiDatiCliente, leggiId, modificaCliente } from "../../../lib/server/pannello";
import { currentUser, soloAdmin, type Context } from "../../_lib/auth";
import { bodyJson, json, sameOrigin } from "../../_lib/http";

/** POST /api/admin/rubrica — un cliente nuovo nella rubrica di Matteo (201). */
export const onRequestPost = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Ricarica la pagina e riprova." }, 403);
  const vietato = soloAdmin(await currentUser(env, request));
  if (vietato) return vietato;
  const body = await bodyJson(request, 4000);
  if (!body) return json({ error: "Dati non validi." }, 400);
  const dati = leggiDatiCliente(body);
  if (!dati.ok) return json({ error: dati.error }, dati.status);
  return json({ cliente: await creaCliente(env.DB, dati.value) }, 201);
};

/** PATCH /api/admin/rubrica — cambia un cliente della rubrica (`id` più i dati); 404 se non c'è. */
export const onRequestPatch = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Ricarica la pagina e riprova." }, 403);
  const vietato = soloAdmin(await currentUser(env, request));
  if (vietato) return vietato;
  const body = await bodyJson(request, 4000);
  if (!body) return json({ error: "Dati non validi." }, 400);
  const id = leggiId(body.id);
  if (!id.ok) return json({ error: id.error }, id.status);
  const dati = leggiDatiCliente(body);
  if (!dati.ok) return json({ error: dati.error }, dati.status);
  const cliente = await modificaCliente(env.DB, id.value, dati.value);
  return cliente ? json({ cliente }) : json({ error: "Cliente non trovato." }, 404);
};
