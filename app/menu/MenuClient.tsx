"use client";

import Link from "next/link";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import ElementCard from "@/components/ElementCard";
import { MacroSplit } from "@/components/MacroBar";
import Reveal from "@/components/Reveal";
import Ticker from "@/components/Ticker";
import { Chip, Eyebrow, Rise, SectionHead } from "@/components/ui";
import { EXTRA, PRIMI, SECONDI, elementoImg, getElemento } from "@/lib/catalogo";
import type { Categoria, Elemento } from "@/lib/catalogo";
import { usePiano } from "@/lib/piano";
import { TAGS, type Giorno, type Tag } from "@/lib/types";

type FiltroCategoria = Categoria | "tutti";
type FiltroGiorno = Giorno | "tutti";
type Ordine = "consigliati" | "proteine" | "kcal-su" | "kcal-giu";

const CATEGORIE: { id: FiltroCategoria; label: string }[] = [
  { id: "tutti", label: "Tutti" },
  { id: "primo", label: "Primi" },
  { id: "secondo", label: "Secondi" },
];

const GIORNI_COTTURA: { id: FiltroGiorno; label: string }[] = [
  { id: "tutti", label: "Tutti" },
  { id: "lunedi", label: "Lunedì" },
  { id: "giovedi", label: "Giovedì" },
];

const ORDINI: { id: Ordine; label: string }[] = [
  { id: "consigliati", label: "Consigliati" },
  { id: "proteine", label: "Più proteine" },
  { id: "kcal-su", label: "Meno calorie" },
  { id: "kcal-giu", label: "Più calorie" },
];

const RITMO = ["Cotto il lunedì", "Consegnato il martedì", "Cotto il giovedì", "Consegnato il venerdì"];

/**
 * Leggera rotazione alternata sulle schede, ciclo di quattro: la griglia non
 * sembra un listino stampato. Solo da xl in su: sotto, la rotazione si
 * mangia il gutter fra colonne strette.
 */
const CICLO = 4;
const INCLINA = ["", "xl:rotate-[1deg]", "", "xl:rotate-[-1deg]"];

/**
 * La foto della testata e' un elemento vero del catalogo, non uno stock
 * generico: la pagina promette "quello che leggi qui e' quello che trovi nel
 * box" e non puo' aprirsi con una foto che nel box non c'e'. Tipizzata come
 * opzionale di proposito, cosi' un catalogo senza questo id non manda in
 * errore la testata.
 */
const COPERTINA: Elemento | undefined = getElemento("secondo-pollo-piastra") ?? SECONDI[0] ?? PRIMI[0];

/* ------------------------------------------------------------------ filtri */

function Pill({
  attivo,
  onClick,
  multi = false,
  children,
}: {
  attivo: boolean;
  onClick: () => void;
  /** i tag sono a interruttore: il rombo dice "ne puoi accendere piu di uno" */
  multi?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={attivo}
      data-on={attivo ? "true" : "false"}
      style={{ fontVariationSettings: '"wdth" 110, "wght" 700' }}
      className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-[color:var(--hair-soft)] bg-[rgba(201,224,205,.045)] px-[15px] py-[7px] text-[11px] tracking-[.1em] whitespace-nowrap text-ink uppercase transition-[color,background-color,border-color,transform] duration-400 ease-[var(--e-out)] hover:border-[color:var(--hair)] hover:bg-[rgba(223,255,62,.11)] hover:text-ink active:scale-[.96] data-[on=true]:border-transparent data-[on=true]:bg-lime data-[on=true]:text-ink data-[on=true]:hover:bg-white data-[on=true]:hover:text-ink"
    >
      {/* Il rombo ha una transizione PROPRIA: transition-timing-function non si eredita,
          quindi senza questa easing esplicita il quadratino tornava alla curva di default
          di Tailwind mentre la pill sotto viaggiava su --e-out. Si vedeva. */}
      {multi ? (
        <i
          aria-hidden="true"
          className="h-[7px] w-[7px] rotate-45 border border-current transition-colors duration-400 ease-[var(--e-out)] group-data-[on=true]:bg-current"
        />
      ) : null}
      {children}
    </button>
  );
}

