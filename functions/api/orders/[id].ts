import { currentUser, type Context } from "../../_lib/auth";
import { bodyJson, json, sameOrigin } from "../../_lib/http";
import { accodaEmail, emailMatteo, type EsitoEmail } from "../../_lib/mail";
import { eventoStmt, leggiEventi, leggiOrdine } from "../../_lib/ordini";
import type { EventoOrdine, StatoOrdine } from "../../../lib/api";
import { emailAggiornamentoCliente, emailAnnullataDalCliente } from "../../../lib/server/email";
import {
  controllaStatoAtteso,
  dettaglioDaRiga,
  erroreStatoCambiato,
  leggiAnnullamentoCliente,
  leggiModificaAdmin,
  ordineDaRiga,
  type Cambio,
  type StatoModificabile,
} from "../../../lib/server/ordini";

/** GET /api/orders/:id — Matteo vede tutto, il proprietario la sua versione. */
export const onRequestGet = async ({ env, request, params }: Context<{ id: string }>) => {
  const user = await currentUser(env, request);
  if (!user) return json({ error: "Accedi per vedere la richiesta" }, 401);
  const id = String(params.id);
  const row = await leggiOrdine(env, id);
  const admin = user.role === "admin";
  if (!row || (!admin && row.user_id !== user.id)) return json({ error: "Richiesta non trovata" }, 404);
  const order = dettaglioDaRiga(row, await leggiEventi(env, id), admin);
  if (admin) order.no_account = await intestatoAStaff(env, order.user_id);
  return json({ order });
};

/**
 * Un ordine intestato a un account dello staff e' un ordine a mano per un
 * cliente senza account: l'email dell'ordine e' quella di Matteo, non del cliente.
 */
async function intestatoAStaff(env: Context["env"], userId: string) {
  return !!(await env.DB.prepare("SELECT 1 AS si FROM staff_roles WHERE user_id = ?").bind(userId).first());
}

const EMAIL_SENZA_ACCOUNT = "Ordine inserito a mano: avvisa il cliente per telefono o WhatsApp";

/**
 * Un evento che si scrive solo se l'ordine e' ancora nello stato letto (e, per
 * il cliente, ancora suo). Va nel batch PRIMA dell'UPDATE, che ha la stessa
 * condizione: il batch di D1 e' una transazione sola, quindi evento e modifica
 * vedono la stessa riga e passano entrambi o nessuno dei due. Niente changes():
 * cosi' non conta cosa D1 esegue fra uno statement e l'altro.
 */
function eventoSeInStato(
  env: Context["env"],
  orderId: string,
  actor: EventoOrdine["actor"],
  cambio: Cambio,
  stato: StatoOrdine,
  userId?: string,
) {
  return env.DB.prepare(`INSERT INTO order_events (order_id,actor,type,from_status,to_status,detail)
      SELECT ?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM orders WHERE id=? AND status=?${userId ? " AND user_id=?" : ""})`)
    .bind(orderId, actor, cambio.type, cambio.from_status, cambio.to_status, cambio.detail, orderId, stato, ...(userId ? [userId] : []));
}

const DESCRIZIONE_EMAIL: Record<EsitoEmail, (to: string) => string> = {
  inviata: (to) => `Email inviata al cliente (${to})`,
  saltata: () => "Email al cliente non inviata: servizio email non configurato",
  fallita: (to) => `Email al cliente (${to}) non inviata: errore del servizio email`,
};

/**
 * PATCH /api/orders/:id
 * - Matteo: stato, date, nota interna, messaggio, totale, pagamento; un evento per ogni cambio.
 * - Cliente: solo { status: "cancelled" } sulla propria richiesta ancora da confermare.
 */
