"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Reveal from "@/components/Reveal";
import { Chip, Eyebrow, Rise } from "@/components/ui";
import ColonnaGiorno from "@/components/settimana/ColonnaGiorno";
import Griglia from "@/components/settimana/Griglia";
import SelettoreCasella from "@/components/settimana/SelettoreCasella";
import type { ApriCasella, CasellaAperta } from "@/components/settimana/CasellaBottone";
import { decodificaPiano, linkPiano } from "@/lib/condivisione";
import { usePiano } from "@/lib/piano";
import { CASELLE_TOTALI, GIORNI, PASTI } from "@/lib/settimana";
import type { Piano } from "@/lib/settimana";

/* =========================================================================
   LA TUA SETTIMANA — la pagina che tiene insieme la griglia.

   Tre cose che questa pagina fa e che guardandola ferma non si vedono.

   1. NIENTE SI DISEGNA PRIMA DI `pronto`. Il piano vive in localStorage, che sul
      server non esiste: finche' lo store non ha letto davvero, la pagina mostra
      il posto della settimana invece dei numeri. Disegnare zero e poi correggere
      darebbe a React due alberi diversi per lo stesso render - un errore di
      idratazione - e all'utente un lampeggio di settimana vuota sopra una
      settimana piena.

   2. IL LINK NON SOVRASCRIVE DI NASCOSTO. Un `?p=` che arriva su una settimana
      gia' composta chiede il permesso. Chi apre per curiosita' il link di un
      amico non deve perdere il proprio lavoro; chi lo apre apposta perde un
      click. Lo scambio conviene in una direzione sola.

   3. IL FOCUS TORNA DOVE ERA. Il selettore e' modale: alla chiusura il focus
      deve tornare sulla casella cliccata. Il nodo lo conserva questa pagina,
      perche' e' qui che si sa quale bottone e' stato premuto - e la casella
      esiste due volte, nella griglia e nella card del giorno, con una sola
      delle due visibile alla volta.

   Sul link, in piu', una scelta di forma: la decisione NON e' stato. Il piano
   del link si ricava dalla query string a ogni render, e l'unica cosa che vale
   la pena ricordare e' la risposta dell'utente. Con la decisione in stato
   servivano tre setState dentro un effetto - render a cascata, e un ordine di
   effetti da cui dipendeva se la domanda comparisse o no.
   ========================================================================= */

type Avviso = { tono: "ok" | "attenzione"; testo: string };

/**
 * Che fine ha fatto il link. Un solo stato per tutti e quattro i rami, cosi' non
 * puo' esistere la combinazione in cui la settimana e' stata importata ma nessuno
 * se n'e' accorto: e' quella che lasciava il `?p=` nell'indirizzo e faceva
 * ricomparire la domanda al primo aggiornamento della pagina.
 */
type Esito = "attesa" | "chiede" | "importato" | "accettato" | "rifiutato";

const LINK_ROTTO =
  "Questo link non risulta leggibile. Di solito vuol dire che nasce da un menu diverso da quello di questa settimana: il piano esisteva davvero, ma i piatti a cui punta adesso stanno in altre posizioni, e mostrarti quelli sbagliati sarebbe peggio che non mostrarti niente. Chiedi di ricomporre la settimana sul menu di adesso e di rimandarti il link.";

/*
 * RATTOPPO LOCALE a un difetto che NON nasce qui, misurato in Chrome su questa
 * pagina e sulle altre.
 *
 * globals.css azzera gli elementi fuori da ogni @layer:
 *   a      { color: inherit }
 *   button { background: none; color: inherit }
 * mentre .btn-p vive dentro @layer components. Per la cascata dei layer il CSS
 * non stratificato batte QUALUNQUE layer, quindi su <a> e su <button> le due
 * dichiarazioni di .btn-p non arrivano mai. Le conseguenze, misurate:
 *
 *   <Link className="btn btn-p">   fondo ink applicato, colore ereditato ink
 *                                  -> testo inchiostro su inchiostro, 1.00:1,
 *                                     cioe' un bottone primario ILLEGGIBILE
 *   <button className="btn btn-p"> fondo perso, testo ink su carta a 12.66:1:
 *                                  si legge, ma non sembra piu' un primario
 *
 * Nessuna classe puo' rimediare: ho provato anche una utility Tailwind
 * (bg-ink su un <button>) e perde pure lei, perche' anche @layer utilities e'
 * un layer. Lo stile inline e' l'unica dichiarazione che vince, ed e' per questo
 * che sta qui invece che in una classe.
 *
 * La correzione VERA e' una riga in globals.css - i reset dentro @layer base -
 * e vale per le altre otto occorrenze di btn-p sparse fra box, checkout, menu,
 * scheda, chi-e-matteo e come-funziona, che oggi hanno lo stesso guasto. Quel
 * file non e' nel perimetro del Task 10: e' la stessa famiglia della Ruling R18
 * e va alla passata sistematica. Quando sara' fatta, questa costante e le sue
 * tre applicazioni si cancellano in un colpo solo.
 *
 * Il bianco qui e' il caso legale: sta su fondo inchiostro, 14.30:1, esattamente
 * come fa .total-l nella barra scura.
 */
