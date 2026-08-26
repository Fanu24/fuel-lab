"use client";

import { useEffect, useRef } from "react";

/**
 * Le quattro foto della cucina.
 * 'spinta' e' l'ampiezza in px della parallasse: segni alternati, cosi la striscia
 * si apre e si chiude mentre scorre invece di traslare tutta insieme.
 */
const FOTO = [
  {
    id: "photo-1498837167922-ddd27525d352",
    alt: "Contenitori di meal prep con le porzioni pesate e divise una per una",
    didascalia: "Porzionatura al grammo",
    proporzione: "3 / 4",
    spinta: 26,
    forma: "md:rotate-[-2.4deg] md:mt-[54px]",
  },
  {
    id: "photo-1518843875459-f738682238a6",
    alt: "Verdure crude appoggiate su un fondo nero, prima della cottura",
    didascalia: "Verdure, non contorni",
    proporzione: "1 / 1",
    spinta: -20,
    forma: "md:rotate-[2.1deg]",
  },
  {
    id: "photo-1615937691194-97dbd3f3dc29",
    alt: "Filetti di manzo crudi su un tagliere, la materia prima dei piatti",
    didascalia: "Materia prima",
    proporzione: "4 / 5",
    spinta: 22,
    forma: "md:rotate-[-1.6deg] md:mt-[86px]",
  },
  {
    id: "photo-1505576399279-565b52d4ac71",
    alt: "Insalata composta dentro un barattolo di vetro durante la preparazione",
    didascalia: "Pronto alle sei",
    proporzione: "3 / 4",
    spinta: -26,
    forma: "md:rotate-[1.4deg] md:mt-[22px]",
  },
];

/**
 * Striscia di foto con parallasse discreto.
 *
 * Tre precauzioni che tengono in piedi la cosa:
 * 1. si muove solo mentre la striscia e' davvero in viewport (IntersectionObserver),
 *    cosi lo scroll del resto della pagina non paga niente;
 * 2. un solo requestAnimationFrame in coda alla volta, mai un listener che scrive
 *    nel layout a ogni evento di scroll;
 * 3. chi ha chiesto meno movimento non aggancia proprio l'ascoltatore: le foto
 *    restano ferme e complete, non sparisce nulla.
 */
export default function StrisciaCucina() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const strati = Array.from(el.querySelectorAll<HTMLElement>("[data-plx]"));
    let dentro = false;
    let frame = 0;

    const disegna = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const meta = window.innerHeight / 2;
      // -1 quando la striscia entra dal basso, 0 quando e' centrata, 1 quando esce sopra
      const p = Math.max(-1, Math.min(1, (meta - (r.top + r.height / 2)) / (meta + r.height / 2)));
      for (const s of strati) {
        const f = Number(s.dataset.plx) || 0;
        s.style.transform = `translate3d(0,${(p * f).toFixed(2)}px,0)`;
      }
    };

    const suScroll = () => {
      if (!dentro || frame) return;
      frame = requestAnimationFrame(disegna);
    };

    const io = new IntersectionObserver(
      (voci) => {
        const v = voci[0];
        if (!v) return;
        dentro = v.isIntersecting;
        if (dentro) disegna();
      },
      { rootMargin: "140px 0px" },
    );
    io.observe(el);

    window.addEventListener("scroll", suScroll, { passive: true });
    window.addEventListener("resize", suScroll);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", suScroll);
      window.removeEventListener("resize", suScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={box} className="grid grid-cols-2 gap-5 md:grid-cols-4 md:items-start md:gap-7">
      {FOTO.map((f) => (
        <figure key={f.id} className={f.forma}>
          <div className="shell">
            <div className="core relative" style={{ aspectRatio: f.proporzione }}>
              {/* il livello e' piu alto del nucleo: la traslazione non scopre mai il bordo */}
              <span
                data-plx={f.spinta}
                className="absolute inset-x-0 -top-[9%] block h-[118%]"
                style={{ willChange: "transform" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://images.unsplash.com/${f.id}?w=620&q=80&auto=format&fit=crop`}
                  alt={f.alt}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </span>
            </div>
          </div>
          <figcaption className="note mt-4 block">{f.didascalia}</figcaption>
        </figure>
      ))}
    </div>
  );
}
