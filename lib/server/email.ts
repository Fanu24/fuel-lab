/**
 * I testi delle email, in italiano, in due versioni: testo semplice e HTML
 * sobrio (una colonna, nessuna immagine, stili in linea). Qui non si spedisce
 * niente: functions/_lib/mail.ts prende questi contenuti e li passa a Resend.
 *
 * Tutto cio' che arriva dal cliente passa da escapeHtml prima di finire
 * nell'HTML, e da unaRiga prima di finire in un oggetto.
 */

import { CONSEGNA_OGNI_GIORNI, etichettaFormula, formulaDi, getFormula, NOMI_NUCLEO, periodoAbbonamento } from "../abbonamento";
import {
  ETICHETTE_ARGOMENTO,
  ETICHETTE_SERVIZIO,
  etichettaStato,
  type ArgomentoMessaggio,
  type Modalita,
  type SceltaAbbonamento,
  type Servizio,
  type StatoOrdine,
  type VoceOrdine,
} from "../api";
import { GIORNI, NOMI_GIORNO, PASTI } from "../settimana";
import { unaRiga } from "./contatti";
import { dataEstesa } from "./date";
import { euroTesto } from "./ordini";

export const SITO = "https://fuelchef.it";
export const INDIRIZZO_LABORATORIO = "Via del Santuario 214, 65124 Pescara";
const FIRMA = `FUEL LAB · ${INDIRIZZO_LABORATORIO} · fuelchef.it`;

export type ContenutoEmail = { subject: string; text: string; html: string };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Blocco =
  | { tipo: "paragrafo"; testo: string }
  | { tipo: "righe"; righe: Array<[string, string]> }
  | { tipo: "sezione"; titolo: string }
  | { tipo: "elenco"; voci: string[] }
  | { tipo: "citazione"; titolo: string; testo: string }
  | { tipo: "link"; url: string; etichetta: string };

const conAcapo = (value: string) => escapeHtml(value).replace(/\n/g, "<br>");

/** Mette insieme testo e HTML dagli stessi blocchi, cosi' le due versioni non divergono. */
function componi(subject: string, titolo: string, blocchi: Blocco[]): ContenutoEmail {
  const testo: string[] = [titolo, ""];
  const html: string[] = [];
  for (const blocco of blocchi) {
    switch (blocco.tipo) {
      case "paragrafo":
        testo.push(blocco.testo, "");
        html.push(`<p style="margin:0 0 16px;">${conAcapo(blocco.testo)}</p>`);
        break;
      case "righe":
        testo.push(...blocco.righe.map(([etichetta, valore]) => `${etichetta}: ${valore}`), "");
        html.push(
          `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 16px;width:100%;">${blocco.righe
            .map(([etichetta, valore]) =>
              `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top;white-space:nowrap;">${escapeHtml(etichetta)}</td><td style="padding:4px 0;vertical-align:top;">${conAcapo(valore)}</td></tr>`)
            .join("")}</table>`,
        );
        break;
      case "sezione":
        testo.push(blocco.titolo.toUpperCase());
        html.push(`<h2 style="font-size:15px;margin:24px 0 8px;">${escapeHtml(blocco.titolo)}</h2>`);
        break;
      case "elenco":
        testo.push(...blocco.voci.map((voce) => `- ${voce}`), "");
        html.push(`<ul style="margin:0 0 16px;padding-left:20px;">${blocco.voci.map((voce) => `<li style="margin:0 0 4px;">${conAcapo(voce)}</li>`).join("")}</ul>`);
        break;
      case "citazione":
        testo.push(`${blocco.titolo}:`, ...blocco.testo.split("\n").map((riga) => `> ${riga}`), "");
        html.push(
          `<p style="margin:0 0 4px;color:#666;">${escapeHtml(blocco.titolo)}</p><div style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #1a1a1a;background:#f4f4f2;">${conAcapo(blocco.testo)}</div>`,
        );
        break;
      case "link":
        testo.push(`${blocco.etichetta}: ${blocco.url}`, "");
        html.push(
          `<p style="margin:24px 0;"><a href="${escapeHtml(blocco.url)}" style="display:inline-block;background:#1a1a1a;color:#ffffff;padding:11px 20px;border-radius:6px;text-decoration:none;font-weight:600;">${escapeHtml(blocco.etichetta)}</a></p>`,
        );
        break;
    }
  }
  testo.push("--", FIRMA);
  return {
    subject,
    text: testo.join("\n"),
    html: `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head><body style="margin:0;padding:0;background:#ffffff;"><div style="max-width:560px;margin:0 auto;padding:28px 20px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;"><p style="margin:0 0 20px;font-size:12px;font-weight:700;letter-spacing:0.14em;">FUEL LAB</p><h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;">${escapeHtml(titolo)}</h1>${html.join("")}<p style="margin:32px 0 0;padding-top:16px;border-top:1px solid #e5e5e2;font-size:12px;color:#666;">${escapeHtml(FIRMA)}</p></div></body></html>`,
  };
}

