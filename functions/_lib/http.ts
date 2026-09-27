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

export async function bodyJson(request: Request, max = 30000): Promise<Record<string, unknown> | null> {
  const raw = await request.text();
  if (raw.length > max) return null;
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
