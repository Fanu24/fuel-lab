import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import FotoPiena from "@/components/ui/FotoPiena";
import ChiusuraCta from "@/components/home/ChiusuraCta";
import { PIATTI } from "@/lib/catalogo";
import { FOTO, RITRATTO_MATTEO } from "@/lib/immagini";
import JsonLd from "@/components/seo/JsonLd";
import { AGGIORNAMENTO, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { ID, nodiPagina } from "@/components/seo/schema";
import { TITOLARE } from "@/lib/sito";

const PAGINA = PAGINE.chiEMatteo;

export const metadata = metadatiPagina(PAGINA);

/* La foto e' di repertorio finche' RITRATTO_MATTEO non viene fornito. */

const CIFRE = [
  { cifra: "2", etichetta: "Cotture a settimana" },
  { cifra: String(PIATTI.length), etichetta: "Piatti in rotazione" },
  { cifra: "PE", etichetta: "La nostra zona" },
];

const NON_E = [
  "Non è una dieta. I numeri li decide il tuo nutrizionista, Matteo li cucina.",
  "Non è un integratore, un percorso o una consulenza.",
  "Non è cibo da palestra triste. Se non lo mangeresti a cena, ha sbagliato lui.",
];

export default function ChiEMatteo() {
  const ritratto = RITRATTO_MATTEO ?? FOTO.cuoco;
  return (
    <>
      {/* AboutPage su Matteo (il nodo Person sta nel grafo del layout). */}
      <JsonLd
        dati={nodiPagina({
          percorso: PAGINA.percorso,
          nome: PAGINA.titolo,
          descrizione: PAGINA.descrizione,
          tipo: "AboutPage",
          briciole: [{ nome: PAGINA.breve, href: PAGINA.percorso }],
          mainEntity: { "@id": ID.matteo },
          dataModifica: AGGIORNAMENTO,
        })}
      />
      <section className="testata">
        <div className="wrap grid items-end gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <h1>
              <span className="occhiello">Chi è {TITOLARE.nome}</span>
              <span className="titolo-xl mt-6 block">Matteo.</span>
            </h1>
            <p className="titolo-s mt-4 text-muted">Cucina a Pescara.</p>
            <p className="lead mt-8">
              FUEL LAB è il laboratorio di Matteo Pattanè a Pescara: cucina fresca due volte a settimana per chi si
              allena, con i macro scritti su ogni piatto.
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
            {!RITRATTO_MATTEO ? <figcaption className="absolute right-3 bottom-3 bg-paper px-3 py-1 text-xs text-ink">Foto illustrativa</figcaption> : null}
          </figure>
        </div>
      </section>

      <section className="sezione">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <h2 className="titolo max-w-[12ch]">Il menu parte dalla cucina.</h2>
          </Reveal>
          <Reveal delay={80} className="grid gap-6 text-lg leading-relaxed">
            <p>
              FUEL LAB propone piatti da inserire nella tua settimana: consulta ingredienti e valori pubblicati,
              scegli ciò che ti piace e costruisci una bozza dei pasti nei giorni più impegnativi.
            </p>
            <p>
              Il sito indica preparazioni e consegne il lunedì e il giovedì. Matteo conferma direttamente piatti,
              disponibilità e copertura del tuo indirizzo prima di qualsiasi ordine. Se hai domande su ingredienti o
              conservazione, scrivigli prima di scegliere.
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

      <section className="notte relative overflow-hidden">
        <FotoPiena foto="presa" velo="forte" />
        <div className="wrap relative py-[var(--sezione)]">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3">
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
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <p className="occhiello">Per essere chiari</p>
            <h2 className="titolo mt-5 max-w-[12ch]">Cosa FUEL LAB non è.</h2>
          </Reveal>
          <ul>
            {NON_E.map((t, i) => (
              <Reveal
                as="li"
                key={t}
                delay={i * 70}
                className="flex gap-5 border-b border-ink/15 py-6 text-lg"
              >
                <span className="num text-muted">0{i + 1}</span>
                <span>{t}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <ChiusuraCta titolo="Conosci Matteo. Poi assaggia." />
    </>
  );
}
