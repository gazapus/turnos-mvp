import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ConsultorioDto } from '@turnos/shared-types';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FeedbackProvider } from '@/components/ui';
import { ApiError } from '@/lib/api/auth-client';
import {
  assignConsultorio,
  fetchConsultorios,
} from '@/lib/api/consultorios-client';
import { fetchMedicos } from '@/lib/api/turnos-client';
import { SIN_ASIGNAR_LABEL } from '@/lib/consultorios';
import { ConsultoriosContent } from './consultorios-content';
import {
  CONSULTORIOS_LOAD_ERROR,
  FRIENDLY_ASSIGN_ERROR,
} from './consultorios-grid';

vi.mock('@/lib/api/consultorios-client', () => ({
  fetchConsultorios: vi.fn(),
  assignConsultorio: vi.fn(),
}));

vi.mock('@/lib/api/turnos-client', () => ({
  fetchMedicos: vi.fn(),
}));

const mockFetchConsultorios = vi.mocked(fetchConsultorios);
const mockAssignConsultorio = vi.mocked(assignConsultorio);
const mockFetchMedicos = vi.mocked(fetchMedicos);

const perez = { id: 'm-perez', nombre: 'Juan', apellido: 'Pérez' };
const ruiz = { id: 'm-ruiz', nombre: 'Diego', apellido: 'Ruiz' };

/**
 * Catálogo de N consultorios con asignaciones opcionales por número.
 *
 * @param count - Cantidad.
 * @param assignments - Médico por número.
 * @returns DTOs.
 */
function makeCatalog(
  count: number,
  assignments: Record<number, ConsultorioDto['medico']> = {},
): ConsultorioDto[] {
  return Array.from({ length: count }, (_, index) => {
    const numero = index + 1;
    return {
      id: `c${numero}`,
      numero,
      medico: assignments[numero] ?? null,
    };
  });
}

/**
 * Render del leaf con feedback.
 */
function renderConsultorios() {
  return render(
    <FeedbackProvider>
      <ConsultoriosContent />
    </FeedbackProvider>,
  );
}

describe('ConsultoriosContent', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renderiza el listado de consultorios', async () => {
    mockFetchConsultorios.mockResolvedValue(makeCatalog(3, { 1: perez }));
    mockFetchMedicos.mockResolvedValue([
      { ...perez, especialidadIds: [] },
      { ...ruiz, especialidadIds: [] },
    ]);

    renderConsultorios();

    await waitFor(() => {
      expect(screen.getAllByTestId('consultorio-row')).toHaveLength(3);
    });
    expect(screen.getByDisplayValue('Pérez, Juan')).toBeInTheDocument();
    const panel = screen.getByTestId('consultorios-panel');
    expect(panel.className).toContain('overflow-visible');
    expect(panel.className).not.toContain('overflow-auto');
  });

  it('asigna de inmediato un médico libre a un hueco', async () => {
    mockFetchConsultorios.mockResolvedValue(makeCatalog(2));
    mockFetchMedicos.mockResolvedValue([{ ...ruiz, especialidadIds: [] }]);
    mockAssignConsultorio.mockResolvedValue(makeCatalog(2, { 1: ruiz }));

    const user = userEvent.setup();
    renderConsultorios();
    await screen.findAllByTestId('consultorio-row');

    const firstCombo = screen.getAllByRole('combobox')[0];
    if (!firstCombo) {
      throw new Error('expected combobox');
    }
    await user.click(firstCombo);
    await user.click(screen.getByRole('option', { name: 'Ruiz, Diego' }));

    await waitFor(() => {
      expect(mockAssignConsultorio).toHaveBeenCalledWith('c1', ruiz.id);
    });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('pide confirmación al mover y no persiste si cancela', async () => {
    mockFetchConsultorios.mockResolvedValue(makeCatalog(3, { 1: perez }));
    mockFetchMedicos.mockResolvedValue([{ ...perez, especialidadIds: [] }]);

    const user = userEvent.setup();
    renderConsultorios();
    await screen.findAllByTestId('consultorio-row');

    const secondCombo = screen.getAllByRole('combobox')[1];
    if (!secondCombo) {
      throw new Error('expected combobox');
    }
    await user.click(secondCombo);
    await user.click(screen.getByRole('option', { name: 'Pérez, Juan' }));

    expect(await screen.findByText(/ya está en el 1/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(mockAssignConsultorio).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('Pérez, Juan')).toBeInTheDocument();
  });

  it('confirma desasignar y persiste al aceptar', async () => {
    mockFetchConsultorios.mockResolvedValue(makeCatalog(1, { 1: perez }));
    mockFetchMedicos.mockResolvedValue([{ ...perez, especialidadIds: [] }]);
    mockAssignConsultorio.mockResolvedValue(makeCatalog(1));

    const user = userEvent.setup();
    renderConsultorios();
    await screen.findAllByTestId('consultorio-row');

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: SIN_ASIGNAR_LABEL }));

    expect(
      await screen.findByText(/desasignar a pérez, juan del consultorio 1/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    await waitFor(() => {
      expect(mockAssignConsultorio).toHaveBeenCalledWith('c1', null);
    });
  });

  it('en error muestra el dialog y no pisa el valor', async () => {
    mockFetchConsultorios.mockResolvedValue(makeCatalog(2));
    mockFetchMedicos.mockResolvedValue([{ ...ruiz, especialidadIds: [] }]);
    mockAssignConsultorio.mockRejectedValue(
      new ApiError({
        statusCode: 400,
        message: 'El médico no existe, no está activo o no tiene rol médico',
        error: 'Bad Request',
        path: '/api/consultorios/c1',
        timestamp: new Date().toISOString(),
      }),
    );

    const user = userEvent.setup();
    renderConsultorios();
    await screen.findAllByTestId('consultorio-row');

    const firstCombo = screen.getAllByRole('combobox')[0];
    if (!firstCombo) {
      throw new Error('expected combobox');
    }
    await user.click(firstCombo);
    await user.click(screen.getByRole('option', { name: 'Ruiz, Diego' }));

    expect(await screen.findByText(FRIENDLY_ASSIGN_ERROR)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByRole('combobox')[0]).toHaveValue('');
    });
  });

  it('con 10 consultorios en desktop muestra columnas 8 y 2', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
    });
    mockFetchConsultorios.mockResolvedValue(makeCatalog(10));
    mockFetchMedicos.mockResolvedValue([]);

    renderConsultorios();
    const columns = await screen.findAllByTestId('consultorios-column');
    expect(columns).toHaveLength(2);
    expect(within(columns[0]!).getAllByTestId('consultorio-row')).toHaveLength(
      8,
    );
    expect(within(columns[1]!).getAllByTestId('consultorio-row')).toHaveLength(
      2,
    );
  });

  it('muestra error sin grilla si el listado falla', async () => {
    mockFetchConsultorios.mockRejectedValue(new Error('403'));
    mockFetchMedicos.mockResolvedValue([]);

    renderConsultorios();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      CONSULTORIOS_LOAD_ERROR,
    );
    expect(screen.queryByTestId('consultorio-row')).not.toBeInTheDocument();
  });
});
