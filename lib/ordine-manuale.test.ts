import { describe, expect, it } from "vitest";
import type { ClienteAdmin } from "./api";
import { PIATTI } from "./catalogo";
import {
  PREZZO_ABBONAMENTO_CAMPO,
  campiVuoti,
  cercaClienti,
  conCliente,
  conInizio,
  conServizio,
  corpoNuovoOrdine,
  erroriNuovoOrdine,
  giornoSettimanaDi,
  leggiPorzioni,
  moduloToccato,
  piattiScelti,
  porzioniOrdine,
  riempiCaselle,
  riepilogoPiatti,
  type CampiNuovoOrdine,
} from "./ordine-manuale";
import type { Piano } from "./settimana";

const [pollo, noodles, terzo] = PIATTI;

const cliente = (id: string, name: string, extra: Partial<ClienteAdmin> = {}): ClienteAdmin => ({
  id, name, email: `${id}@example.com`, emailVerified: true, createdAt: "2026-09-01 10:00:00",
  phone: "", comune: "", address: "", preferences: "", orders: 0, activeOrders: 0, meals: 0,
  lastOrderAt: null, spentCents: 0, hasSavedPlan: false, ...extra,
});

const clienti = [
  cliente("u1", "Giulia Rossi", { phone: "333 123 4567", comune: "Pescara", address: "Via Roma 1" }),
  cliente("u2", "Niccolò Bianchi", { phone: "+39 347 765 4321", comune: "Montesilvano" }),
  cliente("u3", "Marta Rossetti", { email: "marta@palestra.it", comune: "Chieti" }),
];

describe("ricerca clienti", () => {
  it("senza testo mostra i primi, nell'ordine del server", () => {
    expect(cercaClienti(clienti, "", 2)).toEqual({ trovati: clienti.slice(0, 2), altri: 1 });
  });

  it("trova per nome senza accenti e maiuscole, per email e comune, anche con piu' parole", () => {
    expect(cercaClienti(clienti, "niccolo").trovati.map((c) => c.id)).toEqual(["u2"]);
    expect(cercaClienti(clienti, "ROSS").trovati.map((c) => c.id)).toEqual(["u1", "u3"]);
    expect(cercaClienti(clienti, "palestra").trovati.map((c) => c.id)).toEqual(["u3"]);
    expect(cercaClienti(clienti, "rossi pescara").trovati.map((c) => c.id)).toEqual(["u1"]);
  });

  it("trova per telefono ignorando spazi e prefisso, con almeno 3 cifre", () => {
    expect(cercaClienti(clienti, "3477654").trovati.map((c) => c.id)).toEqual(["u2"]);
    expect(cercaClienti(clienti, "333 123").trovati.map((c) => c.id)).toEqual(["u1"]);
    expect(cercaClienti(clienti, "zzz").trovati).toEqual([]);
  });

  it("scegliere un cliente copia i dati del profilo nel modulo", () => {
    const c = conCliente(campiVuoti(), clienti[0]);
    expect(c).toMatchObject({ modo: "registrato", nome: "Giulia Rossi", telefono: "333 123 4567", comune: "Pescara", indirizzo: "Via Roma 1" });
    expect(c.cliente?.id).toBe("u1");
  });
});

