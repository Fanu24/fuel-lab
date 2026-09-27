/**
 * Dati strutturati in un <script> nativo, come indica la guida JSON-LD di
 * Next: il "<" diventa < perché nessun testo possa chiudere il tag.
 */
export default function JsonLd({ dati }: { dati: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dati).replace(/</g, "\\u003c") }}
    />
  );
}
