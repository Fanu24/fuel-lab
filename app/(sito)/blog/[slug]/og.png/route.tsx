import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { ARTICOLI, articoloPerSlug, categoriaPerId, minutiLettura } from "@/lib/blog";

/* L’anteprima social di ogni guida, 1200×630, generata al build.

   Perché una route "og.png" e non il file speciale opengraph-image.tsx: dentro
   il gruppo (sito) Next aggiunge all’URL un suffisso senza estensione
   (opengraph-image-abc123), e con l’export statico Cloudflare servirebbe il
   file senza content-type d’immagine (e _headers impone nosniff). Qui il file
   si chiama davvero og.png, quindi arriva come image/png. */

export const dynamic = "force-static";

export function generateStaticParams() {
  return ARTICOLI.map(({ slug }) => ({ slug }));
}

const CARTA = "#f3efe6";
const INCHIOSTRO = "#121412";
const NOTTE = "#0e100f";
const ACCIAIO = "#a3aba5";
const LIME = "#dfff3e";

function corpoTitolo(titolo: string): number {
  if (titolo.length <= 40) return 76;
  if (titolo.length <= 56) return 66;
  if (titolo.length <= 72) return 58;
  return 50;
}

export async function GET(_richiesta: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const articolo = articoloPerSlug(slug);
  if (!articolo) return new Response("Guida non trovata", { status: 404 });

  const categoria = categoriaPerId(articolo.categoria);
  const logo = await readFile(join(process.cwd(), "public", "logo-fuellab.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: CARTA, color: INCHIOSTRO }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flexGrow: 1,
            padding: "56px 72px 52px 72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- dentro ImageResponse serve un <img> semplice */}
            <img src={logoSrc} width={256} height={84} alt="" />
            <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, textTransform: "uppercase" }}>Blog</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: 44, height: 8, background: INCHIOSTRO, marginRight: 18 }} />
              <div style={{ display: "flex", fontSize: 24, letterSpacing: 5, textTransform: "uppercase" }}>
                {categoria?.nome ?? "Guide"}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 22,
                maxWidth: 1040,
                fontSize: corpoTitolo(articolo.titolo),
                lineHeight: 1.08,
                letterSpacing: -1,
              }}
            >
              {articolo.titolo}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 96,
            padding: "0 72px",
            background: NOTTE,
            color: CARTA,
            fontSize: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 16, height: 16, background: LIME, marginRight: 18 }} />
            <div style={{ display: "flex" }}>fuelchef.it/blog</div>
          </div>
          <div style={{ display: "flex", color: ACCIAIO }}>
            {`Meal prep a Pescara · ${minutiLettura(articolo)} min di lettura`}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
