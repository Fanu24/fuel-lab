"use client";

import { MacroSplit } from "@/components/MacroBar";
import { usePiano } from "@/lib/piano";
import { NOMI_GIORNO, PASTI } from "@/lib/settimana";
import type { GiornoSettimana } from "@/lib/settimana";
import CasellaBottone, { NOMI_PASTO } from "./CasellaBottone";
import type { ApriCasella, CasellaAperta } from "./CasellaBottone";

/* =========================================================================
   Il giorno come card: la vista sotto md.

   NON e' la griglia con lo scroll orizzontale. Una 7x2 a 390px darebbe colonne
   da 45px: i nomi dei piatti diventerebbero due lettere e un trattino, e la
   riga dei macro sotto sarebbe illeggibile a prescindere da quanto si stringe
   il carattere. Lo scroll laterale non la salva, la nasconde: si vedrebbero due
   giorni per volta senza mai vedere la settimana, che e' l'unica cosa che
   questa pagina esiste per far vedere.

   Quindi sotto md l'informazione cambia FORMA. L'asse orizzontale (i giorni)
   diventa verticale - una card per giorno, impilate - e dentro ogni card i due
   pasti tornano uno sotto l'altro con la larghezza piena: i nomi si leggono per
   intero, gli extra hanno il loro nome invece di un pallino, e i macro del
   giorno stanno nell'intestazione dove si leggono prima di scorrere.
   ========================================================================= */

export default function ColonnaGiorno({
  giorno,
  apri,
  aperta,
}: {
  giorno: GiornoSettimana;
  apri: ApriCasella;
  aperta: CasellaAperta | null;
}) {
  const { casella, macroGiorno } = usePiano();
  const macro = macroGiorno(giorno);

  return (
    <article className="shell">
      <div className="core p-4">
        <header
          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b pb-4"
          style={{ borderColor: "var(--hair-soft)" }}
        >
          {/* .h3 scala su min(38px, 4.6vw): a 390px varrebbe 18px, cioe' meno
              del testo dentro le caselle. Qui la misura la fissa la utility. */}
          <h3 className="h3 text-[27px]">{NOMI_GIORNO[giorno]}</h3>
          <p className="mono text-[12px] font-bold">
            {Math.round(macro.kcal)}
            <span className="font-medium text-muted"> kcal</span>
          </p>
          <div className="w-full">
            <MacroSplit
              proteine={macro.proteine}
              carboidrati={macro.carboidrati}
              grassi={macro.grassi}
            />
            <p className="mono mt-2 text-[10px] font-medium text-muted">
              P {macro.proteine} g · C {macro.carboidrati} g · G {macro.grassi} g
            </p>
          </div>
        </header>

        <div className="mt-4 flex flex-col gap-4">
          {PASTI.map((m) => (
            <div key={m}>
              <span className="rowlab mb-2">{NOMI_PASTO[m]}</span>
              <CasellaBottone
                giorno={giorno}
                pasto={m}
                casella={casella(giorno, m)}
                variante="riga"
                aperta={aperta?.giorno === giorno && aperta?.pasto === m}
                onApri={apri}
              />
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
