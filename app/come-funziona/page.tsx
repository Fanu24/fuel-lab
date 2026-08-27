import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ticker from "@/components/Ticker";
import { Eyebrow, SectionHead, Rise } from "@/components/ui";
import Faq, { type Domanda } from "@/components/come-funziona/Faq";
import { PRIMI, SECONDI } from "@/lib/catalogo";

export const metadata: Metadata = {
  title: "Come funziona",
  description:
    "Quattro passi dalla scheda del nutrizionista al tuo frigo, il confronto onesto tra fresco e surgelato e le risposte vere su conservazione, consegne, allergeni e disdetta.",
};

/*
 * NOTA REDAZIONALE (non va in pagina): i testi di questa pagina - i quattro
 * passi, il confronto fresco/surgelato e le risposte della FAQ - sono
 * segnaposto. Vanno riscritti con Matteo, numeri e date compresi, prima di
 * andare online.
 */

/**
 * Le foto non legate a un elemento del catalogo. Stessa firma di elementoImg(),
 * ma il tipo tiene la lista chiusa ai soli id gia in uso altrove nel sito: un
 * refuso si ferma alla compilazione invece di diventare un riquadro vuoto in
 * produzione. Le foto degli elementi non passano da qui, quelle hanno
 * elementoImg().
 */
type IdFoto =
  | "photo-1466637574441-749b8f19452f"
  | "photo-1414235077428-338989a2e8c0"
  | "photo-1498837167922-ddd27525d352"
  | "photo-1432139555190-58524dae6a55"
  | "photo-1518843875459-f738682238a6"
  | "photo-1505576399279-565b52d4ac71";

