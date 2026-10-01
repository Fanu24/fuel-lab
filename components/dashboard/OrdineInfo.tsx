/* Le parti della scheda ordine che si leggono e basta: contatti, allergie,
   note, piatti per giorno e cronologia. Nessuno stato: ricevono l'ordine e
   lo mostrano. */

import type { EventoOrdine, Ordine, VoceOrdine } from "@/lib/api";
import { linkMappa, nomeAllenamento, testoWhatsApp, vociPerGiorno } from "@/lib/operazioni";
import type { Allenamenti } from "@/lib/settimana";
import { INDIRIZZO } from "@/lib/sito";
import { Icona } from "./PannelloIcone";
import { Stato, Vuoto, faTempo, linkWhatsAppCliente, quando } from "./ui";

/* ---------- Contatti ---------- */

/** `senzaAccount`: ordine inserito a mano per chi non ha un account. L'email
    registrata e' quella di Matteo, quindi non si mostra come contatto. */
export function OrdineContatti({ ordine, senzaAccount = false }: { ordine: Ordine; senzaAccount?: boolean }) {
  const email = senzaAccount || ordine.source === "manual" && !ordine.email ? "" : ordine.email;
  const telefono = ordine.phone.replace(/[^\d+]/g, "");
  const oggetto = encodeURIComponent("Il tuo ordine FUEL LAB");
  const ritiro = ordine.fulfillment === "pickup";
  return (
    <section aria-labelledby="scheda-contatti">
      <h3 id="scheda-contatti" className="pn-h3">Contatti</h3>
      <div className="pn-contatti">
        {telefono ? (
          <a href={`tel:${telefono}`} className="pn-tasto pn-contatto">
            <Icona nome="telefono" />
            Chiama
          </a>
        ) : (
          <span className="pn-tasto pn-contatto opacity-50" aria-disabled="true">Nessun telefono</span>
        )}
        {telefono ? (
          <a href={linkWhatsAppCliente(ordine.phone, testoWhatsApp(ordine))} target="_blank" rel="noopener noreferrer" className="pn-tasto pn-tasto-wa pn-contatto">
            <Icona nome="whatsapp" />
            WhatsApp
          </a>
        ) : (
          <span className="pn-tasto pn-contatto opacity-50" aria-disabled="true">WhatsApp</span>
        )}
        {email ? (
          <a href={`mailto:${email}?subject=${oggetto}`} className="pn-tasto pn-contatto">
            <Icona nome="email" />
            Email
          </a>
        ) : (
          <span className="pn-tasto pn-contatto opacity-50" aria-disabled="true">Nessuna email</span>
        )}
      </div>
      <dl className="mt-4 grid gap-2 text-base">
        <div className="flex flex-wrap gap-x-3">
          <dt className="w-24 shrink-0 text-muted">Telefono</dt>
          <dd className="num min-w-0 [overflow-wrap:anywhere]">{ordine.phone || "—"}</dd>
        </div>
        <div className="flex flex-wrap gap-x-3">
          <dt className="w-24 shrink-0 text-muted">Email</dt>
          <dd className="min-w-0 break-all">{email || "Senza account: nessuna email"}</dd>
        </div>
        <div className="flex flex-wrap gap-x-3">
          <dt className="w-24 shrink-0 text-muted">{ritiro ? "Ritiro" : "Consegna"}</dt>
          <dd className="min-w-0 [overflow-wrap:anywhere]">
            {ritiro ? (
              <>In {INDIRIZZO.via} · cliente di {ordine.comune || "—"}</>
            ) : (
              <>
                {[ordine.address, ordine.comune].filter(Boolean).join(", ") || "Indirizzo mancante"}
                {ordine.address ? (
                  <>
                    {" "}
                    <a href={linkMappa(ordine.address, ordine.comune)} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1">
                      <Icona nome="mappa" className="size-4" />
                      Apri in Mappe
                    </a>
                  </>
                ) : null}
              </>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}

/* ---------- Allergie e note ---------- */

/** Allergie e preferenze del profilo: bordo rosso, sempre in vista. */
export function Allergie({ testo, compatto = false }: { testo: string | null | undefined; compatto?: boolean }) {
  if (!testo?.trim()) {
    return compatto ? null : <p className="pn-aiuto">Nessuna allergia o preferenza alimentare nel profilo del cliente.</p>;
  }
  return (
    <div className="pn-allergie" role="note" aria-label="Allergie e preferenze alimentari">
      <p className="pn-allergie-titolo">
        <Icona nome="attenzione" className="size-5" />
        Allergie e preferenze
      </p>
      <p className="whitespace-pre-line">{testo}</p>
    </div>
  );
}

export function NoteCliente({ testo, titolo = "Note del cliente" }: { testo: string; titolo?: string }) {
  if (!testo.trim()) return null;
  return (
    <section aria-labelledby="scheda-note">
      <h3 id="scheda-note" className="pn-h3">{titolo}</h3>
      <p className="pn-nota">{testo}</p>
    </section>
  );
}

/* ---------- Piatti ---------- */

function Pasto({ etichetta, voci }: { etichetta: string; voci: VoceOrdine[] }) {
  return (
    <div className="pn-pasto">
      <span className="pn-pasto-etichetta">{etichetta}</span>
      {voci.length ? (
        voci.map((v, i) => (
          <span key={`${v.id}-${i}`} className="block">
            <span className="pn-pasto-nome">{v.name}</span>
            {v.extras.length ? <span className="pn-pasto-extra">+ {v.extras.join(", ")}</span> : null}
          </span>
        ))
      ) : (
        <span className="pn-pasto-extra" aria-label="Niente">—</span>
      )}
    </div>
  );
}

export function OrdinePiatti({ ordine, allenamenti }: { ordine: Ordine; allenamenti?: Allenamenti }) {
  const giorni = vociPerGiorno(ordine.items, allenamenti ?? {});
  const conPiatti = giorni.filter((g) => g.pranzo.length || g.cena.length).length;
  const extra = ordine.items.reduce((s, v) => s + v.extras.length, 0);
  const abbonamento = ordine.service === "abbonamento";
  return (
    <section aria-labelledby="scheda-piatti">
      <h3 id="scheda-piatti" className="pn-h3">{abbonamento ? "Piatti indicati e allenamenti" : "Piatti"}</h3>
      {abbonamento ? (
        <p className="pn-aiuto mb-2">
          I pasti della formula si compongono sulla scheda del cliente.
          {ordine.items.length
            ? " Dove ha indicato un piatto, vale per quel giorno della settimana e quel pasto in ogni consegna, e finisce così sull’etichetta; negli altri pasti scegli tu."
            : ""}
        </p>
      ) : null}
      {ordine.items.length && !abbonamento ? (
        <p className="pn-aiuto mb-2">
          {ordine.meals} {ordine.meals === 1 ? "pasto" : "pasti"} in {conPiatti} {conPiatti === 1 ? "giorno" : "giorni"}
          {extra ? ` · ${extra} extra` : ""}
        </p>
      ) : null}
      {giorni.length ? (
        <ul className="pn-giorni-piatti">
          {giorni.map((g) => (
            <li key={g.giorno}>
              <p className="pn-giorni-piatti-testa">
                {g.nome}
                {g.allenamento ? <span className={`tag tag-${g.allenamento}`}>{nomeAllenamento(g.allenamento)}</span> : null}
              </p>
              {g.pranzo.length || g.cena.length ? (
                <div className="pn-pasti">
                  <Pasto etichetta="Pranzo" voci={g.pranzo} />
                  <Pasto etichetta="Cena" voci={g.cena} />
                </div>
              ) : (
                <p className="pn-aiuto">Nessun piatto in questo giorno.</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <Vuoto>
          {ordine.service === "home-cooking"
            ? "Home cooking: nessun piatto dal menu. I dettagli si concordano con il cliente."
            : abbonamento
              ? "Nessun piatto indicato e nessun allenamento: guarda la scheda del cliente qui sopra."
              : "Nessun piatto nell’ordine."}
        </Vuoto>
      )}
    </section>
  );
}

/* ---------- Cronologia ---------- */

const CHI: Record<EventoOrdine["actor"], string> = { customer: "Cliente", admin: "Matteo", system: "Automatico" };

function descrivi(e: EventoOrdine) {
  switch (e.type) {
    case "created":
      // "Richiesta inviata dal sito" o "Inserito a mano da Matteo": lo scrive il server.
      return e.detail || "Richiesta inviata dal sito";
    case "status":
      return null; // disegnato con i due stati
    case "schedule":
      return `Date: ${e.detail || "aggiornate"}`;
    case "note":
      // Il cambio di formula di un abbonamento viaggia come nota (order_events non ha un tipo suo, e aggiungerlo
      // vorrebbe una migrazione): il dettaglio e' la traccia di un cambio che incide sul prezzo, si legge.
      return e.detail.startsWith("Formula: ") ? e.detail : "Nota interna aggiornata";
    case "message":
      return e.detail ? `Messaggio al cliente: “${e.detail}”` : "Messaggio al cliente aggiornato";
    case "price":
      return `Prezzo: ${e.detail || "aggiornato"}`;
    case "payment":
      return e.detail || "Pagamento aggiornato";
    case "email":
      return `Email al cliente${e.detail ? `: ${e.detail}` : " inviata"}`;
    default:
      return e.detail;
  }
}

export function OrdineCronologia({ eventi, stato }: { eventi: EventoOrdine[] | null; stato: "carico" | "pronto" | "assente" }) {
  return (
    <section aria-labelledby="scheda-cronologia">
      <h3 id="scheda-cronologia" className="pn-h3">Cronologia</h3>
      {stato === "carico" ? (
        <p className="pn-aiuto">Carico la cronologia…</p>
      ) : !eventi || stato === "assente" ? (
        <Vuoto>Cronologia non disponibile per ora.</Vuoto>
      ) : eventi.length === 0 ? (
        <Vuoto>Ancora nessun evento.</Vuoto>
      ) : (
        <ol className="pn-cronologia">
          {[...eventi].sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id).map((e) => (
            <li key={e.id}>
              <div>
                {e.type === "status" ? (
                  <span className="flex flex-wrap items-center gap-2">
                    {e.from_status ? <Stato stato={e.from_status} /> : null}
                    <span aria-hidden="true">→</span>
                    <span className="sr-only">diventa</span>
                    {e.to_status ? <Stato stato={e.to_status} /> : <span>{e.detail || "stato aggiornato"}</span>}
                  </span>
                ) : (
                  <span>{descrivi(e)}</span>
                )}
                <span className="pn-cronologia-quando">
                  {CHI[e.actor] ?? e.actor} · {quando(e.created_at)} · {faTempo(e.created_at)}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
