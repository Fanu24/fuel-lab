/* I tre bottoni per raggiungere un cliente: Chiama, WhatsApp, Email.
   Li usano la scheda cliente, gli ordini della cucina e la posta. In stampa
   spariscono: sulla carta restano numero ed email scritti in chiaro. */

import { linkWhatsAppCliente } from "./ui";

/** "+39 333 123 4567" -> "tel:+393331234567". */
export function linkTelefono(telefono: string) {
  return `tel:${telefono.replace(/[^\d+]/g, "")}`;
}

export function haTelefono(telefono: string | null | undefined): telefono is string {
  return !!telefono && telefono.replace(/\D/g, "").length >= 6;
}

export function BottoniContatto({
  nome,
  telefono,
  email,
  testoWhatsApp = "",
  mailto,
  etichettaEmail = "Email",
  primaEmail = false,
}: {
  nome: string;
  telefono?: string | null;
  email?: string | null;
  testoWhatsApp?: string;
  /** Link mailto completo (oggetto e testo); altrimenti un mailto semplice. */
  mailto?: string;
  etichettaEmail?: string;
  /** Nella posta la risposta via email e' l'azione principale: bottone pieno e per primo. */
  primaEmail?: boolean;
}) {
  const chi = nome || "il cliente";
  const bottoneEmail = email ? (
    <a
      key="email"
      className={`btn btn-sm ${primaEmail ? "btn-ink" : "btn-linea"}`}
      href={mailto ?? `mailto:${email}`}
      aria-label={`${etichettaEmail} a ${chi}`}
    >
      {etichettaEmail}
    </a>
  ) : null;
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      {primaEmail ? bottoneEmail : null}
      {haTelefono(telefono) ? (
        <a className="btn btn-linea btn-sm" href={linkTelefono(telefono)} aria-label={`Chiama ${chi}`}>
          Chiama
        </a>
      ) : null}
      {haTelefono(telefono) ? (
        <a
          className="btn btn-linea btn-sm"
          href={linkWhatsAppCliente(telefono, testoWhatsApp)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`WhatsApp a ${chi} (si apre in una nuova scheda)`}
        >
          WhatsApp
        </a>
      ) : null}
      {primaEmail ? null : bottoneEmail}
    </div>
  );
}
