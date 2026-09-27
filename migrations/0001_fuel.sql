CREATE TABLE IF NOT EXISTS staff_roles (
  user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role = 'admin'),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_profiles (
  user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  phone TEXT NOT NULL DEFAULT '',
  comune TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  preferences TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_plans (
  user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  plan_json TEXT NOT NULL,
  training_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','confirmed','preparing','ready','completed','cancelled')),
  service TEXT NOT NULL DEFAULT 'menu-settimana',
  fulfillment TEXT NOT NULL CHECK(fulfillment IN ('pickup','delivery')),
  requested_date TEXT,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  comune TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  plan_json TEXT NOT NULL,
  training_json TEXT NOT NULL,
  items_json TEXT NOT NULL,
  meals INTEGER NOT NULL DEFAULT 0,
  internal_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS orders_user_date ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_date ON orders(status, requested_date);

CREATE TABLE IF NOT EXISTS traffic_daily (
  day TEXT NOT NULL,
  path TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(day, path)
);
