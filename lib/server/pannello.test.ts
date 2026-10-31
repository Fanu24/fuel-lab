import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { creaD1Prova } from "./d1-prova";
import { oggiRoma, spostaGiorno } from "./date";
import {
  convertiOrdiniAperti,
  copiaSettimanaPrecedente,
  creaCliente,
  errorIntervallo,
  guadagniDelMese,
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
    // La settimana prima aveva due pasti (Riso e Pollo): `fonte` li conta, anche quello che non entra.
    expect(copia.fonte).toBe(2);
    expect(copia.pasti.map((p) => [p.data, p.piatto, p.prezzoCents, p.ordineId])).toEqual([
      ["2026-11-02", "Riso", 900, null],
      ["2026-11-04", "Insalata", 900, null],
    ]);
  });

  it("copia la settimana scorsa: fonte zero se era vuota, copiati zero se le caselle erano già piene", async () => {
    const { env } = bench;
    const paolo = await creaCliente(env.DB, cliente("Paolo"));
    const vuota = await copiaSettimanaPrecedente(env.DB, paolo.id, "2026-11-02");
    expect(vuota).toMatchObject({ copiati: 0, fonte: 0 });

    await salvaPasto(env.DB, { clienteId: paolo.id, data: "2026-10-27", pasto: "cena", piatto: "Frittata", piattoId: null, porzioni: 1 });
    await salvaPasto(env.DB, { clienteId: paolo.id, data: "2026-11-03", pasto: "cena", piatto: "Pollo", piattoId: null, porzioni: 1 });
    const piene = await copiaSettimanaPrecedente(env.DB, paolo.id, "2026-11-02");
    expect(piene).toMatchObject({ copiati: 0, fonte: 1 });
  });

  it("recenti: fino a 12 piatti distinti dal più recente, dai 60 giorni indietro in poi, senza eventi", async () => {
    const { env } = bench;
    const paolo = await creaCliente(env.DB, cliente("Paolo"));
    for (let k = 1; k <= 14; k++) {
      await salvaPasto(env.DB, { clienteId: paolo.id, data: spostaGiorno(oggi, -k), pasto: "pranzo", piatto: `Piatto ${k}`, piattoId: null, porzioni: 1 });
    }
    // Un duplicato, uno di 61 giorni fa e un cuoco a domicilio: fuori dall'elenco. Oggi e domani ci sono.
    await salvaPasto(env.DB, { clienteId: paolo.id, data: spostaGiorno(oggi, -3), pasto: "cena", piatto: "Piatto 1", piattoId: null, porzioni: 1 });
    await salvaPasto(env.DB, { clienteId: paolo.id, data: oggi, pasto: "pranzo", piatto: "Di oggi", piattoId: null, porzioni: 1 });
    await salvaPasto(env.DB, { clienteId: paolo.id, data: spostaGiorno(oggi, 1), pasto: "pranzo", piatto: "Domani", piattoId: null, porzioni: 1 });
    await salvaPasto(env.DB, { clienteId: paolo.id, data: spostaGiorno(oggi, -61), pasto: "pranzo", piatto: "Vecchio", piattoId: null, porzioni: 1 });
    bench.sqlite.prepare("INSERT INTO pasti (id,cliente_id,data,pasto,piatto) VALUES ('ev1',?,?,'evento','Cuoco a domicilio')").run(paolo.id, spostaGiorno(oggi, -2));

    const dati = await leggiPannello(env.DB, oggi, oggi);

    // Oggi e i giorni futuri contano (sono i piatti che Matteo riusa); il piu' recente in cima; 12 al massimo.
    expect(dati.recenti[paolo.id]).toEqual(["Domani", "Di oggi", ...Array.from({ length: 10 }, (_, i) => `Piatto ${i + 1}`)]);
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
  it("un piatto più lungo di 200 caratteri entra tagliato, e un piatto vuoto prende un nome segnaposto", async () => {
    const { env } = bench;
    inserisciOrdine({ id: "lungo", uscita: lunedi, voci: [voce("lun", "pranzo", "A".repeat(250))] });
    inserisciOrdine({ id: "vuoto", uscita: lunedi, voci: [{ id: "x", name: "   ", day: "mar", meal: "pranzo", extras: [] }] });

    expect(await convertiOrdiniAperti(env.DB, oggi)).toBe(2);

    expect(bench.sqlite.prepare("SELECT length(piatto) AS n FROM pasti WHERE ordine_id = 'lungo'").get()?.n).toBe(200);
    expect(bench.sqlite.prepare("SELECT piatto FROM pasti WHERE ordine_id = 'vuoto'").get()?.piatto).toBe("Piatto da definire");
  });

  it("un ordine che non si converte non ferma gli altri: si registra l'errore e la conversione va avanti", async () => {
    const { env } = bench;
    inserisciOrdine({ id: "rotto", uscita: lunedi, creato: "2026-10-01 10:00:00", voci: [voce("lun", "pranzo", "Riso")] });
    inserisciOrdine({ id: "buono", uscita: lunedi, creato: "2026-10-02 10:00:00", voci: [voce("lun", "pranzo", "Pollo")] });
    // Il primo batch (quello di "rotto", il piu' vecchio) fallisce; il secondo va come sempre.
    const batchVero = env.DB.batch.bind(env.DB);
    let chiamate = 0;
    const db = {
      prepare: env.DB.prepare.bind(env.DB),
      batch: async (statements: Parameters<typeof batchVero>[0]) => {
        chiamate++;
        if (chiamate === 1) throw new Error("vincolo di prova");
        return batchVero(statements);
      },
    } as unknown as typeof env.DB;
    const errori = vi.spyOn(console, "error").mockImplementation(() => {});

    const convertiti = await convertiOrdiniAperti(db, oggi);

    expect(convertiti).toBe(1);
    expect(errori).toHaveBeenCalledWith(expect.stringContaining("rotto"), expect.anything());
    errori.mockRestore();
    expect(bench.sqlite.prepare("SELECT in_settimana FROM orders WHERE id = 'buono'").get()?.in_settimana).toBe(1);
    expect(bench.sqlite.prepare("SELECT in_settimana FROM orders WHERE id = 'rotto'").get()?.in_settimana).toBe(0);
    expect(bench.sqlite.prepare("SELECT COUNT(*) AS n FROM pasti WHERE ordine_id = 'rotto'").get()?.n).toBe(0);
  });

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

  it("due conversioni insieme non raddoppiano: un ordine manuale entra con un solo cliente e i suoi pasti una volta sola", async () => {
    const { env } = bench;
    inserisciOrdine({ id: "m1", utente: "matteo", origine: "manual", nome: "Anna Verdi", telefono: "3331112222", uscita: lunedi, voci: [voce("lun", "pranzo", "Riso"), voce("mer", "cena", "Pollo")] });

    const convertiti = await Promise.all([convertiOrdiniAperti(env.DB, oggi), convertiOrdiniAperti(env.DB, oggi)]);

    expect(convertiti.reduce((a, b) => a + b, 0)).toBe(1);
    expect(bench.sqlite.prepare("SELECT COUNT(*) AS n FROM clienti_matteo").get()?.n).toBe(1);
    expect(bench.sqlite.prepare("SELECT COUNT(*) AS n FROM pasti WHERE ordine_id = 'm1'").get()?.n).toBe(2);
    expect(bench.sqlite.prepare("SELECT in_settimana FROM orders WHERE id = 'm1'").get()?.in_settimana).toBe(1);
  });

  it("accettare a metà: l'accettazione di Matteo salva il prezzo anche se la conversione aveva già portato l'ordine nella settimana", async () => {
    const { env } = bench;
    inserisciOrdine({ id: "c3", uscita: lunedi, voci: [voce("lun", "pranzo", "Pollo al curry")] });
    const [, ordine] = await Promise.all([convertiOrdiniAperti(env.DB, oggi), ordineDelDatabase("c3")]);

    const pasti = await mettiInSettimana(env.DB, ordine, lunedi, 900, oggi);

    expect(pasti.map((p) => p.prezzoCents)).toEqual([900]);
    expect(bench.sqlite.prepare("SELECT COUNT(*) AS n FROM pasti WHERE ordine_id = 'c3'").get()?.n).toBe(1);
    expect(bench.sqlite.prepare("SELECT COUNT(*) AS n FROM clienti_matteo").get()?.n).toBe(1);
  });

  it("un caricamento converte al massimo 8 ordini; gli altri entrano al caricamento dopo", async () => {
    const { env } = bench;
    // Ogni ordine ha il suo giorno e pasto, così i dieci ordini dello stesso cliente non si pestano le caselle.
    const giorni = ["lun", "mar", "mer", "gio", "ven"];
    for (let i = 0; i < 10; i++) {
      inserisciOrdine({ id: `o${i}`, uscita: lunedi, creato: `2026-10-01 10:00:0${i}`, voci: [voce(giorni[i % 5], i < 5 ? "pranzo" : "cena", `Piatto ${i}`)] });
    }

    expect(await convertiOrdiniAperti(env.DB, oggi)).toBe(8);
    expect(bench.sqlite.prepare("SELECT COUNT(*) AS n FROM orders WHERE in_settimana = 1").get()?.n).toBe(8);
    expect(await convertiOrdiniAperti(env.DB, oggi)).toBe(2);
    expect(await convertiOrdiniAperti(env.DB, oggi)).toBe(0);
    expect(bench.sqlite.prepare("SELECT COUNT(*) AS n FROM pasti").get()?.n).toBe(10);
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

  it("un prezzo di pasto oltre 1.000.000 centesimi si ferma a 1.000.000: il batch non fallisce", async () => {
    const { env } = bench;
    inserisciOrdine({ id: "h2", servizio: "home-cooking", uscita: lunedi, porzioni: 20 });
    const diretto = await mettiInSettimana(env.DB, await ordineDelDatabase("h2"), lunedi, 100000, oggi);
    expect(diretto.map((p) => p.prezzoCents)).toEqual([1000000]);

    // Un giorno diverso: due cuochi a domicilio dello stesso cliente nello stesso giorno collidono sulla casella (cliente, data, pasto).
    const martedi = spostaGiorno(lunedi, 1);
    inserisciOrdine({ id: "h3", servizio: "home-cooking", uscita: martedi, porzioni: 20 });
    await convertiOrdiniAperti(env.DB, oggi);
    const accettato = await mettiInSettimana(env.DB, await ordineDelDatabase("h3"), martedi, 100000, oggi);
    expect(accettato.map((p) => p.prezzoCents)).toEqual([1000000]);
  });

  it("l'abbonamento entra nella rubrica senza pasti, da mettere dal calendario", async () => {
    inserisciOrdine({ id: "a1", servizio: "abbonamento", uscita: lunedi, porzioni: 0 });

    expect(await convertiOrdiniAperti(bench.env.DB, oggi)).toBe(1);

    expect(bench.sqlite.prepare("SELECT COUNT(*) AS n FROM pasti").get()?.n).toBe(0);
    expect(bench.sqlite.prepare("SELECT COUNT(*) AS n FROM clienti_matteo WHERE user_id = 'cliente1'").get()?.n).toBe(1);
  });
});

describe("prezzo scritto dopo i pasti", () => {
  const inserisci = () => bench.sqlite.prepare("INSERT INTO pasti (id,cliente_id,data,pasto,piatto,porzioni,prezzo_cents) VALUES (?,?,?,?,?,?,?)");
  const prezzoDi = (id: string) => bench.sqlite.prepare("SELECT prezzo_cents FROM pasti WHERE id = ?").get(id)?.prezzo_cents;

  it("modificare il cliente con un prezzo lo da' ai pasti senza prezzo dal primo del mese in poi, e a nessun altro", async () => {
    const paolo = await creaCliente(bench.env.DB, cliente("Paolo"));
    const altro = await creaCliente(bench.env.DB, cliente("Altro"));
    inserisci().run("mese-scorso", paolo.id, "2026-09-30", "pranzo", "Riso", 1, null);
    inserisci().run("primo", paolo.id, "2026-10-01", "pranzo", "Riso", 1, null);
    inserisci().run("futuro", paolo.id, "2026-11-04", "cena", "Pesce", 2, null);
    inserisci().run("gia-pagato", paolo.id, "2026-10-12", "cena", "Pollo", 1, 700);
    inserisci().run("evento", paolo.id, "2026-10-20", "evento", "Cuoco a domicilio", 1, null);
    inserisci().run("di-altri", altro.id, "2026-10-05", "pranzo", "Riso", 1, null);

    const aggiornato = await modificaCliente(bench.env.DB, paolo.id, cliente("Paolo", 1000), "2026-10-15");

    expect(aggiornato?.prezzoPastoCents).toBe(1000);
    expect(prezzoDi("mese-scorso")).toBeNull();
    expect(prezzoDi("primo")).toBe(1000);
    expect(prezzoDi("futuro")).toBe(1000);
    expect(prezzoDi("gia-pagato")).toBe(700);
    expect(prezzoDi("evento")).toBeNull();
    expect(prezzoDi("di-altri")).toBeNull();
  });

  it("senza un prezzo nuovo i pasti restano come sono, e un prezzo oltre il tetto del CHECK si ferma al tetto", async () => {
    const paolo = await creaCliente(bench.env.DB, cliente("Paolo", 500));
    inserisci().run("p1", paolo.id, "2026-10-05", "pranzo", "Riso", 1, null);

    await modificaCliente(bench.env.DB, paolo.id, cliente("Paolo", null), "2026-10-15");
    expect(prezzoDi("p1")).toBeNull();

    await modificaCliente(bench.env.DB, paolo.id, cliente("Paolo", 100000), "2026-10-15");
    expect(prezzoDi("p1")).toBe(100000);
  });

  it("accettare un ordine di un cliente gia' in rubrica con un prezzo da' il prezzo anche ai suoi altri pasti del mese senza", async () => {
    const { env } = bench;
    inserisciOrdine({ id: "c4", uscita: lunedi, voci: [voce("lun", "pranzo", "Pollo")] });
    await convertiOrdiniAperti(env.DB, oggi);
    const [paolo] = (await leggiPannello(env.DB, lunedi, domenica)).clienti;
    inserisci().run("vecchio", paolo.id, `${oggi.slice(0, 8)}01`, "cena", "Zuppa", 1, null);

    await mettiInSettimana(env.DB, await ordineDelDatabase("c4"), lunedi, 900, oggi);

    expect(prezzoDi("vecchio")).toBe(900);
  });

  it("i guadagni dicono quanti pasti del mese non hanno prezzo, e scendono a zero quando il prezzo arriva", async () => {
    const paolo = await creaCliente(bench.env.DB, cliente("Paolo"));
    inserisci().run("a", paolo.id, "2026-10-05", "pranzo", "Riso", 1, null);
    inserisci().run("b", paolo.id, "2026-10-06", "cena", "Pesce", 2, null);
    inserisci().run("c", paolo.id, "2026-10-07", "cena", "Pollo", 1, 800);

    expect(await guadagniDelMese(bench.env.DB, "2026-10")).toEqual({ cents: 800, pasti: 4, senzaPrezzo: 3, clienti: 1 });

    await modificaCliente(bench.env.DB, paolo.id, cliente("Paolo", 1000), "2026-10-15");

    expect(await guadagniDelMese(bench.env.DB, "2026-10")).toEqual({ cents: 800 + 1000 + 2000, pasti: 4, senzaPrezzo: 0, clienti: 1 });
  });
});

describe("guadagni del mese", () => {
  it("i guadagni contano solo i pasti con un prezzo, moltiplicato per le porzioni", async () => {
    const paolo = await creaCliente(bench.env.DB, { nome: "Paolo", telefono: "", indirizzo: "", prezzoPastoCents: 1000 });
    const giulia = await creaCliente(bench.env.DB, { nome: "Giulia", telefono: "", indirizzo: "", prezzoPastoCents: null });
    const inserisci = bench.sqlite.prepare("INSERT INTO pasti (id,cliente_id,data,pasto,piatto,porzioni,prezzo_cents) VALUES (?,?,?,?,?,?,?)");
    // ottobre: Paolo 2 pasti a 1000 (uno con porzioni 2), Giulia 1 pasto senza prezzo e un suo evento da 10000; settembre: 1 pasto di Paolo a 900
    inserisci.run("p1", paolo.id, "2026-10-05", "pranzo", "Riso", 1, 1000);
    inserisci.run("p2", paolo.id, "2026-10-06", "cena", "Pesce", 2, 1000);
    inserisci.run("g1", giulia.id, "2026-10-07", "pranzo", "Pasta", 1, null);
    inserisci.run("g2", giulia.id, "2026-10-20", "evento", "Cuoco a domicilio", 1, 10000);
    inserisci.run("p3", paolo.id, "2026-09-15", "cena", "Riso", 1, 900);

    expect(await guadagniDelMese(bench.env.DB, "2026-10")).toEqual({ cents: 1000 * 1 + 1000 * 2 + 10000, pasti: 4, senzaPrezzo: 1, clienti: 2 });
    expect(await guadagniDelMese(bench.env.DB, "2026-09")).toEqual({ cents: 900, pasti: 1, senzaPrezzo: 0, clienti: 1 });
    expect(await guadagniDelMese(bench.env.DB, "2026-08")).toEqual({ cents: 0, pasti: 0, senzaPrezzo: 0, clienti: 0 });
  });

  it("il mese va dal primo all'ultimo giorno compresi: il primo del mese dopo non conta, dicembre passa all'anno dopo", async () => {
    const paolo = await creaCliente(bench.env.DB, { nome: "Paolo", telefono: "", indirizzo: "", prezzoPastoCents: 500 });
    const inserisci = bench.sqlite.prepare("INSERT INTO pasti (id,cliente_id,data,pasto,piatto,porzioni,prezzo_cents) VALUES (?,?,?,?,?,?,?)");
    inserisci.run("u1", paolo.id, "2026-09-30", "pranzo", "Riso", 1, 500);
    inserisci.run("u2", paolo.id, "2026-10-31", "pranzo", "Riso", 1, 500);
    inserisci.run("u3", paolo.id, "2026-11-01", "pranzo", "Riso", 1, 500);
    inserisci.run("u4", paolo.id, "2026-12-31", "cena", "Riso", 1, 500);
    inserisci.run("u5", paolo.id, "2027-01-01", "cena", "Riso", 1, 500);

    expect(await guadagniDelMese(bench.env.DB, "2026-10")).toEqual({ cents: 500, pasti: 1, senzaPrezzo: 0, clienti: 1 });
    expect(await guadagniDelMese(bench.env.DB, "2026-12")).toEqual({ cents: 500, pasti: 1, senzaPrezzo: 0, clienti: 1 });
  });
});