function foto(id: IdFoto, w = 1000): string {
  return `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;
}

interface Passo {
  n: string;
  titolo: string;
  testo: string;
  dati: string[];
  img: IdFoto;
  alt: string;
  /** rotazione applicata solo da md in su: sotto, la griglia si raddrizza */
  rot: string;
  /** numero in contorno invece che pieno, per rompere la ripetizione */
  vuoto: boolean;
  etichetta: string;
}

const PASSI: Passo[] = [
  {
    n: "01",
    titolo: "Scegli il menu o carica la scheda",
    testo:
      `${PRIMI.length} primi e ${SECONDI.length} secondi online, con grammi e macro scritti sopra ognuno: puoi comporre la tua settimana a mano in cinque minuti. Se hai una scheda del nutrizionista la carichi e ci pensa il matcher, che sceglie gli abbinamenti piu vicini ai tuoi numeri. Quello che non ti va lo sostituisci, e i totali si ricalcolano davanti a te.`,
    dati: [`${PRIMI.length + SECONDI.length} elementi`, "PDF o foto"],
    img: "photo-1466637574441-749b8f19452f",
    alt: "Tagliere di legno con uova, avocado e pomodori, gli ingredienti di partenza",
    rot: "md:rotate-[-2.4deg]",
    vuoto: false,
    etichetta: "Il punto di partenza",
  },
  {
    n: "02",
    titolo: "Matteo cucina il lunedi e il giovedi",
    testo:
      "Non c'e' un magazzino da svuotare. La spesa arriva la mattina presto, la cottura finisce nel pomeriggio, i contenitori si chiudono e vanno in abbattitore a piu 3 gradi, non a meno 18. La schiscetta che apri mercoledi sera e' stata in padella lunedi mattina: sono due giorni, non due stagioni.",
    dati: ["2 cotture a settimana", "0 scorte"],
    img: "photo-1414235077428-338989a2e8c0",
    alt: "Impiattamento in una cucina professionale, mani che completano un piatto",
    rot: "md:rotate-[2.1deg]",
    vuoto: true,
    etichetta: "In giornata",
  },
  {
    n: "03",
    titolo: "Consegna a Pescara e provincia",
    testo:
      "Il giro parte nel pomeriggio dello stesso giorno di cottura. La fascia la scegli tu quando ordini, 17:00-19:00 oppure 19:00-21:00, e ricevi un messaggio quando il furgone esce. Se a casa non c'e' nessuno l'ordine torna in frigo da Matteo e riprovi il giorno dopo: non lo lasciamo sullo zerbino a luglio.",
    dati: ["17:00-21:00", "Pescara + provincia"],
    img: "photo-1498837167922-ddd27525d352",
    alt: "Contenitori di meal prep con porzioni pesate, pronti per la consegna",
    rot: "md:rotate-[-1.6deg]",
    vuoto: false,
    etichetta: "Due fasce",
  },
  {
    n: "04",
    titolo: "In frigo 4 giorni, tre minuti e sei a tavola",
    testo:
      "Padella coperta a fuoco medio, tre minuti, un cucchiaio d'acqua perche i cereali non si asciughino. Oppure microonde a 900 W per due minuti, con il coperchio appoggiato ma non chiuso. Non serve altro e non serve scongelare niente: e' cibo gia cotto, lo stai solo riportando in temperatura.",
    dati: ["3 min padella", "2 min microonde"],
    img: "photo-1432139555190-58524dae6a55",
    alt: "Piatto di carne con patate e verdure, gia pronto da mangiare",
    rot: "md:rotate-[2.4deg]",
    vuoto: true,
    etichetta: "Nessuno scongelamento",
  },
];

const DOMANDE: Domanda[] = [
  {
    q: "Quanto durano davvero in frigo?",
    a: (
      <>
        <strong>Quattro giorni dalla consegna.</strong> Sull&apos;etichetta trovi la data e
        l&apos;ora di cottura, non una scadenza generica stampata a monte: il quarto giorno e&apos;
        l&apos;ultimo utile, non un margine di sicurezza gonfiato per stare tranquilli. Tienile nel
        ripiano centrale del frigo, tra 0 e 4 gradi, con il coperchio chiuso. Oltre il quarto giorno
        non le mangeremmo neanche noi.
      </>
    ),
  },
  {
    q: "Posso congelarle io?",
    a: (
      <>
        Si, ed e&apos; la cosa piu sensata da fare se sai gia che salterai un giorno. Falla pero il
        giorno stesso della consegna, non il terzo: congelare qualcosa che ha gia tre giorni non
        recupera niente. Sappi solo che al riscaldamento il riso e le verdure perdono un po&apos; di
        consistenza. Hai comprato del fresco e lo stai trasformando in un surgelato casalingo:
        legittimo, ma e&apos; un passo indietro.
      </>
    ),
  },
  {
    q: "Come si scaldano, esattamente?",
    a: (
      <>
        <strong>Padella:</strong> coperta, fuoco medio, tre minuti, un cucchiaio d&apos;acqua. E&apos;
        il metodo che restituisce meglio le carni. <strong>Microonde:</strong> 900 W per due minuti,
        coperchio appoggiato ma non chiuso, mescolando a meta. <strong>Forno:</strong> 180 gradi per
        quindici minuti, se hai tempo e vuoi la resa migliore sulle cotture lunghe. I nostri
        contenitori reggono tutti e tre.
      </>
    ),
  },
  {
    q: "I contenitori si buttano? Li ritirate?",
    a: (
      <>
        Sono in polipropilene monomateriale (PP 5): lavabili in lavastoviglie e riciclabili nella
        plastica. Se li lasci puliti fuori dalla porta alla consegna successiva li ritiriamo e li
        rimettiamo in ciclo, e ti scaliamo 30 centesimi a contenitore sull&apos;ordine dopo. Non e&apos;
        obbligatorio e non facciamo la predica a nessuno. Abbiamo provato il vetro, che non regge il
        trasporto in furgone, e il compostabile monouso, che cede dopo due giorni in frigo: per ora
        questo e&apos; il compromesso meno peggiore.
      </>
    ),
  },
  {
    q: "Posso saltare una settimana?",
    a: (
      <>
        Si, dal tuo account oppure con un messaggio a Matteo, <strong>entro il venerdi</strong> della
        settimana precedente. L&apos;abbonamento va in pausa, non si azzera: quando torni ritrovi i
        tuoi target, le tue esclusioni e gli elementi che avevi messo da parte. Non c&apos;e&apos; un
        limite al numero di pause: ferie e trasferte non sono un problema da risolvere con una
        penale.
      </>
    ),
  },
  {
    q: "Come disdico l'abbonamento?",
    a: (
      <>
        Con un click dal tuo account, o scrivendo. Nessun preavviso di trenta giorni, nessuna penale,
        nessuna telefonata per convincerti a restare. L&apos;unica regola e&apos; sempre il{" "}
        <strong>venerdi</strong>: dopo quel giorno la spesa della settimana successiva e&apos; gia
        stata fatta, e quella settimana la paghi. E&apos; l&apos;unico modo che conosciamo per non buttare
        cibo gia comprato.
      </>
    ),
  },
  {
    q: "E se cambio dieta a meta percorso?",
    a: (
      <>
        Carichi la scheda nuova e la settimana successiva viene ricomposta sui numeri nuovi, senza disdire
        e riscriverti. Succede spesso: le schede si aggiornano ogni sei-otto settimane, ed e&apos;
        esattamente il motivo per cui il matcher lavora sui tuoi target e non su un menu fisso
        deciso a settembre.
      </>
    ),
  },
  {
    q: "Ho un'allergia o un'intolleranza.",
    a: (
      <>
        In fase di ordine escludi i tag che non puoi mangiare e quegli elementi spariscono dal tuo
        catalogo, non restano li grigi a tentarti. Su ogni etichetta trovi l&apos;elenco completo
        degli allergeni del lotto. Un avvertimento onesto: la cucina e&apos; una sola e lavora anche
        glutine, pesce e frutta a guscio, quindi{" "}
        <strong>non possiamo garantire l&apos;assenza di contaminazione crociata</strong>. Se hai una
        celiachia o un&apos;allergia diagnosticata scrivici prima: ti diciamo la verita, anche quando
        la verita e&apos; che non facciamo al caso tuo.
      </>
    ),
  },
  {
    q: "Dove trovo gli allergeni di ogni primo e secondo?",
    a: (
      <>
        Ogni primo, secondo ed extra del catalogo dichiara i suoi allergeni: e&apos; un campo
        obbligatorio, come impone il{" "}
        <strong>Regolamento UE 1169/2011</strong>, e non un&apos;etichetta aggiunta dopo. Li vedi
        mentre componi la tua settimana, prima ancora di ordinare, non solo sul contenitore alla
        consegna.
      </>
    ),
  },
  {
    q: "Il mio nutrizionista puo parlare con Matteo?",
    a: (
      <>
        Volentieri, e capita spesso. Ci sentiamo per capire come e&apos; costruita la scheda, quali
        sostituzioni accetta e dove c&apos;e&apos; margine di manovra sui contorni. Chiedi al tuo
        professionista di scriverci: rispondiamo entro il giorno lavorativo successivo. Quello che
        non facciamo mai e&apos; toccare la tua dieta di nostra iniziativa: noi la traduciamo in
        una settimana di primi e secondi, non la correggiamo.
      </>
    ),
  },
  {
    q: "Come faccio vedere la settimana al mio nutrizionista?",
    a: (
      <>
        Quando componi la tua settimana ottieni un link: lo mandi al tuo nutrizionista su WhatsApp
        o via mail, e lui lo apre e vede esattamente i primi, i secondi e i macro che hai scelto,
        senza doversi registrare da nessuna parte. Puo approvarla cosi com&apos;e&apos; o segnarti
        cosa cambiare, e tu aggiorni la settimana di conseguenza.
      </>
    ),
  },
  {
    q: "Quali zone servite?",
    a: (
      <>
        Pescara citta, Montesilvano, Spoltore, Francavilla al Mare, Citta Sant&apos;Angelo, Chieti e
        Chieti Scalo, San Giovanni Teatino. Oltre i venti chilometri dalla cucina la catena del
        freddo diventa un rischio che non ci prendiamo, e preferiamo dire di no che consegnare
        qualcosa di tiepido. Se sei appena fuori zona scrivici lo stesso: quando in un comune si accumulano
        abbastanza ordini, il giro lo apriamo.
      </>
    ),
  },
  {
    q: "A che ora consegnate?",
    a: (
      <>
        Lunedi e giovedi pomeriggio, in due fasce: <strong>17:00-19:00</strong> e{" "}
        <strong>19:00-21:00</strong>. Scegli quella che vuoi al momento dell&apos;ordine, e puoi
        cambiarla settimana per settimana. Ricevi un messaggio quando il furgone parte, cosi non
        resti in casa ad aspettare per due ore.
      </>
    ),
  },
];

/** Riga di un elenco del confronto. Sul blocco lime il pallino deve scurirsi. */
function Voce({ children, scuro = false }: { children: ReactNode; scuro?: boolean }) {
  return (
    <li className="flex gap-3">
      <i
        aria-hidden="true"
        className="mt-[9px] h-[6px] w-[6px] flex-none rotate-45"
        style={{ background: scuro ? "rgba(6,23,16,.5)" : "var(--color-lime)" }}
      />
      <span>{children}</span>
    </li>
  );
}

export default function ComeFunziona() {
  return (
    <>
      {/* ========================= TESTATA ========================= */}
      {/* overflow-x-clip come le altre testate del sito: taglia solo le sporgenze
          laterali, senza trasformare la sezione in un contenitore di scorrimento */}
      <section className="relative overflow-x-clip pt-[152px] pb-[110px] md:pt-[190px] md:pb-[150px]">
        <div className="wrap">
          <div className="grid gap-16 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,.96fr)] lg:items-end lg:gap-20">
            <div>
              <Reveal>
                <Eyebrow className="mb-[30px]">Il servizio</Eyebrow>
              </Reveal>
              <h1 className="h1">
                <Rise i={0}>Fresco vuol dire</Rise>
                <Rise i={1}>
                  <span className="hl">che scade.</span>
                </Rise>
              </h1>

              {/* il lead entra dopo le due righe del titolo, non insieme: fuel-rise qui
                  non va, perche senza la maschera di .ln slitterebbe sopra il titolo */}
              <Reveal delay={520}>
                <p className="lead mt-10">
                  Il surgelato dura sei mesi perche a meno 18 gradi non succede piu niente: ne il
                  buono ne il cattivo. Non e&apos; cibo appena cotto, e&apos; cibo messo in pausa.
                </p>
                <p className="lead mt-5">
                  Le nostre schiscette durano <b className="text-ink">quattro giorni in frigo</b>.
                  Non e&apos; un limite del servizio da nascondere in fondo alla pagina: e&apos; la
                  prova che dentro c&apos;e&apos; roba viva, cotta lunedi mattina e non lo scorso
                  marzo.
                </p>
                <p className="note mt-11">Cucina FUEL LAB / Pescara / due cotture a settimana</p>
              </Reveal>
            </div>

            {/* La figura ruota e il blocco lime le esce dall'angolo solo da lg, dove
                la colonna e' stretta. Sotto lg la griglia e' a colonna singola: una
                figura larga quanto il .wrap, inclinata, uscirebbe dal viewport. */}
            <Reveal delay={300} className="relative">
              <figure className="shell lg:rotate-[-2.4deg]">
                <div className="core relative aspect-[4/5]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={foto("photo-1518843875459-f738682238a6", 900)}
                    alt="Verdure crude fotografate su fondo nero, la materia prima del giorno"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(180deg, transparent 42%, rgba(6,23,16,.82))" }}
                  />
                  <figcaption className="note absolute right-6 bottom-6 left-6">
                    Abbattuto a piu 3 gradi. Mai a meno 18.
                  </figcaption>
                </div>
              </figure>

              <div
                className="mt-6 inline-flex items-end gap-4 rounded-[26px] bg-lime px-7 py-6 text-ink lg:absolute lg:-bottom-10 lg:-left-9 lg:mt-0 lg:rotate-[2.1deg]"
                style={{ boxShadow: "0 34px 66px -34px rgba(223,255,62,.45)" }}
              >
                <span
                  className="font-mono text-[52px] leading-[.8]"
                  style={{ fontVariationSettings: '"wdth" 75, "wght" 700' }}
                >
                  4
                </span>
                <span className="pb-1">
                  <span
                    className="block font-mono text-[11px] leading-tight uppercase"
                    style={{
                      fontVariationSettings: '"wdth" 84',
                      letterSpacing: ".2em",
                      color: "rgba(6,23,16,.62)",
                    }}
                  >
                    Giorni in frigo
                  </span>
                  <span
                    className="block text-[14px] leading-tight"
                    style={{ fontVariationSettings: '"wdth" 106, "wght" 700' }}
                  >
                    poi si butta
                  </span>
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ====================== I QUATTRO PASSI ====================== */}
      <section className="py-[110px] md:py-[150px]">
        <div className="wrap">
          <Reveal>
            <SectionHead
              occhiello="Quattro passi"
              titolo={
                <>
                  Dalla scheda
                  <br />
                  al tuo frigo
                </>
              }
              testo="Nessun abbonamento da decifrare, nessun corriere che passa quando gli pare. Quattro passaggi, e tre li fa Matteo."
            />
          </Reveal>

          <ol className="mt-2 flex flex-col gap-[92px] md:gap-[130px]">
            {PASSI.map((p, i) => {
              const invertito = i % 2 === 1;
              return (
                // foto e colonna di testo sono due Reveal distinti: entrano sfalsate,
                // non come un blocco unico che si alza tutto insieme
                <li
                  key={p.n}
                  className="relative grid items-center gap-9 md:grid-cols-2 md:gap-14 lg:gap-20"
                >
                  <Reveal
                    as="figure"
                    className={`shell relative order-1 ${invertito ? "md:order-2" : "md:order-1"} ${p.rot}`}
                  >
                    <div className="core aspect-[16/11]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={foto(p.img, 900)}
                        alt={p.alt}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {/* Da md l'etichetta esce dal guscio e si inclina verso la gronda
                        centrale della griglia. Sotto md non sparisce (era un pezzo di
                        contenuto perso sul telefono): resta nel flusso dentro il guscio,
                        dritta. Fondo pieno, non vetro smerigliato: sta sopra una foto
                        opaca, il blur non aveva niente da sfocare. */}
                    {/* .note e' muted di default (4.45:1 sul guscio tray, sotto AA):
                        qui sta proprio sul guscio, quindi forza ink (11.26:1). */}
                    <span
                      className={`note mt-[10px] ml-[6px] inline-block rounded-full border px-4 py-[7px] md:absolute md:-top-4 md:mt-0 md:ml-0 ${
                        invertito ? "md:-left-5 md:rotate-[-3deg]" : "md:-right-5 md:rotate-[3deg]"
                      }`}
                      style={{
                        borderColor: "var(--hair)",
                        background: "var(--color-tray)",
                        color: "var(--color-ink)",
                      }}
                    >
                      {p.etichetta}
                    </span>
                  </Reveal>

                  <Reveal delay={180} className={`order-2 ${invertito ? "md:order-1" : "md:order-2"}`}>
                    {/* l'ordinale e' gia nella semantica dell'<ol>: qui e' disegno,
                        e uno screen reader non deve leggere "zero uno" due volte */}
                    <p
                      aria-hidden="true"
                      className="font-mono text-[clamp(56px,9vw,102px)] leading-[.78]"
                      style={{
                        fontVariationSettings: '"wdth" 75, "wght" 700',
                        // Il lime non e' mai testo su fondo chiaro (1.00:1, misurato):
                        // la cifra e' sempre inchiostro (12.66:1 su carta), il lime resta
                        // solo come contorno sulla variante "vuoto", per rompere la
                        // ripetizione senza sparire nella carta.
                        color: "var(--color-ink)",
                        WebkitTextStroke: p.vuoto ? "1.5px var(--color-lime)" : undefined,
                      }}
                    >
                      {p.n}
                    </p>
                    <h3 className="h3 mt-6">{p.titolo}</h3>
                    <p className="mt-5 max-w-[46ch] text-[16.5px] leading-[1.66]">{p.testo}</p>
                    <div className="mt-7 flex flex-wrap gap-2">
                      {p.dati.map((d) => (
                        <span key={d} className="chip chip-k">
                          {d}
                        </span>
                      ))}
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ================== FRESCO CONTRO SURGELATO ================== */}
      <section className="py-[110px] md:py-[150px]">
        <div className="wrap">
          <Reveal>
            <SectionHead
              occhiello="Il confronto onesto"
              titolo={
                <>
                  Fresco contro
                  <br />
                  surgelato
                </>
              }
              testo="Il surgelato non e' il nemico: e' un prodotto diverso, che risolve un problema diverso. Ecco dove vince lui e dove perdiamo noi."
            />
          </Reveal>

          <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
            <Reveal className="shell md:rotate-[-1.6deg]">
              <div className="core p-8 md:p-10">
                <p className="note">Opzione A</p>
                <h3 className="h3 mt-3">Il surgelato</h3>

                {/* h4 e non p: sono i due titoli che dividono la scheda, e da tastiera
                    o da screen reader si salta per intestazioni, non per paragrafi */}
                <h4
                  className="mt-9 mb-4 text-[11.5px] font-normal tracking-[.24em] text-ink uppercase"
                  style={{ fontVariationSettings: '"wdth" 112, "wght" 700' }}
                >
                  Dove vince
                </h4>
                <ul className="flex flex-col gap-3 text-[15.5px] leading-[1.6]">
                  <Voce>Dura sei mesi nel congelatore. Ne compri dodici e te ne dimentichi.</Voce>
                  <Voce>Si spedisce in tutta Italia: funziona anche se abiti a Bolzano.</Voce>
                  <Voce>Costa meno, perche la produzione e&apos; su scala industriale.</Voce>
                  <Voce>Non ha finestre di consegna: arriva quando arriva, e va bene lo stesso.</Voce>
                </ul>

                <h4
                  className="mt-10 mb-4 text-[11.5px] font-normal tracking-[.24em] uppercase"
                  style={{
                    fontVariationSettings: '"wdth" 112, "wght" 700',
                    color: "var(--color-muted)",
                  }}
                >
                  Dove perde
                </h4>
                <ul
                  className="flex flex-col gap-3 text-[15.5px] leading-[1.6]"
                  style={{ color: "var(--color-muted)" }}
                >
                  <Voce>
                    A meno 18 gradi l&apos;acqua dentro le fibre cristallizza: il petto di pollo esce
                    asciutto, le verdure molli.
                  </Voce>
                  <Voce>Lo scongelamento e&apos; un passaggio in piu, e va programmato la sera prima.</Voce>
                  <Voce>
                    Il condimento serve a coprire la consistenza persa, non a completare il piatto.
                  </Voce>
                </ul>
              </div>
            </Reveal>

            {/* Il nostro lato, in lime pieno: si riconosce senza leggere una riga.
                Stessa scocca della scheda A, guscio 26 + nucleo 18, perche' due schede
                che si confrontano devono avere la stessa forma: cambia il colore, non
                la grammatica. A distinguerle bastano il lime e lo scalino di 4rem. */}
            <Reveal delay={110} className="md:rotate-[1.6deg] lg:mt-16">
              <div
                className="shell h-full"
                style={{ background: "var(--color-lime)", borderColor: "transparent" }}
              >
                <div
                  className="core h-full p-8 text-ink md:p-10"
                  style={{ background: "var(--color-lime)" }}
                >
                  <p
                    className="font-mono text-[11px] tracking-[.22em] uppercase"
                    style={{ fontVariationSettings: '"wdth" 84', color: "rgba(6,23,16,.6)" }}
                  >
                    Opzione B
                  </p>
                  <h3 className="h3 mt-3 text-ink">Il fresco / FUEL LAB</h3>

                  <h4
                    className="mt-9 mb-4 text-[11.5px] font-normal tracking-[.24em] uppercase"
                    style={{ fontVariationSettings: '"wdth" 112, "wght" 700' }}
                  >
                    Dove vince
                  </h4>
                  <ul className="flex flex-col gap-3 text-[15.5px] leading-[1.6]">
                    <Voce scuro>
                      Cotto il giorno stesso: consistenza e sapore sono quelli di un piatto appena
                      fatto, non di un piatto risorto.
                    </Voce>
                    <Voce scuro>
                      Apri, scaldi tre minuti, mangi. Niente da programmare la sera prima.
                    </Voce>
                    <Voce scuro>
                      I macro sono pesati sul crudo del lotto di quel giorno, non su una media di
                      stabilimento.
                    </Voce>
                    <Voce scuro>
                      Le verdure sono di stagione perche non possono essere altro: si comprano la
                      mattina.
                    </Voce>
                  </ul>

                  <h4
                    className="mt-10 mb-4 text-[11.5px] font-normal tracking-[.24em] uppercase"
                    style={{
                      fontVariationSettings: '"wdth" 112, "wght" 700',
                      color: "rgba(6,23,16,.62)",
                    }}
                  >
                    Il prezzo da pagare
                  </h4>
                  <ul
                    className="flex flex-col gap-3 text-[15.5px] leading-[1.6]"
                    style={{ color: "rgba(6,23,16,.72)" }}
                  >
                    <Voce scuro>
                      Quattro giorni e poi si butta. Il frigo non diventa un magazzino.
                    </Voce>
                    <Voce scuro>
                      Solo Pescara e provincia. Fuori dai venti chilometri non arriviamo, e non
                      fingiamo di poterlo fare.
                    </Voce>
                    <Voce scuro>
                      Costa piu di un surgelato industriale: siamo una cucina con una persona
                      dentro, non uno stabilimento.
                    </Voce>
                    <Voce scuro>
                      Devi decidere entro il venerdi. La spesa si fa prima di cucinare.
                    </Voce>
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={80}>
            <p className="lead mt-16 max-w-[64ch] md:mt-24">
              Se abiti fuori dall&apos;Abruzzo, o se vuoi riempire il congelatore e non pensarci per
              un mese, <b className="text-ink">il surgelato e&apos; la scelta giusta</b> e non
              proveremo a convincerti del contrario. FUEL LAB ha senso se vivi qui, se mangi per
              allenarti, e se ti sei stufato di piatti che tornano tutti allo stesso sapore.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ===================== DOMANDE FREQUENTI ===================== */}
      <section className="py-[110px] md:py-[150px]">
        <div className="wrap">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,.78fr)_minmax(0,1.22fr)] lg:gap-20">
            <Reveal>
              {/* la testata resta agganciata mentre si scorre l'elenco delle risposte */}
              <div className="lg:sticky lg:top-[124px]">
                <Eyebrow className="mb-[26px]">Domande frequenti</Eyebrow>
                <h2 className="h2">
                  Le cose
                  <br />
                  che chiedete
                  <br />
                  davvero
                </h2>
                {/* il conteggio esce dall'elenco: aggiungere una domanda non lascia
                    indietro un numero scritto a mano nel paragrafo accanto */}
                <p className="mt-7 max-w-[38ch] text-[16px] leading-[1.66]">
                  {DOMANDE.length} risposte scritte come le daremmo al telefono, comprese quelle che
                  non ci fanno bella figura.
                </p>
                <p className="note mt-9">Non trovi la tua? Scrivi a Matteo</p>
              </div>
            </Reveal>

            <Reveal delay={110}>
              <Faq domande={DOMANDE} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ====================== TICKER + CHIUSURA ====================== */}
      <Ticker
        parole={["Cotto in giornata", "4 giorni in frigo", "Mai surgelato", "Pescara e provincia"]}
        durata={38}
      />

      <section className="py-[110px] md:py-[150px]">
        <div className="wrap">
          <Reveal className="shell md:rotate-[-1.1deg]">
            <div className="core grid md:grid-cols-[minmax(0,1.18fr)_minmax(0,.82fr)]">
              <div className="p-9 md:p-14">
                <Eyebrow className="mb-[26px]">Il passo uno</Eyebrow>
                <h2 className="h2">
                  Il menu e&apos; gia
                  <br />
                  online.
                </h2>
                <p className="lead mt-7">
                  {PRIMI.length} primi e {SECONDI.length} secondi con grammi e macro alla luce del
                  sole. Guardali, oppure salta la scelta e lascia che sia la tua scheda a comporre
                  la tua settimana.
                </p>
                <div className="mt-10 flex flex-wrap gap-3">
                  <Link href="/menu" className="btn btn-p">
                    Guarda il menu
                    <span className="dot" aria-hidden="true">
                      &#8594;
                    </span>
                  </Link>
                  <Link href="/scheda" className="btn btn-s">
                    Carica la scheda
                    <span className="dot" aria-hidden="true">
                      &#8594;
                    </span>
                  </Link>
                </div>
                <p className="note mt-9">Consegne lunedi e giovedi / disdici quando vuoi</p>
              </div>

              <figure className="relative min-h-[240px] md:min-h-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto("photo-1505576399279-565b52d4ac71", 800)}
                  alt="Contenitori di meal prep chiusi, pronti per la consegna"
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {/* La sfumatura salda la foto al nucleo, quindi deve puntare dove sta
                    la giunzione: in colonna singola e' il bordo alto, da md e' il
                    fianco sinistro. Con un solo 90deg, sul telefono restava una banda
                    scura di traverso e uno stacco netto sopra. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[linear-gradient(180deg,var(--color-card),rgba(14,42,32,.15)_46%,transparent)] md:bg-[linear-gradient(90deg,var(--color-card),rgba(14,42,32,.15)_46%,transparent)]"
                />
              </figure>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
