import type { Metadata } from "next";
import Cancello from "@/components/dashboard/Cancello";
import Testata from "@/components/dashboard/Testata";

export const metadata: Metadata = {
  title: { default: "Pannello", template: "%s · Pannello FUEL LAB" },
  robots: { index: false, follow: false },
};

/* Il pannello di Matteo: fuori dal gruppo (sito), quindi senza nav, footer e
   piano del cliente. Tutto passa dal cancello demo. */
export default function LayoutDashboard({ children }: { children: React.ReactNode }) {
  return (
    <Cancello>
      <div className="min-h-svh bg-paper">
        <Testata />
        <main className="wrap py-8 md:py-12">{children}</main>
      </div>
    </Cancello>
  );
}
