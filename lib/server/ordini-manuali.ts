/**
 * Gli ordini che Matteo inserisce a mano dal pannello: richieste arrivate per
 * telefono, WhatsApp o di persona. Come lib/server/ordini.ts, niente D1 e
 * niente Request: la Function legge il cliente dal database e passa qui il
 * corpo della richiesta, i test passano oggetti semplici.
 *
 * Le righe (items) si ricavano dal piano con lo stesso vociDalPiano del sito,
 * cosi' un ordine a mano arriva in Oggi, nel foglio Cucina, nella spesa e
 * nelle etichette esattamente come una richiesta dal sito.
 *
 * L'abbonamento a mano non ha piatti (i pasti si compongono sulla scheda del
 * cliente, scritta nelle note), vuole la formula (con fascia, nucleo e prova)
 * e, se Matteo non scrive un prezzo, prende quello proposto da
 * lib/abbonamento.ts per quella scelta. Le due date sono entrambe l'inizio.
 */

import type { Modalita, SceltaAbbonamento, Servizio, VoceOrdine } from "../api";
import { potaPiano, type Piano } from "../settimana";
import { dataValida, spostaGiorno } from "./date";
import { MAX_NOTA_INTERNA, MAX_PREZZO_CENTESIMI, SERVIZI, leggiSceltaAbbonamento, prezzoProposto, vociDalPiano, type Esito } from "./ordini";

/** Gli stati da cui puo' partire un ordine a mano. */
export const STATI_INIZIALI = ["requested", "confirmed"] as const;
export type StatoIniziale = (typeof STATI_INIZIALI)[number];

export const MAX_NOTE_CLIENTE = 1500;
/** Home cooking: porzioni concordate senza piatti del menu. */
export const MAX_PORZIONI_MANUALI = 100;
/** Le date si accettano da un mese fa (ordine registrato dopo) a un anno avanti (errori di battitura). */
export const GIORNI_PASSATI_AMMESSI = 30;
export const GIORNI_FUTURI_AMMESSI = 365;

/** Il cliente registrato scelto da Matteo, con i dati del profilo (vuoti se mancano). */
export type ClienteRegistrato = { id: string; name: string; phone: string; comune: string; address: string };

export type OrdineManualeValido = {
  /** null: ordine per un cliente senza account, resta intestato a Matteo. */
  customerId: string | null;
  name: string;
  phone: string;
  comune: string;
  address: string;
  notes: string;
  internalNote: string;
  service: Servizio;
  fulfillment: Modalita;
  status: StatoIniziale;
  productionDate: string | null;
  fulfillmentDate: string | null;
  /** Il giorno che il cliente aspetta: per le richieste da confermare e' la data mostrata in lista. */
  requestedDate: string | null;
  priceCents: number | null;
  paid: 0 | 1;
  plan: Piano;
  items: VoceOrdine[];
  meals: number;
  /** La formula: solo per l'abbonamento. */
  subscription: SceltaAbbonamento | null;
};

const errore = (status: number, error: string) => ({ ok: false as const, status, error });

