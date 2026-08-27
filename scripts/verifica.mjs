/**
 * Verifica end-to-end nel browser vero (Chrome via puppeteer-core).
 *
 * Perche' esiste: questo sito e' nato con il fondo SCURO ed e' stato portato su
 * fondo CHIARO. Decine di colori di testo scelti per il buio sono rimasti dove
 * erano, e ogni volta la ricerca mirata nel sorgente li ha mancati: il lime su
 * carta ha luminanza IDENTICA alla carta (1.00:1) e nel codice si legge come un
 * colore qualsiasi, gli sfondi dichiarati inline sfuggono a chi cerca classi, e
 * un reset fuori da @layer puo' ribaltare il colore di trenta bottoni senza che
 * nessun file lo dica. Per questo qui NON si cercano colori sospetti: si CALCOLA
 * il rapporto di contrasto su OGNI nodo di testo visibile del rendering reale,
 * risalendo gli antenati per trovare il fondo effettivo.
 *
 * Uso:
 *   node scripts/verifica.mjs                  tutti i controlli su tutte le rotte
 *   node scripts/verifica.mjs --scatti         aggiunge gli screenshot a scorrimento
 *   node scripts/verifica.mjs --rotte=/menu,/servizi
 *   node scripts/verifica.mjs --larghezze=1440
 *
 * Prerequisiti: `npx next build && npx next start -p 4311` gia' avviato.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import puppeteer from "puppeteer-core";

const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:4311";

const ROTTE = [
  "/",
  "/menu",
  "/settimana",
  "/servizi",
  "/scheda",
  "/richiesta",
  "/come-funziona",
  "/chi-e-matteo",
];

/** 1440 e' il desktop di riferimento, 390 e' l'iPhone piu' stretto ancora in giro. */
const LARGHEZZE = [
  { nome: "desktop", width: 1440, height: 900 },
  { nome: "mobile", width: 390, height: 844 },
];

const argv = process.argv.slice(2);
const flag = (n) => argv.some((a) => a === `--${n}` || a.startsWith(`--${n}=`));
const valore = (n, def) => {
  const a = argv.find((x) => x.startsWith(`--${n}=`));
  return a ? a.slice(n.length + 3) : def;
};

const ROTTE_SCELTE = valore("rotte", "").length ? valore("rotte", "").split(",") : ROTTE;
const LARGHEZZE_SCELTE = valore("larghezze", "").length
  ? LARGHEZZE.filter((v) => valore("larghezze", "").split(",").includes(String(v.width)))
  : LARGHEZZE;
const FA_SCATTI = flag("scatti");
const DIR_SCATTI = valore("dir-scatti", path.join(process.cwd(), ".verifica-scatti"));

/* =========================================================================
   IL CONTROLLO DEI CONTRASTI, eseguito DENTRO la pagina.
   Tutto quello che segue viene serializzato e valutato nel browser: non puo'
   usare niente di questo file.
   ========================================================================= */

/**
 * @param {{ soloInViewport: boolean }} opzioni
 * Ritorna le misure dei nodi di testo che in questo momento stanno nel viewport
 * e che non sono gia' stati misurati (marcati con una proprieta' sull'elemento).
 */
