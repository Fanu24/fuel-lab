"use client";

export default function PrivacySettingsButton() {
  return (
    <button
      type="button"
      className="underline underline-offset-4 hover:text-lime"
      onClick={() => window.dispatchEvent(new Event("fuellab:open-privacy-settings"))}
    >
      Impostazioni privacy
    </button>
  );
}
