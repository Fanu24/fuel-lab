import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("getRepository", () => {
  it("sul server spiega che serve il browser invece di esplodere a caso", async () => {
    const { getRepository } = await import("./index");
    expect(() => getRepository()).toThrow(/browser/);
  });

  it("un backend diverso da locale non e ancora collegato", async () => {
    vi.stubEnv("NEXT_PUBLIC_DATA_BACKEND", "supabase");
    const { getRepository } = await import("./index");
    expect(() => getRepository()).toThrow(/backend non ancora collegato/);
  });

  it("nel browser da sempre la stessa istanza", async () => {
    const dati = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => dati.get(k) ?? null,
        setItem: (k: string, v: string) => void dati.set(k, v),
      },
    });
    const { getRepository } = await import("./index");
    const repo = getRepository();
    expect(getRepository()).toBe(repo);
    expect((await repo.elenca()).length).toBeGreaterThan(0);
  });
});
