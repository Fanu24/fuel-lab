import { passiOrdine } from "@/lib/account";
import type { Modalita, Servizio, StatoOrdine } from "@/lib/api";

/* Le tappe di una richiesta (cinque, tre per l'abbonamento) come barra a segmenti: pieno = fatto,
   tratteggiato = a che punto e', chiaro = da fare. Sul telefono le etichette di
   ogni tappa non ci stanno: resta la barra e una riga con la tappa attuale. */

export default function Passi({
  stato,
  modalita,
  servizio,
  compatto = false,
}: {
  stato: StatoOrdine;
  modalita: Modalita;
  servizio?: Servizio;
  compatto?: boolean;
}) {
  const passi = passiOrdine(stato, modalita, servizio);
  if (!passi) {
    return <p className="acc-annullata">Richiesta annullata</p>;
  }
  const indice = Math.max(0, passi.findIndex((p) => p.stato === "attuale"));
  const attuale = stato === "completed" ? passi[passi.length - 1] : passi[indice];
  const numero = stato === "completed" ? passi.length : indice + 1;
  return (
    <div className={`acc-passi-box ${compatto ? "acc-passi-compatti" : ""}`}>
      <ol className="acc-passi" aria-label="Avanzamento della richiesta">
        {passi.map((p) => (
          <li key={p.id} data-stato={p.stato} aria-current={p.stato === "attuale" ? "step" : undefined}>
            <span className="acc-passo-testo">
              {p.etichetta}
              <span className="sr-only">
                {p.stato === "fatto" ? ", fatto" : p.stato === "attuale" ? ", a che punto è" : ", da fare"}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className="acc-passi-riassunto" aria-hidden="true">
        <strong>{attuale.etichetta}</strong> · passo {numero} di {passi.length}
      </p>
    </div>
  );
}
