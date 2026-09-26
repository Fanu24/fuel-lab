import { describe, expect, it, vi, afterEach } from "vitest";
import { componiMessaggio, messaggioServizio, senzaDomandaFinale, senzaSaluto } from "./whatsapp";
import type { DatiContatto } from "./whatsapp";
import { GIORNI } from "./settimana";
import type { Piano } from "./settimana";
import { PIATTI } from "./catalogo";
import type { Macros } from "./types";

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

  it("messaggioPiano elenca i giorni pieni con il piatto e chiude con i macro", async () => {
    vi.resetModules();
    const { messaggioPiano } = await import("./whatsapp");
    const { PIATTI } = await import("./catalogo");
    const { GIORNI } = await import("./settimana");
    const piano: import("./settimana").Piano = {
      [GIORNI[0]]: {
        pranzo: { piatto: PIATTI[0].id, extra: [] },
      },
    };
    const macro = { kcal: 1500, proteine: 120, carboidrati: 150, grassi: 40 };
    const testo = messaggioPiano(piano, macro, "Luca");

    expect(testo).toContain("Luca");
    expect(testo).toContain(PIATTI[0].nome);
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

/* =========================================================================
   componiMessaggio — il messaggio finale che Matteo legge sul telefono.

   Questi test guardano PROPRIETA' del messaggio (una sola domanda, un solo
   saluto, nessun blocco perso, nessuna frase monca), non la presenza di
   frasi scelte a mano: e' il modo in cui una revisione ha gia' trovato un
   difetto in senzaDomandaFinale() che un test "cerca questa stringa" non
   avrebbe mai potuto vedere.
   ========================================================================= */

const MACRO_ZERO: Macros = { kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 };
const MACRO_PIENO: Macros = { kcal: 1850, proteine: 140, carboidrati: 180, grassi: 55 };

const PIANO_VUOTO: Piano = {};
const PIANO_PIENO: Piano = {
  [GIORNI[0]]: {
        pranzo: { piatto: PIATTI[0].id, extra: [] },
  },
};

const CONTATTO_BASE: DatiContatto = {
  nome: "Marco",
  telefono: "347 555 1212",
  comune: "Chieti",
  note: "",
};

/** I tre id reali piu' un id che nessun servizio ha mai avuto: il contratto
 *  di componiMessaggio() vale per entrambi allo stesso modo. */
const SERVIZI_DA_TESTARE = ["menu-settimana", "sui-tuoi-macro", "home-cooking", "id-che-non-esiste"];

describe("componiMessaggio produce sempre esattamente una domanda di chiusura", () => {
  it.each(SERVIZI_DA_TESTARE)("servizioId=%s, senza settimana", (servizioId) => {
    const msg = componiMessaggio({
      servizioId,
      richiedePiano: false,
      piano: PIANO_VUOTO,
      macro: MACRO_ZERO,
      contatto: CONTATTO_BASE,
    });
    expect((msg.match(/\?/g) ?? []).length).toBe(1);
    expect(msg.trim().endsWith("?")).toBe(true);
  });

  it.each(SERVIZI_DA_TESTARE)("servizioId=%s, con settimana richiesta ma ancora vuota", (servizioId) => {
    const msg = componiMessaggio({
      servizioId,
      richiedePiano: true,
      piano: PIANO_VUOTO,
      macro: MACRO_ZERO,
      contatto: CONTATTO_BASE,
    });
    expect((msg.match(/\?/g) ?? []).length).toBe(1);
    expect(msg.trim().endsWith("?")).toBe(true);
  });

  it.each(SERVIZI_DA_TESTARE)("servizioId=%s, con settimana richiesta e composta", (servizioId) => {
    const msg = componiMessaggio({
      servizioId,
      richiedePiano: true,
      piano: PIANO_PIENO,
      macro: MACRO_PIENO,
      contatto: CONTATTO_BASE,
    });
    expect((msg.match(/\?/g) ?? []).length).toBe(1);
    expect(msg.trim().endsWith("?")).toBe(true);
  });
});

describe("componiMessaggio saluta una volta sola", () => {
  it("col nome: il messaggio comincia con 'Ciao Matteo' e la sequenza non si ripete", () => {
    const msg = componiMessaggio({
      servizioId: "sui-tuoi-macro",
      richiedePiano: true,
      piano: PIANO_PIENO,
      macro: MACRO_PIENO,
      contatto: CONTATTO_BASE,
    });
    expect(msg.startsWith("Ciao Matteo")).toBe(true);
    expect(msg.split("Ciao Matteo").length - 1).toBe(1);
  });

  it("senza nome: il messaggio comincia con 'Ciao Matteo' e la sequenza non si ripete", () => {
    const msg = componiMessaggio({
      servizioId: "menu-settimana",
      richiedePiano: true,
      piano: PIANO_PIENO,
      macro: MACRO_PIENO,
      contatto: { ...CONTATTO_BASE, nome: "" },
    });
    expect(msg.startsWith("Ciao Matteo")).toBe(true);
    expect(msg.split("Ciao Matteo").length - 1).toBe(1);
  });
});

describe("senzaDomandaFinale: il guardiano dei testi che non finiscono con '?'", () => {
  // Nessuno di questi testi ha spazi bordo: senzaDomandaFinale() esegue un
  // trim() come primo passo, quindi il confronto "identico carattere per
  // carattere" vale contro l'input cosi' com'e' solo per testi gia' puliti,
  // che e' il caso reale di ogni testo prodotto da messaggioServizio() e
  // messaggioPiano().
  const testiSenzaDomanda = [
    "Un testo che finisce con un punto.",
    "Un blocco\n\ncon piu' paragrafi, ma senza punto interrogativo alla fine.",
    "Ciao Matteo! Ho visto FUEL LAB e vorrei qualche informazione sui vostri servizi.",
    "Un testo che finisce con un punto esclamativo!",
    "x",
  ];

  it.each(testiSenzaDomanda)("torna identico carattere per carattere: %j", (testo) => {
    expect(senzaDomandaFinale(testo)).toBe(testo);
  });
});

describe("senzaDomandaFinale(senzaSaluto(...)) non perde mai il corpo di un servizio reale", () => {
  const idServiziReali = ["menu-settimana", "sui-tuoi-macro", "home-cooking"];

  it.each(idServiziReali)("il corpo di %s resta non vuoto dopo saluto e domanda tolti", (servizioId) => {
    const corpo = senzaDomandaFinale(senzaSaluto(messaggioServizio(servizioId)));
    expect(corpo).not.toBe("");
    expect(corpo.length).toBeGreaterThan(0);
  });
});

describe("i dati di contatto: presenti finiscono nel messaggio, assenti non lasciano frasi monche", () => {
  const VALORI: DatiContatto = {
    nome: "Marco",
    telefono: "347 555 1212",
    comune: "Chieti",
    note: "Vorrei la consegna il lunedi mattina, se possibile.",
  };
  const CAMPI = ["nome", "telefono", "comune", "note"] as const;

  // Tutte le 16 combinazioni di presenza/assenza dei quattro campi: quelle
  // che contano, perche' ognuna esercita un ramo diverso di componiMessaggio().
  for (let mask = 0; mask < 16; mask++) {
    const contatto = {} as DatiContatto;
    const presenti: string[] = [];
    CAMPI.forEach((campo, i) => {
      const presente = (mask & (1 << i)) !== 0;
      contatto[campo] = presente ? VALORI[campo] : "";
      if (presente) presenti.push(campo);
    });

    it(`combinazione [${presenti.join(", ") || "nessun campo"}]`, () => {
      const msg = componiMessaggio({
        servizioId: "home-cooking",
        richiedePiano: false,
        piano: PIANO_VUOTO,
        macro: MACRO_ZERO,
        contatto,
      });

      // niente placeholder rimasti, niente blocco vuoto (mai piu' di una riga
      // vuota fra due blocchi) e niente frase monca senza il suo dato.
      expect(msg).not.toContain("undefined");
      expect(msg).not.toMatch(/\n{3,}/);
      expect(msg).not.toContain("Sono di .");
      expect(msg).not.toMatch(/numero è \./);

      if (contatto.nome) {
        expect(msg).toContain(`Ciao Matteo, sono ${contatto.nome}!`);
      } else {
        expect(msg.startsWith("Ciao Matteo!")).toBe(true);
      }

      if (contatto.comune) expect(msg).toContain(`Sono di ${contatto.comune}.`);
      if (contatto.telefono) expect(msg).toContain(`Il mio numero è ${contatto.telefono}.`);
      if (contatto.note) expect(msg).toContain(contatto.note);
    });
  }
});
