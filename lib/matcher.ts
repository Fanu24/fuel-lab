import { PRIMI, SECONDI, type Elemento } from "./catalogo";
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
 * Questa parte NON e' finta. L'upload del PDF e' scenografico (senza backend non si
 * puo leggere davvero un file), ma da qui in poi lavora un algoritmo vero: dati i
 * target e i vincoli, riempie le caselle della settimana minimizzando lo scarto dai
 * macro. E' la funzionalita che il cliente provera davvero, quindi deve funzionare.
 *
 * L'unita di scelta e' cambiata insieme al catalogo: non piu un piatto intero, ma un
 * ABBINAMENTO primo + secondo. Conta perche il piatto intero legava insieme la quota
 * di carboidrati e quella di proteine — 27 punti fissi nello spazio dei macro — mentre
 * la coppia le muove separatamente, e da 27 punti si passa a 756. Un bersaglio da
 * definizione (proteine alte, carboidrati bassi) prima era irraggiungibile per
 * costruzione; adesso e' una coppia come le altre.
 *
 * Strategia: costruzione greedy (a ogni passo l'opzione che avvicina di piu il totale)
 * seguita da passate di scambi locali. Non e' un ottimo globale, ma su meno di mille
 * opzioni converge in millisecondi e produce settimane sensate e varie.
 */

export interface Vincoli {
  /** tag da escludere: allergie, intolleranze, scelte alimentari */
  escludi: Tag[];
  /** se valorizzato, tiene solo gli elementi che hanno almeno uno di questi tag */
  soloTag: Tag[];
  /**
   * quante volte lo stesso ELEMENTO puo ripetersi nella settimana.
   * Non la stessa coppia: con 27 primi e 27 secondi un limite sulla coppia non
   * impedirebbe sette cene di salmone con sette contorni diversi, che e' esattamente
   * la monotonia che il cliente nota.
   */
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
 * Quota del fabbisogno giornaliero che FUEL LAB copre davvero.
 * Chi prende un solo pasto al giorno fa colazione e cena per conto suo: puntare al
 * 100% dei macro su quell'unico pasto darebbe una schiscetta da 2.240 kcal.
 *
 * Un quarto di giornata per ogni schiscetta. Non e' un numero tondo scelto per
 * eleganza: e' calibrato sul catalogo, e ricontrollato quando il catalogo e' passato
 * dai piatti interi agli abbinamenti. Con il fabbisogno tipo (2.240 kcal, 180/250/65 g)
 * questa quota chiede a ogni casella 560 kcal e 45/62,5/16,25 g. Le 729 coppie
 * primo+secondo hanno media 562 kcal e 43,7/61,0/16,0 g — lo stesso baricentro dei 27
 * piatti storici, che la decomposizione conserva — e coprono da 335 a 745 kcal.
 * Contando anche le 27 caselle col solo secondo la media scende a 551 kcal e
 * 43,4/58,9/15,8 g: il carboidrato e' lo scarto piu ampio, -5,8%, e viene tutto da
 * quella coda voluta. Il bersaglio resta dentro il campo e sul suo baricentro, quindi
 * la costante non si tocca.
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

/** Somma macro. Accetta qualunque cosa abbia i quattro campi: piatti, elementi, caselle. */
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

/** Il bersaglio di n schiscette messe insieme. */
function bersaglioDi(perPasto: Macros, n: number): Macros {
  return {
    kcal: perPasto.kcal * n,
    proteine: perPasto.proteine * n,
    carboidrati: perPasto.carboidrati * n,
    grassi: perPasto.grassi * n,
  };
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

/** Regola di ammissione, la stessa per un piatto intero e per un elemento scomposto. */
function passaITag(tag: Tag[], vincoli: Vincoli): boolean {
  if (vincoli.escludi.some((t) => tag.includes(t))) return false;
  if (vincoli.soloTag.length && !vincoli.soloTag.some((t) => tag.includes(t))) return false;
  return true;
}

export function ammesso(e: Elemento, vincoli: Vincoli): boolean {
  return passaITag(e.tag, vincoli);
}

/* =========================================================================
   Il motore, scritto una volta sola.

   Un'opzione e' una cosa che riempie una casella del piano. Al motore
   interessano solo i suoi macro e gli id che consumano una ripetizione, e il
   generico T tiene la porta aperta a un'altra unita' di scelta in futuro.
   ========================================================================= */

interface Opzione<T> {
  valore: T;
  macro: Macros;
  /** id che consumano una ripetizione quando l'opzione entra: il primo e il secondo */
  chiavi: string[];
}

/** Quante volte l'elemento piu usato di questa opzione e' gia in tavola. */
function usi<T>(o: Opzione<T>, conteggio: Map<string, number>): number {
  return Math.max(0, ...o.chiavi.map((k) => conteggio.get(k) ?? 0));
}

/** Come sopra, ma ignorando il posto i: e' il posto che lo scambio sta liberando. */
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

  // --- costruzione greedy -------------------------------------------------
  for (let i = 0; i < n; i++) {
    let migliore: Opzione<T> | null = null;
    let miglioreErrore = Infinity;

    for (const o of pool) {
      const rip = usi(o, conteggio);
      if (rip >= maxRip) continue;
      // Guardo dove finirei se prendessi questa opzione e poi proseguissi in media:
      // valutare solo il parziale premierebbe le opzioni piccole all'inizio.
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

    // Tutti gli elementi hanno esaurito le ripetizioni: allargo il limite invece di
    // consegnare una settimana piu corta di quella che il cliente ha chiesto.
    if (!migliore) {
      migliore = pool.reduce((a, b) => (usi(a, conteggio) <= usi(b, conteggio) ? a : b));
    }

    scelte.push(migliore);
    parziale = sommaMacro([parziale, migliore.macro]);
    for (const k of migliore.chiavi) conteggio.set(k, (conteggio.get(k) ?? 0) + 1);
  }

  // --- scambi locali ------------------------------------------------------
  // La greedy sbaglia le ultime scelte perche si accorge tardi degli sbilanci.
  let totale = sommaMacro(scelte.map((o) => o.macro));
  let corrente = errore(totale, bersaglio);
  for (let passata = 0; passata < 6; passata++) {
    let migliorato = false;
    for (let i = 0; i < scelte.length; i++) {
      for (const o of pool) {
        if (o === scelte[i]) continue;
        if (!ripetibile(scelte, i, o, maxRip)) continue;
        // Totale di prova per differenza: con 756 opzioni per ognuno dei 14 posti e
        // sei passate, risommare tutta la settimana a ogni tentativo si sentirebbe.
        const prova: Macros = {
          kcal: totale.kcal - scelte[i].macro.kcal + o.macro.kcal,
          proteine: totale.proteine - scelte[i].macro.proteine + o.macro.proteine,
          carboidrati: totale.carboidrati - scelte[i].macro.carboidrati + o.macro.carboidrati,
          grassi: totale.grassi - scelte[i].macro.grassi + o.macro.grassi,
        };
        const e = errore(prova, bersaglio);
        if (e < corrente - 1e-9) {
          scelte[i] = o;
          // Risommo per intero solo quando lo scambio e' accettato, cosi la differenza
          // non accumula errore di virgola mobile lungo centinaia di tentativi.
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

/* =========================================================================
   Il piano della settimana: la strada nuova.
   ========================================================================= */

/**
 * Le opzioni per una casella. Sono 27x27 piu i soli secondi, quindi meno di mille:
 * si enumerano tutte a ogni passo, senza bisogno di euristiche per potarle.
 */
function opzioniCasella(vincoli: Vincoli): Opzione<Casella>[] {
  const primi = PRIMI.filter((e) => ammesso(e, vincoli));
  const secondi = SECONDI.filter((e) => ammesso(e, vincoli));
  const out: Opzione<Casella>[] = [];

  for (const p of primi) {
    for (const s of secondi) {
      out.push({
        valore: { primo: p.id, secondo: s.id, extra: [] },
        macro: sommaMacro([p, s]),
        chiavi: [p.id, s.id],
      });
    }
  }
  // Casella con il solo secondo: serve per le cene a basso contenuto di carboidrati.
  // Senza, il primo porta almeno 33 g di carboidrati in ogni casella e il matcher non
  // ha modo di scendere sotto quel tetto: gli scenari di definizione escono tutti
  // sopra il target. Il gemello (solo primo) non c'e' apposta, perche una schiscetta
  // senza proteine non e' un pasto che FUEL LAB vende.
  for (const s of secondi) {
    out.push({ valore: { secondo: s.id, extra: [] }, macro: sommaMacro([s]), chiavi: [s.id] });
  }
  return out;
}

/** Le stesse opzioni senza i macro, per chi vuole solo contarle o mostrarle. */
export function combinazioni(vincoli: Vincoli): Casella[] {
  return opzioniCasella(vincoli).map((o) => o.valore);
}

export interface EsitoPiano {
  piano: Piano;
  totali: Macros;
  bersaglio: Macros;
  /** scarto percentuale per macro, positivo = sopra il target */
  scarti: { kcal: number; proteine: number; carboidrati: number; grassi: number };
  /** true se ogni macro sta entro il 10% del target */
  aCentro: boolean;
}

/**
 * Riversa le caselle in ordine: lun/pranzo, lun/cena, mar/pranzo, e cosi via.
 * Ogni casella viene clonata perche la stessa opzione puo capitare due volte nella
 * settimana, e due caselle che condividono l'oggetto si muoverebbero insieme quando
 * l'utente ne modifica una.
 */
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

/** I totali si rileggono dal piano, con la stessa funzione che li mostra a schermo. */
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

/**
 * Compone la settimana.
 * Restituisce sempre qualcosa: se i vincoli non lasciano nessuna combinazione, torna
 * un piano vuoto con gli scarti a -100% invece di fallire in faccia all'utente.
 */
export function componiPiano(target: Target, vincoli: Vincoli = VINCOLI_DEFAULT): EsitoPiano {
  const perPasto = targetPerPasto(target);
  const chiesti = numeroPasti(target);
  // Il bersaglio dichiarato e' quello della scheda. I posti sono quelli che la
  // settimana ha davvero: 3 pasti al giorno per 5 giorni fanno 15, e le caselle sono
  // 14. Quando i due numeri divergono la differenza deve comparire negli scarti invece
  // di sparire: e' l'unico modo che ha l'utente di sapere che la settimana non basta.
  const posti = Math.min(chiesti, CASELLE_TOTALI);
  const bersaglio = bersaglioDi(perPasto, chiesti);

  const pool = opzioniCasella(vincoli);
  if (!pool.length || posti < 1) return esitoPiano({}, bersaglio);

  // L'ottimizzazione punta ai posti disponibili, non ai pasti chiesti: gonfiare 14
  // schiscette per coprire il fabbisogno di 15 sbaglierebbe tutte e 14.
  const scelte = scegli(pool, posti, bersaglioDi(perPasto, posti), vincoli.maxRipetizioni);
  return esitoPiano(versaNelPiano(scelte.map((o) => o.valore)), bersaglio);
}
