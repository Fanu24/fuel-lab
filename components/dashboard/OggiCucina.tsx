/* "Oggi in cucina": piatti e porzioni della produzione di oggi (ordini
   confermati o in preparazione con cucina oggi) e le consegne in abbonamento
   del giorno (una ogni 3 giorni per abbonamento, con i pasti dei tre giorni
   coperti), con le allergie in rosso prima di tutto. Si cucina ogni giorno:
   l'unico giorno "senza cucina" e' una chiusura segnata in Impostazioni. Il
   foglio completo e stampabile e' in /dashboard/produzione. */

import Link from "next/link";
import type { Chiusura } from "@/lib/api";
import { periodo } from "@/lib/impostazioni";
import { contaVoci, elencoNomi, plurale, type CodeOperative } from "@/lib/operazioni";
import { consegnaDelGiorno, frasePasti, nomeAbbonamento, pastiComeOrdini } from "@/lib/produzione";
import { Icona } from "./PannelloIcone";
import { Sezione, Vuoto, giorno as giornoCorto } from "./ui";

export default function OggiCucina({
  code,
  oggi,
  apri,
  chiusura = null,
  abbonamentiSettimana = null,
}: {
  code: CodeOperative | null;
  oggi: string;
  apri: (id: string) => void;
  /** La chiusura che comprende oggi, se Matteo e' chiuso. */
  chiusura?: Chiusura | null;
  /** Le consegne in abbonamento dei prossimi 7 giorni, oggi compreso, e i pasti che portano. */
  abbonamentiSettimana?: { consegne: number; pasti: number } | null;
}) {
  const ordini = code?.cucinaOggi ?? [];
  const abbonamenti = code?.abbonamentiOggi ?? [];
  // Come nel foglio cucina: i piatti degli ordini piu' quelli che i clienti hanno indicato per i pasti delle consegne.
  const perContare = [...ordini, ...pastiComeOrdini(abbonamenti, oggi)];
  const piatti = contaVoci(perContare, "piatti");
  const extra = contaVoci(perContare, "extra");
  // Allergie di chi mangia oggi: ordini e abbonamenti, un nome una volta sola.
  const conAllergie = [...ordini, ...abbonamenti].filter((o, i, tutti) => o.dietary_preferences?.trim() && tutti.findIndex((x) => x.id === o.id) === i);

  const sotto = !code
    ? "Carico gli ordini…"
    : ordini.length || abbonamenti.length
      ? [
          plurale(code.porzioniOggi, "porzione", "porzioni"),
          ordini.length ? plurale(ordini.length, "ordine", "ordini") : "",
          abbonamenti.length ? plurale(abbonamenti.length, "consegna in abbonamento", "consegne in abbonamento") : "",
          piatti.length ? plurale(piatti.length, "piatto diverso", "piatti diversi") : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : chiusura
        ? `Oggi sei chiuso, ${periodo(chiusura.dal, chiusura.al, oggi)}${chiusura.motivo ? ` (${chiusura.motivo})` : ""}.`
        : "Nessun ordine confermato con cucina oggi.";

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
      {chiusura && (ordini.length || abbonamenti.length) ? (
        <p className="pn-avviso pn-avviso-errore mt-4" role="note">
          Oggi risulti chiuso {periodo(chiusura.dal, chiusura.al, oggi)}, ma hai ordini da cucinare: controlla o sposta le date.
        </p>
      ) : null}

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
        ordini.length ? (
          <Vuoto>Gli ordini di oggi non hanno piatti dal menu (home cooking).</Vuoto>
        ) : abbonamenti.length ? null : (
          <Vuoto>{chiusura ? "Giorno di chiusura: niente da cucinare." : "Niente da cucinare oggi."}</Vuoto>
        )
      ) : (
        <div className="grid gap-3 py-4" aria-hidden="true">
          <span className="pn-scheletro w-4/5" />
          <span className="pn-scheletro w-3/5" />
          <span className="pn-scheletro w-2/3" />
        </div>
      )}

      {abbonamenti.length ? (
        <div className="mt-4">
          <h3 className="pn-h3">Consegne in abbonamento oggi</h3>
          <ul className="pn-righe">
            {abbonamenti.map((o) => {
              const c = consegnaDelGiorno(o, oggi);
              return (
                <li key={o.id} className="pn-riga-abb">
                  <span className="min-w-0">
                    <button type="button" className="pn-nome" onClick={() => apri(o.id)}>
                      {o.customer_name || "Cliente senza nome"}
                    </button>
                    <span className="pn-riga-abb-dettaglio">
                      {nomeAbbonamento(o)}
                      {c ? ` · ${frasePasti(c.pasti)} · fino a ${giornoCorto(c.fino)}` : ""}
                    </span>
                  </span>
                  <strong className="num pn-conto" aria-label={c ? plurale(c.pasti.length, "pasto", "pasti") : undefined}>
                    {c?.pasti.length ?? 0}
                  </strong>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {code ? (
        <p className="mt-3 text-[15px]">
          <strong>Abbonamenti in consegna:</strong>{" "}
          {abbonamentiSettimana
            ? abbonamentiSettimana.consegne
              ? `${plurale(abbonamentiSettimana.consegne, "consegna", "consegne")} e ${plurale(abbonamentiSettimana.pasti, "pasto", "pasti")} nei prossimi 7 giorni, oggi compreso`
              : "nessuna nei prossimi 7 giorni"
            : abbonamenti.length
              ? elencoNomi(abbonamenti, 3)
              : "nessuna oggi"}
          .{" "}
          <Link href="/dashboard/ordini?solo=abbonamenti" className="link">
            Vedi gli abbonamenti
          </Link>
        </p>
      ) : null}
    </Sezione>
  );
}
