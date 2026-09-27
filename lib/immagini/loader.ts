"use client";

/**
 * Loader di next/image.
 *
 * Le immagini sono ospitate sullo stesso dominio e l'export statico non ha un
 * ottimizzatore: le foto di /foto hanno pero' due varianti piu' leggere,
 * generate da scripts/varianti-foto.mjs (480 e 828 px). Per ogni voce dello
 * srcset si sceglie la variante piu' piccola che basta; sopra gli 828 px, o
 * per i file che non sono foto (logo, icone), si usa l'originale.
 */
const VARIANTI = [480, 828];

export default function loader({ src, width }: { src: string; width: number; quality?: number }) {
  if (!src.startsWith("/foto/") || !src.endsWith(".webp") || src.slice(6).includes("/")) return src;
  const variante = VARIANTI.find((v) => width <= v);
  return variante ? `/foto/${variante}/${src.slice(6)}` : src;
}
