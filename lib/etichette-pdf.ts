/* Solo browser: il canvas disegna le etichette, pdf-lib le impacchetta in un PDF A4.
   Si importa in dinamico dal bottone (vedi VistaGiorno), così pdf-lib non sta nel primo caricamento
   e il modulo non gira mai al build. Il layout (posizioni, a capo, nomi) sta in etichette-layout.ts. */

import { PDFDocument } from "pdf-lib";
import type { EtichettaPannello } from "./pannello";
import { ETICHETTA_MM, adattaNome, dataEtichetta, posizioneEtichetta, vaACapo } from "./etichette-layout";

/* A4 a 300 dpi: 2480 × 3508 px, cioè 11,811 px per mm. */
const PX_PER_MM = 300 / 25.4;
const PAGINA_PX = { larghezza: 2480, altezza: 3508 };
/* A4 in punti PDF. */
const PAGINA_PT = { larghezza: 595.28, altezza: 841.89 };
const PER_FOGLIO = 21;

/* Le proporzioni del mockup approvato (etichetta-a-e-altro.html). */
const INTERLINEA_TESTATA = 1.3;
const SPAZIATURA_GIORNO = 0.12; // em
const SPAZIO_NOME_TESTATA = 2; // mm, come margin-top: 10px nel mockup
const SPAZIO_PIATTO_NOME = 1.2; // mm, come margin-top: 6px nel mockup
const SPESSORE_REGOLA = 0.3; // mm
const SPAZIO_REGOLA_TESTO = 1.2; // mm, padding-top della regola nel mockup
const SPOSTA_MAX = 5;
const CHIAVE_SPOSTA = "fuellab-etichette-sposta";

type Famiglie = { disp: string; ui: string; mono: string };

/**
 * Crea il PDF con le etichette: una pagina A4 per ogni 21 etichette, nell'ordine ricevuto.
 * Con `prova` disegna soltanto le 21 caselle e una croce al centro di ognuna, per regolare la stampa.
 */
export async function creaPdfEtichette(
  etichette: EtichettaPannello[],
  opzioni: { preparatoIl: string; sposta: { x: number; y: number }; prova?: boolean },
): Promise<Blob> {
  if (!opzioni.prova && etichette.length === 0) throw new Error("Nessuna etichetta da stampare.");
  const famiglie = leggiFamiglie();
  await caricaFont(famiglie);
  const logo = await caricaImmagine("/logo-fuellab.png");

  const canvas = document.createElement("canvas");
  canvas.width = PAGINA_PX.larghezza;
  canvas.height = PAGINA_PX.altezza;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Il browser non offre il canvas.");

  const pdf = await PDFDocument.create();
  const fogli = opzioni.prova ? 1 : Math.ceil(etichette.length / PER_FOGLIO);
  for (let f = 0; f < fogli; f++) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (opzioni.prova) {
      for (let i = 0; i < PER_FOGLIO; i++) disegnaCasella(ctx, posizioneEtichetta(i, opzioni.sposta));
    } else {
      const gruppo = etichette.slice(f * PER_FOGLIO, (f + 1) * PER_FOGLIO);
      gruppo.forEach((e, i) => disegnaEtichetta(ctx, logo, e, posizioneEtichetta(i, opzioni.sposta), famiglie, opzioni.preparatoIl));
    }
    const png = await canvasInPng(canvas);
    const immagine = await pdf.embedPng(png);
    const pagina = pdf.addPage([PAGINA_PT.larghezza, PAGINA_PT.altezza]);
    pagina.drawImage(immagine, { x: 0, y: 0, width: PAGINA_PT.larghezza, height: PAGINA_PT.altezza });
  }
  const bytes = await pdf.save();
  // Una copia su un ArrayBuffer semplice: il Blob non accetta un Uint8Array su ArrayBufferLike.
  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
}

/**
 * Consegna il PDF: il foglio di condivisione del telefono (su iPhone c'è "Stampa"), altrimenti
 * una nuova scheda con il PDF. Annullare la condivisione non è un errore.
 */
