import Link from "next/link";
import Reveal from "@/components/Reveal";
import Faq from "@/components/come-funziona/Faq";
import { RiquadroAbbonamento } from "@/components/home/Abbonamento";
import FotoPiena from "@/components/ui/FotoPiena";
import Briciole from "@/components/seo/Briciole";
import JsonLd from "@/components/seo/JsonLd";
import LinkBlog from "@/components/seo/LinkBlog";
import { AGGIORNAMENTO, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { nodiPagina, nodoServizio, prezzoIt, type DomandaTesto } from "@/components/seo/schema";
import {
  ABBONAMENTO_CONSEGNA_GRATIS,
  LINK_RICHIEDI_ABBONAMENTO,
  LINK_SCRIVI_ABBONAMENTO,
  PREZZO_ABBONAMENTO,
  PREZZO_ABBONAMENTO_TESTO,
  SOGLIA_CONSEGNA_GRATIS,
} from "@/lib/abbonamento";
import { CONSIGLI } from "@/lib/consigli";
import { SOGLIA_PREZZO } from "@/lib/servizi";
import { INDIRIZZO, INDIRIZZO_RIGA, elencoZone } from "@/lib/sito";

/* L'abbonamento mensile ai pranzi: 239 euro al mese per tutti i pranzi dal
   lunedi' al venerdi', composti da Matteo sulla scheda del cliente. Una pagina
   di vendita che dice solo quello che il committente ha deciso: niente durate
   minime, disdette o pagamenti online, perche' non esistono. Inizio, consegna
   o ritiro e pagamento si concordano con Matteo, e la pagina lo scrive. */

const PAGINA = PAGINE.abbonamento;
const PREZZO_PASTO = prezzoIt(SOGLIA_PREZZO);

export const metadata = metadatiPagina(PAGINA);

const PASSI = [
  {
    n: "01",
    titolo: "Mandi la scheda",
    testo:
      "La scheda del tuo nutrizionista, con calorie, proteine, carboidrati e grassi. Oppure racconti a Matteo come ti alleni e cosa vuoi ottenere.",
    link: { href: "/scheda", label: "Dai tuoi macro" },
  },
  {
    n: "02",
    titolo: "Matteo compone i pranzi",
    testo:
      "Sulla tua scheda compone i pranzi del mese, dal lunedì al venerdì, pensati per i giorni di cardio e per quelli di pesi. Con i macro scritti su ogni piatto.",
    link: { href: "/menu", label: "I piatti del menu" },
  },
  {
    n: "03",
    titolo: "Ritiri o ricevi, ogni giorno",
    testo: `Matteo cucina ogni giorno e consegna ogni giorno: ritiri in ${INDIRIZZO.via} o ricevi a casa o al lavoro, se sei in zona.`,
    link: { href: PAGINE.consegna.percorso, label: "Ritiro e consegna" },
  },
  {
    n: "04",
    titolo: "Si rinnova con Matteo",
    testo:
      "A fine mese si rinnova d'accordo con lui. Inizio, consegna o ritiro e pagamento si concordano insieme: sul sito non si paga niente.",
    link: { href: LINK_SCRIVI_ABBONAMENTO, label: "Scrivi a Matteo" },
  },
];

const PER_CHI = [
  {
    titolo: "Chi pranza al lavoro",
    testo:
      "Un pranzo pronto per ogni giorno feriale, già porzionato: niente cucina la sera prima e niente improvvisazione in pausa pranzo.",
  },
  {
    titolo: "Chi segue una scheda",
    testo:
      "I numeri del nutrizionista servono se li rispetti anche a pranzo, tutti i giorni, non solo quando hai tempo di cucinare.",
  },
  {
    titolo: "Chi si allena con costanza",
    testo: `Pranzi pensati per l'allenamento del giorno. Nei giorni di cardio, ${CONSIGLI.cardio.regola.toLowerCase()} Nei giorni di pesi, ${CONSIGLI.pesi.regola.toLowerCase()}`,
  },
  {
    titolo: "Chi non vuole pensarci",
    testo:
      "Niente settimana da comporre e niente scelte da rifare a ogni ordine: un prezzo al mese e i pranzi sono decisi.",
  },
];

const CONFRONTO = [
  {
    voce: "Cosa copre",
    menu: "I pasti che scegli, anche solo per qualche giorno",
    abbonamento: "Tutti i pranzi dal lunedì al venerdì, per il mese",
  },
  {
    voce: "Chi sceglie i piatti",
    menu: "Tu, dal menu o con il compositore",
    abbonamento: "Matteo, sulla tua scheda",
  },
  {
    voce: "Prezzo",
    menu: `Da ${PREZZO_PASTO} € a pasto`,
    abbonamento: `${PREZZO_ABBONAMENTO_TESTO} al mese`,
  },
  {
    voce: "Quando si decide",
    menu: "A ogni settimana che componi",
    abbonamento: "Una volta al mese, con Matteo",
  },
  {
    voce: "Consegna",
    menu: `Gratis dai ${SOGLIA_CONSEGNA_GRATIS} pasti in su`,
    abbonamento: ABBONAMENTO_CONSEGNA_GRATIS
      ? `Una ventina di pranzi: sopra la soglia dei ${SOGLIA_CONSEGNA_GRATIS} pasti`
      : "Da concordare con Matteo",
  },
];

/* Solo testo: le stesse stringhe finiscono nei dati strutturati FAQPage. */
const DOMANDE: DomandaTesto[] = [
  {
    q: "Quanto costa l'abbonamento ai pranzi?",
    a: `${PREZZO_ABBONAMENTO_TESTO} al mese. Comprende tutti i pranzi dal lunedì al venerdì per tutto il mese, composti sulla tua scheda. Sul sito non si paga niente: inizio, consegna o ritiro e pagamento si concordano con Matteo.`,
  },
  {
    q: "Che cosa comprende, esattamente?",
    a: "I pranzi di tutti i giorni feriali, dal lunedì al venerdì, per l'intero mese: piatti freschi, mai surgelati, con ingredienti, allergeni e macro dichiarati. Se ti servono anche altri pasti, per esempio le cene, puoi aggiungerli con il menu della settimana.",
  },
  {
    q: "Che cosa vuol dire che i pranzi sono sulla mia scheda?",
    a: "Che si compongono su quello che sai di te. Se ti segue un nutrizionista, bastano i suoi quattro numeri: calorie, proteine, carboidrati e grassi. Non è una dieta: i numeri li decide il professionista che ti segue, Matteo li cucina.",
  },
  {
    q: "Non ho un nutrizionista: posso abbonarmi lo stesso?",
    a: `Sì. Racconti a Matteo come ti alleni, quante volte e cosa vuoi ottenere, e i pranzi seguono la stessa regola del menu: nei giorni di cardio, ${CONSIGLI.cardio.regola.toLowerCase()} Nei giorni di pesi, ${CONSIGLI.pesi.regola.toLowerCase()}`,
  },
  {
    q: "Come arrivano i pranzi?",
    a: `Matteo cucina ogni giorno e consegna ogni giorno. Puoi ritirarli in ${INDIRIZZO_RIGA} oppure riceverli a casa o al lavoro a ${elencoZone()}: la copertura del tuo indirizzo si conferma prima di iniziare.`,
  },
  ...(ABBONAMENTO_CONSEGNA_GRATIS
    ? [
        {
          q: "La consegna si paga a parte?",
          a: `Con una ventina di pranzi al mese sei sopra la soglia dei ${SOGLIA_CONSEGNA_GRATIS} pasti da cui la consegna è gratis, come indicato in Servizi e prezzi. Resta da confermare che il tuo indirizzo sia in zona; in alternativa c'è il ritiro in sede.`,
        },
      ]
    : []),
  {
    q: "Ho un'allergia o un'intolleranza: posso abbonarmi?",
    a: "Dillo a Matteo prima di iniziare. Gli allergeni sono dichiarati in ogni scheda del menu, ma per sostituzioni e possibili contaminazioni serve la sua conferma: la scheda online da sola non basta.",
  },
  {
    q: "Che differenza c'è con il menu della settimana?",
    a: `Con il menu della settimana scegli tu i piatti, anche solo per qualche giorno, da ${PREZZO_PASTO} € a pasto. Con l'abbonamento Matteo compone tutti i tuoi pranzi dal lunedì al venerdì sulla tua scheda, a ${PREZZO_ABBONAMENTO_TESTO} al mese.`,
  },
];

export default function AbbonamentoPage() {
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
            id: "abbonamento",
            percorso: PAGINA.percorso,
            nome: "Abbonamento mensile ai pranzi",
            descrizione:
              "Tutti i pranzi dal lunedì al venerdì per un mese, composti da Matteo Pattanè sulla scheda del cliente (allenamento, obiettivi o numeri del nutrizionista) e cucinati freschi a Pescara. Ritiro in sede o consegna in zona.",
            tipoServizio: "Meal prep in abbonamento",
            prezzoMese: PREZZO_ABBONAMENTO,
          }),
        ]}
      />

      <section className="testata">
        <div className="wrap">
          <Briciole voci={briciole} />
          <div className="mt-10 grid items-start gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div className="min-w-0">
              {/* La parola chiave sta nell'occhiello dentro l'h1, come in home e in
                  /servizi: "abbonamento" in corpo titolo-xl non entra in mezza pagina. */}
              <h1>
                <span className="occhiello">Abbonamento pranzi a Pescara</span>
                <span className="titolo-xl mt-6 block max-w-[12ch]">Un mese di pranzi.</span>
              </h1>
              <p className="titolo-s mt-4 text-muted">Composti sulla tua scheda.</p>
              <p className="lead mt-8">
                Tutti i tuoi pranzi dal lunedì al venerdì, per un mese intero, composti da Matteo sulla tua scheda:
                come ti alleni, cosa vuoi ottenere o i numeri del tuo nutrizionista. Un prezzo fisso, niente da
                comporre ogni settimana.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
                <Link href={LINK_SCRIVI_ABBONAMENTO} className="link">
                  Scrivi a Matteo
                </Link>
                <a href="#come-funziona" className="link">
                  Come funziona
                </a>
              </div>
            </div>
            <RiquadroAbbonamento delay={80} />
          </div>
        </div>
      </section>

      <section className="sezione">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <p className="occhiello">Che cos&apos;è</p>
            <h2 className="titolo mt-5 max-w-[12ch]">Il pranzo, deciso una volta.</h2>
          </Reveal>
          <Reveal delay={80} className="grid gap-6 text-lg leading-relaxed">
            <p>
              L&apos;abbonamento è il modo più semplice di mangiare FUEL LAB tutti i giorni. Invece di comporre la
              settimana piatto per piatto, dai a Matteo la tua scheda una volta sola: lui compone i pranzi del mese,
              dal lunedì al venerdì, e li cucina freschi.
            </p>
            <p>
              La scheda è quello che sai di te. Se ti segue un nutrizionista, bastano i suoi quattro numeri: calorie,
              proteine, carboidrati e grassi, gli stessi che puoi provare nella pagina{" "}
              <Link href="/scheda" className="link">
                Dai tuoi macro
              </Link>
              . Se non ce l&apos;hai, racconti come ti alleni e cosa vuoi ottenere.
            </p>
            <p>
              Non è una dieta e non è una consulenza: i numeri del tuo fabbisogno li decide il professionista che ti
              segue. Matteo li cucina, con ingredienti, allergeni e macro scritti su ogni piatto.
            </p>
          </Reveal>
        </div>
      </section>

      <section id="come-funziona" className="sezione carta-2 scroll-mt-[calc(var(--nav-h)+16px)]">
        <div className="wrap">
          <Reveal>
            <p className="occhiello">Come funziona</p>
            <h2 className="titolo mt-5 max-w-[15ch]">Dalla scheda al pranzo, in quattro passi.</h2>
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

      <section className="sezione">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <p className="occhiello">Per chi è</p>
            <h2 className="titolo mt-5 max-w-[12ch]">Per chi il pranzo non lo vuole improvvisare.</h2>
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
              Se hai un&apos;allergia importante o una condizione medica, parla con Matteo prima di iniziare e segui
              le indicazioni del tuo medico o nutrizionista.
            </p>
          </div>
        </div>
      </section>

      <section className="notte">
        <div className="wrap py-[var(--sezione)]">
          <Reveal>
            <p className="occhiello">A confronto</p>
            <h2 className="titolo mt-5 max-w-[16ch]">Abbonamento o menu della settimana?</h2>
          </Reveal>
          <div className="mt-12 overflow-x-auto" role="region" tabIndex={0} aria-label="Confronto fra i due servizi">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <caption className="sr-only">Differenze fra il menu della settimana e l&apos;abbonamento mensile</caption>
              <thead>
                <tr className="font-disp text-[11px] font-semibold tracking-[.16em] text-steel uppercase">
                  <td className="w-[22%] py-4 pr-6" />
                  <th scope="col" className="py-4 pr-6">
                    Menu della settimana
                  </th>
                  <th scope="col" className="py-4">
                    Abbonamento
                  </th>
                </tr>
              </thead>
              <tbody>
                {CONFRONTO.map((r) => (
                  <tr key={r.voce} className="border-t align-top" style={{ borderColor: "var(--line)" }}>
                    <th scope="row" className="py-4 pr-6 font-disp text-sm font-semibold tracking-[.08em] uppercase">
                      {r.voce}
                    </th>
                    <td className="py-4 pr-6" style={{ color: "rgb(243 239 230 / .88)" }}>
                      {r.menu}
                    </td>
                    <td className="py-4 text-lime">{r.abbonamento}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-10 max-w-[60ch] text-steel">
            Preferisci scegliere tu, settimana per settimana?{" "}
            <Link href="/settimana" className="link">
              Componi la settimana
            </Link>{" "}
            con i piatti del menu, oppure guarda{" "}
            <Link href="/servizi" className="link">
              tutti i servizi
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="sezione">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="occhiello">Domande</p>
            <h2 className="titolo mt-5">Prima di iniziare: le risposte.</h2>
          </div>
          <Faq domande={DOMANDE} />
        </div>
      </section>

      <LinkBlog
        slug={["pranzo-lavoro-pescara-organizzarlo", "pranzo-proteico-ufficio", "macro-cosa-sono-come-leggerli"]}
        titolo="Il pranzo, organizzato."
      />

      <section className="notte relative overflow-hidden">
        <FotoPiena foto="schiscette" velo="forte" />
        <div className="wrap relative py-[calc(var(--sezione)*1.2)]">
          <Reveal>
            <h2 className="titolo max-w-[15ch]">Il prossimo mese, il pranzo è pronto.</h2>
            <p className="mt-6 max-w-[48ch]" style={{ color: "rgb(243 239 230 / .88)" }}>
              Richiedi l&apos;abbonamento dal tuo account, oppure scrivi a Matteo: ti risponde lui, e insieme fissate
              inizio, consegna o ritiro e pagamento.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link href={LINK_RICHIEDI_ABBONAMENTO} className="btn btn-lime min-w-[min(100%,340px)] justify-between">
                Richiedi l&apos;abbonamento <span aria-hidden="true" className="freccia">→</span>
              </Link>
              <Link href={LINK_SCRIVI_ABBONAMENTO} className="link">
                Scrivi a Matteo
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
