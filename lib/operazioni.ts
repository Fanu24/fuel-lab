/* =========================================================================
   Il lavoro di Matteo, in funzioni pure.

   Qui non c'e' React e non c'e' rete: date, code operative, filtri, CSV e
   testi pronti si calcolano da una lista di ordini (il contratto di
   lib/api.ts) e da "oggi" passato come argomento. Il pannello si limita a
   mostrarli, e i test li provano senza browser.

   Le date di calendario sono "YYYY-MM-DD" nel fuso di Roma; per spostarsi di
   un giorno si lavora a mezzogiorno UTC, cosi' il cambio dell'ora legale non
   fa mai saltare o ripetere una data.
   ========================================================================= */

import { NOMI_FASCIA, fineAbbonamento, formulaDi, frasePeriodo, getFormula, periodoAbbonamento } from "@/lib/abbonamento";
import { etichettaStato, ETICHETTE_SERVIZIO, type Chiusura, type Ordine, type Servizio, type StatoOrdine, type VoceOrdine } from "@/lib/api";
import { chiusuraDi } from "@/lib/impostazioni";
import { abbonamentiDelGiorno, contaPastiAbbonamenti, dettaglioAbbonamento, eAbbonamento, isData, nomeAbbonamento, pastiDelPeriodo } from "@/lib/produzione";
import { GIORNI, NOMI_GIORNATA, NOMI_GIORNO, type Allenamenti, type GiornoSettimana, type TipoGiornata } from "@/lib/settimana";

/* ---------- Stati ---------- */

export const STATI_APERTI: readonly StatoOrdine[] = ["requested", "confirmed", "preparing", "ready"];

export const aperto = (o: Pick<Ordine, "status">) => o.status !== "completed" && o.status !== "cancelled";

/** Oltre "requested" (tranne l'annullamento) il server vuole entrambe le date. */
export const servonoDate = (stato: StatoOrdine) => stato !== "requested" && stato !== "cancelled";

type Azione = { stato: StatoOrdine; verbo: string; fatto: string };

/**
 * Il passo successivo naturale di un ordine: il bottone grande della scheda.
 * Per l'abbonamento `fine` e' l'ultimo giorno del periodo: finche' il mese e'
 * in corso non c'e' niente da premere (le consegne seguono il calendario ogni
 * 3 giorni), a mese finito il passo e' chiuderlo.
 */
export function prossimaAzione(
  stato: StatoOrdine,
  modalita: Ordine["fulfillment"] = "pickup",
  abbonamento?: { fine: string | null; oggi: string },
): Azione | null {
  if (abbonamento) {
    if (stato === "requested") return { stato: "confirmed", verbo: "Conferma l'abbonamento", fatto: "Abbonamento confermato" };
    const attivo = stato === "confirmed" || stato === "preparing" || stato === "ready";
    if (attivo && abbonamento.fine && abbonamento.fine < abbonamento.oggi) {
      return { stato: "completed", verbo: "Segna concluso", fatto: "Abbonamento concluso" };
    }
    return null;
  }
  switch (stato) {
    case "requested":
      return { stato: "confirmed", verbo: "Conferma l'ordine", fatto: "Ordine confermato" };
    case "confirmed":
      return { stato: "preparing", verbo: "Inizia la preparazione", fatto: "Preparazione iniziata" };
    case "preparing":
      return { stato: "ready", verbo: "Segna pronto", fatto: "Ordine pronto" };
    case "ready":
      return modalita === "pickup"
        ? { stato: "completed", verbo: "Segna ritirato", fatto: "Ordine ritirato" }
        : { stato: "completed", verbo: "Segna consegnato", fatto: "Ordine consegnato" };
    default:
      return null;
  }
}

/* ---------- Date ---------- */

const FUSO = "Europe/Rome";

/** Oggi a Roma, "YYYY-MM-DD". */
export function oggiRoma(ora: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" }).format(ora);
}

export function spostaGiorni(data: string, giorni: number) {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + giorni);
  return d.toISOString().slice(0, 10);
}

/** 0 = domenica, 1 = lunedi ... 6 = sabato. */
export const giornoDellaSettimana = (data: string) => new Date(`${data}T12:00:00Z`).getUTCDay();

/**
 * Matteo cucina ogni giorno e consegna ogni giorno: restano fuori solo i
 * periodi di chiusura che segna in Impostazioni (`chiusure`, da GET /api/settings).
 */
export const eGiornoDiCucina = (data: string, chiusure: readonly Chiusura[] = []) => !chiusuraDi(data, chiusure);

