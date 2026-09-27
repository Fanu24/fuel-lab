/* "Oggi in cucina": piatti e porzioni della produzione di oggi (ordini
   confermati o in preparazione con cucina oggi), con le allergie in rosso
   prima di tutto. Il foglio completo e stampabile e' in /dashboard/produzione. */

import Link from "next/link";
import { contaVoci, eGiornoDiCucina, prossimiGiorniCucina, spostaGiorni, type CodeOperative } from "@/lib/operazioni";
import { Icona } from "./PannelloIcone";
import { Sezione, Vuoto, giornoLungo } from "./ui";

export default function OggiCucina({ code, oggi, apri }: { code: CodeOperative | null; oggi: string; apri: (id: string) => void }) {
  const ordini = code?.cucinaOggi ?? [];
  const piatti = contaVoci(ordini, "piatti");
  const extra = contaVoci(ordini, "extra");
  const conAllergie = ordini.filter((o) => o.dietary_preferences?.trim());
  const prossimo = prossimiGiorniCucina(spostaGiorni(oggi, 1), 1)[0];

  const sotto = !code
    ? "Carico gli ordini…"
    : ordini.length
      ? `${code.porzioniOggi} porzioni · ${ordini.length} ${ordini.length === 1 ? "ordine" : "ordini"} · ${piatti.length} piatti diversi`
      : eGiornoDiCucina(oggi)
        ? "Oggi è giorno di cucina, ma non ci sono ordini confermati."
        : `Oggi non si cucina. Prossimo giorno di cucina: ${giornoLungo(prossimo)}.`;

  return (
    <Sezione
      titolo="Oggi in cucina"
      id="oggi-cucina"
      sotto={sotto}
      azione={
        <Link href="/dashboard/produzione" className="pn-tasto">
          Foglio cucina
          <Icona nome="freccia" className="size-5" />
        </Link>
      }
    >
      {conAllergie.length ? (
        <div className="pn-allergie mt-4" role="note" aria-label="Allergie negli ordini di oggi">
          <p className="pn-allergie-titolo">
            <Icona nome="attenzione" className="size-5" />
            Allergie e preferenze di oggi
          </p>
          <ul className="grid gap-1">
            {conAllergie.map((o) => (
              <li key={o.id}>
                <button type="button" className="min-h-11 text-left font-bold underline underline-offset-4" onClick={() => apri(o.id)}>
                  {o.customer_name}
                </button>
                : {o.dietary_preferences}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {piatti.length ? (
        <>
          <ul className="pn-righe mt-2">
            {piatti.map(([nome, n]) => (
              <li key={nome}>
                <span>{nome}</span>
                <strong className="num pn-conto">{n}</strong>
              </li>
            ))}
          </ul>
          {extra.length ? (
            <p className="mt-3 text-[15px]">
              <strong>Extra:</strong> {extra.map(([nome, n]) => `${nome} ×${n}`).join(" · ")}
            </p>
          ) : null}
        </>
      ) : code ? (
        <Vuoto>{ordini.length ? "Gli ordini di oggi non hanno piatti dal menu (home cooking)." : "Niente da cucinare oggi."}</Vuoto>
      ) : (
        <div className="grid gap-3 py-4" aria-hidden="true">
          <span className="pn-scheletro w-4/5" />
          <span className="pn-scheletro w-3/5" />
          <span className="pn-scheletro w-2/3" />
        </div>
      )}
    </Sezione>
  );
}