function misuraContrastiInPagina(opzioni) {
  const CHIAVE = "__fuelMisurato";

  /* ---------- colore ---------------------------------------------------- */
  const parseColore = (s) => {
    if (!s) return null;
    const t = String(s).trim().toLowerCase();
    if (t === "transparent" || t === "none" || t === "currentcolor") return null;
    let m = t.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/);
    if (m) {
      const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      return [+m[1], +m[2], +m[3], a];
    }
    m = t.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/);
    if (m) {
      const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      return [+m[1] * 255, +m[2] * 255, +m[3] * 255, a];
    }
    m = t.match(/^#([0-9a-f]{6})$/);
    if (m) {
      const n = parseInt(m[1], 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
    }
    m = t.match(/^#([0-9a-f]{3})$/);
    if (m) {
      const h = m[1];
      return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16), 1];
    }
    return null;
  };

  /** sorgente con alpha sopra un fondo gia' opaco */
  const fondi = (fg, sfondo) => {
    const a = fg[3];
    return [
      fg[0] * a + sfondo[0] * (1 - a),
      fg[1] * a + sfondo[1] * (1 - a),
      fg[2] * a + sfondo[2] * (1 - a),
    ];
  };

  const lin = (c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const rapporto = (a, b) => {
    const l1 = lum(a);
    const l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const hex = (c) =>
    "#" + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");

  /* ---------- opacita' cumulativa e catena degli antenati ---------------- */
  const catenaDi = (el) => {
    const c = [];
    let n = el;
    while (n && n.nodeType === 1) {
      c.push(n);
      n = n.parentElement ?? (n.parentNode && n.parentNode.host) ?? null;
    }
    return c;
  };

  /**
   * Fondo effettivo per composizione degli antenati.
   * L'opacita' di un antenato vale per TUTTO il suo sottoalbero, quindi ogni
   * strato va moltiplicato per il prodotto delle opacita' da lui in su.
   */
  const fondoAntenati = (catena) => {
    const op = catena.map((n) => {
      const o = parseFloat(getComputedStyle(n).opacity);
      return Number.isNaN(o) ? 1 : o;
    });

    let iOpaco = Infinity;
    let iGruppo = Infinity;
    let immagine = null;
    for (let i = 0; i < catena.length; i++) {
      const cs = getComputedStyle(catena[i]);
      if (immagine === null && iOpaco === Infinity && cs.backgroundImage && cs.backgroundImage !== "none")
        immagine = cs.backgroundImage.slice(0, 70);
      const c = parseColore(cs.backgroundColor);
      if (iOpaco === Infinity && c && c[3] >= 0.999) iOpaco = i;
      if (iGruppo === Infinity && op[i] < 1) iGruppo = i;
    }

    /* ---------------------------------------------------------------------
       L'OPACITA' DI GRUPPO NON CAMBIA IL CONTRASTO, E CREDERE IL CONTRARIO
       PRODUCE DECINE DI DIFETTI CHE NON ESISTONO.

       `opacity` non si applica al testo: si applica al SOTTOALBERO, disegnato
       fuori schermo e poi fuso in blocco. Testo e fondo sbiadiscono INSIEME e
       nella stessa misura, quindi il rapporto fra i due resta quello di prima.
       Un `.btn-p:disabled` con opacity .38 e' bianco su inchiostro a 14.30:1
       tanto acceso quanto spento - fotografato, si legge benissimo.

       La versione precedente componeva il solo testo, gia' sbiadito, contro il
       fondo della PAGINA, e denunciava 60 nodi a 1.0-1.5:1 che a video sono
       perfettamente leggibili. Il difetto vero della vecchia versione non era
       il numero sbagliato: era che quei 60 falsi allarmi venivano archiviati
       come "esenti per WCAG 1.4.3", cioe' la conclusione giusta per la ragione
       sbagliata, che e' il modo migliore per non accorgersi mai che il calcolo
       e' rotto.

       L'opacita' conta SOLO quando il fondo opaco sta FUORI dal gruppo: li' il
       testo sbiadisce e quello che c'e' sotto no. Da cui la regola: se il primo
       fondo opaco si incontra prima (o insieme) al primo antenato con opacita'
       < 1, il gruppo contiene entrambi e l'opacita' si ignora.
       --------------------------------------------------------------------- */
    const dentroIlGruppo = iOpaco <= iGruppo;

    const cumDa = (i) => {
      if (dentroIlGruppo) return 1;
      let a = 1;
      for (let j = i; j < op.length; j++) a *= op[j];
      return a;
    };

    // La tela del browser parte bianca; body/html ci mettono sopra il loro fondo.
    let out = [255, 255, 255];
    for (let i = catena.length - 1; i >= 0; i--) {
      const cs = getComputedStyle(catena[i]);
      const c = parseColore(cs.backgroundColor);
      if (c && c[3] > 0) out = fondi([c[0], c[1], c[2], c[3] * cumDa(i)], out);
    }

    let visibilita = 1;
    for (const o of op) visibilita *= o;

    return { fondo: out, immagine, opacita: dentroIlGruppo ? 1 : visibilita, visibilita };
  };

  /**
   * Secondo parere: chi c'e' DAVVERO dietro, secondo l'ordine di disegno.
   * elementsFromPoint torna dall'alto verso il basso; tutto quello che sta dopo
   * il nostro elemento nella lista gli sta dietro. Serve a beccare i fondi che
   * non sono antenati (overlay assoluti, immagini, barre evidenziatore).
   */
  const FORME_SVG = new Set(["circle", "rect", "ellipse", "polygon", "path", "line", "polyline"]);

  const fondoDalPunto = (el, rect) => {
    const x = rect.left + Math.min(rect.width / 2, 40);
    const y = rect.top + rect.height / 2;
    /* Il punto deve stare DAVVERO dentro il viewport e dentro l'elemento.
       Prima veniva schiacciato dentro il viewport con un min/max: per un
       elemento sotto la piega si finiva a sondare un punto che non gli
       apparteneva, e nel selettore di /settimana le righe fuori dalla lista
       scrollabile risultavano appoggiate sulla velatura scura della tendina
       (#7c8a7b) invece che sulla loro casella chiara. */
    if (x < 1 || y < 1 || x > innerWidth - 1 || y > innerHeight - 1) return null;
    let pila;
    try {
      pila = document.elementsFromPoint(x, y);
    } catch {
      return null;
    }
    let i = pila.indexOf(el);
    if (i < 0) {
      /* Se l'elemento non e' nella pila o e' coperto, o e' ritagliato da un
         overflow: in nessuno dei due casi si puo' dedurre il suo fondo da un
         antenato qualsiasi. L'unico ripiego lecito e' un DISCENDENTE, che e'
         il caso normale degli inline: il punto centrale cade su un figlio. */
      i = pila.findIndex((n) => el.contains(n));
      if (i < 0) return null;
    }
    // Si parte da i, non da i+1: il fondo dell'elemento STESSO e' il primo
    // strato dietro il suo testo. Partire dopo significava dire che un bottone
    // inchiostro ha dietro il bianco della card, cioe' bianco su bianco.
    // E gli antenati NON si saltano: nell'ordine di disegno ci sono gia', al
    // posto giusto, ed e' quello che rende questa lettura piu' affidabile
    // della risalita del DOM invece che un doppione.
    const strati = [];
    let opaco = false;
    for (let k = i; k < pila.length; k++) {
      const n = pila[k];
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== "none") return { immagine: true };
      if (n.tagName === "IMG" || n.tagName === "VIDEO" || n.tagName === "CANVAS") return { immagine: true };
      /* Una forma SVG dipinge con `fill`, non con `background-color`: senza
         questo ramo il cerchio lime del timbro non risultava un fondo, la sonda
         proseguiva fino alla foto dietro e il marchio "FUEL LAB" veniva
         denunciato a 2.15:1 mentre a video e' inchiostro su lime, 12.61:1. */
      if (FORME_SVG.has(n.tagName.toLowerCase())) {
        const f = parseColore(cs.fill);
        if (f && f[3] > 0) {
          strati.push(f);
          if (f[3] >= 0.999) {
            opaco = true;
            break;
          }
        }
        continue;
      }
      const c = parseColore(cs.backgroundColor);
      if (c && c[3] > 0) {
        strati.push(c);
        if (c[3] >= 0.999) {
          opaco = true;
          break;
        }
      }
    }
    if (!opaco) return null; // niente di solido: se ne occupa la risalita del DOM
    let out = [255, 255, 255];
    for (let k = strati.length - 1; k >= 0; k--) out = fondi(strati[k], out);
    return { fondo: out };
  };

  /* ---------- visibilita' ------------------------------------------------ */
  const SALTA = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TITLE", "HEAD", "META", "LINK", "TEMPLATE", "BR"]);

  const nascostoDaLettoreSchermo = (cs) =>
    cs.clip === "rect(0px, 0px, 0px, 0px)" ||
    (cs.clipPath && cs.clipPath.includes("inset(50%)")) ||
    cs.clipPath === "circle(0px)";

  const percorso = (el) => {
    const parti = [];
    let n = el;
    for (let i = 0; n && n.nodeType === 1 && i < 4; i++, n = n.parentElement) {
      let s = n.tagName.toLowerCase();
      if (n.id) {
        parti.unshift(s + "#" + n.id);
        break;
      }
      const cl = (n.getAttribute("class") ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 3);
      if (cl.length) s += "." + cl.join(".");
      parti.unshift(s);
    }
    return parti.join(" > ");
  };

  /* ---------- raccolta --------------------------------------------------- */
  const misure = [];
  const tutti = document.querySelectorAll("*");

  for (const el of tutti) {
    if (el[CHIAVE]) continue;
    if (SALTA.has(el.tagName)) continue;

    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility !== "visible") continue;
    if (nascostoDaLettoreSchermo(cs)) {
      el[CHIAVE] = true;
      continue;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    if (opzioni.soloInViewport) {
      if (rect.bottom < 0 || rect.top > innerHeight) continue;
      if (rect.right < 0 || rect.left > innerWidth) continue;
    }

    /* testo diretto: nodi figli di tipo TEXT non vuoti */
    let testo = "";
    for (const n of el.childNodes) {
      if (n.nodeType === 3 && n.nodeValue && n.nodeValue.trim()) testo += n.nodeValue.trim() + " ";
    }
    testo = testo.trim();

    /* pseudo-elementi con content testuale */
    const pseudi = [];
    for (const p of ["::before", "::after"]) {
      const pcs = getComputedStyle(el, p);
      const c = pcs.content;
      if (c && c !== "none" && c !== "normal" && /^["']/.test(c) && c.replace(/^["']|["']$/g, "").trim()) {
        pseudi.push({ p, cs: pcs, testo: c.slice(0, 40) });
      }
    }

    /* placeholder e valore dei campi */
    const campo =
      (el.tagName === "INPUT" || el.tagName === "TEXTAREA") && (el.placeholder || el.value)
        ? el
        : null;

    if (!testo && !pseudi.length && !campo) continue;

    el[CHIAVE] = true;

    const catena = catenaDi(el);
    const { fondo, immagine, opacita, visibilita } = fondoAntenati(catena);
    if (visibilita <= 0.01) continue; // completamente trasparente: non e' testo visibile
    const probe = fondoDalPunto(el, rect);

    /* WCAG 1.4.3 esenta i componenti di interfaccia INATTIVI. Qui non li butto
       via: li marco, perche' in questo sito "disabilitato" e' lo stato normale
       finche' NEXT_PUBLIC_WHATSAPP non e' configurata, e va guardato lo stesso. */
    const disabilitato = el.closest(
      '[disabled], [aria-disabled="true"], fieldset[disabled]',
    ) != null;

    const nelSvg = el.ownerSVGElement != null || el.tagName.toLowerCase() === "svg";
    const dimensione = parseFloat(cs.fontSize) || 16;
    let peso = parseInt(cs.fontWeight, 10);
    if (Number.isNaN(peso)) peso = 400;
    const fvs = cs.fontVariationSettings;
    if (fvs && fvs !== "normal") {
      const m = /["']wght["']\s*([\d.]+)/.exec(fvs);
      if (m) peso = Math.max(peso, Math.round(parseFloat(m[1])));
    }
    const grande = dimensione >= 24 || (dimensione >= 18.66 && peso >= 700);
    const soglia = grande ? 3 : 4.5;

    const valuta = (grezzo, etichetta, campione) => {
      let c = parseColore(grezzo);
      if (!c) c = parseColore(cs.color);
      if (!c) return;
      if (c[3] <= 0.01) return; // testo trasparente: non e' un problema di contrasto

      const alphaEff = c[3] * opacita;
      const davanti = fondi([c[0], c[1], c[2], alphaEff], fondo);
      let r = rapporto(davanti, fondo);
      let fondoUsato = fondo;
      let nota = null;

      if (probe && probe.fondo) {
        const diverso =
          Math.abs(probe.fondo[0] - fondo[0]) > 2 ||
          Math.abs(probe.fondo[1] - fondo[1]) > 2 ||
          Math.abs(probe.fondo[2] - fondo[2]) > 2;
        if (diverso) {
          const d2 = fondi([c[0], c[1], c[2], alphaEff], probe.fondo);
          const r2 = rapporto(d2, probe.fondo);
          if (r2 < r) {
            r = r2;
            fondoUsato = probe.fondo;
            nota = "fondo trovato per ordine di disegno, non fra gli antenati";
          }
        }
      }
      let marcaPixel = null;
      if ((probe && probe.immagine) || immagine) {
        nota = (nota ? nota + "; " : "") + "sfondo con immagine";
        // Qui il calcolo sugli antenati NON basta: dietro c'e' una foto o una
        // sfumatura, e il colore vero lo sanno solo i pixel. Marco l'elemento
        // perche' la seconda passata lo fotografi senza il suo testo.
        marcaPixel = "c" + (window.__fuelCampioni = (window.__fuelCampioni || 0) + 1);
        el.setAttribute("data-fuel-campione", marcaPixel);
      }

      misure.push({
        sel: percorso(el) + (etichetta === "testo" ? "" : ` ${etichetta}`),
        testo: (campione || testo).replace(/\s+/g, " ").slice(0, 70),
        colore: hex(davanti),
        coloreGrezzo: grezzo,
        fondo: hex(fondoUsato),
        rapporto: Math.round(r * 100) / 100,
        soglia,
        dimensione: Math.round(dimensione * 10) / 10,
        peso,
        nota,
        campione: marcaPixel,
        disabilitato,
        coloreTesto: [c[0], c[1], c[2], alphaEff],
        ok: r >= soglia - 0.005,
      });
    };

    if (testo) valuta(nelSvg ? (cs.fill && cs.fill !== "none" ? cs.fill : cs.color) : cs.color, "testo");
    for (const ps of pseudi) valuta(ps.cs.color, ps.p, ps.testo);
    if (campo) {
      if (campo.value) valuta(cs.color, "valore", campo.value);
      if (campo.placeholder) {
        const pcs = getComputedStyle(el, "::placeholder");
        valuta(pcs.color || cs.color, "::placeholder", campo.placeholder);
      }
    }
  }

  return misure;
}

