import { currentUser, type Context } from "../_lib/auth";
import { json } from "../_lib/http";

export const onRequestGet = async ({ env, request }: Context) => {
  try {
    return json({ user: await currentUser(env, request) });
  } catch (error) {
    console.error("Me error", error);
    return json({ error: "Servizio non disponibile" }, 503);
  }
};
