"use client";

import Link from "next/link";
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
  CONSEGNA_OGNI_GIORNI,
  etichettaFormula,
  FASCE,
  FORMULE,
  getFormula,
  NOMI_FASCIA,
  NOMI_NUCLEO,
  NOTE_FASCIA,
  NUCLEI,
  PREZZO_DA_TESTO,
  prezzoListino,
  RAGGIO_CONSEGNA_KM,
  SCONTI,
  SCONTO_NUCLEO,
  type Fascia,
  type FormulaId,
  type Nucleo,
} from "@/lib/abbonamento";
import { api, type Chiusura, type Modalita, type Profilo, type Servizio, type Utente } from "@/lib/api";
import { caselleEscluse, chiusuraDi, chiusureVicine, fraseChiusura } from "@/lib/impostazioni";
import { useImpostazioni } from "@/components/impostazioni/useImpostazioni";
import { GIORNI, usePiano } from "@/lib/piano";
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
   con chi ci si abbona (per lo sconto) e se si parte dalla settimana di prova.
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
  "menu-settimana": "Nessun pagamento online: Matteo ti conferma disponibilità, giorno e totale prima di cucinare.",
  abbonamento: "Nessun pagamento online: inizio, consegna o ritiro e pagamento si concordano con Matteo.",
  "sui-tuoi-macro": "Nessun pagamento online: Matteo ti conferma disponibilità, giorno e totale prima di cucinare.",
  "home-cooking": "Nessun pagamento online: Matteo ti ricontatta per concordare menu, spesa, giorno e preventivo.",
};

const MODALITA: { id: Modalita; titolo: string; nota: string }[] = [
  { id: "pickup", titolo: "Ritiro", nota: "In Via del Santuario 214, Pescara" },
  { id: "delivery", titolo: "Consegna", nota: "A domicilio, da confermare con Matteo" },
];

/* Per l'abbonamento le stesse due strade, con cio' che cambia: lo sconto del ritiro e la cadenza di ogni 3 giorni. */
const MODALITA_ABBONAMENTO: { id: Modalita; titolo: string; nota: string }[] = [
  { id: "pickup", titolo: "Ritiro", nota: `In Via del Santuario 214, Pescara, ogni ${CONSEGNA_OGNI_GIORNI} giorni · sconto −${SCONTI.ritiro}%` },
  {
    id: "delivery",
    titolo: "Consegna",
    nota: `A domicilio ogni ${CONSEGNA_OGNI_GIORNI} giorni, Pescara e dintorni fino a ${RAGGIO_CONSEGNA_KM} km: da confermare con Matteo`,
  },
];

const NOTE_SERVIZIO: Record<Servizio, string> = {
  "menu-settimana": "Con i piatti che hai scelto",
  abbonamento: `Da ${PREZZO_DA_TESTO} al mese · cinque formule, sul piano del tuo nutrizionista`,
  "sui-tuoi-macro": "Sui numeri della tua scheda",
  "home-cooking": "Su preventivo, niente piatti da scegliere",
};

