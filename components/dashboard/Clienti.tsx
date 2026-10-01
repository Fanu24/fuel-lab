"use client";

/* Clienti: l'elenco e la scheda del singolo cliente (?id=...). I dati si
   caricano una volta sola qui, e ricerca, filtro e ordinamento vivono qui:
   aprire una scheda e tornare indietro ritrova l'elenco come lo si era lasciato. */

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { adminApi, api, type ClienteAdmin, type Ordine } from "@/lib/api";
import type { FiltroClienti, OrdineClienti } from "@/lib/produzione";
import ClientiElenco from "./ClientiElenco";
import { eSessioneScaduta, testoErrore } from "./ClientiErrore";
import ClientiScheda from "./ClientiScheda";

export default function Clienti() {
  const parametri = useSearchParams();
  const id = parametri.get("id");

  const [clienti, setClienti] = useState<ClienteAdmin[] | null>(null);
  const [errore, setErrore] = useState("");
  const [sessione, setSessione] = useState(false);
  const [ordini, setOrdini] = useState<Ordine[] | null>(null);
  const [erroreOrdini, setErroreOrdini] = useState("");
  const [caricando, setCaricando] = useState(false);

  /* Lo storico completo del cliente aperto: l'elenco generale ha solo gli
     ordini aperti e gli ultimi chiusi di tutto il sito. */
  const [storico, setStorico] = useState<{ id: string; ordini: Ordine[] } | null>(null);

  const [cerca, setCerca] = useState("");
  const [filtro, setFiltro] = useState<FiltroClienti>("tutti");
  const [ordine, setOrdine] = useState<OrdineClienti>("recenti");

  useEffect(() => {
    let vivo = true;
    adminApi.clienti().then(
      (r) => vivo && setClienti(r.customers),
      (e: unknown) => {
        if (!vivo) return;
        setErrore(testoErrore(e, "Non riesco a caricare i clienti."));
        setSessione(eSessioneScaduta(e));
      },
    );
    api.ordini().then(
      (r) => vivo && setOrdini(r.orders),
      (e: unknown) => vivo && setErroreOrdini(testoErrore(e, "Non riesco a caricare gli ordini.")),
    );
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    let vivo = true;
    adminApi.ordiniCliente(id).then(
      (r) => vivo && setStorico({ id, ordini: r.orders }),
      () => {
        // Senza storico resta l'elenco generale filtrato: meglio di niente.
      },
    );
    return () => {
      vivo = false;
    };
  }, [id]);

  function ricarica() {
    setCaricando(true);
    Promise.allSettled([
      adminApi.clienti().then(
        (r) => {
          setClienti(r.customers);
          setErrore("");
          setSessione(false);
        },
        (e: unknown) => {
          setErrore(testoErrore(e, "Non riesco a caricare i clienti."));
          setSessione(eSessioneScaduta(e));
        },
      ),
      api.ordini().then(
        (r) => {
          setOrdini(r.orders);
          setErroreOrdini("");
        },
        (e: unknown) => setErroreOrdini(testoErrore(e, "Non riesco a caricare gli ordini.")),
      ),
    ]).finally(() => setCaricando(false));
  }

  if (id) {
    return (
      <ClientiScheda
        id={id}
        cliente={clienti?.find((c) => c.id === id) ?? null}
        clientiCaricati={clienti !== null}
        errore={errore}
        sessioneScaduta={sessione}
        ordini={storico?.id === id ? storico.ordini : ordini ? ordini.filter((o) => o.user_id === id) : null}
        erroreOrdini={erroreOrdini}
        caricando={caricando}
        onRicarica={ricarica}
      />
    );
  }

  return (
    <ClientiElenco
      clienti={clienti}
      errore={errore}
      sessioneScaduta={sessione}
      caricando={caricando}
      onRicarica={ricarica}
      cerca={cerca}
      onCerca={setCerca}
      filtro={filtro}
      onFiltro={setFiltro}
      ordine={ordine}
      onOrdine={setOrdine}
    />
  );
}
