/* La consegna di un PDF già pronto, dal tocco di un bottone. Solo browser, senza pdf-lib: si importa
   in statico, così `navigator.share` parte nello stesso istante del tocco (su iPhone un `await` di
   troppo prima della condivisione la fa rifiutare). Il pannello non cambia pagina in nessun caso. */

/** `fatto`: condiviso, annullato dall'utente o aperto in una scheda. `link`: il browser non ha aperto niente, serve un link da toccare. */
export type EsitoConsegna = "fatto" | "link";

/**
 * Il foglio di condivisione (su iPhone c'è "Stampa") se il telefono sa condividere file; altrimenti, o se la
 * condivisione non riesce, una scheda nuova con il PDF. Annullare la condivisione non è un errore. Va chiamata
 * dal gestore del tocco, senza `await` prima.
 */
export async function consegnaPdf(file: File, url: string): Promise<EsitoConsegna> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name });
      return "fatto";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "fatto";
      // Condivisione non riuscita: si prova ad aprire il PDF.
    }
  }
  return window.open(url, "_blank") ? "fatto" : "link";
}
