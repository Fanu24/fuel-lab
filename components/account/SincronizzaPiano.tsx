"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { righePiano } from "@/lib/account";
import { api } from "@/lib/api";
import { ascoltaSettimana, leggiSettimana, scriviSettimana, usePiano } from "@/lib/piano";
import {
  SPENTA,
  contaPasti,
  creaSincronizzatore,
  leggiBaseDa,
  quando,
  testoSincronia,
  type Base,
  type StatoSincronia,
  type VersioneAccount,
} from "@/lib/sincronizzaPiano";
import { caricaUtente, useSessione } from "./sessione";

/* La settimana si salva da sola nell'account di chi ha fatto l'accesso.

   Il motore (lib/sincronizzaPiano: regole, attesa, riprova) e' uno per scheda
   e vive in questo modulo. Il componente, montato una volta nel layout del
   sito, gli dice chi e' collegato e gli passa gli eventi del browser (rete
   tornata, scheda nascosta o di nuovo in primo piano). Il compositore e "La
   mia settimana" leggono lo stato con useSincronia.

   Gli anonimi non toccano mai /api/plan: il motore parte solo con un utente.
   All'uscita si ferma e la settimana locale resta com'e'. */

const CHIAVE_BASE = "fuellab.sincronia.v1";
/** Se localStorage e' negato la base vive almeno per questa pagina. */
let baseInMemoria: Base | null = null;

const motore = creaSincronizzatore({
  leggiLocale: leggiSettimana,
  scriviLocale: scriviSettimana,
  ascoltaLocale: ascoltaSettimana,
  leggiAccount: () => api.piano(),
  scriviAccount: (s, se, urgente) => api.salvaPianoSe(s.piano, s.allenamenti, se, { keepalive: urgente }),
  leggiBase: () => {
    try {
      const raw = localStorage.getItem(CHIAVE_BASE);
      return raw ? leggiBaseDa(JSON.parse(raw)) : null;
    } catch {
      return baseInMemoria;
    }
  },
  scriviBase: (b) => {
    baseInMemoria = b;
    try {
      localStorage.setItem(CHIAVE_BASE, JSON.stringify(b));
    } catch {
      /* storage negato o pieno: resta quella in memoria */
    }
  },
  // Due schede aperte salvano una alla volta: la seconda trova la base gia' aggiornata e non riscrive.
  inEsclusiva: async <T,>(f: () => Promise<T>): Promise<T> =>
    typeof navigator !== "undefined" && navigator.locks
      ? await navigator.locks.request("fuellab-sincronia", () => f())
      : f(),
  suAccessoScaduto: () => void caricaUtente(true),
});

/** Lo stato della sincronizzazione e le due scelte del conflitto. */
export function useSincronia() {
  const stato = useSyncExternalStore(motore.ascolta, motore.stato, () => SPENTA);
  return { stato, usaAccount: motore.usaAccount, tieniQuesta: motore.tieniQuesta, riprovaOra: motore.riprovaOra };
}

/* Chi mostra la scelta dentro la pagina ("La mia settimana") lo dice qui: la
   versione che galleggia sopra la pagina allora si fa da parte. */
let ospiti = 0;
const ascoltaOspiti = new Set<() => void>();
function iscriviOspiti(f: () => void) {
  ascoltaOspiti.add(f);
  return () => {
    ascoltaOspiti.delete(f);
  };
}
function contaOspite(delta: number) {
  ospiti += delta;
  for (const f of ascoltaOspiti) f();
}

export function useSceltaInPagina() {
  useEffect(() => {
    contaOspite(1);
    return () => contaOspite(-1);
  }, []);
}

/* ---------- Il componente del layout ---------- */

const ID_STATO_COMPOSITORE = "sincronia-stato";

