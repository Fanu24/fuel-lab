import Link from "next/link";
import Faq from "@/components/come-funziona/Faq";
import { FasciaProvider } from "@/components/abbonamento/FasciaScelta";
import Simulatore from "@/components/abbonamento/Simulatore";
import Briciole from "@/components/seo/Briciole";
import JsonLd from "@/components/seo/JsonLd";
import { AGGIORNAMENTO, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { nodiPagina, nodoAbbonamenti, type DomandaTesto } from "@/components/seo/schema";
import { CONSEGNA_OGNI_GIORNI, PREZZO_DA_TESTO, RAGGIO_CONSEGNA_KM } from "@/lib/abbonamento";
import { INDIRIZZO_RIGA } from "@/lib/sito";

const PAGINA = PAGINE.abbonamento;
export const metadata = metadatiPagina(PAGINA);

const DOMANDE: DomandaTesto[] = [
  {
    q: "Come inizio?",
    a: "Scegli la formula e invia la richiesta. Matteo ti contatta per confermare prezzo, data di inizio e pagamento. Sul sito non paghi nulla.",
  },
  {
    q: "Posso portare il piano del nutrizionista?",
    a: "Sì: Matteo prepara i pasti seguendo il tuo piano e le quantità indicate. Se non ne hai uno, concordi con lui i piatti e le porzioni. Il servizio è di cucina, non di consulenza nutrizionale.",
  },
  {
    q: "Ritiro o consegna?",
    a: `Ricevi i pasti ogni ${CONSEGNA_OGNI_GIORNI} giorni. Puoi ritirarli in ${INDIRIZZO_RIGA}, oppure richiedere la consegna a Pescara e dintorni, fino a ${RAGGIO_CONSEGNA_KM} km. Indirizzo, giorno e orario vengono confermati da Matteo.`,
  },
  {
    q: "Come funzionano gli sconti?",
    a: "Se Matteo ti ha dato un codice, inseriscilo nel riepilogo dell’abbonamento e premi Applica. Vedi subito il prezzo aggiornato; il codice passa anche alla richiesta. Gli sconti vengono creati da Matteo nel pannello admin.",
  },
  {
    q: "Ho allergie o intolleranze: cosa faccio?",
    a: "Indicale nella richiesta, prima di ordinare. Matteo deve confermare ingredienti, sostituzioni e possibili contaminazioni. Per esigenze mediche, segui le indicazioni del professionista che ti segue.",
  },
];

export default function AbbonamentoPage() {
  const briciole = [{ nome: PAGINA.breve, href: PAGINA.percorso }];
  return (
    <>
      <JsonLd dati={[
        ...nodiPagina({ percorso: PAGINA.percorso, nome: PAGINA.titolo, descrizione: PAGINA.descrizione, briciole, faq: DOMANDE, dataModifica: AGGIORNAMENTO }),
        nodoAbbonamenti(),
      ]} />
      <section className="testata !pb-8">
        <div className="wrap">
          <Briciole voci={briciole} />
          <p className="occhiello mt-8">Abbonamenti pasti a Pescara</p>
          <h1 className="titolo mt-4">I tuoi pasti. Ci pensa Matteo.</h1>
          <p className="lead mt-4">Da {PREZZO_DA_TESTO} al mese. Scegli la formula, al resto pensiamo noi.</p>
          <p className="mt-3 text-sm text-muted">Ritiro o consegna · Nessun pagamento online</p>
        </div>
      </section>

      <section id="formule" className="notte scroll-mt-[calc(var(--nav-h)+16px)]">
        <div id="simulatore" className="wrap scroll-mt-[calc(var(--nav-h)+16px)] py-8 md:py-12">
          <FasciaProvider><Simulatore /></FasciaProvider>
        </div>
      </section>

      <section id="come-funziona" className="sezione !py-12">
        <div className="wrap">
          <h2 className="titolo-s">Come funziona</h2>
          <ol className="mt-6 grid gap-5 md:grid-cols-3">
            {[
              ["1. Scegli", "Trova la formula e invia la richiesta."],
              ["2. Concorda", "Matteo ti conferma piatti, prezzo e inizio."],
              ["3. Ricevi", `Ritiri o ricevi i pasti ogni ${CONSEGNA_OGNI_GIORNI} giorni.`],
            ].map(([titolo, testo]) => <li key={titolo} className="border-t border-ink/20 pt-4"><h3 className="font-semibold">{titolo}</h3><p className="mt-2 text-muted">{testo}</p></li>)}
          </ol>
        </div>
      </section>

      <section className="sezione carta-2 !py-12">
        <div className="wrap grid gap-8 lg:grid-cols-[1fr_2fr]">
          <h2 className="titolo-s">Da sapere</h2>
          <Faq domande={DOMANDE} />
        </div>
      </section>
      <section className="py-10">
        <div className="wrap flex flex-wrap items-center justify-between gap-5">
          <p className="text-muted">Preferisci scegliere i singoli piatti?</p>
          <Link href="/settimana" className="btn btn-linea">Componi la tua settimana <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </>
  );
}