/* ---------- Accesso (better-auth) ---------- */

export function emailAccesso(subject: string, url: string): ContenutoEmail {
  return componi(subject, subject, [
    { tipo: "paragrafo", testo: "Apri questo link per continuare:" },
    { tipo: "link", url, etichetta: "Continua" },
    { tipo: "paragrafo", testo: "Se il pulsante non funziona, copia questo indirizzo nel browser:\n" + url },
    { tipo: "paragrafo", testo: "Se non hai richiesto questa operazione, ignora questa email." },
  ]);
}

/* ---------- Richieste ---------- */

export type RichiestaPerEmail = {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  comune: string;
  address: string;
  fulfillment: Modalita;
  service: Servizio;
  requested_date: string | null;
  notes: string;
  meals: number;
  items: VoceOrdine[];
  /** La proposta di prezzo partita con la richiesta (l'abbonamento ne ha una). */
  price_cents?: number | null;
  /** La formula scelta: solo per l'abbonamento. Senza, si legge come un Pranzo (gli abbonamenti nati prima delle formule). */
  subscription?: SceltaAbbonamento | null;
};

export const linkPannello = (id: string) => `${SITO}/dashboard/ordini?id=${encodeURIComponent(id)}`;

function modalita(o: Pick<RichiestaPerEmail, "fulfillment" | "address" | "comune">) {
  return o.fulfillment === "delivery"
    ? `Consegna a ${[o.address, o.comune].filter(Boolean).join(", ")}`
    : `Ritiro in laboratorio (${INDIRIZZO_LABORATORIO})`;
}

/** "Lunedì — pranzo: Pollo e riso (+ Verdure); cena: ..." un giorno per riga. */
export function piattiPerGiorno(items: VoceOrdine[]): string[] {
  const righe: string[] = [];
  for (const giorno of GIORNI) {
    const delGiorno = items.filter((voce) => voce.day === giorno);
    if (!delGiorno.length) continue;
    const pasti = [...delGiorno].sort((a, b) => PASTI.indexOf(a.meal as (typeof PASTI)[number]) - PASTI.indexOf(b.meal as (typeof PASTI)[number]));
    righe.push(`${NOMI_GIORNO[giorno]} — ${pasti.map((voce) => `${voce.meal}: ${voce.name}${voce.extras.length ? ` (+ ${voce.extras.join(", ")})` : ""}`).join("; ")}`);
  }
  // Voci con un giorno che il sito non conosce piu': meglio mostrarle che perderle.
  const altre = items.filter((voce) => !(GIORNI as readonly string[]).includes(voce.day));
  if (altre.length) righe.push(`Altro — ${altre.map((voce) => voce.name).join("; ")}`);
  return righe;
}

/** "Completo · Plus": la formula di un abbonamento come si legge in una riga. */
const nomeAbbonamento = (o: { subscription?: SceltaAbbonamento | null }) => etichettaFormula(formulaDi(o), o.subscription?.tier);

/** "Pasti: 3" o, per l'abbonamento, cosa chiede davvero: la data e' l'inizio, non un giorno di ritiro. */
function righeRichiesta(o: RichiestaPerEmail): Array<[string, string]> {
  if (o.service === "abbonamento") {
    const scelta = o.subscription;
    const righe: Array<[string, string]> = [
      ["Formula", nomeAbbonamento(o)],
      ["Cosa chiede", getFormula(formulaDi(o)).cosaRicevi],
    ];
    // Chi si abbona e la prova li porta la scelta salvata: senza (un abbonamento vecchio) non si inventano.
    if (scelta) {
      righe.push(["Chi si abbona", NOMI_NUCLEO[scelta.household]], ["Settimana di prova", scelta.trial ? "Sì" : "No"]);
    }
    if (o.price_cents !== null && o.price_cents !== undefined) righe.push(["Prezzo proposto", `${euroTesto(o.price_cents)} al mese`]);
    righe.push(["Inizio desiderato", o.requested_date ? dataEstesa(o.requested_date) : "Da concordare"]);
    return righe;
  }
  return [
    ["Data preferita", o.requested_date ? dataEstesa(o.requested_date) : "Nessuna preferenza"],
    ["Pasti", String(o.meals)],
  ];
}

