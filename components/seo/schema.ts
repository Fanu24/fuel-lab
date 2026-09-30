import {
  DESCRIZIONE_ATTIVITA,
  EMAIL,
  INDIRIZZO,
  NOME_ATTIVITA,
  PROFILI_SOCIAL,
  TELEFONO,
  TITOLARE,
  URL_SITO,
  ZONE_SERVITE,
} from "@/lib/sito";
import { SOGLIA_PREZZO, getServizio } from "@/lib/servizi";
import {
  FASCE,
  FORMULE,
  NOTE_FASCIA,
  PREZZO_DA,
  PREZZO_FINO_A,
  etichettaFormula,
  getFormula,
  percorsoFormula,
  type Fascia,
  type Formula,
  type FormulaId,
} from "@/lib/abbonamento";
import type { Allenamento, Piatto } from "@/lib/catalogo";

/* =========================================================================
   I dati strutturati schema.org del sito, costruiti da una parte sola.

   Un grafo con @id stabili: l'attivita' (#organization), la cucina di Via del
   Santuario (#cucina, un FoodEstablishment), il sito (#website) e Matteo
   (#matteo) stanno nel layout, su ogni pagina; le pagine aggiungono il proprio
   nodo WebPage, le briciole e quello che mostrano davvero (menu, piatto,
   servizi, domande frequenti) e si agganciano al grafo per @id.

   Regola: solo dati che la pagina mostra o che stanno in lib/sito.ts. Niente
   coordinate, orari, telefono, recensioni o valutazioni finche' il
   committente non li fornisce: un dato inventato nei dati strutturati e' una
   bugia detta a Google.
   ========================================================================= */

export type Nodo = { [chiave: string]: unknown };

export interface Briciola {
  nome: string;
  href: string;
}

export interface DomandaTesto {
  q: string;
  a: string;
}

/** Da percorso ("/menu") a URL assoluto. La home e' l'URL nudo, come il canonical che genera Next. */
export function assoluto(percorso: string): string {
  if (/^https?:\/\//.test(percorso)) return percorso;
  if (percorso === "" || percorso === "/") return URL_SITO;
  return `${URL_SITO}${percorso.startsWith("/") ? "" : "/"}${percorso}`;
}

export const ID = {
  organizzazione: `${URL_SITO}/#organization`,
  cucina: `${URL_SITO}/#cucina`,
  sito: `${URL_SITO}/#website`,
  logo: `${URL_SITO}/#logo`,
  matteo: `${URL_SITO}/chi-siamo#matteo`,
  menu: `${URL_SITO}/menu#menu`,
  abbonamenti: `${URL_SITO}/abbonamento#abbonamenti`,
} as const;

export const idPiatto = (id: string) => `${URL_SITO}/menu/${id}#piatto`;
export const idFormula = (id: FormulaId) => `${assoluto(percorsoFormula(id))}#abbonamento`;

const rif = (id: string) => ({ "@id": id });

/** Un documento JSON-LD pronto per il tag <script>, con "<" neutralizzato. */
export function serializzaJsonLd(dati: Nodo | Nodo[]): string {
  const doc = Array.isArray(dati)
    ? { "@context": "https://schema.org", "@graph": dati }
    : { "@context": "https://schema.org", ...dati };
  return JSON.stringify(doc).replace(/</g, "\\u003c");
}

/** "8,90": la soglia di prezzo scritta all'italiana. */
export function prezzoIt(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

export function indirizzoPostale(): Nodo {
  return {
    "@type": "PostalAddress",
    streetAddress: INDIRIZZO.via,
    postalCode: INDIRIZZO.cap,
    addressLocality: INDIRIZZO.citta,
    addressRegion: INDIRIZZO.provincia,
    addressCountry: INDIRIZZO.nazione,
  };
}

/** Le zone di consegna come luoghi: i comuni sono City, Chieti Scalo e' una localita'. */
export function areaServita(): Nodo[] {
  return ZONE_SERVITE.map((z) => ({
    "@type": z.tipo === "comune" ? "City" : "Place",
    name: z.nome,
    containedInPlace: {
      "@type": "AdministrativeArea",
      name: z.provincia === "PE" ? "Provincia di Pescara" : "Provincia di Chieti",
    },
  }));
}

/** I campi di contatto veri: il telefono entra solo quando esiste. */
function contatti(): Nodo {
  return {
    email: EMAIL,
    ...(TELEFONO ? { telephone: TELEFONO } : {}),
    ...(PROFILI_SOCIAL.length ? { sameAs: PROFILI_SOCIAL } : {}),
  };
}

/** Il grafo dell'attivita', uguale su ogni pagina (sta nel layout). */
export function grafoSito(): Nodo[] {
  const logo: Nodo = {
    "@type": "ImageObject",
    "@id": ID.logo,
    url: assoluto("/logo-fuellab.png"),
    contentUrl: assoluto("/logo-fuellab.png"),
    width: 1095,
    height: 360,
    caption: NOME_ATTIVITA,
  };

  const organizzazione: Nodo = {
    "@type": "Organization",
    "@id": ID.organizzazione,
    name: NOME_ATTIVITA,
    url: URL_SITO,
    logo,
    description: DESCRIZIONE_ATTIVITA,
    address: indirizzoPostale(),
    areaServed: areaServita(),
    founder: rif(ID.matteo),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: EMAIL,
      ...(TELEFONO ? { telephone: TELEFONO } : {}),
      availableLanguage: "it",
      areaServed: "IT",
    },
    ...contatti(),
  };

  const cucina: Nodo = {
    "@type": "FoodEstablishment",
    "@id": ID.cucina,
    name: NOME_ATTIVITA,
    url: URL_SITO,
    description: DESCRIZIONE_ATTIVITA,
    image: assoluto("/opengraph-image.jpg"),
    logo: rif(ID.logo),
    address: indirizzoPostale(),
    areaServed: areaServita(),
    hasMenu: assoluto("/menu"),
    servesCuisine: ["Meal prep", "Cucina italiana"],
    priceRange: `Da ${prezzoIt(SOGLIA_PREZZO)} € a pasto`,
    currenciesAccepted: "EUR",
    founder: rif(ID.matteo),
    parentOrganization: rif(ID.organizzazione),
    knowsLanguage: "it",
    ...contatti(),
  };

  const sito: Nodo = {
    "@type": "WebSite",
    "@id": ID.sito,
    url: URL_SITO,
    name: NOME_ATTIVITA,
    description: DESCRIZIONE_ATTIVITA,
    inLanguage: "it-IT",
    publisher: rif(ID.organizzazione),
  };

  // Nessuna immagine: la foto di "Chi siamo" e' ancora di repertorio, e
  // attaccarla a una persona vera sarebbe falso.
  const matteo: Nodo = {
    "@type": "Person",
    "@id": ID.matteo,
    name: TITOLARE.nome,
    jobTitle: TITOLARE.ruolo,
    url: assoluto("/chi-siamo"),
    worksFor: rif(ID.organizzazione),
    workLocation: rif(ID.cucina),
  };

  return [organizzazione, cucina, sito, matteo];
}

export function nodoBriciole(percorso: string, voci: Briciola[]): Nodo {
  const tutte = [{ nome: "Home", href: "/" }, ...voci];
  return {
    "@type": "BreadcrumbList",
    "@id": `${assoluto(percorso)}#briciole`,
    itemListElement: tutte.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: v.nome,
      item: assoluto(v.href),
    })),
  };
}

