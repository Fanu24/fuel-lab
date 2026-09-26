import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { creaStore } from "./storeLocale";

/*
 * Lo store gira in node: localStorage e window sono finti, ma abbastanza veri da
 * provare le tre cose che contano: null contro {}, l'evento dalle altre schede e
 * lo snapshot stabile che useSyncExternalStore pretende.
 */

type Ascoltatore = (e: { key: string | null }) => void;

let dati: Map<string, string>;
let negato: boolean;
let ascoltatori: Set<Ascoltatore>;

beforeEach(() => {
  dati = new Map();
  negato = false;
  ascoltatori = new Set();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => {
      if (negato) throw new Error("negato");
      return dati.get(k) ?? null;
    },
    setItem: (k: string, v: string) => {
      if (negato) throw new Error("negato");
      dati.set(k, v);
    },
  });
  vi.stubGlobal("window", {
    addEventListener: (_: string, f: Ascoltatore) => ascoltatori.add(f),
    removeEventListener: (_: string, f: Ascoltatore) => ascoltatori.delete(f),
  });
});

afterEach(() => vi.unstubAllGlobals());

type Conta = Record<string, number>;
function pota(v: unknown): Conta {
  if (!v || typeof v !== "object") return {};
  return Object.fromEntries(
    Object.entries(v as Record<string, unknown>).filter(([, n]) => typeof n === "number"),
  ) as Conta;
}

function nuovo() {
  return creaStore<Conta>({ chiave: "prova.v1", pota, vuoto: () => ({}) });
}

describe("creaStore", () => {
  it("legge e pota quello che trova in localStorage", () => {
    dati.set("prova.v1", JSON.stringify({ a: 1, b: "no" }));
    expect(nuovo().getSnapshot()).toEqual({ a: 1 });
  });

  it("chiave assente o JSON rotto: letto, e vuoto", () => {
    expect(nuovo().getSnapshot()).toEqual({});
    dati.set("prova.v1", "{rotto");
    expect(nuovo().getSnapshot()).toEqual({});
  });

  it("lo snapshot e stabile fra due letture", () => {
    dati.set("prova.v1", JSON.stringify({ a: 1 }));
    const s = nuovo();
    expect(s.getSnapshot()).toBe(s.getSnapshot());
  });

  it("lo snapshot del server e il sentinella, diverso da ogni valore letto", () => {
    const s = nuovo();
    expect(s.getServerSnapshot()).toBe(s.VUOTO_SSR);
    expect(s.getSnapshot()).not.toBe(s.VUOTO_SSR);
    expect(Object.isFrozen(s.VUOTO_SSR)).toBe(true);
  });

  it("scrivi salva, avvisa gli iscritti e cambia lo snapshot", () => {
    const s = nuovo();
    const f = vi.fn();
    const via = s.subscribe(f);
    s.scrivi({ a: 2 });
    expect(f).toHaveBeenCalledTimes(1);
    expect(s.get()).toEqual({ a: 2 });
    expect(JSON.parse(dati.get("prova.v1") ?? "null")).toEqual({ a: 2 });
    via();
    expect(ascoltatori.size).toBe(0);
  });

  it("storage negato: tiene il valore in memoria invece di azzerarlo", () => {
    const s = nuovo();
    s.subscribe(() => {});
    s.scrivi({ a: 3 });
    negato = true;
    for (const f of ascoltatori) f({ key: "prova.v1" });
    expect(s.get()).toEqual({ a: 3 });
  });

  it("un'altra scheda che svuota la chiave svuota anche questa", () => {
    const s = nuovo();
    const f = vi.fn();
    s.subscribe(f);
    s.scrivi({ a: 4 });
    dati.delete("prova.v1");
    for (const g of ascoltatori) g({ key: "prova.v1" });
    expect(s.get()).toEqual({});
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("ignora gli eventi di altre chiavi", () => {
    const s = nuovo();
    const f = vi.fn();
    s.subscribe(f);
    for (const g of ascoltatori) g({ key: "altra.chiave" });
    expect(f).not.toHaveBeenCalled();
  });
});
