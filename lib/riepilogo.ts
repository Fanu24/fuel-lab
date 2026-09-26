import { getExtra } from "./catalogo";
import { TAGLIE, preventivo, tagliaPer, type Preventivo } from "./pricing";
import { GIORNI, PASTI, ZERO_MACRO, macroCasella, type Casella, type Piano } from "./settimana";
import type { Formula, Macros } from "./types";

/* =========================================================================
   Il riepilogo della settimana: tutti i numeri della barra in un colpo solo.

   Puro, senza React: la barra del compositore, la pagina di richiesta e la
   dashboard leggono gli stessi numeri dalla stessa funzione, invece di
   ricalcolarli ognuna a modo suo. Se il prezzo si vede o no lo decide chi
   rende (MOSTRA_STIMA_PREZZO in pricing.ts), non questo modulo: qui i conti
   si fanno sempre, cosi' restano provati anche mentre sono nascosti.
   ========================================================================= */

export interface RiepilogoSettimana {
  /** caselle con almeno un elemento dentro */
  pasti: number;
  /** giorni con almeno una casella piena */
  giorniPieni: number;
  macroSettimana: Macros;
  /** media sui soli giorni pieni: un giorno non scelto non e' un giorno a digiuno. Non arrotondata. */
  macroMediaGiorno: Macros;
  /** null a settimana vuota: un preventivo di zero pasti con la consegna dentro non ha senso */
  preventivo: Preventivo | null;
  /** la prima taglia che abbassa davvero il prezzo a pasto; null quando non ce ne sono altre */
  prossimaTaglia: { mancano: number; prezzoPasto: number } | null;
  /** somma dei supplementi degli extra che hanno un prezzo */
  supplementiExtra: number;
  /** quanti extra non hanno un prezzo nel listino: li quota Matteo */
  extraSuRichiesta: number;
  /** il "da X € a pasto" della barra: la taglia piu' grande */
  prezzoMinimo: number;
}

function somma(a: Macros, b: Macros): Macros {
  return {
    kcal: a.kcal + b.kcal,
    proteine: a.proteine + b.proteine,
    carboidrati: a.carboidrati + b.carboidrati,
    grassi: a.grassi + b.grassi,
  };
}

function dividi(m: Macros, n: number): Macros {
  if (n === 0) return { ...ZERO_MACRO };
  return {
    kcal: m.kcal / n,
    proteine: m.proteine / n,
    carboidrati: m.carboidrati / n,
    grassi: m.grassi / n,
  };
}

/**
 * Sotto i 6 pasti si paga gia' il prezzo della taglia da 6: dire "ne mancano 5" per
 * lo stesso prezzo sarebbe una spinta senza premio. Conta solo la soglia che cambia
 * il numero sullo scontrino.
 */
function prossimaTagliaPer(pasti: number): RiepilogoSettimana["prossimaTaglia"] {
  const attuale = tagliaPer(pasti).prezzoPasto;
  const t = TAGLIE.find((x) => x.pasti > pasti && x.prezzoPasto < attuale);
  return t ? { mancano: t.pasti - pasti, prezzoPasto: t.prezzoPasto } : null;
}

export function riepilogoSettimana(piano: Piano, formula: Formula): RiepilogoSettimana {
  let pasti = 0;
  let giorniPieni = 0;
  let macroSettimana: Macros = { ...ZERO_MACRO };
  let supplementiExtra = 0;
  let extraSuRichiesta = 0;

  for (const g of GIORNI) {
    const caselle = PASTI.map((m) => piano[g]?.[m]).filter((c): c is Casella => !!c);
    if (caselle.length > 0) giorniPieni += 1;
    for (const c of caselle) {
      pasti += 1;
      macroSettimana = somma(macroSettimana, macroCasella(c));
      for (const id of c.extra) {
        const e = getExtra(id);
        if (!e) continue; // id morto: il menu cambia, il piano salvato no
        if (e.prezzoEuro != null) supplementiExtra += e.prezzoEuro;
        else extraSuRichiesta += 1;
      }
    }
  }

  return {
    pasti,
    giorniPieni,
    macroSettimana,
    macroMediaGiorno: dividi(macroSettimana, giorniPieni),
    preventivo: pasti === 0 ? null : preventivo(pasti, formula),
    prossimaTaglia: prossimaTagliaPer(pasti),
    supplementiExtra,
    extraSuRichiesta,
    prezzoMinimo: TAGLIE[TAGLIE.length - 1].prezzoPasto,
  };
}