export function domandeFaq(domande: DomandaTesto[]): Nodo[] {
  return domande.map((d) => ({
    "@type": "Question",
    name: d.q,
    acceptedAnswer: { "@type": "Answer", text: d.a },
  }));
}

export interface OpzioniPagina {
  percorso: string;
  nome: string;
  descrizione: string;
  /** "WebPage" se manca; "AboutPage", "CollectionPage", "ItemPage"... */
  tipo?: string;
  /** percorso dell'immagine principale della pagina */
  immagine?: string;
  briciole?: Briciola[];
  /** domande frequenti VISIBILI nella pagina: la pagina diventa anche FAQPage */
  faq?: DomandaTesto[];
  /** l'entita' principale (piatto, persona...); ignorata se ci sono FAQ */
  mainEntity?: Nodo;
  /** di chi parla la pagina: la cucina se manca; "Chi siamo" parla dell'attivita' */
  about?: Nodo;
  /** chi altro compare nella pagina (per esempio Matteo), per @id */
  mentions?: Nodo[];
  dataModifica?: string;
}

/** Il nodo WebPage della pagina piu' le sue briciole. */
export function nodiPagina(o: OpzioniPagina): Nodo[] {
  const url = assoluto(o.percorso);
  const tipi = [o.tipo ?? "WebPage", ...(o.faq?.length ? ["FAQPage"] : [])];
  const pagina: Nodo = {
    "@type": tipi.length === 1 ? tipi[0] : tipi,
    "@id": `${url}#webpage`,
    url,
    name: o.nome,
    description: o.descrizione,
    inLanguage: "it-IT",
    isPartOf: rif(ID.sito),
    about: o.about ?? rif(ID.cucina),
  };
  if (o.mentions?.length) pagina.mentions = o.mentions;
  if (o.immagine) pagina.primaryImageOfPage = { "@type": "ImageObject", url: assoluto(o.immagine) };
  if (o.dataModifica) pagina.dateModified = o.dataModifica;
  if (o.faq?.length) pagina.mainEntity = domandeFaq(o.faq);
  else if (o.mainEntity) pagina.mainEntity = o.mainEntity;

  const nodi: Nodo[] = [pagina];
  if (o.briciole?.length) {
    pagina.breadcrumb = rif(`${url}#briciole`);
    nodi.push(nodoBriciole(o.percorso, o.briciole));
  }
  return nodi;
}

