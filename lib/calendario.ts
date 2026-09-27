/**
 * Un evento da aggiungere al calendario del telefono (.ics, RFC 5545): il
 * giorno di ritiro o di consegna di una richiesta confermata. Evento di un
 * giorno intero, perche' l'orario lo concorda Matteo a voce.
 */

export type EventoCalendario = {
  uid: string;
  /** "YYYY-MM-DD" */
  giorno: string;
  titolo: string;
  descrizione?: string;
  luogo?: string;
  /** Istante di creazione, per DTSTAMP; di default adesso. */
  adesso?: Date;
};

/** Escape dei testi secondo RFC 5545: backslash, punto e virgola, virgola e a capo. */
function testo(v: string) {
  return v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Le righe oltre 75 ottetti vanno spezzate, continuando con uno spazio. */
function piega(riga: string) {
  const pezzi: string[] = [];
  let resto = riga;
  while (new TextEncoder().encode(resto).length > 75) {
    let n = 75;
    while (new TextEncoder().encode(resto.slice(0, n)).length > 75) n--;
    pezzi.push(resto.slice(0, n));
    resto = " " + resto.slice(n);
  }
  pezzi.push(resto);
  return pezzi.join("\r\n");
}

const compatta = (giorno: string) => giorno.replace(/-/g, "");

function giornoDopo(giorno: string) {
  const d = new Date(`${giorno}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function fileIcs(e: EventoCalendario): string {
  const stamp = (e.adesso ?? new Date()).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const righe = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FUEL LAB//Richieste//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}@fuelchef.it`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compatta(e.giorno)}`,
    `DTEND;VALUE=DATE:${compatta(giornoDopo(e.giorno))}`,
    `SUMMARY:${testo(e.titolo)}`,
    ...(e.descrizione ? [`DESCRIPTION:${testo(e.descrizione)}`] : []),
    ...(e.luogo ? [`LOCATION:${testo(e.luogo)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return righe.map(piega).join("\r\n") + "\r\n";
}
