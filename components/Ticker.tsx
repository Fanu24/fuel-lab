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
          {/* la classe "out" che stava qui non esisteva in nessun foglio: era un
              residuo della direzione scura e non disegnava niente */}
          <span className="tk-w">{p}</span>
          <i className="tk-d" aria-hidden="true" />
        </span>
      ))}
    </div>
  );

  /*
   * IL NASTRO E' UNA FASCIA LIME, non un velo.
   *
   * Il fondo era rgba(223,255,62,.035): sul nero di prima quel tre per cento si
   * vedeva, sulla carta e' zero. Il nastro finiva per essere due filetti sottili
   * su carta, cioe' un'altra sezione dello stesso identico colore in una pagina
   * che ne aveva gia' troppe. .ticker esiste in globals.css da sempre - lime
   * pieno, testo inchiostro, 12.61:1 - ed era rimasta scollegata dal componente
   * che l'aveva chiesta: qui si ricollega, e il nastro torna a fare il lavoro
   * per cui sta in pagina, cioe' respiro acido fra due sezioni.
   *
   * La maschera che sfuma le parole ai lati passa dal contenitore al NASTRO
   * interno: su un fondo pieno sfumerebbe anche il lime, e la fascia
   * finirebbe con due estremita' slavate invece che con due tagli netti.
   */
  return (
    <div className="ticker" aria-hidden="true">
      {/* flex-none: .ticker adesso e' un contenitore flex, e senza questo il
          nastro - che deve essere piu' largo del viewport - si lascerebbe
          stringere fino a starci dentro e l'animazione girerebbe a vuoto. */}
      <div
        className="flex w-max flex-none"
        style={{
          willChange: "transform",
          animation: `fuel-marquee ${durata}s linear infinite`,
          maskImage: "linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent)",
          WebkitMaskImage: "linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent)",
        }}
      >
        {set}
        {set}
      </div>
    </div>
  );
}
