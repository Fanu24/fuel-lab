/**
 * I conti del pannello di Matteo: cucina, clienti, messaggi e numeri.
 *
 * Solo funzioni pure, senza React e senza rete: le pagine di /dashboard le
 * chiamano con i dati di lib/api.ts e vitest le prova una per una
 * (lib/produzione.test.ts). Quando un numero sulla lavagna della cucina e'
 * sbagliato, il posto dove cercare e' questo file.
 */

import {
  NOMI_NUCLEO,
  NOMI_PASTO_ABB,
  consegneAbbonamento,
  eGiornoDiConsegna,
  etichettaFormula,
  formulaDi,
  pastiDelBlocco,
  pastiNelPeriodo,
  periodoAbbonamento,
  type FormulaId,
  type PastoAbb,
  type PastoDelBlocco,
} from "@/lib/abbonamento";
import {
  ETICHETTE_ARGOMENTO,
  daSqlite,
  type Chiusura,
  type ClienteAdmin,
  type MessaggioContatto,
  type Ordine,
  type StatoOrdine,
  type VoceOrdine,
} from "@/lib/api";
import { EXTRA, getPiatto } from "@/lib/catalogo";
import { chiusuraDi } from "@/lib/impostazioni";
import { GIORNI, NOMI_GIORNO, PASTI, type GiornoSettimana, type Pasto } from "@/lib/settimana";

const FUSO = "Europe/Rome";

/* =========================================================================
   Date di calendario ("YYYY-MM-DD", fuso di Roma)
   ========================================================================= */

/** La data di oggi a Pescara, anche se il browser sta in un altro fuso. */
export function oggiRoma(adesso: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" }).format(adesso);
}

