import type { Metadata, Viewport } from "next";
import AdminGate from "@/components/dashboard/AdminGate";
import PannelloDati from "@/components/dashboard/PannelloDati";
import Testata from "@/components/dashboard/Testata";
import TitoloAvvisi from "@/components/dashboard/TitoloAvvisi";

export const metadata: Metadata = {
  title: { default: "Pannello", template: "%s · Pannello FUEL LAB" },
  robots: { index: false, follow: false },
  /* Un manifest tutto suo: "Aggiungi alla schermata Home" dal pannello crea
     l'app "Pannello", che si apre direttamente su /dashboard. */
  manifest: "/pannello.webmanifest",
  appleWebApp: { capable: true, title: "Pannello", statusBarStyle: "black" },
};

/* viewport-fit=cover: sul telefono la barra in basso scende fino al bordo e
   si tiene sopra la barra di sistema con env(safe-area-inset-bottom). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0e100f",
};

export default function LayoutDashboard({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <PannelloDati>
        <TitoloAvvisi />
        <div className="min-h-svh bg-paper">
          <Testata />
          <main id="contenuto" tabIndex={-1} className="wrap pn-contenuto outline-none">
            {children}
          </main>
        </div>
      </PannelloDati>
    </AdminGate>
  );
}
