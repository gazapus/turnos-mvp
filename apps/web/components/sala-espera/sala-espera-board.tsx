import type { LlamadoSalaEsperaDto } from '@turnos/shared-types';
import { Maximize } from 'lucide-react';
import Image from 'next/image';
import type { Ref } from 'react';

import {
  SALA_ESPERA_FOOTER_LEFT,
  SALA_ESPERA_FOOTER_RIGHT,
  SALA_ESPERA_MAX_LLAMADOS,
  SALA_ESPERA_TAGLINE,
} from '@/lib/sala-espera';

const LOGO_SRC = '/images/login/logo_completo.png';

const TAGLINE_LINES = SALA_ESPERA_TAGLINE.split(', ');

type SalaEsperaBoardProps = {
  items: LlamadoSalaEsperaDto[];
  dateLabel: string;
  timeLabel: string;
  panelRef: Ref<HTMLDivElement>;
  onFullscreen: () => void;
};

/**
 * Tablero de avisos de sala de espera (composición de monitor 16:9).
 *
 * @param props - Llamados, reloj y control de pantalla completa.
 * @returns Tablero visual.
 */
export function SalaEsperaBoard({
  items,
  dateLabel,
  timeLabel,
  panelRef,
  onFullscreen,
}: SalaEsperaBoardProps) {
  const slots = Array.from(
    { length: SALA_ESPERA_MAX_LLAMADOS },
    (_, index) => items[index],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 justify-end">
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold uppercase text-on-elevated hover:bg-surface-elevated"
          onClick={onFullscreen}
        >
          <Maximize className="size-4" aria-hidden />
          Pantalla completa
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div
          ref={panelRef}
          className="sala-espera-panel sala-espera-screen"
        >
          <header className="relative z-[1] flex h-[16%] shrink-0 items-center justify-between overflow-hidden px-[5.2%] pt-[2%] pb-[1%]">
            <Image
              src={LOGO_SRC}
              alt="Hospital Clínica Salud"
              width={235}
              height={72}
              className="h-[85%] w-auto max-w-[22%] object-contain object-left"
              priority
            />
            <div className="flex items-center gap-[1.4vw] text-on-elevated">
              <p className="font-sans text-[clamp(1rem,1.55vw,1.875rem)] font-medium whitespace-nowrap">
                {dateLabel}
              </p>
              <p className="font-heading text-[clamp(2rem,3.5vw,4.125rem)] font-bold leading-none tracking-tight tabular-nums">
                {timeLabel}
              </p>
              <p className="border-l-2 border-motto-rule pl-[1.2vw] font-heading text-[clamp(0.8125rem,1.2vw,1.375rem)] font-semibold leading-tight whitespace-nowrap">
                {`${TAGLINE_LINES[0]},`}
                <br />
                {TAGLINE_LINES[1]}
              </p>
            </div>
          </header>

          <section className="sala-espera-glass relative z-[1] mx-[4.2%] flex h-[71.5%] flex-col rounded-2xl px-[1.8%] pt-[1.6%] pb-[2%]">
            <div className="grid h-[10%] grid-cols-[33%_67%] items-center text-center font-heading text-[clamp(1.1875rem,2vw,2.375rem)] font-extrabold tracking-wide text-on-elevated">
              <div className="border-r-2 border-column-rule">CONSULTORIO</div>
              <div>PACIENTE</div>
            </div>
            <div className="grid min-h-0 flex-1 grid-rows-[1.55fr_repeat(4,1fr)] gap-[1.1%]">
              {slots.map((llamado, index) =>
                llamado ? (
                  <LlamadoRow
                    key={llamado.id}
                    llamado={llamado}
                    featured={index === 0}
                  />
                ) : (
                  <div key={`empty-${String(index)}`} />
                ),
              )}
            </div>
          </section>

          <footer className="relative z-[1] flex h-[12.5%] items-center gap-[1.3vw] px-[5%] font-sans text-[clamp(0.875rem,1.25vw,1.5rem)] text-on-elevated">
            <p className="flex items-center gap-[0.65vw] whitespace-nowrap">
              <InfoGlyph className="size-[clamp(1.25rem,1.8vw,2.0625rem)] shrink-0 text-on-elevated" />
              <span>{SALA_ESPERA_FOOTER_LEFT}</span>
            </p>
            <span className="mx-[1vw] h-px flex-1 bg-rule-soft opacity-70" />
            <p className="whitespace-nowrap">{SALA_ESPERA_FOOTER_RIGHT}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}

type LlamadoRowProps = {
  llamado: LlamadoSalaEsperaDto;
  featured: boolean;
};

/**
 * Fila de llamado: número de consultorio y paciente.
 *
 * @param props - Llamado y si es el vigente.
 * @returns Fila del tablero.
 */
function LlamadoRow({ llamado, featured }: LlamadoRowProps) {
  const nombre = `${llamado.pacienteNombre} ${llamado.pacienteApellido}`;
  return (
    <article
      className={[
        'sala-espera-row grid min-h-0 grid-cols-[33%_67%] items-center overflow-hidden rounded-md',
        featured ? 'sala-espera-row-featured' : '',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-[72%] items-center justify-center border-r-2 border-column-rule font-heading leading-none font-bold tabular-nums',
          featured
            ? 'text-[clamp(2.375rem,4.8vw,5.5rem)] text-brand-foreground'
            : 'text-[clamp(1.5rem,3vw,3.625rem)] text-on-elevated',
        ].join(' ')}
      >
        {llamado.consultorioNumero}
      </span>
      <p
        className={[
          'flex min-w-0 items-center justify-center gap-[1.8vw] px-[2vw] font-heading tracking-wide',
          featured
            ? 'text-[clamp(2.125rem,4.1vw,4.75rem)] font-semibold text-brand-foreground'
            : 'text-[clamp(1.4375rem,2.9vw,3.5rem)] font-medium text-on-elevated',
        ].join(' ')}
      >
        <PatientGlyph
          className={
            featured
              ? 'size-[clamp(2.125rem,3.5vw,4rem)] shrink-0 text-brand-foreground opacity-90'
              : 'size-[clamp(1.75rem,3.1vw,3.625rem)] shrink-0 text-brand-subtle'
          }
        />
        <span className="truncate uppercase">{nombre}</span>
      </p>
    </article>
  );
}

/**
 * Silueta de paciente (ícono del tablero).
 *
 * @param props - Clases de tamaño y color.
 * @returns SVG decorativo.
 */
function PatientGlyph({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="19" r="11" fill="currentColor" />
      <path
        d="M11 55c1.8-13.8 10.3-21 21-21s19.2 7.2 21 21"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Ícono de información del pie del monitor.
 *
 * @param props - Clases de tamaño y color.
 * @returns SVG decorativo.
 */
function InfoGlyph({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="27" fill="currentColor" />
      <circle cx="32" cy="19" r="3.6" fill="var(--brand-foreground)" />
      <rect
        x="29"
        y="27"
        width="6"
        height="19"
        rx="3"
        fill="var(--brand-foreground)"
      />
    </svg>
  );
}
