/**
 * Il pannello di Matteo: per ogni cliente, cosa mangia ogni giorno a pranzo e a cena.
 *
 * Solo funzioni pure, senza rete, senza DOM e senza node:*: le usano sia le Pages
 * Functions sia il browser. Quando un pasto compare nel giorno sbagliato, il posto
 * dove cercare e' questo file.
 */

import { getFormula } from "@/lib/abbonamento";
import type { Ordine, Servizio, VoceOrdine } from "@/lib/api";
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

function nomePiatto(v: Pick<VoceOrdine, "name" | "extras">): string {
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
   Ordini nuovi (il riquadro e la schermata "Ordini nuovi")
   ========================================================================= */

/**
 * Il giorno in cui far partire un ordine: la data che ha chiesto il cliente, se c'e' e
 * non e' passata; altrimenti oggi. Mai prima di `oggi`.
 */
export function giornoDiInizioProposto(richiesta: string | null, oggi: string): string {
  return richiesta && richiesta >= oggi ? richiesta : oggi;
}

/** I piatti con le copie raggruppate: due "Pollo al curry" diventano "2× Pollo al curry". */
export function piattiRaggruppati(voci: Pick<VoceOrdine, "name" | "extras">[]): string[] {
  const copie = new Map<string, number>();
  for (const v of voci) {
    const nome = nomePiatto(v);
    copie.set(nome, (copie.get(nome) ?? 0) + 1);
  }
  return [...copie].map(([nome, n]) => (n > 1 ? `${n}× ${nome}` : nome));
}

/**
 * Come e' andata l'accettazione dopo il PATCH: "in-settimana" (i pasti ci sono), "da-completare"
 * (il PATCH e' andato ma i pasti no, anche dopo un tentativo: la ricarica li mette senza prezzo),
 * "giorno-passato" (il server ha rifiutato il giorno perche' nel frattempo e' passato).
 */
export type EsitoAccettazione = "in-settimana" | "da-completare" | "giorno-passato";

const PREZZO_NON_SALVATO = " Il prezzo non si è salvato: scrivilo in Altro → I miei clienti.";

/**
 * Il testo che Matteo legge dopo aver accettato. Il prezzo, se l'ha scritto, va detto quando non
 * si e' salvato: in tutti gli esiti tranne "in-settimana".
 */
export function testoAccettazione(servizio: Servizio, esito: EsitoAccettazione, prezzoScritto: boolean): string {
  const abbonamento = servizio === "abbonamento";
  const prezzoPerso = prezzoScritto && esito !== "in-settimana" ? PREZZO_NON_SALVATO : "";
  if (esito === "giorno-passato") {
    return `Accettato. Il giorno d'inizio era già passato: aggiungi i pasti dalla settimana del cliente.${prezzoPerso}`;
  }
  if (esito === "da-completare") {
    return `${abbonamento ? "Accettato: ora riempi la sua settimana." : "Accettato. Lo trovi nella settimana."}${prezzoPerso}`;
  }
  return abbonamento ? "Accettato: ora riempi la sua settimana." : "Messo nella settimana: lo trovi qui.";
}

/**
 * Il cliente della rubrica di un ordine: quello dell'account del cliente; per un ordine
 * inserito a mano (senza account) quello con lo stesso nome e telefono.
 */
export function clienteDelOrdine(
  clienti: ClienteMatteo[],
  o: Pick<Ordine, "user_id" | "customer_name" | "phone">,
): ClienteMatteo | undefined {
  return clienti.find((c) => c.userId === o.user_id)
    ?? clienti.find((c) => c.userId === null && c.nome === o.customer_name && c.telefono === o.phone);
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
 * Solo cifre, senza il "00" iniziale; uno 0 in piu' davanti a un cellulare (11 cifre
 * che cominciano con 03) si toglie. Un numero che comincia con 0 (fisso) o con
 * 3 e ha 9 o 10 cifre (cellulare) prende il 39 davanti; il resto e' gia' internazionale.
 * Null se ci sono meno di sei cifre.
 */
export function numeroInternazionale(telefono: string): string | null {
  let cifre = telefono.replace(/\D/g, "");
  if (cifre.startsWith("00")) cifre = cifre.slice(2);
  // cellulare scritto con uno 0 in piu' davanti: 0347 1234567 -> 3471234567
  if (cifre.length === 11 && cifre.startsWith("03")) cifre = cifre.slice(1);
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

/* =========================================================================
   Rubrica e settimana del cliente
   ========================================================================= */

/** "2026-10-26" -> "26 ott" (il mese in italiano, senza il punto). */
export function dataCorta(data: string): string {
  const [anno, mese, giorno] = data.split("-").map(Number);
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(anno, mese - 1, giorno, 12)))
    .replace(/\.$/, "");
}

