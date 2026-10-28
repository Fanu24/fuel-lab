"use client";

/* "Nuovo ordine a mano": Matteo scrive un ordine preso al telefono, su
   WhatsApp o di persona, e lo ritrova in Oggi, nel foglio Cucina, nella spesa
   e nelle etichette come quelli arrivati dal sito.

   Come la scheda ordine e' un <dialog> modale che vive nell'indirizzo
   (?nuovo=1): a tutto schermo sul telefono, pannello a destra sul computer;
   "indietro" lo chiude, Esc e lo sfondo chiedono conferma se c'e' qualcosa di
   scritto. Dopo il salvataggio al suo posto si apre la scheda del nuovo
   ordine (?id=...). La logica sta in lib/ordine-manuale.ts, le regole vere
   le rifa' il server (POST /api/admin/orders).

   L'abbonamento mensile non ha piatti: al posto della griglia ci sono la
   formula (una delle cinque, la fascia, chi si abbona)
   e la data d'inizio, con le consegne che ne discendono (una ogni 3 giorni).
   Il prezzo parte da quello che calcolaPrezzo propone per la scelta, si
   riallinea quando la scelta cambia finche' Matteo non lo scrive lui, e resta
   modificabile. */

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent, type MouseEvent, type ReactNode, type SyntheticEvent } from "react";
import { etichettaFormula, NOMI_NUCLEO } from "@/lib/abbonamento";
import { adminApi, ApiError, ETICHETTE_SERVIZIO, euro, type ClienteAdmin, type Modalita, type Servizio } from "@/lib/api";
import { chiusuraDi } from "@/lib/impostazioni";
import { leggiEuro, plurale, scorciatoieDate } from "@/lib/operazioni";
import { calendarioAbbonamento, isData } from "@/lib/produzione";
import { useImpostazioni } from "@/components/impostazioni/useImpostazioni";
import {
  bozzaOrdineDaTesto,
  campiVuoti,
  conCliente,
  conInizio,
  conModalita,
  conSceltaAbbonamento,
  conServizio,
  corpoNuovoOrdine,
  erroriNuovoOrdine,
  moduloToccato,
  ORDINE_CAMPI,
  porzioniOrdine,
  riepilogoPiatti,
  testoBozzaOrdine,
  type CampiNuovoOrdine,
  type CampoNuovoOrdine,
  type ModoCliente,
} from "@/lib/ordine-manuale";
import { AvvisoChiusura, CalendarioConsegne, PrezzoProposto, ScelteAbbonamento } from "./OrdineAbbonamento";
import { Icona } from "./PannelloIcone";
import { usePannello } from "./PannelloDati";
import OrdineNuovoCliente from "./OrdineNuovoCliente";
import { Campo, Scelte } from "./OrdineNuovoParti";
import OrdineNuovoPiatti from "./OrdineNuovoPiatti";
import { Avviso, giorno, giornoLungo } from "./ui";

/* ---------- L'indirizzo ---------- */

/**
 * Legge ?nuovo=1 e lo scrive, come useSchedaUrl per ?id=. Aprire aggiunge una
 * voce alla cronologia (cosi' "indietro" chiude), chiudere torna indietro se
 * l'abbiamo aperto noi, altrimenti (link da "Oggi") toglie solo ?nuovo.
 * Dopo il salvataggio ?nuovo diventa ?id=<nuovo ordine> nella stessa voce.
 * Va usato dentro <Suspense>, come ogni useSearchParams.
 */
