/**
 * Dopo `next build` (output: "export"): rende raggiungibili i file di prefetch
 * dei segmenti.
 *
 * IL DIFETTO. Next 16 scrive i payload di prefetch come cartelle annidate
 *   out/settimana/__next.!KHNpdG8p/settimana/__PAGE__.txt
 * ma il router del browser li chiede con i punti al posto delle barre
 *   /settimana/__next.!KHNpdG8p.settimana.__PAGE__.txt
 * Su un host statico (Cloudflare, nginx) quella richiesta finisce in 404: la
 * navigazione funziona lo stesso, perche' il router ripiega sul payload intero,
 * ma ogni link fa un 404 inutile in console e il prefetch va perso.
 *
 * LA CURA. Per ogni file dentro una cartella `__next.*` si scrive una copia
 * accanto alla cartella, col nome piatto che il browser chiede. Gli originali
 * restano dove sono. Parte da solo come "postbuild" di npm.
 */
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("out");
if (!fs.existsSync(OUT)) {
  console.log("appiattisci-prefetch: nessuna cartella out/, niente da fare");
  process.exit(0);
}

let copie = 0;

function file(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? file(p) : [p];
  });
}

function visita(dir) {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const p = path.join(dir, d.name);
    if (d.name.startsWith("__next.")) {
      for (const f of file(p)) {
        const relativo = path.relative(p, f).split(path.sep).join(".");
        const piatto = path.join(dir, `${d.name}.${relativo}`);
        if (!fs.existsSync(piatto)) {
          fs.copyFileSync(f, piatto);
          copie++;
        }
      }
    } else {
      visita(p);
    }
  }
}

visita(OUT);
console.log(`appiattisci-prefetch: ${copie} file di prefetch resi raggiungibili`);
