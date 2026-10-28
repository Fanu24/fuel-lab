import { describe, expect, it } from "vitest";
import { b64urlAByte, b64urlDaBytes, cifraPayload, firmaVapid, richiestaPush, type ChiaviVapid } from "./webpush";

const TESTO = new TextEncoder();
/** exportKey("raw") restituisce un ArrayBuffer: qui accettiamo entrambi. */
const b64url = (bytes: ArrayBuffer | Uint8Array) => b64urlDaBytes(new Uint8Array(bytes));
const atobUrl = (testo: string) => new TextDecoder().decode(b64urlAByte(testo));

function concatena(...parti: Uint8Array<ArrayBuffer>[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(parti.reduce((n, p) => n + p.byteLength, 0));
  let pos = 0;
  for (const parte of parti) {
    out.set(parte, pos);
    pos += parte.byteLength;
  }
  return out;
}

/** Stesso HKDF-SHA256 di webpush.ts, scritto qui apposta: il verso opposto, dal lato del browser. */
async function hkdfPerTest(salt: Uint8Array<ArrayBuffer>, ikm: Uint8Array<ArrayBuffer>, info: Uint8Array<ArrayBuffer>, byte: number) {
  const chiave = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, chiave, byte * 8));
}

/** Decifra un corpo aes128gcm (RFC 8188) con la chiave privata del browser (RFC 8291). */
async function decifraPerTest(corpo: Uint8Array<ArrayBuffer>, uaPrivata: CryptoKey, auth: Uint8Array<ArrayBuffer>, p256dh: string): Promise<string> {
  const salt = corpo.slice(0, 16);
  const idlen = corpo[20];
  const keyid = corpo.slice(21, 21 + idlen); // chiave pubblica effimera del server
  const cifrato = corpo.slice(21 + idlen);
  const uaPubblica = b64urlAByte(p256dh);
  const asPubblica = await crypto.subtle.importKey("raw", keyid, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: asPubblica }, uaPrivata, 256));
  const ikm = await hkdfPerTest(auth, ecdh, concatena(TESTO.encode("WebPush: info\0"), uaPubblica, keyid), 32);
  const cek = await hkdfPerTest(salt, ikm, TESTO.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdfPerTest(salt, ikm, TESTO.encode("Content-Encoding: nonce\0"), 12);
  const chiave = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["decrypt"]);
  const chiaro = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, chiave, cifrato));
  if (chiaro[chiaro.length - 1] !== 2) throw new Error("Delimitatore 0x02 mancante");
  return new TextDecoder().decode(chiaro.slice(0, -1));
}

async function chiaviVapidPerTest(): Promise<ChiaviVapid> {
  const coppia = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const pubblica = new Uint8Array(await crypto.subtle.exportKey("raw", coppia.publicKey));
  const jwk = await crypto.subtle.exportKey("jwk", coppia.privateKey);
  if (!jwk.d) throw new Error("Chiave privata senza d");
  return { publicKey: b64url(pubblica), privateKey: jwk.d, subject: "mailto:info@fuelchef.it" };
}

/**
 * Vettore ufficiale: RFC 8291, appendice A (https://www.rfc-editor.org/rfc/rfc8291.txt). I valori sono copiati dal testo
 * dell'RFC; le andate a capo e gli spazi nelle stringhe lunghe sono stati tolti.
 */
const RFC = {
  testo: "V2hlbiBJIGdyb3cgdXAsIEkgd2FudCB0byBiZSBhIHdhdGVybWVsb24",
  asPublic: "BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8",
  asPrivate: "yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw",
  uaPublic: "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4",
  uaPrivate: "q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94",
  salt: "DGv6ra1nlYgDCS1FRnbzlw",
  authSecret: "BTBZMqHH6r4Tts7J_aSIgg",
  // Corpo completo della sezione 5 (intestazione di 86 byte + testo cifrato di 58 byte, 144 byte in tutto).
  corpo: "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN",
};

/** JWK ECDH P-256 dalla scalare privata `d` e dal punto pubblico non compresso in base64url. */
function jwkEcdh(d: string, pubblica: string): JsonWebKey {
  const punto = b64urlAByte(pubblica);
  return { kty: "EC", crv: "P-256", d, x: b64url(punto.slice(1, 33)), y: b64url(punto.slice(33, 65)), ext: true };
}

