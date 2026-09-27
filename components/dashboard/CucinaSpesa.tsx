"use client";

/* Scheda Spesa: gli ingredienti della ricetta base moltiplicati per le
   porzioni del giorno, divisi per reparto. Le spunte restano sul telefono
   (una lista per giorno), cosi' al supermercato si spunta e a casa si
   ritrova il segno. I pranzi in abbonamento entrano con il piatto indicato
   dal cliente; quelli ancora da comporre restano fuori, e la scheda lo dice. */

import { useMemo } from "react";
import type { Ordine } from "@/lib/api";
import { formattaPeso, formattaPezzi, listaSpesa, pranzoInAbbonamento } from "@/lib/produzione";
import { useSpunte } from "./CucinaMemoria";
import { Avviso } from "./ui";

type Voce = { id: string; nome: string; quantita?: string; dettaglio: string };

export default function CucinaSpesa({
  ordini,
  giorno,
  porzioni,
  abbonamenti = [],
}: {
  ordini: Ordine[];
  giorno: string;
  porzioni: number;
  abbonamenti?: Ordine[];
}) {
  const lista = useMemo(() => listaSpesa(ordini), [ordini]);
  const daComporre = abbonamenti.filter((o) => !pranzoInAbbonamento(o, giorno)).length;
  const contate = porzioni - daComporre;
  const { spunte, cambia, azzera } = useSpunte(`fuellab:cucina:spesa:${giorno}`);

  const gruppi: { id: string; titolo: string; nota?: string; voci: Voce[] }[] = [
    ...lista.reparti.map((r) => ({
      id: r.reparto,
      titolo: r.reparto,
      voci: r.voci.map((v) => ({ id: `g:${v.chiave}`, nome: v.nome, quantita: formattaPeso(v.grammi), dettaglio: v.piatti.join(" · ") })),
    })),
    ...(lista.pezzi.length
      ? [{
          id: "pezzi",
          titolo: "A pezzi",
          voci: lista.pezzi.map((v) => ({ id: `p:${v.chiave}`, nome: v.nome, quantita: formattaPezzi(v.quantita, v.unita), dettaglio: v.piatti.join(" · ") })),
        }]
      : []),
    ...(lista.qb.length
      ? [{
          id: "qb",
          titolo: "Quanto basta",
          nota: "Non si pesano: controlla che in dispensa ce ne sia abbastanza.",
          voci: lista.qb.map((v) => ({ id: `q:${v.chiave}`, nome: v.nome, dettaglio: v.piatti.join(" · ") })),
        }]
      : []),
  ];

  const tutte = gruppi.flatMap((g) => g.voci.map((v) => v.id));
  const prese = tutte.filter((id) => spunte.has(id)).length;

  return (
    <div className="cu-pagina grid gap-8">
      <Avviso tipo="info">
        Quantità della ricetta base per una porzione, moltiplicate per {contate} {contate === 1 ? "porzione" : "porzioni"}.
        Gli extra non sono compresi: li trovi contati nella scheda Piatti.
        {daComporre
          ? ` ${daComporre === 1 ? "Un pranzo in abbonamento è" : `${daComporre} pranzi in abbonamento sono`} ancora da comporre sulla scheda del cliente: aggiungi tu la spesa.`
          : ""}
      </Avviso>

      {lista.sconosciuti.length ? (
        <Avviso>
          Questi piatti non sono nel catalogo e mancano dalla spesa:{" "}
          {lista.sconosciuti.map((s) => `${s.nome} (${s.porzioni})`).join(", ")}.
        </Avviso>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="cu-conto" aria-live="polite">
          <strong className="num">{prese}</strong> di {tutte.length} voci già prese
        </p>
        <button type="button" className="btn btn-linea btn-sm" onClick={azzera} disabled={!prese}>
          Togli tutte le spunte
        </button>
      </div>

      <div className="cu-spesa-colonne">
        {gruppi.map((g) => (
          <section key={g.id} aria-labelledby={`cu-rep-${g.id.replace(/\W+/g, "-")}`} className="cu-reparto">
            <h3 id={`cu-rep-${g.id.replace(/\W+/g, "-")}`} className="cu-h3">
              {g.titolo}
            </h3>
            {g.nota ? <p className="cu-riga-nota mt-1">{g.nota}</p> : null}
            <ul className="cu-spesa">
              {g.voci.map((v) => {
                const preso = spunte.has(v.id);
                return (
                  <li key={v.id}>
                    <label className={`cu-spesa-riga ${preso ? "is-fatto" : ""}`}>
                      <input
                        type="checkbox"
                        className="cu-casella"
                        checked={preso}
                        onChange={(e) => cambia(v.id, e.target.checked)}
                      />
                      <span className="cu-spesa-testo">
                        <span className="cu-spesa-nome">{v.nome}</span>
                        <span className="cu-spesa-dettaglio">{v.dettaglio}</span>
                      </span>
                      {v.quantita ? <span className="cu-spesa-q num">{v.quantita}</span> : <span className="cu-spesa-q cu-spesa-qb">q.b.</span>}
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
