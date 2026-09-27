import { describe, expect, it } from "vitest";
import { impronta, leggiNuovoMessaggio, messaggioDaRiga } from "./contatti";

const corpo = { name: "Luca", email: "luca@example.com", phone: "", comune: "Montesilvano", topic: "consegna", message: "Consegnate anche a Montesilvano?" };

describe("modulo contatti", () => {
  it("accetta un messaggio completo e ripulisce i campi su una riga", () => {
    const esito = leggiNuovoMessaggio({ ...corpo, name: " Luca\r\nBcc: x@y.z ", email: "Luca@Example.com" });
    expect(esito).toMatchObject({ ok: true, bot: false, value: { name: "Luca Bcc: x@y.z", email: "luca@example.com", topic: "consegna" } });
  });

  it("finge un invio riuscito ai bot che riempiono l'esca, prima di ogni altro controllo", () => {
    expect(leggiNuovoMessaggio({ website: "http://spam.example" })).toEqual({ ok: true, bot: true });
  });

  it("vuole un recapito valido: email corretta o telefono con almeno 9 cifre", () => {
    expect(leggiNuovoMessaggio({ ...corpo, email: "" }).ok).toBe(false);
    expect(leggiNuovoMessaggio({ ...corpo, email: "luca@" }).ok).toBe(false);
    expect(leggiNuovoMessaggio({ ...corpo, email: "", phone: "333 12" }).ok).toBe(false);
    expect(leggiNuovoMessaggio({ ...corpo, email: "", phone: "+39 333 123 4567" }).ok).toBe(true);
  });

  it("controlla nome, lunghezza del messaggio, comune e argomento", () => {
    expect(leggiNuovoMessaggio({ ...corpo, name: "" }).ok).toBe(false);
    expect(leggiNuovoMessaggio({ ...corpo, name: "x".repeat(101) }).ok).toBe(false);
    expect(leggiNuovoMessaggio({ ...corpo, message: "ciao" }).ok).toBe(false);
    expect(leggiNuovoMessaggio({ ...corpo, message: "x".repeat(3001) }).ok).toBe(false);
    expect(leggiNuovoMessaggio({ ...corpo, comune: "x".repeat(101) }).ok).toBe(false);
    expect(leggiNuovoMessaggio({ ...corpo, topic: "sconosciuto" })).toMatchObject({ value: { topic: "info" } });
  });

  it("tiene gli a capo del messaggio e toglie i caratteri di controllo", () => {
    const esito = leggiNuovoMessaggio({ ...corpo, message: "Riga uno\r\nRiga due\u0007 fine" });
    expect(esito).toMatchObject({ value: { message: "Riga uno\nRiga due fine" } });
  });

  it("l'impronta dell'IP e' stabile, dipende dal segreto e non contiene l'IP", async () => {
    const a = await impronta("203.0.113.7", "segreto");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await impronta("203.0.113.7", "segreto")).toBe(a);
    expect(await impronta("203.0.113.7", "altro")).not.toBe(a);
  });

  it("dalla riga del database non esce l'impronta IP", () => {
    const m = messaggioDaRiga({ id: "m1", name: "Luca", email: "", phone: "", comune: "", topic: "x", message: "ciao a tutti", status: "new", user_id: null, ip_hash: "abc", created_at: "2026-09-27 10:00:00", updated_at: "2026-09-27 10:00:00" });
    expect(m).not.toHaveProperty("ip_hash");
    expect(m.topic).toBe("info");
  });
});
