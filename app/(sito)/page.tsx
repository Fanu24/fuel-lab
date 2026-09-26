import Hero from "@/components/home/Hero";
import TrePassi from "@/components/home/TrePassi";
import Allenamento from "@/components/home/Allenamento";
import PiattiScelti from "@/components/home/PiattiScelti";
import ChiusuraCta from "@/components/home/ChiusuraCta";

/* La home e' solo composizione: cinque sezioni, alternate fra notte (lo sport)
   e carta (il cibo). Ogni sezione vive in components/home. */
export default function Home() {
  return (
    <>
      <Hero />
      <TrePassi />
      <Allenamento />
      <PiattiScelti />
      <ChiusuraCta />
    </>
  );
}
