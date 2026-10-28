"use client";

import Link from "next/link";
import { calcolaPrezzo } from "@/lib/abbonamento";
import { totaleScontato } from "@/lib/sconti";
import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import {
  campiMancanti,
  contaPiatti,
  corpoRichiesta,
  eSessioneScaduta,
  formattaGiorno,
  frequenzaConsegne,
  limitiDataRichiesta,
  messaggioDa,
  NOTE_MAX,
  ORDINE_CAMPI_RICHIESTA,
  righePiano,
  SERVIZIO_CON_PIATTI,
  spostaGiorni,
  stimaAbbonamento,
  validaRichiesta,
  type DatiRichiesta,
} from "@/lib/account";
import {
  etichettaFormula,
  FASCE,
  FORMULE,
  getFormula,
  NOMI_FASCIA,
  NOMI_NUCLEO,
  NOTE_FASCIA,
  NUCLEI,
  prezzoListino,
  RAGGIO_CONSEGNA_KM,
  type Fascia,
  type FormulaId,
  type Nucleo,
} from "@/lib/abbonamento";
import { api, type Chiusura, type Modalita, type Profilo, type Servizio, type Utente } from "@/lib/api";
import { caselleEscluse, chiusuraDi, chiusureVicine, fraseChiusura } from "@/lib/impostazioni";
import { useImpostazioni } from "@/components/impostazioni/useImpostazioni";
import { usePiano } from "@/lib/piano";
import { SERVIZI } from "@/lib/servizi";
import { cancellaBozzaRichiesta, leggiBozzaSalvata, salvaBozzaRichiesta } from "../bozza";
import { Avviso, Caricamento, LinkAccediDiNuovo, Stato, TitoloSezione } from "../ui";
import type { Dati } from "./tipi";

/* Il modulo che manda la settimana a Matteo. I recapiti partono dal profilo e,
   se cambiano, si possono salvare li'. Nessun pagamento: Matteo conferma
   disponibilita', giorno e totale, e il cliente lo vede in "Richieste".

   Le chiusure decise da Matteo nel pannello (GET /api/settings) arrivano prima
   del modulo: in alto quelle vicine, accanto alla data l'errore se il giorno
   scelto cade in una chiusura. Anche il server rifiuta quel giorno.

   L'abbonamento mensile (?servizio=abbonamento) non vuole la settimana
   composta: chiede la formula (una delle cinque), la fascia (Standard o Plus),
   con chi ci si abbona (per lo sconto).
   La data diventa l'inizio desiderato e le note diventano la scheda: il piano
   del nutrizionista, gli allenamenti, le allergie. Il prezzo che si legge e' una
   stima (lib/account.ts, stimaAbbonamento): il server propone lo stesso numero,
   il totale lo conferma Matteo. Dal compositore non parte nessun piatto. */

/** Quanti giorni avanti guarda l'avviso delle chiusure in arrivo. */
const GIORNI_AVVISO_CHIUSURE = 30;

type Props = {
  utente: Utente;
  profilo: Dati<Profilo>;
  servizioIniziale: Servizio;
  /** Da ?formula=: la formula gia' scelta quando si arriva da una scheda del sito. */
  formulaIniziale: FormulaId;
  /** Da ?fascia=. */
  fasciaIniziale: Fascia;
  /** Da ?modalita=: il simulatore del sito ha gia' scelto ritiro o consegna. */
  modalitaIniziale?: Modalita;
  /** Da ?nucleo=: e con chi ci si abbona. */
  nucleoIniziale?: Nucleo;
  /** La query con cui si e' aperto il modulo: la bozza e' di questo indirizzo (lib/account.ts: leggiBozza). */
  ricerca: string;
  onInviata: (id: string) => void;
};

