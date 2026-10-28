/**
 * Il pannello di Matteo: per ogni cliente, cosa mangia ogni giorno a pranzo e a cena.
 *
 * Solo funzioni pure, senza rete, senza DOM e senza node:*: le usano sia le Pages
 * Functions sia il browser. Quando un pasto compare nel giorno sbagliato, il posto
 * dove cercare e' questo file.
 */

import { getFormula } from "@/lib/abbonamento";
import type { Ordine, VoceOrdine } from "@/lib/api";
import { giornoDelPiano, giornoSettimana, isData, spostaGiorni } from "@/lib/produzione";
import { NOMI_GIORNO } from "@/lib/settimana";

export type PastoPannello = "pranzo" | "cena" | "evento";

export type ClienteMatteo = {
  id: string;
  nome: string;
  telefono: string;
  indirizzo: string;
  prezzoPastoCents: number | null;
  userId: string | null;
  ultimoPasto: string | null;
};

export type DatiCliente = { nome: string; telefono: string; indirizzo: string; prezzoPastoCents: number | null };

export type PastoSettimana = {
  id: string;
  clienteId: string;
  data: string;
  pasto: PastoPannello;
  piatto: string;
  piattoId: string | null;
  porzioni: number;
  prezzoCents: number | null;
  ordineId: string | null;
};

export type NuovoPasto = {
  clienteId: string;
  data: string;
  pasto: "pranzo" | "cena";
  piatto: string;
  piattoId: string | null;
  porzioni: number;
};

export type RigaDaOrdine = Omit<PastoSettimana, "id" | "clienteId">;

export type Guadagni = { cents: number; pasti: number; clienti: number };

export type DatiPannello = {
  clienti: ClienteMatteo[];
  pasti: PastoSettimana[];
  nuovi: Ordine[];
  recenti: Record<string, string[]>;
};

export type RigaGiorno = { pasto: PastoSettimana; cliente: ClienteMatteo };

export type EtichettaPannello = {
  chiave: string;
  cliente: string;
  piatto: string;
  giorno: string;
  pasto: "Pranzo" | "Cena";
};

/* =========================================================================
   Settimana e date ("YYYY-MM-DD", fuso di Roma, a mezzogiorno UTC)
   ========================================================================= */

/** Il lunedi' della settimana che contiene `data`. */
export function lunediDi(data: string): string {
  const daLunedi = (giornoSettimana(data) + 6) % 7;
  return spostaGiorni(data, -daLunedi);
}

/** Le sette date della settimana che comincia al `lunedi`. */
export function giorniDellaSettimana(lunedi: string): string[] {
  return Array.from({ length: 7 }, (_, i) => spostaGiorni(lunedi, i));
}

function numeroDelGiorno(data: string): string {
  return String(Number(data.slice(8, 10)));
}

/** "2026-10-28" -> "Mercoledì 28". */
export function nomeGiorno(data: string): string {
  return `${NOMI_GIORNO[giornoDelPiano(data)]} ${numeroDelGiorno(data)}`;
}

/** "2026-11-01" -> { sigla: "Dom", numero: "1" }. */
export function nomeGiornoCorto(data: string): { sigla: string; numero: string } {
  const g = giornoDelPiano(data);
  return { sigla: g.charAt(0).toUpperCase() + g.slice(1), numero: numeroDelGiorno(data) };
}

/** "2026-10-28" -> "2026-10". */
export function meseDi(data: string): string {
  return data.slice(0, 7);
}

/** "2026-01" -> "2025-12". */
export function mesePrima(mese: string): string {
  const anno = Number(mese.slice(0, 4));
  const m = Number(mese.slice(5, 7));
  return m === 1 ? `${anno - 1}-12` : `${anno}-${String(m - 1).padStart(2, "0")}`;
}

/* =========================================================================
   Pasti dagli ordini
   ========================================================================= */

/** La prima data >= `inizio` che cade nel giorno del piano (lun, mar, ...). */
function primaDataDelGiorno(inizio: string, giorno: string): string | null {
  for (let k = 0; k < 7; k++) {
    const d = spostaGiorni(inizio, k);
    if (giornoDelPiano(d) === giorno) return d;
  }
  return null;
}

function nomePiatto(v: VoceOrdine): string {
  return v.extras.length > 0 ? `${v.name} + ${v.extras.join(", ")}` : v.name;
}

const ORDINE_PASTI: Record<PastoPannello, number> = { pranzo: 0, cena: 1, evento: 2 };

/**
 * I pasti che un ordine accettato mette nel pannello, da `inizio` in poi.
 * Un menu o un "sui tuoi macro" ha una riga per voce; l'abbonamento non ne ha
 * (li mette Matteo, dal calendario); il cuoco a domicilio e' una riga sola.
 * Le date passate (prima di `oggi`) non entrano.
 */
