CREATE TABLE IF NOT EXISTS discount_checks (
  address_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (address_hash, window_start)
);
