"use client";

import { GIORNI, NOMI_GIORNO, TIPI_GIORNATA, NOMI_GIORNATA, type Allenamenti, type GiornoSettimana, type TipoGiornata } from "@/lib/settimana";

/* Il primo passo: come ti alleni, giorno per giorno. Un tocco sceglie, un
   secondo tocco sullo stesso tipo lo toglie (giorno senza pasti FUEL LAB). */

const PRESET: { label: string; valori: Allenamenti }[] = [
  {
    label: "3 pesi + 2 cardio",
    valori: { lun: "pesi", mar: "cardio", mer: "pesi", gio: "cardio", ven: "pesi", sab: "riposo", dom: "riposo" },
  },
  {
    label: "Solo cardio",
    valori: { lun: "cardio", mar: "riposo", mer: "cardio", gio: "riposo", ven: "cardio", sab: "cardio", dom: "riposo" },
  },
  {
    label: "Solo pesi",
    valori: { lun: "pesi", mar: "pesi", mer: "riposo", gio: "pesi", ven: "pesi", sab: "riposo", dom: "riposo" },
  },
];

export default function PianificaAllenamenti({
  allenamenti,
  imposta,
  applica,
  pastiAlGiorno,
  setPastiAlGiorno,
}: {
  allenamenti: Allenamenti;
  imposta: (g: GiornoSettimana, t: TipoGiornata | null) => void;
  applica: (a: Allenamenti) => void;
  pastiAlGiorno: 1 | 2;
  setPastiAlGiorno: (n: 1 | 2) => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="occhiello">Passo 1</p>
          <h2 className="titolo-s mt-3">Come ti alleni?</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Settimane tipo">
          {PRESET.map((p) => (
            <button
              key={p.label}
              type="button"
              className="min-h-11 border-2 border-ink/15 px-3 text-sm font-semibold hover:border-ink"
              onClick={() => applica(p.valori)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <ol className="allenamenti mt-6">
        {GIORNI.map((g) => (
          <li key={g} className="allenamento-giorno">
            <span className="font-disp text-xs font-bold tracking-[.16em] uppercase">
              <span className="sm:hidden">{NOMI_GIORNO[g]}</span>
              <span className="hidden sm:inline">{NOMI_GIORNO[g].slice(0, 3)}</span>
            </span>
            <div className="allenamento-scelte" role="group" aria-label={NOMI_GIORNO[g]}>
              {TIPI_GIORNATA.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={allenamenti[g] === t}
                  onClick={() => imposta(g, allenamenti[g] === t ? null : t)}
                  className={`scelta scelta-${t}`}
                >
                  {NOMI_GIORNATA[t]}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <span className="font-disp text-xs font-bold tracking-[.16em] uppercase">Pasti al giorno</span>
        <div className="segmenti" role="group" aria-label="Pasti al giorno">
          <button type="button" aria-pressed={pastiAlGiorno === 1} onClick={() => setPastiAlGiorno(1)}>
            1 · pranzo
          </button>
          <button type="button" aria-pressed={pastiAlGiorno === 2} onClick={() => setPastiAlGiorno(2)}>
            2 · pranzo e cena
          </button>
        </div>
      </div>
    </div>
  );
}
