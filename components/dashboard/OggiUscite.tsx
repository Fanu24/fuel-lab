"use client";

/* "Oggi in uscita": chi ritira in Via del Santuario e chi riceve a casa.
   Per ognuno: dove, quanti pasti, Chiama / WhatsApp e un tocco per segnare
   consegnato (con "Annulla" in basso per qualche secondo). Gli ordini gia'
   consegnati restano in fondo, cosi' si vede a che punto e' la giornata.
   Le consegne degli abbonamenti (una ogni 3 giorni per abbonamento) stanno
   nella stessa lista, con i pasti che portano. Non si segnano sul server
   (chiuderebbero l'abbonamento): il tocco "Segna consegnato" le spunta su
   questo dispositivo, come le spunte della cucina, e si puo' togliere. */

import Link from "next/link";
import { useRef } from "react";
import { euro, type Ordine } from "@/lib/api";
import { daIncassare, linkMappa, nomeProprio, testoWhatsApp, type CodeOperative } from "@/lib/operazioni";
import { consegnaDelGiorno, eAbbonamento, frasePasti, nomeAbbonamento } from "@/lib/produzione";
import { INDIRIZZO } from "@/lib/sito";
import { PastiConsegna } from "./AbbonamentoConsegna";
import { Icona } from "./PannelloIcone";
import { fraseAvviso, usePannello } from "./PannelloDati";
import type { useAzioniVeloci } from "./PannelloStato";
import { SegnoAbbonamento, Sezione, Stato, Vuoto, giorno as giornoCorto, linkWhatsAppCliente } from "./ui";

type Veloci = ReturnType<typeof useAzioniVeloci>;

export default function OggiUscite({
  code,
  oggi,
  apri,
  veloci,
  consegnate,
  onConsegnata,
}: {
  code: CodeOperative | null;
  oggi: string;
  apri: (id: string) => void;
  veloci: Veloci;
  /** Gli id delle consegne in abbonamento gia' fatte oggi, segnate su questo dispositivo. */
  consegnate: ReadonlySet<string>;
  onConsegnata: (id: string, fatta: boolean) => void;
}) {
  const fatta = (o: Ordine) => (eAbbonamento(o) ? consegnate.has(o.id) : o.status === "completed");
  const lista = code
    ? [...code.usciteOggi].sort((a, b) => Number(fatta(a)) - Number(fatta(b)) || a.fulfillment.localeCompare(b.fulfillment))
    : null;
  const fatti = lista?.filter(fatta).length ?? 0;
  const conAbbonamenti = !!code?.abbonamentiOggi.length;

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
          {lista.map((o) =>
            eAbbonamento(o) ? (
              <UscitaAbbonamento key={o.id} ordine={o} oggi={oggi} apri={apri} fatta={consegnate.has(o.id)} onConsegnata={onConsegnata} />
            ) : (
              <Uscita key={o.id} ordine={o} apri={apri} veloci={veloci} />
            ),
          )}
        </ul>
      ) : (
        <Vuoto>Quando un ordine ha il ritiro o la consegna oggi, o un abbonamento ha la sua consegna, compare qui.</Vuoto>
      )}
      {conAbbonamenti ? (
        <p className="mt-3 text-[15px]">
          Le consegne in abbonamento si segnano solo su questo dispositivo: l’abbonamento resta aperto.{" "}
          <Link href="/dashboard/produzione?scheda=ordini" className="link">
            Schede d’imballo
          </Link>
        </p>
      ) : null}
    </Sezione>
  );
}

/**
 * Il tocco su "Segna consegnato" fa sparire il bottone premuto e il fuoco cadrebbe
 * sul body: chi usa la tastiera ripartirebbe dall'inizio della pagina. Torna sul
 * nome del cliente, senza far scorrere la pagina (la riga si sposta fra i fatti).
 */
function fuocoSulNome(riga: HTMLElement | null) {
  const attivo = document.activeElement;
  if (attivo && attivo !== document.body) return;
  riga?.querySelector<HTMLElement>(".pn-nome")?.focus({ preventScroll: true });
}

/** Come si arriva dal cliente o dove lo si aspetta: "Ritiro in Via..." oppure l'indirizzo con la mappa. */
function Dove({ ordine: o }: { ordine: Ordine }) {
  const ritiro = o.fulfillment === "pickup";
  return (
    <>
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
      )}
    </>
  );
}

