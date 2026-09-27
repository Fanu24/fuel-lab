import type { Metadata } from "next";
import AdminGate from "@/components/dashboard/AdminGate";
import Testata from "@/components/dashboard/Testata";

export const metadata: Metadata = {
  title: { default: "Pannello", template: "%s · Pannello FUEL LAB" },
  robots: { index: false, follow: false },
};

export default function LayoutDashboard({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <div className="min-h-svh bg-paper">
        <Testata />
        <main className="wrap py-8 md:py-12">{children}</main>
      </div>
    </AdminGate>
  );
}
