"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { STATI, getRepository, type Richiesta, type StatoRichiesta } from "@/lib/richieste";
import { GIORNI, NOMI_GIORNATA, NOMI_GIORNO, PASTI } from "@/lib/settimana";
import { getServizio } from "@/lib/servizi";
import { linkWhatsAppA } from "@/lib/whatsapp";
import StatoBadge from "./StatoBadge";

const data = new Intl.DateTimeFormat("it-IT", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/Rome" });

export default function DettaglioRichiesta({ id }: { id: string }) {
  const [r, setR] = useState<Richiesta | null | undefined>(undefined);
  const [nota, setNota] = useState("");
  const [salvata, setSalvata] = useState(false);

  useEffect(() => {
    let vivo = true;
    getRepository()
      .leggi(id)
      .then((x) => {
        if (!vivo) return;
        setR(x);
        setNota(x?.noteInterne ?? "");
      })
      .catch(() => vivo && setR(null));
    return () => {
      vivo = false;
    };
  }, [id]);

  if (r === undefined) return <p className="text-muted">Carico…</p>;
  if (r === null)
    return (
      <div>
        <h1 className="titolo-s">Richiesta non trovata.</h1>
        <p className="mt-4 text-muted">Forse è stata fatta da un altro browser: nella demo le richieste restano dove nascono.</p>
        <Link href="/dashboard" className="link mt-6 inline-block">
          ← Tutte le richieste
        </Link>
      </div>
    );

  const wa = linkWhatsAppA(r.contatto.telefono, `Ciao ${r.contatto.nome}, sono Matteo di FUEL LAB!`);

  async function cambia(s: StatoRichiesta) {
    setR(await getRepository().aggiornaStato(id, s));
  }
  async function salva() {
    setR(await getRepository().annota(id, nota));
    setSalvata(true);
  }

  return (
    <div className="grid gap-12">
      <div>
        <Link href="/dashboard" className="link text-sm">
          ← Tutte le richieste
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <h1 className="titolo">{r.contatto.nome}</h1>
          <StatoBadge stato={r.stato} />
        </div>
        <p className="mt-3 text-muted">
          {getServizio(r.servizio).nome} · arrivata {data.format(new Date(r.creataIl))}
          {r.origine === "demo" ? " · dato d'esempio" : ""}
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div className="grid content-start gap-8">
          <section className="bg-paper-2 p-6">
            <h2 className="occhiello">Contatto</h2>
            <p className="num mt-4 text-xl">{r.contatto.telefono}</p>
            <p className="mt-1">{r.contatto.comune}</p>
            {r.contatto.note ? <p className="mt-4 border-l-[3px] border-ink pl-4">{r.contatto.note}</p> : null}
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-lime mt-6 w-full">
                Scrivi su WhatsApp <span className="freccia">→</span>
              </a>
            ) : null}
          </section>

          <section>
            <h2 className="occhiello">Stato</h2>
            <div className="segmenti mt-4 flex-wrap" role="group" aria-label="Stato della richiesta">
              {STATI.map((s) => (
                <button key={s.id} type="button" aria-pressed={r.stato === s.id} onClick={() => void cambia(s.id)}>
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          <section className="campo">
            <label htmlFor="nota" className="!text-xs">
              Note interne (le vedi solo tu)
            </label>
            <textarea
              id="nota"
              rows={4}
              value={nota}
              onChange={(e) => {
                setNota(e.target.value);
                setSalvata(false);
              }}
            />
            <div className="flex items-center gap-4">
              <button type="button" className="btn btn-ink btn-sm" onClick={() => void salva()}>
                Salva nota
              </button>
              <span role="status" className="text-sm text-muted">
                {salvata ? "Salvata." : ""}
              </span>
            </div>
          </section>
        </div>

        <section>
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="titolo-s">La settimana</h2>
            <p className="num text-sm text-muted">
              {r.pasti} pasti · {Math.round(r.macro.kcal)} kcal · {Math.round(r.macro.proteine)} g P
            </p>
          </div>
          {r.pasti === 0 ? (
            <p className="mt-6 text-muted">Nessuna settimana allegata: è una richiesta di contatto.</p>
          ) : (
            <ul className="mt-6 border-t-[3px] border-ink">
              {GIORNI.filter((g) => r.piano[g] || r.allenamenti[g]).map((g) => (
                <li key={g} className="grid grid-cols-[120px_1fr] gap-4 border-b border-ink/15 py-3 text-sm">
                  <span>
                    <span className="font-disp font-bold tracking-[.1em] uppercase">{NOMI_GIORNO[g]}</span>
                    {r.allenamenti[g] ? (
                      <span className={`tag tag-${r.allenamenti[g]} mt-1 !h-5 !px-1.5 !text-[9px]`}>
                        {NOMI_GIORNATA[r.allenamenti[g]!]}
                      </span>
                    ) : null}
                  </span>
                  <span className="grid gap-1">
                    {PASTI.map((m) => {
                      const c = r.piano[g]?.[m];
                      if (!c?.piatto) return null;
                      return (
                        <span key={m}>
                          <span className="text-muted">{m === "pranzo" ? "Pranzo" : "Cena"}:</span>{" "}
                          {r.nomiPiatti[c.piatto] ?? c.piatto}
                          {c.extra.length ? (
                            <span className="text-muted"> + {c.extra.map((x) => r.nomiPiatti[x] ?? x).join(", ")}</span>
                          ) : null}
                        </span>
                      );
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
