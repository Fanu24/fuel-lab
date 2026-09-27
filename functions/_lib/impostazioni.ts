import { impostazioniVuote, type Impostazioni } from "../../lib/api";
import { impostazioniDaRighe } from "../../lib/server/impostazioni";
import type { Env } from "./auth";

/** true se l'errore dice che la tabella non c'e': la migrazione 0005 non e' ancora stata applicata. */
export const senzaTabella = (error: unknown) => /no such table/i.test(String(error));

/**
 * Le impostazioni come le vede il sito. Se site_settings non esiste ancora
 * (migrazione 0005 non applicata) valgono i predefiniti vuoti: il sito e le
 * richieste dei clienti vanno avanti come prima invece di fermarsi.
 */
export async function leggiImpostazioniDb(env: Env): Promise<Impostazioni> {
  try {
    const { results } = await env.DB.prepare("SELECT key, value_json FROM site_settings").all<{ key: string; value_json: string }>();
    return impostazioniDaRighe(results);
  } catch (error) {
    if (!senzaTabella(error)) throw error;
    console.error("site_settings assente: applica migrations/0005_impostazioni.sql");
    return impostazioniVuote();
  }
}
