'use client';

import { useEffect, useState } from 'react';

type HealthResponse = {
  status: string;
  service: string;
  database: 'connected' | 'error';
  timestamp: string;
};

/**
 * Panel que muestra el estado de salud del backend y la base de datos.
 * Leaf component cliente: requiere fetch en el navegador.
 *
 * @returns Sección con el estado del servicio, API y conexión a DB.
 */
export function HealthStatusPanel() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  useEffect(() => {
    async function fetchHealth() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${apiUrl}/api/health`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as HealthResponse;
        setHealth(data);
      } catch (err) {
        setHealth(null);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    fetchHealth();
  }, [apiUrl]);

  return (
    <section className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Estado del sistema (prueba)
      </h2>

      {loading && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Consultando backend...
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          No se pudo conectar con la API: {error}
        </div>
      )}

      {health && !error && (
        <dl className="grid gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Servicio</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              {health.service}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Estado API</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              {health.status}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Base de datos</dt>
            <dd
              className={`font-medium ${
                health.database === 'connected'
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-700 dark:text-red-400'
              }`}
            >
              {health.database === 'connected' ? 'Conectada' : 'Error'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Timestamp</dt>
            <dd className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
              {health.timestamp}
            </dd>
          </div>
        </dl>
      )}

      <p className="mt-4 text-xs text-zinc-500">
        Endpoint: {apiUrl}/api/health
      </p>
    </section>
  );
}
