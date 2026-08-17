import type { VistaAgenda } from '@turnos/shared-types';

const PLACEHOLDER_LABELS: Record<Exclude<VistaAgenda, 'lista'>, string> = {
  dia: 'Día',
  semana: 'Semana',
  mes: 'Mes',
};

type AgendaVistaPlaceholderProps = {
  vista: Exclude<VistaAgenda, 'lista'>;
};

/**
 * Contenedor vacío seleccionable para vistas Día, Semana y Mes.
 *
 * @param props - Vista activa sin implementación de datos.
 * @returns Placeholder informativo.
 */
export function AgendaVistaPlaceholder({ vista }: AgendaVistaPlaceholderProps) {
  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
      Vista {PLACEHOLDER_LABELS[vista]} — próximamente.
    </div>
  );
}
