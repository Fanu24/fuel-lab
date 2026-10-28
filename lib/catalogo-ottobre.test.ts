import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { EXTRA, PIATTI, getPiatto } from "./catalogo";
import { PIATTI_OTTOBRE } from "./catalogo-ottobre";
import { candidatiPer } from "./autofill";
import { codificaPiano, decodificaPiano } from "./condivisione";
import { nutrizioneDisponibile } from "./nutrizione";
import { allergeniVoce } from "./produzione";
import { leggiNuovoOrdine } from "./server/ordini";
import { nodoPiatto } from "@/components/seo/schema";

const biscotti = EXTRA.find((e) => e.id === "snack-biscotti-avena-mandorle")!;

describe("aggiornamento ricette cliente del 15 ottobre", () => {
  it("mantiene il peso cotto del basmati e distingue la farina per l'impasto", () => {
    expect(getPiatto("pollo-curry-riso-carote")?.ingredienti[0]).toMatchObject({ grammi: 100, nota: "peso cotto" });
    expect(getPiatto("pollo-peperoni-anacardi")?.ingredienti.map((i) => i.grammi)).toEqual([150, 200, 50]);
    expect(getPiatto("frittata-verdure-campo")?.ingredienti).toContainEqual({ nome: "Verdure di campo", grammi: 200 });
    expect(getPiatto("tagliatelle-funghi-ricotta")?.ingredienti[0]).toMatchObject({ grammi: 100, nota: "per l’impasto" });
    expect(getPiatto("piadina-turca")?.ingredienti.find((i) => i.nome === "Pomodori secchi")?.grammi).toBeUndefined();
  });

  it("non scambia l'impasto dei biscotti per una porzione o un prezzo", () => {
    expect(biscotti.ingredienti?.reduce((g, i) => g + (i.grammi ?? 0), 0)).toBe(550);
    expect(biscotti.grammi).toBe(0);
    expect(biscotti.prezzoEuro).toBeNull();
    expect(biscotti.prezzoNota).toBe("su-richiesta");
    expect(nutrizioneDisponibile(biscotti.id)).toBe(false);
  });

  it("ricette senza stima non diventano pasti da zero calorie nelle proposte e nella SEO", () => {
    for (const piatto of PIATTI_OTTOBRE) {
      expect(nutrizioneDisponibile(piatto.id)).toBe(false);
      expect(nodoPiatto(piatto).nutrition).toBeUndefined();
      for (const tipo of ["cardio", "pesi", "riposo"] as const) expect(candidatiPer(tipo).map((p) => p.id)).not.toContain(piatto.id);
    }
  });

  it("porta piatti e biscotti dal link fino alle righe d'ordine e agli allergeni della cucina", () => {
    for (const piatto of PIATTI_OTTOBRE) {
      const plan = { lun: { pranzo: { piatto: piatto.id, extra: [biscotti.id] } } };
      expect(decodificaPiano(codificaPiano(plan))).toEqual(plan);
      const risultato = leggiNuovoOrdine({ name: "QA", phone: "3400000000", comune: "Pescara", fulfillment: "pickup", requestedDate: "2026-10-16", service: "menu-settimana", plan }, "QA", "2026-10-15");
      expect(risultato.ok).toBe(true);
      if (!risultato.ok) continue;
      expect(risultato.value.items[0]).toMatchObject({ id: piatto.id, name: piatto.nome, extras: [biscotti.nome] });
      const allergeni = allergeniVoce(risultato.value.items[0]);
      if (piatto.allergeniDaConfermare) expect(allergeni).toBeNull();
      else expect(allergeni).toEqual(expect.arrayContaining(["glutine", "frutta a guscio"]));
    }
  });

  it("tutti i piatti e il nuovo snack hanno una fotografia locale con le varianti mobile", () => {
    for (const prodotto of [...PIATTI, biscotti]) {
      expect(prodotto.img).toMatch(/^\/foto\/fuel-20261015-v2-.+\.webp$/);
      for (const taglia of ["", "480/", "828/"]) {
        const file = prodotto.img.replace("/foto/", `/foto/${taglia}`);
        expect(existsSync(path.resolve("public", `.${file}`)), file).toBe(true);
      }
    }
  });
});