export default function NuovaRichiesta({
  utente,
  profilo,
  servizioIniziale,
  formulaIniziale,
  fasciaIniziale,
  modalitaIniziale = "pickup",
  nucleoIniziale = "singolo",
  ricerca,
  onInviata,
}: Props) {
  // Il modulo aspetta anche le impostazioni: l'avviso delle chiusure non deve spingere giu' i campi dopo.
  const impostazioni = useImpostazioni();
  // Il titolo segue il servizio scelto nel modulo, non quello con cui si e' aperta la pagina.
  const [servizio, setServizio] = useState<Servizio>(servizioIniziale);
  return (
    <section aria-labelledby="t-nuova" className="grid gap-8">
      <div>
        <TitoloSezione id="t-nuova">{TITOLO_SERVIZIO[servizio]}</TitoloSezione>
        <p className="lead mt-4">{LEAD_SERVIZIO[servizio]}</p>
      </div>
      {profilo.stato === "attesa" || impostazioni.stato === "attesa" ? (
        <Caricamento testo="Preparo il modulo…" righe={5} />
      ) : (
        <Modulo
          onServizio={setServizio}
          chiusure={impostazioni.impostazioni.chiusure}
          esclusi={impostazioni.impostazioni.piattiNonDisponibili}
          utente={utente}
          profilo={profilo.stato === "pronto" ? profilo.dati : null}
          erroreProfilo={profilo.stato === "errore" ? profilo.messaggio : null}
          onProfilo={profilo.imposta}
          servizioIniziale={servizioIniziale}
          formulaIniziale={formulaIniziale}
          fasciaIniziale={fasciaIniziale}
          modalitaIniziale={modalitaIniziale}
          nucleoIniziale={nucleoIniziale}
          ricerca={ricerca}
          onInviata={onInviata}
        />
      )}
    </section>
  );
}

const TITOLO_SERVIZIO: Record<Servizio, string> = {
  "menu-settimana": "Invia la settimana a Matteo.",
  abbonamento: "Chiedi l’abbonamento a Matteo.",
  "sui-tuoi-macro": "Invia la settimana a Matteo.",
  "home-cooking": "Chiedi l’home cooking a Matteo.",
};

const LEAD_SERVIZIO: Record<Servizio, string> = {
  "menu-settimana": "Lascia i recapiti. Matteo ti conferma giorno e prezzo.",
  abbonamento: "Controlla la formula e lascia i recapiti. Matteo ti ricontatta.",
  "sui-tuoi-macro": "Lascia i recapiti. Matteo ti conferma giorno e prezzo.",
  "home-cooking": "Lascia i recapiti. Matteo ti ricontatta per il preventivo.",
};

const MODALITA: { id: Modalita; titolo: string; nota: string }[] = [
  { id: "pickup", titolo: "Ritiro", nota: "In Via del Santuario 214, Pescara" },
  { id: "delivery", titolo: "Consegna", nota: "A domicilio, da confermare con Matteo" },
];

/* Per l'abbonamento le stesse due strade, con cio' che cambia: lo sconto del ritiro e il giorno e l'orario da concordare con Matteo. */
const MODALITA_ABBONAMENTO: { id: Modalita; titolo: string; nota: string }[] = [
  { id: "pickup", titolo: "Ritiro", nota: "In Via del Santuario 214, Pescara, con giorno e orario concordati" },
  {
    id: "delivery",
    titolo: "Consegna",
    nota: `A domicilio, Pescara e dintorni fino a ${RAGGIO_CONSEGNA_KM} km: giorno e orario da confermare con Matteo`,
  },
];

/* Con chi ci si abbona: lo sconto accanto, letto da lib/abbonamento.ts. */
const NOTE_NUCLEO: Record<Nucleo, string> = {
  singolo: "Prezzo di listino",
  coppia: "Abbonamento per due persone",
  famiglia: "Abbonamento per la famiglia",
};

