ALTER TABLE orders ADD COLUMN production_date TEXT;
ALTER TABLE orders ADD COLUMN fulfillment_date TEXT;
CREATE INDEX IF NOT EXISTS orders_production_day ON orders(status, production_date);
CREATE INDEX IF NOT EXISTS orders_fulfillment_day ON orders(status, fulfillment_date);
