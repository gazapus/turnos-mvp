import { getSessionUser } from '@/lib/api/auth-server';
import { parseAgendaUrlParams } from '@/lib/agenda/url-params';
import { redirect } from 'next/navigation';

import { AgendaContent } from '@/components/agenda/agenda-content';

type AgendaPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Página de Agenda de Turnos: Server Component que hidrata filtros desde URL.
 *
 * @param props - Query params de Next.js App Router.
 * @returns Layout de agenda con defaults por rol.
 */
export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const resolvedParams = await searchParams;
  const params = parseAgendaUrlParams(resolvedParams, user);

  return <AgendaContent user={user} params={params} />;
}
