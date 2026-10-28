/**
 * I testi delle email, in italiano, in due versioni: testo semplice e HTML
 * sobrio (una colonna, nessuna immagine, stili in linea). Qui non si spedisce
 * niente: functions/_lib/mail.ts prende questi contenuti e li passa a Resend.
 *
 * Tutto cio' che arriva dal cliente passa da escapeHtml prima di finire
 * nell'HTML, e da unaRiga prima di finire in un oggetto.
 */

import { etichettaFormula, formulaDi, getFormula, NOMI_NUCLEO, periodoAbbonamento } from "../abbonamento";
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
  /** `mostraIndirizzo`: sotto il bottone, l'indirizzo per intero da copiare (utile quando il link e' lungo e personale). */
  | { tipo: "link"; url: string; etichetta: string; mostraIndirizzo?: boolean };

/**
 * `anteprima`: la riga che la posta mostra accanto all'oggetto, prima di aprire l'email.
 * `motivo`: perche' si riceve (in fondo). `firma`: chiude con "A presto, Matteo" (le email per i clienti).
 */
type Opzioni = { anteprima: string; motivo?: string; firma?: boolean };

/** Per l'oggetto: un nome di cento lettere non deve riempire la riga della posta. */
const breve = (testo: string, massimo = 40) => (testo.length > massimo ? `${testo.slice(0, massimo - 1).trimEnd()}…` : testo);

const conAcapo = (value: string) => escapeHtml(value).replace(/\n/g, "<br>");

/*
 * I colori sono quelli del sito (carta, inchiostro, lime) scritti per esteso: le email non conoscono le variabili CSS.
 * Struttura a tabelle e stili in linea, come vogliono Outlook e i client piu' vecchi; il tema scuro (Apple Mail,
 * Outlook per telefono) e il telefono stretto stanno nel blocco <style>, con !important per battere gli stili in linea.
 */
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const MUTO = "#585d59";
const BORDO_RIGA = "#ece7da";

const STILE = `<style>
@media (prefers-color-scheme: dark){
.fl-sfondo{background:#0e100f !important}
.fl-carta{background:#1a1d1b !important;color:#f3efe6 !important}
.fl-muto{color:#a3aba5 !important}
.fl-riga{border-color:#2c302d !important}
.fl-citazione{background:#0e100f !important;border-left-color:#dfff3e !important;color:#f3efe6 !important}
.fl-bottone{border-color:#dfff3e !important}
.fl-intestazione{background:#000000 !important}
}
@media (max-width:480px){
.fl-pad{padding-left:20px !important;padding-right:20px !important}
.fl-fuori{padding:0 !important}
}
</style>`;

