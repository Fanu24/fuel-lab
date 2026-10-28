import { periodo } from "./impostazioni";

/* =========================================================================
   Gli abbonamenti, in un posto solo.

   Decisione del committente (30 settembre 2026, volantino e schede singole):
   cinque formule, ciascuna in fascia Standard o Plus, al mese:

     Pranzo     5 pasti/sett.   il pranzo, dal lunedi' al venerdi'
     Leggero   10 pasti/sett.   pranzo e cena, cinque giorni su sette
     Completo  15 pasti/sett.   pranzo e cena, tutti i giorni (consigliato)
     Full 6    18 pasti/sett.   colazione, pranzo e cena, sei giorni su sette
     Full 7    21 pasti/sett.   tre pasti al giorno, tutti i giorni

   Il cliente porta il piano scritto dal suo nutrizionista e Matteo lo cucina
   ai grammi; consegna (o ritiro) ogni 3 giorni. Gli sconti automatici sono
   rimossi: valgono solo i codici creati da Matteo. Pagine (/abbonamento e le
   cinque schede), home, servizi, dati strutturati, richiesta dall'area cliente,
   server e pannello di Matteo
   leggono tutti da qui: se cambia un prezzo o una regola, si cambia questo
   file e basta.

   Regola: solo quello che il committente ha detto. Niente durate minime,
   disdette o pagamenti online (il sito non ne ha): inizio, consegna o ritiro e
   pagamento si concordano con Matteo, e le pagine lo dicono cosi'.

   Cose che il volantino NON dice e che qui sono ipotesi, ognuna in una riga da
   cambiare (vedi docs/superpowers/plans/2026-09-30-abbonamenti-multipli.md):
   il giorno libero di
   Full 6 e' la domenica, Leggero e' dal lunedi' al venerdi'.
   ========================================================================= */

/* ---------- Le formule ---------- */

export type FormulaId = "pranzo" | "leggero" | "completo" | "full6" | "full7";
export type Fascia = "standard" | "plus";
/** Chi si abbona: da solo, in coppia o in famiglia (prezzo per persona). */
export type Nucleo = "singolo" | "coppia" | "famiglia";
export type PastoAbb = "colazione" | "pranzo" | "cena";

export const FORMULE_ID: readonly FormulaId[] = ["pranzo", "leggero", "completo", "full6", "full7"];
export const FASCE: readonly Fascia[] = ["standard", "plus"];
export const NUCLEI: readonly Nucleo[] = ["singolo", "coppia", "famiglia"];

export const NOMI_PASTO_ABB: Record<PastoAbb, string> = { colazione: "Colazione", pranzo: "Pranzo", cena: "Cena" };
/** L'ordine in cui si mangiano: serve a mettere in fila i pasti di un giorno. */
const ORDINE_PASTI: readonly PastoAbb[] = ["colazione", "pranzo", "cena"];

export type Formula = {
  id: FormulaId;
  nome: string;
  /** La riga sotto il nome, com'e' sul volantino: "Pranzo e cena, tutti i giorni." */
  slogan: string;
  /** Il paragrafo della scheda. */
  descrizione: string;
  /** "15 pasti a settimana, pranzo e cena". */
  cosaRicevi: string;
  /** Quali pasti si cucinano ogni giorno coperto. */
  pasti: readonly PastoAbb[];
  /** I giorni coperti, come getUTCDay(): 0 = domenica ... 6 = sabato. */
  giorni: readonly number[];
  pastiSettimana: number;
  /** Euro al mese, senza sconti. */
  prezzo: { standard: number; plus: number };
  consigliato?: true;
};

const FERIALI = [1, 2, 3, 4, 5] as const;
const TUTTI = [0, 1, 2, 3, 4, 5, 6] as const;
/** Full 6: sei giorni su sette. Il volantino non dice quale resta libero: si assume la domenica. */
const SEI_GIORNI = [1, 2, 3, 4, 5, 6] as const;

