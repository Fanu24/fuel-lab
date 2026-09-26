import type { Macros } from "@/lib/types";

/**
 * I macro di un piatto: quattro numeri e una barra sola divisa in tre.
 *
 * La barra mostra la COMPOSIZIONE (quanta energia viene da proteine,
 * carboidrati e grassi), non una quantita': e' il dato che serve per capire
 * se un piatto e' da cardio o da pesi senza leggere i grammi.
 */
export function quote(m: Macros) {
  const p = m.proteine * 4;
  const c = m.carboidrati * 4;
  const g = m.grassi * 9;
  const tot = p + c + g || 1;
  return { p: p / tot, c: c / tot, g: g / tot };
}

export function BarraComposizione({ macro, className = "" }: { macro: Macros; className?: string }) {
  const q = quote(macro);
  return (
    <div
      className={`flex h-2 w-full gap-[2px] ${className}`}
      role="img"
      aria-label={`Energia: ${Math.round(q.p * 100)}% proteine, ${Math.round(q.c * 100)}% carboidrati, ${Math.round(q.g * 100)}% grassi`}
    >
      <span style={{ flexGrow: q.p }} className="bg-current" />
      <span style={{ flexGrow: q.c }} className="bg-lime" />
      <span style={{ flexGrow: q.g }} className="bg-current opacity-30" />
    </div>
  );
}

export function NumeriMacro({
  macro,
  compatti = false,
  className = "",
}: {
  macro: Macros;
  compatti?: boolean;
  className?: string;
}) {
  const voci = [
    { k: "kcal", v: macro.kcal, u: "" },
    { k: "Prot", v: macro.proteine, u: "g" },
    { k: "Carbo", v: macro.carboidrati, u: "g" },
    { k: "Grassi", v: macro.grassi, u: "g" },
  ];
  return (
    <dl className={`grid grid-cols-4 gap-2 ${className}`}>
      {voci.map((x) => (
        <div key={x.k}>
          <dt className="font-disp text-[11px] font-semibold tracking-[.16em] text-muted uppercase">{x.k}</dt>
          <dd className={`num ${compatti ? "text-base" : "text-xl md:text-2xl"} font-medium`}>
            {Math.round(x.v)}
            <span className="text-[0.6em] text-muted">{x.u}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
