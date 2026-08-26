import Link from "next/link";
import Reveal from "@/components/Reveal";
import { SectionHead } from "@/components/ui";
import { getServizio, type Prezzo, type Servizio } from "@/lib/servizi";
import { linkWhatsApp, messaggioServizio } from "@/lib/whatsapp";

/* =========================================================================
   Sezione "I nostri servizi": componente riusabile, montato dalla pagina
   /servizi e destinato (Task 12a) a entrare anche in home. Per questo e'
   un <section> completo con la propria SectionHead: chi lo importa non
   deve incorniciarlo, lo mette a schermo cosi' com'e'.

   Non tre card identiche in fila (spec sezione 12): il servizio centrale,
   "Sui macro della tua scheda", e' un blocco lime pieno, largo quanto gli
   altri due messi insieme sulla riga. Gli altri due sono card chiare di
   forma diversa fra loro: il menu della settimana e' una card verticale
   con foto in alto, l'home cooking e' un pannello orizzontale a tutta
   larghezza, perche' e' il servizio con la storia piu lunga da raccontare
   (vende il tempo di Matteo, non un box) e chiede piu' spazio di lettura.

   Sul blocco lime il testo resta inchiostro (ink su lime = 12.61:1, la
   sola combinazione in cui il lime tocca del testo, come SUPERFICIE).
   .price-da, .price-u e .note portano di default var(--color-muted), che
   e' tarato su paper/card/cell: qui dentro lo sovrascriviamo con
   rgba(18,48,31,x), lo stesso inchiostro a opacita' ridotta gia' usato
   sui blocchi lime di app/come-funziona e app/chi-e-matteo. E' lo stesso
   colore di --color-ink, non un altro verde: scala con qualunque tonalita'
   di lime finisse in --color-lime domani, invece di dipendere da un
   contrasto misurato una volta sola e mai piu' verificato.
   ========================================================================= */

const INK_70 = "rgba(18,48,31,.7)";
const INK_62 = "rgba(18,48,31,.62)";

/** "8,90 €", mai un totale: la virgola italiana e il simbolo, niente di piu'. */
function formattaSoglia(valore: number): string {
  return `${valore.toFixed(2).replace(".", ",")} €`;
}

/**
 * Il prezzo, sempre nella stessa scocca ".price". Per i due servizi a soglia:
 * occhiello "A partire da" + cifra + unita. Per l'home cooking, solo la
 * parola "Su preventivo" al posto della cifra: nessuna unita, nessun numero,
 * perche' qui non c'e' una soglia da dichiarare.
 */
function PrezzoServizio({ prezzo, scuro = false }: { prezzo: Prezzo; scuro?: boolean }) {
  if (prezzo.tipo === "preventivo") {
    return (
      <p className="price">
        <span className="price-n">Su preventivo</span>
      </p>
    );
  }

  return (
    <p className="price">
      <span className="price-da" style={scuro ? { color: INK_62 } : undefined}>
        A partire da
      </span>
      <span className="price-n">{formattaSoglia(prezzo.valore)}</span>
      <span className="price-u" style={scuro ? { color: INK_62 } : undefined}>
        {prezzo.unita}
      </span>
    </p>
  );
}

/**
 * CTA WhatsApp del singolo servizio. Il caso normale in questa fase e' che
 * il numero non sia ancora configurato (vedi lib/whatsapp.ts): il bottone
 * resta visibile ma disabilitato, con una spiegazione scritta e non solo
 * un title al passaggio del mouse, che su touch nessuno vede mai. Mai un
 * href verso "wa.me/" senza numero: un cliente che ci clicca sopra pensa
 * che il servizio sia rotto.
 */
