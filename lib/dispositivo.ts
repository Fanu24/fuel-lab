/**
 * Che telefono o computer usa Matteo, e se il pannello è installato come app.
 * Funzioni pure, senza DOM: le usa lib/push-client.ts e la guida all'installazione.
 */

export type TipoDispositivo = "iphone" | "android" | "computer";

/**
 * iPhone e iPad danno "iphone". iPadOS dice di essere "Macintosh": lo si riconosce dal
 * touch (maxTouchPoints > 1), perché un Mac vero non ne ha.
 */
export function tipoDispositivo(userAgent: string, maxTouchPoints: number): TipoDispositivo {
  if (/iPhone|iPad|iPod/.test(userAgent)) return "iphone";
  if (/Macintosh/.test(userAgent) && maxTouchPoints > 1) return "iphone";
  if (/Android/.test(userAgent)) return "android";
  return "computer";
}

/**
 * Il pannello è installato se è aperto come app: `display-mode: standalone` sugli altri
 * browser, `navigator.standalone` su iOS (che non lo implementa nella media query).
 */
export function eInstallata(standalone: boolean, navigatorStandalone: boolean | undefined): boolean {
  return standalone || navigatorStandalone === true;
}
