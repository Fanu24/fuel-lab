import { describe, expect, it, vi, afterEach } from "vitest";

describe("whatsapp", () => {
  const originale = process.env.NEXT_PUBLIC_WHATSAPP;
  afterEach(() => {
    process.env.NEXT_PUBLIC_WHATSAPP = originale;
    vi.resetModules();
  });

  it("senza numero non produce un link rotto", async () => {
    process.env.NEXT_PUBLIC_WHATSAPP = "";
    vi.resetModules();
    const { linkWhatsApp, numeroConfigurato } = await import("./whatsapp");
    expect(numeroConfigurato()).toBe(false);
    expect(linkWhatsApp("ciao")).toBeNull();
  });

  it("con il numero costruisce un wa.me valido", async () => {
    process.env.NEXT_PUBLIC_WHATSAPP = "+39 333 123 4567";
    vi.resetModules();
    const { linkWhatsApp } = await import("./whatsapp");
    const l = linkWhatsApp("ciao mondo")!;
    expect(l).toContain("https://wa.me/393331234567");
    expect(l).toContain(encodeURIComponent("ciao mondo"));
  });

  it("ogni servizio ha un testo diverso, cosi si capisce da dove arriva il contatto", async () => {
    const { messaggioServizio } = await import("./whatsapp");
    const a = messaggioServizio("menu-settimana");
    const b = messaggioServizio("home-cooking");
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(20);
  });

  // --- normalizzazione: il punto piu' delicato del task -------------------

  it("un numero italiano con spazi, piu e trattini si normalizza in sole cifre", async () => {
    process.env.NEXT_PUBLIC_WHATSAPP = "+39 333-123 4567";
    vi.resetModules();
    const { linkWhatsApp } = await import("./whatsapp");
    expect(linkWhatsApp("prova")).toContain("https://wa.me/393331234567");
  });

  it("le parentesi vengono tolte come spazi e trattini", async () => {
    process.env.NEXT_PUBLIC_WHATSAPP = "(+39) 333 123 4567";
    vi.resetModules();
    const { linkWhatsApp } = await import("./whatsapp");
    expect(linkWhatsApp("prova")).toContain("https://wa.me/393331234567");
  });

  it("un numero con lettere non e una cifra valida", async () => {
    process.env.NEXT_PUBLIC_WHATSAPP = "+39 33a 123 4567";
    vi.resetModules();
    const { linkWhatsApp, numeroConfigurato } = await import("./whatsapp");
    expect(numeroConfigurato()).toBe(false);
    expect(linkWhatsApp("prova")).toBeNull();
  });

  it("una stringa fatta di soli separatori resta vuota dopo la pulizia", async () => {
    process.env.NEXT_PUBLIC_WHATSAPP = "+ - ( )";
    vi.resetModules();
    const { numeroConfigurato, linkWhatsApp } = await import("./whatsapp");
    expect(numeroConfigurato()).toBe(false);
    expect(linkWhatsApp("prova")).toBeNull();
  });

  it("la variabile assente (non solo vuota) da comunque null", async () => {
    delete process.env.NEXT_PUBLIC_WHATSAPP;
    vi.resetModules();
    const { numeroConfigurato, linkWhatsApp } = await import("./whatsapp");
    expect(numeroConfigurato()).toBe(false);
    expect(linkWhatsApp("prova")).toBeNull();
  });

  // --- messaggioPiano: leggibile su un telefono ----------------------------

  it("messaggioPiano elenca i giorni pieni con primo e secondo e chiude con i macro", async () => {
    vi.resetModules();
    const { messaggioPiano } = await import("./whatsapp");
    const { PRIMI, SECONDI } = await import("./catalogo");
    const { GIORNI } = await import("./settimana");
    const piano: import("./settimana").Piano = {
      [GIORNI[0]]: {
        pranzo: { primo: PRIMI[0].id, secondo: SECONDI[0].id, extra: [] },
      },
    };
    const macro = { kcal: 1500, proteine: 120, carboidrati: 150, grassi: 40 };
    const testo = messaggioPiano(piano, macro, "Luca");

    expect(testo).toContain("Luca");
    expect(testo).toContain(PRIMI[0].nome);
    expect(testo).toContain(SECONDI[0].nome);
    expect(testo).toContain("1500");
    expect(testo).toContain("120");
  });

  it("messaggioPiano senza pasti scelti non lancia e resta leggibile", async () => {
    vi.resetModules();
    const { messaggioPiano } = await import("./whatsapp");
    const macro = { kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 };
    const testo = messaggioPiano({}, macro);
    expect(typeof testo).toBe("string");
    expect(testo.length).toBeGreaterThan(0);
  });

  it("il testo di un servizio sconosciuto e' comunque un contatto sensato, non un errore", async () => {
    vi.resetModules();
    const { messaggioServizio } = await import("./whatsapp");
    const testo = messaggioServizio("id-che-non-esiste");
    expect(typeof testo).toBe("string");
    expect(testo.length).toBeGreaterThan(0);
  });
});