/** I prossimi `quanti` giorni di cucina a partire da `da` (compreso), saltando le chiusure. */
export function prossimiGiorniCucina(da: string, quanti = 3, chiusure: readonly Chiusura[] = []) {
  const giorni: string[] = [];
  // Un anno di ricerca basta e avanza: oltre, le chiusure coprono tutto e si smette.
  for (let d = da, i = 0; giorni.length < quanti && i < 366; d = spostaGiorni(d, 1), i++) {
    if (eGiornoDiCucina(d, chiusure)) giorni.push(d);
  }
  return giorni;
}

/**
 * Le date da proporre quando Matteo conferma un ordine che non le ha.
 * Si cucina lo stesso giorno del ritiro o della consegna: il giorno chiesto
 * dal cliente se e' valido e futuro, altrimenti domani, saltando i giorni di
 * chiusura. Per l'abbonamento e' la data d'inizio. Una data gia' scritta non
 * si tocca, e la produzione non supera mai l'uscita (regola del server).
 */
export function dateSuggerite(
  o: Pick<Ordine, "requested_date" | "production_date" | "fulfillment_date">,
  oggi: string,
  chiusure: readonly Chiusura[] = [],
): { produzione: string; uscita: string } {
  const produzioneFissata = o.production_date ?? null;
  const uscitaFissata = o.fulfillment_date ?? null;
  if (produzioneFissata) {
    return { produzione: produzioneFissata, uscita: uscitaFissata && uscitaFissata >= produzioneFissata ? uscitaFissata : produzioneFissata };
  }
  if (uscitaFissata) return { produzione: uscitaFissata, uscita: uscitaFissata };
  const partenza = isData(o.requested_date) && o.requested_date > oggi ? o.requested_date : spostaGiorni(oggi, 1);
  const giorno = prossimiGiorniCucina(partenza, 1, chiusure)[0] ?? partenza;
  return { produzione: giorno, uscita: giorno };
}

/** "Oggi", "Domani", "Dopodomani": le scorciatoie delle date nel pannello. */
export function scorciatoieDate(oggi: string): { nome: string; data: string }[] {
  return ["Oggi", "Domani", "Dopodomani"].map((nome, i) => ({ nome, data: spostaGiorni(oggi, i) }));
}

/* ---------- Abbonamenti ---------- */

/** L'ultimo giorno del periodo di un abbonamento confermato (dalla data d'inizio), o null. */
export const fineDi = (o: Pick<Ordine, "service" | "fulfillment_date">) =>
  eAbbonamento(o) && isData(o.fulfillment_date) ? fineAbbonamento(o.fulfillment_date) : null;

/** Il passo successivo di un ordine vero, abbonamento compreso. */
export const prossimaAzioneDi = (o: Pick<Ordine, "status" | "fulfillment" | "service" | "fulfillment_date">, oggi: string) =>
  prossimaAzione(o.status, o.fulfillment, eAbbonamento(o) ? { fine: fineDi(o), oggi } : undefined);

/** "dal 5 ottobre al 4 novembre" per un abbonamento con la data d'inizio, altrimenti null. */
export function periodoDi(o: Pick<Ordine, "service" | "fulfillment_date">, oggi: string): string | null {
  return eAbbonamento(o) && isData(o.fulfillment_date) ? frasePeriodo(periodoAbbonamento(o.fulfillment_date), oggi) : null;
}

/** Lo stato come lo legge Matteo: un abbonamento chiuso e' "Concluso", un ritiro fatto e' "Ritirato". */
export function etichettaStatoOrdine(o: Pick<Ordine, "status" | "fulfillment"> & { service?: Servizio }) {
  if (o.status === "completed" && o.service === "abbonamento") return "Concluso";
  if (o.status === "completed" && o.fulfillment === "pickup") return "Ritirato";
  return etichettaStato(o.status);
}

/* ---------- Soldi ---------- */

/**
 * Il prezzo scritto da Matteo -> centesimi.
 * "" -> null (nessun prezzo); "12", "12,5", "12,50", "12.50", "1.250,00", "€ 45" -> centesimi;
 * testo non valido -> undefined.
 */
export function leggiEuro(testo: string): number | null | undefined {
  let t = testo.replace(/€|\s/g, "");
  if (!t) return null;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  const m = /^(\d{1,6})(?:\.(\d{1,2}))?$/.exec(t);
  if (!m) return undefined;
  return Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0"));
}

/** 1250 -> "12,50" per il campo del prezzo; null -> "". */
export function centesimiInTesto(c: number | null | undefined) {
  if (c === null || c === undefined) return "";
  return `${Math.floor(c / 100)},${String(c % 100).padStart(2, "0")}`;
}

