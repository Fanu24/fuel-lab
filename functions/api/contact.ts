import { impronta, leggiNuovoMessaggio, MESSAGGI_ORARI, MESSAGGI_ORARI_TOTALI, reteDi } from "../../lib/server/contatti";
import { emailNuovoMessaggio } from "../../lib/server/email";
import { currentUser, type Context } from "../_lib/auth";
import { bodyJson, json, sameOrigin } from "../_lib/http";
import { accodaEmail, emailMatteo } from "../_lib/mail";

const MESSAGGIO_TROPPI_DALLA_RETE = "Hai già inviato diversi messaggi nell'ultima ora. Riprova più tardi o scrivi a info@fuelchef.it.";
const MESSAGGIO_TROPPI_IN_TOTALE = "In questo momento riceviamo molti messaggi. Riprova fra un po' o scrivi a info@fuelchef.it.";

/** Il perche' di un rifiuto per troppi messaggi nell'ultima ora (da questa rete o da tutta la rete), oppure null se si puo' scrivere. */
async function limiteSuperato(env: Context["env"], ipHash: string): Promise<string | null> {
  const n = await env.DB.prepare(`SELECT
      (SELECT COUNT(*) FROM contact_messages WHERE ip_hash = ? AND created_at > datetime('now','-1 hour')) AS rete,
      (SELECT COUNT(*) FROM contact_messages WHERE created_at > datetime('now','-1 hour')) AS tutti`)
    .bind(ipHash).first<{ rete: number; tutti: number }>();
  if ((n?.rete ?? 0) >= MESSAGGI_ORARI) return MESSAGGIO_TROPPI_DALLA_RETE;
  if ((n?.tutti ?? 0) >= MESSAGGI_ORARI_TOTALI) return MESSAGGIO_TROPPI_IN_TOTALE;
  return null;
}

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

  // Il limite conta la rete (per l'IPv6 il /64), non il singolo indirizzo: si aggira troppo facilmente.
  const ipHash = await impronta(reteDi(request.headers.get("CF-Connecting-IP") ?? "sconosciuto"), env.BETTER_AUTH_SECRET ?? "");
  const troppi = await limiteSuperato(env, ipHash);
  if (troppi) return json({ error: troppi }, 429);

  // Il messaggio arriva anche senza account: la sessione, se c'e', serve solo a collegarlo.
  const user = await currentUser(env, request).catch(() => null);
  const id = crypto.randomUUID();
  // I tetti orari sono ricontrollati dentro l'INSERT, cosi' gli invii in parallelo non li superano.
  const inserito = await env.DB.prepare(`INSERT INTO contact_messages (id,name,email,phone,comune,topic,message,user_id,ip_hash)
    SELECT ?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM contact_messages WHERE ip_hash = ? AND created_at > datetime('now','-1 hour')) < ?
      AND (SELECT COUNT(*) FROM contact_messages WHERE created_at > datetime('now','-1 hour')) < ?`)
    .bind(id, m.name, m.email, m.phone, m.comune, m.topic, m.message, user?.id ?? null, ipHash, ipHash, MESSAGGI_ORARI, MESSAGGI_ORARI_TOTALI).run();
  if (!inserito.meta.changes) {
    return json({ error: (await limiteSuperato(env, ipHash)) ?? MESSAGGIO_TROPPI_DALLA_RETE }, 429);
  }

  await accodaEmail({ env, waitUntil }, {
    to: [emailMatteo(env)],
    replyTo: m.email || undefined,
    ...emailNuovoMessaggio(m),
  });
  return json({ id }, 201);
};
