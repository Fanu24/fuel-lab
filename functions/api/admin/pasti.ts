import { leggiId, leggiNuovoPasto, salvaPasto, togliPasto } from "../../../lib/server/pannello";
import { currentUser, soloAdmin, type Context } from "../../_lib/auth";
import { bodyJson, json, sameOrigin } from "../../_lib/http";

/** PUT /api/admin/pasti — mette o aggiorna un pasto nella sua casella (cliente, data, pasto). */
export const onRequestPut = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Ricarica la pagina e riprova." }, 403);
  const vietato = soloAdmin(await currentUser(env, request));
  if (vietato) return vietato;
  const body = await bodyJson(request, 2000);
  if (!body) return json({ error: "Dati non validi." }, 400);
  const nuovo = leggiNuovoPasto(body);
  if (!nuovo.ok) return json({ error: nuovo.error }, nuovo.status);
  const salvato = await salvaPasto(env.DB, nuovo.value);
  if (!salvato.ok) return json({ error: salvato.error }, salvato.status);
  return json({ pasto: salvato.value });
};

/** DELETE /api/admin/pasti — toglie un pasto (body `{ id }`); 404 se non c'è. */
export const onRequestDelete = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Ricarica la pagina e riprova." }, 403);
  const vietato = soloAdmin(await currentUser(env, request));
  if (vietato) return vietato;
  const body = await bodyJson(request, 2000);
  if (!body) return json({ error: "Dati non validi." }, 400);
  const id = leggiId(body.id);
  if (!id.ok) return json({ error: id.error }, id.status);
  return (await togliPasto(env.DB, id.value)) ? json({ ok: true }) : json({ error: "Pasto non trovato." }, 404);
};