export function useNuovoOrdineUrl() {
  const parametri = useSearchParams();
  const aperto = parametri.get("nuovo") === "1";
  const apertoDaQui = useRef(false);

  const apri = useCallback(() => {
    const p = new URLSearchParams(window.location.search);
    p.delete("id");
    p.set("nuovo", "1");
    window.history.pushState(null, "", `?${p.toString()}`);
    apertoDaQui.current = true;
  }, []);

  const chiudi = useCallback(() => {
    if (apertoDaQui.current) {
      apertoDaQui.current = false;
      window.history.back();
      return;
    }
    const p = new URLSearchParams(window.location.search);
    p.delete("nuovo");
    const resto = p.toString();
    window.history.replaceState(null, "", resto ? `?${resto}` : window.location.pathname);
  }, []);

  const apriScheda = useCallback((id: string) => {
    apertoDaQui.current = false;
    const p = new URLSearchParams(window.location.search);
    p.delete("nuovo");
    p.set("id", id);
    window.history.replaceState(null, "", `?${p.toString()}`);
  }, []);

  return { aperto, apri, chiudi, apriScheda };
}

/** Il bottone "+ Nuovo ordine" delle pagine del pannello. */
export function BottoneNuovoOrdine({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="pn-tasto pn-tasto-lime" onClick={onClick}>
      <span aria-hidden="true" className="text-[22px] leading-none">+</span>
      Nuovo ordine
    </button>
  );
}

/* ---------- Il modulo ---------- */

/** Dove va il focus quando un campo ha un errore. */
const ID_CAMPO: Record<CampoNuovoOrdine, string> = {
  cliente: "nuovo-cerca-cliente",
  nome: "nuovo-nome",
  telefono: "nuovo-telefono",
  comune: "nuovo-comune",
  indirizzo: "nuovo-indirizzo",
  piatti: "nuovo-lun-pranzo",
  porzioni: "nuovo-porzioni",
  date: "nuovo-produzione",
  prezzo: "nuovo-prezzo",
};

const NOME_CAMPO: Record<CampoNuovoOrdine, string> = {
  cliente: "cliente",
  nome: "nome",
  telefono: "telefono",
  comune: "comune",
  indirizzo: "indirizzo",
  piatti: "piatti",
  porzioni: "porzioni",
  date: "date",
  prezzo: "prezzo",
};

/* La bozza sta nella sessione del browser: ricaricando la pagina o col tasto Indietro del telefono il modulo
   si chiude senza chiedere nulla, e a riaprirlo ritrova quello che c'era. Si toglie solo salvando o scartando. */
const CHIAVE_BOZZA = "fuellab:ordine-nuovo:bozza";

function leggiBozzaOrdine(): CampiNuovoOrdine | null {
  try {
    return bozzaOrdineDaTesto(window.sessionStorage.getItem(CHIAVE_BOZZA));
  } catch {
    return null;
  }
}

function togliBozzaOrdine() {
  try {
    window.sessionStorage.removeItem(CHIAVE_BOZZA);
  } catch {
    // Spazio non disponibile (navigazione privata): resta la sola conferma alla chiusura.
  }
}

