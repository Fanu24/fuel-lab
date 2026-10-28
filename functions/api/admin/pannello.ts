import { errorIntervallo, leggiNuovi, leggiPannello, convertiOrdiniAperti } from "../../../lib/server/pannello";
import { oggiRoma } from "../../../lib/server/date";
import { currentUser, soloAdmin, type Context } from "../../_lib/auth";
import { json } from "../../_lib/http";

/**
 * GET /api/admin/pannello?da=YYYY-MM-DD&a=YYYY-MM-DD — il pannello di Matteo per l'intervallo (compreso).
 * Prima porta nella settimana gli ordini accettati che non ci sono ancora, poi risponde.
 */
export const onRequestGet = async ({ env, request }: Context) => {
  const vietato = soloAdmin(await currentUser(env, request));
  if (vietato) return vietato;
  const url = new URL(request.url);
  const da = url.searchParams.get("da") ?? "";
  const a = url.searchParams.get("a") ?? "";
  const errore = errorIntervallo(da, a);
  if (errore) return json({ error: errore }, 400);

  await convertiOrdiniAperti(env.DB, oggiRoma());
  const dati = await leggiPannello(env.DB, da, a);
  return json({ ...dati, nuovi: await leggiNuovi(env.DB) });
};