export const FORMULE: readonly Formula[] = [
  {
    id: "pranzo",
    nome: "Pranzo",
    slogan: "Il pranzo, dal lunedì al venerdì.",
    descrizione:
      "Porti il piano scritto dal tuo nutrizionista. Cuciniamo il tuo pranzo ai grammi e te lo portiamo pronto, dal lunedì al venerdì. Il pasto più difficile della giornata, risolto.",
    cosaRicevi: "5 pasti a settimana, solo il pranzo",
    pasti: ["pranzo"],
    giorni: FERIALI,
    pastiSettimana: 5,
    prezzo: { standard: 173, plus: 225 },
  },
  {
    id: "leggero",
    nome: "Leggero",
    slogan: "Pranzo e cena, cinque giorni su sette.",
    descrizione:
      "Porti il piano scritto dal tuo nutrizionista. Cuciniamo pranzo e cena per cinque giorni e te li portiamo pronti. La settimana lavorativa mangi come si deve, il weekend lo gestisci tu.",
    cosaRicevi: "10 pasti a settimana, pranzo e cena",
    pasti: ["pranzo", "cena"],
    giorni: FERIALI,
    pastiSettimana: 10,
    prezzo: { standard: 347, plus: 451 },
  },
  {
    id: "completo",
    nome: "Completo",
    slogan: "Pranzo e cena, tutti i giorni.",
    descrizione:
      "Porti il piano scritto dal tuo nutrizionista. Lo cuciniamo ai grammi e te lo portiamo a casa già pronto, pranzo e cena, per tutta la settimana. Tu pensi solo a mangiare bene.",
    cosaRicevi: "15 pasti a settimana, pranzo e cena",
    pasti: ["pranzo", "cena"],
    giorni: TUTTI,
    // Il volantino scrive 15 (e 520 euro sono 15 pasti a 8 euro), ma pranzo e cena tutti i giorni
    // fanno 14: da chiarire con il committente. Le pagine dicono 15, il calendario di cucina 14.
    pastiSettimana: 15,
    prezzo: { standard: 520, plus: 676 },
    consigliato: true,
  },
  {
    id: "full6",
    nome: "Full 6",
    slogan: "Colazione, pranzo e cena. Sei giorni.",
    descrizione:
      "Porti il piano scritto dal tuo nutrizionista. Cuciniamo colazione, pranzo e cena per sei giorni su sette. Tre pasti al giorno pensati sui tuoi macro, senza mai improvvisare.",
    cosaRicevi: "18 pasti a settimana, tre al giorno",
    pasti: ["colazione", "pranzo", "cena"],
    giorni: SEI_GIORNI,
    pastiSettimana: 18,
    prezzo: { standard: 624, plus: 811 },
  },
  {
    id: "full7",
    nome: "Full 7",
    slogan: "Tre pasti al giorno, tutti i giorni.",
    descrizione:
      "Porti il piano scritto dal tuo nutrizionista. Cuciniamo colazione, pranzo e cena tutti i giorni. Ogni pasto della settimana centrato sui tuoi obiettivi. È il piano di chi si allena sul serio.",
    cosaRicevi: "21 pasti a settimana, tre al giorno",
    pasti: ["colazione", "pranzo", "cena"],
    giorni: TUTTI,
    pastiSettimana: 21,
    prezzo: { standard: 728, plus: 946 },
  },
];

export const eFormulaId = (v: unknown): v is FormulaId => typeof v === "string" && (FORMULE_ID as readonly string[]).includes(v);
export const eFascia = (v: unknown): v is Fascia => v === "standard" || v === "plus";
export const eNucleo = (v: unknown): v is Nucleo => v === "singolo" || v === "coppia" || v === "famiglia";

/** La formula per id. Lancia se l'id non esiste: e' un refuso nel codice, non un input dell'utente (per quello c'e' eFormulaId). */
export function getFormula(id: FormulaId): Formula {
  const f = FORMULE.find((x) => x.id === id);
  if (!f) throw new Error(`formula mancante nei dati: ${id}`);
  return f;
}

/** La formula consigliata dal committente (Completo). */
export const FORMULA_CONSIGLIATA: FormulaId = "completo";

/** La formula di un ordine: gli abbonamenti nati prima delle cinque formule erano pranzi dal lunedi' al venerdi'. */
export function formulaDi(o: { subscription?: { plan: FormulaId } | null } | null | undefined): FormulaId {
  return o?.subscription?.plan ?? "pranzo";
}

/* ---------- Contenuti comuni a tutte le formule ---------- */

/** Le diete che Matteo cucina: dal volantino, "qualunque sia il piano, lo cuciniamo noi". */
export const DIETE = ["mediterranea", "iperproteica", "chetogenica", "low-carb", "vegana"] as const;

