import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PIATTI, getPiatto } from "@/lib/catalogo";
import { CONSIGLI } from "@/lib/consigli";
import TagAllenamento from "@/components/ui/TagAllenamento";
import { BarraComposizione, NumeriMacro } from "@/components/ui/Macro";
import AggiungiAllaSettimana from "@/components/menu/AggiungiAllaSettimana";
import CartaPiatto from "@/components/menu/CartaPiatto";

/* La scheda del piatto, una pagina vera e non una finestra sopra il menu: si
   condivide con un link, si indicizza, e il tasto indietro fa quello che ci
   si aspetta. Next 16: params e' una Promise. */

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return PIATTI.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getPiatto((await params).id);
  if (!p) return {};
  return { title: p.nome, description: `${p.descrizione} ${p.kcal} kcal, ${p.proteine} g di proteine.` };
}

const GIORNO: Record<string, string> = { lunedi: "il lunedì", giovedi: "il giovedì" };

export default async function PaginaPiatto({ params }: Props) {
  const piatto = getPiatto((await params).id);
  if (!piatto) notFound();

  const consiglio = piatto.allenamento === "entrambi" ? null : CONSIGLI[piatto.allenamento];
  const altri = PIATTI.filter((p) => p.id !== piatto.id).slice(0, 3);

  return (
    <>
      <article className="testata">
        <div className="wrap">
          <Link href="/menu" className="link">
            ← Il menu
          </Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div className="smusso relative aspect-[4/5] overflow-hidden bg-paper-2 lg:sticky lg:top-[calc(var(--nav-h)+24px)] lg:self-start">
              <Image
                src={piatto.img}
                alt={`Foto illustrativa per ${piatto.nome}`}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                loading="eager"
                fetchPriority="high"
                className="object-cover"
              />
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
                  Porzione da <span className="num">{piatto.grammi}</span> g · cucinato {GIORNO[piatto.giorno]}
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
          <h2 className="titolo-s">Altri piatti</h2>
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
