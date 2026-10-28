import { leggiId, leggiPrezzoPasto, mettiInSettimana } from "../../../../lib/server/pannello";
import { dataValida, oggiRoma } from "../../../../lib/server/date";
import { ordineDaRiga } from "../../../../lib/server/ordini";
import { currentUser, soloAdmin, type Context } from "../../../_lib/auth";
import { bodyJson, json, sameOrigin } from "../../../_lib/http";
import { leggiOrdine } from "../../../_lib/ordini";

const ACCETTATI = ["confirmed", "preparing", "ready"];

/**
 * POST /api/admin/in-settimana/:id — Matteo accetta un ordine e lo mette nella settimana dal
 * giorno `inizio` (da oggi in poi), con il prezzo a pasto se lo scrive (body `{ inizio, prezzoPastoCents }`).
 */
export const onRequestPost = async ({ env, request, params }: Context<{ id: string }>) => {
  if (!sameOrigin(request)) return json({ error: "Ricarica la pagina e riprova." }, 403);
  const vietato = soloAdmin(await currentUser(env, request));
  if (vietato) return vietato;
  const body = await bodyJson(request, 2000);
  if (!body) return json({ error: "Dati non validi." }, 400);
  const oggi = oggiRoma();
  const inizio = body.inizio;
  if (!dataValida(inizio) || inizio < oggi) return json({ error: "Scegli un giorno da oggi in poi." }, 400);
  const prezzo = leggiPrezzoPasto(body.prezzoPastoCents);
  if (!prezzo.ok) return json({ error: prezzo.error }, prezzo.status);
  const id = leggiId(params.id);
  if (!id.ok) return json({ error: id.error }, id.status);

  const riga = await leggiOrdine(env, id.value);
  if (!riga) return json({ error: "Ordine non trovato." }, 404);
  const ordine = ordineDaRiga(riga, true);
  if (!ACCETTATI.includes(ordine.status)) return json({ error: "Prima accetta l'ordine." }, 409);

  return json({ pasti: await mettiInSettimana(env.DB, ordine, inizio, prezzo.value, oggi) });
};
