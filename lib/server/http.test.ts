import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../../functions/_lib/auth";
import { bodyJson, conCorpoLimitato, json, leggiCorpo, MAX_CORPO_API, sameOrigin } from "../../functions/_lib/http";
import { accodaEmail, inviaEmail, RIPROVA, type Email } from "../../functions/_lib/mail";
import { onRequest } from "../../functions/api/_middleware";

const post = (corpo: BodyInit | null, headers: Record<string, string> = {}) =>
  new Request("https://fuelchef.it/api/x", { method: "POST", body: corpo, headers });

/** Un corpo che arriva a pezzi e senza Content-Length, come un invio "chunked". */
const aPezzi = (pezzi: string[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      for (const pezzo of pezzi) controller.enqueue(new TextEncoder().encode(pezzo));
      controller.close();
    },
  });

describe("lettura del corpo", () => {
  it("rifiuta un corpo dichiarato piu' grande del tetto senza leggerlo", async () => {
    expect(await leggiCorpo(post("x".repeat(50), { "Content-Length": "5000" }), 100)).toBeNull();
    expect(await leggiCorpo(post("x".repeat(50)), 100)).toHaveLength(50);
  });

  it("il tetto vale anche quando il Content-Length manca", async () => {
    const enorme = new Request("https://fuelchef.it/api/x", { method: "POST", body: aPezzi(["x".repeat(60), "y".repeat(60)]), duplex: "half" } as RequestInit);
    expect(await leggiCorpo(enorme, 100)).toBeNull();
    const nelTetto = new Request("https://fuelchef.it/api/x", { method: "POST", body: aPezzi(["x".repeat(40), "y".repeat(40)]), duplex: "half" } as RequestInit);
    expect(await leggiCorpo(nelTetto, 100)).toHaveLength(80);
  });

  it("bodyJson vuole un oggetto JSON: array, testo, null e JSON rotto sono tutti 'dati non validi'", async () => {
    expect(await bodyJson(post(JSON.stringify({ a: 1 })))).toEqual({ a: 1 });
    for (const cattivo of ["[1,2]", '"ciao"', "null", "5", "{rotto", ""]) expect(await bodyJson(post(cattivo)), cattivo).toBeNull();
    expect(await bodyJson(new Request("https://fuelchef.it/api/x", { method: "POST" }))).toBeNull();
    expect(await bodyJson(post(JSON.stringify({ a: "x".repeat(200) })), 100)).toBeNull();
  });

  it("conCorpoLimitato passa la richiesta a chi se la legge da solo, o dice che e' troppo grande", async () => {
    const piccola = await conCorpoLimitato(post(JSON.stringify({ email: "a@b.it" })), 1000);
    expect(piccola).not.toBeNull();
    expect(piccola!.method).toBe("POST");
    expect(await piccola!.json()).toEqual({ email: "a@b.it" });
    expect(await conCorpoLimitato(post("x".repeat(2000)), 1000)).toBeNull();
    const get = new Request("https://fuelchef.it/api/auth/get-session");
    expect(await conCorpoLimitato(get, 10)).toBe(get);
  });

  it("sameOrigin vuole l'Origin del sito, non uno qualunque ne' nessuno", () => {
    expect(sameOrigin(post("{}", { Origin: "https://fuelchef.it" }))).toBe(true);
    expect(sameOrigin(post("{}", { Origin: "https://evil.example" }))).toBe(false);
    expect(sameOrigin(post("{}", { Origin: "null" }))).toBe(false);
    expect(sameOrigin(post("{}"))).toBe(false);
  });
});

