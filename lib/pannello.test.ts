import { expect, it } from "vitest";
import type { ClienteMatteo, PastoSettimana } from "./pannello";
import {
  etichetteDelGiorno,
  giorniDellaSettimana,
  linkChiama,
  linkWhatsAppCliente,
  lunediDi,
  meseDi,
  mesePrima,
  nomeGiorno,
  nomeGiornoCorto,
  numeroInternazionale,
  pastiDaOrdine,
  prezzoPastoProposto,
} from "./pannello";

function cliente(id: string, nome: string): ClienteMatteo {
  return { id, nome, telefono: "", indirizzo: "", prezzoPastoCents: null, userId: null, ultimoPasto: null };
}

function pasto(
  id: string,
  clienteId: string,
  data: string,
  pasto: PastoSettimana["pasto"],
  piatto: string,
  porzioni: number,
): PastoSettimana {
  return { id, clienteId, data, pasto, piatto, piattoId: null, porzioni, prezzoCents: null, ordineId: null };
}

it("la settimana comincia di lunedì, anche quando finisce l'ora legale", () => {
  expect(lunediDi("2026-10-25")).toBe("2026-10-19"); // domenica, cambio dell'ora
  expect(lunediDi("2026-10-26")).toBe("2026-10-26");
  expect(lunediDi("2026-10-28")).toBe("2026-10-26");
  expect(giorniDellaSettimana("2026-10-26")).toEqual([
    "2026-10-26",
    "2026-10-27",
    "2026-10-28",
    "2026-10-29",
    "2026-10-30",
    "2026-10-31",
    "2026-11-01",
  ]);
  expect(nomeGiorno("2026-10-28")).toBe("Mercoledì 28");
  expect(nomeGiornoCorto("2026-11-01")).toEqual({ sigla: "Dom", numero: "1" });
});

it("un menu della settimana accettato finisce nei giorni giusti da quando parte", () => {
  const o = {
    id: "o1",
    service: "menu-settimana" as const,
    meals: 3,
    items: [
      { id: "pollo-curry-riso-carote", name: "Pollo al curry, basmati e carote", day: "gio", meal: "pranzo", extras: [] },
      { id: "frittata-verdure-campo", name: "Frittata di verdure di campo", day: "lun", meal: "cena", extras: ["Pane integrale"] },
      { id: "pollo-curry-riso-carote", name: "Pollo al curry, basmati e carote", day: "mar", meal: "pranzo", extras: [] },
    ],
  };
  expect(pastiDaOrdine(o, "2026-10-29", 800, "2026-10-28")).toEqual([
    { data: "2026-10-29", pasto: "pranzo", piatto: "Pollo al curry, basmati e carote", piattoId: "pollo-curry-riso-carote", porzioni: 1, prezzoCents: 800, ordineId: "o1" },
    { data: "2026-11-02", pasto: "cena", piatto: "Frittata di verdure di campo + Pane integrale", piattoId: "frittata-verdure-campo", porzioni: 1, prezzoCents: 800, ordineId: "o1" },
    { data: "2026-11-03", pasto: "pranzo", piatto: "Pollo al curry, basmati e carote", piattoId: "pollo-curry-riso-carote", porzioni: 1, prezzoCents: 800, ordineId: "o1" },
  ]);
  // i pasti di date gia' passate non si mettono
  expect(pastiDaOrdine(o, "2026-10-24", null, "2026-10-28").map((r) => r.data)).toEqual(["2026-10-29"]);
});

it("abbonamento: nessun pasto, li mette Matteo; cuoco a domicilio: una riga evento", () => {
  expect(pastiDaOrdine({ id: "a", service: "abbonamento", items: [], meals: 0 }, "2026-11-02", 800, "2026-10-28")).toEqual([]);
  expect(pastiDaOrdine({ id: "h", service: "home-cooking", items: [], meals: 4 }, "2026-11-07", 2500, "2026-10-28")).toEqual([
    { data: "2026-11-07", pasto: "evento", piatto: "Cuoco a domicilio · 4 porzioni", piattoId: null, porzioni: 1, prezzoCents: 10000, ordineId: "h" },
  ]);
});

it("il prezzo a pasto si propone solo quando si può ricavare", () => {
  expect(prezzoPastoProposto({ service: "abbonamento", price_cents: 52000, meals: 0, subscription: { plan: "completo", tier: "standard", household: "singolo" } })).toBe(800);
  expect(prezzoPastoProposto({ service: "abbonamento", price_cents: 90000, meals: 0, subscription: { plan: "completo", tier: "standard", household: "coppia" } })).toBeNull();
  expect(prezzoPastoProposto({ service: "menu-settimana", price_cents: 5400, meals: 6, subscription: null })).toBe(900);
  expect(prezzoPastoProposto({ service: "menu-settimana", price_cents: null, meals: 6, subscription: null })).toBeNull();
});

it("le etichette del giorno: una per porzione, prima il pranzo, clienti in ordine di nome, niente eventi", () => {
  const clienti = [cliente("c1", "Paolo"), cliente("c2", "Giulia")];
  const pasti = [
    pasto("p1", "c1", "2026-10-28", "cena", "Pollo, peperoni e anacardi", 1),
    pasto("p2", "c1", "2026-10-28", "pranzo", "Pollo al curry", 2),
    pasto("p3", "c2", "2026-10-28", "pranzo", "Frittata", 1),
    pasto("p4", "c2", "2026-10-28", "evento", "Cuoco a domicilio · 4 porzioni", 1),
    pasto("p5", "c2", "2026-10-29", "pranzo", "Altro giorno", 1),
  ];
  expect(etichetteDelGiorno(pasti, clienti, "2026-10-28").map((e) => [e.cliente, e.pasto, e.piatto, e.giorno])).toEqual([
    ["Giulia", "Pranzo", "Frittata", "Mercoledì 28"],
    ["Paolo", "Pranzo", "Pollo al curry", "Mercoledì 28"],
    ["Paolo", "Pranzo", "Pollo al curry", "Mercoledì 28"],
    ["Paolo", "Cena", "Pollo, peperoni e anacardi", "Mercoledì 28"],
  ]);
});

it("i numeri di telefono diventano link giusti, o nessun link", () => {
  for (const t of ["+39 347 123 4567", "0039 347 1234567", "347-1234567", "3471234567"]) expect(numeroInternazionale(t)).toBe("393471234567");
  expect(numeroInternazionale("")).toBeNull();
  expect(numeroInternazionale("abc")).toBeNull();
  expect(linkChiama("347 1234567")).toBe("tel:+393471234567");
  expect(linkWhatsAppCliente("347 1234567", "Paolo")).toBe(`https://wa.me/393471234567?text=${encodeURIComponent("Ciao Paolo, sono Matteo di FUEL LAB.")}`);
  expect(linkWhatsAppCliente("", "Paolo")).toBeNull();
});

it("mesi", () => {
  expect(meseDi("2026-10-28")).toBe("2026-10");
  expect(mesePrima("2026-01")).toBe("2025-12");
});
