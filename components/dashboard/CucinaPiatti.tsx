"use client";

/* Scheda Piatti: la lavagna della cucina. Numeri grandi, da leggere a un metro
   dal telefono appoggiato sul piano: quante porzioni di ogni piatto, quanti
   extra, quali allergeni girano oggi e chi ha allergie da non dimenticare.
   Le consegne in abbonamento hanno la loro sezione, dopo i conti (per chi, con
   i pasti dei tre giorni coperti e la scheda); se il cliente ha indicato il
   piatto di un pasto, conta anche nelle porzioni. */

import { useMemo } from "react";
import type { Ordine } from "@/lib/api";
import { allergeniDelGiorno, clientiConPreferenze, contaExtra, contaPiatti } from "@/lib/produzione";
import { useImpostazioni } from "@/components/impostazioni/useImpostazioni";
import CucinaAbbonamenti from "./CucinaAbbonamenti";
import { Vuoto } from "./ui";

const maiuscola = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * `ordini`: gli ordini del giorno piu' i pasti in abbonamento con un piatto
 * indicato, come ordini (pastiComeOrdini); `abbonamenti`: gli abbonamenti che
 * consegnano nel giorno.
 */
export default function CucinaPiatti({ ordini, abbonamenti = [], giorno }: { ordini: Ordine[]; abbonamenti?: Ordine[]; giorno: string }) {
  const piatti = useMemo(() => contaPiatti(ordini), [ordini]);
  const extra = useMemo(() => contaExtra(ordini), [ordini]);
  const allergeni = useMemo(() => allergeniDelGiorno(ordini), [ordini]);
  const conPreferenze = useMemo(() => clientiConPreferenze(ordini), [ordini]);
  const nonDisponibili = useImpostazioni().impostazioni.piattiNonDisponibili;
  const totaleExtra = extra.reduce((n, e) => n + e.quanti, 0);

  return (
    <div className="cu-pagina grid gap-10">
      {conPreferenze.length ? (
        <section aria-labelledby="cu-pref" className="cu-attenzione">
          <h3 id="cu-pref" className="cu-h3">Attenzione: preferenze e allergie dei clienti</h3>
          <ul className="grid gap-2">
            {conPreferenze.map((c) => (
              <li key={c.chiave} className="cu-attenzione-riga">
                <strong>{c.cliente}</strong>
                <span>{c.preferenze}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section aria-labelledby="cu-piatti" className="cu-blocco grid content-start gap-2">
          <h3 id="cu-piatti" className="cu-h3">Porzioni per piatto</h3>
          {piatti.length ? (
            <ul className="cu-piatti">
              {piatti.map((p) => (
                <li key={p.id} className="cu-piatto">
                  <span className="cu-piatto-n num" aria-label={`${p.porzioni} porzioni`}>
                    {p.porzioni}
                  </span>
                  <div className="min-w-0">
                    <p className="cu-piatto-nome">{p.nome}</p>
                    <p className="cu-piatto-allergeni">
                      {p.allergeni === null
                        ? "Piatto fuori catalogo: controlla gli allergeni a mano"
                        : p.allergeni.length
                          ? `Allergeni: ${p.allergeni.join(", ")}`
                          : "Nessun allergene principale"}
                    </p>
                    {nonDisponibili.includes(p.id) ? (
                      <p className="cu-piatto-nd">Segnato «non disponibile» in Impostazioni: avvisa chi l’ha ordinato.</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Vuoto>
              Nessun piatto del menu da contare (home cooking, o pasti in abbonamento ancora da comporre): guarda la scheda Ordini.
            </Vuoto>
          )}
        </section>

        <div className="grid content-start gap-10">
          <section aria-labelledby="cu-extra" className="cu-blocco grid gap-2">
            <h3 id="cu-extra" className="cu-h3">
              Extra {totaleExtra ? <span className="cu-h3-nota">· {totaleExtra} in tutto</span> : null}
            </h3>
            {extra.length ? (
              <ul className="cu-righe">
                {extra.map((e) => (
                  <li key={e.nome} className="cu-riga">
                    <span className="cu-riga-nome">
                      {e.nome}
                      {e.allergeni.length ? <span className="cu-riga-nota"> · {e.allergeni.join(", ")}</span> : null}
                    </span>
                    <span className="cu-riga-n num">{e.quanti}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Vuoto>Nessun extra in questo giorno.</Vuoto>
            )}
          </section>

          <section aria-labelledby="cu-allergeni" className="cu-blocco grid gap-2">
            <h3 id="cu-allergeni" className="cu-h3">Allergeni presenti</h3>
            {allergeni.length ? (
              <ul className="cu-righe">
                {allergeni.map((a) => (
                  <li key={a.allergene} className="cu-riga cu-riga-alta">
                    <span className="cu-riga-nome">
                      <strong>{maiuscola(a.allergene)}</strong>
                      <span className="cu-riga-nota block">da {a.fonti.join(", ")}</span>
                    </span>
                    <span className="cu-riga-n num" aria-label={`in ${a.porzioni} porzioni`}>
                      {a.porzioni}
                      <span className="cu-riga-unita" aria-hidden="true"> porz.</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Vuoto>Nessuno dei piatti e degli extra di oggi contiene allergeni principali.</Vuoto>
            )}
          </section>
        </div>
      </div>

      <CucinaAbbonamenti abbonamenti={abbonamenti} giorno={giorno} />
    </div>
  );
}
