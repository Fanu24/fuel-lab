export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  return !!origin && origin === new URL(request.url).origin;
}

/**
 * Il corpo JSON della richiesta, se e' un oggetto e non supera `max` byte.
 * Il tetto vale anche durante la lettura: un corpo enorme (magari senza
 * Content-Length) non viene mai caricato tutto in memoria.
 */
export async function bodyJson(request: Request, max = 30000): Promise<Record<string, unknown> | null> {
  const dichiarata = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(dichiarata) && dichiarata > max) return null;
  if (!request.body) return null;
  const lettore = request.body.getReader();
  const pezzi: Uint8Array[] = [];
  let letti = 0;
  for (;;) {
    const { done, value } = await lettore.read();
    if (done) break;
    letti += value.byteLength;
    if (letti > max) {
      await lettore.cancel().catch(() => {});
      return null;
    }
    pezzi.push(value);
  }
  const tutto = new Uint8Array(letti);
  let posizione = 0;
  for (const pezzo of pezzi) {
    tutto.set(pezzo, posizione);
    posizione += pezzo.byteLength;
  }
  const raw = new TextDecoder().decode(tutto);
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export function str(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