/** Mette insieme testo e HTML dagli stessi blocchi, cosi' le due versioni non divergono. */
function componi(subject: string, titolo: string, blocchi: Blocco[], opzioni: Opzioni): ContenutoEmail {
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
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 20px;width:100%;">${blocco.righe
            .map(([etichetta, valore]) =>
              `<tr><td class="fl-muto fl-riga" width="136" style="width:136px;padding:8px 12px 8px 0;border-bottom:1px solid ${BORDO_RIGA};font-size:14px;line-height:1.45;color:${MUTO};vertical-align:top;">${escapeHtml(etichetta)}</td><td class="fl-riga" style="padding:8px 0;border-bottom:1px solid ${BORDO_RIGA};vertical-align:top;word-break:break-word;">${conAcapo(valore)}</td></tr>`)
            .join("")}</table>`,
        );
        break;
      case "sezione":
        testo.push(blocco.titolo.toUpperCase());
        html.push(`<h2 style="font-size:16px;line-height:1.3;margin:24px 0 8px;">${escapeHtml(blocco.titolo)}</h2>`);
        break;
      case "elenco":
        testo.push(...blocco.voci.map((voce) => `- ${voce}`), "");
        html.push(`<ul style="margin:0 0 16px;padding-left:20px;">${blocco.voci.map((voce) => `<li style="margin:0 0 6px;">${conAcapo(voce)}</li>`).join("")}</ul>`);
        break;
      case "citazione":
        testo.push(`${blocco.titolo}:`, ...blocco.testo.split("\n").map((riga) => `> ${riga}`), "");
        html.push(
          `<p class="fl-muto" style="margin:0 0 6px;font-size:14px;color:${MUTO};">${escapeHtml(blocco.titolo)}</p><div class="fl-citazione" style="margin:0 0 20px;padding:12px 16px;border-left:3px solid #121412;background:#f3efe6;word-break:break-word;">${conAcapo(blocco.testo)}</div>`,
        );
        break;
      case "link": {
        // Nel testo semplice l'indirizzo compare una volta sola, anche se l'HTML lo ripete sotto il bottone.
        testo.push(`${blocco.etichetta}: ${blocco.url}`, "");
        const url = escapeHtml(blocco.url);
        html.push(
          `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px;"><tr><td class="fl-bottone" style="background:#dfff3e;border:2px solid #121412;border-radius:4px;"><a href="${url}" style="display:inline-block;padding:13px 22px;font-size:16px;font-weight:700;line-height:1.2;color:#121412;text-decoration:none;">${escapeHtml(blocco.etichetta)}</a></td></tr></table>`,
        );
        if (blocco.mostraIndirizzo) {
          html.push(
            `<p class="fl-muto" style="margin:0 0 16px;font-size:13px;line-height:1.5;color:${MUTO};">Se il pulsante non funziona, copia questo indirizzo nel browser:<br><a href="${url}" class="fl-muto" style="color:${MUTO};word-break:break-all;overflow-wrap:anywhere;">${url}</a></p>`,
          );
        }
        break;
      }
    }
  }
  if (opzioni.firma) {
    testo.push("A presto,", "Matteo", "");
    html.push(`<p style="margin:8px 0 0;">A presto,<br><strong>Matteo</strong></p>`);
  }
  testo.push("--", ...(opzioni.motivo ? [opzioni.motivo] : []), FIRMA);
  const anteprima = `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(opzioni.anteprima)}${"&nbsp;&zwnj;".repeat(30)}</div>`;
  const piede = `${opzioni.motivo ? `${escapeHtml(opzioni.motivo)}<br>` : ""}${escapeHtml(FIRMA)}`;
  return {
    subject,
    text: testo.join("\n"),
    html: `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><meta name="x-apple-disable-message-reformatting"><title>${escapeHtml(subject)}</title>${STILE}</head><body class="fl-sfondo" style="margin:0;padding:0;background:#f3efe6;">${anteprima}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="fl-sfondo" style="background:#f3efe6;"><tr><td align="center" class="fl-fuori" style="padding:24px 12px;"><!--[if mso]><table role="presentation" width="560" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]--><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;"><tr><td class="fl-intestazione fl-pad" style="background:#121412;padding:16px 24px;border-radius:6px 6px 0 0;font-family:${FONT};font-size:13px;font-weight:700;letter-spacing:0.22em;color:#f3efe6;">FUEL LAB</td></tr><tr><td class="fl-carta fl-pad" style="background:#ffffff;padding:28px 24px 24px;border-radius:0 0 6px 6px;font-family:${FONT};font-size:16px;line-height:1.55;color:#121412;word-break:break-word;overflow-wrap:anywhere;"><h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">${escapeHtml(titolo)}</h1>${html.join("")}</td></tr><tr><td class="fl-muto fl-pad" style="padding:16px 24px 0;font-family:${FONT};font-size:12px;line-height:1.5;color:${MUTO};">${piede}</td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`,
  };
}

/* ---------- Accesso (better-auth) ---------- */

/** I link di better-auth (verifica dell'email, nuova password) durano un'ora. */
const MOTIVO_ACCESSO = "Ricevi questa email perché qualcuno ha usato il tuo indirizzo su fuelchef.it.";

/** Registrazione: conferma dell'indirizzo, serve per entrare nell'area clienti. */
export function emailVerificaEmail(subject: string, url: string): ContenutoEmail {
  return componi(subject, "Conferma la tua email", [
    { tipo: "paragrafo", testo: "Grazie per esserti registrato. Conferma il tuo indirizzo per entrare nell'area clienti: da lì salvi la tua settimana e mandi le richieste a Matteo." },
    { tipo: "link", url, etichetta: "Conferma la mia email", mostraIndirizzo: true },
    { tipo: "paragrafo", testo: "Il link vale un'ora. Se è scaduto, accedi dal sito e te ne mandiamo uno nuovo. Se non ti sei registrato tu, ignora questa email." },
  ], { anteprima: "Un tocco e puoi entrare nell'area clienti FUEL LAB. Il link vale un'ora.", motivo: MOTIVO_ACCESSO });
}

