import { Suspense } from "react";
import ComposerWhatsApp, { ComposerWhatsAppDaQuery } from "@/components/contatto/ComposerWhatsApp";
import ModuloContatto, { ModuloContattoDaQuery } from "@/components/contatto/ModuloContatto";
import WhatsAppCta from "@/components/ui/WhatsAppCta";
import Briciole from "@/components/seo/Briciole";
import JsonLd from "@/components/seo/JsonLd";
import { AGGIORNAMENTO, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { ID, nodiPagina } from "@/components/seo/schema";
import { EMAIL_CONTATTI } from "@/lib/contatto";
import { INDIRIZZO_RIGA, ORARI_RITIRO, TELEFONO, LINK_MAPPA } from "@/lib/sito";
import { numeroConfigurato } from "@/lib/whatsapp";

const PAGINA = PAGINE.richiesta;
export const metadata = metadatiPagina(PAGINA);

export default function RichiestaPage() {
  const whatsappAttivo = numeroConfigurato();
  const briciole = [{ nome: PAGINA.breve, href: PAGINA.percorso }];
  return <>
    <JsonLd dati={nodiPagina({ percorso: PAGINA.percorso, nome: PAGINA.titolo, descrizione: PAGINA.descrizione, tipo: "ContactPage", briciole, mainEntity: { "@id": ID.organizzazione }, dataModifica: AGGIORNAMENTO })} />
    <section className="testata !pb-10">
      <div className="wrap">
        <Briciole voci={briciole} />
        <p className="occhiello mt-8">Contatti</p>
        <h1 className="titolo mt-4">Parla con Matteo.</h1>
        <p className="lead mt-4">Un dubbio sui pasti? Scrivigli direttamente.</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-4">
          {whatsappAttivo ? <WhatsAppCta label="Scrivi su WhatsApp" buttonClassName="!min-h-14" /> : null}
          {TELEFONO ? <a href={`tel:${TELEFONO.replace(/\s/g, "")}`} className="link min-h-11 content-center">{TELEFONO}</a> : null}
        </div>
      </div>
    </section>
    <section id="scrivi" className="scroll-mt-[calc(var(--nav-h)+16px)] pb-12">
      <div className="wrap grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-14">
        <div>
          <h2 className="titolo-s">Oppure lascia un messaggio</h2>
          <p className="mt-3 mb-6 text-muted">Non serve un account. Matteo ti ricontatta per confermare i dettagli.</p>
          <noscript><p className="mb-5">Per usare il modulo attiva JavaScript, oppure scrivi a <a href={`mailto:${EMAIL_CONTATTI}`} className="link">{EMAIL_CONTATTI}</a>.</p></noscript>
          <Suspense fallback={<ModuloContatto />}><ModuloContattoDaQuery /></Suspense>
        </div>
        <aside className="self-start bg-paper-2 p-6">
          <h2 className="font-disp text-xl font-bold uppercase">La cucina a Pescara</h2>
          <address className="mt-4 not-italic">{INDIRIZZO_RIGA}</address>
          <p className="mt-3 text-sm text-muted">Ritiro: {ORARI_RITIRO.testo}. Concorda l’orario con Matteo.</p>
          <a href={LINK_MAPPA} target="_blank" rel="noopener noreferrer" className="link mt-5 inline-block min-h-11">Apri le indicazioni</a>
          <p className="mt-2 break-words"><a href={`mailto:${EMAIL_CONTATTI}`} className="link">{EMAIL_CONTATTI}</a></p>
          <p className="mt-5 border-t border-ink/15 pt-5 text-sm text-muted">Piatti, prezzo, ritiro o consegna si confermano insieme. Nessun pagamento online.</p>
        </aside>
      </div>
    </section>
    {whatsappAttivo ? <section id="whatsapp" className="scroll-mt-[calc(var(--nav-h)+16px)] pb-12">
      <details className="wrap">
        <summary className="min-h-11 cursor-pointer border-t border-ink/20 py-4 font-semibold">Vuoi allegare la tua settimana a WhatsApp?</summary>
        <p className="mb-6 text-sm text-muted">Prepara il messaggio con i piatti scelti, poi invialo dalla chat.</p>
        <Suspense fallback={<ComposerWhatsApp />}><ComposerWhatsAppDaQuery /></Suspense>
      </details>
    </section> : null}
  </>;
}
