import SettimanaClient from "./SettimanaClient";
import JsonLd from "@/components/seo/JsonLd";
import { AGGIORNAMENTO, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { nodiPagina } from "@/components/seo/schema";

const PAGINA = PAGINE.settimana;

/* La pagina vive sul piano (localStorage, eventi, query string), quindi il corpo
   e' un client component: qui resta il metadata, che un client component non
   puo' esportare, e il titolo, che sta nell'HTML anche prima dell'idratazione.
   Il compositore si disegna gia' sul server con la settimana vuota; il browser
   ci mette sopra quella salvata. */
export const metadata = metadatiPagina(PAGINA);

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
      {/* Su schermi larghi titolo e testo stanno affiancati: cosi' il passo 1,
          fino a "Riempi la settimana", entra nella prima schermata sopra la barra. */}
      <section className="testata !pb-8 lg:!pb-6">
        <div className="wrap lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
          <h1>
            <span className="occhiello">Piatti pronti a Pescara</span>{" "}
            <span className="titolo mt-5 block max-w-[14ch]">Componi la tua settimana.</span>
          </h1>
          <p className="lead mt-6 lg:mt-0">
            Scegli il giorno, aggiungi un piatto e continua. Matteo conferma la tua richiesta.
          </p>
        </div>
      </section>
      <SettimanaClient />
    </>
  );
}

