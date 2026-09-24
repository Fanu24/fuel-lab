import { PIATTI, type Piatto } from "./catalogo";
import {
  CASELLE_TOTALI,
  GIORNI,
  PASTI,
  macroCasella,
  type Casella,
  type Piano,
} from "./settimana";
import type { Macros, Tag, Target } from "./types";

/**
 * Il matcher: da una scheda del nutrizionista al piano della settimana.
 *
 * L'unita di scelta e' il piatto gia' composto. Sei punti nello spazio dei
 * macro, non 756 coppie: il greedy resta lo stesso, cambia solo il pool.
 */

export interface Vincoli {
  escludi: Tag[];
  soloTag: Tag[];
  /** quante volte lo stesso PIATTO puo ripetersi nella settimana. */
  maxRipetizioni: number;
}

export const VINCOLI_DEFAULT: Vincoli = { escludi: [], soloTag: [], maxRipetizioni: 2 };

export const TARGET_DEFAULT: Target = {
  kcal: 2240,
  proteine: 180,
  carboidrati: 250,
  grassi: 65,
  pastiAlGiorno: 2,
  giorni: 5,
};

/**
 * Quota del fabbisogno giornaliero che FUEL LAB copre davvero.
 *
 * I sei piatti del cliente sono schiscette intere, baricentro circa 950 kcal
 * e 54/93/40 g. Sul fabbisogno tipo (2.240 kcal) una schiscetta copre il 42%
 * della giornata: due pasti coprono l'84%, tre il 100% (il tetto). La costante
 * vecchia (0,25) puntava a 560 kcal a casella, sotto ogni piatto del menu
 * attuale, e il matcher sarebbe uscito sistematicamente sopra.
 */
export function quotaCoperta(pastiAlGiorno: number): number {
  const pasti = Math.max(1, Math.min(3, Math.round(pastiAlGiorno)));
  return Math.min(1, pasti * 0.42);
}

export function targetPerPasto(t: Target): Macros {
  const q = quotaCoperta(t.pastiAlGiorno);
  const n = Math.max(1, t.pastiAlGiorno);
  return {
    kcal: (t.kcal * q) / n,
    proteine: (t.proteine * q) / n,
    carboidrati: (t.carboidrati * q) / n,
    grassi: (t.grassi * q) / n,
  };
}

export function numeroPasti(t: Target): number {
  return Math.max(1, Math.round(t.pastiAlGiorno * t.giorni));
}

export const ZERO: Macros = { kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 };

export function sommaMacro(pezzi: Macros[]): Macros {
  return pezzi.reduce<Macros>(
    (acc, d) => ({
      kcal: acc.kcal + d.kcal,
      proteine: acc.proteine + d.proteine,
      carboidrati: acc.carboidrati + d.carboidrati,
      grassi: acc.grassi + d.grassi,
    }),
    { ...ZERO },
  );
}

function bersaglioDi(perPasto: Macros, n: number): Macros {
  return {
    kcal: perPasto.kcal * n,
    proteine: perPasto.proteine * n,
    carboidrati: perPasto.carboidrati * n,
    grassi: perPasto.grassi * n,
  };
}

const PESI = { kcal: 1, proteine: 1.6, carboidrati: 1, grassi: 0.7 };

export function errore(attuale: Macros, bersaglio: Macros): number {
  const rel = (a: number, b: number) => (b <= 0 ? 0 : (a - b) / b);
  return (
    PESI.kcal * rel(attuale.kcal, bersaglio.kcal) ** 2 +
    PESI.proteine * rel(attuale.proteine, bersaglio.proteine) ** 2 +
    PESI.carboidrati * rel(attuale.carboidrati, bersaglio.carboidrati) ** 2 +
    PESI.grassi * rel(attuale.grassi, bersaglio.grassi) ** 2
  );
}

function passaITag(tag: Tag[], vincoli: Vincoli): boolean {
  if (vincoli.escludi.some((t) => tag.includes(t))) return false;
  if (vincoli.soloTag.length && !vincoli.soloTag.some((t) => tag.includes(t))) return false;
  return true;
}

export function ammesso(e: Piatto, vincoli: Vincoli): boolean {
  return passaITag(e.tag, vincoli);
}

interface Opzione<T> {
  valore: T;
  macro: Macros;
  chiavi: string[];
}

function usi<T>(o: Opzione<T>, conteggio: Map<string, number>): number {
  return Math.max(0, ...o.chiavi.map((k) => conteggio.get(k) ?? 0));
}

function ripetibile<T>(scelte: Opzione<T>[], i: number, cand: Opzione<T>, maxRip: number): boolean {
  for (const k of cand.chiavi) {
    let n = 0;
    for (let j = 0; j < scelte.length; j++) {
      if (j !== i && scelte[j].chiavi.includes(k)) n++;
    }
    if (n >= maxRip) return false;
  }
  return true;
}

