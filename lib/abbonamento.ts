import { CONSEGNA_GRATIS_DA } from "./pricing";
import { INDIRIZZO } from "./sito";

/* =========================================================================
   L'abbonamento mensile ai pranzi, in un posto solo.

   Decisione del committente: 239 euro al mese per TUTTI i pranzi dal lunedi'
   al venerdi', per tutto il mese, composti sulla scheda del cliente (come si
   allena, i suoi obiettivi o la scheda del nutrizionista). Pagina
   /abbonamento, sezione in home, riquadro in /servizi e dati strutturati
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