/** "Password dimenticata": il link porta alla pagina dove scriverne una nuova. */
export function emailReimpostaPassword(subject: string, url: string): ContenutoEmail {
  return componi(subject, "Scegli una nuova password", [
    { tipo: "paragrafo", testo: "Hai chiesto di reimpostare la password del tuo account FUEL LAB. Tocca il pulsante per sceglierne una nuova." },
    { tipo: "link", url, etichetta: "Scegli una nuova password", mostraIndirizzo: true },
    { tipo: "paragrafo", testo: "Il link vale un'ora. Se non sei stato tu, ignora questa email: la tua password resta quella di prima." },
  ], { anteprima: "Il link per scegliere una nuova password vale un'ora.", motivo: MOTIVO_ACCESSO });
}

/** Un link di accesso generico (oggetto e titolo li sceglie chi chiama): resta per qualunque altro uso di better-auth. */
export function emailAccesso(subject: string, url: string): ContenutoEmail {
  return componi(subject, subject, [
    { tipo: "paragrafo", testo: "Apri questo link per continuare:" },
    { tipo: "link", url, etichetta: "Continua", mostraIndirizzo: true },
    // better-auth fa durare questi link un'ora (verifica dell'email e nuova password).
    { tipo: "paragrafo", testo: "Il link vale un'ora. Se non hai richiesto questa operazione, ignora questa email." },
  ], { anteprima: "Il link vale un'ora.", motivo: MOTIVO_ACCESSO });
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
  discount?: import("../api").ScontoOrdine | null;
  /** La formula scelta: solo per l'abbonamento. Senza, si legge come un Pranzo (gli abbonamenti nati prima delle formule). */
  subscription?: SceltaAbbonamento | null;
};

/** Il nome per il saluto: la prima parola, con la maiuscola anche se il cliente l'ha scritto in minuscolo ("giulia" -> "Giulia"). */
export function primoNome(nomeCompleto: string): string {
  const primo = unaRiga(nomeCompleto).split(" ")[0] ?? "";
  return primo.charAt(0).toLocaleUpperCase("it-IT") + primo.slice(1);
}

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
function righeSconto(o: { discount?: import("../api").ScontoOrdine | null }): Array<[string, string]> {
  if (!o.discount) return [];
  const s = o.discount;
  return [["Codice sconto", `${s.code}: ${s.percent}%${s.appliedPercent > s.percent ? ` (applicata promozione migliore: ${s.appliedPercent}%)` : ""}`], ["Prima dello sconto", s.baseCents === null ? "Totale da concordare: codice registrato" : euroTesto(s.baseCents)]];
}
function righeRichiesta(o: RichiestaPerEmail): Array<[string, string]> {
  if (o.service === "abbonamento") {
    const scelta = o.subscription;
    const righe: Array<[string, string]> = [
      ["Formula", nomeAbbonamento(o)],
      ["Cosa chiede", getFormula(formulaDi(o)).cosaRicevi],
    ];
    // Chi si abbona lo porta la scelta salvata: senza (un abbonamento vecchio) non si inventa.
    if (scelta) {
      righe.push(["Chi si abbona", NOMI_NUCLEO[scelta.household]]);
    }
    if (o.price_cents !== null && o.price_cents !== undefined) righe.push(["Prezzo proposto", `${euroTesto(o.price_cents)} al mese`]);
    righe.push(["Inizio desiderato", o.requested_date ? dataEstesa(o.requested_date) : "Da concordare"]);
    return [...righe, ...righeSconto(o)];
  }
  return [
    ...righeSconto(o),
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
      // Con la consegna il comune e' gia' nell'indirizzo: ripeterlo e' solo rumore.
      ...(o.fulfillment === "delivery" ? [] : [["Comune", o.comune || "—"] as [string, string]]),
      ...righeRichiesta(o),
    ] },
  ];
  const giorni = piattiPerGiorno(o.items);
  if (giorni.length) {
    blocchi.push({ tipo: "sezione", titolo: abbonamento ? "Piatti indicati dal cliente" : "Piatti per giorno" }, { tipo: "elenco", voci: giorni });
  }
  if (o.notes) blocchi.push({ tipo: "citazione", titolo: abbonamento ? "La scheda del cliente" : "Note del cliente", testo: o.notes });
  blocchi.push({ tipo: "link", url: linkPannello(o.id), etichetta: "Apri la richiesta nel pannello" });
  if (o.email) blocchi.push({ tipo: "paragrafo", testo: `Rispondi a questa email per scrivere direttamente a ${o.email}.` });
  const cosa = abbonamento ? `Abbonamento ${nomeAbbonamento(o)}` : `${o.meals} ${o.meals === 1 ? "pasto" : "pasti"}`;
  // L'anteprima della posta: chi, cosa e dove, senza aprire l'email.
  const dove = o.fulfillment === "delivery" ? `consegna a ${o.comune || "indirizzo da vedere"}` : "ritiro in laboratorio";
  const quando = o.requested_date ? ` · ${abbonamento ? "inizio " : ""}${dataEstesa(o.requested_date)}` : "";
  return componi(`Nuova richiesta: ${breve(nome)} · ${cosa}`, abbonamento ? "Nuova richiesta di abbonamento dal sito" : "Nuova richiesta dal sito", blocchi, {
    anteprima: `${nome} · ${ETICHETTE_SERVIZIO[o.service] ?? o.service} · ${dove}${quando}`,
    motivo: "Avviso automatico del sito per Matteo.",
  });
}

