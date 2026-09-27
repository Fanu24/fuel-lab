import { impronta, leggiNuovoMessaggio, MESSAGGI_ORARI } from "../../lib/server/contatti";
import { emailNuovoMessaggio } from "../../lib/server/email";
import { currentUser, type Context } from "../_lib/auth";
import { bodyJson, json, sameOrigin } from "../_lib/http";
import { accodaEmail, emailMatteo } from "../_lib/mail";

/** POST /api/contact — pubblico: il modulo contatti, anche senza account. */
export const onRequestPost = async ({ env, request, waitUntil }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Origine non valida" }, 403);
  const body = await bodyJson(request, 10000);
  if (!body) return json({ error: "Dati non validi" }, 400);

  const letto = leggiNuovoMessaggio(body);
  if (!letto.ok) return json({ error: letto.error }, 400);
  // Esca piena: al bot si risponde come a un invio riuscito, ma non si salva niente.
  if (letto.bot) return json({ id: crypto.randomUUID() }, 201);
  const m = letto.value;

  const ipHash = await impronta(request.headers.get("CF-Connecting-IP") ?? "sconosciuto", env.BETTER_AUTH_SECRET ?? "");
  const recenti = await env.DB.prepare("SELECT COUNT(*) AS n FROM contact_messages WHERE ip_hash = ? AND created_at > datetime('now','-1 hour')")
    .bind(ipHash).first<{ n: number }>();
  if ((recenti?.n ?? 0) >= MESSAGGI_ORARI) {
    return json({ error: "Hai già inviato diversi messaggi nell'ultima ora. Riprova più tardi o scrivi a info@fuelchef.it." }, 429);
  }

  // Il messaggio arriva anche senza account: la sessione, se c'e', serve solo a collegarlo.
  const user = await currentUser(env, request).catch(() => null);
  const id = crypto.randomUUID();
  // Il tetto orario e' ricontrollato dentro l'INSERT, cosi' gli invii in parallelo non lo superano.
  const inserito = await env.DB.prepare(`INSERT INTO contact_messages (id,name,email,phone,comune,topic,message,user_id,ip_hash)
    SELECT ?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM contact_messages WHERE ip_hash = ? AND created_at > datetime('now','-1 hour')) < ?`)
    .bind(id, m.name, m.email, m.phone, m.comune, m.topic, m.message, user?.id ?? null, ipHash, ipHash, MESSAGGI_ORARI).run();
  if (!inserito.meta.changes) {
    return json({ error: "Hai già inviato diversi messaggi nell'ultima ora. Riprova più tardi o scrivi a info@fuelchef.it." }, 429);
  }

  await accodaEmail({ env, waitUntil }, {
    to: [emailMatteo(env)],
    replyTo: m.email || undefined,
    ...emailNuovoMessaggio(m),
  });
  return json({ id }, 201);
};
