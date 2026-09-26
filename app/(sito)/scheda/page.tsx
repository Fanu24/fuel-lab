import type { Metadata } from "next";
import SchedaClient from "./SchedaClient";

export const metadata: Metadata = {
  title: "Dai tuoi macro",
  description:
    "Hai una scheda del nutrizionista? Scrivi calorie, proteine, carboidrati e grassi: la settimana si compone sui tuoi numeri con i piatti di FUEL LAB.",
};

export default function SchedaPage() {
  return (
    <>
      <section className="testata">
        <div className="wrap">
          <p className="occhiello">Dai tuoi macro</p>
          <h1 className="titolo-xl mt-6 max-w-[12ch]">Hai già una scheda?</h1>
          <p className="lead mt-6">
            Scrivi i quattro numeri del tuo nutrizionista. La settimana si compone da sola con i piatti più vicini ai
            tuoi macro, e poi la ritocchi come vuoi.
          </p>
        </div>
      </section>
      <SchedaClient />
    </>
  );
}
