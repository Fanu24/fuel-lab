import { SOGLIA_PREZZO } from "@/lib/servizi";
import { EMAIL, INDIRIZZO_RIGA, NOME_ATTIVITA, QUANDO_CUCINA, TITOLARE } from "@/lib/sito";
import { prezzoIt } from "./schema";

/**
 * La scheda in sei righe: chi, dove, quando, come, quanto, contatto. E' il
 * paragrafo che un motore di risposte (o una persona di fretta) cita cosi'
 * com'e', quindi ogni riga sta in piedi da sola e usa i dati di lib/sito.ts.
 */
export default function InBreve({ className = "" }: { className?: string }) {
  const righe = [
    { k: "Che cos'è", v: `${NOME_ATTIVITA}: meal prep fresco, mai surgelato, per chi si allena` },
    { k: "Chi cucina", v: `${TITOLARE.nome}, cuoco` },
    { k: "Dove", v: INDIRIZZO_RIGA },
    { k: "Quando", v: QUANDO_CUCINA },
    { k: "Come", v: "Ritiro in sede o consegna a Pescara e dintorni, da confermare" },
    { k: "Quanto", v: `Da ${prezzoIt(SOGLIA_PREZZO)} € a pasto` },
  ];
  return (
    <div className={className}>
      <dl className="grid gap-x-8 border-t-[3px] border-ink sm:grid-cols-2 lg:grid-cols-3">
        {righe.map((r) => (
          <div key={r.k} className="border-b border-ink/15 py-5">
            <dt className="font-disp text-[11px] font-semibold tracking-[.16em] text-muted uppercase">{r.k}</dt>
            <dd className="mt-2 text-lg leading-snug">{r.v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 text-sm text-muted">
        Contatto: <a href={`mailto:${EMAIL}`} className="link">{EMAIL}</a>
      </p>
    </div>
  );
}
