import { describe, expect, it } from "vitest";
import { IMPRONTA_CATALOGO, codificaPiano, decodificaPiano, linkPiano } from "./condivisione";
import { PIATTI, EXTRA } from "./catalogo";
import type { Piano } from "./piano";

const pieno: Piano = {
  lun: { pranzo: { piatto: PIATTI[0].id, extra: [EXTRA[0].id] },
         cena: { piatto: PIATTI[1].id, extra: [] } },
  gio: { pranzo: { piatto: PIATTI[2].id, extra: [] } },
};

describe("condivisione", () => {
  it("fa il round trip senza perdere nulla", () => {
    expect(decodificaPiano(codificaPiano(pieno))).toEqual(pieno);
  });

  it("gestisce il piano vuoto con il sentinella", () => {
    expect(codificaPiano({})).toBe("-");
    expect(decodificaPiano("-")).toEqual({});
  });

  it("restituisce null su stringa malformata invece di lanciare", () => {
    expect(decodificaPiano("!!!non-valido!!!")).toBeNull();
    expect(decodificaPiano("")).toBeNull();
  });

  it("scarta gli id non piu in catalogo", () => {
    const s = codificaPiano({ lun: { pranzo: { piatto: "sparito", extra: [] } } });
    expect(decodificaPiano(s)).toEqual({});
  });

  it("resta sotto i 2000 caratteri con la settimana piena", () => {
    const max: Piano = {};
    for (const g of ["lun","mar","mer","gio","ven","sab","dom"] as const)
      max[g] = { pranzo: { piatto: PIATTI[0].id, extra: EXTRA.map(e => e.id) },
                 cena:   { piatto: PIATTI[1].id, extra: EXTRA.map(e => e.id) } };
    expect(linkPiano(max, "https://fuellab.vercel.app").length).toBeLessThan(2000);
  });
});

function settimanaPiena(): Piano {
  const max: Piano = {};
  for (const g of ["lun", "mar", "mer", "gio", "ven", "sab", "dom"] as const) {
    max[g] = {
      pranzo: { piatto: PIATTI[0].id, extra: EXTRA.map((e) => e.id) },
      cena: { piatto: PIATTI[1].id, extra: EXTRA.map((e) => e.id) },
    };
  }
  return max;
}

function corpoDi(s: string): string {
  return s.slice(s.indexOf("~") + 1);
}

describe("impronta del catalogo", () => {
  it("mette l'impronta in testa a ogni link non vuoto", () => {
    expect(codificaPiano(pieno).startsWith(`${IMPRONTA_CATALOGO}~`)).toBe(true);
  });

  it("rifiuta un link nato da un catalogo diverso invece di interpretarlo", () => {
    const buono = codificaPiano(pieno);
    const manomesso = `1z-altromenu~${corpoDi(buono)}`;
    expect(decodificaPiano(manomesso)).toBeNull();
    expect(decodificaPiano(buono)).toEqual(pieno);
  });

  it("rifiuta anche il link senza impronta del tutto", () => {
    expect(decodificaPiano(corpoDi(codificaPiano(pieno)))).toBeNull();
  });

  it("il piano vuoto non porta impronta: non contiene riferimenti al catalogo", () => {
    expect(codificaPiano({})).toBe("-");
    expect(decodificaPiano("-")).toEqual({});
  });
});

