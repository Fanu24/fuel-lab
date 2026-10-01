import { describe, expect, it } from "vitest";
import { emailValida, impronta, leggiNuovoMessaggio, messaggioDaRiga, reteDi } from "./contatti";

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

  it("un'email con virgole, apici angolari o punti doppi non passa: finirebbe in un Reply-To", () => {
    for (const buona of ["luca@example.com", "luca.rossi+meal@example.co.uk", "l_r-1@sub.esempio.it", "andré@example.it", "a@bücher.it"]) {
      expect(emailValida(buona), buona).toBe(true);
    }
    for (const cattiva of [
      "a@b..it", "a@b.it,c@d.it", "a@b.it;c@d.it", "x<script>@b.it", "Mario <a@b.it>", "a@b.it>", '"a b"@c.it', "a@@b.it", "a@b",
      ".a@b.it", "a.@b.it", "a..b@c.it", "a@-b.it", "a@b-.it", "a@b.i", "a@b.it.", "@b.it", "a@", "a b@c.it", `${"x".repeat(65)}@b.it`, `a@${"x".repeat(250)}.it`,
    ]) {
      expect(emailValida(cattiva), cattiva).toBe(false);
    }
    expect(leggiNuovoMessaggio({ ...corpo, email: "a@b.it,c@d.it" }).ok).toBe(false);
  });

  it("il limite di invii conta la rete: l'IPv4 com'e', l'IPv6 per /64, l'IPv4 dentro un IPv6 come IPv4", () => {
    expect(reteDi("203.0.113.7")).toBe("203.0.113.7");
    expect(reteDi("sconosciuto")).toBe("sconosciuto");
    expect(reteDi("2001:db8:85a3:1:aaaa:bbbb:cccc:dddd")).toBe("2001:db8:85a3:1::/64");
    expect(reteDi("2001:DB8:85A3:0001:1::1")).toBe(reteDi("2001:db8:85a3:1:ffff:ffff:ffff:ffff"));
    expect(reteDi("2001:db8::1")).toBe("2001:db8:0:0::/64");
    expect(reteDi("2001:db8:0:0:0:0:0:2")).toBe("2001:db8:0:0::/64");
    expect(reteDi("[2001:db8::1]")).toBe("2001:db8:0:0::/64");
    expect(reteDi("fe80::1%eth0")).toBe("fe80:0:0:0::/64");
    expect(reteDi("::1")).toBe("0:0:0:0::/64");
    expect(reteDi("::ffff:203.0.113.7")).toBe("203.0.113.7");
    // due case diverse nello stesso /64 hanno la stessa rete, due /64 diversi no
    expect(reteDi("2001:db8:1:1::5")).not.toBe(reteDi("2001:db8:1:2::5"));
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
