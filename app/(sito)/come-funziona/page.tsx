import Link from "next/link";
import Reveal from "@/components/Reveal";
import TrePassi from "@/components/home/TrePassi";
import ChiusuraCta from "@/components/home/ChiusuraCta";
import FotoPiena from "@/components/ui/FotoPiena";
import Faq from "@/components/come-funziona/Faq";
import JsonLd from "@/components/seo/JsonLd";
import { AGGIORNAMENTO, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { nodiPagina, type DomandaTesto } from "@/components/seo/schema";
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
    a: "Il compositore è una bozza gratuita e non invia ordini automatici. Per ordinare, chiedi disponibilità e condizioni a Matteo via email.",
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
            <span className="titolo-xl mt-6 block max-w-[12ch]">Dal tuo allenamento al tuo frigo.</span>
          </h1>
        </div>
      </section>

      <TrePassi />

      <section className="notte relative overflow-hidden">
        <FotoPiena foto="schiscette" velo="forte" />
        <div className="wrap relative grid gap-12 py-[var(--sezione)] md:grid-cols-2">
          <Reveal>
            <p className="occhiello">La preparazione</p>
            <h2 className="titolo mt-5 max-w-[12ch]">Due giorni, una settimana più semplice.</h2>
          </Reveal>
          <Reveal delay={80} className="grid content-end gap-6 text-lg" >
            <p style={{ color: "rgb(243 239 230 / .9)" }}>
              Il sito indica lunedì e giovedì come giorni di preparazione e consegna. Scegli i piatti che ti
              interessano e chiedi conferma di disponibilità, ritiro o copertura del tuo indirizzo.
            </p>
            <p style={{ color: "rgb(243 239 230 / .9)" }}>
              Ogni piatto ha una scheda con ingredienti e valori pubblicati. Per conservazione, allergeni e modalità
              di consumo, segui le informazioni del prodotto e chiedi direttamente quando hai dubbi.
            </p>
            <p className="flex flex-wrap gap-x-8 gap-y-4">
              <Link href={PAGINE.mealPrep.percorso} className="link">
                Il servizio, per intero
              </Link>
              <Link href={PAGINE.consegna.percorso} className="link">
                Zone di consegna e ritiro
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      <section className="sezione">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="occhiello">Domande</p>
            <h2 className="titolo mt-5">Le risposte, senza giri.</h2>
          </div>
          <Faq domande={DOMANDE} />
        </div>
      </section>

      <ChiusuraCta />
    </>
  );
}
