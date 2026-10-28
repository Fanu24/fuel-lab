/**
 * Web Push lato server: payload cifrato come da RFC 8291 (formato aes128gcm di RFC 8188) e richiesta
 * autenticata con VAPID (RFC 8292, JWT ES256). Usa solo WebCrypto, fetch e TextEncoder: gira su
 * Cloudflare Workers e su Node (i test), senza moduli node:* né Buffer.
 */

/** Come lo restituisce `PushSubscription.toJSON()`: chiavi in base64url. */
export type IscrizionePush = { endpoint: string; p256dh: string; auth: string };

/** `publicKey`: base64url dei 65 byte non compressi; `privateKey`: base64url dei 32 byte `d`. */
export type ChiaviVapid = { publicKey: string; privateKey: string; subject: string };

const TESTO = new TextEncoder();
/** Un solo record da 4096 byte: il testo (piu' il delimitatore 0x02 e il tag GCM) ci deve stare. */
const RECORD = 4096;
const LIMITE_TESTO = RECORD - 17;
/** Un messaggio push non vive piu' di 12 ore nella coda del servizio del browser. */
const DURATA_JWT_SEC = 12 * 3600;

export function b64urlDaBytes(bytes: Uint8Array): string {
  let binario = "";
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlAByte(testo: string): Uint8Array<ArrayBuffer> {
  const standard = testo.replace(/-/g, "+").replace(/_/g, "/");
  const binario = atob(standard.padEnd(Math.ceil(standard.length / 4) * 4, "="));
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

function concatena(...parti: Uint8Array<ArrayBuffer>[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(parti.reduce((n, p) => n + p.byteLength, 0));
  let pos = 0;
  for (const parte of parti) {
    out.set(parte, pos);
    pos += parte.byteLength;
  }
  return out;
}

/** Una sola derivazione HKDF-SHA256 (RFC 5869) di `byte` byte. */
async function hkdf(salt: Uint8Array<ArrayBuffer>, ikm: Uint8Array<ArrayBuffer>, info: Uint8Array<ArrayBuffer>, byte: number): Promise<Uint8Array<ArrayBuffer>> {
  const chiave = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, chiave, byte * 8));
}

/**
 * Il corpo `aes128gcm` (RFC 8291 + RFC 8188) per il browser `iscrizione`: salt(16) || rs(4096) || idlen(65) ||
 * chiave pubblica effimera del server (65) || testo cifrato con il delimitatore 0x02. `prova` fissa salt e chiavi del
 * server, solo per i test.
 */
export async function cifraPayload(
  iscrizione: IscrizionePush,
  testo: string,
  prova?: { salt: Uint8Array<ArrayBuffer>; chiaviServer: CryptoKeyPair },
): Promise<Uint8Array<ArrayBuffer>> {
  const chiaro = TESTO.encode(testo);
  if (chiaro.byteLength > LIMITE_TESTO) throw new Error("PAYLOAD_TROPPO_GRANDE");

  const uaPublic = b64urlAByte(iscrizione.p256dh);
  const auth = b64urlAByte(iscrizione.auth);
  const asKeys = prova?.chiaviServer ?? await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", asKeys.publicKey));

  const uaChiave = await crypto.subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaChiave }, asKeys.privateKey, 256));
  const ikm = await hkdf(auth, ecdh, concatena(TESTO.encode("WebPush: info\0"), uaPublic, asPublic), 32);

  const salt = prova?.salt ?? crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, TESTO.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, TESTO.encode("Content-Encoding: nonce\0"), 12);

  const chiaveAes = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const cifrato = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, chiaveAes, concatena(chiaro, new Uint8Array([2]))));

  const intestazione = new Uint8Array(21);
  intestazione.set(salt, 0);
  new DataView(intestazione.buffer).setUint32(16, RECORD);
  intestazione[20] = asPublic.byteLength;
  return concatena(intestazione, asPublic, cifrato);
}

/**
 * Il valore dell'header Authorization: `vapid t=<jwt>, k=<chiave pubblica>`. Il JWT ES256 ha come `aud` l'origine
 * dell'endpoint e scade dopo 12 ore.
 */
export async function firmaVapid(endpoint: string, chiavi: ChiaviVapid, adessoSec: number): Promise<string> {
  const aud = new URL(endpoint).origin;
  const intestazione = b64urlDaBytes(TESTO.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64urlDaBytes(TESTO.encode(JSON.stringify({ aud, exp: adessoSec + DURATA_JWT_SEC, sub: chiavi.subject })));
  const daFirmare = `${intestazione}.${claims}`;

  const pubblica = b64urlAByte(chiavi.publicKey);
  const chiave = await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", d: chiavi.privateKey, x: b64urlDaBytes(pubblica.slice(1, 33)), y: b64urlDaBytes(pubblica.slice(33, 65)), ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  // WebCrypto firma gia' in formato r||s, quello che ES256 vuole.
  const firma = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, chiave, TESTO.encode(daFirmare));
  return `vapid t=${daFirmare}.${b64urlDaBytes(new Uint8Array(firma))}, k=${chiavi.publicKey}`;
}

/** La POST da mandare all'endpoint del browser per un messaggio `testo` (un oggetto JSON, di solito). */
export async function richiestaPush(iscrizione: IscrizionePush, testo: string, chiavi: ChiaviVapid, adessoSec: number): Promise<Request> {
  const corpo = await cifraPayload(iscrizione, testo);
  return new Request(iscrizione.endpoint, {
    method: "POST",
    headers: {
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
      Urgency: "high",
      Authorization: await firmaVapid(iscrizione.endpoint, chiavi, adessoSec),
    },
    body: corpo,
  });
}
