/** `cache`: "no-store" per tutto cio' che dipende dall'utente; solo i dati pubblici possono restare nel browser. */
export function json(data: unknown, status = 200, cache = "no-store") {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": cache, "X-Content-Type-Options": "nosniff" },
  });
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  return !!origin && origin === new URL(request.url).origin;
}

/** Il tetto di ogni corpo di richiesta delle API: sopra questo il middleware risponde 413 senza leggerlo. */
export const MAX_CORPO_API = 64_000;
/** Accesso, registrazione e profilo di better-auth: corpi di poche righe. */
export const MAX_CORPO_AUTH = 16_000;

/**
 * I byte del corpo, se non superano `max`; altrimenti null. Il tetto vale anche
 * durante la lettura: un corpo enorme (magari senza Content-Length) non viene
 * mai caricato tutto in memoria.
 */
export async function leggiCorpo(request: Request, max: number): Promise<Uint8Array<ArrayBuffer> | null> {
  const dichiarata = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(dichiarata) && dichiarata > max) return null;
  if (!request.body) return new Uint8Array(0);
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
  return tutto;
}

/** Il corpo JSON della richiesta, se e' un oggetto e non supera `max` byte. */
export async function bodyJson(request: Request, max = 30000): Promise<Record<string, unknown> | null> {
  if (!request.body) return null;
  const byte = await leggiCorpo(request, max);
  if (!byte) return null;
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(byte));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

/**
 * La stessa richiesta con il corpo gia' letto (e limitato a `max` byte), per
 * passarla a codice che il corpo se lo legge da solo, come better-auth. null se
 * il corpo e' piu' grande.
 */
export async function conCorpoLimitato(request: Request, max: number): Promise<Request | null> {
  if (request.method === "GET" || request.method === "HEAD" || !request.body) return request;
  const byte = await leggiCorpo(request, max);
  if (!byte) return null;
  const headers = new Headers(request.headers);
  headers.delete("Content-Length");
  headers.delete("Transfer-Encoding");
  return new Request(request.url, { method: request.method, headers, body: byte });
}
