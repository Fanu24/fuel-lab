import type { Metadata, Viewport } from "next";
import AdminAccess from "@/components/admin/AdminAccess";
import PannelloMatteo from "@/components/pannello/PannelloMatteo";
import "../styles/admin.css";

export const metadata: Metadata = {
  title: { absolute: "Matteo · FUEL LAB" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  manifest: "/pannello.webmanifest",
  appleWebApp: { capable: true, title: "Matteo", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  interactiveWidget: "resizes-content", themeColor: "#f3efe6",
};

export default function AdminPage() {
  return <AdminAccess><PannelloMatteo /></AdminAccess>;
}
