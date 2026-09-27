/**
 * Le impostazioni del sito lato server, senza D1 e senza Request: la Pages
 * Function legge le righe di site_settings e il corpo di PUT, queste funzioni
 * decidono cosa entra. I test le chiamano con oggetti semplici.
 *
 * Due regimi diversi, apposta:
 * - cio' che Matteo SALVA passa da leggiImpostazioni: un dato sbagliato e' un
 *   400 con una frase che dice cosa correggere, niente viene aggiustato in
 *   silenzio;
 * - cio' che si LEGGE dal database passa da impostazioniDaRighe: una riga vecchia
 *   o un piatto tolto dal catalogo non devono rompere il sito, si buttano.
 */

import { impostazioniVuote, type AvvisoSito, type Chiusura, type Impostazioni } from "../api";
import { getPiatto } from "../catalogo";
import {
  chiusuraDi,
  chiusureTra,
  erroreDataChiusa,
  linkInterno,
  MAX_CHIUSURE,
  MAX_LINK,
  MAX_MOTIVO,
  MAX_TESTO_AVVISO,
  potaAvviso,
  potaChiusure,
  potaPiatti,
} from "../impostazioni";
import { dataValida } from "./date";
import type { Esito } from "./ordini";

/** Le chiavi di site_settings, una per parte di Impostazioni. */
export const CHIAVI = ["piattiNonDisponibili", "chiusure", "avviso"] as const satisfies readonly (keyof Impostazioni)[];
export type ChiaveImpostazioni = (typeof CHIAVI)[number];

const errore = (error: string) => ({ ok: false as const, status: 400, error });
const bene = <T>(value: T) => ({ ok: true as const, value });

/** Spazi, a capo e tabulazioni diventano uno spazio: l'avviso e i motivi stanno su una riga. */
const riga = (testo: string) => testo.replace(/\s+/g, " ").trim();

/* ---------- Lettura dal database ---------- */

/** Le righe di `SELECT key, value_json FROM site_settings` -> Impostazioni complete. */
export function impostazioniDaRighe(righe: readonly { key: unknown; value_json: unknown }[]): Impostazioni {
  const esito = impostazioniVuote();
  for (const r of righe) {
    let valore: unknown;
    try {
      valore = typeof r.value_json === "string" ? JSON.parse(r.value_json) : null;
    } catch {
      continue;
    }
    if (r.key === "piattiNonDisponibili") esito.piattiNonDisponibili = potaPiatti(valore);
    else if (r.key === "chiusure") esito.chiusure = potaChiusure(valore);
    else if (r.key === "avviso") esito.avviso = potaAvviso(valore);
  }
  return esito;
}

/* ---------- Cio' che Matteo salva ---------- */

export function leggiPiatti(v: unknown): Esito<string[]> {
  if (!Array.isArray(v)) return errore("Elenco dei piatti non valido");
  const visti = new Set<string>();
  for (const id of v) {
    if (typeof id !== "string" || !getPiatto(id)) return errore(`Piatto sconosciuto: ${String(id).slice(0, 60)}`);
    visti.add(id);
  }
  return bene([...visti]);
}

export function leggiChiusure(v: unknown): Esito<Chiusura[]> {
  if (!Array.isArray(v)) return errore("Elenco delle chiusure non valido");
  if (v.length > MAX_CHIUSURE) return errore(`Al massimo ${MAX_CHIUSURE} chiusure: togli quelle già passate`);
  const lette: Chiusura[] = [];
  for (const [i, c] of v.entries()) {
    const n = `Chiusura ${i + 1}`;
    if (!c || typeof c !== "object" || Array.isArray(c)) return errore(`${n}: dati non validi`);
    const { dal, al, motivo = "" } = c as Record<string, unknown>;
    if (!dataValida(dal)) return errore(`${n}: il primo giorno non è una data valida`);
    if (!dataValida(al)) return errore(`${n}: l'ultimo giorno non è una data valida`);
    if (dal > al) return errore(`${n}: il primo giorno viene dopo l'ultimo`);
    if (typeof motivo !== "string") return errore(`${n}: motivo non valido`);
    if (riga(motivo).length > MAX_MOTIVO) return errore(`${n}: il motivo può avere al massimo ${MAX_MOTIVO} caratteri`);
    lette.push({ dal, al, motivo: riga(motivo) });
  }
  // In ordine di data, e due righe identiche diventano una.
  const uniche = lette.filter((c, i) => lette.findIndex((x) => x.dal === c.dal && x.al === c.al && x.motivo === c.motivo) === i);
  return bene(chiusureTra(uniche, "0000-01-01", "9999-12-31"));
}

export function leggiAvviso(v: unknown): Esito<AvvisoSito> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return errore("Avviso non valido");
  const { attivo, testo = "", link = "" } = v as Record<string, unknown>;
  if (typeof attivo !== "boolean") return errore("Avviso non valido: manca acceso o spento");
  if (typeof testo !== "string") return errore("Testo dell'avviso non valido");
  const pulito = riga(testo);
  if (pulito.length > MAX_TESTO_AVVISO) return errore(`Il testo dell'avviso può avere al massimo ${MAX_TESTO_AVVISO} caratteri`);
  if (attivo && !pulito) return errore("Scrivi il testo dell'avviso prima di mostrarlo sul sito");
  if (typeof link !== "string") return errore("Link dell'avviso non valido");
  const percorso = link.trim();
  if (percorso && !linkInterno(percorso)) {
    return errore(
      percorso.length > MAX_LINK
        ? `Il link può avere al massimo ${MAX_LINK} caratteri`
        : "Il link deve essere una pagina di questo sito e cominciare con /, per esempio /menu",
    );
  }
  return bene({ attivo, testo: pulito, link: percorso });
}

/**
 * Il corpo di PUT /api/admin/settings. Ogni parte presente viene controllata
 * per intero e sostituisce quella salvata; le parti assenti restano come sono.
 */
export function leggiImpostazioni(body: Record<string, unknown>): Esito<Partial<Impostazioni>> {
  const presenti = CHIAVI.filter((k) => body[k] !== undefined);
  if (!presenti.length) return errore("Niente da salvare");
  const esito: Partial<Impostazioni> = {};
  if (body.piattiNonDisponibili !== undefined) {
    const piatti = leggiPiatti(body.piattiNonDisponibili);
    if (!piatti.ok) return piatti;
    esito.piattiNonDisponibili = piatti.value;
  }
  if (body.chiusure !== undefined) {
    const chiusure = leggiChiusure(body.chiusure);
    if (!chiusure.ok) return chiusure;
    esito.chiusure = chiusure.value;
  }
  if (body.avviso !== undefined) {
    const avviso = leggiAvviso(body.avviso);
    if (!avviso.ok) return avviso;
    esito.avviso = avviso.value;
  }
  return bene(esito);
}

/* ---------- Richieste dei clienti ---------- */

/** POST /api/orders: la data preferita non puo' cadere in un giorno di chiusura. */
export function controllaDataPreferita(data: string | null, chiusure: readonly Chiusura[], oggi: string): Esito<null> {
  if (!data) return bene(null);
  const chiusa = chiusuraDi(data, chiusure);
  return chiusa ? errore(erroreDataChiusa(chiusa, oggi)) : bene(null);
}
