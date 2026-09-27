/* =========================================================================
   Tutte le foto del sito, in un posto solo.

   Sono foto di repertorio da Unsplash, ora ospitate localmente, in attesa degli scatti veri di Matteo:
   quando arrivano, si cambia QUESTO file (un percorso in /public al posto
   dell'id) e nessuna pagina va toccata. Il loader in ./loader.ts riconosce
   i due casi da solo.

   L'alt descrive il contenuto visibile nella foto.
   ========================================================================= */

export interface Foto {
  /** Percorso locale ("/foto/matteo.jpg") */
  src: string;
  alt: string;
  /** punto focale per object-position quando la foto viene ritagliata */
  fuoco?: string;
}

export const FOTO = {
  heroAtleta: {
    src: "/foto/photo-1605296867304-46d5465a13f1.webp",
    alt: "Atleta chinato sul bilanciere prima di uno stacco, in una palestra al buio",
    fuoco: "50% 60%",
  },
  corsa: {
    src: "/foto/photo-1552674605-db6ffd4facb5.webp",
    alt: "Tre persone che corrono in controluce all'alba",
    fuoco: "50% 50%",
  },
  scatto: {
    src: "/foto/photo-1461897104016-0b3b00cc81ee.webp",
    alt: "Velocisti che esplodono dai blocchi su una pista di atletica",
  },
  pesi: {
    src: "/foto/photo-1574680096145-d05b474e2155.webp",
    alt: "Atleta di spalle con il bilanciere appoggiato sulle spalle",
    fuoco: "50% 30%",
  },
  presa: {
    src: "/foto/photo-1549060279-7e168fcee0c2.webp",
    alt: "Mano che stringe il bilanciere carico, in primo piano",
  },
  distensione: {
    src: "/foto/photo-1541534741688-6078c6bfb5c5.webp",
    alt: "Atleta in spinta sopra la testa con il bilanciere",
  },
  cuoco: {
    src: "/foto/photo-1577219491135-ce391730fb2c.webp",
    alt: "Un cuoco impiatta con la pinza sotto le lampade della cucina",
    fuoco: "50% 35%",
  },
  schiscette: {
    src: "/foto/photo-1498837167922-ddd27525d352.webp",
    alt: "Vaschette di verdure, legumi e cereali freschi divise per ingrediente",
  },
  verdure: {
    src: "/foto/photo-1518843875459-f738682238a6.webp",
    alt: "Verdure crude appoggiate su un fondo nero, prima della cottura",
  },
  cucina: {
    src: "/foto/photo-1556910103-1c02745aae4d.webp",
    alt: "Persone che cucinano insieme nella cucina di casa",
  },
  tagliere: {
    src: "/foto/photo-1466637574441-749b8f19452f.webp",
    alt: "Tagliere con avocado, uova, pomodorini, funghi e cipollotti, prima della preparazione",
  },
  ciotola: {
    src: "/foto/photo-1547496502-affa22d38842.webp",
    alt: "Ciotola di verdure, avocado e semi su fondo scuro",
  },
  bowl: {
    src: "/foto/photo-1512621776951-a57141f2eefd.webp",
    alt: "Piatto di verdure fresche, ceci, avocado e patata dolce",
  },
} satisfies Record<string, Foto>;

export type ChiaveFoto = keyof typeof FOTO;

/**
 * Un video in loop per l'hero, quando Matteo ne avra' uno (allenamento o
 * cucina). Finche' e' null l'hero usa la foto: nessun layout dipende da questo.
 */
export const VIDEO_HERO: { src: string; poster: ChiaveFoto } | null = null;

/** Il segnaposto della foto di Matteo: il volto vero va messo qui. */
export const RITRATTO_MATTEO: Foto | null = null;