function Contatti({ ordine: o }: { ordine: Ordine }) {
  const telefono = o.phone.replace(/[^\d+]/g, "");
  if (!telefono) return null;
  return (
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
  );
}

/**
 * Una consegna in abbonamento: chi, dove, quale consegna e' e cosa porta. Il
 * tocco la spunta su questo dispositivo, senza toccare l'abbonamento.
 */
function UscitaAbbonamento({
  ordine: o,
  oggi,
  apri,
  fatta,
  onConsegnata,
}: {
  ordine: Ordine;
  oggi: string;
  apri: (id: string) => void;
  fatta: boolean;
  onConsegnata: (id: string, fatta: boolean) => void;
}) {
  const ritiro = o.fulfillment === "pickup";
  const c = consegnaDelGiorno(o, oggi);
  const riga = useRef<HTMLLIElement>(null);
  const segna = (fatta: boolean) => {
    onConsegnata(o.id, fatta);
    requestAnimationFrame(() => fuocoSulNome(riga.current));
  };
  return (
    <li ref={riga}>
      <div className="pn-uscita-testa">
        <button type="button" className="pn-nome" onClick={() => apri(o.id)}>
          {o.customer_name || "Cliente senza nome"}
        </button>
        <SegnoAbbonamento ordine={o} />
      </div>

      <p className="pn-dove">
        <Dove ordine={o} />
        {c ? (
          <>
            {" "}
            · {frasePasti(c.pasti)}
          </>
        ) : null}
      </p>
      {c ? (
        <p className="text-[15px] text-muted">
          {nomeAbbonamento(o)} · consegna {c.numero} di {c.totale}, copre fino a {giornoCorto(c.fino)}
        </p>
      ) : null}
      {o.dietary_preferences?.trim() ? (
        <p className="pn-allergie py-2 text-[15px]">
          <strong>Allergie:</strong> {o.dietary_preferences}
        </p>
      ) : null}
      <PastiConsegna o={o} giorno={oggi} />

      <div className="pn-bottoni">
        <Contatti ordine={o} />
        {fatta ? (
          <>
            <span className="pn-segno pn-segno-ok min-h-12 justify-center px-4 text-[15px]">
              <Icona nome="spunta" className="size-5" />
              {ritiro ? "Ritirato" : "Consegnato"}
            </span>
            <button type="button" className="pn-tasto" onClick={() => segna(false)}>
              Togli la spunta
            </button>
          </>
        ) : (
          <button type="button" className="pn-tasto pn-tasto-pieno" onClick={() => segna(true)}>
            <Icona nome="spunta" className="size-5" />
            {ritiro ? "Segna ritirato" : "Segna consegnato"}
          </button>
        )}
      </div>
    </li>
  );
}

function Uscita({ ordine: o, apri, veloci }: { ordine: Ordine; apri: (id: string) => void; veloci: Veloci }) {
  const { emailAttiva } = usePannello();
  const fatto = o.status === "completed";
  const ritiro = o.fulfillment === "pickup";
  const nome = nomeProprio(o.customer_name) || "Cliente";
  const occupato = veloci.inCorso === o.id;
  const riga = useRef<HTMLLIElement>(null);

  return (
    <li ref={riga}>
      <div className="pn-uscita-testa">
        <button type="button" className="pn-nome" onClick={() => apri(o.id)}>
          {o.customer_name || "Cliente senza nome"}
        </button>
        <Stato stato={o.status} ritiro={o.fulfillment === "pickup"} />
      </div>

      <p className="pn-dove">
        <Dove ordine={o} /> · {o.meals} {o.meals === 1 ? "pasto" : "pasti"}
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
        <Contatti ordine={o} />
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
              void veloci
                .modifica(o, { status: "completed", notify: true }, `${nome}: segnato ${ritiro ? "ritirato" : "consegnato"}. ${fraseAvviso(emailAttiva)}`)
                .then(() => fuocoSulNome(riga.current))
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
            onClick={() => void veloci.modifica(o, { paid: true }, `${nome}: segnato pagato.`).then(() => fuocoSulNome(riga.current))}
          >
            Segna pagato
          </button>
        ) : null}
      </div>
    </li>
  );
}
