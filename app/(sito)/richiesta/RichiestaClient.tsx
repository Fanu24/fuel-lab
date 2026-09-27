"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { getPiatto } from "@/lib/catalogo";
import { GIORNI, NOMI_GIORNATA, NOMI_GIORNO, PASTI, usePiano } from "@/lib/piano";
import { SERVIZI, getServizio, type ServizioId } from "@/lib/servizi";
import { componiMessaggio, linkWhatsApp, numeroConfigurato, type DatiContatto } from "@/lib/whatsapp";

/* Scrivi a Matteo: i dati restano nella pagina finché l'utente non sceglie di
   aprire WhatsApp. Non inviamo né archiviamo il modulo sul sito. */

const RICHIEDE_PIANO: Record<ServizioId, boolean> = {
  "menu-settimana": true,
  "sui-tuoi-macro": true,
  "home-cooking": false,
};

function servizioDaParam(v: string | null): ServizioId {
  return v === "sui-tuoi-macro" || v === "home-cooking" ? v : "menu-settimana";
}

type Errori = Partial<Record<keyof DatiContatto, string>>;

function valida(m: DatiContatto): Errori {
  const e: Errori = {};
  if (!m.nome.trim()) e.nome = "Serve un nome: è così che Matteo sa a chi sta scrivendo.";
  const cifre = m.telefono.replace(/\D/g, "");
  if (!cifre) e.telefono = "Serve un numero: è da lì che parte la chat su WhatsApp.";
  else if (cifre.length < 9) e.telefono = "Il numero sembra troppo corto.";
  if (m.comune.trim().length < 2) e.comune = "Serve il comune, per la consegna.";
  return e;
}