export async function consegnaPdf(blob: Blob, nomeFile: string): Promise<void> {
  const file = new File([blob], nomeFile, { type: "application/pdf" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: nomeFile });
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      // Condivisione non riuscita (per esempio il gesto dell'utente è scaduto mentre si generava il PDF): si apre come sotto.
    }
  }
  const url = URL.createObjectURL(blob);
  const finestra = window.open(url, "_blank");
  // Se il browser ha bloccato la scheda, il PDF si apre nella pagina stessa.
  if (!finestra) window.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** La correzione di stampa salvata sul telefono. Senza storage (modalità privata) è zero. */
export function leggiSposta(): { x: number; y: number } {
  try {
    const grezzo = window.localStorage.getItem(CHIAVE_SPOSTA);
    if (!grezzo) return { x: 0, y: 0 };
    const dati = JSON.parse(grezzo) as { x?: unknown; y?: unknown };
    return { x: pulisciSposta(dati.x), y: pulisciSposta(dati.y) };
  } catch {
    return { x: 0, y: 0 };
  }
}

export function salvaSposta(sposta: { x: number; y: number }): void {
  try {
    window.localStorage.setItem(CHIAVE_SPOSTA, JSON.stringify({ x: pulisciSposta(sposta.x), y: pulisciSposta(sposta.y) }));
  } catch {
    // Storage non disponibile: la correzione vale per questa sola volta.
  }
}

function pulisciSposta(valore: unknown): number {
  const n = typeof valore === "number" && Number.isFinite(valore) ? valore : 0;
  return Math.min(SPOSTA_MAX, Math.max(-SPOSTA_MAX, n));
}

/* ---------- Font e immagini ---------- */

function leggiFamiglie(): Famiglie {
  const stile = getComputedStyle(document.documentElement);
  const leggi = (nome: string, di: string) => stile.getPropertyValue(nome).trim() || di;
  return {
    disp: leggi("--f-disp", "sans-serif"),
    ui: leggi("--f-ui", "sans-serif"),
    mono: leggi("--f-mono", "monospace"),
  };
}

/* Il canvas disegna solo con i font già caricati: si chiedono quelli che servono prima di disegnare. */
async function caricaFont(f: Famiglie): Promise<void> {
  await Promise.all([
    document.fonts.load(`800 40px ${f.disp}`),
    document.fonts.load(`700 40px ${f.disp}`),
    document.fonts.load(`600 40px ${f.ui}`),
    document.fonts.load(`400 40px ${f.ui}`),
    document.fonts.load(`600 40px ${f.mono}`),
  ]);
}

function caricaImmagine(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, ko) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => ko(new Error(`Immagine non caricata: ${src}`));
    img.src = src;
  });
}

function canvasInPng(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((ok, ko) => {
    canvas.toBlob((blob) => {
      if (!blob) return ko(new Error("Il canvas non è diventato un'immagine."));
      blob.arrayBuffer().then((buf) => ok(new Uint8Array(buf)), ko);
    }, "image/png");
  });
}

/* ---------- Disegno ---------- */

/* Tutte le posizioni e le misure in mm sono convertite in px qui sotto, così i font hanno la
   dimensione vera in px e non dipendono da una trasformazione del canvas. */
const px = (mm: number) => mm * PX_PER_MM;