describe("griglia dei piatti", () => {
  it("riempie le caselle libere a partire dal giorno scelto, pranzo poi cena", () => {
    const { piano, messe } = riempiCaselle({}, pollo.id, 3, "gio");
    expect(messe).toBe(3);
    expect(piano).toEqual({
      gio: { pranzo: { piatto: pollo.id, extra: [] }, cena: { piatto: pollo.id, extra: [] } },
      ven: { pranzo: { piatto: pollo.id, extra: [] } },
    });
  });

  it("salta le caselle gia' piene e ricomincia da lunedi' dopo domenica", () => {
    const pieno: Piano = { dom: { pranzo: { piatto: noodles.id, extra: [] } } };
    const { piano, messe } = riempiCaselle(pieno, pollo.id, 3, "dom");
    expect(messe).toBe(3);
    expect(piano.dom).toEqual({ pranzo: { piatto: noodles.id, extra: [] }, cena: { piatto: pollo.id, extra: [] } });
    expect(piano.lun).toEqual({ pranzo: { piatto: pollo.id, extra: [] }, cena: { piatto: pollo.id, extra: [] } });
  });

  it("non va oltre le 14 caselle e dice quante ne ha messe", () => {
    const { piano, messe } = riempiCaselle({}, pollo.id, 20, "lun");
    expect(messe).toBe(14);
    expect(piattiScelti(piano)).toBe(14);
    const ancora = riempiCaselle(piano, noodles.id, 2, "lun");
    expect(ancora.messe).toBe(0);
    expect(ancora.piano).toBe(piano);
  });

  it("ignora piatti sconosciuti e quantita' non positive", () => {
    expect(riempiCaselle({}, "non-esiste", 3, "lun").messe).toBe(0);
    expect(riempiCaselle({}, pollo.id, 0, "lun").messe).toBe(0);
  });

  it("riepiloga i piatti dal piu' ordinato", () => {
    const uno = riempiCaselle({}, noodles.id, 1, "lun").piano;
    const piano = riempiCaselle(uno, pollo.id, 3, "lun").piano;
    expect(riepilogoPiatti(piano)).toEqual([
      { id: pollo.id, nome: pollo.nome, quanti: 3 },
      { id: noodles.id, nome: noodles.nome, quanti: 1 },
    ]);
  });

  it("trova il giorno della settimana di una data", () => {
    expect(giornoSettimanaDi("2026-09-28")).toBe("lun");
    expect(giornoSettimanaDi("2026-10-01")).toBe("gio");
    expect(giornoSettimanaDi("2026-09-27")).toBe("dom");
    expect(giornoSettimanaDi("")).toBeNull();
  });
});

describe("porzioni", () => {
  it("fuori dall'home cooking contano i piatti; nell'home cooking vince il numero piu' alto", () => {
    const piano = riempiCaselle({}, terzo.id, 2, "lun").piano;
    expect(porzioniOrdine({ servizio: "menu-settimana", piano, porzioni: "10" })).toBe(2);
    expect(porzioniOrdine({ servizio: "home-cooking", piano, porzioni: "10" })).toBe(10);
    expect(porzioniOrdine({ servizio: "home-cooking", piano, porzioni: "1" })).toBe(2);
    expect(porzioniOrdine({ servizio: "home-cooking", piano: {}, porzioni: "" })).toBe(0);
  });

  it("legge le porzioni scritte a mano", () => {
    expect(leggiPorzioni("")).toBeNull();
    expect(leggiPorzioni(" 12 ")).toBe(12);
    expect(leggiPorzioni("101")).toBeUndefined();
    expect(leggiPorzioni("2,5")).toBeUndefined();
    expect(leggiPorzioni("-1")).toBeUndefined();
  });
});

