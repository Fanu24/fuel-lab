import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { creaD1Prova } from "./d1-prova";
import { accodaPush, type MessaggioPush } from "../../functions/_lib/push";
import { onRequestDelete, onRequestGet, onRequestPost } from "../../functions/api/admin/push";
import { onRequestPost as ordiniPost } from "../../functions/api/orders";
import { b64urlDaBytes } from "./webpush";

const sessione = vi.hoisted(() => ({ utente: { id: "matteo", role: "admin" } as Record<string, unknown> }));

vi.mock("../../functions/_lib/auth", () => ({
  currentUser: async () => sessione.utente,
  soloAdmin: (utente: { role?: unknown } | null) => (utente?.role === "admin" ? null : Response.json({ error: "Riservato a Matteo" }, { status: 403 })),
}));

type Bench = ReturnType<typeof creaD1Prova>;
let bench: Bench;
let vapid: { VAPID_PUBLIC_KEY: string; VAPID_PRIVATE_KEY: string; VAPID_SUBJECT: string };
/** Una chiave pubblica P-256 vera (65 byte, 87 caratteri in base64url): il browser che si iscrive. */
let p256dh: string;
let fetchFinto: ReturnType<typeof vi.fn>;

const ORIGINE = "https://fuelchef.it";
const MESSAGGIO: MessaggioPush = { title: "Nuovo ordine dal sito", body: "Francesca Rossi", url: "/admin?vista=nuovi" };
const ENDPOINT_A = "https://fcm.googleapis.com/fcm/send/aaaaaaaaaa";
const ENDPOINT_B = "https://web.push.apple.com/bbbbbbbbbb";

/** Chiave pubblica e privata VAPID in base64url, nella forma di scripts/genera-vapid.mjs. */
async function generaVapid() {
  const coppia = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const pubblica = new Uint8Array(await crypto.subtle.exportKey("raw", coppia.publicKey));
  const jwk = await crypto.subtle.exportKey("jwk", coppia.privateKey);
  if (!jwk.d) throw new Error("Chiave privata senza d");
  return { VAPID_PUBLIC_KEY: b64urlDaBytes(pubblica), VAPID_PRIVATE_KEY: jwk.d, VAPID_SUBJECT: "mailto:info@fuelchef.it" };
}

beforeAll(async () => {
  vapid = await generaVapid();
  const browser = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  p256dh = b64urlDaBytes(new Uint8Array(await crypto.subtle.exportKey("raw", browser.publicKey)));
});

beforeEach(() => {
  bench = creaD1Prova();
  sessione.utente = { id: "matteo", role: "admin" };
  fetchFinto = vi.fn(async () => new Response(null, { status: 201 }));
  vi.stubGlobal("fetch", fetchFinto);
});

afterEach(() => {
  bench.chiudi();
  vi.unstubAllGlobals();
});

const conVapid = () => ({ ...bench.env, ...vapid });
const senzaVapid = () => ({ ...bench.env });

function iscrivi(endpoint: string) {
  bench.sqlite
    .prepare("INSERT INTO push_iscrizioni (endpoint,p256dh,auth) VALUES (?,?,?)")
    .run(endpoint, p256dh, "C".repeat(22));
}

const righeIscrizioni = () => (bench.sqlite.prepare("SELECT endpoint FROM push_iscrizioni ORDER BY endpoint").all() as { endpoint: string }[]).map((r) => r.endpoint);

function richiesta(metodo: string, corpo?: unknown, conOrigine = true): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (conOrigine) headers.Origin = ORIGINE;
  return new Request(`${ORIGINE}/api/admin/push`, { method: metodo, headers, body: corpo === undefined ? undefined : JSON.stringify(corpo) });
}

const iscrizioneDi = (endpoint: string) => ({ endpoint, keys: { p256dh, auth: "C".repeat(22) } });

