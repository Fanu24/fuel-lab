import Image from "next/image";
import MappaSede from "@/components/ui/MappaSede";
import ChiusuraCta from "@/components/home/ChiusuraCta";
import Reveal from "@/components/Reveal";
import GalleriaCucina from "@/components/chi-siamo/GalleriaCucina";
import Briciole from "@/components/seo/Briciole";
import JsonLd from "@/components/seo/JsonLd";
import { PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { ID, nodiPagina } from "@/components/seo/schema";
import { RITRATTO_MATTEO } from "@/lib/immagini";
import { INDIRIZZO_RIGA, LINK_MAPPA, NOME_ATTIVITA, TITOLARE } from "@/lib/sito";

const PAGINA = PAGINE.chiSiamo;
export const metadata = metadatiPagina(PAGINA);

export default function ChiSiamo() {
  const briciole = [{ nome: PAGINA.breve, href: PAGINA.percorso }];
  return (
    <>
      <JsonLd dati={nodiPagina({
        percorso: PAGINA.percorso, nome: PAGINA.titolo, descrizione: PAGINA.descrizione,
        tipo: "AboutPage", briciole, about: { "@id": ID.organizzazione },
        mainEntity: { "@id": ID.organizzazione }, mentions: [{ "@id": ID.matteo }, { "@id": ID.cucina }],
        immagine: RITRATTO_MATTEO.src, dataModifica: "2026-10-08",
      })} />
      <section className="testata">
        <div className="wrap">
          <Briciole voci={briciole} />
          <div className="mt-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <h1><span className="occhiello">Chi siamo · Pescara</span><span className="titolo-xl mt-6 block max-w-[12ch]">Piacere, Matteo.</span></h1>
              <p className="lead mt-6 max-w-[38ch]">{TITOLARE.nome}, cuoco e fondatore di {NOME_ATTIVITA}. Cucina fresca per chi si allena.</p>
              <div className="mt-8 max-w-[46ch] border-t border-ink/15 pt-6">
                <p className="occhiello">Il suo percorso</p>
                <p className="mt-3 text-muted">
                  Diplomato ad <strong className="font-semibold text-ink">ALMA</strong>, scuola di cucina, ha lavorato nella cucina dell&apos;<strong className="font-semibold text-ink">Inter</strong> e trascorso un anno a Milano come <strong className="font-semibold text-ink">chef privato per VIP e calciatori</strong>. Oggi porta questa esperienza in FUEL LAB.
                </p>
              </div>
            </div>
            <figure className="smusso relative aspect-[4/5] overflow-hidden bg-paper-2">
              <Image src={RITRATTO_MATTEO.src} alt={RITRATTO_MATTEO.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" loading="eager" fetchPriority="high" className="object-cover" style={{ objectPosition: RITRATTO_MATTEO.fuoco }} />
            </figure>
          </div>
        </div>
      </section>
      <GalleriaCucina />
      <section className="sezione">
        <div className="wrap grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h2 className="titolo max-w-[16ch]">Ci trovi a Pescara.</h2>
            <a href={LINK_MAPPA} target="_blank" rel="noopener noreferrer" className="link mt-6 inline-block">{INDIRIZZO_RIGA}<span className="sr-only"> (apre Google Maps in una nuova scheda)</span></a>
            <p className="mt-5 text-muted">Ritiro o consegna, con giorno e orario concordati.</p>
          </Reveal>
          <Reveal delay={80}><MappaSede /></Reveal>
        </div>
      </section>
      <div id="matteo" className="scroll-mt-24">
        <ChiusuraCta titolo="Dalla spesa al piatto." testo="Matteo sceglie gli ingredienti, cucina e prepara le porzioni. Quando scrivi, parli direttamente con lui." />
      </div>
    </>
  );
}