/**
 * Ordine con un prezzo concordato e non ancora pagato. Annullati esclusi, e
 * anche le richieste da confermare: li' il prezzo e' solo una proposta.
 */
export const daIncassare = (o: Ordine) =>
  o.status !== "cancelled" && o.status !== "requested" && (o.price_cents ?? 0) > 0 && !o.paid;

export const sommaCentesimi = (ordini: Ordine[]) => ordini.reduce((s, o) => s + (o.price_cents ?? 0), 0);

/* ---------- Code operative ---------- */

/**
 * Una data e' passata e lo stato non si e' mosso. Per un abbonamento in corso
 * conta la fine del periodo: a mese finito va chiuso (o rinnovato).
 */
export function inRitardo(o: Ordine, oggi: string) {
  if (!aperto(o)) return false;
  if (o.status === "requested") return !!o.requested_date && o.requested_date < oggi;
  if (eAbbonamento(o)) {
    const fine = fineDi(o);
    return !!fine && fine < oggi;
  }
  if (o.status === "ready") return !!o.fulfillment_date && o.fulfillment_date < oggi;
  return (!!o.production_date && o.production_date < oggi) || (!!o.fulfillment_date && o.fulfillment_date < oggi);
}

const senzaDate = (o: Ordine) => aperto(o) && o.status !== "requested" && (!o.production_date || !o.fulfillment_date);
const inCucina = (o: Ordine) => o.status === "confirmed" || o.status === "preparing";
const esce = (o: Ordine) => o.status !== "requested" && o.status !== "cancelled";
const pasti = (ordini: Ordine[]) => ordini.reduce((s, o) => s + o.meals, 0);

/**
 * Le code della giornata. Un abbonamento non e' un ordine in cucina il giorno
 * della sua data (e' l'inizio del periodo): entra nella giornata quando ha una
 * consegna, una ogni 3 giorni, e porta i pasti dei tre giorni coperti. Quegli
 * abbonamenti stanno in `abbonamentiOggi`, le loro consegne fra le uscite e i
 * loro pasti si sommano alle porzioni.
 *
 * Una consegna di abbonamento non ha uno stato "consegnato" (chiuderebbe
 * l'abbonamento): quelle gia' fatte le segna Matteo sul telefono e arrivano
 * qui come `abbonamentiConsegnati`, un insieme di id, cosi' non risultano piu'
 * "da fare".
 */
export function codeOperative(ordini: Ordine[], oggi: string, abbonamentiConsegnati: ReadonlySet<string> = new Set()) {
  const aperti = ordini.filter(aperto);
  const cucinaOggi = aperti.filter((o) => !eAbbonamento(o) && o.production_date === oggi && inCucina(o));
  const abbonamentiOggi = abbonamentiDelGiorno(ordini, oggi);
  const pastiAbbonamentiOggi = contaPastiAbbonamenti(abbonamentiOggi, oggi);
  const usciteOggi = [...ordini.filter((o) => !eAbbonamento(o) && o.fulfillment_date === oggi && esce(o)), ...abbonamentiOggi];
  const nonPagati = ordini.filter(daIncassare);
  return {
    aperti,
    daConfermare: aperti.filter((o) => o.status === "requested"),
    senzaDate: aperti.filter(senzaDate),
    /** Tutti gli aperti con una data passata, richieste comprese. */
    inRitardo: aperti.filter((o) => inRitardo(o, oggi)),
    cucinaOggi,
    /** Gli abbonamenti in corso che hanno una consegna (o un ritiro) oggi. */
    abbonamentiOggi,
    /** I pasti che portano le consegne di oggi in abbonamento. */
    pastiAbbonamentiOggi,
    /** Le porzioni degli ordini di oggi piu' i pasti delle consegne in abbonamento. */
    porzioniOggi: pasti(cucinaOggi) + pastiAbbonamentiOggi,
    /** Ritiri e consegne di oggi: gli ordini e, fra loro, le consegne degli abbonamenti. */
    usciteOggi,
    usciteDaFare: usciteOggi.filter((o) => (eAbbonamento(o) ? !abbonamentiConsegnati.has(o.id) : o.status !== "completed")),
    pronti: aperti.filter((o) => o.status === "ready"),
    nonPagati,
    consegnatiNonPagati: nonPagati.filter((o) => o.status === "completed"),
  };
}

export type CodeOperative = ReturnType<typeof codeOperative>;

/* ---------- Da fare adesso ---------- */

export type Tono = "allarme" | "attenzione" | "info";

export type AzioneDaFare = {
  id: "ritardo" | "mese-finito" | "conferma" | "date" | "cucina" | "uscite" | "messaggi" | "incassa";
  testo: string;
  dettaglio: string;
  href: string;
  tono: Tono;
  quanti: number;
};

