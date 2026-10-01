import { describe, expect, it } from "vitest";
import { LIMITE_SETTIMANA_URL, componiMessaggio, messaggioPiano, type DatiContatto } from "./whatsapp";
import { GIORNI, PASTI, type Piano } from "./settimana";
import { EXTRA, PIATTI } from "./catalogo";
import type { Macros } from "./types";

/* Separati da whatsapp.test.ts solo per tenere i file leggibili: stesso modulo. */

const MACRO_PIENO: Macros = { kcal: 1850, proteine: 140, carboidrati: 180, grassi: 55 };
const CONTATTO_BASE: DatiContatto = {
  nome: "Marco",
  telefono: "347 555 1212",
  comune: "Chieti",
  note: "",
};

describe("gli allenamenti nel messaggio", () => {
  const piano: Piano = {
    lun: { pranzo: { piatto: PIATTI[0].id, extra: [] } },
    mar: { cena: { piatto: PIATTI[1].id, extra: [] } },
  };

  it("mette l'allenamento accanto al giorno", () => {
    const testo = messaggioPiano(piano, MACRO_PIENO, undefined, { lun: "pesi" });
    expect(testo).toContain(`Lunedì · Pesi: pranzo ${PIATTI[0].nome}`);
    expect(testo).toContain(`Martedì: cena ${PIATTI[1].nome}`);
  });

  it("un giorno con allenamento e senza pasti compare lo stesso", () => {
    const testo = messaggioPiano(piano, MACRO_PIENO, undefined, { mer: "riposo" });
    expect(testo).toContain("Mercoledì · Riposo: nessun pasto scelto");
  });

  it("senza allenamenti il testo e identico a prima", () => {
    expect(messaggioPiano(piano, MACRO_PIENO, "Luca", {})).toBe(
      messaggioPiano(piano, MACRO_PIENO, "Luca"),
    );
  });

  it("componiMessaggio passa gli allenamenti alla settimana", () => {
    const msg = componiMessaggio({
      servizioId: "menu-settimana",
      richiedePiano: true,
      piano,
      macro: MACRO_PIENO,
      contatto: CONTATTO_BASE,
      allenamenti: { lun: "cardio" },
    });
    expect(msg).toContain("Lunedì · Cardio: pranzo");
    expect(msg.match(/\?/g)).toHaveLength(1);
  });
});

describe("linkWhatsAppA", () => {
  it("aggiunge il prefisso italiano ai cellulari senza prefisso", async () => {
    const { linkWhatsAppA } = await import("./whatsapp");
    expect(linkWhatsAppA("333 000 0001", "ciao")).toBe("https://wa.me/393330000001?text=ciao");
  });
  it("lascia stare un numero gia' internazionale e rifiuta le lettere", async () => {
    const { linkWhatsAppA } = await import("./whatsapp");
    expect(linkWhatsAppA("+39 333 0000001", "x")).toBe("https://wa.me/393330000001?text=x");
    expect(linkWhatsAppA("33a", "x")).toBeNull();
  });
});

/* =========================================================================
   Il messaggio con la settimana: leggibile e dentro l'indirizzo.
   ========================================================================= */

describe("messaggioPiano: formato e lunghezza", () => {
  const unaCasella = (i: number, extra = 0) => ({ piatto: PIATTI[i % PIATTI.length].id, extra: EXTRA.slice(0, extra).map((e) => e.id) });
  const settimanaPiena = (extra: number): Piano => {
    const p: Piano = {};
    GIORNI.forEach((g, i) => {
      p[g] = {};
      PASTI.forEach((m, j) => {
        p[g]![m] = unaCasella(i + j, extra);
      });
    });
    return p;
  };

  it("separa pranzo e cena con un punto e virgola, perche' le aggiunte hanno gia' una barra nel nome", () => {
    const testo = messaggioPiano(
      { lun: { pranzo: { piatto: PIATTI[0].id, extra: [EXTRA[0].id] }, cena: unaCasella(1) } },
      MACRO_PIENO,
    );
    expect(EXTRA[0].nome).toContain("/");
    expect(testo).toContain(`pranzo ${PIATTI[0].nome} + ${EXTRA[0].nome} (+2,00 €); cena ${PIATTI[1].nome}`);
  });

  it("scrive i totali all'italiana, con il punto delle migliaia e 'g di'", () => {
    const testo = messaggioPiano(piano0(), { kcal: 22290, proteine: 996, carboidrati: 3150, grassi: 634 });
    expect(testo).toContain("Totale settimana: 22.290 kcal, 996 g di proteine, 3150 g di carboidrati, 634 g di grassi.");
  });

  it("una settimana normale resta completa, con il supplemento delle aggiunte", () => {
    const testo = messaggioPiano(settimanaPiena(1), MACRO_PIENO);
    expect(testo).toContain("(+2,00 €)");
    expect(encodeURIComponent(testo).length).toBeLessThanOrEqual(LIMITE_SETTIMANA_URL);
  });

  it("con troppe aggiunte toglie prima i prezzi, poi elenca solo quante sono, e non perde nessun giorno", () => {
    const senzaPrezzi = messaggioPiano(settimanaPiena(2), MACRO_PIENO);
    expect(senzaPrezzi).not.toContain("€");
    expect(senzaPrezzi).toContain(EXTRA[0].nome);

    const sintetico = messaggioPiano(settimanaPiena(9), MACRO_PIENO);
    expect(sintetico).toMatch(/\+ 9 aggiunte/);
    expect(sintetico).not.toContain(EXTRA[0].nome);
    expect(encodeURIComponent(sintetico).length).toBeLessThanOrEqual(LIMITE_SETTIMANA_URL);
    // la settimana completa, anche cosi', ha le sue sette righe e la domanda finale
    for (const g of ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]) expect(sintetico).toContain(`${g}:`);
    expect(sintetico.trim().endsWith("?")).toBe(true);
  });

  it("una sola aggiunta si legge al singolare", () => {
    const tutte = settimanaPiena(9);
    tutte.lun!.pranzo = { piatto: PIATTI[0].id, extra: [EXTRA[0].id] };
    const testo = messaggioPiano(tutte, MACRO_PIENO);
    expect(testo).toContain(`pranzo ${PIATTI[0].nome} + 1 aggiunta;`);
    expect(testo).toContain("+ 9 aggiunte");
  });
});

function piano0(): Piano {
  return { lun: { pranzo: { piatto: PIATTI[0].id, extra: [] } } };
}
