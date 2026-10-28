/* Il layout delle etichette, senza canvas: misure in mm, tutto testabile in Node.
   Il disegno vero sta in etichette-pdf.ts (solo browser). Le misure vengono dal mockup approvato
   (etichetta-a-e-altro.html, 5 px = 1 mm). */

export const ETICHETTA_MM = {
  larghezza: 70,
  altezza: 42.3,
  margineAlto: 2.8,
  margineLato: 3.2,
  margineBasso: 2.4,
  logoAltezza: 6,
  giornoCorpo: 2.4,
  nomeMax: 6.8,
  nomeMin: 4,
  piattoCorpo: 3,
  piattoInterlinea: 1.2,
  piedeCorpo: 2.2,
};

/* (297 − 7 × 42,3) / 2: il foglio A4 ha sette righe di etichette, centrate in verticale. */
export const MARGINE_FOGLIO_ALTO_MM = 0.45;

const COLONNE = 3;
const SPOSTA_MAX_MM = 5;

/** Una correzione di stampa in mm: da −5 a 5; un valore che non è un numero diventa 0. */
export function pulisciSposta(valore: unknown): number {
  const n = typeof valore === "number" && Number.isFinite(valore) ? valore : 0;
  return Math.min(SPOSTA_MAX_MM, Math.max(-SPOSTA_MAX_MM, n));
}

/**
 * Dove sta l'etichetta `indice` (da 0 a 20) sul foglio, in mm, angolo in alto a sinistra.
 * Riga per riga, da sinistra a destra. `sposta` è la correzione di stampa dell'utente.
 */
export function posizioneEtichetta(indice: number, sposta: { x: number; y: number }): { x: number; y: number } {
  const colonna = indice % COLONNE;
  const riga = Math.floor(indice / COLONNE);
  return {
    x: colonna * ETICHETTA_MM.larghezza + sposta.x,
    y: MARGINE_FOGLIO_ALTO_MM + riga * ETICHETTA_MM.altezza + sposta.y,
  };
}

/* Accorcia `riga` finché ci sta con i puntini in fondo: prima via le parole intere, poi lettera per lettera. */
function conPuntini(riga: string, larghezzaMm: number, misura: (t: string) => number): string {
  const parole = riga.split(" ");
  while (parole.length > 1 && misura(`${parole.join(" ")}…`) > larghezzaMm) parole.pop();
  let testo = parole.join(" ");
  while (testo.length > 0 && misura(`${testo}…`) > larghezzaMm) testo = testo.slice(0, -1);
  return `${testo}…`;
}

/**
 * Spezza `testo` sugli spazi in al massimo `maxRighe` righe, ognuna non più larga di `larghezzaMm`.
 * Se non ci sta tutto, l'ultima riga finisce con "…". Una parola più larga della riga si accorcia.
 */
export function vaACapo(testo: string, larghezzaMm: number, misura: (t: string) => number, maxRighe: number): string[] {
  const parole = testo
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => (misura(p) <= larghezzaMm ? p : conPuntini(p, larghezzaMm, misura)));
  const righe: string[] = [];
  let corrente = "";
  for (const parola of parole) {
    const prova = corrente ? `${corrente} ${parola}` : parola;
    if (!corrente || misura(prova) <= larghezzaMm) {
      corrente = prova;
      continue;
    }
    righe.push(corrente);
    if (righe.length === maxRighe) {
      // La parola che non entra è rimasta fuori: l'ultima riga si chiude con i puntini.
      righe[maxRighe - 1] = conPuntini(righe[maxRighe - 1], larghezzaMm, misura);
      return righe;
    }
    corrente = parola;
  }
  if (corrente) righe.push(corrente);
  return righe;
}

/**
 * Il nome del cliente in una riga sola: parte da `nomeMax` e scende di 0,2 mm finché ci sta.
 * Se a `nomeMin` ancora non ci sta, si taglia con "…".
 */
export function adattaNome(
  testo: string,
  larghezzaMm: number,
  misuraA: (t: string, corpoMm: number) => number,
): { testo: string; corpoMm: number } {
  // Si conta in decimi di mm, così i passi da 0,2 non accumulano errori di arrotondamento.
  const max = Math.round(ETICHETTA_MM.nomeMax * 10);
  const min = Math.round(ETICHETTA_MM.nomeMin * 10);
  for (let decimi = max; decimi >= min; decimi -= 2) {
    const corpoMm = decimi / 10;
    if (misuraA(testo, corpoMm) <= larghezzaMm) return { testo, corpoMm };
  }
  const corpoMm = ETICHETTA_MM.nomeMin;
  let taglio = testo;
  while (taglio.length > 0 && misuraA(`${taglio.trimEnd()}…`, corpoMm) > larghezzaMm) taglio = taglio.slice(0, -1);
  return { testo: `${taglio.trimEnd()}…`, corpoMm };
}

/** "2026-10-28" -> "28/10/2026". Una data che non è in quella forma torna com'è. */
export function dataEtichetta(data: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : data;
}
