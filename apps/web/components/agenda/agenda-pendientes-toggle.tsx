'use client';

import { useRouter } from 'next/navigation';

import {
  buildAgendaHref,
  type ParsedAgendaParams,
} from '@/lib/agenda/url-params';

type AgendaPendientesToggleProps = {
  params: ParsedAgendaParams;
};

/**
 * Checkbox "Solo Pendientes": filtra estados en el backend vía URL.
 * Leaf client: actualiza `soloPendientes` y dispara refetch por queryKey.
 *
 * @param props - Params actuales de la URL.
 * @returns Checkbox "Solo Pendientes".
 */
export function AgendaPendientesToggle({
  params,
}: AgendaPendientesToggleProps) {
  const router = useRouter();

  /**
   * Alterna el filtro de pendientes y recarga la vista.
   *
   * @param checked - Nuevo valor del checkbox.
   */
  function handleChange(checked: boolean): void {
    router.replace(
      buildAgendaHref({
        ...params,
        soloPendientes: checked,
      }),
    );
  }

  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
      <input
        type="checkbox"
        className="size-4 cursor-pointer accent-primary"
        checked={params.soloPendientes}
        onChange={(event) => handleChange(event.target.checked)}
      />
      <span>Solo Pendientes</span>
    </label>
  );
}
