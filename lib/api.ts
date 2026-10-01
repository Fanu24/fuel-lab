/**
 * Il contratto fra il browser e le Pages Functions (functions/api/**).
 *
 * Qui stanno i tipi delle risposte e le funzioni che le chiamano: pagine,
 * pannello di Matteo e area cliente passano tutti da qui, cosi' un campo che
 * cambia nel server cambia in un posto solo. Le funzioni lanciano ApiError con
 * il messaggio del server (gia' in italiano) quando la risposta non e' ok.
 *
 * Regole comuni del server:
 * - GET senza effetti; POST/PUT/PATCH/DELETE vogliono Origin uguale al sito e
 *   corpo JSON;
 * - le date di calendario sono "YYYY-MM-DD" (fuso Europe/Rome), i timestamp
 *   sono "YYYY-MM-DD HH:MM:SS" in UTC come li scrive SQLite (CURRENT_TIMESTAMP);
 * - gli importi sono in centesimi di euro, interi;
 * - ogni errore delle API e' un JSON `{ error }` in italiano (anche 404, 405 e
 *   413: un percorso o un metodo che non esistono non rispondono con una pagina
 *   HTML); fa eccezione /api/auth, che risponde `{ message, code }` di better-auth
 *   (il testo e' inglese: le pagine lo traducono dal `code`, vedi lib/account.ts);
 * - `POST /api/orders` e' idempotente sui doppioni: se la stessa richiesta dello
 *   stesso cliente e' partita negli ultimi 10 minuti (e non e' annullata) il
 *   server risponde 200 con l'id di quella, invece di crearne un'altra.
 */

import type { Fascia, FormulaId, Nucleo } from "@/lib/abbonamento";
import type { Allenamenti, Piano } from "@/lib/settimana";

/* ---------- Tipi di base ---------- */

export type Ruolo = "customer" | "admin";

export type Utente = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role: Ruolo;
  /** Solo per l'account di Matteo quando l'email non e' ancora verificata. */
  adminInAttesa?: boolean;
};

export type Profilo = { phone: string; comune: string; address: string; preferences: string };

export type StatoOrdine = "requested" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
/**
 * "abbonamento": uno dei cinque abbonamenti mensili (lib/abbonamento.ts). Non
 * vuole piatti; la data preferita e' l'inizio desiderato, la data di ritiro o
 * consegna confermata da Matteo e' l'inizio del periodo di un mese.
 */
export type Servizio = "menu-settimana" | "abbonamento" | "sui-tuoi-macro" | "home-cooking";
export type Modalita = "pickup" | "delivery";

/**
 * Cosa ha scelto chi si abbona: la formula, la fascia, con chi (da solo, in
 * coppia, in famiglia: per lo sconto) e se parte dalla settimana di prova.
 * Solo per il servizio "abbonamento".
 */
export type SceltaAbbonamento = { plan: FormulaId; tier: Fascia; household: Nucleo; trial: boolean };

export type VoceOrdine = { id: string; name: string; day: string; meal: string; extras: string[] };

/** Un evento nella storia di un ordine. Il cliente vede solo `created`, `status` e `message`. */
export type EventoOrdine = {
  id: number;
  actor: "customer" | "admin" | "system";
  type: "created" | "status" | "schedule" | "note" | "message" | "price" | "payment" | "email";
  from_status: StatoOrdine | null;
  to_status: StatoOrdine | null;
  detail: string;
  created_at: string;
};

/**
 * Un ordine come lo restituisce GET /api/orders.
 * I campi segnati "solo admin" arrivano `undefined` al cliente.
 */
export type Ordine = {
  id: string;
  user_id: string;
  email: string;
  status: StatoOrdine;
  service: Servizio;
  fulfillment: Modalita;
  requested_date: string | null;
  production_date?: string | null; // solo admin
  fulfillment_date: string | null;
  customer_name: string;
  phone: string;
  comune: string;
  address: string;
  notes: string;
  internal_note?: string; // solo admin
  /** Messaggio di Matteo al cliente: il cliente lo vede nel suo account e nelle email. */
  customer_message: string;
  /** Totale concordato in centesimi; null finche' Matteo non lo scrive. */
  price_cents: number | null;
  /** 1 se Matteo ha segnato l'ordine come pagato. */
  paid: 0 | 1;
  dietary_preferences: string | null;
  meals: number;
  created_at: string;
  updated_at: string;
  items: VoceOrdine[];
  /** Solo admin: "web" se arriva dal sito, "manual" se Matteo l'ha inserito dal pannello. */
  source?: "web" | "manual";
  /** La scelta dell'abbonamento; null per tutti gli altri servizi. */
  subscription?: SceltaAbbonamento | null;
};

