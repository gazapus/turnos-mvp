/**
 * Fondo fijo del shell autenticado (`background1.webp`).
 *
 * @returns Capa de fondo + overlay ligero para legibilidad.
 */
export function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/general/background1.webp')",
        }}
      />
      <div className="absolute inset-0 bg-shell-bg-overlay" />
    </div>
  );
}
