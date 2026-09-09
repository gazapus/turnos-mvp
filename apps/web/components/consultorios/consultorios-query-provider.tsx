'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

type ConsultoriosQueryProviderProps = {
  children: ReactNode;
};

/**
 * QueryClient acotado a la pantalla de consultorios.
 *
 * @param props - Children de la grilla.
 * @returns Provider sin caché agresiva.
 */
export function ConsultoriosQueryProvider({
  children,
}: ConsultoriosQueryProviderProps) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0,
            gcTime: 0,
            retry: 1,
            retryDelay: 0,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
