import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import { AGGIORNAMENTO, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { nodiPagina } from "@/components/seo/schema";

const PAGINA = PAGINE.scheda;

export const metadata = metadatiPagina(PAGINA);

export default function SchedaPage() {
  return (
    <>
      <JsonLd
        dati={nodiPagina({
          percorso: PAGINA.percorso,
          nome: PAGINA.titolo,
          descrizione: PAGINA.descrizione,
          briciole: [{ nome: PAGINA.breve, href: PAGINA.percorso }],
          dataModifica: AGGIORNAMENTO,
        })}
      />
      <section className="testata">
        <div className="wrap">
          <h1>
            <span className="occhiello">Meal prep sui tuoi macro</span>{" "}
            <span className="titolo-xl mt-6 block max-w-[12ch]">Hai già una scheda?</span>
          </h1>
          <p className="lead mt-6">
            Matteo cucina il piano del tuo nutrizionista. Concordate ingredienti e quantità prima di iniziare.
          </p>
          <div className="mt-8 flex flex-wrap gap-5">
            <Link href="/abbonamento" className="btn btn-ink">Scegli un abbonamento →</Link>
            <Link href="/richiesta?servizio=sui-tuoi-macro#scrivi" className="link">Parlane con Matteo</Link>
          </div>
        </div>
      </section>
    </>
  );
}
