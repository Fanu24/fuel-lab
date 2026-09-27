import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import TrePassi from "@/components/home/TrePassi";
import Allenamento from "@/components/home/Allenamento";
import LaCucina from "@/components/home/LaCucina";
import PiattiScelti from "@/components/home/PiattiScelti";
import ChiusuraCta from "@/components/home/ChiusuraCta";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/* La home e' solo composizione. La palestra comanda (hero, consigli per
   allenamento, sulla notte) e la cucina risponde (la cucina, i piatti, sulla
   carta). Ogni sezione vive in components/home. */
export default function Home() {
  return (
    <>
      <Hero />
      <TrePassi />
      <Allenamento />
      <LaCucina />
      <PiattiScelti />
      <ChiusuraCta />
    </>
  );
}
