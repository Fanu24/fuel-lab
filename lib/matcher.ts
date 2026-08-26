import { DISHES } from "./dishes";
import type { Dish, Macros, Tag, Target } from "./types";

/**
 * Il matcher: da una scheda del nutrizionista al box della settimana.
 *
 * Questa parte NON e' finta. L'upload del PDF e' scenografico (senza backend non si
 * puo leggere davvero un file), ma da qui in poi lavora un algoritmo vero: dati i
 * target e i vincoli, sceglie le schiscette dal catalogo minimizzando lo scarto dai
 * macro. E' la funzionalita che il cliente provera davvero, quindi deve funzionare.
 *
 * Strategia: costruzione greedy (scelgo a ogni passo il piatto che avvicina di piu
 * il totale) seguita da una passata di scambi locali. Non e' un ottimo globale, ma
 * su 24 piatti converge in millisecondi e produce box sensati e vari.
 */

export interface Vincoli {
  /** tag da escludere: allergie, intolleranze, scelte alimentari */
  escludi: Tag[];
  /** se valorizzato, tiene solo i piatti che hanno almeno uno di questi tag */
  soloTag: Tag[];
  /** quante volte lo stesso piatto puo ripetersi nel box */
  maxRipetizioni: number;
}

export const VINCOLI_DEFAULT: Vincoli = { escludi: [], soloTag: [], maxRipetizioni: 2 };

/** Valori tipici di una scheda: il punto di partenza, poi l'utente li corregge. */
export const TARGET_DEFAULT: Target = {
  kcal: 2240,
  proteine: 180,
  carboidrati: 250,
  grassi: 65,
  pastiAlGiorno: 2,
  giorni: 5,
};

/**
 * Quota del fabbisogno giornaliero che Fuel copre davvero.
 * Chi prende un solo pasto al giorno fa colazione e cena per conto suo: puntare al
 * 100% dei macro su quell'unico pasto darebbe una schiscetta da 2.240 kcal.
 *
 * Un quarto di giornata per ogni schiscetta. Non e' un numero tondo scelto per
 * eleganza: e' calibrato sul catalogo. Con il fabbisogno tipo (2.240 kcal, 180/250/65 g)
 * questa quota chiede a ogni schiscetta 560 kcal e 45/62/16 g, mentre la media reale
 * dei 24 piatti e' 563 kcal e 43/62/16 g. Bersaglio e catalogo hanno lo stesso
 * baricentro, quindi il matcher puo' davvero centrarlo.
 *
 * Con la calibrazione precedente (0,35 / 0,65 / 0,9) il bersaglio era 728 kcal a
 * schiscetta contro un massimo di 648 in catalogo: irraggiungibile per costruzione,
 * e il risultato usciva sistematicamente a -15% su tutti e quattro i macro.
 * Se un giorno il catalogo si sposta verso porzioni piu grandi, questa costante
 * va rifatta insieme a lui.
 */
export function quotaCoperta(pastiAlGiorno: number): number {
  const pasti = Math.max(1, Math.min(3, Math.round(pastiAlGiorno)));
  return pasti * 0.25;
}

/** Il bersaglio dei macro per UNA schiscetta. */
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

export function sommaMacro(dishes: Dish[]): Macros {
  return dishes.reduce<Macros>(
    (acc, d) => ({
      kcal: acc.kcal + d.kcal,
      proteine: acc.proteine + d.proteine,
      carboidrati: acc.carboidrati + d.carboidrati,
      grassi: acc.grassi + d.grassi,
    }),
    { ...ZERO },
  );
}

/**
 * Peso di ciascun macro nell'errore.
 * Le proteine pesano piu di tutto perche sono il vincolo che un atleta controlla
 * davvero; i grassi pesano meno perche hanno la tolleranza piu ampia nelle schede.
 */
const PESI = { kcal: 1, proteine: 1.6, carboidrati: 1, grassi: 0.7 };

/** Errore quadratico normalizzato fra due insiemi di macro. Piu basso e' meglio. */
export function errore(attuale: Macros, bersaglio: Macros): number {
  const rel = (a: number, b: number) => (b <= 0 ? 0 : (a - b) / b);
  return (
    PESI.kcal * rel(attuale.kcal, bersaglio.kcal) ** 2 +
    PESI.proteine * rel(attuale.proteine, bersaglio.proteine) ** 2 +
    PESI.carboidrati * rel(attuale.carboidrati, bersaglio.carboidrati) ** 2 +
    PESI.grassi * rel(attuale.grassi, bersaglio.grassi) ** 2
  );
}

export function candidati(vincoli: Vincoli, catalogo: Dish[] = DISHES): Dish[] {
  return catalogo.filter((d) => {
    if (vincoli.escludi.some((t) => d.tag.includes(t))) return false;
    if (vincoli.soloTag.length && !vincoli.soloTag.some((t) => d.tag.includes(t))) return false;
    return true;
  });
}

