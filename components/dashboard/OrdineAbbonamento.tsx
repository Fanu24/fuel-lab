/* Le parti di un abbonamento che la scheda ordine e il modulo "Nuovo ordine a
   mano" hanno in comune: la scelta (formula, fascia, chi si abbona, settimana di
   prova), il prezzo che ne discende e il calendario delle consegne.

   Il prezzo viene sempre da calcolaPrezzo (lib/abbonamento.ts): qui si propone
   soltanto, e il totale lo scrive Matteo. Il calendario e' una consegna (o un
   ritiro) ogni 3 giorni dall'inizio: ogni consegna porta i pasti di tre giorni. */

import {
  FORMULE,
  FASCE,
  NOMI_FASCIA,
  NOMI_NUCLEO,
  NOTE_FASCIA,
  NUCLEI,
  SCONTO_NUCLEO,
  calcolaPrezzo,
  pastiDelBlocco,
  prossimaConsegna,
  type Fascia,
  type FormulaId,
  type Nucleo,
} from "@/lib/abbonamento";
import { euro, type Chiusura } from "@/lib/api";
import { chiusuraDi } from "@/lib/impostazioni";
import { centesimiInTesto } from "@/lib/operazioni";
import { calendarioAbbonamento, isData } from "@/lib/produzione";
import { Scelte } from "./OrdineNuovoParti";
import { giorno, giornoLungo } from "./ui";

export type SceltaAbbonamentoCampi = { formula: FormulaId; fascia: Fascia; nucleo: Nucleo; prova: boolean };

/** Una pillola a due righe (nome e cosa copre): le cinque formule si riconoscono a colpo d'occhio. */
const PILLOLA_DOPPIA = "pn-scelta-doppia has-[:checked]:bg-ink has-[:checked]:text-paper";

/**
 * Le quattro scelte di un abbonamento. `prefisso` rende unici i nomi dei
 * campi radio (piu' moduli nella stessa pagina non si mescolano).
 */
export function ScelteAbbonamento({
  prefisso,
  valore,
  onCambia,
}: {
  prefisso: string;
  valore: SceltaAbbonamentoCampi;
  onCambia: (cambio: Partial<SceltaAbbonamentoCampi>) => void;
}) {
  return (
    <div className="grid gap-4">
      <Scelte<FormulaId>
        nome={`${prefisso}-formula`}
        legenda="Formula"
        valore={valore.formula}
        opzioni={FORMULE.map((f) => ({
          id: f.id,
          classe: PILLOLA_DOPPIA,
          label: (
            <>
              <span>{f.nome}</span>
              <span className="pn-scelta-nota">{f.slogan}</span>
            </>
          ),
        }))}
        onScegli={(formula) => onCambia({ formula })}
      />
      <Scelte<Fascia>
        nome={`${prefisso}-fascia`}
        legenda="Fascia"
        valore={valore.fascia}
        opzioni={FASCE.map((f) => ({ id: f, label: NOMI_FASCIA[f] }))}
        onScegli={(fascia) => onCambia({ fascia })}
        aiuto={NOTE_FASCIA[valore.fascia]}
      />
      <Scelte<Nucleo>
        nome={`${prefisso}-nucleo`}
        legenda="Chi si abbona"
        valore={valore.nucleo}
        opzioni={NUCLEI.map((n) => ({ id: n, label: `${NOMI_NUCLEO[n]}${SCONTO_NUCLEO[n] ? ` · −${SCONTO_NUCLEO[n]}%` : ""}` }))}
        onScegli={(nucleo) => onCambia({ nucleo })}
      />
      <button
        type="button"
        role="switch"
        aria-checked={valore.prova}
        className="pn-switch justify-self-start"
        onClick={() => onCambia({ prova: !valore.prova })}
      >
        <span className="pn-switch-binario" aria-hidden="true" />
        Settimana di prova
      </button>
    </div>
  );
}

/** "listino 520 €, sconto 10%": da dove viene il prezzo proposto. */
function dettaglioPrezzo(p: ReturnType<typeof calcolaPrezzo>): string {
  return `listino ${euro(p.listinoCentesimi)}${p.scontoPercento ? `, sconto ${p.scontoPercento}%` : ", nessuno sconto"}`;
}

/**
 * Nella scheda ordine: quando Matteo cambia formula, fascia o nucleo il totale
 * non cambia da solo. Qui si propone il nuovo (da calcolaPrezzo, con ritiro o
 * consegna dell'ordine) e un tocco lo scrive nel campo del prezzo.
 */
export function AggiornaTotale({
  scelta,
  ritiro,
  totaleAttuale,
  onAggiorna,
}: {
  scelta: Pick<SceltaAbbonamentoCampi, "formula" | "fascia" | "nucleo">;
  ritiro: boolean;
  /** Il totale scritto adesso nel campo (centesimi), null se vuoto, undefined se illeggibile. */
  totaleAttuale: number | null | undefined;
  /** Scrive il totale proposto nel campo del prezzo, nel formato del campo ("468,00"). */
  onAggiorna: (testo: string) => void;
}) {
  const p = calcolaPrezzo({ ...scelta, ritiro });
  if (totaleAttuale === p.totaleCentesimi) return null;
  return (
    <div className="pn-suggerimento" role="status">
      <p>
        Con questa scelta il totale proposto è <strong className="num">{euro(p.totaleCentesimi)}</strong> al mese ({dettaglioPrezzo(p)}).
        Il totale non cambia da solo:{" "}
        {totaleAttuale === null ? "adesso non c’è un prezzo." : totaleAttuale === undefined ? "il prezzo scritto sotto non si legge." : <>adesso è <strong className="num">{euro(totaleAttuale)}</strong>.</>}
      </p>
      <button type="button" className="pn-tasto justify-self-start" onClick={() => onAggiorna(centesimiInTesto(p.totaleCentesimi))}>
        Aggiorna il totale a {euro(p.totaleCentesimi)}
      </button>
    </div>
  );
}

