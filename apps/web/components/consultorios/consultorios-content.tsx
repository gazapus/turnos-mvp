'use client';

import { ConsultoriosGrid } from './consultorios-grid';
import { ConsultoriosQueryProvider } from './consultorios-query-provider';

/**
 * Leaf de Consultorios: provider de query + grilla de asignación.
 *
 * @returns Contenido interactivo de la pantalla.
 */
export function ConsultoriosContent() {
  return (
    <ConsultoriosQueryProvider>
      <ConsultoriosGrid />
    </ConsultoriosQueryProvider>
  );
}
