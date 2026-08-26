"use client";

/**
 * Barra macro con TACCA DEL TARGET.
 *
 * La tacca e' il punto: senza, una barra piena all'88% e una al 99% sembrano
 * entrambe "piena" e il pannello smette di raccontare lo scarto dal piano,
 * diventando un punteggio. Con la tacca, "178 / 180 g" si legge a colpo d'occhio
 * come "quasi in target" invece che come "fatto".
 *
 * Scala: il fondo della barra vale il 120% del target, cosi la tacca cade
 * sempre allo stesso posto (83.3%) su tutte le righe e disegna una verticale
 * continua che attraversa il pannello. Chi sfora resta dentro la barra fino a
 * +20%, e oltre viene bloccato al fondo con il riempimento che vira al bianco.
 */

const SCALA = 1.2;
export const POS_TACCA = (100 / SCALA).toFixed(4); // 83.3333%

export function MacroBar({
  etichetta,
  valore,
  target,
  unita = "g",
}: {
  etichetta: string;
  valore: number;
  target: number;
  unita?: string;
}) {
  const quota = target > 0 ? valore / target : 0;
  const riempimento = Math.max(0, Math.min(1, quota / SCALA));
  const oltre = quota > 1.02;

  return (
    <div className="mb-6 last:mb-0">
      <div className="mb-[11px] flex items-baseline justify-between gap-3">
        <span className="bar-l">{etichetta}</span>
        <span className="bar-v">
          <b>{Math.round(valore)}</b> / {Math.round(target)} {unita}
        </span>
      </div>
      <div
        className={`bar-track ${oltre ? "over" : ""}`}
        role="meter"
        aria-valuenow={Math.round(valore)}
        aria-valuemin={0}
        aria-valuemax={Math.round(target)}
        aria-label={`${etichetta}: ${Math.round(valore)} di ${Math.round(target)} ${unita}`}
      >
        <i style={{ ["--fx" as string]: riempimento }} />
        <span className="bar-tick" style={{ left: `${POS_TACCA}%` }} aria-hidden="true" />
      </div>
    </div>
  );
}

/**
 * Barra proporzionale P/C/G del singolo piatto.
 * Innesto dalla direzione "Freschezza Clinica": su una pagina da decine di piatti la
 * stringa "P 52 / C 68 / G 12" non si screma a colpo d'occhio, la forma si.
 */
export function MacroSplit({
  proteine,
  carboidrati,
  grassi,
  className = "",
}: {
  proteine: number;
  carboidrati: number;
  grassi: number;
  className?: string;
}) {
  // Peso calorico, non peso in grammi: 12 g di grassi rendono piu di 12 g di carboidrati
  // e la barra deve raccontare da dove arrivano le calorie.
  const p = proteine * 4;
  const c = carboidrati * 4;
  const g = grassi * 9;
  const tot = p + c + g || 1;
  return (
    <div
      className={`macrobar ${className}`}
      title={`Proteine ${proteine} g · Carboidrati ${carboidrati} g · Grassi ${grassi} g`}
    >
      <i style={{ flex: p / tot }} />
      <i style={{ flex: c / tot }} />
      <i style={{ flex: g / tot }} />
    </div>
  );
}