/** Testo su una riga: niente caratteri di controllo (finiscono in email e CSV), spazi compattati. */
const riga = (value: unknown, max: number) =>
  typeof value === "string" ? value.replace(/\p{Cc}+/gu, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";

/** Testo libero: tiene gli a capo. `null` se non e' una stringa. */
const testoLibero = (value: unknown) =>
  typeof value === "string" ? value.replace(/\r\n?/g, "\n").replace(/[^\P{Cc}\n\t]/gu, "").trim() : null;

/** L'id del cliente scelto, se c'e'. Serve alla Function per caricarlo prima di validare il resto. */
export function leggiIdCliente(body: Record<string, unknown>): Esito<string | null> {
  const id = body.customerId;
  if (id === undefined || id === null || id === "") return { ok: true, value: null };
  if (typeof id !== "string" || !/^[\w-]{1,100}$/.test(id.trim())) return errore(400, "Cliente non valido");
  return { ok: true, value: id.trim() };
}

function leggiData(value: unknown): { ok: true; value: string | null } | { ok: false } {
  if (value === undefined || value === null || value === "") return { ok: true, value: null };
  if (typeof value === "string" && dataValida(value.trim())) return { ok: true, value: value.trim() };
  return { ok: false };
}

/**
 * Valida il corpo di POST /api/admin/orders. `oggi` e' il giorno a Pescara,
 * `cliente` il cliente registrato gia' caricato (null per chi non ha account):
 * i campi lasciati vuoti prendono i suoi dati del profilo.
 */
export function leggiOrdineManuale(
  body: Record<string, unknown>,
  oggi: string,
  cliente: ClienteRegistrato | null,
): Esito<OrdineManualeValido> {
  const name = riga(body.name, 100) || (cliente ? riga(cliente.name, 100) : "");
  if (!name) return errore(400, "Scrivi il nome del cliente");
  const phone = riga(body.phone, 40) || (cliente ? riga(cliente.phone, 40) : "");
  if (phone.replace(/\D/g, "").length < 9) return errore(400, "Scrivi il telefono del cliente (almeno 9 cifre)");
  const comune = riga(body.comune, 100) || (cliente ? riga(cliente.comune, 100) : "");
  const address = riga(body.address, 240) || (cliente ? riga(cliente.address, 240) : "");

  if (body.fulfillment !== "pickup" && body.fulfillment !== "delivery") return errore(400, "Scegli ritiro o consegna");
  const fulfillment: Modalita = body.fulfillment;
  if (fulfillment === "delivery" && (!address || !comune)) return errore(400, "Per la consegna servono indirizzo e comune");

  if (body.service !== undefined && !(SERVIZI as readonly unknown[]).includes(body.service)) return errore(400, "Servizio non valido");
  const service = (body.service ?? "menu-settimana") as Servizio;

  if (body.status !== undefined && !(STATI_INIZIALI as readonly unknown[]).includes(body.status)) {
    return errore(400, "Stato iniziale non valido: scegli da confermare o già confermato");
  }
  const status = (body.status ?? "requested") as StatoIniziale;

  const produzione = leggiData(body.productionDate);
  const uscita = leggiData(body.fulfillmentDate);
  if (!produzione.ok || !uscita.ok) return errore(400, "Data non valida");
  const primo = spostaGiorno(oggi, -GIORNI_PASSATI_AMMESSI);
  const ultimo = spostaGiorno(oggi, GIORNI_FUTURI_AMMESSI);
  for (const d of [produzione.value, uscita.value]) {
    if (d && (d < primo || d > ultimo)) return errore(400, "Le date devono stare fra un mese fa e un anno da oggi");
  }
  if (produzione.value && uscita.value && produzione.value > uscita.value) {
    return errore(400, "La produzione non può essere dopo il ritiro o la consegna");
  }
  if (status === "confirmed" && (!produzione.value || !uscita.value)) {
    return errore(400, "Per un ordine già confermato servono le date di produzione e di ritiro o consegna");
  }

  const abbonamento = service === "abbonamento";
  if (abbonamento && produzione.value && uscita.value && produzione.value !== uscita.value) {
    return errore(400, "Per l'abbonamento le due date sono l'inizio: devono coincidere");
  }

  let subscription: SceltaAbbonamento | null = null;
  if (abbonamento) {
    const scelta = leggiSceltaAbbonamento(body.subscription);
    if (!scelta.ok) return scelta;
    subscription = scelta.value;
  }

  // Un prezzo assente vale quello proposto per la formula; null resta "senza prezzo", scelto da Matteo.
  let priceCents: number | null = subscription && body.priceCents === undefined ? prezzoProposto(subscription, fulfillment) : null;
  if (body.priceCents !== undefined && body.priceCents !== null) {
    if (typeof body.priceCents !== "number" || !Number.isInteger(body.priceCents) || body.priceCents < 0 || body.priceCents > MAX_PREZZO_CENTESIMI) {
      return errore(400, "Totale non valido: usa i centesimi, da 0 a 10.000 €");
    }
    priceCents = body.priceCents;
  }

  if (body.paid !== undefined && typeof body.paid !== "boolean") return errore(400, "Pagamento non valido");
  const paid: 0 | 1 = body.paid ? 1 : 0;

  const internalNote = body.internalNote === undefined ? "" : testoLibero(body.internalNote);
  if (internalNote === null) return errore(400, "Nota interna non valida");
  if (internalNote.length > MAX_NOTA_INTERNA) return errore(400, `La nota interna può avere al massimo ${MAX_NOTA_INTERNA} caratteri`);
  const notes = body.notes === undefined ? "" : testoLibero(body.notes);
  if (notes === null) return errore(400, "Note non valide");
  if (notes.length > MAX_NOTE_CLIENTE) return errore(400, `Le note possono avere al massimo ${MAX_NOTE_CLIENTE} caratteri`);

  // Abbonamento: niente piatti e niente porzioni, i pasti del mese li conta il pannello dalla formula e dal periodo.
  const plan = abbonamento ? {} : potaPiano(body.plan);
  const items = vociDalPiano(plan);
  let meals = items.length;
  if (service === "home-cooking") {
    // Le porzioni concordate contano anche senza piatti; se ce ne sono di piu' nel piano, vince il piano.
    if (body.meals !== undefined && body.meals !== null) {
      if (typeof body.meals !== "number" || !Number.isInteger(body.meals) || body.meals < 0 || body.meals > MAX_PORZIONI_MANUALI) {
        return errore(400, `Porzioni non valide: da 0 a ${MAX_PORZIONI_MANUALI}`);
      }
      meals = Math.max(items.length, body.meals);
    }
  } else if (!abbonamento && !items.length) {
    return errore(400, "Scegli almeno un piatto");
  }

  return {
    ok: true,
    value: {
      customerId: cliente?.id ?? null,
      name,
      phone,
      comune,
      address,
      notes,
      internalNote,
      service,
      fulfillment,
      status,
      productionDate: produzione.value,
      fulfillmentDate: uscita.value,
      requestedDate: uscita.value ?? produzione.value,
      priceCents,
      paid,
      plan,
      items,
      meals,
      subscription,
    },
  };
}
