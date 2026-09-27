import type { Context } from "../_lib/auth";
import { json } from "../_lib/http";

export const onRequestGet = async ({ env }: Context) => json({
  email: !!(env.DB && env.BETTER_AUTH_SECRET),
  emailVerification: !!env.RESEND_API_KEY,
  google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  apple: !!(env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY),
});
