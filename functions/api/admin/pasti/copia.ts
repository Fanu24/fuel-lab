import { lunediDi } from "../../../../lib/pannello";
import { copiaSettimanaPrecedente, leggiCliente, leggiId } from "../../../../lib/server/pannello";
import { dataValida } from "../../../../lib/server/date";
import { currentUser, soloAdmin, type Context } from "../../../_lib/auth";
import { bodyJson, json, sameOrigin } from "../../../_lib/http";

/**
 * POST /api/admin/pasti/copia — copia pranzi e cene della settimana prima nella settimana
 * che comincia al `lunedi` (body `{ clienteId, lunedi }`), solo nelle caselle vuote.
 */
export const onRequestPost = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Ricarica la pagina e riprova." }, 403);
  const vietato = soloAdmin(await currentUser(env, request));
  if (vietato) return vietato;
  const body = await bodyJson(request, 2000);
  if (!body) return json({ error: "Dati non validi." }, 400);
  const id = leggiId(body.clienteId);
  if (!id.ok) return json({ error: id.error }, id.status);
  const lunedi = body.lunedi;
  if (!dataValida(lunedi) || lunediDi(lunedi) !== lunedi) return json({ error: "Scegli un lunedì." }, 400);
  if (!(await leggiCliente(env.DB, id.value))) return json({ error: "Cliente non trovato." }, 404);
  return json(await copiaSettimanaPrecedente(env.DB, id.value, lunedi));
};
