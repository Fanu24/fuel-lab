import type { Context } from "../../_lib/auth";
import { bodyJson, json, sameOrigin, str } from "../../_lib/http";
import { oggiRoma } from "../../../lib/server/date";

export const onRequestPost = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ ok: false }, 403);
  const body = await bodyJson(request, 500);
  const path = str(body?.path, 180);
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("?")) return json({ ok: false }, 400);
  // Giorno di Pescara, come le altre serie del pannello.
  const day = oggiRoma();
  await env.DB.prepare("INSERT INTO traffic_daily(day,path,views) VALUES(?,?,1) ON CONFLICT(day,path) DO UPDATE SET views=views+1")
    .bind(day, path).run();
  return json({ ok: true });
};
