import Hero from "@/components/home/Hero";
import TrePassi from "@/components/home/TrePassi";
import Allenamento from "@/components/home/Allenamento";
import LaCucina from "@/components/home/LaCucina";
import PiattiScelti from "@/components/home/PiattiScelti";
import Abbonamento from "@/components/home/Abbonamento";
import ChiusuraCta from "@/components/home/ChiusuraCta";
import JsonLd from "@/components/seo/JsonLd";
import { AGGIORNAMENTO, IMMAGINE_OG, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { nodiPagina } from "@/components/seo/schema";

export const metadata = metadatiPagina(PAGINE.home);

/* La home e' solo composizione. La palestra comanda (hero, consigli per
   allenamento, sulla notte) e la cucina risponde (la cucina, i piatti, sulla
   carta). L'abbonamento sta subito dopo i piatti, come ha chiesto Matteo.
   Ogni sezione vive in components/home. */
export default function Home() {
  return (
    <>
      <JsonLd
        dati={nodiPagina({
          percorso: PAGINE.home.percorso,
          nome: PAGINE.home.titolo,
          descrizione: PAGINE.home.descrizione,
          immagine: IMMAGINE_OG.url,
          dataModifica: AGGIORNAMENTO,
        })}
      />
      <Hero />
      <TrePassi />
      <Allenamento />
      <LaCucina />
      <PiattiScelti />
      <Abbonamento />
      <ChiusuraCta />
    </>
  );
}
