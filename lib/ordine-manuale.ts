/* =========================================================================
   "Nuovo ordine a mano": la logica pura del modulo nel pannello di Matteo.

   Matteo prende un ordine al telefono e lo scrive in fretta: qui ci sono i
   campi del modulo, la ricerca fra i clienti registrati, il riempimento
   rapido della griglia ("stesso piatto per N porzioni"), i controlli prima
   dell'invio e il corpo di POST /api/admin/orders. Niente React e niente
   rete: i test la provano cosi' com'e'. Il server rifa' tutti i controlli
   (lib/server/ordini-manuali.ts), questi servono a dirlo prima e accanto al
   campo giusto.

   L'abbonamento mensile non ha piatti ne' porzioni: ha una data d'inizio
   (scritta in entrambe le date dell'ordine), la scelta della formula (una
   delle cinque, la fascia, chi si abbona) e un prezzo
   che il modulo propone con calcolaPrezzo (lib/abbonamento.ts) e Matteo puo'
   cambiare.
   ========================================================================= */

import { FORMULA_CONSIGLIATA, calcolaPrezzo, type Fascia, type FormulaId, type Nucleo } from "@/lib/abbonamento";
import type { ClienteAdmin, Modalita, NuovoOrdineManuale, Servizio } from "@/lib/api";
import { getPiatto } from "@/lib/catalogo";
import { centesimiInTesto, leggiEuro } from "@/lib/operazioni";
import { conCasella, GIORNI, PASTI, type GiornoSettimana, type Piano } from "@/lib/settimana";

export type ModoCliente = "registrato" | "senza-account";
export type StatoIniziale = NuovoOrdineManuale["status"];

export type CampiNuovoOrdine = {
  modo: ModoCliente;
  /** Il cliente registrato scelto; null finche' Matteo non lo sceglie (o senza account). */
  cliente: ClienteAdmin | null;
  nome: string;
  telefono: string;
  comune: string;
  indirizzo: string;
  servizio: Servizio;
  modalita: Modalita;
  /** Solo abbonamento: la formula, la fascia e chi si abbona. */
  formula: FormulaId;
  fascia: Fascia;
  nucleo: Nucleo;
  piano: Piano;
  /** Solo home cooking: porzioni concordate, scritte a mano. */
  porzioni: string;
  stato: StatoIniziale;
  produzione: string;
  uscita: string;
  prezzo: string;
  pagato: boolean;
  /** Nota interna: il cliente non la vede. */
  nota: string;
  /** Richieste del cliente. */
  note: string;
};

export const MAX_PORZIONI = 100;
export const MAX_PREZZO_EURO = 10_000;

export function campiVuoti(modo: ModoCliente = "registrato"): CampiNuovoOrdine {
  return {
    modo,
    cliente: null,
    nome: "",
    telefono: "",
    comune: "",
    indirizzo: "",
    servizio: "menu-settimana",
    modalita: "pickup",
    formula: FORMULA_CONSIGLIATA,
    fascia: "standard",
    nucleo: "singolo",
    piano: {},
    porzioni: "",
    stato: "requested",
    produzione: "",
    uscita: "",
    prezzo: "",
    pagato: false,
    nota: "",
    note: "",
  };
}

/** Sceglie un cliente registrato e copia nel modulo i dati del suo profilo (restano modificabili). */
export function conCliente(campi: CampiNuovoOrdine, cliente: ClienteAdmin): CampiNuovoOrdine {
  return {
    ...campi,
    modo: "registrato",
    cliente,
    nome: cliente.name,
    telefono: cliente.phone,
    comune: cliente.comune,
    indirizzo: cliente.address,
  };
}

/* ---------- Servizio ---------- */

/** Le scelte da cui dipende il prezzo di un abbonamento. */
type SceltaPrezzo = Pick<CampiNuovoOrdine, "formula" | "fascia" | "nucleo" | "modalita">;

const centesimiProposti = (c: SceltaPrezzo) =>
  calcolaPrezzo({ formula: c.formula, fascia: c.fascia, ritiro: c.modalita === "pickup", nucleo: c.nucleo }).totaleCentesimi;

/** "468,00": il prezzo al mese che si propone per la scelta fatta, come lo scrive il campo. */
export const prezzoProposto = (c: SceltaPrezzo) => centesimiInTesto(centesimiProposti(c));

/**
 * Il prezzo e' ancora quello proposto per `c`? "468" e "468,00" sono la stessa
 * cosa. Un prezzo vuoto no: se Matteo l'ha cancellato vuol dire che non lo vuole.
 */
