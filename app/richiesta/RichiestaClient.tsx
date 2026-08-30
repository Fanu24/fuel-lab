"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import Reveal from "@/components/Reveal";
import { Chip, Eyebrow, Rise } from "@/components/ui";
import { usePiano } from "@/lib/piano";
import { CASELLE_TOTALI, GIORNI, NOMI_GIORNO, PASTI } from "@/lib/settimana";
import type { GiornoSettimana, Pasto, Piano } from "@/lib/settimana";
import type { Macros } from "@/lib/types";
import { SERVIZI, getServizio } from "@/lib/servizi";
import type { Servizio, ServizioId } from "@/lib/servizi";
import { componiMessaggio, linkWhatsApp, numeroConfigurato } from "@/lib/whatsapp";
import type { DatiContatto } from "@/lib/whatsapp";

/* =========================================================================
   RICHIESTA — dove il piano composto diventa una conversazione.

   Matteo non vuole pagamenti sul sito: vuole che l'ultimo passo sia una
   conversazione su WhatsApp. Ma se si manda l'utente dritto su WhatsApp
   senza raccogliere niente prima, qui non resta traccia di nulla: WhatsApp
   diventerebbe l'unica casella, e la dashboard che il committente vuole
   vedere piu' avanti (Fase B) sarebbe vuota per costruzione. Per questo
   l'ordine e' fisso: prima un form breve, POI si apre WhatsApp col
   messaggio gia' scritto.

   In questa fase (Fase A) non esiste ancora un database: questo componente
   compone il messaggio e apre WhatsApp, e lo dice in pagina. Non chiama
   nessuna funzione di salvataggio perche' non ne esiste ancora una — quella
   arriva in Fase B.

   Il numero WhatsApp mancante e' il CASO NORMALE in questa fase, non un
   caso limite: lib/whatsapp.ts degrada a `null` quando NEXT_PUBLIC_WHATSAPP
   non e' configurata, e questa pagina rispetta quel contratto disabilitando
   il bottone con una spiegazione scritta, mai un link mezzo vuoto verso
   "wa.me/" senza numero.

   lib/whatsapp.ts espone due funzioni separate — messaggioServizio() e
   messaggioPiano() — ma nessuna delle due sa dell'altra. Comporle e'
   compito di componiMessaggio(), che vive anch'essa in lib/whatsapp.ts:
   unisce i due testi in un messaggio con un saluto solo, non due messaggi
   incollati. Questa pagina si limita a raccogliere i dati del form e a
   passarli a quella funzione.
   ========================================================================= */

/** I dati che raccoglie questo form: stessa forma di DatiContatto in
 *  lib/whatsapp.ts, che componiMessaggio() usa per comporre il messaggio.
 *  Alias e non un'interfaccia propria, cosi' i due non possono divergere. */
type Modulo = DatiContatto;

type ChiaveModulo = keyof Modulo;

const MODULO_VUOTO: Modulo = { nome: "", telefono: "", comune: "", note: "" };

type Errori = Partial<Record<ChiaveModulo, string>>;

/**
 * Messaggi in prima persona: dicono cosa manca e perche' serve. Il nome basta
 * da solo (niente cognome obbligatorio: e' un form breve, non un'anagrafica),
 * quello che conta e' che Matteo sappia a chi sta rispondendo su WhatsApp.
 */
function valida(m: Modulo): Errori {
  const e: Errori = {};

  if (!m.nome.trim()) e.nome = "Serve un nome: è così che Matteo sa a chi sta scrivendo.";

  const cifre = m.telefono.replace(/\D/g, "");
  if (!cifre) e.telefono = "Serve un numero: è il punto da cui parte la chat su WhatsApp.";
  else if (cifre.length < 9) e.telefono = "Il numero sembra troppo corto.";

  if (m.comune.trim().length < 2) {
    e.comune = "Serve il comune: aiuta Matteo a capire da dove scrivi.";
  }

  return e;
}

function elenco(voci: string[]): string {
  if (voci.length <= 1) return voci[0] ?? "";
  return `${voci.slice(0, -1).join(", ")} e ${voci[voci.length - 1]}`;
}