export interface Composizione {
  piatti: Dish[];
  totali: Macros;
  bersaglio: Macros;
  /** scarto percentuale per macro, positivo = sopra il target */
  scarti: { kcal: number; proteine: number; carboidrati: number; grassi: number };
  /** true se ogni macro sta entro il 10% del target */
  aCentro: boolean;
}

const scarto = (a: number, b: number) => (b <= 0 ? 0 : ((a - b) / b) * 100);

function esito(piatti: Dish[], bersaglio: Macros): Composizione {
  const totali = sommaMacro(piatti);
  const scarti = {
    kcal: scarto(totali.kcal, bersaglio.kcal),
    proteine: scarto(totali.proteine, bersaglio.proteine),
    carboidrati: scarto(totali.carboidrati, bersaglio.carboidrati),
    grassi: scarto(totali.grassi, bersaglio.grassi),
  };
  return {
    piatti,
    totali,
    bersaglio,
    scarti,
    aCentro: Object.values(scarti).every((s) => Math.abs(s) <= 10),
  };
}

/**
 * Compone il box.
 * Restituisce sempre qualcosa: se i vincoli non lasciano abbastanza piatti,
 * riempie con quelli disponibili invece di fallire in faccia all'utente.
 */
export function componiBox(target: Target, vincoli: Vincoli = VINCOLI_DEFAULT): Composizione {
  const perPasto = targetPerPasto(target);
  const n = numeroPasti(target);
  const bersaglio: Macros = {
    kcal: perPasto.kcal * n,
    proteine: perPasto.proteine * n,
    carboidrati: perPasto.carboidrati * n,
    grassi: perPasto.grassi * n,
  };

  const pool = candidati(vincoli);
  if (!pool.length) return esito([], bersaglio);

  const maxRip = Math.max(1, vincoli.maxRipetizioni);
  const conteggio = new Map<string, number>();
  const scelti: Dish[] = [];

  // --- costruzione greedy -------------------------------------------------
  for (let i = 0; i < n; i++) {
    const rimasti = n - i;
    let migliore: Dish | null = null;
    let miglioreErrore = Infinity;

    for (const d of pool) {
      if ((conteggio.get(d.id) ?? 0) >= maxRip) continue;
      // Guardo dove finirei se prendessi questo piatto e poi proseguissi in media:
      // valutare solo il parziale premierebbe i piatti piccoli all'inizio.
      const parziale = sommaMacro([...scelti, d]);
      const proiezione: Macros = {
        kcal: (parziale.kcal / (i + 1)) * n,
        proteine: (parziale.proteine / (i + 1)) * n,
        carboidrati: (parziale.carboidrati / (i + 1)) * n,
        grassi: (parziale.grassi / (i + 1)) * n,
      };
      const e = errore(proiezione, bersaglio) + (conteggio.get(d.id) ?? 0) * 0.02;
      if (e < miglioreErrore) {
        miglioreErrore = e;
        migliore = d;
      }
    }

    // Tutti i piatti hanno esaurito le ripetizioni: allargo il limite invece di
    // consegnare un box piu corto di quello che il cliente ha chiesto.
    if (!migliore) {
      const meno = pool.reduce((a, b) =>
        (conteggio.get(a.id) ?? 0) <= (conteggio.get(b.id) ?? 0) ? a : b,
      );
      migliore = meno;
    }
    void rimasti;
    scelti.push(migliore);
    conteggio.set(migliore.id, (conteggio.get(migliore.id) ?? 0) + 1);
  }

  // --- scambi locali ------------------------------------------------------
  // La greedy sbaglia le ultime scelte perche si accorge tardi degli sbilanci.
  let corrente = errore(sommaMacro(scelti), bersaglio);
  for (let passata = 0; passata < 6; passata++) {
    let migliorato = false;
    for (let i = 0; i < scelti.length; i++) {
      for (const d of pool) {
        if (d.id === scelti[i].id) continue;
        const usato = scelti.filter((s) => s.id === d.id).length;
        if (usato >= maxRip) continue;
        const prova = scelti.slice();
        prova[i] = d;
        const e = errore(sommaMacro(prova), bersaglio);
        if (e < corrente - 1e-9) {
          scelti[i] = d;
          corrente = e;
          migliorato = true;
        }
      }
    }
    if (!migliorato) break;
  }

  // Ordine di servizio: prima i piatti del lunedi, poi quelli del giovedi.
  scelti.sort((a, b) => (a.giorno === b.giorno ? 0 : a.giorno === "lunedi" ? -1 : 1));

  return esito(scelti, bersaglio);
}
