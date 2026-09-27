"use client";

/* La pagina "Oggi" (/dashboard): in tre secondi cosa c'e' da fare.
   Dall'alto: saluto e data, "Da fare adesso", i quattro numeri del giorno,
   cucina e uscite di oggi, i prossimi sette giorni. Un ordine si apre sopra
   la pagina (?id=...) senza perdere il punto. */

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { euro } from "@/lib/api";
import { azioniDaFare, calendario, codeOperative, plurale, sommaCentesimi, type CodeOperative } from "@/lib/operazioni";
import { useAdmin } from "./AdminGate";
import OggiCucina from "./OggiCucina";
import OggiDaFare from "./OggiDaFare";
import OggiSettimana from "./OggiSettimana";
import OggiUscite from "./OggiUscite";
import OrdineScheda, { useSchedaUrl } from "./OrdineScheda";
import { usePannello } from "./PannelloDati";
import { Aggiornamento, ErroreDati, useAzioniVeloci } from "./PannelloStato";
import { TestaPagina, giornoLungo } from "./ui";

const iniziale = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** "Buongiorno" fino alle 13, poi "Buon pomeriggio", dalle 18 "Buonasera" (ora di Roma). */
function saluto(ora: Date | null) {
  if (!ora) return "Ciao";
  const h = Number(new Intl.DateTimeFormat("it-IT", { hour: "numeric", hour12: false, timeZone: "Europe/Rome" }).format(ora));
  return h >= 5 && h < 13 ? "Buongiorno" : h >= 13 && h < 18 ? "Buon pomeriggio" : "Buonasera";
}

export default function Oggi() {
  const { ordini, oggi, messaggiNuovi, aggiornatoAlle } = usePannello();
  const utente = useAdmin();
  const { id, apri, chiudi } = useSchedaUrl();
  const veloci = useAzioniVeloci();

  const code = useMemo(() => (ordini ? codeOperative(ordini, oggi) : null), [ordini, oggi]);
  const azioni = useMemo(() => (ordini ? azioniDaFare(ordini, oggi, messaggiNuovi ?? 0) : null), [ordini, oggi, messaggiNuovi]);
  const settimana = useMemo(() => (ordini ? calendario(ordini, oggi) : null), [ordini, oggi]);

  const nome = utente?.name.trim().split(/\s+/)[0] || "Matteo";
  const riassunto = code && azioni
    ? `${plurale(code.aperti.length, "ordine aperto", "ordini aperti")} · ${azioni.length ? plurale(azioni.length, "cosa da fare", "cose da fare") : "niente di urgente"}`
    : "Carico gli ordini…";

  return (
    <>
      <div className="pn-pagina">
        <TestaPagina
          occhiello={iniziale(giornoLungo(oggi))}
          titolo={`${saluto(aggiornatoAlle)}, ${nome}`}
          sotto={riassunto}
          azioni={
            <>
              {/* Ordine preso al telefono o su WhatsApp: si apre il modulo nella pagina Ordini. */}
              <Link href="/dashboard/ordini?nuovo=1" className="pn-tasto pn-tasto-lime">
                <span aria-hidden="true" className="text-[22px] leading-none">+</span>
                Nuovo ordine
              </Link>
              <Aggiornamento />
            </>
          }
        />
        <ErroreDati />
        <OggiDaFare azioni={azioni} />
        <OggiNumeri code={code} />
        <div className="pn-due-colonne">
          <OggiCucina code={code} oggi={oggi} apri={apri} />
          <OggiUscite code={code} apri={apri} veloci={veloci} />
        </div>
        <OggiSettimana giorni={settimana} />
      </div>
      {id ? <OrdineScheda key={id} id={id} onChiudi={chiudi} /> : null}
      {veloci.avvisoInBasso}
    </>
  );
}

/* ---------- I quattro numeri ---------- */

function Numero({
  label,
  valore,
  nota,
  tono,
  href,
  lungo = false,
}: {
  lungo?: boolean;
  label: string;
  valore: ReactNode;
  nota: ReactNode;
  tono: "neutro" | "attenzione" | "allarme" | "ok";
  href: string;
}) {
  // Stesse classi di <Kpi> (ui.tsx), ma con <Link>: niente ricarica della pagina.
  return (
    <Link href={href} className={`pn-kpi pn-kpi-${tono} pn-kpi-link`}>
      <span className="pn-kpi-label">{label}</span>
      <span className={`pn-kpi-valore num ${lungo ? "pn-kpi-valore-lungo" : ""}`}>{valore}</span>
      <span className="pn-kpi-nota">{nota}</span>
    </Link>
  );
}

export function OggiNumeri({ code }: { code: CodeOperative | null }) {
  const attesa = "—";
  const nonPagati = code ? sommaCentesimi(code.nonPagati) : 0;
  const consegnati = code ? sommaCentesimi(code.consegnatiNonPagati) : 0;
  const fatti = code ? code.usciteOggi.length - code.usciteDaFare.length : 0;
  return (
    <section aria-label="I numeri di oggi" className="pn-kpi-griglia">
      <Numero
        label="Da confermare"
        valore={code ? code.daConfermare.length : attesa}
        nota={code ? (code.daConfermare.length ? "richieste nuove" : "nessuna richiesta") : "…"}
        tono={code?.daConfermare.length ? "attenzione" : "ok"}
        href="/dashboard/ordini?stato=requested"
      />
      <Numero
        label="Porzioni oggi"
        valore={code ? code.porzioniOggi : attesa}
        nota={code ? (code.cucinaOggi.length ? plurale(code.cucinaOggi.length, "ordine in cucina", "ordini in cucina") : "niente da cucinare") : "…"}
        tono="neutro"
        href="/dashboard/produzione"
      />
      <Numero
        label="Ritiri e consegne"
        valore={code ? code.usciteOggi.length : attesa}
        nota={code ? (code.usciteOggi.length ? `${code.usciteDaFare.length} da fare · ${fatti} ${fatti === 1 ? "fatto" : "fatti"}` : "nessuno oggi") : "…"}
        tono={code?.usciteDaFare.length ? "attenzione" : "neutro"}
        href="/dashboard#oggi-uscita"
      />
      <Numero
        label="Da incassare"
        valore={code ? euro(nonPagati) : attesa}
        lungo
        nota={code ? (consegnati ? `${euro(consegnati)} già consegnati` : plurale(code.nonPagati.length, "ordine", "ordini")) : "…"}
        tono={consegnati ? "allarme" : nonPagati ? "attenzione" : "ok"}
        href="/dashboard/ordini?solo=incassare"
      />
    </section>
  );
}
