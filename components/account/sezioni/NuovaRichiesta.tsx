"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import {
  campiMancanti,
  contaPiatti,
  corpoRichiesta,
  formattaGiorno,
  limitiDataRichiesta,
  messaggioDa,
  NOTE_MAX,
  ORDINE_CAMPI_RICHIESTA,
  pranziFeriali,
  righePiano,
  SERVIZIO_CON_PIATTI,
  spostaGiorni,
  validaRichiesta,
  type DatiRichiesta,
} from "@/lib/account";
import { PREZZO_ABBONAMENTO_TESTO } from "@/lib/abbonamento";
import { api, type Chiusura, type Modalita, type Profilo, type Servizio, type Utente } from "@/lib/api";
import { caselleEscluse, chiusuraDi, chiusureVicine, fraseChiusura } from "@/lib/impostazioni";
import { useImpostazioni } from "@/components/impostazioni/useImpostazioni";
import { GIORNI, usePiano } from "@/lib/piano";
import { SERVIZI } from "@/lib/servizi";
import { Avviso, Caricamento, TitoloSezione } from "../ui";
import type { Dati } from "./tipi";

/* Il modulo che manda la settimana a Matteo. I recapiti partono dal profilo e,
   se cambiano, si possono salvare li'. Nessun pagamento: Matteo conferma
   disponibilita', giorno e totale, e il cliente lo vede in "Richieste".

   Le chiusure decise da Matteo nel pannello (GET /api/settings) arrivano prima
   del modulo: in alto quelle vicine, accanto alla data l'errore se il giorno
   scelto cade in una chiusura. Anche il server rifiuta quel giorno.

   L'abbonamento mensile (?servizio=abbonamento) non vuole la settimana
   composta: la data diventa l'inizio desiderato e le note diventano la scheda
   (allenamenti, obiettivi, indicazioni del nutrizionista). Dal compositore
   partono solo i pranzi dal lunedi' al venerdi', se ci sono. */

/** Quanti giorni avanti guarda l'avviso delle chiusure in arrivo. */
const GIORNI_AVVISO_CHIUSURE = 30;

type Props = {
  utente: Utente;
  profilo: Dati<Profilo>;
  servizioIniziale: Servizio;
  onInviata: (id: string) => void;
};

export default function NuovaRichiesta({ utente, profilo, servizioIniziale, onInviata }: Props) {
  // Il modulo aspetta anche le impostazioni: l'avviso delle chiusure non deve spingere giu' i campi dopo.
  const impostazioni = useImpostazioni();
  return (
    <section aria-labelledby="t-nuova" className="grid gap-8">
      <div>
        <TitoloSezione id="t-nuova">
          {servizioIniziale === "abbonamento" ? "Chiedi l’abbonamento a Matteo." : "Invia la settimana a Matteo."}
        </TitoloSezione>
        <p className="lead mt-4">
          {servizioIniziale === "abbonamento"
            ? "Nessun pagamento online: inizio, consegna o ritiro e pagamento si concordano con Matteo."
            : "Nessun pagamento online: Matteo ti conferma disponibilità, giorno e totale prima di cucinare."}
        </p>
      </div>
      {profilo.stato === "attesa" || impostazioni.stato === "attesa" ? (
        <Caricamento testo="Preparo il modulo…" righe={5} />
      ) : (
        <Modulo
          chiusure={impostazioni.impostazioni.chiusure}
          esclusi={impostazioni.impostazioni.piattiNonDisponibili}
          utente={utente}
          profilo={profilo.stato === "pronto" ? profilo.dati : null}
          erroreProfilo={profilo.stato === "errore" ? profilo.messaggio : null}
          onProfilo={profilo.imposta}
          servizioIniziale={servizioIniziale}
          onInviata={onInviata}
        />
      )}
    </section>
  );
}