export const plurale = (n: number, uno: string, tanti: string) => `${n} ${n === 1 ? uno : tanti}`;

/** "Giulia Rossi, Marco Bianchi e altri 2". */
export function elencoNomi(ordini: Pick<Ordine, "customer_name">[], massimo = 2) {
  // Stesso cliente con due ordini: il nome si scrive una volta sola.
  const tutti = [...new Set(ordini.map((o) => o.customer_name.trim() || "Senza nome"))];
  const nomi = tutti.slice(0, massimo);
  const resto = tutti.length - nomi.length;
  if (resto <= 0) return nomi.length > 1 ? `${nomi.slice(0, -1).join(", ")} e ${nomi.at(-1)}` : nomi[0] ?? "";
  return `${nomi.join(", ")} e ${resto === 1 ? "un altro" : `altri ${resto}`}`;
}

const ORDINI = "/dashboard/ordini";
/** Un solo ordine: si apre direttamente. Piu' ordini: la lista filtrata. */
const verso = (lista: Ordine[], filtro: string) => (lista.length === 1 ? `${ORDINI}?id=${encodeURIComponent(lista[0].id)}` : `${ORDINI}?${filtro}`);

const formatoEuro = (c: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(c / 100);

/**
 * Le cose da fare, dalla piu' urgente: ogni voce e' una frase con un verbo e un
 * link che porta dritto al lavoro (un ordine solo si apre, piu' ordini si filtrano).
 */
export function azioniDaFare(
  ordini: Ordine[],
  oggi: string,
  messaggiNuovi = 0,
  abbonamentiConsegnati: ReadonlySet<string> = new Set(),
): AzioneDaFare[] {
  const c = codeOperative(ordini, oggi, abbonamentiConsegnati);
  const azioni: AzioneDaFare[] = [];

  // Un abbonamento a mese finito non e' un ordine in ritardo: non c'e' una data da spostare, si chiude o si rinnova.
  const ritardo = c.inRitardo.filter((o) => o.status !== "requested" && !eAbbonamento(o));
  const meseFinito = c.inRitardo.filter((o) => o.status !== "requested" && eAbbonamento(o));
  if (ritardo.length) {
    azioni.push({
      id: "ritardo",
      testo: `${plurale(ritardo.length, "ordine", "ordini")} in ritardo`,
      dettaglio: `${elencoNomi(ritardo)}: la data è passata, aggiorna lo stato o sposta le date.`,
      href: verso(ritardo, "solo=ritardo"),
      tono: "allarme",
      quanti: ritardo.length,
    });
  }
  if (meseFinito.length) {
    azioni.push({
      id: "mese-finito",
      testo: `${plurale(meseFinito.length, "abbonamento", "abbonamenti")} a mese finito`,
      dettaglio: `${elencoNomi(meseFinito)}: il periodo è scaduto, segna concluso o concorda il rinnovo.`,
      href: verso(meseFinito, "solo=mese-finito"),
      tono: "allarme",
      quanti: meseFinito.length,
    });
  }
  if (c.daConfermare.length) {
    const scadute = c.daConfermare.filter((o) => inRitardo(o, oggi)).length;
    azioni.push({
      id: "conferma",
      testo: `Conferma ${plurale(c.daConfermare.length, "richiesta nuova", "richieste nuove")}`,
      dettaglio: elencoNomi(c.daConfermare) + (scadute ? ` · ${plurale(scadute, "ha", "hanno")} già la data preferita passata` : ""),
      href: verso(c.daConfermare, "stato=requested"),
      tono: scadute ? "allarme" : "attenzione",
      quanti: c.daConfermare.length,
    });
  }
  if (c.senzaDate.length) {
    azioni.push({
      id: "date",
      testo: `Assegna le date a ${plurale(c.senzaDate.length, "ordine", "ordini")}`,
      dettaglio: `${elencoNomi(c.senzaDate)}: manca il giorno di cucina o di ritiro.`,
      href: verso(c.senzaDate, "solo=senza-date"),
      tono: "attenzione",
      quanti: c.senzaDate.length,
    });
  }
  if (c.cucinaOggi.length || c.abbonamentiOggi.length) {
    const parti = [
      c.cucinaOggi.length ? plurale(c.cucinaOggi.length, "ordine", "ordini") : "",
      c.abbonamentiOggi.length
        ? `${plurale(c.abbonamentiOggi.length, "consegna di abbonamento", "consegne di abbonamento")} (${plurale(c.pastiAbbonamentiOggi, "pasto", "pasti")})`
        : "",
    ].filter(Boolean);
    azioni.push({
      id: "cucina",
      testo: `Cucina ${plurale(c.porzioniOggi, "porzione", "porzioni")} oggi`,
      dettaglio: `${parti.join(" e ")} · apri il foglio cucina con piatti ed extra.`,
      href: "/dashboard/produzione",
      tono: "info",
      // Il numero grande dice le porzioni, come il titolo ("Cucina 12 porzioni oggi").
      quanti: c.porzioniOggi,
    });
  }
  if (c.usciteDaFare.length) {
    const ritiri = c.usciteDaFare.filter((o) => o.fulfillment === "pickup").length;
    const consegne = c.usciteDaFare.length - ritiri;
    const parti = [ritiri ? plurale(ritiri, "ritiro", "ritiri") : "", consegne ? plurale(consegne, "consegna a domicilio", "consegne a domicilio") : ""];
    const inAbbonamento = c.usciteDaFare.filter(eAbbonamento).length;
    azioni.push({
      id: "uscite",
      testo: `Consegna ${plurale(c.usciteDaFare.length, "ordine", "ordini")} oggi`,
      dettaglio: parti.filter(Boolean).join(" · ") + (inAbbonamento ? ` (di cui ${inAbbonamento} in abbonamento)` : ""),
      href: "/dashboard#oggi-uscita",
      tono: "info",
      quanti: c.usciteDaFare.length,
    });
  }
  if (messaggiNuovi > 0) {
    azioni.push({
      id: "messaggi",
      testo: `Rispondi a ${plurale(messaggiNuovi, "messaggio", "messaggi")}`,
      dettaglio: "Dal modulo contatti del sito.",
      href: "/dashboard/messaggi",
      tono: "attenzione",
      quanti: messaggiNuovi,
    });
  }
  if (c.consegnatiNonPagati.length) {
    azioni.push({
      id: "incassa",
      testo: `Incassa ${formatoEuro(sommaCentesimi(c.consegnatiNonPagati))} da ${plurale(c.consegnatiNonPagati.length, "ordine consegnato", "ordini consegnati")}`,
      dettaglio: elencoNomi(c.consegnatiNonPagati),
      href: verso(c.consegnatiNonPagati, "solo=incassare"),
      tono: "attenzione",
      quanti: c.consegnatiNonPagati.length,
    });
  }
  return azioni;
}

/* ---------- Calendario dei prossimi giorni ---------- */

export type GiornoCalendario = {
  data: string;
  oggi: boolean;
  /** La chiusura decisa da Matteo che cade in quel giorno, se c'e'. */
  chiusura: Chiusura | null;
  /** Porzioni con produzione in quel giorno (confermati e in preparazione). */
  porzioni: number;
  ordiniInCucina: number;
  /** Abbonamenti che hanno una consegna (o un ritiro) quel giorno: una ogni 3 giorni ciascuno. */
  abbonamenti: number;
  /** I pasti che portano quelle consegne. */
  pastiAbbonamenti: number;
  /** Ritiri e consegne con uscita in quel giorno, comprese quelle degli abbonamenti. */
  uscite: number;
  ritiri: number;
  consegne: number;
  /** Richieste ancora da confermare che chiedono quel giorno. */
  richieste: number;
};

/** I prossimi giorni, oggi compreso. Si cucina ogni giorno: `chiusure` segna i giorni in cui Matteo e' chiuso. */
export function calendario(ordini: Ordine[], oggi: string, giorni = 7, chiusure: readonly Chiusura[] = []): GiornoCalendario[] {
  return Array.from({ length: giorni }, (_, i) => {
    const data = spostaGiorni(oggi, i);
    const cucina = ordini.filter((o) => !eAbbonamento(o) && o.production_date === data && inCucina(o));
    const abbonamenti = abbonamentiDelGiorno(ordini, data);
    const uscite = [...ordini.filter((o) => !eAbbonamento(o) && o.fulfillment_date === data && esce(o)), ...abbonamenti];
    const ritiri = uscite.filter((o) => o.fulfillment === "pickup").length;
    return {
      data,
      oggi: i === 0,
      chiusura: chiusuraDi(data, chiusure),
      porzioni: pasti(cucina),
      ordiniInCucina: cucina.length,
      abbonamenti: abbonamenti.length,
      pastiAbbonamenti: contaPastiAbbonamenti(abbonamenti, data),
      uscite: uscite.length,
      ritiri,
      consegne: uscite.length - ritiri,
      richieste: ordini.filter((o) => o.status === "requested" && o.requested_date === data).length,
    };
  });
}

/* ---------- Piatti ---------- */

/** Piatti ed extra sommati su piu' ordini, dal piu' frequente. Ogni voce e' una porzione. */
export function contaVoci(ordini: Ordine[], tipo: "piatti" | "extra"): [string, number][] {
  const conti = new Map<string, number>();
  for (const o of ordini) for (const v of o.items) {
    for (const nome of tipo === "piatti" ? [v.name] : v.extras) conti.set(nome, (conti.get(nome) ?? 0) + 1);
  }
  return [...conti.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "it"));
}

