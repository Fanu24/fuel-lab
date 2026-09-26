"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as PointerEventReact } from "react";
import type { Slot } from "@/lib/settimana";

/* =========================================================================
   Il motore del compositore: prendere un piatto e posarlo in una casella.

   Tre modi di farlo, UN solo stato:
   - col mouse (o la penna) si trascina, con un fantasma che segue il puntatore;
   - col dito si tocca il piatto e poi la casella. Niente trascinamento su
     touch, apposta: sul telefono il dito serve anche a scorrere, e ogni
     libreria di drag che lo contende allo scroll finisce per perdere una
     delle due cose;
   - da tastiera Invio prende e Invio posa, Esc annulla.
   Il tocco e la tastiera sono lo stesso percorso ("presa" senza trascinamento):
   il trascinamento col mouse e' solo un modo piu' veloce di arrivarci.

   Si puo' anche partire dalla casella: toccare una casella vuota apre la
   "ricerca" e il prossimo piatto toccato sul banco va li'.

   Niente librerie: sei piatti e quattordici caselle non hanno bisogno di
   liste ordinabili o virtualizzazione, e il sito non ha dipendenze oltre a
   Next e React.
   ========================================================================= */

export type Presa = { tipo: "banco"; piattoId: string } | { tipo: "slot"; slot: Slot };

export type Stato =
  | { modo: "fermo" }
  | { modo: "presa"; presa: Presa; trascino: boolean; sopra: string | null }
  | { modo: "cerca"; slot: Slot };

export interface Azioni {
  metti: (s: Slot, piattoId: string) => void;
  sposta: (da: Slot, a: Slot) => void;
  togli: (s: Slot) => void;
  annuncia: (testo: string) => void;
  /** testo leggibile per annunci: "Noodles", "lunedì a pranzo" */
  nomePresa: (p: Presa) => string;
  nomeSlot: (s: Slot) => string;
}

export const chiaveSlot = (s: Slot) => `${s.g}-${s.m}`;

function slotDaChiave(k: string): Slot | null {
  const [g, m] = k.split("-");
  return g && m ? ({ g, m } as Slot) : null;
}

/** Dove sta il puntatore: una casella, il banco, o niente. */
function bersaglioIn(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-slot],[data-banco]");
  if (!el) return null;
  return el.dataset.slot ?? "banco";
}

const SOGLIA_PX = 5;

