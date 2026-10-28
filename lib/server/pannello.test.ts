import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { creaD1Prova } from "./d1-prova";
import { oggiRoma, spostaGiorno } from "./date";
import {
  convertiOrdiniAperti,
  copiaSettimanaPrecedente,
  creaCliente,
  errorIntervallo,
  leggiDatiCliente,
  leggiNuovoPasto,
  leggiPannello,
  mettiInSettimana,
  modificaCliente,
  salvaPasto,
  togliPasto,
} from "./pannello";
import { leggiOrdine } from "../../functions/_lib/ordini";
import { lunediDi } from "../pannello";
import { ordineDaRiga } from "./ordini";

type Bench = ReturnType<typeof creaD1Prova>;
let bench: Bench;

beforeEach(() => {
  bench = creaD1Prova();
});
afterEach(() => {
  bench.chiudi();
});

const oggi = oggiRoma();
/** Un lunedi' futuro: le date dei pasti da ordine non cadono mai nel passato. */
const lunedi = lunediDi(spostaGiorno(oggi, 7));
const domenica = spostaGiorno(lunedi, 6);

type OrdineProva = {
  id: string;
  utente?: string;
  stato?: string;
  servizio?: string;
  nome?: string;
  telefono?: string;
  comune?: string;
  indirizzo?: string;
  uscita?: string | null;
  voci?: { id: string; name: string; day: string; meal: string; extras: string[] }[];
  porzioni?: number;
  origine?: "web" | "manual";
  inSettimana?: 0 | 1;
  creato?: string;
};

/** Un ordine scritto direttamente nel database di prova, con le colonne che servono a pannello.ts. */
function inserisciOrdine(o: OrdineProva) {
  bench.sqlite
    .prepare(`INSERT INTO orders (id,user_id,status,service,fulfillment,requested_date,production_date,fulfillment_date,
        customer_name,phone,comune,address,notes,plan_json,training_json,items_json,meals,price_cents,paid,source,in_settimana,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'','{}','{}',?,?,NULL,0,?,?,?)`)
    .run(
      o.id,
      o.utente ?? "cliente1",
      o.stato ?? "confirmed",
      o.servizio ?? "menu-settimana",
      "pickup",
      o.uscita ?? null,
      null,
      o.uscita ?? null,
      o.nome ?? "Cliente Uno",
      o.telefono ?? "3331234567",
      o.comune ?? "Pescara",
      o.indirizzo ?? "",
      JSON.stringify(o.voci ?? []),
      o.porzioni ?? 0,
      o.origine ?? "web",
      o.inSettimana ?? 0,
      o.creato ?? "2026-10-01 10:00:00",
    );
}

const voce = (day: string, meal: string, name: string) => ({ id: name.toLowerCase().replace(/\s+/g, "-"), name, day, meal, extras: [] });

async function ordineDelDatabase(id: string) {
  const riga = await leggiOrdine(bench.env, id);
  if (!riga) throw new Error(`ordine ${id} assente`);
  return ordineDaRiga(riga, true);
}

const cliente = (nome: string, prezzoPastoCents: number | null = null) => ({ nome, telefono: "", indirizzo: "", prezzoPastoCents });