const eIlProposto = (c: SceltaPrezzo & { prezzo: string }) => leggiEuro(c.prezzo) === centesimiProposti(c);

/**
 * Cambia formula, fascia, nucleo o modalita' di un abbonamento. Il prezzo
 * segue la scelta (si riallinea alla nuova proposta) finche' e' ancora quello
 * proposto; se Matteo l'ha scritto o cancellato, resta come l'ha lasciato.
 */
export function conSceltaAbbonamento(
  campi: CampiNuovoOrdine,
  cambio: Partial<Pick<CampiNuovoOrdine, "formula" | "fascia" | "nucleo" | "modalita">>,
): CampiNuovoOrdine {
  const nuovi = { ...campi, ...cambio };
  if (campi.servizio !== "abbonamento" || !eIlProposto(campi)) return nuovi;
  return { ...nuovi, prezzo: prezzoProposto(nuovi) };
}

/** Ritiro o consegna: per l'abbonamento cambia lo sconto, quindi il prezzo proposto. */
export const conModalita = (campi: CampiNuovoOrdine, modalita: Modalita): CampiNuovoOrdine => conSceltaAbbonamento(campi, { modalita });

/**
 * Cambia servizio. Passando all'abbonamento la griglia si svuota (i pasti si
 * compongono sulla scheda), le due date diventano l'inizio e, se il prezzo e'
 * vuoto, si propone quello della formula scelta; tornando indietro quel
 * prezzo proposto sparisce, uno scritto da Matteo resta.
 */
export function conServizio(campi: CampiNuovoOrdine, servizio: Servizio): CampiNuovoOrdine {
  if (servizio === campi.servizio) return campi;
  if (servizio === "abbonamento") {
    const inizio = campi.uscita || campi.produzione;
    return { ...campi, servizio, piano: {}, porzioni: "", produzione: inizio, uscita: inizio, prezzo: campi.prezzo.trim() ? campi.prezzo : prezzoProposto(campi) };
  }
  const prezzo = campi.servizio === "abbonamento" && eIlProposto(campi) ? "" : campi.prezzo;
  return { ...campi, servizio, prezzo };
}

/** L'inizio dell'abbonamento: e' sia il giorno di cucina sia il giorno di ritiro o consegna. */
export function conInizio(campi: CampiNuovoOrdine, data: string): CampiNuovoOrdine {
  return { ...campi, produzione: data, uscita: data };
}

/* ---------- Ricerca clienti ---------- */

const normalizza = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

/**
 * Clienti per nome, email, comune o telefono (bastano 3 cifre, spazi ignorati).
 * Senza testo: i primi `max`, cioe' quelli che hanno ordinato di recente
 * (il server li manda gia' in quest'ordine).
 */
export function cercaClienti(clienti: ClienteAdmin[], testo: string, max = 8): { trovati: ClienteAdmin[]; altri: number } {
  const q = normalizza(testo);
  const cifre = testo.replace(/\D/g, "");
  const parole = q.split(/\s+/).filter(Boolean);
  const tutti = !q
    ? clienti
    : clienti.filter((c) => {
        const fonte = normalizza(`${c.name} ${c.email} ${c.comune} ${c.phone.replace(/\D/g, "")}`);
        if (parole.every((p) => fonte.includes(p))) return true;
        return cifre.length >= 3 && c.phone.replace(/\D/g, "").includes(cifre);
      });
  return { trovati: tutti.slice(0, max), altri: Math.max(0, tutti.length - max) };
}

/* ---------- Piatti ---------- */

/** Le caselle con un piatto che il catalogo conosce: sono le porzioni che arrivano in cucina. */
export function piattiScelti(piano: Piano): number {
  let n = 0;
  for (const g of GIORNI) for (const m of PASTI) {
    const id = piano[g]?.[m]?.piatto;
    if (id && getPiatto(id)) n++;
  }
  return n;
}

/** Porzioni concordate per l'home cooking: "" -> null, testo non valido -> undefined. */
export function leggiPorzioni(testo: string): number | null | undefined {
  const t = testo.trim();
  if (!t) return null;
  if (!/^\d{1,3}$/.test(t)) return undefined;
  const n = Number(t);
  return n <= MAX_PORZIONI ? n : undefined;
}

/** Le porzioni dell'ordine, come le contera' il server (l'abbonamento non ne ha: i pasti li conta il periodo). */
export function porzioniOrdine(campi: Pick<CampiNuovoOrdine, "servizio" | "piano" | "porzioni">): number {
  if (campi.servizio === "abbonamento") return 0;
  const piatti = piattiScelti(campi.piano);
  if (campi.servizio !== "home-cooking") return piatti;
  return Math.max(piatti, leggiPorzioni(campi.porzioni) ?? 0);
}

