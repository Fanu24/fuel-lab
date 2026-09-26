/* =========================================================================
   Tutte le foto del sito, in un posto solo.

   Sono foto Unsplash scelte a mano in attesa degli scatti veri di Matteo:
   quando arrivano, si cambia QUESTO file (un percorso in /public al posto
   dell'id) e nessuna pagina va toccata. Il loader in ./loader.ts riconosce
   i due casi da solo.

   Ogni id e' stato verificato (risposta 200 da images.unsplash.com) e
   guardato: l'alt descrive quello che c'e' davvero nella foto.
   ========================================================================= */

export interface Foto {
  /** id Unsplash ("photo-...") oppure percorso locale ("/foto/matteo.jpg") */
  src: string;
  alt: string;
  /** punto focale per object-position quando la foto viene ritagliata */
  fuoco?: string;
}

export const FOTO = {
  heroAtleta: {
    src: "photo-1605296867304-46d5465a13f1",
    alt: "Atleta chinato sul bilanciere prima di uno stacco, in una palestra al buio",
    fuoco: "50% 60%",
  },
  corsa: {
    src: "photo-1552674605-db6ffd4facb5",
    alt: "Tre persone che corrono in controluce all'alba",
    fuoco: "50% 50%",
  },
  scatto: {
    src: "photo-1461897104016-0b3b00cc81ee",
    alt: "Velocisti che esplodono dai blocchi su una pista di atletica",
  },
  pesi: {
    src: "photo-1574680096145-d05b474e2155",
    alt: "Atleta di spalle con il bilanciere appoggiato sulle spalle",
    fuoco: "50% 30%",
  },
  presa: {
    src: "photo-1549060279-7e168fcee0c2",
    alt: "Mano che stringe il bilanciere carico, in primo piano",
  },
  distensione: {
    src: "photo-1541534741688-6078c6bfb5c5",
    alt: "Atleta in spinta sopra la testa con il bilanciere",
  },
  cuoco: {
    src: "photo-1577219491135-ce391730fb2c",
    alt: "Un cuoco impiatta con la pinza sotto le lampade della cucina",
    fuoco: "50% 35%",
  },
  schiscette: {
    src: "photo-1498837167922-ddd27525d352",
    alt: "Contenitori di meal prep con le porzioni pesate e divise una per una",
  },
  verdure: {
    src: "photo-1518843875459-f738682238a6",
    alt: "Verdure crude appoggiate su un fondo nero, prima della cottura",
  },
  cucina: {
    src: "photo-1556910103-1c02745aae4d",
    alt: "Piano di lavoro di una cucina durante la preparazione dei pasti",
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
