import { oggiRoma } from "../../../lib/server/date";
import { leggiIdCliente, leggiOrdineManuale, type ClienteRegistrato } from "../../../lib/server/ordini-manuali";
import { ordineDaRiga } from "../../../lib/server/ordini";
import { currentUser, soloAdmin, type Context } from "../../_lib/auth";
import { bodyJson, json, sameOrigin } from "../../_lib/http";
import { eventoStmt, leggiOrdine } from "../../_lib/ordini";

/**
 * POST /api/admin/orders — Matteo inserisce un ordine preso per telefono,
 * WhatsApp o di persona. Con `customerId` l'ordine entra nell'account del
 * cliente (le email di aggiornamento poi funzionano come sempre); senza, resta
 * intestato a Matteo stesso, perche' orders.user_id non puo' essere vuoto.
 * Alla creazione non parte nessuna email: il cliente l'ha appena sentito.
 */
export const onRequestPost = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Origine non valida" }, 403);
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

  const id = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO orders (id,user_id,status,service,fulfillment,requested_date,production_date,fulfillment_date,
        customer_name,phone,comune,address,notes,plan_json,training_json,items_json,meals,internal_note,price_cents,paid,source,
        sub_plan,sub_tier,sub_household,sub_trial)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'manual',?,?,?,?)`)
      .bind(
        id, o.customerId ?? user.id, o.status, o.service, o.fulfillment, o.requestedDate, o.productionDate, o.fulfillmentDate,
        o.name, o.phone, o.comune, o.address, o.notes, JSON.stringify(o.plan), "{}", JSON.stringify(o.items), o.meals,
        o.internalNote, o.priceCents, o.paid,
        o.subscription?.plan ?? null, o.subscription?.tier ?? null, o.subscription?.household ?? null, o.subscription?.trial ? 1 : 0,
      ),
    eventoStmt(env, id, "admin", { type: "created", from_status: null, to_status: o.status, detail: "Inserito a mano da Matteo" }),
  ]);

  const row = await leggiOrdine(env, id);
  if (!row) return json({ error: "Ordine salvato, ma non riesco a rileggerlo: aggiorna la pagina." }, 500);
  return json({ order: ordineDaRiga(row, true) }, 201);
};
