"use client";

/* "Gestisci": il modulo della scheda ordine.

   Un bottone grande in basso fa il passo successivo (Conferma -> Inizia
   preparazione -> Segna pronto -> Consegnato) e salva insieme le altre
   modifiche. Se per quel passo mancano le date non compare un errore: il
   pannello propone il giorno chiesto dal cliente (o domani, saltando le
   chiusure), con cucina e uscita nello stesso giorno, e chiede solo "va bene?".

   L'abbonamento mensile ha una data sola, l'inizio (scritta in entrambe le
   date dell'ordine), e il periodo di un mese che ne discende, con una consegna
   (o un ritiro) ogni 3 giorni. Il bottone grande lo conferma; a mese finito
   propone di segnarlo concluso. Matteo puo' cambiare formula, fascia, nucleo e
   settimana di prova: si salvano insieme agli altri campi (PATCH con
   `subscription`), e il totale non si ricalcola di nascosto, si propone.

   Il modulo avvolge anche le parti di sola lettura (`prima` e `dopo`), cosi'
   la barra dei bottoni resta ferma in fondo alla scheda mentre il resto scorre. */

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { fineAbbonamento, formulaDi } from "@/lib/abbonamento";
import { api, ApiError, STATI_ORDINE, etichettaStato, type ModificaOrdine, type Ordine, type SceltaAbbonamento, type StatoOrdine } from "@/lib/api";
import { chiusuraDi } from "@/lib/impostazioni";
import {
  centesimiInTesto,
  dateSuggerite,
  leggiEuro,
  nomeProprio,
  prossimaAzioneDi,
  scorciatoieDate,
  servonoDate,
} from "@/lib/operazioni";
import { eAbbonamento, isData } from "@/lib/produzione";
import { useImpostazioni } from "@/components/impostazioni/useImpostazioni";
import { AggiornaTotale, CalendarioConsegne, ScelteAbbonamento, type SceltaAbbonamentoCampi } from "./OrdineAbbonamento";
import { fraseAvviso, usePannello } from "./PannelloDati";
import { Icona } from "./PannelloIcone";
import { Avviso, giorno, giornoLungo } from "./ui";

type Campi = {
  stato: StatoOrdine;
  produzione: string;
  uscita: string;
  prezzo: string;
  pagato: boolean;
  messaggio: string;
  nota: string;
} & SceltaAbbonamentoCampi;

/** La scelta salvata di un abbonamento. Uno di prima delle formule e' un Pranzo Standard da solo. */
const sceltaSalvata = (o: Ordine): SceltaAbbonamento =>
  o.subscription ?? { plan: formulaDi(o), tier: "standard", household: "singolo", trial: false };

const daOrdine = (o: Ordine): Campi => {
  const scelta = sceltaSalvata(o);
  return {
    stato: o.status,
    produzione: o.production_date ?? "",
    uscita: o.fulfillment_date ?? "",
    prezzo: centesimiInTesto(o.price_cents),
    pagato: !!o.paid,
    messaggio: o.customer_message ?? "",
    nota: o.internal_note ?? "",
    formula: scelta.plan,
    fascia: scelta.tier,
    nucleo: scelta.household,
    prova: scelta.trial,
  };
};

/** Solo i campi cambiati rispetto all'ordine salvato. Il prezzo illeggibile resta fuori (lo ferma la validazione). */
function differenze(o: Ordine, c: Campi): ModificaOrdine {
  const m: ModificaOrdine = {};
  if (c.stato !== o.status) m.status = c.stato;
  if ((c.produzione || null) !== (o.production_date ?? null)) m.productionDate = c.produzione || null;
  if ((c.uscita || null) !== (o.fulfillment_date ?? null)) m.fulfillmentDate = c.uscita || null;
  const centesimi = leggiEuro(c.prezzo);
  if (centesimi !== undefined && centesimi !== (o.price_cents ?? null)) m.priceCents = centesimi;
  if (c.pagato !== !!o.paid) m.paid = c.pagato;
  if (c.messaggio !== (o.customer_message ?? "")) m.customerMessage = c.messaggio;
  if (c.nota !== (o.internal_note ?? "")) m.internalNote = c.nota;
  // La formula parte sempre intera (i quattro campi), ma solo se e' cambiata qualcosa.
  if (eAbbonamento(o)) {
    const s = sceltaSalvata(o);
    if (c.formula !== s.plan || c.fascia !== s.tier || c.nucleo !== s.household || c.prova !== s.trial) {
      m.subscription = { plan: c.formula, tier: c.fascia, household: c.nucleo, trial: c.prova };
    }
  }
  return m;
}

