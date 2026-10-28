-- La rubrica di Matteo: clienti del suo foglio e clienti del sito accettati.
CREATE TABLE IF NOT EXISTS clienti_matteo (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL CHECK(length(trim(nome)) BETWEEN 1 AND 100),
  telefono TEXT NOT NULL DEFAULT '' CHECK(length(telefono) <= 40),
  indirizzo TEXT NOT NULL DEFAULT '' CHECK(length(indirizzo) <= 240),
  prezzo_pasto_cents INTEGER CHECK(prezzo_pasto_cents IS NULL OR prezzo_pasto_cents BETWEEN 0 AND 100000),
  user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS clienti_matteo_utente ON clienti_matteo(user_id) WHERE user_id IS NOT NULL;

-- Una riga per pasto, con la data vera. 'evento' = cuoco a domicilio: compare nel giorno, senza etichetta.
CREATE TABLE IF NOT EXISTS pasti (
  id TEXT PRIMARY KEY,
  cliente_id TEXT NOT NULL REFERENCES clienti_matteo(id) ON DELETE CASCADE,
  data TEXT NOT NULL CHECK(data GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  pasto TEXT NOT NULL CHECK(pasto IN ('pranzo','cena','evento')),
  piatto TEXT NOT NULL CHECK(length(trim(piatto)) BETWEEN 1 AND 200),
  piatto_id TEXT,
  porzioni INTEGER NOT NULL DEFAULT 1 CHECK(porzioni BETWEEN 1 AND 20),
  -- Prezzo di una porzione quando il pasto e' entrato: cambiare il prezzo del cliente non riscrive i mesi passati.
  prezzo_cents INTEGER CHECK(prezzo_cents IS NULL OR prezzo_cents BETWEEN 0 AND 1000000),
  ordine_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cliente_id, data, pasto)
);
CREATE INDEX IF NOT EXISTS pasti_data ON pasti(data);
CREATE INDEX IF NOT EXISTS pasti_ordine ON pasti(ordine_id);

-- 1 quando l'ordine e' gia' stato portato nella settimana (accettato o convertito).
ALTER TABLE orders ADD COLUMN in_settimana INTEGER NOT NULL DEFAULT 0 CHECK(in_settimana IN (0, 1));

CREATE TABLE IF NOT EXISTS push_iscrizioni (
  endpoint TEXT PRIMARY KEY CHECK(length(endpoint) BETWEEN 10 AND 1000),
  p256dh TEXT NOT NULL CHECK(length(p256dh) BETWEEN 80 AND 100),
  auth TEXT NOT NULL CHECK(length(auth) BETWEEN 16 AND 30),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