/** (d) Richiesta annullata dal cliente -> a Matteo. */
export function emailAnnullataDalCliente(o: RichiestaPerEmail): ContenutoEmail {
  const nome = unaRiga(o.customer_name) || "Cliente";
  return componi(`Richiesta annullata: ${breve(nome)}`, "Il cliente ha annullato la richiesta", [
    { tipo: "paragrafo", testo: `${nome} ha annullato la richiesta prima della conferma. Non serve fare altro.` },
    { tipo: "righe", righe: [
      ["Cliente", nome],
      ["Email", o.email || "—"],
      ["Telefono", o.phone || "—"],
      ["Servizio", ETICHETTE_SERVIZIO[o.service] ?? o.service],
      ...righeRichiesta(o).filter(([etichetta]) => etichetta !== "Cosa chiede"),
    ] },
    { tipo: "link", url: linkPannello(o.id), etichetta: "Apri la richiesta nel pannello" },
  ], { anteprima: `${nome} ha annullato la richiesta prima della conferma. Non serve fare altro.`, motivo: "Avviso automatico del sito per Matteo." });
}

/* ---------- Ricevuta al cliente ---------- */

/** "La tua richiesta di ... e' arrivata": il servizio come si dice dopo "di". */
const COSA_RICHIESTA: Record<Servizio, string> = {
  "menu-settimana": "menu della settimana",
  abbonamento: "abbonamento",
  "sui-tuoi-macro": "pasti sui tuoi macro",
  "home-cooking": "home cooking",
};

/**
 * (e) Richiesta ricevuta -> al cliente, appena la invia. Chi chiude la pagina dopo "Invia" ha in mano
 * una prova che e' arrivata, e legge subito la differenza fra richiesta, ordine confermato e pagamento.
 * Le righe sono le stesse della richiesta per Matteo, senza i dati interni.
 */
