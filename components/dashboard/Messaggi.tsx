"use client";

/* La posta del modulo contatti. Tre cassetti (Nuovi, Gestiti, Archiviati):
   un tocco sposta il messaggio subito, senza aspettare il server; se il server
   dice di no il messaggio torna dov'era e compare l'errore. Dopo ogni
   spostamento c'e' "Annulla", per i tocchi sbagliati dal telefono. */

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { adminApi, type MessaggioContatto, type StatoMessaggio } from "@/lib/api";
import MessaggiScheda from "./MessaggiScheda";
import { Avviso, Caricamento, TestaPagina, Vuoto } from "./ui";

const CASSETTI: { id: StatoMessaggio; label: string; vuoto: string }[] = [
  { id: "new", label: "Nuovi", vuoto: "Nessun messaggio nuovo. Quando qualcuno scrive dal modulo contatti lo trovi qui." },
  { id: "handled", label: "Gestiti", vuoto: "Nessun messaggio gestito." },
  { id: "archived", label: "Archiviati", vuoto: "Nessun messaggio archiviato." },
];

const nomeCassetto = (s: StatoMessaggio) => CASSETTI.find((c) => c.id === s)?.label ?? s;

const messaggio = (e: unknown, ripiego: string) => (e instanceof Error ? e.message : ripiego);

type Spostamento = { id: string; nome: string; da: StatoMessaggio; a: StatoMessaggio };

export default function Messaggi() {
  const [messaggi, setMessaggi] = useState<MessaggioContatto[] | null>(null);
  const [errore, setErrore] = useState("");
  const [caricando, setCaricando] = useState(false);
  const [cassetto, setCassetto] = useState<StatoMessaggio>("new");
  const [inCorso, setInCorso] = useState<ReadonlySet<string>>(new Set());
  const [erroreAzione, setErroreAzione] = useState("");
  const [ultimo, setUltimo] = useState<Spostamento | null>(null);

  useEffect(() => {
    let vivo = true;
    adminApi.messaggi().then(
      (r) => vivo && setMessaggi(r.messages),
      (e: unknown) => vivo && setErrore(messaggio(e, "Non riesco a caricare i messaggi.")),
    );
    return () => {
      vivo = false;
    };
  }, []);

  function ricarica() {
    setCaricando(true);
    adminApi
      .messaggi()
      .then(
        (r) => {
          setMessaggi(r.messages);
          setErrore("");
        },
        (e: unknown) => setErrore(messaggio(e, "Non riesco a caricare i messaggi.")),
      )
      .finally(() => setCaricando(false));
  }

  const conStato = (id: string, status: StatoMessaggio) =>
    setMessaggi((lista) => lista?.map((m) => (m.id === id ? { ...m, status } : m)) ?? lista);

  async function sposta(m: MessaggioContatto, a: StatoMessaggio, annullabile = true) {
    const da = m.status;
    if (da === a || inCorso.has(m.id)) return;
    conStato(m.id, a); // subito, prima del server
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
        sotto="Quello che scrivono dal modulo contatti del sito."
        azioni={
          <button type="button" className="btn btn-linea btn-sm" onClick={ricarica} disabled={caricando}>
            {caricando ? "Aggiorno…" : "Aggiorna"}
          </button>
        }
      />

      {errore ? (
        <div className="grid gap-3">
          <Avviso>{errore}</Avviso>
          {messaggi === null ? (
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
            {/* Sempre presente, anche vuota: una regione live nata insieme alla pagina viene letta davvero. */}
            <div aria-live="polite" className="ms-avvisi">
              {erroreAzione ? <Avviso>{erroreAzione}</Avviso> : null}
              {ultimo ? (
                <div className="ms-esito">
                  <span>
                    Messaggio di {ultimo.nome} spostato in <strong>{nomeCassetto(ultimo.a)}</strong>.
                  </span>
                  <button type="button" className="btn btn-linea btn-sm" onClick={annulla} disabled={inCorso.has(ultimo.id)}>
                    Annulla
                  </button>
                </div>
              ) : null}
            </div>
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
    </div>
  );
}