describe("rete di sicurezza delle API", () => {
  const passa = (risposta: Response, richiesta = post("{}")) =>
    onRequest({ request: richiesta, next: async () => risposta });

  it("un percorso o un metodo che non esistono rispondono in JSON italiano, non con la pagina 404 del sito", async () => {
    const html = await passa(new Response("<!DOCTYPE html><html>404</html>", { status: 404, headers: { "Content-Type": "text/html" } }));
    expect(html.status).toBe(404);
    expect(html.headers.get("Content-Type")).toContain("application/json");
    expect(await html.json()).toEqual({ error: "Non trovato." });
    const vuota = await passa(new Response(null, { status: 405 }));
    expect(vuota.status).toBe(405);
    expect(await vuota.json()).toEqual({ error: "Operazione non consentita." });
  });

  it("un 404 in JSON di una Function resta com'e'", async () => {
    const risposta = await passa(json({ error: "Richiesta non trovata" }, 404));
    expect(risposta.status).toBe(404);
    expect(await risposta.json()).toEqual({ error: "Richiesta non trovata" });
  });

  it("ogni risposta e' noindex, nosniff e senza cache, tranne quelle che scelgono da sole", async () => {
    const normale = await passa(Response.json({ ok: true }));
    expect(normale.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(normale.headers.get("X-Robots-Tag")).toBe("noindex");
    expect(normale.headers.get("Cache-Control")).toBe("no-store");
    const pubblica = await passa(json({ settings: {} }, 200, "public, max-age=60"));
    expect(pubblica.headers.get("Cache-Control")).toBe("public, max-age=60");
    // un redirect (accesso con Google) e i suoi cookie passano intatti
    const redirect = new Response(null, { status: 302, headers: { Location: "/account" } });
    redirect.headers.append("Set-Cookie", "a=1; Path=/; HttpOnly");
    redirect.headers.append("Set-Cookie", "b=2; Path=/; HttpOnly");
    const passato = await passa(redirect);
    expect(passato.status).toBe(302);
    expect(passato.headers.get("Location")).toBe("/account");
    expect(passato.headers.getSetCookie()).toEqual(["a=1; Path=/; HttpOnly", "b=2; Path=/; HttpOnly"]);
  });

  it("un corpo dichiarato troppo grande e' un 413 senza arrivare alla Function", async () => {
    const prossimo = vi.fn(async () => Response.json({ ok: true }));
    const risposta = await onRequest({ request: post("{}", { "Content-Length": String(MAX_CORPO_API + 1) }), next: prossimo });
    expect(risposta.status).toBe(413);
    expect(await risposta.json()).toEqual({ error: "La richiesta è troppo grande." });
    expect(prossimo).not.toHaveBeenCalled();
    // un GET non ha corpo da controllare
    const get = new Request("https://fuelchef.it/api/me", { headers: { "Content-Length": String(MAX_CORPO_API + 1) } });
    expect((await onRequest({ request: get, next: prossimo })).status).toBe(200);
  });

  it("un errore inatteso diventa un 500 in JSON, senza stack ne' SQL", async () => {
    const errore = vi.spyOn(console, "error").mockImplementation(() => {});
    const risposta = await onRequest({ request: post("{}"), next: async () => { throw new Error("D1_ERROR: no such table: orders at line 1"); } });
    expect(risposta.status).toBe(500);
    const testo = await risposta.text();
    expect(JSON.parse(testo)).toEqual({ error: "Servizio non disponibile. Riprova tra poco." });
    expect(testo).not.toMatch(/D1|table|line/);
    expect(risposta.headers.get("X-Robots-Tag")).toBe("noindex");
    errore.mockRestore();
  });
});

describe("invio delle email", () => {
  const pausaOriginale = RIPROVA.pausaMs;
  // Niente attesa vera fra un tentativo e l'altro: i test restano veloci.
  beforeEach(() => { RIPROVA.pausaMs = 0; });
  afterEach(() => {
    RIPROVA.pausaMs = pausaOriginale;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const email: Email = { to: ["matteo@example.com"], subject: "Prova", text: "ciao", html: "<p>ciao</p>" };
  const env = (chiave?: string) => ({ RESEND_API_KEY: chiave }) as unknown as Env;

  it("senza RESEND_API_KEY l'email e' saltata e non si chiama nessun servizio", async () => {
    const fetchFinto = vi.fn();
    vi.stubGlobal("fetch", fetchFinto);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await inviaEmail(env(), email)).toBe(false);
    const esiti: string[] = [];
    await accodaEmail({ env: env() }, email, async (esito) => { esiti.push(esito); });
    expect(esiti).toEqual(["saltata"]);
    expect(fetchFinto).not.toHaveBeenCalled();
  });

  it("scrive a Resend con il mittente di FUEL LAB, il Reply-To e un tempo massimo di attesa", async () => {
    const fetchFinto = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchFinto);
    expect(await inviaEmail(env("chiave"), { ...email, replyTo: "cliente@example.com" })).toBe(true);
    const [url, init] = fetchFinto.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(JSON.parse(String(init.body))).toMatchObject({ from: "FUEL LAB <accesso@fuelchef.it>", to: ["matteo@example.com"], subject: "Prova", reply_to: "cliente@example.com" });
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer chiave");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("quando Resend rifiuta, l'errore nei log dice il perche' (ma non porta mai la chiave)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response('{"message":"The fuelchef.it domain is not verified"}', { status: 403 })));
    await expect(inviaEmail(env("chiave-segreta"), email)).rejects.toThrow(/EMAIL_SEND_FAILED_403: .*not verified/);
    await expect(inviaEmail(env("chiave-segreta"), email)).rejects.not.toThrow(/chiave-segreta/);
  });

  it("una notifica che non parte (Resend rifiuta, rete caduta, tempo scaduto) non fa fallire la richiesta e lascia scritto l'esito", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    for (const guasto of [
      async () => new Response("no", { status: 422 }),
      async () => { throw new TypeError("fetch failed"); },
      async () => { throw new DOMException("timeout", "TimeoutError"); },
    ]) {
      vi.stubGlobal("fetch", vi.fn(guasto));
      const esiti: string[] = [];
      await expect(accodaEmail({ env: env("chiave") }, email, async (esito) => { esiti.push(esito); })).resolves.toBeUndefined();
      expect(esiti).toEqual(["fallita"]);
    }
    // anche se a fallire e' la registrazione dell'esito
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    await expect(accodaEmail({ env: env("chiave") }, email, async () => { throw new Error("D1 giu"); })).resolves.toBeUndefined();
  });

  it("un guasto passeggero di Resend (rete, tempo scaduto, 429, 5xx) si riprova una volta, con la stessa chiave contro i doppioni", async () => {
    for (const guasto of [
      () => { throw new TypeError("fetch failed"); },
      () => { throw new DOMException("timeout", "TimeoutError"); },
      () => new Response("{}", { status: 503 }),
      () => new Response("{}", { status: 429 }),
    ]) {
      const fetchFinto = vi.fn()
        .mockImplementationOnce(async () => guasto())
        .mockImplementationOnce(async () => new Response("{}", { status: 200 }));
      vi.stubGlobal("fetch", fetchFinto);
      expect(await inviaEmail(env("chiave"), email)).toBe(true);
      expect(fetchFinto).toHaveBeenCalledTimes(2);
      const chiavi = fetchFinto.mock.calls.map(([, init]) => (init as RequestInit).headers as Record<string, string>).map((h) => h["Idempotency-Key"]);
      expect(chiavi[0]).toMatch(/^[0-9a-f-]{36}$/);
      expect(chiavi[1]).toBe(chiavi[0]);
    }
    // Due guasti di fila: si arrende (una sola ripresa) e l'errore e' l'ultimo.
    const sempre = vi.fn(async () => new Response("giu", { status: 502 }));
    vi.stubGlobal("fetch", sempre);
    await expect(inviaEmail(env("chiave"), email)).rejects.toThrow(/EMAIL_SEND_FAILED_502/);
    expect(sempre).toHaveBeenCalledTimes(2);
  });

  it("un rifiuto vero di Resend (dominio non verificato, destinatario non valido) non si riprova", async () => {
    const rifiuta = vi.fn(async () => new Response('{"message":"invalid"}', { status: 422 }));
    vi.stubGlobal("fetch", rifiuta);
    await expect(inviaEmail(env("chiave"), email)).rejects.toThrow(/EMAIL_SEND_FAILED_422/);
    expect(rifiuta).toHaveBeenCalledTimes(1);
  });

  it("con waitUntil la notifica non si aspetta e la richiesta risponde subito", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    const attese: Promise<unknown>[] = [];
    await accodaEmail({ env: env("chiave"), waitUntil: (p) => void attese.push(p) }, email);
    expect(attese).toHaveLength(1);
    await attese[0];
  });
});
