import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import FotoPiena from "@/components/ui/FotoPiena";
import ChiusuraCta from "@/components/home/ChiusuraCta";
import Briciole from "@/components/seo/Briciole";
import JsonLd from "@/components/seo/JsonLd";
import { AGGIORNAMENTO, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { ID, nodiPagina } from "@/components/seo/schema";
import { PIATTI } from "@/lib/catalogo";
import { CONSIGLI } from "@/lib/consigli";
import { FOTO, RITRATTO_MATTEO } from "@/lib/immagini";
import { INDIRIZZO, INDIRIZZO_RIGA, LINK_MAPPA, NOME_ATTIVITA, TITOLARE, ZONE_SERVITE, elencoZone } from "@/lib/sito";

/* "Chi siamo": FUEL LAB come progetto, con Matteo in primo piano come cuoco e
   fondatore. Ha preso il posto della vecchia pagina "Chi è Matteo" (redirect
   301 in public/_redirects). Regola della pagina: solo cose che il sito dice gia'
   altrove (lib/sito.ts, la home, come funziona, il menu), scritte con un tono
   da azienda. Niente anni di esperienza, titoli, premi, numeri di clienti o
   collaboratori: il committente non li ha dati, e qui non si inventano. */

const PAGINA = PAGINE.chiSiamo;

export const metadata = metadatiPagina(PAGINA);

/* Il metodo, dalla spesa alla porta: gli stessi principi della sezione "La
   cucina" in home, piu' il ritmo quotidiano. */
const METODO = [
  {
    titolo: "La spesa",
    testo: "Si compra il giorno della cottura. Niente magazzino, niente surgelato.",
  },
  {
    titolo: "La cottura",
    testo: "Padella, forno e bassa temperatura: cotture vere, che tengono il sapore e i valori.",
  },
  {
    titolo: "La porzione",
    testo: "Ogni porzione è pesata al grammo e ha i suoi macro scritti sopra: quelli che leggi sono quelli che mangi.",
  },
  {
    titolo: "Il ritiro o la consegna",
    testo: `Si cucina ogni giorno e si consegna ogni giorno: ritiro in ${INDIRIZZO.via} o consegna in zona.`,
  },
];

const CIFRE = [
  { cifra: String(PIATTI.length), etichetta: "Piatti nel menu" },
  { cifra: "4", etichetta: "Valori su ogni porzione" },
  { cifra: "0", etichetta: "Piatti surgelati" },
  { cifra: String(ZONE_SERVITE.length), etichetta: "Zone di consegna" },
];

const VALORI = [
  {
    titolo: "Fresco, mai surgelato",
    testo:
      "Matteo cucina ogni giorno con la spesa del giorno. I piatti sono da frigorifero e arrivano con le indicazioni per conservarli e scaldarli.",
  },
  {
    titolo: "Macro su ogni piatto",
    testo:
      "Calorie, proteine, carboidrati e grassi della porzione intera, pubblicati prima dell'ordine. Le calorie tornano sempre: proteine e carboidrati per 4, grassi per 9.",
  },
  {
    titolo: "Pensati per l'allenamento",
    testo: `Ogni piatto è indicato per i giorni di cardio, di pesi o per entrambi. Nei giorni di cardio, ${CONSIGLI.cardio.regola.toLowerCase()} Nei giorni di pesi, ${CONSIGLI.pesi.regola.toLowerCase()}`,
  },
  {
    titolo: "Ingredienti e allergeni in chiaro",
    testo:
      "Ingredienti con i grammi e allergeni sono pubblici, piatto per piatto. Per sostituzioni e possibili contaminazioni si chiede a Matteo prima di ordinare.",
  },
];

const NON_E = [
  "Non è una dieta: i numeri del tuo fabbisogno li decide il tuo nutrizionista, Matteo li cucina.",
  "Non è un integratore, un percorso o una consulenza.",
  "Non è cibo da palestra triste: se un piatto non lo mangeresti a cena, la cucina ha sbagliato.",
];

const SERVIZI_PAGINA = [
  {
    href: PAGINE.mealPrep.percorso,
    titolo: "Meal prep a Pescara",
    testo: "I piatti del menu, scelti da te o composti sul tuo allenamento, settimana per settimana.",
  },
  {
    href: PAGINE.abbonamento.percorso,
    titolo: "Abbonamento ai pranzi",
    testo: "Tutti i pranzi dal lunedì al venerdì per un mese, composti sulla tua scheda.",
  },
  {
    href: PAGINE.scheda.percorso,
    titolo: "Dai tuoi macro",
    testo: "Parti dai numeri del tuo nutrizionista: la settimana si compone con i piatti più vicini.",
  },
  {
    href: PAGINE.domicilio.percorso,
    titolo: "Cuoco a domicilio",
    testo: "Matteo fa la spesa, cucina e porziona i pasti nella tua cucina. Su preventivo.",
  },
];

export default function ChiSiamo() {
  const ritratto = RITRATTO_MATTEO ?? FOTO.cuoco;
  const briciole = [{ nome: PAGINA.breve, href: PAGINA.percorso }];

  return (
    <>
      {/* AboutPage sull'attivita', con Matteo citato: i nodi Organization e
          Person stanno nel grafo del layout e qui si richiamano per @id. */}
      <JsonLd
        dati={nodiPagina({
          percorso: PAGINA.percorso,
          nome: PAGINA.titolo,
          descrizione: PAGINA.descrizione,
          tipo: "AboutPage",
          briciole,
          about: { "@id": ID.organizzazione },
          mainEntity: { "@id": ID.organizzazione },
          mentions: [{ "@id": ID.matteo }, { "@id": ID.cucina }],
          dataModifica: AGGIORNAMENTO,
        })}
      />

      <section className="testata">
        <div className="wrap">
          <Briciole voci={briciole} />
          <div className="mt-10 grid items-end gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <div>
              <h1>
                <span className="occhiello">Chi siamo</span>
                <span className="titolo-xl mt-6 block max-w-[12ch]">Cuciniamo per chi si allena.</span>
              </h1>
              <p className="titolo-s mt-4 text-muted">
                {NOME_ATTIVITA} · {INDIRIZZO.citta}
              </p>
              <p className="lead mt-8">
                {NOME_ATTIVITA} è il meal prep fresco di {TITOLARE.nome}, cuoco e fondatore. Dalla cucina di{" "}
                {INDIRIZZO.via} escono ogni giorno piatti pensati per l&apos;allenamento, con ingredienti, allergeni
                e macro scritti su ogni porzione.
              </p>
            </div>
            <figure className="smusso relative aspect-[4/5] overflow-hidden bg-paper-2">
              <Image
                src={ritratto.src}
                alt={ritratto.alt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                loading="eager"
                fetchPriority="high"
                className="object-cover"
              />
              {!RITRATTO_MATTEO ? (
                <figcaption className="absolute right-3 bottom-3 bg-paper px-3 py-1 text-xs text-ink">
                  Foto illustrativa
                </figcaption>
              ) : null}
            </figure>
          </div>
        </div>
      </section>

      <section className="sezione">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <p className="occhiello">Il progetto</p>
            <h2 className="titolo mt-5 max-w-[12ch]">{NOME_ATTIVITA}, in breve.</h2>
          </Reveal>
          <Reveal delay={80} className="grid gap-6 text-lg leading-relaxed">
            <p>
              {NOME_ATTIVITA} è una cucina di meal prep a {INDIRIZZO.citta}. Prepara piatti già composti per chi fa
              cardio o pesi e li consegna pronti da mettere in frigorifero: a {elencoZone()}, oppure con il ritiro in
              sede.
            </p>
            <p>
              Il lavoro parte dall&apos;allenamento. Ogni piatto del menu è pensato per i giorni di cardio, per quelli
              di pesi o per entrambi, e porta con sé i numeri che servono a sceglierlo: grammi della porzione, calorie,
              proteine, carboidrati e grassi.
            </p>
            <p>
              Il rapporto è diretto. Sul sito non si paga niente: ogni richiesta arriva a Matteo, che conferma piatti,
              giorno e modalità prima di mettersi ai fornelli.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="sezione carta-2">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <p className="occhiello">Il cuoco e fondatore</p>
            <h2 className="titolo mt-5 max-w-[12ch]">{TITOLARE.nome}.</h2>
          </Reveal>
          <Reveal delay={80} className="grid gap-6 text-lg leading-relaxed">
            <p>
              Matteo ha fondato {NOME_ATTIVITA} e ne è il cuoco. Decide i piatti, fa la spesa, cucina e porziona: gli
              ingredienti e le porzioni che trovi nelle schede del menu sono scelte sue.
            </p>
            <p>
              Suoi sono anche i consigli con cui i piatti si abbinano all&apos;allenamento, gli stessi che usa il
              compositore della settimana. E sua è la risposta quando scrivi: tra te e la cucina non c&apos;è un
              centralino.
            </p>
            <p>
              Se preferisci che cucini da te, Matteo porta il meal prep nella tua cucina:{" "}
              <Link href={PAGINE.domicilio.percorso} className="link">
                cuoco a domicilio a Pescara
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>

      <section className="sezione">
        <div className="wrap">
          <Reveal>
            <p className="occhiello">Come lavoriamo</p>
            <h2 className="titolo mt-5 max-w-[15ch]">Dalla spesa alla porta, ogni giorno.</h2>
          </Reveal>
          <ol className="mt-14 grid gap-10 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            {METODO.map((m, i) => (
              <Reveal as="li" key={m.titolo} delay={i * 80} className="border-t-[3px] border-ink pt-6">
                <span className="num text-sm text-muted">0{i + 1}</span>
                <h3 className="titolo-s mt-3">{m.titolo}</h3>
                <p className="mt-3 max-w-[34ch] text-muted">{m.testo}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="notte relative overflow-hidden">
        <FotoPiena foto="tagliere" velo="forte" />
        <div className="wrap relative grid gap-14 py-[var(--sezione)] lg:grid-cols-[1fr_1.3fr]">
          <Reveal>
            <p className="occhiello">La cucina</p>
            <h2 className="titolo mt-5 max-w-[12ch]">A Pescara, in {INDIRIZZO.via}.</h2>
            <p className="mt-6 max-w-[46ch] text-lg" style={{ color: "rgb(243 239 230 / .9)" }}>
              È da qui che partono i piatti ed è qui che si ritirano, con giorno e orario concordati con Matteo.
            </p>
            <a href={LINK_MAPPA} target="_blank" rel="noopener noreferrer" className="link mt-6 inline-block">
              {INDIRIZZO_RIGA}
              <span className="sr-only"> (apre Google Maps in una nuova scheda)</span>
            </a>
          </Reveal>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-12 self-end">
            {CIFRE.map((c, i) => (
              <Reveal key={c.etichetta} delay={i * 70} className="border-t-[3px] border-lime pt-5">
                <dt className="occhiello">{c.etichetta}</dt>
                <dd className="num mt-4 text-[clamp(48px,7vw,96px)] leading-none font-medium">{c.cifra}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      <section className="sezione">
        <div className="wrap">
          <Reveal>
            <p className="occhiello">I nostri valori</p>
            <h2 className="titolo mt-5 max-w-[14ch]">Quattro impegni che puoi verificare.</h2>
          </Reveal>
          <ul className="mt-14 grid gap-10 md:grid-cols-2 md:gap-x-16">
            {VALORI.map((v, i) => (
              <Reveal as="li" key={v.titolo} delay={(i % 2) * 80} className="border-t-[3px] border-ink pt-6">
                <span className="num text-sm text-muted">0{i + 1}</span>
                <h3 className="titolo-s mt-3">{v.titolo}</h3>
                <p className="mt-3 max-w-[52ch] text-lg text-muted">{v.testo}</p>
              </Reveal>
            ))}
          </ul>
          <p className="mt-12 max-w-[64ch] text-muted">
            Ogni scheda del{" "}
            <Link href="/menu" className="link">
              menu
            </Link>{" "}
            riporta ingredienti, allergeni e macro della porzione. Le foto dei piatti sono illustrative.
          </p>
        </div>
      </section>

      <section className="sezione carta-2">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <p className="occhiello">Per essere chiari</p>
            <h2 className="titolo mt-5 max-w-[12ch]">Cosa {NOME_ATTIVITA} non è.</h2>
          </Reveal>
          <ul className="border-t-[3px] border-ink">
            {NON_E.map((t, i) => (
              <Reveal as="li" key={t} delay={i * 70} className="flex gap-5 border-b border-ink/15 py-6 text-lg">
                <span className="num text-muted">0{i + 1}</span>
                <span>{t}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="sezione">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_2fr]">
          <Reveal>
            <p className="occhiello">Cosa facciamo</p>
            <h2 className="titolo-s mt-5 max-w-[16ch]">Quattro modi di mangiare {NOME_ATTIVITA}.</h2>
          </Reveal>
          <ul className="border-t-[3px] border-ink">
            {SERVIZI_PAGINA.map((s) => (
              <li key={s.href} className="border-b border-ink/15 py-5">
                <Link href={s.href} className="group block">
                  <span className="block font-disp text-lg font-semibold tracking-[.02em] uppercase group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
                    {s.titolo} <span aria-hidden="true" className="freccia">→</span>
                  </span>
                  <span className="mt-2 block max-w-[64ch] text-muted">{s.testo}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ChiusuraCta titolo="Conosci la cucina. Poi assaggia." />
    </>
  );
}