/** GET /api/orders/:id — per l'admin o per il proprietario. */
export type DettaglioOrdine = Ordine & {
  plan: Piano;
  training: Allenamenti;
  events: EventoOrdine[];
  /**
   * Solo admin: true se l'ordine e' intestato a un account dello staff, cioe'
   * inserito a mano per un cliente senza account. Niente email al cliente.
   */
  no_account?: boolean;
};

/** Il corpo di PATCH /api/orders/:id. Tutti i campi sono facoltativi. */
export type ModificaOrdine = {
  status?: StatoOrdine;
  productionDate?: string | null;
  fulfillmentDate?: string | null;
  internalNote?: string;
  customerMessage?: string;
  priceCents?: number | null;
  paid?: boolean;
  /** Solo abbonamenti: cambia formula, fascia, nucleo o prova (tutti e quattro i campi). Il totale non si ricalcola da solo. */
  subscription?: SceltaAbbonamento;
  /** Se true e lo stato cambia (o cambia il messaggio), il server scrive al cliente via email. */
  notify?: boolean;
  /**
   * Lo stato che Matteo aveva sotto gli occhi. Se nel frattempo e' cambiato
   * (per esempio il cliente ha annullato) il server risponde 409 e non tocca niente.
   */
  expectedStatus?: StatoOrdine;
};

/** Il corpo di POST /api/orders. */
export type NuovoOrdine = {
  name: string;
  phone: string;
  comune: string;
  address: string;
  service: Servizio;
  fulfillment: Modalita;
  /** Il giorno preferito; per l'abbonamento, l'inizio desiderato. */
  requestedDate: string | null;
  notes: string;
  /** Per l'abbonamento contano solo i pasti della formula (facoltativi). */
  plan: Piano;
  training: Allenamenti;
  /** Obbligatoria per l'abbonamento (la formula), ignorata per gli altri servizi. */
  subscription?: SceltaAbbonamento;
};

/**
 * Il corpo di POST /api/admin/orders: un ordine preso da Matteo per telefono,
 * WhatsApp o di persona. Con `customerId` l'ordine va nell'account del cliente
 * (nome, telefono, comune e indirizzo vuoti prendono quelli del profilo); senza,
 * resta intestato a Matteo e il cliente non riceve email.
 */
export type NuovoOrdineManuale = {
  customerId?: string | null;
  name: string;
  phone: string;
  comune: string;
  address: string;
  service: Servizio;
  fulfillment: Modalita;
  /** Ignorato per l'abbonamento: i pasti si compongono sulla scheda del cliente. */
  plan: Piano;
  /** Obbligatoria per l'abbonamento (la formula), ignorata per gli altri servizi. */
  subscription?: SceltaAbbonamento;
  /** Solo home cooking: porzioni concordate, anche senza piatti del menu. */
  meals?: number;
  productionDate?: string | null;
  fulfillmentDate?: string | null;
  /** "confirmed" vuole entrambe le date (per l'abbonamento sono entrambe l'inizio). */
  status: "requested" | "confirmed";
  /** Assente per l'abbonamento: vale il prezzo proposto da calcolaPrezzo (lib/abbonamento.ts). */
  priceCents?: number | null;
  paid?: boolean;
  internalNote?: string;
  /** Richieste del cliente (senza cipolla, porzioni grandi...). */
  notes?: string;
};

export type ClienteAdmin = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  phone: string;
  comune: string;
  address: string;
  preferences: string;
  orders: number;
  activeOrders: number;
  meals: number;
  lastOrderAt: string | null;
  /** Somma di price_cents degli ordini non annullati con prezzo. */
  spentCents: number;
  hasSavedPlan: boolean;
};

export type Metriche = {
  days: number;
  customers: number;
  newCustomers: number;
  ordersByStatus: { status: StatoOrdine; count: number }[];
  /** Un punto per ogni giorno dell'intervallo, anche a zero, dal piu' vecchio al piu' recente. */
  ordersDaily: { day: string; orders: number; meals: number }[];
  signupsDaily: { day: string; count: number }[];
  traffic: { day: string; views: number }[];
  topPages: { path: string; views: number }[];
  topDishes: { name: string; count: number }[];
  revenue: { agreedCents: number; paidCents: number; unpaidCents: number };
  messagesNew: number;
};

export type StatoMessaggio = "new" | "handled" | "archived";
export type ArgomentoMessaggio = "info" | "menu-settimana" | "abbonamento" | "sui-tuoi-macro" | "home-cooking" | "consegna" | "altro";

