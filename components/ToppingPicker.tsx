"use client";

import { EXTRA, REPARTI, extraImg } from "@/lib/catalogo";

/**
 * Le aggiunte della box, attaccate al piatto della casella.
 * Raggruppate per reparto: il catalogo ne ha una quarantina, e una lista
 * piatta le rende illeggibili sia sulla scheda del piatto sia nel selettore.
 */
export default function ToppingPicker({
  selezionati,
  onToggle,
  disabilitato = false,
  compatto = false,
}: {
  selezionati: string[];
  onToggle: (id: string) => void;
  disabilitato?: boolean;
  compatto?: boolean;
}) {
  const gruppi = REPARTI.map((r) => ({
    id: r.id,
    label: r.label,
    lista: EXTRA.filter((x) => x.reparto === r.id),
  })).filter((g) => g.lista.length > 0);

  if (gruppi.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {gruppi.map((g) => (
        <div key={g.id} role="group" aria-label={g.label}>
          <p className="note mb-2">{g.label}</p>
          <ul className="flex flex-wrap gap-1.5">
            {g.lista.map((x) => {
              const on = selezionati.includes(x.id);
              return (
                <li key={x.id} className="min-w-0">
                  <button
                    type="button"
                    aria-pressed={on}
                    disabled={disabilitato}
                    onClick={() => onToggle(x.id)}
                    title={`${x.nome}, ${x.kcal} kcal`}
                    className="topping"
                    data-on={on ? "true" : "false"}
                    data-compatto={compatto ? "true" : undefined}
                  >
                    {compatto ? null : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={extraImg(x, 80)} alt="" width={28} height={28} />
                    )}
                    <span className="topping-n">{x.nome}</span>
                    <span className="topping-k">{x.kcal}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
