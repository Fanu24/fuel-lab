/**
 * Le regole delle richieste, senza D1 e senza Request: le Pages Functions
 * leggono il database e chiamano queste funzioni, i test le chiamano con
 * oggetti semplici. Cosa puo' fare Matteo, cosa puo' fare il cliente e cosa il
 * cliente puo' vedere si decide qui.
 */

import { calcolaPrezzo, eFascia, eFormulaId, eNucleo, etichettaFormula, fineAbbonamento, getFormula, NOMI_NUCLEO, type FormulaId } from "../abbonamento";
import { etichettaStato, type DettaglioOrdine, type EventoOrdine, type Modalita, type Ordine, type SceltaAbbonamento, type Servizio, type StatoOrdine, type VoceOrdine } from "../api";
import { getExtra, getPiatto } from "../catalogo";
import { GIORNI, PASTI, potaAllenamenti, potaPiano, type Allenamenti, type Piano } from "../settimana";
import { dataEstesa, dataValida, spostaGiorno, tsSqlite } from "./date";

export const STATI: readonly StatoOrdine[] = ["requested", "confirmed", "preparing", "ready", "completed", "cancelled"];
export const SERVIZI: readonly Servizio[] = ["menu-settimana", "abbonamento", "sui-tuoi-macro", "home-cooking"];
/** I servizi che partono anche senza piatti: l'home cooking si concorda, l'abbonamento si compone sulla scheda. */
export const SERVIZI_SENZA_PIATTI: readonly Servizio[] = ["abbonamento", "home-cooking"];
export const TIPI_EVENTO: readonly EventoOrdine["type"][] = ["created", "status", "schedule", "note", "message", "price", "payment", "email"];
/** Gli unici eventi che il cliente vede: il resto e' lavoro interno di Matteo. */
export const EVENTI_CLIENTE: readonly EventoOrdine["type"][] = ["created", "status", "message"];

export const MAX_NOTA_INTERNA = 2000;
export const MAX_MESSAGGIO_CLIENTE = 1000;
export const MAX_PREZZO_CENTESIMI = 1_000_000;

export type Esito<T> = { ok: true; value: T } | { ok: false; status: number; error: string };

const errore = (status: number, error: string) => ({ ok: false as const, status, error });

export const eStato = (value: unknown): value is StatoOrdine =>
  typeof value === "string" && (STATI as readonly string[]).includes(value);

const testo = (value: unknown) => (typeof value === "string" ? value : value === null || value === undefined ? "" : String(value));
const testoONull = (value: unknown) => (typeof value === "string" && value ? value : null);

function leggiJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== "string" || !raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Una riga di D1: `SELECT o.*, u.email, p.preferences AS dietary_preferences ...`. */
export type RigaOrdine = Record<string, unknown>;

/**
 * La scelta di un abbonamento dalle colonne sub_*. Prima della migrazione 0006
 * (e per gli abbonamenti nati prima delle cinque formule) mancano: erano pranzi
 * dal lunedi' al venerdi', cioe' la formula Pranzo, Standard, da soli.
 */
export function sceltaDaRiga(row: RigaOrdine): SceltaAbbonamento {
  return {
    plan: eFormulaId(row.sub_plan) ? row.sub_plan : "pranzo",
    tier: eFascia(row.sub_tier) ? row.sub_tier : "standard",
    household: eNucleo(row.sub_household) ? row.sub_household : "singolo",
    trial: Number(row.sub_trial) === 1,
  };
}

/**
 * Da riga del database a `Ordine`, campo per campo: niente spread della riga,
 * cosi' plan_json, colonne future o note interne non escono per sbaglio.
 */
export function ordineDaRiga(row: RigaOrdine, admin: boolean): Ordine {
  const ordine: Ordine = {
    id: testo(row.id),
    user_id: testo(row.user_id),
    email: testo(row.email),
    status: eStato(row.status) ? row.status : "requested",
    service: (SERVIZI as readonly unknown[]).includes(row.service) ? row.service as Servizio : "menu-settimana",
    fulfillment: row.fulfillment === "delivery" ? "delivery" : "pickup",
    requested_date: testoONull(row.requested_date),
    fulfillment_date: testoONull(row.fulfillment_date),
    customer_name: testo(row.customer_name),
    phone: testo(row.phone),
    comune: testo(row.comune),
    address: testo(row.address),
    notes: testo(row.notes),
    customer_message: testo(row.customer_message),
    price_cents: typeof row.price_cents === "number" ? row.price_cents : null,
    paid: Number(row.paid) === 1 ? 1 : 0,
    dietary_preferences: typeof row.dietary_preferences === "string" ? row.dietary_preferences : null,
    meals: Number(row.meals) || 0,
    created_at: tsSqlite(row.created_at) ?? testo(row.created_at),
    updated_at: tsSqlite(row.updated_at) ?? testo(row.updated_at),
    items: leggiJson<VoceOrdine[]>(row.items_json, []),
    subscription: null,
  };
  if (ordine.service === "abbonamento") ordine.subscription = sceltaDaRiga(row);
  if (admin) {
    ordine.production_date = testoONull(row.production_date);
    ordine.internal_note = testo(row.internal_note);
    // Prima della migrazione 0004 la colonna non c'e': tutto cio' che non e' "manual" arriva dal sito.
    ordine.source = row.source === "manual" ? "manual" : "web";
  }
  return ordine;
}

