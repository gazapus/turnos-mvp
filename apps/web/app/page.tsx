import { HealthStatusPanel } from '@/components/health-status-panel';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-zinc-950">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Turnos MVP
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Sistema de Gestión de Turnos
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400">
            Pantalla de prueba — frontend Next.js conectado al backend NestJS
          </p>
        </div>

        <HealthStatusPanel />
      </main>
    </div>
  );
}
