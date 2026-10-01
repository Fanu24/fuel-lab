import Link from "next/link";

/**
 * La chiusura di ogni pagina del blog: dalla lettura al piatto. Compositore
 * prima, menu dopo, servizi come terza strada. Nessun "ordina ora": l’ordine
 * si conferma sempre con Matteo.
 */
export default function ChiusuraBlog({
  titolo = "Dalla guida al piatto.",
  testo = "Segna come ti alleni giorno per giorno: la settimana si compone con i piatti del menu, la ritocchi e la mandi a Matteo. Ritiro in Via del Santuario 214 a Pescara, consegna in zona da confermare.",
}: {
  titolo?: string;
  testo?: string;
}) {
  return (
    <section className="notte">
      <div className="wrap py-[var(--sezione)]">
        <p className="occhiello">FUEL LAB · Pescara</p>
        <h2 className="titolo mt-6 max-w-[16ch]">{titolo}</h2>
        <p className="lead mt-6 max-w-[58ch]">{testo}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/settimana" className="btn btn-lime">
            Componi la settimana <span aria-hidden="true" className="freccia">→</span>
          </Link>
          <Link href="/menu" className="btn btn-linea">
            Guarda il menu
          </Link>
        </div>
        <p className="mt-8 text-sm text-muted">
          Hai già i numeri del tuo nutrizionista?{" "}
          <Link href="/scheda" className="font-semibold text-paper underline decoration-2 underline-offset-4 hover:decoration-lime">
            Componi sui tuoi macro
          </Link>{" "}
          oppure scopri{" "}
          <Link href="/servizi" className="font-semibold text-paper underline decoration-2 underline-offset-4 hover:decoration-lime">
            tutti i servizi
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
