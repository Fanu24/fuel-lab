import { getExtra, getPiatto } from "../catalogo";
import { riempiSettimana } from "../autofill";
import { decodificaAllenamenti } from "../condivisione";
import { riepilogoSettimana } from "../riepilogo";
import { GIORNI, PASTI, conCasella, type Piano } from "../settimana";
import type { ServizioId } from "../servizi";
import type { Formula } from "../types";
import type { Richiesta, StatoRichiesta } from "./tipi";

/* =========================================================================
   Le richieste d'esempio della dashboard demo.

   Relative a `oggi` e non a date scritte a mano: la demo deve sembrare viva il
   giorno in cui Matteo la apre, non tre mesi fa. I piani non sono inventati
   casella per casella, li compone l'autoriempimento dagli allenamenti, cosi'
   sono plausibili e restano validi se il menu cambia. I telefoni sono
   dichiaratamente finti (333 000 00xx): nessuno deve poterli chiamare.
   ========================================================================= */

interface Modello {
  nome: string;
  comune: string;
  stato: StatoRichiesta;
  servizio: ServizioId;
  formula: Formula;
  /** sette caratteri come nel link condiviso: c/p/r/- da lunedi a domenica */
  settimana: string;
  pastiAlGiorno: 1 | 2;
  rimescola: number;
  /** quanto tempo fa, in ore */
  oreFa: number;
  note?: string;
  noteInterne?: string;
  /** extra da attaccare al pranzo del primo giorno pieno */
  extra?: string[];
}

const MODELLI: Modello[] = [
  { nome: "Luca Di Marco", comune: "Pescara", stato: "nuova", servizio: "menu-settimana",
    formula: "abbonamento", settimana: "pcpcp--", pastiAlGiorno: 2, rimescola: 0, oreFa: 2,
    extra: ["carb-basmati-integrale", "snack-centrifugati"] },
  { nome: "Giulia Ferri", comune: "Montesilvano", stato: "nuova", servizio: "sui-tuoi-macro",
    formula: "singolo", settimana: "ccccc--", pastiAlGiorno: 1, rimescola: 1, oreFa: 29,
    note: "Preparo la mezza maratona di Pescara, mi servono carboidrati." },
  { nome: "Alessandro Rossi", comune: "Francavilla al Mare", stato: "nuova",
    servizio: "menu-settimana", formula: "singolo", settimana: "prprprr", pastiAlGiorno: 2,
    rimescola: 0, oreFa: 51 },
  { nome: "Martina De Luca", comune: "Spoltore", stato: "contattata", servizio: "menu-settimana",
    formula: "abbonamento", settimana: "cpcrpc-", pastiAlGiorno: 2, rimescola: 2, oreFa: 75,
    noteInterne: "Sentita al telefono, conferma giovedi dopo la palestra." },
  { nome: "Francesco Marino", comune: "Chieti", stato: "contattata", servizio: "sui-tuoi-macro",
    formula: "abbonamento", settimana: "ppppprr", pastiAlGiorno: 2, rimescola: 1, oreFa: 122,
    extra: ["carb-basmati-integrale"] },
  { nome: "Sara Colangelo", comune: "San Giovanni Teatino", stato: "nuova",
    servizio: "home-cooking", formula: "singolo", settimana: "-------", pastiAlGiorno: 1,
    rimescola: 0, oreFa: 146, note: "Cena per sei persone, sabato sera." },
  { nome: "Davide Di Nicola", comune: "Pescara", stato: "chiusa", servizio: "menu-settimana",
    formula: "abbonamento", settimana: "pcpcpc-", pastiAlGiorno: 2, rimescola: 0, oreFa: 194,
    noteInterne: "Abbonamento partito, consegna il lunedi." },
  { nome: "Chiara D'Alessandro", comune: "Montesilvano", stato: "chiusa",
    servizio: "menu-settimana", formula: "singolo", settimana: "c-c-c--", pastiAlGiorno: 2,
    rimescola: 1, oreFa: 243 },
  { nome: "Andrea Di Censo", comune: "Città Sant'Angelo", stato: "persa",
    servizio: "menu-settimana", formula: "singolo", settimana: "rrrrr--", pastiAlGiorno: 1,
    rimescola: 0, oreFa: 290, noteInterne: "Non risponde da una settimana." },
  { nome: "Federica Mancini", comune: "Pescara", stato: "contattata", servizio: "menu-settimana",
    formula: "singolo", settimana: "pp-pp--", pastiAlGiorno: 2, rimescola: 2, oreFa: 338 },
  { nome: "Simone Di Battista", comune: "Francavilla al Mare", stato: "persa",
    servizio: "sui-tuoi-macro", formula: "abbonamento", settimana: "cpcpcpr", pastiAlGiorno: 2,
    rimescola: 1, oreFa: 410, noteInterne: "Ha preferito un servizio con consegna la domenica." },
  { nome: "Elena Pace", comune: "Chieti", stato: "chiusa", servizio: "menu-settimana",
    formula: "abbonamento", settimana: "ccpcc--", pastiAlGiorno: 1, rimescola: 0, oreFa: 458 },
];

function conExtra(p: Piano, extra: string[] | undefined): Piano {
  if (!extra?.length) return p;
  for (const g of GIORNI) {
    const c = p[g]?.pranzo;
    if (c) return conCasella(p, g, "pranzo", { ...c, extra: [...extra] });
  }
  return p;
}

/** La fotografia dei nomi che una richiesta vera salva al momento dell'invio. */
function nomiDi(p: Piano): Record<string, string> {
  const out: Record<string, string> = {};
  for (const g of GIORNI) {
    for (const m of PASTI) {
      const c = p[g]?.[m];
      if (!c) continue;
      const piatto = c.piatto ? getPiatto(c.piatto) : undefined;
      if (piatto) out[piatto.id] = piatto.nome;
      for (const id of c.extra) {
        const e = getExtra(id);
        if (e) out[e.id] = e.nome;
      }
    }
  }
  return out;
}

export function richiesteDemo(oggi: Date): Richiesta[] {
  return MODELLI.map((m, i) => {
    const allenamenti = decodificaAllenamenti(m.settimana);
    const piano = conExtra(
      riempiSettimana({}, allenamenti, {
        pastiAlGiorno: m.pastiAlGiorno,
        sovrascrivi: false,
        rimescola: m.rimescola,
      }),
      m.extra,
    );
    const riepilogo = riepilogoSettimana(piano, m.formula);
    const creata = new Date(oggi.getTime() - m.oreFa * 3_600_000).toISOString();
    const n = String(i + 1).padStart(2, "0");
    return {
      id: `demo-${n}`,
      creataIl: creata,
      aggiornataIl: creata,
      stato: m.stato,
      servizio: m.servizio,
      formula: m.formula,
      contatto: { nome: m.nome, telefono: `333 000 00${n}`, comune: m.comune, note: m.note },
      piano,
      allenamenti,
      nomiPiatti: nomiDi(piano),
      pasti: riepilogo.pasti,
      macro: riepilogo.macroSettimana,
      noteInterne: m.noteInterne,
      origine: "demo",
    };
  });
}