export type GiornoPiatti = {
  giorno: string;
  nome: string;
  allenamento: TipoGiornata | null;
  pranzo: VoceOrdine[];
  cena: VoceOrdine[];
};

const posizioneGiorno = (g: string) => {
  const i = (GIORNI as readonly string[]).indexOf(g);
  return i === -1 ? GIORNI.length : i;
};

/**
 * Le voci di un ordine raggruppate per giorno, nella griglia pranzo/cena.
 * Entrano anche i giorni che hanno solo l'allenamento, cosi' la settimana si
 * legge intera.
 */
export function vociPerGiorno(voci: VoceOrdine[], allenamenti: Allenamenti = {}): GiornoPiatti[] {
  const giorni = new Map<string, GiornoPiatti>();
  const prendi = (g: string) => {
    let giorno = giorni.get(g);
    if (!giorno) {
      const tipo = (allenamenti as Record<string, TipoGiornata | undefined>)[g] ?? null;
      giorno = { giorno: g, nome: NOMI_GIORNO[g as GiornoSettimana] ?? g, allenamento: tipo, pranzo: [], cena: [] };
      giorni.set(g, giorno);
    }
    return giorno;
  };
  for (const v of voci) (v.meal === "cena" ? prendi(v.day).cena : prendi(v.day).pranzo).push(v);
  for (const g of Object.keys(allenamenti)) if ((allenamenti as Record<string, unknown>)[g]) prendi(g);
  return [...giorni.values()].sort((a, b) => posizioneGiorno(a.giorno) - posizioneGiorno(b.giorno));
}

