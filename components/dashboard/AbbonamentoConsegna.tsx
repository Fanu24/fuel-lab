/* Una consegna di abbonamento, letta da chi cucina: che consegna e' (la 2 di 11),
   fino a quando copre, e i pasti che porta giorno per giorno con il piatto
   indicato dal cliente, se c'e'. Serve al foglio Cucina (Piatti e Ordini) e a
   Oggi: stessi numeri e stesse parole ovunque. */

import { NOMI_PASTO_ABB } from "@/lib/abbonamento";
import type { Ordine } from "@/lib/api";
import { consegnaDelGiorno, frasePasti, pastiInConsegnaPerGiorno } from "@/lib/produzione";
import { giorno as giornoCorto } from "./ui";

/** "Ritiro" o "Consegna a Pescara". */
export const dove = (o: Pick<Ordine, "fulfillment" | "comune">) =>
  o.fulfillment === "pickup" ? "Ritiro" : `Consegna${o.comune ? ` a ${o.comune}` : ""}`;

/** "Consegna 2 di 11 · 6 pasti: 3 pranzi, 3 cene · copre fino a lun 5 ott". Vuota se quel giorno non consegna. */
export function fraseConsegna(o: Ordine, giorno: string): string {
  const c = consegnaDelGiorno(o, giorno);
  if (!c) return "";
  return `Consegna ${c.numero} di ${c.totale} · ${frasePasti(c.pasti)} · copre fino a ${giornoCorto(c.fino)}`;
}

/**
 * I pasti della consegna, un giorno per riga: "sab 3 ott: colazione, pranzo
 * Riso…, cena". Un pasto senza piatto indicato e' solo il nome del pasto: la
 * ricetta la sceglie Matteo sulla scheda del cliente.
 */
export function PastiConsegna({ o, giorno }: { o: Ordine; giorno: string }) {
  const giorni = pastiInConsegnaPerGiorno(o, giorno);
  if (!giorni.length) return null;
  return (
    <ul className="cu-abb-giorni">
      {giorni.map((g) => (
        <li key={g.data}>
          <span className="cu-abb-giorno">{giornoCorto(g.data)}</span>
          <span className="cu-abb-pasti">
            {g.pasti.map((p, i) => (
              <span key={p.pasto} className="cu-abb-pasto">
                {i ? ", " : ""}
                {NOMI_PASTO_ABB[p.pasto].toLowerCase()}
                {p.voce ? (
                  <>
                    {" "}
                    <strong>{p.voce.name}</strong>
                    {p.voce.extras.length ? <span className="cu-voce-extra"> + {p.voce.extras.join(", ")}</span> : null}
                  </>
                ) : null}
              </span>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}
