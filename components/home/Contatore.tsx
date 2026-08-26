"use client";

import { useEffect, useRef } from "react";

/**
 * Numero che sale quando entra nel viewport.
 *
 * Il valore finale e' gia nel markup renderizzato dal server: senza JavaScript,
 * o con prefers-reduced-motion, la cifra si legge comunque. L'animazione scrive
 * direttamente sul nodo (textContent) invece di passare da uno stato React,
 * cosi 60 frame al secondo non diventano 60 render.
 *
 * La MARCA DI CORSA e' il dettaglio che conta: ogni avvio incrementa il
 * contatore e i frame della corsa precedente si spengono al primo controllo.
 * Senza, due rivelazioni ravvicinate scriverebbero sullo stesso nodo a turno e
 * le cifre si accavallerebbero saltando avanti e indietro.
 */

function formatta(n: number, separatore: boolean): string {
  const v = Math.round(n).toString();
  // separatore delle migliaia fatto a mano: toLocaleString puo divergere fra
  // server e browser e romperebbe l'idratazione proprio su questo nodo.
  return separatore ? v.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : v;
}

export default function Contatore({
  a,
  separatore = false,
  durata = 1500,
  ritardo = 160,
  className = "",
}: {
  /** valore di arrivo */
  a: number;
  separatore?: boolean;
  durata?: number;
  ritardo?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const corsa = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fermo =
      typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (fermo || typeof IntersectionObserver === "undefined") {
      el.textContent = formatta(a, separatore);
      return;
    }

    let frame = 0;
    let vivo = true;

    const parti = () => {
      const mia = ++corsa.current;
      const inizio = performance.now();
      const passo = (ora: number) => {
        // due guardie: lo smontaggio spegne questo effetto, la marca di corsa
        // spegne i frame di un avvio precedente sullo stesso nodo
        if (!vivo || mia !== corsa.current) return;
        const t = Math.min(1, Math.max(0, (ora - inizio - ritardo) / durata));
        // quartica in uscita: parte veloce e si posa, come le barre accanto
        el.textContent = formatta(a * (1 - Math.pow(1 - t, 4)), separatore);
        if (t < 1) frame = requestAnimationFrame(passo);
      };
      frame = requestAnimationFrame(passo);
    };

    el.textContent = formatta(0, separatore);
    const io = new IntersectionObserver(
      (voci) => {
        for (const v of voci) {
          if (v.isIntersecting) {
            io.disconnect();
            parti();
          }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);

    return () => {
      vivo = false; // spegne i frame ancora in volo allo smontaggio
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [a, separatore, durata, ritardo]);

  return (
    <span ref={ref} className={className}>
      {formatta(a, separatore)}
    </span>
  );
}