function Modulo({
  onServizio,
  chiusure,
  esclusi,
  utente,
  profilo,
  erroreProfilo,
  onProfilo,
  servizioIniziale,
  formulaIniziale,
  fasciaIniziale,
  modalitaIniziale,
  nucleoIniziale,
  ricerca,
  onInviata,
}: {
  /** Il servizio scelto, per il titolo della pagina. */
  onServizio: (s: Servizio) => void;
  chiusure: readonly Chiusura[];
  esclusi: readonly string[];
  utente: Utente;
  profilo: Profilo | null;
  erroreProfilo: string | null;
  onProfilo: (p: Profilo) => void;
  servizioIniziale: Servizio;
  formulaIniziale: FormulaId;
  fasciaIniziale: Fascia;
  modalitaIniziale: Modalita;
  nucleoIniziale: Nucleo;
  ricerca: string;
  onInviata: (id: string) => void;
}) {
  const { piano, allenamenti, pronto } = usePiano();
  const [limiti] = useState(() => limitiDataRichiesta(new Date()));
  const daCapo = (): DatiRichiesta => ({
    servizio: servizioIniziale,
    nome: utente.name ?? "",
    telefono: profilo?.phone ?? "",
    comune: profilo?.comune ?? "",
    indirizzo: profilo?.address ?? "",
    modalita: modalitaIniziale,
    data: "",
    note: "",
    formula: formulaIniziale,
    fascia: fasciaIniziale,
    nucleo: nucleoIniziale,
  });
  /* Una richiesta lasciata a meta' (scheda ricaricata dal telefono, sessione scaduta e rientro) si ritrova com'era:
     la scheda dell'abbonamento e' mezza pagina da riscrivere. E' legata a questo utente e a questo indirizzo. */
  const [bozza] = useState(() => leggiBozzaSalvata(utente.id, ricerca, limiti.min));
  const [dati, setDati] = useState<DatiRichiesta>(() => bozza ?? daCapo());
  const [ritrovata, setRitrovata] = useState(!!bozza);
  const modificata = useRef(!!bozza);
  const [provato, setProvato] = useState(false);
  const [salvaNelProfilo, setSalvaNelProfilo] = useState(true);
  const [invio, setInvio] = useState(false);
  const inVolo = useRef(false);
  const [errore, setErrore] = useState<{ testo: string; sessione: boolean } | null>(null);
  const refErrore = useRef<HTMLDivElement>(null);
  const codiceDaQuery = new URLSearchParams(ricerca).get("codice")?.slice(0, 32) ?? "";
  const [codiceSconto, setCodiceSconto] = useState(codiceDaQuery);
  const [scontoVerificato, setScontoVerificato] = useState<{ code: string; percent: number } | null>(null);
  const [verificaSconto, setVerificaSconto] = useState(!!codiceDaQuery);
  const [erroreSconto, setErroreSconto] = useState("");
  useEffect(() => {
    if (!codiceDaQuery) return;
    let vivo = true;
    api.verificaSconto(codiceDaQuery).then((risultato) => {
      if (vivo) { setScontoVerificato(risultato); setCodiceSconto(risultato.code); }
    }).catch((e) => { if (vivo) setErroreSconto(e instanceof Error ? e.message : "Non riesco a verificare il codice."); })
      .finally(() => { if (vivo) setVerificaSconto(false); });
    return () => { vivo = false; };
  }, [codiceDaQuery]);
  async function controllaSconto() {
    setVerificaSconto(true); setErroreSconto("");
    try { setScontoVerificato(await api.verificaSconto(codiceSconto)); }
    catch (e) { setScontoVerificato(null); setErroreSconto(e instanceof Error ? e.message : "Non riesco a verificare il codice."); }
    finally { setVerificaSconto(false); }
  }

  useEffect(() => {
    if (errore) refErrore.current?.focus();
  }, [errore]);

  useEffect(() => {
    onServizio(dati.servizio);
  }, [dati.servizio, onServizio]);

  useEffect(() => {
    if (modificata.current) salvaBozzaRichiesta(utente.id, ricerca, dati);
  }, [dati, utente.id, ricerca]);

  const piatti = contaPiatti(piano);
  const errori = validaRichiesta(dati, { piatti, ...limiti, chiusure });
  const oggi = spostaGiorni(limiti.min, -1);
  // Un giorno di chiusura si segnala subito, senza aspettare l'invio: e' un'informazione, non uno sbaglio.
  const dataChiusa = !!dati.data && !!chiusuraDi(dati.data, chiusure);
  const visibili = provato ? errori : dataChiusa && errori.data ? { data: errori.data } : {};
  const vicine = chiusureVicine(chiusure, oggi, GIORNI_AVVISO_CHIUSURE);
  const nonDisponibili = pronto ? caselleEscluse(piano, esclusi).length : 0;
  const conPiatti = SERVIZIO_CON_PIATTI[dati.servizio];
  const abbonamento = dati.servizio === "abbonamento";
  const servizio = SERVIZI.find((s) => s.id === dati.servizio)!;
  const formula = getFormula(dati.formula);
  const stima = abbonamento ? stimaAbbonamento(dati) : null;
  const ritiro = dati.modalita === "pickup";
  const prezzo = abbonamento ? calcolaPrezzo({ formula: dati.formula, fascia: dati.fascia, nucleo: dati.nucleo, ritiro }) : null;
  const totaleConCodice = prezzo && scontoVerificato
    ? totaleScontato(prezzo.listinoCentesimi, scontoVerificato.percent)
    : null;
  const stimaConCodice = totaleConCodice === null ? null : new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(totaleConCodice / 100);

  /* Le allergie sono l'unica riga del riepilogo che riguarda la sicurezza di chi mangia: si vede cosa leggera' Matteo
     (quelle del profilo arrivano con ogni richiesta) o che non c'e' niente, e dove scriverle. */
  const preferenze = profilo?.preferences.trim() ?? "";
  const voceAllergie = profilo ? (
    <div>
      <dt>Allergie e preferenze</dt>
      <dd>
        {preferenze ? (
          <>
            <span className="line-clamp-3 block font-normal whitespace-pre-line [overflow-wrap:anywhere]">{preferenze}</span>
            <span className="block text-sm font-normal text-muted">Dal tuo profilo: Matteo le legge con la richiesta.</span>
          </>
        ) : (
          <>
            Non indicate
            <span className="block text-sm font-normal text-muted">Hai un’allergia o un’intolleranza? Scrivila nelle note.</span>
          </>
        )}
      </dd>
    </div>
  ) : null;

  // Recapiti diversi da quelli del profilo: si propone di aggiornarlo. Solo se il
  // profilo e' stato letto, altrimenti si rischierebbe di cancellarne le preferenze.
  const diverso = !!profilo && (
    dati.telefono.trim() !== profilo.phone.trim() ||
    dati.comune.trim() !== profilo.comune.trim() ||
    (dati.indirizzo.trim() !== profilo.address.trim() && dati.indirizzo.trim() !== "")
  );

  function aggiorna<K extends keyof DatiRichiesta>(campo: K, valore: DatiRichiesta[K]) {
    modificata.current = true;
    setDati((d) => ({ ...d, [campo]: valore }));
  }

  function ricomincia() {
    cancellaBozzaRichiesta();
    modificata.current = false;
    setDati(daCapo());
    setRitrovata(false);
    setProvato(false);
    portaAlCampo("nr-servizio");
  }

  async function invia(e: FormEvent) {
    e.preventDefault();
    // Il ref e non solo lo stato: due invii nello stesso istante (doppio tocco, Invio tenuto premuto) vedrebbero entrambi invio=false.
    if (invio || inVolo.current) return;
    setProvato(true);
    const primo = ORDINE_CAMPI_RICHIESTA.find((k) => errori[k]);
    if (primo) {
      portaAlCampo(`nr-${primo}`);
      return;
    }
    inVolo.current = true;
    setInvio(true);
    setErrore(null);
    try {
      const r = await api.inviaOrdine({ ...corpoRichiesta(dati, piano, allenamenti), discountCode: codiceSconto.trim() || undefined });
      if (salvaNelProfilo && diverso && profilo) {
        try {
          const salvato = await api.salvaProfilo({
            phone: dati.telefono.trim(),
            comune: dati.comune.trim(),
            address: dati.indirizzo.trim() || profilo.address,
            preferences: profilo.preferences,
          });
          onProfilo(salvato.profile);
        } catch {
          // La richiesta e' partita: il profilo si aggiorna la prossima volta, non e' un errore da mostrare adesso.
        }
      }
      // Partita: la bozza non serve piu' (e i recapiti non devono restare nel browser).
      modificata.current = false;
      cancellaBozzaRichiesta();
      onInviata(r.id);
    } catch (err) {
      setErrore({ testo: messaggioDa(err, "Non riesco a inviare la richiesta. Riprova tra poco."), sessione: eSessioneScaduta(err) });
      inVolo.current = false;
      setInvio(false);
    }
  }

  const campo = (
    k: "nome" | "telefono" | "comune" | "indirizzo",
    etichetta: string,
    extra: InputHTMLAttributes<HTMLInputElement>,
    aiuto?: string,
  ) => {
    const id = `nr-${k}`;
    const descr = [aiuto ? `${id}-aiuto` : null, visibili[k] ? `${id}-errore` : null].filter(Boolean).join(" ") || undefined;
    return (
      <div className="campo">
        <label htmlFor={id}>{etichetta}</label>
        <input
          id={id}
          value={dati[k]}
          onChange={(e) => aggiorna(k, e.target.value)}
          aria-invalid={visibili[k] ? true : undefined}
          aria-describedby={descr}
          {...extra}
        />
        {aiuto ? <p id={`${id}-aiuto`} className="text-sm text-muted">{aiuto}</p> : null}
        {visibili[k] ? <p id={`${id}-errore`} className="errore">{visibili[k]}</p> : null}
      </div>
    );
  };

  return (
    <form noValidate onSubmit={(e) => void invia(e)} className="acc-modulo-richiesta" aria-busy={invio}>
      <div className="acc-modulo-campi grid content-start gap-8">
        {vicine.length ? (
          <Avviso tipo="info" titolo={vicine.length === 1 ? "Chiusura in arrivo" : "Chiusure in arrivo"}>
            <ul className="grid gap-1">
              {vicine.map((c) => (
                <li key={`${c.dal}-${c.al}`}>{fraseChiusura(c, oggi)}.</li>
              ))}
            </ul>
            <p className="mt-2 text-sm">In quei giorni non si cucina: scegli un giorno fuori da queste date, oppure lascialo vuoto e te lo propone Matteo.</p>
          </Avviso>
        ) : null}
        {erroreProfilo ? (
          <Avviso tipo="info">Non riesco a leggere il profilo: scrivi i recapiti qui sotto. {erroreProfilo}</Avviso>
        ) : null}
        {ritrovata ? (
          <Avviso
            tipo="info"
            titolo="Ho ritrovato la tua richiesta"
            azioni={<button type="button" className="link text-sm" onClick={ricomincia}>Ricomincia da capo</button>}
          >
            Era rimasta a metà: puoi continuare da dove eri.
          </Avviso>
        ) : null}
        {/* I servizi con i piatti partono dalla settimana composta: chi arriva qui per la prima volta lo deve sapere prima
            di compilare il resto, non scoprirlo all'invio. Prende il fuoco se si prova a inviare lo stesso. */}
        {conPiatti && pronto && piatti === 0 ? (
          <div id="nr-piano" tabIndex={-1} className={`acc-avviso ${provato ? "acc-avviso-errore" : "acc-avviso-info"}`}>
            <p className="acc-avviso-titolo">Prima i piatti</p>
            <p>
              {dati.servizio === "sui-tuoi-macro"
                ? "Scegli almeno un piatto prima di inviare la richiesta."
                : "Scegli almeno un piatto, oppure chiedi un abbonamento."}
            </p>
            <div className="acc-avviso-azioni">
              <Link href={dati.servizio === "sui-tuoi-macro" ? "/scheda" : "/settimana"} className="btn btn-ink btn-sm">
                {dati.servizio === "sui-tuoi-macro" ? "Vai alla scheda" : "Componi la settimana"}
              </Link>
              {dati.servizio === "sui-tuoi-macro" ? null : (
                <button type="button" className="link text-sm" onClick={() => aggiorna("servizio", "abbonamento")}>
                  Preferisco un abbonamento
                </button>
              )}
            </div>
          </div>
        ) : null}

        <details className="acc-dettagli-piatti">
          <summary>Servizio: {servizio.nome} · Cambia</summary>
          <div className="campo mt-4">
            <label htmlFor="nr-servizio">Cosa vuoi richiedere?</label>
            <select id="nr-servizio" value={dati.servizio} onChange={(e) => aggiorna("servizio", e.target.value as Servizio)} aria-invalid={visibili.servizio ? true : undefined} aria-describedby={visibili.servizio ? "nr-servizio-errore" : undefined}>
              {[...SERVIZI].sort((a, b) => Number(b.id === "abbonamento") - Number(a.id === "abbonamento")).map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
            {visibili.servizio ? <p id="nr-servizio-errore" className="errore">{visibili.servizio}</p> : null}
          </div>
        </details>

        {abbonamento ? (
          <>
            <div className="campo">
              <label htmlFor="nr-formula">Il tuo abbonamento</label>
              <select id="nr-formula" value={dati.formula} onChange={(e) => aggiorna("formula", e.target.value as FormulaId)} aria-invalid={visibili.formula ? true : undefined} aria-describedby={visibili.formula ? "nr-formula-errore" : "nr-formula-aiuto"}>
                {FORMULE.map((f) => <option key={f.id} value={f.id}>{f.nome} · {f.pastiSettimana} pasti/settimana · {f.prezzo[dati.fascia]} €/mese</option>)}
              </select>
              <p id="nr-formula-aiuto" className="text-sm text-muted">{formula.slogan} Sul piano del tuo nutrizionista.</p>
              {visibili.formula ? <p id="nr-formula-errore" className="errore">{visibili.formula}</p> : null}
            </div>

            <details className="acc-dettagli-piatti">
              <summary>
                Personalizza l&apos;abbonamento
                <span className="mt-1 block text-sm font-normal text-muted">{NOMI_FASCIA[dati.fascia]} · {NOMI_NUCLEO[dati.nucleo]}</span>
              </summary>
              <div className="mt-5 grid gap-5">
                <div className="campo">
                  <label htmlFor="nr-fascia">Porzioni</label>
                  <select id="nr-fascia" value={dati.fascia} onChange={(e) => aggiorna("fascia", e.target.value as Fascia)}>
                    {FASCE.map((f) => <option key={f} value={f}>{NOMI_FASCIA[f]} · {prezzoListino(dati.formula, f)} € al mese</option>)}
                  </select>
                  <p className="text-sm text-muted">{NOTE_FASCIA[dati.fascia]}</p>
                </div>
                <div className="campo">
                  <label htmlFor="nr-nucleo">Come ti abboni?</label>
                  <select id="nr-nucleo" value={dati.nucleo} onChange={(e) => aggiorna("nucleo", e.target.value as Nucleo)}>
                    {NUCLEI.map((n) => <option key={n} value={n}>{NOMI_NUCLEO[n]}</option>)}
                  </select>
                  <p className="text-sm text-muted">{NOTE_NUCLEO[dati.nucleo]}. Lo conferma Matteo.</p>
                </div>
              </div>
            </details>
          </>
        ) : null}
        <Gruppo legenda="I tuoi recapiti">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              {campo("nome", "Nome per la richiesta", { autoComplete: "name", autoCapitalize: "words", maxLength: 100 })}
            </div>
            {campo("telefono", "Telefono", { type: "tel", inputMode: "tel", autoComplete: "tel", maxLength: 40 })}
            {campo("comune", "Comune", { autoComplete: "address-level2", autoCapitalize: "words", maxLength: 100, placeholder: "Pescara, Montesilvano…" })}
          </div>
        </Gruppo>

        <Gruppo legenda="Ritiro o consegna" errore={visibili.modalita} idErrore="nr-modalita-errore">
          <div className="grid gap-2 sm:grid-cols-2">
            {(abbonamento ? MODALITA_ABBONAMENTO : MODALITA).map((m, i) => (
              <label key={m.id} className="acc-scelta">
                <input
                  id={i === 0 ? "nr-modalita" : undefined}
                  type="radio"
                  name="nr-modalita"
                  value={m.id}
                  checked={dati.modalita === m.id}
                  onChange={() => aggiorna("modalita", m.id)}
                />
                <span>
                  <span className="acc-scelta-titolo">{m.titolo}</span>
                  <span className="acc-scelta-nota">{m.nota}</span>
                </span>
              </label>
            ))}
          </div>
          {dati.modalita === "delivery" ? (
            <div className="mt-5">
              {campo("indirizzo", "Indirizzo di consegna", { autoComplete: "street-address", maxLength: 240 }, "Via, numero civico ed eventuali indicazioni per il citofono.")}
            </div>
          ) : null}
        </Gruppo>

        <details className="acc-dettagli-piatti">
          <summary>{dati.data ? `Data preferita: ${formattaGiorno(dati.data, limiti.min)}` : "Vuoi indicare una data?"}</summary>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div className="campo">
            <label htmlFor="nr-data">{abbonamento ? "Inizio desiderato (facoltativo)" : "Giorno preferito (facoltativo)"}</label>
            <input
              id="nr-data"
              type="date"
              min={limiti.min}
              max={limiti.max}
              value={dati.data}
              onChange={(e) => aggiorna("data", e.target.value)}
              aria-invalid={visibili.data ? true : undefined}
              aria-describedby={[visibili.data ? "nr-data-errore" : null, "nr-data-aiuto"].filter(Boolean).join(" ")}
            />
            {/* Sempre presente, subito sotto il campo: l'errore della chiusura compare mentre si sceglie la data e va letto subito. */}
            <div aria-live="polite" className="empty:-mt-2">
              {visibili.data ? <p id="nr-data-errore" className="errore">{visibili.data}</p> : null}
            </div>
            <p id="nr-data-aiuto" className="text-sm text-muted">
              {abbonamento
                ? "Matteo conferma l’inizio. Se lasci vuoto, lo concordate insieme."
                : "Matteo conferma il giorno. Se lasci vuoto, lo concordate insieme."}
            </p>
          </div>
        </div>
        </details>

        <div className="campo">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="nr-note">{abbonamento ? "Piano alimentare e allergie" : "Allergie e note per Matteo"}</label>
            <span className="num text-xs text-muted" aria-hidden="true">{dati.note.length}/{NOTE_MAX}</span>
          </div>
          <textarea
            id="nr-note"
            maxLength={NOTE_MAX}
            value={dati.note}
            onChange={(e) => aggiorna("note", e.target.value)}
            rows={4}
            placeholder={
              abbonamento
                ? "Incolla le indicazioni del nutrizionista e segnala allergie o intolleranze."
                : "Allergie, intolleranze, orari o altre indicazioni…"
            }
            aria-invalid={visibili.note ? true : undefined}
            aria-describedby={visibili.note ? "nr-note-errore" : "nr-note-aiuto"}
          />
          <p id="nr-note-aiuto" className="text-sm text-muted">
            {abbonamento
              ? "Puoi inviare il piano alimentare anche dopo, direttamente a Matteo. "
              : ""}
            {profilo?.preferences
              ? "Preferenze e allergie del tuo profilo arrivano a Matteo insieme alla richiesta."
              : "Segnala eventuali allergie prima della conferma."}
          </p>
          {visibili.note ? <p id="nr-note-errore" className="errore">{visibili.note}</p> : null}
        </div>

        <details className="acc-dettagli-piatti">
          <summary>{scontoVerificato ? `Codice ${scontoVerificato.code} · −${scontoVerificato.percent}%` : verificaSconto ? "Verifico il codice sconto…" : erroreSconto ? "Controlla il codice sconto" : "Hai un codice sconto?"}</summary>
        <div className="campo mt-4">
          <label htmlFor="nr-sconto">Codice sconto (facoltativo)</label>
          <div className="flex flex-wrap gap-2">
            <input id="nr-sconto" className="min-w-0 flex-1" value={codiceSconto} maxLength={32} autoCapitalize="characters" autoComplete="off" disabled={verificaSconto || invio} onChange={(e) => { setCodiceSconto(e.target.value); setScontoVerificato(null); setErroreSconto(""); }} aria-describedby="nr-sconto-aiuto" />
            <button className="btn btn-ink btn-sm" type="button" disabled={verificaSconto || !codiceSconto.trim()} onClick={() => void controllaSconto()}>{verificaSconto ? "Verifico…" : "Verifica"}</button>
          </div>
          <p id="nr-sconto-aiuto" className="text-sm text-muted">Sul totale concordato da Matteo. Il codice si applica una volta al totale dell’abbonamento.</p>
          {erroreSconto ? <p role="alert" className="errore">{erroreSconto}</p> : null}
          {scontoVerificato ? <p role="status" className="text-sm font-semibold">{scontoVerificato.code}: −{scontoVerificato.percent}%.
            {abbonamento ? ` Stima con codice: ${stimaConCodice} al mese.` : " Il totale scontato sarà visibile dopo la conferma del prezzo."}
          </p> : null}
        </div>
        </details>
        {diverso ? (
          <label className="acc-spunta">
            <input type="checkbox" checked={salvaNelProfilo} onChange={(e) => setSalvaNelProfilo(e.target.checked)} />
            <span>
              {campiMancanti(profilo).length ? "Salva telefono, comune e indirizzo nel mio profilo" : "Aggiorna il mio profilo con questi recapiti"}
            </span>
          </label>
        ) : null}
      </div>

      <aside className="acc-modulo-riepilogo" aria-labelledby="t-riepilogo">
        <div className="acc-card grid gap-5">
          <h3 id="t-riepilogo" className="acc-card-titolo">Cosa invii</h3>

          {stima ? (
            <>
              {/* Regione live sempre presente nell'abbonamento: il prezzo cambia a ogni scelta e chi usa un lettore di schermo lo sente. */}
              <Stato className="acc-stima">
                <p className="acc-etichetta">Prezzo stimato al mese</p>
                <p className="acc-stima-totale num">{stimaConCodice ?? stima.totale}</p>
                <p className="mt-2 text-sm text-muted">{scontoVerificato ? `Codice ${scontoVerificato.code}: sconto applicato al listino.` : stima.dettaglio}</p>
              </Stato>
              <p className="text-sm text-muted">
                Il prezzo finale lo conferma Matteo. Nessun pagamento online.
              </p>
            </>
          ) : null}

          <dl className="acc-fatti acc-fatti-colonna">
            {abbonamento ? (
              <>
                <div>
                  <dt>Formula</dt>
                  <dd>
                    {etichettaFormula(dati.formula, dati.fascia)}
                    <span className="block text-sm font-normal text-muted">{formula.cosaRicevi}</span>
                  </dd>
                </div>
                <div><dt>Chi si abbona</dt><dd>{NOMI_NUCLEO[dati.nucleo]}</dd></div>
                <div>
                  <dt>Ritiro o consegna</dt>
                  <dd>
                    {frequenzaConsegne(dati.modalita)}
                    <span className="block text-sm font-normal text-muted">
                      {ritiro ? "Via del Santuario 214, Pescara" : dati.indirizzo.trim() || "Indirizzo da scrivere"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Inizio desiderato</dt>
                  <dd>{dati.data ? formattaGiorno(dati.data, limiti.min) : "Da concordare"}</dd>
                </div>
                <div><dt>La tua scheda</dt><dd>{dati.note.trim() ? "Scritta nelle note" : "Da inviare a Matteo"}</dd></div>
                {voceAllergie}
              </>
            ) : (
              <>
                <div><dt>Servizio</dt><dd>{servizio.nome}</dd></div>
                <div>
                  <dt>Piatti</dt>
                  <dd>{pronto ? (piatti ? `${piatti} su 14` : conPiatti ? "Nessuno, per ora" : "Nessuno: non servono") : "…"}</dd>
                </div>
                <div>
                  <dt>{ritiro ? "Ritiro" : "Consegna"}</dt>
                  <dd>{ritiro ? "Via del Santuario 214, Pescara" : dati.indirizzo.trim() || "Indirizzo da scrivere"}</dd>
                </div>
                <div>
                  <dt>Giorno preferito</dt>
                  <dd>{dati.data ? formattaGiorno(dati.data, limiti.min) : "Da concordare"}</dd>
                </div>
                {voceAllergie}
              </>
            )}
          </dl>

          {nonDisponibili && conPiatti ? (
            <div className="acc-avviso acc-avviso-info text-sm">
              <p>
                {nonDisponibili === 1
                  ? "Un piatto della tua settimana non è disponibile questa settimana."
                  : `${nonDisponibili} piatti della tua settimana non sono disponibili questa settimana.`}{" "}
                Se la invii così, Matteo ti propone un’alternativa.
              </p>
              <Link href="/settimana" className="link self-start">{nonDisponibili === 1 ? "Sostituiscilo" : "Sostituiscili"} nel compositore</Link>
            </div>
          ) : null}

          {abbonamento ? (
            <p className="text-sm text-muted">
              Matteo ti ricontatta per concordare inizio, consegna o ritiro e pagamento.
            </p>
          ) : !conPiatti ? (
            <p className="text-sm text-muted">
              Per l’home cooking Matteo ti ricontatta per concordare menu, spesa e giorno.
              {piatti ? " Alleghiamo anche la settimana che hai composto, come idea di partenza." : ""}
            </p>
          ) : null}

          {pronto && piatti && !abbonamento ? (
            <details className="acc-dettagli-piatti">
              <summary>Vedi i piatti</summary>
              <ul className="mt-3 grid gap-2 text-sm">
                {righePiano(piano).map((r) => (
                  <li key={r.giorno}>
                    <span className="font-semibold">{r.nome}</span>
                    {r.pasti.map((p) =>
                      p.piatto ? (
                        <span key={p.pasto} className="block text-muted">
                          <span className="capitalize">{p.pasto}</span> · {p.piatto}
                        </span>
                      ) : null,
                    )}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          {abbonamento ? (
            <Link href="/abbonamento" className="link self-start text-sm">Come funziona l’abbonamento</Link>
          ) : (
            <Link href="/settimana" className="link self-start text-sm">Modifica nel compositore</Link>
          )}
        </div>
      </aside>

      <div className="acc-modulo-invio grid gap-4">
        {errore ? (
          <Avviso ref={refErrore} tipo="errore" azioni={errore.sessione ? <LinkAccediDiNuovo /> : undefined}>
            {errore.testo}
            {errore.sessione ? " Quello che hai scritto qui lo ritrovi dopo l’accesso." : ""}
          </Avviso>
        ) : null}
        {provato && Object.keys(errori).length ? (
          <p className="text-sm font-semibold text-[#a3261b]" role="status">
            Controlla i campi segnati: {Object.keys(errori).length === 1 ? "ne manca uno" : `ne mancano ${Object.keys(errori).length}`}.
          </p>
        ) : null}
        <button type="submit" className="btn btn-lime w-full sm:w-auto sm:justify-self-start" aria-disabled={invio ? true : undefined}>
          {invio ? "Invio a Matteo…" : abbonamento ? "Chiedi l’abbonamento" : "Invia la richiesta"} <span className="freccia" aria-hidden="true">→</span>
        </button>
        <p className="text-xs text-muted">
          Inviando accetti che Matteo usi questi dati per rispondere alla richiesta.{" "}
          <Link href="/privacy" className="underline underline-offset-2">Privacy</Link>
        </p>
      </div>
    </form>
  );
}

/** I campi facoltativi restano raccolti; un errore li rende visibili prima del fuoco. */
function portaAlCampo(id: string) {
  const campo = document.getElementById(id);
  let contenitore = campo?.parentElement ?? null;
  while (contenitore) {
    if (contenitore instanceof HTMLDetailsElement) contenitore.open = true;
    contenitore = contenitore.parentElement;
  }
  window.requestAnimationFrame(() => campo?.focus());
}

function Gruppo({
  legenda,
  children,
  errore,
  idErrore,
}: {
  legenda: string;
  children: ReactNode;
  errore?: string;
  idErrore?: string;
}) {
  return (
    <fieldset className="acc-gruppo-campi" aria-describedby={errore ? idErrore : undefined}>
      <legend className="acc-etichetta">{legenda}</legend>
      <div className="mt-3">{children}</div>
      {errore ? <p id={idErrore} className="errore mt-2">{errore}</p> : null}
    </fieldset>
  );
}
