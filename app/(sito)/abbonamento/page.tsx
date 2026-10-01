import Link from "next/link";
import Reveal from "@/components/Reveal";
import Faq from "@/components/come-funziona/Faq";
import BoxDelGiorno from "@/components/abbonamento/BoxDelGiorno";
import ChiusuraAbbonamento from "@/components/abbonamento/ChiusuraAbbonamento";
import Formule from "@/components/abbonamento/Formule";
import Passi from "@/components/abbonamento/Passi";
import PerOgniDieta from "@/components/abbonamento/PerOgniDieta";
import { RiquadroDa } from "@/components/abbonamento/RiquadroPrezzi";
import ScontiEProva from "@/components/abbonamento/ScontiEProva";
import { FasciaProvider } from "@/components/abbonamento/FasciaScelta";
import Simulatore from "@/components/abbonamento/Simulatore";
import {
  CIRCA_A_PASTO_FRASE,
  PASTI_SETTIMANA_MAX,
  PASTI_SETTIMANA_MIN,
  ZONA_A_PAROLE,
  inLettere,
  percentuale,
} from "@/components/abbonamento/righe";
import Briciole from "@/components/seo/Briciole";
import JsonLd from "@/components/seo/JsonLd";
import LinkBlog from "@/components/seo/LinkBlog";
import { AGGIORNAMENTO, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { nodiPagina, nodoAbbonamenti, prezzoIt, type DomandaTesto } from "@/components/seo/schema";
import {
  BOX_DEL_GIORNO_TESTO,
  CONSEGNA_OGNI_GIORNI,
  DIETE,
  FORMULE,
  LINK_SCRIVI_ABBONAMENTO,
  NOMI_FASCIA,
  NOTE_FASCIA,
  PREZZO_DA_TESTO,
  SCONTI,
} from "@/lib/abbonamento";
import { CONSIGLI } from "@/lib/consigli";
import { SOGLIA_PREZZO } from "@/lib/servizi";
import { INDIRIZZO_RIGA } from "@/lib/sito";

/* Gli abbonamenti: "Cinque tagli, uno è il tuo." Cinque formule (dal pranzo dal
   lunedi' al venerdi' ai tre pasti tutti i giorni), ognuna in fascia Standard o
   Plus, con il piano del nutrizionista cucinato ai grammi e portato ogni 3
   giorni. Prezzi, sconti, nomi e testi delle formule non sono scritti qui: li
   legge tutti da lib/abbonamento.ts, come le schede singole in ./[formula].
   Una pagina di vendita che dice solo quello che il committente ha deciso:
   niente durate minime, disdette o pagamenti online, perche' il committente non li ha detti.
   Inizio, consegna o ritiro e pagamento si concordano con Matteo. */

const PAGINA = PAGINE.abbonamento;
const PREZZO_PASTO = prezzoIt(SOGLIA_PREZZO);

export const metadata = metadatiPagina(PAGINA);

/* "Full 6: 624 €": con i due punti la cifra del nome ("Full 6") e il prezzo non si leggono come un numero solo.
   Lo spazio prima del "€" non va a capo (U+00A0). */
const PREZZI_STANDARD = FORMULE.map((f) => `${f.nome}: ${f.prezzo.standard}\u00a0€`).join("; ");
const PLUS_DA = Math.min(...FORMULE.map((f) => f.prezzo.plus));
const PLUS_FINO_A = Math.max(...FORMULE.map((f) => f.prezzo.plus));

const CONFRONTO = [
  {
    voce: "Cosa copre",
    menu: "I pasti che scegli, anche solo per qualche giorno",
    abbonamento: `I pasti del tuo piano, da ${PASTI_SETTIMANA_MIN} a ${PASTI_SETTIMANA_MAX} a settimana, secondo la formula`,
  },
  {
    voce: "Chi sceglie i piatti",
    menu: "Tu, dal menu o con il compositore",
    abbonamento: "Il piano scritto dal tuo nutrizionista, che Matteo cucina ai grammi",
  },
  {
    voce: "Prezzo",
    menu: `Da ${PREZZO_PASTO} € a pasto`,
    abbonamento: `Da ${PREZZO_DA_TESTO} al mese, in base alla formula e alla fascia`,
  },
  {
    voce: "Consegna",
    menu: "Ogni giorno, a casa o al ritiro",
    abbonamento: `Ogni ${CONSEGNA_OGNI_GIORNI} giorni, a casa o al ritiro (ritiro in laboratorio ${percentuale(SCONTI.ritiro)})`,
  },
  {
    voce: "Per iniziare",
    menu: "Componi la settimana e scrivi a Matteo",
    abbonamento: "Prenoti la settimana di prova, senza impegno",
  },
];

/* "Per chi vuole..." diventa "per chi vuole...": le note delle fasce sono frasi intere, qui stanno dopo i due punti. */
const minuscola = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

/* Solo testo: le stesse stringhe finiscono nei dati strutturati FAQPage. */
const DOMANDE: DomandaTesto[] = [
  {
    q: "Quanto costa un abbonamento?",
    a: `Dipende dalla formula e dalla fascia. In fascia Standard, al mese: ${PREZZI_STANDARD}. ${CIRCA_A_PASTO_FRASE} La fascia Plus costa di più: da ${PLUS_DA} a ${PLUS_FINO_A} € al mese. Ritiro in laboratorio ${percentuale(SCONTI.ritiro)}, in coppia ${percentuale(SCONTI.coppia)}, in famiglia ${percentuale(SCONTI.famiglia)}. Il prezzo finale lo conferma Matteo: sul sito non si paga niente.`,
  },
  {
    q: "Che differenza c'è fra Standard e Plus?",
    a: `${NOMI_FASCIA.standard}: ${minuscola(NOTE_FASCIA.standard)} ${CIRCA_A_PASTO_FRASE} ${NOMI_FASCIA.plus}: ${minuscola(NOTE_FASCIA.plus)} Ogni formula esiste in tutte e due le fasce.`,
  },
  {
    q: "Che cosa devo portare?",
    a: "Il piano scritto dal tuo nutrizionista. Ce lo lasci e noi lo prepariamo ai grammi, nel nostro laboratorio a Pescara: nessuna dieta da inventare, niente spesa, niente bilancia. Quando richiedi l'abbonamento lo scrivi o lo incolli nella scheda per Matteo; se scrivi senza account, nel messaggio. Non è una dieta e non è una consulenza: i numeri li decide il professionista che ti segue, Matteo li cucina.",
  },
  {
    q: "Non ho un nutrizionista: posso abbonarmi lo stesso?",
    a: `Sì. Racconti a Matteo come ti alleni, quante volte e cosa vuoi ottenere, e i pasti seguono la stessa regola del menu: nei giorni di cardio, ${CONSIGLI.cardio.regola.toLowerCase()} Nei giorni di pesi, ${CONSIGLI.pesi.regola.toLowerCase()}`,
  },
  {
    q: "Per quali diete cucinate?",
    a: `Per ogni dieta: ${DIETE.join(", ")}. Qualunque sia il piano, lo cuciniamo noi.`,
  },
  {
    q: "Come arrivano i pasti?",
    a: `Ogni ${inLettere(CONSEGNA_OGNI_GIORNI)} giorni te li portiamo a casa, oppure li ritiri in laboratorio in ${INDIRIZZO_RIGA} con ${percentuale(SCONTI.ritiro)}: sono i pasti dei ${inLettere(CONSEGNA_OGNI_GIORNI)} giorni successivi, già pronti da scaldare. ${ZONA_A_PAROLE}. Giorno e orario si concordano con Matteo, e la copertura del tuo indirizzo si conferma prima di iniziare.`,
  },
  {
    q: "Come funziona la settimana di prova?",
    a: "La prima settimana è di prova, senza impegno. Inizio, consegna o ritiro e pagamento si concordano con Matteo: sul sito non si paga niente.",
  },
  {
    q: "Ho un'allergia o un'intolleranza: posso abbonarmi?",
    a: "Dillo a Matteo prima di iniziare e parlane anche con il tuo medico o nutrizionista. Per sostituzioni e possibili contaminazioni serve la conferma di Matteo: la scheda online da sola non basta.",
  },
  {
    q: "Che differenza c'è con il menu della settimana?",
    a: `Con il menu della settimana scegli tu i piatti, anche solo per qualche giorno, da ${PREZZO_PASTO} € a pasto, con consegna ogni giorno. Con l'abbonamento Matteo cucina il piano scritto dal tuo nutrizionista, a un prezzo al mese (da ${PREZZO_DA_TESTO}), e te lo porta ogni ${inLettere(CONSEGNA_OGNI_GIORNI)} giorni.`,
  },
  {
    q: "Cosa sono le box del giorno?",
    a: `Ogni giorno cuciniamo qualcosa in più. Quello che avanza diventa una box pronta a prezzo piccolo, ${BOX_DEL_GIORNO_TESTO}: mangi bene anche senza abbonarti, e niente si spreca.`,
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
          nodoAbbonamenti(),
        ]}
      />

      <section className="testata">
        <div className="wrap">
          <Briciole voci={briciole} />
          <div className="mt-10 grid items-start gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div className="min-w-0">
              {/* La parola chiave sta nell'occhiello dentro l'h1, come in home e in
                  /servizi: "abbonamenti pasti a Pescara" in corpo titolo-xl non entra in mezza pagina. */}
              <h1>
                <span className="occhiello">Abbonamenti pasti a Pescara</span>
                {/* Due righe fisse: a corpo titolo-xl il titolo andava su quattro righe e
                    la virgola di "tagli," toccava l'accento di "è". */}
                <span className="titolo-xl mt-6 block text-[clamp(34px,5.2vw,80px)] leading-[.98]">
                  <span className="block">Cinque tagli,</span> <span className="block">uno è il tuo.</span>
                </span>
              </h1>
              <p className="titolo-s mt-4 text-muted">Il piano del tuo nutrizionista, cucinato.</p>
              {/* Sul telefono il riquadro dei prezzi sta sotto il testo, fuori dal primo schermo: il prezzo si
                  legge subito qui. Dal computer il riquadro e' accanto, e questa riga non serve. */}
              <p className="mt-6 lg:hidden">
                <span className="evidenzia font-disp text-xl font-bold tracking-[.06em] uppercase">
                  Da {PREZZO_DA_TESTO} al mese
                </span>
                <span className="mt-2 block text-sm text-muted">
                  Cinque formule, in Standard o Plus. La prima settimana è di prova, senza impegno.
                </span>
              </p>
              <p className="lead mt-6 lg:mt-8">
                Porti la dieta. Pensiamo noi a tutto il resto. FUEL LAB cucina i pasti della tua dieta e te li porta
                pronti a casa, ogni {inLettere(CONSEGNA_OGNI_GIORNI)} giorni, a Pescara e nel raggio di venti
                chilometri. Tu ci consegni il piano scritto dal tuo nutrizionista, noi lo prepariamo ai grammi nel
                nostro laboratorio. Nessuna dieta da inventare, niente spesa, niente bilancia.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
                <a href="#formule" className="btn btn-ink">
                  Scegli il tuo taglio <span aria-hidden="true" className="freccia">↓</span>
                </a>
                <Link href={LINK_SCRIVI_ABBONAMENTO} className="link">
                  Scrivi a Matteo
                </Link>
              </div>
            </div>
            <RiquadroDa delay={80} />
          </div>
        </div>
      </section>

      {/* Le formule e il simulatore condividono la fascia scelta. */}
      <FasciaProvider>
      <section id="formule" className="sezione carta-2 scroll-mt-[calc(var(--nav-h)+16px)]">
        <div className="wrap">
          <Reveal>
            <p className="occhiello">Le formule</p>
            <h2 className="titolo mt-5 max-w-[16ch]">Scegli quanti pasti vuoi delegare.</h2>
            <p className="lead mt-6">Ogni formula esiste in Standard o Plus, e la prima settimana è di prova.</p>
          </Reveal>
          <div className="mt-12">
            <Formule />
          </div>
        </div>
      </section>

      <section id="simulatore" className="notte scroll-mt-[calc(var(--nav-h)+16px)]">
        <div className="wrap py-[var(--sezione)]">
          <Reveal>
            <p className="occhiello">Il simulatore</p>
            <h2 className="titolo mt-5 max-w-[16ch]">Fai il conto del tuo taglio.</h2>
            <p className="mt-6 max-w-[52ch] text-lg text-steel">
              Scegli formula e fascia, poi dicci se ritiri in laboratorio e se ti abboni da solo o in compagnia. È una
              stima: il prezzo finale lo conferma Matteo.
            </p>
          </Reveal>
          <div className="mt-12">
            <Simulatore />
          </div>
        </div>
      </section>

      </FasciaProvider>

      <section id="come-funziona" className="sezione scroll-mt-[calc(var(--nav-h)+16px)]">
        <div className="wrap">
          <Reveal>
            <p className="occhiello">Come funziona</p>
            <h2 className="titolo mt-5 max-w-[16ch]">Porti il piano. Al resto pensiamo noi.</h2>
          </Reveal>
          <div className="mt-14">
            <Passi />
          </div>
          <Reveal className="mt-20 border-t border-ink/15 pt-14">
            <PerOgniDieta />
            <p className="mt-10 max-w-[60ch] text-muted">
              Non è una dieta e non è una consulenza: i numeri li decide il professionista che ti segue, Matteo li
              cucina. Se hai un&apos;allergia importante o una condizione medica, parlane con Matteo prima di iniziare
              e con il tuo medico o nutrizionista.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="sezione carta-2">
        <div className="wrap">
          <ScontiEProva />
        </div>
      </section>

      <BoxDelGiorno />

      <section className="sezione">
        <div className="wrap">
          <Reveal>
            <p className="occhiello">A confronto</p>
            <h2 className="titolo mt-5 max-w-[16ch]">Abbonamento o menu della settimana?</h2>
          </Reveal>
          <dl className="mt-10 border-t-[3px] border-ink md:hidden">
            {CONFRONTO.map((r) => (
              <div key={r.voce} className="border-b border-ink/15 py-5">
                <dt className="font-disp text-sm font-semibold tracking-[.08em] uppercase">{r.voce}</dt>
                <dd className="mt-3 text-muted">
                  <span className="block font-disp text-[11px] font-semibold tracking-[.16em] uppercase">Menu della settimana</span>
                  {r.menu}
                </dd>
                <dd className="mt-3">
                  <span className="block font-disp text-[11px] font-semibold tracking-[.16em] text-muted uppercase">Abbonamento</span>
                  <span className="font-semibold">{r.abbonamento}</span>
                </dd>
              </div>
            ))}
          </dl>
          {/* Da 768px la tabella entra sempre nella pagina: niente scorrimento e niente area da raggiungere con Tab.
              Sotto i 768px c'e' la lista qui sopra. */}
          <div className="mt-12 hidden md:block">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Differenze fra il menu della settimana e l&apos;abbonamento</caption>
              <thead>
                <tr className="font-disp text-[11px] font-semibold tracking-[.16em] text-muted uppercase">
                  <th scope="col" className="w-[22%] py-4 pr-6">
                    <span className="sr-only">Voce</span>
                  </th>
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
                  <tr key={r.voce} className="border-t border-ink/15 align-top">
                    <th scope="row" className="py-4 pr-6 font-disp text-sm font-semibold tracking-[.08em] uppercase">
                      {r.voce}
                    </th>
                    <td className="py-4 pr-6 text-muted">{r.menu}</td>
                    <td className="py-4 font-semibold">{r.abbonamento}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-10 max-w-[60ch] text-muted">
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

      <section className="sezione border-t border-ink/15">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="occhiello">Domande</p>
            <h2 className="titolo mt-5">Prima di iniziare: le risposte.</h2>
          </div>
          <Faq domande={DOMANDE} />
        </div>
      </section>

      <LinkBlog
        slug={["meal-prep-pescara-cosa-significa", "macro-cosa-sono-come-leggerli", "conservare-pasti-preparati-frigorifero"]}
        titolo="Mangiare secondo il piano, spiegato."
      />

      <ChiusuraAbbonamento />
    </>
  );
}
