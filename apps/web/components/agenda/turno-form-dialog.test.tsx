import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthUser, TurnoDetalleDto } from '@turnos/shared-types';
import { useState, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FeedbackProvider } from '@/components/ui';
import { todayYmd } from '@/lib/agenda/fecha-dia';
import {
  fetchEspecialidades,
  fetchMedicos,
  fetchPacienteByDocumento,
  fetchPrimeraVez,
  fetchTurnoById,
} from '@/lib/api/turnos-client';
import { TurnoFormDialog, type TurnoFormMode } from './turno-form-dialog';

vi.mock('@/lib/api/turnos-client', () => ({
  fetchMedicos: vi.fn(),
  fetchEspecialidades: vi.fn(),
  fetchPacienteByDocumento: vi.fn(),
  fetchTurnoById: vi.fn(),
  fetchPrimeraVez: vi.fn(),
  createTurno: vi.fn(),
  updateTurno: vi.fn(),
}));

const mockFetchMedicos = vi.mocked(fetchMedicos);
const mockFetchEspecialidades = vi.mocked(fetchEspecialidades);
const mockFetchPacienteByDocumento = vi.mocked(fetchPacienteByDocumento);
const mockFetchTurnoById = vi.mocked(fetchTurnoById);
const mockFetchPrimeraVez = vi.mocked(fetchPrimeraVez);

const recepcionista: AuthUser = {
  id: 'r1',
  mail: 'r@test.com',
  nombre: 'Ana',
  apellido: 'Recepción',
  rol: 'RECEPCIONISTA',
};

const medico: AuthUser = {
  id: 'm1',
  mail: 'm@test.com',
  nombre: 'Carlos',
  apellido: 'Médico',
  rol: 'MEDICO',
};

const detalle: TurnoDetalleDto = {
  id: 't1',
  paciente: {
    id: 'p1',
    documento: '12345678',
    nombre: 'María',
    apellido: 'González',
    telefono: '111',
    mail: 'maria@test.com',
  },
  medicoId: 'm1',
  medico: { nombre: 'Carlos', apellido: 'Médico' },
  especialidadId: 'e1',
  especialidad: { nombre: 'Cardiología' },
  fecha: todayYmd(),
  horaInicio: '09:00',
  horaFin: '09:30',
  tipo: 'CONTROL',
  estado: 'PROGRAMADO',
  notificarMail: false,
};

/**
 * Envuelve el dialog con query + feedback.
 *
 * @param ui - Dialog a renderizar.
 * @returns Resultado de render.
 */
function renderDialog(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <FeedbackProvider>{ui}</FeedbackProvider>
    </QueryClientProvider>,
  );
}

