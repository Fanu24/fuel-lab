import { describe, expect, it } from "vitest";
import type { ClienteAdmin } from "./api";
import { PIATTI } from "./catalogo";
import {
  bozzaOrdineDaTesto,
  campiVuoti,
  cercaClienti,
  conCliente,
  conInizio,
  conModalita,
  conSceltaAbbonamento,
  conServizio,
  corpoNuovoOrdine,
  erroriNuovoOrdine,
  giornoSettimanaDi,
  leggiPorzioni,
  moduloToccato,
  piattiScelti,
  prezzoProposto,
  porzioniOrdine,
  riempiCaselle,
  riepilogoPiatti,
  testoBozzaOrdine,
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
  /** Un abbonamento scelto: Completo Standard da solo, con ritiro (sconto 10%: 468 euro). */
  const abb = () => conServizio(base(), "abbonamento");

  it("passando all'abbonamento svuota i piatti, propone la formula consigliata col suo prezzo e usa una data sola", () => {
    const conPiatti = { ...base(), piano: { lun: { pranzo: { piatto: pollo.id, extra: [] } } }, uscita: "2026-10-05" };
    const a = conServizio(conPiatti, "abbonamento");
    expect(a).toMatchObject({
      servizio: "abbonamento", piano: {}, produzione: "2026-10-05", uscita: "2026-10-05",
      formula: "completo", fascia: "standard", nucleo: "singolo", prova: false, prezzo: "468,00",
    });
    // un prezzo gia' scritto resta
    expect(conServizio({ ...base(), prezzo: "200" }, "abbonamento").prezzo).toBe("200");
    // tornando indietro il prezzo proposto sparisce, quello scritto no
    expect(conServizio(a, "menu-settimana").prezzo).toBe("");
    expect(conServizio({ ...a, prezzo: "200" }, "menu-settimana").prezzo).toBe("200");
    expect(conInizio(a, "2026-10-12")).toMatchObject({ produzione: "2026-10-12", uscita: "2026-10-12" });
  });

  it("il prezzo proposto e' quello di calcolaPrezzo: formula, fascia, ritiro e nucleo", () => {
    expect(prezzoProposto(abb())).toBe("468,00"); // 520 - 10% (ritiro)
    expect(prezzoProposto({ ...abb(), modalita: "delivery" })).toBe("520,00");
    expect(prezzoProposto({ ...abb(), modalita: "delivery", nucleo: "coppia" })).toBe("478,00"); // 520 - 8%
    expect(prezzoProposto({ ...abb(), formula: "full7", fascia: "plus" })).toBe("851,00"); // 946 - 10%
  });

  it("cambiando formula, fascia, nucleo o modalita' il prezzo si riallinea, finche' Matteo non lo scrive lui", () => {
    expect(conSceltaAbbonamento(abb(), { formula: "pranzo" }).prezzo).toBe("156,00"); // 173 - 10% = 155,70
    expect(conSceltaAbbonamento(abb(), { fascia: "plus" }).prezzo).toBe("608,00"); // 676 - 10% = 608,40
    expect(conSceltaAbbonamento(abb(), { nucleo: "coppia" }).prezzo).toBe("468,00"); // il ritiro (10%) batte la coppia (8%)
    expect(conModalita(abb(), "delivery").prezzo).toBe("520,00");
    // tutto insieme, e a mano si puo' anche scrivere "468" invece di "468,00": e' ancora la proposta
    expect(conSceltaAbbonamento({ ...abb(), prezzo: "468" }, { formula: "leggero", fascia: "plus" }).prezzo).toBe("406,00"); // 451 - 10% = 405,90
    // un prezzo scritto a mano non si tocca, e uno cancellato resta vuoto
    expect(conSceltaAbbonamento({ ...abb(), prezzo: "500" }, { formula: "pranzo" }).prezzo).toBe("500");
    expect(conSceltaAbbonamento({ ...abb(), prezzo: "" }, { formula: "pranzo" }).prezzo).toBe("");
    // la scelta si salva anche se il prezzo non cambia
    expect(conSceltaAbbonamento(abb(), { prova: true })).toMatchObject({ prova: true, prezzo: "468,00" });
  });

  it("fuori dall'abbonamento cambiare la modalita' non tocca il prezzo", () => {
    const c = { ...base(), prezzo: "45" };
    expect(conModalita(c, "delivery")).toMatchObject({ modalita: "delivery", prezzo: "45" });
    expect(conModalita({ ...c, prezzo: "" }, "delivery").prezzo).toBe("");
  });

  it("non chiede piatti ne' porzioni; confermato vuole l'inizio", () => {
    const a = abb();
    expect(erroriNuovoOrdine(a)).toEqual({});
    expect(porzioniOrdine(a)).toBe(0);
    expect(erroriNuovoOrdine({ ...a, stato: "confirmed" }).date).toMatch(/inizio/);
    expect(erroriNuovoOrdine(conInizio({ ...a, stato: "confirmed" }, "2026-10-05"))).toEqual({});
  });

  it("controlla il prezzo e la consegna anche per l'abbonamento", () => {
    expect(erroriNuovoOrdine({ ...abb(), prezzo: "tanto" }).prezzo).toMatch(/non valido/);
    expect(erroriNuovoOrdine({ ...abb(), modalita: "delivery" })).toMatchObject({ comune: expect.any(String), indirizzo: expect.any(String) });
  });

  it("manda l'inizio in entrambe le date, la scelta della formula e il prezzo, senza piatti", () => {
    const scelto = conSceltaAbbonamento(abb(), { formula: "full6", fascia: "plus", nucleo: "coppia", prova: true });
    const corpo = corpoNuovoOrdine(conInizio(scelto, "2026-10-05"));
    expect(corpo).toMatchObject({
      service: "abbonamento", plan: {}, productionDate: "2026-10-05", fulfillmentDate: "2026-10-05",
      subscription: { plan: "full6", tier: "plus", household: "coppia", trial: true },
      priceCents: 73000, // 811 - 10% (ritiro) = 729,90
    });
    expect(corpo).not.toHaveProperty("meals");
    // Matteo puo' scrivere un altro prezzo, e quello parte
    expect(corpoNuovoOrdine({ ...scelto, prezzo: "700,50" }).priceCents).toBe(70050);
    // senza prezzo parte null: nessun prezzo, non quello proposto di nascosto
    expect(corpoNuovoOrdine({ ...scelto, prezzo: "" }).priceCents).toBeNull();
  });

  it("gli altri servizi non mandano nessuna formula", () => {
    expect(corpoNuovoOrdine({ ...base(), piano: riempiCaselle({}, pollo.id, 1, "lun").piano })).not.toHaveProperty("subscription");
  });

  it("scegliere l'abbonamento non e' toccare il modulo, ma cambiare formula, prova o prezzo si'", () => {
    const vuoto = () => conServizio(campiVuoti("senza-account"), "abbonamento");
    // il prezzo proposto non l'ha scritto Matteo
    expect(moduloToccato(vuoto())).toBe(false);
    expect(moduloToccato(conSceltaAbbonamento(vuoto(), { formula: "full7" }))).toBe(true);
    expect(moduloToccato(conSceltaAbbonamento(vuoto(), { prova: true }))).toBe(true);
    expect(moduloToccato({ ...vuoto(), prezzo: "200" })).toBe(true);
    expect(moduloToccato({ ...vuoto(), prezzo: "468" })).toBe(false); // e' ancora la proposta
    expect(moduloToccato({ ...vuoto(), prezzo: "" })).toBe(true); // l'ha cancellato lui
  });
});

