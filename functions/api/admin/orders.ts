import { normalizzaCodice } from "../../../lib/sconti";
import { leggiSconto, preparaSconto } from "../../../lib/server/sconti";
import { oggiRoma } from "../../../lib/server/date";
import { leggiIdCliente, leggiOrdineManuale, type ClienteRegistrato } from "../../../lib/server/ordini-manuali";
import { ordineDaRiga, prezzoProposto } from "../../../lib/server/ordini";
import { currentUser, soloAdmin, type Context } from "../../_lib/auth";
import { bodyJson, json, sameOrigin } from "../../_lib/http";
import { leggiOrdine } from "../../_lib/ordini";

/**
 * Lo stesso ordine a mano, per lo stesso cliente, inserito da meno di due minuti: e' un doppio tocco o un nuovo
 * tentativo dopo una rete che non rispondeva (la prima volta era gia' entrato). Si risponde con quello.
 */
const GIA_INSERITO = `SELECT id FROM orders WHERE source='manual' AND user_id=? AND service=? AND customer_name=? AND phone=?
  AND fulfillment=? AND comune=? AND address=?
  AND COALESCE(requested_date,'')=? AND COALESCE(fulfillment_date,'')=? AND notes=? AND items_json=? AND COALESCE(discount_base_cents,price_cents,-1)=?
  AND COALESCE(sub_plan,'')=? AND COALESCE(sub_tier,'')=? AND COALESCE(sub_household,'')=? AND COALESCE(discount_code,'')=?
  AND created_at > datetime('now','-2 minutes')`;

/**
 * POST /api/admin/orders — Matteo inserisce un ordine preso per telefono,
 * WhatsApp o di persona. Con `customerId` l'ordine entra nell'account del
 * cliente (le email di aggiornamento poi funzionano come sempre); senza, resta
 * intestato a Matteo stesso, perche' orders.user_id non puo' essere vuoto.
 * Alla creazione non parte nessuna email: il cliente l'ha appena sentito.
 */
