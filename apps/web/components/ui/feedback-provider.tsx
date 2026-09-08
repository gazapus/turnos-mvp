'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

const TOAST_VISIBLE_MS = 5000;
const TOAST_FADE_MS = 1000;

type ToastState = {
  message: string;
  fading: boolean;
};

type ErrorState = {
  friendly: string;
  detail: string;
};

type FeedbackContextValue = {
  toastSuccess: (message: string) => void;
  showError: (friendly: string, detail: string) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

/**
 * Accede al toast de éxito y al dialog de error genéricos.
 *
 * @returns API de feedback.
 */
export function useFeedback(): FeedbackContextValue {
  const value = useContext(FeedbackContext);
  if (!value) {
    throw new Error('useFeedback debe usarse dentro de FeedbackProvider');
  }
  return value;
}

type FeedbackProviderProps = {
  children: ReactNode;
};

/**
 * Provider de toast de éxito y dialog de error para el shell autenticado.
 *
 * @param props - Children del layout.
 * @returns Provider con overlays de feedback.
 */
export function FeedbackProvider({ children }: FeedbackProviderProps) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [mounted, setMounted] = useState(false);
  const toastTimers = useRef<number[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearToastTimers = useCallback(() => {
    toastTimers.current.forEach((id) => window.clearTimeout(id));
    toastTimers.current = [];
  }, []);

  const toastSuccess = useCallback(
    (message: string) => {
      clearToastTimers();
      setToast({ message, fading: false });
      const fadeId = window.setTimeout(() => {
        setToast((current) => (current ? { ...current, fading: true } : null));
      }, TOAST_VISIBLE_MS);
      const hideId = window.setTimeout(() => {
        setToast(null);
      }, TOAST_VISIBLE_MS + TOAST_FADE_MS);
      toastTimers.current = [fadeId, hideId];
    },
    [clearToastTimers],
  );

  const showError = useCallback((friendly: string, detail: string) => {
    setError({ friendly, detail });
  }, []);

  const value = useMemo(
    () => ({ toastSuccess, showError }),
    [showError, toastSuccess],
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {mounted && toast
        ? createPortal(
            <div
              role="status"
              className={`pointer-events-none fixed top-20 left-1/2 z-[100] max-w-sm -translate-x-1/2 rounded-md border border-success/30 bg-success px-4 py-3 text-center text-sm font-medium text-success-foreground shadow-elevated transition-opacity duration-1000 ${
                toast.fading ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {toast.message}
            </div>,
            document.body,
          )
        : null}
      {mounted && error
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-brand/40 p-4"
              role="presentation"
            >
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="error-dialog-title"
                aria-describedby="error-dialog-detail"
                className="w-full max-w-md rounded-lg border border-border bg-background p-6 text-foreground"
              >
                <h2
                  id="error-dialog-title"
                  className="font-heading text-lg font-semibold text-on-elevated"
                >
                  {error.friendly}
                </h2>
                <p
                  id="error-dialog-detail"
                  className="mt-3 text-sm text-muted-foreground"
                >
                  {error.detail}
                </p>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
                    onClick={() => setError(null)}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </FeedbackContext.Provider>
  );
}
