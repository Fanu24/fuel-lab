import { currentUser, type Context } from "../_lib/auth";
import { bodyJson, json, sameOrigin } from "../_lib/http";
import { potaAllenamenti, potaPiano } from "../../lib/settimana";

/* La settimana salvata nell'account.

   `updated_at` fa da versione. Il browser che sincronizza da solo
   (lib/sincronizzaPiano) manda nel PUT `ifUpdatedAt`: la versione da cui e'
   partito, oppure null se crede che nell'account non ci sia niente. Il server
   scrive solo se e' ancora cosi', altrimenti risponde 409 e non tocca niente:
   due dispositivi non si sovrascrivono a vicenda, chi arriva secondo rilegge e
   decide. Il controllo e la scrittura sono una sola istruzione, quindi non c'e'
   spazio fra i due per un terzo.

   Il momento e' scritto al millisecondo: due salvataggi nello stesso secondo
   devono avere versioni diverse. Senza `ifUpdatedAt` il PUT sovrascrive come
   ha sempre fatto. */

const ADESSO = "strftime('%Y-%m-%d %H:%M:%f','now')";

export const onRequestGet = async ({ env, request }: Context) => {
  const user = await currentUser(env, request);
  if (!user) return json({ error: "Accedi per leggere il piano" }, 401);
  const row = await env.DB.prepare("SELECT plan_json, training_json, updated_at FROM saved_plans WHERE user_id = ?")
    .bind(user.id).first<{ plan_json: string; training_json: string; updated_at: string }>();
  return json({ plan: row ? JSON.parse(row.plan_json) : null, training: row ? JSON.parse(row.training_json) : null, updatedAt: row?.updated_at ?? null });
};

export const onRequestPut = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ error: "Origine non valida" }, 403);
  const user = await currentUser(env, request);
  if (!user) return json({ error: "Accedi per salvare il piano" }, 401);
  const body = await bodyJson(request, 25000);
  if (!body) return json({ error: "Dati non validi" }, 400);
  const se = body.ifUpdatedAt;
  if (se !== undefined && se !== null && typeof se !== "string") return json({ error: "Dati non validi" }, 400);
  const plan = potaPiano(body.plan);
  const training = potaAllenamenti(body.training);
  const piano = JSON.stringify(plan);
  const allenamenti = JSON.stringify(training);

  const scritta = se === undefined
    ? env.DB.prepare(`INSERT INTO saved_plans (user_id,plan_json,training_json,updated_at) VALUES (?,?,?,${ADESSO})
        ON CONFLICT(user_id) DO UPDATE SET plan_json=excluded.plan_json,training_json=excluded.training_json,updated_at=excluded.updated_at
        RETURNING updated_at`).bind(user.id, piano, allenamenti)
    : se === null
      // "Nell'account non c'e' niente": si crea, ma solo se e' ancora vero.
      ? env.DB.prepare(`INSERT INTO saved_plans (user_id,plan_json,training_json,updated_at) VALUES (?,?,?,${ADESSO})
          ON CONFLICT(user_id) DO NOTHING RETURNING updated_at`).bind(user.id, piano, allenamenti)
      : env.DB.prepare(`UPDATE saved_plans SET plan_json=?,training_json=?,updated_at=${ADESSO}
          WHERE user_id=? AND updated_at=? RETURNING updated_at`).bind(piano, allenamenti, user.id, se);
  const riga = await scritta.first<{ updated_at: string }>();
  if (!riga) return json({ error: "La settimana nel tuo account è cambiata da un altro dispositivo." }, 409);
  return json({ plan, training, updatedAt: riga.updated_at });
};
