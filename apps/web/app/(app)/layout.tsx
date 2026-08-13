import { redirect } from 'next/navigation';

import { AppShell } from '@/components/layout';
import { getSessionUser } from '@/lib/api/auth-server';

/**
 * Layout autenticado: monta el AppShell para todos los paneles del menú.
 *
 * @param props - Children de las rutas bajo `(app)`.
 * @returns Shell con usuario de sesión o redirect a login.
 */
export default async function AuthenticatedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  return <AppShell user={user}>{children}</AppShell>;
}