export function isData(s: string | null | undefined): s is string {
  // Anni dal 2000 al 2100: un "0002-10-05" che il campo data emette mentre si digita l'anno e' un errore di
  // battitura, non un ordine, e fa lanciare il calendario degli abbonamenti (Date non conosce l'anno 2 a 4 cifre).
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s) || s < "2000-01-01" || s > "2100-12-31") return false;
  const d = new Date(`${s}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** "2026-09-28" + 3 -> "2026-10-01". A mezzogiorno UTC: l'ora legale non sposta il giorno. */
export function spostaGiorni(data: string, n: number): string {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** 0 = domenica, 1 = lunedi' ... 6 = sabato. */
export function giornoSettimana(data: string): number {
  return new Date(`${data}T12:00:00Z`).getUTCDay();
}

/** "2026-09-28" -> "lun": la chiave del giorno nel piano della settimana. */
export function giornoDelPiano(data: string): GiornoSettimana {
  return GIORNI[(giornoSettimana(data) + 6) % 7];
}

/**
 * Il primo giorno da `da` (compreso) in cui Matteo cucina: ogni giorno, tranne
 * i periodi di chiusura che segna in Impostazioni. Oltre un anno di chiusure
 * di fila non si cerca: si torna `da`.
 */
export function primoGiornoDiCucina(da: string, chiusure: readonly Chiusura[] = []): string {
  let d = da;
  for (let i = 0; i < 366; i++, d = spostaGiorni(d, 1)) if (!chiusuraDi(d, chiusure)) return d;
  return da;
}

/** "2026-09-28" -> "lun 28/09": corto, per le etichette. */
export function dataBreve(data: string): string {
  const d = new Date(`${data}T12:00:00Z`);
  const gs = new Intl.DateTimeFormat("it-IT", { weekday: "short", timeZone: "UTC" }).format(d).replace(".", "");
  return `${gs} ${data.slice(8, 10)}/${data.slice(5, 7)}`;
}

/* =========================================================================
   Cucina: quali ordini, quante porzioni
   ========================================================================= */

/** Gli stati che finiscono sul foglio di produzione. "Pronto" solo a richiesta, per ristampare. */
export const STATI_CUCINA: StatoOrdine[] = ["confirmed", "preparing"];

function entraInCucina(o: Ordine, anchePronti: boolean) {
  return STATI_CUCINA.includes(o.status) || (anchePronti && o.status === "ready");
}

/** Ritiri e consegne del giorno prima, poi quelli dopo; a parita', per nome. */
function perUscita(a: Ordine, b: Ordine) {
  const da = a.fulfillment_date ?? "9999-12-31";
  const db = b.fulfillment_date ?? "9999-12-31";
  return da.localeCompare(db) || a.fulfillment.localeCompare(b.fulfillment) || a.customer_name.localeCompare(b.customer_name, "it");
}

/**
 * Gli ordini da cucinare in un giorno. Gli abbonamenti restano fuori: la loro
 * data e' l'inizio del periodo, non un giorno di cucina, e i loro pasti
 * arrivano dai giorni di consegna (abbonamentiDelGiorno).
 */
export function ordiniDelGiorno(ordini: Ordine[], giorno: string, anchePronti = false): Ordine[] {
  return ordini.filter((o) => !eAbbonamento(o) && o.production_date === giorno && entraInCucina(o, anchePronti)).sort(perUscita);
}

/** Una porzione = un piatto in una casella del piano (una voce dell'ordine). */
export function contaPorzioni(ordini: Ordine[]): number {
  return ordini.reduce((n, o) => n + o.items.length, 0);
}

/** I prossimi giorni di cucina con qualcosa da preparare, oggi compreso. */
export function giorniConOrdini(ordini: Ordine[], daGiorno: string, anchePronti = false) {
  const mappa = new Map<string, { giorno: string; ordini: number; porzioni: number }>();
  for (const o of ordini) {
    if (eAbbonamento(o) || !o.production_date || o.production_date < daGiorno || !entraInCucina(o, anchePronti)) continue;
    const r = mappa.get(o.production_date) ?? { giorno: o.production_date, ordini: 0, porzioni: 0 };
    r.ordini += 1;
    r.porzioni += o.items.length;
    mappa.set(o.production_date, r);
  }
  return [...mappa.values()].sort((a, b) => a.giorno.localeCompare(b.giorno));
}

export type GiornoDaPreparare = {
  giorno: string;
  ordini: number;
  /** Quanti abbonamenti hanno una consegna quel giorno. */
  abbonamenti: number;
  /** Le porzioni degli ordini piu' i pasti delle consegne degli abbonamenti. */
  porzioni: number;
};

/**
 * I giorni con qualcosa da preparare a partire da `daGiorno` (compreso), per
 * `orizzonte` giorni: gli ordini con quel giorno di cucina e le consegne
 * degli abbonamenti, che sono una ogni 3 giorni e portano i pasti di tre.
 */
export function giorniDaPreparare(ordini: Ordine[], daGiorno: string, anchePronti = false, orizzonte = 14): GiornoDaPreparare[] {
  const mappa = new Map<string, GiornoDaPreparare>(
    giorniConOrdini(ordini, daGiorno, anchePronti)
      .filter((g) => g.giorno < spostaGiorni(daGiorno, orizzonte))
      .map((g) => [g.giorno, { ...g, abbonamenti: 0 }]),
  );
  for (let i = 0; i < orizzonte; i++) {
    const giorno = spostaGiorni(daGiorno, i);
    const abbonamenti = abbonamentiDelGiorno(ordini, giorno);
    if (!abbonamenti.length) continue;
    const r = mappa.get(giorno) ?? { giorno, ordini: 0, abbonamenti: 0, porzioni: 0 };
    r.abbonamenti = abbonamenti.length;
    r.porzioni += contaPastiAbbonamenti(abbonamenti, giorno);
    mappa.set(giorno, r);
  }
  return [...mappa.values()].sort((a, b) => a.giorno.localeCompare(b.giorno));
}

/** Ordini gia' confermati a cui manca ancora il giorno di cucina: non comparirebbero mai qui. */
export function confermatiSenzaGiorno(ordini: Ordine[]): Ordine[] {
  return ordini.filter((o) => STATI_CUCINA.includes(o.status) && !o.production_date);
}

/**
 * Il giorno che la Cucina apre da sola: oggi se oggi c'e' qualcosa da
 * preparare (ordini o consegne di abbonamento), altrimenti il primo giorno di
 * cucina da oggi in poi, cioe' oggi stesso se Matteo non e' chiuso.
 */
export function giornoPredefinito(ordini: Ordine[], oggi: string, chiusure: readonly Chiusura[] = []): string {
  if (ordiniDelGiorno(ordini, oggi).length || abbonamentiDelGiorno(ordini, oggi).length) return oggi;
  return primoGiornoDiCucina(oggi, chiusure);
}

/* ---------- Abbonamenti ---------- */

/*
   Come lavora Matteo con un abbonamento: ogni 3 giorni dall'inizio c'e' una
   consegna (o un ritiro), e in quel giorno cucina e porta i pasti dei tre
   giorni che la consegna copre (colazioni, pranzi e cene della formula, nei
   soli giorni coperti e dentro il periodo). Il calendario vero e' in
   lib/abbonamento.ts; qui si leggono gli ordini del pannello con quelle
   regole: quali abbonamenti hanno una consegna in un giorno, cosa portano,
   quali piatti il cliente ha indicato per quei pasti.
*/

export const eAbbonamento = (o: Pick<Ordine, "service">) => o.service === "abbonamento";

/** Gli stati in cui un abbonamento e' in corso: consegna e cucina seguono il calendario. */
export const STATI_ABBONAMENTO_ATTIVO: readonly StatoOrdine[] = ["confirmed", "preparing", "ready"];

/**
 * L'inizio di un abbonamento in corso, o null: serve lo stato attivo e una
 * data di ritiro o consegna valida (fulfillment_date), che Matteo scrive
 * confermando. Senza inizio non c'e' un calendario e non si consegna niente.
 */
export function inizioAbbonamento(o: Pick<Ordine, "service" | "status" | "fulfillment_date">): string | null {
  return eAbbonamento(o) && STATI_ABBONAMENTO_ATTIVO.includes(o.status) && isData(o.fulfillment_date) ? o.fulfillment_date : null;
}

export type ConsegnaAbbonamento = {
  /** Il giorno della consegna o del ritiro. */
  giorno: string;
  /** I pasti che porta, in ordine di calendario. Mai vuoti: una consegna senza pasti non si fa. */
  pasti: PastoDelBlocco[];
  /** L'ultimo giorno con un pasto in questa consegna. */
  fino: string;
  /** Quale consegna del periodo e', da 1. */
  numero: number;
  /** Quante consegne ha in tutto il periodo. */
  totale: number;
};

/**
 * La consegna che un abbonamento ha in `giorno`, o null se quel giorno non
 * consegna: non e' in corso, non e' ancora iniziato o e' finito, non e' un
 * giorno di consegna (una ogni 3 giorni) o non porterebbe nessun pasto.
 * Gli ordini vecchi, senza formula, valgono Pranzo.
 */
export function consegnaDelGiorno(o: Ordine, giorno: string): ConsegnaAbbonamento | null {
  const inizio = inizioAbbonamento(o);
  if (!inizio || !isData(giorno)) return null;
  const formula = formulaDi(o);
  if (!eGiornoDiConsegna(formula, inizio, giorno)) return null;
  const pasti = pastiDelBlocco(formula, inizio, giorno);
  const consegne = consegneAbbonamento(formula, inizio);
  return { giorno, pasti, fino: pasti[pasti.length - 1].data, numero: consegne.indexOf(giorno) + 1, totale: consegne.length };
}

/**
 * Gli abbonamenti che consegnano (o hanno il ritiro) in `giorno`, per nome.
 * Sono loro, non tutti gli abbonamenti in corso, a comparire in cucina e
 * nelle uscite di quel giorno.
 */
export function abbonamentiDelGiorno(ordini: Ordine[], giorno: string): Ordine[] {
  return ordini
    .filter((o) => consegnaDelGiorno(o, giorno))
    .sort((a, b) => a.customer_name.localeCompare(b.customer_name, "it") || a.id.localeCompare(b.id));
}

/** I pasti che un abbonamento porta in `giorno` (vuoto se non consegna). */
export function pastiConsegnati(o: Ordine, giorno: string): PastoDelBlocco[] {
  return consegnaDelGiorno(o, giorno)?.pasti ?? [];
}

/**
 * Il piatto che il cliente ha indicato nella richiesta per quel giorno della
 * settimana e quel pasto, se c'e'. Vale come indicazione ogni volta che quel
 * giorno della settimana ricorre: non e' una data. Il compositore ha solo
 * pranzo e cena, quindi la colazione non ha mai un piatto indicato.
 */
export function vocePasto(o: Pick<Ordine, "items">, data: string, pasto: string): VoceOrdine | null {
  const g = giornoDelPiano(data);
  return o.items.find((v) => v.day === g && v.meal === pasto) ?? null;
}

export type PastoInConsegna = PastoDelBlocco & {
  /** Il piatto indicato dal cliente per quel giorno della settimana e quel pasto, se c'e'. */
  voce: VoceOrdine | null;
  /** "Sabato · pranzo"; con la data ("Sabato 3/10 · pranzo") quando la consegna copre piu' di un giorno. */
  quando: string;
};

/**
 * "Sabato · pranzo", o "Sabato 3/10 · pranzo" quando la consegna copre piu' di
 * un giorno. `breve` abbrevia il giorno ("Sab 3/10 · pranzo") per le etichette
 * adesive, dove ogni riga in piu' non ci sta.
 */
function quandoPasto({ data, pasto }: PastoDelBlocco, conData: boolean, breve = false): string {
  const nome = NOMI_GIORNO[giornoDelPiano(data)];
  const giorno = breve ? nome.slice(0, 3) : nome;
  return `${giorno}${conData ? ` ${Number(data.slice(8, 10))}/${Number(data.slice(5, 7))}` : ""} · ${pasto}`;
}

/** I pasti di una consegna, ciascuno con il suo piatto indicato e la sua data. */
export function pastiInConsegna(o: Ordine, giorno: string): PastoInConsegna[] {
  const pasti = pastiConsegnati(o, giorno);
  const piuGiorni = new Set(pasti.map((p) => p.data)).size > 1;
  return pasti.map((p) => ({ ...p, voce: vocePasto(o, p.data, p.pasto), quando: quandoPasto(p, piuGiorni) }));
}

/** I pasti di una consegna divisi per giorno coperto, ciascuno con il suo piatto indicato: per leggerla giorno per giorno. */
export function pastiInConsegnaPerGiorno(o: Ordine, giorno: string): { data: string; pasti: PastoInConsegna[] }[] {
  const giorni: { data: string; pasti: PastoInConsegna[] }[] = [];
  for (const p of pastiInConsegna(o, giorno)) {
    const ultimo = giorni[giorni.length - 1];
    if (ultimo?.data === p.data) ultimo.pasti.push(p);
    else giorni.push({ data: p.data, pasti: [p] });
  }
  return giorni;
}

/** Quanti pasti portano in tutto le consegne del giorno: sono le porzioni degli abbonamenti. */
export function contaPastiAbbonamenti(abbonamenti: Ordine[], giorno: string): number {
  return abbonamenti.reduce((n, o) => n + pastiConsegnati(o, giorno).length, 0);
}

/** Quanti di quei pasti non hanno un piatto indicato: la ricetta la sceglie Matteo, non c'e' niente da moltiplicare. */
export function pastiDaComporre(abbonamenti: Ordine[], giorno: string): number {
  return abbonamenti.reduce((n, o) => n + pastiInConsegna(o, giorno).filter((p) => !p.voce).length, 0);
}

/**
 * Gli abbonamenti del giorno come ordini che portano solo i piatti indicati,
 * uno per ogni pasto della consegna che ne ha uno. Servono a contare piatti,
 * extra, spesa e allergeni insieme agli ordini; `meals` e' il numero dei pasti
 * della consegna, indicati o no. Un pasto senza piatto non ha una ricetta da
 * moltiplicare e resta fuori da quei conti.
 */
export function pastiComeOrdini(abbonamenti: Ordine[], giorno: string): Ordine[] {
  return abbonamenti.map((o) => {
    const pasti = pastiInConsegna(o, giorno);
    return { ...o, items: pasti.flatMap((p) => (p.voce ? [p.voce] : [])), meals: pasti.length };
  });
}

/** Le colazioni, i pranzi e le cene di una consegna a parole: "3 pranzi", "9 pasti: 3 colazioni, 3 pranzi, 3 cene". */
export function frasePasti(pasti: readonly PastoDelBlocco[]): string {
  const NOMI: Record<PastoAbb, [string, string]> = { colazione: ["colazione", "colazioni"], pranzo: ["pranzo", "pranzi"], cena: ["cena", "cene"] };
  const conti = (Object.keys(NOMI) as PastoAbb[])
    .map((p) => [p, pasti.filter((x) => x.pasto === p).length] as const)
    .filter(([, n]) => n > 0)
    .map(([p, n]) => `${n} ${NOMI[p][n === 1 ? 0 : 1]}`);
  if (conti.length === 0) return "nessun pasto";
  return conti.length === 1 ? conti[0] : `${pasti.length} pasti: ${conti.join(", ")}`;
}

/** I pasti di una consegna raggruppati per giorno, in ordine di calendario: "sab: colazione, pranzo, cena". */
export function pastiPerGiorno(pasti: readonly PastoDelBlocco[]): { data: string; pasti: PastoAbb[] }[] {
  const giorni: { data: string; pasti: PastoAbb[] }[] = [];
  for (const p of pasti) {
    const ultimo = giorni[giorni.length - 1];
    if (ultimo?.data === p.data) ultimo.pasti.push(p.pasto);
    else giorni.push({ data: p.data, pasti: [p.pasto] });
  }
  return giorni;
}

/** "Completo · Plus": la formula e la fascia di un abbonamento, com'e' scritta nelle liste. Uno senza formula (vecchio) e' un Pranzo. */
export function nomeAbbonamento(o: Pick<Ordine, "subscription">): string {
  return etichettaFormula(formulaDi(o), o.subscription?.tier);
}

/** "Completo · Plus · in coppia · con la settimana di prova": tutta la scelta, per la scheda. */
export function dettaglioAbbonamento(o: Pick<Ordine, "subscription">): string {
  const s = o.subscription;
  if (!s) return nomeAbbonamento(o);
  return [nomeAbbonamento(o), NOMI_NUCLEO[s.household].toLowerCase(), s.trial ? "con la settimana di prova" : ""].filter(Boolean).join(" · ");
}

export type CalendarioAbbonamento = {
  /** Il primo e l'ultimo giorno del periodo. */
  dal: string;
  al: string;
  /** Quanti pasti copre tutto il periodo. */
  pasti: number;
  /** I giorni di consegna (o di ritiro): l'inizio e poi ogni 3 giorni, saltando quelle senza pasti. */
  consegne: string[];
};

/** Il periodo di un abbonamento che parte da `inizio`, con i pasti che copre e le consegne che ha. */
export function calendarioAbbonamento(formula: FormulaId, inizio: string): CalendarioAbbonamento {
  const p = periodoAbbonamento(inizio);
  return { ...p, pasti: pastiNelPeriodo(formula, p), consegne: consegneAbbonamento(formula, inizio) };
}

/** Quanti pasti copre il periodo di un abbonamento con l'inizio scritto; null senza inizio o per gli altri servizi. */
export function pastiDelPeriodo(o: Pick<Ordine, "service" | "fulfillment_date" | "subscription">): number | null {
  return eAbbonamento(o) && isData(o.fulfillment_date) ? pastiNelPeriodo(formulaDi(o), periodoAbbonamento(o.fulfillment_date)) : null;
}

/* ---------- Piatti, extra, allergeni ---------- */

export type RigaPiatto = {
  id: string;
  nome: string;
  porzioni: number;
  /** null quando il piatto non e' (piu') nel catalogo: gli allergeni vanno controllati a mano. */
  allergeni: string[] | null;
};

export function contaPiatti(ordini: Ordine[]): RigaPiatto[] {
  const mappa = new Map<string, RigaPiatto>();
  for (const o of ordini) {
    for (const v of o.items) {
      const chiave = v.id || v.name;
      const riga = mappa.get(chiave);
      if (riga) riga.porzioni += 1;
      else {
        const piatto = getPiatto(v.id);
        mappa.set(chiave, { id: chiave, nome: piatto?.nome ?? v.name, porzioni: 1, allergeni: piatto ? [...piatto.allergeni] : null });
      }
    }
  }
  return [...mappa.values()].sort((a, b) => b.porzioni - a.porzioni || a.nome.localeCompare(b.nome, "it"));
}

/** Allergeni di un extra dal suo nome (le voci d'ordine salvano il nome, non l'id). */
export function allergeniExtra(nome: string): string[] {
  const trovati = EXTRA.filter((e) => e.nome === nome);
  return [...new Set(trovati.flatMap((e) => e.allergeni))];
}

export function contaExtra(ordini: Ordine[]) {
  const mappa = new Map<string, number>();
  for (const o of ordini) for (const v of o.items) for (const e of v.extras) mappa.set(e, (mappa.get(e) ?? 0) + 1);
  return [...mappa.entries()]
    .map(([nome, quanti]) => ({ nome, quanti, allergeni: allergeniExtra(nome) }))
    .sort((a, b) => b.quanti - a.quanti || a.nome.localeCompare(b.nome, "it"));
}

/** Allergeni di una porzione: quelli del piatto piu' quelli degli extra. null se il piatto e' sconosciuto. */
export function allergeniVoce(v: VoceOrdine): string[] | null {
  const piatto = getPiatto(v.id);
  if (!piatto) return null;
  const tutti = new Set([...piatto.allergeni, ...v.extras.flatMap(allergeniExtra)]);
  return [...tutti].sort((a, b) => a.localeCompare(b, "it"));
}

export type ClienteConPreferenze = { chiave: string; cliente: string; preferenze: string; ordini: number };

/**
 * Chi ha scritto allergie o preferenze nel profilo, una riga per persona: lo
 * stesso cliente con un ordine e un abbonamento nello stesso giorno non deve
 * comparire due volte nel riquadro rosso (si smette di leggerlo).
 */
export function clientiConPreferenze(ordini: Ordine[]): ClienteConPreferenze[] {
  const righe = new Map<string, ClienteConPreferenze>();
  const visti = new Set<string>();
  for (const o of ordini) {
    const preferenze = o.dietary_preferences?.trim();
    if (!preferenze || visti.has(o.id)) continue;
    visti.add(o.id);
    const chiave = `${o.user_id}|${perCercare(o.customer_name)}|${perCercare(preferenze)}`;
    const riga = righe.get(chiave);
    if (riga) riga.ordini += 1;
    else righe.set(chiave, { chiave, cliente: o.customer_name || o.email, preferenze, ordini: 1 });
  }
  return [...righe.values()];
}

export type RigaAllergene = { allergene: string; porzioni: number; fonti: string[] };

/** Ogni allergene presente nel giorno, con quante porzioni lo contengono e da dove arriva. */
export function allergeniDelGiorno(ordini: Ordine[]): RigaAllergene[] {
  const mappa = new Map<string, { porzioni: number; fonti: Set<string> }>();
  const segna = (allergene: string, fonte: string, contaPorzione: boolean) => {
    const r = mappa.get(allergene) ?? { porzioni: 0, fonti: new Set<string>() };
    if (contaPorzione) r.porzioni += 1;
    r.fonti.add(fonte);
    mappa.set(allergene, r);
  };
  for (const o of ordini) {
    for (const v of o.items) {
      const piatto = getPiatto(v.id);
      const giaContati = new Set<string>();
      for (const a of piatto?.allergeni ?? []) {
        segna(a, piatto?.nome ?? v.name, !giaContati.has(a));
        giaContati.add(a);
      }
      for (const e of v.extras) {
        for (const a of allergeniExtra(e)) {
          // "(extra)": "Pasta" o "Soia" accanto ai piatti si leggerebbero come piatti.
          segna(a, `${e} (extra)`, !giaContati.has(a));
          giaContati.add(a);
        }
      }
    }
  }
  return [...mappa.entries()]
    .map(([allergene, r]) => ({ allergene, porzioni: r.porzioni, fonti: [...r.fonti].sort((a, b) => a.localeCompare(b, "it")) }))
    .sort((a, b) => b.porzioni - a.porzioni || a.allergene.localeCompare(b.allergene, "it"));
}

/* ---------- Lista della spesa ---------- */

/** Reparti del supermercato, nell'ordine in cui si gira fra gli scaffali. */
export const REPARTI_SPESA = [
  "Frutta e verdura",
  "Carne e pesce",
  "Latticini e uova",
  "Pasta, riso e pane",
  "Dispensa e condimenti",
  "Altro",
] as const;
export type RepartoSpesa = (typeof REPARTI_SPESA)[number];

/* L'ordine delle regole conta: "peperone" va trovato prima di "pepe". */
const REGOLE_REPARTO: [RegExp, RepartoSpesa][] = [
  [/\b(cipoll\w*|carot\w*|peperon\w*|zucchin\w*|spinac\w*|pomodor\w*|patat\w*|aglio|zenzero|basilico|prezzemolo|rosmarino|salvia|timo|limon\w*|insalat\w*|verdur\w*|frutta|mel[ae]|banan\w*|funghi|melanzan\w*|broccol\w*|zucca)\b/, "Frutta e verdura"],
  [/\b(maiale|pollo|manzo|tacchino|vitello|salmone|merluzzo|tonno|gamber\w*|macinato|carne|pesce)\b/, "Carne e pesce"],
  [/\b(ricotta|parmigiano|quark|formaggio|uov[ao]|latte|burro|yogurt|mozzarella|skyr)\b/, "Latticini e uova"],
  [/\b(noodles|riso|gnocch\w*|pane|pasta|cous|farro|orzo|avena|farina|piadin\w*)\b/, "Pasta, riso e pane"],
  [/\b(olio|aceto|miele|miso|tahina|senape|zucchero|soia|sale|pepe|paprika|origano|coriandolo|curry|cocco|spezie)\b/, "Dispensa e condimenti"],
];

export function repartoDi(nome: string): RepartoSpesa {
  const n = nome.toLowerCase();
  return REGOLE_REPARTO.find(([re]) => re.test(n))?.[1] ?? "Altro";
}

/* Stesso ingrediente scritto in due modi in due ricette: si somma in una riga sola. */
const ALIAS_INGREDIENTI: Record<string, string> = {
  carote: "Carota",
  peperoni: "Peperone",
  "basilico fresco": "Basilico",
};

function ingrediente(nome: string): { chiave: string; nome: string } {
  const pulito = nome.trim().replace(/\s+/g, " ");
  const alias = ALIAS_INGREDIENTI[pulito.toLowerCase()];
  const mostrato = alias ?? pulito;
  return { chiave: mostrato.toLowerCase(), nome: mostrato };
}

const PLURALI: Record<string, string> = {
  spicchio: "spicchi",
  foglia: "foglie",
  fetta: "fette",
  cucchiaio: "cucchiai",
  cucchiaino: "cucchiaini",
  pezzo: "pezzi",
  rametto: "rametti",
};

/** "1 spicchio" -> { n: 1, unita: "spicchio" }; "2" -> { n: 2, unita: "" }; "q.b." -> null. */
export function leggiNota(nota: string): { n: number; unita: string } | null {
  const m = nota.trim().match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!m) return null;
  return { n: Number(m[1].replace(",", ".")), unita: m[2].trim().toLowerCase() };
}

export function formattaPezzi(n: number, unita: string): string {
  const numero = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 }).format(n);
  if (!unita) return `${numero} pz`;
  return `${numero} ${n === 1 ? unita : (PLURALI[unita] ?? unita)}`;
}

/** Grammi sotto i 1000, chili da 1000 in su ("1,25 kg"). */
export function formattaPeso(grammi: number): string {
  if (grammi >= 1000) return `${new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 }).format(grammi / 1000)} kg`;
  return `${Math.round(grammi)} g`;
}

export type VocePeso = { chiave: string; nome: string; grammi: number; piatti: string[] };
export type VocePezzi = { chiave: string; nome: string; quantita: number; unita: string; piatti: string[] };
export type VoceQb = { chiave: string; nome: string; piatti: string[] };

export type ListaSpesa = {
  reparti: { reparto: RepartoSpesa; voci: VocePeso[] }[];
  /** Ingredienti contati a pezzi nella ricetta (uova, spicchi d'aglio). */
  pezzi: VocePezzi[];
  /** "q.b." e note senza numero: si controlla la dispensa, non si pesa. */
  qb: VoceQb[];
  /** Piatti che non stanno nel catalogo: di questi non conosciamo la ricetta. */
  sconosciuti: { nome: string; porzioni: number }[];
};

/**
 * La spesa del giorno: ingredienti della ricetta base del catalogo per il numero
 * di porzioni. Gli extra restano fuori: il catalogo non dice di cosa sono fatti
 * al grammo, e Matteo li conta dalla scheda Piatti.
 */
export function listaSpesa(ordini: Ordine[]): ListaSpesa {
  const peso = new Map<string, VocePeso>();
  const pezzi = new Map<string, VocePezzi>();
  const qb = new Map<string, VoceQb>();
  const sconosciuti = new Map<string, number>();

  const aggiungiPiatto = (lista: string[], nome: string) => {
    if (!lista.includes(nome)) lista.push(nome);
  };

  for (const riga of contaPiatti(ordini)) {
    const piatto = getPiatto(riga.id);
    if (!piatto) {
      sconosciuti.set(riga.nome, (sconosciuti.get(riga.nome) ?? 0) + riga.porzioni);
      continue;
    }
    for (const ing of piatto.ingredienti) {
      const { chiave, nome } = ingrediente(ing.nome);
      if (typeof ing.grammi === "number") {
        const v = peso.get(chiave) ?? { chiave, nome, grammi: 0, piatti: [] };
        v.grammi += ing.grammi * riga.porzioni;
        aggiungiPiatto(v.piatti, piatto.nome);
        peso.set(chiave, v);
        continue;
      }
      const letta = ing.nota ? leggiNota(ing.nota) : null;
      if (letta) {
        const k = `${chiave}|${letta.unita}`;
        const v = pezzi.get(k) ?? { chiave: k, nome, quantita: 0, unita: letta.unita, piatti: [] };
        v.quantita += letta.n * riga.porzioni;
        aggiungiPiatto(v.piatti, piatto.nome);
        pezzi.set(k, v);
      } else {
        const v = qb.get(chiave) ?? { chiave, nome, piatti: [] };
        aggiungiPiatto(v.piatti, piatto.nome);
        qb.set(chiave, v);
      }
    }
  }

  // "Aglio q.b." in un piatto e "Aglio 3 spicchi" in un altro: si compra una volta sola, resta la riga con la quantita'.
  const comprati = new Set([...peso.keys(), ...[...pezzi.values()].map((v) => v.nome.toLowerCase())]);
  for (const chiave of qb.keys()) if (comprati.has(chiave)) qb.delete(chiave);

  const perNome = <T extends { nome: string }>(a: T, b: T) => a.nome.localeCompare(b.nome, "it");
  const reparti = REPARTI_SPESA.map((reparto) => ({
    reparto,
    voci: [...peso.values()].filter((v) => repartoDi(v.nome) === reparto).sort(perNome),
  })).filter((r) => r.voci.length > 0);

  return {
    reparti,
    pezzi: [...pezzi.values()].sort(perNome),
    qb: [...qb.values()].sort(perNome),
    sconosciuti: [...sconosciuti.entries()].map(([nome, porzioni]) => ({ nome, porzioni })),
  };
}

/* ---------- Etichette ---------- */

/** Il nome sull'etichetta di un pasto in abbonamento senza piatto indicato dal cliente. */
export const PASTO_IN_ABBONAMENTO: Record<PastoAbb, string> = {
  colazione: `${NOMI_PASTO_ABB.colazione} in abbonamento`,
  pranzo: `${NOMI_PASTO_ABB.pranzo} in abbonamento`,
  cena: `${NOMI_PASTO_ABB.cena} in abbonamento`,
};

export type Etichetta = {
  chiave: string;
  ordineId: string;
  cliente: string;
  piatto: string;
  /** "Lunedì · pranzo" */
  quando: string;
  extra: string[];
  allergeni: string[] | null;
};

const indiceGiorno = (g: string) => {
  const i = GIORNI.indexOf(g as GiornoSettimana);
  return i === -1 ? 99 : i;
};
const indicePasto = (p: string) => {
  const i = PASTI.indexOf(p as Pasto);
  return i === -1 ? 99 : i;
};

/** Le voci di un ordine in ordine di calendario: lunedi' pranzo, lunedi' cena, martedi'... */
export function vociInOrdine(voci: VoceOrdine[]): VoceOrdine[] {
  return [...voci].sort((a, b) => indiceGiorno(a.day) - indiceGiorno(b.day) || indicePasto(a.meal) - indicePasto(b.meal));
}

export function nomeGiornoPasto(v: Pick<VoceOrdine, "day" | "meal">): string {
  const giorno = NOMI_GIORNO[v.day as GiornoSettimana] ?? v.day;
  return `${giorno} · ${v.meal}`;
}

/** Una etichetta per porzione, cliente per cliente, nell'ordine in cui escono. */
export function etichette(ordini: Ordine[]): Etichetta[] {
  return [...ordini].sort(perUscita).flatMap((o) =>
    vociInOrdine(o.items).map((v, i) => ({
      chiave: `${o.id}-${i}`,
      ordineId: o.id,
      cliente: o.customer_name,
      piatto: getPiatto(v.id)?.nome ?? v.name,
      quando: nomeGiornoPasto(v),
      extra: v.extras,
      allergeni: allergeniVoce(v),
    })),
  );
}

/**
 * Una etichetta per ogni pasto che le consegne in abbonamento del giorno
 * portano (una consegna copre tre giorni: 9 etichette per un Full 7): il
 * piatto indicato dal cliente per quel giorno e quel pasto, oppure
 * "Colazione/Pranzo/Cena in abbonamento" con gli allergeni da verificare,
 * perche' il piatto lo decide Matteo sulla scheda. Cliente per cliente, i
 * pasti in ordine di calendario.
 */
export function etichetteAbbonamenti(abbonamenti: Ordine[], giorno: string): Etichetta[] {
  return abbonamenti.flatMap((o) => {
    const pasti = pastiInConsegna(o, giorno);
    const piuGiorni = new Set(pasti.map((p) => p.data)).size > 1;
    return pasti.map((p) => ({
      chiave: `${o.id}-abbonamento-${p.data}-${p.pasto}`,
      ordineId: o.id,
      cliente: o.customer_name,
      piatto: p.voce ? (getPiatto(p.voce.id)?.nome ?? p.voce.name) : PASTO_IN_ABBONAMENTO[p.pasto],
      // Con la data sull'adesivo il giorno e' abbreviato: "Mer 14/10 · colazione · abbonamento" sta su una riga sola.
      quando: `${quandoPasto(p, piuGiorni, piuGiorni)} · abbonamento`,
      extra: p.voce?.extras ?? [],
      allergeni: p.voce ? allergeniVoce(p.voce) : null,
    }));
  });
}

/** Il formato scelto: A4 con 3 colonne e 7 righe, etichette 70 x 42,3 mm senza margini. */
export const FOGLIO_ETICHETTE = { colonne: 3, righe: 7, larghezzaMm: 70, altezzaMm: 42.3 } as const;
export const ETICHETTE_PER_FOGLIO = FOGLIO_ETICHETTE.colonne * FOGLIO_ETICHETTE.righe;

/**
 * Divide le etichette in fogli. `salta` lascia vuote le prime caselle del primo
 * foglio, per finire un foglio gia' usato a meta'.
 */
export function inFogli<T>(voci: T[], salta = 0): (T | null)[][] {
  const vuote = Math.max(0, Math.min(ETICHETTE_PER_FOGLIO - 1, Math.floor(salta)));
  const caselle: (T | null)[] = [...Array<null>(vuote).fill(null), ...voci];
  const fogli: (T | null)[][] = [];
  for (let i = 0; i < caselle.length; i += ETICHETTE_PER_FOGLIO) fogli.push(caselle.slice(i, i + ETICHETTE_PER_FOGLIO));
  return voci.length ? fogli : [];
}

/* =========================================================================
   Clienti
   ========================================================================= */

export type OrdineClienti = "recenti" | "ordini" | "spesa" | "nome";
export type FiltroClienti = "tutti" | "aperti" | "da-ricontattare" | "senza-ordini" | "non-verificati";

/** Dopo quanti giorni dall'ultimo ordine un cliente senza ordini aperti va ricontattato. */
export const GIORNI_PER_RICONTATTARE = 21;

/** Minuscolo e senza accenti: "Nicolò" si trova anche scrivendo "nicolo". */
export function perCercare(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Millisecondi di un timestamp del server; 0 se manca o non si legge. */
function ms(ts: string | null | undefined): number {
  if (!ts) return 0;
  const t = daSqlite(ts).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** L'ultima volta che il cliente si e' fatto vivo (iscrizione o ultimo ordine), in millisecondi. */
export function ultimaAttivita(c: ClienteAdmin): number {
  return Math.max(ms(c.createdAt), ms(c.lastOrderAt));
}

export function filtraClienti(
  clienti: ClienteAdmin[],
  { cerca = "", filtro = "tutti", ordine = "recenti", adesso = Date.now() }: { cerca?: string; filtro?: FiltroClienti; ordine?: OrdineClienti; adesso?: number },
): ClienteAdmin[] {
  const parole = perCercare(cerca).split(/\s+/).filter(Boolean);
  const cifre = cerca.replace(/\D/g, "");
  const trovati = clienti.filter((c) => {
    if (filtro === "aperti" && c.activeOrders === 0) return false;
    if (filtro === "senza-ordini" && c.orders > 0) return false;
    // Ha gia' ordinato, non ha niente in corso e l'ultimo ordine e' di qualche settimana fa.
    if (filtro === "da-ricontattare" && !(c.orders > 0 && c.activeOrders === 0 && ms(c.lastOrderAt) > 0 && adesso - ms(c.lastOrderAt) > GIORNI_PER_RICONTATTARE * 86_400_000)) return false;
    if (filtro === "non-verificati" && c.emailVerified) return false;
    if (!parole.length) return true;
    const testo = perCercare([c.name, c.email, c.comune, c.address, c.preferences, c.phone].join(" "));
    const telefonoTrovato = cifre.length >= 3 && c.phone.replace(/\D/g, "").includes(cifre);
    return telefonoTrovato || parole.every((p) => testo.includes(p));
  });
  const confronti: Record<OrdineClienti, (a: ClienteAdmin, b: ClienteAdmin) => number> = {
    recenti: (a, b) => ultimaAttivita(b) - ultimaAttivita(a),
    ordini: (a, b) => b.orders - a.orders || b.meals - a.meals,
    spesa: (a, b) => b.spentCents - a.spentCents,
    nome: () => 0,
  };
  const perNome = (a: ClienteAdmin, b: ClienteAdmin) => (a.name || a.email).localeCompare(b.name || b.email, "it");
  return trovati.sort((a, b) => confronti[ordine](a, b) || perNome(a, b));
}

/** Clienti iscritti negli ultimi `giorni` giorni. */
export function nuoviClienti(clienti: ClienteAdmin[], giorni: number, adesso: Date = new Date()): number {
  const soglia = adesso.getTime() - giorni * 86_400_000;
  return clienti.filter((c) => ms(c.createdAt) >= soglia).length;
}

/* ---------- CSV per Excel ---------- */

/**
 * Una cella CSV col punto e virgola (l'Excel italiano lo apre senza domande).
 * Le celle che iniziano con = + - @ prendono un apostrofo davanti: altrimenti
 * Excel le eseguirebbe come formule (un nome "=HYPERLINK(...)" diventerebbe un link).
 */
export function cellaCsv(valore: string | number | null | undefined): string {
  let s = valore === null || valore === undefined ? "" : String(valore);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function dataCsv(ts: string | null): string {
  if (!ts) return "";
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: FUSO }).format(daSqlite(ts));
}

/** Tutti i clienti in un CSV con BOM UTF-8 (per gli accenti in Excel) e righe CRLF. */
export function clientiCsv(clienti: ClienteAdmin[]): string {
  const intestazione = [
    "Nome", "Email", "Email verificata", "Telefono", "Comune", "Indirizzo", "Preferenze e allergie",
    "Iscritto il", "Ordini", "Ordini aperti", "Pasti", "Ultimo ordine", "Speso (EUR)", "Piano salvato",
  ];
  const righe = clienti.map((c) => [
    c.name, c.email, c.emailVerified ? "sì" : "no", c.phone, c.comune, c.address, c.preferences,
    dataCsv(c.createdAt), c.orders, c.activeOrders, c.meals, dataCsv(c.lastOrderAt),
    (c.spentCents / 100).toFixed(2).replace(".", ","), c.hasSavedPlan ? "sì" : "no",
  ]);
  return `﻿${[intestazione, ...righe].map((r) => r.map(cellaCsv).join(";")).join("\r\n")}\r\n`;
}

/* =========================================================================
   Messaggi
   ========================================================================= */

export function oggettoRisposta(m: Pick<MessaggioContatto, "topic">): string {
  return `Re: FUEL LAB – ${ETICHETTE_ARGOMENTO[m.topic] ?? "il tuo messaggio"}`;
}

const MAX_CITAZIONE = 1200;

/** Il testo della risposta: saluto, spazio per scrivere, poi il messaggio citato con ">". */
export function corpoRisposta(m: Pick<MessaggioContatto, "name" | "message" | "created_at">): string {
  const nome = m.name.trim().split(/\s+/)[0] || "";
  const quando = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: FUSO })
    .format(daSqlite(m.created_at));
  const testo = m.message.length > MAX_CITAZIONE ? `${m.message.slice(0, MAX_CITAZIONE).trimEnd()}…` : m.message;
  const citato = testo.split(/\r?\n/).map((riga) => `> ${riga}`).join("\n");
  return `Ciao${nome ? ` ${nome}` : ""},\n\n\n\nMatteo – FUEL LAB\n\n---\nIl ${quando} hai scritto:\n${citato}\n`;
}

export function mailtoRisposta(m: Pick<MessaggioContatto, "email" | "name" | "message" | "created_at" | "topic">): string {
  return `mailto:${encodeURIComponent(m.email).replace(/%40/g, "@")}?subject=${encodeURIComponent(oggettoRisposta(m))}&body=${encodeURIComponent(corpoRisposta(m))}`;
}

/* =========================================================================
   Numeri
   ========================================================================= */

/** Euro tondi per i riquadri dei numeri: "2540 €". Il dettaglio al centesimo resta negli elenchi. */
export function euroTondo(centesimi: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(
    Math.round(centesimi / 100),
  );
}

export function somma<T>(voci: T[], valore: (v: T) => number): number {
  return voci.reduce((n, v) => n + valore(v), 0);
}

/**
 * Le tacche dell'asse dei valori: da 0 a un numero tondo >= max, passo 1, 2 o 5
 * per una potenza di dieci. Solo interi: contiamo richieste e visite, non frazioni.
 */
export function tacche(max: number, quante = 4): number[] {
  if (!(max > 0)) return [0, 1];
  const grezzo = max / quante;
  const potenza = 10 ** Math.floor(Math.log10(grezzo));
  const passo = Math.max(1, [1, 2, 5, 10].map((m) => m * potenza).find((p) => p >= grezzo) ?? 10 * potenza);
  const cima = Math.ceil(max / passo) * passo;
  const out: number[] = [];
  for (let v = 0; v <= cima + passo / 2; v += passo) out.push(Math.round(v));
  return out;
}
