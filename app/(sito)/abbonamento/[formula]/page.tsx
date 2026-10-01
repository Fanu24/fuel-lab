import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import ChiusuraAbbonamento from "@/components/abbonamento/ChiusuraAbbonamento";
import Passi from "@/components/abbonamento/Passi";
import PerOgniDieta from "@/components/abbonamento/PerOgniDieta";
import { RiquadroPrezzi } from "@/components/abbonamento/RiquadroPrezzi";
import ScontiEProva from "@/components/abbonamento/ScontiEProva";
import {
  CONSEGNA_A_PAROLE,
  CIRCA_A_PASTO,
  ZONA_A_PAROLE,
  coperturaAParole,
  esempioConsegna,
  inLettere,
} from "@/components/abbonamento/righe";
import Briciole from "@/components/seo/Briciole";
import JsonLd from "@/components/seo/JsonLd";
import { AGGIORNAMENTO, PAGINE, metadatiPagina, paginaFormula } from "@/components/seo/pagine";
import { nodiPagina, nodoFormula } from "@/components/seo/schema";
import {
  FORMULE,
  FORMULE_ID,
  NOMI_FASCIA,
  NOTE_FASCIA,
  eFormulaId,
  getFormula,
  linkRichiediAbbonamento,
  linkScriviAbbonamento,
  percorsoFormula,
  type FormulaId,
} from "@/lib/abbonamento";
import type { ChiaveFoto } from "@/lib/immagini";

/* La scheda di una formula, come la scheda A4 del volantino: nome, slogan,
   descrizione, i quattro riquadri (cosa ricevi, consegna, fasce, per iniziare),
   le diete, il prezzo Standard grande e la fascia Plus, gli sconti, come
   funziona. Tutto legge da lib/abbonamento.ts: cambia la formula, cambia la
   pagina. Export statico (come il blog): le cinque schede nascono al build da
   generateStaticParams e un'altra formula e' un 404. Next 16: params e' una
   Promise. */