/** (a) Nuova richiesta -> a Matteo. */
export function emailNuovaRichiesta(o: RichiestaPerEmail): ContenutoEmail {
  const nome = unaRiga(o.customer_name) || "Cliente";
  const abbonamento = o.service === "abbonamento";
  const blocchi: Blocco[] = [
    { tipo: "righe", righe: [
      ["Cliente", nome],
      ["Email", o.email || "—"],
      ["Telefono", o.phone || "—"],
      ["Servizio", ETICHETTE_SERVIZIO[o.service] ?? o.service],
      ["Modalità", modalita(o)],
      ["Comune", o.comune || "—"],
      ...righeRichiesta(o),
    ] },
  ];
  const giorni = piattiPerGiorno(o.items);
  if (giorni.length) {
    blocchi.push({ tipo: "sezione", titolo: abbonamento ? "Piatti indicati dal cliente" : "Piatti per giorno" }, { tipo: "elenco", voci: giorni });
  }
  if (o.notes) blocchi.push({ tipo: "citazione", titolo: abbonamento ? "La scheda del cliente" : "Note del cliente", testo: o.notes });
  blocchi.push({ tipo: "link", url: linkPannello(o.id), etichetta: "Apri la richiesta nel pannello" });
  const cosa = abbonamento ? `Abbonamento ${nomeAbbonamento(o)}` : `${o.meals} ${o.meals === 1 ? "pasto" : "pasti"}`;
  return componi(`Nuova richiesta: ${nome} · ${cosa}`, abbonamento ? "Nuova richiesta di abbonamento dal sito" : "Nuova richiesta dal sito", blocchi);
}

/** (d) Richiesta annullata dal cliente -> a Matteo. */
export function emailAnnullataDalCliente(o: RichiestaPerEmail): ContenutoEmail {
  const nome = unaRiga(o.customer_name) || "Cliente";
  return componi(`Richiesta annullata: ${nome}`, "Il cliente ha annullato la richiesta", [
    { tipo: "paragrafo", testo: `${nome} ha annullato la richiesta prima della conferma. Non serve fare altro.` },
    { tipo: "righe", righe: [
      ["Cliente", nome],
      ["Email", o.email || "—"],
      ["Telefono", o.phone || "—"],
      ["Servizio", ETICHETTE_SERVIZIO[o.service] ?? o.service],
      ...righeRichiesta(o).filter(([etichetta]) => etichetta !== "Cosa chiede"),
    ] },
    { tipo: "link", url: linkPannello(o.id), etichetta: "Apri la richiesta nel pannello" },
  ]);
}

/* ---------- Aggiornamento al cliente ---------- */

const FRASI_STATO: Record<StatoOrdine, string> = {
  requested: "La tua richiesta è in attesa di conferma: Matteo la guarda al più presto.",
  confirmed: "Matteo ha confermato la tua richiesta.",
  preparing: "Matteo sta preparando i tuoi pasti.",
  ready: "I tuoi pasti sono pronti.",
  completed: "La tua richiesta è stata consegnata. Buon appetito!",
  cancelled: "La tua richiesta è stata annullata.",
};

/** Le stesse frasi per l'abbonamento, con la formula: non si prepara un ordine, parte un mese di consegne. */
const frasiStatoAbbonamento = (formula: string): Record<StatoOrdine, string> => ({
  requested: `La tua richiesta di abbonamento ${formula} è in attesa di conferma: Matteo la guarda al più presto.`,
  confirmed: `Matteo ha confermato il tuo abbonamento ${formula}.`,
  preparing: `Il tuo abbonamento ${formula} è in corso.`,
  ready: `Il tuo abbonamento ${formula} è in corso.`,
  completed: `Il tuo abbonamento ${formula} si è concluso. Grazie!`,
  cancelled: `La tua richiesta di abbonamento ${formula} è stata annullata.`,
});

const OGGETTO_ABBONAMENTO: Record<StatoOrdine, string> = {
  requested: "abbonamento in attesa di conferma",
  confirmed: "abbonamento confermato",
  preparing: "abbonamento in corso",
  ready: "abbonamento in corso",
  completed: "abbonamento concluso",
  cancelled: "abbonamento annullato",
};

export type AggiornamentoPerEmail = {
  /** Assente nei client vecchi: vale come un ordine normale. */
  service?: Servizio;
  customer_name: string;
  status: StatoOrdine;
  fulfillment: Modalita;
  fulfillment_date: string | null;
  address: string;
  comune: string;
  customer_message: string;
  price_cents: number | null;
  paid: 0 | 1;
  /** La formula scelta: solo per l'abbonamento. */
  subscription?: SceltaAbbonamento | null;
};

