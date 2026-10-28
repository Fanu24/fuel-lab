/** I codici ignorano maiuscole e spazi esterni, ma non cambiano i caratteri interni. */
export function normalizzaCodice(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(code) ? code : null;
}

export const percentualeValida = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 100;

export function totaleScontato(base: number | null, percent: number, roundEuro = false): number | null {
  return base === null ? null : roundEuro ? Math.round(base * (100 - percent) / 10000) * 100 : Math.round(base * (100 - percent) / 100);
}

/** 8 caratteri casuali, generati con il CSPRNG anche nel browser. */
export function generaCodice(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `FUEL-${Array.from(bytes, (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("")}`;
}
