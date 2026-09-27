import Link from "next/link";
import { EMAIL_CONTATTI, INDIRIZZO, linkMappa } from "@/lib/contatto";

/* Dove siamo e le domande che arrivano sempre prima del primo ordine. Niente
   orari inventati: il ritiro si concorda con Matteo, e si cucina e si consegna
   ogni giorno, come il sito dichiara ovunque (lib/sito.ts). */

const DOMANDE_CONTATTI: { domanda: string; risposta: React.ReactNode }[] = [
  {
    domanda: "Serve un account per scrivere a Matteo?",
    risposta: (
      <>
        No: il modulo e l’email funzionano anche senza. L’account serve quando vuoi inviare la settimana con piatti e
        giorni e seguire la richiesta fino alla conferma.
      </>
    ),
  },
  {
    domanda: "Quanto ci mette a rispondere?",
    risposta: (
      <>
        Di solito entro un giorno lavorativo. Nelle settimane più piene può volerci qualche ora in più: se è urgente,
        scrivilo nel messaggio.
      </>
    ),
  },
  {
    domanda: "Posso ritirare in sede?",
    risposta: (
      <>
        Sì, in {INDIRIZZO.via} a {INDIRIZZO.comune}. Giorno e orario del ritiro si fissano con Matteo quando conferma la
        richiesta.
      </>
    ),
  },
  {
    domanda: "Consegnate a casa mia?",
    risposta: (
      <>
        La consegna è in zona Pescara, tutti i giorni. Scrivi il tuo comune: Matteo ti conferma se il tuo indirizzo è
        coperto e in quale giorno può arrivare.
      </>
    ),
  },
  {
    domanda: "Si paga online?",
    risposta: (
      <>
        No. Sul sito non si paga niente: prezzo, giorni e modalità si confermano con Matteo prima che si metta ai
        fornelli. Trovi le soglie di prezzo in{" "}
        <Link href="/servizi" className="link">
          Servizi e prezzi
        </Link>
        .
      </>
    ),
  },
];

export default function DoveSiamo() {
  return (
    <section aria-labelledby="dove-titolo" className="pb-[var(--sezione)]">
      <div className="wrap grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-20">
        <div className="self-start bg-paper-2 p-6 md:p-10">
          <p className="occhiello">Dove siamo</p>
          <h2 id="dove-titolo" className="titolo-s mt-5">
            La cucina è a Pescara.
          </h2>
          <address className="mt-6 text-lg leading-snug not-italic">
            <strong className="font-semibold">FUEL LAB · Matteo Pattanè</strong>
            <br />
            {INDIRIZZO.via}
            <br />
            {INDIRIZZO.cap} {INDIRIZZO.comune} ({INDIRIZZO.provincia})
          </address>
          <dl className="mt-7 grid gap-5 border-t pt-6" style={{ borderColor: "var(--line)" }}>
            <div>
              <dt className="font-disp text-xs font-semibold tracking-[.18em] uppercase">Ritiro in sede</dt>
              <dd className="mt-1 text-muted">Su accordo: giorno e orario li fissi con Matteo.</dd>
            </div>
            <div>
              <dt className="font-disp text-xs font-semibold tracking-[.18em] uppercase">Si cucina</dt>
              <dd className="mt-1 text-muted">Ogni giorno, fresco e mai surgelato. Si consegna ogni giorno.</dd>
            </div>
            <div>
              <dt className="font-disp text-xs font-semibold tracking-[.18em] uppercase">Email</dt>
              <dd className="mt-1 break-words">
                <a href={`mailto:${EMAIL_CONTATTI}`} className="link">
                  {EMAIL_CONTATTI}
                </a>
              </dd>
            </div>
          </dl>
          <a
            href={linkMappa()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ink mt-8 w-full whitespace-normal text-center sm:w-auto"
          >
            Apri in Google Maps <span aria-hidden="true">↗</span>
            <span className="sr-only"> (si apre in una nuova scheda)</span>
          </a>
        </div>

        <div>
          <p className="occhiello">Prima di scrivere</p>
          <h2 className="titolo-s mt-5">Le domande di chi scrive per la prima volta.</h2>
          <dl className="mt-8">
            {DOMANDE_CONTATTI.map((d) => (
              <div key={d.domanda} className="border-t border-ink/15 py-6 first:border-t-[3px] first:border-ink">
                <dt className="text-lg font-semibold">{d.domanda}</dt>
                <dd className="mt-2 leading-relaxed text-muted">{d.risposta}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
