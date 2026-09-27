-- Ordini inseriti a mano da Matteo (telefono, WhatsApp, di persona).
-- 'web' = richiesta inviata dal sito, 'manual' = inserito dal pannello.
--
-- SQLite (e quindi D1) accetta CHECK in ADD COLUMN; con NOT NULL serve un
-- default non nullo, e dalla 3.37 il vincolo si verifica anche sulle righe
-- gia' presenti: qui prendono tutte il default 'web', quindi passano.
-- Un ordine a mano per chi non ha un account resta intestato a Matteo
-- (orders.user_id e' NOT NULL): lo si riconosce perche' user_id e' in staff_roles.

ALTER TABLE orders ADD COLUMN source TEXT NOT NULL DEFAULT 'web' CHECK(source IN ('web','manual'));
