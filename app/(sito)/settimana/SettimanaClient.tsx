"use client";

import { useEffect, useMemo, useState } from "react";
import { getPiatto } from "@/lib/catalogo";
import { riempiSettimana, sostituisciEsclusi } from "@/lib/autofill";
import { caselleEscluse } from "@/lib/impostazioni";
import { CASELLE_TOTALI, GIORNI, NOMI_GIORNO, usePiano, type Allenamenti, type Piano, type Slot } from "@/lib/piano";
import { riepilogoSettimana } from "@/lib/riepilogo";
import { useTrascina, type Presa } from "@/components/compositore/useTrascina";
import { useLinkCondiviso } from "@/components/compositore/useLinkCondiviso";
import PianificaAllenamenti from "@/components/compositore/PianificaAllenamenti";
import Banco from "@/components/compositore/Banco";
import Griglia from "@/components/compositore/Griglia";
import FoglioExtra from "@/components/compositore/FoglioExtra";
import BarraSettimana, { type Annullabile } from "@/components/compositore/BarraSettimana";
import AvvisoLink from "@/components/compositore/AvvisoLink";
import { usePiattiNonDisponibili } from "@/components/impostazioni/useImpostazioni";

/* Il compositore: 1) come ti alleni, 2) la settimana si riempie, 3) la
   ritocchi trascinando. La pagina tiene insieme i pezzi, la logica sta in
   lib/autofill (chi va dove), lib/piano (lo stato) e useTrascina (i gesti).
   Il titolo sta in page.tsx: e' l'unica parte che non dipende dal browser. */

/** Quanto resta in barra la riga con "Annulla" dopo un cambiamento grosso. */
const SECONDI_ANNULLA = 12;

/** `piano` assente: solo un avviso nella riga, senza niente da annullare. */
type Fotografia = { testo: string; piano?: Piano; allenamenti?: Allenamenti; vai?: boolean };