describe("dati di cliente e pasto in ingresso", () => {
  it("il nome è l'unico campo obbligatorio; il prezzo è facoltativo", () => {
    expect(leggiDatiCliente({ nome: "  Paolo " })).toEqual({ ok: true, value: { nome: "Paolo", telefono: "", indirizzo: "", prezzoPastoCents: null } });
    expect(leggiDatiCliente({ nome: "" })).toMatchObject({ ok: false, status: 400 });
    expect(leggiDatiCliente({ nome: "Paolo", prezzoPastoCents: -1 })).toMatchObject({ ok: false, status: 400 });
  });

  it("il pasto è pranzo o cena, con una data vera e da 1 a 20 porzioni", () => {
    const valido = { clienteId: "c1", data: "2026-11-02", pasto: "pranzo", piatto: "Riso", piattoId: null, porzioni: 1 };
    expect(leggiNuovoPasto(valido)).toEqual({ ok: true, value: valido });
    expect(leggiNuovoPasto({ ...valido, pasto: "evento" })).toMatchObject({ ok: false, status: 400 });
    expect(leggiNuovoPasto({ ...valido, data: "2026-02-30" })).toMatchObject({ ok: false, status: 400 });
    expect(leggiNuovoPasto({ ...valido, porzioni: 21 })).toMatchObject({ ok: false, status: 400 });
    expect(leggiNuovoPasto({ ...valido, piatto: "   " })).toMatchObject({ ok: false, status: 400 });
    const senzaPorzioni = { ...valido };
    delete (senzaPorzioni as Record<string, unknown>).porzioni;
    expect(leggiNuovoPasto(senzaPorzioni)).toMatchObject({ ok: true, value: { porzioni: 1 } });
  });

  it("l'intervallo del pannello va da una data a una data, al massimo 31 giorni", () => {
    expect(errorIntervallo("2026-10-01", "2026-10-31")).toBeNull();
    expect(errorIntervallo("2026-10-01", "2026-11-01")).not.toBeNull();
    expect(errorIntervallo("2026-10-10", "2026-10-01")).not.toBeNull();
    expect(errorIntervallo("2026-13-01", "2026-10-01")).not.toBeNull();
    expect(errorIntervallo(undefined, "2026-10-01")).not.toBeNull();
  });
});

