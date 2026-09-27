/**
 * Collaudo del sito completo (pagine statiche + API Pages + D1 locale) in
 * Chrome vero, via puppeteer-core.
 *
 * Prerequisiti:
 *   npm run build
 *   npx wrangler d1 migrations apply fuelchef --local
 *   npx wrangler pages dev out --port 8788
 *
 * Uso:
 *   node scripts/collaudo.mjs                 controlla tutte le rotte pubbliche (sitemap) e private
 *   node scripts/collaudo.mjs --scatti        aggiunge gli screenshot (desktop e telefono)
 *   node scripts/collaudo.mjs --solo=/dashboard,/account
 *
 * Variabili: BASE_URL (default http://localhost:8788), CHROME_PATH,
 * ADMIN_EMAIL / ADMIN_PASSWORD e CLIENTE_EMAIL / CLIENTE_PASSWORD (utenti del
 * database LOCALE), SCATTI_DIR (default .verifica-scatti/collaudo).
 *
 * Per ogni pagina e larghezza controlla: stato HTTP, errori in console e
 * richieste fallite, scorrimento orizzontale, un solo H1, title e description,
 * canonical sulle pagine pubbliche, JSON-LD che si legge.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import puppeteer from "puppeteer-core";

const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = (process.env.BASE_URL ?? "http://localhost:8788").replace(/\/+$/, "");
const ADMIN = { email: process.env.ADMIN_EMAIL ?? "admin@test.local", password: process.env.ADMIN_PASSWORD ?? "PasswordLocale123!" };
const CLIENTE = { email: process.env.CLIENTE_EMAIL ?? "cliente@test.local", password: process.env.CLIENTE_PASSWORD ?? "PasswordLocale123!" };
const DIR = process.env.SCATTI_DIR ?? path.join(process.cwd(), ".verifica-scatti", "collaudo");

const argv = process.argv.slice(2);
const SCATTI = argv.includes("--scatti");
const SOLO = (argv.find((a) => a.startsWith("--solo=")) ?? "").slice(7).split(",").filter(Boolean);

const LARGHEZZE = [
  { nome: "desktop", width: 1440, height: 900, isMobile: false },
  { nome: "telefono", width: 390, height: 844, isMobile: true },
];

const PRIVATE_ADMIN = ["/dashboard", "/dashboard/ordini", "/dashboard/produzione", "/dashboard/clienti", "/dashboard/messaggi", "/dashboard/statistiche", "/dashboard/impostazioni"];
const PRIVATE_CLIENTE = ["/account"];
const PUBBLICHE_EXTRA = ["/accedi", "/reimposta-password", "/pagina-che-non-esiste"];

/* Rumore noto che non dipende dal sito. */
const IGNORA = [/googletagmanager/, /favicon/, /Download the React DevTools/];

async function rotteDallaSitemap() {
  const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace(/\/$/, "") || "/");
}

async function accedi(page, utente) {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  const esito = await page.evaluate(async ({ email, password }) => {
    const r = await fetch("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "same-origin",
    });
    return { status: r.status, body: await r.text() };
  }, utente);
  if (esito.status !== 200) throw new Error(`Accesso di ${utente.email} fallito: ${esito.status} ${esito.body.slice(0, 200)}`);
}