export type MessaggioContatto = {
  id: string;
  name: string;
  email: string;
  phone: string;
  comune: string;
  topic: ArgomentoMessaggio;
  message: string;
  status: StatoMessaggio;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

/** Il corpo di POST /api/contact. `website` e' l'esca per i bot: deve restare vuoto. */
export type NuovoMessaggio = {
  name: string;
  email: string;
  phone: string;
  comune: string;
  topic: ArgomentoMessaggio;
  message: string;
  website?: string;
};

export type Providers = { email: boolean; emailVerification: boolean; google: boolean; apple: boolean };

/** Un periodo in cui Matteo non cucina: `dal` e `al` compresi, "YYYY-MM-DD". */
export type Chiusura = { dal: string; al: string; motivo: string };

/** La striscia in cima alle pagine del sito. `link` e' un percorso interno ("/menu") o vuoto. */
export type AvvisoSito = { attivo: boolean; testo: string; link: string };

/**
 * Le impostazioni che Matteo cambia dal pannello e che il sito pubblico legge
 * nel browser (GET /api/settings). Una parte assente nel database vale il suo
 * predefinito vuoto: nessun piatto escluso, nessuna chiusura, avviso spento.
 */
export type Impostazioni = {
  /** Id di PIATTI (lib/catalogo.ts) che questa settimana non si possono scegliere. */
  piattiNonDisponibili: string[];
  /** Ordinate per data d'inizio. */
  chiusure: Chiusura[];
  avviso: AvvisoSito;
};

/** Sempre un oggetto nuovo: chi lo riceve lo puo' modificare senza toccare gli altri. */
export const impostazioniVuote = (): Impostazioni => ({
  piattiNonDisponibili: [],
  chiusure: [],
  avviso: { attivo: false, testo: "", link: "" },
});

/* ---------- Trasporto ---------- */

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function chiama<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...resto } = init ?? {};
  let response: Response;
  try {
    response = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      ...resto,
      headers: json === undefined ? resto.headers : { "Content-Type": "application/json", ...resto.headers },
      body: json === undefined ? resto.body : JSON.stringify(json),
    });
  } catch {
    throw new ApiError("Connessione assente. Controlla la rete e riprova.", 0);
  }
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Risposta senza JSON (es. 502 del proxy): resta null.
  }
  if (!response.ok) {
    const messaggio = body && typeof body === "object" && "error" in body && typeof body.error === "string"
      ? body.error
      : response.status === 401 ? "Accedi per continuare."
      : response.status === 403 ? "Non hai i permessi per questa operazione."
      : "Servizio non disponibile. Riprova tra poco.";
    throw new ApiError(messaggio, response.status);
  }
  return body as T;
}

/* ---------- Account e cliente ---------- */

export const api = {
  me: () => chiama<{ user: Utente | null }>("/api/me"),
  providers: () => chiama<Providers>("/api/providers"),

  profilo: () => chiama<{ profile: Profilo }>("/api/profile"),
  salvaProfilo: (profile: Profilo) => chiama<{ profile: Profilo }>("/api/profile", { method: "PUT", json: profile }),

  /** `updatedAt` e' anche la versione del piano (al millisecondo): serve a salvaPianoSe. */
  piano: () => chiama<{ plan: Piano | null; training: Allenamenti | null; updatedAt: string | null }>("/api/plan"),
  /** Sovrascrive qualunque versione ci sia nell'account. */
  salvaPiano: (plan: Piano, training: Allenamenti) =>
    chiama<{ plan: Piano; training: Allenamenti; updatedAt: string }>("/api/plan", { method: "PUT", json: { plan, training } }),
  /**
   * Salva solo se l'account e' ancora alla versione `ifUpdatedAt` (null: "non c'e'
   * niente"); se nel frattempo e' cambiata il server risponde 409 e non scrive.
   * `keepalive` lascia finire la richiesta anche mentre la pagina si chiude.
   */
  salvaPianoSe: (plan: Piano, training: Allenamenti, ifUpdatedAt: string | null, opzioni: { keepalive?: boolean } = {}) =>
    chiama<{ plan: Piano; training: Allenamenti; updatedAt: string }>("/api/plan", {
      method: "PUT",
      json: { plan, training, ifUpdatedAt },
      keepalive: opzioni.keepalive,
    }),

  /** Cliente: i suoi ultimi 50. Admin: tutti gli aperti + gli ultimi 100 chiusi. */
  ordini: () => chiama<{ orders: Ordine[]; historyLimit?: number }>("/api/orders"),
  ordine: (id: string) => chiama<{ order: DettaglioOrdine }>(`/api/orders/${encodeURIComponent(id)}`),
  inviaOrdine: (ordine: NuovoOrdine) => chiama<{ id: string; status: StatoOrdine }>("/api/orders", { method: "POST", json: ordine }),
  /** Admin: qualunque campo. Cliente: solo { status: "cancelled" } finche' l'ordine e' "requested". */
  modificaOrdine: (id: string, modifica: ModificaOrdine) =>
    chiama<{ order: Ordine }>(`/api/orders/${encodeURIComponent(id)}`, { method: "PATCH", json: modifica }),

  /** Tutti i dati dell'utente (GDPR). */
  esportaDati: () => chiama<Record<string, unknown>>("/api/account/export"),

  /** Pubblico: modulo contatti, anche senza account. */
  inviaMessaggio: (messaggio: NuovoMessaggio) => chiama<{ id: string }>("/api/contact", { method: "POST", json: messaggio }),

  /**
   * Pubblico: piatti non disponibili, chiusure e avviso. Il server permette al
   * browser di tenerle 60 secondi; `fresche` va comunque in rete e rinfresca
   * la copia del browser (il pannello, dopo un salvataggio).
   */
  impostazioni: (fresche = false) =>
    chiama<{ settings: Impostazioni }>("/api/settings", { cache: fresche ? "reload" : "default" }),
};

