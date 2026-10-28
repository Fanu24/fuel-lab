import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import JsonLd from "@/components/seo/JsonLd";
import { AGGIORNAMENTO, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { nodiPagina, nodoAbbonamenti, nodoServizio } from "@/components/seo/schema";
import { SERVIZI, type Prezzo, type ServizioId } from "@/lib/servizi";

const PAGINA = PAGINE.servizi;

export const metadata = metadatiPagina(PAGINA);

/* Niente listino: il committente vuole una soglia, non prezzi in chiaro
   (vedi lib/servizi.ts). Gli abbonamenti hanno cinque prezzi al mese: qui si
   legge il piu' basso, "da", e il resto sta nella loro pagina. L'home cooking
   nemmeno la soglia. */
function testoPrezzo(p: Prezzo): string {
  if (p.tipo === "preventivo") return "Su preventivo";
  if (p.tipo === "mese-da") return `Da ${p.valore} € al mese`;
  return `Da ${p.valore.toFixed(2).replace(".", ",")} € ${p.unita}`;
}

/* Per i dati strutturati: che tipo di servizio e', e la pagina che lo spiega
   meglio (l'home cooking ha la sua pagina locale). Gli abbonamenti non ci sono:
   hanno un nodo tutto loro, con le cinque formule (nodoAbbonamenti). */
const SCHEMA_SERVIZIO: Record<Exclude<ServizioId, "abbonamento">, { tipo: string; url: string }> = {
  "menu-settimana": { tipo: "Meal prep", url: "/settimana" },
  "sui-tuoi-macro": { tipo: "Meal prep sui macro del nutrizionista", url: "/scheda" },
  "home-cooking": { tipo: "Cuoco a domicilio", url: PAGINE.domicilio.percorso },
};

/* Il titolo conta i servizi dell'elenco qui sotto: se ne arriva uno, cambia da solo. */
const SERVIZI_ORDINATI = [...SERVIZI].sort((a, b) => Number(b.id === "abbonamento") - Number(a.id === "abbonamento"));

/* Il testo del bottone principale di ogni servizio. */
const BOTTONE: Record<ServizioId, string> = {
  "menu-settimana": "Componi la tua settimana",
  abbonamento: "Scopri gli abbonamenti",
  "sui-tuoi-macro": "Porta il tuo piano alimentare",
  "home-cooking": "Conosci Matteo",
};

export default function Servizi() {
  return (
    <>
      <JsonLd
        dati={[
          ...nodiPagina({
            percorso: PAGINA.percorso,
            nome: PAGINA.titolo,
            descrizione: PAGINA.descrizione,
            briciole: [{ nome: PAGINA.breve, href: PAGINA.percorso }],
            dataModifica: AGGIORNAMENTO,
          }),
          ...SERVIZI.map((s) =>
            s.id === "abbonamento"
              ? nodoAbbonamenti()
              : nodoServizio({
                  id: s.id,
                  percorso: PAGINA.percorso,
                  nome: s.nome,
                  descrizione: s.descrizione,
                  tipoServizio: SCHEMA_SERVIZIO[s.id].tipo,
                  url: SCHEMA_SERVIZIO[s.id].url,
                  immagine: s.img,
                  prezzoDa: s.prezzo.tipo === "soglia" ? s.prezzo.valore : undefined,
                }),
          ),
        ]}
      />
      <section className="testata">
        <div className="wrap">
          <h1>
            <span className="occhiello">Servizi di meal prep a Pescara</span>
            <span className="titolo-pagina mt-6 block max-w-[11ch]">Scegli come mangiare.</span>
          </h1>
          <p className="lead mt-6">
            Abbonamenti, menu settimanale e cucina a domicilio.{" "}
            <Link href={PAGINE.consegna.percorso} className="link">
              Zone e ritiro
            </Link>
          </p>
          {/* L'indice dei servizi con il prezzo: chi arriva dal telefono vede in un colpo d'occhio cosa c'e' e quanto
              costa, e va dritto al servizio che gli interessa. */}
        </div>
      </section>

      <section className="pb-[var(--sezione)]">
        <ol className="wrap grid gap-16">
          {SERVIZI_ORDINATI.map((s, i) => (
            <Reveal
              as="li"
              key={s.id}
              className={`grid items-center gap-8 md:grid-cols-2 md:gap-16 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}
            >
              <div id={s.id} className="smusso relative aspect-[4/3] overflow-hidden bg-paper-2">
                <Image src={s.img} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
              </div>
              <div>
                <h2 className="titolo mt-3">{s.nome}</h2>
                <p className="mt-5 max-w-[46ch] text-lg text-muted">{s.descrizione}</p>
                <p className="mt-6 font-disp text-lg font-semibold tracking-[.1em] uppercase">
                  <span className="evidenzia">{testoPrezzo(s.prezzo)}</span>
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                  <Link href={s.href} className="btn btn-ink">
                    {BOTTONE[s.id]} <span aria-hidden="true" className="freccia">→</span>
                  </Link>
                  {s.id === "home-cooking" ? (
                    <Link href={PAGINE.domicilio.percorso} className="link">
                      Come funziona a casa tua
                    </Link>
                  ) : null}
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

    </>
  );
}