export const nomeAllenamento = (t: TipoGiornata) => NOMI_GIORNATA[t];

/* ---------- Filtri e ricerca ---------- */

export type FiltroStato = "aperti" | StatoOrdine | "tutti";
export type FiltroSpeciale = "ritardo" | "mese-finito" | "senza-date" | "incassare" | "abbonamenti";

export const FILTRI_STATO: { id: FiltroStato; label: string }[] = [
  { id: "aperti", label: "Aperti" },
  { id: "requested", label: "Da confermare" },
  { id: "confirmed", label: "Confermati" },
  { id: "preparing", label: "In preparazione" },
  { id: "ready", label: "Pronti" },
  { id: "completed", label: "Consegnati" },
  { id: "cancelled", label: "Annullati" },
  { id: "tutti", label: "Tutti" },
];

export const FILTRI_SPECIALI: Record<FiltroSpeciale, string> = {
  ritardo: "In ritardo",
  "mese-finito": "Mese finito",
  "senza-date": "Senza date",
  incassare: "Da incassare",
  abbonamenti: "Abbonamenti",
};

export const leggiFiltroStato = (v: string | null): FiltroStato =>
  FILTRI_STATO.some((f) => f.id === v) ? (v as FiltroStato) : "aperti";

export const leggiFiltroSpeciale = (v: string | null): FiltroSpeciale | null =>
  v && Object.prototype.hasOwnProperty.call(FILTRI_SPECIALI, v) ? (v as FiltroSpeciale) : null;

/**
 * Lo stato che vale quando l'indirizzo non lo dice: "Da incassare" comprende i
 * consegnati, quindi senza uno stato esplicito si guarda tutto; negli altri casi
 * si parte dagli aperti.
 */
export function statoDaIndirizzo(stato: string | null, solo: string | null): FiltroStato {
  if (!stato && leggiFiltroSpeciale(solo) === "incassare") return "tutti";
  return leggiFiltroStato(stato);
}

/**
 * Scrive i filtri in `?stato=&solo=&q=`, cosi' l'indirizzo si puo' copiare e
 * mandare. Entra solo cio' che differisce dal predefinito; gli altri parametri
 * (?id=, ?nuovo=) restano come sono.
 */
export function filtriNelIndirizzo(params: URLSearchParams, filtri: Filtri): URLSearchParams {
  const p = new URLSearchParams(params);
  const solo = filtri.speciale;
  if (filtri.stato === statoDaIndirizzo(null, solo)) p.delete("stato");
  else p.set("stato", filtri.stato);
  if (solo) p.set("solo", solo);
  else p.delete("solo");
  const q = filtri.ricerca.trim();
  if (q) p.set("q", q);
  else p.delete("q");
  return p;
}

