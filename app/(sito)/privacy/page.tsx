import JsonLd from "@/components/seo/JsonLd";
import { AGGIORNAMENTO, PAGINE, metadatiPagina } from "@/components/seo/pagine";
import { nodiPagina } from "@/components/seo/schema";

const PAGINA = PAGINE.privacy;

export const metadata = metadatiPagina(PAGINA);

export default function PrivacyPage() {
  return (
    <article>
      <JsonLd
        dati={nodiPagina({
          percorso: PAGINA.percorso,
          nome: PAGINA.titolo,
          descrizione: PAGINA.descrizione,
          briciole: [{ nome: PAGINA.breve, href: PAGINA.percorso }],
          dataModifica: AGGIORNAMENTO,
        })}
      />
      <header className="testata">
        <div className="wrap">
          <p className="occhiello">Informazioni legali</p>
          <h1 className="titolo-xl mt-6">Privacy e cookie.</h1>
          <p className="lead mt-6 max-w-[68ch]">
            Questa informativa spiega quali dati tratta il sito fuelchef.it, per quali motivi e quali scelte puoi fare.
            Ultimo aggiornamento: 27 settembre 2026.
          </p>
        </div>
      </header>

      <div className="wrap max-w-4xl pb-[var(--sezione)] text-base leading-relaxed text-muted">
        <section className="mt-10">
          <h2 className="titolo-s text-ink">Titolare del trattamento</h2>
          <p className="mt-4">
            Il titolare è <strong className="text-ink">Matteo Pattanè</strong>, contattabile presso Via del Santuario
            214, Pescara, Italia. Per le richieste relative ai dati personali puoi scrivere a{" "}
            <a className="link" href="mailto:privacy@fuelchef.it">privacy@fuelchef.it</a>.
          </p>
          <p className="mt-4">Ragione sociale e Partita IVA dell’attività: in aggiornamento.</p>
        </section>

        <section className="mt-10">
          <h2 className="titolo-s text-ink">Richieste e account cliente</h2>
          <p className="mt-4">
            Se crei un account, salviamo nome, indirizzo email, credenziali di accesso protette, sessioni, recapiti,
            preferenze, menu salvati e richieste inviate nel database Cloudflare D1. Matteo può vedere le richieste,
            i piatti scelti e i dati necessari a confermare, preparare e consegnare o organizzare il ritiro. Le note
            interne di gestione non sono mostrate al cliente. Le richieste non diventano ordini confermati finché
            Matteo non ne concorda disponibilità e dettagli.
          </p>
          <p className="mt-4">
            La settimana composta può restare anche nella memoria locale del browser. Se usi un pulsante WhatsApp,
            il testo viene passato a WhatsApp come messaggio precompilato solo quando lo apri; decidi tu se inviarlo.
            Da quel momento Meta tratta i dati secondo la propria informativa. Non inserire nelle note dati sanitari
            o altre informazioni delicate. Il trattamento dell’account e delle richieste è necessario a fornire il
            servizio richiesto e a svolgere attività precontrattuali; eventuali obblighi di legge possono richiedere
            la conservazione di alcuni dati.
          </p>
          <p className="mt-4">
            Puoi chiedere la cancellazione dell’account e dei dati collegati scrivendo a{" "}
            <a className="link" href="mailto:privacy@fuelchef.it">privacy@fuelchef.it</a>. Le richieste e i dati del
            profilo sono conservati finché servono a gestire il rapporto e poi secondo gli eventuali obblighi di
            legge; i dati non più necessari vengono eliminati. Se accedi con Google o Apple, il relativo fornitore
            gestisce la fase di autenticazione secondo la propria informativa.
          </p>
          <p className="mt-4">
            Per verificare l’indirizzo email e gestire il recupero della password, il sito invia messaggi tramite
            Resend. A questo fornitore vengono comunicati l’indirizzo destinatario e il contenuto tecnico del
            messaggio; non vengono inviate le password. La casella di posta del dominio rimane presso Aruba.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="titolo-s text-ink">Google Analytics</h2>
          <p className="mt-4">
            Google Analytics 4 viene caricato soltanto dopo che selezioni “Accetta Analytics”. Se rifiuti, il tag non
            viene caricato e il sito non invia a Google eventi o segnali relativi alla tua visita. Puoi modificare la
            scelta dal link “Impostazioni privacy” nel footer.
          </p>
          <p className="mt-4">
            Dopo il consenso, Google Analytics può trattare identificativi online, pagine visitate, interazioni,
            informazioni tecniche del browser e del dispositivo e una localizzazione approssimativa, per produrre
            statistiche d’uso. La base giuridica è il consenso, che puoi revocare in qualsiasi momento. I cookie
            Analytics sono impostati con una durata massima di 180 giorni.
          </p>
          <p className="mt-4">
            Dopo lo stesso consenso, il sito registra nel database Cloudflare il numero aggregato di visualizzazioni
            per giorno e percorso, per mostrarlo a Matteo nella dashboard. Questa tabella non contiene nome, email
            o identificativi del visitatore e non viene aggiornata se rifiuti Analytics.
          </p>
          <p className="mt-4">
            I dati sono trattati da Google secondo i suoi termini e la sua informativa. Consulta la{" "}
            <a className="link" href="https://policies.google.com/privacy?hl=it" target="_blank" rel="noreferrer">
              Privacy Policy di Google
            </a>{" "}
            e le informazioni di{" "}
            <a className="link" href="https://support.google.com/analytics/answer/11593727?hl=it" target="_blank" rel="noreferrer">
              Google Analytics sulla raccolta dei dati
            </a>.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="titolo-s text-ink">Cookie e memoria del browser</h2>
          <p className="mt-4">
            Il sito usa memoria locale per ricordare le preferenze del compositore e la tua scelta sui cookie. Se
            accedi, un cookie tecnico di sessione mantiene l’accesso all’account; è necessario per offrirti l’area
            cliente e non richiede il consenso Analytics. Dopo il
            consenso Analytics, Google può usare i cookie <code>_ga</code> e <code>_ga_*</code> per distinguere
            browser e sessioni. Senza consenso non vengono creati cookie Analytics.
          </p>
          <p className="mt-4">
            Per modificare la scelta, usa “Impostazioni privacy” nel footer. Puoi anche cancellare i dati locali dalle
            impostazioni del browser; questo rimuoverà la settimana salvata e la preferenza privacy.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="titolo-s text-ink">Hosting e sicurezza</h2>
          <p className="mt-4">
            Il sito è ospitato da Cloudflare Pages. Come ogni servizio web, l’infrastruttura può trattare dati tecnici
            della connessione, come indirizzo IP, data e ora della richiesta e informazioni necessarie a sicurezza e
            consegna delle pagine, secondo le impostazioni e le informative del fornitore. Consulta la{" "}
            <a className="link" href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer">
              Privacy Policy di Cloudflare
            </a>.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="titolo-s text-ink">I tuoi diritti</h2>
          <p className="mt-4">
            Puoi chiedere accesso, rettifica o cancellazione dei dati personali che Matteo ha ricevuto, limitarne il
            trattamento, opporti o chiedere la portabilità quando applicabile. Puoi revocare il consenso Analytics senza
            pregiudicare i trattamenti svolti prima della revoca e presentare reclamo al Garante per la protezione dei
            dati personali. Per esercitare i diritti, scrivi a privacy@fuelchef.it o a Matteo Pattanè presso Via del Santuario 214, Pescara.
          </p>
        </section>
      </div>
    </article>
  );
}
