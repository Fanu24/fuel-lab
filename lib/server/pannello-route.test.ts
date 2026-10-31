import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { creaD1Prova } from "./d1-prova";
import { oggiRoma, spostaGiorno } from "./date";
import { lunediDi } from "../pannello";
import { onRequestGet } from "../../functions/api/admin/pannello";
import { onRequestPost as rubricaPost, onRequestPatch as rubricaPatch } from "../../functions/api/admin/rubrica";
import { onRequestPut as pastiPut, onRequestDelete as pastiDelete } from "../../functions/api/admin/pasti";
import { onRequestPost as copiaPost } from "../../functions/api/admin/pasti/copia";
import { onRequestPost as accettaPost } from "../../functions/api/admin/in-settimana/[id]";
import { onRequestGet as onRequestGuadagniGet } from "../../functions/api/admin/guadagni";

vi.mock("../../functions/_lib/auth", () => ({
  currentUser: async () => ({ id: "matteo", role: "admin" }),
  soloAdmin: () => null,
}));

type Bench = ReturnType<typeof creaD1Prova>;
let bench: Bench;

beforeEach(() => {
  bench = creaD1Prova();
});
afterEach(() => {
  bench.chiudi();
});

const oggi = oggiRoma();
const lunedi = lunediDi(spostaGiorno(oggi, 7));
const domenica = spostaGiorno(lunedi, 6);

const ORIGINE = "https://fuelchef.it";

