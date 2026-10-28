import Reveal from "@/components/Reveal";

/* I tre passi del volantino: "Porti il piano. Cuciniamo noi. Ricevi gia'
   pronto." Gli stessi sulla pagina dell'abbonamento e su ogni scheda. Solo la
   lista: il titolo e lo sfondo li sceglie la sezione che la ospita. */

const PASSI = [
  { n: "01", titolo: "Porti il piano", testo: "Ci lasci la dieta scritta dal tuo nutrizionista." },
  { n: "02", titolo: "Cuciniamo noi", testo: "Prepariamo ogni pasto ai grammi, nel nostro laboratorio a Pescara." },
  { n: "03", titolo: "Ricevi già pronto", testo: "A casa o al ritiro, con giorno e orario concordati. Scaldi e mangi." },
];

export default function Passi() {
  return (
    <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
      {PASSI.map((p, i) => (
        <Reveal as="li" key={p.n} delay={i * 80} className="border-t-[3px] border-ink pt-6">
          <span className="num text-sm text-muted">{p.n}</span>
          <h3 className="titolo-s mt-3">{p.titolo}</h3>
          <p className="mt-3 max-w-[34ch] text-muted">{p.testo}</p>
        </Reveal>
      ))}
    </ol>
  );
}
