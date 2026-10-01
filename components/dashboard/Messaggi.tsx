"use client";

/* La posta del modulo contatti. Tre cassetti (Nuovi, Gestiti, Archiviati):
   un tocco sposta il messaggio subito, senza aspettare il server; se il server
   dice di no il messaggio torna dov'era e compare l'errore. Dopo ogni
   spostamento c'e' "Annulla", per i tocchi sbagliati dal telefono: l'avviso sta
   in basso, fisso (come nelle azioni veloci degli ordini), perche' il messaggio
   toccato sparisce dall'elenco e l'avviso in cima alla lista resterebbe fuori
   dallo schermo. La lista si aggiorna da sola ogni minuto, come il numerino
   rosso nella barra: senza, il numerino direbbe 21 e l'elenco ne mostrerebbe 20. */

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { adminApi, type MessaggioContatto, type StatoMessaggio } from "@/lib/api";
import { ErroreCaricamento, eSessioneScaduta } from "./ClientiErrore";
import MessaggiScheda from "./MessaggiScheda";
import { Icona } from "./PannelloIcone";
import { Caricamento, TestaPagina, Vuoto } from "./ui";

const CASSETTI: { id: StatoMessaggio; label: string; vuoto: string }[] = [
  { id: "new", label: "Nuovi", vuoto: "Nessun messaggio nuovo. Quando qualcuno scrive dal modulo contatti lo trovi qui." },
  { id: "handled", label: "Gestiti", vuoto: "Nessun messaggio gestito." },
  { id: "archived", label: "Archiviati", vuoto: "Nessun messaggio archiviato." },
];

const nomeCassetto = (s: StatoMessaggio) => CASSETTI.find((c) => c.id === s)?.label ?? s;

const messaggio = (e: unknown, ripiego: string) => (e instanceof Error ? e.message : ripiego);

type Spostamento = { id: string; nome: string; da: StatoMessaggio; a: StatoMessaggio };

const OGNI = 60_000;
const ora = (d: Date) => new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" }).format(d);

