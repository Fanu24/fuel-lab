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
  RAGIONE_SOCIALE,
  TELEFONO,
  TITOLARE,
  elencoZone,
} from "@/lib/sito";

/* Il footer porta il NAP (nome, indirizzo, contatti) scritto sempre uguale,
   letto da lib/sito.ts come i dati strutturati: Google confronta le due
   versioni. La colonna "A Pescara" collega le pagine locali da ogni pagina. */
const COLONNE = [
  {
    titolo: "Mangia",
    voci: [
      { href: "/menu", label: "Il menu" },
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
      { href: "/chi-e-matteo", label: "Chi è Matteo" },
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
              Meal prep fresco a Pescara per chi si allena. Matteo cucina il lunedì e il giovedì: ritiro in sede o
              consegna in zona.
            </p>
            <address className="mt-6 not-italic text-steel">
              <strong className="font-semibold text-paper">{NOME_ATTIVITA}</strong> · {TITOLARE.nome}
              <br />
              <a href={LINK_MAPPA} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-lime">
                {INDIRIZZO_RIGA}
              </a>
              <br />
              <a href={`mailto:${EMAIL}`} className="underline underline-offset-4 hover:text-lime">
                {EMAIL}
              </a>
              {TELEFONO ? (
                <>
                  <br />
                  <a href={`tel:${TELEFONO.replace(/\s/g, "")}`} className="underline underline-offset-4 hover:text-lime">
                    {TELEFONO}
                  </a>
                </>
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
                      className="inline-flex min-h-11 items-center font-disp text-lg font-semibold uppercase tracking-[.06em] hover:text-lime"
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

        <div
          className="mt-10 flex flex-wrap justify-between gap-4 border-t pt-6 text-sm text-steel"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <p>© {NOME_ATTIVITA} · {TITOLARE.nome} · {INDIRIZZO.citta}</p>
            <p>
              {RAGIONE_SOCIALE && PARTITA_IVA
                ? `${RAGIONE_SOCIALE} · P. IVA ${PARTITA_IVA}`
                : "Ragione sociale e P. IVA: in aggiornamento"}
            </p>
            <Link href="/privacy" className="underline underline-offset-4 hover:text-lime">Privacy e cookie</Link>
            <PrivacySettingsButton />
          </div>
          <p><Link href="/account" className="underline underline-offset-4">Area cliente</Link> · Nessun pagamento online: ordine e disponibilità si confermano con Matteo.</p>
        </div>
      </div>
    </footer>
  );
}
