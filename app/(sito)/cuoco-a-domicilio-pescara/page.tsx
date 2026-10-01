import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import ChiusuraCta from "@/components/home/ChiusuraCta";
import Faq from "@/components/come-funziona/Faq";
import Aggiornato from "@/components/seo/Aggiornato";
import Briciole from "@/components/seo/Briciole";
import JsonLd from "@/components/seo/JsonLd";
import LinkBlog from "@/components/seo/LinkBlog";
import { AGGIORNAMENTO, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { idServizio, nodiPagina, nodoServizio, prezzoIt, type DomandaTesto } from "@/components/seo/schema";
import { FOTO } from "@/lib/immagini";
import { SOGLIA_PREZZO, getServizio } from "@/lib/servizi";
import { INDIRIZZO_RIGA, elencoZone } from "@/lib/sito";

/* Il terzo servizio, l'home cooking, spiegato: finora rimandava solo alla pagina su
   Matteo. Qui si dice cosa e' (il meal prep fatto nella cucina del cliente),
   come si organizza e cosa si concorda. Niente prezzo: e' su preventivo per
   scelta del committente (lib/servizi.ts), e la pagina non lo aggira. */

const PAGINA = PAGINE.domicilio;
const SERVIZIO = getServizio("home-cooking");
const PREZZO_MEAL_PREP = prezzoIt(SOGLIA_PREZZO);

export const metadata = metadatiPagina(PAGINA);

const PASSI = [
  {
    titolo: "Il primo contatto",
    testo:
      "Scrivi a Matteo scegliendo Home cooking: comune, quante persone, quanti pasti, e se hai una scheda del nutrizionista o delle allergie.",
  },
  {
    titolo: "Il menu",
    testo: "Si parte dai piatti del menu FUEL LAB o da quello che ti serve: Matteo propone, tu scegli.",
  },
  {
    titolo: "Il preventivo",
    testo: "Chiariti spesa, giorno e numero di pasti, Matteo ti manda il preventivo. Nessun pagamento online.",
  },
  {
    titolo: "La giornata in cucina",
    testo: "Matteo arriva con la spesa, cucina e porziona i pasti nella tua cucina, pronti per i giorni concordati.",
  },
];

const DA_CHIARIRE = [
  "La cucina: fornelli, forno e attrezzatura che trova in casa.",
  "I contenitori per le porzioni e lo spazio libero in frigorifero.",
  "Allergie, intolleranze e ingredienti da tenere fuori casa.",
  "Quanti pasti preparare e per quante persone.",
  `L'indirizzo: Matteo lavora a Pescara e nei comuni vicini (${elencoZone()}), e la zona si conferma con il preventivo.`,
];

const CONFRONTO = [
  { voce: "Dove si cucina", mealPrep: `Nella sede di FUEL LAB, ${INDIRIZZO_RIGA}`, casa: "Nella tua cucina" },
  { voce: "Quando", mealPrep: "Ogni giorno, con ritiro o consegna", casa: "Nel giorno che concordate" },
  { voce: "Il menu", mealPrep: "I piatti del menu, con i macro pubblicati", casa: "Dal menu o su misura, da concordare" },
  { voce: "La spesa", mealPrep: "La fa Matteo", casa: "La fa Matteo, e si decide insieme" },
  { voce: "Come arriva", mealPrep: "Ritiro in sede o consegna in zona", casa: "Resta a casa tua, già porzionato" },
  { voce: "Prezzo", mealPrep: `Da ${PREZZO_MEAL_PREP} € a pasto`, casa: "Su preventivo" },
];

const DOMANDE: DomandaTesto[] = [
  {
    q: "Quanto costa un cuoco a domicilio a Pescara con FUEL LAB?",
    a: `L'home cooking è su preventivo: dipende da spesa, numero di pasti e tempo in cucina. Il meal prep ritirato o consegnato, invece, parte da ${PREZZO_MEAL_PREP} € a pasto.`,
  },
  {
    q: "Chi fa la spesa?",
    a: "Matteo. Cosa comprare si decide insieme quando si concorda il menu.",
  },
  {
    q: "Posso scegliere i piatti?",
    a: "Sì: si può partire dal menu FUEL LAB o da quello che ti serve. Adattamenti e ingredienti si concordano con Matteo prima della giornata.",
  },
  {
    q: "In quali zone viene Matteo?",
    a: "A Pescara e nei comuni vicini. Il tuo indirizzo si conferma insieme al preventivo.",
  },
  {
    q: "È un servizio per cene ed eventi?",
    a: "L'home cooking di FUEL LAB è pensato per i pasti della settimana, cucinati e porzionati a casa tua. Se hai in mente altro, come una cena, scrivi a Matteo e chiedi.",
  },
  {
    q: "Serve una cucina attrezzata?",
    a: "Serve una cucina in cui si possa cucinare davvero. Fornelli, forno, attrezzatura e contenitori si verificano insieme prima della giornata.",
  },
];

export default function CuocoADomicilioPescara() {
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
            about: { "@id": idServizio(PAGINA.percorso, "home-cooking") },
            dataModifica: AGGIORNAMENTO,
          }),
          nodoServizio({
            id: "home-cooking",
            percorso: PAGINA.percorso,
            nome: "Home cooking: cuoco a domicilio a Pescara",
            descrizione: SERVIZIO.descrizione,
            tipoServizio: "Cuoco a domicilio",
            immagine: FOTO.cucina.src,
          }),
        ]}
      />

      <section className="testata">
        <div className="wrap grid items-end gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <Briciole voci={briciole} />
            <p className="occhiello mt-10">Home cooking · su preventivo</p>
            <h1 className="titolo-xl mt-6 max-w-[13ch]">Cuoco a domicilio a Pescara.</h1>
            <p className="titolo-s mt-4 text-muted">Il meal prep, nella tua cucina.</p>
            <p className="lead mt-8">
              Matteo fa la spesa, cucina e porziona i pasti a casa tua. Non è produzione in serie: è il suo tempo
              dedicato solo a te, e per questo non ha un prezzo a pasto ma un preventivo.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link href="/richiesta?servizio=home-cooking#scrivi" className="btn btn-ink">
                Chiedi un preventivo <span className="freccia">→</span>
              </Link>
              <Link href={PAGINE.chiSiamo.percorso} className="link">
                Conosci Matteo
              </Link>
            </div>
          </div>
          <figure className="smusso relative aspect-[4/3] overflow-hidden bg-paper-2">
            <Image
              src={FOTO.cucina.src}
              alt={FOTO.cucina.alt}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              loading="eager"
              fetchPriority="high"
              className="object-cover"
            />
            <figcaption className="absolute right-3 bottom-3 bg-paper px-3 py-1 text-xs text-ink">
              Foto illustrativa
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="sezione">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <p className="occhiello">Che cos&apos;è</p>
            <h2 className="titolo mt-5 max-w-[12ch]">Il cuoco viene da te.</h2>
          </Reveal>
          <Reveal delay={80} className="grid gap-6 text-lg leading-relaxed">
            <p>
              Con il meal prep di FUEL LAB i piatti si preparano da Matteo e arrivano a te, ritirati o consegnati.
              Con l&apos;home cooking succede il contrario: è Matteo che arriva. Fa la spesa, entra nella tua cucina,
              cucina e porziona, e lascia i pasti pronti per i giorni che avete concordato.
            </p>
            <p>
              È diverso dagli altri due servizi anche nel prezzo. Non si paga a pasto, perché quello che scegli è il
              tempo di un cuoco dedicato solo a te: per questo è su preventivo, e il preventivo arriva dopo che Matteo
              ha capito cosa ti serve.
            </p>
            <p>
              Prima di farlo entrare in casa, è giusto sapere chi è:{" "}
              <Link href={PAGINE.chiSiamo.percorso} className="link">
                Matteo e la sua cucina
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>

      <section className="sezione carta-2">
        <div className="wrap">
          <Reveal>
            <p className="occhiello">Come si organizza</p>
            <h2 className="titolo mt-5 max-w-[14ch]">Dal messaggio alla cucina piena.</h2>
          </Reveal>
          <ol className="mt-14 grid gap-10 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            {PASSI.map((p, i) => (
              <Reveal as="li" key={p.titolo} delay={i * 80} className="border-t-[3px] border-ink pt-6">
                <span className="num text-sm text-muted">0{i + 1}</span>
                <h3 className="titolo-s mt-3">{p.titolo}</h3>
                <p className="mt-3 max-w-[34ch] text-muted">{p.testo}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="sezione">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <p className="occhiello">Prima della giornata</p>
            <h2 className="titolo mt-5 max-w-[12ch]">Le cose da chiarire.</h2>
            <p className="lead mt-6">
              Poche domande, fatte prima, evitano sorprese il giorno in cui Matteo entra in cucina.
            </p>
          </Reveal>
          <ul className="border-t-[3px] border-ink">
            {DA_CHIARIRE.map((t, i) => (
              <Reveal as="li" key={t} delay={i * 60} className="flex gap-5 border-b border-ink/15 py-5 text-lg">
                <span className="num text-muted">0{i + 1}</span>
                <span>{t}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="notte">
        <div className="wrap py-[var(--sezione)]">
          <Reveal>
            <p className="occhiello">A confronto</p>
            <h2 className="titolo mt-5 max-w-[16ch]">Home cooking o meal prep consegnato?</h2>
          </Reveal>
          <div className="mt-12 overflow-x-auto" role="region" tabIndex={0} aria-label="Confronto fra i due servizi">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <caption className="sr-only">Differenze fra meal prep FUEL LAB e home cooking</caption>
              <thead>
                <tr className="font-disp text-[11px] font-semibold tracking-[.16em] text-steel uppercase">
                  <td className="w-[22%] py-4 pr-6" />
                  <th scope="col" className="py-4 pr-6">Meal prep FUEL LAB</th>
                  <th scope="col" className="py-4">Home cooking</th>
                </tr>
              </thead>
              <tbody>
                {CONFRONTO.map((r) => (
                  <tr key={r.voce} className="border-t align-top" style={{ borderColor: "var(--line)" }}>
                    <th scope="row" className="py-4 pr-6 font-disp text-sm font-semibold tracking-[.08em] uppercase">
                      {r.voce}
                    </th>
                    <td className="py-4 pr-6" style={{ color: "rgb(243 239 230 / .88)" }}>
                      {r.mealPrep}
                    </td>
                    <td className="py-4 text-lime">{r.casa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm font-semibold text-steel md:hidden">Scorri la tabella di lato per vedere tutte le colonne.</p>
          <p className="mt-10 max-w-[60ch] text-steel">
            Ti basta ricevere i piatti già pronti?{" "}
            <Link href={PAGINE.mealPrep.percorso} className="link">
              Il meal prep a Pescara
            </Link>{" "}
            parte dal{" "}
            <Link href="/menu" className="link">
              menu
            </Link>{" "}
            e arriva con{" "}
            <Link href={PAGINE.consegna.percorso} className="link">
              ritiro o consegna
            </Link>
            ; se vuoi i pasti di tutto il mese, ci sono gli{" "}
            <Link href={PAGINE.abbonamento.percorso} className="link">
              abbonamenti
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="sezione">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="occhiello">Domande</p>
            <h2 className="titolo mt-5">Cuoco a domicilio: le risposte.</h2>
          </div>
          <Faq domande={DOMANDE} />
        </div>
        <div className="wrap mt-10">
          <Aggiornato />
        </div>
      </section>

      <LinkBlog
        slug={["menu-settimanale-pescara-come-pianificarlo", "spesa-settimanale-meal-prep-zero-sprechi"]}
        titolo="Organizzare la settimana."
      />

      <ChiusuraCta
        titolo="Vuoi Matteo nella tua cucina?"
        testo="Scrivi comune, persone e pasti che ti servono: Matteo ti risponde con una proposta e il preventivo."
      />
    </>
  );
}