type Props = { params: Promise<{ formula: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return FORMULE_ID.map((formula) => ({ formula }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { formula } = await params;
  if (!eFormulaId(formula)) return {};
  return metadatiPagina(paginaFormula(formula));
}

/* Una foto diversa per ogni chiusura, dal registro delle foto del sito
   (lib/immagini): solo un po' di varieta' fra le cinque schede, l'alt descrive
   quello che si vede. */
const FOTO_CHIUSURA: Record<FormulaId, ChiaveFoto> = {
  pranzo: "ciotola",
  leggero: "bowl",
  completo: "schiscette",
  full6: "tagliere",
  full7: "cuoco",
};

export default async function SchedaFormulaPage({ params }: Props) {
  const { formula: id } = await params;
  if (!eFormulaId(id)) notFound();

  const f = getFormula(id);
  const PAGINA = paginaFormula(id);
  const briciole = [
    { nome: PAGINE.abbonamento.breve, href: PAGINE.abbonamento.percorso },
    { nome: f.nome, href: percorsoFormula(id) },
  ];
  const altre = FORMULE.filter((x) => x.id !== id);

  /* I quattro riquadri del volantino. */
  const riquadri = [
    { titolo: "Cosa ricevi", testo: f.cosaRicevi, nota: coperturaAParole(f) },
    { titolo: "Consegna", testo: CONSEGNA_A_PAROLE, nota: ZONA_A_PAROLE },
    {
      titolo: "Fasce",
      testo: `${NOMI_FASCIA.standard} o ${NOMI_FASCIA.plus}`,
      nota: (
        <>
          <strong className="font-semibold text-ink">{NOMI_FASCIA.standard}.</strong> {NOTE_FASCIA.standard}
          <br />
          <strong className="font-semibold text-ink">{NOMI_FASCIA.plus}.</strong> {NOTE_FASCIA.plus}
        </>
      ),
    },
    {
      titolo: "Per iniziare",
      testo: "La prima settimana di prova, senza impegno",
      nota: "Inizio, consegna o ritiro e pagamento si concordano con Matteo.",
    },
  ];

  return (
    <>
      <JsonLd
        dati={[
          ...nodiPagina({
            percorso: PAGINA.percorso,
            nome: PAGINA.titolo,
            descrizione: PAGINA.descrizione,
            briciole,
            dataModifica: AGGIORNAMENTO,
          }),
          nodoFormula(id),
        ]}
      />

      <section className="testata">
        <div className="wrap">
          <Briciole voci={briciole} />
          <div className="mt-10 grid items-start gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div className="min-w-0">
              <h1>
                <span className="occhiello">Abbonamento pasti a Pescara</span>
                <span className="titolo-xl mt-6 block text-[clamp(40px,min(7.4vw,12svh),104px)]">{f.nome}</span>
              </h1>
              {f.consigliato ? <span className="abb-consigliato mt-5">Consigliato</span> : null}
              <p className="titolo-s mt-5 text-muted">{f.slogan}</p>
              {/* Sul telefono il riquadro dei prezzi sta sotto il testo, fuori dal primo schermo: prezzo e bottone si
                  leggono qui, come in cima a /abbonamento. Dal computer il riquadro e' accanto e questa parte non serve. */}
              <p className="mt-6 lg:hidden">
                <span className="evidenzia font-disp text-xl font-bold tracking-[.06em] uppercase">
                  {f.prezzo.standard}&nbsp;€ al mese
                </span>
                <span className="mt-2 block text-sm text-muted">
                  Fascia Standard, {CIRCA_A_PASTO}. In Plus {f.prezzo.plus}&nbsp;€. La prima settimana è di prova, senza
                  impegno.
                </span>
              </p>
              <p className="lead mt-6">{f.descrizione}</p>
              <p className="mt-6 font-disp text-lg font-semibold tracking-[.06em] uppercase">{coperturaAParole(f)}</p>
              <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
                <Link
                  href={linkRichiediAbbonamento({ formula: id, ritiro: false })}
                  className="btn btn-ink whitespace-normal py-3 text-left lg:hidden"
                >
                  Prenota la prova <span aria-hidden="true" className="freccia">→</span>
                </Link>
                <Link href={`${PAGINE.abbonamento.percorso}#formule`} className="link">
                  Confronta le formule
                </Link>
                <Link href={linkScriviAbbonamento({ formula: id })} className="link">
                  Scrivi a Matteo
                </Link>
              </div>
            </div>
            <RiquadroPrezzi formula={id} delay={80} />
          </div>
        </div>
      </section>

      <section className="sezione carta-2">
        <div className="wrap">
          <Reveal>
            <p className="occhiello">In pratica</p>
            <h2 className="titolo mt-5 max-w-[16ch]">Cosa ricevi, quando e come.</h2>
          </Reveal>
          <ul className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {riquadri.map((r, i) => (
              <Reveal as="li" key={r.titolo} delay={i * 80} className="border-t-[3px] border-ink pt-6">
                <h3 className="font-disp text-sm font-semibold tracking-[.16em] uppercase">{r.titolo}</h3>
                <p className="mt-3 text-xl leading-snug font-semibold">{r.testo}</p>
                <p className="mt-3 text-muted">{r.nota}</p>
              </Reveal>
            ))}
          </ul>

          <Reveal className="mt-20 grid gap-10 border-t border-ink/15 pt-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="occhiello">Ogni consegna</p>
              <h2 className="titolo-s mt-5 max-w-[20ch]">Cosa ricevi a ogni consegna.</h2>
            </div>
            <p className="max-w-[52ch] text-lg leading-relaxed">{esempioConsegna(f)}</p>
          </Reveal>
        </div>
      </section>

      <section className="notte">
        <div className="wrap py-[var(--sezione)]">
          <Reveal>
            <PerOgniDieta titolo="h2" />
            <p className="mt-10 max-w-[60ch] text-steel">
              Non è una dieta e non è una consulenza: i numeri li decide il professionista che ti segue, Matteo li
              cucina. Se hai un&apos;allergia importante o una condizione medica, parlane con Matteo prima di iniziare
              e con il tuo medico o nutrizionista.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="sezione">
        <div className="wrap">
          <ScontiEProva formula={id} />
        </div>
      </section>

      <section className="sezione carta-2">
        <div className="wrap">
          <Reveal>
            <p className="occhiello">Come funziona</p>
            <h2 className="titolo mt-5 max-w-[16ch]">Porti il piano. Al resto pensiamo noi.</h2>
          </Reveal>
          <div className="mt-14">
            <Passi />
          </div>
        </div>
      </section>

      <section className="sezione">
        <div className="wrap grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <Reveal>
            <p className="occhiello">Confronta con le altre</p>
            <h2 className="titolo-s mt-5 max-w-[14ch]">Le altre {inLettere(altre.length)} formule.</h2>
            <Link href={`${PAGINE.abbonamento.percorso}#simulatore`} className="link mt-8 inline-block">
              Fai il conto nel simulatore
            </Link>
          </Reveal>
          <Reveal delay={80} as="ul" className="border-b border-ink/15">
            {altre.map((a) => (
              <li key={a.id}>
                <Link href={percorsoFormula(a.id)} className="abb-mini">
                  <span>
                    <span className="abb-mini-nome">{a.nome}</span>
                    <span className="mt-1 block text-sm text-muted">
                      {a.slogan} {a.pastiSettimana} pasti a settimana.
                    </span>
                  </span>
                  <span className="abb-cifra text-[28px]">
                    {a.prezzo.standard}
                    <span className="ml-[.08em]">€</span>
                    <span className="sr-only"> al mese, fascia Standard</span>
                  </span>
                </Link>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      <ChiusuraAbbonamento formula={id} foto={FOTO_CHIUSURA[id]} />
    </>
  );
}