export default function SettimanaClient() {
  const p = usePiano();
  const { piano, allenamenti, pronto, pasti } = p;
  const [pastiAlGiorno, setPastiAlGiorno] = useState<1 | 2>(2);
  const [giro, setGiro] = useState(0);
  const [extraDi, setExtraDi] = useState<Slot | null>(null);
  const [annuncio, setAnnuncio] = useState("");
  const [foto, setFoto] = useState<Fotografia | null>(null);
  const link = useLinkCondiviso();
  // I piatti che Matteo questa settimana non cucina (impostazioni del pannello).
  const esclusi = usePiattiNonDisponibili();

  /* Lo stesso annuncio due volte di fila non cambia il testo, e un lettore di schermo
     non rilegge cio' che non cambia: si alterna con uno spazio che non si vede. */
  const annuncia = (testo: string) => setAnnuncio((prima) => (prima === testo ? `${testo}\u00a0` : testo));

  const nomeSlot = (s: Slot) => `${NOMI_GIORNO[s.g].toLowerCase()}, ${s.m}`;
  const nomePresa = (x: Presa) =>
    x.tipo === "banco" ? (getPiatto(x.piattoId)?.nome ?? "Piatto") : `Il piatto di ${nomeSlot(x.slot)}`;

  /* ---- annulla ----
     Prima di ogni cambiamento che butta via del lavoro (riempire sopra a una settimana
     fatta a mano, svuotare, togliere un piatto) si tiene una fotografia della settimana:
     in barra compare "Annulla" per qualche secondo. Qualunque altra modifica la
     invalida, cosi' "Annulla" non cancella mai piu' di quello che ha appena annunciato. */
  function ricorda(testo: string, vai = false) {
    // la riga in barra e' una regione "status": la annuncia lei, senza coprire gli annunci dei gesti
    setFoto({ testo, piano, allenamenti, vai });
  }
  const lascia = () => setFoto(null);
  useEffect(() => {
    if (!foto) return;
    const t = window.setTimeout(() => setFoto(null), SECONDI_ANNULLA * 1000);
    return () => window.clearTimeout(t);
  }, [foto]);

  function annullaUltimo() {
    if (!foto?.piano) return;
    p.sostituisciPiano(foto.piano);
    p.sostituisciAllenamenti(foto.allenamenti ?? {});
    setFoto(null);
    annuncia("Annullato: la settimana è tornata com'era.");
  }

  const annullabile: Annullabile | null = foto
    ? {
        testo: foto.testo,
        annulla: foto.piano ? annullaUltimo : undefined,
        vai: foto.vai ? () => document.querySelector(".griglia")?.scrollIntoView({ block: "start" }) : undefined,
        chiudi: () => setFoto(null),
      }
    : null;

  const { stato, fantasma, inizia, tocca, toccaSlot } = useTrascina({
    metti: (s, id) => {
      if (piano[s.g]?.[s.m]?.piatto) ricorda(`Piatto di ${nomeSlot(s)} sostituito.`);
      else lascia();
      p.metti(s.g, s.m, id);
    },
    sposta: (da, a) => {
      lascia();
      p.sposta(da, a);
    },
    togli: (s) => togli(s),
    annuncia,
    nomePresa,
    nomeSlot,
  });

  function togli(s: Slot) {
    ricorda(`Tolto il piatto di ${nomeSlot(s)}.`);
    p.svuotaCasella(s.g, s.m);
  }

  const r = useMemo(() => riepilogoSettimana(piano), [piano]);
  const giorniScelti = Object.keys(allenamenti).length;
  const fuori = useMemo(() => (pronto ? caselleEscluse(piano, esclusi) : []), [pronto, piano, esclusi]);

  function riempi(sovrascrivi: boolean, rimescola = giro, altra = false) {
    const proposta = riempiSettimana(piano, allenamenti, { pastiAlGiorno, sovrascrivi, rimescola, esclusi });
    const n = riepilogoSettimana(proposta).pasti;
    if (n === 0) {
      // tutti i piatti sono segnati non disponibili: non c'e' niente da mettere, e non si deve far credere il contrario
      setFoto({ testo: "Nessun piatto è disponibile questa settimana: Matteo non li sta cucinando." });
      return;
    }
    const testo = altra ? "Altra proposta pronta" : pasti > 0 ? "Settimana rifatta" : "Settimana riempita";
    // anche da vuota, dove non c'e' niente da perdere, si dice cosa e' successo e dov'e': il risultato sta sotto lo schermo
    ricorda(`${testo}: ${n} ${n === 1 ? "pasto" : "pasti"}.`, true);
    p.riempi(proposta);
  }

  function sostituisci() {
    ricorda(fuori.length === 1 ? "Piatto sostituito con uno disponibile." : "Piatti sostituiti con altri disponibili.");
    p.riempi(sostituisciEsclusi(piano, allenamenti, esclusi, giro));
  }

  function svuota() {
    ricorda("Settimana svuotata.");
    p.svuota();
    // il bottone "Svuota" si spegne a settimana vuota: il fuoco va dove si puo' tornare indietro
    requestAnimationFrame(() => document.getElementById("annulla-azione")?.focus());
  }

  async function copiaLink() {
    const esito = await link.copia();
    annuncia(esito === "si" ? "Link copiato negli appunti." : "Copia il link dal campo qui sotto.");
  }

  return (
    <>
      <AvvisoLink link={link} />

      <section className="pb-12">
        <div className="wrap">
          <div className="border-t-[3px] border-ink pt-8">
            <PianificaAllenamenti
              allenamenti={allenamenti}
              imposta={(g, t) => {
                lascia();
                p.impostaAllenamento(g, t);
              }}
              applica={(a) => {
                lascia();
                p.sostituisciAllenamenti(a);
              }}
              pastiAlGiorno={pastiAlGiorno}
              setPastiAlGiorno={setPastiAlGiorno}
            />
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <button
                type="button"
                className="btn btn-ink"
                disabled={!pronto || giorniScelti === 0}
                onClick={() => riempi(pasti > 0)}
              >
                {pasti > 0 ? "Riempi di nuovo" : "Riempi la settimana"} <span className="freccia">→</span>
              </button>
              {pasti > 0 ? (
                <button
                  type="button"
                  className="link"
                  disabled={giorniScelti === 0}
                  onClick={() => {
                    const g = giro + 1;
                    setGiro(g);
                    riempi(true, g, true);
                  }}
                >
                  Altre proposte
                </button>
              ) : null}
              <p className="text-sm text-muted">
                {giorniScelti === 0
                  ? (
                    <>
                      Scegli almeno un giorno, oppure{" "}
                      <a href="#passo-2" className="link">
                        componi la settimana a mano
                      </a>
                      .
                    </>
                  )
                  : pasti > 0
                    ? "Riempi di nuovo rifà i giorni con un allenamento: puoi sempre annullare."
                    : "Cardio: più carboidrati. Pesi: proteine e carboidrati misurati. Riposo: più leggero."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="wrap">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-t-[3px] border-ink pt-8">
            <div id="passo-2">
              <p className="occhiello">Passo 2</p>
              <h2 className="titolo-s mt-3">Sistemala come vuoi.</h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <button type="button" className="link" onClick={copiaLink} disabled={pasti === 0}>
                {link.copiato === "si" ? "Link copiato" : "Manda al nutrizionista"}
              </button>
              <button type="button" className="link" onClick={svuota} disabled={pasti === 0}>
                Svuota
              </button>
            </div>
          </div>
          {link.copiato === "manuale" ? (
            <p className="mb-6 text-sm">
              Copia il link a mano:{" "}
              <input
                readOnly
                value={link.url}
                aria-label="Link della tua settimana"
                className="num w-full border-2 border-ink/15 p-2 text-xs"
                onFocus={(e) => e.target.select()}
              />
            </p>
          ) : null}

          {fuori.length ? (
            <div role="status" className="avviso-esclusi mb-6">
              <p className="min-w-[16rem] flex-1">
                <strong>
                  {fuori.length === 1
                    ? "Un piatto della tua settimana non è disponibile"
                    : `${fuori.length} piatti della tua settimana non sono disponibili`}
                </strong>{" "}
                questa settimana: {fuori.map((c) => `${getPiatto(c.piattoId)?.nome ?? "piatto"} (${nomeSlot(c)})`).join(", ")}.{" "}
                {fuori.length === 1 ? "Sostituiscilo con un altro" : "Sostituiscili con altri"} prima di inviare la settimana a Matteo.
              </p>
              <button type="button" className="btn btn-ink btn-sm" onClick={sostituisci}>
                {fuori.length === 1 ? "Sostituiscilo" : "Sostituiscili"}
              </button>
            </div>
          ) : null}

          <div className="tavolo">
            <Banco
              stato={stato}
              inizia={inizia}
              tocca={tocca}
              destinazione={stato.modo === "cerca" ? nomeSlot(stato.slot) : undefined}
              esclusi={esclusi}
              annuncia={annuncia}
            />
            <Griglia
              piano={piano}
              allenamenti={allenamenti}
              pastiAlGiorno={pastiAlGiorno}
              stato={stato}
              inizia={inizia}
              toccaSlot={toccaSlot}
              togli={togli}
              apriExtra={(s) => {
                lascia();
                setExtraDi(s);
              }}
              esclusi={esclusi}
            />
          </div>
        </div>
      </section>

      <BarraSettimana
        r={r}
        pronto={pronto}
        piano={piano}
        allenamenti={allenamenti}
        onRiempi={pronto && pasti === 0 && giorniScelti > 0 ? () => riempi(false) : undefined}
        annulla={annullabile}
        totale={Math.max(r.pasti, pastiAlGiorno === 1 ? GIORNI.length : CASELLE_TOTALI)}
      />
      <FoglioExtra slot={extraDi} chiudi={() => setExtraDi(null)} />

      {/* il fantasma del trascinamento: sempre montato, visibile solo mentre si trascina */}
      <div
        ref={fantasma}
        aria-hidden="true"
        className="fantasma"
        style={{ visibility: stato.modo === "presa" && stato.trascino ? "visible" : "hidden" }}
      >
        {stato.modo === "presa" ? nomePresa(stato.presa) : ""}
      </div>
      <p className="sr-only" aria-live="polite">
        {annuncio}
      </p>
    </>
  );
}