export default function RichiestaClient() {
  const { piano, allenamenti, pasti, macroSettimana, pronto } = usePiano();
  const [servizioId, setServizioId] = useState<ServizioId>(servizioDaParam(useSearchParams().get("servizio")));
  const [dati, setDati] = useState<DatiContatto>({ nome: "", telefono: "", comune: "", note: "" });
  const [provato, setProvato] = useState(false);
  const [inviata, setInviata] = useState(false);

  const errori = useMemo(() => valida(dati), [dati]);
  const richiedePiano = RICHIEDE_PIANO[servizioId];
  const mancaPiano = richiedePiano && pronto && pasti === 0;
  const configurato = numeroConfigurato();

  function invia(e: React.FormEvent) {
    e.preventDefault();
    setProvato(true);
    if (!configurato || Object.keys(errori).length || mancaPiano) return;

    const testo = componiMessaggio({
      servizioId,
      richiedePiano,
      piano,
      macro: macroSettimana,
      contatto: dati,
      allenamenti,
    });

    const href = linkWhatsApp(testo);
    if (href) window.open(href, "_blank", "noopener,noreferrer");
    setInviata(true);
  }

  const campo = (k: keyof DatiContatto, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="campo">
      <label htmlFor={`r-${k}`}>{label}</label>
      <input
        id={`r-${k}`}
        value={dati[k]}
        onChange={(e) => setDati({ ...dati, [k]: e.target.value })}
        aria-invalid={provato && !!errori[k]}
        aria-describedby={provato && errori[k] ? `r-${k}-e` : undefined}
        {...extra}
      />
      {provato && errori[k] ? (
        <p id={`r-${k}-e`} className="errore">
          {errori[k]}
        </p>
      ) : null}
    </div>
  );

  if (inviata) {
    return (
      <section className="pb-[var(--sezione)]">
        <div className="wrap">
          <div className="notte p-8 md:p-14" role="status">
            <p className="occhiello">Messaggio pronto</p>
            <h2 className="titolo mt-5 max-w-[16ch]">
              {configurato ? "Ora puoi scrivere a Matteo." : "WhatsApp non è ancora attivo."}
            </h2>
            <p className="mt-6 max-w-[52ch] text-steel">
              {configurato
                ? "Si è aperta WhatsApp col messaggio già scritto: premi invio e Matteo ti risponde, di solito in giornata."
                : "Il numero WhatsApp non è ancora configurato. I dati inseriti non vengono inviati né salvati dal sito."}
            </p>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
              <Link href="/" className="btn btn-lime">
                Torna alla home
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!configurato) {
    return (
      <section className="pb-[var(--sezione)]">
        <div className="wrap grid gap-8 md:grid-cols-2">
          <div className="notte p-8 md:p-12">
            <p className="occhiello">Contatto diretto</p>
            <h2 className="titolo-s mt-5">Parliamo del tuo menu.</h2>
            <p className="mt-5 text-steel">Scrivici cosa cerchi, il tuo comune e i giorni che ti interessano. Ti confermiamo disponibilità e modalità di consegna.</p>
            <Link href="/account" className="btn btn-lime mt-8">Invia dal tuo account <span className="freccia">→</span></Link>
            <a href="mailto:info@fuelchef.it?subject=Informazioni%20FUEL%20LAB" className="link mt-5 inline-block text-steel">Oppure scrivi a info@fuelchef.it</a>
          </div>
          <div className="bg-paper-2 p-8 md:p-12">
            <p className="occhiello">Prima di scriverci</p>
            <h2 className="titolo-s mt-5">Scegli cosa mangiare.</h2>
            <p className="mt-5 text-muted">Esplora ingredienti e piatti oppure prepara una bozza dei pasti della settimana. Puoi citare i tuoi preferiti nel messaggio.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/menu" className="btn btn-ink">Guarda il menu</Link>
              <Link href="/settimana" className="btn btn-linea">Componi la settimana</Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const servizio = getServizio(servizioId);

  return (
    <section className="pb-[var(--sezione)]">
      <div className="wrap grid gap-14 lg:grid-cols-[1.3fr_1fr]">
        <form onSubmit={invia} noValidate className="grid content-start gap-6">
          <fieldset>
            <legend className="occhiello">Per cosa scrivi</legend>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {SERVIZI.map((s) => (
                <label
                  key={s.id}
                  className={`flex min-h-14 cursor-pointer items-center gap-3 px-4 font-disp text-sm font-semibold tracking-[.06em] uppercase ${
                    servizioId === s.id ? "bg-ink text-paper" : "bg-paper-2"
                  }`}
                >
                  <input
                    type="radio"
                    name="servizio"
                    value={s.id}
                    checked={servizioId === s.id}
                    onChange={() => setServizioId(s.id)}
                    className="h-4 w-4 accent-[#dfff3e]"
                  />
                  {s.nome}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            {campo("nome", "Nome", { autoComplete: "given-name" })}
            {campo("telefono", "Telefono", { type: "tel", inputMode: "tel", autoComplete: "tel" })}
            {campo("comune", "Comune", { autoComplete: "address-level2", placeholder: "Pescara, Montesilvano…" })}
          </div>
          <div className="campo">
            <label htmlFor="r-note">Note (facoltative)</label>
            <textarea
              id="r-note"
              rows={3}
              value={dati.note}
              onChange={(e) => setDati({ ...dati, note: e.target.value })}
              placeholder="Allergie, orari, domande"
            />
          </div>

          {mancaPiano ? (
            <p className="bg-lime p-4 font-semibold">
              Per {servizio.nome.toLowerCase()} serve una settimana composta.{" "}
              <Link href={servizioId === "sui-tuoi-macro" ? "/scheda" : "/settimana"} className="link">
                Componila adesso
              </Link>
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <button type="submit" className="btn btn-lime" disabled={mancaPiano || !configurato}>
              {configurato ? "Apri WhatsApp" : "WhatsApp presto disponibile"} <span className="freccia">→</span>
            </button>
            <p className="max-w-[40ch] text-sm text-muted">
              {configurato
                ? "Si apre WhatsApp col messaggio già scritto: lo mandi tu."
                : "Il numero non è ancora configurato. Puoi esplorare menu e compositore senza inserire i tuoi dati."}
            </p>
          </div>
        </form>

        <aside className="self-start bg-paper-2 p-6 md:p-8">
          <p className="occhiello">Nel messaggio</p>
          <h2 className="titolo-s mt-4">{servizio.nome}</h2>
          {richiedePiano && pasti > 0 ? (
            <>
              <p className="num mt-4 text-sm text-muted">
                {pasti} pasti · {Math.round(macroSettimana.proteine)} g di proteine nella settimana
              </p>
              <ul className="mt-5">
                {GIORNI.filter((g) => piano[g] || allenamenti[g]).map((g) => (
                  <li key={g} className="border-t border-ink/15 py-3 text-sm">
                    <span className="font-disp font-bold tracking-[.1em] uppercase">{NOMI_GIORNO[g]}</span>
                    {allenamenti[g] ? <span className="text-muted"> · {NOMI_GIORNATA[allenamenti[g]!]}</span> : null}
                    {PASTI.map((m) => {
                      const id = piano[g]?.[m]?.piatto;
                      return id ? (
                        <span key={m} className="block">
                          {getPiatto(id)?.nome}
                        </span>
                      ) : null;
                    })}
                  </li>
                ))}
              </ul>
              <Link href="/settimana" className="link mt-4 inline-block text-sm">
                Modifica la settimana
              </Link>
            </>
          ) : (
            <p className="mt-4 text-muted">{servizio.descrizione}</p>
          )}
        </aside>
      </div>
    </section>
  );
}