export function eventoDaRiga(row: Record<string, unknown>): EventoOrdine {
  return {
    id: Number(row.id),
    actor: row.actor === "admin" || row.actor === "system" ? row.actor : "customer",
    type: (TIPI_EVENTO as readonly unknown[]).includes(row.type) ? row.type as EventoOrdine["type"] : "status",
    from_status: eStato(row.from_status) ? row.from_status : null,
    to_status: eStato(row.to_status) ? row.to_status : null,
    detail: testo(row.detail),
    created_at: tsSqlite(row.created_at) ?? testo(row.created_at),
  };
}

export function eventiPerCliente(eventi: EventoOrdine[]): EventoOrdine[] {
  return eventi.filter((evento) => EVENTI_CLIENTE.includes(evento.type));
}

export function dettaglioDaRiga(row: RigaOrdine, eventi: EventoOrdine[], admin: boolean): DettaglioOrdine {
  const ordinati = [...eventi].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id);
  return {
    ...ordineDaRiga(row, admin),
    plan: potaPiano(leggiJson<unknown>(row.plan_json, {})),
    training: potaAllenamenti(leggiJson<unknown>(row.training_json, {})),
    events: admin ? ordinati : eventiPerCliente(ordinati),
  };
}

/* ---------- Nuova richiesta dal cliente ---------- */

const campo = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/** Le righe della richiesta, lette dal piano: solo piatti ed extra che il catalogo conosce ancora. */
export function vociDalPiano(plan: Piano): VoceOrdine[] {
  const voci: VoceOrdine[] = [];
  for (const day of GIORNI) for (const meal of PASTI) {
    const slot = plan[day]?.[meal];
    if (!slot?.piatto) continue;
    const dish = getPiatto(slot.piatto);
    if (!dish) continue;
    voci.push({
      id: dish.id,
      name: dish.nome,
      day,
      meal,
      extras: slot.extra.map((id) => getExtra(id)?.nome).filter((nome): nome is string => !!nome),
    });
  }
  return voci;
}

/**
 * Per l'abbonamento il piano allegato vale solo per i pasti della formula: i
 * giorni e i pasti che non ne fanno parte (la cena per Pranzo, il fine
 * settimana per Leggero...) non si cucinano, e lasciarli nella richiesta farebbe
 * credere a Matteo che vadano cucinati. Il compositore ha solo pranzo e cena:
 * la colazione non e' mai nel piano.
 */
export function soloPastiDellaFormula(plan: Piano, formula: FormulaId): Piano {
  const { giorni, pasti } = getFormula(formula);
  const out: Piano = {};
  GIORNI.forEach((g, i) => {
    // GIORNI parte dal lunedi' (indice 0): getUTCDay() vuole 1 per il lunedi', 0 per la domenica.
    if (!giorni.includes((i + 1) % 7)) return;
    for (const pasto of PASTI) {
      const casella = plan[g]?.[pasto];
      if (casella && pasti.includes(pasto)) out[g] = { ...out[g], [pasto]: casella };
    }
  });
  return out;
}

/**
 * La scelta dell'abbonamento dal corpo della richiesta: la formula e' obbligatoria,
 * fascia, nucleo e prova hanno un valore di partenza (Standard, da solo, senza
 * prova). Un valore che non esiste e' un errore, non un default silenzioso.
 */
export function leggiSceltaAbbonamento(value: unknown): Esito<SceltaAbbonamento> {
  const v = value && typeof value === "object" ? value as Record<string, unknown> : {};
  if (!eFormulaId(v.plan)) return errore(400, "Scegli la formula dell'abbonamento");
  if (v.tier !== undefined && !eFascia(v.tier)) return errore(400, "Fascia non valida: Standard o Plus");
  if (v.household !== undefined && !eNucleo(v.household)) return errore(400, "Scegli se ti abboni da solo, in coppia o in famiglia");
  if (v.trial !== undefined && typeof v.trial !== "boolean") return errore(400, "Scelta della settimana di prova non valida");
  return {
    ok: true,
    value: { plan: v.plan, tier: v.tier ?? "standard", household: v.household ?? "singolo", trial: v.trial === true },
  };
}

