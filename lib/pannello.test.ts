import { expect, it } from "vitest";
import type { ClienteMatteo, PastoSettimana } from "./pannello";
import {
  cercaClienti,
  chiaveRicerca,
  clienteDelOrdine,
  conPasto,
  dataCorta,
  eventiSettimana,
  etichetteDelGiorno,
  grigliaSettimana,
  ordinaClienti,
  piattiDisponibili,
  piattoIdDelTesto,
  prezzoPastoBreve,
  testoCopia,
  giornoDiInizioProposto,
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
  piattiRaggruppati,
  prezzoPastoProposto,
  testoAccettazione,
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
  // numeri fissi (con lo 0 iniziale) e cellulari a 9 cifre
  expect(numeroInternazionale("085 4212345")).toBe("390854212345");
  expect(numeroInternazionale("347 123456")).toBe("39347123456");
  expect(numeroInternazionale("393 1234567")).toBe("393931234567");
  expect(numeroInternazionale("+39 085 4212345")).toBe("390854212345");
  expect(numeroInternazionale("12345")).toBeNull();
  // cellulare scritto con uno 0 davanti in piu'
  expect(numeroInternazionale("0347 1234567")).toBe("393471234567");
  expect(linkChiama("085 4212345")).toBe("tel:+390854212345");
  expect(linkWhatsAppCliente("347 1234567", "Paolo")).toBe(`https://wa.me/393471234567?text=${encodeURIComponent("Ciao Paolo, sono Matteo di FUEL LAB.")}`);
  expect(linkWhatsAppCliente("", "Paolo")).toBeNull();
});

it("mesi", () => {
  expect(meseDi("2026-10-28")).toBe("2026-10");
  expect(mesePrima("2026-01")).toBe("2025-12");
});

it("il giorno proposto è la data richiesta se non è passata, altrimenti oggi", () => {
  expect(giornoDiInizioProposto(null, "2026-10-28")).toBe("2026-10-28");
  expect(giornoDiInizioProposto("2026-10-20", "2026-10-28")).toBe("2026-10-28");
  expect(giornoDiInizioProposto("2026-10-28", "2026-10-28")).toBe("2026-10-28");
  expect(giornoDiInizioProposto("2026-11-03", "2026-10-28")).toBe("2026-11-03");
});

it("i piatti uguali si raggruppano, con gli extra che fanno un piatto a sé", () => {
  expect(piattiRaggruppati([
    { name: "Pollo al curry", extras: [] },
    { name: "Frittata di verdure", extras: [] },
    { name: "Pollo al curry", extras: [] },
    { name: "Pollo al curry", extras: ["riso extra"] },
  ])).toEqual(["2× Pollo al curry", "Frittata di verdure", "Pollo al curry + riso extra"]);
  expect(piattiRaggruppati([])).toEqual([]);
});

it("il cliente di un ordine si trova per account, o per nome e telefono se è inserito a mano", () => {
  const clienti: ClienteMatteo[] = [
    { id: "a", nome: "Francesca Rossi", telefono: "347 123 4567", indirizzo: "", prezzoPastoCents: null, userId: "u1", ultimoPasto: null },
    { id: "b", nome: "Davide Ferri", telefono: "333 987 6543", indirizzo: "", prezzoPastoCents: null, userId: null, ultimoPasto: null },
  ];
  expect(clienteDelOrdine(clienti, { user_id: "u1", customer_name: "Altro nome", phone: "" })?.id).toBe("a");
  expect(clienteDelOrdine(clienti, { user_id: "staff", customer_name: "Davide Ferri", phone: "333 987 6543" })?.id).toBe("b");
  expect(clienteDelOrdine(clienti, { user_id: "staff", customer_name: "Nessuno", phone: "000" })).toBeUndefined();
});

it("il testo dopo un'accettazione dice dove è finito l'ordine e se il prezzo si è perso", () => {
  expect(testoAccettazione("menu-settimana", "in-settimana", false)).toBe("Messo nella settimana: lo trovi qui.");
  expect(testoAccettazione("menu-settimana", "in-settimana", true)).toBe("Messo nella settimana: lo trovi qui.");
  expect(testoAccettazione("abbonamento", "in-settimana", true)).toBe("Accettato: ora riempi la sua settimana.");
  expect(testoAccettazione("menu-settimana", "da-completare", false)).toBe("Accettato. Lo trovi nella settimana.");
  expect(testoAccettazione("menu-settimana", "da-completare", true)).toBe(
    "Accettato. Lo trovi nella settimana. Il prezzo non si è salvato: scrivilo in Altro → I miei clienti.",
  );
  expect(testoAccettazione("abbonamento", "da-completare", false)).toBe("Accettato: ora riempi la sua settimana.");
  expect(testoAccettazione("abbonamento", "da-completare", true)).toBe(
    "Accettato: ora riempi la sua settimana. Il prezzo non si è salvato: scrivilo in Altro → I miei clienti.",
  );
  expect(testoAccettazione("sui-tuoi-macro", "giorno-passato", false)).toBe(
    "Accettato. Il giorno d'inizio era già passato: aggiungi i pasti dalla settimana del cliente.",
  );
  expect(testoAccettazione("sui-tuoi-macro", "giorno-passato", true)).toBe(
    "Accettato. Il giorno d'inizio era già passato: aggiungi i pasti dalla settimana del cliente. Il prezzo non si è salvato: scrivilo in Altro → I miei clienti.",
  );
});

