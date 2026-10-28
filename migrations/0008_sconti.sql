CREATE TABLE discount_codes (
  code TEXT PRIMARY KEY COLLATE NOCASE,
  percent INTEGER NOT NULL CHECK(percent BETWEEN 1 AND 100),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE orders ADD COLUMN discount_code TEXT;
ALTER TABLE orders ADD COLUMN discount_percent INTEGER;
ALTER TABLE orders ADD COLUMN discount_applied_percent INTEGER;
ALTER TABLE orders ADD COLUMN discount_base_cents INTEGER;
ALTER TABLE orders ADD COLUMN discount_round_euro INTEGER NOT NULL DEFAULT 0 CHECK(discount_round_euro IN (0,1));
CREATE INDEX orders_discount_code ON orders(discount_code);
