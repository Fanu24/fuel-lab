import { tabellaBreve, type TabellaArticolo } from "@/lib/blog";
import Testo from "./Testo";

/**
 * Tabella di un articolo: la prima colonna fa da intestazione di riga. Le celle
 * brevi restano in colonne; le altre, sotto i 640px, diventano una scheda per
 * riga (etichetta della colonna sopra ogni cella) invece di scorrere di lato:
 * a 390px una colonna tagliata a metà non si legge. Le regole sono in
 * app/styles/blog.css. Quando la tabella è a schede il display dei suoi
 * elementi cambia, e alcuni browser perdono la semantica di tabella: per questo
 * i ruoli sono scritti a mano.
 */
export default function Tabella({ tabella, titolo }: { tabella: TabellaArticolo; titolo: string }) {
  const schede = !tabellaBreve(tabella);
  const ruolo = (nome: string) => (schede ? { role: nome } : {});
  return (
    <figure className="mt-7">
      <div className="overflow-x-auto">
        <table className={schede ? "blog-tabella blog-tabella-schede" : "blog-tabella"} {...ruolo("table")}>
          <caption className="sr-only">{titolo}</caption>
          <thead>
            <tr {...ruolo("row")}>
              {tabella.intestazioni.map((intestazione) => (
                <th key={intestazione} scope="col" {...ruolo("columnheader")}>
                  <Testo>{intestazione}</Testo>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tabella.righe.map((riga) => (
              <tr key={riga.join("|")} {...ruolo("row")}>
                {riga.map((cella, indice) =>
                  indice === 0 ? (
                    <th key={indice} scope="row" {...ruolo("rowheader")}>
                      <Testo>{cella}</Testo>
                    </th>
                  ) : (
                    <td key={indice} data-label={tabella.intestazioni[indice]} {...ruolo("cell")}>
                      <Testo>{cella}</Testo>
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tabella.nota ? <figcaption className="mt-3 text-sm text-muted">{tabella.nota}</figcaption> : null}
    </figure>
  );
}