export default function OrdineNuovo({ onChiudi, onSalvato }: { onChiudi: () => void; onSalvato: (id: string) => void }) {
  const { oggi, sostituisciOrdine, aggiorna } = usePannello();
  const dialogo = useRef<HTMLDialogElement>(null);
  const titolo = useRef<HTMLHeadingElement>(null);
  const chiusaDaNoi = useRef(false);
  const [ripresa, setRipresa] = useState(leggiBozzaOrdine);
  const [campi, setCampi] = useState<CampiNuovoOrdine>(() => ripresa ?? campiVuoti());
  const [tentato, setTentato] = useState(false);
  const [erroreServer, setErroreServer] = useState("");
  const [codiceSconto, setCodiceSconto] = useState("");
  const [salvo, setSalvo] = useState(false);
  // Due invii ravvicinati non devono creare due ordini: lo stato React arriva dopo, questo segnale subito.
  const inCorso = useRef(false);

  // Dopo il primo "Salva" gli errori seguono il modulo: spariscono man mano che si correggono.
  const errori = tentato ? erroriNuovoOrdine(campi) : {};
  const campiConErrore = ORDINE_CAMPI.filter((k) => errori[k]);
  const porzioni = porzioniOrdine(campi);
  const ritiro = campi.modalita === "pickup";
  const { chiusure } = useImpostazioni({ fresche: true }).impostazioni;
  const centesimi = leggiEuro(campi.prezzo);
  const abbonamento = campi.servizio === "abbonamento";
  // L'abbonamento ha una data sola: l'inizio, scritta in entrambe le date.
  const inizio = campi.uscita || campi.produzione;
  const inizioValido = abbonamento && isData(inizio) ? inizio : null;
  const calendario = inizioValido ? calendarioAbbonamento(campi.formula, inizioValido) : null;
  const nomeFormula = etichettaFormula(campi.formula, campi.fascia);

  // Apertura modale, focus sul titolo; alla chiusura il focus torna da dove era partito.
  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    const partenza = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    chiusaDaNoi.current = false;
    if (!d.open) d.showModal();
    titolo.current?.focus();
    return () => {
      chiusaDaNoi.current = true;
      if (d.open) d.close();
      if (partenza && partenza.isConnected && partenza !== document.body) partenza.focus();
    };
  }, []);

  // Finche' c'e' qualcosa nel modulo lo si conserva; un modulo svuotato a mano non lascia bozza.
  const chiusoDaNoi = useRef(false);
  useEffect(() => {
    if (chiusoDaNoi.current) return;
    try {
      if (moduloToccato(campi)) window.sessionStorage.setItem(CHIAVE_BOZZA, testoBozzaOrdine(campi));
      else window.sessionStorage.removeItem(CHIAVE_BOZZA);
    } catch {
      // Spazio non disponibile: vale la conferma alla chiusura.
    }
  }, [campi]);

  const chiudi = useCallback(() => {
    if (moduloToccato(campi) && !window.confirm("L’ordine non è ancora salvato. Chiudere e perdere quello che hai scritto?")) return;
    // Chiuso apposta: la bozza non serve piu' (col tasto Indietro, invece, resta).
    chiusoDaNoi.current = true;
    togliBozzaOrdine();
    onChiudi();
  }, [campi, onChiudi]);

  function suEsc(e: SyntheticEvent<HTMLDialogElement>) {
    e.preventDefault();
    chiudi();
  }

  function suChiusura() {
    // Chrome chiude comunque al secondo Esc di fila: allinea l'indirizzo.
    if (!chiusaDaNoi.current && !dialogo.current?.open) onChiudi();
  }

  function suClic(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) chiudi();
  }

  function cambia(parziale: Partial<CampiNuovoOrdine>) {
    setCampi((c) => ({ ...c, ...parziale }));
    setErroreServer("");
  }

  function scegliModo(modo: ModoCliente, prefill: { nome?: string; telefono?: string } = {}) {
    setCampi((c) => ({ ...c, modo, ...(modo === "senza-account" ? { cliente: null } : {}), ...prefill }));
    setErroreServer("");
  }

  function scegliCliente(cliente: ClienteAdmin | null) {
    setCampi((c) => (cliente ? conCliente(c, cliente) : { ...c, cliente: null }));
    setErroreServer("");
  }

  function vaiAlCampo(campo: CampoNuovoOrdine) {
    // Al prossimo disegno: il campo con l'errore potrebbe essere appena comparso.
    window.requestAnimationFrame(() => {
      const el = document.getElementById(ID_CAMPO[campo]);
      if (!el) return;
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: "center" });
    });
  }

  async function salva(e: FormEvent) {
    e.preventDefault();
    if (salvo || inCorso.current) return;
    setTentato(true);
    setErroreServer("");
    const trovati = erroriNuovoOrdine(campi);
    const primo = ORDINE_CAMPI.find((k) => trovati[k]);
    if (primo) {
      vaiAlCampo(primo);
      return;
    }
    inCorso.current = true;
    setSalvo(true);
    try {
      const { order } = await adminApi.nuovoOrdine({ ...corpoNuovoOrdine(campi), discountCode: codiceSconto.trim() || undefined });
      chiusoDaNoi.current = true;
      togliBozzaOrdine();
      sostituisciOrdine(order);
      void aggiorna();
      onSalvato(order.id);
    } catch (err) {
      setErroreServer(err instanceof ApiError ? err.message : "Ordine non salvato. Controlla la rete e riprova.");
      inCorso.current = false;
      setSalvo(false);
    }
  }

  const idErroreDate = errori.date ? "nuovo-date-errore" : undefined;
  const piatti = riepilogoPiatti(campi.piano);

  return (
    <dialog ref={dialogo} className="pn-scheda" aria-labelledby="nuovo-titolo" onCancel={suEsc} onClose={suChiusura} onClick={suClic}>
      <div className="pn-scheda-corpo">
        <header className="pn-scheda-testa">
          <div className="min-w-0 flex-1">
            <p className="pn-occhiello mb-1 hidden sm:block">Telefono, WhatsApp o di persona</p>
            <h2 id="nuovo-titolo" ref={titolo} tabIndex={-1} className="pn-scheda-titolo">Nuovo ordine a mano</h2>
            <p className="mt-1 text-[14px] text-muted">Finisce in Oggi, nel foglio Cucina, nella spesa e nelle etichette.</p>
          </div>
          <button type="button" className="pn-chiudi" onClick={chiudi} aria-label="Chiudi senza salvare">
            <Icona nome="chiudi" />
          </button>
        </header>

        <form onSubmit={salva} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="pn-scheda-scorre">
            {ripresa ? (
              <p className="pn-avviso pn-avviso-info" role="status">
                Avevi lasciato questo ordine a metà: l’ho ripreso. Non è ancora salvato.{" "}
                <button
                  type="button"
                  className="min-h-11 font-bold underline underline-offset-4"
                  onClick={() => {
                    if (!window.confirm("Scartare quello che avevi scritto e ricominciare da capo?")) return;
                    togliBozzaOrdine();
                    setRipresa(null);
                    setCampi(campiVuoti());
                    setTentato(false);
                    setErroreServer("");
                  }}
                >
                  Ricomincia da capo
                </button>
              </p>
            ) : null}
            <OrdineNuovoCliente
              campi={campi}
              errori={errori}
              onModo={scegliModo}
              onCliente={scegliCliente}
              onCampo={(k, v) => cambia({ [k]: v })}
            />

            <section aria-labelledby="nuovo-uscita-titolo" className="grid gap-4">
              <h3 id="nuovo-uscita-titolo" className="pn-h3 mb-0">Ritiro o consegna</h3>
              <Scelte<Modalita>
                nome="nuovo-modalita"
                legenda="Come lo riceve"
                valore={campi.modalita}
                opzioni={[
                  { id: "pickup", label: "Ritiro" },
                  { id: "delivery", label: "Consegna a domicilio" },
                ]}
                onScegli={(m) => {
                  setCampi((c) => conModalita(c, m));
                  setErroreServer("");
                }}
              />
              <div className="pn-due-campi">
                <Campo id="nuovo-comune" etichetta={ritiro ? "Comune (facoltativo)" : "Comune"} errore={errori.comune}>
                  {(aria) => (
                    <input {...aria} type="text" value={campi.comune} onChange={(e) => cambia({ comune: e.target.value })} autoComplete="off" maxLength={100} />
                  )}
                </Campo>
                {!ritiro ? (
                  <Campo id="nuovo-indirizzo" etichetta="Indirizzo di consegna" errore={errori.indirizzo}>
                    {(aria) => (
                      <input {...aria} type="text" value={campi.indirizzo} onChange={(e) => cambia({ indirizzo: e.target.value })} autoComplete="off" maxLength={240} />
                    )}
                  </Campo>
                ) : null}
              </div>
            </section>

            <section aria-labelledby="nuovo-servizio-titolo" className="grid gap-4">
              <h3 id="nuovo-servizio-titolo" className="pn-h3 mb-0">Servizio</h3>
              <Scelte<Servizio>
                nome="nuovo-servizio"
                legenda="Che cosa ha chiesto"
                valore={campi.servizio}
                opzioni={(Object.keys(ETICHETTE_SERVIZIO) as Servizio[]).map((s) => ({ id: s, label: ETICHETTE_SERVIZIO[s] }))}
                onScegli={(s) => {
                  setCampi((c) => conServizio(c, s));
                  setErroreServer("");
                }}
                aiuto={
                  abbonamento
                    ? "Un mese di pasti con una consegna (o un ritiro) ogni 3 giorni, sulla scheda del cliente: niente piatti da scegliere. La scheda si scrive nelle note, più in basso."
                    : undefined
                }
              />
            </section>

            {abbonamento ? (
              <section aria-labelledby="nuovo-formula-titolo" className="grid gap-4">
                <h3 id="nuovo-formula-titolo" className="pn-h3 mb-0">Formula dell’abbonamento</h3>
                <ScelteAbbonamento
                  prefisso="nuovo"
                  valore={campi}
                  onCambia={(cambio) => {
                    setCampi((c) => conSceltaAbbonamento(c, cambio));
                    setErroreServer("");
                  }}
                />
              </section>
            ) : null}

            {abbonamento ? null : (
              <OrdineNuovoPiatti
                piano={campi.piano}
                onPiano={(piano) => cambia({ piano })}
                servizio={campi.servizio}
                porzioni={campi.porzioni}
                onPorzioni={(porzioni) => cambia({ porzioni })}
                uscita={campi.uscita}
                errori={errori}
              />
            )}

            <section aria-labelledby="nuovo-quando" className="grid gap-4">
              <h3 id="nuovo-quando" className="pn-h3 mb-0">Stato e date</h3>
              <Scelte<CampiNuovoOrdine["stato"]>
                nome="nuovo-stato"
                legenda="Stato iniziale"
                valore={campi.stato}
                opzioni={[
                  { id: "requested", label: "Da confermare", classe: "pn-scelta-requested" },
                  { id: "confirmed", label: "Già confermato", classe: "pn-scelta-confirmed" },
                ]}
                onScegli={(s) => cambia({ stato: s })}
                aiuto={
                  abbonamento
                    ? campi.stato === "confirmed"
                      ? "Le consegne partono dall’inizio, una ogni 3 giorni: serve l’inizio."
                      : "Resta fra le richieste da confermare, come quelle dal sito. L’inizio è facoltativo."
                    : campi.stato === "confirmed"
                      ? "Va dritto nel calendario della cucina: servono le due date."
                      : "Resta fra le richieste da confermare, come quelle dal sito. Le date sono facoltative."
                }
              />
              <fieldset className="grid min-w-0 gap-3">
                <legend className="pn-legenda">{abbonamento ? "Inizio" : "Date"}</legend>
                <p className="pn-aiuto -mt-1">
                  {abbonamento
                    ? "L’abbonamento vale un mese dall’inizio, con una consegna o un ritiro ogni 3 giorni."
                    : `Un tocco imposta cucina e ${ritiro ? "ritiro" : "consegna"} nello stesso giorno.`}
                </p>
                <div className="pn-scelte" role="group" aria-label={abbonamento ? "Inizio: oggi, domani o dopodomani" : "Cucina e uscita: oggi, domani o dopodomani"}>
                  {scorciatoieDate(oggi).map(({ nome, data }) => {
                    const chiusa = chiusuraDi(data, chiusure);
                    return (
                      <button
                        key={data}
                        type="button"
                        className="pn-chip"
                        aria-pressed={campi.produzione === data && campi.uscita === data}
                        onClick={() => setCampi((c) => conInizio(c, data))}
                        title={chiusa ? `Sei chiuso${chiusa.motivo ? `: ${chiusa.motivo}` : ""}` : undefined}
                      >
                        {nome} · {giorno(data)}
                        {chiusa ? <span className="font-normal"> · chiuso</span> : null}
                      </button>
                    );
                  })}
                </div>
                {abbonamento ? (
                  <>
                    <div className="campo min-w-0 max-w-xs">
                      <label htmlFor="nuovo-produzione">Inizio dell’abbonamento</label>
                      <input
                        id="nuovo-produzione"
                        type="date"
                        value={inizio}
                        onChange={(e) => setCampi((c) => conInizio(c, e.target.value))}
                        aria-invalid={errori.date ? true : undefined}
                        aria-describedby={[idErroreDate, "nuovo-periodo"].filter(Boolean).join(" ")}
                      />
                    </div>
                    {inizioValido ? (
                      <CalendarioConsegne id="nuovo-periodo" formula={campi.formula} inizio={inizioValido} oggi={oggi} chiusure={chiusure} />
                    ) : (
                      <p id="nuovo-periodo" className="text-[16px]" aria-live="polite">
                        Scegli l’inizio: il periodo e le consegne si calcolano da soli.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="pn-due-campi">
                    <div className="campo min-w-0">
                      <label htmlFor="nuovo-produzione">Cucina il</label>
                      <input
                        id="nuovo-produzione"
                        type="date"
                        value={campi.produzione}
                        onChange={(e) => cambia({ produzione: e.target.value })}
                        aria-invalid={errori.date ? true : undefined}
                        aria-describedby={idErroreDate}
                      />
                    </div>
                    <div className="campo min-w-0">
                      <label htmlFor="nuovo-uscita">{ritiro ? "Ritiro il" : "Consegna il"}</label>
                      <input
                        id="nuovo-uscita"
                        type="date"
                        value={campi.uscita}
                        onChange={(e) => cambia({ uscita: e.target.value })}
                        aria-invalid={errori.date ? true : undefined}
                        aria-describedby={idErroreDate}
                      />
                    </div>
                  </div>
                )}
                {errori.date ? <p id="nuovo-date-errore" className="pn-errore-campo">{errori.date}</p> : null}
                {abbonamento ? null : <AvvisoChiusura giorni={[campi.produzione, campi.uscita]} chiusure={chiusure} />}
              </fieldset>
            </section>

            <section aria-labelledby="nuovo-soldi" className="grid gap-4">
              <h3 id="nuovo-soldi" className="pn-h3 mb-0">Prezzo</h3>
              <div className="pn-due-campi items-end">
                <div className="campo min-w-0">
                  <label htmlFor="nuovo-prezzo">{codiceSconto.trim() ? "Totale prima dello sconto" : "Prezzo concordato"}</label>
                  <div className="pn-euro">
                    <span aria-hidden="true">€</span>
                    <input
                      id="nuovo-prezzo"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0,00"
                      value={campi.prezzo}
                      onChange={(e) => cambia({ prezzo: e.target.value })}
                      aria-invalid={errori.prezzo ? true : undefined}
                      aria-describedby={errori.prezzo ? "nuovo-prezzo-errore" : "nuovo-prezzo-aiuto"}
                    />
                  </div>
                  {errori.prezzo ? (
                    <p id="nuovo-prezzo-errore" className="pn-errore-campo">{errori.prezzo}</p>
                  ) : (
                    <p id="nuovo-prezzo-aiuto" className="pn-aiuto">
                      {abbonamento
                        ? "Il prezzo del mese, in euro con la virgola. Lo vede anche il cliente."
                        : "In euro, con la virgola. Facoltativo: puoi scriverlo anche dopo."}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={campi.pagato}
                  className="pn-switch self-start sm:mb-7 sm:self-end"
                  onClick={() => cambia({ pagato: !campi.pagato })}
                >
                  <span className="pn-switch-binario" aria-hidden="true" />
                  {campi.pagato ? "Già pagato" : "Non ancora pagato"}
                </button>
              </div>
              <div className="campo"><label htmlFor="nuovo-sconto">Codice sconto (facoltativo)</label><input id="nuovo-sconto" value={codiceSconto} maxLength={32} autoCapitalize="characters" autoComplete="off" onChange={(e) => setCodiceSconto(e.target.value)} /><p className="pn-aiuto">Si applica una volta al totale scritto sopra. Negli abbonamenti con prezzo proposto si applica al listino. Il server verifica il codice al salvataggio.</p></div>
              {abbonamento ? (
                <PrezzoProposto scelta={campi} ritiro={ritiro} totaleAttuale={centesimi} onUsa={(testo) => cambia({ prezzo: testo })} />
              ) : null}
            </section>

            <section aria-labelledby="nuovo-note-titolo" className="grid gap-4">
              <h3 id="nuovo-note-titolo" className="pn-h3 mb-0">Note</h3>
              <Campo
                id="nuovo-note"
                etichetta={abbonamento ? "La scheda del cliente" : "Richieste del cliente"}
                aiuto={
                  abbonamento
                    ? "Come si allena, obiettivi, indicazioni del nutrizionista, allergie. Compare nella scheda ordine e nel foglio cucina."
                    : "Allergie dette al telefono, senza cipolla, porzioni grandi… Compaiono nella scheda ordine."
                }
              >
                {(aria) => (
                  <textarea {...aria} rows={3} maxLength={1500} value={campi.note} onChange={(e) => cambia({ note: e.target.value })} />
                )}
              </Campo>
              <div className="campo pn-solo-matteo min-w-0">
                <label htmlFor="nuovo-nota" className="pn-campo-etichetta">
                  Nota interna
                  <span className="pn-segno pn-segno-neutro normal-case tracking-normal">
                    <Icona nome="lucchetto" className="size-3.5" />
                    Solo tu
                  </span>
                </label>
                <textarea
                  id="nuovo-nota"
                  rows={2}
                  maxLength={2000}
                  value={campi.nota}
                  onChange={(e) => cambia({ nota: e.target.value })}
                  aria-describedby="nuovo-nota-aiuto"
                />
                <p id="nuovo-nota-aiuto" className="pn-aiuto">Il cliente non la vede mai.</p>
              </div>
            </section>

            <section aria-labelledby="nuovo-riepilogo" className="grid gap-3">
              <h3 id="nuovo-riepilogo" className="pn-h3 mb-0">Riepilogo</h3>
              <dl className="grid gap-2 text-base">
                <Riga etichetta="Cliente">
                  {campi.modo === "registrato" && !campi.cliente
                    ? "Da scegliere"
                    : `${campi.nome.trim() || "Senza nome"}${campi.telefono.trim() ? ` · ${campi.telefono.trim()}` : ""}`}
                  <span className="block text-[14px] text-muted">
                    {campi.modo === "registrato" ? "Account registrato: riceve le email di aggiornamento" : "Senza account: nessuna email, lo avvisi tu"}
                  </span>
                </Riga>
                <Riga etichetta="Servizio">{ETICHETTE_SERVIZIO[campi.servizio]}</Riga>
                <Riga etichetta={ritiro ? "Ritiro" : "Consegna"}>
                  {ritiro
                    ? `In sede${campi.comune.trim() ? ` · cliente di ${campi.comune.trim()}` : ""}`
                    : [campi.indirizzo.trim(), campi.comune.trim()].filter(Boolean).join(", ") || "Indirizzo da scrivere"}
                </Riga>
                {abbonamento ? (
                  <Riga etichetta="Formula">
                    {nomeFormula}
                    <span className="block text-[14px] text-muted">
                      {NOMI_NUCLEO[campi.nucleo]}
                    </span>
                  </Riga>
                ) : (
                  <Riga etichetta="Date">
                    Cucina {giornoLungo(campi.produzione || null, "da fissare")} · {ritiro ? "ritiro" : "consegna"} {giornoLungo(campi.uscita || null, "da fissare")}
                  </Riga>
                )}
                <Riga etichetta="Stato">{campi.stato === "confirmed" ? "Già confermato" : "Da confermare"}</Riga>
                {abbonamento ? (
                  <Riga etichetta="Periodo">
                    {calendario ? (
                      <>
                        {`Da ${giornoLungo(calendario.dal)} a ${giornoLungo(calendario.al)}`}
                        <span className="block text-[14px] text-muted">
                          {calendario.pasti} pasti in {calendario.consegne.length} consegne, una ogni 3 giorni
                        </span>
                      </>
                    ) : (
                      "Inizio da fissare"
                    )}
                  </Riga>
                ) : null}
                <Riga etichetta={abbonamento ? "Pasti" : "Piatti"}>
                  {abbonamento ? (
                    "Sulla scheda del cliente: li scegli tu"
                  ) : piatti.length ? (
                    <ul>
                      {piatti.map((p) => (
                        <li key={p.id}>
                          <span className="num font-bold">{p.quanti} ×</span> {p.nome}
                        </li>
                      ))}
                    </ul>
                  ) : campi.servizio === "home-cooking" ? (
                    "Nessun piatto dal menu"
                  ) : (
                    "Nessun piatto scelto"
                  )}
                </Riga>
                {abbonamento ? null : (
                  <Riga etichetta="Porzioni">
                    <span className="num font-bold">{porzioni}</span>
                  </Riga>
                )}
                <Riga etichetta="Prezzo">
                  {centesimi === undefined ? "Da correggere" : centesimi === null ? "Senza prezzo" : euro(centesimi)}
                  {centesimi ? (campi.pagato ? " · pagato" : " · da pagare") : ""}
                </Riga>
              </dl>
            </section>
          </div>

          <div className="pn-scheda-piede">
            {erroreServer ? <Avviso tipo="errore">{erroreServer}</Avviso> : null}
            {campiConErrore.length ? (
              <Avviso tipo="errore">
                {campiConErrore.length === 1 ? "Manca una cosa" : `Mancano ${campiConErrore.length} cose`}: {campiConErrore.map((k) => NOME_CAMPO[k]).join(", ")}.
              </Avviso>
            ) : null}
            <p className="flex flex-wrap items-baseline gap-x-3 text-[15px]">
              <strong className="num text-[18px]">
                {abbonamento ? `Abbonamento ${nomeFormula}` : plurale(porzioni, "porzione", "porzioni")}
              </strong>
              <span className="text-muted">
                {abbonamento ? "Inizio" : ritiro ? "Ritiro" : "Consegna"} {giorno(inizio || null, "da fissare")}
                {centesimi ? ` · ${euro(centesimi)}` : ""}
              </span>
            </p>
            <div className="pn-bottoni">
              <button type="submit" className="pn-tasto pn-tasto-pieno pn-tasto-grande flex-1 whitespace-nowrap" disabled={salvo} aria-busy={salvo}>
                {salvo ? "Salvo…" : abbonamento ? "Salva abbonamento" : "Salva ordine"}
              </button>
              <button type="button" className="pn-tasto pn-tasto-grande" onClick={chiudi} disabled={salvo}>
                Annulla
              </button>
            </div>
          </div>
        </form>
      </div>
    </dialog>
  );
}

function Riga({ etichetta, children }: { etichetta: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-3 border-b border-ink/10 pb-2">
      <dt className="w-24 shrink-0 text-muted">{etichetta}</dt>
      <dd className="min-w-0 flex-1 [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}