async function controlla(page, rotta, larghezza, { pubblica }) {
  const problemi = [];
  const errori = [];
  const suConsole = (m) => {
    if (rotta === "/pagina-che-non-esiste" && /404/.test(m.text())) return;
    if (m.type() === "error" && !IGNORA.some((r) => r.test(m.text()))) errori.push(`console: ${m.text().slice(0, 240)}`);
  };
  const suErrore = (e) => errori.push(`pageerror: ${String(e).slice(0, 240)}`);
  const suFallita = (r) => {
    const u = r.url();
    // I prefetch di Next interrotti al cambio pagina non sono errori.
    if (r.failure()?.errorText === "net::ERR_ABORTED") return;
    if (!IGNORA.some((x) => x.test(u))) errori.push(`richiesta fallita: ${u} (${r.failure()?.errorText})`);
  };
  const suRisposta = (r) => {
    const u = r.url();
    if (u.startsWith(BASE) && r.status() >= 400 && !u.endsWith(rotta) && !IGNORA.some((x) => x.test(u))) errori.push(`HTTP ${r.status()} su ${u.slice(BASE.length)}`);
  };
  page.on("console", suConsole);
  page.on("pageerror", suErrore);
  page.on("requestfailed", suFallita);
  page.on("response", suRisposta);

  const risposta = await page.goto(`${BASE}${rotta}`, { waitUntil: "networkidle0", timeout: 45000 });
  await new Promise((r) => setTimeout(r, 600));
  const stato = risposta?.status() ?? 0;
  const attesa = rotta === "/pagina-che-non-esiste" ? 404 : 200;
  if (stato !== attesa) problemi.push(`stato ${stato} invece di ${attesa}`);

  const info = await page.evaluate(() => {
    const meta = (sel) => document.querySelector(sel)?.getAttribute("content") ?? document.querySelector(sel)?.getAttribute("href") ?? null;
    const jsonld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
      try { const d = JSON.parse(s.textContent ?? ""); return Array.isArray(d) ? d.map((x) => x["@type"]).join("+") : d["@type"] ?? (d["@graph"] ? "graph" : "?"); } catch { return "ROTTO"; }
    });
    const larghi = [...document.querySelectorAll("body *")].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.right > document.documentElement.clientWidth + 1 && getComputedStyle(el).position !== "fixed";
    }).slice(0, 3).map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 2).join(".")}`);
    return {
      titolo: document.title,
      descrizione: meta('meta[name="description"]'),
      canonical: meta('link[rel="canonical"]'),
      robots: meta('meta[name="robots"]'),
      h1: document.querySelectorAll("h1").length,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      larghi,
      jsonld,
    };
  });

  if (info.overflow > 1) problemi.push(`scorre in orizzontale di ${info.overflow}px (${info.larghi.join(", ")})`);
  if (info.h1 !== 1) problemi.push(`${info.h1} H1`);
  if (!info.titolo) problemi.push("title vuoto");
  if (pubblica && attesa === 200) {
    if (!info.descrizione) problemi.push("description mancante");
    else if (info.descrizione.length > 170) problemi.push(`description lunga (${info.descrizione.length})`);
    if (!info.canonical) problemi.push("canonical mancante");
    if (info.titolo.length > 70) problemi.push(`title lungo (${info.titolo.length}): ${info.titolo}`);
  }
  if (info.jsonld.includes("ROTTO")) problemi.push("JSON-LD non valido");

  if (SCATTI) {
    // Scorre fino in fondo: le sezioni con .reveal compaiono solo quando entrano nello schermo.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += Math.round(window.innerHeight * 0.7)) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo({ top: 0, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 300));
    });
    fs.mkdirSync(DIR, { recursive: true });
    const nome = `${(rotta === "/" ? "home" : rotta.slice(1).replace(/[/?=&]/g, "_"))}-${larghezza.nome}.png`;
    await page.screenshot({ path: path.join(DIR, nome), fullPage: true });
  }

  page.off("console", suConsole);
  page.off("pageerror", suErrore);
  page.off("requestfailed", suFallita);
  page.off("response", suRisposta);
  return { rotta, larghezza: larghezza.nome, stato, info, problemi: [...problemi, ...errori] };
}

async function giro(browser, rotte, larghezza, { utente, pubblica }) {
  const contesto = await browser.createBrowserContext();
  const page = await contesto.newPage();
  await page.setViewport({ width: larghezza.width, height: larghezza.height, isMobile: larghezza.isMobile, hasTouch: larghezza.isMobile });
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("fuellab.analytics-consent.v1", "denied"); } catch { /* ignora */ }
  });
  if (utente) await accedi(page, utente);
  const esiti = [];
  for (const rotta of rotte) {
    try {
      esiti.push(await controlla(page, rotta, larghezza, { pubblica }));
    } catch (e) {
      esiti.push({ rotta, larghezza: larghezza.nome, stato: 0, info: null, problemi: [`eccezione: ${e.message}`] });
    }
  }
  await contesto.close();
  return esiti;
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
try {
  const pubbliche = [...new Set([...(await rotteDallaSitemap()), ...PUBBLICHE_EXTRA])];
  const filtra = (xs) => (SOLO.length ? xs.filter((r) => SOLO.includes(r)) : xs);
  const esiti = [];
  for (const larghezza of LARGHEZZE) {
    esiti.push(...await giro(browser, filtra(pubbliche), larghezza, { pubblica: true }));
    esiti.push(...await giro(browser, filtra(PRIVATE_CLIENTE), larghezza, { utente: CLIENTE, pubblica: false }));
    esiti.push(...await giro(browser, filtra(PRIVATE_ADMIN), larghezza, { utente: ADMIN, pubblica: false }));
  }
  let rossi = 0;
  for (const e of esiti) {
    const ok = e.problemi.length === 0;
    if (!ok) rossi++;
    console.log(`${ok ? "OK  " : "KO  "} ${e.larghezza.padEnd(8)} ${e.rotta}${ok ? "" : `\n       - ${e.problemi.join("\n       - ")}`}`);
  }
  console.log(`\n${esiti.length} controlli, ${rossi} con problemi.${SCATTI ? ` Screenshot in ${DIR}` : ""}`);
  process.exitCode = rossi ? 1 : 0;
} finally {
  await browser.close();
}
