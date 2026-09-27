-- Impostazioni del sito che Matteo cambia dal pannello (/dashboard/impostazioni):
-- piatti non disponibili, chiusure e ferie, avviso in cima alle pagine.
--
-- Una riga per chiave, il valore in JSON: aggiungere un'impostazione domani non
-- vuole un'altra migrazione. Chiavi usate oggi (vedi lib/server/impostazioni.ts):
--   'piattiNonDisponibili'  ["id-piatto", ...]
--   'chiusure'              [{"dal":"YYYY-MM-DD","al":"YYYY-MM-DD","motivo":"..."}, ...]
--   'avviso'                {"attivo":true,"testo":"...","link":"/menu"}
-- Una chiave assente vale il suo predefinito vuoto: la tabella nasce vuota.

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