/* ---------- prova che il controllo sa fallire ---------------------------- */
function iniettaEsca() {
  const d = document.createElement("div");
  d.id = "esca-contrasto";
  d.style.cssText =
    "position:relative;z-index:1;background:#F4F1E8;color:#DFFF3E;font-size:16px;padding:20px;";
  d.textContent = "ESCA: lime su carta, deve risultare 1.00:1";
  document.body.prepend(d);
}

/* =========================================================================
   ORCHESTRAZIONE
   ========================================================================= */

const CSS_STABILE = `
  html { scroll-behavior: auto !important; }
  /* Le animazioni con fill "both" e durata 0 saltano allo stato finale: e'
     esattamente quello che serve per misurare e per fotografare. */
  *, *::before, *::after {
    animation-duration: .001s !important;
    animation-delay: 0s !important;
    transition-duration: .001s !important;
    transition-delay: 0s !important;
  }
`;

/** I reveal partono a opacita' 0: senza questo si misurerebbe una pagina vuota. */
const CSS_REVEAL = `
  .js .reveal { opacity: 1 !important; transform: none !important; }
  .hl-bar { transform: scaleX(1) !important; }
`;

async function apri(browser, url, viewport, { forzaReveal = true } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
  // Senza questo la seconda visita alla stessa rotta torna 304 e il controllo di stato mente.
  await page.setCacheEnabled(false);

  const errori = [];
  const consolle = [];
  const falliti = [];
  page.on("pageerror", (e) => errori.push(String(e.message ?? e)));
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") consolle.push(`[${m.type()}] ${m.text()}`);
  });
  page.on("requestfailed", (r) => {
    const t = r.failure()?.errorText ?? "?";
    if (t === "net::ERR_ABORTED") return; // navigazioni annullate, non guasti
    falliti.push(`${r.url().slice(0, 110)} :: ${t}`);
  });

  const risposta = await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await page.addStyleTag({ content: CSS_STABILE });
  if (forzaReveal) await page.addStyleTag({ content: CSS_REVEAL });
  await new Promise((r) => setTimeout(r, 400));

  return { page, risposta, errori, consolle, falliti };
}

