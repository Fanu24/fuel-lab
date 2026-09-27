import { messaggioDaRiga } from "../../../lib/server/contatti";
import { currentUser, soloAdmin, type Context } from "../../_lib/auth";
import { json } from "../../_lib/http";

/** GET /api/admin/messages — gli ultimi 200, prima quelli ancora da leggere. */
export const onRequestGet = async ({ env, request }: Context) => {
  const user = await currentUser(env, request);
  const vietato = soloAdmin(user);
  if (vietato) return vietato;
  const { results } = await env.DB.prepare(`
    SELECT id,name,email,phone,comune,topic,message,status,user_id,created_at,updated_at
    FROM contact_messages
    ORDER BY CASE status WHEN 'new' THEN 0 ELSE 1 END, created_at DESC
    LIMIT 200`).all<Record<string, unknown>>();
  return json({ messages: results.map(messaggioDaRiga) });
};
