import { DIETE } from "@/lib/abbonamento";

/**
 * "Per ogni dieta": le cinque diete che Matteo cucina, in parole grandi.
 * Prende il colore dal contenitore, quindi sta bene sulla carta e sulla
 * notte (il quadratino lime e' una superficie, mai testo). `titolo` e' il
 * livello dell'intestazione: h3 sotto un h2 (pagina indice), h2 da solo (schede).
 */
export default function PerOgniDieta({ titolo: Titolo = "h3" }: { titolo?: "h2" | "h3" }) {
  return (
    <div>
      <Titolo className="occhiello">Per ogni dieta</Titolo>
      <ul className="abb-diete mt-6">
        {DIETE.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
      <p className="mt-6 max-w-[56ch] text-lg text-muted">Qualunque sia il piano, lo cuciniamo noi.</p>
    </div>
  );
}
