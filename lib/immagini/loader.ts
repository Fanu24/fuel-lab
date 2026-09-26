"use client";

/**
 * Loader di next/image.
 *
 * Le foto Unsplash le ridimensiona Unsplash stesso: chiedere a Vercel di
 * ottimizzare un'immagine che arriva gia' alla larghezza giusta vorrebbe dire
 * pagare due volte lo stesso lavoro. I percorsi locali (logo, e le foto vere
 * di Matteo quando arriveranno in /public) passano invariati.
 */
export default function loader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.startsWith("photo-")) {
    return `https://images.unsplash.com/${src}?w=${width}&q=${quality ?? 72}&auto=format&fit=crop`;
  }
  return src;
}
