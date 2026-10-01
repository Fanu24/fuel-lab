"use client";

/* "Nuovo ordine a mano", prima sezione: chi ordina.

   Cliente registrato: si cerca per nome, email o telefono fra gli account
   (adminApi.clienti, gia' ordinati per ultimo ordine) e un tocco copia i dati
   del profilo nel modulo. Senza account: nome e telefono scritti a mano,
   l'ordine resta intestato a Matteo e non parte nessuna email. */

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { adminApi, ApiError, type ClienteAdmin } from "@/lib/api";
import { plurale } from "@/lib/operazioni";
import { cercaClienti, type CampiNuovoOrdine, type ErroriNuovoOrdine, type ModoCliente } from "@/lib/ordine-manuale";
import { Allergie } from "./OrdineInfo";
import { Icona } from "./PannelloIcone";
import { Campo, Scelte } from "./OrdineNuovoParti";

export default function OrdineNuovoCliente({
  campi,
  errori,
  onModo,
  onCliente,
  onCampo,
}: {
  campi: CampiNuovoOrdine;
  errori: ErroriNuovoOrdine;
  onModo: (modo: ModoCliente, prefill?: { nome?: string; telefono?: string }) => void;
  onCliente: (cliente: ClienteAdmin | null) => void;
  onCampo: (campo: "nome" | "telefono", valore: string) => void;
}) {
  const [clienti, setClienti] = useState<ClienteAdmin[] | null>(null);
  const [errore, setErrore] = useState("");
  const [ricerca, setRicerca] = useState("");
  const cartellino = useRef<HTMLParagraphElement>(null);
  const cerca = useRef<HTMLInputElement>(null);
  const daFocalizzare = useRef<"cartellino" | "cerca" | null>(null);

  const carica = useCallback(() => {
    setErrore("");
    adminApi
      .clienti()
      .then(({ customers }) => setClienti(customers))
      .catch((e) => setErrore(e instanceof ApiError ? e.message : "Non riesco a caricare i clienti."));
  }, []);

  useEffect(() => {
    const t = window.setTimeout(carica, 0);
    return () => window.clearTimeout(t);
  }, [carica]);

  // Dopo "scegli" o "cambia cliente" il focus va dove si continua a lavorare.
  useEffect(() => {
    if (daFocalizzare.current === "cartellino") cartellino.current?.focus();
    if (daFocalizzare.current === "cerca") cerca.current?.focus();
    daFocalizzare.current = null;
  }, [campi.cliente]);

  const scelto = campi.modo === "registrato" ? campi.cliente : null;
  const { trovati, altri } = clienti ? cercaClienti(clienti, ricerca) : { trovati: [], altri: 0 };

  function scegli(c: ClienteAdmin) {
    daFocalizzare.current = "cartellino";
    onCliente(c);
  }

  function cambia() {
    daFocalizzare.current = "cerca";
    onCliente(null);
  }

  /** "Non e' registrato": si passa a senza account portandosi dietro quello che si e' gia' scritto. */
  function passaSenzaAccount() {
    const t = ricerca.trim();
    if (!t || t.includes("@")) onModo("senza-account");
    else if (/\p{L}/u.test(t)) onModo("senza-account", { nome: t });
    else onModo("senza-account", { telefono: t });
  }

  function suTasto(e: KeyboardEvent<HTMLInputElement>) {
    // Invio nella ricerca non deve inviare l'ordine: se c'e' un solo risultato, lo sceglie.
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (trovati.length === 1) scegli(trovati[0]);
  }

  return (
    <section aria-labelledby="nuovo-cliente" className="grid gap-4">
      <h3 id="nuovo-cliente" className="pn-h3 mb-0">Cliente</h3>
      <Scelte
        nome="nuovo-modo"
        legenda="Chi ordina"
        valore={campi.modo}
        opzioni={[
          { id: "registrato", label: "Cliente registrato" },
          { id: "senza-account", label: "Senza account" },
        ]}
        onScegli={(m) => onModo(m)}
        aiuto={
          campi.modo === "registrato"
            ? "L’ordine va nel suo account: riceve le email quando cambi lo stato, come per gli ordini dal sito."
            : "L’ordine resta intestato a te: nessuna email al cliente, lo avvisi tu per telefono o WhatsApp."
        }
      />

      {campi.modo === "registrato" && scelto ? (
        <div className="grid gap-3">
          <div className="pn-nota grid gap-1 whitespace-normal">
            <p ref={cartellino} tabIndex={-1} className="text-[18px] font-bold outline-none">
              <span className="sr-only">Cliente scelto: </span>
              {scelto.name || "Cliente senza nome"}
            </p>
            <p className="break-all text-[15px] text-muted">
              {scelto.email}
              {scelto.emailVerified ? "" : " · email non verificata"}
            </p>
            <p className="text-[15px] text-muted">
              {scelto.orders ? `${plurale(scelto.orders, "ordine", "ordini")} finora` : "Primo ordine"}
              {scelto.phone ? "" : " · nessun telefono nel profilo"}
            </p>
            <button type="button" className="pn-tasto mt-1 justify-self-start" onClick={cambia}>
              Cambia cliente
            </button>
          </div>
          <Allergie testo={scelto.preferences} compatto />
        </div>
      ) : null}

      {campi.modo === "registrato" && !scelto ? (
        <div className="grid gap-3">
          <div className="campo">
            <label htmlFor="nuovo-cerca-cliente">Cerca il cliente</label>
            <div className="pn-cerca-campo">
              <Icona nome="cerca" className="size-5" />
              <input
                ref={cerca}
                id="nuovo-cerca-cliente"
                type="search"
                value={ricerca}
                onChange={(e) => setRicerca(e.target.value)}
                onKeyDown={suTasto}
                placeholder="Nome, email o telefono"
                autoComplete="off"
                enterKeyHint="search"
                aria-controls="nuovo-risultati"
                aria-invalid={errori.cliente ? true : undefined}
                aria-describedby={errori.cliente ? "nuovo-cerca-cliente-errore" : undefined}
              />
            </div>
            {errori.cliente ? <p id="nuovo-cerca-cliente-errore" className="pn-errore-campo">{errori.cliente}</p> : null}
          </div>

          {errore ? (
            <div className="grid gap-2">
              <p className="pn-avviso pn-avviso-errore" role="alert">{errore}</p>
              <button type="button" className="pn-tasto justify-self-start" onClick={carica}>Riprova</button>
            </div>
          ) : !clienti ? (
            <p className="pn-aiuto" role="status">Carico i clienti…</p>
          ) : (
            <>
              <p className="sr-only" role="status" aria-live="polite">
                {ricerca.trim() ? `${plurale(trovati.length + altri, "cliente trovato", "clienti trovati")}` : ""}
              </p>
              {trovati.length ? (
                <ul id="nuovo-risultati" className="grid gap-2" aria-label={ricerca.trim() ? "Clienti trovati" : "Clienti recenti"}>
                  {trovati.map((c) => (
                    <li key={c.id}>
                      <button type="button" className="pn-carta min-h-14 w-full text-left hover:border-ink" onClick={() => scegli(c)}>
                        <span className="block text-[17px] font-bold leading-tight">{c.name || "Cliente senza nome"}</span>
                        <span className="block break-all text-[14px] text-muted">
                          {[c.phone, c.email, c.comune].filter(Boolean).join(" · ")}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p id="nuovo-risultati" className="pn-vuoto py-2">
                  {clienti.length ? `Nessun cliente trovato per “${ricerca.trim()}”.` : "Non ci sono ancora clienti registrati."}
                </p>
              )}
              {altri ? <p className="pn-aiuto">E altri {altri}: scrivi di più per restringere.</p> : null}
            </>
          )}
          <button type="button" className="pn-tasto justify-self-start" onClick={passaSenzaAccount}>
            Non è registrato: inseriscilo senza account
          </button>
        </div>
      ) : null}

      {campi.modo === "senza-account" || scelto ? (
        <div className="pn-due-campi">
          <Campo id="nuovo-nome" etichetta="Nome e cognome" errore={errori.nome}>
            {(aria) => (
              <input {...aria} type="text" value={campi.nome} onChange={(e) => onCampo("nome", e.target.value)} autoComplete="off" maxLength={100} />
            )}
          </Campo>
          <Campo id="nuovo-telefono" etichetta="Telefono" errore={errori.telefono}>
            {(aria) => (
              <input
                {...aria}
                type="tel"
                inputMode="tel"
                value={campi.telefono}
                onChange={(e) => onCampo("telefono", e.target.value)}
                autoComplete="off"
                maxLength={40}
              />
            )}
          </Campo>
        </div>
      ) : null}
    </section>
  );
}
