import { AGGIORNAMENTO, dataLeggibile } from "./pagine";

/**
 * La riga "Pagina aggiornata il ...": la data che sta gia' nei dati strutturati
 * e in sitemap (AGGIORNAMENTO) la legge anche chi guarda la pagina. Prezzi, zone
 * e giorni li conferma comunque Matteo: la riga lo ricorda.
 */
export default function Aggiornato({ className = "" }: { className?: string }) {
  return (
    <p className={`text-sm text-muted ${className}`}>
      Pagina aggiornata il <time dateTime={AGGIORNAMENTO}>{dataLeggibile(AGGIORNAMENTO)}</time>. Prezzi, zone e giorni li
      conferma sempre Matteo.
    </p>
  );
}
