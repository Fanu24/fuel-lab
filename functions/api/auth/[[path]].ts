import { createAuth, type Context } from "../../_lib/auth";
import { conCorpoLimitato, json, MAX_CORPO_AUTH } from "../../_lib/http";

export const onRequest = async ({ request, env, waitUntil }: Context) => {
  try {
    // Un accesso o un aggiornamento del profilo sono poche righe: un corpo enorme non arriva a better-auth.
    const limitata = await conCorpoLimitato(request, MAX_CORPO_AUTH);
    if (!limitata) return json({ error: "La richiesta è troppo grande." }, 413);
    return await createAuth(env, limitata, waitUntil).handler(limitata);
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_NOT_CONFIGURED") {
      return Response.json({ error: "Accesso in configurazione" }, { status: 503 });
    }
    console.error("Auth error", error);
    return Response.json({ error: "Accesso temporaneamente non disponibile" }, { status: 500 });
  }
};
