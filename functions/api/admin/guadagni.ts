import { guadagniDelMese } from "../../../lib/server/pannello";
import { mesePrima } from "../../../lib/pannello";
import { currentUser, soloAdmin, type Context } from "../../_lib/auth";
import { json } from "../../_lib/http";

const MESE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** GET /api/admin/guadagni?mese=YYYY-MM — i guadagni del mese e del mese prima (400 se il mese non è valido). */
export const onRequestGet = async ({ env, request }: Context) => {
  const vietato = soloAdmin(await currentUser(env, request));
  if (vietato) return vietato;
  const mese = new URL(request.url).searchParams.get("mese") ?? "";
  if (!MESE.test(mese)) return json({ error: "Scegli un mese nel formato AAAA-MM." }, 400);
  return json({ mese: await guadagniDelMese(env.DB, mese), precedente: await guadagniDelMese(env.DB, mesePrima(mese)) });
};
