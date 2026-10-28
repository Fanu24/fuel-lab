import Link from "next/link";
import Reveal from "@/components/Reveal";
import ChiusuraCta from "@/components/home/ChiusuraCta";
import CartaPiatto from "@/components/menu/CartaPiatto";
import Faq from "@/components/come-funziona/Faq";
import FotoPiena from "@/components/ui/FotoPiena";
import Briciole from "@/components/seo/Briciole";
import Aggiornato from "@/components/seo/Aggiornato";
import InBreve from "@/components/seo/InBreve";
import JsonLd from "@/components/seo/JsonLd";
import LinkBlog from "@/components/seo/LinkBlog";
import { AGGIORNAMENTO, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { idServizio, nodiPagina, nodoServizio, prezzoIt, type DomandaTesto } from "@/components/seo/schema";
import { PIATTI, type Allenamento } from "@/lib/catalogo";
import { PREZZO_DA_TESTO, RAGGIO_CONSEGNA_KM } from "@/lib/abbonamento";
import { CONSIGLI } from "@/lib/consigli";
import { SOGLIA_PREZZO } from "@/lib/servizi";
import { INDIRIZZO_RIGA, LINK_MAPPA } from "@/lib/sito";

/* La pagina pilastro del servizio: che cos'e' il meal prep di FUEL LAB, come
   funziona, per chi, per quale allenamento, come arriva e quanto costa. Le altre
   pagine locali (consegna, pasti proteici, cuoco a domicilio) approfondiscono
   un pezzo ciascuna; il blog spiega il meal prep in generale. */

const PAGINA = PAGINE.mealPrep;
const PREZZO = prezzoIt(SOGLIA_PREZZO);

export const metadata = metadatiPagina(PAGINA);

const PASSI = [
  {
    n: "01",
    titolo: "Guardi il menu",
    testo: `${PIATTI.length} piatti con ingredienti, allergeni e macro. Li filtri per allenamento: cardio o pesi.`,
    link: { href: "/menu", label: "Il menu" },
  },
  {
    n: "02",
    titolo: "Componi la settimana",
    testo:
      "Nel compositore segni come ti alleni giorno per giorno e i piatti si mettono da soli. Se hai la scheda del nutrizionista, parti dai tuoi macro.",
    link: { href: "/settimana", label: "Il compositore" },
  },
  {
    n: "03",
    titolo: "Scrivi a Matteo",
    testo:
      "Mandi la settimana con la richiesta: Matteo conferma piatti, quantità, giorno e modalità. Niente pagamento online, l'ordine vale quando lo conferma lui.",
    link: { href: "/richiesta?servizio=menu-settimana#scrivi", label: "Scrivi a Matteo" },
  },
  {
    n: "04",
    titolo: "Ritiri o ricevi",
    testo:
      "Matteo cucina ogni giorno: ritiri in Via del Santuario 214 oppure i piatti arrivano al tuo indirizzo, se è in zona, con giorno e orario concordati.",
    link: { href: PAGINE.consegna.percorso, label: "Ritiro e consegna" },
  },
];

const PER_CHI = [
  {
    titolo: "Chi fa pesi o cardio",
    testo: `Ogni piatto è segnato per i giorni di cardio, di pesi o per entrambi. La regola di Matteo: nei giorni di cardio, ${CONSIGLI.cardio.regola.toLowerCase()} Nei giorni di pesi, ${CONSIGLI.pesi.regola.toLowerCase()}`,
  },
  {
    titolo: "Chi pranza al lavoro",
    testo: "Un piatto già porzionato da portare in ufficio, senza cucinare la sera prima e senza improvvisare in pausa pranzo.",
  },
  {
    titolo: "Chi segue una scheda",
    testo:
      "Scrivi calorie, proteine, carboidrati e grassi del tuo nutrizionista: la settimana si compone con i piatti più vicini ai tuoi numeri.",
  },
  {
    titolo: "Chi vuole sapere cosa mangia",
    testo: "Ingredienti con i grammi, allergeni e macro sono pubblici, piatto per piatto, prima di ordinare.",
  },
];

const DOMANDE: DomandaTesto[] = [
  {
    q: "Che cosa vuol dire meal prep?",
    a: "Preparare in anticipo i pasti della settimana. Con FUEL LAB li prepara Matteo, un cuoco, a Pescara: tu scegli i piatti e li trovi pronti, porzionati e con i macro indicati.",
  },
  {
    q: "I piatti sono surgelati?",
    a: "No. Sono piatti freschi, mai surgelati: Matteo cucina ogni giorno. Per conservarli e scaldarli segui le indicazioni che ricevi con il piatto.",
  },
  {
    q: "Quando cucina Matteo?",
    a: "Matteo cucina ogni giorno. Il giorno e l'orario del ritiro o della consegna si concordano con lui quando confermi la richiesta.",
  },
  {
    q: "Posso scegliere io i piatti?",
    a: "Sì. Puoi sceglierli uno per uno dal menu, farli proporre dal compositore in base agli allenamenti oppure partire dai macro della tua scheda. La proposta si cambia sempre.",
  },
  {
    q: "Quanto costa il meal prep a Pescara con FUEL LAB?",
    a: `Da ${PREZZO} € a pasto. Il prezzo finale dipende dalla richiesta e te lo conferma Matteo: sul sito non c'è pagamento online. Se vuoi i pasti di tutta la settimana senza ordinare ogni volta, ci sono cinque abbonamenti mensili da ${PREZZO_DA_TESTO} al mese: Matteo cucina il piano del tuo nutrizionista e lo porta con giorno e orario concordati.`,
  },
  {
    q: "Va bene anche se non mi alleno?",
    a: "Sì. I piatti sono pensati per chi fa cardio o pesi, ma restano piatti da pranzo o da cena che chiunque può scegliere. Guarda ingredienti e valori e decidi in base alle tue abitudini.",
  },
  {
    q: "Dove si ritirano i piatti?",
    a: `In ${INDIRIZZO_RIGA}. Giorno e orario del ritiro si concordano con Matteo quando confermi la richiesta.`,
  },
];

/* I piatti raggruppati per allenamento, come il menu: il giorno di cottura non
   si dice piu', perche' Matteo cucina ogni giorno. */
const GRUPPI: { id: Allenamento; titolo: string }[] = [
  { id: "cardio", titolo: "Per il cardio" },
  { id: "pesi", titolo: "Per i pesi" },
  { id: "entrambi", titolo: "Per cardio e pesi" },
];

export default function MealPrepPescara() {
  const briciole = [{ nome: PAGINA.breve, href: PAGINA.percorso }];
  const gruppi = GRUPPI.map((g) => ({ ...g, piatti: PIATTI.filter((p) => p.allenamento === g.id) })).filter(
    (g) => g.piatti.length > 0,
  );

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
            // La pagina parla del servizio descritto qui sotto, non della cucina in generale.
            about: { "@id": idServizio(PAGINA.percorso, "servizio") },
            dataModifica: AGGIORNAMENTO,
          }),
          nodoServizio({
            id: "servizio",
            percorso: PAGINA.percorso,
            nome: "Meal prep a Pescara",
            descrizione:
              "Piatti freschi, mai surgelati, cucinati ogni giorno da Matteo Pattanè per chi si allena, con ingredienti, allergeni e macro su ogni porzione. Ritiro in sede o consegna in zona.",
            tipoServizio: "Meal prep",
            prezzoDa: SOGLIA_PREZZO,
          }),
        ]}
      />

      <section className="testata">
        <div className="wrap">
          <Briciole voci={briciole} />
          <p className="occhiello mt-10">Pescara · Via del Santuario 214</p>
          <h1 className="titolo-pagina mt-6 max-w-[13ch]">Meal prep a Pescara, cucinato da Matteo.</h1>
          <p className="lead mt-6">
            FUEL LAB è il meal prep fresco di Matteo Pattanè a Pescara: piatti già composti, mai surgelati, con
            ingredienti e macro scritti su ogni porzione. Matteo cucina ogni giorno: tu scegli, ritiri in sede o
            chiedi la consegna in zona.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link href="/menu" className="btn btn-ink">
              Guarda il menu <span className="freccia">→</span>
            </Link>
            <Link href="/settimana" className="link">
              Componi la settimana
            </Link>
          </div>
          <InBreve className="mt-16" />
        </div>
      </section>

      <section className="sezione">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <p className="occhiello">Che cos&apos;è</p>
            <h2 className="titolo mt-5 max-w-[12ch]">Meal prep, detto semplice.</h2>
          </Reveal>
          <Reveal delay={80} className="grid gap-6 text-lg leading-relaxed">
            <p>
              Meal prep vuol dire avere i pasti della settimana pronti prima che arrivi la fame. Di solito tocca a te:
              la spesa, due ore ai fornelli, le vaschette in fila nel frigo. Con FUEL LAB quella parte la fa Matteo, un
              cuoco, qui a Pescara.
            </p>
            <p>
              Non è un piatto surgelato da scongelare e non è un catering. Sono piatti chiusi, già composti, con
              ingredienti e porzioni decisi da Matteo. Su ogni piatto trovi i grammi della porzione, le calorie, le
              proteine, i carboidrati e i grassi.
            </p>
            <p>
              Non è nemmeno una dieta: i numeri del tuo fabbisogno li decide il tuo nutrizionista, se ne hai uno.
              FUEL LAB ti dà piatti di cui conosci il contenuto, così li scegli con i tuoi criteri.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="sezione carta-2">
        <div className="wrap">
          <Reveal>
            <p className="occhiello">Come funziona</p>
            <h2 className="titolo mt-5 max-w-[15ch]">Dalla scelta al frigo, in quattro passi.</h2>
          </Reveal>
          <ol className="mt-14 grid gap-10 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            {PASSI.map((p, i) => (
              <Reveal as="li" key={p.n} delay={i * 80} className="border-t-[3px] border-ink pt-6">
                <span className="num text-sm text-muted">{p.n}</span>
                <h3 className="titolo-s mt-3">{p.titolo}</h3>
                <p className="mt-3 max-w-[34ch] text-muted">{p.testo}</p>
                <Link href={p.link.href} className="link mt-5 inline-block">
                  {p.link.label}
                </Link>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="notte relative overflow-hidden">
        <FotoPiena foto="cuoco" velo="forte" />
        <div className="wrap relative py-[var(--sezione)]">
          <Reveal>
            <p className="occhiello">Cardio e pesi</p>
            <h2 className="titolo mt-5 max-w-[14ch]">Un piatto per ogni allenamento.</h2>
            <p className="mt-6 max-w-[56ch] text-lg" style={{ color: "rgb(243 239 230 / .9)" }}>
              Ogni piatto del menu è segnato per i giorni di cardio, per quelli di pesi o per entrambi. E Matteo cucina
              ogni giorno: quello che mangi non arriva da una sola grande preparazione della domenica.
            </p>
          </Reveal>
          <div className={`mt-12 grid gap-10 ${gruppi.length > 2 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            {gruppi.map((g, i) => (
              <Reveal key={g.id} delay={i * 80} className="border-t-[3px] border-lime pt-5">
                <h3 className="occhiello">{g.titolo}</h3>
                <ul className="mt-5 grid gap-3">
                  {g.piatti.map((p) => (
                    <li key={p.id}>
                      <Link href={`/menu/${p.id}`} className="text-lg underline-offset-4 hover:text-lime hover:underline">
                        {p.nome}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
          <p className="mt-10 max-w-[60ch] text-steel">
            Per sapere quanto si conserva un piatto e come scaldarlo, segui le indicazioni che ricevi con il piatto; se
            hai dubbi, chiedi a Matteo prima di mangiarlo.
          </p>
        </div>
      </section>

      <section className="sezione">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <p className="occhiello">Per chi è</p>
            <h2 className="titolo mt-5 max-w-[12ch]">Per chi si allena. E per chi non ha tempo.</h2>
          </Reveal>
          <div>
            <ul className="grid gap-8 sm:grid-cols-2">
              {PER_CHI.map((c, i) => (
                <Reveal as="li" key={c.titolo} delay={i * 70} className="border-t border-ink/15 pt-5">
                  <h3 className="font-disp text-lg font-bold tracking-[.04em] uppercase">{c.titolo}</h3>
                  <p className="mt-2 text-muted">{c.testo}</p>
                </Reveal>
              ))}
            </ul>
            <p className="mt-10 max-w-[60ch] text-muted">
              Se hai un&apos;allergia importante o una condizione medica, la scheda online non basta: parla con Matteo
              prima di ordinare e segui le indicazioni del tuo medico o nutrizionista.{" "}
              <Link href={PAGINE.proteici.percorso} className="link">
                I pasti proteici, piatto per piatto
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="sezione carta-2">
        <div className="wrap">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="occhiello">Il menu</p>
              <h2 className="titolo mt-5 max-w-[14ch]">Tre piatti, per cominciare.</h2>
            </div>
            <Link href="/menu" className="link">
              Tutti i piatti, con ingredienti e macro
            </Link>
          </Reveal>
          <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {PIATTI.slice(0, 3).map((p) => (
              <li key={p.id}>
                <CartaPiatto piatto={p} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sezione">
        <div className="wrap">
          <Reveal>
            <p className="occhiello">Dove, come, quanto</p>
            <h2 className="titolo mt-5 max-w-[14ch]">Ritiro, consegna e prezzo.</h2>
          </Reveal>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            <Reveal className="border-t-[3px] border-ink pt-6">
              <h3 className="titolo-s">Ritiro</h3>
              <p className="mt-3 text-muted">
                In {INDIRIZZO_RIGA}. Giorno e orario si concordano con Matteo quando confermi la richiesta.
              </p>
              <a href={LINK_MAPPA} target="_blank" rel="noopener noreferrer" className="link mt-5 inline-block">
                Apri in Google Maps
              </a>
            </Reveal>
            <Reveal delay={80} className="border-t-[3px] border-ink pt-6">
              <h3 className="titolo-s">Consegna</h3>
              <p className="mt-3 text-muted">
                A Pescara e dintorni, fino a {RAGGIO_CONSEGNA_KM} km, con giorno e orario concordati. La copertura del tuo indirizzo si
                conferma prima dell&apos;ordine.
              </p>
              <Link href={PAGINE.consegna.percorso} className="link mt-5 inline-block">
                Comuni e zone di consegna
              </Link>
            </Reveal>
            <Reveal delay={160} className="border-t-[3px] border-ink pt-6">
              <h3 className="titolo-s">Prezzo</h3>
              <p className="mt-3 text-muted">
                Da <span className="evidenzia font-semibold text-ink">{PREZZO} € a pasto</span>. Il prezzo finale te lo
                conferma Matteo con la richiesta: sul sito non si paga niente. Se vuoi i pasti di tutta la
                settimana senza ordinare ogni volta, ci sono cinque abbonamenti mensili da {PREZZO_DA_TESTO} al mese:
                Matteo cucina il piano del tuo nutrizionista e lo porta con giorno e orario concordati.
              </p>
              <div className="mt-5 flex flex-wrap gap-x-8 gap-y-4">
                <Link href="/servizi" className="link">
                  Servizi e prezzi
                </Link>
                <Link href={PAGINE.abbonamento.percorso} className="link">
                  Gli abbonamenti
                </Link>
              </div>
            </Reveal>
          </div>
          <p className="mt-12 max-w-[64ch] text-muted">
            Preferisci che Matteo cucini direttamente da te?{" "}
            <Link href={PAGINE.domicilio.percorso} className="link">
              Il cuoco a domicilio a Pescara
            </Link>
          </p>
        </div>
      </section>

      <section className="sezione border-t border-ink/15">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="occhiello">Domande</p>
            <h2 className="titolo mt-5">Meal prep a Pescara: le risposte.</h2>
          </div>
          <Faq domande={DOMANDE} />
        </div>
        <div className="wrap mt-10">
          <Aggiornato />
        </div>
      </section>

      <LinkBlog
        slug={[
          "meal-prep-pescara-cosa-significa",
          "menu-settimanale-pescara-come-pianificarlo",
          "conservare-pasti-preparati-frigorifero",
        ]}
        titolo="Il meal prep, spiegato con calma."
      />

      <ChiusuraCta />
    </>
  );
}