const RATTOPPO_BTN_P = { background: "var(--color-ink)", color: "#fff" } as const;

/** Quante caselle piene porta un piano. Serve per raccontare cosa c'e' nel link. */
function contaCaselle(p: Piano): number {
  let n = 0;
  for (const g of GIORNI) for (const m of PASTI) if (p[g]?.[m]) n += 1;
  return n;
}

export default function SettimanaClient() {
  const { piano, pronto, pasti, macroSettimana, sostituisciPiano, svuota } = usePiano();

  const [aperta, setAperta] = useState<CasellaAperta | null>(null);
  const [esito, setEsito] = useState<Esito>("attesa");
  const [avvisoChiuso, setAvvisoChiuso] = useState(false);
  const [statoLink, setStatoLink] = useState<"pronto" | "copiato" | "manuale">("pronto");
  const [link, setLink] = useState("");
  const [confermaSvuota, setConfermaSvuota] = useState(false);

  const daRestituire = useRef<{ nodo: HTMLElement; chiave: string } | null>(null);
  const titoloArrivo = useRef<HTMLHeadingElement>(null);
  const importato = useRef(false);

  /* ---------- il selettore e il focus ------------------------------------ */

  const apri = useCallback<ApriCasella>((giorno, pasto, nodo) => {
    daRestituire.current = { nodo, chiave: `${giorno}-${pasto}` };
    setAperta({ giorno, pasto });
  }, []);

  const chiudi = useCallback(() => setAperta(null), []);

  useEffect(() => {
    if (aperta) return;
    const bersaglio = daRestituire.current;
    daRestituire.current = null;
    if (!bersaglio) return;

    // Il nodo cliccato di solito e' ancora li'. Se non lo e' - la finestra ha
    // cambiato larghezza e sotto c'e' l'altra vista - si cerca il gemello
    // visibile della stessa casella. offsetParent nullo vuol dire display:none,
    // e focus() su un nodo nascosto manda il focus sul body, cioe' in cima alla
    // pagina: esattamente cio' che questo giro esiste per evitare.
    if (bersaglio.nodo.isConnected && bersaglio.nodo.offsetParent !== null) {
      bersaglio.nodo.focus();
      return;
    }
    const gemelli = document.querySelectorAll<HTMLElement>(`[data-casella="${bersaglio.chiave}"]`);
    for (const g of gemelli) {
      if (g.offsetParent !== null) {
        g.focus();
        return;
      }
    }
  }, [aperta]);

  /* ---------- il piano che arriva da un link ----------------------------- */

  const param = useSearchParams().get("p");
  const dalLink = useMemo(() => (param === null ? null : decodificaPiano(param)), [param]);

  /*
   * La decisione si prende una volta sola, al primo render in cui lo store ha
   * finito di leggere: la settimana locale era vuota QUANDO il link e' arrivato?
   * Dopo l'importazione non lo e' piu', e senza questa memoria la pagina
   * chiederebbe conferma di un'importazione appena fatta.
   *
   * Aggiornare lo stato durante il render e' il modo che React documenta per i
   * valori che dipendono da un ingresso cambiato: la condizione smette subito di
   * valere, il render riparte prima di dipingere e non c'e' nessun giro in piu'
   * sullo schermo. La stessa cosa dentro un effetto sarebbe un render a cascata.
   */
  if (pronto && dalLink !== null && esito === "attesa") {
    setEsito(pasti === 0 ? "importato" : "chiede");
  }

  const chiedeConferma = esito === "chiede";

  const pulisciUrl = useCallback(() => {
    // Via il ?p= appena il link ha fatto il suo lavoro - importato in silenzio o
    // risposto a mano, non fa differenza. Senza, un aggiornamento della pagina
    // (F5, ripristino di sessione, bfcache) troverebbe la settimana non piu'
    // vuota e chiederebbe di sostituirla con quella del link che l'aveva appena
    // riempita: la domanda giusta al momento sbagliato, che offre di buttare via
    // le modifiche fatte nel frattempo.
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  /*
   * Il frame fra "il link e' buono e la settimana e' vuota" e "il piano e'
   * arrivato". Gli effetti girano dopo che il browser ha dipinto, quindi senza
   * questo si vedrebbero insieme, per un istante, lo stato vuoto e l'avviso che
   * dice che la settimana e' stata caricata. `svuotataAMano` tiene fuori il caso
   * opposto: chi ha aperto un link e poi ha svuotato di proposito deve rivedere
   * lo stato vuoto, non una pagina che aspetta un'importazione gia' avvenuta.
   */
  const [svuotataAMano, setSvuotataAMano] = useState(false);
  const importaOra =
    esito === "importato" &&
    !svuotataAMano &&
    dalLink !== null &&
    contaCaselle(dalLink) > 0 &&
    pasti === 0;

  // Settimana vuota e link valido: si carica e basta. Non c'e' niente da
  // proteggere, e una domanda con una risposta sola e' solo un ostacolo.
  useEffect(() => {
    if (esito !== "importato" || dalLink === null || importato.current) return;
    importato.current = true;
    sostituisciPiano(dalLink);
    pulisciUrl();
  }, [esito, dalLink, sostituisciPiano, pulisciUrl]);

  // La domanda va trovata anche col focus, non solo con gli occhi: chi naviga da
  // tastiera altrimenti continuerebbe a riempire caselle senza sapere che c'e'
  // un link in attesa di risposta.
  useEffect(() => {
    if (chiedeConferma) titoloArrivo.current?.focus();
  }, [chiedeConferma]);

  const accetta = () => {
    if (dalLink) sostituisciPiano(dalLink);
    setEsito("accettato");
    pulisciUrl();
  };

  const rifiuta = () => {
    setEsito("rifiutato");
    pulisciUrl();
  };

  /*
   * L'avviso e' una conseguenza, non uno stato: dire cosa e' successo dipende
   * solo da com'e' andata la lettura del link e da cosa ha risposto l'utente.
   */
  let avviso: Avviso | null = null;
  if (!avvisoChiuso) {
    if (param !== null && dalLink === null) avviso = { tono: "attenzione", testo: LINK_ROTTO };
    // Ogni conteggio viene dal piano, non dal link: appena il link ha fatto il suo
    // lavoro il ?p= sparisce dall'indirizzo, e con lui sparirebbe il messaggio se
    // dipendesse da quello.
    else if (esito === "accettato")
      avviso = {
        tono: "ok",
        testo: `Sostituita: adesso vedi la settimana del link, ${pasti} caselle su ${CASELLE_TOTALI}.`,
      };
    else if (esito === "rifiutato")
      avviso = { tono: "ok", testo: "Ho tenuto la tua settimana. Il link non ha cambiato niente." };
    // Non durante il frame dell'importazione (direbbe zero) e non dopo uno
    // svuotamento a mano (direbbe zero un'altra volta, e mentendo).
    else if (esito === "importato" && !importaOra && !svuotataAMano)
      avviso = {
        tono: "ok",
        testo: `Settimana caricata dal link: ${pasti} caselle su ${CASELLE_TOTALI}. Adesso puoi cambiarla come vuoi.`,
      };
  }

  /* ---------- il link da mandare ----------------------------------------- */

  useEffect(() => {
    if (statoLink !== "copiato") return;
    const id = setTimeout(() => setStatoLink("pronto"), 4000);
    return () => clearTimeout(id);
  }, [statoLink]);

  async function condividi() {
    const url = linkPiano(piano, window.location.origin);
    setLink(url);
    try {
      await navigator.clipboard.writeText(url);
      setStatoLink("copiato");
    } catch {
      // Niente appunti: succede fuori da https e con i permessi negati. Il link
      // si mostra e si copia a mano, invece di un bottone che non fa niente.
      setStatoLink("manuale");
    }
  }

  const messaggioLink =
    statoLink === "copiato"
      ? "Link copiato. Incollalo in WhatsApp o in una mail: chi lo apre vede la settimana, senza installare niente."
      : statoLink === "manuale"
        ? "Gli appunti non sono disponibili qui. Copia il link a mano:"
        : pronto && pasti === 0
          ? "Riempi almeno una casella e il link diventa disponibile."
          : "Il link porta dentro la settimana intera. Non serve un account, per nessuno dei due.";

  return (
    <>
      {/* ---------------- testata ---------------- */}
      <section className="pt-[152px] pb-[44px] md:pt-[190px]">
        <div className="wrap">
          <Eyebrow className="mb-[30px]">La tua settimana</Eyebrow>
          <h1 className="h1">
            <Rise i={0}>Sette giorni,</Rise>
            <Rise i={1}>
              <span className="hl">quattordici caselle.</span>
            </Rise>
          </h1>

          <div className="mt-11 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:items-end">
            <div>
              <p className="lead">
                Non &egrave; un carrello, &egrave; una scheda: pranzo e cena di ogni giorno, con i
                macro della giornata sotto la sua colonna. Si riempie una casella alla volta e i
                numeri si muovono mentre scegli.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-2.5">
                <Chip>14 caselle</Chip>
                <Chip accento>Primo, secondo, extra</Chip>
                <Chip>Resta in questo browser</Chip>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn btn-p"
                  style={RATTOPPO_BTN_P}
                  onClick={() => void condividi()}
                  disabled={!pronto || pasti === 0}
                  title={
                    pronto && pasti === 0 ? "Settimana vuota: prima riempi una casella" : undefined
                  }
                >
                  Condividi col tuo nutrizionista
                  <span className="dot" aria-hidden="true">
                    ↗
                  </span>
                </button>
                <Link href="/menu" className="btn btn-s">
                  Aggiungi dal menu
                  <span className="dot" aria-hidden="true">
                    →
                  </span>
                </Link>
              </div>

              {/* aria-live: l'esito della copia cambia lontano dal punto in cui
                  si sta guardando, cioe' il bottone appena premuto. */}
              <p className="note mt-4 leading-relaxed" aria-live="polite">
                {messaggioLink}
              </p>

              {statoLink === "manuale" ? (
                <>
                  <label htmlFor="link-settimana" className="sr-only">
                    Link della settimana
                  </label>
                  <input
                    id="link-settimana"
                    className="field mt-3"
                    readOnly
                    value={link}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                </>
              ) : null}
            </div>
          </div>

          {/* La domanda che salva il lavoro di chi la settimana l'aveva gia' fatta. */}
          {chiedeConferma && dalLink ? (
            <div className="shell mt-10">
              <div className="core p-6 md:p-8">
                <Eyebrow className="mb-6">Un link ti porta una settimana</Eyebrow>
                <h2
                  ref={titoloArrivo}
                  tabIndex={-1}
                  className="h3 max-w-[24ch] text-[26px] outline-none md:text-[32px]"
                >
                  Sostituisco la tua settimana con quella del link?
                </h2>
                <p className="lead mt-5 max-w-[64ch]">
                  Il link porta {contaCaselle(dalLink)} caselle su {CASELLE_TOTALI}. Nel tuo browser
                  ce ne sono gi&agrave; {pasti}: se sostituisci, le tue non tornano indietro. Il
                  link invece resta valido, puoi aprirlo anche dopo.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button type="button" className="btn btn-p" style={RATTOPPO_BTN_P} onClick={accetta}>
                    Sostituisci con quella del link
                    <span className="dot" aria-hidden="true">
                      ↓
                    </span>
                  </button>
                  <button type="button" className="btn btn-s" onClick={rifiuta}>
                    Tieni la mia settimana
                    <span className="dot" aria-hidden="true">
                      ×
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {avviso ? (
            <div className="shell mt-8" role="status">
              <div className="core flex flex-wrap items-start justify-between gap-5 p-5 md:p-6">
                <div className="min-w-0 flex-1">
                  {/* Il tono non e' affidato al colore: c'e' scritto sopra. */}
                  <Chip accento={avviso.tono === "attenzione"} className="mb-3">
                    {avviso.tono === "attenzione" ? "Link non leggibile" : "Fatto"}
                  </Chip>
                  <p className="max-w-[74ch] text-[14px] leading-relaxed">{avviso.testo}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-s btn-sm"
                  onClick={() => setAvvisoChiuso(true)}
                >
                  Ho capito
                  <span className="dot" aria-hidden="true">
                    ✓
                  </span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* ---------------- la settimana ---------------- */}
      <section className="pb-[110px] md:pb-[150px]">
        <div className="wrap">
          {!pronto ? (
            <div className="shell">
              <div className="core grid min-h-[340px] place-items-center p-10">
                <p className="note">Carico la tua settimana...</p>
              </div>
            </div>
          ) : (
            <>
              {pasti === 0 && !importaOra ? (
                <Reveal className="mb-8">
                  <div className="shell">
                    <div className="core p-8 text-center md:p-14">
                      <p className="h3 text-[30px] md:text-[40px]">
                        Quattordici caselle, ancora tutte vuote.
                      </p>
                      <p className="lead mx-auto mt-6">
                        Due strade per riempirle, pi&ugrave; una terza: toccare una casella qui
                        sotto e scegliere a mano.
                      </p>
                      <div className="mt-9 flex flex-wrap justify-center gap-3">
                        <Link href="/menu" className="btn btn-p" style={RATTOPPO_BTN_P}>
                          Sfoglia il menu
                          <span className="dot" aria-hidden="true">
                            →
                          </span>
                        </Link>
                        <Link href="/scheda" className="btn btn-s">
                          Parti dalla tua scheda
                          <span className="dot" aria-hidden="true">
                            ↗
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ) : null}

              {/* Da lg in su la griglia 7x2. Sotto lg non si comprime e non scorre
                  di lato: cambia forma, una card per giorno. L'altra meta' di questo
                  interruttore sta in Griglia.tsx, con il conto delle larghezze. */}
              <Griglia apri={apri} aperta={aperta} />

              <div className="flex flex-col gap-4 lg:hidden">
                {GIORNI.map((g) => (
                  <ColonnaGiorno key={g} giorno={g} apri={apri} aperta={aperta} />
                ))}
              </div>

              {/* ---------------- totali: macro, mai un importo ---------------- */}
              <div className="total on-ink mt-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                <div className="total-l col-span-2 flex flex-col justify-center gap-1.5 sm:col-span-3 lg:col-span-1">
                  <span>La tua settimana</span>
                  <span className="note">Aggiornata mentre scegli</span>
                </div>
                <VoceTotale etichetta="pasti" valore={`${pasti}/${CASELLE_TOTALI}`} />
                <VoceTotale etichetta="kcal" valore={`${Math.round(macroSettimana.kcal)}`} />
                <VoceTotale etichetta="proteine" valore={`${macroSettimana.proteine} g`} />
                <VoceTotale etichetta="carboidrati" valore={`${macroSettimana.carboidrati} g`} />
                <VoceTotale etichetta="grassi" valore={`${macroSettimana.grassi} g`} />
              </div>

              {pasti > 0 ? (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {confermaSvuota ? (
                    <>
                      <p className="text-[14px] font-bold">
                        Svuoto tutte e {CASELLE_TOTALI} le caselle?
                      </p>
                      <button
                        type="button"
                        className="btn btn-s btn-sm"
                        onClick={() => {
                          svuota();
                          setConfermaSvuota(false);
                          setSvuotataAMano(true);
                        }}
                      >
                        S&igrave;, svuota
                        <span className="dot" aria-hidden="true">
                          ✓
                        </span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-s btn-sm"
                        onClick={() => setConfermaSvuota(false)}
                      >
                        Annulla
                        <span className="dot" aria-hidden="true">
                          ×
                        </span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-s btn-sm"
                      onClick={() => setConfermaSvuota(true)}
                    >
                      Svuota la settimana
                      <span className="dot" aria-hidden="true">
                        ×
                      </span>
                    </button>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      {/* Montato per chiave: cambiando casella il pannello riparte pulito, con la
          ricerca azzerata e la scheda dei primi in cima. */}
      {aperta ? (
        <SelettoreCasella
          key={`${aperta.giorno}-${aperta.pasto}`}
          giorno={aperta.giorno}
          pasto={aperta.pasto}
          onChiudi={chiudi}
        />
      ) : null}
    </>
  );
}

/**
 * Una cifra della barra scura. Il lime come testo e' legale in un posto solo,
 * sopra l'inchiostro: 12.61:1. Il colore lo mette .total tramite .total-n, non
 * il markup, cosi' la regola non dipende da chi scrive il JSX.
 */
function VoceTotale({ etichetta, valore }: { etichetta: string; valore: string }) {
  return (
    <div className="total-i">
      <span className="total-n mono block">{valore}</span>
      <span className="ro-l">{etichetta}</span>
    </div>
  );
}