export function passaStato(o: Ordine, filtro: FiltroStato) {
  if (filtro === "tutti") return true;
  if (filtro === "aperti") return aperto(o);
  return o.status === filtro;
}

export function passaSpeciale(o: Ordine, filtro: FiltroSpeciale | null, oggi: string) {
  // Come "Da fare adesso": le richieste con la data preferita passata stanno in "Da confermare", un abbonamento a mese finito ha il suo filtro.
  if (filtro === "ritardo") return o.status !== "requested" && !eAbbonamento(o) && inRitardo(o, oggi);
  if (filtro === "mese-finito") return o.status !== "requested" && eAbbonamento(o) && inRitardo(o, oggi);
  if (filtro === "senza-date") return senzaDate(o);
  if (filtro === "incassare") return daIncassare(o);
  if (filtro === "abbonamenti") return eAbbonamento(o);
  return true;
}

const semplifica = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("it").trim();

/** Cerca in nome, email, comune, indirizzo, id, formula (per gli abbonamenti) e telefono (il telefono per sole cifre). */
export function corrisponde(o: Ordine, ricerca: string) {
  const q = semplifica(ricerca);
  if (!q) return true;
  const cifre = q.replace(/\D/g, "");
  if (cifre.length >= 3 && o.phone.replace(/\D/g, "").includes(cifre)) return true;
  return [o.customer_name, o.email, o.comune, o.address, o.id, eAbbonamento(o) ? nomeAbbonamento(o) : ""].some((campo) =>
    semplifica(campo ?? "").includes(q),
  );
}

export type Filtri = { stato: FiltroStato; speciale: FiltroSpeciale | null; ricerca: string };

export function filtraOrdini(ordini: Ordine[], filtri: Filtri, oggi: string) {
  return ordina(
    ordini.filter((o) => passaStato(o, filtri.stato) && passaSpeciale(o, filtri.speciale, oggi) && corrisponde(o, filtri.ricerca)),
    oggi,
  );
}

/** Quanti ordini per ogni chip, dopo ricerca e filtro speciale. */
export function contaPerStato(ordini: Ordine[], filtri: Omit<Filtri, "stato">, oggi: string) {
  const base = ordini.filter((o) => passaSpeciale(o, filtri.speciale, oggi) && corrisponde(o, filtri.ricerca));
  return Object.fromEntries(FILTRI_STATO.map((f) => [f.id, base.filter((o) => passaStato(o, f.id)).length])) as Record<FiltroStato, number>;
}

/**
 * L'ordine di lettura: prima i ritardi, poi le richieste (la piu' vecchia in
 * alto), poi gli altri aperti per data di uscita; in fondo i chiusi, i piu'
 * recenti per primi.
 */
export function ordina(ordini: Ordine[], oggi: string) {
  const gruppo = (o: Ordine) =>
    inRitardo(o, oggi) ? 0 : o.status === "requested" ? 1 : aperto(o) ? 2 : o.status === "completed" ? 3 : 4;
  const data = (o: Ordine) => o.fulfillment_date ?? o.production_date ?? o.requested_date ?? "9999-12-31";
  return [...ordini].sort((a, b) => {
    const g = gruppo(a) - gruppo(b);
    if (g) return g;
    if (gruppo(a) >= 3) return b.updated_at.localeCompare(a.updated_at);
    if (gruppo(a) === 1) return a.created_at.localeCompare(b.created_at);
    return data(a).localeCompare(data(b)) || a.created_at.localeCompare(b.created_at);
  });
}

/** Le colonne della vista a colonne: gli stati in ordine di lavoro. */
export function perStato(ordini: Ordine[], stati: readonly StatoOrdine[] = STATI_APERTI) {
  return stati.map((stato) => ({ stato, ordini: ordini.filter((o) => o.status === stato) }));
}

/* ---------- Testi pronti ---------- */

const dataLunga = (d: string) =>
  new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));

export const nomeProprio = (nome: string) => nome.trim().split(/\s+/)[0] ?? "";

