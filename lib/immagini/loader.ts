"use client";

/**
 * Loader di next/image.
 *
 * Le immagini sono ospitate sullo stesso dominio. Il loader conserva i
 * percorsi locali anche nell'export statico per Cloudflare Pages.
 */
export default function loader({ src }: { src: string; width: number; quality?: number }) {
  return src;
}