/** Ogni quanti giorni si consegna (o si ritira): i pasti dei tre giorni successivi. */
export const CONSEGNA_OGNI_GIORNI = 3;

/** Il raggio della consegna, dal volantino: "Pescara e dintorni, fino a 20 km". */
export const RAGGIO_CONSEGNA_KM = 20;

/** "Circa 8 euro a pasto" in fascia Standard, come dice il volantino. */
export const PASTO_STANDARD_CIRCA = 8;

/** Le box del giorno: quello che avanza in cucina, pronto a prezzo piccolo, senza abbonamento. */
export const BOX_DEL_GIORNO = { da: 7, a: 9 } as const;
export const BOX_DEL_GIORNO_TESTO = `${BOX_DEL_GIORNO.da}–${BOX_DEL_GIORNO.a} €`;

/** La strada senza account: il modulo contatti. */
export const LINK_SCRIVI_ABBONAMENTO = "/richiesta?servizio=abbonamento#scrivi";

/** Le due fasce a parole, per pagine e pannello. */
export const NOMI_FASCIA: Record<Fascia, string> = { standard: "Standard", plus: "Plus" };
export const NOTE_FASCIA: Record<Fascia, string> = {
  standard: "Per chi vuole mangiare pulito ogni giorno.",
  plus: "Porzioni e proteine maggiorate, per chi si allena.",
};
export const NOMI_NUCLEO: Record<Nucleo, string> = { singolo: "Da solo", coppia: "In coppia", famiglia: "In famiglia" };

/** "Completo" o "Completo · Plus": come si legge una formula in una lista. */
export function etichettaFormula(formula: FormulaId, fascia?: Fascia): string {
  const nome = getFormula(formula).nome;
  return fascia ? `${nome} · ${NOMI_FASCIA[fascia]}` : nome;
}

/** La scheda singola di una formula. */
export const percorsoFormula = (id: FormulaId) => `/abbonamento/${id}`;

/**
 * La strada principale: la richiesta dall'area cliente, con il servizio gia'
 * scelto e, se si sa, la formula e la fascia.
 */
export function linkRichiediAbbonamento(
  scelta: { formula?: FormulaId; fascia?: Fascia; ritiro?: boolean; nucleo?: Nucleo; codice?: string } = {},
): string {
  const q = new URLSearchParams({ sezione: "richiesta", servizio: "abbonamento" });
  if (scelta.formula) q.set("formula", scelta.formula);
  if (scelta.fascia) q.set("fascia", scelta.fascia);
  // Il simulatore sul sito ha gia' scelto come si riceve e con chi: il modulo riparte da li', altrimenti
  // il cliente leggerebbe un prezzo nel simulatore e un altro (con lo sconto del ritiro) nella richiesta.
  if (scelta.ritiro !== undefined) q.set("modalita", scelta.ritiro ? "pickup" : "delivery");
  if (scelta.nucleo) q.set("nucleo", scelta.nucleo);
  if (scelta.codice) q.set("codice", scelta.codice);
  return `/account?${q.toString()}`;
}
export const LINK_RICHIEDI_ABBONAMENTO = linkRichiediAbbonamento();

/** Lo stesso per chi non ha un account: il modulo contatti, con formula e fascia gia' scelte (vedi components/contatto). */
export function linkScriviAbbonamento(scelta: { formula?: FormulaId; fascia?: Fascia; codice?: string } = {}): string {
  const q = new URLSearchParams({ servizio: "abbonamento" });
  if (scelta.formula) q.set("formula", scelta.formula);
  if (scelta.fascia) q.set("fascia", scelta.fascia);
  if (scelta.codice) q.set("codice", scelta.codice);
  return `/richiesta?${q.toString()}#scrivi`;
}

/* ---------- Prezzi e sconti ---------- */

/** Compatibilità con i vecchi pannelli: sconti automatici disattivati. */
export const SCONTI = { ritiro: 0, coppia: 0, famiglia: 0 } as const;

export const SCONTO_NUCLEO: Record<Nucleo, number> = { singolo: 0, coppia: SCONTI.coppia, famiglia: SCONTI.famiglia };

/** Ritiro e nucleo non applicano sconti automatici. */
export function scontoApplicato(_scelta: { ritiro: boolean; nucleo: Nucleo }): number {
  void _scelta;
  return 0;
}

