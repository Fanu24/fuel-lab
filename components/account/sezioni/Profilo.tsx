"use client";

import { useState, type FormEvent, type InputHTMLAttributes } from "react";
import { erroreTelefono, eSessioneScaduta, messaggioDa, traduciErroreAuth } from "@/lib/account";
import { api, type Profilo as TipoProfilo, type Utente } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { impostaUtente } from "../sessione";
import { Avviso, Caricamento, EsitoAzione, TitoloSezione } from "../ui";
import type { Dati, Esito } from "./tipi";

/* Nome (sta nell'utente di better-auth) e recapiti (customer_profiles) in un
   modulo solo. Le preferenze arrivano a Matteo con ogni richiesta. */

const PREFERENZE_MAX = 1000;

export default function Profilo({ utente, profilo }: { utente: Utente; profilo: Dati<TipoProfilo> }) {
  return (
    <section aria-labelledby="t-profilo" className="grid gap-8">
      <div>
        <TitoloSezione id="t-profilo">Il tuo profilo.</TitoloSezione>
        <p className="lead mt-4">Li scrivi una volta e ogni richiesta parte già compilata.</p>
      </div>
      {profilo.stato === "attesa" ? (
        <Caricamento testo="Carico il profilo…" righe={4} />
      ) : profilo.stato === "errore" ? (
        <Avviso
          tipo="errore"
          azioni={<button type="button" className="btn btn-ink btn-sm" onClick={() => void profilo.ricarica()}>Riprova</button>}
        >
          {profilo.messaggio}
        </Avviso>
      ) : (
        <Modulo utente={utente} iniziale={profilo.dati} onSalvato={profilo.imposta} />
      )}
    </section>
  );
}

type Campo = "nome" | "phone" | "comune" | "address" | "preferences";

