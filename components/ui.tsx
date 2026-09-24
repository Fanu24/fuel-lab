import type { ReactNode } from "react";

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`eyebrow ${className}`}>
      <b aria-hidden="true" />
      {children}
    </span>
  );
}

export function Chip({
  children,
  accento = false,
  className = "",
}: {
  children: ReactNode;
  accento?: boolean;
  className?: string;
}) {
  return <span className={`chip ${accento ? "chip-k" : ""} ${className}`}>{children}</span>;
}

export function SectionHead({
  occhiello,
  titolo,
  testo,
  azione,
  compatto = false,
}: {
  occhiello: string;
  titolo: ReactNode;
  testo?: ReactNode;
  azione?: ReactNode;
  /** Catalogo telefono: occhiello + conteggio, titolo e lead solo da md. */
  compatto?: boolean;
}) {
  return (
    /* Le tre misure qui sotto sono scese con la scala tipografica: erano
       tarate su un h2 da 72px e attorno a un titolo da 48 diventavano vuoti
       senza motivo. Il rapporto fra occhiello, titolo e lead e' lo stesso.

       E SONO SCESE DI NUOVO SUL TELEFONO, dove il difetto era piu' grosso di
       quanto le misure lascino pensare. Su /menu a 390px l'intestazione
       "LA BASE GLUCIDICA." - occhiello, titolo su due righe, lead su tre,
       conteggio - occupava UNA SCHERMATA INTERA prima che si vedesse un solo
       piatto: chi arriva sul catalogo trova l'introduzione al catalogo. Il
       colpevole non era una misura sola ma la loro somma - 18 sotto
       l'occhiello, 20 sopra il lead, 28 di gap prima del conteggio, 32 sotto
       il blocco - piu' un lead da 17,5px che a quella larghezza va a capo tre
       volte. A 390 diventano 10, 10, 14 e 18; da 768 in su restano quelle di
       prima, perche' li' la testata sta in un quarto di schermo e l'aria e'
       aria, non vuoto.

       `compatto` e' il passo dopo: sul catalogo il titolo editoriale e il
       lead restano da md in su. Sul telefono restano occhiello e conteggio,
       poi le card. */
    <div
      className={`flex flex-wrap items-end justify-between gap-x-7 ${compatto ? "mb-3 gap-y-2 md:mb-8 md:gap-y-7" : "mb-[18px] gap-y-3.5 md:mb-8 md:gap-y-7"}`}
    >
      <div>
        <Eyebrow className={compatto ? "mb-0 md:mb-[18px]" : "mb-2.5 md:mb-[18px]"}>{occhiello}</Eyebrow>
        <h2 className={`h2 ${compatto ? "sr-only md:not-sr-only" : ""}`}>{titolo}</h2>
        {testo ? (
          <p className={`lead mt-2.5 md:mt-5 ${compatto ? "hidden md:block" : ""}`}>{testo}</p>
        ) : null}
      </div>
      {azione}
    </div>
  );
}

/** Riga di testo che sale da dietro una maschera. L'indice sfalsa la cascata. */
export function Rise({ children, i = 0 }: { children: ReactNode; i?: number }) {
  return (
    <span className="ln">
      <i style={{ animation: `fuel-rise .95s var(--e-out) both ${140 + i * 110}ms` }}>{children}</i>
    </span>
  );
}
