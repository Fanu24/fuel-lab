import { REPARTI, etichettaPrezzo, extraPerReparto } from "@/lib/catalogo";

/**
 * "Alimenti per la tua box": la lista del committente, com'e' nel suo PDF.
 * Una lista e non una griglia di foto: sono ingredienti da aggiungere a un
 * piatto, non piatti da scegliere, e con le foto sembravano un secondo menu.
 */
export default function PerLaTuaBox() {
  return (
    <section className="sezione carta-2">
      <div className="wrap grid gap-12 lg:grid-cols-[1fr_2fr]">
        <div>
          <p className="occhiello">Per la tua box</p>
          <h2 className="titolo mt-5">Aggiungi quello che vuoi.</h2>
          <p className="lead mt-6">
            Ogni piatto si può arricchire: più carboidrati, un&apos;altra proteina, un condimento, uno snack. Le
            aggiunte si scelgono nel compositore, casella per casella.
          </p>
        </div>
        <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
          {REPARTI.map((r) => (
            <div key={r.id}>
              <h3 className="border-b-[3px] border-ink pb-3 font-disp text-base font-bold tracking-[.14em] uppercase">
                {r.label}
              </h3>
              <ul>
                {extraPerReparto(r.id).map((e) => (
                  <li
                    key={e.id}
                    className="flex items-baseline justify-between gap-4 border-b py-3"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <span>{e.nome}</span>
                    <span className="num shrink-0 text-sm text-muted">{etichettaPrezzo(e, true)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
