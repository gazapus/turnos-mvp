import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Combobox, type ComboboxOption } from './combobox';

/**
 * Combobox remoto controlado para tests de selección.
 *
 * @param props - Fetch y debounce.
 * @returns Combobox con estado local de valor.
 */
function ControlledRemoteCombobox({
  fetchOptions,
  debounceMs = 0,
}: {
  fetchOptions: (query: string) => Promise<ComboboxOption[]>;
  debounceMs?: number;
}) {
  const [value, setValue] = useState('');
  return (
    <Combobox
      id="filtro-demo"
      value={value}
      onChange={setValue}
      fetchOptions={fetchOptions}
      minQueryLength={3}
      debounceMs={debounceMs}
      placeholder="Todos"
    />
  );
}

describe('Combobox', () => {
  afterEach(() => {
    cleanup();
  });

  it('muestra el placeholder Todos', () => {
    render(
      <Combobox
        id="filtro-demo"
        value=""
        onChange={vi.fn()}
        options={[]}
        placeholder="Todos"
      />,
    );

    expect(screen.getByRole('combobox')).toHaveAttribute(
      'placeholder',
      'Todos',
    );
  });

  it('filtra opciones locales y selecciona la resaltada con Enter', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Combobox
        id="filtro-demo"
        value=""
        onChange={onChange}
        options={[
          { id: 'e1', label: 'Cardiología' },
          { id: 'e2', label: 'Clínica Médica' },
        ]}
      />,
    );

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.type(input, 'car');
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith('e1');
  });

  it('filtra opciones locales sin distinguir tildes', async () => {
    const user = userEvent.setup();

    render(
      <Combobox
        id="filtro-demo"
        value=""
        onChange={vi.fn()}
        options={[
          { id: 'm1', label: 'Pérez, Juan' },
          { id: 'm2', label: 'Gómez, Laura' },
        ]}
      />,
    );

    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByRole('combobox'), 'perez');

    expect(
      screen.getByRole('option', { name: /pérez,\s*juan/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /gómez,\s*laura/i }),
    ).not.toBeInTheDocument();
  });

  it('selecciona la opción resaltada con Tab', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Combobox
        id="filtro-demo"
        value=""
        onChange={onChange}
        options={[{ id: 'e1', label: 'Cardiología' }]}
      />,
    );

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{Tab}');

    expect(onChange).toHaveBeenCalledWith('e1');
  });

  it('no consulta opciones remotas con menos de 3 caracteres', async () => {
    const fetchOptions = vi.fn().mockResolvedValue([]);
    const user = userEvent.setup();

    render(
      <Combobox
        id="filtro-demo"
        value=""
        onChange={vi.fn()}
        fetchOptions={fetchOptions}
        minQueryLength={3}
        debounceMs={0}
      />,
    );

    await user.type(screen.getByRole('combobox'), 'ab');

    await waitFor(() => {
      expect(fetchOptions).not.toHaveBeenCalled();
    });
  });

  it('mantiene el label de la opción remota seleccionada al cerrar', async () => {
    const fetchOptions = vi
      .fn()
      .mockResolvedValue([{ id: 'p1', label: 'González, María' }]);
    const user = userEvent.setup();

    render(<ControlledRemoteCombobox fetchOptions={fetchOptions} />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.type(input, 'gon');
    await user.click(
      await screen.findByRole('option', { name: /gonzález,\s*maría/i }),
    );

    expect(input).toHaveValue('González, María');
  });

  it('muestra Buscando mientras consulta y Sin coincidencias al terminar vacío', async () => {
    let resolveFetch: (options: ComboboxOption[]) => void = () => undefined;
    const fetchOptions = vi.fn(
      () =>
        new Promise<ComboboxOption[]>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const user = userEvent.setup();

    render(<ControlledRemoteCombobox fetchOptions={fetchOptions} />);

    await user.type(screen.getByRole('combobox'), 'mar');

    expect(await screen.findByText(/buscando/i)).toBeInTheDocument();

    resolveFetch([]);

    expect(await screen.findByText(/sin coincidencias/i)).toBeInTheDocument();
    expect(screen.queryByText(/buscando/i)).not.toBeInTheDocument();
  });
});