/* ---- menu e piatti ---- */

export function nutrizione(p: Piatto): Nodo {
  return {
    "@type": "NutritionInformation",
    servingSize: `${p.grammi} g`,
    calories: `${p.kcal} kcal`,
    proteinContent: `${p.proteine} g`,
    carbohydrateContent: `${p.carboidrati} g`,
    fatContent: `${p.grassi} g`,
  };
}

/**
 * Ingredienti e allergeni in una frase: MenuItem non ha un campo ingredienti, la descrizione si'.
 * Niente giorno di cottura: Matteo cucina ogni giorno.
 */
export function descrizioneEstesa(p: Piatto): string {
  const ingredienti = p.ingredienti
    .map((i) => (i.grammi ? `${i.nome.toLowerCase()} (${i.grammi} g)` : i.nome.toLowerCase()))
    .join(", ");
  const allergeni = p.allergeni.length ? p.allergeni.join(", ") : "nessuno dei 14 allergeni principali";
  return `${p.descrizione} Porzione da ${p.grammi} g, cucinata fresca. Ingredienti: ${ingredienti}. Allergeni: ${allergeni}.`;
}

/**
 * Il piatto come MenuItem e non come Recipe: la pagina vende un piatto
 * cucinato da Matteo, non insegna a prepararlo (non ci sono i passaggi), e
 * chiamarla ricetta per inseguire un risultato arricchito sarebbe scorretto.
 * I valori nutrizionali sono quelli del catalogo, per porzione intera.
 */
export function nodoPiatto(p: Piatto, esteso = false): Nodo {
  return {
    "@type": "MenuItem",
    "@id": idPiatto(p.id),
    name: p.nome,
    description: esteso ? descrizioneEstesa(p) : p.descrizione,
    url: assoluto(`/menu/${p.id}`),
    image: assoluto(p.img),
    nutrition: nutrizione(p),
  };
}

const SEZIONI_MENU: { id: Allenamento; nome: string; descrizione: string }[] = [
  { id: "cardio", nome: "Per i giorni di cardio", descrizione: "Piatti consigliati nei giorni di corsa, bici e circuiti." },
  { id: "pesi", nome: "Per i giorni di pesi", descrizione: "Piatti consigliati nei giorni di pesistica." },
  { id: "entrambi", nome: "Per cardio e pesi", descrizione: "Piatti adatti a entrambi i tipi di allenamento." },
];

export function nodoMenu(piatti: Piatto[], descrizione: string): Nodo {
  return {
    "@type": "Menu",
    "@id": ID.menu,
    name: `Il menu di ${NOME_ATTIVITA}`,
    url: assoluto("/menu"),
    description: descrizione,
    inLanguage: "it-IT",
    hasMenuSection: SEZIONI_MENU.map((s) => ({
      ...s,
      piatti: piatti.filter((p) => p.allenamento === s.id),
    }))
      .filter((s) => s.piatti.length > 0)
      .map((s) => ({
        "@type": "MenuSection",
        name: s.nome,
        description: s.descrizione,
        hasMenuItem: s.piatti.map((p) => nodoPiatto(p)),
      })),
  };
}

/** Un elenco ordinato di piatti (per le pagine che li confrontano), che rimanda alle schede. */
export function elencoPiatti(percorso: string, nome: string, piatti: Piatto[]): Nodo {
  return {
    "@type": "ItemList",
    "@id": `${assoluto(percorso)}#piatti`,
    name: nome,
    numberOfItems: piatti.length,
    itemListElement: piatti.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: nodoPiatto(p),
    })),
  };
}

/* ---- servizi ---- */

export interface OpzioniServizio {
  /** frammento dell'@id, unico nella pagina */
  id: string;
  percorso: string;
  nome: string;
  descrizione: string;
  tipoServizio: string;
  /** dove si approfondisce o si inizia */
  url?: string;
  immagine?: string;
  /** soglia "da X euro a pasto"; assente per i servizi su preventivo */
  prezzoDa?: number;
}

