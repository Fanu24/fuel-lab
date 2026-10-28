import { expect, it } from "vitest";
import { creaD1Prova } from "./d1-prova";

it("la rubrica, i pasti e le iscrizioni push esistono con i vincoli giusti", () => {
  const { sqlite, chiudi } = creaD1Prova();
  sqlite.exec("INSERT INTO clienti_matteo(id,nome) VALUES ('c1','Paolo')");
  sqlite.exec("INSERT INTO pasti(id,cliente_id,data,pasto,piatto) VALUES ('p1','c1','2026-10-28','pranzo','Pollo al curry')");
  expect(() => sqlite.exec("INSERT INTO pasti(id,cliente_id,data,pasto,piatto) VALUES ('p2','c1','2026-10-28','pranzo','Altro')")).toThrow(); // UNIQUE(cliente_id,data,pasto)
  expect(() => sqlite.exec("INSERT INTO pasti(id,cliente_id,data,pasto,piatto) VALUES ('p3','c1','2026-10-28','colazione','X')")).toThrow();
  expect(() => sqlite.exec("INSERT INTO clienti_matteo(id,nome) VALUES ('c2','  ')")).toThrow();
  expect(sqlite.prepare("SELECT porzioni, prezzo_cents FROM pasti WHERE id='p1'").get()).toEqual({ porzioni: 1, prezzo_cents: null });
  expect(sqlite.prepare("SELECT in_settimana FROM orders LIMIT 0").all()).toEqual([]);
  chiudi();
});
