import { describe, expect, it } from "vitest";
import { PIATTI, EXTRA } from "./catalogo";
import { calcolaStimaNutrizionale, nutrizioneDisponibile, RICETTE_CALCOLABILI, statoNutrizione } from "./nutrizione";

describe("stime nutrizionali documentate", () => {
  it("usa 150 g di riso cotto e non i valori del riso secco", () => {
    expect(calcolaStimaNutrizionale("riso-julien-pollo-teriyaki")).toEqual({
      proteine: 56, carboidrati: 55, grassi: 19, kcal: 615,
    });
    expect(statoNutrizione("riso-julien-pollo-teriyaki").nota).toContain("teriyaki");
  });

  it("mantiene le quantità effettive anche quando la ricetta è calorica", () => {
    expect(calcolaStimaNutrizionale("gnocchetti-sugo-ricotta")).toEqual({
      proteine: 42, carboidrati: 112, grassi: 49, kcal: 1057,
    });
  });

  it("tiene i pesi del calcolo allineati agli ingredienti della ricetta", () => {
    for (const [id, ingredienti] of Object.entries(RICETTE_CALCOLABILI)) {
      const piatto = PIATTI.find((p) => p.id === id)!;
      for (const ingrediente of ingredienti) {
        expect(piatto.ingredienti.find((i) => i.nome === ingrediente.nome)?.grammi, `${id}: ${ingrediente.nome}`).toBe(ingrediente.grammi);
      }
      expect(piatto).toMatchObject(calcolaStimaNutrizionale(id)!);
      expect(statoNutrizione(id).fonti.length).toBeGreaterThan(0);
    }
  });

  it("non pubblica vecchi valori per ricette incomplete o extra senza quantità confermate", () => {
    for (const id of ["noodles-sesamo-maiale", "maiale-senape-spinaci", "pallotte-cacio-ovo", "uova-purgatorio-peperoni", ...EXTRA.map((e) => e.id), "toString", "inesistente"]) {
      expect(nutrizioneDisponibile(id), id).toBe(false);
      expect(calcolaStimaNutrizionale(id), id).toBeNull();
      expect(statoNutrizione(id).stato, id).toBe("da-confermare");
    }
    expect(PIATTI.find((p) => p.id === "uova-purgatorio-peperoni")?.ingredienti.find((i) => i.nome === "Formaggio tipo quark")?.grammi).toBeUndefined();
  });
});