function CtaServizio({ servizio, scuro = false }: { servizio: Servizio; scuro?: boolean }) {
  const href = linkWhatsApp(messaggioServizio(servizio.id));

  if (!href) {
    return (
      <div>
        <button
          type="button"
          className="btn btn-p btn-sm"
          disabled
          title="Numero WhatsApp non ancora configurato"
        >
          Scrivici su WhatsApp
          <span className="dot" aria-hidden="true">
            ↗
          </span>
        </button>
        <p className="note mt-3 max-w-[30ch]" style={scuro ? { color: INK_62 } : undefined}>
          Numero WhatsApp non ancora attivo: il bottone si accende appena e&apos; online.
        </p>
      </div>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-p btn-sm">
      Scrivici su WhatsApp
      <span className="dot" aria-hidden="true">
        ↗
      </span>
    </a>
  );
}

/** Link secondario "Scopri di piu'": porta alla pagina del sito dove il servizio e' spiegato per esteso. */
function LinkServizio({ servizio }: { servizio: Servizio }) {
  return (
    <Link href={servizio.href} className="btn btn-s btn-sm">
      Scopri di piu&apos;
      <span className="dot" aria-hidden="true">
        &#8594;
      </span>
    </Link>
  );
}

export default function SezioneServizi() {
  const menu = getServizio("menu-settimana");
  const macro = getServizio("sui-tuoi-macro");
  const homeCooking = getServizio("home-cooking");

  return (
    <section className="py-[110px] md:py-[150px]">
      <div className="wrap">
        <Reveal>
          <SectionHead
            occhiello="I nostri servizi"
            titolo={
              <>
                Tre modi
                <br />
                di mangiare bene.
              </>
            }
            testo="Il menu gia' pronto, il piano sui macro della tua scheda, oppure Matteo che cucina dentro casa tua. Il prezzo esatto lo definiamo insieme su WhatsApp."
          />
        </Reveal>

        <div className="grid gap-6 md:grid-cols-12">
          {/* ---------------- 01: il menu della settimana ---------------- */}
          <Reveal className="md:col-span-5" delay={0}>
            <article className="shell h-full md:rotate-[-1.1deg]">
              <div className="core flex h-full flex-col">
                <figure className="relative aspect-[16/11] overflow-hidden bg-tray">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={menu.img}
                    alt="Contenitori di meal prep pronti, il menu della settimana gia' composto"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  <span className="num num-lime absolute top-5 left-5">{menu.numero}</span>
                </figure>

                <div className="flex flex-1 flex-col p-8">
                  <h3 className="h3">{menu.nome}</h3>
                  <p className="mt-4 flex-1 text-[15px] leading-[1.6] text-muted">
                    {menu.descrizione}
                  </p>

                  <div className="mt-7">
                    <PrezzoServizio prezzo={menu.prezzo} />
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <CtaServizio servizio={menu} />
                    <LinkServizio servizio={menu} />
                  </div>
                </div>
              </div>
            </article>
          </Reveal>

          {/* ---------------- 02: sui macro della tua scheda, blocco lime ---------------- */}
          <Reveal className="md:col-span-7" delay={100}>
            <div
              className="shell h-full md:rotate-[1deg]"
              style={{ background: "var(--color-lime)", borderColor: "transparent" }}
            >
              <div
                className="core flex h-full flex-col justify-between p-8 md:p-11"
                style={{ background: "var(--color-lime)" }}
              >
                <div>
                  <span className="num num-ink">{macro.numero}</span>
                  <h3 className="h3 mt-6 text-ink">{macro.nome}</h3>
                  <p
                    className="mt-4 max-w-[46ch] text-[15.5px] leading-[1.6]"
                    style={{ color: INK_70 }}
                  >
                    {macro.descrizione}
                  </p>
                </div>

                <div className="mt-10">
                  <PrezzoServizio prezzo={macro.prezzo} scuro />
                  <div className="mt-6 flex flex-wrap gap-3">
                    <CtaServizio servizio={macro} scuro />
                    <LinkServizio servizio={macro} />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* ---------------- 03: home cooking, pannello a tutta larghezza ----------------
              Volutamente diverso dagli altri due: non una card come le altre, ma un
              pannello orizzontale che pesa quanto le prime due card messe insieme.
              La riga in piu' sotto il prezzo spiega perche' qui non c'e' soglia. */}
          <Reveal className="md:col-span-12" delay={190}>
            <article className="shell md:rotate-[-.5deg]">
              <div className="core grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <span className="num num-lime">{homeCooking.numero}</span>
                  <h3 className="h3 mt-6">{homeCooking.nome}</h3>
                  <p className="mt-4 max-w-[48ch] text-[15.5px] leading-[1.6] text-muted">
                    {homeCooking.descrizione}
                  </p>
                  <p className="note mt-6 max-w-[44ch]">
                    Vende il tempo di Matteo, non la produzione in serie: l&apos;unico esito
                    possibile e&apos; una conversazione.
                  </p>

                  <div className="mt-7">
                    <PrezzoServizio prezzo={homeCooking.prezzo} />
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <CtaServizio servizio={homeCooking} />
                    <LinkServizio servizio={homeCooking} />
                  </div>
                </div>

                <figure className="relative min-h-[240px] md:min-h-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={homeCooking.img}
                    alt="Mani che completano un piatto in cucina, il gesto di chi cucina per te"
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </figure>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