/**
 * Nel modulo del nuovo ordine: il prezzo proposto per la scelta fatta, sotto
 * il campo del prezzo, e il tocco per rimetterlo se Matteo l'ha cambiato.
 */
export function PrezzoProposto({
  scelta,
  ritiro,
  totaleAttuale,
  onUsa,
}: {
  scelta: Pick<SceltaAbbonamentoCampi, "formula" | "fascia" | "nucleo">;
  ritiro: boolean;
  totaleAttuale: number | null | undefined;
  onUsa: (testo: string) => void;
}) {
  const p = calcolaPrezzo({ ...scelta, ritiro });
  const uguale = totaleAttuale === p.totaleCentesimi;
  return (
    <div className="grid gap-1">
      <p className="pn-aiuto">
        Proposto per questa scelta: <strong className="num text-ink">{euro(p.totaleCentesimi)}</strong> al mese ({dettaglioPrezzo(p)}).
        {uguale ? " Si aggiorna da solo se cambi la scelta o il ritiro." : " Hai scritto un altro prezzo: resta il tuo."}
      </p>
      {uguale ? null : (
        <button type="button" className="pn-tasto justify-self-start" onClick={() => onUsa(centesimiInTesto(p.totaleCentesimi))}>
          Rimetti {euro(p.totaleCentesimi)}
        </button>
      )}
    </div>
  );
}

/**
 * Il periodo, i pasti e le consegne di un abbonamento che parte da `inizio`:
 * "Dal ... al ... · 62 pasti in 11 consegne, una ogni 3 giorni, la prima ...".
 * Con `elenco` anche i giorni di consegna uno per uno, con i pasti di ciascuno
 * e la prossima in evidenza (`oggi` decide quale e').
 */
export function CalendarioConsegne({
  id,
  formula,
  inizio,
  oggi,
  elenco = false,
  chiusure = [],
}: {
  id?: string;
  formula: FormulaId;
  inizio: string;
  oggi: string;
  elenco?: boolean;
  /** I giorni di chiusura: le consegne che ci cadono dentro si segnalano. */
  chiusure?: readonly Chiusura[];
}) {
  const c = calendarioAbbonamento(formula, inizio);
  const prossima = prossimaConsegna(formula, inizio, oggi);
  const chiuse = c.consegne.filter((d) => chiusuraDi(d, chiusure));
  return (
    <div className="grid gap-3" id={id} aria-live="polite">
      <p className="text-[16px]">
        Da <strong>{giornoLungo(c.dal)}</strong> a <strong>{giornoLungo(c.al)}</strong> · <span className="num">{c.pasti}</span> pasti in{" "}
        <span className="num">{c.consegne.length}</span> consegne, una ogni 3 giorni
        {c.consegne.length ? (
          <>
            , la prima è <strong>{giornoLungo(c.consegne[0])}</strong>
          </>
        ) : null}
        .
      </p>
      <AvvisoChiusura giorni={chiuse} chiusure={chiusure} consegne />
      {elenco && c.consegne.length ? (
        <ol className="pn-consegne" aria-label="Giorni di consegna">
          {c.consegne.map((d) => (
            <li key={d} className={`pn-consegna ${chiuse.includes(d) ? "pn-consegna-chiusa" : d === prossima ? "pn-consegna-prossima" : d < oggi ? "pn-consegna-passata" : ""}`} aria-current={d === prossima ? "date" : undefined}>
              <strong>{giorno(d)}</strong>
              <span>{pastiDelBlocco(formula, inizio, d).length} pasti</span>
              {chiuse.includes(d) ? <span className="pn-consegna-tag">Chiuso</span> : d === prossima ? <span className="pn-consegna-tag">Prossima</span> : null}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

/**
 * Un avviso, non un blocco: Matteo puo' salvare lo stesso (un abbonamento lo
 * concorda lui col cliente), ma non deve scoprire dopo che la data scelta cade
 * in un giorno di chiusura.
 */
export function AvvisoChiusura({ giorni, chiusure, consegne = false }: { giorni: string[]; chiusure: readonly Chiusura[]; consegne?: boolean }) {
  const chiusi = [...new Set(giorni)].filter((d) => isData(d) && chiusuraDi(d, chiusure)).sort();
  if (!chiusi.length) return null;
  const motivi = [...new Set(chiusi.map((d) => chiusuraDi(d, chiusure)?.motivo.trim()).filter(Boolean))];
  const dove = `${chiusi.map((d) => giorno(d)).join(", ")}${motivi.length ? ` (${motivi.join(", ")})` : ""}`;
  return (
    <p className="pn-avviso pn-avviso-errore" role="note">
      {consegne
        ? `${chiusi.length === 1 ? "Una consegna cade" : `${chiusi.length} consegne cadono`} in ${chiusi.length === 1 ? "un giorno" : "giorni"} in cui sei chiuso: ${dove}. Puoi lasciarla così, ma dovrai anticiparla, spostarla o avvisare il cliente.`
        : `${chiusi.length === 1 ? "Questo giorno è" : "Questi giorni sono"} di chiusura: ${dove}. Puoi salvare lo stesso, ma avvisa il cliente.`}
    </p>
  );
}
