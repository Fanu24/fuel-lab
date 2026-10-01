import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PIATTI, getPiatto } from "@/lib/catalogo";
import { CONSIGLI } from "@/lib/consigli";
import TagAllenamento from "@/components/ui/TagAllenamento";
import { BarraComposizione, NumeriMacro } from "@/components/ui/Macro";
import AggiungiAllaSettimana from "@/components/menu/AggiungiAllaSettimana";
import BollinoNonDisponibile from "@/components/impostazioni/BollinoNonDisponibile";
import CartaPiatto from "@/components/menu/CartaPiatto";
import JsonLd from "@/components/seo/JsonLd";
import Briciole from "@/components/seo/Briciole";
import { AGGIORNAMENTO, PAGINE, metadatiPagina, paginaPiatto } from "@/components/seo/pagine";
import { idPiatto, nodiPagina, nodoPiatto } from "@/components/seo/schema";

/* La scheda del piatto, una pagina vera e non una finestra sopra il menu: si
   condivide con un link, si indicizza, e il tasto indietro fa quello che ci
   si aspetta. Next 16: params e' una Promise. */

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return PIATTI.map((p) => ({ id: p.id }));
}

/* Titolo = nome del piatto; descrizione con kcal e proteine (entro 155
   caratteri, vedi descrizionePiatto); anteprima social = la foto del piatto. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getPiatto((await params).id);
  if (!p) return {};
  return metadatiPagina(paginaPiatto(p));
}

export default async function PaginaPiatto({ params }: Props) {
  const piatto = getPiatto((await params).id);
  if (!piatto) notFound();

  const consiglio = piatto.allenamento === "entrambi" ? null : CONSIGLI[piatto.allenamento];
  // I tre piatti che seguono questo nel menu, ricominciando da capo alla fine: ogni scheda ha i suoi vicini
  // (con "i primi tre" l'ultimo piatto rimandava sempre agli stessi).
  const posto = PIATTI.findIndex((p) => p.id === piatto.id);
  const altri = [1, 2, 3].map((n) => PIATTI[(posto + n) % PIATTI.length]);
  const scheda = paginaPiatto(piatto);
  const briciole = [
    { nome: PAGINE.menu.breve, href: PAGINE.menu.percorso },
    { nome: piatto.nome, href: scheda.percorso },
  ];

  return (
    <>
      <JsonLd
        dati={[
          ...nodiPagina({
            percorso: scheda.percorso,
            nome: piatto.nome,
            descrizione: scheda.descrizione,
            tipo: "ItemPage",
            immagine: piatto.img,
            briciole,
            mainEntity: { "@id": idPiatto(piatto.id) },
            dataModifica: AGGIORNAMENTO,
          }),
          nodoPiatto(piatto, true),
        ]}
      />
      <article className="testata">
        <div className="wrap">
          <Briciole voci={briciole} />
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div className="foto-piatto smusso relative aspect-[4/5] overflow-hidden bg-paper-2 lg:sticky lg:top-[calc(var(--nav-h)+24px)] lg:self-start">
              <Image
                src={piatto.img}
                alt={`Foto illustrativa per ${piatto.nome}`}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                loading="eager"
                fetchPriority="high"
                className="object-cover"
              />
              {/* Le impostazioni di Matteo arrivano dal browser: il segno sta sopra la foto e non sposta la pagina. */}
              <BollinoNonDisponibile piattoId={piatto.id} className="absolute top-4 left-4" />
              <span className="absolute right-3 bottom-3 bg-paper px-3 py-1 text-xs text-ink">Foto illustrativa</span>
            </div>

            <div>
              <TagAllenamento tipo={piatto.allenamento} />
              <h1 className="titolo mt-5">{piatto.nome}</h1>
              <p className="lead mt-5">{piatto.descrizione}</p>

              <div className="mt-10 border-t-[3px] border-ink pt-6">
                <NumeriMacro macro={piatto} />
                <BarraComposizione macro={piatto} className="mt-5" />
                <p className="mt-3 text-sm text-muted">
                  Porzione da <span className="num">{piatto.grammi}</span> g · cucinato a Pescara il giorno stesso del
                  ritiro o della consegna · valori per porzione intera
                </p>
              </div>

              <div className="mt-10">
                <AggiungiAllaSettimana piattoId={piatto.id} />
              </div>

              <section className="mt-14">
                <h2 className="occhiello">Perché funziona</h2>
                <p className="mt-4 text-lg leading-relaxed">{piatto.motivo}</p>
                {consiglio ? (
                  <p className="mt-4 text-muted">
                    Ideale nei giorni di <strong className="text-ink">{consiglio.nome.toLowerCase()}</strong>:{" "}
                    {consiglio.regola.toLowerCase()}
                  </p>
                ) : null}
              </section>

              <section className="mt-12">
                <h2 className="occhiello">Ingredienti</h2>
                <ul className="mt-4">
                  {piatto.ingredienti.map((i) => (
                    <li
                      key={i.nome}
                      className="flex justify-between gap-4 border-b py-2.5"
                      style={{ borderColor: "var(--line)" }}
                    >
                      <span>{i.nome}</span>
                      <span className="num text-sm text-muted">{i.grammi ? `${i.grammi} g` : i.nota}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-12">
                <h2 className="occhiello">Allergeni</h2>
                <p className="mt-4">
                  {piatto.allergeni.length ? piatto.allergeni.join(", ") : "Nessuno dei 14 allergeni principali."}
                </p>
              </section>
            </div>
          </div>
        </div>
      </article>

      <section className="sezione carta-2">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="titolo-s">Altri piatti</h2>
            <Link href="/pasti-proteici-pescara" className="link">
              Tutti i piatti a confronto, per proteine
            </Link>
          </div>
          <ul className="mt-8 grid gap-8 sm:grid-cols-3">
            {altri.map((p) => (
              <li key={p.id}>
                <CartaPiatto piatto={p} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
