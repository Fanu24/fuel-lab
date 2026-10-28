/**
 * Il pannello di Matteo sul database: la rubrica, i pasti per giorno, la copia
 * della settimana scorsa e gli ordini accettati che entrano nella settimana.
 *
 * Le Pages Functions passano il database (D1) e il corpo della richiesta; le
 * regole di pastiDaOrdine e le date stanno in lib/pannello.ts, quelle delle
 * richieste in lib/server/ordini.ts.
 */

import type { D1Database, D1PreparedStatement } from "@cloudflare/workers-types";
import type { Ordine } from "../api";
import { getPiatto } from "../catalogo";
import { pastiDaOrdine, type ClienteMatteo, type DatiCliente, type NuovoPasto, type PastoPannello, type PastoSettimana } from "../pannello";
import { ORDER_SELECT } from "../../functions/_lib/ordini";
import { dataValida, oggiRoma, spostaGiorno } from "./date";
import { ordineDaRiga, type Esito, type RigaOrdine } from "./ordini";

/** Il tetto del prezzo a pasto della rubrica (centesimi), come il CHECK di clienti_matteo. */
export const MAX_PREZZO_PASTO_CENTS = 100_000;
/** Il pannello mostra al massimo 31 giorni: da ... a ... compresi, cioe' a - da <= 30. */
const GIORNI_MASSIMI_TRA_DA_E_A = 30;
/** Quanti piatti recenti per cliente, e fin dove si guarda indietro. */
const MAX_RECENTI = 12;
const GIORNI_RECENTI = 60;
/** Il tetto del prezzo di un singolo pasto (centesimi), come il CHECK di pasti. */
const MAX_PREZZO_RIGA_CENTS = 1_000_000;
/** Il tetto del testo di un piatto, come il CHECK di pasti. */
const MAX_PIATTO_CARATTERI = 200;
const PIATTO_SEGNAPOSTO = "Piatto da definire";

/** Il prezzo di un pasto scritto nel database: null resta null, il resto si ferma al tetto del CHECK. */
const prezzoRiga = (prezzo: number | null): number | null => (prezzo === null ? null : Math.min(prezzo, MAX_PREZZO_RIGA_CENTS));

/** Il testo di un piatto scritto nel database: mai vuoto, mai oltre il tetto del CHECK. */
const piattoRiga = (piatto: string): string => riga(piatto, MAX_PIATTO_CARATTERI) || PIATTO_SEGNAPOSTO;

type RigaSql = Record<string, unknown>;

const errore = (status: number, error: string) => ({ ok: false as const, status, error });

/** Testo su una riga: niente a capo ne' caratteri di controllo, spazi compattati, al massimo `max` caratteri. */
const riga = (value: unknown, max: number) =>
  typeof value === "string" ? value.replace(/\p{Cc}+/gu, " ").replace(/\s+/g, " ").slice(0, max).trim() : "";

/* =========================================================================
   Corpi di richiesta: validazione, senza D1
   ========================================================================= */

/** Il prezzo a pasto: vuoto vale null (nessun prezzo), altrimenti centesimi da 0 al tetto. */
export function leggiPrezzoPasto(value: unknown): Esito<number | null> {
  if (value === undefined || value === null || value === "") return { ok: true, value: null };
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > MAX_PREZZO_PASTO_CENTS) {
    return errore(400, "Prezzo a pasto non valido: usa i centesimi, da 0 a 1.000 €.");
  }
  return { ok: true, value };
}

/** Un identificativo (UUID o simile) da un corpo o da un parametro di percorso. */
export function leggiId(value: unknown): Esito<string> {
  return typeof value === "string" && /^[\w-]{1,100}$/.test(value.trim())
    ? { ok: true, value: value.trim() }
    : errore(400, "Identificativo non valido.");
}

/** Il cliente della rubrica: solo il nome è obbligatorio; il prezzo a pasto è facoltativo. */
export function leggiDatiCliente(body: Record<string, unknown>): Esito<DatiCliente> {
  const nome = riga(body.nome, 100);
  if (!nome) return errore(400, "Scrivi il nome del cliente.");
  const prezzo = leggiPrezzoPasto(body.prezzoPastoCents);
  if (!prezzo.ok) return prezzo;
  return {
    ok: true,
    value: { nome, telefono: riga(body.telefono, 40), indirizzo: riga(body.indirizzo, 240), prezzoPastoCents: prezzo.value },
  };
}