/**
 * Aspetta che la pagina stia FERMA. Misurare mentre un pannello si apre da'
 * numeri che non appartengono a nessuno stato reale: nel selettore di
 * /settimana lo stesso identico nodo usciva due volte, a 1.55:1 su #7c8a7b e a
 * 4.45:1 su #e9e4d6, cioe' il colore vero mescolato col fondo scuro della
 * tendina a meta' strada. Le animazioni infinite (l'anello del timbro, i
 * marquee) non finiscono mai per definizione e vanno escluse, o si aspetta
 * per sempre.
 */
async function attendiCalma(page) {
  try {
    await page.evaluate(async () => {
      const finite = document.getAnimations().filter((a) => {
        try {
          return a.effect?.getComputedTiming().iterations !== Infinity;
        } catch {
          return false;
        }
      });
      await Promise.race([
        Promise.all(finite.map((a) => a.finished.catch(() => {}))),
        new Promise((r) => setTimeout(r, 1200)),
      ]);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
  } catch {
    /* la pagina puo' navigare sotto i piedi: non e' un motivo per fermarsi */
  }
}

/** Scorre davvero la pagina e misura a ogni fermata, cosi' i reveal sono vivi. */
async function passataDiMisura(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 250));

  const misure = [];
  const altezza = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = await page.evaluate(() => window.innerHeight);
  const passo = Math.max(200, Math.floor(vh * 0.8));

  for (let y = 0; y < altezza + vh; y += passo) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await new Promise((r) => setTimeout(r, 200));
    await attendiCalma(page);
    const parte = await page.evaluate(misuraContrastiInPagina, { soloInViewport: true });
    misure.push(...parte);
    if (y > altezza) break;
  }

  // rete di sicurezza: tutto quello che non e' mai passato dal viewport
  // (sticky fuori campo, elementi larghi) viene misurato senza il secondo parere
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 200));
  await attendiCalma(page);
  const resto = await page.evaluate(misuraContrastiInPagina, { soloInViewport: false });
  misure.push(...resto);

  return misure;
}

