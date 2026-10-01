import { INDIRIZZO } from "@/lib/sito";
import { SOGLIA_PREZZO } from "@/lib/servizi";

/* I fatti che chi arriva da Google cerca per primi: quanto costa, dove si ritira,
   come si paga. Letti dalle stesse costanti del resto del sito, cosi' non
   possono restare indietro. */
export const FATTO_PREZZO = `Da ${SOGLIA_PREZZO.toFixed(2).replace(".", ",")} € a pasto`;
export const FATTO_RITIRO = `Ritiro in ${INDIRIZZO.via}`;
export const FATTO_PAGAMENTO = "Nessun pagamento online";

/** Una riga di fatti brevi, con il quadratino del marchio. Sta sotto i bottoni, mai al loro posto. */
export default function Fatti({ voci, className = "" }: { voci: string[]; className?: string }) {
  return (
    <ul className={`fatti ${className}`}>
      {voci.map((v) => (
        <li key={v}>{v}</li>
      ))}
    </ul>
  );
}