export default function SincronizzaPiano() {
  const sessione = useSessione();
  // undefined: non so ancora chi c'e' (o /api/me non risponde): non si tocca niente.
  const id = sessione.stato === "pronto" ? (sessione.utente?.id ?? null) : undefined;

  useEffect(() => {
    if (id === undefined) return;
    if (id === null) {
      motore.ferma();
      return;
    }
    motore.avvia(id);
    return () => motore.ferma();
  }, [id]);

  useEffect(() => {
    const suRete = () => motore.riprovaOra();
    const suVisibilita = () => {
      if (document.visibilityState === "visible") motore.ricontrolla();
      else motore.svuota(); // telefono in tasca o scheda cambiata: quello che aspetta parte adesso
    };
    const suUscita = () => motore.svuota();
    const suFuoco = () => motore.ricontrolla();
    window.addEventListener("online", suRete);
    document.addEventListener("visibilitychange", suVisibilita);
    window.addEventListener("pagehide", suUscita);
    window.addEventListener("focus", suFuoco);
    return () => {
      window.removeEventListener("online", suRete);
      document.removeEventListener("visibilitychange", suVisibilita);
      window.removeEventListener("pagehide", suUscita);
      window.removeEventListener("focus", suFuoco);
    };
  }, []);

  const percorso = usePathname();
  const { stato } = useSincronia();
  const inPagina = useSyncExternalStore(iscriviOspiti, () => ospiti, () => 0);
  const scelta = stato.fase === "conflitto" && inPagina === 0 ? stato.account : null;

  if (percorso === "/settimana") return <SopraBarra scelta={scelta} />;
  if (percorso !== "/account" || !scelta) return null;
  return (
    <div className="fixed inset-x-3 bottom-[calc(16px+env(safe-area-inset-bottom))] z-50 sm:inset-x-auto sm:right-6 sm:w-[28rem]">
      <SceltaVersione account={scelta} fluttuante />
    </div>
  );
}

/**
 * Dove comincia la barra dei pasti del compositore (`.barra`, sticky in
 * fondo), in coordinate dello schermo; null se non c'e' o non si sa ancora.
 * Si rimisura quando si scorre o cambia misura: in fondo alla pagina la barra
 * risale insieme alla fine del compositore, e quello che le sta attaccato la segue.
 */
function useCimaBarra(): number | null {
  const [cima, setCima] = useState<number | null>(null);
  useEffect(() => {
    let rif = 0;
    let osservata: Element | null = null;
    const misura = () => {
      rif = 0;
      const barra = document.querySelector(".barra");
      if (barra !== osservata) {
        if (osservata) ro.unobserve(osservata);
        if (barra) ro.observe(barra);
        osservata = barra;
      }
      setCima(barra ? Math.round(barra.getBoundingClientRect().top) : null);
    };
    const pianifica = () => {
      if (!rif) rif = requestAnimationFrame(misura);
    };
    const ro = new ResizeObserver(pianifica);
    pianifica();
    window.addEventListener("scroll", pianifica, { passive: true });
    window.addEventListener("resize", pianifica);
    return () => {
      cancelAnimationFrame(rif);
      ro.disconnect();
      window.removeEventListener("scroll", pianifica);
      window.removeEventListener("resize", pianifica);
    };
  }, []);
  return cima;
}

/* Nel compositore lo stato e' una linguetta attaccata sopra la barra dei
   pasti, a sinistra; se c'e' da scegliere, la scelta sta subito sopra, a
   destra, allineata al bottone "Invia a Matteo". Niente di tutto questo
   blocca la pagina: fuori dai riquadri i tocchi passano. Senza barra (o prima
   di averla misurata) resta a una distanza fissa dal fondo. */