/** I clienti per ultimo pasto, il più recente in cima; quelli senza pasti in fondo. A parità, per nome. */
export function ordinaClienti(clienti: ClienteMatteo[]): ClienteMatteo[] {
  return [...clienti].sort((a, b) => {
    if (a.ultimoPasto !== b.ultimoPasto) {
      if (a.ultimoPasto === null) return 1;
      if (b.ultimoPasto === null) return -1;
      return a.ultimoPasto < b.ultimoPasto ? 1 : -1;
    }
    return a.nome.localeCompare(b.nome, "it");
  });
}

/** Il testo da confrontare: minuscolo, senza accenti, senza spazi ai lati. "  Àlvaro " -> "alvaro". */
export function chiaveRicerca(testo: string): string {
  return testo.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("it-IT").trim();
}

/** I clienti il cui nome contiene il testo cercato, senza badare ad accenti e maiuscole. Testo vuoto: tutti. */
export function cercaClienti(clienti: ClienteMatteo[], testo: string): ClienteMatteo[] {
  const cerca = chiaveRicerca(testo);
  if (!cerca) return clienti;
  return clienti.filter((c) => chiaveRicerca(c.nome).includes(cerca));
}

/** L'id del piatto del catalogo il cui nome e' identico al testo (spazi ai lati esclusi); altrimenti null. */
export function piattoIdDelTesto(testo: string, piatti: { id: string; nome: string }[]): string | null {
  const t = testo.trim();
  return piatti.find((p) => p.nome === t)?.id ?? null;
}

/** I piatti del catalogo, tolti quelli che Matteo ha segnato come non disponibili. */
export function piattiDisponibili<T extends { id: string }>(piatti: T[], nonDisponibili: string[]): T[] {
  const tolti = new Set(nonDisponibili);
  return piatti.filter((p) => !tolti.has(p.id));
}

/** Il prezzo a pasto come lo scrive Matteo: "10 €", "8,50 €". */
export function prezzoPastoBreve(centesimi: number): string {
  const euro = Math.floor(centesimi / 100);
  const cent = centesimi % 100;
  return cent === 0 ? `${euro} €` : `${euro},${String(cent).padStart(2, "0")} €`;
}

/** Una riga della griglia: il giorno, e il pasto di pranzo e quello di cena (null se la casella è vuota). */
export type CasellaSettimana = {
  data: string;
  sigla: string;
  numero: string;
  pranzo: PastoSettimana | null;
  cena: PastoSettimana | null;
};

/** La settimana del cliente come griglia: sette giorni a partire dal lunedì, ognuno con pranzo e cena. */
export function grigliaSettimana(lunedi: string, pasti: PastoSettimana[]): CasellaSettimana[] {
  return giorniDellaSettimana(lunedi).map((data) => {
    const trova = (pasto: "pranzo" | "cena") => pasti.find((p) => p.data === data && p.pasto === pasto) ?? null;
    return { data, ...nomeGiornoCorto(data), pranzo: trova("pranzo"), cena: trova("cena") };
  });
}

/** Gli eventi (cucina a casa) dei pasti, in ordine di data. */
export function eventiSettimana(pasti: PastoSettimana[]): PastoSettimana[] {
  return pasti.filter((p) => p.pasto === "evento").sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
}

/** I pasti dopo aver messo `nuovo` nella sua casella (data e pranzo o cena), al posto di quello che c'era. */
export function conPasto(pasti: PastoSettimana[], nuovo: PastoSettimana): PastoSettimana[] {
  return [...pasti.filter((p) => !(p.data === nuovo.data && p.pasto === nuovo.pasto)), nuovo];
}

/** Il testo che compare dopo "Copia la settimana scorsa". */
export function testoCopia(copiati: number, settimanaPiena: boolean): string {
  if (copiati === 1) return "Copiato 1 pasto.";
  if (copiati > 1) return `Copiati ${copiati} pasti.`;
  return settimanaPiena ? "Tutte le caselle sono già piene." : "La settimana scorsa era vuota.";
}
