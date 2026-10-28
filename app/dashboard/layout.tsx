import type { Metadata, Viewport } from "next";
import LegacyAdminRedirect from "@/components/admin/LegacyAdminRedirect";

export const metadata: Metadata = {
  title: { default: "Pannello", template: "%s · Pannello FUEL LAB" },
  robots: { index: false, follow: false },
  /* Un manifest tutto suo: "Aggiungi alla schermata Home" dal pannello crea
     l'app "Pannello", che si apre direttamente su /dashboard. */
  manifest: "/pannello.webmanifest",
  appleWebApp: { capable: true, title: "Pannello", statusBarStyle: "black" },
};

/* viewport-fit=cover: sul telefono la barra in basso scende fino al bordo e
   si tiene sopra la barra di sistema con env(safe-area-inset-bottom).
   resizes-content: con la tastiera aperta (messaggio al cliente, prezzo) la scheda si
   restringe invece di finirci sotto, e il bottone di salvataggio resta raggiungibile. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#0e100f",
};

export default function LayoutDashboard() {
  return <LegacyAdminRedirect />;
}
