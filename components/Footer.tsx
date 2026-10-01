import Image from "next/image";
import Link from "next/link";
import WhatsAppCta from "@/components/ui/WhatsAppCta";
import PrivacySettingsButton from "@/components/PrivacySettingsButton";
import { PAGINE } from "@/components/seo/pagine";
import {
  EMAIL,
  INDIRIZZO,
  INDIRIZZO_RIGA,
  LINK_MAPPA,
  NOME_ATTIVITA,
  PARTITA_IVA,
  QUANDO_CUCINA,
  RAGIONE_SOCIALE,
  TELEFONO,
  TITOLARE,
  elencoZone,
} from "@/lib/sito";

/* I link di servizio del footer: sottolineati, alti 44 px (l'area da toccare), lime al passaggio. */
const LINK_FOOTER = "inline-flex min-h-11 items-center underline underline-offset-4 hover:text-lime";

/* Il footer porta il NAP (nome, indirizzo, contatti) scritto sempre uguale,
   letto da lib/sito.ts come i dati strutturati: Google confronta le due
   versioni. La colonna "A Pescara" collega le pagine locali da ogni pagina. */
const COLONNE = [
  {
    titolo: "Mangia",
    voci: [
      { href: "/menu", label: "Il menu" },
      { href: PAGINE.abbonamento.percorso, label: "Abbonamenti" },
      { href: "/settimana", label: "Componi la settimana" },
      { href: "/scheda", label: "Dai tuoi macro" },
      { href: "/servizi", label: "Servizi e prezzi" },
    ],
  },
  {
    titolo: "A Pescara",
    voci: [
      { href: PAGINE.mealPrep.percorso, label: "Meal prep a Pescara" },
      { href: PAGINE.consegna.percorso, label: "Consegna pasti" },
      { href: PAGINE.proteici.percorso, label: "Pasti proteici" },
      { href: PAGINE.domicilio.percorso, label: "Cuoco a domicilio" },
    ],
  },
  {
    titolo: "Scopri",
    voci: [
      { href: "/come-funziona", label: "Come funziona" },
      { href: PAGINE.chiSiamo.percorso, label: "Chi siamo" },
      { href: "/blog", label: "Blog" },
      { href: "/richiesta", label: "Scrivi a Matteo" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="notte pt-20 pb-10 md:pt-28">
      <div className="wrap">
        <div className="grid gap-12 md:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="md:col-span-3 lg:col-span-1">
            <Link href="/" aria-label="FUEL LAB, home" className="inline-block">
              <Image
                src="/logo-fuellab.png"
                alt=""
                width={1095}
                height={360}
                className="h-auto w-[220px] invert md:w-[300px]"
              />
            </Link>
            <p className="mt-8 max-w-[36ch] text-steel">
              Meal prep fresco a Pescara per chi si allena. {QUANDO_CUCINA}. Ritiro in sede o consegna in zona: giorno
              e orario li concordi con lui.
            </p>
            {/* Una riga per contatto, alta quanto un dito: l'indirizzo e l'email sono i link piu' toccati. */}
            <address className="mt-4 grid not-italic text-steel">
              <p className="py-1">
                <strong className="font-semibold text-paper">{NOME_ATTIVITA}</strong> · {TITOLARE.nome}
              </p>
              <a href={LINK_MAPPA} target="_blank" rel="noopener noreferrer" className={LINK_FOOTER}>
                {INDIRIZZO_RIGA}
                <span className="sr-only"> (apre la mappa in una nuova scheda)</span>
              </a>
              <a href={`mailto:${EMAIL}`} className={LINK_FOOTER}>
                {EMAIL}
              </a>
              {TELEFONO ? (
                <a href={`tel:${TELEFONO.replace(/\s/g, "")}`} className={LINK_FOOTER}>
                  {TELEFONO}
                </a>
              ) : null}
            </address>
            <WhatsAppCta className="mt-8" buttonClassName="justify-between" />
          </div>

          {COLONNE.map((c) => (
            <nav key={c.titolo} aria-label={c.titolo}>
              <p className="occhiello text-steel">{c.titolo}</p>
              <ul className="mt-6 grid">
                {c.voci.map((v) => (
                  <li key={v.href}>
                    <Link
                      href={v.href}
                      className="inline-flex min-h-11 items-center font-disp text-lg font-semibold uppercase tracking-[.06em] hover:text-lime md:text-sm lg:text-lg"
                    >
                      {v.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-16 max-w-[80ch] text-sm text-steel">
          <span className="font-semibold text-paper">Zone di consegna:</span> {elencoZone()}. La copertura del tuo
          indirizzo si conferma con Matteo prima dell&apos;ordine;{" "}
          <Link href={PAGINE.consegna.percorso} className="underline underline-offset-4 hover:text-lime">
            come funzionano ritiro e consegna
          </Link>
          .
        </p>

        <div className="mt-10 border-t pt-4 text-sm text-steel" style={{ borderColor: "var(--line)" }}>
          <ul className="flex flex-wrap gap-x-6">
            <li>
              <Link href="/privacy" className={LINK_FOOTER}>Privacy e cookie</Link>
            </li>
            <li>
              <PrivacySettingsButton className={LINK_FOOTER} />
            </li>
            <li>
              <Link href="/account" className={LINK_FOOTER}>Area cliente</Link>
            </li>
          </ul>
          <p className="mt-4">
            © {NOME_ATTIVITA} · {TITOLARE.nome} · {INDIRIZZO.citta} ·{" "}
            {RAGIONE_SOCIALE && PARTITA_IVA
              ? `${RAGIONE_SOCIALE} · P. IVA ${PARTITA_IVA}`
              : "Ragione sociale e P. IVA: in aggiornamento"}
          </p>
          <p className="mt-1">Nessun pagamento online: ordine e disponibilità si confermano con Matteo.</p>
        </div>
      </div>
    </footer>
  );
}
