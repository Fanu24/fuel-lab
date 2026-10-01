import Link from "next/link";
import Reveal from "@/components/Reveal";
import ChiusuraCta from "@/components/home/ChiusuraCta";
import Faq from "@/components/come-funziona/Faq";
import Fatti, { FATTO_PREZZO, FATTO_RITIRO } from "@/components/ui/Fatti";
import TagAllenamento from "@/components/ui/TagAllenamento";
import Aggiornato from "@/components/seo/Aggiornato";
import Briciole from "@/components/seo/Briciole";
import JsonLd from "@/components/seo/JsonLd";
import LinkBlog from "@/components/seo/LinkBlog";
import { AGGIORNAMENTO, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { assoluto, elencoPiatti, nodiPagina, type DomandaTesto } from "@/components/seo/schema";
import { PIATTI, extraPerReparto, type Piatto } from "@/lib/catalogo";
import { PREZZO_DA_TESTO } from "@/lib/abbonamento";
import { CONSIGLI } from "@/lib/consigli";

/* I pasti proteici, con i numeri del catalogo e nient'altro: la tabella, le
   fonti di proteine lette dagli ingredienti, i piatti per pesi e cardio. Ogni
   cifra qui si calcola da lib/catalogo.ts, cosi' non puo' restare indietro
   quando cambia un piatto. */

const PAGINA = PAGINE.proteici;

export const metadata = metadatiPagina(PAGINA);

const PER_PROTEINE = [...PIATTI].sort((a, b) => b.proteine - a.proteine);
const PIU_PROTEICO = PER_PROTEINE[0];
const MIN = Math.min(...PIATTI.map((p) => p.proteine));
const MAX = PIU_PROTEICO.proteine;
const SENZA_CARNE = PIATTI.filter((p) => p.tag.includes("veg"));

/** Quota di energia che viene dalle proteine, in percentuale intera. */
function quotaProteine(p: Piatto): number {
  return Math.round(((p.proteine * 4) / p.kcal) * 100);
}

/** Proteine ogni 100 g di piatto, con un decimale all'italiana. */
function proteineEtto(p: Piatto): string {
  return ((p.proteine / p.grammi) * 100).toFixed(1).replace(".", ",");
}

/* Gli ingredienti che portano la parte grossa delle proteine, riconosciuti
   per nome negli ingredienti del piatto. */
const FONTI = ["petto di pollo", "fesa di maiale", "uova", "ricotta", "ricotta fresca", "parmigiano", "formaggio tipo quark"];

function fontiProteiche(p: Piatto): string[] {
  return p.ingredienti
    .filter((i) => FONTI.includes(i.nome.toLowerCase()))
    .map((i) => {
      const nome = i.nome.toLowerCase();
      if (i.grammi) return `${nome} ${i.grammi} g`;
      if (i.nota && /^\d+$/.test(i.nota)) return `${nome} (${i.nota})`;
      return nome;
    });
}

function elenco(nomi: string[]): string {
  if (nomi.length < 2) return nomi.join("");
  return `${nomi.slice(0, -1).join(", ")} e ${nomi[nomi.length - 1]}`;
}

const perPesi = PER_PROTEINE.filter((p) => p.allenamento === "pesi" || p.allenamento === "entrambi");
const perCardio = PER_PROTEINE.filter((p) => p.allenamento === "cardio" || p.allenamento === "entrambi");
const proteineExtra = extraPerReparto("proteine").map((e) => e.nome.toLowerCase());

const DOMANDE: DomandaTesto[] = [
  {
    q: "Quante proteine hanno i piatti?",
    a: `Da ${MIN} a ${MAX} g a porzione. Il piatto con più proteine è ${PIU_PROTEICO.nome}: ${PIU_PROTEICO.proteine} g in ${PIU_PROTEICO.grammi} g di piatto.`,
  },
  {
    q: "Come sono calcolati i valori?",
    a: "Sono i valori pubblicati nel catalogo per la porzione intera. Le calorie sono sempre la somma di proteine e carboidrati per 4 e dei grassi per 9, quindi i quattro numeri tornano fra loro.",
  },
  {
    q: "Sono piatti per dimagrire o per la massa?",
    a: "Nessuno dei due, di per sé: sono piatti con valori dichiarati. Se hai un obiettivo di peso o di composizione corporea, usa i numeri insieme al piano del tuo nutrizionista.",
  },
  {
    q: "Posso aggiungere proteine al piatto?",
    a: `Sì. Nel compositore ogni piatto si arricchisce con una proteina in più, fra cui ${elenco(proteineExtra.slice(0, 4))}. Il supplemento, dove c'è, è indicato nel menu.`,
  },
  {
    q: "Ci sono piatti proteici senza carne?",
    a: `Sì: ${elenco(SENZA_CARNE.map((p) => p.nome.toLowerCase()))} non contengono né carne né pesce. Le proteine vengono soprattutto da uova e formaggi.`,
  },
  {
    q: "Vanno bene per il pranzo dopo la palestra?",
    a: "Sono pensati per chi si allena e sono pronti da scaldare, quindi sì, se l'orario ti torna. Cosa mangiare dopo l'allenamento dipende da te e da chi ti segue: il menu ti dà i piatti e i numeri per scegliere.",
  },
];

export default function PastiProteiciPescara() {
  const briciole = [{ nome: PAGINA.breve, href: PAGINA.percorso }];

  return (
    <>
      <JsonLd
        dati={[
          ...nodiPagina({
            percorso: PAGINA.percorso,
            nome: PAGINA.titolo,
            descrizione: PAGINA.descrizione,
            tipo: "CollectionPage",
            briciole,
            faq: DOMANDE,
            // Le domande occupano mainEntity: l'elenco dei piatti si aggancia alla pagina come "citato".
            mentions: [{ "@id": `${assoluto(PAGINA.percorso)}#piatti` }],
            dataModifica: AGGIORNAMENTO,
          }),
          elencoPiatti(PAGINA.percorso, "Piatti FUEL LAB ordinati per proteine", PER_PROTEINE),
        ]}
      />

      <section className="testata">
        <div className="wrap">
          <Briciole voci={briciole} />
          <p className="occhiello mt-10">Per chi va in palestra</p>
          <h1 className="titolo-pagina mt-6 max-w-[13ch]">Pasti proteici a Pescara, con i numeri veri.</h1>
          <p className="lead mt-6">
            {PIATTI.length} piatti cucinati da Matteo a Pescara, da {MIN} a {MAX} g di proteine a porzione. Per ognuno
            trovi calorie, proteine, carboidrati e grassi della porzione intera: gli stessi numeri della scheda del
            piatto.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link href="/settimana" className="btn btn-ink">
              Componi la settimana <span className="freccia">→</span>
            </Link>
            <Link href="/scheda" className="link">
              Parti dai tuoi macro
            </Link>
          </div>
          <Fatti className="mt-10" voci={[`${PIATTI.length} piatti con i macro scritti`, FATTO_PREZZO, FATTO_RITIRO]} />
        </div>
      </section>

      <section className="pb-[var(--sezione)]">
        <div className="wrap">
          <h2 className="titolo-s">I piatti, ordinati per proteine.</h2>
          {/* Sotto i 1024px una tabella da nove colonne obbligherebbe a scorrere di lato per leggere un solo piatto:
              ogni piatto diventa una scheda con gli stessi numeri. Dal computer resta la tabella, da confrontare per colonna. */}
          <ul className="mt-8 border-t-[3px] border-ink md:grid md:grid-cols-2 md:gap-x-12 lg:hidden">
            {PER_PROTEINE.map((p) => (
              <li key={p.id} className="border-b border-ink/15 py-5">
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/menu/${p.id}`} className="font-semibold underline-offset-4 hover:underline">
                    {p.nome}
                  </Link>
                  <TagAllenamento tipo={p.allenamento} breve className="shrink-0" />
                </div>
                <p className="mt-3 flex items-baseline gap-3">
                  <span className="num text-2xl font-semibold">
                    <span className="evidenzia">{p.proteine} g</span>
                  </span>
                  <span className="font-disp text-xs font-semibold tracking-[.14em] text-muted uppercase">di proteine</span>
                </p>
                <dl className="mt-4 grid grid-cols-3 gap-x-4 gap-y-3">
                  {[
                    ["Porzione", `${p.grammi} g`],
                    ["Kcal", `${p.kcal}`],
                    ["Carbo", `${p.carboidrati} g`],
                    ["Grassi", `${p.grassi} g`],
                    ["Prot. / 100 g", `${proteineEtto(p)} g`],
                    ["Kcal da prot.", `${quotaProteine(p)}%`],
                  ].map(([voce, valore]) => (
                    <div key={voce}>
                      <dt className="font-disp text-[11px] font-semibold tracking-[.08em] whitespace-nowrap text-muted uppercase">{voce}</dt>
                      <dd className="num mt-1 text-[15px]">{valore}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
          <div className="mt-8 hidden border-t-[3px] border-ink lg:block">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">
                Valori nutrizionali per porzione intera dei piatti FUEL LAB, ordinati per proteine
              </caption>
              <thead>
                <tr className="font-disp text-[11px] font-semibold tracking-[.16em] text-muted uppercase">
                  <th scope="col" className="py-4 pr-4">Piatto</th>
                  <th scope="col" className="py-4 pr-4">Per</th>
                  <th scope="col" className="py-4 pr-4 text-right">Porzione</th>
                  <th scope="col" className="py-4 pr-4 text-right">Kcal</th>
                  <th scope="col" className="py-4 pr-4 text-right">Proteine</th>
                  <th scope="col" className="py-4 pr-4 text-right">Carbo</th>
                  <th scope="col" className="py-4 pr-4 text-right">Grassi</th>
                  <th scope="col" className="py-4 pr-4 text-right">Prot. / 100 g</th>
                  <th scope="col" className="py-4 text-right">Energia da prot.</th>
                </tr>
              </thead>
              <tbody>
                {PER_PROTEINE.map((p) => (
                  <tr key={p.id} className="border-t border-ink/15 align-top">
                    <th scope="row" className="py-4 pr-4 font-normal">
                      <Link href={`/menu/${p.id}`} className="font-semibold underline-offset-4 hover:underline">
                        {p.nome}
                      </Link>
                    </th>
                    <td className="py-4 pr-4">
                      <TagAllenamento tipo={p.allenamento} breve />
                    </td>
                    <td className="num whitespace-nowrap py-4 pr-4 text-right">{p.grammi} g</td>
                    <td className="num whitespace-nowrap py-4 pr-4 text-right">{p.kcal}</td>
                    <td className="num whitespace-nowrap py-4 pr-4 text-right font-semibold">
                      <span className="evidenzia">{p.proteine} g</span>
                    </td>
                    <td className="num whitespace-nowrap py-4 pr-4 text-right">{p.carboidrati} g</td>
                    <td className="num whitespace-nowrap py-4 pr-4 text-right">{p.grassi} g</td>
                    <td className="num whitespace-nowrap py-4 pr-4 text-right">{proteineEtto(p)} g</td>
                    <td className="num whitespace-nowrap py-4 text-right">{quotaProteine(p)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-5 max-w-[70ch] text-sm text-muted">
            Valori per porzione intera, dal menu di FUEL LAB. Le calorie sono proteine × 4 + carboidrati × 4 + grassi ×
            9. I numeri descrivono i piatti, non sono un piano alimentare: quantità e obiettivi li decide il
            professionista che ti segue.
          </p>
        </div>
      </section>

      <section className="notte">
        <div className="wrap py-[var(--sezione)]">
          <Reveal>
            <p className="occhiello">Pesi e cardio</p>
            <h2 className="titolo mt-5 max-w-[14ch]">Un piatto per ogni allenamento.</h2>
          </Reveal>
          <div className="mt-12 grid gap-12 md:grid-cols-2">
            {[
              { titolo: "Giorni di pesi", consiglio: CONSIGLI.pesi, piatti: perPesi },
              { titolo: "Giorni di cardio", consiglio: CONSIGLI.cardio, piatti: perCardio },
            ].map((g, i) => (
              <Reveal key={g.titolo} delay={i * 80} className="border-t-[3px] border-lime pt-6">
                <h3 className="titolo-s">{g.titolo}</h3>
                <p className="mt-4 font-disp text-lg font-semibold text-lime uppercase">{g.consiglio.regola}</p>
                <p className="mt-3 max-w-[46ch]" style={{ color: "rgb(243 239 230 / .88)" }}>
                  {g.consiglio.perche}
                </p>
                <ul className="mt-6 grid gap-3">
                  {g.piatti.map((p) => (
                    <li key={p.id} className="border-b pb-3" style={{ borderColor: "var(--line)" }}>
                      <Link href={`/menu/${p.id}`} className="underline-offset-4 hover:text-lime hover:underline">
                        {p.nome}
                      </Link>
                      <span className="num block text-sm text-steel">
                        {p.proteine} g proteine · {p.carboidrati} g carbo · {p.kcal} kcal
                      </span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
          <p className="mt-12 max-w-[60ch] text-steel">
            È la stessa regola che usa il compositore: segni l&apos;allenamento di ogni giorno e i piatti si dispongono
            da soli. I piatti per cardio e pesi compaiono in tutte e due le liste.{" "}
            <Link href="/settimana" className="link">
              Prova il compositore
            </Link>
          </p>
        </div>
      </section>

      <section className="sezione">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <p className="occhiello">Gli ingredienti</p>
            <h2 className="titolo mt-5 max-w-[12ch]">Da dove vengono le proteine.</h2>
            <p className="lead mt-6">
              Pollo, maiale, uova e formaggi: le fonti di proteine sono scritte negli ingredienti di ogni piatto, con i
              grammi.
            </p>
          </Reveal>
          <ul className="border-t-[3px] border-ink">
            {PER_PROTEINE.map((p) => (
              <li key={p.id} className="grid gap-1 border-b border-ink/15 py-5 sm:grid-cols-[1fr_1.1fr] sm:gap-6">
                <Link href={`/menu/${p.id}`} className="font-semibold underline-offset-4 hover:underline">
                  {p.nome}
                </Link>
                <span className="text-muted">{elenco(fontiProteiche(p))}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sezione carta-2">
        <div className="wrap grid gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="occhiello">Per la tua box</p>
            <h2 className="titolo mt-5 max-w-[12ch]">Ne vuoi di più?</h2>
            <p className="mt-6 max-w-[52ch] text-lg">
              Ogni piatto si può arricchire con una proteina in più, scelta nel compositore casella per casella:{" "}
              {elenco(proteineExtra)}. Il supplemento, dove c&apos;è, è indicato nel{" "}
              <Link href="/menu" className="link">
                menu
              </Link>
              .
            </p>
          </Reveal>
          <Reveal delay={80}>
            <p className="occhiello">Il pranzo, quando ti alleni</p>
            <div className="mt-5 grid gap-5 text-lg leading-relaxed">
              <p>
                Chi si allena in pausa pranzo o dopo il lavoro ha prima di tutto un problema pratico: arrivare al pasto
                con qualcosa di pronto. I piatti sono già porzionati: li prendi dal frigo, li porti al lavoro con una
                borsa termica se serve e li scaldi quando è ora.
              </p>
              <p>
                Matteo cucina ogni giorno e consegna ogni giorno, quindi il pranzo arriva fresco anche a metà settimana.
                Se ti segue un nutrizionista, parti dai suoi numeri:{" "}
                <Link href="/scheda" className="link">
                  scrivi i tuoi macro
                </Link>{" "}
                e la settimana si compone con i piatti più vicini. Se vuoi coprire tutto il mese,{" "}
                <Link href={PAGINE.abbonamento.percorso} className="link">
                  ci sono gli abbonamenti
                </Link>
                : da {PREZZO_DA_TESTO} al mese, sul piano del tuo nutrizionista.
              </p>
              <p>
                Ritiro in sede o consegna a Pescara e dintorni:{" "}
                <Link href={PAGINE.consegna.percorso} className="link">
                  le zone
                </Link>
                .
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="sezione">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="occhiello">Domande</p>
            <h2 className="titolo mt-5">Pasti proteici: le risposte.</h2>
          </div>
          <Faq domande={DOMANDE} />
        </div>
        <div className="wrap mt-10">
          <Aggiornato />
        </div>
      </section>

      <LinkBlog
        slug={[
          "pasti-con-proteine-menu-settimanale",
          "macro-cosa-sono-come-leggerli",
          "meal-prep-allenamento-cardio-pesi",
          "pranzo-dopo-allenamento-pescara",
        ]}
        titolo="Proteine, macro e allenamento."
      />

      <ChiusuraCta
        titolo="Scegli i numeri. Al resto pensa Matteo."
        testo="Componi la settimana sui tuoi allenamenti o sui macro della tua scheda, poi scrivi a Matteo per confermare piatti, ritiro o consegna."
      />
    </>
  );
}