/** Un pasto messo a mano da Matteo: pranzo o cena, un piatto, da 1 a 20 porzioni (1 se non scritte). */
export function leggiNuovoPasto(body: Record<string, unknown>): Esito<NuovoPasto> {
  const cliente = leggiId(body.clienteId);
  if (!cliente.ok) return cliente;
  const data = body.data;
  if (!dataValida(data)) return errore(400, "Scegli una data valida.");
  const pasto = body.pasto;
  if (pasto !== "pranzo" && pasto !== "cena") return errore(400, "Il pasto è pranzo o cena.");
  const piatto = riga(body.piatto, 200);
  if (!piatto) return errore(400, "Scrivi il piatto.");
  const porzioni = body.porzioni === undefined || body.porzioni === null ? 1 : body.porzioni;
  if (typeof porzioni !== "number" || !Number.isInteger(porzioni) || porzioni < 1 || porzioni > 20) {
    return errore(400, "Le porzioni vanno da 1 a 20.");
  }
  // Il piatto del catalogo si collega per id; un id che il catalogo non conosce resta solo come testo.
  const piattoId = typeof body.piattoId === "string" && getPiatto(body.piattoId) ? body.piattoId : null;
  return { ok: true, value: { clienteId: cliente.value, data, pasto, piatto, piattoId, porzioni } };
}

/** Il messaggio d'errore dell'intervallo del pannello, o null se va bene: da <= a, al massimo 31 giorni. */
export function errorIntervallo(da: unknown, a: unknown): string | null {
  if (!dataValida(da) || !dataValida(a)) return "Date non valide.";
  if (da > a) return "La data di inizio è dopo quella di fine.";
  const giorni = (Date.parse(`${a}T00:00:00Z`) - Date.parse(`${da}T00:00:00Z`)) / 86_400_000;
  if (giorni > GIORNI_MASSIMI_TRA_DA_E_A) return "Il pannello mostra al massimo 31 giorni.";
  return null;
}

/* =========================================================================
   Righe SQL -> tipi del pannello
   ========================================================================= */

const SELECT_CLIENTE = `SELECT c.id, c.nome, c.telefono, c.indirizzo, c.prezzo_pasto_cents, c.user_id,
  (SELECT MAX(p.data) FROM pasti p WHERE p.cliente_id = c.id) AS ultimo_pasto
  FROM clienti_matteo c`;

const SELECT_PASTO = "SELECT id, cliente_id, data, pasto, piatto, piatto_id, porzioni, prezzo_cents, ordine_id FROM pasti";

/** Ordine per tipo di pasto dentro lo stesso giorno: pranzo, cena, poi il resto. */
const ORDINE_TIPO_PASTO = "CASE pasto WHEN 'pranzo' THEN 0 WHEN 'cena' THEN 1 ELSE 2 END";

function clienteDaRiga(r: RigaSql): ClienteMatteo {
  return {
    id: String(r.id),
    nome: String(r.nome),
    telefono: String(r.telefono),
    indirizzo: String(r.indirizzo),
    prezzoPastoCents: typeof r.prezzo_pasto_cents === "number" ? r.prezzo_pasto_cents : null,
    userId: typeof r.user_id === "string" ? r.user_id : null,
    ultimoPasto: typeof r.ultimo_pasto === "string" ? r.ultimo_pasto : null,
  };
}

function pastoDaRiga(r: RigaSql): PastoSettimana {
  return {
    id: String(r.id),
    clienteId: String(r.cliente_id),
    data: String(r.data),
    pasto: r.pasto as PastoPannello,
    piatto: String(r.piatto),
    piattoId: typeof r.piatto_id === "string" ? r.piatto_id : null,
    porzioni: Number(r.porzioni),
    prezzoCents: typeof r.prezzo_cents === "number" ? r.prezzo_cents : null,
    ordineId: typeof r.ordine_id === "string" ? r.ordine_id : null,
  };
}

/* =========================================================================
   Letture
   ========================================================================= */