/* ---------- Solo Matteo ---------- */

export const adminApi = {
  clienti: () => chiama<{ customers: ClienteAdmin[] }>("/api/admin/customers"),
  /** Tutti gli ordini di un cliente (fino a 500), per la scheda cliente. */
  ordiniCliente: (userId: string) => chiama<{ orders: Ordine[] }>(`/api/orders?user=${encodeURIComponent(userId)}`),
  /** Ordine inserito a mano: nessuna email parte, ne' al cliente ne' a Matteo. */
  nuovoOrdine: (ordine: NuovoOrdineManuale) => chiama<{ order: Ordine }>("/api/admin/orders", { method: "POST", json: ordine }),
  metriche: (days = 30) => chiama<Metriche>(`/api/admin/metrics?days=${days}`),
  messaggi: () => chiama<{ messages: MessaggioContatto[] }>("/api/admin/messages"),
  modificaMessaggio: (id: string, status: StatoMessaggio) =>
    chiama<{ message: MessaggioContatto }>(`/api/admin/messages/${encodeURIComponent(id)}`, { method: "PATCH", json: { status } }),
  /**
   * Salva solo le parti presenti (piatti, chiusure, avviso): le altre restano
   * come sono. Ogni parte presente va mandata intera. Risponde con tutte le
   * impostazioni, come le leggera' il sito.
   */
  salvaImpostazioni: (modifica: Partial<Impostazioni>) =>
    chiama<{ settings: Impostazioni }>("/api/admin/settings", { method: "PUT", json: modifica }),
};

/* ---------- Etichette in italiano ---------- */

export const STATI_ORDINE: { id: StatoOrdine; label: string; cliente: string }[] = [
  { id: "requested", label: "Da confermare", cliente: "In attesa di conferma" },
  { id: "confirmed", label: "Confermato", cliente: "Confermato" },
  { id: "preparing", label: "In preparazione", cliente: "In preparazione" },
  { id: "ready", label: "Pronto", cliente: "Pronto" },
  { id: "completed", label: "Consegnato", cliente: "Consegnato" },
  { id: "cancelled", label: "Annullato", cliente: "Annullato" },
];

export const etichettaStato = (stato: string, per: "admin" | "cliente" = "admin") => {
  const s = STATI_ORDINE.find((x) => x.id === stato);
  return s ? (per === "admin" ? s.label : s.cliente) : stato;
};

export const ETICHETTE_SERVIZIO: Record<Servizio, string> = {
  "menu-settimana": "Menu della settimana",
  abbonamento: "Abbonamento mensile",
  "sui-tuoi-macro": "Sui tuoi macro",
  "home-cooking": "Home cooking",
};

export const ETICHETTE_ARGOMENTO: Record<ArgomentoMessaggio, string> = {
  info: "Informazioni",
  "menu-settimana": "Menu della settimana",
  abbonamento: "Abbonamento mensile",
  "sui-tuoi-macro": "Sui tuoi macro",
  "home-cooking": "Home cooking",
  consegna: "Consegna e ritiro",
  altro: "Altro",
};

export function euro(centesimi: number | null | undefined) {
  if (centesimi === null || centesimi === undefined) return "—";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(centesimi / 100);
}

/** "2026-09-27 14:03:11" (UTC di SQLite) -> Date. */
export function daSqlite(ts: string) {
  return new Date(ts.includes("T") ? ts : `${ts.replace(" ", "T")}Z`);
}