export const onRequestPost = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Non riesco a verificare da dove arriva la richiesta: ricarica la pagina e riprova." }, 403);
  const user = await currentUser(env, request);
  const vietato = soloAdmin(user);
  if (vietato || !user) return vietato ?? json({ error: "Accedi per continuare" }, 401);
  const body = await bodyJson(request, 30000);
  if (!body) return json({ error: "Dati non validi" }, 400);

  const idCliente = leggiIdCliente(body);
  if (!idCliente.ok) return json({ error: idCliente.error }, idCliente.status);
  let cliente: ClienteRegistrato | null = null;
  if (idCliente.value) {
    const riga = await env.DB.prepare(`
      SELECT u.id, u.name, COALESCE(p.phone,'') AS phone, COALESCE(p.comune,'') AS comune, COALESCE(p.address,'') AS address,
        CASE WHEN s.user_id IS NULL THEN 0 ELSE 1 END AS staff
      FROM user u
      LEFT JOIN customer_profiles p ON p.user_id = u.id
      LEFT JOIN staff_roles s ON s.user_id = u.id
      WHERE u.id = ?`).bind(idCliente.value).first<Record<string, unknown>>();
    if (!riga) return json({ error: "Cliente non trovato: forse ha cancellato l'account. Cercalo di nuovo o inseriscilo senza account." }, 404);
    if (Number(riga.staff) === 1) return json({ error: "Scegli un cliente: gli account dello staff non ricevono ordini" }, 400);
    cliente = {
      id: String(riga.id),
      name: String(riga.name ?? ""),
      phone: String(riga.phone),
      comune: String(riga.comune),
      address: String(riga.address),
    };
  }

  const letto = leggiOrdineManuale(body, oggiRoma(), cliente);
  if (!letto.ok) return json({ error: letto.error }, letto.status);
  const o = letto.value;
  const codiceNormalizzato = body.discountCode === undefined || body.discountCode === null || body.discountCode === "" ? null : normalizzaCodice(body.discountCode);
  if (body.discountCode && !codiceNormalizzato) return json({ error: "Codice sconto non valido." }, 400);
  const usaListino = body.priceCents === undefined || !!(o.subscription && o.priceCents === prezzoProposto(o.subscription, o.fulfillment));
  const base = preparaSconto(codiceNormalizzato, codiceNormalizzato ? 1 : null, o.priceCents, o.subscription, o.fulfillment, usaListino).discount?.baseCents ?? o.priceCents;

  const proprietario = o.customerId ?? user.id;
  const uguale = [
    proprietario, o.service, o.name, o.phone, o.fulfillment, o.comune, o.address,
    o.requestedDate ?? "", o.fulfillmentDate ?? "", o.notes, JSON.stringify(o.items), base ?? -1,
    o.subscription?.plan ?? "", o.subscription?.tier ?? "", o.subscription?.household ?? "", codiceNormalizzato ?? "",
  ];
  // Restituisce un ordine già creato anche se il codice è stato disattivato nel frattempo.
  const gia = await env.DB.prepare(`${GIA_INSERITO} ORDER BY created_at DESC LIMIT 1`).bind(...uguale).first<{ id: string }>();
  if (gia) {
    const riga = await leggiOrdine(env, gia.id);
    if (riga) return json({ order: ordineDaRiga(riga, true) });
  }
  const codice = await leggiSconto(env.DB, body.discountCode);
  if (!codice.ok) return json({ error: codice.error }, 400);
  const sconto = preparaSconto(codice.code, codice.percent, o.priceCents, o.subscription, o.fulfillment, usaListino);
  o.priceCents = sconto.price;
  const id = crypto.randomUUID();
  // Il controllo dei doppioni sta dentro l'INSERT: due invii nello stesso istante non lo passerebbero entrambi.
  const [inserito] = await env.DB.batch([
    env.DB.prepare(`INSERT INTO orders (id,user_id,status,service,fulfillment,requested_date,production_date,fulfillment_date,
        customer_name,phone,comune,address,notes,plan_json,training_json,items_json,meals,internal_note,price_cents,paid,source,
        sub_plan,sub_tier,sub_household,sub_trial,discount_code,discount_percent,discount_applied_percent,discount_base_cents,discount_round_euro)
      SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'manual',?,?,?,0,?,?,?,?,?
      WHERE NOT EXISTS (${GIA_INSERITO})
        AND (? IS NULL OR EXISTS (SELECT 1 FROM discount_codes WHERE code=? AND percent=? AND active=1))`)
      .bind(
        id, o.customerId ?? user.id, o.status, o.service, o.fulfillment, o.requestedDate, o.productionDate, o.fulfillmentDate,
        o.name, o.phone, o.comune, o.address, o.notes, JSON.stringify(o.plan), "{}", JSON.stringify(o.items), o.meals,
        o.internalNote, o.priceCents, o.paid,
        o.subscription?.plan ?? null, o.subscription?.tier ?? null, o.subscription?.household ?? null,
        sconto.discount?.code ?? null, sconto.discount?.percent ?? null, sconto.discount?.appliedPercent ?? null, sconto.discount?.baseCents ?? null, sconto.discount?.roundEuro ? 1 : 0,
        ...uguale,
        codice.code, codice.code, codice.percent,
      ),
    // L'evento si scrive solo se l'ordine e' entrato davvero.
    env.DB.prepare(`INSERT INTO order_events (order_id,actor,type,from_status,to_status,detail)
      SELECT ?, 'admin', 'created', NULL, ?, 'Inserito a mano da Matteo' WHERE EXISTS (SELECT 1 FROM orders WHERE id = ?)`)
      .bind(id, o.status, id),
  ]);
  if (!inserito.meta.changes) {
    const prima = await env.DB.prepare(`${GIA_INSERITO} ORDER BY created_at DESC LIMIT 1`).bind(...uguale).first<{ id: string }>();
    const esistente = prima ? await leggiOrdine(env, prima.id) : null;
    if (esistente) return json({ order: ordineDaRiga(esistente, true) });
    if (codice.code && !(await leggiSconto(env.DB, codice.code)).ok) return json({ error: "Il codice è stato disattivato. Toglilo e riprova." }, 400);
    return json({ error: "Ordine non salvato. Riprova." }, 500);
  }

  const row = await leggiOrdine(env, id);
  if (!row) return json({ error: "Ordine salvato, ma non riesco a rileggerlo: aggiorna la pagina." }, 500);
  return json({ order: ordineDaRiga(row, true) }, 201);
};
