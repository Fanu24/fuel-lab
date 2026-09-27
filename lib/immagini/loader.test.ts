import { describe, expect, it } from "vitest";
import loader from "./loader";

describe("loader delle immagini", () => {
  it("sceglie la variante piu' piccola che basta", () => {
    expect(loader({ src: "/foto/a.webp", width: 384 })).toBe("/foto/480/a.webp");
    expect(loader({ src: "/foto/a.webp", width: 480 })).toBe("/foto/480/a.webp");
    expect(loader({ src: "/foto/a.webp", width: 640 })).toBe("/foto/828/a.webp");
    expect(loader({ src: "/foto/a.webp", width: 1080 })).toBe("/foto/a.webp");
  });

  it("lascia stare logo, icone e percorsi gia' annidati", () => {
    expect(loader({ src: "/logo-fuellab.png", width: 256 })).toBe("/logo-fuellab.png");
    expect(loader({ src: "/foto/480/a.webp", width: 256 })).toBe("/foto/480/a.webp");
    expect(loader({ src: "https://images.unsplash.com/x", width: 256 })).toBe("https://images.unsplash.com/x");
  });
});