export type PrezzoAbbonamento = {
  /** Il prezzo di listino della formula e della fascia, in centesimi. */
  listinoCentesimi: number;
  /** Lo sconto applicato, in percentuale (0 se non spetta). */
  scontoPercento: number;
  /** Quanto si propone al mese: listino meno lo sconto, all'euro intero, in centesimi. */
  totaleCentesimi: number;
};

export type SceltaPrezzo = { formula: FormulaId; fascia: Fascia; ritiro: boolean; nucleo: Nucleo };

/** Il prezzo al mese di una scelta. E' una proposta: il totale lo conferma Matteo. */
export function calcolaPrezzo({ formula, fascia, ritiro, nucleo }: SceltaPrezzo): PrezzoAbbonamento {
  const euroListino = getFormula(formula).prezzo[fascia];
  const scontoPercento = scontoApplicato({ ritiro, nucleo });
  // Interi fino all'ultimo: nessun errore di virgola mobile sui mezzi euro.
  const euroTotale = Math.round((euroListino * (100 - scontoPercento)) / 100);
  return { listinoCentesimi: euroListino * 100, scontoPercento, totaleCentesimi: euroTotale * 100 };
}

/** Il prezzo di listino in euro interi: quello che si legge sulle pagine. */
export const prezzoListino = (formula: FormulaId, fascia: Fascia = "standard") => getFormula(formula).prezzo[fascia];

/** Il prezzo piu' basso e quello piu' alto fra tutte le formule e le fasce: "da 173 €" e il tetto per i dati strutturati. */
export const PREZZO_DA = Math.min(...FORMULE.map((f) => f.prezzo.standard));
export const PREZZO_FINO_A = Math.max(...FORMULE.map((f) => f.prezzo.plus));
export const PREZZO_DA_TESTO = `${PREZZO_DA} €`;

/** Euro interi con la scritta "€", senza Intl: stessa risposta nel browser, nel Worker e nei test. */
export const euroInteri = (euro: number) => `${euro} €`;

/* ---------- Il calendario di un abbonamento ---------- */

/*
   Matteo conferma l'abbonamento con una data d'inizio (nel database e' la
   data di ritiro o consegna dell'ordine, fulfillment_date). Da li' vale un
   mese: fino al giorno prima dello stesso giorno del mese dopo, cosi' il mese
   successivo, se il cliente rinnova, comincia esattamente il giorno dopo.
   Quando il mese dopo non ha quel giorno (31 gennaio) si prende l'ultimo del
   mese (28 o 29 febbraio), come fanno i calendari.

   Ogni 3 giorni dall'inizio c'e' una consegna (o un ritiro) che porta i pasti
   dei tre giorni che partono da quello: oggi, domani e dopodomani, nei soli
   giorni e pasti della formula e senza uscire dal periodo. Quel giorno Matteo
   cucina quei pasti.

   Le date sono "YYYY-MM-DD" di calendario; si lavora a mezzogiorno UTC, cosi'
   l'ora legale non sposta mai un giorno. Niente Intl: stesse risposte nel
   browser, nel Worker e nei test.
*/

const aMezzogiorno = (data: string) => new Date(`${data}T12:00:00Z`);

function sposta(data: string, giorni: number): string {
  const d = aMezzogiorno(data);
  d.setUTCDate(d.getUTCDate() + giorni);
  return d.toISOString().slice(0, 10);
}

/** Dal lunedi' al venerdi'. */
export function eFeriale(data: string): boolean {
  const g = aMezzogiorno(data).getUTCDay();
  return g >= 1 && g <= 5;
}

/** Lo stesso giorno del mese dopo, o l'ultimo di quel mese se il numero non c'e'. */
export function stessoGiornoMeseDopo(inizio: string): string {
  const anno = Number(inizio.slice(0, 4));
  const mese = Number(inizio.slice(5, 7)); // 1-12
  const giorno = Number(inizio.slice(8, 10));
  const [a, m] = mese === 12 ? [anno + 1, 1] : [anno, mese + 1];
  // Il giorno 0 del mese successivo a `m` e' l'ultimo giorno di `m`.
  const ultimo = new Date(Date.UTC(a, m, 0, 12)).getUTCDate();
  return `${String(a).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(Math.min(giorno, ultimo)).padStart(2, "0")}`;
}