export function useTrascina(az: Azioni) {
  const [stato, setStato] = useState<Stato>({ modo: "fermo" });
  const fantasma = useRef<HTMLDivElement>(null);
  const avvio = useRef<{ x: number; y: number; presa: Presa; id: number } | null>(null);
  const appenaTrascinato = useRef(false);
  // Le azioni cambiano identita' a ogni render del provider: le leggo da un ref
  // cosi' i listener globali non vanno riagganciati a ogni casella riempita.
  const azioni = useRef(az);
  useEffect(() => {
    azioni.current = az;
  });

  const annulla = useCallback(() => setStato({ modo: "fermo" }), []);

  /** Posa quello che si tiene in mano sul bersaglio. */
  const posa = useCallback((presa: Presa, bersaglio: string | null) => {
    const a = azioni.current;
    setStato({ modo: "fermo" });
    if (bersaglio === "banco") {
      if (presa.tipo === "slot") {
        a.togli(presa.slot);
        a.annuncia(`Tolto da ${a.nomeSlot(presa.slot)}.`);
      }
      return;
    }
    const slot = bersaglio ? slotDaChiave(bersaglio) : null;
    if (!slot) return;
    if (presa.tipo === "banco") {
      a.metti(slot, presa.piattoId);
      a.annuncia(`${a.nomePresa(presa)} messo a ${a.nomeSlot(slot)}.`);
    } else if (chiaveSlot(presa.slot) !== chiaveSlot(slot)) {
      a.sposta(presa.slot, slot);
      a.annuncia(`Spostato a ${a.nomeSlot(slot)}.`);
    }
  }, []);

  /* ---- trascinamento col mouse ---- */

  // Lo stato letto dai listener globali. Non dentro un updater di setStato:
  // in sviluppo React chiama gli updater due volte, e un piatto posato due
  // volte e' un piatto spostato e poi rispostato.
  const statoRef = useRef(stato);
  useEffect(() => {
    statoRef.current = stato;
  });

  useEffect(() => {
    function muovi(e: PointerEvent) {
      const av = avvio.current;
      if (!av || e.pointerId !== av.id) return;
      const s = statoRef.current;
      const trascino = s.modo === "presa" && s.trascino;
      if (!trascino && Math.hypot(e.clientX - av.x, e.clientY - av.y) < SOGLIA_PX) return;
      // Il fantasma si muove fuori da React: un render per pixel di mouse
      // renderebbe tutta la griglia sessanta volte al secondo.
      if (fantasma.current) {
        fantasma.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`;
      }
      const sopra = bersaglioIn(e.clientX, e.clientY);
      if (trascino && s.modo === "presa" && s.sopra === sopra) return;
      const prossimo: Stato = { modo: "presa", presa: av.presa, trascino: true, sopra };
      statoRef.current = prossimo;
      setStato(prossimo);
      e.preventDefault(); // niente selezione di testo mentre si trascina
    }
    function rilascia(e: PointerEvent) {
      const av = avvio.current;
      if (!av || e.pointerId !== av.id) return;
      avvio.current = null;
      const s = statoRef.current;
      if (s.modo !== "presa" || !s.trascino) return; // era un click: ci pensa onClick
      // Il click che il browser manda subito dopo il rilascio non deve contare
      // come un secondo gesto. Arriva prima di qualunque timer, quindi basta
      // spegnere la guardia al giro successivo.
      appenaTrascinato.current = true;
      setTimeout(() => {
        appenaTrascinato.current = false;
      }, 0);
      posa(av.presa, e.type === "pointercancel" ? null : bersaglioIn(e.clientX, e.clientY));
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        avvio.current = null;
        setStato({ modo: "fermo" });
      }
    }
    window.addEventListener("pointermove", muovi);
    window.addEventListener("pointerup", rilascia);
    window.addEventListener("pointercancel", rilascia);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointermove", muovi);
      window.removeEventListener("pointerup", rilascia);
      window.removeEventListener("pointercancel", rilascia);
      window.removeEventListener("keydown", esc);
    };
  }, [posa]);

  /** Da mettere su onPointerDown di ogni cosa che si puo' prendere. */
  const inizia = useCallback((presa: Presa) => (e: PointerEventReact) => {
    if (e.pointerType === "touch" || e.button !== 0) return; // il dito fa tocca-e-tocca
    avvio.current = { x: e.clientX, y: e.clientY, presa, id: e.pointerId };
    if (fantasma.current) {
      fantasma.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`;
    }
  }, []);

  /* ---- tocco e tastiera: i click ---- */

  /** Click su un piatto del banco. */
  const tocca = useCallback(
    (piattoId: string) => {
      if (appenaTrascinato.current) return;
      const a = azioni.current;
      const presa: Presa = { tipo: "banco", piattoId };
      if (stato.modo === "cerca") {
        posa(presa, chiaveSlot(stato.slot));
        return;
      }
      if (stato.modo === "presa" && stato.presa.tipo === "slot") {
        // tenevo una casella e tocco il banco: la tolgo
        posa(stato.presa, "banco");
        return;
      }
      if (stato.modo === "presa" && stato.presa.tipo === "banco" && stato.presa.piattoId === piattoId) {
        annulla();
        a.annuncia("Annullato.");
        return;
      }
      setStato({ modo: "presa", presa, trascino: false, sopra: null });
      a.annuncia(`${a.nomePresa(presa)} preso. Scegli una casella, Esc per annullare.`);
    },
    [stato, posa, annulla],
  );

  /** Click su una casella. `piena` dice se c'e' gia' un piatto. */
  const toccaSlot = useCallback(
    (slot: Slot, piena: boolean) => {
      if (appenaTrascinato.current) return;
      const a = azioni.current;
      if (stato.modo === "presa") {
        if (stato.presa.tipo === "slot" && chiaveSlot(stato.presa.slot) === chiaveSlot(slot)) {
          annulla();
          a.annuncia("Annullato.");
          return;
        }
        posa(stato.presa, chiaveSlot(slot));
        return;
      }
      if (stato.modo === "cerca" && chiaveSlot(stato.slot) === chiaveSlot(slot)) {
        annulla();
        return;
      }
      if (piena) {
        setStato({ modo: "presa", presa: { tipo: "slot", slot }, trascino: false, sopra: null });
        a.annuncia(`Piatto di ${a.nomeSlot(slot)} preso. Scegli dove spostarlo, oppure tocca il banco per toglierlo.`);
      } else {
        setStato({ modo: "cerca", slot });
        a.annuncia(`Scegli un piatto per ${a.nomeSlot(slot)}.`);
      }
    },
    [stato, posa, annulla],
  );

  return { stato, fantasma, inizia, tocca, toccaSlot, annulla };
}
