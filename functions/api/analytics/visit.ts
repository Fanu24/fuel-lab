import type { Context } from "../../_lib/auth";
import { bodyJson, json, sameOrigin } from "../../_lib/http";
import { oggiRoma } from "../../../lib/server/date";
import { leggiPercorso, MAX_PERCORSI_AL_GIORNO, PERCORSO_ALTRO } from "../../../lib/server/analytics";

export const onRequestPost = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ ok: false }, 403);
  const body = await bodyJson(request, 500);
  const letto = leggiPercorso(body?.path);
  if (!letto.ok) return json({ ok: false }, 400);
  // Il pannello di Matteo non e' traffico del sito.
  if (letto.percorso === null) return json({ ok: true });
  // Giorno di Pescara, come le altre serie del pannello.
  const day = oggiRoma();
  // Un percorso nuovo entra solo finche' il giorno ne ha meno di MAX_PERCORSI_AL_GIORNO: chi inventa indirizzi
  // non puo' riempire la tabella, le sue visite si sommano in "/altro".
  await env.DB.prepare(`INSERT INTO traffic_daily(day,path,views)
      SELECT ?1,
        CASE WHEN EXISTS (SELECT 1 FROM traffic_daily WHERE day = ?1 AND path = ?2)
               OR (SELECT COUNT(*) FROM traffic_daily WHERE day = ?1) < ?3 THEN ?2 ELSE ?4 END,
        1
      WHERE true
      ON CONFLICT(day,path) DO UPDATE SET views=views+1`)
    .bind(day, letto.percorso, MAX_PERCORSI_AL_GIORNO, PERCORSO_ALTRO).run();
  return json({ ok: true });
};
