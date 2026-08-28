"use client";

import { useEffect, useState } from "react";
import type { Elemento } from "@/lib/catalogo";
import { elementoImg } from "@/lib/catalogo";
import { usePiano } from "@/lib/piano";
import { MacroAnimate } from "./MacroBar";
import { Chip } from "./ui";

type Stato = "pronto" | "aggiunto" | "pieno";

/**
 * La scheda del catalogo nuovo: un primo o un secondo, mai un piatto intero.
 * Sostituisce DishCard, rimossa insieme al vecchio catalogo a piatti interi,
 * al box e al checkout.
 *
 * Le foto vanno SENZA filtro di luminosita: erano scurite per il fondo nero,
 * su chiaro tornano naturali.
 */
export default function ElementCard({
  elemento,
  variante = "griglia",
  anteprima = false,
}: {
  elemento: Elemento;
  variante?: "griglia" | "riga";
  /**
   * Sola lettura: niente bottone "Aggiungi". Serve alla card che mostra un
   * elemento gia dentro un piano calcolato altrove (l'anteprima del risultato
   * in /scheda) e che si applica tutto insieme: un bottone capace di scrivere
   * un solo elemento nella prima casella libera contraddirebbe quell'azione
   * di blocco. Di default resta attivo: /menu non deve cambiare comportamento.
   */
  anteprima?: boolean;
}) {
  const { metti, primaLibera, pronto } = usePiano();
  const [stato, setStato] = useState<Stato>("pronto");
  // L'annuncio vive separato da `stato`: si scrive solo quando l'utente preme
  // il bottone, mai quando `stato` torna da solo a "pronto" col timeout qui
  // sotto. Vedi il commento sulla regione live piu' in basso per il perche'.
  const [annuncio, setAnnuncio] = useState("");
  const riga = variante === "riga";

  // La conferma "Aggiunto" torna al bottone normale da sola: senza timeout
  // resterebbe bloccata anche dopo che l'utente ha gia capito che e andata.
  useEffect(() => {
    if (stato !== "aggiunto") return;
    const id = setTimeout(() => setStato("pronto"), 1800);
    return () => clearTimeout(id);
  }, [stato]);

  // Se non c'e' una casella libera per QUESTA categoria, il bottone lo dice
  // invece di non fare nulla: cliccare a vuoto senza spiegazione sembra un
  // guasto, non una settimana piena.
  const aggiungi = () => {
    const slot = primaLibera(elemento.categoria);
    if (!slot) {
      setStato("pieno");
      setAnnuncio(`Settimana piena: non c'è posto per ${elemento.nome}.`);
      return;
    }
    metti(slot.g, slot.m, elemento.categoria, elemento.id);
    setStato("aggiunto");
    setAnnuncio(`${elemento.nome} aggiunto alla settimana.`);
  };

  const etichettaBottone =
    stato === "aggiunto" ? "Aggiunto" : stato === "pieno" ? "Settimana piena" : "Aggiungi";
  const puntinoBottone = stato === "aggiunto" ? "✓" : stato === "pieno" ? "!" : "+";
  // Nome accessibile per esteso: su /menu ci sono 54 di questi bottoni dentro
  // altrettanti <article>, e "Aggiungi" da solo li rende indistinguibili a chi
  // naviga per elenco di bottoni invece che per pagina intera. Stessa
  // invariante gia' scritta per CasellaBottone in
  // components/settimana/CasellaBottone.tsx: l'etichetta racconta il bottone
  // per intero, elemento compreso.
  const etichettaAccessibile =
    stato === "aggiunto"
      ? `${elemento.nome} aggiunto alla settimana`
      : stato === "pieno"
        ? `Settimana piena, non è stato possibile aggiungere ${elemento.nome}`
        : `Aggiungi ${elemento.nome} alla settimana`;

  return (
    <article
      className="shell group h-full transition-[transform,box-shadow] duration-700 hover:-translate-y-2.5"
      style={{ transitionTimingFunction: "var(--e-over)" }}
    >
      <div
        className={`core h-full ${riga ? "grid grid-cols-[132px_1fr] sm:grid-cols-[172px_1fr]" : "flex flex-col"}`}
      >
        <figure className={`relative overflow-hidden bg-tray ${riga ? "h-full" : "aspect-[16/10]"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={elementoImg(elemento, riga ? 420 : 720)}
            alt={elemento.nome}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.06]"
            style={{ transitionTimingFunction: "var(--e-out)" }}
          />
        </figure>

        <div className={`flex flex-1 flex-col ${riga ? "p-6" : "p-6"}`}>
          <h3 className={`h3 ${riga ? "!text-[20px]" : "!text-[22px]"}`}>{elemento.nome}</h3>

          {!riga && <p className="mt-3 text-[14px] leading-relaxed text-muted">{elemento.descrizione}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <Chip accento className="uppercase tracking-[.08em]">
              {elemento.categoria === "primo" ? "Primo" : "Secondo"}
            </Chip>
            <Chip>{elemento.grammi} g</Chip>
            <Chip>{elemento.kcal} kcal</Chip>
          </div>

          <div className="mt-5">
            <MacroAnimate elemento={elemento} />
          </div>

          {/* Allergeni Reg. UE 1169/2011: campo obbligatorio, mostrato sempre,
              anche quando l'elenco e vuoto - "nessuno" e un dato, non un buco. */}
          <p className="note mt-4">
            Allergeni:{" "}
            {elemento.allergeni.length > 0 ? elemento.allergeni.join(", ") : "nessuno dichiarato"}
          </p>

          <div
            className="mt-auto flex items-center justify-between gap-3 border-t pt-[15px]"
            style={{ borderColor: "var(--hair-soft)" }}
          >
            <span className="note">{elemento.giorno === "lunedi" ? "cotto lun" : "cotto gio"}</span>
            {anteprima ? null : (
              <>
                <button
                  type="button"
                  className="btn btn-s btn-sm"
                  onClick={aggiungi}
                  disabled={!pronto}
                  aria-label={etichettaAccessibile}
                >
                  {etichettaBottone}
                  <span className="dot" aria-hidden="true">
                    {puntinoBottone}
                  </span>
                </button>
                {/* Regione live separata dal bottone, non aria-live sul bottone
                    stesso: l'`aria-live` era su un nodo il cui contenuto
                    cambiava anche da solo, col timeout qui sopra, tornando da
                    "Aggiunto" ad "Aggiungi" dopo 1800ms. Sul bottone quel
                    ritorno veniva letto come un secondo annuncio - un evento
                    che l'utente non ha causato, spacciato per un cambiamento
                    di stato. Qui invece si scrive solo su un'azione vera
                    (aggiungi(), sopra): il ritorno automatico non tocca
                    `annuncio`, quindi non genera nessun secondo annuncio. */}
                <span role="status" aria-live="polite" className="sr-only">
                  {annuncio}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