function richiesta(metodo: string, percorso: string, corpo?: unknown, conOrigine = true): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (conOrigine) headers.Origin = ORIGINE;
  return new Request(`${ORIGINE}${percorso}`, {
    method: metodo,
    headers,
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
}

const env = () => bench.env;

function inserisciOrdine(o: { id: string; utente?: string; stato?: string; uscita?: string | null; voci?: unknown[]; porzioni?: number; creato?: string; origine?: string }) {
  bench.sqlite
    .prepare(`INSERT INTO orders (id,user_id,status,service,fulfillment,requested_date,production_date,fulfillment_date,
        customer_name,phone,comune,address,notes,plan_json,training_json,items_json,meals,price_cents,paid,source,in_settimana,created_at)
      VALUES (?,?,?,'menu-settimana','pickup',?,NULL,?,'Cliente Uno','3331234567','Pescara','','','{}','{}',?,?,NULL,0,?,0,?)`)
    .run(
      o.id,
      o.utente ?? "cliente1",
      o.stato ?? "confirmed",
      o.uscita ?? null,
      o.uscita ?? null,
      JSON.stringify(o.voci ?? []),
      o.porzioni ?? 0,
      o.origine ?? "web",
      o.creato ?? "2026-10-01 10:00:00",
    );
}

const voce = (day: string, meal: string, name: string) => ({ id: name.toLowerCase().replace(/\s+/g, "-"), name, day, meal, extras: [] });

async function corpoJson<T = Record<string, unknown>>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function creaClienteRubrica(nome = "Paolo", prezzoPastoCents: number | null = 1000) {
  const response = await rubricaPost({ env: env(), request: richiesta("POST", "/api/admin/rubrica", { nome, telefono: "085 1234567", indirizzo: "", prezzoPastoCents }), params: {} });
  return (await corpoJson(response)).cliente as { id: string; nome: string; prezzoPastoCents: number | null };
}

describe("GET /api/admin/pannello", () => {
  it("il pannello rifiuta intervalli sbagliati e accetta da-a fino a 31 giorni in tutto", async () => {
    const get = (da: string, a: string) => onRequestGet({ env: env(), request: richiesta("GET", `/api/admin/pannello?da=${da}&a=${a}`), params: {} });

    expect((await get("2026-10-10", "2026-10-01")).status).toBe(400);
    expect((await get("2026-10-01", "2026-11-01")).status).toBe(400);
    expect((await get("2026-13-01", "2026-10-01")).status).toBe(400);
    expect((await get("ieri", "domani")).status).toBe(400);
    expect((await onRequestGet({ env: env(), request: richiesta("GET", "/api/admin/pannello"), params: {} })).status).toBe(400);
    expect((await get("2026-10-01", "2026-10-31")).status).toBe(200);
  });

  it("un ordine confermato non ancora nella settimana ci finisce da solo al caricamento, una sola volta", async () => {
    inserisciOrdine({ id: "o1", uscita: lunedi, voci: [voce("lun", "pranzo", "Pollo al curry"), voce("mer", "cena", "Pesce")] });
    const get = () => onRequestGet({ env: env(), request: richiesta("GET", `/api/admin/pannello?da=${lunedi}&a=${domenica}`), params: {} });

    const primo = await corpoJson(await get());
    expect(primo.pasti).toHaveLength(2);
    expect(primo.clienti).toEqual([expect.objectContaining({ userId: "cliente1" })]);
    expect(bench.sqlite.prepare("SELECT in_settimana FROM orders WHERE id = 'o1'").get()).toEqual({ in_settimana: 1 });

    const secondo = await corpoJson(await get());
    expect(secondo.pasti).toHaveLength(2);
    expect(secondo.clienti).toHaveLength(1);
  });

  it("nuovi sono gli ordini da confermare, dal più recente", async () => {
    inserisciOrdine({ id: "nuovo", stato: "requested", creato: "2026-10-05 09:00:00" });
    inserisciOrdine({ id: "vecchio", stato: "requested", creato: "2026-10-02 09:00:00" });
    const dati = await corpoJson<{ nuovi: { id: string }[] }>(await onRequestGet({ env: env(), request: richiesta("GET", `/api/admin/pannello?da=${lunedi}&a=${domenica}`), params: {} }));
    expect(dati.nuovi.map((o) => o.id)).toEqual(["nuovo", "vecchio"]);
  });
});

describe("rubrica", () => {
  it("POST crea un cliente (201), PATCH lo cambia o risponde 404", async () => {
    const creato = await rubricaPost({ env: env(), request: richiesta("POST", "/api/admin/rubrica", { nome: "Paolo", prezzoPastoCents: 900 }), params: {} });
    expect(creato.status).toBe(201);
    const { cliente } = await corpoJson<{ cliente: { id: string } }>(creato);
    expect(cliente).toMatchObject({ nome: "Paolo", prezzoPastoCents: 900, userId: null });

    const cambiato = await rubricaPatch({ env: env(), request: richiesta("PATCH", "/api/admin/rubrica", { id: cliente.id, nome: "Paolo Rossi", prezzoPastoCents: 1000 }), params: {} });
    expect(cambiato.status).toBe(200);
    expect((await corpoJson<{ cliente: unknown }>(cambiato)).cliente).toMatchObject({ id: cliente.id, nome: "Paolo Rossi", prezzoPastoCents: 1000 });

    const assente = await rubricaPatch({ env: env(), request: richiesta("PATCH", "/api/admin/rubrica", { id: "nessuno", nome: "X" }), params: {} });
    expect(assente.status).toBe(404);
  });

  it("senza nome o da un sito diverso non si crea niente", async () => {
    expect((await rubricaPost({ env: env(), request: richiesta("POST", "/api/admin/rubrica", { nome: "" }), params: {} })).status).toBe(400);
    expect((await rubricaPost({ env: env(), request: richiesta("POST", "/api/admin/rubrica", { nome: "Paolo" }, false), params: {} })).status).toBe(403);
    expect(bench.sqlite.prepare("SELECT COUNT(*) AS n FROM clienti_matteo").get()?.n).toBe(0);
  });
});

describe("pasti", () => {
  it("PUT salva la casella (200) e DELETE la toglie (404 alla seconda volta)", async () => {
    const paolo = await creaClienteRubrica();
    const salvato = await pastiPut({ env: env(), request: richiesta("PUT", "/api/admin/pasti", { clienteId: paolo.id, data: "2026-11-02", pasto: "pranzo", piatto: "Riso", porzioni: 2 }), params: {} });
    expect(salvato.status).toBe(200);
    const { pasto } = await corpoJson<{ pasto: { id: string } }>(salvato);
    expect(pasto).toMatchObject({ clienteId: paolo.id, piatto: "Riso", porzioni: 2, prezzoCents: 1000 });

    expect((await pastiDelete({ env: env(), request: richiesta("DELETE", "/api/admin/pasti", { id: pasto.id }), params: {} })).status).toBe(200);
    expect((await pastiDelete({ env: env(), request: richiesta("DELETE", "/api/admin/pasti", { id: pasto.id }), params: {} })).status).toBe(404);
  });

  it("PUT rifiuta un pasto che non è pranzo o cena, e un cliente che non esiste", async () => {
    const paolo = await creaClienteRubrica();
    const evento = await pastiPut({ env: env(), request: richiesta("PUT", "/api/admin/pasti", { clienteId: paolo.id, data: "2026-11-02", pasto: "evento", piatto: "Cuoco" }), params: {} });
    expect(evento.status).toBe(400);
    const sconosciuto = await pastiPut({ env: env(), request: richiesta("PUT", "/api/admin/pasti", { clienteId: "nessuno", data: "2026-11-02", pasto: "cena", piatto: "Riso" }), params: {} });
    expect(sconosciuto.status).toBe(404);
  });

  it("POST pasti/copia vuole un lunedì e copia la settimana scorsa", async () => {
    const paolo = await creaClienteRubrica();
    await pastiPut({ env: env(), request: richiesta("PUT", "/api/admin/pasti", { clienteId: paolo.id, data: "2026-10-26", pasto: "cena", piatto: "Riso" }), params: {} });

    const martedi = await copiaPost({ env: env(), request: richiesta("POST", "/api/admin/pasti/copia", { clienteId: paolo.id, lunedi: "2026-11-03" }), params: {} });
    expect(martedi.status).toBe(400);

    const copiata = await copiaPost({ env: env(), request: richiesta("POST", "/api/admin/pasti/copia", { clienteId: paolo.id, lunedi: "2026-11-02" }), params: {} });
    expect(copiata.status).toBe(200);
    expect(await corpoJson(copiata)).toMatchObject({ copiati: 1, fonte: 1, pasti: [expect.objectContaining({ data: "2026-11-02", piatto: "Riso", pasto: "cena" })] });
  });
});

describe("POST /api/admin/in-settimana/:id", () => {
  it("un ordine da confermare non entra nella settimana (409) e resta com'è", async () => {
    inserisciOrdine({ id: "r1", stato: "requested", uscita: lunedi, voci: [voce("lun", "pranzo", "Riso")] });
    const risposta = await accettaPost({ env: env(), request: richiesta("POST", "/api/admin/in-settimana/r1", { inizio: lunedi, prezzoPastoCents: null }), params: { id: "r1" } });
    expect(risposta.status).toBe(409);
    expect(await corpoJson(risposta)).toEqual({ error: "Prima accetta l'ordine." });
    expect(bench.sqlite.prepare("SELECT in_settimana FROM orders WHERE id = 'r1'").get()).toEqual({ in_settimana: 0 });
  });

  it("una data prima di oggi è un errore (400), un ordine che non esiste è un 404", async () => {
    inserisciOrdine({ id: "c1", uscita: lunedi, voci: [voce("lun", "pranzo", "Riso")] });
    const ieri = spostaGiorno(oggi, -1);
    const passata = await accettaPost({ env: env(), request: richiesta("POST", "/api/admin/in-settimana/c1", { inizio: ieri, prezzoPastoCents: null }), params: { id: "c1" } });
    expect(passata.status).toBe(400);
    expect(await corpoJson(passata)).toEqual({ error: "Scegli un giorno da oggi in poi." });

    const assente = await accettaPost({ env: env(), request: richiesta("POST", "/api/admin/in-settimana/nessuno", { inizio: lunedi, prezzoPastoCents: null }), params: { id: "nessuno" } });
    expect(assente.status).toBe(404);
  });

  it("accettare con il prezzo lo salva sul cliente e sui pasti già convertiti senza prezzo", async () => {
    inserisciOrdine({ id: "c2", uscita: lunedi, voci: [voce("lun", "pranzo", "Pollo al curry")] });
    await corpoJson(await onRequestGet({ env: env(), request: richiesta("GET", `/api/admin/pannello?da=${lunedi}&a=${domenica}`), params: {} }));
    expect(bench.sqlite.prepare("SELECT prezzo_cents FROM pasti WHERE ordine_id = 'c2'").get()).toEqual({ prezzo_cents: null });

    const accettato = await accettaPost({ env: env(), request: richiesta("POST", "/api/admin/in-settimana/c2", { inizio: lunedi, prezzoPastoCents: 800 }), params: { id: "c2" } });

    expect(accettato.status).toBe(200);
    expect((await corpoJson(accettato)).pasti).toEqual([expect.objectContaining({ piatto: "Pollo al curry", prezzoCents: 800 })]);
    expect(bench.sqlite.prepare("SELECT prezzo_cents FROM pasti WHERE ordine_id = 'c2'").get()).toEqual({ prezzo_cents: 800 });
    expect(bench.sqlite.prepare("SELECT prezzo_pasto_cents FROM clienti_matteo").get()).toEqual({ prezzo_pasto_cents: 800 });
  });
});

describe("GET /api/admin/guadagni", () => {
  it("risponde con il mese e il mese prima, 400 se il mese non è AAAA-MM", async () => {
    const paolo = await creaClienteRubrica("Paolo", 1000);
    bench.sqlite.prepare("INSERT INTO pasti (id,cliente_id,data,pasto,piatto,porzioni,prezzo_cents) VALUES ('g1',?,'2026-10-05','pranzo','Riso',2,1000)").run(paolo.id);
    const get = (mese: string) => onRequestGuadagniGet({ env: env(), request: richiesta("GET", `/api/admin/guadagni?mese=${mese}`), params: {} });

    const ottobre = await get("2026-10");
    expect(ottobre.status).toBe(200);
    expect(await corpoJson(ottobre)).toEqual({ mese: { cents: 2000, pasti: 2, senzaPrezzo: 0, clienti: 1 }, precedente: { cents: 0, pasti: 0, senzaPrezzo: 0, clienti: 0 } });
    expect(await corpoJson(await get("2026-11"))).toEqual({ mese: { cents: 0, pasti: 0, senzaPrezzo: 0, clienti: 0 }, precedente: { cents: 2000, pasti: 2, senzaPrezzo: 0, clienti: 1 } });

    for (const sbagliato of ["2026-13", "2026-00", "2026-1", "ottobre", ""]) {
      expect((await get(sbagliato)).status).toBe(400);
    }
    expect((await onRequestGuadagniGet({ env: env(), request: richiesta("GET", "/api/admin/guadagni"), params: {} })).status).toBe(400);
  });
});
