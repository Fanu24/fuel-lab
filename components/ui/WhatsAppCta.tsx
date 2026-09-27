import { linkWhatsApp } from "@/lib/whatsapp";

type Props = {
  testo?: string;
  className?: string;
  buttonClassName?: string;
  label?: string;
  onClick?: () => void;
  mostraAvviso?: boolean;
};

const MESSAGGIO_DEFAULT =
  "Ciao Matteo! Ho visto FUEL LAB e vorrei informazioni sul menu e sul meal prep a Pescara.";

export function MarchioWhatsApp() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="currentColor">
      <path d="M12.04 2a9.85 9.85 0 0 0-8.48 14.86L2 22l5.28-1.39A9.94 9.94 0 0 0 12.04 22 10 10 0 0 0 12.04 2Zm0 18.17a8.16 8.16 0 0 1-4.16-1.14l-.3-.18-3.13.82.84-3.05-.2-.32a8.14 8.14 0 1 1 6.95 3.87Zm4.47-6.1c-.25-.12-1.48-.73-1.71-.81-.23-.09-.4-.12-.57.12-.17.25-.65.81-.8.98-.15.17-.3.19-.56.06-.25-.12-1.07-.39-2.04-1.24-.76-.68-1.27-1.52-1.42-1.78-.15-.25-.02-.39.11-.52.11-.11.25-.3.38-.45.12-.15.16-.25.25-.42.08-.17.04-.32-.02-.45-.06-.12-.57-1.37-.78-1.88-.2-.48-.41-.42-.57-.43h-.49c-.17 0-.45.06-.68.32-.23.25-.89.87-.89 2.12s.91 2.46 1.04 2.63c.12.17 1.79 2.74 4.34 3.84.61.26 1.08.42 1.45.53.61.19 1.16.16 1.6.1.49-.07 1.48-.61 1.69-1.2.21-.59.21-1.1.15-1.2-.06-.11-.23-.17-.49-.29Z" />
    </svg>
  );
}

export default function WhatsAppCta({
  testo = MESSAGGIO_DEFAULT,
  className = "",
  buttonClassName = "",
  label = "Contatta su WhatsApp",
  onClick,
  mostraAvviso = true,
}: Props) {
  const href = linkWhatsApp(testo);

  return (
    <div className={className}>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
          className={`btn btn-whatsapp ${buttonClassName}`}
        >
          <MarchioWhatsApp />
          <span>{label}</span>
          <span aria-hidden="true" className="freccia">→</span>
        </a>
      ) : (
        <span
          className={`btn btn-whatsapp btn-whatsapp-inattivo ${buttonClassName}`}
          role="status"
          title="Il numero WhatsApp di Matteo non è ancora configurato"
        >
          <MarchioWhatsApp />
          <span>{label}</span>
          <span aria-hidden="true" className="text-xs">Presto</span>
        </span>
      )}
      {!href && mostraAvviso ? (
        <p className="mt-3 max-w-[42ch] text-sm text-muted">
          Il numero WhatsApp non è ancora configurato. Intanto puoi esplorare il menu e comporre il tuo piatto.
        </p>
      ) : null}
    </div>
  );
}
