import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { creaD1Prova } from "./d1-prova";

let bench: ReturnType<typeof creaD1Prova>;
beforeEach(() => {
  bench = creaD1Prova();
});
afterEach(() => {
  bench.chiudi();
});

describe("finto D1 di creaD1Prova", () => {
  it("batch restituisce per ogni statement la forma D1, con le righe della SELECT", async () => {
    const { env } = bench;
    const risultati = await env.DB.batch([
      env.DB.prepare("INSERT INTO clienti_matteo(id,nome) VALUES (?,?)").bind("b1", "Bruno"),
      env.DB.prepare("SELECT id, nome FROM clienti_matteo WHERE id = ?").bind("b1"),
    ]);
    expect(risultati).toHaveLength(2);
    expect(risultati[0]).toMatchObject({ success: true, meta: { changes: 1 } });
    expect(risultati[1]).toMatchObject({ success: true, meta: { changes: 0 }, results: [{ id: "b1", nome: "Bruno" }] });
  });

  it("INSERT ... RETURNING in batch restituisce la riga inserita e le modifiche", async () => {
    const { env } = bench;
    const [inserito] = await env.DB.batch([
      env.DB.prepare("INSERT INTO clienti_matteo(id,nome) VALUES (?,?) RETURNING id, nome").bind("ret1", "Rita"),
    ]);
    expect(inserito).toMatchObject({ success: true, meta: { changes: 1 }, results: [{ id: "ret1", nome: "Rita" }] });
  });

  it("un statement fallito in batch annulla i precedenti e rilancia l'errore", async () => {
    const { env, sqlite } = bench;
    await expect(env.DB.batch([
      env.DB.prepare("INSERT INTO clienti_matteo(id,nome) VALUES (?,?)").bind("r1", "Uno"),
      env.DB.prepare("INSERT INTO clienti_matteo(id,nome) VALUES (?,?)").bind("r2", "   "),
    ])).rejects.toThrow();
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM clienti_matteo WHERE id = 'r1'").get()?.n).toBe(0);
  });

  it("all e first restituiscono le righe nella stessa forma", async () => {
    const { env } = bench;
    const tutti = await env.DB.prepare("SELECT id FROM user ORDER BY id").all();
    expect(tutti).toMatchObject({ success: true, results: [{ id: "cliente1" }, { id: "matteo" }] });
    const primo = await env.DB.prepare("SELECT id FROM user WHERE id = ?").bind("matteo").first();
    expect(primo).toEqual({ id: "matteo" });
  });
});