export default function Messaggi() {
  const [messaggi, setMessaggi] = useState<MessaggioContatto[] | null>(null);
  const [errore, setErrore] = useState("");
  const [sessione, setSessione] = useState(false);
  const [caricando, setCaricando] = useState(false);
  const [cassetto, setCassetto] = useState<StatoMessaggio>("new");
  const [inCorso, setInCorso] = useState<ReadonlySet<string>>(new Set());
  const [erroreAzione, setErroreAzione] = useState("");
  const [ultimo, setUltimo] = useState<Spostamento | null>(null);
  const [aggiornatoAlle, setAggiornatoAlle] = useState<Date | null>(null);
  const occupati = useRef(0);
  // Quanti spostamenti sono partiti finora: un elenco chiesto prima di uno spostamento e arrivato dopo e' vecchio.
  const mosse = useRef(0);

  useEffect(() => {
    let vivo = true;
    adminApi.messaggi().then(
      (r) => {
        if (!vivo) return;
        setMessaggi(r.messages);
        setAggiornatoAlle(new Date());
      },
      (e: unknown) => {
        if (!vivo) return;
        setErrore(messaggio(e, "Non riesco a caricare i messaggi."));
        setSessione(eSessioneScaduta(e));
      },
    );
    return () => {
      vivo = false;
    };
  }, []);

  // Un giro silenzioso ogni minuto (solo a pagina visibile, e mai nel mezzo di uno spostamento: la risposta
  // vecchia rimetterebbe il messaggio dov'era).
  useEffect(() => {
    const giro = window.setInterval(() => {
      if (document.hidden || occupati.current > 0) return;
      const mosseAllaPartenza = mosse.current;
      adminApi.messaggi().then(
        (r) => {
          if (occupati.current > 0 || mosse.current !== mosseAllaPartenza) return;
          setMessaggi(r.messages);
          setAggiornatoAlle(new Date());
          setErrore("");
        },
        () => {
          // Un giro andato male non disturba: resta l'ultimo elenco, e "Aggiorna" mostra l'errore.
        },
      );
    }, OGNI);
    return () => window.clearInterval(giro);
  }, []);

  // L'avviso "spostato in..." sparisce da solo dopo 8 secondi.
  useEffect(() => {
    if (!ultimo) return;
    const t = window.setTimeout(() => setUltimo(null), 8000);
    return () => window.clearTimeout(t);
  }, [ultimo]);

  // L'errore di uno spostamento resta qualche secondo di piu': va letto con calma.
  useEffect(() => {
    if (!erroreAzione) return;
    const t = window.setTimeout(() => setErroreAzione(""), 12_000);
    return () => window.clearTimeout(t);
  }, [erroreAzione]);

  function ricarica() {
    setCaricando(true);
    const mosseAllaPartenza = mosse.current;
    adminApi
      .messaggi()
      .then(
        (r) => {
          if (mosse.current !== mosseAllaPartenza) return;
          setMessaggi(r.messages);
          setAggiornatoAlle(new Date());
          setErrore("");
          setSessione(false);
        },
        (e: unknown) => {
          setErrore(messaggio(e, "Non riesco a caricare i messaggi."));
          setSessione(eSessioneScaduta(e));
        },
      )
      .finally(() => setCaricando(false));
  }

  const conStato = (id: string, status: StatoMessaggio) =>
    setMessaggi((lista) => lista?.map((m) => (m.id === id ? { ...m, status } : m)) ?? lista);

  async function sposta(m: MessaggioContatto, a: StatoMessaggio, annullabile = true) {
    const da = m.status;
    if (da === a || inCorso.has(m.id)) return;
    conStato(m.id, a); // subito, prima del server
    occupati.current += 1;
    mosse.current += 1;
    setInCorso((s) => new Set(s).add(m.id));
    setErroreAzione("");
    setUltimo(annullabile ? { id: m.id, nome: m.name || m.email, da, a } : null);
    try {
      const r = await adminApi.modificaMessaggio(m.id, a);
      setMessaggi((lista) => lista?.map((x) => (x.id === m.id ? r.message : x)) ?? lista);
    } catch (e) {
      conStato(m.id, da); // il server ha detto di no: torna dov'era
      setUltimo(null);
      const motivo = messaggio(e, "errore del server");
      setErroreAzione(
        `Non ho spostato il messaggio di ${m.name || m.email}: ${motivo}${/[.!?]$/.test(motivo) ? "" : "."} È rimasto in ${nomeCassetto(da)}.`,
      );
    } finally {
      occupati.current -= 1;
      setInCorso((s) => {
        const nuovo = new Set(s);
        nuovo.delete(m.id);
        return nuovo;
      });
    }
  }

  function annulla() {
    if (!ultimo) return;
    const m = messaggi?.find((x) => x.id === ultimo.id);
    if (m) void sposta(m, ultimo.da, false);
  }

  const conteggi = useMemo(() => {
    const c: Record<StatoMessaggio, number> = { new: 0, handled: 0, archived: 0 };
    for (const m of messaggi ?? []) c[m.status] = (c[m.status] ?? 0) + 1;
    return c;
  }, [messaggi]);

  const visibili = useMemo(
    () => (messaggi ?? []).filter((m) => m.status === cassetto).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [messaggi, cassetto],
  );

  function tasti(e: KeyboardEvent<HTMLButtonElement>) {
    const i = CASSETTI.findIndex((c) => c.id === cassetto);
    const vai =
      e.key === "ArrowRight" ? (i + 1) % CASSETTI.length
      : e.key === "ArrowLeft" ? (i - 1 + CASSETTI.length) % CASSETTI.length
      : e.key === "Home" ? 0
      : e.key === "End" ? CASSETTI.length - 1
      : -1;
    if (vai === -1) return;
    e.preventDefault();
    setCassetto(CASSETTI[vai].id);
    document.getElementById(`ms-tab-${CASSETTI[vai].id}`)?.focus();
  }

  const attivo = CASSETTI.find((c) => c.id === cassetto) ?? CASSETTI[0];

  return (
    <div className="grid gap-8">
      <TestaPagina
        occhiello="Pannello · Messaggi"
        titolo="Messaggi"
        sotto={
          <>
            Quello che scrivono dal modulo contatti del sito.
            {aggiornatoAlle ? <> Aggiornato alle {ora(aggiornatoAlle)}.</> : null}
          </>
        }
        azioni={
          <button type="button" className="btn btn-linea btn-sm" onClick={ricarica} disabled={caricando}>
            {caricando ? "Aggiorno…" : "Aggiorna"}
          </button>
        }
      />

      {errore ? (
        <div className="grid gap-3">
          <ErroreCaricamento testo={errore} sessioneScaduta={sessione} />
          {messaggi === null && !sessione ? (
            <button type="button" className="btn btn-ink btn-sm justify-self-start" onClick={ricarica} disabled={caricando}>
              Riprova
            </button>
          ) : null}
        </div>
      ) : null}

      {messaggi === null ? (
        errore ? null : <Caricamento testo="Carico i messaggi…" />
      ) : (
        <>
          <div role="tablist" aria-label="Cassetti della posta" className="cu-schede cu-schede-3">
            {CASSETTI.map((c) => (
              <button
                key={c.id}
                id={`ms-tab-${c.id}`}
                type="button"
                role="tab"
                aria-selected={cassetto === c.id}
                aria-controls="ms-pannello"
                tabIndex={cassetto === c.id ? 0 : -1}
                className="cu-scheda"
                onClick={() => setCassetto(c.id)}
                onKeyDown={tasti}
              >
                {c.label}
                <span className={`cu-scheda-n num ${c.id === "new" && conteggi.new ? "is-nuovi" : ""}`} aria-hidden="true">
                  {conteggi[c.id]}
                </span>
                <span className="sr-only">
                  , {conteggi[c.id]} {conteggi[c.id] === 1 ? "messaggio" : "messaggi"}
                </span>
              </button>
            ))}
          </div>

          <div id="ms-pannello" role="tabpanel" aria-labelledby={`ms-tab-${cassetto}`}>
            {visibili.length ? (
              <ul className="grid gap-4">
                {visibili.map((m) => (
                  <li key={m.id}>
                    <MessaggiScheda m={m} occupato={inCorso.has(m.id)} onSposta={(a) => void sposta(m, a)} />
                  </li>
                ))}
              </ul>
            ) : (
              <Vuoto>{attivo.vuoto}</Vuoto>
            )}
          </div>
        </>
      )}

      {/* Sempre presente, anche vuota: una regione live nata insieme alla pagina viene letta davvero. */}
      <div role="status" aria-live="polite">
        {erroreAzione ? (
          <div className="pn-toast pn-toast-errore">
            <span>{erroreAzione}</span>
            <button type="button" aria-label="Chiudi l’avviso" onClick={() => setErroreAzione("")}>
              <Icona nome="chiudi" className="size-5" />
            </button>
          </div>
        ) : ultimo ? (
          <div className="pn-toast">
            <span>
              Messaggio di {ultimo.nome} spostato in <strong>{nomeCassetto(ultimo.a)}</strong>.
            </span>
            <button type="button" onClick={annulla} disabled={inCorso.has(ultimo.id)}>
              Annulla
            </button>
            <button type="button" aria-label="Chiudi l’avviso" onClick={() => setUltimo(null)}>
              <Icona nome="chiudi" className="size-5" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
