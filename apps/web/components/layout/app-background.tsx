/**
 * Fondo fijo del shell autenticado (`logo_background.webp`).
 *
 * @returns Capa de fondo + overlay ligero para legibilidad.
 */
export function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/general/logo_background.webp')",
        }}
      />
      <div className="absolute inset-0 bg-shell-bg-overlay" />
    </div>
  );
}
