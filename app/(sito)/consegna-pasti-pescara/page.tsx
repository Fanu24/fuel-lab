import Link from "next/link";
import Reveal from "@/components/Reveal";
import ChiusuraCta from "@/components/home/ChiusuraCta";
import Faq from "@/components/come-funziona/Faq";
import FotoPiena from "@/components/ui/FotoPiena";
import Briciole from "@/components/seo/Briciole";
import JsonLd from "@/components/seo/JsonLd";
import LinkBlog from "@/components/seo/LinkBlog";
import { AGGIORNAMENTO, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { nodiPagina, nodoServizio, type DomandaTesto } from "@/components/seo/schema";
import { EMAIL, INDIRIZZO_RIGA, LINK_MAPPA, ZONE_SERVITE, elencoZone, type Zona } from "@/lib/sito";

/* Ritiro e consegna: dove arrivano i piatti, come si ritirano, cosa sapere e
   come si conferma. Una pagina sola per tutta la zona, con una riga vera per
   ogni comune, invece di sei pagine uguali col nome della citta' cambiato
   (quelle Google le tratta da pagine civetta). */

const PAGINA = PAGINE.consegna;

export const metadata = metadatiPagina(PAGINA);

/* Dove sta ogni localita' rispetto a Pescara: geografia, non promesse. La
   copertura del singolo indirizzo resta da confermare. */
const DOVE: Record<string, string> = {
  Pescara: `Qui ha sede FUEL LAB, in ${INDIRIZZO_RIGA}: è anche il punto di ritiro.`,
  Montesilvano: "Confina con Pescara a nord, lungo la costa.",
  Spoltore: "Alle spalle di Pescara, verso l'interno, con frazioni come Santa Teresa e Villa Raspa.",
  "Francavilla al Mare": "Sulla costa, subito a sud di Pescara.",
  "San Giovanni Teatino": "A sud-ovest di Pescara, verso l'interno, con la frazione di Sambuceto.",
  "Chieti Scalo": "La parte bassa di Chieti, lungo la valle del Pescara, con il polo universitario e la stazione.",
};

function provincia(z: Zona): string {
  return z.provincia === "PE" ? "Provincia di Pescara" : "Provincia di Chieti";
}

const DA_SAPERE = [
  {
    titolo: "I giorni sono due",
    testo: "Lunedì e giovedì, gli stessi in cui Matteo cucina. Ogni piatto ha il suo giorno, scritto nella scheda del piatto.",
  },
  {
    titolo: "L'indirizzo si conferma prima",
    testo: "Scrivi comune, via e numero civico, e se è casa o lavoro: la risposta sulla copertura arriva prima dell'ordine, non dopo.",
  },
  {
    titolo: "Sono piatti da frigorifero",
    testo: "Appena li ricevi mettili in frigo e segui le indicazioni di conservazione che arrivano con il piatto.",
  },
  {
    titolo: "Allergie e intolleranze",
    testo: "Dillo nella richiesta. Gli allergeni sono in ogni scheda, ma per contaminazioni e sostituzioni serve la conferma di Matteo.",
  },
  {
    titolo: "Niente pagamento online",
    testo: "La richiesta non è ancora un ordine: lo diventa quando Matteo conferma piatti, giorno e modalità.",
  },
];

const DOMANDE: DomandaTesto[] = [
  {
    q: "Consegnate a Montesilvano?",
    a: "Sì, Montesilvano è tra i comuni in cui puoi chiedere la consegna, il lunedì e il giovedì. Come per ogni indirizzo, Matteo conferma la copertura prima dell'ordine.",
  },
  {
    q: "E a Francavilla al Mare, San Giovanni Teatino o Chieti Scalo?",
    a: `Sono nella zona in cui chiedere la consegna, insieme a ${elencoZone(
      ZONE_SERVITE.filter((z) => z.provincia === "PE"),
    )}. Indica l'indirizzo completo nella richiesta per avere la conferma.`,
  },
  {
    q: "Posso ritirare i piatti di persona?",
    a: `Sì, in ${INDIRIZZO_RIGA}. Giorno e orario del ritiro si concordano con Matteo quando confermi la richiesta.`,
  },
  {
    q: "In che giorni fate le consegne?",
    a: "Il lunedì e il giovedì, i giorni in cui Matteo cucina.",
  },
  {
    q: "Consegnate anche al lavoro o in palestra?",
    a: "Puoi indicare l'indirizzo che ti è più comodo, anche quello del lavoro o della palestra: la copertura si conferma come per ogni altro indirizzo.",
  },
  {
    q: "Quanto costa la consegna?",
    a: "La consegna è gratis dai dieci pasti in su, come indicato in Servizi e prezzi. Sotto quella soglia, il costo per il tuo indirizzo te lo conferma Matteo insieme alla copertura.",
  },
  {
    q: "I piatti arrivano caldi?",
    a: "Sono piatti per i giorni successivi: appena arrivano vanno in frigorifero e si scaldano quando li mangi, seguendo le istruzioni del piatto e del contenitore.",
  },
];

export default function ConsegnaPastiPescara() {
  const briciole = [{ nome: PAGINA.breve, href: PAGINA.percorso }];

  return (
    <>
      <JsonLd
        dati={[
          ...nodiPagina({
            percorso: PAGINA.percorso,
            nome: PAGINA.titolo,
            descrizione: PAGINA.descrizione,
            briciole,
            faq: DOMANDE,
            dataModifica: AGGIORNAMENTO,
          }),
          nodoServizio({
            id: "consegna",
            percorso: PAGINA.percorso,
            nome: "Ritiro e consegna dei pasti a Pescara e dintorni",
            descrizione: `Ritiro in ${INDIRIZZO_RIGA} o consegna il lunedì e il giovedì a ${elencoZone()}, con copertura dell'indirizzo confermata prima dell'ordine.`,
            tipoServizio: "Consegna pasti",
          }),
        ]}
      />

      <section className="testata">
        <div className="wrap">
          <Briciole voci={briciole} />
          <p className="occhiello mt-10">Ritiro e consegna</p>
          <h1 className="titolo-xl mt-6 max-w-[13ch]">Consegna pasti a Pescara e dintorni.</h1>
          <p className="lead mt-6">
            I piatti di FUEL LAB si ritirano in Via del Santuario 214 oppure arrivano al tuo indirizzo, a Pescara e nei
            comuni vicini, il lunedì e il giovedì. La copertura della tua via te la conferma Matteo prima
            dell&apos;ordine, non dopo.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link href="/richiesta?argomento=consegna" className="btn btn-ink">
              Chiedi se arriviamo da te <span className="freccia">→</span>
            </Link>
            <Link href="/menu" className="link">
              Guarda il menu
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-[var(--sezione)]">
        <div className="wrap">
          <h2 className="titolo-s">Due modi per avere i piatti.</h2>
          <div className="mt-8 grid gap-10 md:grid-cols-2">
            <Reveal className="border-t-[3px] border-ink pt-6">
              <span className="num text-sm text-muted">01</span>
              <h3 className="titolo mt-3">Ritiro in sede</h3>
              <p className="mt-5 max-w-[46ch] text-lg text-muted">
                In <strong className="text-ink">{INDIRIZZO_RIGA}</strong>, la sede di FUEL LAB. I piatti
                sono pronti il lunedì e il giovedì; giorno e orario del ritiro si concordano quando confermi la
                richiesta.
              </p>
              <a href={LINK_MAPPA} target="_blank" rel="noopener noreferrer" className="link mt-6 inline-block">
                Apri in Google Maps
              </a>
            </Reveal>
            <Reveal delay={80} className="border-t-[3px] border-ink pt-6">
              <span className="num text-sm text-muted">02</span>
              <h3 className="titolo mt-3">Consegna in zona</h3>
              <p className="mt-5 max-w-[46ch] text-lg text-muted">
                Il lunedì e il giovedì, a casa o al lavoro, nei comuni qui sotto. Scrivi l&apos;indirizzo nella
                richiesta e Matteo ti dice se e quando può arrivare. Le condizioni di consegna sono in{" "}
                <Link href="/servizi" className="link">
                  Servizi e prezzi
                </Link>
                .
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="sezione carta-2">
        <div className="wrap">
          <Reveal>
            <p className="occhiello">Le zone</p>
            <h2 className="titolo mt-5 max-w-[14ch]">Dove arrivano i piatti.</h2>
            <p className="lead mt-6">
              La zona di consegna è Pescara con i comuni vicini. Qui sotto trovi dove puoi chiederla; la conferma
              riguarda sempre il singolo indirizzo, perché dipende dal giorno e dal percorso.
            </p>
          </Reveal>
          <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {ZONE_SERVITE.map((z, i) => (
              <Reveal as="li" key={z.nome} delay={(i % 3) * 70} className="border-t-[3px] border-ink pt-5">
                <h3 className="titolo-s">{z.nome}</h3>
                <p className="mt-2 font-disp text-[11px] font-semibold tracking-[.16em] text-muted uppercase">
                  {provincia(z)}
                </p>
                {DOVE[z.nome] ? <p className="mt-3 text-muted">{DOVE[z.nome]}</p> : null}
              </Reveal>
            ))}
          </ul>
          <p className="mt-12 max-w-[64ch] text-lg">
            Il tuo comune non c&apos;è? Scrivi lo stesso a{" "}
            <a href={`mailto:${EMAIL}`} className="link">
              {EMAIL}
            </a>
            : se la consegna non è possibile, resta il ritiro in sede.
          </p>
        </div>
      </section>

      <section className="notte relative overflow-hidden">
        <FotoPiena foto="verdure" velo="forte" />
        <div className="wrap relative grid gap-12 py-[var(--sezione)] lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <p className="occhiello">Cosa sapere</p>
            <h2 className="titolo mt-5 max-w-[12ch]">Prima di chiedere la consegna.</h2>
          </Reveal>
          <ol>
            {DA_SAPERE.map((d, i) => (
              <Reveal
                as="li"
                key={d.titolo}
                delay={i * 60}
                className="grid grid-cols-[44px_1fr] gap-4 border-b py-6"
              >
                <span className="num text-sm text-steel">0{i + 1}</span>
                <span>
                  <span className="block font-disp text-lg font-bold tracking-[.04em] uppercase">{d.titolo}</span>
                  <span className="mt-1 block" style={{ color: "rgb(243 239 230 / .88)" }}>
                    {d.testo}
                  </span>
                </span>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="sezione">
        <div className="wrap">
          <Reveal>
            <p className="occhiello">Come si conferma</p>
            <h2 className="titolo mt-5 max-w-[14ch]">Dalla richiesta alla porta.</h2>
          </Reveal>
          <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            <Reveal as="li" className="border-t-[3px] border-ink pt-6">
              <span className="num text-sm text-muted">01</span>
              <h3 className="titolo-s mt-3">Scegli i piatti</h3>
              <p className="mt-3 max-w-[34ch] text-muted">
                Dal <Link href="/menu" className="link">menu</Link> o dal{" "}
                <Link href="/settimana" className="link">compositore</Link>, anche solo per qualche giorno.
              </p>
            </Reveal>
            <Reveal as="li" delay={80} className="border-t-[3px] border-ink pt-6">
              <span className="num text-sm text-muted">02</span>
              <h3 className="titolo-s mt-3">Mandi la richiesta</h3>
              <p className="mt-3 max-w-[34ch] text-muted">
                Dalla pagina <Link href="/richiesta?argomento=consegna" className="link">Scrivi a Matteo</Link> o a{" "}
                {EMAIL}, con indirizzo e giorno preferito.
              </p>
            </Reveal>
            <Reveal as="li" delay={160} className="border-t-[3px] border-ink pt-6">
              <span className="num text-sm text-muted">03</span>
              <h3 className="titolo-s mt-3">Matteo conferma</h3>
              <p className="mt-3 max-w-[34ch] text-muted">
                Ti risponde con copertura, giorno e modalità. Da lì la richiesta diventa un ordine.
              </p>
            </Reveal>
          </ol>
          <p className="mt-12 max-w-[64ch] text-muted">
            Vuoi capire prima come funziona il servizio nel suo insieme?{" "}
            <Link href={PAGINE.mealPrep.percorso} className="link">
              Il meal prep a Pescara, passo per passo
            </Link>
          </p>
        </div>
      </section>

      <section className="sezione border-t border-ink/15">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="occhiello">Domande</p>
            <h2 className="titolo mt-5">Consegna e ritiro: le risposte.</h2>
          </div>
          <Faq domande={DOMANDE} />
        </div>
      </section>

      <LinkBlog
        slug={[
          "consegna-pasti-pescara-cosa-chiedere",
          "conservare-pasti-preparati-frigorifero",
          "pranzo-lavoro-pescara-organizzarlo",
        ]}
        titolo="Prima di scegliere un servizio."
      />

      <ChiusuraCta
        titolo="Sei in zona? Chiedilo a Matteo."
        testo="Scrivi comune e indirizzo: ti risponde con copertura e giorno di consegna, oppure con l'orario per il ritiro in sede."
      />
    </>
  );
}
