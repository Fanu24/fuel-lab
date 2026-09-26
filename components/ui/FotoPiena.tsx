import Image from "next/image";
import { FOTO, type ChiaveFoto } from "@/lib/immagini";

/**
 * Una foto del registro stesa sotto il suo contenitore (che deve essere
 * `relative`), con il velo scuro che tiene leggibile il testo sopra.
 */
export default function FotoPiena({
  foto,
  velo = true,
  prima = false,
  sizes = "100vw",
}: {
  foto: ChiaveFoto;
  velo?: boolean;
  /** la foto dell'hero: si scarica subito invece che in pigrizia */
  prima?: boolean;
  sizes?: string;
}) {
  const f = FOTO[foto];
  return (
    <>
      <Image
        src={f.src}
        alt={f.alt}
        fill
        sizes={sizes}
        loading={prima ? "eager" : "lazy"}
        fetchPriority={prima ? "high" : undefined}
        className="object-cover"
        style={{ objectPosition: "fuoco" in f ? f.fuoco : undefined }}
      />
      {velo ? <div className="velo absolute inset-0" aria-hidden="true" /> : null}
    </>
  );
}
