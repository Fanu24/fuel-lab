-- Abbonamenti in cinque formule (Pranzo, Leggero, Completo, Full 6, Full 7),
-- ciascuna in fascia Standard o Plus (lib/abbonamento.ts).
--
-- Quattro colonne sull'ordine, valide solo per service = 'abbonamento' (NULL
-- per gli altri servizi). Come in 0004, SQLite accetta CHECK in ADD COLUMN e
-- li verifica anche sulle righe gia' presenti: qui sono tutte NULL o 0, quindi
-- passano.
--   sub_plan       la formula
--   sub_tier       la fascia
--   sub_household  chi si abbona (da solo, in coppia, in famiglia): serve a Matteo per lo sconto
--   sub_trial      1 se il cliente parte dalla settimana di prova

ALTER TABLE orders ADD COLUMN sub_plan TEXT CHECK(sub_plan IS NULL OR sub_plan IN ('pranzo','leggero','completo','full6','full7'));
ALTER TABLE orders ADD COLUMN sub_tier TEXT CHECK(sub_tier IS NULL OR sub_tier IN ('standard','plus'));
ALTER TABLE orders ADD COLUMN sub_household TEXT CHECK(sub_household IS NULL OR sub_household IN ('singolo','coppia','famiglia'));
ALTER TABLE orders ADD COLUMN sub_trial INTEGER NOT NULL DEFAULT 0 CHECK(sub_trial IN (0,1));

-- L'unico abbonamento che esisteva era il pranzo dal lunedi' al venerdi': diventa
-- la formula Pranzo, fascia Standard, da solo. Il prezzo gia' scritto sull'ordine non cambia.
UPDATE orders SET sub_plan = 'pranzo', sub_tier = 'standard', sub_household = 'singolo' WHERE service = 'abbonamento';
