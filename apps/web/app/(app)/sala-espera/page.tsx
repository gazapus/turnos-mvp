import { SalaEsperaContent } from '@/components/sala-espera';

/**
 * Pantalla de transmisión de avisos de sala de espera.
 *
 * @returns Tablero de llamados.
 */
export default function SalaEsperaPage() {
  return (
    <section className="flex h-full min-h-0 flex-col">
      <SalaEsperaContent />
    </section>
  );
}