function Gruppo({ etichetta, children }: { etichetta: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={etichetta} className="flex items-center gap-3">
      {/* aria-hidden: il gruppo porta gia' questo stesso testo come aria-label, senza
          la marcatura uno screen reader leggerebbe l'etichetta due volte di fila. */}
      <span aria-hidden="true" className="note shrink-0 text-[9.5px]">
        {etichetta}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

function Separatore() {
  return <span aria-hidden="true" className="hidden h-6 w-px bg-[var(--hair-soft)] xl:block" />;
}

/**
 * Sintesi nella barra filtri, sempre in due numeri: primi e secondi non si
 * sommano in un unico totale, perche' e' esattamente la distinzione che la
 * pagina deve mantenere visibile. Compatto sotto md, dove non c'e' spazio
 * per la coppia di conteggi.
 */
function Riepilogo({
  primi,
  secondi,
  compatto = false,
  className = "",
}: {
  primi: number;
  secondi: number;
  compatto?: boolean;
  className?: string;
}) {
  return (
    <p
      aria-live="polite"
      style={{ fontVariationSettings: '"wdth" 84' }}
      className={`font-mono text-[10.5px] tracking-[.14em] whitespace-nowrap text-muted uppercase ${className}`}
    >
      {compatto ? (
        <>
          <b className="text-[15px] font-normal text-ink">{primi + secondi}</b> su{" "}
          {PRIMI.length + SECONDI.length}
        </>
      ) : (
        <>
          <b className="text-[15px] font-normal text-ink">{primi}</b> primi su {PRIMI.length}
          {/* niente opacity qui: su muted valeva 2.10:1 su bianco, misurato nel
              browser. Il separatore e' gia' leggero di suo a 10.5px. */}
          <span aria-hidden="true" className="mx-2">
            &middot;
          </span>
          <b className="text-[15px] font-normal text-ink">{secondi}</b> secondi su {SECONDI.length}
        </>
      )}
    </p>
  );
}

/** Il numero deve coincidere sempre con le schede a video: e' l'unica prova che i filtri funzionano. */
function Contatore({
  n,
  tot,
  etichetta,
  className = "",
}: {
  n: number;
  tot: number;
  etichetta: string;
  className?: string;
}) {
  return (
    <p
      style={{ fontVariationSettings: '"wdth" 84' }}
      className={`font-mono text-[10.5px] tracking-[.14em] whitespace-nowrap text-muted uppercase ${className}`}
    >
      <b className="text-[15px] font-normal text-ink">{n}</b> {etichetta} su {tot}
    </p>
  );
}

/**
 * Riga per la sezione che i filtri hanno svuotato (non la categoria: quella
 * smonta la sezione del tutto, un caso diverso e gia' corretto). Senza
 * questa riga la sezione sparisce in silenzio quando l'altra ha ancora
 * risultati - l'utente vede meta pagina scomparire e non sa se ha filtrato
 * troppo o se il sito e' rotto. Stessa spiegazione dello stato vuoto
 * generale, in scala ridotta: non serve un blocco grande, basta la frase.
 */
function SezioneVuota({ etichetta, onAzzera }: { etichetta: string; onAzzera: () => void }) {
  return (
    <p className="lead !max-w-none">
      Con questi filtri non ci sono {etichetta}.{" "}
      <button
        type="button"
        onClick={onAzzera}
        className="text-ink underline decoration-[var(--hair)] underline-offset-4 transition-colors duration-300 hover:decoration-current"
      >
        Azzera i filtri
      </button>
    </p>
  );
}

/* ------------------------------------------------------------------ dati */

function filtra(lista: Elemento[], giorno: FiltroGiorno, tag: Tag[]): Elemento[] {
  // OR dentro i tag: chi accende Carne e Pesce vuole vedere entrambi, non
  // l'insieme vuoto degli elementi che sono carne E pesce insieme.
  return lista.filter(
    (e) => (giorno === "tutti" || e.giorno === giorno) && (tag.length === 0 || tag.some((t) => e.tag.includes(t))),
  );
}

function ordina(lista: Elemento[], ordine: Ordine): Elemento[] {
  if (ordine === "consigliati") return lista;
  const copia = lista.slice(); // mai in place: PRIMI e SECONDI sono condivisi con tutto il sito
  copia.sort((a, b) => {
    // Il secondo criterio non e' decorativo: fra due elementi da 52 g di
    // proteine chi sta in definizione vuole vedere prima quello che costa
    // meno calorie.
    if (ordine === "proteine") return b.proteine - a.proteine || a.kcal - b.kcal;
    if (ordine === "kcal-su") return a.kcal - b.kcal || b.proteine - a.proteine;
    return b.kcal - a.kcal || b.proteine - a.proteine;
  });
  return copia;
}

/* ------------------------------------------------------------------ pagina */

export default function MenuClient() {
  const [categoria, setCategoria] = useState<FiltroCategoria>("tutti");
  const [giorno, setGiorno] = useState<FiltroGiorno>("tutti");
  const [tag, setTag] = useState<Tag[]>([]);
  const [ordine, setOrdine] = useState<Ordine>("consigliati");
  const [pannello, setPannello] = useState(false);
  const { pronto, pasti } = usePiano();

  // AND fra i gruppi di filtro (categoria, giorno, tag), OR dentro il gruppo
  // tag. La categoria non filtra dentro una lista unica: decide quale delle
  // due sezioni resta montata, perche' primi e secondi sono gia' due
  // cataloghi separati a monte. "Attiva" e' la stessa domanda posta due
  // volte - qui per azzerare la lista, sotto nel JSX per decidere se la
  // sezione compare - cosi' non puo' rispondere in modo diverso nei due posti.
  const primiAttiva = categoria !== "secondo";
  const secondiAttiva = categoria !== "primo";

  const primiVisibili = useMemo(() => {
    if (!primiAttiva) return [];
    return ordina(filtra(PRIMI, giorno, tag), ordine);
  }, [primiAttiva, giorno, tag, ordine]);

  const secondiVisibili = useMemo(() => {
    if (!secondiAttiva) return [];
    return ordina(filtra(SECONDI, giorno, tag), ordine);
  }, [secondiAttiva, giorno, tag, ordine]);

  const totaleVisibile = primiVisibili.length + secondiVisibili.length;

  // L'ordinamento conta come filtro attivo: se ho spostato qualcosa, "Azzera"
  // deve riportarmi al catalogo com'era, non a meta strada.
  const attivi =
    (categoria !== "tutti" ? 1 : 0) + (giorno !== "tutti" ? 1 : 0) + tag.length + (ordine !== "consigliati" ? 1 : 0);

  function azzera() {
    setCategoria("tutti");
    setGiorno("tutti");
    setTag([]);
    setOrdine("consigliati");
  }

  function commutaTag(t: Tag) {
    setTag((v) => (v.includes(t) ? v.filter((x) => x !== t) : [...v, t]));
  }

  return (
    <>
      {/* ---------------------------------------------------------- testata */}
      <section className="pt-[168px] pb-[92px]">
        <div className="wrap">
          <div className="grid items-center gap-16 lg:grid-cols-[1fr_366px]">
            <div>
              <Eyebrow className="mb-[30px]">Il catalogo della settimana</Eyebrow>
              <h1 className="h1">
                {/* I numeri li conta il catalogo: cambia ogni settimana e una
                    testata scritta a mano prima o poi mentirebbe. */}
                <Rise i={0}>
                  {PRIMI.length} primi, {SECONDI.length} secondi,
                </Rise>
                <Rise i={1}>
                  <span className="hl hl-on"><i className="hl-bar" aria-hidden="true" /><span className="hl-tx">componi il pasto.</span></span>
                </Rise>
              </h1>
              <p className="lead mt-9">
                Matteo cucina il luned&igrave; e il gioved&igrave; e consegna il giorno dopo. Scegli un primo, un
                secondo e gli extra che ti servono: quello che leggi qui &egrave; quello che trovi nel
                box, senza surgelati e senza scorte di magazzino.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-2.5">
                <Chip accento>Porzioni pesate</Chip>
                <Chip>Macro dichiarati</Chip>
                <Chip>Consegna a Pescara</Chip>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[366px] lg:mx-0">
              <div
                className="shell transition-transform duration-700 md:rotate-[-2.4deg] md:hover:rotate-0"
                style={{ transitionTimingFunction: "var(--e-over)" }}
              >
                <figure className="core aspect-[4/5] bg-tray">
                  {COPERTINA ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={elementoImg(COPERTINA, 760)}
                      alt={`${COPERTINA.nome}, porzione pesata da ${COPERTINA.grammi} grammi`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </figure>
              </div>
              <div
                className="absolute -bottom-7 -left-6 hidden rotate-[4.5deg] rounded-[18px] bg-lime px-5 py-4 text-ink shadow-[0_36px_62px_-36px_rgba(2,11,7,.95)] sm:block"
                aria-hidden="true"
              >
                <p className="font-disp text-[30px] leading-none uppercase">Lun / Gio</p>
                <p className="mt-1.5 font-mono text-[9px] tracking-[.2em] uppercase">
                  le due cotture
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Ticker
        parole={["Cotto il lunedì", "Cotto il giovedì", "Mai surgelato", "Pescara e provincia"]}
        durata={38}
      />

      {/* ------------------------------------------- filtri + catalogo
          Barra e griglie stanno nella STESSA sezione: e' l'unico modo perche la
          sticky resti agganciata per tutta la lettura del catalogo.           */}
      <section className="pt-[86px] pb-[110px]">
        <div className="wrap">
          <h2 className="sr-only">Filtra il catalogo</h2>

          {/* z-30: sotto al pannello a schermo pieno del Nav (z-50) e sotto alla barra
              del piano (z-40), che deve poter scavalcare i filtri su schermi corti. */}
          <div className="shell sticky top-[100px] z-30">
            <div className="core p-3 sm:p-4">
              {/* Sotto md la barra intera mangerebbe mezzo schermo: resta una riga
                  compatta e i gruppi si aprono a richiesta. */}
              <div className="flex items-center justify-between gap-3 md:hidden">
                <button
                  type="button"
                  onClick={() => setPannello((p) => !p)}
                  aria-expanded={pannello}
                  aria-controls="pannello-filtri"
                  className="btn btn-s btn-sm"
                >
                  Filtri
                  {attivi > 0 ? (
                    <span
                      style={{ fontVariationSettings: '"wdth" 84' }}
                      className="font-mono text-[11px] text-ink"
                    >
                      {attivi}
                    </span>
                  ) : null}
                  <span className="dot" aria-hidden="true">
                    {pannello ? "−" : "+"}
                  </span>
                </button>
                <Riepilogo primi={primiVisibili.length} secondi={secondiVisibili.length} compatto />
              </div>

              <div
                id="pannello-filtri"
                className={`${pannello ? "flex" : "hidden"} mt-3 flex-col gap-3 md:mt-0 md:flex md:flex-row md:flex-wrap md:items-center md:gap-x-6 md:gap-y-3`}
              >
                <Gruppo etichetta="Categoria">
                  {CATEGORIE.map((c) => (
                    <Pill key={c.id} attivo={categoria === c.id} onClick={() => setCategoria(c.id)}>
                      {c.label}
                    </Pill>
                  ))}
                </Gruppo>

                <Separatore />

                <Gruppo etichetta="Tag">
                  {TAGS.map((t) => (
                    <Pill
                      key={t.id}
                      multi
                      attivo={tag.includes(t.id)}
                      onClick={() => commutaTag(t.id)}
                    >
                      {t.label}
                    </Pill>
                  ))}
                </Gruppo>

                <Separatore />

                <Gruppo etichetta="Giorno">
                  {GIORNI_COTTURA.map((g) => (
                    <Pill key={g.id} attivo={giorno === g.id} onClick={() => setGiorno(g.id)}>
                      {g.label}
                    </Pill>
                  ))}
                </Gruppo>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-3 md:ml-auto">
                  <div className="flex items-center gap-2.5">
                    <label htmlFor="ordina" className="note text-[9.5px]">
                      Ordina
                    </label>
                    <div className="relative">
                      <select
                        id="ordina"
                        value={ordine}
                        // Niente "as Ordine": l'asserzione avrebbe zittito il compilatore
                        // su un valore che arriva dal DOM come stringa qualunque. La
                        // lista e' la sola fonte di verita', e se non c'e' non si tocca
                        // lo stato.
                        onChange={(e) => {
                          const scelto = ORDINI.find((o) => o.id === e.target.value);
                          if (scelto) setOrdine(scelto.id);
                        }}
                        style={{ fontVariationSettings: '"wdth" 84' }}
                        className="appearance-none rounded-full border border-[color:var(--hair-soft)] bg-[rgba(201,224,205,.045)] py-[7px] pr-9 pl-[15px] font-mono text-[10.5px] tracking-[.06em] text-ink uppercase transition-colors duration-400 ease-[var(--e-out)] hover:border-[color:var(--hair)]"
                      >
                        {ORDINI.map((o) => (
                          <option key={o.id} value={o.id} className="bg-tray text-ink">
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[9px] text-ink"
                      >
                        &#9660;
                      </span>
                    </div>
                  </div>

                  <Riepilogo
                    primi={primiVisibili.length}
                    secondi={secondiVisibili.length}
                    className="hidden md:block"
                  />

                  {attivi > 0 ? (
                    <button type="button" onClick={azzera} className="btn btn-s btn-sm">
                      Azzera
                      <span className="dot" aria-hidden="true">
                        &#215;
                      </span>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <h2 className="sr-only">Il catalogo</h2>

          {totaleVisibile > 0 ? (
            <>
              {primiAttiva ? (
                <div className="mt-14">
                  <SectionHead
                    occhiello="Primi · le basi"
                    titolo={
                      <>
                        La base <span className="hl hl-on"><i className="hl-bar" aria-hidden="true" /><span className="hl-tx">glucidica.</span></span>
                      </>
                    }
                    testo="Carboidrati e verdura: la parte del pasto che rifornisce l'allenamento."
                    azione={<Contatore n={primiVisibili.length} tot={PRIMI.length} etichetta="primi" />}
                  />
                  {primiVisibili.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {primiVisibili.map((e, i) => (
                        // Chiave sul solo id: cosi le schede che restano non si smontano a
                        // ogni click sui filtri (niente foto che sbattono) e a entrare in
                        // cascata sono davvero solo quelle nuove.
                        <Reveal key={e.id} delay={(i % CICLO) * 80}>
                          <div
                            className={`h-full transition-transform duration-700 ${INCLINA[i % CICLO]}`}
                            style={{ transitionTimingFunction: "var(--e-over)" }}
                          >
                            <ElementCard elemento={e} />
                          </div>
                        </Reveal>
                      ))}
                    </div>
                  ) : (
                    // Il tag/giorno ha svuotato SOLO questa sezione: i secondi restano
                    // (siamo qui, totaleVisibile > 0). Il silenzio va spiegato, non lasciato.
                    <SezioneVuota etichetta="primi" onAzzera={azzera} />
                  )}
                </div>
              ) : null}

              {secondiAttiva ? (
                <div className="mt-16">
                  <SectionHead
                    occhiello="Secondi · le proteine"
                    titolo={
                      <>
                        Proteina e <span className="hl hl-on"><i className="hl-bar" aria-hidden="true" /><span className="hl-tx">sostanza.</span></span>
                      </>
                    }
                    testo="Carne, pesce o alternative vegetali: la parte del pasto che ricostruisce."
                    azione={
                      <Contatore n={secondiVisibili.length} tot={SECONDI.length} etichetta="secondi" />
                    }
                  />
                  {secondiVisibili.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {secondiVisibili.map((e, i) => (
                        <Reveal key={e.id} delay={(i % CICLO) * 80}>
                          <div
                            className={`h-full transition-transform duration-700 ${INCLINA[i % CICLO]}`}
                            style={{ transitionTimingFunction: "var(--e-over)" }}
                          >
                            <ElementCard elemento={e} />
                          </div>
                        </Reveal>
                      ))}
                    </div>
                  ) : (
                    <SezioneVuota etichetta="secondi" onAzzera={azzera} />
                  )}
                </div>
              ) : null}
            </>
          ) : (
            /* ---------------------------------------------- nessun risultato */
            <Reveal className="mt-14">
              <div className="shell mx-auto max-w-[760px] md:rotate-[-1.4deg]">
                <div className="core relative overflow-hidden px-8 py-14 text-center sm:px-14 sm:py-16">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 font-mono text-[190px] leading-none text-ink opacity-[.05]"
                  >
                    0
                  </span>
                  <p className="h2 relative">
                    Nessun primo o secondo
                    <br />
                    con questi filtri
                  </p>
                  <p className="lead relative mx-auto mt-6">
                    Hai stretto troppo la maglia. Togli un tag o cambia categoria: i{" "}
                    {PRIMI.length + SECONDI.length} elementi del catalogo sono tutti qui, nessuno &egrave;
                    finito.
                  </p>
                  <button type="button" onClick={azzera} className="btn btn-p relative mt-9">
                    Azzera i filtri
                    <span className="dot" aria-hidden="true">
                      &#8635;
                    </span>
                  </button>
                </div>
              </div>
            </Reveal>
          )}

          {/* ---------------------------------------------------- gli extra
              Fascia sempre presente, non filtrata: gli extra non hanno tag ne
              giorno di cottura, non c'e' niente su cui i filtri sopra possano
              lavorare. Il conteggio resta comunque letto dal catalogo. */}
          <div className="mt-16">
            <SectionHead
              occhiello="Extra"
              titolo={
                <>
                  Il di pi&ugrave;, <span className="hl hl-on"><i className="hl-bar" aria-hidden="true" /><span className="hl-tx">se serve.</span></span>
                </>
              }
              testo={`${EXTRA.length} aggiunte per completare il pasto, sempre a catalogo.`}
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8">
              {EXTRA.map((x, i) => (
                <Reveal key={x.id} delay={(i % 8) * 45}>
                  <div className="shell h-full">
                    <div className="core flex h-full flex-col p-4">
                      <p className="h3 !text-[16px] leading-tight">{x.nome}</p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        <Chip>{x.grammi} g</Chip>
                        <Chip>{x.kcal} kcal</Chip>
                      </div>
                      <div className="mt-3">
                        <MacroSplit proteine={x.proteine} carboidrati={x.carboidrati} grassi={x.grassi} />
                      </div>
                      {/* Allergeni Reg. UE 1169/2011: campo obbligatorio, mostrato sempre,
                          anche quando l'elenco e' vuoto - "nessuno" e' un dato, non un buco. */}
                      <p className="note mt-3 flex-1 !text-[8.5px] leading-relaxed">
                        {x.allergeni.length > 0 ? x.allergeni.join(", ") : "nessun allergene dichiarato"}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------- il ritmo della settimana */}
      <section className="relative overflow-x-clip pt-[30px] pb-[132px]">
        <div className="-ml-[6%] w-[112%] bg-lime text-ink shadow-[0_36px_74px_-48px_rgba(2,11,7,.9)] md:rotate-[-1.15deg]">
          <div className="mx-auto flex w-[1180px] max-w-[calc(100%/1.12-40px)] flex-wrap items-center justify-center gap-x-6 gap-y-2 py-8 md:rotate-[1.15deg]">
            {RITMO.map((v, i) => (
              <Fragment key={v}>
                <span className="font-disp text-[19px] leading-none uppercase sm:text-[25px]">
                  {v}
                </span>
                {i < RITMO.length - 1 ? (
                  <i aria-hidden="true" className="block h-[9px] w-[9px] rotate-45 bg-ink" />
                ) : null}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ barra del piano
          Solo a piano riletto: i numeri del piano non esistono al primo render
          sul server e stamparli qui vorrebbe dire un mismatch di idratazione.  */}
      {pronto && pasti > 0 ? (
        /* z-40, non 50: il pannello a schermo pieno del Nav sta a z-50 ma viene PRIMA
           nel DOM, quindi a parita' di z-index questa barra gli restava sopra e la pill
           "Vai alla settimana" galleggiava in mezzo al menu mobile aperto. */
        <div className="pointer-events-none fixed inset-x-0 bottom-[22px] z-40 flex justify-center px-5">
          <div
            className="shell pointer-events-auto rounded-full"
            style={{ animation: "fuel-rise .7s var(--e-over) both" }}
          >
            <div className="core flex items-center gap-3 rounded-full py-[7px] pr-[7px] pl-5 sm:gap-4 sm:pl-6">
              <p
                aria-live="polite"
                style={{ fontVariationSettings: '"wdth" 84' }}
                className="font-mono text-[10.5px] tracking-[.12em] whitespace-nowrap text-ink uppercase"
              >
                <b className="text-[15px] font-normal text-ink">{pasti}</b> pasti nella settimana
              </p>
              <Link href="/settimana" className="btn btn-p btn-sm">
                Vai alla settimana
                <span className="dot" aria-hidden="true">
                  &#8599;
                </span>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
