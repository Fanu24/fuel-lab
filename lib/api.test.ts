import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, ATTESA_LUNGA_MS, ATTESA_MASSIMA_MS, MESSAGGIO_RETE_LENTA } from "./api";

/** Un fetch che non risponde mai, ma si ferma se qualcuno annulla il signal (come il vero). */
function fetchBloccato() {
  return vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((_ok, no) => {
    if (init?.signal?.aborted) return no(init.signal.reason);
    init?.signal?.addEventListener("abort", () => no(init.signal?.reason ?? new DOMException("Aborted", "AbortError")), { once: true });
  }));
}

describe("api: tempo massimo e tipi di errore", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("una rete che non risponde finisce in ApiError status 0 con il messaggio italiano della connessione lenta", async () => {
    vi.stubGlobal("fetch", fetchBloccato());
    const richiesta = api.me().catch((e) => e);
    await vi.advanceTimersByTimeAsync(ATTESA_MASSIMA_MS);
    const errore = await richiesta;
    expect(errore).toBeInstanceOf(ApiError);
    expect(errore.status).toBe(0);
    expect(errore.scaduto).toBe(true);
    expect(errore.message).toBe(MESSAGGIO_RETE_LENTA);
    expect(MESSAGGIO_RETE_LENTA).toBe("La connessione è lenta o assente. Riprova.");
  });

  it("prima del tempo massimo non scade; la risposta che arriva in tempo si legge", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ providers: 1 }), { status: 200 })));
    const risposta = await api.providers();
    expect(risposta).toEqual({ providers: 1 });
    // Il timer e' stato tolto: niente annullamenti tardivi su una richiesta finita.
    expect(vi.getTimerCount()).toBe(0);
  });

  it("l'esportazione dei dati aspetta di piu' delle altre chiamate", async () => {
    vi.stubGlobal("fetch", fetchBloccato());
    const richiesta = api.esportaDati().catch((e) => e);
    await vi.advanceTimersByTimeAsync(ATTESA_MASSIMA_MS + 1000);
    let finita = false;
    void richiesta.then(() => { finita = true; });
    await vi.advanceTimersByTimeAsync(0);
    expect(finita).toBe(false);
    await vi.advanceTimersByTimeAsync(ATTESA_LUNGA_MS - ATTESA_MASSIMA_MS);
    expect((await richiesta).scaduto).toBe(true);
  });

  it("il tempo copre anche il corpo che arriva a meta': non diventa una risposta vuota", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      const corpo = new ReadableStream({
        start(controllo) {
          init?.signal?.addEventListener("abort", () => controllo.error(new DOMException("Aborted", "AbortError")), { once: true });
        },
      });
      return new Response(corpo, { status: 200 });
    }));
    const richiesta = api.piano().catch((e) => e);
    await vi.advanceTimersByTimeAsync(ATTESA_MASSIMA_MS);
    const errore = await richiesta;
    expect(errore).toBeInstanceOf(ApiError);
    expect(errore.status).toBe(0);
    expect(errore.scaduto).toBe(true);
  });

  it("senza rete il messaggio resta quello di prima e non e' una scadenza", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    const errore = await api.me().catch((e) => e);
    expect(errore).toBeInstanceOf(ApiError);
    expect(errore.status).toBe(0);
    expect(errore.scaduto).toBe(false);
    expect(errore.message).toBe("Connessione assente. Controlla la rete e riprova.");
  });

  it("l'errore del server resta com'era: stato e messaggio in italiano", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "Richiesta non trovata" }), { status: 404 })));
    const errore = await api.ordine("x").catch((e) => e);
    expect(errore).toBeInstanceOf(ApiError);
    expect(errore.status).toBe(404);
    expect(errore.message).toBe("Richiesta non trovata");
    expect(errore.scaduto).toBe(false);
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>Bad gateway</html>", { status: 502 })));
    const proxy = await api.me().catch((e) => e);
    expect(proxy.status).toBe(502);
    expect(proxy.message).toBe("Servizio non disponibile. Riprova tra poco.");
  });

  it("un annullamento volontario non e' un errore di rete: il signal di chi chiama passa com'e'", async () => {
    // chiama non e' esportata: la si raggiunge da una funzione che accetta le opzioni di fetch.
    const fetchFinto = fetchBloccato();
    vi.stubGlobal("fetch", fetchFinto);
    const volontario = new AbortController();
    const richiesta = api.impostazioni(true, volontario.signal).catch((e) => e);
    volontario.abort();
    const errore = await richiesta;
    expect(errore).not.toBeInstanceOf(ApiError);
    expect((errore as DOMException).name).toBe("AbortError");
    // E il timer e' stato tolto.
    expect(vi.getTimerCount()).toBe(0);
    // Un signal gia' annullato prima della chiamata non parte nemmeno in rete.
    const gia = new AbortController();
    gia.abort();
    const subito = await api.impostazioni(false, gia.signal).catch((e) => e);
    expect((subito as DOMException).name).toBe("AbortError");
  });
});
