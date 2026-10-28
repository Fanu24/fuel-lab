/**
 * Le notifiche push del pannello di Matteo, dal browser: lo stato di chi le riceve e l'iscrizione.
 * Le notifiche arrivano solo a un pannello installato (su iPhone: iOS 16.4 o più recente, dalla
 * schermata Home). Il service worker è public/admin-sw.js, con scope /admin.
 */

import { pannelloApi } from "./api";
import { eInstallata, tipoDispositivo, type TipoDispositivo } from "./dispositivo";

export type StatoNotifiche = "non-supportate" | "da-installare" | "da-attivare" | "negate" | "attive";

export type AmbienteDispositivo = { tipo: TipoDispositivo; installata: boolean };

let ambiente: AmbienteDispositivo | null = null;

/** Il telefono o computer e se il pannello è installato. Si legge una volta: non cambia durante la visita. */
export function ambienteDispositivo(): AmbienteDispositivo {
  if (ambiente === null) {
    const nav = navigator as Navigator & { standalone?: boolean };
    ambiente = {
      tipo: tipoDispositivo(nav.userAgent, nav.maxTouchPoints),
      installata: eInstallata(window.matchMedia("(display-mode: standalone)").matches, nav.standalone),
    };
  }
  return ambiente;
}

function notifichePossibili(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** Lo stato delle notifiche su questo dispositivo: cosa manca per riceverle. */
export async function statoNotifiche(): Promise<StatoNotifiche> {
  const { tipo, installata } = ambienteDispositivo();
  if (tipo === "iphone" && !installata) return "da-installare";
  if (!notifichePossibili()) return "non-supportate";
  if (Notification.permission === "denied") return "negate";
  const registrazione = await navigator.serviceWorker.getRegistration("/admin");
  const iscrizione = await registrazione?.pushManager.getSubscription();
  if (Notification.permission === "granted" && iscrizione) return "attive";
  return "da-attivare";
}

/** La chiave pubblica VAPID (base64url) come byte, per `pushManager.subscribe`. */
function chiaveBytes(base64url: string): Uint8Array<ArrayBuffer> {
  let testo = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const resto = testo.length % 4;
  if (resto) testo += "=".repeat(4 - resto);
  const binario = atob(testo);
  const bytes = new Uint8Array(new ArrayBuffer(binario.length));
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

/**
 * Attiva le notifiche: registra il service worker, chiede il permesso, si iscrive e manda l'iscrizione al
 * server. Va chiamata da un tocco di Matteo. Risponde con lo stato che ne risulta; lancia un errore se
 * il server o il browser non riescono.
 */
export async function attivaNotifiche(): Promise<StatoNotifiche> {
  // Il permesso si chiede per primo, prima di qualsiasi `await`: su iPhone il tocco vale solo subito.
  const permesso = await Notification.requestPermission();
  if (permesso !== "granted") return statoNotifiche();
  const registrazione = await navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" });
  const { publicKey } = await pannelloApi.chiavePush();
  if (!publicKey) throw new Error("Le notifiche non sono ancora pronte sul sito. Riprova più tardi.");
  const iscrizione = await registrazione.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chiaveBytes(publicKey) });
  await pannelloApi.iscriviPush(iscrizione.toJSON());
  return statoNotifiche();
}