/** "Pollo e riso" x 3, dal piu' ordinato: il riepilogo prima di salvare. */
export function riepilogoPiatti(piano: Piano): { id: string; nome: string; quanti: number }[] {
  const conti = new Map<string, number>();
  for (const g of GIORNI) for (const m of PASTI) {
    const id = piano[g]?.[m]?.piatto;
    if (id && getPiatto(id)) conti.set(id, (conti.get(id) ?? 0) + 1);
  }
  return [...conti.entries()]
    .map(([id, quanti]) => ({ id, nome: getPiatto(id)!.nome, quanti }))
    .sort((a, b) => b.quanti - a.quanti || a.nome.localeCompare(b.nome, "it"));
}

/** Le caselle a partire da un giorno: pranzo e cena di quel giorno, poi i successivi, poi si ricomincia da lunedi'. */
function caselleDa(da: GiornoSettimana) {
  const i = GIORNI.indexOf(da);
  const giorni = [...GIORNI.slice(i), ...GIORNI.slice(0, i)];
  return giorni.flatMap((g) => PASTI.map((m) => ({ g, m })));
}

/**
 * "Stesso piatto per N porzioni": mette il piatto nelle prime `quanti` caselle
 * libere a partire da `da`. Le caselle gia' piene non si toccano; `messe` dice
 * quante ne ha riempite davvero (meno di `quanti` se la settimana e' piena).
 */
export function riempiCaselle(piano: Piano, piattoId: string, quanti: number, da: GiornoSettimana): { piano: Piano; messe: number } {
  if (!getPiatto(piattoId) || quanti < 1) return { piano, messe: 0 };
  let out = piano;
  let messe = 0;
  for (const { g, m } of caselleDa(da)) {
    if (messe >= quanti) break;
    if (out[g]?.[m]?.piatto) continue;
    out = conCasella(out, g, m, { piatto: piattoId, extra: out[g]?.[m]?.extra ?? [] });
    messe++;
  }
  return { piano: out, messe };
}