function clienteConUltimo(id: string, nome: string, ultimoPasto: string | null): ClienteMatteo {
  return { ...cliente(id, nome), ultimoPasto };
}

it("i clienti: l'ultimo pasto più recente in cima, quelli senza pasti in fondo, poi per nome", () => {
  const ordinati = ordinaClienti([
    clienteConUltimo("a", "Sara", null),
    clienteConUltimo("b", "Paolo", "2026-10-20"),
    clienteConUltimo("c", "Giulia", "2026-10-27"),
    clienteConUltimo("d", "Marco", null),
    clienteConUltimo("e", "Anna", "2026-10-20"),
  ]);
  expect(ordinati.map((c) => c.nome)).toEqual(["Giulia", "Anna", "Paolo", "Marco", "Sara"]);
});

it("la ricerca ignora accenti e maiuscole, e il testo vuoto mostra tutti", () => {
  const clienti = [cliente("a", "Àngela Ferri"), cliente("b", "Paolo"), cliente("c", "Pietro")];
  expect(chiaveRicerca("  Àngela ")).toBe("angela");
  expect(cercaClienti(clienti, "angel").map((c) => c.id)).toEqual(["a"]);
  expect(cercaClienti(clienti, "PAO").map((c) => c.id)).toEqual(["b"]);
  expect(cercaClienti(clienti, "  ").map((c) => c.id)).toEqual(["a", "b", "c"]);
  expect(cercaClienti(clienti, "zzz")).toEqual([]);
});

it("il piatto del catalogo si collega solo se il testo è identico al suo nome", () => {
  const piatti = [{ id: "pollo-curry", nome: "Pollo al curry" }];
  expect(piattoIdDelTesto("Pollo al curry", piatti)).toBe("pollo-curry");
  expect(piattoIdDelTesto("  Pollo al curry  ", piatti)).toBe("pollo-curry");
  expect(piattoIdDelTesto("Pollo al curry con riso", piatti)).toBeNull();
  expect(piattoIdDelTesto("pollo al curry", piatti)).toBeNull();
});

it("i piatti del menu tolgono quelli non disponibili", () => {
  const piatti = [{ id: "a" }, { id: "b" }, { id: "c" }];
  expect(piattiDisponibili(piatti, ["b", "non-esiste"])).toEqual([{ id: "a" }, { id: "c" }]);
  expect(piattiDisponibili(piatti, [])).toEqual(piatti);
});

it("il prezzo a pasto si scrive come lo scrive Matteo", () => {
  expect(prezzoPastoBreve(1000)).toBe("10 €");
  expect(prezzoPastoBreve(850)).toBe("8,50 €");
  expect(prezzoPastoBreve(1205)).toBe("12,05 €");
  expect(prezzoPastoBreve(0)).toBe("0 €");
});

it("la data corta in italiano", () => {
  expect(dataCorta("2026-10-26")).toBe("26 ott");
  expect(dataCorta("2026-11-01")).toBe("1 nov");
});

it("la griglia: sette giorni dal lunedì, con pranzo e cena o null", () => {
  const pasti = [
    pasto("p1", "a", "2026-10-28", "pranzo", "Riso", 1),
    pasto("p2", "a", "2026-10-29", "cena", "Frittata", 2),
    pasto("p3", "a", "2026-10-29", "evento", "Cuoco a domicilio", 1),
  ];
  const griglia = grigliaSettimana("2026-10-26", pasti);
  expect(griglia.map((c) => c.data)).toEqual([
    "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01",
  ]);
  expect(griglia[0]).toMatchObject({ sigla: "Lun", numero: "26", pranzo: null, cena: null });
  expect(griglia[2].pranzo?.piatto).toBe("Riso");
  expect(griglia[2].cena).toBeNull();
  expect(griglia[3].pranzo).toBeNull();
  expect(griglia[3].cena?.piatto).toBe("Frittata");
});

it("gli eventi sono i pasti di tipo evento, in ordine di data", () => {
  const pasti = [
    pasto("e2", "a", "2026-10-30", "evento", "Cuoco", 1),
    pasto("p1", "a", "2026-10-28", "pranzo", "Riso", 1),
    pasto("e1", "a", "2026-10-27", "evento", "Cuoco", 1),
  ];
  expect(eventiSettimana(pasti).map((p) => p.id)).toEqual(["e1", "e2"]);
});

it("un pasto messo in una casella sostituisce quello che c'era, senza toccare gli altri", () => {
  const pasti = [pasto("p1", "a", "2026-10-28", "pranzo", "Riso", 1), pasto("p2", "a", "2026-10-28", "cena", "Frittata", 1)];
  const nuovo = pasto("p3", "a", "2026-10-28", "pranzo", "Pollo", 2);
  const risultato = conPasto(pasti, nuovo);
  expect(risultato).toHaveLength(2);
  expect(risultato.find((p) => p.pasto === "pranzo")).toEqual(nuovo);
  expect(risultato.find((p) => p.pasto === "cena")?.piatto).toBe("Frittata");
});

it("il testo dopo la copia distingue settimana vuota e caselle già piene", () => {
  expect(testoCopia(1, 1)).toBe("Copiato 1 pasto.");
  expect(testoCopia(4, 6)).toBe("Copiati 4 pasti.");
  expect(testoCopia(0, 0)).toBe("La settimana scorsa era vuota.");
  expect(testoCopia(0, 3)).toBe("Le caselle erano già piene: non ho copiato niente.");
});