/** L'ultimo giorno coperto: il giorno prima dello stesso giorno del mese dopo. */
export function fineAbbonamento(inizio: string): string {
  return sposta(stessoGiornoMeseDopo(inizio), -1);
}

export type PeriodoAbbonamento = { dal: string; al: string };

export function periodoAbbonamento(inizio: string): PeriodoAbbonamento {
  return { dal: inizio, al: fineAbbonamento(inizio) };
}

/** `giorno` sta nel periodo che parte da `inizio` (estremi compresi). */
export function nelPeriodo(inizio: string, giorno: string): boolean {
  return giorno >= inizio && giorno <= fineAbbonamento(inizio);
}

/** I pasti che la formula copre in un giorno (vuoto se quel giorno non e' coperto), nell'ordine in cui si mangiano. */
export function pastiDelGiorno(formula: FormulaId, data: string): PastoAbb[] {
  const f = getFormula(formula);
  if (!f.giorni.includes(aMezzogiorno(data).getUTCDay())) return [];
  return ORDINE_PASTI.filter((p) => f.pasti.includes(p));
}

export type PastoDelBlocco = { data: string; pasto: PastoAbb };

/** I giorni di un blocco di consegna: da `consegna` per tre giorni, senza andare oltre la fine del periodo. */
export function bloccoDiConsegna(inizio: string, consegna: string): PeriodoAbbonamento {
  const fine = fineAbbonamento(inizio);
  const ultimo = sposta(consegna, CONSEGNA_OGNI_GIORNI - 1);
  return { dal: consegna, al: ultimo > fine ? fine : ultimo };
}

/** I pasti che porta una consegna: i pasti della formula nei giorni del blocco, in ordine di calendario. */
export function pastiDelBlocco(formula: FormulaId, inizio: string, consegna: string): PastoDelBlocco[] {
  const { dal, al } = bloccoDiConsegna(inizio, consegna);
  const out: PastoDelBlocco[] = [];
  for (let d = dal; d <= al; d = sposta(d, 1)) for (const pasto of pastiDelGiorno(formula, d)) out.push({ data: d, pasto });
  return out;
}

/**
 * I giorni di consegna (o ritiro) del periodo: l'inizio e poi ogni 3 giorni.
 * Una consegna che non porterebbe nessun pasto (l'ultima, se cade su un giorno
 * non coperto) non si fa.
 */
export function consegneAbbonamento(formula: FormulaId, inizio: string): string[] {
  const fine = fineAbbonamento(inizio);
  const out: string[] = [];
  for (let d = inizio; d <= fine; d = sposta(d, CONSEGNA_OGNI_GIORNI)) {
    if (pastiDelBlocco(formula, inizio, d).length) out.push(d);
  }
  return out;
}

/** `giorno` e' un giorno di consegna dell'abbonamento che parte da `inizio`. */
export function eGiornoDiConsegna(formula: FormulaId, inizio: string, giorno: string): boolean {
  if (!nelPeriodo(inizio, giorno)) return false;
  const n = Math.round((aMezzogiorno(giorno).getTime() - aMezzogiorno(inizio).getTime()) / 86_400_000);
  return n % CONSEGNA_OGNI_GIORNI === 0 && pastiDelBlocco(formula, inizio, giorno).length > 0;
}

/** Quanti pasti copre il periodo: tutti i pasti della formula nei giorni dal `dal` all'`al`. */
export function pastiNelPeriodo(formula: FormulaId, { dal, al }: PeriodoAbbonamento): number {
  let n = 0;
  for (let d = dal; d <= al; d = sposta(d, 1)) n += pastiDelGiorno(formula, d).length;
  return n;
}

/** La prossima consegna, da `oggi` compreso; null se le consegne del periodo sono finite. */
export function prossimaConsegna(formula: FormulaId, inizio: string, oggi: string): string | null {
  return consegneAbbonamento(formula, inizio).find((d) => d >= oggi) ?? null;
}

/**
 * Il periodo a parole, come le chiusure: "dal 5 ottobre al 4 novembre",
 * "dal 1° al 31 ottobre", con l'anno solo quando serve (`oggi` decide qual e'
 * l'anno corrente).
 */
export function frasePeriodo({ dal, al }: PeriodoAbbonamento, oggi: string): string {
  return periodo(dal, al, oggi);
}