describe("input malformato", () => {
  it("torna null su ogni forma che non e uno dei suoi link", () => {
    const corpo = corpoDi(codificaPiano(pieno));
    const casi = [
      "",
      "   ",
      "!!!non-valido!!!",
      "-x",
      "~",
      "~~~",
      corpo,
      `${IMPRONTA_CATALOGO}~`,
      `${IMPRONTA_CATALOGO}~${corpo.slice(1)}`,
      `${IMPRONTA_CATALOGO}~${corpo}0`,
      `${IMPRONTA_CATALOGO}~${corpo}~${corpo}`,
      `${IMPRONTA_CATALOGO}~${"*".repeat(corpo.length)}`,
      `${IMPRONTA_CATALOGO}~${"%".repeat(corpo.length)}`,
    ];
    for (const s of casi) expect(decodificaPiano(s)).toBeNull();
  });

  it("non lancia mai, qualunque spazzatura riceva", () => {
    const spazzatura = ["%", "%%%", "\u0000", "\uD800", "a".repeat(5000), "~".repeat(500)];
    for (const s of spazzatura) {
      expect(() => decodificaPiano(s)).not.toThrow();
      expect(decodificaPiano(s)).toBeNull();
    }
  });

  it("scarta in silenzio un indice fuori intervallo invece di rifiutare il link", () => {
    const buono = codificaPiano(pieno);
    const taglio = buono.indexOf("~") + 1;
    const storto = `${buono.slice(0, taglio)}z${buono.slice(taglio + 1)}`;
    const p = decodificaPiano(storto);
    expect(p).not.toBeNull();
    expect(p?.lun?.pranzo?.piatto).toBeUndefined();
  });

  it("sopravvive agli spazi che un client di posta puo aggiungere attorno al link", () => {
    expect(decodificaPiano(`  ${codificaPiano(pieno)}  `)).toEqual(pieno);
    expect(decodificaPiano(codificaPiano(pieno).toUpperCase())).toEqual(pieno);
  });
});

describe("forma del link", () => {
  it("punta alla pagina della settimana e si rilegge dalla query string", () => {
    const l = linkPiano(pieno, "https://fuellab.vercel.app");
    expect(l.startsWith("https://fuellab.vercel.app/settimana?p=")).toBe(true);
    expect(decodificaPiano(new URL(l).searchParams.get("p") ?? "")).toEqual(pieno);
  });

  it("non raddoppia la barra se l'origine ne ha gia una", () => {
    expect(linkPiano(pieno, "https://fuellab.vercel.app/")).toBe(
      linkPiano(pieno, "https://fuellab.vercel.app"),
    );
  });

  it("non ha bisogno di percent-encoding nemmeno nel caso peggiore", () => {
    const s = codificaPiano(settimanaPiena());
    expect(encodeURIComponent(s)).toBe(s);
  });

  it("lo stesso piano da sempre lo stesso link, anche con dentro id morti", () => {
    const conMorto: Piano = {
      ...pieno,
      ven: { cena: { piatto: "piatto-sparito", extra: ["boh"] } },
    };
    expect(codificaPiano(conMorto)).toBe(codificaPiano(pieno));
  });

  it("regge il round trip della settimana piena", () => {
    const max = settimanaPiena();
    expect(decodificaPiano(codificaPiano(max))).toEqual(max);
  });
});

describe("maschera degli extra", () => {
  it("ignora i bit oltre l'ultimo extra invece di inventare un id", () => {
    const spento = corpoDi(codificaPiano({ lun: { pranzo: { piatto: PIATTI[0].id, extra: [] } } }));
    const acceso = corpoDi(
      codificaPiano({ lun: { pranzo: { piatto: PIATTI[0].id, extra: EXTRA.map((e) => e.id) } } }),
    );
    const diversi = [...spento].map((c, i) => (c === acceso[i] ? -1 : i)).filter((i) => i >= 0);
    expect(diversi.length).toBeGreaterThan(0);

    const inizio = diversi[0];
    const fine = diversi[diversi.length - 1];
    const zeta = "z".repeat(fine - inizio + 1);
    const gonfia =
      IMPRONTA_CATALOGO + "~" + spento.slice(0, inizio) + zeta + spento.slice(fine + 1);

    const p = decodificaPiano(gonfia);
    expect(p).not.toBeNull();
    expect(p?.lun?.pranzo?.piatto).toBe(PIATTI[0].id);
    const ids = p?.lun?.pranzo?.extra ?? [];
    expect(ids.length).toBeGreaterThan(0);
    const veri = new Set(EXTRA.map((e) => e.id));
    for (const id of ids) expect(veri.has(id)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
