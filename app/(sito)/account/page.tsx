import type { Metadata } from "next";
import CustomerDashboard from "@/components/account/CustomerDashboard";

export const metadata: Metadata = { title: "Il mio account", robots: { index: false, follow: false } };

export default function AccountPage() { return <CustomerDashboard />; }
