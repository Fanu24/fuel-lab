import Link from "next/link";
import { Suspense } from "react";
import { PIATTI } from "@/lib/catalogo";
import MenuClient from "./MenuClient";
import PerLaTuaBox from "@/components/menu/PerLaTuaBox";
import ChiusuraCta from "@/components/home/ChiusuraCta";
import JsonLd from "@/components/seo/JsonLd";
import { AGGIORNAMENTO, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { ID, nodiPagina, nodoMenu } from "@/components/seo/schema";

const PAGINA = PAGINE.menu;

export const metadata = metadatiPagina(PAGINA);

export default function PaginaMenu() {
  return (
    <>
      {/* Il menu intero nei dati strutturati: sezioni per allenamento, ogni
          piatto con i suoi valori per porzione. */}
      <JsonLd
        dati={[
          ...nodiPagina({
            percorso: PAGINA.percorso,
            nome: PAGINA.titolo,
            descrizione: PAGINA.descrizione,
            tipo: "CollectionPage",
            briciole: [{ nome: PAGINA.breve, href: PAGINA.percorso }],
            mainEntity: { "@id": ID.menu },
            dataModifica: AGGIORNAMENTO,
          }),
          nodoMenu(PIATTI, PAGINA.descrizione),
        ]}
      />
      <section className="testata">
        <div className="wrap">
          <h1>
            <span className="occhiello">Meal prep a Pescara · il menu</span>
            <span className="titolo-xl mt-6 block max-w-[10ch]">Il menu.</span>
          </h1>
          <p className="lead mt-6">
            Sei piatti già composti. Ognuno ha i suoi grammi, i suoi macro e un motivo per stare nel piatto con gli
            altri ingredienti.
          </p>
          <p className="mt-4 max-w-[56ch] text-muted">
            Matteo li cucina ogni giorno a Pescara, e ogni giorno si ritirano in Via del Santuario o arrivano in zona.{" "}
            <Link href="/consegna-pasti-pescara" className="link">
              Ritiro e consegna
            </Link>
          </p>
        </div>
      </section>
      {/* useSearchParams vuole un confine di Suspense: senza, la pagina smette di
          essere statica e diventa dinamica per intero. */}
      <Suspense fallback={<div className="wrap min-h-[60vh]" />}>
        <MenuClient />
      </Suspense>
      <PerLaTuaBox />
      <ChiusuraCta
        titolo="Sai già cosa ti piace?"
        testo="Nel compositore scegli come ti alleni ogni giorno e i piatti si mettono da soli. Poi li sposti come vuoi."
      />
    </>
  );
}
