"use client";

/**
 * Il marquee della pagina. Uno solo, mai due.
 *
 * Il nastro contiene DUE copie identiche della sequenza e scorre di -50%:
 * al termine dell'animazione la seconda copia si trova esattamente dove stava
 * la prima, quindi il salto e' invisibile senza bisogno di misurare la larghezza.
 */
export default function Ticker({
  parole,
  durata = 34,
}: {
  parole: string[];
  durata?: number;
}) {
  const set = (
    <div className="flex flex-none items-center">
      {parole.map((p, i) => (
        <span key={i} className="flex flex-none items-center">
          <span className={`tk-w ${i % 2 ? "out" : ""}`}>{p}</span>
          <i className="tk-d" aria-hidden="true" />
        </span>
      ))}
    </div>
  );

  return (
    <div
      className="overflow-hidden border-y py-[26px]"
      style={{
        borderColor: "var(--hair)",
        background: "rgba(223,255,62,.035)",
        maskImage: "linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent)",
        WebkitMaskImage: "linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent)",
      }}
      aria-hidden="true"
    >
      <div
        className="flex w-max"
        style={{
          willChange: "transform",
          animation: `fuel-marquee ${durata}s linear infinite`,
        }}
      >
        {set}
        {set}
      </div>
    </div>
  );
}
