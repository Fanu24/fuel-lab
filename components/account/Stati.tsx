/* Le attese mostrate prima che il JavaScript legga la query string: finiscono
   nell'HTML statico come fallback di <Suspense>, quindi niente hook qui. Ognuna
   ha il suo H1, cosi' la pagina ne ha sempre uno. */

export function AttesaAccount() {
  return (
    <div aria-busy="true" className="acc-schermata">
      <header className="acc-testata wrap">
        <p className="occhiello">Il tuo spazio</p>
        <h1 className="titolo mt-4">Area cliente.</h1>
        <p className="mt-3 text-muted" role="status">Carico il tuo spazio…</p>
      </header>
      <div className="wrap pb-[var(--sezione)]">
        <div className="acc-sottonav-finta" aria-hidden="true" />
        <div className="mt-8 grid gap-3" aria-hidden="true">
          <div className="acc-scheletro" style={{ width: "70%" }} />
          <div className="acc-scheletro" style={{ width: "55%" }} />
          <div className="acc-scheletro" style={{ width: "40%" }} />
        </div>
      </div>
    </div>
  );
}

export function AttesaAccesso() {
  return (
    <section className="acc-testata acc-schermata wrap pb-[var(--sezione)]" aria-busy="true">
      <p className="occhiello">Il tuo spazio FUEL LAB</p>
      <h1 className="titolo mt-5">Accedi.</h1>
      <p className="mt-4 text-muted" role="status">Carico l’accesso…</p>
    </section>
  );
}

export function AttesaReimposta() {
  return (
    <section className="acc-testata acc-schermata wrap pb-[var(--sezione)]" aria-busy="true">
      <p className="occhiello">Recupero dell’accesso</p>
      <h1 className="titolo mt-5">Nuova password.</h1>
      <p className="mt-4 text-muted" role="status">Carico…</p>
    </section>
  );
}
