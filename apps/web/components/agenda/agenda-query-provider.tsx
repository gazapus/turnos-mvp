'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

type AgendaQueryProviderProps = {
  children: ReactNode;
};

/**
 * Proveedor de TanStack Query acotado a la sección de agenda.
 * Configura staleTime/gcTime en 0 para no cachear datos de turnos.
 *
 * @param props - Children de la agenda.
 * @returns QueryClientProvider con política sin caché.
 */
export function AgendaQueryProvider({ children }: AgendaQueryProviderProps) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0,
            gcTime: 0,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
