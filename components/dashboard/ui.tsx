/* I mattoni del pannello di Matteo. Tutte le pagine di /dashboard li usano,
   cosi' uno stato ha sempre lo stesso colore e un numero sempre la stessa
   forma. Le classi .pn-* stanno in app/styles/pannello.css. */

import type { ReactNode } from "react";
import { daSqlite, etichettaStato, type StatoOrdine } from "@/lib/api";

/* ---------- Formati ---------- */

const FUSO = "Europe/Rome";

/** "2026-09-27" -> "sab 27 set". Null -> il testo di ripiego. */
export function giorno(d: string | null | undefined, ripiego = "Da assegnare") {
  if (!d) return ripiego;
  return new Intl.DateTimeFormat("it-IT", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(`${d}T12:00:00Z`));
}

/** "2026-09-27" -> "sabato 27 settembre". */
export function giornoLungo(d: string | null | undefined, ripiego = "Da assegnare") {
  if (!d) return ripiego;
  return new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })
    .format(new Date(`${d}T12:00:00Z`));
}

/** Timestamp SQLite (UTC) -> "27 set, 14:03" in ora di Roma. */
export function quando(ts: string | null | undefined) {
  if (!ts) return "—";
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: FUSO })
    .format(daSqlite(ts));
}

/** Timestamp SQLite -> "3 ore fa", "ieri", "5 giorni fa". */
export function faTempo(ts: string | null | undefined) {
  if (!ts) return "—";
  const secondi = Math.round((Date.now() - daSqlite(ts).getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("it-IT", { numeric: "auto" });
  if (secondi < 60) return "adesso";
  if (secondi < 3600) return rtf.format(-Math.round(secondi / 60), "minute");
  if (secondi < 86400) return rtf.format(-Math.round(secondi / 3600), "hour");
  if (secondi < 86400 * 30) return rtf.format(-Math.round(secondi / 86400), "day");
  return quando(ts);
}

/** Numero di telefono -> link wa.me (solo cifre, prefisso 39 se manca). */
export function linkWhatsAppCliente(telefono: string, testo = "") {
  let cifre = telefono.replace(/\D/g, "");
  if (cifre.startsWith("00")) cifre = cifre.slice(2);
  if (cifre.length <= 10) cifre = `39${cifre}`;
  return `https://wa.me/${cifre}${testo ? `?text=${encodeURIComponent(testo)}` : ""}`;
}

/* ---------- Componenti ---------- */

/**
 * Il pallino colorato con lo stato dell'ordine. `ritiro`: un ordine completato
 * si dice "Ritirato"; `abbonamento`: un abbonamento completato si dice "Concluso".
 */
export function Stato({
  stato,
  grande = false,
  ritiro = false,
  abbonamento = false,
}: {
  stato: StatoOrdine | string;
  grande?: boolean;
  ritiro?: boolean;
  abbonamento?: boolean;
}) {
  return (
    <span className={`pn-stato pn-stato-${stato} ${grande ? "pn-stato-l" : ""}`}>
      {stato === "completed" && abbonamento ? "Concluso" : stato === "completed" && ritiro ? "Ritirato" : etichettaStato(stato)}
    </span>
  );
}

/** "Abbonamento": il segno che distingue un abbonamento mensile in elenchi e schede. */
export function SegnoAbbonamento() {
  return <span className="pn-segno pn-segno-abbonamento">Abbonamento</span>;
}

/** Un numero grande con la sua etichetta. `tono` colora il bordo sinistro quando serve attenzione. */
export function Kpi({
  label,
  valore,
  nota,
  tono = "neutro",
  href,
}: {
  label: string;
  valore: ReactNode;
  nota?: ReactNode;
  tono?: "neutro" | "attenzione" | "allarme" | "ok";
  href?: string;
}) {
  const corpo = (
    <>
      <span className="pn-kpi-label">{label}</span>
      <span className="pn-kpi-valore num">{valore}</span>
      {nota ? <span className="pn-kpi-nota">{nota}</span> : null}
    </>
  );
  return href ? (
    <a href={href} className={`pn-kpi pn-kpi-${tono} pn-kpi-link`}>{corpo}</a>
  ) : (
    <div className={`pn-kpi pn-kpi-${tono}`}>{corpo}</div>
  );
}

/** Titolo di sezione con un'azione facoltativa a destra. */
export function Sezione({
  titolo,
  id,
  sotto,
  azione,
  children,
}: {
  titolo: string;
  id: string;
  sotto?: ReactNode;
  azione?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="pn-sezione">
      <div className="pn-sezione-testa">
        <div>
          <h2 id={id} className="pn-h2">{titolo}</h2>
          {sotto ? <p className="pn-sotto">{sotto}</p> : null}
        </div>
        {azione ? <div className="pn-sezione-azione">{azione}</div> : null}
      </div>
      {children}
    </section>
  );
}

/** Quando una lista e' vuota: una frase, non un buco. */
export function Vuoto({ children }: { children: ReactNode }) {
  return <p className="pn-vuoto">{children}</p>;
}

/** Errori e conferme. */
export function Avviso({ tipo = "errore", children }: { tipo?: "errore" | "ok" | "info"; children: ReactNode }) {
  return (
    <p className={`pn-avviso pn-avviso-${tipo}`} role={tipo === "errore" ? "alert" : "status"}>
      {children}
    </p>
  );
}

/** Intestazione di pagina del pannello. */
export function TestaPagina({ occhiello, titolo, sotto, azioni }: { occhiello?: string; titolo: string; sotto?: ReactNode; azioni?: ReactNode }) {
  return (
    <header className="pn-testa">
      <div>
        {occhiello ? <p className="pn-occhiello">{occhiello}</p> : null}
        <h1 className="pn-h1">{titolo}</h1>
        {sotto ? <p className="pn-sotto">{sotto}</p> : null}
      </div>
      {azioni ? <div className="pn-testa-azioni">{azioni}</div> : null}
    </header>
  );
}

/** Scheletro mentre i dati arrivano. */
export function Caricamento({ testo = "Carico i dati…" }: { testo?: string }) {
  return (
    <div className="pn-caricamento" role="status" aria-live="polite">
      <span className="pn-spinner" aria-hidden="true" />
      {testo}
    </div>
  );
}
