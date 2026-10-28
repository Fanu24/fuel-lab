import { normalizzaCodice } from "../../lib/sconti";
import { leggiSconto, preparaSconto } from "../../lib/server/sconti";
import { currentUser, type Context } from "../_lib/auth";
import { bodyJson, json, sameOrigin } from "../_lib/http";
import { leggiImpostazioniDb } from "../_lib/impostazioni";
import { accodaEmail, emailMatteo } from "../_lib/mail";
import { ORDER_SELECT } from "../_lib/ordini";
import { oggiRoma } from "../../lib/server/date";
import { emailNuovaRichiesta, emailRichiestaRicevuta } from "../../lib/server/email";
import { controllaDataPreferita } from "../../lib/server/impostazioni";
import { leggiNuovoOrdine, ordineDaRiga, type NuovoOrdineValido, type RigaOrdine } from "../../lib/server/ordini";

/** La stessa richiesta, dello stesso cliente, partita negli ultimi 10 minuti e non annullata. */
const GIA_INVIATA = `SELECT id,status FROM orders WHERE user_id=? AND source='web' AND status <> 'cancelled' AND created_at > datetime('now','-10 minutes')
  AND service=? AND fulfillment=? AND COALESCE(requested_date,'')=? AND customer_name=? AND phone=? AND comune=? AND address=? AND notes=? AND plan_json=?
  AND COALESCE(sub_plan,'')=? AND COALESCE(sub_tier,'')=? AND COALESCE(sub_household,'')=? AND COALESCE(discount_code,'')=?`;

/** I valori di GIA_INVIATA, nello stesso ordine dei segnaposto. */
const legaUguale = (userId: string, o: NuovoOrdineValido, code: string | null) => [
  userId, o.service, o.fulfillment, o.requestedDate ?? "", o.name, o.phone, o.comune, o.address, o.notes, JSON.stringify(o.plan),
  o.subscription?.plan ?? "", o.subscription?.tier ?? "", o.subscription?.household ?? "", code ?? "",
];

export const onRequestGet = async ({ env, request }: Context) => {
  const user = await currentUser(env, request);
  if (!user) return json({ error: "Accesso richiesto" }, 401);
  const admin = user.role === "admin";
  // Matteo puo' chiedere lo storico completo di un cliente: /api/orders?user=<id>.
  const cliente = admin ? new URL(request.url).searchParams.get("user") : null;
  if (cliente) {
    const storico = await env.DB.prepare(`${ORDER_SELECT} WHERE o.user_id = ? ORDER BY o.created_at DESC LIMIT 500`).bind(cliente.slice(0, 100)).all<RigaOrdine>();
    return json({ orders: storico.results.map((row) => ordineDaRiga(row, true)) });
  }
  const rows = admin
    ? (await Promise.all([
      // Aperti, piu' i consegnati ancora da incassare (che non devono sparire dal promemoria)...
      env.DB.prepare(`${ORDER_SELECT} WHERE o.status NOT IN ('completed','cancelled') OR (o.status = 'completed' AND o.paid = 0 AND o.price_cents > 0) ORDER BY o.created_at DESC`).all<RigaOrdine>(),
      // ...e gli ultimi 100 chiusi, per lo storico.
      env.DB.prepare(`${ORDER_SELECT} WHERE o.status IN ('completed','cancelled') ORDER BY o.created_at DESC LIMIT 100`).all<RigaOrdine>(),
    ])).flatMap((result) => result.results).filter((row, i, tutte) => tutte.findIndex((r) => r.id === row.id) === i)
    : (await env.DB.prepare(`${ORDER_SELECT} WHERE o.user_id = ? ORDER BY o.created_at DESC LIMIT 50`).bind(user.id).all<RigaOrdine>()).results;
  return json({ orders: rows.map((row) => ordineDaRiga(row, admin)), historyLimit: admin ? 100 : undefined });
};

