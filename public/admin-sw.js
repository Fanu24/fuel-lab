// Service worker del pannello di Matteo (scope /admin): mostra le notifiche di nuovi ordini.
// Non gestisce le richieste di rete: il pannello non funziona senza connessione e non deve restare in cache.

self.addEventListener("push", (event) => {
  let dati = {};
  try {
    dati = event.data ? event.data.json() : {};
  } catch {
    dati = {};
  }
  const titolo = dati.title || "FUEL LAB";
  const corpo = dati.body || "Nuovo ordine dal sito";
  const url = dati.url || "/admin?vista=nuovi";
  event.waitUntil(
    self.registration.showNotification(titolo, {
      body: corpo,
      icon: "/pannello-icon-192.png",
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/admin", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const finestre = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const aperta = finestre.find((c) => c.url.startsWith(self.registration.scope));
      if (aperta) {
        if ("navigate" in aperta) await aperta.navigate(url);
        return aperta.focus();
      }
      return self.clients.openWindow(url);
    })(),
  );
});
