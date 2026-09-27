"use client";

/* Un messaggio del modulo contatti: chi, di cosa, quando, il testo intero e
   le azioni. Rispondere e' l'azione principale; spostare di cassetto viene dopo. */

import Link from "next/link";
import { ETICHETTE_ARGOMENTO, daSqlite, type MessaggioContatto, type StatoMessaggio } from "@/lib/api";
import { mailtoRisposta } from "@/lib/produzione";
import { BottoniContatto } from "./ClientiContatti";
import { faTempo, quando } from "./ui";

const AZIONI: Record<StatoMessaggio, { a: StatoMessaggio; label: string }[]> = {
  new: [
    { a: "handled", label: "Segna come gestito" },
    { a: "archived", label: "Archivia" },
  ],
  handled: [
    { a: "archived", label: "Archivia" },
    { a: "new", label: "Riporta tra i nuovi" },
  ],
  archived: [{ a: "new", label: "Riporta tra i nuovi" }],
};

export default function MessaggiScheda({
  m,
  occupato,
  onSposta,
}: {
  m: MessaggioContatto;
  occupato: boolean;
  onSposta: (a: StatoMessaggio) => void;
}) {
  const nome = m.name || m.email;
  const primoNome = m.name.trim().split(/\s+/)[0] ?? "";
  const titoloId = `ms-${m.id}`;
  const data = daSqlite(m.created_at);
  return (
    <article className={`ms-msg ${m.status === "new" ? "is-nuovo" : ""}`} aria-labelledby={titoloId} aria-busy={occupato}>
      <header className="ms-testa">
        <h2 id={titoloId} className="ms-nome">
          {nome}
        </h2>
        <p className="ms-meta">
          <span className="ms-argomento">{ETICHETTE_ARGOMENTO[m.topic] ?? m.topic}</span>
          {m.comune ? <span>{m.comune}</span> : null}
          <time dateTime={Number.isNaN(data.getTime()) ? undefined : data.toISOString()} title={quando(m.created_at)}>
            {faTempo(m.created_at)}
          </time>
        </p>
      </header>

      <p className="ms-testo">{m.message}</p>

      <p className="ms-contatti">
        <span className="break-all">{m.email}</span>
        {m.phone ? <span> · {m.phone}</span> : null}
        {m.user_id ? (
          <>
            {" · "}
            <Link href={`/dashboard/clienti?id=${encodeURIComponent(m.user_id)}`} className="link">
              Scheda cliente
            </Link>
          </>
        ) : null}
      </p>

      <div className="ms-azioni">
        <BottoniContatto
          nome={nome}
          telefono={m.phone}
          email={m.email}
          mailto={mailtoRisposta(m)}
          etichettaEmail="Rispondi via email"
          primaEmail
          testoWhatsApp={`Ciao ${primoNome}, sono Matteo di FUEL LAB: ti rispondo al messaggio che mi hai lasciato sul sito. `}
        />
        <div className="flex flex-wrap gap-2">
          {AZIONI[m.status].map((az) => (
            <button
              key={az.a}
              type="button"
              className="btn btn-linea btn-sm"
              onClick={() => onSposta(az.a)}
              disabled={occupato}
              aria-label={`${az.label}: messaggio di ${nome}`}
            >
              {az.label}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}
