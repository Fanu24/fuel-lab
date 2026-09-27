import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import ChiusuraCta from "@/components/home/ChiusuraCta";
import JsonLd from "@/components/seo/JsonLd";
import { AGGIORNAMENTO, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { nodiPagina, nodoServizio } from "@/components/seo/schema";
import { SERVIZI, type Prezzo, type ServizioId } from "@/lib/servizi";

const PAGINA = PAGINE.servizi;

export const metadata = metadatiPagina(PAGINA);

/* Niente listino: il committente vuole una soglia, non prezzi in chiaro
   (vedi lib/servizi.ts). L'home cooking non ha nemmeno quella. */
function testoPrezzo(p: Prezzo): string {
  if (p.tipo === "preventivo") return "Su preventivo";
  return `Da ${p.valore.toFixed(2).replace(".", ",")} € ${p.unita}`;
}

/* Per i dati strutturati: che tipo di servizio e', e la pagina che lo spiega
   meglio (l'home cooking ha la sua pagina locale). */
const SCHEMA_SERVIZIO: Record<ServizioId, { tipo: string; url: string }> = {
  "menu-settimana": { tipo: "Meal prep", url: "/settimana" },
  "sui-tuoi-macro": { tipo: "Meal prep sui macro del nutrizionista", url: "/scheda" },
  "home-cooking": { tipo: "Cuoco a domicilio", url: PAGINE.domicilio.percorso },
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
            nodoServizio({
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
            <span className="titolo-xl mt-6 block max-w-[11ch]">Tre modi di mangiare bene.</span>
          </h1>
          <p className="lead mt-6">
            Matteo cucina il lunedì e il giovedì: ritiri in Via del Santuario 214 o ricevi a Pescara e dintorni, con
            la consegna gratis dai dieci pasti in su.{" "}
            <Link href={PAGINE.consegna.percorso} className="link">
              Zone e ritiro
            </Link>
          </p>
        </div>
      </section>

      <section className="pb-[var(--sezione)]">
        <ol className="wrap grid gap-16">
          {SERVIZI.map((s, i) => (
            <Reveal
              as="li"
              key={s.id}
              className={`grid items-center gap-8 md:grid-cols-2 md:gap-16 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}
            >
              <div className="smusso relative aspect-[4/3] overflow-hidden bg-paper-2">
                <Image src={s.img} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
              </div>
              <div>
                <span className="num text-sm text-muted">{s.numero}</span>
                <h2 className="titolo mt-3">{s.nome}</h2>
                <p className="mt-5 max-w-[46ch] text-lg text-muted">{s.descrizione}</p>
                <p className="mt-6 font-disp text-lg font-semibold tracking-[.1em] uppercase">
                  <span className="evidenzia">{testoPrezzo(s.prezzo)}</span>
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                  <Link href={s.href} className="btn btn-ink">
                    {s.id === "home-cooking" ? "Conosci Matteo" : "Inizia"} <span className="freccia">→</span>
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

      <ChiusuraCta />
    </>
  );
}
