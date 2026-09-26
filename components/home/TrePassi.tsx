import Reveal from "@/components/Reveal";

const PASSI = [
  {
    n: "01",
    titolo: "Dici come ti alleni",
    testo: "Cardio, pesi o riposo, giorno per giorno. Ci vogliono dieci secondi.",
  },
  {
    n: "02",
    titolo: "La settimana si riempie",
    testo: "Ogni giorno riceve i piatti giusti per quell'allenamento. Se non ti convincono, li sposti trascinandoli.",
  },
  {
    n: "03",
    titolo: "Matteo cucina e consegna",
    testo: "La richiesta arriva a Matteo su WhatsApp, lui conferma. Lunedì e giovedì, direttamente nel tuo frigo.",
  },
];

export default function TrePassi() {
  return (
    <section className="sezione">
      <div className="wrap">
        <Reveal>
          <p className="occhiello">Come funziona</p>
          <h2 className="titolo mt-5 max-w-[14ch]">Tre passi. Zero calcoli.</h2>
        </Reveal>
        <ol className="mt-14 grid gap-10 md:mt-20 md:grid-cols-3 md:gap-8">
          {PASSI.map((p, i) => (
            <Reveal as="li" key={p.n} delay={i * 90} className="border-t-[3px] border-ink pt-6">
              <span className="num text-sm text-muted">{p.n}</span>
              <h3 className="titolo-s mt-3">{p.titolo}</h3>
              <p className="mt-3 max-w-[34ch] text-muted">{p.testo}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
