import { EXTRA, PIATTI } from "./catalogo";
import { CASELLE_TOTALI, GIORNI, PASTI, potaPiano } from "./settimana";
import type { Casella, Pasto, Piano } from "./settimana";

/* =========================================================================
   Il piano della settimana dentro un link.

   Gli id del catalogo sono lunghi: quattordici caselle piene li farebbero
   sfondare il limite pratico dei 2000 caratteri di URL. Quindi nella stringa
   finiscono gli INDICI nelle liste del catalogo, a larghezza fissa, con
   impronta in testa: un link di un menu diverso viene rifiutato, non interpretato.
   ========================================================================= */

const VUOTO = "-";
const SEP = "~";
const ASSENTE = "_";

function cifre36(massimo: number): number {
  let cifre = 1;
  let capienza = 36;
  while (capienza <= massimo) {
    capienza *= 36;
    cifre += 1;
  }
  return cifre;
}

const LARGH_PIATTO = cifre36(Math.max(0, PIATTI.length - 1));
const LARGH_EXTRA = cifre36(2 ** EXTRA.length - 1);
const LARGH_CASELLA = LARGH_PIATTO + LARGH_EXTRA;
const LUNGH_CORPO = CASELLE_TOTALI * LARGH_CASELLA;

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const MATERIA = [
  PIATTI.map((e) => e.id).join(","),
  EXTRA.map((e) => e.id).join(","),
  GIORNI.join(","),
  PASTI.join(","),
].join(";");

export const IMPRONTA_CATALOGO = `${(PIATTI.length + EXTRA.length).toString(36)}-${fnv1a(MATERIA).toString(36)}`;

const INDICE_PIATTO = new Map(PIATTI.map((e, i) => [e.id, i] as const));
const INDICE_EXTRA = new Map(EXTRA.map((e, i) => [e.id, i] as const));

function campo(n: number, largh: number): string {
  return n.toString(36).padStart(largh, "0");
}

function codificaCasella(c: Casella | undefined): string {
  const piatto = c?.piatto === undefined ? undefined : INDICE_PIATTO.get(c.piatto);

  const accesi = new Set<number>();
  for (const id of c?.extra ?? []) {
    const i = INDICE_EXTRA.get(id);
    if (i !== undefined) accesi.add(i);
  }
  let maschera = 0;
  for (const i of accesi) maschera += 2 ** i;

  const niente = ASSENTE.repeat(LARGH_PIATTO);
  return (piatto === undefined ? niente : campo(piatto, LARGH_PIATTO)) + campo(maschera, LARGH_EXTRA);
}

export function codificaPiano(p: Piano): string {
  const pulito = potaPiano(p);
  if (Object.keys(pulito).length === 0) return VUOTO;

  let corpo = "";
  for (const g of GIORNI) {
    for (const m of PASTI) corpo += codificaCasella(pulito[g]?.[m]);
  }
  return `${IMPRONTA_CATALOGO}${SEP}${corpo}`;
}

const ALFABETO = /^[0-9a-z_]+$/;

function leggiIndice(tok: string, quanti: number): number | undefined {
  if (tok.includes(ASSENTE)) return undefined;
  const n = Number.parseInt(tok, 36);
  return Number.isInteger(n) && n >= 0 && n < quanti ? n : undefined;
}

function leggiExtra(tok: string): string[] {
  const maschera = Number.parseInt(tok, 36);
  if (!Number.isInteger(maschera) || maschera < 0) return [];
  const out: string[] = [];
  for (let i = 0; i < EXTRA.length; i += 1) {
    if (Math.floor(maschera / 2 ** i) % 2 === 1) out.push(EXTRA[i].id);
  }
  return out;
}

export function decodificaPiano(s: string): Piano | null {
  try {
    if (typeof s !== "string") return null;
    const testo = s.trim().toLowerCase();
    if (testo === "") return null;
    if (testo === VUOTO) return {};

    const parti = testo.split(SEP);
    if (parti.length !== 2) return null;
    if (parti[0] !== IMPRONTA_CATALOGO) return null;

    const corpo = parti[1];
    if (corpo.length !== LUNGH_CORPO || !ALFABETO.test(corpo)) return null;

    const grezzo: Piano = {};
    let cursore = 0;
    for (const g of GIORNI) {
      const riga: Partial<Record<Pasto, Casella>> = {};
      for (const m of PASTI) {
        const blocco = corpo.slice(cursore, cursore + LARGH_CASELLA);
        cursore += LARGH_CASELLA;

        const iPiatto = leggiIndice(blocco.slice(0, LARGH_PIATTO), PIATTI.length);
        const casella: Casella = { extra: leggiExtra(blocco.slice(LARGH_PIATTO)) };
        if (iPiatto !== undefined) casella.piatto = PIATTI[iPiatto].id;
        riga[m] = casella;
      }
      grezzo[g] = riga;
    }

    return potaPiano(grezzo);
  } catch {
    return null;
  }
}

export function linkPiano(p: Piano, origine: string): string {
  const base = origine.replace(/\/+$/, "");
  return `${base}/settimana?p=${encodeURIComponent(codificaPiano(p))}`;
}
