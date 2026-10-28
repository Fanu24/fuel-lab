"use client";

import { useRef, useState, type FormEvent } from "react";
import { pannelloApi } from "@/lib/api";
import { PIATTI } from "@/lib/catalogo";
import { nomeGiorno, piattiDisponibili, piattoIdDelTesto, type ClienteMatteo, type PastoSettimana } from "@/lib/pannello";
import { Bottone, Errore, Foglio, messaggioDiErrore } from "./ui";

/* Il foglio di una casella (mockup "piatto-libero"): in cima il campo "Scrivi il piatto…" con OK, poi
   "GIÀ FATTI PER …" (i piatti già fatti a questo cliente), poi il menu del sito, poi le porzioni e,
   per una casella piena, Togli. Un tocco su un piatto suggerito salva subito; il testo scritto salva con OK. */

const PORZIONI_MIN = 1;
const PORZIONI_MAX = 20;

export default function FoglioPiatto({ cliente, data, pasto, attuale, recenti, nonDisponibili, chiudi, salvato, tolto }: {
  cliente: ClienteMatteo;
  data: string;
  pasto: "pranzo" | "cena";
  /** Il pasto già in casella, se c'è: il campo parte dal suo testo e le porzioni dal suo numero. */
  attuale: PastoSettimana | null;
  recenti: string[];
  nonDisponibili: string[];
  chiudi: () => void;
  salvato: (p: PastoSettimana) => void;
  tolto: (id: string) => void;
}) {
  const [testo, setTesto] = useState(attuale?.piatto ?? "");
  const [porzioni, setPorzioni] = useState(attuale?.porzioni ?? PORZIONI_MIN);
  const [errore, setErrore] = useState<string | null>(null);
  // Un solo salvataggio alla volta; il salvataggio è un upsert, quindi un doppio tocco non fa danni.
  const inCorso = useRef(false);

  async function scegli(piatto: string, piattoId: string | null) {
    if (inCorso.current) return;
    inCorso.current = true;
    setErrore(null);
    try {
      const { pasto: pastoSalvato } = await pannelloApi.salvaPasto({ clienteId: cliente.id, data, pasto, piatto, piattoId, porzioni });
      salvato(pastoSalvato);
    } catch (e) {
      setErrore(messaggioDiErrore(e));
    } finally {
      inCorso.current = false;
    }
  }

  function scriviTesto(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const piatto = testo.trim();
    if (piatto) void scegli(piatto, piattoIdDelTesto(piatto, PIATTI));
  }

  async function togli() {
    if (!attuale || inCorso.current) return;
    inCorso.current = true;
    setErrore(null);
    try {
      await pannelloApi.togliPasto(attuale.id);
      tolto(attuale.id);
    } catch (e) {
      setErrore(messaggioDiErrore(e));
    } finally {
      inCorso.current = false;
    }
  }

  const menu = piattiDisponibili(PIATTI, nonDisponibili);

  return (
    <Foglio titolo={`${nomeGiorno(data)} · ${pasto === "pranzo" ? "Pranzo" : "Cena"}`} chiudi={chiudi}>
      <form className="pm-cs-campo" onSubmit={scriviTesto}>
        <input type="text" placeholder="Scrivi il piatto…" aria-label="Scrivi il piatto" autoComplete="off" value={testo} onChange={(e) => setTesto(e.target.value)} />
        <Bottone type="submit" variante="verde" disabled={!testo.trim()}>OK</Bottone>
      </form>

      {errore && <Errore messaggio={errore} />}

      {recenti.length > 0 && (
        <section className="pm-cs-gruppo" aria-label={`Già fatti per ${cliente.nome}`}>
          <h3>GIÀ FATTI PER {cliente.nome.toLocaleUpperCase("it-IT")}</h3>
          {recenti.map((r) => (
            <button key={r} type="button" className="pm-cs-piatto" onClick={() => void scegli(r, piattoIdDelTesto(r, PIATTI))}>
              {r}
            </button>
          ))}
        </section>
      )}

      <section className="pm-cs-gruppo" aria-label="Dal menu del sito">
        <h3>DAL MENU DEL SITO</h3>
        {menu.map((p) => (
          <button key={p.id} type="button" className="pm-cs-piatto" onClick={() => void scegli(p.nome, p.id)}>
            {p.nome}
          </button>
        ))}
      </section>

      <div className="pm-cs-porzioni">
        <span>Porzioni</span>
        <div>
          <Bottone className="pm-icona" aria-label="Una porzione in meno" disabled={porzioni <= PORZIONI_MIN} onClick={() => setPorzioni((n) => Math.max(PORZIONI_MIN, n - 1))}>−</Bottone>
          <output aria-live="polite">{porzioni}</output>
          <Bottone className="pm-icona" aria-label="Una porzione in più" disabled={porzioni >= PORZIONI_MAX} onClick={() => setPorzioni((n) => Math.min(PORZIONI_MAX, n + 1))}>+</Bottone>
        </div>
      </div>

      {attuale && <Bottone variante="rosso" onClick={() => void togli()}>Togli</Bottone>}
    </Foglio>
  );
}
