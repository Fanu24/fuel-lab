import { describe, expect, it } from "vitest";
import { componiMessaggio, messaggioPiano, type DatiContatto } from "./whatsapp";
import type { Piano } from "./settimana";
import { PIATTI } from "./catalogo";
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
