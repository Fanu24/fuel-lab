import type { Context } from "../../_lib/auth";
import { bodyJson, json, sameOrigin, str } from "../../_lib/http";

export const onRequestPost = async ({ env, request }: Context) => {
  if (!sameOrigin(request)) return json({ ok: false }, 403);
  const body = await bodyJson(request, 500);
  const path = str(body?.path, 180);
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("?")) return json({ ok: false }, 400);
  const day = new Date().toISOString().slice(0, 10);
  await env.DB.prepare("INSERT INTO traffic_daily(day,path,views) VALUES(?,?,1) ON CONFLICT(day,path) DO UPDATE SET views=views+1")
    .bind(day, path).run();
  return json({ ok: true });
};