export const onRequestPost = async ({ env, request, waitUntil }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Non riesco a verificare da dove arriva la richiesta: ricarica la pagina e riprova." }, 403);
  const user = await currentUser(env, request);
  if (!user) return json({ error: "Accedi prima di inviare una richiesta" }, 401);
  const body = await bodyJson(request, 30000);
  if (!body) return json({ error: "Dati non validi" }, 400);

  const oggi = oggiRoma();
  const letto = leggiNuovoOrdine(body, user.name, oggi);
  if (!letto.ok) return json({ error: letto.error }, letto.status);
  const o = letto.value;
  const codiceNormalizzato = body.discountCode === undefined || body.discountCode === null || body.discountCode === "" ? null : normalizzaCodice(body.discountCode);
  if (body.discountCode && !codiceNormalizzato) return json({ error: "Codice sconto non valido." }, 400);

  // Il giorno preferito non puo' cadere in una chiusura decisa da Matteo nel pannello.
  if (o.requestedDate) {
    const { chiusure } = await leggiImpostazioniDb(env);
    const data = controllaDataPreferita(o.requestedDate, chiusure, oggi);
    if (!data.ok) return json({ error: data.error }, data.status);
  }

  // Un doppio tocco su "Invia" (o un nuovo tentativo dopo una rete che cade) non deve fare due richieste:
  // se la stessa richiesta e' partita da poco, si risponde con quella.
  const uguale = legaUguale(user.id, o, codiceNormalizzato);
  const gia = await env.DB.prepare(`${GIA_INVIATA} ORDER BY created_at DESC LIMIT 1`).bind(...uguale).first<{ id: string; status: string }>();
  if (gia) return json({ id: gia.id, status: gia.status });
  const codice = await leggiSconto(env.DB, body.discountCode);
  if (!codice.ok) return json({ error: codice.error }, 400);
  const sconto = preparaSconto(codice.code, codice.percent, o.priceCents, o.subscription, o.fulfillment);
  o.priceCents = sconto.price;

  const id = crypto.randomUUID();
  /* Il limite giornaliero e il controllo dei doppioni stanno dentro l'INSERT: ricontrollarli prima darebbe un
     errore gentile, ma due invii in parallelo lo passerebbero entrambi. Il limite conta solo le richieste
     arrivate dal sito: gli ordini che Matteo inserisce a mano per un cliente non lo consumano.
     L'evento si scrive solo se l'ordine e' entrato davvero. */
  const [inserito] = await env.DB.batch([
    // price_cents: solo l'abbonamento parte con un prezzo, ed e' una proposta finche' Matteo non conferma.
    // sub_*: la formula scelta, solo per l'abbonamento (NULL per gli altri servizi).
    env.DB.prepare(`INSERT INTO orders (id,user_id,service,fulfillment,requested_date,customer_name,phone,comune,address,notes,plan_json,training_json,items_json,meals,price_cents,sub_plan,sub_tier,sub_household,sub_trial,discount_code,discount_percent,discount_applied_percent,discount_base_cents,discount_round_euro)
      SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?,?,?
      WHERE (SELECT COUNT(*) FROM orders WHERE user_id=? AND source='web' AND created_at > datetime('now','-1 day')) < 5
        AND NOT EXISTS (${GIA_INVIATA})
        AND (? IS NULL OR EXISTS (SELECT 1 FROM discount_codes WHERE code=? AND percent=? AND active=1))`)
      .bind(
        id, user.id, o.service, o.fulfillment, o.requestedDate, o.name, o.phone, o.comune, o.address, o.notes,
        JSON.stringify(o.plan), JSON.stringify(o.training), JSON.stringify(o.items), o.items.length, o.priceCents,
        o.subscription?.plan ?? null, o.subscription?.tier ?? null, o.subscription?.household ?? null,
        sconto.discount?.code ?? null, sconto.discount?.percent ?? null, sconto.discount?.appliedPercent ?? null, sconto.discount?.baseCents ?? null, sconto.discount?.roundEuro ? 1 : 0,
        user.id,
        ...uguale,
        codice.code, codice.code, codice.percent,
      ),
    env.DB.prepare(`INSERT INTO order_events (order_id,actor,type,from_status,to_status,detail)
      SELECT ?, 'customer', 'created', NULL, 'requested', 'Richiesta inviata dal sito' WHERE EXISTS (SELECT 1 FROM orders WHERE id = ?)`)
      .bind(id, id),
    // Il profilo impara dalla prima richiesta: si riempiono solo i campi ancora vuoti.
    env.DB.prepare(`INSERT INTO customer_profiles (user_id,phone,comune,address) VALUES (?,?,?,?)
      ON CONFLICT(user_id) DO UPDATE SET
        phone = CASE WHEN customer_profiles.phone = '' THEN excluded.phone ELSE customer_profiles.phone END,
        comune = CASE WHEN customer_profiles.comune = '' THEN excluded.comune ELSE customer_profiles.comune END,
        address = CASE WHEN customer_profiles.address = '' THEN excluded.address ELSE customer_profiles.address END,
        updated_at = CURRENT_TIMESTAMP
      WHERE (customer_profiles.phone = '' AND excluded.phone <> '')
         OR (customer_profiles.comune = '' AND excluded.comune <> '')
         OR (customer_profiles.address = '' AND excluded.address <> '')`)
      .bind(user.id, o.phone, o.comune, o.address),
  ]);
  if (!inserito.meta.changes) {
    // Non e' entrata: o e' un doppione partito nello stesso istante (si risponde con l'altra), o e' il limite del giorno.
    const altra = await env.DB.prepare(`${GIA_INVIATA} ORDER BY created_at DESC LIMIT 1`).bind(...uguale).first<{ id: string; status: string }>();
    if (altra) return json({ id: altra.id, status: altra.status });
    if (codice.code && !(await leggiSconto(env.DB, codice.code)).ok) return json({ error: "Il codice è stato disattivato. Toglilo e riprova." }, 400);
    return json({ error: "Hai già inviato diverse richieste oggi. Scrivici a info@fuelchef.it." }, 429);
  }

  const perEmail = {
    id,
    customer_name: o.name,
    email: user.email,
    phone: o.phone,
    comune: o.comune,
    address: o.address,
    fulfillment: o.fulfillment,
    service: o.service,
    requested_date: o.requestedDate,
    notes: o.notes,
    meals: o.items.length,
    items: o.items,
    price_cents: o.priceCents,
    subscription: o.subscription,
    discount: sconto.discount,
  };
  await accodaEmail({ env, waitUntil }, { to: [emailMatteo(env)], replyTo: user.email, ...emailNuovaRichiesta(perEmail) });
  // La ricevuta al cliente: rispondere a quest'email scrive a Matteo, non a una casella che nessuno legge.
  await accodaEmail({ env, waitUntil }, { to: [user.email], replyTo: emailMatteo(env), ...emailRichiestaRicevuta(perEmail) });
  return json({ id, status: "requested" }, 201);
};
