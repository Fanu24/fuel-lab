import Link from "next/link";
import { PIATTI } from "@/lib/catalogo";
import MenuClient from "./MenuClient";
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
            <span className="occhiello">Meal prep a Pescara · il menu</span>{" "}
            <span className="titolo-xl mt-6 block max-w-[10ch]">Il menu.</span>
          </h1>
          <p className="lead mt-6">
            Scegli un piatto e aggiungilo alla tua settimana.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-7 gap-y-3"><Link href="/settimana" className="link">Vedi la tua settimana →</Link><a href="#snack" className="link">Anche uno snack ↓</a></div>
        </div>
      </section>
      {/* Piatti e snack sono già nell’HTML esportato, comprese le nuove proposte. */}
      <MenuClient />
    </>
  );
}
