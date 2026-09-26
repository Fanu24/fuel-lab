import { PIATTI, type Piatto } from "./catalogo";
import {
  GIORNI,
  PASTI,
  type Allenamenti,
  type Casella,
  type GiornoSettimana,
  type Pasto,
  type Piano,
  type TipoGiornata,
} from "./settimana";

/* =========================================================================
   L'autoriempimento: dagli allenamenti della settimana a una proposta di piano.

   Puro e deterministico, niente Math.random: la stessa settimana da' sempre la
   stessa proposta, quindi si prova in un test e non "salta" fra un render e
   l'altro. La varieta' la chiede l'utente con `rimescola` ("altre proposte"),
   che ruota l'ordine di preferenza invece di tirare a sorte.

   Le regole vengono dal brief di Matteo: cardio vuole carboidrati, pesi vuole
   proteine con carboidrati contenuti, il riposo vuole il piatto piu' leggero.
   ========================================================================= */

export interface OpzioniAutofill {
  /** 1 = solo il pranzo; la cena resta com'e' */
  pastiAlGiorno: 1 | 2;
  /**
   * true = anche le caselle gia' piene dei giorni con allenamento ricevono un piatto
   * nuovo. Le AGGIUNTE restano: le ha scelte l'utente a mano, e un clic su "riempi"
   * non deve cancellare lavoro che l'algoritmo non sa rifare.
   */
  sovrascrivi: boolean;
  /** 0 o assente = la proposta migliore; ogni numero in piu' ruota le preferenze */
  rimescola?: number;
}

/** Un piatto non compare piu' di tante volte a settimana: sei piatti, quattordici caselle. */
const MAX_A_SETTIMANA = 3;

const quotaCarbo = (p: Piatto) => (p.carboidrati * 4) / p.kcal;
const rapportoPC = (p: Piatto) => p.proteine / p.carboidrati;

/** Ordina senza toccare il catalogo; a pari punteggio vince l'ordine del catalogo (sort e' stabile). */
function perPunteggio(lista: Piatto[], punteggio: (p: Piatto) => number): Piatto[] {
  return [...lista].sort((a, b) => punteggio(b) - punteggio(a));
}

const di = (a: Piatto["allenamento"]) => PIATTI.filter((p) => p.allenamento === a);

/**
 * I piatti adatti a un tipo di giornata, dal piu' adatto. I piatti "entrambi"
 * vengono dopo quelli specifici: sono la seconda scelta, non la prima.
 */
export function candidatiPer(tipo: TipoGiornata): Piatto[] {
  if (tipo === "cardio") {
    return [...perPunteggio(di("cardio"), quotaCarbo), ...perPunteggio(di("entrambi"), quotaCarbo)];
  }
  if (tipo === "pesi") {
    return [...perPunteggio(di("pesi"), rapportoPC), ...perPunteggio(di("entrambi"), rapportoPC)];
  }
  // riposo: niente carico glucidico da recuperare, quindi il piatto meno denso
  return perPunteggio([...di("pesi"), ...di("entrambi")], (p) => -p.kcal);
}

/**
 * L'ordine di preferenza completo: prima i candidati, poi il resto del catalogo come
 * ripiego. Senza ripiego una settimana di solo cardio si fermerebbe a 9 caselle
 * (3 candidati x 3 volte): meglio un piatto meno mirato che una casella vuota.
 */
function preferenze(tipo: TipoGiornata, rimescola: number): string[] {
  const primi = candidatiPer(tipo);
  const visti = new Set(primi.map((p) => p.id));
  const punteggio = tipo === "pesi" ? rapportoPC : tipo === "cardio" ? quotaCarbo : (p: Piatto) => -p.kcal;
  const ripiego = perPunteggio(
    PIATTI.filter((p) => !visti.has(p.id)),
    punteggio,
  );
  return [...ruota(primi, rimescola), ...ruota(ripiego, rimescola)].map((p) => p.id);
}

function ruota<T>(lista: T[], n: number): T[] {
  if (lista.length === 0) return lista;
  const k = ((Math.trunc(n) % lista.length) + lista.length) % lista.length;
  return [...lista.slice(k), ...lista.slice(0, k)];
}

type Chiave = `${GiornoSettimana}.${Pasto}`;
const chiave = (g: GiornoSettimana, m: Pasto): Chiave => `${g}.${m}`;

export function riempiSettimana(piano: Piano, allenamenti: Allenamenti, o: OpzioniAutofill): Piano {
  const pasti: readonly Pasto[] = o.pastiAlGiorno === 1 ? ["pranzo"] : PASTI;
  const rimescola = o.rimescola ?? 0;

  // Le caselle da decidere: giorni con un allenamento, pasti richiesti, vuote o da rifare.
  const daRiempire: { g: GiornoSettimana; m: Pasto; tipo: TipoGiornata }[] = [];
  for (const g of GIORNI) {
    const tipo = allenamenti[g];
    if (!tipo) continue;
    for (const m of pasti) {
      if (o.sovrascrivi || !piano[g]?.[m]?.piatto) daRiempire.push({ g, m, tipo });
    }
  }
  if (daRiempire.length === 0) return piano;

  // Lo stato di lavoro: il piatto di ogni casella, con quelle da rifare gia' liberate.
  // I conteggi partono da cio' che resta, cosi' i piatti gia' scelti a mano contano.
  const scelto = new Map<Chiave, string>();
  for (const g of GIORNI) {
    for (const m of PASTI) {
      const id = piano[g]?.[m]?.piatto;
      if (id) scelto.set(chiave(g, m), id);
    }
  }
  for (const { g, m } of daRiempire) scelto.delete(chiave(g, m));
  const volte = new Map<string, number>();
  for (const id of scelto.values()) volte.set(id, (volte.get(id) ?? 0) + 1);

  const vicino = (g: GiornoSettimana, passo: number, m: Pasto) => {
    const altro = GIORNI[GIORNI.indexOf(g) + passo];
    return altro ? scelto.get(chiave(altro, m)) : undefined;
  };

  const esito: Piano = structuredClone(piano);
  for (const { g, m, tipo } of daRiempire) {
    const lecito = (id: string) =>
      (volte.get(id) ?? 0) < MAX_A_SETTIMANA &&
      PASTI.every((altro) => altro === m || scelto.get(chiave(g, altro)) !== id);
    // "niente stesso pasto in giorni consecutivi" e' una preferenza, non un divieto:
    // se l'unico piatto lecito e' quello di ieri, meglio lui che una casella vuota.
    const variato = (id: string) => vicino(g, -1, m) !== id && vicino(g, 1, m) !== id;

    const ordine = preferenze(tipo, rimescola);
    const id = ordine.find((x) => lecito(x) && variato(x)) ?? ordine.find(lecito);
    // Nessun piatto lecito: la casella resta com'era, piatto originale compreso.
    if (!id) {
      const prima = piano[g]?.[m]?.piatto;
      if (prima) scelto.set(chiave(g, m), prima);
      continue;
    }

    scelto.set(chiave(g, m), id);
    volte.set(id, (volte.get(id) ?? 0) + 1);
    const casella: Casella = { piatto: id, extra: [...(piano[g]?.[m]?.extra ?? [])] };
    esito[g] = { ...esito[g], [m]: casella };
  }
  return esito;
}