export async function leggiCliente(db: D1Database, id: string): Promise<ClienteMatteo | null> {
  const r = await db.prepare(`${SELECT_CLIENTE} WHERE c.id = ?`).bind(id).first<RigaSql>();
  return r ? clienteDaRiga(r) : null;
}

async function leggiPastiSettimana(db: D1Database, clienteId: string, lunedi: string): Promise<PastoSettimana[]> {
  const { results } = await db.prepare(`${SELECT_PASTO} WHERE cliente_id = ? AND data BETWEEN ? AND ? ORDER BY data, ${ORDINE_TIPO_PASTO}`)
    .bind(clienteId, lunedi, spostaGiorno(lunedi, 6))
    .all<RigaSql>();
  return results.map(pastoDaRiga);
}

/**
 * Fino a 12 piatti distinti per cliente, dai pasti da 60 giorni prima di oggi in poi
 * (pranzo e cena, niente cuoco a domicilio; anche oggi e i giorni futuri, che sono quelli
 * che Matteo riusa), il più recente in cima. Ogni cliente c'e' nella mappa, anche vuoto.
 */
async function leggiRecenti(db: D1Database, idClienti: string[], oggi: string): Promise<Record<string, string[]>> {
  const recenti: Record<string, string[]> = Object.fromEntries(idClienti.map((id) => [id, []]));
  const { results } = await db.prepare(`SELECT cliente_id, piatto FROM pasti
      WHERE pasto <> 'evento' AND data >= ?
      GROUP BY cliente_id, piatto
      ORDER BY cliente_id, MAX(data) DESC, MAX(updated_at) DESC, piatto`)
    .bind(spostaGiorno(oggi, -GIORNI_RECENTI))
    .all<RigaSql>();
  for (const r of results) {
    const lista = recenti[String(r.cliente_id)];
    if (lista && lista.length < MAX_RECENTI) lista.push(String(r.piatto));
  }
  return recenti;
}

/** La rubrica intera, i pasti fra `da` e `a` (compresi) e i piatti recenti di ogni cliente. */
export async function leggiPannello(db: D1Database, da: string, a: string) {
  const clienti = (await db.prepare(`${SELECT_CLIENTE} ORDER BY c.nome COLLATE NOCASE, c.id`).all<RigaSql>()).results.map(clienteDaRiga);
  const pasti = (await db.prepare(`${SELECT_PASTO} WHERE data BETWEEN ? AND ? ORDER BY data, ${ORDINE_TIPO_PASTO}, cliente_id`)
    .bind(da, a)
    .all<RigaSql>()).results.map(pastoDaRiga);
  const recenti = await leggiRecenti(db, clienti.map((c) => c.id), oggiRoma());
  return { clienti, pasti, recenti };
}

/** Gli ordini che aspettano una risposta di Matteo, dal più vecchio. */
export async function leggiNuovi(db: D1Database): Promise<Ordine[]> {
  const { results } = await db.prepare(`${ORDER_SELECT} WHERE o.status = 'requested' ORDER BY o.created_at, o.id`).all<RigaOrdine>();
  return results.map((r) => ordineDaRiga(r, true));
}

/* =========================================================================
   Rubrica e pasti
   ========================================================================= */

export async function creaCliente(db: D1Database, d: DatiCliente): Promise<ClienteMatteo> {
  const id = crypto.randomUUID();
  await db.prepare("INSERT INTO clienti_matteo (id, nome, telefono, indirizzo, prezzo_pasto_cents) VALUES (?, ?, ?, ?, ?)")
    .bind(id, d.nome, d.telefono, d.indirizzo, d.prezzoPastoCents)
    .run();
  const cliente = await leggiCliente(db, id);
  if (!cliente) throw new Error("Cliente non salvato");
  return cliente;
}

