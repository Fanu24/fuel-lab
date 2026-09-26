import Link from "next/link";
import FotoPiena from "@/components/ui/FotoPiena";

/* La 404 sta fuori dal gruppo (sito), quindi senza nav: e' una pagina intera,
   scura, con due uscite chiare. */
export default function NonTrovata() {
  return (
    <main className="notte relative grid min-h-svh place-items-center overflow-hidden px-5">
      <FotoPiena foto="presa" velo="forte" />
      <div className="relative max-w-xl text-center">
        <p className="occhiello justify-center">Errore 404</p>
        <h1 className="titolo-xl mt-6">Serie saltata.</h1>
        <p className="mt-6 text-steel">Questa pagina non esiste, o non esiste più. Il menu invece c&apos;è sempre.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-4">
          <Link href="/" className="btn btn-lime">
            Torna alla home
          </Link>
          <Link href="/menu" className="link self-center">
            Guarda il menu
          </Link>
        </div>
      </div>
    </main>
  );
}
