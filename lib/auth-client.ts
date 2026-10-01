"use client";

import { createAuthClient } from "better-auth/react";

// Con la rete bloccata i pulsanti di accesso restavano in attesa per sempre:
// dopo 20 secondi la richiesta si interrompe e AuthPanel mostra l'errore di rete.
export const authClient = createAuthClient({ fetchOptions: { timeout: 20000 } });
