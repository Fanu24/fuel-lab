"use client";

import { useEffect, useState } from "react";
import type { Elemento } from "@/lib/catalogo";
import { elementoImg } from "@/lib/catalogo";
import { usePiano } from "@/lib/piano";
import { MacroAnimate } from "./MacroBar";

type Stato = "pronto" | "aggiunto" | "pieno";

/**
 * La scheda del catalogo nuovo: un primo o un secondo, mai un piatto intero.
 *
 * IL DIFETTO CHE QUESTA RISCRITTURA CHIUDE, misurato a 390px.
 * La scheda era alta CIRCA 700 PIXEL su uno schermo da 844, e /menu ne monta
 * 54: quarantamila pixel, quarantasei schermate di telefono per sfogliare un
 * catalogo di 54 voci. Il contenuto non era il problema - dentro c'erano una
 * foto da 210px, tre barre macro impilate da 125, un paragrafo, una fila di
 * chip, una riga di allergeni e una pillola "Aggiungi" con il suo bordo. Il
 * problema era che ogni pezzo era tarato per una colonna da 380px di desktop
 * e su 350 di telefono restava lungo uguale, uno sotto l'altro.
 *
 * Adesso la scheda e' DENSA, che sul telefono e' anche il modo in cui e' piu'
 * bella: foto, nome, i tre macro e l'azione entrano in circa 290px, e su due
 * colonne a 390px vuol dire quattro piatti per schermata invece di uno e
 * quarto. Cosa e' cambiato, in ordine di peso:
 *   - le tre barre macro passano da tre righe impilate a tre colonne pari
 *     (.macro-3 in globals.css): 28px invece di 125, e il confronto fra i tre
 *     macro si legge meglio perche' i binari sono affiancati;
 *   - "Aggiungi" sale sulla foto come bottone tondo da 44px (.btn-tondo),
 *     dove lo spazio c'era gia': via il bordo, lo stacco e la riga in fondo;
 *   - la categoria diventa una chip sopra la foto, come nella vetrina della
 *     home, invece di una chip in mezzo al testo;
 *   - grammi, calorie e giorno di cottura stanno su una riga sola in mono;
 *   - la descrizione compare da 768px in su, dove la colonna e' larga il
 *     doppio e la riga in piu' non spinge niente sotto la piega. Sul telefono
 *     il dato che serve per scegliere e' il nome con i macro, non l'aggettivo.
 *
 * NON e' uscito niente di obbligatorio: gli allergeni (Reg. UE 1169/2011)
 * restano su ogni scheda, a ogni larghezza, anche quando l'elenco e' vuoto.
 *
 * Le foto vanno SENZA filtro di luminosita: erano scurite per il fondo nero,
 * su chiaro tornano naturali.
 */
export default function ElementCard({
  elemento,
  anteprima = false,
}: {
  elemento: Elemento;
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

  const puntinoBottone = stato === "aggiunto" ? "✓" : stato === "pieno" ? "!" : "+";
  // Nome accessibile per esteso: su /menu ci sono 54 di questi bottoni dentro
  // altrettanti <article>, e "Aggiungi" da solo li rende indistinguibili a chi
  // naviga per elenco di bottoni invece che per pagina intera. Stessa
  // invariante gia' scritta per CasellaBottone in
  // components/settimana/CasellaBottone.tsx: l'etichetta racconta il bottone
  // per intero, elemento compreso. Con il bottone tondo l'etichetta e' anche
  // l'UNICO testo dell'azione, quindi conta il doppio.
  const etichettaAccessibile =
    stato === "aggiunto"
      ? `${elemento.nome} aggiunto alla settimana`
      : stato === "pieno"
        ? `Settimana piena, non è stato possibile aggiungere ${elemento.nome}`
        : `Aggiungi ${elemento.nome} alla settimana`;

  return (
    <article
      className="shell group h-full transition-[transform,box-shadow] duration-700 hover:-translate-y-2"
      style={{ transitionTimingFunction: "var(--e-over)" }}
    >
      <div className="core flex h-full flex-col">
        <figure className="relative aspect-[4/3] overflow-hidden bg-tray md:aspect-[16/10]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={elementoImg(elemento, 720)}
            alt={elemento.nome}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.06]"
            style={{ transitionTimingFunction: "var(--e-out)" }}
          />
          <span className="chip chip-k absolute top-2.5 left-2.5 uppercase md:top-4 md:left-4">
            {elemento.categoria === "primo" ? "Primo" : "Secondo"}
          </span>

          {anteprima ? null : (
            <>
              <button
                type="button"
                className="btn-tondo absolute right-2.5 bottom-2.5 md:right-4 md:bottom-4"
                onClick={aggiungi}
                disabled={!pronto}
                data-stato={stato}
                aria-label={etichettaAccessibile}
              >
                <span aria-hidden="true">{puntinoBottone}</span>
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
        </figure>

        <div className="flex flex-1 flex-col p-3.5 sm:p-5 md:p-6">
          <h3 className="h3 !text-[15.5px] !leading-[1.14] sm:!text-[18px] md:!text-[20px]">
            {elemento.nome}
          </h3>

          {/* Da 768px in su: li' la colonna e' larga il doppio e la riga in
              piu' non sposta niente. Sotto, il nome con i macro basta a
              scegliere e l'aggettivo costerebbe tre righe su due colonne. */}
          <p className="mt-2.5 hidden text-[14px] leading-relaxed text-muted md:block">
            {elemento.descrizione}
          </p>

          {/* Una riga sola invece di tre chip che andavano a capo: grammi,
              calorie e giorno di cottura sono tre dati dello stesso tipo e
              vanno letti insieme. */}
          <p className="note mt-2 !text-[9.5px] md:mt-3.5 md:!text-[10px]">
            {elemento.grammi} g &middot; {elemento.kcal} kcal &middot;{" "}
            {elemento.giorno === "lunedi" ? "cotto lun" : "cotto gio"}
          </p>

          <div className="mt-3 md:mt-4">
            <MacroAnimate elemento={elemento} />
          </div>

          {/* Allergeni Reg. UE 1169/2011: campo obbligatorio, mostrato sempre,
              anche quando l'elenco e vuoto - "nessuno" e un dato, non un buco. */}
          <p className="note mt-auto pt-3 !text-[9px] leading-[1.5] md:!text-[10px]">
            Allergeni:{" "}
            {elemento.allergeni.length > 0 ? elemento.allergeni.join(", ") : "nessuno"}
          </p>

          {/* Il bottone tondo dice "+", "✓" e "!" e cambia colore: per
              "aggiunto" basta, perche' il segno di spunta e' univoco. Per la
              settimana piena no - un punto esclamativo non spiega cosa non e'
              andato - quindi in quel solo caso, e solo li', compare anche la
              parola. #C02626 su card fa 5.92:1: passa AA come testo, non solo
              come anello (vedi .field-err in globals.css). */}
          {stato === "pieno" ? (
            <p className="note mt-1.5 !text-[9px]" style={{ color: "#C02626" }}>
              Settimana piena
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
