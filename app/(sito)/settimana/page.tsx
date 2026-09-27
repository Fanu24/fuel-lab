import { Suspense } from "react";
import SettimanaClient from "./SettimanaClient";
import JsonLd from "@/components/seo/JsonLd";
import { AGGIORNAMENTO, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { nodiPagina } from "@/components/seo/schema";

const PAGINA = PAGINE.settimana;

/* La pagina vive sul piano (localStorage, eventi, query string), quindi il corpo
   e' un client component: qui resta il metadata, che un client component non
   puo' esportare. */
export const metadata = metadatiPagina(PAGINA);

/* Il confine di Suspense serve a useSearchParams (il link condiviso): senza,
   la build fallisce. Il segnaposto tiene il posto e non fa saltare il layout. */
function Attesa() {
  return <div className="testata wrap min-h-[80vh]" aria-busy="true" />;
}

export default function SettimanaPage() {
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
      <Suspense fallback={<Attesa />}>
        <SettimanaClient />
      </Suspense>
    </>
  );
}
