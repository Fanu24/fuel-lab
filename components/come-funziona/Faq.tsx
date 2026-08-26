import type { ReactNode } from "react";

export interface Domanda {
  q: string;
  a: ReactNode;
}

/**
 * Accordion costruito su <details>/<summary> nativi.
 *
 * Nessuna libreria e nessun 'use client': apertura, navigazione da tastiera, ruolo
 * ARIA e la ricerca del browser dentro al testo chiuso arrivano gratis dal markup.
 * Un accordion scritto a mano con useState li perderebbe tutti e quattro.
 *
 * Le domande NON sono a esclusione reciproca (niente attributo name): chi confronta
 * "posso saltare una settimana" con "come disdico" vuole leggerle affiancate.
 */

const CSS = `
.cf-q{ border-bottom:1px solid var(--hair-soft); }
.cf-q:first-child{ border-top:1px solid var(--hair-soft); }

.cf-q > summary{
  display:flex; align-items:flex-start; gap:20px;
  padding:23px 0; cursor:pointer;
  list-style:none;
}
/* i due marcatori nativi: uno per Safari, uno per il resto */
.cf-q > summary::-webkit-details-marker{ display:none; }
.cf-q > summary::marker{ content:""; }

.cf-t{
  flex:1; margin:0;
  font-family:var(--font-ui); font-size:17.5px; line-height:1.34; color:#fff;
  font-variation-settings:"wdth" 104, "wght" 600;
  letter-spacing:-.005em;
  transition:color .4s var(--e-out);
}
.cf-q > summary:hover .cf-t{ color:var(--color-lime); }

.cf-x{
  position:relative; flex:0 0 auto; margin-top:1px;
  width:30px; height:30px; border-radius:999px;
  border:1px solid var(--hair); background:rgba(223,255,62,.06);
  transition:transform .55s var(--e-over), background-color .45s var(--e-out), border-color .45s var(--e-out);
}
.cf-x::before, .cf-x::after{
  content:""; position:absolute; left:50%; top:50%;
  width:11px; height:1.5px; border-radius:2px; background:var(--color-lime);
  transform:translate(-50%,-50%);
}
.cf-x::after{ transform:translate(-50%,-50%) rotate(90deg); }
/* il piu diventa una x ruotando il cerchio intero, non le due stanghette */
.cf-q[open] .cf-x{ transform:rotate(135deg); background:var(--color-lime); border-color:var(--color-lime); }
.cf-q[open] .cf-x::before, .cf-q[open] .cf-x::after{ background:var(--color-ink); }

.cf-a{
  padding:0 0 27px; max-width:64ch;
  font-size:15.5px; line-height:1.68; color:var(--color-ink);
  animation:cf-apri .5s var(--e-out) both;
}
.cf-a strong{ color:#fff; font-variation-settings:"wght" 650; }
/* sotto prefers-reduced-motion globals.css azzera gia la durata */
@keyframes cf-apri{ from{ opacity:0; transform:translateY(-9px); } to{ opacity:1; transform:none; } }

@media (max-width:768px){
  .cf-t{ font-size:16.5px; }
  .cf-q > summary{ gap:14px; padding:20px 0; }
}
`;

export default function Faq({ domande }: { domande: Domanda[] }) {
  return (
    <div>
      {/* href + precedence: React 19 lo solleva nel <head> e lo deduplica da solo */}
      <style href="fuel-faq" precedence="medium" dangerouslySetInnerHTML={{ __html: CSS }} />
      {domande.map((d) => (
        <details key={d.q} className="cf-q">
          <summary>
            <h3 className="cf-t">{d.q}</h3>
            <i className="cf-x" aria-hidden="true" />
          </summary>
          <div className="cf-a">{d.a}</div>
        </details>
      ))}
    </div>
  );
}
