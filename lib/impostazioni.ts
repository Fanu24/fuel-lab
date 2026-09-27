/* =========================================================================
   Le impostazioni di Matteo: la parte pura, condivisa fra browser e server.

   Piatti non disponibili, chiusure e avviso arrivano da GET /api/settings (le
   scrive il pannello, le controlla lib/server/impostazioni.ts). Qui stanno le
   domande che il sito fa a quei dati - "il 12 ottobre e' chiuso?", "quali
   chiusure cadono nei prossimi giorni?" - e le frasi con cui risponde, uguali
   nel browser e nel Worker: niente Intl, i nomi dei mesi sono scritti a mano.
   ========================================================================= */

import { impostazioniVuote, type AvvisoSito, type Chiusura, type Impostazioni } from "./api";
import { getPiatto } from "./catalogo";
import { GIORNI, PASTI, type Piano, type Slot } from "./settimana";
import { dataValida, spostaGiorno } from "./server/date";

export const MAX_CHIUSURE = 20;
export const MAX_TESTO_AVVISO = 180;
export const MAX_MOTIVO = 120;
export const MAX_LINK = 200;

/* ---------- Date ---------- */

const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

/** "il", "dal", "al" davanti al numero del giorno: "dal 1°", "dall'8", "all'11", "al 5". */
function conArticolo(prep: "il" | "dal" | "al", giorno: number): string {
  if (giorno === 1) return `${prep} 1°`;
  if (giorno === 8 || giorno === 11) return `${prep === "il" ? "l’" : `${prep.slice(0, -1)}ll’`}${giorno}`;
  return `${prep} ${giorno}`;
}

const parti = (iso: string) => ({ anno: iso.slice(0, 4), mese: MESI[Number(iso.slice(5, 7)) - 1], giorno: Number(iso.slice(8, 10)) });

/**
 * Il periodo di una chiusura a parole: "il 5 ottobre", "dal 5 all’11 ottobre",
 * "dal 28 settembre al 4 ottobre". L'anno compare solo se non e' quello di
 * `oggi` o se il periodo scavalca il capodanno.
 */
export function periodo(dal: string, al: string, oggi: string): string {
  if (!dataValida(dal) || !dataValida(al)) return `dal ${dal} al ${al}`;
  const a = parti(dal);
  const b = parti(al);
  const annoA = a.anno !== b.anno || a.anno !== oggi.slice(0, 4) ? ` ${a.anno}` : "";
  const annoB = a.anno !== b.anno || b.anno !== oggi.slice(0, 4) ? ` ${b.anno}` : "";
  if (dal === al) return `${conArticolo("il", a.giorno)} ${a.mese}${annoA}`;
  if (a.anno === b.anno && a.mese === b.mese) return `${conArticolo("dal", a.giorno)} ${conArticolo("al", b.giorno)} ${b.mese}${annoB}`;
  return `${conArticolo("dal", a.giorno)} ${a.mese}${a.anno === b.anno ? "" : annoA} ${conArticolo("al", b.giorno)} ${b.mese}${annoB}`;
}

/** "Matteo è chiuso dal 5 all’11 ottobre (ferie)". */
export function fraseChiusura(c: Chiusura, oggi: string, conMotivo = true): string {
  const motivo = conMotivo && c.motivo.trim() ? ` (${c.motivo.trim()})` : "";
  return `Matteo è chiuso ${periodo(c.dal, c.al, oggi)}${motivo}`;
}

/** L'errore accanto al campo della data e nella risposta del server. */
export function erroreDataChiusa(c: Chiusura, oggi: string): string {
  return `${fraseChiusura(c, oggi, false)}: scegli un altro giorno.`;
}

/** La chiusura che comprende `giorno`, se c'e'. */
export function chiusuraDi(giorno: string, chiusure: readonly Chiusura[]): Chiusura | null {
  if (!dataValida(giorno)) return null;
  return chiusure.find((c) => c.dal <= giorno && giorno <= c.al) ?? null;
}

/** Le chiusure che toccano almeno un giorno fra `da` e `a` compresi, dalla prima. */
export function chiusureTra(chiusure: readonly Chiusura[], da: string, a: string): Chiusura[] {
  return chiusure.filter((c) => c.al >= da && c.dal <= a).sort((x, y) => x.dal.localeCompare(y.dal) || x.al.localeCompare(y.al));
}

