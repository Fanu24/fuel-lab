import Image from "next/image";
import MappaSede from "@/components/ui/MappaSede";
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
  ORARI_RITIRO,
  RAGIONE_SOCIALE,
  TELEFONO,
  TITOLARE,
} from "@/lib/sito";

/* I link di servizio del footer: sottolineati, alti 44 px (l'area da toccare), lime al passaggio. */
const LINK_FOOTER = "inline-flex min-h-11 items-center underline underline-offset-4 hover:text-lime";

const PRINCIPALI = [
  { href: PAGINE.abbonamento.percorso, label: "Abbonamenti" },
  { href: "/settimana", label: "Componi la settimana" },
  { href: "/menu", label: "Il menu" },
  { href: PAGINE.chiSiamo.percorso, label: "Chi siamo" },
];

/* Restano raggiungibili e indicizzabili, senza allungare ogni pagina sul telefono. */
const INFORMAZIONI = [
  { href: "/come-funziona", label: "Come funziona" },
  { href: "/servizi", label: "Servizi e prezzi" },
  { href: "/scheda", label: "Cuciniamo il tuo piano alimentare" },
  { href: PAGINE.mealPrep.percorso, label: "Meal prep a Pescara" },
  { href: PAGINE.consegna.percorso, label: "Ritiro e consegna" },
  { href: PAGINE.proteici.percorso, label: "Pasti proteici" },
  { href: PAGINE.domicilio.percorso, label: "Cuoco a domicilio" },
  { href: "/blog", label: "Blog" },
  { href: "/richiesta", label: "Contatti" },
];

export default function Footer() {
  return (
    <footer className="notte pt-14 pb-8 md:pt-20">
      <div className="wrap">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="FUEL LAB, home" className="inline-block">
              <Image
                src="/logo-fuellab.png"
                alt=""
                width={1095}
                height={360}
                className="h-auto w-[200px] invert"
              />
            </Link>
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
              <p className="py-1">Laboratorio: {ORARI_RITIRO.testo}</p>
            </address>
            <WhatsAppCta className="mt-5" label="Scrivi su WhatsApp" buttonClassName="w-full justify-between !px-4 !text-sm" />

          </div>

          <nav aria-label="Link nel footer">
              <ul className="grid">
                {PRINCIPALI.map((v) => (
                  <li key={v.href}>
                    <Link
                      href={v.href}
                      className="inline-flex min-h-11 items-center font-disp text-lg font-semibold uppercase tracking-[.06em] hover:text-lime"
                    >
                      {v.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <details className="mt-4 border-t text-sm text-steel" style={{ borderColor: "var(--line)" }}>
                <summary className="min-h-12 cursor-pointer py-3 font-semibold hover:text-lime">Altre informazioni</summary>
                <ul className="grid">
                  {INFORMAZIONI.map((v) => <li key={v.href}><Link href={v.href} className={LINK_FOOTER}>{v.label}</Link></li>)}
                </ul>
              </details>
          </nav>
          <div className="max-w-sm md:col-span-2 lg:col-span-1">
            <MappaSede compatta scura />
          </div>
        </div>

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
