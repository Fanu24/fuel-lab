import type { Context } from "../_lib/auth";
import { json } from "../_lib/http";
import { leggiImpostazioniDb } from "../_lib/impostazioni";

/**
 * GET /api/settings — pubblico, uguale per tutti: piatti non disponibili,
 * chiusure e avviso. Il browser la puo' tenere un minuto, cosi' passare da una
 * pagina all'altra del sito non la richiede ogni volta.
 */
export const onRequestGet = async ({ env }: Context) => {
  return json({ settings: await leggiImpostazioniDb(env) }, 200, "public, max-age=60");
};
