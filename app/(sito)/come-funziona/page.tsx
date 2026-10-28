import Link from "next/link";
import Faq from "@/components/come-funziona/Faq";
import JsonLd from "@/components/seo/JsonLd";
import { AGGIORNAMENTO, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { nodiPagina, type DomandaTesto } from "@/components/seo/schema";
import { CONSEGNA_OGNI_GIORNI, PREZZO_DA_TESTO } from "@/lib/abbonamento";
import { EMAIL, INDIRIZZO_RIGA, elencoZone } from "@/lib/sito";

const PAGINA = PAGINE.comeFunziona;

export const metadata = metadatiPagina(PAGINA);

/* Solo testo nelle risposte: le stesse stringhe finiscono nei dati
   strutturati FAQPage, che devono dire esattamente quello che si legge. */
const DOMANDE: DomandaTesto[] = [
  {
    q: "Quanto durano i piatti in frigorifero?",
    a: "La durata dipende dal piatto e dal confezionamento. Segui la data e le istruzioni fornite con il prodotto; se non le hai, chiedi conferma a Matteo prima di consumarlo.",
  },
  {
    q: "Come si scaldano?",
    a: "Segui le istruzioni del piatto e del contenitore ricevuto. Non scaldare una confezione nel microonde senza aver verificato che sia adatta.",
  },
  {
    q: "Quali zone servite?",
    a: `Pescara e i comuni vicini: ${elencoZone()}. Scrivi a ${EMAIL} con il tuo comune e indirizzo: la copertura viene confermata prima dell'ordine. Puoi anche ritirare in ${INDIRIZZO_RIGA}.`,
  },
  {
    q: "Devo ordinare ogni settimana?",
    a: `Il compositore è una bozza gratuita e non invia ordini automatici: per ordinare, chiedi disponibilità e condizioni a Matteo. Se non vuoi pensarci ogni settimana, ci sono gli abbonamenti: cinque formule da ${PREZZO_DA_TESTO} al mese, con il piano del tuo nutrizionista cucinato da Matteo e portato ogni ${CONSEGNA_OGNI_GIORNI} giorni.`,
  },
  {
    q: "Ho un'allergia o un'intolleranza.",
    a: "Consulta gli ingredienti indicati e contatta Matteo prima di ordinare. Chiedi conferma sugli allergeni e sulle possibili contaminazioni: la scheda online da sola non basta per valutare la sicurezza del piatto.",
  },
  {
    q: "Il mio nutrizionista può parlare con Matteo?",
    a: "Puoi condividere la tua bozza e i valori pubblicati dei piatti con il professionista che ti segue. Per adattamenti e ingredienti, scrivi a Matteo e chiedi se sono possibili.",
  },
];

export default function ComeFunziona() {
  return (
    <>
      <JsonLd
        dati={nodiPagina({
          percorso: PAGINA.percorso,
          nome: PAGINA.titolo,
          descrizione: PAGINA.descrizione,
          briciole: [{ nome: PAGINA.breve, href: PAGINA.percorso }],
          faq: DOMANDE,
          dataModifica: AGGIORNAMENTO,
        })}
      />
      <section className="testata">
        <div className="wrap">
          <h1>
            <span className="occhiello">Come funziona il meal prep a Pescara</span>
            <span className="titolo-pagina mt-6 block max-w-[12ch]">Scegli. Al resto pensa Matteo.</span>
          </h1>
          <p className="lead mt-6">
            Un abbonamento per i tuoi pasti abituali, oppure i piatti che scegli per la settimana.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link href="/abbonamento" className="btn btn-ink">
              Scegli un abbonamento <span aria-hidden="true" className="freccia">→</span>
            </Link>
            <Link href="/settimana" className="link">
              Componi la tua settimana
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-[var(--sezione)]">
        <ol className="wrap grid gap-6 md:grid-cols-3">
          {[
            ["1. Scegli", "Seleziona l’abbonamento o componi i pasti che vuoi."],
            ["2. Conferma con Matteo", "Concordate disponibilità, prezzo e giorno. Nessun pagamento online."],
            ["3. Ritira o ricevi a casa", "I tuoi pasti arrivano pronti. Con l’abbonamento, ogni 3 giorni."],
          ].map(([titolo, testo]) => <li key={titolo} className="border-t-2 border-ink pt-5"><h2 className="titolo-s">{titolo}</h2><p className="mt-3 text-muted">{testo}</p></li>)}
        </ol>
      </section>

      <section className="sezione">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="occhiello">Domande</p>
            <h2 className="titolo mt-5">Le domande più comuni.</h2>
          </div>
          <Faq domande={DOMANDE} />
        </div>
      </section>

    </>
  );
}
