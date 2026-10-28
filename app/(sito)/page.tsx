import Hero from "@/components/home/Hero";
import TrePassi from "@/components/home/TrePassi";
import LaCucina from "@/components/home/LaCucina";
import PiattiScelti from "@/components/home/PiattiScelti";
import Abbonamento from "@/components/home/Abbonamento";

import JsonLd from "@/components/seo/JsonLd";
import { AGGIORNAMENTO, IMMAGINE_OG, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { nodiPagina } from "@/components/seo/schema";

export const metadata = metadatiPagina(PAGINE.home);

/* Prima gli abbonamenti, poi la settimana libera; menu e cucina completano la pagina. */
export default function Home() {
  return (
    <>
      <JsonLd
        dati={nodiPagina({
          percorso: PAGINE.home.percorso,
          nome: PAGINE.home.titolo,
          descrizione: PAGINE.home.descrizione,
          immagine: IMMAGINE_OG.url,
          dataModifica: PAGINE.home.aggiornamento ?? AGGIORNAMENTO,
        })}
      />
      <Hero />
      <Abbonamento />
      <TrePassi />
      <PiattiScelti />
      <LaCucina />
    </>
  );
}