describe("rubrica e pasti", () => {
  it("salvare la stessa casella due volte la aggiorna, non la raddoppia, e tiene il prezzo di quando è entrata", async () => {
    const { env } = bench;
    const paolo = await creaCliente(env.DB, cliente("Paolo", 1000));
    const primo = await salvaPasto(env.DB, { clienteId: paolo.id, data: "2026-11-02", pasto: "pranzo", piatto: "Pollo", piattoId: null, porzioni: 1 });
    expect(primo).toMatchObject({ ok: true, value: { piatto: "Pollo", prezzoCents: 1000 } });

    await modificaCliente(env.DB, paolo.id, cliente("Paolo", 1200));
    const secondo = await salvaPasto(env.DB, { clienteId: paolo.id, data: "2026-11-02", pasto: "pranzo", piatto: "Pesce", piattoId: null, porzioni: 2 });

    expect(secondo).toMatchObject({ ok: true, value: { id: primo.ok ? primo.value.id : "", piatto: "Pesce", porzioni: 2, prezzoCents: 1000 } });
    const righe = bench.sqlite.prepare("SELECT COUNT(*) AS n FROM pasti WHERE cliente_id = ?").get(paolo.id);
    expect(righe?.n).toBe(1);
  });

  it("salvare un pasto per un cliente inesistente restituisce 404", async () => {
    const esito = await salvaPasto(bench.env.DB, { clienteId: "nessuno", data: "2026-11-02", pasto: "cena", piatto: "Riso", piattoId: null, porzioni: 1 });
    expect(esito).toMatchObject({ ok: false, status: 404 });
  });

  it("togliPasto dice se ha tolto qualcosa", async () => {
    const { env } = bench;
    const paolo = await creaCliente(env.DB, cliente("Paolo"));
    const salvato = await salvaPasto(env.DB, { clienteId: paolo.id, data: "2026-11-02", pasto: "cena", piatto: "Riso", piattoId: null, porzioni: 1 });
    if (!salvato.ok) throw new Error("pasto non salvato");
    expect(await togliPasto(env.DB, salvato.value.id)).toBe(true);
    expect(await togliPasto(env.DB, salvato.value.id)).toBe(false);
  });

  it("copia la settimana scorsa solo nelle caselle vuote, con il prezzo attuale del cliente", async () => {
    const { env } = bench;
    const lun = "2026-11-02";
    const paolo = await creaCliente(env.DB, cliente("Paolo", 900));
    await salvaPasto(env.DB, { clienteId: paolo.id, data: "2026-10-26", pasto: "pranzo", piatto: "Riso", piattoId: null, porzioni: 1 });
    await salvaPasto(env.DB, { clienteId: paolo.id, data: "2026-10-28", pasto: "pranzo", piatto: "Pollo", piattoId: null, porzioni: 1 });
    await salvaPasto(env.DB, { clienteId: paolo.id, data: "2026-11-04", pasto: "pranzo", piatto: "Insalata", piattoId: null, porzioni: 1 });

    const copia = await copiaSettimanaPrecedente(env.DB, paolo.id, lun);

    expect(copia.copiati).toBe(1);
    expect(copia.pasti.map((p) => [p.data, p.piatto, p.prezzoCents, p.ordineId])).toEqual([
      ["2026-11-02", "Riso", 900, null],
      ["2026-11-04", "Insalata", 900, null],
    ]);
  });

  it("recenti: fino a 12 piatti distinti dei 60 giorni prima di oggi, dal più recente, senza eventi", async () => {
    const { env } = bench;
    const paolo = await creaCliente(env.DB, cliente("Paolo"));
    for (let k = 1; k <= 14; k++) {
      await salvaPasto(env.DB, { clienteId: paolo.id, data: spostaGiorno(oggi, -k), pasto: "pranzo", piatto: `Piatto ${k}`, piattoId: null, porzioni: 1 });
    }
    // Un duplicato, un pasto di oggi, uno di 61 giorni fa e un cuoco a domicilio: fuori dall'elenco.
    await salvaPasto(env.DB, { clienteId: paolo.id, data: spostaGiorno(oggi, -3), pasto: "cena", piatto: "Piatto 1", piattoId: null, porzioni: 1 });
    await salvaPasto(env.DB, { clienteId: paolo.id, data: oggi, pasto: "pranzo", piatto: "Di oggi", piattoId: null, porzioni: 1 });
    await salvaPasto(env.DB, { clienteId: paolo.id, data: spostaGiorno(oggi, -61), pasto: "pranzo", piatto: "Vecchio", piattoId: null, porzioni: 1 });
    bench.sqlite.prepare("INSERT INTO pasti (id,cliente_id,data,pasto,piatto) VALUES ('ev1',?,?,'evento','Cuoco a domicilio')").run(paolo.id, spostaGiorno(oggi, -2));

    const dati = await leggiPannello(env.DB, oggi, oggi);

    expect(dati.recenti[paolo.id]).toEqual(Array.from({ length: 12 }, (_, i) => `Piatto ${i + 1}`));
  });

  it("leggiPannello include da e a, esclude il giorno prima e il giorno dopo, e dà l'ultimo pasto del cliente", async () => {
    const { env } = bench;
    const paolo = await creaCliente(env.DB, cliente("Paolo"));
    for (const data of ["2026-11-01", "2026-11-02", "2026-11-08", "2026-11-09"]) {
      await salvaPasto(env.DB, { clienteId: paolo.id, data, pasto: "pranzo", piatto: "Riso", piattoId: null, porzioni: 1 });
    }

    const dati = await leggiPannello(env.DB, "2026-11-02", "2026-11-08");

    expect(dati.pasti.map((p) => p.data)).toEqual(["2026-11-02", "2026-11-08"]);
    expect(dati.clienti).toEqual([expect.objectContaining({ id: paolo.id, ultimoPasto: "2026-11-09" })]);
  });

  it("modificaCliente su un id che non esiste restituisce null", async () => {
    expect(await modificaCliente(bench.env.DB, "nessuno", cliente("Paolo"))).toBeNull();
  });
});

