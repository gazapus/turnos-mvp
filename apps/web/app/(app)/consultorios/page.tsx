import { redirect } from 'next/navigation';

import { ConsultoriosContent } from '@/components/consultorios';
import { getSessionUser } from '@/lib/api/auth-server';

/**
 * Pantalla de asignación de consultorios (admin y recepción).
 *
 * @returns Título y grilla de consultorio-médico.
 */
export default async function ConsultoriosPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-heading text-3xl font-bold text-foreground">
        Consultorios
      </h1>
      <ConsultoriosContent />
    </section>
  );
}
