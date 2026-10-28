import { expect, it } from "vitest";
import { adattaNome, dataEtichetta, posizioneEtichetta, vaACapo } from "./etichette-layout";

const misura = (t: string) => t.length * 1.5; // 1,5 mm per carattere
it("le etichette stanno sul foglio A4 in 3 colonne e 7 righe", () => {
  expect(posizioneEtichetta(0, { x: 0, y: 0 })).toEqual({ x: 0, y: 0.45 });
  expect(posizioneEtichetta(4, { x: 0, y: 0 })).toEqual({ x: 70, y: 0.45 + 42.3 });
  expect(posizioneEtichetta(20, { x: 1, y: -0.5 })).toEqual({ x: 141, y: 0.45 + 6 * 42.3 - 0.5 });
});
it("un piatto lungo va a capo su due righe e finisce con i puntini", () => {
  const righe = vaACapo("Pasta integrale, tonno, pomodorini, olive e capperi 200 g, rucola, scaglie di pecorino romano e pepe nero", 63.6, misura, 2);
  expect(righe).toHaveLength(2);
  expect(righe[1].endsWith("…")).toBe(true);
  expect(righe.every((r) => misura(r) <= 63.6)).toBe(true);
  expect(vaACapo("Frittata", 63.6, misura, 2)).toEqual(["Frittata"]);
});
it("un nome lungo si rimpicciolisce, poi si taglia", () => {
  const misuraA = (t: string, mm: number) => t.length * mm * 0.7;
  expect(adattaNome("PAOLO", 63.6, misuraA)).toEqual({ testo: "PAOLO", corpoMm: 6.8 });
  expect(adattaNome("MARIA FRANCESCA", 63.6, misuraA).corpoMm).toBeLessThan(6.8);
  expect(adattaNome("MARIA FRANCESCA DE SANTIS DI GIOVANNANTONIO", 63.6, misuraA).testo.endsWith("…")).toBe(true);
});
it("la data di preparazione per esteso", () => {
  expect(dataEtichetta("2026-10-28")).toBe("28/10/2026");
});