function SopraBarra({ scelta }: { scelta: VersioneAccount | null }) {
  const cima = useCimaBarra();
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 z-50 ${
        cima === null ? "bottom-[calc(76px+env(safe-area-inset-bottom))]" : "-translate-y-full"
      }`}
      style={cima === null ? undefined : { top: cima }}
    >
      <div className="wrap flex flex-col items-start gap-3">
        {scelta ? (
          <div className="pointer-events-auto w-full sm:w-[28rem] sm:self-end">
            <SceltaVersione account={scelta} fuocoDopo={ID_STATO_COMPOSITORE} fluttuante />
          </div>
        ) : null}
        <RigaSincronia id={ID_STATO_COMPOSITORE} linguetta />
      </div>
    </div>
  );
}

/**
 * La riga di stato corta ("Salvata nel tuo account · 18:42"), da mettere dove
 * serve; `linguetta` la veste di notte, per stare attaccata alla barra. La
 * regione live c'e' sempre, anche vuota: i lettori di schermo annunciano cio'
 * che ci compare dentro, non un nodo nuovo gia' pieno.
 */
export function RigaSincronia({ id, linguetta = false, className = "" }: { id?: string; linguetta?: boolean; className?: string }) {
  const { stato } = useSincronia();
  const [adesso] = useState(() => new Date());
  const testo = testoSincronia(stato, adesso);
  return (
    <p id={id} tabIndex={-1} aria-live="polite" aria-atomic="true" className={`text-xs outline-none ${className}`}>
      {testo ? (
        <span
          className={
            linguetta
              ? "flex items-center gap-2 bg-night py-1.5 pr-4 pl-3 text-steel [clip-path:polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,0_100%)]"
              : "flex items-center gap-2"
          }
        >
          <Segno fase={stato.fase} scuro={linguetta} />
          {testo}
        </span>
      ) : null}
    </p>
  );
}

/** Il quadratino accanto allo stato: pieno quando e' salvata, vuoto mentre lavora. */
export function Segno({ fase, scuro = false }: { fase: StatoSincronia["fase"]; scuro?: boolean }) {
  const aspetto =
    fase === "salvata" ? (scuro ? "bg-lime" : "bg-ink")
    : fase === "errore" ? (scuro ? "bg-[#ff8f80]" : "bg-[#a3261b]")
    : fase === "conflitto" ? (scuro ? "border border-lime" : "bg-lime ring-1 ring-ink")
    : "border border-current motion-safe:animate-pulse";
  return <span aria-hidden="true" className={`inline-block size-2 shrink-0 ${aspetto}`} />;
}

/**
 * "Hai una settimana diversa salvata nell'account": le due scelte. Non blocca
 * niente: si puo' continuare a comporre, solo che finche' non si sceglie non si
 * salva. Dopo la scelta il fuoco va sulla riga di stato (`fuocoDopo`), invece
 * di perdersi sul body insieme ai bottoni che spariscono.
 */
export function SceltaVersione({
  account,
  fuocoDopo,
  fluttuante = false,
}: {
  account: VersioneAccount;
  fuocoDopo?: string;
  fluttuante?: boolean;
}) {
  const { piano, allenamenti } = usePiano();
  const { usaAccount, tieniQuesta } = useSincronia();
  const [adesso] = useState(() => new Date());
  const idTitolo = useId();
  const nAccount = contaPasti(account);
  const nQui = contaPasti({ piano, allenamenti });
  const momento = quando(account.updatedAt, adesso);

  function scegli(azione: () => void) {
    azione();
    if (fuocoDopo) requestAnimationFrame(() => document.getElementById(fuocoDopo)?.focus());
  }

  return (
    <div
      role="region"
      aria-labelledby={idTitolo}
      className={`grid gap-3 bg-lime p-4 text-ink sm:p-5 ${fluttuante ? "shadow-[6px_6px_0_var(--color-ink)]" : ""}`}
    >
      <p id={idTitolo} className="font-semibold">
        Hai una settimana diversa salvata nell’account{momento ? ` (aggiornata ${momento})` : ""}.
      </p>
      <p className="text-sm">
        Nell’account: {nAccount} {nAccount === 1 ? "pasto" : "pasti"}. Qui: {nQui} {nQui === 1 ? "pasto" : "pasti"}.
        {/* Il riquadro che galleggia sulla pagina resta corto: lo spazio sotto e' poco, specie sul telefono. */}
        {fluttuante ? "" : " «Usa quella dell’account» sostituisce questa; «Tieni questa» sostituisce quella nell’account."}
        {" "}Finché non scegli, questa non viene salvata.
      </p>
      {nAccount > 0 && !fluttuante ? (
        <details className="acc-dettagli-piatti text-sm">
          <summary>Vedi cosa c’è nell’account</summary>
          <ul className="mt-2 grid gap-2">
            {righePiano(account.piano).map((r) => (
              <li key={r.giorno}>
                <span className="font-semibold">{r.nome}</span>
                {r.pasti.map((p) =>
                  p.piatto || p.extra.length ? (
                    <span key={p.pasto} className="block">
                      <span className="capitalize">{p.pasto}</span> · {p.piatto ?? `solo aggiunte: ${p.extra.join(", ")}`}
                    </span>
                  ) : null,
                )}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-ink btn-sm" onClick={() => scegli(usaAccount)}>
          Usa quella dell’account
        </button>
        <button type="button" className="btn btn-linea btn-sm" onClick={() => scegli(tieniQuesta)}>
          Tieni questa
        </button>
      </div>
    </div>
  );
}