async function controlliStrutturali(page, viewport) {
  return page.evaluate((vw) => {
    const h1 = document.querySelectorAll("h1").length;
    const de = document.documentElement;
    const scrollOrizz = Math.max(de.scrollWidth, document.body.scrollWidth) - window.innerWidth;
    const sfora = [];
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      if (cs.position === "fixed") continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2) continue;
      if (r.right > window.innerWidth + 1.5 || r.left < -1.5) {
        sfora.push({
          sel: el.tagName.toLowerCase() + "." + (el.getAttribute("class") ?? "").split(/\s+/).slice(0, 2).join("."),
          left: Math.round(r.left),
          right: Math.round(r.right),
        });
      }
      if (sfora.length > 12) break;
    }
    return { h1, scrollOrizz, sfora, vw };
  }, viewport.width);
}

/**
 * Immagini: si controllano SOLO dopo lo scorrimento. Meta' del sito e'
 * loading="lazy": misurate al primo fotogramma risulterebbero tutte rotte, e
 * un controllo che urla sempre e' un controllo che non si guarda piu'.
 */
async function controlloImmagini(page) {
  return page.evaluate(async () => {
    const img = [...document.querySelectorAll("img")];
    await Promise.all(
      img.map((i) =>
        i.complete ? null : new Promise((r) => {
          i.addEventListener("load", r, { once: true });
          i.addEventListener("error", r, { once: true });
          setTimeout(r, 4000);
        }),
      ),
    );
    return img.map((i) => ({
      src: i.currentSrc || i.src,
      w: i.naturalWidth,
      alt: i.getAttribute("alt"),
      completa: i.complete,
      visibile: i.getBoundingClientRect().width > 1 || i.offsetParent !== null,
    }));
  });
}


/* =========================================================================
   SECONDA PASSATA: il fondo che solo i pixel conoscono.

   Quando dietro il testo c'e' una foto o una sfumatura, risalire gli antenati
   da' una risposta sbagliata con l'aria di essere giusta: trova il bianco
   della .core e archivia la pratica a 5.66:1, mentre a video quel testo sta
   sopra una velatura scura e vale 3.2:1. Qui la pagina viene fotografata due
   volte nella stessa area - con il testo nascosto - e il fondo si MISURA.
   ========================================================================= */

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

