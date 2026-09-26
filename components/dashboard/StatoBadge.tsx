import { STATI, type StatoRichiesta } from "@/lib/richieste";

/* Il colore dice cosa fare: lime = da fare adesso, nero = in corso, grigio = chiusa. */
const TONO: Record<StatoRichiesta, string> = {
  nuova: "bg-lime text-ink",
  contattata: "bg-ink text-paper",
  chiusa: "bg-paper-2 text-ink",
  persa: "bg-paper-2 text-muted line-through",
};

export default function StatoBadge({ stato }: { stato: StatoRichiesta }) {
  const label = STATI.find((s) => s.id === stato)?.label ?? stato;
  return (
    <span className={`inline-flex h-6 items-center px-2 font-disp text-[11px] font-bold tracking-[.14em] uppercase ${TONO[stato]}`}>
      {label}
    </span>
  );
}