export function emailRichiestaRicevuta(o: RichiestaPerEmail): ContenutoEmail {
  const nome = primoNome(o.customer_name);
  const abbonamento = o.service === "abbonamento";
  const righe: Array<[string, string]> = [["Servizio", ETICHETTE_SERVIZIO[o.service] ?? o.service]];
  righe.push(...righeRichiesta(o).filter(([etichetta]) => etichetta !== "Cosa chiede"));
  righe.push(["Dove", o.fulfillment === "delivery" ? [o.address, o.comune].filter(Boolean).join(", ") : `${INDIRIZZO_LABORATORIO} (ritiro in laboratorio)`]);
  const cosa = abbonamento ? `abbonamento ${nomeAbbonamento(o)}` : COSA_RICHIESTA[o.service] ?? "pasti";
  const blocchi: Blocco[] = [
    { tipo: "paragrafo", testo: `La tua richiesta di ${cosa} è arrivata a Matteo: la guarda al più presto e ti risponde.` },
    { tipo: "paragrafo", testo: notaStato({ status: "requested", paid: 0 } as AggiornamentoPerEmail, abbonamento) ?? "" },
    { tipo: "righe", righe },
  ];
  const giorni = abbonamento ? [] : piattiPerGiorno(o.items);
  if (giorni.length) blocchi.push({ tipo: "sezione", titolo: "I piatti che hai scelto" }, { tipo: "elenco", voci: giorni });
  blocchi.push(
    { tipo: "link", url: `${SITO}/account?sezione=richieste`, etichetta: "Vedi la richiesta nel tuo account" },
    { tipo: "paragrafo", testo: "Finché Matteo non l'ha confermata puoi annullarla dal tuo account. Per qualsiasi domanda rispondi pure a questa email." },
  );
  return componi("Richiesta ricevuta · FUEL LAB", nome ? `Ciao ${nome},` : "Ciao,", blocchi, {
    anteprima: "È arrivata a Matteo. Non è ancora un ordine confermato e non c'è niente da pagare adesso.",
    motivo: "Ricevi questa email perché hai fatto una richiesta su fuelchef.it.",
    firma: true,
  });
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

/** L'oggetto dice la novita' (non "Aggiornamento": e' la parola che si perde in mezzo alle altre) e chiude col nome del sito. */
const OGGETTO_STATO: Record<StatoOrdine, string> = {
  requested: "Richiesta in attesa di conferma",
  confirmed: "Richiesta confermata",
  preparing: "Stiamo preparando i tuoi pasti",
  ready: "I tuoi pasti sono pronti",
  completed: "Richiesta conclusa",
  cancelled: "Richiesta annullata",
};

const OGGETTO_ABBONAMENTO: Record<StatoOrdine, string> = {
  requested: "Abbonamento in attesa di conferma",
  confirmed: "Abbonamento confermato",
  preparing: "Abbonamento in corso",
  ready: "Abbonamento in corso",
  completed: "Abbonamento concluso",
  cancelled: "Abbonamento annullato",
};

/** La frase di apertura: per i pasti pronti e consegnati dice anche cosa fare, secondo ritiro o consegna. */
function fraseStato(o: AggiornamentoPerEmail, abbonamento: boolean): string {
  if (abbonamento) return frasiStatoAbbonamento(nomeAbbonamento(o))[o.status];
  if (o.status === "ready") {
    return o.fulfillment === "delivery"
      ? "I tuoi pasti sono pronti: te li portiamo all'indirizzo indicato."
      : "I tuoi pasti sono pronti: puoi ritirarli in laboratorio.";
  }
  if (o.status === "completed" && o.fulfillment !== "delivery") return "La tua richiesta è conclusa. Buon appetito!";
  return FRASI_STATO[o.status];
}

/**
 * Una riga che separa le tre cose che il cliente confonde: la richiesta, l'ordine confermato e il pagamento.
 * Le parole sono quelle dell'area cliente ("Nessun pagamento online: ..."). Su un pagato non si ripete.
 */
function notaStato(o: AggiornamentoPerEmail, abbonamento: boolean): string | null {
  switch (o.status) {
    case "requested":
      return abbonamento
        ? "Finché Matteo non conferma non parte niente e non c'è niente da pagare: ti scrive per concordare inizio, consegna o ritiro e totale."
        : "Non è ancora un ordine confermato e non c'è niente da pagare adesso: Matteo ti conferma disponibilità, giorno e totale prima di cucinare.";
    case "confirmed":
      if (o.paid) return null;
      return abbonamento
        ? "Nessun pagamento online: inizio, consegna o ritiro e pagamento si concordano con Matteo."
        : "Nessun pagamento online: il pagamento si concorda con Matteo.";
    case "cancelled":
      return "Se è stato un errore o vuoi riprovare, rispondi a questa email oppure fai una nuova richiesta dal sito.";
    default:
      return null;
  }
}

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
  discount?: import("../api").ScontoOrdine | null;
  paid: 0 | 1;
  /** La formula scelta: solo per l'abbonamento. */
  subscription?: SceltaAbbonamento | null;
};