async function campionaFondiVeri(page, misure) {
  const daFare = misure.filter((m) => m.campione);
  for (const m of daFare) {
    const info = await page.evaluate((id) => {
      const el = document.querySelector(`[data-fuel-campione="${id}"]`);
      if (!el) return null;
      el.scrollIntoView({ block: "center", behavior: "auto" });
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return null;
      return {
        x: Math.max(0, Math.round(r.left + window.scrollX)),
        y: Math.max(0, Math.round(r.top + window.scrollY)),
        width: Math.max(4, Math.round(r.width)),
        height: Math.max(4, Math.round(r.height)),
      };
    }, m.campione);
    if (!info) continue;

    const scatta = async () => {
      try {
        return await page.screenshot({ clip: info, captureBeyondViewport: true, encoding: "base64" });
      } catch {
        return null;
      }
    };

    await attendiCalma(page);
    await pausa(110);
    const prima = await scatta();

    // Si spengono i GLIFI, non l'elemento. Nascondere l'elemento intero
    // portava via anche il suo fondo: un bottone inchiostro diventava
    // "bianco su bianco" e il controllo denunciava un difetto inesistente.
    await page.evaluate((id) => {
      const el = document.querySelector(`[data-fuel-campione="${id}"]`);
      if (!el) return;
      // lo stile inline di React va rimesso com'era: qui dentro ci sono cose
      // come il contorno lime degli ordinali, e cancellarlo falserebbe tutte
      // le misure successive della stessa pagina
      el.dataset.fuelStile = el.getAttribute("style") ?? "";
      for (const [k, v] of [
        ["color", "transparent"],
        ["-webkit-text-fill-color", "transparent"],
        ["fill", "transparent"],
        ["text-shadow", "none"],
        ["-webkit-text-stroke-width", "0"],
      ])
        el.style.setProperty(k, v, "important");
    }, m.campione);
    await pausa(110);
    const dopo = await scatta();
    await page.evaluate((id) => {
      const el = document.querySelector(`[data-fuel-campione="${id}"]`);
      if (!el) return;
      const prec = el.dataset.fuelStile ?? "";
      if (prec) el.setAttribute("style", prec);
      else el.removeAttribute("style");
      delete el.dataset.fuelStile;
    }, m.campione);

    if (!prima || !dopo) continue;
    if (prima === dopo) {
      // I glifi non si sono spenti: qualunque numero uscisse da qui sarebbe il
      // contrasto del testo con SE STESSO. Un campione che non sa dimostrare di
      // aver tolto il testo non ha diritto di bocciare niente.
      m.nota = (m.nota ? m.nota + "; " : "") + "campione a pixel non attendibile (testo non spento)";
      continue;
    }

    const esitoPixel = await page.evaluate(
      async (dati, testo) => {
        const img = new Image();
        img.src = "data:image/png;base64," + dati;
        await img.decode();
        const cv = document.createElement("canvas");
        cv.width = img.width;
        cv.height = img.height;
        const cx = cv.getContext("2d", { willReadFrequently: true });
        cx.drawImage(img, 0, 0);
        const px = cx.getImageData(0, 0, cv.width, cv.height).data;

        const lin = (c) => {
          const v = c / 255;
          return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        const lumDi = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
        const lumTesto = lumDi(testo[0], testo[1], testo[2]);
        const rap = (l) => (Math.max(l, lumTesto) + 0.05) / (Math.min(l, lumTesto) + 0.05);

        const lums = [];
        let sr = 0, sg = 0, sb = 0, n = 0;
        for (let i = 0; i < px.length; i += 4) {
          if (px[i + 3] < 250) continue;
          sr += px[i]; sg += px[i + 1]; sb += px[i + 2]; n++;
          lums.push(lumDi(px[i], px[i + 1], px[i + 2]));
        }
        if (!n) return null;
        lums.sort((a, b) => a - b);
        // Il decimo e il novantesimo percentile invece del minimo assoluto: un
        // pixel isolato e' rumore di antialiasing, una banda del 10% e' un pezzo
        // vero di quello che sta dietro le lettere.
        const p10 = lums[Math.floor(lums.length * 0.1)];
        const p90 = lums[Math.floor(lums.length * 0.9)];
        const medio = lumDi(sr / n, sg / n, sb / n);
        const peggiore = Math.min(rap(p10), rap(p90), rap(medio));
        const hex2 = (v) => Math.round(v).toString(16).padStart(2, "0");
        return {
          peggiore: Math.round(peggiore * 100) / 100,
          medio: Math.round(rap(medio) * 100) / 100,
          fondoMedio: "#" + hex2(sr / n) + hex2(sg / n) + hex2(sb / n),
        };
      },
      dopo,
      m.coloreTesto,
    );
    if (!esitoPixel) continue;
    /* I pixel non sono un secondo parere: sono il rendering. Dove il campione
       riesce (e ha dimostrato di aver spento i glifi) sostituisce la stima del
       DOM in ENTRAMBE le direzioni. Farlo solo al ribasso lasciava in piedi
       assurdita' come la didascalia di /come-funziona data "bianco su bianco"
       - il bianco della .core sotto la foto - con accanto, stampato dal
       controllo stesso, il valore vero misurato a 12.62:1. */
    m.rapportoPixel = esitoPixel.peggiore;
    m.nota =
      (m.nota ? m.nota + "; " : "") +
      `misurato sui pixel: ${esitoPixel.peggiore}:1 (medio ${esitoPixel.medio}:1)`;
    m.rapporto = esitoPixel.peggiore;
    m.fondo = esitoPixel.fondoMedio;
    m.ok = esitoPixel.peggiore >= m.soglia - 0.005;
  }
  return misure;
}

/* =========================================================================
   GLI STATI CHE NON ESISTONO AL PRIMO FOTOGRAMMA.
   Un pannello di errore, una fase successiva di un flusso, un dialogo: sono
   testo che nessuno screenshot iniziale contiene e che nessuna misura statica
   raggiunge. Il rosso di validazione tarato sul buio si nascondeva esattamente
   qui.
   ========================================================================= */

const AZIONI = {
  "/menu": [
    {
      nome: "filtri a vuoto",
      fai: () => {
        // spingo i filtri su una combinazione senza risultati: mi interessa
        // il testo della sezione svuotata, che al primo fotogramma non esiste
        const tag = [...document.querySelectorAll("button")].filter((b) =>
          /senza glutine|piccante|vegetariano|pesce/i.test(b.textContent || ""),
        );
        tag.slice(0, 4).forEach((b) => b.click());
      },
    },
    {
      nome: "piatto nel piano",
      fai: () => {
        const b = [...document.querySelectorAll("button")].find((x) =>
          /aggiungi|metti|scegli/i.test(x.textContent || ""),
        );
        if (b) b.click();
      },
    },
  ],
  "/settimana": [
    {
      nome: "selettore aperto",
      fai: () => {
        const c = document.querySelector("button.cell, .cell");
        if (c) c.click();
      },
    },
  ],
  "/scheda": [
    {
      nome: "valori a mano",
      fai: () => {
        const b = [...document.querySelectorAll("button")].find((x) =>
          /inserisco i valori a mano/i.test(x.textContent || ""),
        );
        if (b) b.click();
      },
    },
    {
      nome: "risultato",
      fai: () => {
        const b = [...document.querySelectorAll("button")].find((x) =>
          /componi|calcola|vedi il piano|genera/i.test(x.textContent || ""),
        );
        if (b) b.click();
      },
    },
  ],
  "/richiesta": [
    {
      nome: "form aperto ed errori di validazione",
      fai: async () => {
        // Il modulo non esiste finche' il servizio scelto pretende una settimana
        // gia' composta: senza questo click si misura una pagina che il visitatore
        // vede solo per meta'. Il terzo servizio (home cooking) non la pretende.
        const radio = document.querySelectorAll('input[name="servizio"]');
        if (radio[2]) radio[2].click();
        await new Promise((r) => setTimeout(r, 500));
        // gli errori compaiono solo sui campi TOCCATI: focus e blur veri su ognuno
        for (const el of document.querySelectorAll("input.field, textarea.field")) {
          el.focus();
          el.blur();
          await new Promise((r) => setTimeout(r, 40));
        }
        await new Promise((r) => setTimeout(r, 300));
      },
    },
  ],
  "/come-funziona": [
    {
      nome: "faq aperte",
      fai: () => {
        for (const d of document.querySelectorAll("details")) d.open = true;
      },
    },
  ],
};

/* ---------- screenshot a scorrimento ------------------------------------- */
async function scatti(page, nome, dir) {
  fs.mkdirSync(dir, { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 300));
  const altezza = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = await page.evaluate(() => window.innerHeight);
  const passo = Math.floor(vh * 0.92);
  const file = [];
  let i = 0;
  for (let y = 0; y < altezza; y += passo, i++) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    // attesa generosa: i reveal legati allo scroll vogliono un fotogramma vero
    await new Promise((r) => setTimeout(r, 420));
    const f = path.join(dir, `${nome}-${String(i).padStart(2, "0")}.png`);
    // Niente clip: la cattura del viewport e' l'unica che non sbaglia sistema
    // di coordinate (in puppeteer clip e' in coordinate di PAGINA, non di
    // viewport: un clip a y:0 rifotografa sempre la testata).
    await page.screenshot({ path: f });
    file.push(f);
    if (i > 24) break;
  }
  return file;
}


