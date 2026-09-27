-- Pannello di Matteo: storia degli ordini, prezzo e pagamento, modulo contatti.
-- D1 applica le foreign key (PRAGMA foreign_keys = ON): gli eventi spariscono
-- con l'ordine, i messaggi restano ma perdono il collegamento all'account.

ALTER TABLE orders ADD COLUMN customer_message TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN price_cents INTEGER;
ALTER TABLE orders ADD COLUMN paid INTEGER NOT NULL DEFAULT 0 CHECK(paid IN (0, 1));

CREATE TABLE IF NOT EXISTS order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  actor TEXT NOT NULL CHECK(actor IN ('customer','admin','system')),
  type TEXT NOT NULL CHECK(type IN ('created','status','schedule','note','message','price','payment','email')),
  from_status TEXT,
  to_status TEXT,
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS order_events_order_date ON order_events(order_id, created_at);

-- Le richieste gia' presenti ricevono l'evento di nascita, cosi' ogni storia parte dall'invio.
INSERT INTO order_events (order_id, actor, type, from_status, to_status, detail, created_at)
SELECT id, 'customer', 'created', NULL, 'requested', 'Richiesta inviata dal sito', created_at FROM orders;

CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  comune TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','handled','archived')),
  user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  -- SHA-256 di IP + segreto: serve solo al limite di invii, l'IP in chiaro non si salva.
  ip_hash TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS contact_messages_status_date ON contact_messages(status, created_at DESC);
CREATE INDEX IF NOT EXISTS contact_messages_ip_date ON contact_messages(ip_hash, created_at);
CREATE INDEX IF NOT EXISTS contact_messages_user ON contact_messages(user_id);
