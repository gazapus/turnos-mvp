/**
 * Stub de la agenda del médico.
 *
 * @returns Página placeholder post-login (rol MEDICO).
 */
export default function MiAgendaPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8">
      <h1 className="font-heading text-3xl font-bold text-foreground">
        Mi agenda
      </h1>
      <p className="text-muted-foreground">Agenda del médico — próximamente.</p>
    </main>
  );
}
