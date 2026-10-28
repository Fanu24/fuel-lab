import { GIORNI, PASTI, type Piano } from "@/lib/settimana";
import { getPiatto } from "@/lib/catalogo";
import { giornoDelPiano, isData } from "@/lib/produzione";

export type PiattoQuantita = { id: string; quantita: number };
export const MAX_PIATTI_ORDINE = GIORNI.length * PASTI.length;

/** Il piano mantiene i pasti nell'ordine a partire dal giorno di ritiro scelto. */
export function pianoDaQuantita(righe: PiattoQuantita[], data: string): Piano {
  const piano: Piano = {};
  const totale = righe.reduce((n, r) => n + r.quantita, 0);
  if (totale > MAX_PIATTI_ORDINE || righe.some((r) => !getPiatto(r.id) || !Number.isInteger(r.quantita) || r.quantita < 1)) {
    throw new Error(`Scegli da 1 a ${MAX_PIATTI_ORDINE} piatti per ordine.`);
  }
  const inizio = isData(data) ? GIORNI.indexOf(giornoDelPiano(data)) : 0;
  let slot = 0;
  for (const riga of righe) for (let n = 0; n < riga.quantita; n++, slot++) {
    const giorno = GIORNI[(inizio + Math.floor(slot / PASTI.length)) % GIORNI.length];
    piano[giorno] = { ...piano[giorno], [PASTI[slot % PASTI.length]]: { piatto: riga.id, extra: [] } };
  }
  return piano;
}