/** In corso oggi o che iniziano entro `giorni` giorni. */
export function chiusureVicine(chiusure: readonly Chiusura[], oggi: string, giorni: number): Chiusura[] {
  return chiusureTra(chiusure, oggi, spostaGiorno(oggi, giorni));
}

/** Da lunedi' a domenica della settimana dopo quella di `oggi` (anche se oggi e' lunedi'). */
export function settimanaProssima(oggi: string): { dal: string; al: string } {
  const giornoSettimana = (new Date(`${oggi}T12:00:00Z`).getUTCDay() + 6) % 7; // lunedi' = 0
  const dal = spostaGiorno(oggi, 7 - giornoSettimana);
  return { dal, al: spostaGiorno(dal, 6) };
}

/** Quanti giorni dura una chiusura, estremi compresi. */
export function durata(c: Pick<Chiusura, "dal" | "al">): number {
  if (!dataValida(c.dal) || !dataValida(c.al)) return 0;
  return Math.round((Date.parse(`${c.al}T12:00:00Z`) - Date.parse(`${c.dal}T12:00:00Z`)) / 86_400_000) + 1;
}

/* ---------- Avviso ---------- */

/**
 * Un percorso del sito: comincia con "/", ma non con "//" (sarebbe un altro
 * sito), niente barre rovesciate (i browser le leggono come "/"), niente
 * spazi o caratteri di controllo.
 */
export function linkInterno(link: string): boolean {
  return (
    link.length <= MAX_LINK &&
    link.startsWith("/") &&
    !link.startsWith("//") &&
    !link.includes("\\") &&
    !/[\s\u0000-\u001f\u007f-\u009f]/.test(link)
  );
}

/** L'avviso da mostrare, oppure null se e' spento o vuoto. */
export function avvisoVisibile(avviso: AvvisoSito): AvvisoSito | null {
  return avviso.attivo && avviso.testo.trim() ? avviso : null;
}

/* ---------- Piatti ---------- */

/** Le caselle del piano che contengono un piatto escluso, nell'ordine della settimana. */
export function caselleEscluse(piano: Piano, esclusi: readonly string[]): (Slot & { piattoId: string })[] {
  if (!esclusi.length) return [];
  const fuori = new Set(esclusi);
  const trovate: (Slot & { piattoId: string })[] = [];
  for (const g of GIORNI) for (const m of PASTI) {
    const id = piano[g]?.[m]?.piatto;
    if (id && fuori.has(id)) trovate.push({ g, m, piattoId: id });
  }
  return trovate;
}

/* ---------- Lettura tollerante ---------- */

const testoPulito = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/**
 * Qualunque cosa -> Impostazioni valide, buttando cio' che non torna invece
 * di fallire: serve a leggere il database (una riga vecchia, un piatto tolto
 * dal catalogo) e la copia in sessionStorage del browser. Le regole severe
 * per cio' che Matteo salva stanno in lib/server/impostazioni.ts.
 */
export function potaImpostazioni(grezze: unknown): Impostazioni {
  const vuote = impostazioniVuote();
  if (!grezze || typeof grezze !== "object") return vuote;
  const g = grezze as Record<string, unknown>;
  return {
    piattiNonDisponibili: potaPiatti(g.piattiNonDisponibili),
    chiusure: potaChiusure(g.chiusure),
    avviso: potaAvviso(g.avviso),
  };
}

export function potaPiatti(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter((id): id is string => typeof id === "string" && !!getPiatto(id)))];
}

export function potaChiusure(v: unknown): Chiusura[] {
  if (!Array.isArray(v)) return [];
  const valide = v
    .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
    .filter((c) => dataValida(c.dal) && dataValida(c.al) && (c.dal as string) <= (c.al as string))
    .map((c) => ({ dal: c.dal as string, al: c.al as string, motivo: testoPulito(c.motivo, MAX_MOTIVO) }));
  return chiusureTra(valide, "0000-01-01", "9999-12-31").slice(0, MAX_CHIUSURE);
}

export function potaAvviso(v: unknown): AvvisoSito {
  if (!v || typeof v !== "object") return impostazioniVuote().avviso;
  const a = v as Record<string, unknown>;
  const testo = testoPulito(a.testo, MAX_TESTO_AVVISO);
  const link = typeof a.link === "string" && linkInterno(a.link.trim()) ? a.link.trim() : "";
  return { attivo: a.attivo === true && !!testo, testo, link };
}
