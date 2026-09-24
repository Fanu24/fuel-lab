"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import ExtraCard from "@/components/ExtraCard";
import PiattoCard from "@/components/PiattoCard";
import Reveal from "@/components/Reveal";
import Ticker from "@/components/Ticker";
import { Chip, Eyebrow, Rise, SectionHead } from "@/components/ui";
import {
  EXTRA,
  PIATTI,
  REPARTI,
  extraPerReparto,
  piattoImg,
  type Allenamento,
  type Piatto,
} from "@/lib/catalogo";
import { usePiano } from "@/lib/piano";
import { TAGS, type Giorno, type Tag } from "@/lib/types";

type FiltroGiorno = Giorno | "tutti";
type FiltroAllenamento = Allenamento | "tutti";
type Ordine = "consigliati" | "proteine" | "kcal-su" | "kcal-giu";

const GIORNI_COTTURA: { id: FiltroGiorno; label: string }[] = [
  { id: "tutti", label: "Tutti" },
  { id: "lunedi", label: "Lunedì" },
  { id: "giovedi", label: "Giovedì" },
];

const ALLENAMENTO: { id: FiltroAllenamento; label: string }[] = [
  { id: "tutti", label: "Tutti" },
  { id: "cardio", label: "Cardio" },
  { id: "pesi", label: "Pesistica" },
  { id: "entrambi", label: "Entrambi" },
];

const ORDINI: { id: Ordine; label: string }[] = [
  { id: "consigliati", label: "Consigliati" },
  { id: "proteine", label: "Più proteine" },
  { id: "kcal-su", label: "Meno calorie" },
  { id: "kcal-giu", label: "Più calorie" },
];

const RITMO = ["Cotto il lunedì", "Consegnato il martedì", "Cotto il giovedì", "Consegnato il venerdì"];

const CICLO = 4;
const INCLINA = ["", "xl:rotate-[1deg]", "", "xl:rotate-[-1deg]"];

const COPERTINA: Piatto | undefined = PIATTI[0];

