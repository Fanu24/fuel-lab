"use client";

import { useSyncExternalStore } from "react";
import CartaPiatto from "@/components/menu/CartaPiatto";
import AggiungiAllaSettimana from "@/components/menu/AggiungiAllaSettimana";
import { PIATTI, type Piatto } from "@/lib/catalogo";
import { CONSIGLI } from "@/lib/consigli";

/* Un filtro solo. Con sei piatti, quattro gruppi di filtri e un ordinamento
   erano piu' controlli che risultati: l'unica domanda che conta davvero e'
   "come mi alleno?". Il valore sta nella URL, cosi' il link si condivide. */
const FILTRI = [
  { id: "tutti", label: "Tutti" },
  { id: "cardio", label: "Cardio" },
  { id: "pesi", label: "Pesi" },
] as const;
type Filtro = (typeof FILTRI)[number]["id"];

function passa(p: Piatto, f: Filtro): boolean {
  if (f === "tutti") return true;
  return p.allenamento === f || p.allenamento === "entrambi";
}

/* Il filtro si legge dall'indirizzo del browser, non da useSearchParams: quell'hook
   toglie la pagina dall'HTML statico e lascia un riquadro vuoto fino all'idratazione.
   Cosi' il server disegna i sei piatti (filtro "tutti") e il browser, se trova
   ?allenamento=, aggiorna. Il filtro scelto si scrive con replaceState e si avvisa
   chi ascolta con un evento: i bottoni indietro e avanti arrivano da popstate. */
const EVENTO = "fuellab:filtro-menu";
function ascolta(f: () => void) {
  window.addEventListener("popstate", f);
  window.addEventListener(EVENTO, f);
  return () => {
    window.removeEventListener("popstate", f);
    window.removeEventListener(EVENTO, f);
  };
}
const leggi = (): Filtro => {
  const grezzo = new URLSearchParams(window.location.search).get("allenamento");
  return grezzo === "cardio" || grezzo === "pesi" ? grezzo : "tutti";
};

export default function MenuClient() {
  const filtro = useSyncExternalStore(ascolta, leggi, (): Filtro => "tutti");
  const piatti = PIATTI.filter((p) => passa(p, filtro));

  function scegli(f: Filtro) {
    const q = f === "tutti" ? "" : `?allenamento=${f}`;
    window.history.replaceState(null, "", `${window.location.pathname}${q}`);
    window.dispatchEvent(new Event(EVENTO));
  }

  return (
    <section className="pb-[var(--sezione)]">
      <div className="wrap">
        <div className="flex flex-wrap items-center justify-between gap-4 border-y py-4" style={{ borderColor: "var(--line)" }}>
          <div className="segmenti" role="group" aria-label="Filtra per allenamento">
            {FILTRI.map((f) => (
              <button key={f.id} type="button" aria-pressed={filtro === f.id} onClick={() => scegli(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted" aria-live="polite">
            {filtro === "tutti" ? `${piatti.length} piatti` : `${piatti.length} piatti · ${CONSIGLI[filtro].regola}`}
          </p>
        </div>

        {filtro !== "tutti" ? (
          <p className="mt-6 max-w-[64ch] text-muted">{CONSIGLI[filtro].perche}</p>
        ) : null}

        {/* i titoli delle carte sono h3: sotto l'h1 della pagina serve il livello di mezzo */}
        <h2 className="sr-only">I piatti</h2>
        <ul className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {piatti.map((p) => (
            <li key={p.id}>
              <CartaPiatto piatto={p} grande />
              <div className="mt-5">
                <AggiungiAllaSettimana piattoId={p.id} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