/* Con chi ci si abbona: lo sconto accanto, letto da lib/abbonamento.ts. */
const NOTE_NUCLEO: Record<Nucleo, string> = {
  singolo: "Prezzo di listino",
  coppia: `Sconto −${SCONTO_NUCLEO.coppia}% se vi abbonate in due`,
  famiglia: `Sconto −${SCONTO_NUCLEO.famiglia}% se vi abbonate in famiglia`,
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
  const { piano, allenamenti, pronto, macroSettimana } = usePiano();
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
    // La prima settimana e' di prova per tutti, "senza impegno": si parte da li' salvo che il cliente lo tolga.
    prova: true,
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
  const giorniAllenamento = GIORNI.filter((g) => allenamenti[g]).length;
  const formula = getFormula(dati.formula);
  const stima = abbonamento ? stimaAbbonamento(dati) : null;
  const ritiro = dati.modalita === "pickup";

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
    window.requestAnimationFrame(() => document.getElementById("nr-servizio")?.focus());
  }

  async function invia(e: FormEvent) {
    e.preventDefault();
    // Il ref e non solo lo stato: due invii nello stesso istante (doppio tocco, Invio tenuto premuto) vedrebbero entrambi invio=false.
    if (invio || inVolo.current) return;
    setProvato(true);
    const primo = ORDINE_CAMPI_RICHIESTA.find((k) => errori[k]);
    if (primo) {
      document.getElementById(`nr-${primo}`)?.focus();
      return;
    }
    inVolo.current = true;
    setInvio(true);
    setErrore(null);
    try {
      const r = await api.inviaOrdine(corpoRichiesta(dati, piano, allenamenti));
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
                ? "Per questo servizio serve almeno un piatto nella settimana: scrivi i numeri del tuo nutrizionista e la settimana si compone da sola coi piatti più vicini. Poi torni qui a inviarla."
                : "Per questo servizio serve almeno un piatto nella settimana: componila, poi torni qui a inviarla. Se non vuoi scegliere i piatti, c’è l’abbonamento."}
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

        <Gruppo legenda="Servizio" errore={visibili.servizio} idErrore="nr-servizio-errore">
          <div className="grid gap-2 sm:grid-cols-2">
            {SERVIZI.map((s, i) => (
              <label key={s.id} className="acc-scelta">
                <input
                  id={i === 0 ? "nr-servizio" : undefined}
                  type="radio"
                  name="nr-servizio"
                  value={s.id}
                  checked={dati.servizio === s.id}
                  onChange={() => aggiorna("servizio", s.id)}
                />
                <span>
                  <span className="acc-scelta-titolo">{s.nome}</span>
                  <span className="acc-scelta-nota">{NOTE_SERVIZIO[s.id]}</span>
                </span>
              </label>
            ))}
          </div>
        </Gruppo>

        {abbonamento ? (
          <>
            <Gruppo legenda="Formula" errore={visibili.formula} idErrore="nr-formula-errore">
              <div className="grid gap-2">
                {FORMULE.map((f, i) => (
                  <label key={f.id} className="acc-scelta">
                    <input
                      id={i === 0 ? "nr-formula" : undefined}
                      type="radio"
                      name="nr-formula"
                      value={f.id}
                      checked={dati.formula === f.id}
                      onChange={() => aggiorna("formula", f.id)}
                    />
                    <span>
                      <span className="acc-scelta-titolo">
                        {f.nome}
                        {f.consigliato ? <span className="acc-scelta-tag">Consigliato</span> : null}
                      </span>
                      <span className="acc-scelta-nota">{f.slogan}</span>
                      <span className="acc-scelta-nota acc-scelta-riga">
                        <span>{f.pastiSettimana} pasti a settimana</span>
                        <span className="num">Standard {f.prezzo.standard} €</span>
                        <span className="num">Plus {f.prezzo.plus} €</span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted">Prezzi al mese, di listino. Il piano lo porti tu, scritto dal tuo nutrizionista: Matteo lo cucina ai grammi.</p>
            </Gruppo>

            <Gruppo legenda="Fascia">
              <div className="grid gap-2 sm:grid-cols-2">
                {FASCE.map((f, i) => (
                  <label key={f} className="acc-scelta">
                    <input
                      id={i === 0 ? "nr-fascia" : undefined}
                      type="radio"
                      name="nr-fascia"
                      value={f}
                      checked={dati.fascia === f}
                      onChange={() => aggiorna("fascia", f)}
                    />
                    <span>
                      <span className="acc-scelta-titolo">{NOMI_FASCIA[f]}</span>
                      <span className="acc-scelta-nota">{NOTE_FASCIA[f]}</span>
                      <span className="acc-scelta-nota num">{prezzoListino(dati.formula, f)} € al mese</span>
                    </span>
                  </label>
                ))}
              </div>
            </Gruppo>

            <Gruppo legenda="Come ti abboni">
              <div className="grid gap-2 sm:grid-cols-3">
                {NUCLEI.map((n, i) => (
                  <label key={n} className="acc-scelta">
                    <input
                      id={i === 0 ? "nr-nucleo" : undefined}
                      type="radio"
                      name="nr-nucleo"
                      value={n}
                      checked={dati.nucleo === n}
                      onChange={() => aggiorna("nucleo", n)}
                    />
                    <span>
                      <span className="acc-scelta-titolo">{NOMI_NUCLEO[n]}</span>
                      <span className="acc-scelta-nota">{NOTE_NUCLEO[n]}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted">Lo sconto vale se vi abbonate insieme: lo conferma Matteo.</p>
            </Gruppo>

            <label className="acc-spunta">
              <input
                id="nr-prova"
                type="checkbox"
                checked={dati.prova}
                onChange={(e) => aggiorna("prova", e.target.checked)}
                aria-describedby="nr-prova-aiuto"
              />
              <span>
                <span className="font-semibold">Parto con la settimana di prova</span>
                <span id="nr-prova-aiuto" className="block text-sm text-muted">
                  La prima settimana è di prova, senza impegno. Come si svolge lo concordi con Matteo.
                </span>
              </span>
            </label>
          </>
        ) : null}

        <Gruppo legenda="I tuoi recapiti">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              {campo("nome", "Nome per la richiesta", { autoComplete: "name", maxLength: 100 })}
            </div>
            {campo("telefono", "Telefono", { type: "tel", inputMode: "tel", autoComplete: "tel", maxLength: 40 })}
            {campo("comune", "Comune", { autoComplete: "address-level2", maxLength: 100, placeholder: "Pescara, Montesilvano…" })}
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

        <div className="grid gap-5 sm:grid-cols-2">
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
                ? "Da domani a 90 giorni. Matteo ti conferma l’inizio: da quel giorno l’abbonamento vale un mese."
                : "Da domani a 90 giorni. Matteo cucina ogni giorno e consegna ogni giorno: ti conferma lui il giorno."}
            </p>
          </div>
        </div>

        <div className="campo">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="nr-note">{abbonamento ? "La tua scheda per Matteo (facoltativa)" : "Note per Matteo (facoltative)"}</label>
            <span className="num text-xs text-muted" aria-hidden="true">{dati.note.length}/{NOTE_MAX}</span>
          </div>
          <textarea
            id="nr-note"
            maxLength={NOTE_MAX}
            value={dati.note}
            onChange={(e) => aggiorna("note", e.target.value)}
            rows={abbonamento ? 6 : 4}
            placeholder={
              abbonamento
                ? "Come e quando ti alleni, i tuoi obiettivi, le indicazioni del nutrizionista (calorie, proteine, carboidrati, grassi), cosa non mangi…"
                : "Orari, citofono, domande…"
            }
            aria-invalid={visibili.note ? true : undefined}
            aria-describedby={visibili.note ? "nr-note-errore" : "nr-note-aiuto"}
          />
          <p id="nr-note-aiuto" className="text-sm text-muted">
            {abbonamento
              ? "Su questa scheda Matteo cucina i tuoi pasti: scrivi o incolla il piano del tuo nutrizionista, oppure come ti alleni e cosa vuoi ottenere. "
              : ""}
            {profilo?.preferences
              ? "Preferenze e allergie del tuo profilo arrivano a Matteo insieme alla richiesta."
              : "Allergie o intolleranze? Scrivile qui, o salvale una volta per tutte nel profilo."}
          </p>
          {visibili.note ? <p id="nr-note-errore" className="errore">{visibili.note}</p> : null}
        </div>

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
                <p className="acc-stima-totale num">{stima.totale}</p>
                <p className="mt-2 text-sm text-muted">{stima.dettaglio}</p>
              </Stato>
              <p className="text-sm text-muted">
                Stima: applica lo sconto più alto fra quelli che ti spettano. Il prezzo finale lo conferma Matteo; sul sito non si paga niente.
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
                <div><dt>Settimana di prova</dt><dd>{dati.prova ? "Sì, parto dalla prova" : "No"}</dd></div>
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
                <div><dt>La tua scheda</dt><dd>{dati.note.trim() ? "Scritta nelle note" : "Da scrivere nelle note"}</dd></div>
                {/* Gli allenamenti del compositore contano solo se ci sono: nell'abbonamento si scrivono nella scheda. */}
                {giorniAllenamento ? <div><dt>Allenamenti</dt><dd>{`${giorniAllenamento} giorni indicati`}</dd></div> : null}
                {voceAllergie}
              </>
            ) : (
              <>
                <div><dt>Servizio</dt><dd>{servizio.nome}</dd></div>
                <div>
                  <dt>Piatti</dt>
                  <dd>{pronto ? (piatti ? `${piatti} su 14` : conPiatti ? "Nessuno, per ora" : "Nessuno: non servono") : "…"}</dd>
                </div>
                {pronto && piatti ? (
                  <div>
                    <dt>Macro della settimana</dt>
                    <dd className="num text-sm">
                      {Math.round(macroSettimana.kcal).toLocaleString("it-IT")} kcal · P {Math.round(macroSettimana.proteine)} · C {Math.round(macroSettimana.carboidrati)} · G {Math.round(macroSettimana.grassi)}
                    </dd>
                  </div>
                ) : null}
                <div><dt>Allenamenti</dt><dd>{giorniAllenamento ? `${giorniAllenamento} giorni indicati` : "Non indicati"}</dd></div>
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
