"use client";

/* Riapre il banner della privacy (components/PrivacyConsent.tsx). Lo stile lo
   decide chi lo usa: nel footer e' una riga di link, nella pagina privacy un bottone. */
export default function PrivacySettingsButton({
  className = "underline underline-offset-4 hover:text-lime",
  children = "Impostazioni privacy",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event("fuellab:open-privacy-settings"))}
    >
      {children}
    </button>
  );
}
