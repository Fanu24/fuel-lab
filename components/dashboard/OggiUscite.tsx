"use client";

/* "Oggi in uscita": chi ritira in Via del Santuario e chi riceve a casa.
   Per ognuno: dove, quanti pasti, Chiama / WhatsApp e un tocco per segnare
   consegnato (con "Annulla" in basso per qualche secondo). Gli ordini gia'
   consegnati restano in fondo, cosi' si vede a che punto e' la giornata. */

import { euro, type Ordine } from "@/lib/api";
import { daIncassare, linkMappa, nomeProprio, testoWhatsApp, type CodeOperative } from "@/lib/operazioni";
import { INDIRIZZO } from "@/lib/sito";
import { Icona } from "./PannelloIcone";
import type { useAzioniVeloci } from "./PannelloStato";
import { Sezione, Stato, Vuoto, linkWhatsAppCliente } from "./ui";

type Veloci = ReturnType<typeof useAzioniVeloci>;

export default function OggiUscite({ code, apri, veloci }: { code: CodeOperative | null; apri: (id: string) => void; veloci: Veloci }) {
  const lista = code
    ? [...code.usciteOggi].sort(
        (a, b) => Number(a.status === "completed") - Number(b.status === "completed") || a.fulfillment.localeCompare(b.fulfillment),
      )
    : null;
  const fatti = lista?.filter((o) => o.status === "completed").length ?? 0;

  return (
    <Sezione
      titolo="Oggi in uscita"
      id="oggi-uscita"
      sotto={
        !lista
          ? "Carico gli ordini…"
          : lista.length
            ? `${lista.length - fatti} da consegnare · ${fatti} ${fatti === 1 ? "fatto" : "fatti"}`
            : "Nessun ritiro o consegna oggi."
      }
    >
      {!lista ? (
        <div className="grid gap-3 py-4" aria-hidden="true">
          <span className="pn-scheletro w-3/5" />
          <span className="pn-scheletro w-4/5" />
        </div>
      ) : lista.length ? (
        <ul className="pn-uscite">
          {lista.map((o) => (
            <Uscita key={o.id} ordine={o} apri={apri} veloci={veloci} />
          ))}
        </ul>
      ) : (
        <Vuoto>Quando un ordine ha il ritiro o la consegna oggi, compare qui.</Vuoto>
      )}
    </Sezione>
  );
}

function Uscita({ ordine: o, apri, veloci }: { ordine: Ordine; apri: (id: string) => void; veloci: Veloci }) {
  const fatto = o.status === "completed";
  const ritiro = o.fulfillment === "pickup";
  const telefono = o.phone.replace(/[^\d+]/g, "");
  const nome = nomeProprio(o.customer_name) || "Cliente";
  const occupato = veloci.inCorso === o.id;

  return (
    <li>
      <div className="pn-uscita-testa">
        <button type="button" className="pn-nome" onClick={() => apri(o.id)}>
          {o.customer_name || "Cliente senza nome"}
        </button>
        <Stato stato={o.status} />
      </div>

      <p className="pn-dove">
        <strong>{ritiro ? "Ritiro" : "Consegna"}</strong>{" "}
        {ritiro ? (
          <>in {INDIRIZZO.via}</>
        ) : (
          <>
            · {[o.address, o.comune].filter(Boolean).join(", ") || "indirizzo mancante"}{" "}
            {o.address ? (
              <a href={linkMappa(o.address, o.comune)} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1 text-[15px]">
                <Icona nome="mappa" className="size-4" />
                Mappa
              </a>
            ) : null}
          </>
        )}{" "}
        · {o.meals} {o.meals === 1 ? "pasto" : "pasti"}
      </p>

      {o.dietary_preferences?.trim() ? (
        <p className="pn-allergie py-2 text-[15px]">
          <strong>Allergie:</strong> {o.dietary_preferences}
        </p>
      ) : null}
      {daIncassare(o) ? (
        <p className="text-[16px]">
          Da incassare: <strong className="num">{euro(o.price_cents)}</strong>
        </p>
      ) : null}

      <div className="pn-bottoni">
        {telefono ? (
          <>
            <a href={`tel:${telefono}`} className="pn-tasto">
              <Icona nome="telefono" className="size-5" />
              Chiama
            </a>
            <a href={linkWhatsAppCliente(o.phone, testoWhatsApp(o))} target="_blank" rel="noopener noreferrer" className="pn-tasto pn-tasto-wa">
              <Icona nome="whatsapp" className="size-5" />
              WhatsApp
            </a>
          </>
        ) : null}
        {fatto ? (
          <span className="pn-segno pn-segno-ok min-h-12 justify-center px-4 text-[15px]">
            <Icona nome="spunta" className="size-5" />
            {ritiro ? "Ritirato" : "Consegnato"}
          </span>
        ) : (
          <button
            type="button"
            className="pn-tasto pn-tasto-pieno"
            disabled={occupato}
            onClick={() =>
              void veloci.modifica(o, { status: "completed", notify: true }, `${nome}: segnato ${ritiro ? "ritirato" : "consegnato"}. Il cliente riceve un’email.`)
            }
          >
            <Icona nome="spunta" className="size-5" />
            {occupato ? "Salvo…" : ritiro ? "Segna ritirato" : "Segna consegnato"}
          </button>
        )}
        {daIncassare(o) ? (
          <button
            type="button"
            className="pn-tasto"
            disabled={occupato}
            onClick={() => void veloci.modifica(o, { paid: true }, `${nome}: segnato pagato.`)}
          >
            Segna pagato
          </button>
        ) : null}
      </div>
    </li>
  );
}