describe("bozza del modulo", () => {
  it("un modulo a meta' torna com'era", () => {
    const campi: CampiNuovoOrdine = { ...campiVuoti(), nome: "Franco", telefono: "333 123 4567", servizio: "home-cooking", porzioni: "6", nota: "cena di compleanno" };
    expect(bozzaOrdineDaTesto(testoBozzaOrdine(campi))).toEqual(campi);
  });

  it("un modulo vuoto non e' una bozza", () => {
    expect(bozzaOrdineDaTesto(testoBozzaOrdine(campiVuoti()))).toBeNull();
  });

  it("completa i campi che una versione vecchia non aveva", () => {
    const vecchio = JSON.stringify({ nome: "Anna", servizio: "menu-settimana" });
    expect(bozzaOrdineDaTesto(vecchio)).toEqual({ ...campiVuoti(), nome: "Anna" });
  });

  it("niente, testo rovinato o forma sbagliata: nessuna bozza", () => {
    expect(bozzaOrdineDaTesto(null)).toBeNull();
    expect(bozzaOrdineDaTesto("")).toBeNull();
    expect(bozzaOrdineDaTesto("{non json")).toBeNull();
    expect(bozzaOrdineDaTesto("null")).toBeNull();
    expect(bozzaOrdineDaTesto(JSON.stringify({ servizio: 3, nome: "x" }))).toBeNull();
    expect(bozzaOrdineDaTesto(JSON.stringify({ servizio: "menu-settimana", nome: 5 }))).toBeNull();
  });
});
