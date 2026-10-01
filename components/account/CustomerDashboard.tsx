"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  dataIso,
  erroreDiRitorno,
  fasciaDa,
  formulaDa,
  modalitaDa,
  nucleoDa,
  hrefSezione,
  messaggioDa,
  primoNome,
  SEZIONI,
  servizioDa,
  sezioneDa,
  STATI_IN_CORSO,
} from "@/lib/account";
import { api, type Profilo, type Providers, type Utente } from "@/lib/api";
import { Addio, Invito } from "./Invito";
import { caricaUtente, impostaUtente, useSessione } from "./sessione";
import NuovaRichiesta from "./sezioni/NuovaRichiesta";
import Panoramica from "./sezioni/Panoramica";
import ProfiloSezione from "./sezioni/Profilo";
import Richieste from "./sezioni/Richieste";
import Settimana from "./sezioni/Settimana";
import Sicurezza from "./sezioni/Sicurezza";
import { AttesaAccount } from "./Stati";
import { Avviso, useDati } from "./ui";

/* /account: il guscio dell'area cliente.

   Chi e' collegato arriva da useSessione (la stessa chiamata della nav);
   profilo e richieste si caricano qui una volta e passano alle sezioni. La
   sezione aperta sta in ?sezione=, cosi' i link del compositore
   (?sezione=richiesta) e il tasto indietro del browser funzionano. */

export default function CustomerDashboard() {
  const sessione = useSessione();
  const parametri = useSearchParams();
  const [addio, setAddio] = useState(false);
  // Chi era dentro e non lo e' piu' (senza averlo scelto) ha la sessione scaduta: l'invito lo dice.
  const [eraDentro, setEraDentro] = useState(false);
  if (sessione.utente && !eraDentro) setEraDentro(true);

  const onEliminato = useCallback(() => {
    setAddio(true);
    impostaUtente(null);
  }, []);

  if (addio) return <Addio />;
  if (sessione.stato === "attesa") return <AttesaAccount />;
  if (sessione.stato === "errore") return <ErroreSessione />;
  if (!sessione.utente) {
    const q = new URLSearchParams(parametri.toString());
    q.delete("error");
    const qui = q.toString() ? `/account?${q}` : "/account";
    return (
      <Invito
        qui={qui}
        sezione={sezioneDa(parametri.get("sezione"))}
        servizio={servizioDa(parametri.get("servizio"))}
        errore={erroreDiRitorno(parametri.get("error"))}
        scaduta={eraDentro}
      />
    );
  }
  return <AreaCliente utente={sessione.utente} onEliminato={onEliminato} />;
}

function ErroreSessione() {
  const [riprovo, setRiprovo] = useState(false);
  return (
    <section className="acc-testata acc-schermata wrap pb-[var(--sezione)]">
      <p className="occhiello">Il tuo spazio</p>
      <h1 className="titolo mt-4">Area cliente.</h1>
      <Avviso
        tipo="errore"
        className="mt-8 max-w-2xl"
        azioni={
          <button
            type="button"
            className="btn btn-ink btn-sm"
            aria-disabled={riprovo ? true : undefined}
            onClick={() => {
              if (riprovo) return;
              setRiprovo(true);
              void caricaUtente(true).then(() => setRiprovo(false));
            }}
          >
            {riprovo ? "Riprovo…" : "Riprova"}
          </button>
        }
      >
        Non riesco a verificare l’accesso. Controlla la connessione e riprova tra poco.
      </Avviso>
    </section>
  );
}

const caricaProfilo = () => api.profilo().then((r) => r.profile);
const erroreProfilo = (e: unknown) => messaggioDa(e, "Non riesco a leggere il profilo.");
const erroreOrdini = (e: unknown) => messaggioDa(e, "Non riesco a leggere le richieste.");

