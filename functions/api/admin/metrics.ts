import type { Metriche } from "../../../lib/api";
import { giorniFino, giornoRoma, oggiRoma, spostaGiorno } from "../../../lib/server/date";
import {
  conteggiGiornalieri,
  leggiGiorni,
  nelPeriodo,
  ordiniGiornalieri,
  ordiniPerStato,
  ricavi,
  topPiatti,
  trafficoGiornaliero,
  type RigaOrdineMetriche,
} from "../../../lib/server/metriche";
import { currentUser, soloAdmin, type Context } from "../../_lib/auth";
import { json } from "../../_lib/http";

/**
 * GET /api/admin/metrics?days=N (7..365, predefinito 30).
 * Tutto si riferisce agli ultimi N giorni di Pescara, oggi compreso; fanno
 * eccezione `customers` (totale clienti) e `messagesNew` (messaggi da leggere).
 */
export const onRequestGet = async ({ env, request }: Context) => {
  const user = await currentUser(env, request);
  const vietato = soloAdmin(user);
  if (vietato) return vietato;

  const days = leggiGiorni(new URL(request.url).searchParams.get("days"));
  const giorni = giorniFino(oggiRoma(), days);
  const primo = giorni[0];
  // Un giorno di margine in UTC: il filtro esatto sul giorno di Pescara si fa dopo, in nelPeriodo.
  const soglia = spostaGiorno(primo, -1);
  const NON_STAFF = "id NOT IN (SELECT user_id FROM staff_roles)";

  const [clienti, iscritti, ordini, traffico, pagine, messaggi] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS n FROM user WHERE ${NON_STAFF}`).first<{ n: number }>(),
    env.DB.prepare(`SELECT createdAt FROM user WHERE ${NON_STAFF} AND createdAt >= ?`).bind(soglia).all<{ createdAt: string }>(),
    env.DB.prepare("SELECT created_at,status,meals,items_json,price_cents,paid FROM orders WHERE created_at >= ?").bind(soglia).all<RigaOrdineMetriche>(),
    env.DB.prepare("SELECT day,SUM(views) AS views FROM traffic_daily WHERE day >= ? GROUP BY day").bind(primo).all<{ day: string; views: number }>(),
    env.DB.prepare("SELECT path,SUM(views) AS views FROM traffic_daily WHERE day >= ? GROUP BY path ORDER BY views DESC, path LIMIT 10").bind(primo).all<{ path: string; views: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM contact_messages WHERE status = 'new'").first<{ n: number }>(),
  ]);

  const ordiniPeriodo = nelPeriodo(giorni, ordini.results, (o) => o.created_at);
  const giorniIscrizione = iscritti.results
    .map((riga) => giornoRoma(riga.createdAt))
    .filter((giorno): giorno is string => !!giorno && giorno >= primo);
  const signupsDaily = conteggiGiornalieri(giorni, giorniIscrizione);

  const metriche: Metriche = {
    days,
    customers: clienti?.n ?? 0,
    newCustomers: signupsDaily.reduce((somma, punto) => somma + punto.count, 0),
    ordersByStatus: ordiniPerStato(ordiniPeriodo),
    ordersDaily: ordiniGiornalieri(giorni, ordiniPeriodo),
    signupsDaily,
    traffic: trafficoGiornaliero(giorni, traffico.results),
    topPages: pagine.results.map((riga) => ({ path: riga.path, views: Number(riga.views) || 0 })),
    topDishes: topPiatti(ordiniPeriodo),
    revenue: ricavi(ordiniPeriodo),
    messagesNew: messaggi?.n ?? 0,
  };
  return json(metriche);
};
