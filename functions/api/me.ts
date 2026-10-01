import { currentUser, type Context } from "../_lib/auth";
import { json } from "../_lib/http";

export const onRequestGet = async ({ env, request }: Context) => {
  try {
    const user = await currentUser(env, request);
    // Solo i campi di `Utente` (lib/api.ts): emailVerified sempre booleano.
    return json({ user: user ? {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
      image: user.image ?? null,
      role: user.role,
      ...(user.adminInAttesa ? { adminInAttesa: true } : {}),
    } : null });
  } catch (error) {
    console.error("Me error", error);
    return json({ error: "Servizio non disponibile. Riprova tra poco." }, 503);
  }
};
