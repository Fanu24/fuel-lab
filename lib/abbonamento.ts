import { periodo } from "./impostazioni";
import { CONSEGNA_GRATIS_DA } from "./pricing";
import { INDIRIZZO } from "./sito";

/* =========================================================================
   L'abbonamento mensile ai pranzi, in un posto solo.

   Decisione del committente: 239 euro al mese per TUTTI i pranzi dal lunedi'
   al venerdi', per tutto il mese, composti sulla scheda del cliente (come si
   allena, i suoi obiettivi o la scheda del nutrizionista). Pagina
   /abbonamento, sezione in home, servizio in /servizi (lib/servizi.ts), dati
   strutturati, richiesta dall'area cliente, server e pannello di Matteo
   leggono da qui: se cambia il prezzo, si cambia questo file e basta.

   Regola: solo quello che il committente ha detto. Niente durate minime,
   disdette, sconti o pagamenti online (il sito non ne ha): inizio, consegna o
   ritiro e pagamento si concordano con Matteo, e le pagine lo dicono cosi'.
   ========================================================================= */

/** Il prezzo, in euro al mese. */
export const PREZZO_ABBONAMENTO = 239;

/** "239 €": come si scrive il prezzo sulle pagine. */
export const PREZZO_ABBONAMENTO_TESTO = `${PREZZO_ABBONAMENTO} €`;

/**
 * I pranzi di un mese, dal lunedi' al venerdi': una ventina (fra 20 e 23,
 * secondo il mese). Serve solo a dire "circa", mai a fare un conto per pasto.
 */
export const PRANZI_AL_MESE_CIRCA = 20;

/**
 * Con una ventina di pranzi al mese si sta sopra la soglia della consegna
 * gratuita che il sito dichiara (lib/pricing.ts). Se la soglia salisse sopra i
 * pranzi del mese, le pagine smettono da sole di dirlo.
 */
export const ABBONAMENTO_CONSEGNA_GRATIS = PRANZI_AL_MESE_CIRCA >= CONSEGNA_GRATIS_DA;

/** La soglia della consegna gratuita, per scriverla accanto all'abbonamento. */
export const SOGLIA_CONSEGNA_GRATIS = CONSEGNA_GRATIS_DA;

/** La strada principale: la richiesta dall'area cliente, con il servizio gia' scelto. */
export const LINK_RICHIEDI_ABBONAMENTO = "/account?sezione=richiesta&servizio=abbonamento";

/** La strada senza account: il modulo contatti. */
export const LINK_SCRIVI_ABBONAMENTO = "/richiesta?servizio=abbonamento#scrivi";

/** Cosa comprende, in quattro righe: le stesse in home e sulla pagina. */
export const COMPRENDE_ABBONAMENTO = [
  "Tutti i pranzi dal lunedì al venerdì, per tutto il mese",
  "Composti sulla tua scheda: allenamento, obiettivi o numeri del nutrizionista",
  "Cucinati freschi da Matteo, mai surgelati, con i macro su ogni piatto",
  `Ritiro in ${INDIRIZZO.via} o consegna a ${INDIRIZZO.citta} e dintorni`,
];

/* =========================================================================
   Il periodo di un abbonamento, per il pannello, l'area cliente e le email.

   Matteo conferma l'abbonamento con una data d'inizio (nel database e' la
   data di ritiro o consegna dell'ordine, fulfillment_date). Da li' vale un
   mese: fino al giorno prima dello stesso giorno del mese dopo, cosi' il mese
   successivo, se il cliente rinnova, comincia esattamente il giorno dopo.
   Quando il mese dopo non ha quel giorno (31 gennaio) si prende l'ultimo del
   mese (28 o 29 febbraio), come fanno i calendari.

   Le date sono "YYYY-MM-DD" di calendario; si lavora a mezzogiorno UTC, cosi'
   l'ora legale non sposta mai un giorno. Niente Intl: stesse risposte nel
   browser, nel Worker e nei test.
   ========================================================================= */

/** Il prezzo in centesimi: la proposta che la richiesta porta con se' finche' Matteo non la conferma. */
export const PREZZO_ABBONAMENTO_CENTESIMI = PREZZO_ABBONAMENTO * 100;

const aMezzogiorno = (data: string) => new Date(`${data}T12:00:00Z`);

function sposta(data: string, giorni: number): string {
  const d = aMezzogiorno(data);
  d.setUTCDate(d.getUTCDate() + giorni);
  return d.toISOString().slice(0, 10);
}

/** Dal lunedi' al venerdi': i giorni dei pranzi in abbonamento. */
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
  return `${a}-${String(m).padStart(2, "0")}-${String(Math.min(giorno, ultimo)).padStart(2, "0")}`;
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

/** I pranzi di un periodo: i giorni dal lunedi' al venerdi' fra `dal` e `al` compresi. */
export function pranziNelPeriodo({ dal, al }: PeriodoAbbonamento): number {
  let n = 0;
  for (let d = dal; d <= al; d = sposta(d, 1)) if (eFeriale(d)) n++;
  return n;
}

/**
 * Il prossimo pranzo di un abbonamento, da `oggi` compreso: il primo giorno
 * feriale del periodo che non e' gia' passato. null se il periodo e' finito.
 */
export function prossimoPranzo(inizio: string, oggi: string): string | null {
  const fine = fineAbbonamento(inizio);
  for (let d = inizio > oggi ? inizio : oggi; d <= fine; d = sposta(d, 1)) if (eFeriale(d)) return d;
  return null;
}

/**
 * Il periodo a parole, come le chiusure: "dal 5 ottobre al 4 novembre",
 * "dal 1° al 31 ottobre", con l'anno solo quando serve (`oggi` decide qual e'
 * l'anno corrente).
 */
export function frasePeriodo({ dal, al }: PeriodoAbbonamento, oggi: string): string {
  return periodo(dal, al, oggi);
}
