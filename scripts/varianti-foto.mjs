/**
 * Le varianti leggere delle foto per telefoni e schermi piccoli.
 *
 * Le foto in public/foto sono larghe 900 o 1200 px e pesano fino a ~480 KB:
 * sul telefono ne basta molto meno. Questo script scrive, per ogni foto,
 * public/foto/480/<nome>.webp e public/foto/828/<nome>.webp (mai piu' larghe
 * dell'originale, ma sempre presenti). lib/immagini/loader.ts sceglie la variante
 * giusta per ogni voce dello srcset di next/image.
 *
 * Si lancia a mano quando si aggiungono o cambiano foto (i file generati si
 * committano, cosi' la build non dipende da sharp):
 *   node scripts/varianti-foto.mjs
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const CARTELLA = path.join(process.cwd(), "public", "foto");
const LARGHEZZE = [480, 828];

let scritte = 0;
let risparmio = 0;
for (const nome of fs.readdirSync(CARTELLA).filter((f) => f.endsWith(".webp"))) {
  const origine = path.join(CARTELLA, nome);
  const pesoOriginale = fs.statSync(origine).size;
  for (const w of LARGHEZZE) {
    const dir = path.join(CARTELLA, String(w));
    fs.mkdirSync(dir, { recursive: true });
    const destinazione = path.join(dir, nome);
    if (fs.existsSync(destinazione) && fs.statSync(destinazione).mtimeMs >= fs.statSync(origine).mtimeMs) continue;
    await sharp(origine).resize({ width: w, withoutEnlargement: true }).webp({ quality: 74, effort: 6 }).toFile(destinazione);
    scritte++;
    risparmio += pesoOriginale - fs.statSync(destinazione).size;
  }
}
console.log(`varianti-foto: ${scritte} varianti scritte, ${Math.round(risparmio / 1024)} KB in meno rispetto agli originali`);
