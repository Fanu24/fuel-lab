import type { TabellaArticolo } from "@/lib/blog";
import Testo from "./Testo";

/** Tabella di un articolo: la prima colonna fa da intestazione di riga. */
export default function Tabella({ tabella }: { tabella: TabellaArticolo }) {
  const larga = tabella.intestazioni.length > 3;
  return (
    <figure className="mt-7">
      <div className="overflow-x-auto">
        <table className={`w-full border-collapse text-left text-[15px] leading-snug ${larga ? "min-w-[640px]" : "min-w-[480px]"}`}>
          <thead>
            <tr className="border-b-[3px] border-ink">
              {tabella.intestazioni.map((intestazione) => (
                <th key={intestazione} scope="col" className="py-3 pr-4 align-bottom font-disp text-xs tracking-[.14em] uppercase last:pr-0">
                  {intestazione}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tabella.righe.map((riga) => (
              <tr key={riga.join("|")} className="border-b align-top" style={{ borderColor: "var(--line)" }}>
                {riga.map((cella, indice) =>
                  indice === 0 ? (
                    <th key={indice} scope="row" className="py-3 pr-4 font-semibold">
                      <Testo>{cella}</Testo>
                    </th>
                  ) : (
                    <td key={indice} className="py-3 pr-4 text-muted last:pr-0">
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