export const onRequestPatch = async ({ env, request, params, waitUntil }: Context<{ id: string }>) => {
  if (!sameOrigin(request)) return json({ error: "Origine non valida" }, 403);
  const user = await currentUser(env, request);
  if (!user) return json({ error: "Accedi per continuare" }, 401);
  const id = String(params.id);
  const body = await bodyJson(request, 8000);
  if (!body) return json({ error: "Dati non validi" }, 400);
  const row = await leggiOrdine(env, id);
  if (!row) return json({ error: "Richiesta non trovata" }, 404);
  const current = ordineDaRiga(row, true);

  if (user.role !== "admin") {
    const esito = leggiAnnullamentoCliente(body, current, user.id);
    if (!esito.ok) return json({ error: esito.error }, esito.status);
    // Evento e annullamento in un solo batch, con la stessa condizione sullo stato: se Matteo
    // ha appena confermato non cambia niente e non resta un "Annullata dal cliente" orfano.
    const [, annullato] = await env.DB.batch([
      eventoSeInStato(env, id, "customer", { type: "status", from_status: "requested", to_status: "cancelled", detail: "Annullata dal cliente" }, "requested", user.id),
      env.DB.prepare("UPDATE orders SET status='cancelled',updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=? AND status='requested'")
        .bind(id, user.id),
    ]);
    if (!annullato.meta.changes) return json({ error: "Matteo ha già preso in carico questa richiesta: per annullarla scrivi a info@fuelchef.it" }, 409);
    await accodaEmail({ env, waitUntil }, {
      to: [emailMatteo(env)],
      replyTo: current.email,
      ...emailAnnullataDalCliente(current),
    });
    const fresco = await leggiOrdine(env, id);
    return json({ order: ordineDaRiga(fresco ?? { ...row, status: "cancelled" }, false) });
  }

  // Il pannello manda lo stato che mostrava: se nel frattempo e' cambiato (il cliente ha annullato,
  // un altro telefono ha confermato) si risponde 409 prima di toccare qualunque cosa.
  const atteso = controllaStatoAtteso(body, current.status);
  if (!atteso.ok) return json({ error: atteso.error }, atteso.status);

  const stato: StatoModificabile = {
    status: current.status,
    production_date: current.production_date ?? null,
    fulfillment_date: current.fulfillment_date,
    internal_note: current.internal_note ?? "",
    customer_message: current.customer_message,
    price_cents: current.price_cents,
    paid: current.paid,
  };
  const esito = leggiModificaAdmin(body, stato, current.fulfillment, current.service);
  if (!esito.ok) return json({ error: esito.error }, esito.status);
  const { next, cambi, avvisaCliente } = esito.value;

  if (cambi.length) {
    // UPDATE condizionato allo stato appena letto, eventi con la stessa condizione (vedi eventoSeInStato).
    const risultati = await env.DB.batch([
      ...cambi.map((cambio) => eventoSeInStato(env, id, "admin", cambio, current.status)),
      env.DB.prepare("UPDATE orders SET status=?,production_date=?,fulfillment_date=?,internal_note=?,customer_message=?,price_cents=?,paid=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status=?")
        .bind(next.status, next.production_date, next.fulfillment_date, next.internal_note, next.customer_message, next.price_cents, next.paid, id, current.status),
    ]);
    if (!risultati[risultati.length - 1].meta.changes) {
      const ora = await leggiOrdine(env, id);
      if (!ora) return json({ error: "Richiesta non trovata" }, 404);
      return json({ error: erroreStatoCambiato(ordineDaRiga(ora, true).status) }, 409);
    }
  }
  const fresco = await leggiOrdine(env, id);
  if (!fresco) return json({ error: "Richiesta non trovata" }, 404);
  const order = ordineDaRiga(fresco, true);

  if (avvisaCliente && order.email && (await intestatoAStaff(env, order.user_id))) {
    // Senza account l'email andrebbe a Matteo stesso: resta solo il promemoria nella cronologia.
    await eventoStmt(env, id, "system", { type: "email", from_status: null, to_status: null, detail: EMAIL_SENZA_ACCOUNT }).run();
  } else if (avvisaCliente && order.email) {
    const statoCambiato = cambi.some((cambio) => cambio.type === "status");
    await accodaEmail(
      { env, waitUntil },
      { to: [order.email], replyTo: emailMatteo(env), ...emailAggiornamentoCliente(order, statoCambiato) },
      (esitoEmail) => eventoStmt(env, id, "system", {
        type: "email", from_status: null, to_status: null, detail: DESCRIZIONE_EMAIL[esitoEmail](order.email),
      }).run(),
    );
  }
  return json({ order });
};