/** Un'etichetta, come `etichetta-a-e-altro.html`: testata con logo e giorno/pasto, nome, piatto, piede. */
function disegnaEtichetta(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement,
  e: EtichettaPannello,
  origine: { x: number; y: number },
  f: Famiglie,
  preparatoIl: string,
): void {
  const E = ETICHETTA_MM;
  const sinistra = origine.x + E.margineLato;
  const destra = origine.x + E.larghezza - E.margineLato;
  const larghezzaTesto = E.larghezza - 2 * E.margineLato;
  ctx.fillStyle = "#000";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // Testata: il logo a sinistra, giorno e pasto a destra, centrati sull'altezza del logo.
  const testaAltezza = Math.max(E.logoAltezza, 2 * E.giornoCorpo * INTERLINEA_TESTATA);
  const testaTop = origine.y + E.margineAlto;
  const logoLarghezza = (E.logoAltezza * logo.naturalWidth) / logo.naturalHeight;
  ctx.drawImage(logo, px(sinistra), px(testaTop + (testaAltezza - E.logoAltezza) / 2), px(logoLarghezza), px(E.logoAltezza));
  ctx.font = `700 ${px(E.giornoCorpo)}px ${f.disp}`;
  const spazio = px(SPAZIATURA_GIORNO * E.giornoCorpo);
  [e.giorno, e.pasto].forEach((riga, i) => {
    const centro = testaTop + (i + 0.5) * E.giornoCorpo * INTERLINEA_TESTATA;
    scriviADestra(ctx, riga.toLocaleUpperCase("it-IT"), px(destra), px(centro - (E.giornoCorpo * INTERLINEA_TESTATA) / 2), spazio);
  });

  // Nome: in maiuscolo, rimpicciolito fino a 4 mm, poi tagliato.
  const nomeMisura = (t: string, corpoMm: number) => {
    ctx.font = `800 ${px(corpoMm)}px ${f.disp}`;
    return ctx.measureText(t).width / PX_PER_MM;
  };
  const nome = adattaNome(e.cliente.toLocaleUpperCase("it-IT"), larghezzaTesto, nomeMisura);
  const nomeTop = testaTop + testaAltezza + SPAZIO_NOME_TESTATA;
  ctx.font = `800 ${px(nome.corpoMm)}px ${f.disp}`;
  ctx.fillText(nome.testo, px(sinistra), px(nomeTop));

  // Piatto: Archivo 600, al massimo due righe.
  const piattoMisura = (t: string) => {
    ctx.font = `600 ${px(E.piattoCorpo)}px ${f.ui}`;
    return ctx.measureText(t).width / PX_PER_MM;
  };
  const righePiatto = vaACapo(e.piatto, larghezzaTesto, piattoMisura, 2);
  ctx.font = `600 ${px(E.piattoCorpo)}px ${f.ui}`;
  const piattoTop = nomeTop + nome.corpoMm + SPAZIO_PIATTO_NOME;
  righePiatto.forEach((riga, i) => {
    ctx.fillText(riga, px(sinistra), px(piattoTop + i * E.piattoCorpo * E.piattoInterlinea));
  });

  // Piede: in fondo, una regola sottile e "Preparato il <data>".
  const piedeRiga = E.piedeCorpo * 1.2;
  const piedeTesto = origine.y + E.altezza - E.margineBasso - piedeRiga;
  const regolaTop = piedeTesto - SPAZIO_REGOLA_TESTO - SPESSORE_REGOLA;
  ctx.fillRect(px(sinistra), px(regolaTop), px(larghezzaTesto), px(SPESSORE_REGOLA));
  ctx.font = `400 ${px(E.piedeCorpo)}px ${f.ui}`;
  const prefisso = "Preparato il ";
  ctx.fillText(prefisso, px(sinistra), px(piedeTesto));
  const larghezzaPrefisso = ctx.measureText(prefisso).width;
  ctx.font = `600 ${px(E.piedeCorpo)}px ${f.mono}`;
  ctx.fillText(dataEtichetta(preparatoIl), px(sinistra) + larghezzaPrefisso, px(piedeTesto));
}

/** Una casella della prova di stampa: il bordo di 70 × 42,3 mm e una croce al centro. */
function disegnaCasella(ctx: CanvasRenderingContext2D, origine: { x: number; y: number }): void {
  const E = ETICHETTA_MM;
  const bracci = 4; // mm
  ctx.strokeStyle = "#000";
  ctx.lineWidth = px(0.2);
  ctx.strokeRect(px(origine.x), px(origine.y), px(E.larghezza), px(E.altezza));
  const cx = px(origine.x + E.larghezza / 2);
  const cy = px(origine.y + E.altezza / 2);
  ctx.beginPath();
  ctx.moveTo(cx - px(bracci), cy);
  ctx.lineTo(cx + px(bracci), cy);
  ctx.moveTo(cx, cy - px(bracci));
  ctx.lineTo(cx, cy + px(bracci));
  ctx.stroke();
}

/* Il canvas non ha letterSpacing ovunque (Safari), quindi il testo si scrive lettera per lettera. */
function scriviADestra(ctx: CanvasRenderingContext2D, testo: string, xDestra: number, y: number, spazio: number): void {
  const lettere = Array.from(testo);
  const larghezze = lettere.map((l) => ctx.measureText(l).width);
  const totale = larghezze.reduce((a, b) => a + b, 0) + spazio * lettere.length;
  let x = xDestra - totale;
  lettere.forEach((l, i) => {
    ctx.fillText(l, x, y);
    x += larghezze[i] + spazio;
  });
}