/** Il prezzo che parte con un abbonamento, in centesimi: una proposta finche' Matteo non conferma. */
export const prezzoProposto = (scelta: SceltaAbbonamento, fulfillment: Modalita) =>
  calcolaPrezzo({ formula: scelta.plan, fascia: scelta.tier, ritiro: fulfillment === "pickup", nucleo: scelta.household }).totaleCentesimi;

export type NuovoOrdineValido = {
  name: string;
  phone: string;
  comune: string;
  address: string;
  notes: string;
  service: Servizio;
  fulfillment: Modalita;
  requestedDate: string | null;
  plan: Piano;
  training: Allenamenti;
  items: VoceOrdine[];
  /** La proposta che parte con la richiesta: solo per l'abbonamento (prezzo della formula, con lo sconto che spetta), altrimenti null. */
  priceCents: number | null;
  /** La formula scelta: solo per l'abbonamento. */
  subscription: SceltaAbbonamento | null;
};

/**
 * Valida il corpo di POST /api/orders. `oggi` e' il giorno a Pescara.
 * Per l'abbonamento `requestedDate` e' l'inizio desiderato, i piatti non
 * servono, la formula e' obbligatoria e il prezzo proposto e' quello di
 * calcolaPrezzo (lib/abbonamento.ts) per formula, fascia, ritiro e nucleo.
 */
export function leggiNuovoOrdine(body: Record<string, unknown>, nomeAccount: string, oggi: string): Esito<NuovoOrdineValido> {
  const name = campo(body.name, 100) || nomeAccount.trim().slice(0, 100);
  const phone = campo(body.phone, 40);
  const comune = campo(body.comune, 100);
  const address = campo(body.address, 240);
  const notes = campo(body.notes, 1500);
  const fulfillment = body.fulfillment === "pickup" || body.fulfillment === "delivery" ? body.fulfillment : null;
  const service = (SERVIZI as readonly unknown[]).includes(body.service) ? body.service as Servizio : "menu-settimana";
  const requestedDate = dataValida(body.requestedDate) ? body.requestedDate : null;
  if (!name || phone.replace(/\D/g, "").length < 9 || !comune || !fulfillment || (fulfillment === "delivery" && !address)) {
    return errore(400, "Completa nome, telefono e dati di ritiro o consegna");
  }
  if (requestedDate && (requestedDate < oggi || requestedDate > spostaGiorno(oggi, 90))) {
    return errore(400, "Scegli una data nei prossimi 90 giorni");
  }
  const abbonamento = service === "abbonamento";
  let subscription: SceltaAbbonamento | null = null;
  if (abbonamento) {
    const scelta = leggiSceltaAbbonamento(body.subscription);
    if (!scelta.ok) return scelta;
    subscription = scelta.value;
  }
  const plan = subscription ? soloPastiDellaFormula(potaPiano(body.plan), subscription.plan) : potaPiano(body.plan);
  const training = potaAllenamenti(body.training);
  const items = vociDalPiano(plan);
  if (!SERVIZI_SENZA_PIATTI.includes(service) && !items.length) return errore(400, "Componi almeno un piatto prima di inviare");
  const priceCents = subscription ? prezzoProposto(subscription, fulfillment) : null;
  return { ok: true, value: { name, phone, comune, address, notes, service, fulfillment, requestedDate, plan, training, items, priceCents, subscription } };
}

/* ---------- Modifiche di Matteo ---------- */

/** I campi dell'ordine che Matteo puo' cambiare, come stanno nel database. */
export type StatoModificabile = {
  status: StatoOrdine;
  production_date: string | null;
  fulfillment_date: string | null;
  internal_note: string;
  customer_message: string;
  price_cents: number | null;
  paid: 0 | 1;
  /** La formula dell'abbonamento; null (o assente) per gli altri servizi. */
  subscription?: SceltaAbbonamento | null;
};

export type Cambio = Pick<EventoOrdine, "type" | "from_status" | "to_status" | "detail">;

export type ModificaValida = {
  next: StatoModificabile;
  cambi: Cambio[];
  /** true se il cliente va avvisato via email: notify chiesto e cambia lo stato o arriva un messaggio. */
  avvisaCliente: boolean;
};

const AVANZATI: readonly StatoOrdine[] = ["confirmed", "preparing", "ready", "completed"];

