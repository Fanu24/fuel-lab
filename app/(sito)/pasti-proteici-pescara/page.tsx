import Link from "next/link";
import CartaPiatto from "@/components/menu/CartaPiatto";
import { NumeriMacro } from "@/components/ui/Macro";
import Faq from "@/components/come-funziona/Faq";
import JsonLd from "@/components/seo/JsonLd";
import Briciole from "@/components/seo/Briciole";
import { AGGIORNAMENTO, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { elencoPiatti, nodiPagina, type DomandaTesto } from "@/components/seo/schema";
import { PIATTI } from "@/lib/catalogo";
import { nutrizioneDisponibile, statoNutrizione } from "@/lib/nutrizione";

const PAGINA = PAGINE.proteici;
export const metadata = metadatiPagina(PAGINA);
const DOMANDE: DomandaTesto[] = [
  { q: "Come sono calcolate le calorie?", a: "Sono stime dagli ingredienti di una porzione, con riso e pasta pesati cotti. Le schede indicano le ipotesi usate e gli ingredienti ancora da quantificare. Non sono analisi di laboratorio." },
  { q: "Posso seguire il mio piano alimentare?", a: "Sì: porta a Matteo il piano del tuo nutrizionista e concordate ingredienti e quantità. Gli abbonamenti prevedono pasti preparati sul tuo piano." },
  { q: "Ci sono piatti senza carne?", a: "Nel menu trovi anche ricette con uova e formaggi. Consulta gli ingredienti e segnala a Matteo allergie o esigenze prima di ordinare." },
];

export default function PastiProteiciPescara() {
  return (
    <>
      <JsonLd dati={[
        ...nodiPagina({ percorso: PAGINA.percorso, nome: PAGINA.titolo, descrizione: PAGINA.descrizione, tipo: "CollectionPage", faq: DOMANDE, briciole: [{ nome: PAGINA.breve, href: PAGINA.percorso }], dataModifica: AGGIORNAMENTO }),
        elencoPiatti(PAGINA.percorso, "Piatti del menu FUEL LAB", PIATTI),
      ]} />
      <section className="testata">
        <div className="wrap">
          <Briciole voci={[{ nome: PAGINA.breve, href: PAGINA.percorso }]} />
          <p className="occhiello">Cucina fresca a Pescara</p>
          <h1 className="titolo-pagina mt-5 max-w-[16ch]">Pasti proteici, già pronti.</h1>
          <p className="lead mt-5">Pollo, uova, carne e formaggi. Scegli dal menu o affidaci il tuo piano alimentare.</p>
          <div className="mt-7 flex flex-wrap gap-5">
            <Link href={PAGINE.abbonamento.percorso} className="btn btn-ink">Scegli un abbonamento →</Link>
            <Link href="/settimana" className="link">Componi la tua settimana</Link>
          </div>
        </div>
      </section>
      <section className="pb-[var(--sezione)]">
        <div className="wrap">
          <h2 className="sr-only">Piatti e stime nutrizionali</h2>
          <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {PIATTI.map((piatto) => (
              <li key={piatto.id}>
                <CartaPiatto piatto={piatto} />
                <details className="mt-4 border-t border-ink/15 py-3">
                  <summary className="min-h-11 cursor-pointer text-sm font-semibold">Calorie e proteine</summary>
                  {nutrizioneDisponibile(piatto.id) ? <NumeriMacro macro={piatto} compatti className="mt-3" /> : null}
                  <p className="mt-3 text-sm text-muted">{statoNutrizione(piatto.id).nota}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="sezione carta-2">
        <div className="wrap max-w-4xl">
          <h2 className="titolo-s mb-7">Da sapere</h2>
          <Faq domande={DOMANDE} />
        </div>
      </section>
    </>
  );
}
