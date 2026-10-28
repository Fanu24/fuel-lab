import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PIATTI, getPiatto } from "@/lib/catalogo";
import { NumeriMacro } from "@/components/ui/Macro";
import { nutrizioneDisponibile, statoNutrizione } from "@/lib/nutrizione";
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
            <div className="foto-piatto smusso relative aspect-[4/3] overflow-hidden bg-paper-2 lg:sticky lg:top-[calc(var(--nav-h)+24px)] lg:aspect-[4/5] lg:self-start">
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
              <h1 className="titolo mt-5">{piatto.nome}</h1>
              <p className="lead mt-5">{piatto.descrizione}</p>
              <div className="mt-7">
                <AggiungiAllaSettimana piattoId={piatto.id} />
              </div>
              <p className="mt-6 text-sm"><strong>Allergeni:</strong> {piatto.allergeniDaConfermare ? "da confermare con Matteo prima dell’ordine" : piatto.allergeni.length ? piatto.allergeni.join(", ") : "chiedi conferma a Matteo"}.</p>
              <details className="mt-7 border-t border-ink/20 py-4">
                <summary className="min-h-11 cursor-pointer font-semibold">Ingredienti e quantità</summary>
                <ul className="mt-4">
                  {piatto.ingredienti.map((i) => (
                    <li
                      key={i.nome}
                      className="flex justify-between gap-4 border-b py-2.5"
                      style={{ borderColor: "var(--line)" }}
                    >
                      <span>{i.nome}</span>
                      <span className="text-right text-sm text-muted">{i.grammi ? `${i.grammi} g${i.nota ? ` · ${i.nota}` : ""}` : i.nota}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-muted">{piatto.notaRicetta ?? "Quantità per una porzione. Riso e pasta pesati cotti; il peso del piatto finito può variare."}</p>
              </details>
              <details className="border-y border-ink/20 py-4">
                <summary className="min-h-11 cursor-pointer font-semibold">Calorie e valori nutrizionali</summary>
                {nutrizioneDisponibile(piatto.id) ? <NumeriMacro macro={piatto} className="mt-4" /> : null}
                <p className="mt-4 text-sm text-muted">{statoNutrizione(piatto.id).nota}</p>
              </details>
            </div>
          </div>
        </div>
      </article>

      <section className="sezione carta-2">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="titolo-s">Altri piatti</h2>
            <Link href="/menu" className="link">Tutto il menu</Link>
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
