import type { EventoOrdine } from "../../../lib/api";
import { messaggioDaRiga } from "../../../lib/server/contatti";
import { oggiRoma, tsSqlite } from "../../../lib/server/date";
import { dettaglioDaRiga, eventoDaRiga, type RigaOrdine } from "../../../lib/server/ordini";
import { currentUser, type Context } from "../../_lib/auth";
import { json } from "../../_lib/http";
import { ORDER_SELECT } from "../../_lib/ordini";

/**
 * GET /api/account/export — tutti i dati dell'utente collegato (art. 15 e 20 GDPR).
 * Stesso filtro dell'area cliente: niente note interne, niente token o password.
 */
export const onRequestGet = async ({ env, request }: Context) => {
  const user = await currentUser(env, request);
  if (!user) return json({ error: "Accedi per scaricare i tuoi dati" }, 401);

  const [profilo, piano, ordini, eventi, messaggi, accounts, sessioni] = await Promise.all([
    env.DB.prepare("SELECT phone,comune,address,preferences,updated_at FROM customer_profiles WHERE user_id = ?").bind(user.id).first<Record<string, unknown>>(),
    env.DB.prepare("SELECT plan_json,training_json,updated_at FROM saved_plans WHERE user_id = ?").bind(user.id).first<{ plan_json: string; training_json: string; updated_at: string }>(),
    env.DB.prepare(`${ORDER_SELECT} WHERE o.user_id = ? ORDER BY o.created_at DESC`).bind(user.id).all<RigaOrdine>(),
    env.DB.prepare("SELECT e.id,e.order_id,e.actor,e.type,e.from_status,e.to_status,e.detail,e.created_at FROM order_events e JOIN orders o ON o.id = e.order_id WHERE o.user_id = ? ORDER BY e.created_at, e.id")
      .bind(user.id).all<Record<string, unknown>>(),
    env.DB.prepare("SELECT id,name,email,phone,comune,topic,message,status,user_id,created_at,updated_at FROM contact_messages WHERE user_id = ? ORDER BY created_at DESC")
      .bind(user.id).all<Record<string, unknown>>(),
    env.DB.prepare("SELECT providerId,accountId,scope,createdAt,updatedAt FROM account WHERE userId = ?").bind(user.id).all<Record<string, unknown>>(),
    env.DB.prepare("SELECT createdAt,updatedAt,expiresAt,ipAddress,userAgent FROM session WHERE userId = ? ORDER BY createdAt DESC").bind(user.id).all<Record<string, unknown>>(),
  ]);

  const eventiPerOrdine = new Map<string, EventoOrdine[]>();
  for (const riga of eventi.results) {
    const lista = eventiPerOrdine.get(String(riga.order_id)) ?? [];
    lista.push(eventoDaRiga(riga));
    eventiPerOrdine.set(String(riga.order_id), lista);
  }

  const dati = {
    exportedAt: new Date().toISOString(),
    service: "FUEL LAB · fuelchef.it · Via del Santuario 214, 65124 Pescara",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
      image: user.image ?? null,
      role: user.role,
      createdAt: tsSqlite(user.createdAt),
      updatedAt: tsSqlite(user.updatedAt),
    },
    profile: profilo ?? null,
    savedPlan: piano ? { plan: JSON.parse(piano.plan_json), training: JSON.parse(piano.training_json), updatedAt: piano.updated_at } : null,
    orders: ordini.results.map((row) => dettaglioDaRiga(row, eventiPerOrdine.get(String(row.id)) ?? [], false)),
    contactMessages: messaggi.results.map(messaggioDaRiga),
    accounts: accounts.results.map((a) => ({
      providerId: a.providerId,
      accountId: a.accountId,
      scope: a.scope ?? null,
      createdAt: tsSqlite(a.createdAt),
      updatedAt: tsSqlite(a.updatedAt),
    })),
    sessions: sessioni.results.map((s) => ({
      createdAt: tsSqlite(s.createdAt),
      updatedAt: tsSqlite(s.updatedAt),
      expiresAt: tsSqlite(s.expiresAt),
      ipAddress: s.ipAddress ?? null,
      userAgent: s.userAgent ?? null,
    })),
  };

  return new Response(JSON.stringify(dati, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="fuel-lab-dati-${oggiRoma()}.json"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
