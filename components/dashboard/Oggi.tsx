"use client";

/* La pagina "Oggi" (/dashboard): in tre secondi cosa c'e' da fare.
   Dall'alto: saluto e data, chiusure vicine e piatti spenti (se ci sono),
   "Da fare adesso", i quattro numeri del giorno,
   cucina e uscite di oggi, i prossimi sette giorni. Un ordine si apre sopra
   la pagina (?id=...) senza perdere il punto.

   Gli abbonamenti compaiono nei loro giorni di consegna (una ogni 3 giorni),
   con i pasti che portano. Una consegna in abbonamento non ha uno stato
   "consegnato" (chiuderebbe l'abbonamento): quelle fatte oggi si segnano sul
   dispositivo, come le spunte della cucina. */

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { euro } from "@/lib/api";
import { chiusuraDi } from "@/lib/impostazioni";
import { azioniDaFare, calendario, codeOperative, plurale, sommaCentesimi, type CodeOperative } from "@/lib/operazioni";
import { useImpostazioni } from "@/components/impostazioni/useImpostazioni";
import { useAdmin } from "./AdminGate";
import { useSpunte } from "./CucinaMemoria";
import OggiCucina from "./OggiCucina";
import OggiDaFare from "./OggiDaFare";
import OggiImpostazioni from "./OggiImpostazioni";
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

  // Le chiusure di Impostazioni: si cucina ogni giorno, tranne quelli.
  const { chiusure } = useImpostazioni({ fresche: true }).impostazioni;

  // Le consegne in abbonamento gia' fatte oggi, segnate su questo dispositivo (una lista per giorno).
  const { spunte: consegnate, cambia: segnaConsegnata } = useSpunte(`fuellab:oggi:consegne-abbonamenti:${oggi}`);

  const code = useMemo(() => (ordini ? codeOperative(ordini, oggi, consegnate) : null), [ordini, oggi, consegnate]);
  const azioni = useMemo(
    () => (ordini ? azioniDaFare(ordini, oggi, messaggiNuovi ?? 0, consegnate) : null),
    [ordini, oggi, messaggiNuovi, consegnate],
  );
  const settimana = useMemo(() => (ordini ? calendario(ordini, oggi, 7, chiusure) : null), [ordini, oggi, chiusure]);
  const abbonamentiSettimana = settimana
    ? { consegne: settimana.reduce((n, g) => n + g.abbonamenti, 0), pasti: settimana.reduce((n, g) => n + g.pastiAbbonamenti, 0) }
    : null;

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
        <OggiImpostazioni oggi={oggi} />
        <OggiDaFare azioni={azioni} />
        <OggiNumeri code={code} />
        <div className="pn-due-colonne">
          <OggiCucina
            code={code}
            oggi={oggi}
            apri={apri}
            chiusura={chiusuraDi(oggi, chiusure)}
            abbonamentiSettimana={abbonamentiSettimana}
          />
          <OggiUscite code={code} oggi={oggi} apri={apri} veloci={veloci} consegnate={consegnate} onConsegnata={segnaConsegnata} />
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
        nota={
          code
            ? code.cucinaOggi.length || code.abbonamentiOggi.length
              ? [
                  code.cucinaOggi.length ? plurale(code.cucinaOggi.length, "ordine in cucina", "ordini in cucina") : "",
                  code.abbonamentiOggi.length
                    ? plurale(code.abbonamentiOggi.length, "consegna in abbonamento", "consegne in abbonamento")
                    : "",
                ].filter(Boolean).join(" · ")
              : "niente da cucinare"
            : "…"
        }
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