describe("controlli prima di salvare", () => {
  const pronto = (changes: Partial<CampiNuovoOrdine> = {}): CampiNuovoOrdine => ({
    ...campiVuoti("senza-account"),
    nome: "Anna Verdi",
    telefono: "347 765 4321",
    piano: riempiCaselle({}, pollo.id, 2, "lun").piano,
    ...changes,
  });

  it("un ordine completo non ha errori", () => {
    expect(erroriNuovoOrdine(pronto())).toEqual({});
  });

  it("in modalita' registrato serve scegliere il cliente, e i suoi campi non si controllano prima", () => {
    const e = erroriNuovoOrdine({ ...pronto(), modo: "registrato", nome: "", telefono: "" });
    expect(Object.keys(e)).toEqual(["cliente"]);
    const scelto = conCliente(pronto(), clienti[2]);
    expect(erroriNuovoOrdine(scelto).telefono).toMatch(/9 cifre/);
  });

  it("segnala nome, telefono, consegna senza indirizzo e piatti mancanti", () => {
    const e = erroriNuovoOrdine(pronto({ nome: " ", telefono: "333", modalita: "delivery", piano: {} }));
    expect(Object.keys(e).sort()).toEqual(["comune", "indirizzo", "nome", "piatti", "telefono"]);
    expect(erroriNuovoOrdine(pronto({ piano: {}, servizio: "home-cooking" }))).toEqual({});
    expect(erroriNuovoOrdine(pronto({ servizio: "home-cooking", porzioni: "tante" })).porzioni).toBeDefined();
  });

  it("date: cucina prima dell'uscita, e tutte e due per il gia' confermato", () => {
    expect(erroriNuovoOrdine(pronto({ produzione: "2026-10-01", uscita: "2026-09-28" })).date).toMatch(/dopo/);
    expect(erroriNuovoOrdine(pronto({ stato: "confirmed", produzione: "2026-10-01" })).date).toMatch(/tutte e due/);
    expect(erroriNuovoOrdine(pronto({ stato: "confirmed", produzione: "2026-10-01", uscita: "2026-10-01" }))).toEqual({});
  });

  it("prezzo con la virgola, vuoto ammesso, testo e cifre enormi no", () => {
    expect(erroriNuovoOrdine(pronto({ prezzo: "45,50" }))).toEqual({});
    expect(erroriNuovoOrdine(pronto({ prezzo: "quaranta" })).prezzo).toMatch(/non valido/);
    expect(erroriNuovoOrdine(pronto({ prezzo: "10.000,01" })).prezzo).toMatch(/10\.000/);
  });

  it("costruisce il corpo per il server", () => {
    const senza = corpoNuovoOrdine(pronto({ prezzo: "45,5", pagato: true, nota: " chiamato ", note: " senza cipolla ", uscita: "2026-10-01" }));
    expect(senza).toMatchObject({
      customerId: null, name: "Anna Verdi", phone: "347 765 4321", service: "menu-settimana", fulfillment: "pickup",
      status: "requested", productionDate: null, fulfillmentDate: "2026-10-01", priceCents: 4550, paid: true,
      internalNote: "chiamato", notes: "senza cipolla",
    });
    expect(senza).not.toHaveProperty("meals");
    const registrato = corpoNuovoOrdine(conCliente(pronto({ servizio: "home-cooking", porzioni: "8" }), clienti[0]));
    expect(registrato).toMatchObject({ customerId: "u1", meals: 8, priceCents: null });
    // Tornato "senza account" dopo aver scelto qualcuno: l'id non parte.
    expect(corpoNuovoOrdine({ ...conCliente(pronto(), clienti[0]), modo: "senza-account" }).customerId).toBeNull();
  });

  it("sa se il modulo e' stato toccato", () => {
    expect(moduloToccato(campiVuoti())).toBe(false);
    expect(moduloToccato({ ...campiVuoti(), nome: "A" })).toBe(true);
    expect(moduloToccato({ ...campiVuoti(), piano: riempiCaselle({}, pollo.id, 1, "lun").piano })).toBe(true);
    expect(moduloToccato({ ...campiVuoti(), pagato: true })).toBe(true);
  });
});

describe("abbonamento a mano", () => {
  const base = (): CampiNuovoOrdine => ({ ...campiVuoti("senza-account"), nome: "Anna", telefono: "347 765 4321" });

  it("passando all'abbonamento svuota i piatti, propone il prezzo e usa una data sola", () => {
    const conPiatti = { ...base(), piano: { lun: { pranzo: { piatto: pollo.id, extra: [] } } }, uscita: "2026-10-05" };
    const abb = conServizio(conPiatti, "abbonamento");
    expect(abb).toMatchObject({ servizio: "abbonamento", piano: {}, prezzo: PREZZO_ABBONAMENTO_CAMPO, produzione: "2026-10-05", uscita: "2026-10-05" });
    expect(PREZZO_ABBONAMENTO_CAMPO).toBe("239,00");
    // un prezzo gia' scritto resta
    expect(conServizio({ ...base(), prezzo: "200" }, "abbonamento").prezzo).toBe("200");
    // tornando indietro il prezzo proposto sparisce, quello scritto no
    expect(conServizio(abb, "menu-settimana").prezzo).toBe("");
    expect(conServizio({ ...abb, prezzo: "200" }, "menu-settimana").prezzo).toBe("200");
    expect(conInizio(abb, "2026-10-12")).toMatchObject({ produzione: "2026-10-12", uscita: "2026-10-12" });
  });

  it("non chiede piatti ne' porzioni; confermato vuole l'inizio", () => {
    const abb = conServizio(base(), "abbonamento");
    expect(erroriNuovoOrdine(abb)).toEqual({});
    expect(porzioniOrdine(abb)).toBe(0);
    expect(erroriNuovoOrdine({ ...abb, stato: "confirmed" }).date).toMatch(/inizio/);
    expect(erroriNuovoOrdine(conInizio({ ...abb, stato: "confirmed" }, "2026-10-05"))).toEqual({});
  });

  it("manda l'inizio in entrambe le date, senza piatti", () => {
    const corpo = corpoNuovoOrdine(conInizio(conServizio(base(), "abbonamento"), "2026-10-05"));
    expect(corpo).toMatchObject({
      service: "abbonamento", plan: {}, productionDate: "2026-10-05", fulfillmentDate: "2026-10-05", priceCents: 23900,
    });
    expect(corpo).not.toHaveProperty("meals");
  });
});