function leggiData(value: unknown, attuale: string | null): { ok: true; value: string | null } | { ok: false } {
  if (value === undefined) return { ok: true, value: attuale };
  if (value === null || value === "") return { ok: true, value: null };
  if (typeof value === "string" && dataValida(value.trim())) return { ok: true, value: value.trim() };
  return { ok: false };
}

/** "€ 45,00" senza Intl: stesso risultato nel Worker, in Node e nei test. */
export function euroTesto(centesimi: number): string {
  const euro = Math.floor(Math.abs(centesimi) / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const cent = String(Math.abs(centesimi) % 100).padStart(2, "0");
  return `${centesimi < 0 ? "-" : ""}€ ${euro},${cent}`;
}

/** La scelta a parole per la cronologia: "Formula: Completo · Plus, in coppia, con la settimana di prova". */
export function descriviFormula(scelta: SceltaAbbonamento): string {
  return `Formula: ${etichettaFormula(scelta.plan, scelta.tier)}, ${NOMI_NUCLEO[scelta.household].toLowerCase()}${scelta.trial ? ", con la settimana di prova" : ""}`;
}

/** L'evento delle date nella cronologia. Per l'abbonamento le date sono l'inizio, e si scrive fin quando vale. */
export function descriviDate(fulfillment: Modalita, produzione: string | null, consegna: string | null, servizio?: Servizio): string {
  const quando = (day: string | null) => (day ? dataEstesa(day) : "da fissare");
  if (servizio === "abbonamento") {
    const inizio = consegna ?? produzione;
    return inizio && dataValida(inizio) ? `Inizio: ${dataEstesa(inizio)}, fino a ${dataEstesa(fineAbbonamento(inizio))}` : "Inizio: da fissare";
  }
  return `Produzione: ${quando(produzione)} · ${fulfillment === "delivery" ? "Consegna" : "Ritiro"}: ${quando(consegna)}`;
}

/**
 * Valida il corpo di PATCH /api/orders/:id per Matteo e calcola cosa cambia.
 * Ogni campo assente resta com'e'; ogni campo cambiato produce un evento.
 */
export function leggiModificaAdmin(
  body: Record<string, unknown>,
  current: StatoModificabile,
  fulfillment: Modalita,
  servizio?: Servizio,
): Esito<ModificaValida> {
  if (body.status !== undefined && !eStato(body.status)) return errore(400, "Stato non valido");
  const status = body.status === undefined ? current.status : body.status as StatoOrdine;

  const produzione = leggiData(body.productionDate, current.production_date);
  const consegna = leggiData(body.fulfillmentDate, current.fulfillment_date);
  if (!produzione.ok || !consegna.ok) return errore(400, "Data non valida");
  if (produzione.value && consegna.value && produzione.value > consegna.value) {
    return errore(400, "La produzione non può essere dopo il ritiro o la consegna");
  }
  const statoCambiato = status !== current.status;
  const dateCambiate = produzione.value !== current.production_date || consegna.value !== current.fulfillment_date;
  // Le vecchie richieste avanzate senza date restano modificabili (prezzo, note):
  // il vincolo scatta quando si cambia lo stato o si toccano le date.
  if (AVANZATI.includes(status) && (!produzione.value || !consegna.value) && (statoCambiato || dateCambiate)) {
    return errore(400, "Assegna le date di produzione e ritiro o consegna prima di avanzare l'ordine");
  }

  if (body.internalNote !== undefined && typeof body.internalNote !== "string") return errore(400, "Nota interna non valida");
  const nota = typeof body.internalNote === "string" ? body.internalNote.trim() : current.internal_note;
  if (nota.length > MAX_NOTA_INTERNA) return errore(400, `La nota interna può avere al massimo ${MAX_NOTA_INTERNA} caratteri`);

  if (body.customerMessage !== undefined && typeof body.customerMessage !== "string") return errore(400, "Messaggio non valido");
  const messaggio = typeof body.customerMessage === "string" ? body.customerMessage.trim() : current.customer_message;
  if (messaggio.length > MAX_MESSAGGIO_CLIENTE) {
    return errore(400, `Il messaggio al cliente può avere al massimo ${MAX_MESSAGGIO_CLIENTE} caratteri`);
  }

  let prezzo = current.price_cents;
  if (body.priceCents !== undefined) {
    if (body.priceCents === null) prezzo = null;
    else if (typeof body.priceCents === "number" && Number.isInteger(body.priceCents) && body.priceCents >= 0 && body.priceCents <= MAX_PREZZO_CENTESIMI) {
      prezzo = body.priceCents;
    } else return errore(400, "Totale non valido: usa i centesimi, da 0 a 10.000 €");
  }

  if (body.paid !== undefined && typeof body.paid !== "boolean") return errore(400, "Pagamento non valido");
  const pagato: 0 | 1 = body.paid === undefined ? current.paid : body.paid ? 1 : 0;

  if (body.notify !== undefined && typeof body.notify !== "boolean") return errore(400, "Scelta di avviso non valida");

  // La formula si puo' cambiare solo su un abbonamento (il cliente passa da Completo a Full 6...): il totale
  // resta quello scritto, e' un campo a parte che Matteo aggiorna insieme.
  let formula = current.subscription ?? null;
  if (body.subscription !== undefined) {
    if (servizio !== "abbonamento") return errore(400, "La formula si sceglie solo per gli abbonamenti");
    const scelta = leggiSceltaAbbonamento(body.subscription);
    if (!scelta.ok) return scelta;
    formula = scelta.value;
  }
  const formulaCambiata = JSON.stringify(formula) !== JSON.stringify(current.subscription ?? null);

  const cambi: Cambio[] = [];
  const evento = (type: Cambio["type"], detail: string, from_status: StatoOrdine | null = null, to_status: StatoOrdine | null = null) =>
    cambi.push({ type, detail, from_status, to_status });
  if (statoCambiato) evento("status", "", current.status, status);
  if (dateCambiate) evento("schedule", descriviDate(fulfillment, produzione.value, consegna.value, servizio));
  if (nota !== current.internal_note) evento("note", nota || "Nota interna cancellata");
  const messaggioCambiato = messaggio !== current.customer_message;
  if (messaggioCambiato) evento("message", messaggio || "Messaggio rimosso");
  if (prezzo !== current.price_cents) evento("price", prezzo === null ? "Totale rimosso" : `Totale concordato: ${euroTesto(prezzo)}`);
  if (pagato !== current.paid) evento("payment", pagato ? "Segnato come pagato" : "Segnato come non pagato");
  if (formulaCambiata && formula) evento("note", descriviFormula(formula));

  return {
    ok: true,
    value: {
      next: {
        status,
        production_date: produzione.value,
        fulfillment_date: consegna.value,
        internal_note: nota,
        customer_message: messaggio,
        price_cents: prezzo,
        paid: pagato,
        subscription: formula,
      },
      cambi,
      avvisaCliente: body.notify === true && (statoCambiato || (messaggioCambiato && messaggio !== "")),
    },
  };
}

/* ---------- Concorrenza ---------- */

/** Il 409 quando l'ordine non e' piu' nello stato che Matteo aveva sotto gli occhi. */
export const erroreStatoCambiato = (stato: StatoOrdine) =>
  `L'ordine è cambiato nel frattempo: ora è «${etichettaStato(stato)}». Ho ricaricato la scheda, controlla e riprova.`;

/**
 * `expectedStatus` nel corpo di PATCH: lo stato che il pannello mostrava quando
 * Matteo ha premuto il bottone. Assente o null (client vecchi) -> nessun
 * controllo. Uno stato sconosciuto -> 400: un controllo di concorrenza
 * illeggibile non deve passare in silenzio. Diverso dallo stato nel database
 * -> 409 e la Function non tocca niente.
 */
export function controllaStatoAtteso(body: Record<string, unknown>, attuale: StatoOrdine): Esito<null> {
  const atteso = body.expectedStatus;
  if (atteso === undefined || atteso === null) return { ok: true, value: null };
  if (!eStato(atteso)) return errore(400, "Stato atteso non valido");
  if (atteso !== attuale) return errore(409, erroreStatoCambiato(attuale));
  return { ok: true, value: null };
}

/* ---------- Annullamento del cliente ---------- */

/**
 * Il cliente puo' solo annullare la propria richiesta finche' Matteo non l'ha
 * presa in carico. Chi non e' il proprietario riceve 404: non serve sapere che
 * quell'id esiste.
 */
export function leggiAnnullamentoCliente(
  body: Record<string, unknown>,
  current: { status: string; user_id: string },
  userId: string,
): Esito<null> {
  if (current.user_id !== userId) return errore(404, "Richiesta non trovata");
  const chiavi = Object.keys(body);
  if (body.status !== "cancelled" || chiavi.some((chiave) => chiave !== "status")) {
    return errore(403, "Puoi solo annullare la tua richiesta: per altre modifiche scrivi a info@fuelchef.it");
  }
  if (current.status === "cancelled") return errore(409, "Questa richiesta è già annullata");
  if (current.status !== "requested") {
    return errore(409, "Matteo ha già preso in carico questa richiesta: per annullarla scrivi a info@fuelchef.it");
  }
  return { ok: true, value: null };
}