/** La coppia ECDH del server dell'appendice, come CryptoKeyPair per cifraPayload (`prova`). */
async function coppiaDaVettore(privata: string, pubblica: string): Promise<CryptoKeyPair> {
  const publicKey = await crypto.subtle.importKey("raw", b64urlAByte(pubblica), { name: "ECDH", namedCurve: "P-256" }, true, []);
  const privateKey = await crypto.subtle.importKey("jwk", jwkEcdh(privata, pubblica), { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  return { publicKey, privateKey };
}

async function verificaEs256(firmato: string, firma: string, publicKey: string): Promise<boolean> {
  const chiave = await crypto.subtle.importKey("raw", b64urlAByte(publicKey), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  return crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, chiave, b64urlAByte(firma), TESTO.encode(firmato));
}

describe("Web Push (RFC 8291 e RFC 8292)", () => {
  it("il payload si decifra con la chiave del browser (RFC 8291)", async () => {
    // il "browser": coppia ECDH P-256 e auth secret di 16 byte
    const browser = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
    const auth = crypto.getRandomValues(new Uint8Array(16));
    const iscrizione = { endpoint: "https://web.push.apple.com/abc", p256dh: b64url(await crypto.subtle.exportKey("raw", browser.publicKey)), auth: b64url(auth) };
    const corpo = await cifraPayload(iscrizione, JSON.stringify({ title: "Nuovo ordine dal sito", body: "Francesca Rossi", url: "/admin?vista=nuovi" }));
    expect(corpo.slice(16, 20)).toEqual(new Uint8Array([0, 0, 16, 0])); // rs = 4096
    expect(corpo[20]).toBe(65); // idlen
    expect(await decifraPerTest(corpo, browser.privateKey, auth, iscrizione.p256dh)).toBe('{"title":"Nuovo ordine dal sito","body":"Francesca Rossi","url":"/admin?vista=nuovi"}');
  });

  it("la firma VAPID è un JWT ES256 verificabile con la chiave pubblica", async () => {
    const chiavi = await chiaviVapidPerTest();
    const header = await firmaVapid("https://fcm.googleapis.com/fcm/send/xyz", chiavi, 1_793_200_000);
    const [, jwt, k] = /^vapid t=([^,]+), k=(.+)$/.exec(header)!;
    expect(k).toBe(chiavi.publicKey);
    const [h, p, s] = jwt.split(".");
    expect(JSON.parse(atobUrl(p))).toEqual({ aud: "https://fcm.googleapis.com", exp: 1_793_200_000 + 43200, sub: "mailto:info@fuelchef.it" });
    expect(await verificaEs256(`${h}.${p}`, s, chiavi.publicKey)).toBe(true);
  });

  it("la richiesta è una POST con gli header di Web Push e il corpo cifrato", async () => {
    const browser = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
    const iscrizione = {
      endpoint: "https://fcm.googleapis.com/fcm/send/xyz",
      p256dh: b64url(await crypto.subtle.exportKey("raw", browser.publicKey)),
      auth: b64url(crypto.getRandomValues(new Uint8Array(16))),
    };
    const richiesta = await richiestaPush(iscrizione, "{}", await chiaviVapidPerTest(), 1_793_200_000);
    expect(richiesta.method).toBe("POST");
    expect(richiesta.url).toBe(iscrizione.endpoint);
    expect(richiesta.headers.get("Content-Encoding")).toBe("aes128gcm");
    expect(richiesta.headers.get("Content-Type")).toBe("application/octet-stream");
    expect(richiesta.headers.get("TTL")).toBe("86400");
    expect(richiesta.headers.get("Urgency")).toBe("high");
    expect(richiesta.headers.get("Authorization")).toMatch(/^vapid t=[^,]+, k=[^,]+$/);
    expect(new Uint8Array(await richiesta.arrayBuffer()).byteLength).toBeGreaterThan(21 + 65);
  });

  it("vettore ufficiale di RFC 8291, appendice A: il corpo è identico byte per byte", async () => {
    const chiaviServer = await coppiaDaVettore(RFC.asPrivate, RFC.asPublic);
    const corpo = await cifraPayload(
      { endpoint: "https://web.push.apple.com/abc", p256dh: RFC.uaPublic, auth: RFC.authSecret },
      atobUrl(RFC.testo),
      { salt: b64urlAByte(RFC.salt), chiaviServer },
    );
    expect(b64url(corpo)).toBe(RFC.corpo);
    // Anche il verso opposto, con la chiave privata del browser dell'appendice, rilegge lo stesso testo.
    const uaPrivata = await crypto.subtle.importKey("jwk", jwkEcdh(RFC.uaPrivate, RFC.uaPublic), { name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
    expect(await decifraPerTest(b64urlAByte(RFC.corpo), uaPrivata, b64urlAByte(RFC.authSecret), RFC.uaPublic)).toBe(atobUrl(RFC.testo));
  });
});