function scegli<T>(
  pool: Opzione<T>[],
  n: number,
  bersaglio: Macros,
  maxRipetizioni: number,
): Opzione<T>[] {
  const maxRip = Math.max(1, maxRipetizioni);
  const conteggio = new Map<string, number>();
  const scelte: Opzione<T>[] = [];
  let parziale: Macros = { ...ZERO };

  for (let i = 0; i < n; i++) {
    let migliore: Opzione<T> | null = null;
    let miglioreErrore = Infinity;

    for (const o of pool) {
      const rip = usi(o, conteggio);
      if (rip >= maxRip) continue;
      const p = sommaMacro([parziale, o.macro]);
      const proiezione: Macros = {
        kcal: (p.kcal / (i + 1)) * n,
        proteine: (p.proteine / (i + 1)) * n,
        carboidrati: (p.carboidrati / (i + 1)) * n,
        grassi: (p.grassi / (i + 1)) * n,
      };
      const e = errore(proiezione, bersaglio) + rip * 0.02;
      if (e < miglioreErrore) {
        miglioreErrore = e;
        migliore = o;
      }
    }

    if (!migliore) {
      migliore = pool.reduce((a, b) => (usi(a, conteggio) <= usi(b, conteggio) ? a : b));
    }

    scelte.push(migliore);
    parziale = sommaMacro([parziale, migliore.macro]);
    for (const k of migliore.chiavi) conteggio.set(k, (conteggio.get(k) ?? 0) + 1);
  }

  let totale = sommaMacro(scelte.map((o) => o.macro));
  let corrente = errore(totale, bersaglio);
  for (let passata = 0; passata < 6; passata++) {
    let migliorato = false;
    for (let i = 0; i < scelte.length; i++) {
      for (const o of pool) {
        if (o === scelte[i]) continue;
        if (!ripetibile(scelte, i, o, maxRip)) continue;
        const prova: Macros = {
          kcal: totale.kcal - scelte[i].macro.kcal + o.macro.kcal,
          proteine: totale.proteine - scelte[i].macro.proteine + o.macro.proteine,
          carboidrati: totale.carboidrati - scelte[i].macro.carboidrati + o.macro.carboidrati,
          grassi: totale.grassi - scelte[i].macro.grassi + o.macro.grassi,
        };
        const e = errore(prova, bersaglio);
        if (e < corrente - 1e-9) {
          scelte[i] = o;
          totale = sommaMacro(scelte.map((s) => s.macro));
          corrente = errore(totale, bersaglio);
          migliorato = true;
        }
      }
    }
    if (!migliorato) break;
  }

  return scelte;
}

const scarto = (a: number, b: number) => (b <= 0 ? 0 : ((a - b) / b) * 100);

function scartiDi(totali: Macros, bersaglio: Macros) {
  return {
    kcal: scarto(totali.kcal, bersaglio.kcal),
    proteine: scarto(totali.proteine, bersaglio.proteine),
    carboidrati: scarto(totali.carboidrati, bersaglio.carboidrati),
    grassi: scarto(totali.grassi, bersaglio.grassi),
  };
}

function opzioniCasella(vincoli: Vincoli): Opzione<Casella>[] {
  return PIATTI.filter((e) => ammesso(e, vincoli)).map((p) => ({
    valore: { piatto: p.id, extra: [] },
    macro: sommaMacro([p]),
    chiavi: [p.id],
  }));
}

export function combinazioni(vincoli: Vincoli): Casella[] {
  return opzioniCasella(vincoli).map((o) => o.valore);
}

export interface EsitoPiano {
  piano: Piano;
  totali: Macros;
  bersaglio: Macros;
  scarti: { kcal: number; proteine: number; carboidrati: number; grassi: number };
  aCentro: boolean;
}

function versaNelPiano(caselle: Casella[]): Piano {
  const piano: Piano = {};
  let i = 0;
  for (const g of GIORNI) {
    for (const m of PASTI) {
      const c = caselle[i++];
      if (!c) return piano;
      piano[g] = { ...piano[g], [m]: { ...c, extra: [...c.extra] } };
    }
  }
  return piano;
}

function esitoPiano(piano: Piano, bersaglio: Macros): EsitoPiano {
  const totali = sommaMacro(GIORNI.flatMap((g) => PASTI.map((m) => macroCasella(piano[g]?.[m]))));
  const scarti = scartiDi(totali, bersaglio);
  return {
    piano,
    totali,
    bersaglio,
    scarti,
    aCentro: Object.values(scarti).every((s) => Math.abs(s) <= 10),
  };
}

export function componiPiano(target: Target, vincoli: Vincoli = VINCOLI_DEFAULT): EsitoPiano {
  const perPasto = targetPerPasto(target);
  const chiesti = numeroPasti(target);
  const posti = Math.min(chiesti, CASELLE_TOTALI);
  const bersaglio = bersaglioDi(perPasto, chiesti);

  const pool = opzioniCasella(vincoli);
  if (!pool.length || posti < 1) return esitoPiano({}, bersaglio);

  const scelte = scegli(pool, posti, bersaglioDi(perPasto, posti), vincoli.maxRipetizioni);
  return esitoPiano(versaNelPiano(scelte.map((o) => o.valore)), bersaglio);
}