/** (c) Aggiornamento dell'ordine -> al cliente. Mai dati interni: niente data di produzione, niente note di Matteo per se'. */
export function emailAggiornamentoCliente(o: AggiornamentoPerEmail, statoCambiato: boolean): ContenutoEmail {
  const nome = unaRiga(o.customer_name).split(" ")[0] || "";
  const etichetta = etichettaStato(o.status, "cliente");
  const abbonamento = o.service === "abbonamento";
  const righe: Array<[string, string]> = [["Stato", abbonamento && o.status === "completed" ? "Concluso" : etichetta]];
  if (abbonamento) righe.push(["Servizio", ETICHETTE_SERVIZIO.abbonamento], ["Formula", nomeAbbonamento(o)]);
  if (o.status !== "cancelled") {
    if (o.fulfillment_date && abbonamento) {
      // Il periodo e' un mese dall'inizio; la prima consegna (o ritiro) e' il primo giorno, poi una ogni 3 giorni.
      const { dal, al } = periodoAbbonamento(o.fulfillment_date);
      righe.push(
        ["Periodo", `dal ${dataEstesa(dal)} al ${dataEstesa(al)}`],
        [o.fulfillment === "delivery" ? "Consegna" : "Ritiro", `ogni ${CONSEGNA_OGNI_GIORNI} giorni, a partire da ${dataEstesa(dal)}`],
      );
    } else if (o.fulfillment_date) {
      righe.push([o.fulfillment === "delivery" ? "Consegna" : "Ritiro", dataEstesa(o.fulfillment_date)]);
    }
    righe.push(["Dove", o.fulfillment === "delivery" ? [o.address, o.comune].filter(Boolean).join(", ") : `${INDIRIZZO_LABORATORIO} (ritiro in laboratorio)`]);
  }
  if (o.price_cents !== null) {
    // Su una richiesta ancora da confermare il prezzo e' una proposta, come nel pannello e nell'area cliente.
    const proposto = o.status === "requested";
    // La proposta di un abbonamento e' un prezzo al mese; il totale concordato lo scrive Matteo.
    const alMese = proposto && abbonamento ? " al mese" : "";
    righe.push([proposto ? "Prezzo proposto" : "Totale concordato", `${euroTesto(o.price_cents)}${alMese}${o.paid ? " · pagato" : ""}`]);
  }
  const frasi = abbonamento ? frasiStatoAbbonamento(nomeAbbonamento(o)) : FRASI_STATO;
  const blocchi: Blocco[] = [
    { tipo: "paragrafo", testo: statoCambiato ? frasi[o.status] : "Matteo ti ha scritto un messaggio sulla tua richiesta." },
    { tipo: "righe", righe },
  ];
  if (o.customer_message) blocchi.push({ tipo: "citazione", titolo: "Messaggio di Matteo", testo: o.customer_message });
  blocchi.push(
    { tipo: "link", url: `${SITO}/account`, etichetta: "Vedi la richiesta nel tuo account" },
    { tipo: "paragrafo", testo: "Per qualsiasi domanda rispondi pure a questa email." },
  );
  const subject = statoCambiato
    ? `Aggiornamento FUEL LAB: ${abbonamento ? OGGETTO_ABBONAMENTO[o.status] : etichetta}`
    : "Un messaggio di Matteo sulla tua richiesta FUEL LAB";
  return componi(subject, nome ? `Ciao ${nome},` : "Ciao,", blocchi);
}

/* ---------- Modulo contatti ---------- */

export type MessaggioPerEmail = {
  name: string;
  email: string;
  phone: string;
  comune: string;
  topic: ArgomentoMessaggio;
  message: string;
};

/** (b) Nuovo messaggio dal modulo contatti -> a Matteo. */
export function emailNuovoMessaggio(m: MessaggioPerEmail): ContenutoEmail {
  const nome = unaRiga(m.name) || "Qualcuno";
  const argomento = ETICHETTE_ARGOMENTO[m.topic] ?? m.topic;
  const blocchi: Blocco[] = [
    { tipo: "righe", righe: [
      ["Nome", nome],
      ["Email", m.email || "—"],
      ["Telefono", m.phone || "—"],
      ["Comune", m.comune || "—"],
      ["Argomento", argomento],
    ] },
    { tipo: "citazione", titolo: "Messaggio", testo: m.message },
  ];
  if (m.email) blocchi.push({ tipo: "paragrafo", testo: `Rispondi a questa email per scrivere direttamente a ${m.email}.` });
  blocchi.push({ tipo: "link", url: `${SITO}/dashboard/messaggi`, etichetta: "Apri i messaggi nel pannello" });
  return componi(`Nuovo messaggio: ${nome} · ${argomento}`, "Nuovo messaggio dal sito", blocchi);
}