function maiuscola(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** I due servizi di meal prep hanno bisogno di una settimana composta prima di
 *  scrivere a Matteo: e' quello che il messaggio racconta. L'home cooking no:
 *  vende il tempo di Matteo dentro casa tua, non una settimana di schiscette. */
const RICHIEDE_PIANO: Record<ServizioId, boolean> = {
  "menu-settimana": true,
  "sui-tuoi-macro": true,
  "home-cooking": false,
};

/** Legge ?servizio= dalla query string, un id valido alla volta: qualunque
 *  altro valore (assente, sbagliato, di un servizio che non esiste piu')
 *  ricade sul servizio di ingresso piu' comune invece di rompere la pagina. */
function servizioDaParam(param: string | null): ServizioId {
  if (param === "sui-tuoi-macro") return param;
  if (param === "home-cooking") return param;
  return "menu-settimana";
}

/* =========================================================================
   pezzi di pagina
   ========================================================================= */

function Campo({
  id,
  etichetta,
  valore,
  onChange,
  onBlur,
  errore,
  tipo = "text",
  autoComplete,
  placeholder,
  inputMode,
  className = "",
}: {
  id: ChiaveModulo;
  etichetta: string;
  valore: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  errore?: string;
  tipo?: string;
  autoComplete?: string;
  placeholder?: string;
  inputMode?: "text" | "tel";
  className?: string;
}) {
  const idCampo = `richiesta-${id}`;
  const idErr = `${idCampo}-errore`;

  return (
    <div className={className}>
      <label htmlFor={idCampo} className="note mb-[9px] block">
        {etichetta}
      </label>
      <input
        id={idCampo}
        name={id}
        type={tipo}
        value={valore}
        onChange={(ev) => onChange(ev.target.value)}
        onBlur={onBlur}
        className={`field ${errore ? "field-err" : ""}`}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-invalid={errore ? true : undefined}
        aria-describedby={errore ? idErr : undefined}
      />
      {errore ? (
        // #c02626 su card = 5.92:1, su paper = 5.24:1: passa AA come testo,
        // non solo come anello del campo. Mai #ff9d9d: e' tarato per fondo
        // scuro, su chiaro cade a 1.76:1 ed e' illeggibile.
        <p id={idErr} className="mt-[9px] text-[12.5px] leading-relaxed" style={{ color: "#c02626" }}>
          {errore}
        </p>
      ) : null}
    </div>
  );
}

/** Selettore del servizio: tre pillole, sempre visibili. Restano visibili
 *  anche nello stato "settimana vuota" cosi' chi cerca l'home cooking (che
 *  non ha bisogno di nessuna settimana) non resta bloccato li'. */
function SelettoreServizio({
  scelto,
  onScegli,
}: {
  scelto: ServizioId;
  onScegli: (id: ServizioId) => void;
}) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="sr-only">Per quale servizio scrivi a Matteo</legend>
      <div className="flex flex-wrap gap-[10px]">
        {SERVIZI.map((s) => {
          const sel = s.id === scelto;
          return (
            <label key={s.id} className="cursor-pointer">
              <input
                type="radio"
                name="servizio"
                value={s.id}
                checked={sel}
                onChange={() => onScegli(s.id)}
                className="peer sr-only"
              />
              <span
                className="inline-flex items-center rounded-full px-[18px] py-[11px] text-[13.5px] font-bold transition-colors duration-300 peer-focus-visible:[outline:2px_solid_var(--color-ink)] peer-focus-visible:[outline-offset:3px]"
                style={{
                  background: sel ? "var(--color-ink)" : "var(--color-card)",
                  color: sel ? "#fff" : "var(--color-ink)",
                  boxShadow: sel ? "none" : "inset 0 0 0 1.5px var(--hair)",
                }}
              >
                {s.nome}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Il riepilogo della settimana: quali giorni hanno almeno un pasto scelto e
 *  i macro totali. Niente nomi di piatto qui — quelli li racconta gia' per
 *  esteso il messaggio composto piu' sotto; questa card serve a controllare
 *  a colpo d'occhio che la settimana sia quella giusta prima di mandarla. */
function RiepilogoSettimana({
  piano,
  pasti,
  macro,
}: {
  piano: Piano;
  pasti: number;
  macro: Macros;
}) {
  const giorniPieni = GIORNI.filter((g) => PASTI.some((m) => piano[g]?.[m]));

  return (
    <div className="shell">
      <div className="core p-5 md:p-[26px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="eyebrow">
            <b aria-hidden="true" />
            La tua settimana
          </h2>
          <Chip accento>
            {pasti}/{CASELLE_TOTALI} caselle
          </Chip>
        </div>

        <ul className="mt-4 flex flex-col gap-2 md:mt-[20px] md:gap-[10px]">
          {giorniPieni.map((g: GiornoSettimana) => {
            const scelti = PASTI.filter((m: Pasto) => piano[g]?.[m]);
            return (
              <li key={g} className="flex items-center justify-between gap-3 text-[13.5px]">
                <span className="text-ink">{NOMI_GIORNO[g]}</span>
                <span className="mono text-muted">{scelti.map(maiuscola).join(" + ")}</span>
              </li>
            );
          })}
        </ul>

        <div
          className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 md:mt-[20px] md:gap-[14px] md:pt-[18px]"
          style={{ borderColor: "var(--hair-soft)" }}
        >
          <VoceMacro etichetta="kcal" valore={`${Math.round(macro.kcal)}`} />
          <VoceMacro etichetta="proteine" valore={`${macro.proteine} g`} />
          <VoceMacro etichetta="carboidrati" valore={`${macro.carboidrati} g`} />
          <VoceMacro etichetta="grassi" valore={`${macro.grassi} g`} />
        </div>
      </div>
    </div>
  );
}

function VoceMacro({ etichetta, valore }: { etichetta: string; valore: string }) {
  return (
    <div>
      <span className="mono block text-[19px] text-ink">{valore}</span>
      <span className="note mt-[4px] block">{etichetta}</span>
    </div>
  );
}

/** Per l'home cooking non c'e' nessuna settimana da riepilogare: qui sta
 *  solo il promemoria di quale servizio si sta scrivendo. Niente prezzo:
 *  ne' la soglia dei due servizi a meal prep ne' il "su preventivo"
 *  dell'home cooking hanno posto in questa pagina. */
function RiepilogoServizio({ servizio }: { servizio: Servizio }) {
  return (
    <div className="shell">
      <div className="core p-5 md:p-[26px]">
        <h2 className="eyebrow">
          <b aria-hidden="true" />
          Il tuo servizio
        </h2>
        <p className="h3 mt-3 md:mt-[16px]" style={{ fontSize: 25 }}>
          {servizio.nome}
        </p>
        <p className="mt-2.5 text-[14px] leading-[1.5] text-muted md:mt-[12px] md:leading-relaxed">{servizio.descrizione}</p>
      </div>
    </div>
  );
}

/** Arrivare qui con la settimana vuota, per un servizio che ne ha bisogno,
 *  e' un vicolo cieco se davanti c'e' solo un form da compilare a vuoto.
 *  Qui c'e' l'uscita: due strade per riempirla, piu' la terza — cambiare
 *  servizio, il selettore sopra a questo blocco resta a portata di mano. */
function ServizioSenzaPiano({ servizio }: { servizio: Servizio }) {
  return (
    <Reveal>
      <div className="shell">
        <div className="core p-6 text-center md:p-[46px]">
          <h2 className="h2 max-w-[20ch] mx-auto" style={{ fontSize: "min(48px, 8vw)" }}>
            La tua settimana &egrave; ancora vuota.
          </h2>
          <p className="lead mx-auto mt-3.5 md:mt-5">
            Per {servizio.nome.toLowerCase()} Matteo ha bisogno di una settimana composta: &egrave;
            quello che il messaggio gli racconta. Componila e poi torna qui, ci vogliono due
            minuti.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5 md:mt-9 md:gap-3">
            <Link href="/menu" className="btn btn-p">
              Sfoglia il menu
              <span className="dot" aria-hidden="true">
                &rarr;
              </span>
            </Link>
            <Link href="/settimana" className="btn btn-s">
              Vai alla tua settimana
              <span className="dot" aria-hidden="true">
                &#8599;
              </span>
            </Link>
          </div>
          <p className="note mt-5 md:mt-8">
            Cerchi invece l&apos;home cooking? Scegli quel servizio qui sopra: non serve nessuna
            settimana.
          </p>
        </div>
      </div>
    </Reveal>
  );
}

/** Scheletro mostrato finche' il piano non e' stato riletto da localStorage. */
function Scheletro() {
  return (
    <section className="fascia fascia-guscio">
      <div className="wrap">
        <p className="sr-only" role="status">
          Sto rileggendo la tua settimana.
        </p>
        <div aria-hidden="true" className="shell">
          <div className="core relative overflow-hidden p-6 md:p-[30px]">
            {[92, 68, 80, 54].map((w, i) => (
              <span
                key={i}
                className="mb-[18px] block h-[13px] rounded-full last:mb-0"
                style={{ width: `${w}%`, background: "rgba(201,224,205,.08)" }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   pagina
   ========================================================================= */

export default function RichiestaClient() {
  const servizioIniziale = servizioDaParam(useSearchParams().get("servizio"));
  const { piano, pronto, pasti, macroSettimana } = usePiano();

  const [servizioId, setServizioId] = useState<ServizioId>(servizioIniziale);
  const [modulo, setModulo] = useState<Modulo>(MODULO_VUOTO);
  const [toccati, setToccati] = useState<Partial<Record<ChiaveModulo, boolean>>>({});
  const [cliccato, setCliccato] = useState(false);

  const servizio = getServizio(servizioId);
  const richiedePiano = RICHIEDE_PIANO[servizioId];
  const bisognoDiPiano = richiedePiano && pasti === 0;

  const errori = useMemo(() => valida(modulo), [modulo]);
  const valido = Object.keys(errori).length === 0;
  const mancano = useMemo(() => {
    const v: string[] = [];
    if (errori.nome) v.push("il nome");
    if (errori.telefono) v.push("il telefono");
    if (errori.comune) v.push("il comune");
    return v;
  }, [errori]);
  const iniziato = Object.keys(toccati).length > 0;

  const testo = useMemo(
    () =>
      componiMessaggio({
        servizioId: servizio.id,
        richiedePiano,
        piano,
        macro: macroSettimana,
        contatto: modulo,
      }),
    [servizio, richiedePiano, piano, macroSettimana, modulo],
  );
  const href = linkWhatsApp(testo);
  const configurato = numeroConfigurato();

  function aggiorna(k: ChiaveModulo, v: string) {
    setModulo((m) => ({ ...m, [k]: v }));
    setCliccato(false);
  }
  function segnaToccato(k: ChiaveModulo) {
    setToccati((t) => ({ ...t, [k]: true }));
  }
  function mostra(k: ChiaveModulo): string | undefined {
    return toccati[k] ? errori[k] : undefined;
  }
  function sceglieServizio(id: ServizioId) {
    setServizioId(id);
    setCliccato(false);
  }

  let statoTesto: string;
  if (!configurato) {
    statoTesto =
      "Il numero WhatsApp di Matteo non è ancora attivo: il bottone si accende da solo appena lo sarà. Intanto quello che scrivi qui resta solo su questo browser.";
  } else if (!valido) {
    statoTesto = iniziato
      ? `Manca ancora ${elenco(mancano)}.`
      : "Compila nome, telefono e comune: il bottone si accende da solo.";
  } else if (cliccato) {
    statoTesto =
      "Si è aperta una scheda di WhatsApp col messaggio già scritto: da lì lo mandi tu, quando vuoi.";
  } else {
    statoTesto =
      "Tutto pronto. Qui non viene salvato nulla: alla conferma si apre WhatsApp col messaggio già scritto.";
  }

  return (
    <>
      {/* ---------------------------------------------------------- testata */}
      {/* Testata sulla carta - qui ci sono le chip nude, che sono guscio - e
          modulo sul guscio: chi arriva vede subito dove finisce la spiegazione
          e comincia la cosa da compilare. */}
      <section className="fascia fascia-t fascia-carta">
        <div className="wrap">
          <Eyebrow className="mb-3 md:mb-[18px]">Scrivi a Matteo</Eyebrow>
          <h1 className="h1 max-w-[19ch]">
            <Rise i={0}>Due minuti di form,</Rise>
            <Rise i={1}>
              <span className="hl hl-on"><i className="hl-bar" aria-hidden="true" /><span className="hl-tx">poi parli con Matteo.</span></span>
            </Rise>
          </h1>
          <p className="lead mt-4 md:mt-7">
            Nome, telefono e comune: cos&igrave; Matteo sa chi gli scrive. Poi si apre WhatsApp col
            messaggio gi&agrave; pronto, settimana compresa se ne hai gi&agrave; composta una.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2 md:mt-7 md:gap-2.5">
            <Chip>Form breve</Chip>
            <Chip accento>Niente salvato, per ora</Chip>
            <Chip>Poi parli tu con Matteo</Chip>
          </div>

          <div
            className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[var(--shell)] border px-[18px] py-[14px] md:mt-[32px] md:px-[22px] md:py-[16px]"
            style={{ borderColor: "var(--hair)", background: "rgba(223,255,62,.06)" }}
          >
            <Chip accento>Fase A</Chip>
            <p className="max-w-[780px] text-[13.5px] leading-relaxed text-ink">
              In questa fase non esiste ancora un database: nessun dato di questo modulo viene
              registrato da nessuna parte. Alla conferma si apre WhatsApp col messaggio gi&agrave;
              scritto, ed &egrave; l&igrave; che comincia la conversazione vera con Matteo.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- corpo, per stato */}
      {!pronto ? (
        <Scheletro />
      ) : (
        <section className="fascia fascia-guscio">
          <div className="wrap">
            <Reveal>
              <div className="shell">
                <div className="core p-5 md:p-[32px]">
                  <h2 className="eyebrow mb-4 md:mb-[22px]">
                    <b aria-hidden="true" />
                    Per quale servizio scrivi
                  </h2>
                  <SelettoreServizio scelto={servizioId} onScegli={sceglieServizio} />
                </div>
              </div>
            </Reveal>

            {bisognoDiPiano ? (
              <div className="mt-4 md:mt-[22px]">
                <ServizioSenzaPiano servizio={servizio} />
              </div>
            ) : (
              <div className="mt-4 grid items-start gap-5 md:mt-[22px] lg:grid-cols-[1fr_388px] lg:gap-[42px]">
                {/* ------------------------------------------------ i dati */}
                <Reveal delay={80}>
                  <div className="shell">
                    <div className="core p-5 md:p-[32px]">
                      <h2 className="eyebrow mb-4 md:mb-[26px]">
                        <b aria-hidden="true" />I tuoi dati
                      </h2>

                      <div className="grid gap-4 sm:grid-cols-2 md:gap-[18px]">
                        <Campo
                          id="nome"
                          etichetta="Nome"
                          valore={modulo.nome}
                          onChange={(v) => aggiorna("nome", v)}
                          onBlur={() => segnaToccato("nome")}
                          errore={mostra("nome")}
                          autoComplete="name"
                          placeholder="Anna Rossi"
                          className="sm:col-span-2"
                        />
                        <Campo
                          id="telefono"
                          etichetta="Telefono"
                          tipo="tel"
                          inputMode="tel"
                          valore={modulo.telefono}
                          onChange={(v) => aggiorna("telefono", v)}
                          onBlur={() => segnaToccato("telefono")}
                          errore={mostra("telefono")}
                          autoComplete="tel"
                          placeholder="333 123 4567"
                        />
                        <Campo
                          id="comune"
                          etichetta="Comune"
                          valore={modulo.comune}
                          onChange={(v) => aggiorna("comune", v)}
                          onBlur={() => segnaToccato("comune")}
                          errore={mostra("comune")}
                          autoComplete="address-level2"
                          placeholder="Pescara"
                        />
                      </div>

                      <div className="mt-[20px]">
                        <label htmlFor="richiesta-note" className="note mb-[9px] block">
                          Note per Matteo (facoltativo)
                        </label>
                        <textarea
                          id="richiesta-note"
                          name="note"
                          value={modulo.note}
                          onChange={(ev) => aggiorna("note", ev.target.value)}
                          className="field"
                          style={{ borderRadius: 18, minHeight: 92, resize: "vertical" }}
                          placeholder="Allergie, orari preferiti, o quello che serve sapere a Matteo"
                          maxLength={240}
                        />
                      </div>
                    </div>
                  </div>
                </Reveal>

                {/* ------------------------------------------- riepilogo */}
                <aside className="lg:sticky lg:top-[112px]">
                  {richiedePiano ? (
                    <RiepilogoSettimana piano={piano} pasti={pasti} macro={macroSettimana} />
                  ) : (
                    <RiepilogoServizio servizio={servizio} />
                  )}

                  <div className="shell mt-[14px]">
                    <div className="core p-[18px] md:p-[20px]">
                      <p className="note mb-[10px]">Cosa legge Matteo</p>
                      <p className="mono text-[12px] leading-relaxed whitespace-pre-wrap text-ink">
                        {testo}
                      </p>
                    </div>
                  </div>

                  <div className="mt-[18px]">
                    {href && valido ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-p w-full justify-between"
                        aria-describedby="stato-richiesta"
                        onClick={() => setCliccato(true)}
                      >
                        Apri WhatsApp
                        <span className="dot" aria-hidden="true">
                          &#8599;
                        </span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-p w-full justify-between"
                        disabled
                        aria-describedby="stato-richiesta"
                      >
                        Apri WhatsApp
                        <span className="dot" aria-hidden="true">
                          &#8599;
                        </span>
                      </button>
                    )}

                    <p
                      id="stato-richiesta"
                      role="status"
                      aria-live="polite"
                      className="mt-[14px] text-[12.5px] leading-relaxed text-muted"
                    >
                      {statoTesto}
                    </p>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
