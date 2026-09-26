import type { Metadata } from "next";
import { Suspense } from "react";
import { PIATTI } from "@/lib/catalogo";
import MenuClient from "./MenuClient";
import PerLaTuaBox from "@/components/menu/PerLaTuaBox";
import ChiusuraCta from "@/components/home/ChiusuraCta";

export const metadata: Metadata = {
  title: "Il menu",
  description: `${PIATTI.length} piatti già composti, con ingredienti, macro e il motivo dell'abbinamento. Scegli per allenamento: cardio o pesi.`,
};

export default function PaginaMenu() {
  return (
    <>
      <section className="testata">
        <div className="wrap">
          <p className="occhiello">Menu · questa settimana</p>
          <h1 className="titolo-xl mt-6 max-w-[10ch]">Il menu.</h1>
          <p className="lead mt-6">
            Sei piatti già composti. Ognuno ha i suoi grammi, i suoi macro e un motivo per stare nel piatto con gli
            altri ingredienti.
          </p>
        </div>
      </section>
      {/* useSearchParams vuole un confine di Suspense: senza, la pagina smette di
          essere statica e diventa dinamica per intero. */}
      <Suspense fallback={<div className="wrap min-h-[60vh]" />}>
        <MenuClient />
      </Suspense>
      <PerLaTuaBox />
      <ChiusuraCta
        titolo="Sai già cosa ti piace?"
        testo="Nel compositore scegli come ti alleni ogni giorno e i piatti si mettono da soli. Poi li sposti come vuoi."
      />
    </>
  );
}
