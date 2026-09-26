import { getExtra, getPiatto } from "../catalogo";
import { GIORNI, PASTI, TIPI_GIORNATA, type Casella, type TipoGiornata } from "../settimana";
import type { Giorno } from "../types";
import type { Richiesta } from "./tipi";

/* =========================================================================
   I numeri della dashboard, calcolati dalle richieste. Tutto puro: stessa
   lista, stessi numeri, provati senza browser.

   La settimana e' quella di Matteo, a Pescara: da lunedi a domenica ORA DI
   ROMA. Una richiesta arrivata domenica alle 23:30 appartiene alla settimana
   che finisce, non a quella che comincia, anche se in UTC e' gia' lunedi
   per il server o per chi apre la dashboard da un altro fuso.
   ========================================================================= */

const FUSO = "Europe/Rome";
const giornoRoma = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Il lunedi (AAAA-MM-GG, calendario di Roma) della settimana in cui cade l'istante.
 * Passa dalla data locale e poi ragiona in giorni interi su UTC: niente somme di
 * ore, quindi il cambio dell'ora legale non puo' spostare nessuno di un giorno.
 */
export function lunediDi(d: Date): string {
  const parti = Object.fromEntries(giornoRoma.formatToParts(d).map((p) => [p.type, p.value]));
  const mezzanotte = Date.UTC(Number(parti.year), Number(parti.month) - 1, Number(parti.day));
  const giornoSettimana = new Date(mezzanotte).getUTCDay(); // 0 = domenica
  const indietro = (giornoSettimana + 6) % 7;
  return new Date(mezzanotte - indietro * 86_400_000).toISOString().slice(0, 10);
}

export interface Kpi {
  /** richieste arrivate nella settimana di `oggi` */
  richiesteSettimana: number;
  /** pasti di quelle stesse richieste, in qualunque stato */
  pastiSettimana: number;
  /** richieste ancora "nuova", di qualunque settimana: sono il lavoro arretrato */
  daContattare: number;
  /** chiuse / (chiuse + perse), da 0 a 1; 0 quando non si e' ancora deciso niente */
  conversione: number;
}

export function kpi(richieste: Richiesta[], oggi: Date): Kpi {
  const settimana = lunediDi(oggi);
  const diQuesta = richieste.filter((r) => lunediDi(new Date(r.creataIl)) === settimana);
  const chiuse = richieste.filter((r) => r.stato === "chiusa").length;
  const perse = richieste.filter((r) => r.stato === "persa").length;
  return {
    richiesteSettimana: diQuesta.length,
    pastiSettimana: diQuesta.reduce((a, r) => a + r.pasti, 0),
    daContattare: richieste.filter((r) => r.stato === "nuova").length,
    conversione: chiuse + perse === 0 ? 0 : chiuse / (chiuse + perse),
  };
}

export interface PorzioniPiatto {
  piattoId: string;
  nome: string;
  porzioni: number;
}

export interface PorzioniExtra {
  extraId: string;
  nome: string;
  porzioni: number;
}

function caselle(r: Richiesta): Casella[] {
  return GIORNI.flatMap((g) => PASTI.map((m) => r.piano[g]?.[m])).filter(
    (c): c is Casella => !!c,
  );
}

function conta(conteggi: Map<string, number>, id: string) {
  conteggi.set(id, (conteggi.get(id) ?? 0) + 1);
}

/** Dal piu' richiesto; a parita', in ordine alfabetico, cosi' l'elenco non balla. */
function ordina<T extends { nome: string; porzioni: number }>(lista: T[]): T[] {
  return lista.sort((a, b) => b.porzioni - a.porzioni || a.nome.localeCompare(b.nome, "it"));
}

/**
 * Il nome dal catalogo di oggi; se il piatto non c'e' piu', quello fotografato nella
 * richiesta; in ultima istanza l'id, che e' brutto ma non e' una riga vuota.
 */
function nomePiatto(id: string, richieste: Richiesta[]): string {
  return getPiatto(id)?.nome ?? richieste.find((r) => r.nomiPiatti[id])?.nomiPiatti[id] ?? id;
}

export function topPiatti(richieste: Richiesta[], n: number): PorzioniPiatto[] {
  const conteggi = new Map<string, number>();
  for (const r of richieste) {
    for (const c of caselle(r)) if (c.piatto) conta(conteggi, c.piatto);
  }
  const lista = [...conteggi].map(([piattoId, porzioni]) => ({
    piattoId,
    nome: nomePiatto(piattoId, richieste),
    porzioni,
  }));
  return ordina(lista).slice(0, Math.max(0, n));
}

export function mixAllenamenti(richieste: Richiesta[]): Record<TipoGiornata, number> {
  const out = Object.fromEntries(TIPI_GIORNATA.map((t) => [t, 0])) as Record<TipoGiornata, number>;
  for (const r of richieste) {
    for (const g of GIORNI) {
      const t = r.allenamenti[g];
      if (t && t in out) out[t] += 1;
    }
  }
  return out;
}

export type Produzione = Record<Giorno, PorzioniPiatto[]> & { extra: PorzioniExtra[] };

/**
 * Cosa cucinare, giorno di cottura per giorno di cottura. Contano solo le richieste
 * ancora aperte (nuova, contattata): una chiusa e' gia' stata servita, una persa non
 * lo sara' mai. Un piatto uscito dal catalogo non ha piu' un giorno di cottura e non
 * si puo' preparare: resta fuori dal conto invece di finire in un giorno a caso.
 */
export function produzione(richieste: Richiesta[]): Produzione {
  const aperte = richieste.filter((r) => r.stato === "nuova" || r.stato === "contattata");
  const piatti = new Map<string, number>();
  const extra = new Map<string, number>();
  for (const r of aperte) {
    for (const c of caselle(r)) {
      if (c.piatto && getPiatto(c.piatto)) conta(piatti, c.piatto);
      for (const id of c.extra) if (getExtra(id)) conta(extra, id);
    }
  }

  const out: Produzione = { lunedi: [], giovedi: [], extra: [] };
  for (const [piattoId, porzioni] of piatti) {
    const p = getPiatto(piattoId);
    if (p) out[p.giorno].push({ piattoId, nome: p.nome, porzioni });
  }
  ordina(out.lunedi);
  ordina(out.giovedi);
  out.extra = ordina(
    [...extra].map(([extraId, porzioni]) => ({
      extraId,
      nome: getExtra(extraId)?.nome ?? extraId,
      porzioni,
    })),
  );
  return out;
}