/** (c) Aggiornamento dell'ordine -> al cliente. Mai dati interni: niente data di produzione, niente note di Matteo per se'. */
export function emailAggiornamentoCliente(o: AggiornamentoPerEmail, statoCambiato: boolean): ContenutoEmail {
  const nome = primoNome(o.customer_name);
  const etichetta = etichettaStato(o.status, "cliente");
  const abbonamento = o.service === "abbonamento";
  const righe: Array<[string, string]> = [["Stato", abbonamento && o.status === "completed" ? "Concluso" : etichetta]];
  if (abbonamento) righe.push(["Servizio", ETICHETTE_SERVIZIO.abbonamento], ["Formula", nomeAbbonamento(o)]);
  if (o.status !== "cancelled") {
    if (o.fulfillment_date && abbonamento) {
      // Il periodo e' un mese dall'inizio; la prima consegna (o ritiro) e' il primo giorno, poi giorno e orario si concordano con Matteo.
      const { dal, al } = periodoAbbonamento(o.fulfillment_date);
      righe.push(
        ["Periodo", `dal ${dataEstesa(dal)} al ${dataEstesa(al)}`],
        [o.fulfillment === "delivery" ? "Consegna" : "Ritiro", `con giorno e orario concordati, a partire da ${dataEstesa(dal)}`],
      );
    } else if (o.fulfillment_date) {
      righe.push([o.fulfillment === "delivery" ? "Consegna" : "Ritiro", dataEstesa(o.fulfillment_date)]);
    }
    const dove = o.fulfillment === "delivery" ? [o.address, o.comune].filter(Boolean).join(", ") : `${INDIRIZZO_LABORATORIO} (ritiro in laboratorio)`;
    if (dove) righe.push(["Dove", dove]);
  }
  // Su una richiesta annullata un totale non ha senso: non si e' concordato niente.
  if (o.price_cents !== null && o.status !== "cancelled") {
    // Su una richiesta ancora da confermare il prezzo e' una proposta, come nel pannello e nell'area cliente.
    const proposto = o.status === "requested";
    // La proposta di un abbonamento e' un prezzo al mese; il totale concordato lo scrive Matteo.
    const alMese = proposto && abbonamento ? " al mese" : "";
    righe.push([proposto ? "Prezzo proposto" : "Totale concordato", `${euroTesto(o.price_cents)}${alMese}${o.paid ? " · pagato" : ""}`]);
  }
  righe.push(...righeSconto(o));
  const frase = statoCambiato ? fraseStato(o, abbonamento) : "Matteo ti ha scritto un messaggio sulla tua richiesta.";
  const nota = statoCambiato || o.status === "requested" ? notaStato(o, abbonamento) : null;
  const messaggio: Blocco[] = o.customer_message ? [{ tipo: "citazione", titolo: "Messaggio di Matteo", testo: o.customer_message }] : [];
  const blocchi: Blocco[] = [
    { tipo: "paragrafo", testo: frase },
    ...(nota ? [{ tipo: "paragrafo", testo: nota } as Blocco] : []),
    // Quando la novita' e' il messaggio, e' la prima cosa da leggere; con un cambio di stato viene dopo i dettagli.
    ...(statoCambiato ? [] : messaggio),
    { tipo: "righe", righe },
    ...(statoCambiato ? messaggio : []),
    { tipo: "link", url: `${SITO}/account?sezione=richieste`, etichetta: "Vedi la richiesta nel tuo account" },
    { tipo: "paragrafo", testo: "Per qualsiasi domanda rispondi pure a questa email." },
  ];
  const subject = statoCambiato
    ? `${abbonamento ? OGGETTO_ABBONAMENTO[o.status] : OGGETTO_STATO[o.status]} · FUEL LAB`
    : "Un messaggio di Matteo sulla tua richiesta · FUEL LAB";
  const anteprima = statoCambiato ? frase : `Matteo ti ha scritto: ${unaRiga(o.customer_message).slice(0, 120) || "apri l'email per leggere"}`;
  return componi(subject, nome ? `Ciao ${nome},` : "Ciao,", blocchi, {
    anteprima,
    motivo: "Ricevi questa email perché hai fatto una richiesta su fuelchef.it.",
    firma: true,
  });
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
  return componi(`Nuovo messaggio: ${breve(nome)} · ${argomento}`, "Nuovo messaggio dal sito", blocchi, {
    anteprima: `${nome} · ${argomento}: ${unaRiga(m.message).slice(0, 110)}`,
    motivo: "Avviso automatico del sito per Matteo.",
  });
}
