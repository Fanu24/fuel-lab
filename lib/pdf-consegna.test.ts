import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { consegnaPdf } from "./pdf-consegna";

const file = new File(["%PDF"], "etichette-2026-11-02.pdf", { type: "application/pdf" });
const URL_PDF = "blob:https://fuelchef.it/abc";

let navigatore: { canShare?: ReturnType<typeof vi.fn>; share?: ReturnType<typeof vi.fn> };
let apri: ReturnType<typeof vi.fn>;

beforeEach(() => {
  navigatore = {};
  apri = vi.fn(() => ({}));
  vi.stubGlobal("navigator", navigatore);
  vi.stubGlobal("window", { open: apri });
});
afterEach(() => vi.unstubAllGlobals());

describe("consegnaPdf", () => {
  it("se il telefono sa condividere file, apre il foglio di condivisione e non una scheda", async () => {
    navigatore.canShare = vi.fn(() => true);
    navigatore.share = vi.fn(async () => {});

    expect(await consegnaPdf(file, URL_PDF)).toBe("fatto");

    expect(navigatore.share).toHaveBeenCalledWith({ files: [file], title: file.name });
    expect(apri).not.toHaveBeenCalled();
  });

  it("la condivisione parte nello stesso istante del tocco, senza aspettare niente prima", () => {
    navigatore.canShare = vi.fn(() => true);
    navigatore.share = vi.fn(async () => {});

    void consegnaPdf(file, URL_PDF);

    expect(navigatore.share).toHaveBeenCalledTimes(1);
  });

  it("chi annulla la condivisione non vede errori né schede", async () => {
    navigatore.canShare = vi.fn(() => true);
    navigatore.share = vi.fn(async () => { throw new DOMException("annullato", "AbortError"); });

    expect(await consegnaPdf(file, URL_PDF)).toBe("fatto");
    expect(apri).not.toHaveBeenCalled();
  });

  it("senza condivisione di file apre il PDF in una scheda nuova", async () => {
    navigatore.canShare = vi.fn(() => false);

    expect(await consegnaPdf(file, URL_PDF)).toBe("fatto");

    expect(apri).toHaveBeenCalledWith(URL_PDF, "_blank");
  });

  it("senza canShare (browser vecchio) apre una scheda", async () => {
    expect(await consegnaPdf(file, URL_PDF)).toBe("fatto");
    expect(apri).toHaveBeenCalledWith(URL_PDF, "_blank");
  });

  it("se la condivisione fallisce per un altro motivo prova la scheda", async () => {
    navigatore.canShare = vi.fn(() => true);
    navigatore.share = vi.fn(async () => { throw new DOMException("gesto scaduto", "NotAllowedError"); });

    expect(await consegnaPdf(file, URL_PDF)).toBe("fatto");
    expect(apri).toHaveBeenCalledWith(URL_PDF, "_blank");
  });

  it("se il browser blocca anche la scheda risponde `link`, da mostrare come «Apri il PDF»", async () => {
    apri.mockReturnValue(null);

    expect(await consegnaPdf(file, URL_PDF)).toBe("link");
  });
});