/* ------------------------------------------------------------------------ */

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--force-device-scale-factor=1", "--font-render-hinting=none", "--disable-lcd-text"],
  });

  const esito = { violazioni: [], inattivi: [], problemi: [], misurati: 0, pagine: 0, avvisi: [] };

  /* ---- prova che il controllo sa fallire: lime su carta deve fare 1.00 ---- */
  {
    const { page } = await apri(browser, BASE + "/", LARGHEZZE[0]);
    await page.evaluate(iniettaEsca);
    await new Promise((r) => setTimeout(r, 150));
    const m = await page.evaluate(misuraContrastiInPagina, { soloInViewport: false });
    const esca = m.find((x) => x.sel.includes("esca-contrasto"));
    if (!esca) {
      console.log("AUTOTEST: FALLITO — l'esca non e' stata nemmeno vista. Il controllo e' inutile.");
      esito.problemi.push("autotest: esca non rilevata");
    } else {
      const ok = !esca.ok && esca.rapporto <= 1.05;
      console.log(
        `AUTOTEST: ${ok ? "SUPERATO" : "FALLITO"} — esca lime su carta misurata ${esca.rapporto}:1 ` +
          `(soglia ${esca.soglia}, segnalata: ${!esca.ok})`,
      );
      if (!ok) esito.problemi.push(`autotest: esca misurata ${esca.rapporto}:1, attesa 1.00:1 e segnalata`);
    }
    await page.close();
  }

  /* ---- le rotte ---------------------------------------------------------- */
  for (const rotta of ROTTE_SCELTE) {
    for (const vp of LARGHEZZE_SCELTE) {
      const url = BASE + rotta;
      const { page, risposta, errori, consolle, falliti } = await apri(browser, url, vp);
      const tag = `${rotta} @${vp.width}`;
      esito.pagine++;

      if (!risposta || risposta.status() !== 200)
        esito.problemi.push(`${tag}: status ${risposta ? risposta.status() : "nessuna risposta"}`);

      const strut = await controlliStrutturali(page, vp);
      if (strut.h1 !== 1) esito.problemi.push(`${tag}: h1 trovati = ${strut.h1} (atteso 1)`);
      if (strut.scrollOrizz > 1)
        esito.problemi.push(
          `${tag}: scroll orizzontale di ${strut.scrollOrizz}px — sforano: ` +
            strut.sfora.map((s) => `${s.sel}(${s.left}..${s.right})`).join(", "),
        );
      const misure = await passataDiMisura(page);
      await campionaFondiVeri(page, misure);
      const immagini = await controlloImmagini(page);
      for (const im of immagini)
        if (im.completa && im.w === 0)
          esito.problemi.push(`${tag}: immagine non caricata ${String(im.src).slice(0, 90)}`);
        else if (!im.completa)
          esito.problemi.push(`${tag}: immagine mai arrivata ${String(im.src).slice(0, 90)}`);
      for (const im of immagini)
        if (im.alt === null) esito.problemi.push(`${tag}: <img> senza alt ${String(im.src).slice(0, 90)}`);
      esito.misurati += misure.length;
      for (const m of misure)
        if (!m.ok) (m.disabilitato ? esito.inattivi : esito.violazioni).push({ ...m, pagina: tag });
      for (const m of misure)
        if (m.ok && m.nota && m.nota.includes("immagine") && m.rapporto < 7)
          esito.avvisi.push({ ...m, pagina: tag });

      // menu mobile aperto: e' testo che esiste solo dopo un click
      if (vp.width < 1024) {
        const apribile = await page.evaluate(() => {
          const b = document.querySelector('button[aria-controls="menu-mobile"]');
          if (!b) return false;
          b.click();
          return true;
        });
        if (apribile) {
          await new Promise((r) => setTimeout(r, 350));
          const mm = await page.evaluate(misuraContrastiInPagina, { soloInViewport: false });
          esito.misurati += mm.length;
          for (const m of mm)
            if (!m.ok)
              (m.disabilitato ? esito.inattivi : esito.violazioni).push({
                ...m,
                pagina: `${tag} menu aperto`,
              });
        }
      }

      /* stati che al primo fotogramma non esistono */
      for (const az of AZIONI[rotta] ?? []) {
        const fatto = await page
          .evaluate("(" + az.fai.toString() + ")()")
          .then(() => true, (e) => {
            console.log(`  azione "${az.nome}" fallita: ${String(e).slice(0, 120)}`);
            return false;
          });
        if (!fatto) continue;
        await new Promise((r) => setTimeout(r, 700));
        await attendiCalma(page);
        const mm = await passataDiMisura(page);
        await campionaFondiVeri(page, mm);
        esito.misurati += mm.length;
        for (const m of mm)
          if (!m.ok)
            (m.disabilitato ? esito.inattivi : esito.violazioni).push({
              ...m,
              pagina: tag + " [" + az.nome + "]",
            });
        if (mm.length) console.log("                          +" + mm.length + " nodi da \"" + az.nome + "\"");
      }

      if (errori.length) esito.problemi.push(`${tag}: pageerror -> ${errori.join(" | ")}`);
      const gravi = consolle.filter((c) => c.startsWith("[error]"));
      if (gravi.length) esito.problemi.push(`${tag}: console error -> ${gravi.join(" | ")}`);
      const avvisiConsole = consolle.filter((c) => c.startsWith("[warning]"));
      if (avvisiConsole.length) esito.avvisi.push({ pagina: tag, testo: avvisiConsole.join(" | ") });
      if (falliti.length) esito.problemi.push(`${tag}: richieste fallite -> ${falliti.join(" | ")}`);

      console.log(
        `${tag.padEnd(28)} nodi=${String(misure.length).padStart(4)} ` +
          `h1=${strut.h1} scrollX=${strut.scrollOrizz} img=${immagini.length} ` +
          `viol=${misure.filter((m) => !m.ok).length}`,
      );

      await page.close();
    }
  }

  /* ---- screenshot -------------------------------------------------------- */
  if (FA_SCATTI) {
    for (const rotta of ROTTE_SCELTE) {
      const { page } = await apri(browser, BASE + rotta, LARGHEZZE[0], { forzaReveal: false });
      const nome = rotta === "/" ? "home" : rotta.replace(/\//g, "");
      const file = await scatti(page, nome, DIR_SCATTI);
      console.log(`scatti ${rotta}: ${file.length} fotogrammi in ${DIR_SCATTI}`);
      await page.close();
    }
  }

  await browser.close();

  /* ---- referto ----------------------------------------------------------- */
  console.log("\n================ REFERTO ================");
  console.log(`pagine caricate: ${esito.pagine}   nodi di testo misurati: ${esito.misurati}`);

  if (esito.violazioni.length) {
    console.log(`\nVIOLAZIONI DI CONTRASTO: ${esito.violazioni.length}`);
    const visti = new Set();
    for (const v of esito.violazioni.sort((a, b) => a.rapporto - b.rapporto)) {
      const k = `${v.sel}|${v.colore}|${v.fondo}|${v.rapporto}`;
      if (visti.has(k)) continue;
      visti.add(k);
      console.log(
        `  ${String(v.rapporto).padStart(6)}:1 (soglia ${v.soglia})  ${v.colore} su ${v.fondo}  ` +
          `${v.dimensione}px/${v.peso}  [${v.pagina}]\n      ${v.sel}\n      "${v.testo}"` +
          (v.nota ? `\n      nota: ${v.nota}` : ""),
      );
    }
  } else {
    console.log("\nVIOLAZIONI DI CONTRASTO: nessuna");
  }

  if (esito.inattivi.length) {
    console.log(
      `\nSOTTO SOGLIA MA SU CONTROLLI INATTIVI (WCAG 1.4.3 li esenta): ${esito.inattivi.length}`,
    );
    const visti = new Set();
    for (const v of esito.inattivi.sort((a, b) => a.rapporto - b.rapporto)) {
      const k = `${v.sel}|${v.rapporto}`;
      if (visti.has(k)) continue;
      visti.add(k);
      if (visti.size > 10) break;
      console.log(`  ${v.rapporto}:1  ${v.colore} su ${v.fondo}  ${v.sel} "${v.testo}" [${v.pagina}]`);
    }
  }

  if (esito.problemi.length) {
    console.log(`\nALTRI PROBLEMI: ${esito.problemi.length}`);
    for (const p of esito.problemi) console.log("  - " + p);
  } else {
    console.log("\nALTRI PROBLEMI: nessuno");
  }

  if (esito.avvisi.length) {
    console.log(`\nDA GUARDARE A OCCHIO (non bloccanti): ${esito.avvisi.length}`);
    const visti = new Set();
    for (const a of esito.avvisi.slice(0, 40)) {
      const k = a.sel ? `${a.sel}|${a.rapporto}` : a.testo;
      if (visti.has(k)) continue;
      visti.add(k);
      console.log(
        a.sel
          ? `  ${a.rapporto}:1 ${a.colore} su ${a.fondo} — ${a.sel} "${a.testo}" [${a.pagina}] ${a.nota}`
          : `  ${a.pagina}: ${String(a.testo).slice(0, 200)}`,
      );
    }
  }

  const rosso = esito.violazioni.length > 0 || esito.problemi.length > 0;
  console.log(`\nESITO: ${rosso ? "ROSSO" : "VERDE"}`);
  process.exit(rosso ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
