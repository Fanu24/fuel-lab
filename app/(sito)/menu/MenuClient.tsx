import CartaPiatto from "@/components/menu/CartaPiatto";
import AggiungiAllaSettimana from "@/components/menu/AggiungiAllaSettimana";
import { PIATTI_MENU } from "@/lib/catalogo";
import SnackMenu from "@/components/menu/SnackMenu";

export default function MenuClient() {
  return (
    <section className="pb-[var(--sezione)]" aria-label="Scegli i piatti">
      <div className="wrap">
        <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {PIATTI_MENU.map((p, i) => (
            <li key={p.id} className="flex flex-col">
              <CartaPiatto piatto={p} grande priorita={i === 0} />
              <div className="mt-auto pt-5"><AggiungiAllaSettimana piattoId={p.id} /></div>
            </li>
          ))}
        </ul>
        <SnackMenu />
      </div>
    </section>
  );
}
