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
}: {
  occhiello: string;
  titolo: ReactNode;
  testo?: ReactNode;
  azione?: ReactNode;
}) {
  return (
    <div className="mb-11 flex flex-wrap items-end justify-between gap-8">
      <div>
        <Eyebrow className="mb-[26px]">{occhiello}</Eyebrow>
        <h2 className="h2">{titolo}</h2>
        {testo ? <p className="lead mt-6">{testo}</p> : null}
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