/**
 * L'ordine e' cambiato altrove (altro telefono, giro automatico): i campi che
 * Matteo non ha toccato prendono il valore nuovo, quelli toccati restano suoi.
 */
function unisci(vecchio: Ordine, nuovo: Ordine, campi: Campi): Campi {
  const prima = daOrdine(vecchio);
  const dopo = daOrdine(nuovo);
  const out = { ...campi };
  for (const k of Object.keys(out) as (keyof Campi)[]) {
    if (campi[k] === prima[k]) (out as Record<keyof Campi, unknown>)[k] = dopo[k];
  }
  return out;
}

const FATTO: Record<StatoOrdine, string> = {
  requested: "Ordine rimesso tra quelli da confermare.",
  confirmed: "Ordine confermato.",
  preparing: "Preparazione iniziata.",
  ready: "Ordine pronto.",
  completed: "Ordine consegnato.",
  cancelled: "Ordine annullato.",
};

const FATTO_ABBONAMENTO: Record<StatoOrdine, string> = {
  requested: "Abbonamento rimesso tra le richieste da confermare.",
  confirmed: "Abbonamento confermato.",
  preparing: "Abbonamento aggiornato.",
  ready: "Abbonamento aggiornato.",
  completed: "Abbonamento concluso.",
  cancelled: "Abbonamento annullato.",
};

const iniziale = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** "Concluso" al posto di "Consegnato", e niente preparazione o pronto: un abbonamento non si imballa in un giorno. */
function statiPer(abbonamento: boolean, attuale: StatoOrdine) {
  if (!abbonamento) return STATI_ORDINE;
  return STATI_ORDINE.filter((s) => (s.id !== "preparing" && s.id !== "ready") || s.id === attuale).map((s) =>
    s.id === "completed" ? { ...s, label: "Concluso" } : s,
  );
}

/** Le scorciatoie Oggi, Domani, Dopodomani: un tocco scrive lo stesso giorno in cucina e uscita. */
function Scorciatoie({
  oggi,
  scelto,
  onScegli,
  etichetta,
}: {
  oggi: string;
  scelto: (d: string) => boolean;
  onScegli: (d: string) => void;
  etichetta: string;
}) {
  const { chiusure } = useImpostazioni({ fresche: true }).impostazioni;
  return (
    <div className="pn-scelte" role="group" aria-label={etichetta}>
      {scorciatoieDate(oggi).map(({ nome, data }) => {
        const chiusa = chiusuraDi(data, chiusure);
        return (
          <button
            key={data}
            type="button"
            className="pn-chip"
            aria-pressed={scelto(data)}
            onClick={() => onScegli(data)}
            title={chiusa ? `Sei chiuso${chiusa.motivo ? `: ${chiusa.motivo}` : ""}` : undefined}
          >
            {nome} · {giorno(data)}
            {chiusa ? <span className="font-normal"> · chiuso</span> : null}
          </button>
        );
      })}
    </div>
  );
}

type Esito = { tipo: "ok" | "errore"; testo: string } | null;
type Proposta = { stato: StatoOrdine; produzione: string; uscita: string } | null;