export function pastiDaOrdine(
  o: Pick<Ordine, "id" | "service" | "items" | "meals">,
  inizio: string,
  prezzoPastoCents: number | null,
  oggi: string,
): RigaDaOrdine[] {
  if (!isData(inizio) || o.service === "abbonamento") return [];

  if (o.service === "home-cooking") {
    if (inizio < oggi) return [];
    return [
      {
        data: inizio,
        pasto: "evento",
        piatto: `Cuoco a domicilio · ${o.meals} porzioni`,
        piattoId: null,
        porzioni: 1,
        prezzoCents: prezzoPastoCents === null ? null : prezzoPastoCents * o.meals,
        ordineId: o.id,
      },
    ];
  }

  const righe: RigaDaOrdine[] = [];
  for (const v of o.items) {
    if (v.meal !== "pranzo" && v.meal !== "cena") continue;
    const data = primaDataDelGiorno(inizio, v.day);
    if (!data || data < oggi) continue;
    righe.push({
      data,
      pasto: v.meal,
      piatto: nomePiatto(v),
      piattoId: v.id,
      porzioni: 1,
      prezzoCents: prezzoPastoCents,
      ordineId: o.id,
    });
  }
  return righe.sort((a, b) => {
    if (a.data !== b.data) return a.data < b.data ? -1 : 1;
    return ORDINE_PASTI[a.pasto] - ORDINE_PASTI[b.pasto];
  });
}

/**
 * Il prezzo a pasto da proporre quando Matteo accetta un ordine, se si può
 * ricavare: l'abbonamento solo per la fascia "da solo", gli altri servizi come
 * prezzo diviso i pasti. Altrimenti null.
 */
export function prezzoPastoProposto(
  o: Pick<Ordine, "service" | "price_cents" | "meals" | "subscription">,
): number | null {
  if (o.service === "abbonamento") {
    const s = o.subscription;
    if (!s || s.household !== "singolo" || typeof o.price_cents !== "number") return null;
    return Math.round((o.price_cents * 12) / (52 * getFormula(s.plan).pastiSettimana));
  }
  if (typeof o.price_cents === "number" && o.meals > 0) return Math.round(o.price_cents / o.meals);
  return null;
}

/* =========================================================================
   Il giorno del pannello
   ========================================================================= */

/**
 * I pasti di `data`, divisi per tipo. Dentro ogni tipo, i clienti in ordine di
 * nome. Un pasto il cui cliente non esiste nella lista viene scartato.
 */
export function pastiDelGiorno(
  pasti: PastoSettimana[],
  clienti: ClienteMatteo[],
  data: string,
): { pranzo: RigaGiorno[]; cena: RigaGiorno[]; evento: RigaGiorno[] } {
  const perId = new Map(clienti.map((c) => [c.id, c]));
  const righe: RigaGiorno[] = [];
  for (const pasto of pasti) {
    const cliente = perId.get(pasto.clienteId);
    if (pasto.data === data && cliente) righe.push({ pasto, cliente });
  }
  righe.sort((a, b) => a.cliente.nome.localeCompare(b.cliente.nome, "it"));
  return {
    pranzo: righe.filter((r) => r.pasto.pasto === "pranzo"),
    cena: righe.filter((r) => r.pasto.pasto === "cena"),
    evento: righe.filter((r) => r.pasto.pasto === "evento"),
  };
}

/**
 * Le etichette da stampare per il giorno: una per porzione, prima il pranzo poi
 * la cena. Gli eventi non hanno etichetta.
 */
export function etichetteDelGiorno(
  pasti: PastoSettimana[],
  clienti: ClienteMatteo[],
  data: string,
): EtichettaPannello[] {
  const { pranzo, cena } = pastiDelGiorno(pasti, clienti, data);
  const giorno = nomeGiorno(data);
  const etichette = (righe: RigaGiorno[], pasto: "Pranzo" | "Cena"): EtichettaPannello[] =>
    righe.flatMap(({ pasto: p, cliente }) =>
      Array.from({ length: p.porzioni }, (_, i) => ({
        chiave: `${p.id}-${i}`,
        cliente: cliente.nome,
        piatto: p.piatto,
        giorno,
        pasto,
      })),
    );
  return [...etichette(pranzo, "Pranzo"), ...etichette(cena, "Cena")];
}

/* =========================================================================
   Telefono e link
   ========================================================================= */

/**
 * "+39 347 123 4567" -> "393471234567"; "085 4212345" -> "390854212345".
 * Solo cifre, senza il "00" iniziale. Un numero che comincia con 0 (fisso) o con
 * 3 e ha 9 o 10 cifre (cellulare) prende il 39 davanti; il resto e' gia' internazionale.
 * Null se ci sono meno di sei cifre.
 */
export function numeroInternazionale(telefono: string): string | null {
  let cifre = telefono.replace(/\D/g, "");
  if (cifre.startsWith("00")) cifre = cifre.slice(2);
  if (cifre.length < 6) return null;
  if (cifre.startsWith("0")) return `39${cifre}`;
  if (cifre.startsWith("3") && (cifre.length === 9 || cifre.length === 10)) return `39${cifre}`;
  return cifre;
}

export function linkChiama(telefono: string): string | null {
  const n = numeroInternazionale(telefono);
  return n ? `tel:+${n}` : null;
}

export function linkWhatsAppCliente(telefono: string, nome: string): string | null {
  const n = numeroInternazionale(telefono);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(`Ciao ${nome}, sono Matteo di FUEL LAB.`)}`;
}
