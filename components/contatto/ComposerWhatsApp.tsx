"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { getPiatto } from "@/lib/catalogo";
import { GIORNI, NOMI_GIORNATA, NOMI_GIORNO, PASTI, usePiano } from "@/lib/piano";
import { SERVIZI, getServizio, type ServizioId } from "@/lib/servizi";
import { componiMessaggio, linkWhatsApp, numeroConfigurato, type DatiContatto } from "@/lib/whatsapp";

/* Il messaggio per WhatsApp: i dati restano nella pagina finche' l'utente non
   sceglie di aprire WhatsApp, il sito non li invia ne' li archivia. La pagina
   lo mostra solo quando NEXT_PUBLIC_WHATSAPP e' configurata; se il numero
   manca comunque, il bottone resta spento con la spiegazione accanto. */

/* L'abbonamento non chiede la settimana composta: i pranzi li compone Matteo sulla scheda. */
const RICHIEDE_PIANO: Record<ServizioId, boolean> = {
  "menu-settimana": true,
  abbonamento: false,
  "sui-tuoi-macro": true,
  "home-cooking": false,
};

function servizioDaParam(v: string | null): ServizioId {
  return v === "abbonamento" || v === "sui-tuoi-macro" || v === "home-cooking" ? v : "menu-settimana";
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

const ORDINE: (keyof DatiContatto)[] = ["nome", "telefono", "comune"];

export default function ComposerWhatsApp({ servizioIniziale = "menu-settimana" }: { servizioIniziale?: ServizioId }) {
  const { piano, allenamenti, pasti, macroSettimana, pronto } = usePiano();
  const [servizioId, setServizioId] = useState<ServizioId>(servizioIniziale);
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
    const primo = ORDINE.find((k) => errori[k]);
    if (primo) {
      document.getElementById(`w-${primo}`)?.focus();
      return;
    }
    if (!configurato || mancaPiano) return;

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
      <label htmlFor={`w-${k}`}>{label}</label>
      <input
        id={`w-${k}`}
        value={dati[k]}
        onChange={(e) => setDati({ ...dati, [k]: e.target.value })}
        aria-invalid={provato && !!errori[k]}
        aria-describedby={provato && errori[k] ? `w-${k}-e` : undefined}
        {...extra}
      />
      {provato && errori[k] ? (
        <p id={`w-${k}-e`} className="errore">
          {errori[k]}
        </p>
      ) : null}
    </div>
  );

  if (inviata) {
    return (
      <div className="wrap">
        <div className="notte p-6 md:p-14" role="status">
          <p className="occhiello">Messaggio pronto</p>
          <h3 className="titolo-s mt-5 max-w-[20ch]">Ora puoi scrivere a Matteo.</h3>
          <p className="mt-6 max-w-[52ch] text-steel">
            Si è aperta WhatsApp col messaggio già scritto: premi invio e Matteo ti risponde, di solito in giornata.
          </p>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
            <button type="button" className="btn btn-linea" onClick={() => setInviata(false)}>
              Torna al messaggio
            </button>
            <Link href="/" className="btn btn-lime">
              Torna alla home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const servizio = getServizio(servizioId);

  return (
    <div className="wrap grid gap-14 lg:grid-cols-[1.3fr_1fr]">
      <form onSubmit={invia} noValidate className="grid min-w-0 content-start gap-6">
        <fieldset className="min-w-0">
          <legend className="occhiello">Per cosa scrivi</legend>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {SERVIZI.map((s) => (
              <label
                key={s.id}
                className={`flex min-h-14 cursor-pointer items-center gap-3 px-4 font-disp text-sm font-semibold tracking-[.06em] uppercase ${
                  servizioId === s.id ? "bg-ink text-paper" : "bg-paper-2"
                }`}
              >
                <input
                  type="radio"
                  name="servizio-whatsapp"
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
          <label htmlFor="w-note">Note · facoltative</label>
          <textarea
            id="w-note"
            rows={3}
            value={dati.note}
            onChange={(e) => setDati({ ...dati, note: e.target.value })}
            placeholder={servizioId === "abbonamento" ? "Da quando vorresti iniziare, come ti alleni, i tuoi obiettivi, allergie" : "Allergie, orari, domande"}
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

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
          <button
            type="submit"
            className="btn btn-lime w-full whitespace-normal text-center sm:w-auto"
            disabled={mancaPiano || !configurato}
          >
            {configurato ? "Apri WhatsApp" : "WhatsApp presto disponibile"}{" "}
            <span aria-hidden="true" className="freccia">
              →
            </span>
          </button>
          <p className="max-w-[40ch] text-sm text-muted">
            {configurato
              ? "Si apre WhatsApp col messaggio già scritto: lo mandi tu."
              : "Il numero non è ancora configurato: usa il modulo qui sopra o l’email."}
          </p>
        </div>
      </form>

      <aside className="self-start bg-paper-2 p-6 md:p-8">
        <p className="occhiello">Nel messaggio</p>
        <h3 className="titolo-s mt-4">{servizio.nome}</h3>
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
  );
}

/** La stessa cosa, col servizio preso da `?servizio=`. Va dentro <Suspense>. */
export function ComposerWhatsAppDaQuery() {
  return <ComposerWhatsApp servizioIniziale={servizioDaParam(useSearchParams().get("servizio"))} />;
}
