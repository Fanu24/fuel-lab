"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Rivelazione all'ingresso nel viewport.
 *
 * Non tiene stato React: accende la classe direttamente sul nodo. Aggiungere una
 * classe al DOM e' sincronizzazione con un sistema esterno, cioe' esattamente il
 * lavoro di un effetto, e cosi il componente non ri-renderizza mai.
 *
 * Due dettagli che sembrano pedanteria e non lo sono:
 * 1. se IntersectionObserver non esiste, il contenuto si accende subito invece di
 *    restare invisibile per sempre;
 * 2. l'osservatore si stacca dopo il primo scatto, cosi l'elemento non ri-anima
 *    scorrendo avanti e indietro (era il difetto piu fastidioso dei mockup).
 */
export default function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("in");
      return;
    }

    const io = new IntersectionObserver(
      (voci) => {
        for (const v of voci) {
          if (v.isIntersecting) {
            el.classList.add("in");
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ ["--d" as string]: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