/**
 * L'offerta a prezzo fisso mensile: price piu' UnitPriceSpecification riferita
 * a un mese (referenceQuantity 1 MON, codice UN/CEFACT). Dice "X euro per un
 * mese" senza inventare una durata minima del contratto, che il committente
 * non ha fissato (per questo niente billingDuration).
 */
function offertaMensile(url: string, prezzo: number): Nodo {
  return {
    "@type": "Offer",
    url,
    price: prezzo,
    priceCurrency: "EUR",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: prezzo,
      priceCurrency: "EUR",
      unitText: "mese",
      referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
    },
  };
}

/**
 * Un servizio con la sua offerta. Il prezzo del meal prep e' una soglia
 * (minPrice), mai un listino: e' l'unico numero a pasto che il committente
 * vuole in chiaro. Senza soglia (l'home cooking, su preventivo) l'offerta non
 * c'e'. Gli abbonamenti, che hanno prezzi fissi al mese, hanno i loro nodi:
 * nodoAbbonamenti e nodoFormula, piu' sotto.
 */
export function nodoServizio(o: OpzioniServizio): Nodo {
  const url = assoluto(o.url ?? o.percorso);
  const offerta: Nodo | null =
    o.prezzoDa != null
      ? {
          "@type": "Offer",
          url,
          priceCurrency: "EUR",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            minPrice: o.prezzoDa,
            priceCurrency: "EUR",
            unitText: "pasto",
          },
        }
      : null;
  return {
    "@type": "Service",
    "@id": `${assoluto(o.percorso)}#${o.id}`,
    name: o.nome,
    description: o.descrizione,
    serviceType: o.tipoServizio,
    url,
    ...(o.immagine ? { image: assoluto(o.immagine) } : {}),
    provider: rif(ID.cucina),
    areaServed: areaServita(),
    ...(offerta ? { offers: offerta } : {}),
  };
}

/* ---- gli abbonamenti ---- */

const TIPO_ABBONAMENTO = "Meal prep in abbonamento";

/**
 * Una formula in una fascia: "Completo · Plus", al suo prezzo di listino al
 * mese. Niente sconti: ritiro, coppia e famiglia si concordano con Matteo e
 * il prezzo che finisce nei dati strutturati e' quello che la pagina mostra.
 */
function offertaFormula(f: Formula, fascia: Fascia): Nodo {
  return {
    ...offertaMensile(assoluto(percorsoFormula(f.id)), f.prezzo[fascia]),
    name: etichettaFormula(f.id, fascia),
    description: `${f.cosaRicevi}. ${NOTE_FASCIA[fascia]}`,
  };
}

/**
 * Tutti gli abbonamenti in un servizio solo (sta su /abbonamento e su /servizi,
 * con lo stesso @id). Il prezzo e' un AggregateOffer, dal piu' basso (Pranzo
 * Standard) al piu' alto (Full 7 Plus): l'elenco delle cinque formule, ognuna
 * con le sue due offerte, sta nel catalogo. Nome, descrizione e foto sono
 * quelli della voce di lib/servizi.ts, gli stessi che si leggono in /servizi.
 */
export function nodoAbbonamenti(): Nodo {
  const servizio = getServizio("abbonamento");
  const url = assoluto("/abbonamento");
  return {
    "@type": "Service",
    "@id": ID.abbonamenti,
    name: servizio.nome,
    description: servizio.descrizione,
    serviceType: TIPO_ABBONAMENTO,
    url,
    image: assoluto(servizio.img),
    provider: rif(ID.cucina),
    areaServed: areaServita(),
    offers: {
      "@type": "AggregateOffer",
      url,
      priceCurrency: "EUR",
      lowPrice: PREZZO_DA,
      highPrice: PREZZO_FINO_A,
      offerCount: FORMULE.length * FASCE.length,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `Gli abbonamenti di ${NOME_ATTIVITA}`,
      itemListElement: FORMULE.map((f) => ({
        "@type": "OfferCatalog",
        name: `Abbonamento ${f.nome}`,
        url: assoluto(percorsoFormula(f.id)),
        itemListElement: FASCE.map((fascia) => offertaFormula(f, fascia)),
      })),
    },
  };
}

/** La scheda di una formula: un servizio con due offerte, Standard e Plus, ciascuna a prezzo mensile. */
export function nodoFormula(id: FormulaId): Nodo {
  const f = getFormula(id);
  return {
    "@type": "Service",
    "@id": idFormula(id),
    name: `Abbonamento ${f.nome}`,
    description: `${f.slogan} ${f.descrizione}`,
    serviceType: TIPO_ABBONAMENTO,
    url: assoluto(percorsoFormula(id)),
    provider: rif(ID.cucina),
    areaServed: areaServita(),
    offers: FASCE.map((fascia) => offertaFormula(f, fascia)),
  };
}