const MODALITA: { id: Modalita; titolo: string; nota: string }[] = [
  { id: "pickup", titolo: "Ritiro", nota: "In Via del Santuario 214, Pescara" },
  { id: "delivery", titolo: "Consegna", nota: "A domicilio, da confermare con Matteo" },
];

const NOTE_SERVIZIO: Record<Servizio, string> = {
  "menu-settimana": "Con i piatti che hai scelto",
  abbonamento: `${PREZZO_ABBONAMENTO_TESTO} al mese · pranzi dal lunedì al venerdì sulla tua scheda`,
  "sui-tuoi-macro": "Sui numeri della tua scheda",
  "home-cooking": "Su preventivo, niente piatti da scegliere",
};

function Modulo({
  chiusure,
  esclusi,
  utente,
  profilo,
  erroreProfilo,
  onProfilo,
  servizioIniziale,
  onInviata,
}: {
  chiusure: readonly Chiusura[];
  esclusi: readonly string[];
  utente: Utente;
  profilo: Profilo | null;
  erroreProfilo: string | null;
  onProfilo: (p: Profilo) => void;
  servizioIniziale: Servizio;
  onInviata: (id: string) => void;
}) {
  const { piano, allenamenti, pronto, macroSettimana } = usePiano();
  const [dati, setDati] = useState<DatiRichiesta>(() => ({
    servizio: servizioIniziale,
    nome: utente.name ?? "",
    telefono: profilo?.phone ?? "",
    comune: profilo?.comune ?? "",
    indirizzo: profilo?.address ?? "",
    modalita: "pickup",
    data: "",
    note: "",
  }));
  const [limiti] = useState(() => limitiDataRichiesta(new Date()));
  const [provato, setProvato] = useState(false);
  const [salvaNelProfilo, setSalvaNelProfilo] = useState(true);
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState("");
  const refErrore = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errore) refErrore.current?.focus();
  }, [errore]);

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
  // Per l'abbonamento partono solo i pranzi dal lunedi' al venerdi' (il server tiene quelli).
  const pranzi = pronto ? pranziFeriali(piano) : 0;

  // Recapiti diversi da quelli del profilo: si propone di aggiornarlo. Solo se il
  // profilo e' stato letto, altrimenti si rischierebbe di cancellarne le preferenze.
  const diverso = !!profilo && (
    dati.telefono.trim() !== profilo.phone.trim() ||
    dati.comune.trim() !== profilo.comune.trim() ||
    (dati.indirizzo.trim() !== profilo.address.trim() && dati.indirizzo.trim() !== "")
  );

  function aggiorna<K extends keyof DatiRichiesta>(campo: K, valore: DatiRichiesta[K]) {
    setDati((d) => ({ ...d, [campo]: valore }));
  }

  async function invia(e: FormEvent) {
    e.preventDefault();
    if (invio) return;
    setProvato(true);
    const primo = ORDINE_CAMPI_RICHIESTA.find((k) => errori[k]);
    if (primo) {
      document.getElementById(`nr-${primo}`)?.focus();
      return;
    }
    setInvio(true);
    setErrore("");
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
      onInviata(r.id);
    } catch (err) {
      setErrore(messaggioDa(err, "Non riesco a inviare la richiesta. Riprova tra poco."));
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
            {MODALITA.map((m, i) => (
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
              ? "Su questa scheda Matteo compone i tuoi pranzi: scrivi come ti alleni, cosa vuoi ottenere e, se ti segue un nutrizionista, i suoi numeri. "
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
          {abbonamento ? (
            <p className="text-sm">
              Chiedi l’abbonamento mensile: tutti i pranzi dal lunedì al venerdì per un mese, composti da Matteo sulla tua
              scheda, a <strong className="num">{PREZZO_ABBONAMENTO_TESTO}</strong> al mese.
            </p>
          ) : null}
          <dl className="acc-fatti acc-fatti-colonna">
            <div><dt>Servizio</dt><dd>{servizio.nome}</dd></div>
            {abbonamento ? (
              <>
                <div><dt>Prezzo</dt><dd>{PREZZO_ABBONAMENTO_TESTO} al mese</dd></div>
                <div>
                  <dt>Pranzi indicati</dt>
                  <dd>{pronto ? (pranzi ? `${pranzi} su 5, dal compositore` : "Li compone Matteo sulla tua scheda") : "…"}</dd>
                </div>
                <div><dt>La tua scheda</dt><dd>{dati.note.trim() ? "Scritta nelle note" : "Da scrivere nelle note"}</dd></div>
              </>
            ) : (
              <div>
                <dt>Piatti</dt>
                <dd>{pronto ? (piatti ? `${piatti} su 14` : conPiatti ? "Nessuno, per ora" : "Nessuno: non servono") : "…"}</dd>
              </div>
            )}
            {pronto && piatti && !abbonamento ? (
              <div>
                <dt>Macro della settimana</dt>
                <dd className="num text-sm">
                  {Math.round(macroSettimana.kcal).toLocaleString("it-IT")} kcal · P {Math.round(macroSettimana.proteine)} · C {Math.round(macroSettimana.carboidrati)} · G {Math.round(macroSettimana.grassi)}
                </dd>
              </div>
            ) : null}
            <div><dt>Allenamenti</dt><dd>{giorniAllenamento ? `${giorniAllenamento} giorni indicati` : "Non indicati"}</dd></div>
            <div>
              <dt>{dati.modalita === "pickup" ? "Ritiro" : "Consegna"}</dt>
              <dd>{dati.modalita === "pickup" ? "Via del Santuario 214, Pescara" : dati.indirizzo.trim() || "Indirizzo da scrivere"}</dd>
            </div>
            <div>
              <dt>{abbonamento ? "Inizio desiderato" : "Giorno preferito"}</dt>
              <dd>{dati.data ? formattaGiorno(dati.data, limiti.min) : "Da concordare"}</dd>
            </div>
          </dl>

          {nonDisponibili && conPiatti ? (
            <p className="acc-avviso acc-avviso-info text-sm">
              {nonDisponibili === 1
                ? "Un piatto della tua settimana non è disponibile questa settimana."
                : `${nonDisponibili} piatti della tua settimana non sono disponibili questa settimana.`}{" "}
              <Link href="/settimana" className="link">{nonDisponibili === 1 ? "Sostituiscilo" : "Sostituiscili"} nel compositore</Link>, oppure invia lo stesso: Matteo ti propone un’alternativa.
            </p>
          ) : null}

          {conPiatti && pronto && piatti === 0 ? (
            <div id="nr-piano" tabIndex={-1} className={`acc-avviso ${provato ? "acc-avviso-errore" : "acc-avviso-info"}`}>
              La settimana è vuota: per {servizio.nome.toLowerCase()} serve almeno un piatto.{" "}
              <Link href={dati.servizio === "sui-tuoi-macro" ? "/scheda" : "/settimana"} className="link">
                Componila adesso
              </Link>
            </div>
          ) : abbonamento ? (
            <p className="text-sm text-muted">
              Sul sito non si paga niente: Matteo ti ricontatta per concordare inizio, consegna o ritiro e pagamento.
              {pranzi ? " Alleghiamo i pranzi dal lunedì al venerdì che hai composto, come idea di partenza." : ""}
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
        {errore ? <Avviso ref={refErrore} tipo="errore">{errore}</Avviso> : null}
        {provato && Object.keys(errori).length ? (
          <p className="text-sm font-semibold text-[#a3261b]" role="status">
            Controlla i campi segnati: {Object.keys(errori).length === 1 ? "ne manca uno" : `ne mancano ${Object.keys(errori).length}`}.
          </p>
        ) : null}
        <button type="submit" className="btn btn-lime w-full sm:w-auto sm:justify-self-start" disabled={invio}>
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

