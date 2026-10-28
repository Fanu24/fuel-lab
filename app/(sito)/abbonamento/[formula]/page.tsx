import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Briciole from "@/components/seo/Briciole";
import JsonLd from "@/components/seo/JsonLd";
import { AGGIORNAMENTO, PAGINE, metadatiPagina, paginaFormula } from "@/components/seo/pagine";
import { nodiPagina, nodoFormula } from "@/components/seo/schema";
import { FORMULE_ID, NOMI_FASCIA, FASCE, eFormulaId, getFormula, linkRichiediAbbonamento, linkScriviAbbonamento, percorsoFormula } from "@/lib/abbonamento";

type Props = { params: Promise<{ formula: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return FORMULE_ID.map((formula) => ({ formula })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { formula } = await params;
  return eFormulaId(formula) ? metadatiPagina(paginaFormula(formula)) : {};
}

export default async function SchedaFormulaPage({ params }: Props) {
  const { formula: id } = await params;
  if (!eFormulaId(id)) notFound();
  const f = getFormula(id);
  const pagina = paginaFormula(id);
  const briciole = [{ nome: PAGINE.abbonamento.breve, href: PAGINE.abbonamento.percorso }, { nome: f.nome, href: percorsoFormula(id) }];
  return <>
    <JsonLd dati={[
      ...nodiPagina({ percorso: pagina.percorso, nome: pagina.titolo, descrizione: pagina.descrizione, briciole, dataModifica: AGGIORNAMENTO }),
      nodoFormula(id),
    ]} />
    <section className="testata !pb-8">
      <div className="wrap">
        <Briciole voci={briciole} />
        <p className="occhiello mt-8">Abbonamento pasti a Pescara</p>
        <h1 className="titolo mt-4">{f.nome}</h1>
        <p className="lead mt-4">{f.slogan} {f.pastiSettimana} pasti a settimana.</p>
        {id === "completo" ? <p className="mt-3 text-sm text-muted">Pranzo e cena per 7 giorni; pasto aggiuntivo da concordare con Matteo.</p> : null}
      </div>
    </section>
    <section className="pb-12">
      <div className="wrap grid gap-4 md:grid-cols-2">
        {FASCE.map((fascia) => <article key={fascia} className={`p-6 md:p-8 ${fascia === "standard" ? "notte" : "carta-2"}`}>
          <h2 className="titolo-s">{NOMI_FASCIA[fascia]}</h2>
          <p className="mt-3">{fascia === "standard" ? "Le porzioni del tuo piano." : "Porzioni e proteine maggiorate, da concordare."}</p>
          <p className="mt-6"><strong className="abb-cifra text-5xl">{f.prezzo[fascia]} €</strong><span className="ml-2 text-sm">al mese</span></p>
          <Link href={linkRichiediAbbonamento({ formula: id, fascia, ritiro: false })} className={`btn mt-6 w-full ${fascia === "standard" ? "btn-lime" : "btn-ink"}`}>Scegli {NOMI_FASCIA[fascia]} <span aria-hidden="true">→</span></Link>
          <p className={`mt-3 text-sm ${fascia === "standard" ? "text-steel" : "text-muted"}`}>Accedi o crea l’account. Nessun pagamento online.</p>
        </article>)}
      </div>
    </section>
    <section className="carta-2 py-10">
      <div className="wrap grid gap-6 md:grid-cols-3">
        <div><h2 className="font-semibold">Piatti su misura</h2><p className="mt-2 text-sm text-muted">Porta il piano del nutrizionista, oppure concorda piatti e porzioni con Matteo. Segnala sempre allergie e intolleranze.</p></div>
        <div><h2 className="font-semibold">Ritiro o consegna</h2><p className="mt-2 text-sm text-muted">Giorno e orario si concordano con Matteo. Puoi ritirare i pasti in laboratorio o riceverli a casa. Hai un codice? Applicalo nella scelta dell’abbonamento.</p></div>
        <div><h2 className="font-semibold">Prezzo e inizio</h2><p className="mt-2 text-sm text-muted">Matteo conferma prezzo, inizio, consegna e pagamento prima di partire.</p></div>
      </div>
    </section>
    <section className="py-10"><div className="wrap flex flex-wrap items-center justify-between gap-5">
      <Link href="/abbonamento#formule" className="btn btn-linea">Confronta gli abbonamenti</Link>
      <Link href={linkScriviAbbonamento({ formula: id })} className="link">Chiedi a Matteo senza account</Link>
    </div></section>
  </>;
}
