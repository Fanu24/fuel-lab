import { eStatoMessaggio, messaggioDaRiga } from "../../../../lib/server/contatti";
import { currentUser, soloAdmin, type Context } from "../../../_lib/auth";
import { bodyJson, json, sameOrigin } from "../../../_lib/http";

/** PATCH /api/admin/messages/:id { status } — segna un messaggio come gestito o archiviato (o di nuovo nuovo). */
export const onRequestPatch = async ({ env, request, params }: Context<{ id: string }>) => {
  if (!sameOrigin(request)) return json({ error: "Non riesco a verificare da dove arriva la richiesta: ricarica la pagina e riprova." }, 403);
  const user = await currentUser(env, request);
  const vietato = soloAdmin(user);
  if (vietato) return vietato;
  const body = await bodyJson(request, 500);
  if (!body) return json({ error: "Dati non validi" }, 400);
  if (!eStatoMessaggio(body.status)) return json({ error: "Stato del messaggio non valido" }, 400);
  const row = await env.DB.prepare(`
    UPDATE contact_messages SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
    RETURNING id,name,email,phone,comune,topic,message,status,user_id,created_at,updated_at`)
    .bind(body.status, String(params.id)).first<Record<string, unknown>>();
  if (!row) return json({ error: "Messaggio non trovato" }, 404);
  return json({ message: messaggioDaRiga(row) });
};
