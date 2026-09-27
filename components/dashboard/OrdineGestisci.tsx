"use client";

/* "Gestisci": il modulo della scheda ordine.

   Un bottone grande in basso fa il passo successivo (Conferma -> Inizia
   preparazione -> Segna pronto -> Consegnato) e salva insieme le altre
   modifiche. Se per quel passo mancano le date non compare un errore: il
   pannello propone il primo giorno di cucina e chiede solo "va bene?".

   Il modulo avvolge anche le parti di sola lettura (`prima` e `dopo`), cosi'
   la barra dei bottoni resta ferma in fondo alla scheda mentre il resto scorre. */

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { api, ApiError, STATI_ORDINE, etichettaStato, type ModificaOrdine, type Ordine, type StatoOrdine } from "@/lib/api";
import {
  centesimiInTesto,
  dateSuggerite,
  leggiEuro,
  nomeProprio,
  prossimaAzione,
  prossimiGiorniCucina,
  servonoDate,
} from "@/lib/operazioni";
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
};

const daOrdine = (o: Ordine): Campi => ({
  stato: o.status,
  produzione: o.production_date ?? "",
  uscita: o.fulfillment_date ?? "",
  prezzo: centesimiInTesto(o.price_cents),
  pagato: !!o.paid,
  messaggio: o.customer_message ?? "",
  nota: o.internal_note ?? "",
});

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

const iniziale = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

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

  // Arriva una versione piu' recente dell'ordine: si allinea senza perdere le modifiche in corso.
  if (ordine.updated_at !== base.updated_at) {
    setBase(ordine);
    setCampi(unisci(base, ordine, campi));
  }

  const modifiche = differenze(base, campi);
  const prezzoIllegibile = leggiEuro(campi.prezzo) === undefined;
  const sporco = Object.keys(modifiche).length > 0 || prezzoIllegibile;
  const statoScelto = campi.stato !== base.status;
  const azione = prossimaAzione(base.status, base.fulfillment);
  const scorciatoie = prossimiGiorniCucina(oggi, 3);
  const nome = nomeProprio(base.customer_name) || "il cliente";
  const avvisaDavvero = avvisa && !senzaAccount;

  useEffect(() => onSporco(sporco), [sporco, onSporco]);

  function cambia<K extends keyof Campi>(k: K, v: Campi[K]) {
    setCampi((c) => ({ ...c, [k]: v }));
    setEsito(null);
    if (k === "produzione" || k === "uscita") setErroreDate("");
    if (k === "prezzo") setErrorePrezzo("");
  }

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
      );
      setProposta({ stato: c.stato, ...s });
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
      const testo = m.status === "completed" && base.fulfillment === "pickup" ? "Ordine ritirato." : m.status ? FATTO[m.status] : "Modifiche salvate.";
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
              {STATI_ORDINE.map((s) => (
                <label key={s.id} className={`pn-scelta pn-scelta-${s.id}`}>
                  <input type="radio" name="stato" value={s.id} checked={campi.stato === s.id} onChange={() => cambia("stato", s.id)} />
                  {s.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="grid gap-3">
            <legend className="pn-legenda">Date</legend>
            <p className="pn-aiuto -mt-1">
              {base.requested_date ? <>Il cliente preferisce <strong className="text-ink">{giornoLungo(base.requested_date)}</strong>. </> : null}
              Un tocco su un giorno di cucina imposta cucina e {base.fulfillment === "pickup" ? "ritiro" : "consegna"}.
            </p>
            <div className="pn-scelte" role="group" aria-label="Prossimi giorni di cucina">
              {scorciatoie.map((d) => (
                <button
                  key={d}
                  type="button"
                  className="pn-chip"
                  aria-pressed={campi.produzione === d && campi.uscita === d}
                  onClick={() => scegliGiorno(d)}
                >
                  {d === oggi ? `Oggi · ${giorno(d)}` : iniziale(giorno(d))}
                </button>
              ))}
            </div>
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
                <p id="scheda-aiuto-prezzo" className="pn-aiuto">In euro, con la virgola. Lo vede anche il cliente.</p>
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
                  <p className="font-bold">Annullare l’ordine di {base.customer_name || "questo cliente"}?</p>
                  <p className="text-[15px]">
                    {senzaAccount
                      ? "Cliente senza account: nessuna email, avvisalo tu per telefono o WhatsApp."
                      : avvisa ? (emailAttiva === false ? "Email non attiva: avvisa il cliente per telefono o WhatsApp." : `${iniziale(nome)} riceve un’email con l’annullamento.`) : "Il cliente non riceve email (la casella in basso è spenta)."}
                  </p>
                  <div className="pn-bottoni">
                    <button type="button" className="pn-tasto pn-tasto-pericolo" disabled={salvo} onClick={() => void salva("cancelled")}>
                      Sì, annulla l’ordine
                    </button>
                    <button type="button" className="pn-tasto" onClick={() => setConfermaAnnullo(false)}>
                      No, torna indietro
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="pn-tasto pn-tasto-pericolo justify-self-start" onClick={() => setConfermaAnnullo(true)}>
                  Annulla ordine
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
            <p className="text-[17px] font-bold">
              Per “{etichettaStato(proposta.stato)}” servono le date.
            </p>
            <p className="text-[16px]">
              Ti propongo: cucina <strong>{giornoLungo(proposta.produzione)}</strong>, {base.fulfillment === "pickup" ? "ritiro" : "consegna"}{" "}
              <strong>{giornoLungo(proposta.uscita)}</strong>.
            </p>
            <div className="pn-bottoni">
              <button
                type="button"
                className="pn-tasto pn-tasto-pieno pn-tasto-grande"
                disabled={salvo}
                onClick={() => void salva(proposta.stato, { produzione: proposta.produzione, uscita: proposta.uscita })}
              >
                {salvo ? "Salvo…" : "Va bene, usa queste date"}
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

        {esito ? <Avviso tipo={esito.tipo}>{esito.testo}</Avviso> : null}

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
                {salvo ? "Salvo…" : `Salva: ${etichettaStato(campi.stato)}`}
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
