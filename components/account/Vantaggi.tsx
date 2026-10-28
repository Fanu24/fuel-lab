/* Perche' creare un account: la stessa lista sulla pagina di accesso e
   sull'invito dell'area cliente. Va sulla notte (usa text-steel). */

const VANTAGGI = [
  { titolo: "Salva la settimana", testo: "La ritrovi su telefono e computer, anche fra un mese." },
  { titolo: "Inviala a Matteo", testo: "Un tocco, con piatti, giorni e allenamenti già dentro." },
  { titolo: "Segui ogni passo", testo: "Confermata, in preparazione, pronta: lo vedi qui, coi messaggi di Matteo." },
  { titolo: "Nessun pagamento online", testo: "Prezzo e giorno li concordi con Matteo prima di tutto." },
];

/* Chi arriva per un abbonamento non compone niente: gli stessi vantaggi, senza piatti e settimana. */
const VANTAGGI_ABBONAMENTO = [
  { titolo: "Chiedi la formula", testo: "Scegli fra i cinque abbonamenti, in Standard o Plus, e inviane la richiesta." },
  { titolo: "Segui ogni passo", testo: "Confermata, in corso, conclusa: lo vedi qui, coi messaggi di Matteo." },
  { titolo: "Nessun pagamento online", testo: "Prezzo, inizio e consegna li concordi con Matteo prima di tutto." },
];

export default function Vantaggi({ className = "", abbonamento = false }: { className?: string; abbonamento?: boolean }) {
  const vantaggi = abbonamento ? VANTAGGI_ABBONAMENTO : VANTAGGI;
  return (
    <ul className={`acc-vantaggi ${className}`}>
      {vantaggi.map((v, i) => (
        <li key={v.titolo}>
          <span className="num acc-vantaggi-num" aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span>
            <strong className="block font-disp text-[15px] font-semibold tracking-[.06em] uppercase">{v.titolo}</strong>
            <span className="mt-1 block text-sm text-steel">{v.testo}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