export default function OrdineGestisci({
  ordine,
  oggi,
  prima,
  dopo,
  onSalvato,
  onSporco,
  senzaAccount = false,
}: {
  ordine: Ordine;
  oggi: string;
  prima: ReactNode;
  dopo: ReactNode;
  onSalvato: (ordine: Ordine) => void;
  onSporco: (sporco: boolean) => void;
  /** Ordine a mano per un cliente senza account: nessuna email, la casella "Avvisa" e' spenta. */
  senzaAccount?: boolean;
}) {
  const { emailAttiva } = usePannello();
  const { chiusure } = useImpostazioni({ fresche: true }).impostazioni;
  const [base, setBase] = useState(ordine);
  const [campi, setCampi] = useState(() => daOrdine(ordine));
  const [avvisa, setAvvisa] = useState(true);
  const [salvo, setSalvo] = useState(false);
  const [esito, setEsito] = useState<Esito>(null);
  const [proposta, setProposta] = useState<Proposta>(null);
  const [confermaAnnullo, setConfermaAnnullo] = useState(false);
  const [erroreDate, setErroreDate] = useState("");
  const [errorePrezzo, setErrorePrezzo] = useState("");
  const campoProduzione = useRef<HTMLInputElement>(null);
  const campoPrezzo = useRef<HTMLInputElement>(null);
  const areaEsito = useRef<HTMLDivElement>(null);

  /* Il bottone premuto si spegne mentre salva e il fuoco cade sul body: lo si
     porta sull'esito, cosi' tastiera e lettore di schermo sanno com'e' andata.
     Se invece Matteo sta gia' scrivendo altrove, il fuoco resta dov'e'. */
  useEffect(() => {
    if (!esito) return;
    const attivo = document.activeElement;
    if (!attivo || attivo === document.body) areaEsito.current?.focus();
  }, [esito]);

  // Arriva una versione piu' recente dell'ordine: si allinea senza perdere le modifiche in corso.
  if (ordine.updated_at !== base.updated_at) {
    setBase(ordine);
    setCampi(unisci(base, ordine, campi));
  }

  const modifiche = differenze(base, campi);
  const prezzoIllegibile = leggiEuro(campi.prezzo) === undefined;
  const sporco = Object.keys(modifiche).length > 0 || prezzoIllegibile;
  const statoScelto = campi.stato !== base.status;
  const azione = prossimaAzioneDi(base, oggi);
  const nome = nomeProprio(base.customer_name) || "il cliente";
  const avvisaDavvero = avvisa && !senzaAccount;
  const abbonamento = eAbbonamento(base);
  // L'inizio dell'abbonamento: la data di uscita (o quella di cucina, se c'e' solo quella).
  const inizio = campi.uscita || campi.produzione;
  const inizioValido = abbonamento && isData(inizio) ? inizio : null;
  const salvata = sceltaSalvata(base);
  // Il totale si propone solo se la scelta che pesa sul prezzo e' cambiata: la settimana di prova non lo tocca.
  const sceltaCambiata = campi.formula !== salvata.plan || campi.fascia !== salvata.tier || campi.nucleo !== salvata.household;

  useEffect(() => onSporco(sporco), [sporco, onSporco]);

  function cambia<K extends keyof Campi>(k: K, v: Campi[K]) {
    setCampi((c) => ({ ...c, [k]: v }));
    setEsito(null);
    if (k === "produzione" || k === "uscita") setErroreDate("");
    if (k === "prezzo") setErrorePrezzo("");
  }

  function cambiaScelta(cambio: Partial<SceltaAbbonamentoCampi>) {
    setCampi((c) => ({ ...c, ...cambio }));
    setEsito(null);
  }

  /** Stesso giorno in cucina e in uscita. Per l'abbonamento e' l'inizio, e le date sono sempre uguali. */
  function scegliGiorno(d: string) {
    setCampi((c) => ({ ...c, produzione: d, uscita: d }));
    setErroreDate("");
    setEsito(null);
  }

  async function salva(statoVoluto?: StatoOrdine, date?: { produzione: string; uscita: string }) {
    const c: Campi = { ...campi, ...(statoVoluto ? { stato: statoVoluto } : {}), ...(date ?? {}) };
    setEsito(null);

    if (leggiEuro(c.prezzo) === undefined) {
      setErrorePrezzo("Prezzo non valido: scrivi per esempio 45 oppure 45,50.");
      campoPrezzo.current?.focus();
      return;
    }
    if (servonoDate(c.stato) && (!c.produzione || !c.uscita)) {
      const s = dateSuggerite(
        { requested_date: base.requested_date, production_date: c.produzione || null, fulfillment_date: c.uscita || null },
        oggi,
        chiusure,
      );
      // Per l'abbonamento le due date sono l'inizio: se Matteo ne ha scritta una, vale per tutte e due.
      setProposta({ stato: c.stato, ...(abbonamento ? { produzione: s.uscita, uscita: s.uscita } : s) });
      return;
    }
    if (c.produzione && c.uscita && c.produzione > c.uscita) {
      setErroreDate("Il giorno di cucina non può venire dopo il ritiro o la consegna.");
      campoProduzione.current?.focus();
      return;
    }

    const m = differenze(base, c);
    if (!Object.keys(m).length) {
      setEsito({ tipo: "ok", testo: "Niente da salvare: è tutto già aggiornato." });
      return;
    }
    const email = m.status !== undefined || m.customerMessage !== undefined;
    setSalvo(true);
    try {
      const { order } = await api.modificaOrdine(base.id, { ...m, ...(email ? { notify: avvisaDavvero } : {}), expectedStatus: base.status });
      setBase(order);
      setCampi(daOrdine(order));
      setProposta(null);
      setConfermaAnnullo(false);
      onSalvato(order);
      const testo =
        m.status && abbonamento
          ? FATTO_ABBONAMENTO[m.status]
          : m.subscription && !m.status
            ? "Formula dell’abbonamento aggiornata."
            : m.status === "completed" && base.fulfillment === "pickup"
              ? "Ordine ritirato."
              : m.status
                ? FATTO[m.status]
                : "Modifiche salvate.";
      setEsito({ tipo: "ok", testo: `${testo}${email && avvisaDavvero ? ` ${fraseAvviso(emailAttiva, iniziale(nome))}` : ""}` });
    } catch (e) {
      setEsito({ tipo: "errore", testo: e instanceof ApiError ? e.message : "Modifica non salvata. Riprova." });
      // 409: l'ordine e' cambiato nel frattempo (es. il cliente l'ha annullato). Si ricarica la scheda.
      if (e instanceof ApiError && e.status === 409) {
        try {
          const { order } = await api.ordine(base.id);
          setBase(order);
          setCampi(daOrdine(order));
          setProposta(null);
          onSalvato(order);
        } catch {
          // Resta il messaggio d'errore: il prossimo aggiornamento automatico sistemera' la lista.
        }
      }
    } finally {
      setSalvo(false);
    }
  }

  function inviaModulo(e: FormEvent) {
    e.preventDefault();
    void salva();
  }

  function annullaModifiche() {
    setCampi(daOrdine(base));
    setProposta(null);
    setErroreDate("");
    setErrorePrezzo("");
    setEsito(null);
  }

  const etichettaUscita = base.fulfillment === "pickup" ? "Ritiro il" : "Consegna il";

  return (
    <form onSubmit={inviaModulo} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="pn-scheda-scorre">
        {prima}

        <section aria-labelledby="scheda-gestisci" className="pn-modulo">
          <h3 id="scheda-gestisci" className="pn-h3 mb-0">Gestisci</h3>

          <fieldset>
            <legend className="pn-legenda">Stato</legend>
            <div className="pn-scelte">
              {statiPer(abbonamento, base.status).map((s) => (
                <label key={s.id} className={`pn-scelta pn-scelta-${s.id}`}>
                  <input type="radio" name="stato" value={s.id} checked={campi.stato === s.id} onChange={() => cambia("stato", s.id)} />
                  {s.label}
                </label>
              ))}
            </div>
          </fieldset>

          {abbonamento ? (
            <>
              <div className="grid gap-4">
                <ScelteAbbonamento prefisso="scheda" valore={campi} onCambia={cambiaScelta} />
                {sceltaCambiata ? (
                  <AggiornaTotale
                    scelta={campi}
                    ritiro={base.fulfillment === "pickup"}
                    totaleAttuale={leggiEuro(campi.prezzo)}
                    onAggiorna={(testo) => cambia("prezzo", testo)}
                  />
                ) : null}
              </div>

              <fieldset className="grid gap-3">
                <legend className="pn-legenda">Inizio e consegne</legend>
                <p className="pn-aiuto -mt-1">
                  {base.requested_date ? <>Il cliente vorrebbe iniziare <strong className="text-ink">{giornoLungo(base.requested_date)}</strong>. </> : null}
                  L’abbonamento vale un mese dall’inizio, con {base.fulfillment === "pickup" ? "un ritiro" : "una consegna"} ogni 3 giorni:
                  ogni volta cucini e {base.fulfillment === "pickup" ? "dai" : "porti"} i pasti dei tre giorni che copre.
                </p>
                <Scorciatoie oggi={oggi} scelto={(d) => inizio === d} onScegli={scegliGiorno} etichetta="Inizio: oggi, domani o dopodomani" />
                <div className="campo max-w-xs">
                  <label htmlFor="scheda-produzione">Inizio</label>
                  <input
                    ref={campoProduzione}
                    id="scheda-produzione"
                    type="date"
                    value={inizio}
                    onChange={(e) => scegliGiorno(e.target.value)}
                    aria-describedby="scheda-periodo"
                  />
                </div>
                {inizioValido ? (
                  <CalendarioConsegne id="scheda-periodo" formula={campi.formula} inizio={inizioValido} oggi={oggi} elenco />
                ) : (
                  <p id="scheda-periodo" className="text-[16px]" aria-live="polite">
                    Scegli l’inizio: il periodo e le consegne si calcolano da soli.
                  </p>
                )}
              </fieldset>
            </>
          ) : (
            <fieldset className="grid gap-3">
              <legend className="pn-legenda">Date</legend>
              <p className="pn-aiuto -mt-1">
                {base.requested_date ? <>Il cliente preferisce <strong className="text-ink">{giornoLungo(base.requested_date)}</strong>. </> : null}
                Un tocco imposta cucina e {base.fulfillment === "pickup" ? "ritiro" : "consegna"} nello stesso giorno.
              </p>
              <Scorciatoie
                oggi={oggi}
                scelto={(d) => campi.produzione === d && campi.uscita === d}
                onScegli={scegliGiorno}
                etichetta="Cucina e uscita: oggi, domani o dopodomani"
              />
              <div className="pn-due-campi">
                <div className="campo">
                  <label htmlFor="scheda-produzione">Cucina il</label>
                  <input
                    ref={campoProduzione}
                    id="scheda-produzione"
                    type="date"
                    value={campi.produzione}
                    onChange={(e) => cambia("produzione", e.target.value)}
                    aria-invalid={!!erroreDate}
                    aria-describedby={erroreDate ? "scheda-errore-date" : undefined}
                  />
                </div>
                <div className="campo">
                  <label htmlFor="scheda-uscita">{etichettaUscita}</label>
                  <input
                    id="scheda-uscita"
                    type="date"
                    value={campi.uscita}
                    onChange={(e) => cambia("uscita", e.target.value)}
                    aria-invalid={!!erroreDate}
                    aria-describedby={erroreDate ? "scheda-errore-date" : undefined}
                  />
                </div>
              </div>
              {erroreDate ? <p id="scheda-errore-date" className="pn-errore-campo" role="alert">{erroreDate}</p> : null}
            </fieldset>
          )}

          <div className="pn-due-campi items-end">
            <div className="campo">
              <label htmlFor="scheda-prezzo">Prezzo concordato</label>
              <div className="pn-euro">
                <span aria-hidden="true">€</span>
                <input
                  ref={campoPrezzo}
                  id="scheda-prezzo"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0,00"
                  value={campi.prezzo}
                  onChange={(e) => cambia("prezzo", e.target.value)}
                  aria-invalid={!!errorePrezzo}
                  aria-describedby={errorePrezzo ? "scheda-errore-prezzo" : "scheda-aiuto-prezzo"}
                />
              </div>
              {errorePrezzo ? (
                <p id="scheda-errore-prezzo" className="pn-errore-campo" role="alert">{errorePrezzo}</p>
              ) : (
                <p id="scheda-aiuto-prezzo" className="pn-aiuto">
                  {abbonamento ? "Il prezzo del mese, in euro con la virgola. Lo vede anche il cliente." : "In euro, con la virgola. Lo vede anche il cliente."}
                </p>
              )}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={campi.pagato}
              className="pn-switch self-start sm:self-end sm:mb-7"
              onClick={() => cambia("pagato", !campi.pagato)}
            >
              <span className="pn-switch-binario" aria-hidden="true" />
              {campi.pagato ? "Pagato" : "Non ancora pagato"}
            </button>
          </div>

          <div className="campo pn-per-cliente">
            <label htmlFor="scheda-messaggio" className="pn-campo-etichetta">
              Messaggio per il cliente
              <span className="pn-segno pn-segno-neutro normal-case tracking-normal">Lo vede {nome}</span>
            </label>
            <textarea
              id="scheda-messaggio"
              rows={3}
              maxLength={1000}
              value={campi.messaggio}
              onChange={(e) => cambia("messaggio", e.target.value)}
              aria-describedby="scheda-aiuto-messaggio"
            />
            <p id="scheda-aiuto-messaggio" className="pn-aiuto">
              Compare nel suo account e nell’email, se lo avvisi. <span className="num">{campi.messaggio.length}/1000</span>
            </p>
          </div>

          <div className="campo pn-solo-matteo">
            <label htmlFor="scheda-nota" className="pn-campo-etichetta">
              Nota interna
              <span className="pn-segno pn-segno-neutro normal-case tracking-normal">
                <Icona nome="lucchetto" className="size-3.5" />
                Solo tu
              </span>
            </label>
            <textarea
              id="scheda-nota"
              rows={3}
              maxLength={2000}
              value={campi.nota}
              onChange={(e) => cambia("nota", e.target.value)}
              aria-describedby="scheda-aiuto-nota"
            />
            <p id="scheda-aiuto-nota" className="pn-aiuto">Il cliente non la vede mai.</p>
          </div>

          {base.status !== "cancelled" && base.status !== "completed" ? (
            <div className="grid gap-3 border-t border-ink/15 pt-5">
              {confermaAnnullo ? (
                <div className="pn-conferma-pericolo" role="alert">
                  <p className="font-bold">
                    Annullare {abbonamento ? "l’abbonamento" : "l’ordine"} di {base.customer_name || "questo cliente"}?
                  </p>
                  <p className="text-[15px]">
                    {senzaAccount
                      ? "Cliente senza account: nessuna email, avvisalo tu per telefono o WhatsApp."
                      : avvisa ? (emailAttiva === false ? "Email non attiva: avvisa il cliente per telefono o WhatsApp." : `${iniziale(nome)} riceve un’email con l’annullamento.`) : "Il cliente non riceve email (la casella in basso è spenta)."}
                  </p>
                  <div className="pn-bottoni">
                    <button type="button" className="pn-tasto pn-tasto-pericolo" disabled={salvo} onClick={() => void salva("cancelled")}>
                      {abbonamento ? "Sì, annulla l’abbonamento" : "Sì, annulla l’ordine"}
                    </button>
                    <button type="button" className="pn-tasto" onClick={() => setConfermaAnnullo(false)}>
                      No, torna indietro
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="pn-tasto pn-tasto-pericolo justify-self-start" onClick={() => setConfermaAnnullo(true)}>
                  {abbonamento ? "Annulla abbonamento" : "Annulla ordine"}
                </button>
              )}
            </div>
          ) : null}
        </section>

        {dopo}
      </div>

      <div className="pn-scheda-piede">
        {proposta ? (
          <div className="pn-proposta" role="alert">
            {abbonamento ? (
              <>
                <p className="text-[17px] font-bold">Per confermare l’abbonamento serve l’inizio.</p>
                <p className="text-[16px]">
                  Ti propongo: inizio <strong>{giornoLungo(proposta.uscita)}</strong>, fino a{" "}
                  <strong>{giornoLungo(fineAbbonamento(proposta.uscita))}</strong>.
                </p>
              </>
            ) : (
              <>
                <p className="text-[17px] font-bold">
                  Per “{etichettaStato(proposta.stato)}” servono le date.
                </p>
                <p className="text-[16px]">
                  Ti propongo: cucina <strong>{giornoLungo(proposta.produzione)}</strong>, {base.fulfillment === "pickup" ? "ritiro" : "consegna"}{" "}
                  <strong>{giornoLungo(proposta.uscita)}</strong>.
                </p>
              </>
            )}
            <div className="pn-bottoni">
              <button
                type="button"
                className="pn-tasto pn-tasto-pieno pn-tasto-grande"
                disabled={salvo}
                onClick={() => void salva(proposta.stato, { produzione: proposta.produzione, uscita: proposta.uscita })}
              >
                {salvo ? "Salvo…" : abbonamento ? "Va bene, inizia quel giorno" : "Va bene, usa queste date"}
              </button>
              <button
                type="button"
                className="pn-tasto"
                onClick={() => {
                  setProposta(null);
                  campoProduzione.current?.focus();
                  campoProduzione.current?.scrollIntoView({ block: "center", behavior: "smooth" });
                }}
              >
                Scelgo io
              </button>
            </div>
          </div>
        ) : null}

        <div ref={areaEsito} tabIndex={-1} className="outline-none">
          {esito ? <Avviso tipo={esito.tipo}>{esito.testo}</Avviso> : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4">
          <label className={`pn-casella ${senzaAccount ? "cursor-not-allowed opacity-60" : ""}`}>
            <input
              type="checkbox"
              checked={avvisaDavvero}
              disabled={senzaAccount}
              onChange={(e) => setAvvisa(e.target.checked)}
              aria-describedby="scheda-aiuto-avvisa"
            />
            Avvisa il cliente via email
          </label>
          {sporco ? (
            <button type="button" className="pn-tasto pn-tasto-piatto min-h-11 px-1" onClick={annullaModifiche}>
              Annulla modifiche
            </button>
          ) : null}
          <p id="scheda-aiuto-avvisa" className={senzaAccount ? "pn-aiuto w-full" : "sr-only"}>
            {senzaAccount
              ? "Il cliente non ha un account: nessuna email. Avvisalo per telefono o WhatsApp."
              : "L’email parte solo se cambia lo stato o il messaggio per il cliente."}
          </p>
        </div>

        {!proposta ? (
          <div className="pn-bottoni">
            {statoScelto ? (
              <button type="button" className="pn-tasto pn-tasto-pieno pn-tasto-grande flex-1" disabled={salvo} onClick={() => void salva()}>
                {salvo ? "Salvo…" : `Salva: ${statiPer(abbonamento, base.status).find((x) => x.id === campi.stato)?.label ?? etichettaStato(campi.stato)}`}
              </button>
            ) : azione ? (
              <>
                <button
                  type="button"
                  className="pn-tasto pn-tasto-lime pn-tasto-grande flex-1"
                  disabled={salvo}
                  onClick={() => void salva(azione.stato)}
                >
                  {salvo ? "Salvo…" : azione.verbo}
                  <Icona nome="freccia" className="size-5" />
                </button>
                {sporco ? (
                  <button type="button" className="pn-tasto pn-tasto-grande" disabled={salvo} onClick={() => void salva()}>
                    Salva senza cambiare stato
                  </button>
                ) : null}
              </>
            ) : (
              <button type="submit" className="pn-tasto pn-tasto-pieno pn-tasto-grande flex-1" disabled={salvo || !sporco}>
                {salvo ? "Salvo…" : "Salva modifiche"}
              </button>
            )}
          </div>
        ) : null}
      </div>
    </form>
  );
}
