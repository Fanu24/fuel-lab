import type { Metadata } from "next";
import { Suspense } from "react";
import ComposerWhatsApp, { ComposerWhatsAppDaQuery } from "@/components/contatto/ComposerWhatsApp";
import DoveSiamo from "@/components/contatto/DoveSiamo";
import ModuloContatto, { ModuloContattoDaQuery } from "@/components/contatto/ModuloContatto";
import StradeContatto from "@/components/contatto/StradeContatto";
import { EMAIL_CONTATTI, INDIRIZZO } from "@/lib/contatto";
import { URL_SITO } from "@/lib/sito";
import { numeroConfigurato } from "@/lib/whatsapp";

/* L'hub dei contatti. Tre strade (account, modulo, email), poi il modulo, poi
   dove siamo. Il guscio e i testi nascono sul server; nel browser vivono solo
   le parti che leggono il piano, l'accesso o la query string.

   ?servizio= (o ?argomento=) preseleziona l'argomento del modulo: lo legge
   useSearchParams, quindi il modulo sta dentro <Suspense>. Il fallback e' lo
   stesso modulo con l'argomento di partenza: nell'HTML statico c'e' gia' il
   form vero, e quando arriva quello con la query string non si sposta nulla. */

const DESCRIZIONE =
  "Scrivi a Matteo di FUEL LAB, meal prep fresco a Pescara: invia la settimana dal tuo account, usa il modulo senza registrarti o l’email. Ritiro in sede.";

export const metadata: Metadata = {
  title: "Contatti e richieste · Meal prep a Pescara",
  description: DESCRIZIONE,
  alternates: { canonical: "/richiesta" },
  openGraph: {
    type: "website",
    url: "/richiesta",
    title: "Contatti e richieste · FUEL LAB",
    description: DESCRIZIONE,
    images: [{ url: "/opengraph-image.jpg", width: 1200, height: 630, alt: "FUEL LAB · Meal prep a Pescara" }],
  },
};

const PASSI = [
  { titolo: "Matteo legge", testo: "Ogni messaggio arriva a lui, non a un centralino." },
  { titolo: "Ti risponde", testo: "Di solito entro un giorno lavorativo, per email o per telefono." },
  { titolo: "Confermate insieme", testo: "Piatti, prezzo, giorno e ritiro o consegna. Nessun pagamento online." },
];

export default function RichiestaPage() {
  const whatsappAttivo = numeroConfigurato();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${URL_SITO}/richiesta#pagina`,
    url: `${URL_SITO}/richiesta`,
    name: "Contatti e richieste · FUEL LAB",
    description: DESCRIZIONE,
    inLanguage: "it-IT",
    isPartOf: { "@type": "WebSite", name: "FUEL LAB", url: URL_SITO },
    mainEntity: {
      "@type": "Organization",
      "@id": `${URL_SITO}/#organization`,
      name: "FUEL LAB",
      url: URL_SITO,
      email: EMAIL_CONTATTI,
      address: {
        "@type": "PostalAddress",
        streetAddress: INDIRIZZO.via,
        postalCode: INDIRIZZO.cap,
        addressLocality: INDIRIZZO.comune,
        addressRegion: INDIRIZZO.provincia,
        addressCountry: INDIRIZZO.paese,
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: EMAIL_CONTATTI,
        url: `${URL_SITO}/richiesta`,
        areaServed: "IT",
        availableLanguage: ["Italian"],
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <section className="testata">
        <div className="wrap">
          <p className="occhiello">Contatti</p>
          <h1 className="titolo-xl mt-6 max-w-[12ch]">Scrivi a Matteo.</h1>
          <p className="lead mt-6">
            Tre strade, una persona che risponde: scegli la più comoda. Nessun pagamento online, prezzo e giorni si
            confermano con Matteo prima di cucinare.
          </p>
        </div>
      </section>

      <StradeContatto whatsappAttivo={whatsappAttivo} />

      <section id="scrivi" aria-labelledby="scrivi-titolo" className="scroll-mt-[calc(var(--nav-h)+16px)] pb-[var(--sezione)]">
        <div className="wrap grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-20">
          <div className="min-w-0">
            <p className="occhiello">Il modulo</p>
            <h2 id="scrivi-titolo" className="titolo mt-5 max-w-[14ch]">
              Scrivi, senza account.
            </h2>
            <p className="lead mt-5 mb-10">
              Il messaggio arriva direttamente a Matteo. Se hai composto la settimana su questo dispositivo, puoi
              allegarla.
            </p>
            <noscript>
              <p className="mb-6 border-l-4 border-ink bg-paper-2 p-4">
                Per inviare il modulo serve JavaScript. In alternativa scrivi a{" "}
                <a href={`mailto:${EMAIL_CONTATTI}`} className="link">
                  {EMAIL_CONTATTI}
                </a>
                .
              </p>
            </noscript>
            <Suspense fallback={<ModuloContatto />}>
              <ModuloContattoDaQuery />
            </Suspense>
          </div>

          <aside aria-labelledby="dopo-titolo" className="self-start lg:sticky lg:top-[calc(var(--nav-h)+24px)] lg:mt-2">
            <div className="border-t-[3px] border-ink pt-6">
              <p className="occhiello">Dopo l’invio</p>
              <h2 id="dopo-titolo" className="titolo-s mt-4">
                Cosa succede adesso.
              </h2>
              <ol className="mt-6">
                {PASSI.map((p, i) => (
                  <li key={p.titolo} className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-t border-ink/15 py-4">
                    <span className="num text-sm text-muted">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="font-disp text-lg font-bold uppercase">{p.titolo}</p>
                      <p className="mt-1 text-muted">{p.testo}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </section>

      {whatsappAttivo ? (
        <section
          id="whatsapp"
          aria-labelledby="whatsapp-titolo"
          className="scroll-mt-[calc(var(--nav-h)+16px)] pb-[var(--sezione)]"
        >
          <div className="wrap mb-10">
            <p className="occhiello">WhatsApp</p>
            <h2 id="whatsapp-titolo" className="titolo mt-5 max-w-[16ch]">
              Oppure su WhatsApp.
            </h2>
            <p className="lead mt-5">
              Componi il messaggio col piano della settimana e apri WhatsApp con il testo già pronto: lo mandi tu.
            </p>
          </div>
          <Suspense fallback={<ComposerWhatsApp />}>
            <ComposerWhatsAppDaQuery />
          </Suspense>
        </section>
      ) : null}

      <DoveSiamo />
    </>
  );
}
