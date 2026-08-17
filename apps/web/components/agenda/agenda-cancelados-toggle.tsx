'use client';

import { useRouter } from 'next/navigation';

import {
  buildAgendaHref,
  type ParsedAgendaParams,
} from '@/lib/agenda/url-params';

type AgendaCanceladosToggleProps = {
  params: ParsedAgendaParams;
};

/**
 * Checkbox de visibilidad de turnos cancelados (solo cliente, sin refetch).
 * Leaf client: filtra filas ya cargadas y sincroniza query param `cancelados`.
 *
 * @param props - Params actuales de la URL.
 * @returns Checkbox "Cancelados".
 */
export function AgendaCanceladosToggle({
  params,
}: AgendaCanceladosToggleProps) {
  const router = useRouter();

  /**
   * Alterna visibilidad de cancelados en memoria vía URL.
   *
   * @param checked - Nuevo valor del checkbox.
   */
  function handleChange(checked: boolean): void {
    router.replace(
      buildAgendaHref({
        ...params,
        cancelados: checked,
      }),
    );
  }

  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
      <input
        type="checkbox"
        className="size-4 cursor-pointer accent-primary"
        checked={params.cancelados}
        onChange={(event) => handleChange(event.target.checked)}
      />
      Cancelados
    </label>
  );
}