describe("ordini accettati nella settimana", () => {
  it("un ordine a mano senza account entra nella rubrica senza user_id e non si duplica", async () => {
    const { env } = bench;
    inserisciOrdine({ id: "m1", utente: "matteo", stato: "confirmed", origine: "manual", nome: "Anna Verdi", telefono: "3331112222", uscita: lunedi, voci: [voce("lun", "pranzo", "Riso")] });
    inserisciOrdine({ id: "m2", utente: "matteo", stato: "confirmed", origine: "manual", nome: "Anna Verdi", telefono: "3331112222", uscita: lunedi, voci: [voce("mer", "cena", "Pollo")] });

    expect(await convertiOrdiniAperti(env.DB, oggi)).toBe(2);

    const dati = await leggiPannello(env.DB, lunedi, domenica);
    expect(dati.clienti).toHaveLength(1);
    expect(dati.clienti[0]).toMatchObject({ nome: "Anna Verdi", userId: null });
    expect(dati.pasti.filter((p) => p.clienteId === dati.clienti[0].id)).toHaveLength(2);
  });

  it("un cliente con account entra con il suo user_id e l'indirizzo con il comune, separato dalla rubrica di Matteo", async () => {
    const { env } = bench;
    inserisciOrdine({ id: "w1", indirizzo: "Via Roma 1", voci: [voce("lun", "pranzo", "Riso")] });
    inserisciOrdine({ id: "m1", utente: "matteo", origine: "manual", stato: "confirmed", nome: "Cliente Uno", uscita: lunedi, voci: [voce("gio", "cena", "Pollo")] });

    await convertiOrdiniAperti(env.DB, oggi);

    const { clienti } = await leggiPannello(env.DB, lunedi, domenica);
    expect(clienti).toHaveLength(2);
    expect(clienti).toContainEqual(expect.objectContaining({ userId: "cliente1", nome: "Cliente Uno", indirizzo: "Via Roma 1, Pescara" }));
    expect(clienti).toContainEqual(expect.objectContaining({ userId: null, nome: "Cliente Uno" }));
  });

  it("un ordine confermato non ancora nella settimana ci finisce una sola volta; un ordine da confermare no", async () => {
    const { env } = bench;
    inserisciOrdine({ id: "c1", uscita: lunedi, voci: [voce("lun", "pranzo", "Pollo al curry"), voce("mer", "cena", "Pesce")] });
    inserisciOrdine({ id: "r1", stato: "requested", uscita: lunedi, voci: [voce("lun", "pranzo", "Riso")] });
    inserisciOrdine({ id: "g1", uscita: lunedi, inSettimana: 1, voci: [voce("ven", "pranzo", "Zuppa")] });

    expect(await convertiOrdiniAperti(env.DB, oggi)).toBe(1);
    expect(await convertiOrdiniAperti(env.DB, oggi)).toBe(0);

    expect(bench.sqlite.prepare("SELECT COUNT(*) AS n FROM pasti WHERE ordine_id = 'c1'").get()?.n).toBe(2);
    expect(bench.sqlite.prepare("SELECT in_settimana FROM orders WHERE id = 'r1'").get()?.in_settimana).toBe(0);
  });

  it("accettare con il prezzo lo salva sul cliente e sui pasti già convertiti senza prezzo", async () => {
    const { env } = bench;
    inserisciOrdine({ id: "c2", uscita: lunedi, voci: [voce("lun", "pranzo", "Pollo al curry")] });
    await convertiOrdiniAperti(env.DB, oggi);
    const ordine = await ordineDelDatabase("c2");

    const pasti = await mettiInSettimana(env.DB, ordine, lunedi, 800, oggi);

    expect(pasti.map((p) => p.prezzoCents)).toEqual([800]);
    const [paolo] = (await leggiPannello(env.DB, lunedi, domenica)).clienti;
    expect(paolo.prezzoPastoCents).toBe(800);
  });

  it("il cuoco a domicilio accettato con un prezzo a porzione vale prezzo per porzioni", async () => {
    const { env } = bench;
    inserisciOrdine({ id: "h1", servizio: "home-cooking", uscita: lunedi, porzioni: 10 });
    const ordine = await ordineDelDatabase("h1");

    const pasti = await mettiInSettimana(env.DB, ordine, lunedi, 800, oggi);

    expect(pasti).toEqual([expect.objectContaining({ pasto: "evento", prezzoCents: 8000 })]);
  });

  it("l'abbonamento entra nella rubrica senza pasti, da mettere dal calendario", async () => {
    inserisciOrdine({ id: "a1", servizio: "abbonamento", uscita: lunedi, porzioni: 0 });

    expect(await convertiOrdiniAperti(bench.env.DB, oggi)).toBe(1);

    expect(bench.sqlite.prepare("SELECT COUNT(*) AS n FROM pasti").get()?.n).toBe(0);
    expect(bench.sqlite.prepare("SELECT COUNT(*) AS n FROM clienti_matteo WHERE user_id = 'cliente1'").get()?.n).toBe(1);
  });
});
