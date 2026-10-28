/**
 * Genera le chiavi VAPID per le notifiche push a Matteo (una coppia ECDSA P-256).
 *
 * Uso:
 *   node scripts/genera-vapid.mjs
 *
 * Stampa tre righe da copiare nelle variabili: VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY vanno
 * impostate come segreti Cloudflare (`wrangler pages secret put <nome>`), non committate.
 * Generare una coppia nuova cambia la chiave pubblica: chi era iscritto deve riattivare le notifiche.
 */

const { subtle } = globalThis.crypto;

const coppia = await subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
const pubblica = new Uint8Array(await subtle.exportKey("raw", coppia.publicKey));
const { d } = await subtle.exportKey("jwk", coppia.privateKey);

console.log(`VAPID_PUBLIC_KEY=${Buffer.from(pubblica).toString("base64url")}`);
console.log(`VAPID_PRIVATE_KEY=${d}`);
console.log("VAPID_SUBJECT=mailto:info@fuelchef.it");
