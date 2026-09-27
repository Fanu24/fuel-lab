import { createAuth, type Context } from "../../_lib/auth";

export const onRequest = async ({ request, env, waitUntil }: Context) => {
  try {
    return await createAuth(env, request, waitUntil).handler(request);
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_NOT_CONFIGURED") {
      return Response.json({ error: "Accesso in configurazione" }, { status: 503 });
    }
    console.error("Auth error", error);
    return Response.json({ error: "Accesso temporaneamente non disponibile" }, { status: 500 });
  }
};
