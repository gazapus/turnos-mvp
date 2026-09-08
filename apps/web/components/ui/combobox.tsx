'use client';

import { ChevronDown } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

import { foldDiacritics } from '@/lib/text/fold-diacritics';

/**
 * Opción de un combobox de filtro.
 */
export type ComboboxOption = {
  id: string;
  label: string;
};

type ComboboxProps = {
  id: string;
  value: string;
  onChange: (id: string) => void;
  options?: ComboboxOption[];
  fetchOptions?: (query: string) => Promise<ComboboxOption[]>;
  selectedLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  minQueryLength?: number;
  debounceMs?: number;
};

const INPUT_CLASS =
  'w-full rounded-md border bg-input py-2 pl-3 pr-9 text-sm text-input-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-input disabled:text-input-foreground disabled:opacity-100';

const INPUT_VALID_CLASS = 'border-border';
const INPUT_INVALID_CLASS = 'border-danger';

const STATUS_SEARCHING = 'Buscando…';
const STATUS_NO_MATCHES = 'Sin coincidencias';

/**
 * Combobox tipeable: filtra opciones locales o remotas y selecciona con teclado o click.
 *
 * @param props - Valor controlado, fuente de opciones y textos.
 * @returns Input + listbox.
 */
export function Combobox({
  id,
  value,
  onChange,
  options = [],
  fetchOptions,
  selectedLabel,
  placeholder = 'Todos',
  disabled = false,
  invalid = false,
  minQueryLength = 0,
  debounceMs = 0,
}: ComboboxProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const previousValueRef = useRef(value);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [remoteOptions, setRemoteOptions] = useState<ComboboxOption[]>([]);
  const [pickedLabel, setPickedLabel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const isRemote = Boolean(fetchOptions);

  const resolvedLabel = useMemo(() => {
    if (selectedLabel) {
      return selectedLabel;
    }
    const fromOptions = options.find((option) => option.id === value)?.label;
    if (fromOptions) {
      return fromOptions;
    }
    return pickedLabel;
  }, [options, pickedLabel, selectedLabel, value]);

  useEffect(() => {
    const previousValue = previousValueRef.current;
    previousValueRef.current = value;
    if (previousValue && !value) {
      setPickedLabel('');
    }
  }, [value]);

  useEffect(() => {
    if (!open) {
      setInputValue(resolvedLabel);
    }
  }, [open, resolvedLabel]);

  const isQuerying = open && inputValue !== resolvedLabel;
  const query = inputValue.trim();

  const visibleOptions = useMemo(() => {
    if (isRemote) {
      return remoteOptions;
    }
    const normalized = foldDiacritics(query);
    if (!normalized || !isQuerying) {
      return options;
    }
    return options.filter((option) =>
      foldDiacritics(option.label).includes(normalized),
    );
  }, [isQuerying, isRemote, options, query, remoteOptions]);

  useEffect(() => {
    if (!fetchOptions || !open) {
      return;
    }
    if (!isQuerying || query.length < minQueryLength) {
      setRemoteOptions([]);
      setIsLoading(false);
      setHasFetched(false);
      return;
    }

    setIsLoading(true);
    setHasFetched(false);
    let cancelled = false;
    const handle = window.setTimeout(() => {
      void fetchOptions(query)
        .then((next) => {
          if (!cancelled) {
            setRemoteOptions(next);
            setHighlight(0);
            setHasFetched(true);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoading(false);
          }
        });
    }, debounceMs);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [debounceMs, fetchOptions, isQuerying, minQueryLength, open, query]);

  useEffect(() => {
    /**
     * Cierra el listado al hacer click fuera del combobox.
     *
     * @param event - Evento de puntero en el documento.
     */
    function handlePointerDown(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const selectOption = useCallback(
    (option: ComboboxOption) => {
      setPickedLabel(option.label);
      onChange(option.id);
      setInputValue(option.label);
      setOpen(false);
    },
    [onChange],
  );

  const highlighted = visibleOptions[highlight];

  /**
   * Texto de estado del listado vacío (pista, carga o sin resultados).
   *
   * @returns Mensaje a mostrar en el listbox.
   */
  function emptyStatusMessage(): string {
    if (isRemote && (!isQuerying || query.length < minQueryLength)) {
      return `Escribí al menos ${minQueryLength} caracteres`;
    }
    if (isLoading) {
      return STATUS_SEARCHING;
    }
    if (isRemote && !hasFetched) {
      return STATUS_SEARCHING;
    }
    return STATUS_NO_MATCHES;
  }

  /**
   * Maneja navegación y selección por teclado.
   *
   * @param event - Tecla sobre el input.
   */
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (disabled) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setHighlight((current) =>
        visibleOptions.length === 0
          ? 0
          : Math.min(current + 1, visibleOptions.length - 1),
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setHighlight((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === 'Enter' && open && highlighted) {
      event.preventDefault();
      selectOption(highlighted);
      return;
    }

    if (event.key === 'Tab' && open && highlighted) {
      selectOption(highlighted);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        role="combobox"
        type="text"
        autoComplete="off"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-busy={isLoading}
        aria-activedescendant={
          open && highlighted ? `${listboxId}-opt-${highlighted.id}` : undefined
        }
        aria-autocomplete="list"
        disabled={disabled}
        placeholder={placeholder}
        className={`${INPUT_CLASS} ${invalid ? INPUT_INVALID_CLASS : INPUT_VALID_CLASS} ${disabled ? '' : 'cursor-text'}`}
        value={inputValue}
        onChange={(event) => {
          const next = event.target.value;
          setPickedLabel('');
          setInputValue(next);
          setOpen(true);
          setHighlight(0);
          if (next === '' || value) {
            onChange('');
          }
        }}
        onFocus={() => {
          if (!disabled) {
            setOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
      />
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      {open && !disabled && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-background py-1 shadow-elevated"
        >
          {visibleOptions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {emptyStatusMessage()}
            </li>
          ) : (
            visibleOptions.map((option, index) => (
              <li
                key={option.id}
                id={`${listboxId}-opt-${option.id}`}
                role="option"
                aria-selected={index === highlight}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  index === highlight
                    ? 'bg-muted text-foreground'
                    : 'text-input-foreground'
                }`}
                onMouseEnter={() => setHighlight(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectOption(option);
                }}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