function Modulo({ utente, iniziale, onSalvato }: { utente: Utente; iniziale: TipoProfilo; onSalvato: (p: TipoProfilo) => void }) {
  const [nome, setNome] = useState(utente.name ?? "");
  const [campi, setCampi] = useState<TipoProfilo>(iniziale);
  const [errori, setErrori] = useState<Partial<Record<Campo, string>>>({});
  const [invio, setInvio] = useState(false);
  const [esito, setEsito] = useState<Esito | null>(null);

  /* L'errore di un campo sparisce appena lo si corregge, e un salvataggio gia' riuscito non resta scritto
     sopra modifiche nuove: "Profilo salvato." accanto a un campo cambiato dopo non e' piu' vero. */
  function modifica(campo: Campo) {
    setErrori((e) => {
      if (!e[campo]) return e;
      const resto = { ...e };
      delete resto[campo];
      return resto;
    });
    setEsito((s) => (s?.ok ? null : s));
  }

  function controlla(): Partial<Record<Campo, string>> {
    const e: Partial<Record<Campo, string>> = {};
    if (!nome.trim()) e.nome = "Scrivi il tuo nome.";
    else if (nome.trim().length > 100) e.nome = "Il nome può avere al massimo 100 caratteri.";
    const telefono = erroreTelefono(campi.phone);
    if (telefono) e.phone = telefono;
    if (campi.preferences.length > PREFERENZE_MAX) e.preferences = `Al massimo ${PREFERENZE_MAX} caratteri.`;
    return e;
  }

  async function salva(ev: FormEvent) {
    ev.preventDefault();
    if (invio) return;
    const e = controlla();
    setErrori(e);
    const primo = (["nome", "phone", "comune", "address", "preferences"] as const).find((k) => e[k]);
    if (primo) {
      document.getElementById(`pr-${primo}`)?.focus();
      return;
    }
    setInvio(true);
    setEsito(null);
    try {
      const nuovoNome = nome.trim();
      if (nuovoNome !== utente.name) {
        const r = await authClient.updateUser({ name: nuovoNome });
        if (r.error) {
          const t = traduciErroreAuth(r.error, "nome");
          setEsito({ ok: false, testo: t.messaggio, sessione: t.tipo === "sessione" });
          setInvio(false);
          return;
        }
        impostaUtente({ ...utente, name: nuovoNome });
      }
      const r = await api.salvaProfilo({
        phone: campi.phone.trim(),
        comune: campi.comune.trim(),
        address: campi.address.trim(),
        preferences: campi.preferences.trim(),
      });
      onSalvato(r.profile);
      setCampi(r.profile);
      setEsito({ ok: true, testo: "Profilo salvato." });
    } catch (err) {
      setEsito({ ok: false, testo: messaggioDa(err, "Non riesco a salvare il profilo. Riprova tra poco."), sessione: eSessioneScaduta(err) });
    }
    setInvio(false);
  }

  const input = (
    k: Exclude<Campo, "nome" | "preferences">,
    etichetta: string,
    extra: InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <div className="campo">
      <label htmlFor={`pr-${k}`}>{etichetta}</label>
      <input
        id={`pr-${k}`}
        value={campi[k]}
        onChange={(e) => { setCampi((c) => ({ ...c, [k]: e.target.value })); modifica(k); }}
        aria-invalid={errori[k] ? true : undefined}
        aria-describedby={errori[k] ? `pr-${k}-errore` : undefined}
        {...extra}
      />
      {errori[k] ? <p id={`pr-${k}-errore`} className="errore">{errori[k]}</p> : null}
    </div>
  );

  return (
    <form noValidate onSubmit={(e) => void salva(e)} className="grid max-w-3xl gap-6" aria-busy={invio}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="campo sm:col-span-2">
          <label htmlFor="pr-nome">Nome e cognome</label>
          <input
            id="pr-nome"
            autoComplete="name"
            maxLength={100}
            value={nome}
            onChange={(e) => { setNome(e.target.value); modifica("nome"); }}
            aria-invalid={errori.nome ? true : undefined}
            aria-describedby={errori.nome ? "pr-nome-errore" : undefined}
          />
          {errori.nome ? <p id="pr-nome-errore" className="errore">{errori.nome}</p> : null}
        </div>
        <div className="sm:col-span-2">
          <p className="acc-etichetta">Email</p>
          <p className="mt-2 [overflow-wrap:anywhere]">{utente.email}</p>
          <p className="mt-1 text-sm text-muted">
            Per cambiarla scrivi a <a className="underline underline-offset-2" href="mailto:info@fuelchef.it">info@fuelchef.it</a>.
          </p>
        </div>
        {input("phone", "Telefono", { type: "tel", inputMode: "tel", autoComplete: "tel", maxLength: 40 })}
        {input("comune", "Comune", { autoComplete: "address-level2", maxLength: 100, placeholder: "Pescara, Montesilvano…" })}
        <div className="sm:col-span-2">
          {input("address", "Indirizzo per la consegna", { autoComplete: "street-address", maxLength: 240 })}
        </div>
        <div className="campo sm:col-span-2">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="pr-preferences">Preferenze alimentari e allergie</label>
            <span className="num text-xs text-muted" aria-hidden="true">{campi.preferences.length}/{PREFERENZE_MAX}</span>
          </div>
          <textarea
            id="pr-preferences"
            rows={4}
            maxLength={PREFERENZE_MAX}
            value={campi.preferences}
            onChange={(e) => { setCampi((c) => ({ ...c, preferences: e.target.value })); modifica("preferences"); }}
            placeholder="Es. niente lattosio, allergia alla frutta a guscio, poco piccante"
            aria-invalid={errori.preferences ? true : undefined}
            aria-describedby={["pr-preferences-aiuto", errori.preferences ? "pr-preferences-errore" : null].filter(Boolean).join(" ")}
          />
          <p id="pr-preferences-aiuto" className="text-sm text-muted">
            Matteo le legge in ogni richiesta. Per un’allergia grave scrivilo chiaramente: gli allergeni di ogni piatto sono nel menu.
          </p>
          {errori.preferences ? <p id="pr-preferences-errore" className="errore">{errori.preferences}</p> : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-ink" aria-disabled={invio ? true : undefined}>
          {invio ? "Salvo…" : "Salva il profilo"}
        </button>
      </div>
      <EsitoAzione esito={esito} />
    </form>
  );
}
