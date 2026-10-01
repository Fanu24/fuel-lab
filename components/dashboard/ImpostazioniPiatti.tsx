"use client";

/* Riquadro "Piatti disponibili": un interruttore grande per piatto. Ogni tocco
   si salva subito, senza bottone: il piatto cambia sotto il dito e, se il
   server dice di no, torna com'era con l'errore. Tocchi veloci uno dopo
   l'altro non si pestano i piedi: parte un salvataggio alla volta, e quello
   dopo porta con se' tutte le scelte fatte nel frattempo. Un piatto spento che
   ha ancora ordini aperti lo dice sulla sua riga: sono clienti da avvisare. */

import Image from "next/image";
import { useRef, useState } from "react";
import { PIATTI, getPiatto } from "@/lib/catalogo";
import { ordiniApertiConPiatto } from "@/lib/impostazioni";
import { usePannello } from "./PannelloDati";
import { alle, EsitoSalvataggio, messaggio, Riquadro, useFuocoSullEsito, type Esito, type Salva } from "./ImpostazioniParti";

type Azione = { testo: string; errore: string };

export default function ImpostazioniPiatti({ esclusi, salva }: { esclusi: string[]; salva: Salva }) {
  const { ordini } = usePannello();
  const [fuori, setFuori] = useState<string[]>(esclusi);
  const [salvando, setSalvando] = useState(false);
  const [esito, setEsito] = useState<Esito>(null);
  const areaEsito = useRef<HTMLDivElement>(null);
  useFuocoSullEsito(esito, areaEsito);

  /* Cio' che Matteo vuole (desiderati) e cio' che il server ha confermato:
     se un salvataggio fallisce si torna all'ultimo confermato. */
  const desiderati = useRef<string[]>(esclusi);
  const confermati = useRef<string[]>(esclusi);
  const inVolo = useRef(false);
  const prossima = useRef<Azione | null>(null);

  async function invia(azione: Azione) {
    if (inVolo.current) {
      prossima.current = azione;
      return;
    }
    inVolo.current = true;
    setSalvando(true);
    let corrente: Azione | null = azione;
    while (corrente) {
      const lista = desiderati.current;
      try {
        const salvate = await salva({ piattiNonDisponibili: lista });
        confermati.current = salvate.piattiNonDisponibili;
        if (desiderati.current === lista) {
          desiderati.current = salvate.piattiNonDisponibili;
          setFuori(salvate.piattiNonDisponibili);
        }
        setEsito({ tipo: "ok", testo: `${corrente.testo} Salvato alle ${alle()}: sul sito entro un minuto.` });
      } catch (e) {
        desiderati.current = confermati.current;
        setFuori(confermati.current);
        prossima.current = null;
        const motivo = messaggio(e);
        setEsito({ tipo: "errore", testo: `${corrente.errore} ${motivo}${/[.!?]$/.test(motivo) ? "" : "."}` });
      }
      corrente = prossima.current;
      prossima.current = null;
    }
    inVolo.current = false;
    setSalvando(false);
  }

  function alterna(id: string) {
    const nome = getPiatto(id)?.nome ?? "Il piatto";
    const toglie = !desiderati.current.includes(id);
    desiderati.current = toglie ? [...desiderati.current, id] : desiderati.current.filter((x) => x !== id);
    setFuori(desiderati.current);
    void invia({
      testo: toglie ? `${nome}: non disponibile questa settimana.` : `${nome}: di nuovo disponibile.`,
      errore: `Non ho salvato ${nome}, è rimasto ${toglie ? "disponibile" : "non disponibile"}:`,
    });
  }

  function tuttiDisponibili() {
    desiderati.current = [];
    setFuori([]);
    void invia({ testo: "Tutti i piatti sono di nuovo disponibili.", errore: "Non ho salvato, i piatti sono rimasti com’erano:" });
  }

  const disponibili = PIATTI.length - fuori.length;

  return (
    <Riquadro
      id="piatti"
      titolo="Piatti disponibili"
      sotto="Spegni un piatto che questa settimana non cucini: sul sito resta visibile, ma non si può scegliere. Ogni interruttore si salva da solo."
      piede={
        <>
          <p className="pn-imp-conto">
            <span className="num">{disponibili}</span> su <span className="num">{PIATTI.length}</span> disponibili
            {salvando ? <span className="pn-imp-salvo"> · salvo…</span> : null}
          </p>
          {fuori.length ? (
            <button type="button" className="pn-tasto" onClick={tuttiDisponibili}>
              Rendi tutti disponibili
            </button>
          ) : null}
        </>
      }
    >
      <ul className="pn-imp-piatti">
        {PIATTI.map((p) => {
          const disponibile = !fuori.includes(p.id);
          const aperti = disponibile || !ordini ? 0 : ordiniApertiConPiatto(ordini, p.id).ordini;
          return (
            <li key={p.id}>
              <button
                type="button"
                role="switch"
                aria-checked={disponibile}
                className="pn-switch pn-imp-piatto"
                onClick={() => alterna(p.id)}
              >
                <span className="pn-imp-foto">
                  <Image src={p.img} alt="" fill sizes="64px" className="object-cover" />
                </span>
                <span className="pn-imp-piatto-testo">
                  <span className="pn-imp-piatto-nome">{p.nome}</span>
                  <span className="pn-imp-piatto-stato">
                    {disponibile ? "Disponibile" : "Non disponibile questa settimana"}
                    {aperti ? ` · ancora in ${aperti} ${aperti === 1 ? "ordine aperto" : "ordini aperti"}: avvisa i clienti` : ""}
                  </span>
                </span>
                <span className="pn-switch-binario" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
      <EsitoSalvataggio ref={areaEsito} esito={esito} />
    </Riquadro>
  );
}