describe("accodaPush", () => {
  it("senza variabili VAPID non chiama fetch", async () => {
    iscrivi(ENDPOINT_A);
    await accodaPush({ env: senzaVapid() }, MESSAGGIO);
    expect(fetchFinto).not.toHaveBeenCalled();
  });

  it("con un fetch che lancia non rifiuta", async () => {
    iscrivi(ENDPOINT_A);
    fetchFinto.mockRejectedValueOnce(new Error("rete caduta"));
    await expect(accodaPush({ env: conVapid() }, MESSAGGIO)).resolves.toBeUndefined();
    expect(righeIscrizioni()).toEqual([ENDPOINT_A]);
  });

  it("una risposta 410 cancella l'iscrizione e una 201 la tiene", async () => {
    iscrivi(ENDPOINT_A);
    iscrivi(ENDPOINT_B);
    fetchFinto.mockImplementation(async (richiestaInviata: Request) =>
      new Response(null, { status: richiestaInviata.url === ENDPOINT_A ? 410 : 201 }));
    await accodaPush({ env: conVapid() }, MESSAGGIO);
    expect(fetchFinto).toHaveBeenCalledTimes(2);
    expect(righeIscrizioni()).toEqual([ENDPOINT_B]);
  });
});

describe("POST, GET e DELETE /api/admin/push", () => {
  it("POST salva l'iscrizione e un secondo POST uguale non duplica", async () => {
    const env = conVapid();
    expect((await onRequestPost({ env: env, request: richiesta("POST", iscrizioneDi(ENDPOINT_A)), params: {} })).status).toBe(200);
    expect((await onRequestPost({ env: env, request: richiesta("POST", iscrizioneDi(ENDPOINT_A)), params: {} })).status).toBe(200);
    expect(righeIscrizioni()).toEqual([ENDPOINT_A]);
  });

  it("POST rifiuta un endpoint non https e chiavi di lunghezza sbagliata", async () => {
    const env = conVapid();
    const http = { endpoint: "http://esempio.it/push/abc", keys: { p256dh: "B".repeat(88), auth: "C".repeat(22) } };
    const corta = { endpoint: ENDPOINT_A, keys: { p256dh: "B".repeat(10), auth: "C".repeat(22) } };
    expect((await onRequestPost({ env: env, request: richiesta("POST", http), params: {} })).status).toBe(400);
    expect((await onRequestPost({ env: env, request: richiesta("POST", corta), params: {} })).status).toBe(400);
    expect(righeIscrizioni()).toEqual([]);
  });

  it("un cliente non puo' iscriversi né leggere la chiave", async () => {
    sessione.utente = { id: "cliente1", role: "customer" };
    const env = conVapid();
    expect((await onRequestPost({ env: env, request: richiesta("POST", iscrizioneDi(ENDPOINT_A)), params: {} })).status).toBe(403);
    expect((await onRequestGet({ env: env, request: richiesta("GET"), params: {} })).status).toBe(403);
    expect(righeIscrizioni()).toEqual([]);
  });

  it("GET restituisce la chiave pubblica, o null se non c'e'", async () => {
    const con = await onRequestGet({ env: conVapid(), request: richiesta("GET"), params: {} });
    expect(await con.json()).toEqual({ publicKey: vapid.VAPID_PUBLIC_KEY });
    const senza = await onRequestGet({ env: senzaVapid(), request: richiesta("GET"), params: {} });
    expect(await senza.json()).toEqual({ publicKey: null });
  });

  it("DELETE toglie l'iscrizione indicata", async () => {
    iscrivi(ENDPOINT_A);
    iscrivi(ENDPOINT_B);
    const risposta = await onRequestDelete({ env: conVapid(), request: richiesta("DELETE", { endpoint: ENDPOINT_A }), params: {} });
    expect(await risposta.json()).toEqual({ ok: true });
    expect(righeIscrizioni()).toEqual([ENDPOINT_B]);
  });
});

describe("POST /api/orders con la notifica push", () => {
  it("creando un ordine dal sito parte una chiamata push", async () => {
    sessione.utente = { id: "cliente1", name: "Cliente Uno", email: "cliente1@test.local", role: "customer" };
    iscrivi(ENDPOINT_A);
    const risposta = await ordiniPost({
      env: conVapid(),
      request: new Request(`${ORIGINE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: ORIGINE },
        body: JSON.stringify({ service: "home-cooking", fulfillment: "pickup", name: "Francesca Rossi", phone: "3331234567", comune: "Pescara", address: "", notes: "", plan: {}, training: {}, items: [] }),
      }),
      params: {},
    });
    expect(risposta.status).toBe(201);
    expect(fetchFinto).toHaveBeenCalledTimes(1);
    expect((fetchFinto.mock.calls[0][0] as Request).url).toBe(ENDPOINT_A);
  });
});
