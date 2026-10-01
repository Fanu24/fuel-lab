import { leggiImpostazioni } from "../../../lib/server/impostazioni";
import { currentUser, soloAdmin, type Context } from "../../_lib/auth";
import { bodyJson, json, sameOrigin } from "../../_lib/http";
import { leggiImpostazioniDb, senzaTabella } from "../../_lib/impostazioni";

/**
 * PUT /api/admin/settings — solo Matteo. Il corpo contiene una o piu' parti
 * (piattiNonDisponibili, chiusure, avviso), ognuna intera: sostituiscono quelle
 * salvate, le altre restano. Risponde { settings } con tutto, riletto dal database.
 */
export const onRequestPut = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Non riesco a verificare da dove arriva la richiesta: ricarica la pagina e riprova." }, 403);
  const user = await currentUser(env, request);
  const vietato = soloAdmin(user);
  if (vietato) return vietato;
  const body = await bodyJson(request, 20000);
  if (!body) return json({ error: "Dati non validi" }, 400);

  const letto = leggiImpostazioni(body);
  if (!letto.ok) return json({ error: letto.error }, letto.status);

  const scrivi = env.DB.prepare(`INSERT INTO site_settings (key, value_json, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = CURRENT_TIMESTAMP`);
  try {
    await env.DB.batch(Object.entries(letto.value).map(([chiave, valore]) => scrivi.bind(chiave, JSON.stringify(valore))));
  } catch (error) {
    if (senzaTabella(error)) {
      return json({ error: "Le impostazioni non sono ancora attive: manca l'aggiornamento del database (migrazione 0005)." }, 503);
    }
    throw error;
  }
  return json({ settings: await leggiImpostazioniDb(env) });
};