/** Il giorno della settimana di una data "YYYY-MM-DD" (per partire dal giorno di ritiro). */
export function giornoSettimanaDi(data: string): GiornoSettimana | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;
  const d = new Date(`${data}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return GIORNI[(d.getUTCDay() + 6) % 7];
}

/* ---------- Controlli e invio ---------- */

export type CampoNuovoOrdine = "cliente" | "nome" | "telefono" | "comune" | "indirizzo" | "piatti" | "porzioni" | "date" | "prezzo";

/** L'ordine in cui i campi compaiono nel modulo: il primo con un errore prende il focus. */
export const ORDINE_CAMPI: readonly CampoNuovoOrdine[] = ["cliente", "nome", "telefono", "comune", "indirizzo", "piatti", "porzioni", "date", "prezzo"];

export type ErroriNuovoOrdine = Partial<Record<CampoNuovoOrdine, string>>;

export function erroriNuovoOrdine(c: CampiNuovoOrdine): ErroriNuovoOrdine {
  const e: ErroriNuovoOrdine = {};
  if (c.modo === "registrato" && !c.cliente) e.cliente = "Scegli il cliente dall’elenco, oppure passa a “Senza account”.";
  const clienteScelto = c.modo === "senza-account" || !!c.cliente;
  if (clienteScelto && !c.nome.trim()) e.nome = "Scrivi il nome del cliente.";
  if (clienteScelto && c.telefono.replace(/\D/g, "").length < 9) e.telefono = "Scrivi un telefono di almeno 9 cifre.";
  if (c.modalita === "delivery") {
    if (!c.comune.trim()) e.comune = "Per la consegna serve il comune.";
    if (!c.indirizzo.trim()) e.indirizzo = "Per la consegna serve l’indirizzo.";
  }
  const abbonamento = c.servizio === "abbonamento";
  if (!abbonamento && c.servizio !== "home-cooking" && piattiScelti(c.piano) === 0) e.piatti = "Scegli almeno un piatto.";
  if (c.servizio === "home-cooking" && leggiPorzioni(c.porzioni) === undefined) e.porzioni = `Scrivi un numero da 0 a ${MAX_PORZIONI}.`;
  if (abbonamento) {
    if (c.stato === "confirmed" && !(c.uscita || c.produzione)) e.date = "Per un abbonamento già confermato serve la data d’inizio.";
  } else if (c.produzione && c.uscita && c.produzione > c.uscita) {
    e.date = "Il giorno di cucina non può venire dopo il ritiro o la consegna.";
  } else if (c.stato === "confirmed" && (!c.produzione || !c.uscita)) {
    e.date = "Per un ordine già confermato servono tutte e due le date.";
  }
  const centesimi = leggiEuro(c.prezzo);
  if (centesimi === undefined) e.prezzo = "Prezzo non valido: scrivi per esempio 45 oppure 45,50.";
  else if (centesimi !== null && centesimi > MAX_PREZZO_EURO * 100) e.prezzo = "Il prezzo può arrivare al massimo a 10.000 €.";
  return e;
}

/** Il corpo di POST /api/admin/orders. Va chiamato solo con zero errori. */
export function corpoNuovoOrdine(c: CampiNuovoOrdine): NuovoOrdineManuale {
  const porzioni = c.servizio === "home-cooking" ? leggiPorzioni(c.porzioni) : null;
  if (c.servizio === "abbonamento") {
    // Una data sola, l'inizio, in entrambe le date; niente piatti, ma la formula scelta.
    const inizio = c.uscita || c.produzione || null;
    return {
      customerId: c.modo === "registrato" ? (c.cliente?.id ?? null) : null,
      name: c.nome.trim(),
      phone: c.telefono.trim(),
      comune: c.comune.trim(),
      address: c.indirizzo.trim(),
      service: "abbonamento",
      fulfillment: c.modalita,
      plan: {},
      subscription: { plan: c.formula, tier: c.fascia, household: c.nucleo },
      productionDate: inizio,
      fulfillmentDate: inizio,
      status: c.stato,
      priceCents: leggiEuro(c.prezzo) ?? null,
      paid: c.pagato,
      internalNote: c.nota.trim(),
      notes: c.note.trim(),
    };
  }
  return {
    customerId: c.modo === "registrato" ? (c.cliente?.id ?? null) : null,
    name: c.nome.trim(),
    phone: c.telefono.trim(),
    comune: c.comune.trim(),
    address: c.indirizzo.trim(),
    service: c.servizio,
    fulfillment: c.modalita,
    plan: c.piano,
    ...(typeof porzioni === "number" ? { meals: porzioni } : {}),
    productionDate: c.produzione || null,
    fulfillmentDate: c.uscita || null,
    status: c.stato,
    priceCents: leggiEuro(c.prezzo) ?? null,
    paid: c.pagato,
    internalNote: c.nota.trim(),
    notes: c.note.trim(),
  };
}

/** Il modulo e' stato toccato: chiudere chiede conferma. */
export function moduloToccato(c: CampiNuovoOrdine): boolean {
  const vuoto = campiVuoti(c.modo);
  const abbonamento = c.servizio === "abbonamento";
  // Il prezzo proposto per un abbonamento non l'ha scritto Matteo: conta solo se e' diverso.
  const prezzoToccato = abbonamento ? !eIlProposto(c) : c.prezzo.trim() !== vuoto.prezzo;
  return (
    !!c.cliente ||
    piattiScelti(c.piano) > 0 ||
    (["nome", "telefono", "comune", "indirizzo", "porzioni", "produzione", "uscita", "nota", "note"] as const).some((k) => c[k].trim() !== vuoto[k]) ||
    prezzoToccato ||
    (abbonamento && (c.formula !== vuoto.formula || c.fascia !== vuoto.fascia || c.nucleo !== vuoto.nucleo)) ||
    c.pagato
  );
}

/* ---------- La bozza del modulo ---------- */

/** Il testo con cui si conserva il modulo a meta' (sessione del browser). */
export const testoBozzaOrdine = (c: CampiNuovoOrdine) => JSON.stringify(c);

/**
 * La bozza conservata, rimessa sui campi di oggi: il tasto Indietro del telefono
 * o una ricarica chiudono il modulo senza chiedere nulla, e un ordine scritto in
 * due minuti di telefonata non deve andare perso. null se manca, e' rovinata,
 * non somiglia al modulo o non ha niente dentro.
 */
export function bozzaOrdineDaTesto(grezzo: string | null): CampiNuovoOrdine | null {
  if (!grezzo) return null;
  try {
    const letto = JSON.parse(grezzo) as Partial<CampiNuovoOrdine> | null;
    if (!letto || typeof letto !== "object" || typeof letto.servizio !== "string" || typeof letto.nome !== "string") return null;
    const unito: CampiNuovoOrdine = { ...campiVuoti(letto.modo === "senza-account" ? "senza-account" : "registrato"), ...letto };
    if (!unito.piano || typeof unito.piano !== "object") unito.piano = {};
    return moduloToccato(unito) ? unito : null;
  } catch {
    return null;
  }
}
