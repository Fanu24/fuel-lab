"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LINK_MAPPA } from "@/lib/sito";

const EMBED = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2943.102060030832!2d14.1911474!3d42.46811799999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1331a58758c720d1%3A0x1b6498f952361291!2sFUEL%20LAB!5e0!3m2!1sit!2sit!4v1791488779083!5m2!1sit!2sit";

/** L'anteprima locale conserva i riferimenti Google. L'iframe si monta solo al clic. */
export default function MappaSede({ compatta = false, scura = false }: { compatta?: boolean; scura?: boolean }) {
  const [attiva, setAttiva] = useState(false);

  useEffect(() => {
    const chiudi = () => setAttiva(false);
    window.addEventListener("fuellab:open-privacy-settings", chiudi);
    return () => window.removeEventListener("fuellab:open-privacy-settings", chiudi);
  }, []);

  return (
    <div className={`smusso overflow-hidden border ${scura ? "bg-night-2 text-paper" : "bg-paper-2 text-ink"}`} style={{ borderColor: "var(--line)" }}>
      <div className="h-1 bg-lime" aria-hidden="true" />
      <div className="relative aspect-[4/3] bg-paper-2">
        {attiva ? (
          <iframe
            title={`Google Maps · FUEL LAB${compatta ? " · footer" : " · sede"}`}
            src={EMBED}
            width="600"
            height="450"
            className="h-full w-full border-0"
            style={{ filter: "saturate(.25)" }}
            allowFullScreen
            loading="eager"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <Image
            src="/mappa-fuel-lab.png"
            alt="Anteprima Google Maps: FUEL LAB in Via del Santuario 214 a Pescara"
            width={600}
            height={450}
            className="h-full w-full object-contain"
            style={{ filter: "saturate(.25)" }}
          />
        )}
      </div>
      <div className={`flex flex-wrap items-center justify-between gap-2 px-4 ${compatta ? "py-2 text-xs" : "py-3 text-sm"}`}>
        <a href={LINK_MAPPA} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 font-semibold underline underline-offset-4">
          Indicazioni <span aria-hidden="true">↗</span>
        </a>
        <button type="button" aria-pressed={attiva} onClick={() => setAttiva(!attiva)} className={`inline-flex min-h-11 items-center gap-2 rounded-sm px-3 font-semibold ${scura ? "bg-paper text-ink" : "bg-ink text-paper"}`}>
          {attiva ? "Chiudi la mappa" : "Esplora la mappa"}
          <span aria-hidden="true">{attiva ? "×" : "+"}</span>
        </button>
      </div>
      <p className="px-4 pb-3 text-xs text-muted">
        Google Maps si carica al clic. <Link href="/privacy#mappe" className="underline underline-offset-4">Privacy</Link>
      </p>
    </div>
  );
}