function AreaCliente({ utente, onEliminato }: { utente: Utente; onEliminato: () => void }) {
  const parametri = useSearchParams();
  const router = useRouter();
  const sezione = sezioneDa(parametri.get("sezione"));
  const apri = parametri.get("apri");
  const [oggi] = useState(() => dataIso(new Date()));
  const [appenaInviata, setAppenaInviata] = useState<string | null>(null);
  const [providers, setProviders] = useState<Providers | null>(null);

  // /api/orders all'amministratore restituisce le richieste di tutti: qui solo le sue.
  const caricaOrdini = useCallback(
    // Per Matteo il server manda tutti gli ordini: qui solo i suoi, senza quelli inseriti a mano per altri.
    () => api.ordini().then((r) => r.orders.filter((o) => o.user_id === utente.id && o.source !== "manual")),
    [utente.id],
  );
  const ordini = useDati(caricaOrdini, erroreOrdini);
  const profilo = useDati<Profilo>(caricaProfilo, erroreProfilo);

  /* Un 401 mentre si caricano i dati: la sessione e' finita ma la pagina non lo sa. Si rilegge chi e' collegato:
     senza utente l'area cliente passa all'invito ad accedere, che riporta qui dopo l'accesso. */
  const sessioneFinita = (ordini.stato === "errore" && !!ordini.sessione) || (profilo.stato === "errore" && !!profilo.sessione);
  useEffect(() => {
    if (sessioneFinita) void caricaUtente(true);
  }, [sessioneFinita]);

  useEffect(() => {
    let vivo = true;
    api.providers().then(
      (p) => { if (vivo) setProviders(p); },
      () => {},
    );
    return () => {
      vivo = false;
    };
  }, []);

  /* Cambio di sezione: se la barra e' gia' incollata in alto si torna al suo
     punto di partenza, poi il fuoco va sul titolo della sezione nuova (chi usa
     un lettore di schermo sente dove e' arrivato). Al primo arrivo no.
     Layout effect: gira prima degli effetti delle sezioni, cosi' una richiesta
     da aprire (?apri=) puo' ancora scorrere fino a se' e prendersi il fuoco. */
  const ancora = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const primoGiro = useRef(true);
  // Sul telefono la barra delle sezioni scorre: finche' c'e' altro a destra il bordo sfuma (account.css), a fine corsa no.
  const [fineBarra, setFineBarra] = useState(false);
  const misuraBarra = useCallback(() => {
    const l = lista.current;
    if (l) setFineBarra(l.scrollLeft + l.clientWidth >= l.scrollWidth - 2);
  }, []);
  useLayoutEffect(() => {
    const attiva = lista.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (attiva && lista.current) {
      lista.current.scrollLeft = Math.max(0, attiva.offsetLeft - 16);
    }
    misuraBarra();
    if (primoGiro.current) {
      primoGiro.current = false;
      return;
    }
    const a = ancora.current;
    if (a) {
      const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 64;
      const y = a.getBoundingClientRect().top + window.scrollY - nav;
      if (window.scrollY > y) window.scrollTo({ top: y });
    }
    document.querySelector<HTMLElement>("[data-titolo-sezione]")?.focus({ preventScroll: true });
  }, [sezione, misuraBarra]);

  const ricaricaOrdini = ordini.ricarica;
  const inviata = useCallback(
    (id: string) => {
      setAppenaInviata(id);
      void ricaricaOrdini();
      router.push(hrefSezione("richieste", { apri: id }), { scroll: false });
    },
    [ricaricaOrdini, router],
  );

  const inCorso = ordini.stato === "pronto" ? ordini.dati.filter((o) => STATI_IN_CORSO.includes(o.status)).length : 0;
  const admin = utente.role === "admin";
  const props = { utente, profilo, ordini, providers, oggi };

  return (
    <div>
      <header className="acc-testata wrap">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <p className="occhiello">Il tuo spazio</p>
            <h1 className="titolo mt-4 [overflow-wrap:anywhere]">Ciao, {primoNome(utente.name, utente.email)}.</h1>
            <p className="mt-3 text-muted [overflow-wrap:anywhere]">{utente.email}</p>
          </div>
          {admin ? (
            <Link href="/dashboard" className="btn btn-ink btn-sm">
              Pannello di Matteo <span className="freccia" aria-hidden="true">→</span>
            </Link>
          ) : null}
        </div>
      </header>

      <div ref={ancora} />
      <nav className="acc-sottonav" aria-label="Sezioni dell’account" data-fine={fineBarra}>
        <div className="wrap">
          <ul ref={lista} className="acc-sottonav-lista" onScroll={misuraBarra}>
            {SEZIONI.map((s) => (
              <li key={s.id}>
                <Link href={hrefSezione(s.id)} scroll={false} aria-current={sezione === s.id ? "page" : undefined}>
                  {s.etichetta}
                  {s.id === "richieste" && inCorso > 0 ? (
                    <span className="acc-conta">
                      <span className="sr-only">, in corso: </span>
                      {inCorso}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="wrap acc-corpo">
        {sezione === "panoramica" ? <Panoramica {...props} /> : null}
        {sezione === "settimana" ? <Settimana /> : null}
        {sezione === "richieste" ? <Richieste ordini={ordini} apri={apri} appenaInviata={appenaInviata} oggi={oggi} /> : null}
        {sezione === "richiesta" ? (
          <NuovaRichiesta
            // Il modulo prende servizio, formula e fascia solo all'apertura: se l'indirizzo cambia (un altro
            // link "Richiedi" del sito) va rimontato, altrimenti resterebbe la scelta di prima.
            key={`${parametri.get("servizio")}-${parametri.get("formula")}-${parametri.get("fascia")}-${parametri.get("modalita")}-${parametri.get("nucleo")}`}
            utente={utente}
            profilo={profilo}
            servizioIniziale={servizioDa(parametri.get("servizio"))}
            formulaIniziale={formulaDa(parametri.get("formula"))}
            fasciaIniziale={fasciaDa(parametri.get("fascia"))}
            modalitaIniziale={modalitaDa(parametri.get("modalita"))}
            nucleoIniziale={nucleoDa(parametri.get("nucleo"))}
            ricerca={parametri.toString()}
            onInviata={inviata}
          />
        ) : null}
        {sezione === "profilo" ? <ProfiloSezione utente={utente} profilo={profilo} /> : null}
        {sezione === "sicurezza" ? <Sicurezza utente={utente} providers={providers} ordini={ordini} onEliminato={onEliminato} /> : null}
      </div>
    </div>
  );
}
