"use client";

import Link from "next/link";
import { euro } from "@/lib/pricing";
import type { RiepilogoSettimana } from "@/lib/riepilogo";

export type Annullabile = {
  testo: string;
  annulla?: () => void;
  chiudi: () => void;
};

export default function BarraSettimana({ r, pronto, bloccata = false, annulla }: {
  r: RiepilogoSettimana;
  pronto: boolean;
  bloccata?: boolean;
  annulla?: Annullabile | null;
}) {
  const disabilitata = !pronto || r.pasti === 0 || bloccata;
  return <div className="barra notte">
    <div role="status">
      {annulla ? <div className="barra-annulla"><div className="wrap flex items-center gap-3 py-1">
        <p className="min-w-0 flex-1 text-xs font-semibold">{annulla.testo}</p>
        {annulla.annulla ? <button type="button" id="annulla-azione" className="barra-annulla-bottone" onClick={annulla.annulla}>Annulla</button> : null}
        <button type="button" className="barra-annulla-bottone !px-1" onClick={annulla.chiudi} aria-label="Chiudi avviso">×</button>
      </div></div> : null}
    </div>
    <div className="wrap py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0"><p className="font-semibold">{pronto ? r.pasti : 0} {r.pasti === 1 ? "pasto scelto" : "pasti scelti"}</p><p className="mt-1 text-xs text-steel">Da {euro(r.prezzoMinimo)} a pasto</p></div>
        {disabilitata ? <button type="button" disabled className="btn btn-lime !min-h-12 !px-5">Continua →</button> : <Link href="/account?sezione=richiesta&servizio=menu-settimana" className="btn btn-lime !min-h-12 !px-5">Continua <span aria-hidden="true">→</span></Link>}
      </div>
      <p className="mt-2 text-xs text-steel">{bloccata ? "Sostituisci i piatti non disponibili per continuare." : !r.pasti ? "Scegli almeno un piatto per continuare." : "Poi scegli ritiro o consegna e invii la richiesta. Nessun pagamento online."}</p>
    </div>
  </div>;
}