/** Il messaggio WhatsApp precompilato: nome, pasti e giorno di ritiro o consegna (o la formula e il periodo dell'abbonamento). */
export function testoWhatsApp(
  o: Pick<Ordine, "customer_name" | "meals" | "fulfillment" | "fulfillment_date"> & { service?: Servizio; subscription?: Ordine["subscription"] },
) {
  const nome = nomeProprio(o.customer_name);
  if (o.service === "abbonamento") {
    const periodo = isData(o.fulfillment_date) ? ` ${frasePeriodo(periodoAbbonamento(o.fulfillment_date), o.fulfillment_date)}` : "";
    // Un abbonamento di prima delle formule e' un Pranzo.
    const formula = `${getFormula(formulaDi(o)).nome}${o.subscription ? ` ${NOMI_FASCIA[o.subscription.tier]}` : ""}`;
    return `Ciao${nome ? ` ${nome}` : ""}, sono Matteo di FUEL LAB. Ti scrivo per il tuo abbonamento ${formula}${periodo}.`;
  }
  const quando = o.fulfillment_date
    ? ` con ${o.fulfillment === "pickup" ? "ritiro" : "consegna"} ${dataLunga(o.fulfillment_date)}`
    : "";
  const pastiTesto = o.meals ? ` di ${plurale(o.meals, "pasto", "pasti")}` : "";
  return `Ciao${nome ? ` ${nome}` : ""}, sono Matteo di FUEL LAB. Ti scrivo per il tuo ordine${pastiTesto}${quando}.`;
}

/** Il link per aprire l'indirizzo in Google Maps. */
export const linkMappa = (indirizzo: string, comune: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([indirizzo, comune].filter(Boolean).join(", "))}`;

/* ---------- CSV ---------- */

/**
 * Una cella CSV: virgolette quando serve e niente formule (un "=" iniziale diventa testo).
 * Il telefono e' un caso a parte: "+39 333 123 4567" non e' una formula e non deve
 * ricevere l'apostrofo, che Excel mostrerebbe com'e'. Senza spazi ("+393331234567",
 * "0854212345") Excel lo leggerebbe come numero e perderebbe il + o lo zero iniziale:
 * si scrive come testo con ="...", sicuro perche' dentro ci sono solo cifre.
 */
function cella(valore: string | number | null | undefined, telefono = false) {
  let s = valore === null || valore === undefined ? "" : String(valore);
  if (telefono && /^\+?[\d\s().-]+$/.test(s) && /\d/.test(s)) {
    if (!/\s/.test(s) && s.replace(/\D/g, "").length >= 6 && /^[+0]/.test(s)) return `"=""${s}"""`;
    return s;
  }
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const oraRoma = (ts: string) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    .format(new Date(ts.includes("T") ? ts : `${ts.replace(" ", "T")}Z`));

/** Il segno invisibile U+FEFF che dice a Excel "questo file e' UTF-8". */
const BOM = String.fromCharCode(0xfeff);

/**
 * L'elenco per Excel italiano: separatore ";", decimali con la virgola, BOM
 * UTF-8 in testa cosi' le lettere accentate si leggono bene.
 */
export function ordiniCsv(ordini: Ordine[]) {
  const intestazione = [
    "ID", "Ricevuto", "Cliente", "Telefono", "Email", "Comune", "Indirizzo", "Servizio", "Formula", "Modalità", "Stato",
    "Pasti", "Data preferita", "Cucina", "Ritiro/consegna", "Prezzo (€)", "Pagato", "Note cliente", "Nota interna", "Piatti",
  ];
  const righe = ordini.map((o) => [
    o.id,
    oraRoma(o.created_at),
    o.customer_name,
    o.phone,
    o.email,
    o.comune,
    o.address,
    ETICHETTE_SERVIZIO[o.service] ?? o.service,
    eAbbonamento(o) ? dettaglioAbbonamento(o) : "",
    o.fulfillment === "pickup" ? "Ritiro" : "Consegna",
    etichettaStatoOrdine(o),
    // Un abbonamento non ha piatti: i pasti sono quelli del periodo (vuoto finche' non ha un inizio).
    eAbbonamento(o) ? (pastiDelPeriodo(o) ?? "") : o.meals,
    o.requested_date,
    o.production_date,
    o.fulfillment_date,
    o.price_cents === null ? "" : centesimiInTesto(o.price_cents),
    o.paid ? "Sì" : "No",
    o.notes,
    o.internal_note,
    o.items.map((v) => `${NOMI_GIORNO[v.day as GiornoSettimana] ?? v.day} ${v.meal}: ${v.name}${v.extras.length ? ` + ${v.extras.join(", ")}` : ""}`).join(" | "),
  ]);
  const colonnaTelefono = intestazione.indexOf("Telefono");
  const scrivi = (r: (string | number | null | undefined)[], dati: boolean) => r.map((v, i) => cella(v, dati && i === colonnaTelefono)).join(";");
  return `${BOM}${[scrivi(intestazione, false), ...righe.map((r) => scrivi(r, true))].join("\r\n")}\r\n`;
}