describe('TurnoFormDialog', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    mockFetchMedicos.mockResolvedValue([
      {
        id: 'm1',
        nombre: 'Carlos',
        apellido: 'Médico',
        especialidadIds: ['e1'],
      },
      {
        id: 'm2',
        nombre: 'Laura',
        apellido: 'Pérez',
        especialidadIds: ['e2'],
      },
    ]);
    mockFetchEspecialidades.mockResolvedValue([
      { id: 'e1', nombre: 'Cardiología', medicoIds: ['m1'] },
      { id: 'e2', nombre: 'Clínica', medicoIds: ['m2'] },
    ]);
    mockFetchPacienteByDocumento.mockResolvedValue(null);
    mockFetchPrimeraVez.mockResolvedValue({ primeraVez: true });
    mockFetchTurnoById.mockResolvedValue(detalle);
  });

  it('muestra título de alta y Guardar deshabilitado', async () => {
    renderDialog(
      <TurnoFormDialog
        open
        mode={{ kind: 'create' }}
        user={recepcionista}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole('heading', { name: /nuevo turno/i }),
    ).toBeInTheDocument();
    const guardar = screen.getByRole('button', { name: /guardar/i });
    expect(guardar).toBeDisabled();
    expect(guardar.parentElement).toHaveAttribute(
      'title',
      'Completá los campos obligatorios para guardar',
    );
  });

  it('precarga hora de fin 30 minutos después del inicio', async () => {
    renderDialog(
      <TurnoFormDialog
        open
        mode={{ kind: 'create', fecha: todayYmd(), horaInicio: '09:45' }}
        user={recepcionista}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(document.getElementById('turno-hora-inicio')).toHaveValue('09:45');
    await waitFor(() => {
      expect(document.getElementById('turno-hora-fin')).toHaveValue('10:15');
    });
  });

  it('muestra error de validación si el nombre es corto', async () => {
    const user = userEvent.setup();
    renderDialog(
      <TurnoFormDialog
        open
        mode={{ kind: 'create' }}
        user={recepcionista}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    await user.type(await screen.findByLabelText(/^nombre$/i), 'Al');
    expect(await screen.findByText(/mínimo 3 caracteres/i)).toBeInTheDocument();
  });

  it('bloquea datos del paciente si el lookup encuentra coincidencia', async () => {
    const user = userEvent.setup();
    mockFetchPacienteByDocumento.mockResolvedValue({
      id: 'p1',
      documento: '12345678',
      nombre: 'María',
      apellido: 'González',
      telefono: '111',
      mail: 'maria@test.com',
    });

    renderDialog(
      <TurnoFormDialog
        open
        mode={{ kind: 'create' }}
        user={recepcionista}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    const documento = await screen.findByLabelText(/documento/i);
    await user.type(documento, '12345678');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByLabelText(/^nombre$/i)).toHaveValue('María');
    });
    expect(screen.getByLabelText(/^nombre$/i)).toHaveAttribute('readOnly');
    expect(screen.getByLabelText(/^apellido$/i)).toHaveAttribute('readOnly');
  });

  it('deja editable el paciente si el lookup no encuentra', async () => {
    const user = userEvent.setup();
    mockFetchPacienteByDocumento.mockResolvedValue(null);

    renderDialog(
      <TurnoFormDialog
        open
        mode={{ kind: 'create' }}
        user={recepcionista}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    const documento = await screen.findByLabelText(/documento/i);
    await user.type(documento, '99999999');
    await user.tab();

    await waitFor(() => {
      expect(mockFetchPacienteByDocumento).toHaveBeenCalled();
    });
    expect(screen.getByLabelText(/^nombre$/i)).not.toHaveAttribute('readOnly');
  });

  it('en detalle el médico solo ve Llamar paciente y Salir', async () => {
    renderDialog(
      <TurnoFormDialog
        open
        mode={{ kind: 'detail', turnoId: 't1' }}
        user={medico}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole('heading', { name: /detalle de turno/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /llamar paciente/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salir/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /guardar/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /confirmar turno/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /anular turno/i }),
    ).not.toBeInTheDocument();
  });

  it('usa switch de notificar como checkbox sin subtexto', async () => {
    renderDialog(
      <TurnoFormDialog
        open
        mode={{ kind: 'create' }}
        user={recepcionista}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    const toggle = await screen.findByRole('checkbox', {
      name: /notificar al paciente/i,
    });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toBeDisabled();
    expect(
      screen.queryByText(/se enviará un recordatorio por email/i),
    ).not.toBeInTheDocument();
  });

  it('abre el time picker al clickear el botón de reloj', async () => {
    const user = userEvent.setup();
    const showPicker = vi.fn();
    HTMLInputElement.prototype.showPicker = showPicker;

    renderDialog(
      <TurnoFormDialog
        open
        mode={{ kind: 'create', fecha: todayYmd(), horaInicio: '09:00' }}
        user={recepcionista}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    await screen.findByRole('heading', { name: /nuevo turno/i });
    await user.click(
      screen.getByRole('button', { name: /seleccionar hora de inicio/i }),
    );
    expect(showPicker).toHaveBeenCalled();
  });

  it('aborta la carga de detalle al cerrar con X', async () => {
    const user = userEvent.setup();
    mockFetchTurnoById.mockImplementation(
      (_id, signal) =>
        new Promise((_, reject) => {
          signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    );

    /**
     * Controla `open` para que Cerrar desmonte el dialog.
     *
     * @returns Dialog de detalle.
     */
    function Harness() {
      const [open, setOpen] = useState(true);
      const mode: TurnoFormMode = { kind: 'detail', turnoId: 't1' };
      return (
        <TurnoFormDialog
          open={open}
          mode={open ? mode : null}
          user={recepcionista}
          onClose={() => setOpen(false)}
          onSaved={vi.fn()}
        />
      );
    }

    renderDialog(<Harness />);

    expect(await screen.findByTestId('turno-form-overlay')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /cerrar/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
