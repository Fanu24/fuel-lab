import { EMAIL_CONTATTI, linkEmail } from "@/lib/contatto";
import StradaAccount from "./StradaAccount";

/* Le tre strade per arrivare a Matteo, in ordine di utilita' per lui: la
   settimana dall'account (piatti e giorni gia' strutturati), il modulo senza
   account, l'email diretta. Solo la prima dipende dal browser. */

export default function StradeContatto({ whatsappAttivo }: { whatsappAttivo: boolean }) {
  return (
    <section aria-labelledby="strade-titolo" className="pb-[var(--sezione)]">
      <div className="wrap">
        <h2 id="strade-titolo" className="sr-only">
          Tre modi per contattare Matteo
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          <StradaAccount />

          <article className="carta-2 flex flex-col p-6 md:p-8" aria-labelledby="strada-modulo">
            <p className="occhiello">
              <span className="num">02</span> · Senza account
            </p>
            <h3 id="strada-modulo" className="titolo-s mt-6">
              Scrivi un messaggio.
            </h3>
            <p className="mt-4 text-muted">
              Due righe su cosa ti serve e un recapito, email o telefono. Se hai già composto la settimana, puoi
              allegarla con un clic.
            </p>
            <div className="mt-auto pt-8">
              <a href="#scrivi" className="btn btn-ink w-full whitespace-normal text-center">
                Vai al modulo <span aria-hidden="true">↓</span>
              </a>
            </div>
          </article>

          <article
            className="flex flex-col border-2 p-6 md:col-span-2 md:p-8 lg:col-span-1"
            style={{ borderColor: "var(--line)" }}
            aria-labelledby="strada-diretta"
          >
            <p className="occhiello">
              <span className="num">03</span> · Diretto
            </p>
            <h3 id="strada-diretta" className="titolo-s mt-6">
              {whatsappAttivo ? "Email o WhatsApp." : "Email diretta."}
            </h3>
            <p className="mt-4 text-muted">
              Preferisci la tua casella di posta? Scrivi il comune e cosa ti interessa: la risposta arriva lì.
            </p>
            <p className="mt-5 font-disp text-xl font-bold break-words">
              <a href={`mailto:${EMAIL_CONTATTI}`} className="link">
                {EMAIL_CONTATTI}
              </a>
            </p>
            <div className="mt-auto flex flex-col gap-3 pt-8">
              <a
                href={linkEmail("Informazioni da fuelchef.it")}
                className="btn btn-linea w-full whitespace-normal text-center"
              >
                Scrivi un’email
              </a>
              {whatsappAttivo ? (
                <a href="#whatsapp" className="btn btn-whatsapp w-full whitespace-normal text-center">
                  WhatsApp <span aria-hidden="true">↓</span>
                </a>
              ) : (
                <p className="text-sm text-muted">WhatsApp arriva presto: intanto il modulo e l’email ti rispondono.</p>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
