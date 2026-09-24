import type { Metadata } from "next";
import { Suspense } from "react";
import { EXTRA, PIATTI } from "@/lib/catalogo";
import MenuClient from "./MenuClient";

export const metadata: Metadata = {
  title: "Menu della settimana",
  description: `${PIATTI.length} piatti già composti con scheda nutrizionale e motivo dell'abbinamento, più ${EXTRA.length} alimenti per la tua box. Filtra per allenamento, tag e giorno di cottura.`,
};

function Attesa() {
  return (
    <section className="fascia fascia-t fascia-carta">
      <div className="wrap">
        <div className="shell">
          <div className="core grid min-h-[280px] place-items-center p-10">
            <p className="note">Apro il menu...</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PaginaMenu() {
  return (
    <Suspense fallback={<Attesa />}>
      <MenuClient />
    </Suspense>
  );
}