export async function modificaCliente(db: D1Database, id: string, d: DatiCliente): Promise<ClienteMatteo | null> {
  const r = await db.prepare("UPDATE clienti_matteo SET nome = ?, telefono = ?, indirizzo = ?, prezzo_pasto_cents = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(d.nome, d.telefono, d.indirizzo, d.prezzoPastoCents, id)
    .run();
  if (!r.meta.changes) return null;
  return leggiCliente(db, id);
}

/**
 * Mette il pasto nella casella (cliente, data, pasto): se c'era gia' lo aggiorna, senza
 * cambiare il prezzo con cui era entrato. Il prezzo nuovo e' quello attuale del cliente.
 */
export async function salvaPasto(db: D1Database, p: NuovoPasto): Promise<Esito<PastoSettimana>> {
  const cliente = await leggiCliente(db, p.clienteId);
  if (!cliente) return errore(404, "Cliente non trovato.");
  await db.prepare(`INSERT INTO pasti (id, cliente_id, data, pasto, piatto, piatto_id, porzioni, prezzo_cents)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(cliente_id, data, pasto) DO UPDATE SET
        piatto = excluded.piatto,
        piatto_id = excluded.piatto_id,
        porzioni = excluded.porzioni,
        prezzo_cents = COALESCE(pasti.prezzo_cents, excluded.prezzo_cents),
        updated_at = CURRENT_TIMESTAMP`)
    .bind(crypto.randomUUID(), p.clienteId, p.data, p.pasto, piattoRiga(p.piatto), p.piattoId, p.porzioni, prezzoRiga(cliente.prezzoPastoCents))
    .run();
  const riga = await db.prepare(`${SELECT_PASTO} WHERE cliente_id = ? AND data = ? AND pasto = ?`)
    .bind(p.clienteId, p.data, p.pasto)
    .first<RigaSql>();
  return riga ? { ok: true, value: pastoDaRiga(riga) } : errore(500, "Pasto non salvato. Riprova.");
}

export async function togliPasto(db: D1Database, id: string): Promise<boolean> {
  const r = await db.prepare("DELETE FROM pasti WHERE id = ?").bind(id).run();
  return r.meta.changes > 0;
}

/**
 * Copia pranzi e cene della settimana prima (lunedi-7 ... lunedi-1) sulle stesse
 * caselle della settimana di `lunedi`, dove sono vuote. Il prezzo e' quello attuale del cliente.
 */
export async function copiaSettimanaPrecedente(db: D1Database, clienteId: string, lunedi: string): Promise<{ pasti: PastoSettimana[]; copiati: number }> {
  const cliente = await leggiCliente(db, clienteId);
  if (!cliente) return { pasti: [], copiati: 0 };
  const { results } = await db.prepare(`${SELECT_PASTO} WHERE cliente_id = ? AND pasto IN ('pranzo', 'cena') AND data BETWEEN ? AND ?`)
    .bind(clienteId, spostaGiorno(lunedi, -7), spostaGiorno(lunedi, -1))
    .all<RigaSql>();
  const fonte = results.map(pastoDaRiga);
  let copiati = 0;
  if (fonte.length > 0) {
    const risultati = await db.batch(fonte.map((p) => db.prepare(`INSERT INTO pasti (id, cliente_id, data, pasto, piatto, piatto_id, porzioni, prezzo_cents, ordine_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
        ON CONFLICT(cliente_id, data, pasto) DO NOTHING`)
      .bind(crypto.randomUUID(), clienteId, spostaGiorno(p.data, 7), p.pasto, p.piatto, p.piattoId, p.porzioni, prezzoRiga(cliente.prezzoPastoCents))));
    copiati = risultati.reduce((n, r) => n + r.meta.changes, 0);
  }
  return { pasti: await leggiPastiSettimana(db, clienteId, lunedi), copiati };
}

/* =========================================================================
   Ordini accettati che entrano nella settimana
   ========================================================================= */

/** Il prezzo di un pasto dell'ordine: per il cuoco a domicilio e' a porzione x porzioni, come in pastiDaOrdine. */
function prezzoDelPasto(o: Pick<Ordine, "service" | "meals">, prezzo: number | null): number | null {
  if (prezzo === null) return null;
  return o.service === "home-cooking" ? prezzo * o.meals : prezzo;
}

/**
 * Porta un ordine accettato nella settimana: trova o crea il cliente nella rubrica,
 * salva il prezzo a pasto se Matteo l'ha scritto, mette i pasti dell'ordine e segna
 * l'ordine come entrato. Tutto in un batch: o entra tutto, o niente.
 *
 * Il proprietario dell'ordine e' lo staff (cliente senza account, scritto da Matteo)
 * quando ha un ruolo in staff_roles: in quel caso il cliente della rubrica non ha user_id
 * e si cerca per nome e telefono. Altrimenti si cerca per user_id.
 */
export async function mettiInSettimana(db: D1Database, ordine: Ordine, inizio: string, prezzoPastoCents: number | null, oggi: string): Promise<PastoSettimana[]> {
  const staff = await db.prepare("SELECT 1 FROM staff_roles WHERE user_id = ?").bind(ordine.user_id).first();
  const nome = riga(ordine.customer_name, 100) || "Senza nome";
  const telefono = riga(ordine.phone, 40);
  const indirizzoOrdine = riga(ordine.address, 240);
  const indirizzo = indirizzoOrdine ? riga([indirizzoOrdine, riga(ordine.comune, 100)].filter(Boolean).join(", "), 240) : "";

  const trovato = staff
    ? await db.prepare("SELECT id FROM clienti_matteo WHERE user_id IS NULL AND nome = ? AND telefono = ?").bind(nome, telefono).first<{ id: string }>()
    : await db.prepare("SELECT id FROM clienti_matteo WHERE user_id = ?").bind(ordine.user_id).first<{ id: string }>();
  const clienteId = trovato?.id ?? crypto.randomUUID();

  const statements: D1PreparedStatement[] = [];
  if (!trovato) {
    statements.push(db.prepare("INSERT INTO clienti_matteo (id, nome, telefono, indirizzo, prezzo_pasto_cents, user_id) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(clienteId, nome, telefono, indirizzo, prezzoPastoCents, staff ? null : ordine.user_id));
  } else if (prezzoPastoCents !== null) {
    statements.push(db.prepare("UPDATE clienti_matteo SET prezzo_pasto_cents = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(prezzoPastoCents, clienteId));
  }

  for (const p of pastiDaOrdine(ordine, inizio, prezzoPastoCents, oggi)) {
    statements.push(db.prepare(`INSERT INTO pasti (id, cliente_id, data, pasto, piatto, piatto_id, porzioni, prezzo_cents, ordine_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(cliente_id, data, pasto) DO NOTHING`)
      .bind(crypto.randomUUID(), clienteId, p.data, p.pasto, piattoRiga(p.piatto), p.piattoId, p.porzioni, prezzoRiga(p.prezzoCents), ordine.id));
  }

  // I pasti gia' entrati senza prezzo (convertiti dal caricamento) prendono il prezzo accettato.
  if (prezzoPastoCents !== null) {
    statements.push(db.prepare("UPDATE pasti SET prezzo_cents = ? WHERE ordine_id = ? AND prezzo_cents IS NULL")
      .bind(prezzoRiga(prezzoDelPasto(ordine, prezzoPastoCents)), ordine.id));
  }
  statements.push(db.prepare("UPDATE orders SET in_settimana = 1 WHERE id = ?").bind(ordine.id));

  await db.batch(statements);

  const { results } = await db.prepare(`${SELECT_PASTO} WHERE ordine_id = ? ORDER BY data, ${ORDINE_TIPO_PASTO}`).bind(ordine.id).all<RigaSql>();
  return results.map(pastoDaRiga);
}

/**
 * Porta nella settimana gli ordini gia' accettati (confermati, in preparazione o pronti)
 * che non ci sono ancora. Il giorno e' la data di consegna, altrimenti quella di produzione,
 * altrimenti quella richiesta, altrimenti oggi. Restituisce quanti ne ha portati.
 */
export async function convertiOrdiniAperti(db: D1Database, oggi: string): Promise<number> {
  const { results } = await db.prepare(`${ORDER_SELECT} WHERE o.status IN ('confirmed', 'preparing', 'ready') AND o.in_settimana = 0 ORDER BY o.created_at, o.id`)
    .all<RigaOrdine>();
  let convertiti = 0;
  // Un ordine che non si converte non deve fermare il pannello: si registra e si va avanti.
  for (const row of results) {
    try {
      const ordine = ordineDaRiga(row, true);
      const inizio = ordine.fulfillment_date ?? ordine.production_date ?? ordine.requested_date ?? oggi;
      await mettiInSettimana(db, ordine, inizio, null, oggi);
      convertiti++;
    } catch (error) {
      console.error(`Ordine ${String(row.id)} non convertito nella settimana`, error);
    }
  }
  return convertiti;
}
