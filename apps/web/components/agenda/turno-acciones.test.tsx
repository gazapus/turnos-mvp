import type { ReactElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FeedbackProvider } from '@/components/ui';
import { todayYmd } from '@/lib/agenda/fecha-dia';
import { cancelarTurno, confirmarTurno, finalizarTurno, llamarTurno } from '@/lib/api/turnos-client';
import { TurnoAcciones } from './turno-acciones';

vi.mock('@/lib/api/turnos-client', () => ({
  confirmarTurno: vi.fn(),
  cancelarTurno: vi.fn(),
  llamarTurno: vi.fn(),
  finalizarTurno: vi.fn(),
}));

const mockConfirmarTurno = vi.mocked(confirmarTurno);
const mockCancelarTurno = vi.mocked(cancelarTurno);
const mockLlamarTurno = vi.mocked(llamarTurno);
const mockFinalizarTurno = vi.mocked(finalizarTurno);

/**
 * Render con FeedbackProvider.
 *
 * @param ui - Acciones a montar.
 * @returns Resultado de render.
 */
function renderAcciones(ui: ReactElement) {
  return render(<FeedbackProvider>{ui}</FeedbackProvider>);
}

describe('TurnoAcciones', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('muestra confirmar y cancelar para recepcionista en un PROGRAMADO de hoy', () => {
    renderAcciones(
      <TurnoAcciones
        rol="RECEPCIONISTA"
        estado="PROGRAMADO"
        fecha={todayYmd()}
        turnoId="t1"
        llamado={false}
        onConfirmado={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: /confirmar paciente/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /cancelar turno/i }),
    ).toBeInTheDocument();
  });

  it('oculta confirmar si la fecha no es hoy y sigue mostrando cancelar', () => {
    renderAcciones(
      <TurnoAcciones
        rol="RECEPCIONISTA"
        estado="PROGRAMADO"
        fecha="2099-01-15"
        turnoId="t1"
        llamado={false}
        onConfirmado={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /confirmar paciente/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /cancelar turno/i }),
    ).toBeInTheDocument();
  });

  it('oculta confirmar si el turno ya está confirmado y muestra cancelar', () => {
    renderAcciones(
      <TurnoAcciones
        rol="RECEPCIONISTA"
        estado="CONFIRMADO"
        fecha={todayYmd()}
        turnoId="t1"
        llamado={false}
        onConfirmado={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /confirmar paciente/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /cancelar turno/i }),
    ).toBeInTheDocument();
  });

  it('oculta cancelar en ATENDIDO, AUSENTE y CANCELADO', () => {
    const { rerender } = renderAcciones(
      <TurnoAcciones
        rol="RECEPCIONISTA"
        estado="ATENDIDO"
        fecha={todayYmd()}
        turnoId="t1"
        llamado={false}
        onConfirmado={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /cancelar turno/i }),
    ).not.toBeInTheDocument();

    rerender(
      <FeedbackProvider>
        <TurnoAcciones
          rol="RECEPCIONISTA"
          estado="AUSENTE"
          fecha={todayYmd()}
          turnoId="t1"
          llamado={false}
          onConfirmado={vi.fn()}
        />
      </FeedbackProvider>,
    );
    expect(
      screen.queryByRole('button', { name: /cancelar turno/i }),
    ).not.toBeInTheDocument();

    rerender(
      <FeedbackProvider>
        <TurnoAcciones
          rol="RECEPCIONISTA"
          estado="CANCELADO"
          fecha={todayYmd()}
          turnoId="t1"
          llamado={false}
          onConfirmado={vi.fn()}
        />
      </FeedbackProvider>,
    );
    expect(
      screen.queryByRole('button', { name: /cancelar turno/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /confirmar paciente/i }),
    ).not.toBeInTheDocument();
  });

  it('muestra llamar para médico en confirmado de hoy sin llamado', () => {
    renderAcciones(
      <TurnoAcciones
        rol="MEDICO"
        estado="CONFIRMADO"
        fecha={todayYmd()}
        turnoId="t1"
        llamado={false}
        onConfirmado={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: /llamar al paciente/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /finalizar turno/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /confirmar paciente/i }),
    ).not.toBeInTheDocument();
  });

  it('muestra llamar y finalizar para médico ya llamado', () => {
    renderAcciones(
      <TurnoAcciones
        rol="MEDICO"
        estado="CONFIRMADO"
        fecha={todayYmd()}
        turnoId="t1"
        llamado={true}
        onConfirmado={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: /llamar al paciente/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /finalizar turno/i }),
    ).toBeInTheDocument();
  });

  it('oculta llamar y finalizar si el médico ve un programado', () => {
    renderAcciones(
      <TurnoAcciones
        rol="MEDICO"
        estado="PROGRAMADO"
        fecha={todayYmd()}
        turnoId="t1"
        llamado={false}
        onConfirmado={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /llamar al paciente/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /finalizar turno/i }),
    ).not.toBeInTheDocument();
  });

  it('confirma sin abrir el detalle y notifica al padre', async () => {
    const user = userEvent.setup();
    const onConfirmado = vi.fn();
    mockConfirmarTurno.mockResolvedValue({} as never);

    renderAcciones(
      <TurnoAcciones
        rol="RECEPCIONISTA"
        estado="PROGRAMADO"
        fecha={todayYmd()}
        turnoId="t1"
        llamado={false}
        onConfirmado={onConfirmado}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: /confirmar paciente/i }),
    );
    expect(mockConfirmarTurno).toHaveBeenCalledWith('t1');
    expect(onConfirmado).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText(/turno confirmado correctamente/i),
    ).toBeInTheDocument();
  });

  it('cancela tras aceptar en el dialog y no abre el detalle', async () => {
    const user = userEvent.setup();
    const onConfirmado = vi.fn();
    mockCancelarTurno.mockResolvedValue({} as never);

    renderAcciones(
      <TurnoAcciones
        rol="RECEPCIONISTA"
        estado="PROGRAMADO"
        fecha={todayYmd()}
        turnoId="t1"
        llamado={false}
        onConfirmado={onConfirmado}
      />,
    );

    await user.click(screen.getByRole('button', { name: /cancelar turno/i }));
    expect(mockCancelarTurno).not.toHaveBeenCalled();
    await user.type(
      screen.getByLabelText(/motivo \(opcional\)/i),
      'Paciente reprogramó',
    );
    await user.click(screen.getByRole('button', { name: /^aceptar$/i }));
    expect(mockCancelarTurno).toHaveBeenCalledWith('t1', 'Paciente reprogramó');
    expect(onConfirmado).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText(/turno cancelado correctamente/i),
    ).toBeInTheDocument();
  });

  it('Cancelar del dialog no llama API', async () => {
    const user = userEvent.setup();
    mockCancelarTurno.mockResolvedValue({} as never);

    renderAcciones(
      <TurnoAcciones
        rol="RECEPCIONISTA"
        estado="PROGRAMADO"
        fecha={todayYmd()}
        turnoId="t1"
        llamado={false}
        onConfirmado={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /cancelar turno/i }));
    await user.click(screen.getByRole('button', { name: /^cancelar$/i }));
    expect(mockCancelarTurno).not.toHaveBeenCalled();
  });

  it('Llamar notifica al padre y no abre el detalle', async () => {
    const user = userEvent.setup();
    const onConfirmado = vi.fn();
    mockLlamarTurno.mockResolvedValue({} as never);

    renderAcciones(
      <TurnoAcciones
        rol="MEDICO"
        estado="CONFIRMADO"
        fecha={todayYmd()}
        turnoId="t1"
        llamado={false}
        onConfirmado={onConfirmado}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: /llamar al paciente/i }),
    );
    expect(mockLlamarTurno).toHaveBeenCalledWith('t1');
    expect(onConfirmado).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText(/paciente llamado correctamente/i),
    ).toBeInTheDocument();
  });

  it('recepcionista no ve llamar ni finalizar', () => {
    renderAcciones(
      <TurnoAcciones
        rol="RECEPCIONISTA"
        estado="CONFIRMADO"
        fecha={todayYmd()}
        turnoId="t1"
        llamado={true}
        onConfirmado={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /llamar al paciente/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /finalizar turno/i }),
    ).not.toBeInTheDocument();
  });
});
