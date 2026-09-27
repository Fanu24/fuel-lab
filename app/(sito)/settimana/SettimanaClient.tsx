"use client";

import { useMemo, useState } from "react";
import { getPiatto } from "@/lib/catalogo";
import { riempiSettimana, sostituisciEsclusi } from "@/lib/autofill";
import { caselleEscluse } from "@/lib/impostazioni";
import { NOMI_GIORNO, usePiano, type Slot } from "@/lib/piano";
import { riepilogoSettimana } from "@/lib/riepilogo";
import { useTrascina, type Presa } from "@/components/compositore/useTrascina";
import { useLinkCondiviso } from "@/components/compositore/useLinkCondiviso";
import PianificaAllenamenti from "@/components/compositore/PianificaAllenamenti";
import Banco from "@/components/compositore/Banco";
import Griglia from "@/components/compositore/Griglia";
import FoglioExtra from "@/components/compositore/FoglioExtra";
import BarraSettimana from "@/components/compositore/BarraSettimana";
import AvvisoLink from "@/components/compositore/AvvisoLink";
import { usePiattiNonDisponibili } from "@/components/impostazioni/useImpostazioni";

/* Il compositore: 1) come ti alleni, 2) la settimana si riempie, 3) la
   ritocchi trascinando. La pagina tiene insieme i pezzi, la logica sta in
   lib/autofill (chi va dove), lib/piano (lo stato) e useTrascina (i gesti). */

const PASTO: Record<string, string> = { pranzo: "a pranzo", cena: "a cena" };

export default function SettimanaClient() {
  const p = usePiano();
  const { piano, allenamenti, pronto, pasti } = p;
  const [pastiAlGiorno, setPastiAlGiorno] = useState<1 | 2>(2);
  const [giro, setGiro] = useState(0);
  const [extraDi, setExtraDi] = useState<Slot | null>(null);
  const [annuncio, setAnnuncio] = useState("");
  const [confermaSvuota, setConfermaSvuota] = useState(false);
  const link = useLinkCondiviso();
  // I piatti che Matteo questa settimana non cucina (impostazioni del pannello).
  const esclusi = usePiattiNonDisponibili();

  const nomeSlot = (s: Slot) => `${NOMI_GIORNO[s.g].toLowerCase()} ${PASTO[s.m]}`;
  const nomePresa = (x: Presa) =>
    x.tipo === "banco" ? (getPiatto(x.piattoId)?.nome ?? "Piatto") : `Il piatto di ${nomeSlot(x.slot)}`;

  const { stato, fantasma, inizia, tocca, toccaSlot } = useTrascina({
    metti: (s, id) => p.metti(s.g, s.m, id),
    sposta: p.sposta,
    togli: (s) => p.svuotaCasella(s.g, s.m),
    annuncia: setAnnuncio,
    nomePresa,
    nomeSlot,
  });

  const r = useMemo(() => riepilogoSettimana(piano, "singolo"), [piano]);
  const giorniScelti = Object.keys(allenamenti).length;
  const fuori = useMemo(() => (pronto ? caselleEscluse(piano, esclusi) : []), [pronto, piano, esclusi]);

  function riempi(sovrascrivi: boolean, rimescola = giro) {
    p.riempi(riempiSettimana(piano, allenamenti, { pastiAlGiorno, sovrascrivi, rimescola, esclusi }));
    setAnnuncio("Settimana riempita secondo i tuoi allenamenti.");
  }

  function sostituisci() {
    p.riempi(sostituisciEsclusi(piano, allenamenti, esclusi, giro));
    setAnnuncio(fuori.length === 1 ? "Piatto sostituito con uno disponibile." : "Piatti sostituiti con altri disponibili.");
  }

  return (
    <>
      {/* Su schermi larghi titolo e testo stanno affiancati: cosi' il passo 1,
          fino a "Riempi la settimana", entra nella prima schermata sopra la barra. */}
      <section className="testata !pb-8 lg:!pb-6">
        <div className="wrap lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
          <h1>
            <span className="occhiello">Componi il meal prep della settimana</span>
            <span className="titolo mt-5 block max-w-[14ch]">La tua settimana.</span>
          </h1>
          <p className="lead mt-6 lg:mt-0">
            Dicci come ti alleni: i piatti giusti arrivano da soli. Poi li sposti come vuoi, trascinandoli o toccandoli.
          </p>
        </div>
      </section>

      <AvvisoLink link={link} />

      <section className="pb-12">
        <div className="wrap">
          <div className="border-t-[3px] border-ink pt-8">
            <PianificaAllenamenti
              allenamenti={allenamenti}
              imposta={p.impostaAllenamento}
              applica={(a) => {
                p.svuotaAllenamenti();
                for (const [g, tipo] of Object.entries(a)) p.impostaAllenamento(g as Slot["g"], tipo ?? null);
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
                    riempi(true, g);
                  }}
                >
                  Altre proposte
                </button>
              ) : null}
              <p className="text-sm text-muted">
                {giorniScelti === 0
                  ? "Scegli almeno un giorno, oppure trascina i piatti a mano."
                  : "Cardio: più carboidrati. Pesi: proteine e carboidrati misurati. Riposo: più leggero."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="wrap">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-t-[3px] border-ink pt-8">
            <div>
              <p className="occhiello">Passo 2</p>
              <h2 className="titolo-s mt-3">Sistemala come vuoi.</h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <button type="button" className="link" onClick={link.copia} disabled={pasti === 0}>
                {link.copiato === "si" ? "Link copiato" : "Manda al nutrizionista"}
              </button>
              {confermaSvuota ? (
                <span className="flex items-center gap-3">
                  Svuotare tutto?
                  <button
                    type="button"
                    className="link"
                    onClick={() => {
                      p.svuota();
                      setConfermaSvuota(false);
                      setAnnuncio("Settimana svuotata.");
                    }}
                  >
                    Sì
                  </button>
                  <button type="button" className="link" onClick={() => setConfermaSvuota(false)}>
                    No
                  </button>
                </span>
              ) : (
                <button type="button" className="link" onClick={() => setConfermaSvuota(true)} disabled={pasti === 0}>
                  Svuota
                </button>
              )}
            </div>
          </div>
          {link.copiato === "manuale" ? (
            <p className="mb-6 text-sm">
              Copia il link a mano: <input readOnly value={link.url} className="w-full border-2 border-ink/15 p-2 num text-xs" onFocus={(e) => e.target.select()} />
            </p>
          ) : null}

          {fuori.length ? (
            <div role="status" className="avviso-esclusi mb-6">
              <p className="min-w-0 flex-1">
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
              annuncia={setAnnuncio}
            />
            <Griglia
              piano={piano}
              allenamenti={allenamenti}
              pastiAlGiorno={pastiAlGiorno}
              stato={stato}
              inizia={inizia}
              toccaSlot={toccaSlot}
              togli={(s) => {
                p.svuotaCasella(s.g, s.m);
                setAnnuncio(`Tolto da ${nomeSlot(s)}.`);
              }}
              apriExtra={setExtraDi}
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
