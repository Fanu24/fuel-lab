import { describe, expect, it } from "vitest";
import { eInstallata, tipoDispositivo } from "./dispositivo";

describe("tipoDispositivo", () => {
  it("riconosce iPhone, iPad, Android e computer", () => {
    expect(tipoDispositivo("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1", 5)).toBe("iphone");
    expect(tipoDispositivo("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15", 5)).toBe("iphone"); // iPadOS
    expect(tipoDispositivo("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15", 0)).toBe("computer");
    expect(tipoDispositivo("Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36", 5)).toBe("android");
    expect(tipoDispositivo("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36", 0)).toBe("computer");
  });
});

describe("eInstallata", () => {
  it("installata se aperta come app", () => {
    expect(eInstallata(true, undefined)).toBe(true);
    expect(eInstallata(false, true)).toBe(true);
    expect(eInstallata(false, undefined)).toBe(false);
  });
});