function Pill({
  attivo,
  onClick,
  multi = false,
  children,
}: {
  attivo: boolean;
  onClick: () => void;
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
      className="group inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border border-[color:var(--hair-soft)] bg-[rgba(201,224,205,.045)] px-[15px] py-[8px] text-[12px] md:min-h-[36px] tracking-[.06em] whitespace-nowrap text-ink uppercase transition-[color,background-color,border-color,transform] duration-400 ease-[var(--e-out)] hover:border-[color:var(--hair)] hover:bg-[rgba(223,255,62,.11)] hover:text-ink active:scale-[.96] data-[on=true]:border-transparent data-[on=true]:bg-lime data-[on=true]:text-ink data-[on=true]:hover:bg-white data-[on=true]:hover:text-ink"
    >
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
      <span aria-hidden="true" className="note shrink-0">
        {etichetta}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

function Separatore() {
  return <span aria-hidden="true" className="hidden h-6 w-px bg-[var(--hair-soft)] xl:block" />;
}

function Contatore({ n, tot, etichetta, className = "" }: { n: number; tot: number; etichetta: string; className?: string }) {
  return (
    <p
      style={{ fontVariationSettings: '"wdth" 84' }}
      className={`font-mono text-[12px] tracking-[.08em] whitespace-nowrap text-muted uppercase ${className}`}
    >
      <b className="text-[15px] font-normal text-ink">{n}</b> {etichetta} su {tot}
    </p>
  );
}

function filtra(
  lista: Piatto[],
  giorno: FiltroGiorno,
  tag: Tag[],
  allenamento: FiltroAllenamento,
): Piatto[] {
  return lista.filter(
    (e) =>
      (giorno === "tutti" || e.giorno === giorno) &&
      (tag.length === 0 || tag.some((t) => e.tag.includes(t))) &&
      (allenamento === "tutti" || e.allenamento === allenamento || e.allenamento === "entrambi"),
  );
}

function allenamentoDaQuery(raw: string | null): FiltroAllenamento {
  if (raw === "cardio" || raw === "pesi" || raw === "entrambi") return raw;
  return "tutti";
}

function ordina(lista: Piatto[], ordine: Ordine): Piatto[] {
  if (ordine === "consigliati") return lista;
  const copia = lista.slice();
  copia.sort((a, b) => {
    if (ordine === "proteine") return b.proteine - a.proteine || a.kcal - b.kcal;
    if (ordine === "kcal-su") return a.kcal - b.kcal || b.proteine - a.proteine;
    return b.kcal - a.kcal || b.proteine - a.proteine;
  });
  return copia;
}

export default function MenuClient() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [giorno, setGiorno] = useState<FiltroGiorno>("tutti");
  const [tag, setTag] = useState<Tag[]>([]);
  const allenamento = allenamentoDaQuery(params.get("allenamento"));
  const [ordine, setOrdine] = useState<Ordine>("consigliati");
  const [pannello, setPannello] = useState(false);
  const { pronto, pasti } = usePiano();

  function setAllenamento(id: FiltroAllenamento) {
    const next = new URLSearchParams(params.toString());
    if (id === "tutti") next.delete("allenamento");
    else next.set("allenamento", id);
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  const visibili = useMemo(
    () => ordina(filtra(PIATTI, giorno, tag, allenamento), ordine),
    [giorno, tag, allenamento, ordine],
  );

  const extraAttivi =
    (giorno !== "tutti" ? 1 : 0) +
    tag.length +
    (ordine !== "consigliati" ? 1 : 0) +
    (allenamento !== "tutti" ? 1 : 0);

  function azzera() {
    setGiorno("tutti");
    setTag([]);
    setAllenamento("tutti");
    setOrdine("consigliati");
  }

  function commutaTag(t: Tag) {
    setTag((v) => (v.includes(t) ? v.filter((x) => x !== t) : [...v, t]));
  }

  return (
    <>
      <section className="fascia fascia-t fascia-carta !pt-[76px] !pb-3 md:!pt-[var(--y-testata)] md:!pb-[var(--y-fascia)]">
        <div className="wrap">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_366px] lg:gap-16">
            <div>
              <Eyebrow className="mb-3 hidden lg:mb-[20px] lg:block">Il menu della settimana</Eyebrow>
              <p className="note mb-2.5 lg:hidden">
                {PIATTI.length} piatti &middot; aggiunte per la box
              </p>
              <h1 className="h1">
                <span className="lg:hidden">
                  <Rise i={0}>Piatti</Rise>
                  <Rise i={1}>
                    <span className="hl hl-on">
                      <i className="hl-bar" aria-hidden="true" />
                      <span className="hl-tx">già composti.</span>
                    </span>
                  </Rise>
                </span>
                <span className="hidden lg:block">
                  <Rise i={0}>{PIATTI.length} piatti già composti,</Rise>
                  <Rise i={1}>
                    <span className="hl hl-on">
                      <i className="hl-bar" aria-hidden="true" />
                      <span className="hl-tx">poi le aggiunte.</span>
                    </span>
                  </Rise>
                </span>
              </h1>
              <p className="lead mt-4 hidden lg:mt-7 lg:block">
                Matteo cucina il luned&igrave; e il gioved&igrave; e consegna il giorno dopo. Ogni
                piatto ha ingredienti, macro e il motivo dell&apos;abbinamento. Le aggiunte della box
                si attaccano dopo, se ti servono.
              </p>
              <div className="mt-5 hidden flex-wrap items-center gap-2 lg:mt-7 lg:flex lg:gap-2.5">
                <Chip accento>Scheda nutrizionale</Chip>
                <Chip>Abbinamento all&apos;allenamento</Chip>
                <Chip>Consegna a Pescara</Chip>
              </div>
            </div>

            <div className="relative mx-auto hidden w-full max-w-[366px] lg:mx-0 lg:block">
              <div
                className="shell transition-transform duration-700 md:rotate-[-2.4deg] md:hover:rotate-0"
                style={{ transitionTimingFunction: "var(--e-over)" }}
              >
                <figure className="core foto-profondita aspect-[4/5] bg-tray">
                  {COPERTINA ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={piattoImg(COPERTINA, 760)}
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
                <p className="font-disp text-[24px] leading-none uppercase">Lun / Gio</p>
                <p className="mt-2 font-mono text-[12px] tracking-[.08em] uppercase">
                  le due cotture
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="hidden md:block">
        <Ticker
          parole={["Cotto il lunedì", "Cotto il giovedì", "Mai surgelato", "Pescara e provincia"]}
          durata={38}
        />
      </div>

      <section
        className={`fascia fascia-guscio !pt-4 md:!pt-[var(--y-fascia)] ${pronto && pasti > 0 ? "!pb-32" : ""}`}
      >
        <div className="wrap">
          <h2 className="sr-only">Filtra il catalogo</h2>

          <div className="shell sticky top-[76px] z-30 md:top-[100px]">
            <div className="core p-3 sm:p-4">
              <div className="md:hidden">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setPannello((p) => !p)}
                    aria-expanded={pannello}
                    aria-controls="pannello-filtri"
                    className="btn btn-s btn-sm"
                  >
                    Filtri
                    {extraAttivi > 0 ? (
                      <span
                        style={{ fontVariationSettings: '"wdth" 84' }}
                        className="font-mono text-[13px] text-ink"
                      >
                        {extraAttivi}
                      </span>
                    ) : null}
                    <span className="dot" aria-hidden="true">
                      {pannello ? "−" : "+"}
                    </span>
                  </button>
                  <Contatore n={visibili.length} tot={PIATTI.length} etichetta="piatti" />
                </div>
              </div>

              <div
                id="pannello-filtri"
                className={`${pannello ? "flex" : "hidden"} mt-3 flex-col gap-3 md:mt-0 md:flex md:flex-row md:flex-wrap md:items-center md:gap-x-6 md:gap-y-3`}
              >
                <Gruppo etichetta="Allenamento">
                  {ALLENAMENTO.map((a) => (
                    <Pill key={a.id} attivo={allenamento === a.id} onClick={() => setAllenamento(a.id)}>
                      {a.label}
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
                    <label htmlFor="ordina" className="note">
                      Ordina
                    </label>
                    <div className="relative">
                      <select
                        id="ordina"
                        value={ordine}
                        onChange={(e) => {
                          const scelto = ORDINI.find((o) => o.id === e.target.value);
                          if (scelto) setOrdine(scelto.id);
                        }}
                        style={{ fontVariationSettings: '"wdth" 84' }}
                        className="h-[44px] appearance-none rounded-full border border-[color:var(--hair-soft)] bg-[rgba(201,224,205,.045)] py-[7px] pr-9 pl-[15px] font-mono text-[13px] md:h-11 tracking-[.04em] text-ink uppercase transition-colors duration-400 ease-[var(--e-out)] hover:border-[color:var(--hair)]"
                      >
                        {ORDINI.map((o) => (
                          <option key={o.id} value={o.id} className="bg-tray text-ink">
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[12px] text-ink"
                      >
                        &#9660;
                      </span>
                    </div>
                  </div>

                  <Contatore
                    n={visibili.length}
                    tot={PIATTI.length}
                    etichetta="piatti"
                    className="hidden md:block"
                  />

                  {extraAttivi > 0 ? (
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

          <h2 className="sr-only">I piatti</h2>

          {visibili.length > 0 ? (
            <div className="mt-5 md:mt-14">
              <SectionHead
                compatto
                occhiello="Piatti già composti"
                titolo={
                  <>
                    Scheda, motivo,{" "}
                    <span className="hl hl-on">
                      <i className="hl-bar" aria-hidden="true" />
                      <span className="hl-tx">abbinamento.</span>
                    </span>
                  </>
                }
                testo="Ogni piatto è chiuso: ingredienti, macro e perché sta insieme. Scegli in base all'allenamento, poi aggiungi alla settimana."
                azione={<Contatore n={visibili.length} tot={PIATTI.length} etichetta="piatti" />}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-6 xl:grid-cols-3">
                {visibili.map((e, i) => (
                  <Reveal key={e.id} delay={(i % CICLO) * 80}>
                    <div
                      className={`h-full transition-transform duration-700 ${INCLINA[i % CICLO]}`}
                      style={{ transitionTimingFunction: "var(--e-over)" }}
                    >
                      <PiattoCard piatto={e} />
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          ) : (
            <Reveal className="mt-14">
              <div className="shell mx-auto max-w-[760px] md:rotate-[-1.4deg]">
                <div className="core relative overflow-hidden px-8 py-14 text-center sm:px-14 sm:py-16">
                  <p className="h2 relative">
                    Nessun piatto
                    <br />
                    con questi filtri
                  </p>
                  <p className="lead relative mx-auto mt-6">
                    Hai stretto troppo la maglia. Togli un tag o cambia allenamento: i {PIATTI.length}{" "}
                    piatti del catalogo sono tutti qui.
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

          <div className="mt-7 md:mt-16">
            <SectionHead
              compatto
              occhiello="Alimenti per la tua box"
              titolo={
                <>
                  Aggiunte,{" "}
                  <span className="hl hl-on">
                    <i className="hl-bar" aria-hidden="true" />
                    <span className="hl-tx">se servono.</span>
                  </span>
                </>
              }
              testo={`${EXTRA.length} alimenti per personalizzare la box. I prezzi sono supplementi, dove il listino li dichiara. Dove non c'e' un numero, e incluso o su richiesta.`}
            />
            {REPARTI.map((r) => {
              const lista = extraPerReparto(r.id);
              if (lista.length === 0) return null;
              return (
                <div key={r.id} className="mt-6 md:mt-10">
                  <h3 className="h3 mb-3 !text-[18px] md:mb-5 md:!text-[22px]">{r.label}</h3>
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
                    {lista.map((x, i) => (
                      <Reveal key={x.id} delay={(i % 5) * 50}>
                        <ExtraCard extra={x} />
                      </Reveal>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="fascia fascia-carta relative overflow-x-clip">
        <div className="-ml-[6%] w-[112%] bg-lime text-ink shadow-[0_36px_74px_-48px_rgba(2,11,7,.9)] md:rotate-[-1.15deg]">
          <div className="mx-auto flex w-[1180px] max-w-[calc(100%/1.12-40px)] flex-wrap items-center justify-center gap-x-6 gap-y-2 py-8 md:rotate-[1.15deg]">
            {RITMO.map((v, i) => (
              <Fragment key={v}>
                <span className="font-disp text-[16px] leading-none uppercase sm:text-[21px]">
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

      {pronto && pasti > 0 ? (
        <div aria-hidden="true" className="h-[120px]" />
      ) : null}

      {pronto && pasti > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-[22px] z-40 flex justify-center px-5">
          <div
            className="shell pointer-events-auto rounded-full"
            style={{ animation: "fuel-rise .7s var(--e-over) both" }}
          >
            <div className="core flex items-center gap-3 rounded-full py-[7px] pr-[7px] pl-5 sm:gap-4 sm:pl-6">
              <p
                aria-live="polite"
                style={{ fontVariationSettings: '"wdth" 84' }}
                className="font-mono text-[12px] tracking-[.08em] whitespace-nowrap text-ink uppercase"
              >
                <b className="text-[15px] font-normal text-ink">{pasti}</b>{" "}
                {pasti === 1 ? "pasto" : "pasti"} nella settimana
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
